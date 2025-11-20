/**
 * POST /api/payments/create-subscription
 * Create Stripe subscription for Contact user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields } from '../../_shared/errors.ts';
import { requiresPayment, updateUser } from '../../_shared/db.ts';
import { createOrGetCustomer, attachPaymentMethod, createSubscription, getMonthlyPrice } from '../../_shared/stripe.ts';
import { sendPaymentSuccessSms } from '../../_shared/sms.ts';
import { sendPaymentSuccessNotification } from '../../_shared/push.ts';
import { checkIdempotencyKey, storeIdempotencyKey } from '../../_shared/idempotency.ts';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMITS } from '../../_shared/rateLimiter.ts';
import { logPaymentEvent, AUDIT_EVENTS } from '../../_shared/auditLogger.ts';
import type { User } from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Rate limiting (5 requests per minute for payment endpoints)
    const rateLimitResult = await checkRateLimit(req, user, 'payment');
    if (rateLimitResult.isRateLimited) {
      return rateLimitResult.errorResponse!;
    }

    // Parse request body
    const body = await req.json();

    // Check idempotency key (prevents duplicate subscription creation)
    const { shouldProcessRequest, idempotencyKey, cachedResponse } =
      await checkIdempotencyKey(req, body);

    if (!shouldProcessRequest) {
      return cachedResponse!;
    }

    // Validate required fields
    validateRequiredFields(body, ['payment_method_id']);

    const { payment_method_id } = body;

    // Check if user requires payment
    const needsPayment = await requiresPayment(user.id);

    if (!needsPayment) {
      throw new ApiError(
        'Subscription not required. You have grandfathered free access or no active members',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if user already has active subscription
    if (user.stripe_subscription_id) {
      throw new ApiError(
        'Subscription already exists',
        409,
        ErrorCodes.ALREADY_EXISTS
      );
    }

    // Create or get Stripe customer
    const customerId = await createOrGetCustomer(
      user.id,
      user.phone,
      user.stripe_customer_id
    );

    // Attach payment method to customer
    await attachPaymentMethod(payment_method_id, customerId);

    // Create subscription
    const subscription = await createSubscription(customerId, user.id);

    // Update user with Stripe IDs and account status
    await updateUser(user.id, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      account_status: 'active',
      last_payment_date: new Date().toISOString(),
    } as Partial<User>);

    // Send confirmation SMS
    await sendPaymentSuccessSms(user.phone);

    // Send confirmation push notification
    await sendPaymentSuccessNotification(user.id);

    // Get price information
    const price = getMonthlyPrice();

    // Log successful subscription creation
    await logPaymentEvent(req, { id: user.id }, AUDIT_EVENTS.SUBSCRIPTION_CREATED, true, {
      subscription_id: subscription.id,
      customer_id: customerId,
      amount: price.unit_amount,
      currency: price.currency,
      interval: 'month',
      status: subscription.status,
    });

    // Build success response
    const response = successResponse({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      customer: {
        id: customerId,
      },
      price,
      message: 'Subscription created successfully',
    }, 201);

    // Store idempotency key for future deduplication
    await storeIdempotencyKey(idempotencyKey, body, response);

    // Add rate limit headers
    const responseWithHeaders = addRateLimitHeaders(
      response,
      rateLimitResult.remainingRequests,
      rateLimitResult.resetTime,
      RATE_LIMITS.payment.maxRequests
    );

    return responseWithHeaders;
  } catch (error) {
    return handleError(error);
  }
});
