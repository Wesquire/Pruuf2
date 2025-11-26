/**
 * PATCH /api/payments/update-payment-method
 * Update payment method for subscription
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields } from '../../_shared/errors.ts';
import { updateUser } from '../../_shared/db.ts';
import { getPaymentMethods, updatePaymentMethod, getSubscription, retryInvoice } from '../../_shared/stripe.ts';
import { sendPaymentSuccessSms } from '../../_shared/sms.ts';
import { sendPaymentSuccessNotification } from '../../_shared/push.ts';
import type { User } from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow PATCH
    if (req.method !== 'PATCH') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['payment_method_id']);

    const { payment_method_id } = body;

    // Check if user has Stripe customer
    if (!user.stripe_customer_id) {
      throw new ApiError(
        'No Stripe customer found. Please create a subscription first',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // Get existing payment methods
    const existingMethods = await getPaymentMethods(user.stripe_customer_id);

    const oldPaymentMethodId = existingMethods.length > 0
      ? existingMethods[0].id
      : null;

    // Update payment method
    await updatePaymentMethod(
      user.stripe_customer_id,
      oldPaymentMethodId!,
      payment_method_id
    );

    // If account was past_due, try to retry the failed invoice
    if (user.account_status === 'past_due' && user.stripe_subscription_id) {
      try {
        const subscription = await getSubscription(user.stripe_subscription_id);

        if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
          // Retry the invoice
          await retryInvoice(subscription.latest_invoice.id);

          // Update user account status to active
          await updateUser(user.id, {
            account_status: 'active',
            last_payment_date: new Date().toISOString(),
          } as Partial<User>);

          // Send success notifications
          await sendPaymentSuccessSms(user.phone);
          await sendPaymentSuccessNotification(user.id);
        }
      } catch (retryError) {
        console.error('Failed to retry invoice:', retryError);
        // Don't throw - payment method was still updated successfully
      }
    }

    // Get updated payment methods
    const updatedMethods = await getPaymentMethods(user.stripe_customer_id);

    // Return updated payment method
    return successResponse({
      payment_method: {
        id: updatedMethods[0].id,
        brand: updatedMethods[0].card?.brand,
        last4: updatedMethods[0].card?.last4,
        exp_month: updatedMethods[0].card?.exp_month,
        exp_year: updatedMethods[0].card?.exp_year,
      },
      message: 'Payment method updated successfully',
    });
  } catch (error) {
    return handleError(error);
  }
});
