/**
 * POST /api/payments/cancel-subscription
 * Cancel Stripe subscription (at period end)
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors, authenticateRequest} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
} from '../../_shared/errors.ts';
import {updateUser} from '../../_shared/db.ts';
import {cancelSubscription, getSubscription} from '../../_shared/stripe.ts';
import {sendSubscriptionCanceledNotification} from '../../_shared/push.ts';
import type {User} from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Check if user has subscription
    if (!user.stripe_subscription_id) {
      throw new ApiError(
        'No active subscription found',
        404,
        ErrorCodes.NOT_FOUND,
      );
    }

    // Get current subscription details
    const subscription = await getSubscription(user.stripe_subscription_id);

    // Check if already canceled
    if (subscription.cancel_at_period_end) {
      return successResponse({
        message: 'Subscription already scheduled for cancellation',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: true,
          current_period_end: subscription.current_period_end,
        },
      });
    }

    // Cancel subscription at period end
    const canceledSubscription = await cancelSubscription(
      user.stripe_subscription_id,
    );

    // Update user account status
    await updateUser(user.id, {
      account_status: 'canceled',
    } as Partial<User>);

    // Format end date
    const endDate = new Date(canceledSubscription.current_period_end * 1000);
    const endDateString = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send cancellation push notification
    await sendSubscriptionCanceledNotification(user.id, endDateString);

    // Return canceled subscription data
    return successResponse({
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: true,
        current_period_end: canceledSubscription.current_period_end,
        cancels_at: canceledSubscription.current_period_end,
      },
      message: `Subscription will be canceled on ${endDateString}`,
    });
  } catch (error) {
    return handleError(error);
  }
});
