/**
 * GET /api/payments/subscription
 * Get user's subscription details from RevenueCat
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import {
  errorResponse,
  successResponse,
  handleError,
} from '../../_shared/errors.ts';
import { requiresPayment } from '../../_shared/db.ts';
import {
  getSubscriptionDetails,
  getOrCreateSubscriber,
} from '../../_shared/revenuecat.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Check if user requires payment (Members never pay)
    const needsPayment = await requiresPayment(user.id);

    // Base response
    const response: any = {
      requires_payment: needsPayment,
      account_status: user.account_status,
      grandfathered_free: user.grandfathered_free,
      price: {
        monthly: {
          amount: 4.99,
          currency: 'USD',
          formatted: '$4.99/month',
        },
        annual: {
          amount: 50.0,
          currency: 'USD',
          formatted: '$50/year',
          savings: '16.7%',
        },
      },
    };

    // Add trial information if in trial
    if (user.account_status === 'trial' && user.trial_end_date) {
      const trialEndDate = new Date(user.trial_end_date);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / 1000 / 60 / 60 / 24,
      );

      response.trial = {
        start_date: user.trial_start_date,
        end_date: user.trial_end_date,
        days_remaining: Math.max(0, daysRemaining),
        is_active: daysRemaining > 0,
      };
    }

    // Get RevenueCat subscription details
    try {
      const subscriptionDetails = await getSubscriptionDetails(user.id);

      if (subscriptionDetails.hasActiveSubscription && subscriptionDetails.subscription) {
        const sub = subscriptionDetails.subscription;

        response.subscription = {
          is_active: true,
          expires_date: sub.expires_date,
          purchase_date: sub.purchase_date,
          store: sub.store,
          is_sandbox: sub.is_sandbox,
          period_type: sub.period_type,
          is_trialing: subscriptionDetails.isTrialing,
          is_in_grace_period: subscriptionDetails.isInGracePeriod,
        };

        // Add billing information
        if (!sub.unsubscribe_detected_at && sub.period_type === 'normal') {
          const expiresDate = new Date(sub.expires_date);
          response.next_billing_date = sub.expires_date;
          response.next_billing_amount =
            sub.store === 'app_store' || sub.store === 'play_store'
              ? '$4.99' // Monthly default
              : null;
        }

        // Add cancellation info if unsubscribed
        if (sub.unsubscribe_detected_at) {
          response.subscription.canceled_at = sub.unsubscribe_detected_at;
          response.subscription.access_until = sub.expires_date;
        }

        // Add grace period info if in grace
        if (subscriptionDetails.isInGracePeriod && sub.grace_period_expires_date) {
          response.subscription.grace_period_expires_date = sub.grace_period_expires_date;
        }
      } else {
        response.subscription = {
          is_active: false,
        };
      }

      // Get subscriber attributes (custom metadata we set)
      const subscriber = await getOrCreateSubscriber(user.id);

      // Add management URL if available
      if (subscriber.subscriber.management_url) {
        response.management_url = subscriber.subscriber.management_url;
      }
    } catch (revenueCatError) {
      // If RevenueCat fails, return basic info without subscription details
      console.error('Failed to fetch RevenueCat subscription:', revenueCatError);
      response.subscription = {
        is_active: false,
        error: 'Failed to fetch subscription details',
      };
    }

    // Return subscription data
    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
});
