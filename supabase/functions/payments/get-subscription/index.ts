/**
 * GET /api/payments/subscription
 * Get user's subscription details
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
import { requiresPayment } from '../../_shared/db.ts';
import { getSubscription, getPaymentMethods, getMonthlyPrice, formatPrice } from '../../_shared/stripe.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Check if user requires payment
    const needsPayment = await requiresPayment(user.id);

    // Get price information
    const price = getMonthlyPrice();

    // Base response
    const response: any = {
      requires_payment: needsPayment,
      account_status: user.account_status,
      grandfathered_free: user.grandfathered_free,
      price,
    };

    // Add trial information if in trial
    if (user.account_status === 'trial' && user.trial_end_date) {
      const trialEndDate = new Date(user.trial_end_date);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / 1000 / 60 / 60 / 24
      );

      response.trial = {
        start_date: user.trial_start_date,
        end_date: user.trial_end_date,
        days_remaining: daysRemaining,
        is_active: daysRemaining > 0,
      };
    }

    // If user has subscription, get Stripe details
    if (user.stripe_subscription_id) {
      const subscription = await getSubscription(user.stripe_subscription_id);

      response.subscription = {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at,
      };

      // Calculate next billing date
      if (!subscription.cancel_at_period_end && subscription.status === 'active') {
        const nextBillingDate = new Date(subscription.current_period_end * 1000);
        response.next_billing_date = nextBillingDate.toISOString();
        response.next_billing_amount = formatPrice(price.cents);
      }
    }

    // Get payment methods if user has Stripe customer
    if (user.stripe_customer_id) {
      const paymentMethods = await getPaymentMethods(user.stripe_customer_id);

      if (paymentMethods.length > 0) {
        response.payment_method = {
          id: paymentMethods[0].id,
          brand: paymentMethods[0].card?.brand,
          last4: paymentMethods[0].card?.last4,
          exp_month: paymentMethods[0].card?.exp_month,
          exp_year: paymentMethods[0].card?.exp_year,
        };
      }
    }

    // Return subscription data
    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
});
