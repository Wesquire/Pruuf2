/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../../_shared/auth.ts';
import { errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
import { getSupabaseClient, updateUser } from '../../_shared/db.ts';
import { verifyWebhookSignature, parseWebhookEvent } from '../../_shared/stripe.ts';
import { sendPaymentSuccessSms, sendPaymentFailureSms, sendAccountFrozenSms, sendSubscriptionReactivatedSms } from '../../_shared/sms.ts';
import { sendPaymentSuccessNotification, sendPaymentFailedNotification } from '../../_shared/push.ts';
import type { User } from '../../_shared/types.ts';

// Stripe webhook secret
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Get the raw body as text for signature verification
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse('Missing Stripe signature', 400);
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    if (!isValid) {
      return errorResponse('Invalid webhook signature', 401);
    }

    // Parse event
    const event = parseWebhookEvent(payload);

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success
    return successResponse({
      received: true,
      event_type: event.type,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return handleError(error);
  }
});

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(subscription: any): Promise<void> {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  await updateUser(userId, {
    stripe_subscription_id: subscription.id,
    account_status: 'active',
    last_payment_date: new Date().toISOString(),
  } as Partial<User>);

  console.log(`Subscription created for user ${userId}`);
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Update subscription status
  const updates: Partial<User> = {
    stripe_subscription_id: subscription.id,
  };

  // Map Stripe subscription status to our account status
  if (subscription.status === 'active') {
    updates.account_status = 'active';
  } else if (subscription.status === 'past_due') {
    updates.account_status = 'past_due';
  } else if (subscription.status === 'canceled') {
    updates.account_status = 'canceled';
  } else if (subscription.status === 'unpaid') {
    updates.account_status = 'frozen';
  }

  await updateUser(userId, updates);

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

/**
 * Handle subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Get user to send notification
  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (user) {
    // Send frozen notification
    await sendAccountFrozenSms(user.phone);
  }

  // Update user status to frozen (access revoked)
  await updateUser(userId, {
    account_status: 'frozen',
  } as Partial<User>);

  console.log(`Subscription deleted for user ${userId}`);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(invoice: any): Promise<void> {
  const customerId = invoice.customer;

  // Find user by Stripe customer ID
  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Update user status to active and record payment date
  const updates: Partial<User> = {
    last_payment_date: new Date().toISOString(),
  };

  // If account was past_due, reactivate it
  if (user.account_status === 'past_due' || user.account_status === 'frozen') {
    updates.account_status = 'active';

    // Send reactivation SMS
    await sendSubscriptionReactivatedSms(user.phone);
  }

  await updateUser(user.id, updates);

  console.log(`Payment succeeded for user ${user.id}`);
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice: any): Promise<void> {
  const customerId = invoice.customer;

  // Find user by Stripe customer ID
  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Update user status to past_due
  await updateUser(user.id, {
    account_status: 'past_due',
  } as Partial<User>);

  // Send payment failure SMS (7 days grace period)
  await sendPaymentFailureSms(user.phone, 7);

  // Send push notification
  await sendPaymentFailedNotification(user.id, 7);

  console.log(`Payment failed for user ${user.id}`);
}

/**
 * Handle customer.subscription.trial_will_end event
 */
async function handleTrialWillEnd(subscription: any): Promise<void> {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Get user
  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) {
    console.error(`No user found for ID ${userId}`);
    return;
  }

  // Calculate days remaining (usually 3 days before trial ends)
  const trialEnd = new Date(subscription.trial_end * 1000);
  const now = new Date();
  const daysRemaining = Math.ceil(
    (trialEnd.getTime() - now.getTime()) / 1000 / 60 / 60 / 24
  );

  // Send trial expiration warning SMS
  const { sendTrialExpirationWarningSms } = await import('../../_shared/sms.ts');
  await sendTrialExpirationWarningSms(user.phone, daysRemaining);

  // Send push notification
  const { sendTrialExpiringNotification } = await import('../../_shared/push.ts');
  await sendTrialExpiringNotification(user.id, daysRemaining);

  console.log(`Trial will end in ${daysRemaining} days for user ${userId}`);
}

/**
 * Handle invoice.payment_action_required event
 */
async function handlePaymentActionRequired(invoice: any): Promise<void> {
  const customerId = invoice.customer;

  // Find user by Stripe customer ID
  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Send SMS with payment link
  await sendPaymentFailureSms(user.phone, 7);

  // Send push notification
  await sendPaymentFailedNotification(user.id, 7);

  console.log(`Payment action required for user ${user.id}`);
}
