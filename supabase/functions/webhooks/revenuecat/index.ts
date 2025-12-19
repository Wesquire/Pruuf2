/**
 * POST /webhooks/revenuecat
 * Handle RevenueCat webhook events
 *
 * Event Types (Complete Coverage):
 * - INITIAL_PURCHASE: User subscribed for first time
 * - RENEWAL: Subscription renewed successfully
 * - CANCELLATION: User canceled subscription
 * - UNCANCELLATION: User reactivated subscription
 * - EXPIRATION: Subscription expired (after cancellation)
 * - BILLING_ISSUE: Payment failed
 * - SUBSCRIBER_ALIAS: Subscriber IDs merged
 * - SUBSCRIPTION_PAUSED: Subscription paused (Android only)
 * - SUBSCRIPTION_EXTENDED: Subscription extended by developer
 * - TRANSFER: Subscription transferred between users
 * - PRODUCT_CHANGE: User switched subscription tier
 * - TEST: Test webhook event
 * - NON_RENEWING_PURCHASE: One-time purchase (logged but no action)
 *
 * Docs: https://docs.revenuecat.com/docs/webhooks
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import {
  parseRevenueCatWebhook,
  extractUserIdFromWebhook,
  extractEventType,
} from '../../_shared/revenuecatWebhookVerifier.ts';
import {
  syncUserAccountStatus,
  handleSubscriptionCancellation,
  handleSubscriptionRefund,
} from '../../_shared/revenuecat.ts';
import { logError, logAuditEvent } from '../../_shared/auditLogger.ts';
import {
  sendNotification,
  NotificationPriority,
} from '../../_shared/dualNotifications.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  let eventId: string | undefined;
  let eventType: string | null = null;
  let supabase: any;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and verify webhook signature
    const event = await parseRevenueCatWebhook(req);

    if (!event) {
      await logError('RevenueCat webhook verification failed', {
        headers: Object.fromEntries(req.headers.entries()),
      });

      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract event details (capture in outer scope for error handling)
    eventType = extractEventType(event);
    const userId = extractUserIdFromWebhook(event);
    eventId = event.id || event.event?.id;

    // Validate event has required fields
    if (!eventType) {
      await logError('Invalid RevenueCat webhook payload - missing event type', {
        eventType,
        userId,
        event,
      });

      return new Response(JSON.stringify({ error: 'Invalid payload - missing event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!eventId) {
      await logError('Invalid RevenueCat webhook payload - missing event ID', {
        eventType,
        userId,
        eventId,
        event,
      });

      return new Response(JSON.stringify({ error: 'Invalid payload - missing event ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TEST events don't require user_id
    if (eventType !== 'TEST' && !userId) {
      await logError('Invalid RevenueCat webhook payload - missing user ID', {
        eventType,
        userId,
        event,
      });

      return new Response(JSON.stringify({ error: 'Invalid payload - missing user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client (captured in outer scope for error handling)
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // EVENT DEDUPLICATION
    // Check if this event has already been processed within the last 24 hours
    // RevenueCat may send duplicate events, so we use is_duplicate_webhook_event()
    // function to prevent reprocessing
    // ========================================================================
    const { data: isDuplicate, error: dedupError } = await supabase
      .rpc('is_duplicate_webhook_event', {
        p_event_id: eventId,
        p_event_type: eventType,
        window_hours: 24
      });

    if (dedupError) {
      console.warn('Deduplication check failed (continuing with processing):', dedupError);
    } else if (isDuplicate) {
      // Event already processed - return 200 OK for idempotency but don't reprocess
      console.log(`✓ Duplicate event ignored (idempotent): ${eventType} ${eventId}`);

      return new Response(JSON.stringify({
        received: true,
        duplicate: true,
        event_id: eventId,
        event_type: eventType
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ========================================================================
    // EVENT LOGGING
    // Log this event to webhook_events_log table BEFORE processing
    // This creates an audit trail and enables deduplication
    // Initially set success=false, will update to true after processing
    // ========================================================================
    const { error: logInsertError } = await supabase
      .from('webhook_events_log')
      .insert({
        event_id: eventId,
        event_type: eventType,
        user_id: userId || null, // NULL for TEST events
        payload: event,
        success: false, // Will update to true on completion
        error_message: null,
      });

    if (logInsertError) {
      console.error('Failed to log webhook event (continuing with processing):', logInsertError);
      // Continue processing even if logging fails (logging is for audit, not critical path)
    }

    // Log webhook received to audit_logs (separate from webhook_events_log)
    await logAuditEvent({
      event_type: 'revenuecat_webhook_received',
      user_id: userId || null,
      metadata: {
        event_type: eventType,
        event_id: eventId,
        product_id: event?.event?.product_id,
        store: event?.event?.store,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Handle different event types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(userId, event, supabase);
        break;

      case 'RENEWAL':
        await handleRenewal(userId, event, supabase);
        break;

      case 'CANCELLATION':
        await handleCancellation(userId, event, supabase);
        break;

      case 'UNCANCELLATION':
        await handleUncancellation(userId, event, supabase);
        break;

      case 'EXPIRATION':
        await handleExpiration(userId, event, supabase);
        break;

      case 'BILLING_ISSUE':
        await handleBillingIssue(userId, event, supabase);
        break;

      case 'SUBSCRIBER_ALIAS':
        await handleSubscriberAlias(userId, event, supabase);
        break;

      case 'SUBSCRIPTION_PAUSED':
        await handleSubscriptionPaused(userId, event, supabase);
        break;

      case 'SUBSCRIPTION_EXTENDED':
        await handleSubscriptionExtended(userId, event, supabase);
        break;

      case 'TRANSFER':
        await handleTransfer(userId, event, supabase);
        break;

      case 'PRODUCT_CHANGE':
        await handleProductChange(userId, event, supabase);
        break;

      case 'TEST':
        await handleTest(event, supabase);
        break;

      case 'NON_RENEWING_PURCHASE':
        // Not used in Pruuf (subscription model only)
        console.log('⚠ NON_RENEWING_PURCHASE event received (not supported)');
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // ========================================================================
    // UPDATE EVENT LOG - Mark as successfully processed
    // ========================================================================
    await supabase
      .from('webhook_events_log')
      .update({ success: true })
      .eq('event_id', eventId);

    // Return 200 OK to acknowledge receipt
    return new Response(JSON.stringify({
      received: true,
      event_id: eventId,
      event_type: eventType
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await logError('RevenueCat webhook processing error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    // ========================================================================
    // UPDATE EVENT LOG - Mark as failed with error message
    // ========================================================================
    if (eventId && supabase) {
      try {
        await supabase
          .from('webhook_events_log')
          .update({
            success: false,
            error_message: (error as Error).message,
          })
          .eq('event_id', eventId);
      } catch (updateError) {
        console.error('Failed to update event log with error:', updateError);
      }
    }

    // Return 500 to trigger retry
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Handle INITIAL_PURCHASE event
 * User subscribed for the first time
 */
async function handleInitialPurchase(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing INITIAL_PURCHASE for user ${userId}`);

    // Sync account status (will set to 'active')
    await syncUserAccountStatus(userId, supabase);

    // Send welcome notification
    await sendNotification(
      userId,
      {
        title: 'Subscription Active',
        body: "You're all set! You'll continue receiving alerts for your loved ones.",
        type: 'subscription_activated',
      },
      NotificationPriority.NORMAL
    );

    await logAuditEvent({
      event_type: 'subscription_created',
      user_id: userId,
      metadata: {
        product_id: event.event.product_id,
        store: event.event.store,
        price: event.event.price,
      },
    });
  } catch (error) {
    await logError('Failed to handle INITIAL_PURCHASE', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle RENEWAL event
 * Subscription renewed successfully
 */
async function handleRenewal(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing RENEWAL for user ${userId}`);

    // Sync account status (ensure still 'active')
    await syncUserAccountStatus(userId, supabase);

    // Update last_payment_date
    await supabase
      .from('users')
      .update({
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    await logAuditEvent({
      event_type: 'subscription_renewed',
      user_id: userId,
      metadata: {
        product_id: event.event.product_id,
        expires_date: event.event.expiration_at_ms,
      },
    });
  } catch (error) {
    await logError('Failed to handle RENEWAL', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle CANCELLATION event
 * User canceled their subscription
 */
async function handleCancellation(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing CANCELLATION for user ${userId}`);

    // Handle cancellation (sets account_status to 'canceled')
    await handleSubscriptionCancellation(userId, supabase);

    // Send notification
    const expirationDate = event.event.expiration_at_ms
      ? new Date(event.event.expiration_at_ms).toLocaleDateString()
      : 'end of billing period';

    await sendNotification(
      userId,
      {
        title: 'Subscription Canceled',
        body: `You'll have access until ${expirationDate}. You can resubscribe anytime.`,
        type: 'subscription_canceled',
      },
      NotificationPriority.HIGH
    );

    await logAuditEvent({
      event_type: 'subscription_canceled',
      user_id: userId,
      metadata: {
        cancellation_reason: event.event.cancellation_reason,
        expires_at: event.event.expiration_at_ms,
      },
    });
  } catch (error) {
    await logError('Failed to handle CANCELLATION', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle UNCANCELLATION event
 * User reactivated their subscription
 */
async function handleUncancellation(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing UNCANCELLATION for user ${userId}`);

    // Sync account status (will set back to 'active')
    await syncUserAccountStatus(userId, supabase);

    // Send notification
    await sendNotification(
      userId,
      {
        title: 'Subscription Reactivated',
        body: 'Your subscription is active again. Alerts will continue as normal.',
        type: 'subscription_reactivated',
      },
      NotificationPriority.NORMAL
    );

    await logAuditEvent({
      event_type: 'subscription_reactivated',
      user_id: userId,
      metadata: {
        product_id: event.event.product_id,
      },
    });
  } catch (error) {
    await logError('Failed to handle UNCANCELLATION', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle EXPIRATION event
 * Subscription expired (after cancellation or non-renewal)
 */
async function handleExpiration(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing EXPIRATION for user ${userId}`);

    // Sync account status (will set to 'frozen')
    await syncUserAccountStatus(userId, supabase);

    // Send notification
    await sendNotification(
      userId,
      {
        title: 'Subscription Expired',
        body: 'Your subscription has ended. Resubscribe to continue receiving alerts.',
        type: 'subscription_expired',
      },
      NotificationPriority.CRITICAL
    );

    await logAuditEvent({
      event_type: 'subscription_expired',
      user_id: userId,
      metadata: {
        expiration_reason: event.event.expiration_reason,
        product_id: event.event.product_id,
      },
    });
  } catch (error) {
    await logError('Failed to handle EXPIRATION', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle BILLING_ISSUE event
 * Payment failed, entering grace period
 */
async function handleBillingIssue(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing BILLING_ISSUE for user ${userId}`);

    // Sync account status (will set to 'past_due' if in grace period)
    await syncUserAccountStatus(userId, supabase);

    // Send critical notification
    await sendNotification(
      userId,
      {
        title: 'Payment Failed',
        body: 'We couldn\'t process your payment. Please update your payment method to continue service.',
        type: 'payment_failed',
      },
      NotificationPriority.CRITICAL
    );

    await logAuditEvent({
      event_type: 'payment_failed',
      user_id: userId,
      metadata: {
        grace_period_expires_at: event.event.grace_period_expiration_at_ms,
        product_id: event.event.product_id,
      },
    });
  } catch (error) {
    await logError('Failed to handle BILLING_ISSUE', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle SUBSCRIBER_ALIAS event
 * RevenueCat merged two subscriber IDs
 */
async function handleSubscriberAlias(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing SUBSCRIBER_ALIAS for user ${userId}`);

    // The webhook gives us both old and new IDs
    const newAppUserId = event.event.new_app_user_id;
    const oldAppUserId = event.event.aliases?.[0]; // Original ID

    console.log(`Aliasing ${oldAppUserId} -> ${newAppUserId}`);

    // Sync the new user ID (which should be our Pruuf user ID)
    await syncUserAccountStatus(newAppUserId, supabase);

    await logAuditEvent({
      event_type: 'subscriber_aliased',
      user_id: newAppUserId,
      metadata: {
        old_app_user_id: oldAppUserId,
        new_app_user_id: newAppUserId,
      },
    });
  } catch (error) {
    await logError('Failed to handle SUBSCRIBER_ALIAS', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle SUBSCRIPTION_PAUSED event
 * Android only - subscription paused by user
 */
async function handleSubscriptionPaused(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing SUBSCRIPTION_PAUSED for user ${userId}`);

    const autoResumeDate = event.event.auto_resume_date_ms
      ? new Date(event.event.auto_resume_date_ms).toISOString()
      : null;

    // Update user account status to paused
    const { error } = await supabase
      .from('users')
      .update({
        account_status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to pause subscription: ${error.message}`);
    }

    await logAuditEvent({
      event_type: 'subscription_paused',
      user_id: userId,
      metadata: {
        auto_resume_date: autoResumeDate,
        product_id: event.event.product_id,
      },
    });

    // Send notification about paused subscription
    await sendNotification({
      userId,
      type: 'subscription_paused',
      title: 'Subscription Paused',
      body: `Your subscription has been paused${autoResumeDate ? ` and will resume on ${new Date(autoResumeDate).toLocaleDateString()}` : ''}.`,
      priority: NotificationPriority.NORMAL,
    });
  } catch (error) {
    await logError('Failed to handle SUBSCRIPTION_PAUSED', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle SUBSCRIPTION_EXTENDED event
 * Subscription extended by developer (e.g., compensation, goodwill)
 */
async function handleSubscriptionExtended(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing SUBSCRIPTION_EXTENDED for user ${userId}`);

    const newExpiresDate = event.event.expiration_at_ms
      ? new Date(event.event.expiration_at_ms).toISOString()
      : null;

    // Ensure account is active
    const { error } = await supabase
      .from('users')
      .update({
        account_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to extend subscription: ${error.message}`);
    }

    await logAuditEvent({
      event_type: 'subscription_extended',
      user_id: userId,
      metadata: {
        new_expires_date: newExpiresDate,
        reason: 'Developer extended subscription',
        product_id: event.event.product_id,
      },
    });

    // Send notification about extension
    await sendNotification({
      userId,
      type: 'subscription_extended',
      title: 'Subscription Extended',
      body: `Great news! Your subscription has been extended${newExpiresDate ? ` until ${new Date(newExpiresDate).toLocaleDateString()}` : ''}.`,
      priority: NotificationPriority.NORMAL,
    });
  } catch (error) {
    await logError('Failed to handle SUBSCRIPTION_EXTENDED', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle TRANSFER event
 * Subscription transferred from one user to another
 * This can happen when user changes device/account
 */
async function handleTransfer(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing TRANSFER for user ${userId}`);

    const fromUserId = event.event.transferred_from?.[0];
    const subscriptionId = event.event.id || 'unknown';

    if (!fromUserId) {
      throw new Error('Missing transferred_from in TRANSFER event');
    }

    // Remove subscription from old user
    const { error: oldUserError } = await supabase
      .from('users')
      .update({
        account_status: 'frozen',
        revenuecat_customer_id: null,
        revenuecat_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fromUserId);

    if (oldUserError) {
      await logError('Failed to remove subscription from old user', {
        fromUserId,
        error: oldUserError.message,
      });
    }

    // Add subscription to new user
    const { error: newUserError } = await supabase
      .from('users')
      .update({
        account_status: 'active',
        revenuecat_customer_id: userId,
        revenuecat_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (newUserError) {
      throw new Error(`Failed to transfer subscription to new user: ${newUserError.message}`);
    }

    await logAuditEvent({
      event_type: 'subscription_transferred',
      user_id: userId,
      metadata: {
        from_user_id: fromUserId,
        subscription_id: subscriptionId,
        product_id: event.event.product_id,
      },
    });

    // Send notifications to both users
    await sendNotification({
      userId: fromUserId,
      type: 'subscription_transfer_removed',
      title: 'Subscription Transferred',
      body: 'Your subscription has been transferred to another account.',
      priority: NotificationPriority.HIGH,
    });

    await sendNotification({
      userId,
      type: 'subscription_transfer_received',
      title: 'Subscription Received',
      body: 'A subscription has been transferred to your account.',
      priority: NotificationPriority.HIGH,
    });
  } catch (error) {
    await logError('Failed to handle TRANSFER', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle PRODUCT_CHANGE event
 * User switched subscription tier (not used in Pruuf - single tier)
 */
async function handleProductChange(
  userId: string,
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log(`Processing PRODUCT_CHANGE for user ${userId}`);

    const newProductId = event.event.product_id;
    const oldProductId = event.event.old_product_id;

    await logAuditEvent({
      event_type: 'subscription_product_changed',
      user_id: userId,
      metadata: {
        new_product_id: newProductId,
        old_product_id: oldProductId,
      },
    });

    console.log(`Product change logged: ${oldProductId} -> ${newProductId} (no action needed for single-tier model)`);
  } catch (error) {
    await logError('Failed to handle PRODUCT_CHANGE', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Handle TEST event
 * Test webhook sent by RevenueCat (no action needed)
 */
async function handleTest(
  event: any,
  supabase: any
): Promise<void> {
  try {
    console.log('Processing TEST webhook event');

    await logAuditEvent({
      event_type: 'webhook_test_received',
      user_id: null,
      metadata: {
        event_type: 'TEST',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✓ RevenueCat test webhook received successfully');
  } catch (error) {
    await logError('Failed to handle TEST', {
      error: (error as Error).message,
    });
    throw error;
  }
}
