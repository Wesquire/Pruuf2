/**
 * POST /api/auth/delete-account
 * Delete user account (soft delete with data retention)
 *
 * Features:
 * - Soft delete (sets deleted_at timestamp)
 * - Cancels active subscriptions
 * - Retains data for compliance (90 days)
 * - Logs deletion event
 * - Requires PIN confirmation
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  handleCors,
  authenticateRequest,
  verifyPin,
} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
  validateRequiredFields,
  validatePin,
} from '../../_shared/errors.ts';
import {getSupabaseClient} from '../../_shared/db.ts';
import {cancelSubscription} from '../../_shared/stripe.ts';
import {logAccountEvent, AUDIT_EVENTS} from '../../_shared/auditLogger.ts';
import {
  checkRateLimit,
  addRateLimitHeaders,
  RATE_LIMITS,
} from '../../_shared/rateLimiter.ts';
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

    // Rate limiting (3 requests per hour for account deletion)
    const rateLimitResult = await checkRateLimit(req, user, 'account_deletion');
    if (rateLimitResult.isRateLimited) {
      return rateLimitResult.errorResponse!;
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['pin', 'confirmation']);

    const {pin, confirmation} = body;

    // Validate PIN format
    validatePin(pin);

    // Verify confirmation text
    if (confirmation !== 'DELETE') {
      throw new ApiError(
        'Please type DELETE to confirm account deletion',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Check if account is already deleted
    if (user.deleted_at) {
      throw new ApiError(
        'Account has already been deleted',
        409,
        ErrorCodes.ALREADY_DELETED,
      );
    }

    // Verify PIN
    const pinValid = await verifyPin(pin, user.pin_hash);
    if (!pinValid) {
      // Log failed deletion attempt
      await logAccountEvent(
        req,
        {id: user.id},
        AUDIT_EVENTS.ACCOUNT_DELETED,
        false,
        {
          reason: 'invalid_pin',
        },
      );

      throw new ApiError('Invalid PIN', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    const supabase = getSupabaseClient();

    // Cancel active subscription if exists
    if (user.stripe_subscription_id) {
      try {
        await cancelSubscription(user.stripe_subscription_id);
      } catch (error) {
        console.error(
          'Failed to cancel subscription during account deletion:',
          error,
        );
        // Don't block deletion if subscription cancellation fails
        // Admin can manually handle subscription cleanup
      }
    }

    // Soft delete: Set deleted_at timestamp
    const {error: updateError} = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        account_status: 'deleted',
        // Clear sensitive data but retain for compliance
        push_token: null,
        stripe_subscription_id: null,
      } as Partial<User>)
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to delete account:', updateError);
      throw new ApiError(
        'Failed to delete account',
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }

    // Soft delete user's members (set deleted_at)
    const {error: membersError} = await supabase
      .from('members')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (membersError) {
      console.error('Failed to delete members:', membersError);
      // Don't block account deletion if member cleanup fails
    }

    // Log successful account deletion
    await logAccountEvent(
      req,
      {id: user.id},
      AUDIT_EVENTS.ACCOUNT_DELETED,
      true,
      {
        phone: user.phone,
        had_subscription: !!user.stripe_subscription_id,
        account_age_days: Math.floor(
          (Date.now() - new Date(user.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      },
    );

    // Build success response
    const response = successResponse(
      {
        message: 'Account deleted successfully',
        deleted_at: new Date().toISOString(),
        data_retention: '90 days',
        note: 'Your data will be permanently deleted after 90 days. You can contact support to restore your account within this period.',
      },
      200,
    );

    // Add rate limit headers
    const responseWithHeaders = addRateLimitHeaders(
      response,
      rateLimitResult.remainingRequests,
      rateLimitResult.resetTime,
      3,
    );

    return responseWithHeaders;
  } catch (error) {
    return handleError(error);
  }
});
