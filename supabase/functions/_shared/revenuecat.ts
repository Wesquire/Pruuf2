/**
 * RevenueCat API Wrapper
 *
 * Handles all interactions with RevenueCat REST API v1
 * https://docs.revenuecat.com/reference/basic
 */

import { logError } from './auditLogger.ts';

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';
const REVENUECAT_SECRET_KEY = Deno.env.get('REVENUECAT_SECRET_KEY');

if (!REVENUECAT_SECRET_KEY) {
  throw new Error('REVENUECAT_SECRET_KEY environment variable is required');
}

/**
 * RevenueCat Subscription Object (from API)
 */
export interface RevenueCatSubscription {
  expires_date: string;
  purchase_date: string;
  original_purchase_date: string;
  ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
  store: 'app_store' | 'play_store' | 'stripe' | 'promotional';
  is_sandbox: boolean;
  unsubscribe_detected_at: string | null;
  billing_issues_detected_at: string | null;
  grace_period_expires_date: string | null;
  refunded_at: string | null;
  auto_resume_date: string | null;
  period_type: 'normal' | 'trial' | 'intro';
}

/**
 * RevenueCat Subscriber Object (from API)
 */
export interface RevenueCatSubscriber {
  request_date: string;
  request_date_ms: number;
  subscriber: {
    original_app_user_id: string;
    original_application_version: string | null;
    original_purchase_date: string | null;
    first_seen: string;
    last_seen: string;
    management_url: string | null;
    non_subscriptions: Record<string, unknown>;
    subscriptions: Record<string, RevenueCatSubscription>;
    entitlements: Record<string, {
      expires_date: string | null;
      purchase_date: string;
      product_identifier: string;
    }>;
  };
}

/**
 * RevenueCat Account Status (Pruuf-specific mapping)
 */
export type RevenueCatAccountStatus =
  | 'active'           // Paid and active
  | 'active_free'      // Free (Member or grandfathered)
  | 'trial'            // In trial period
  | 'past_due'         // Payment failed, in grace period
  | 'frozen'           // Subscription expired/canceled
  | 'canceled';        // User canceled, access until period end

/**
 * Make authenticated request to RevenueCat API
 */
async function revenueCatRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${REVENUECAT_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'X-Platform': 'ios', // Default, can be overridden
      ...options.headers,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    await logError('RevenueCat API Error', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      body: responseText,
    });

    throw new Error(
      `RevenueCat API error: ${response.status} ${response.statusText} - ${responseText}`
    );
  }

  // Handle empty responses (e.g., DELETE returns 200 with no body)
  if (!responseText || responseText.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (err) {
    await logError('RevenueCat JSON Parse Error', {
      endpoint,
      responseText,
      error: (err as Error).message,
    });
    throw new Error('Failed to parse RevenueCat response');
  }
}

/**
 * Get or create a subscriber in RevenueCat
 *
 * @param userId - Pruuf user ID (used as app_user_id)
 * @returns Subscriber object with subscription data
 */
export async function getOrCreateSubscriber(
  userId: string
): Promise<RevenueCatSubscriber> {
  try {
    // GET /subscribers/{app_user_id}
    // This creates the subscriber if it doesn't exist
    const data = await revenueCatRequest(`/subscribers/${userId}`, {
      method: 'GET',
    });

    return data as RevenueCatSubscriber;
  } catch (err) {
    await logError('Failed to get/create RevenueCat subscriber', {
      userId,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Check if user has active subscription
 *
 * @param userId - Pruuf user ID
 * @returns True if user has any active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscriber = await getOrCreateSubscriber(userId);
    const subscriptions = subscriber.subscriber.subscriptions;

    if (!subscriptions || Object.keys(subscriptions).length === 0) {
      return false;
    }

    const now = new Date();

    // Check if any subscription is active (not expired)
    for (const [_productId, subscription] of Object.entries(subscriptions)) {
      const expiresDate = new Date(subscription.expires_date);

      // Active if:
      // 1. Not expired
      // 2. Not refunded
      // 3. Not in billing issues (unless in grace period)
      if (
        expiresDate > now &&
        !subscription.refunded_at &&
        (!subscription.billing_issues_detected_at || subscription.grace_period_expires_date)
      ) {
        return true;
      }
    }

    return false;
  } catch (err) {
    await logError('Failed to check active subscription', {
      userId,
      error: (err as Error).message,
    });
    return false;
  }
}

/**
 * Get detailed subscription status for user
 *
 * @param userId - Pruuf user ID
 * @returns Object with subscription details
 */
export async function getSubscriptionDetails(userId: string): Promise<{
  hasActiveSubscription: boolean;
  subscription: RevenueCatSubscription | null;
  expiresDate: string | null;
  isInGracePeriod: boolean;
  isTrialing: boolean;
  store: string | null;
}> {
  try {
    const subscriber = await getOrCreateSubscriber(userId);
    const subscriptions = subscriber.subscriber.subscriptions;

    if (!subscriptions || Object.keys(subscriptions).length === 0) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        expiresDate: null,
        isInGracePeriod: false,
        isTrialing: false,
        store: null,
      };
    }

    const now = new Date();
    let activeSubscription: RevenueCatSubscription | null = null;

    // Find the most recent active subscription
    for (const subscription of Object.values(subscriptions)) {
      const expiresDate = new Date(subscription.expires_date);

      if (expiresDate > now && !subscription.refunded_at) {
        // Keep the latest expiring subscription
        if (
          !activeSubscription ||
          new Date(subscription.expires_date) > new Date(activeSubscription.expires_date)
        ) {
          activeSubscription = subscription;
        }
      }
    }

    if (!activeSubscription) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        expiresDate: null,
        isInGracePeriod: false,
        isTrialing: false,
        store: null,
      };
    }

    const isInGracePeriod = !!(
      activeSubscription.billing_issues_detected_at &&
      activeSubscription.grace_period_expires_date &&
      new Date(activeSubscription.grace_period_expires_date) > now
    );

    const isTrialing = activeSubscription.period_type === 'trial';

    return {
      hasActiveSubscription: true,
      subscription: activeSubscription,
      expiresDate: activeSubscription.expires_date,
      isInGracePeriod,
      isTrialing,
      store: activeSubscription.store,
    };
  } catch (err) {
    await logError('Failed to get subscription details', {
      userId,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Update subscriber attributes (custom metadata)
 *
 * @param userId - Pruuf user ID
 * @param attributes - Key-value pairs to set
 */
export async function updateSubscriberAttributes(
  userId: string,
  attributes: Record<string, string | number | boolean>
): Promise<void> {
  try {
    await revenueCatRequest(`/subscribers/${userId}/attributes`, {
      method: 'POST',
      body: JSON.stringify({
        attributes,
      }),
    });
  } catch (err) {
    await logError('Failed to update subscriber attributes', {
      userId,
      attributes,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Delete subscriber from RevenueCat
 *
 * @param userId - Pruuf user ID
 */
export async function deleteSubscriber(userId: string): Promise<void> {
  try {
    await revenueCatRequest(`/subscribers/${userId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    await logError('Failed to delete subscriber', {
      userId,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Grant promotional entitlement to user
 *
 * @param userId - Pruuf user ID
 * @param entitlementIdentifier - RevenueCat entitlement ID
 * @param duration - Duration in ISO 8601 format (e.g., 'P1M' for 1 month)
 */
export async function grantPromotionalEntitlement(
  userId: string,
  entitlementIdentifier: string,
  duration: string = 'P1M'
): Promise<void> {
  try {
    await revenueCatRequest(`/subscribers/${userId}/entitlements/${entitlementIdentifier}/promotional`, {
      method: 'POST',
      body: JSON.stringify({
        duration,
      }),
    });
  } catch (err) {
    await logError('Failed to grant promotional entitlement', {
      userId,
      entitlementIdentifier,
      duration,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Revoke promotional entitlement from user
 *
 * @param userId - Pruuf user ID
 * @param entitlementIdentifier - RevenueCat entitlement ID
 */
export async function revokePromotionalEntitlement(
  userId: string,
  entitlementIdentifier: string
): Promise<void> {
  try {
    await revenueCatRequest(`/subscribers/${userId}/entitlements/${entitlementIdentifier}/revoke_promotionals`, {
      method: 'POST',
    });
  } catch (err) {
    await logError('Failed to revoke promotional entitlement', {
      userId,
      entitlementIdentifier,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Sync user account status with Supabase based on RevenueCat subscription
 *
 * This is the CORE business logic function that determines account_status
 * based on RevenueCat data + Pruuf-specific rules (Members never pay, etc.)
 *
 * @param userId - Pruuf user ID
 * @param supabaseClient - Supabase client instance
 * @returns Updated account_status
 */
export async function syncUserAccountStatus(
  userId: string,
  supabaseClient: any
): Promise<RevenueCatAccountStatus> {
  try {
    // 1. Get user from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, is_member, grandfathered_free, trial_end_date, account_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 2. Check if user is exempt from payment (Members never pay)
    if (user.is_member || user.grandfathered_free) {
      // Update to active_free
      await supabaseClient
        .from('users')
        .update({
          account_status: 'active_free',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return 'active_free';
    }

    // 3. Check if user is in trial
    const now = new Date();
    const trialEndDate = user.trial_end_date ? new Date(user.trial_end_date) : null;

    if (trialEndDate && trialEndDate > now) {
      // Still in trial
      await supabaseClient
        .from('users')
        .update({
          account_status: 'trial',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return 'trial';
    }

    // 4. Check RevenueCat subscription status
    const subscriptionDetails = await getSubscriptionDetails(userId);

    if (subscriptionDetails.hasActiveSubscription) {
      if (subscriptionDetails.isInGracePeriod) {
        // Payment failed, in grace period
        await supabaseClient
          .from('users')
          .update({
            account_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        return 'past_due';
      }

      // Active paid subscription
      await supabaseClient
        .from('users')
        .update({
          account_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return 'active';
    }

    // 5. No active subscription, trial expired
    await supabaseClient
      .from('users')
      .update({
        account_status: 'frozen',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return 'frozen';
  } catch (err) {
    await logError('Failed to sync user account status', {
      userId,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Handle subscription cancellation
 *
 * Note: RevenueCat handles this via webhooks, but this function can be used
 * for manual cancellations or testing
 *
 * @param userId - Pruuf user ID
 * @param supabaseClient - Supabase client
 */
export async function handleSubscriptionCancellation(
  userId: string,
  supabaseClient: any
): Promise<void> {
  try {
    // Get subscription details to determine when access ends
    const details = await getSubscriptionDetails(userId);

    if (details.hasActiveSubscription && details.expiresDate) {
      // User retains access until expiration date
      await supabaseClient
        .from('users')
        .update({
          account_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      // No active subscription, freeze immediately
      await supabaseClient
        .from('users')
        .update({
          account_status: 'frozen',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  } catch (err) {
    await logError('Failed to handle subscription cancellation', {
      userId,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Handle subscription refund
 *
 * @param userId - Pruuf user ID
 * @param supabaseClient - Supabase client
 */
export async function handleSubscriptionRefund(
  userId: string,
  supabaseClient: any
): Promise<void> {
  try {
    // Immediate freeze on refund (access revoked)
    await supabaseClient
      .from('users')
      .update({
        account_status: 'frozen',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (err) {
    await logError('Failed to handle subscription refund', {
      userId,
      error: (err as Error).message,
    });
    throw err;
  }
}
