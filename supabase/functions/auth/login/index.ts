/**
 * POST /api/auth/login
 * Login with phone and PIN
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  handleCors,
  verifyPin,
  generateToken,
  handleFailedLogin,
  resetFailedLoginAttempts,
} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
  validateRequiredFields,
  validatePhone,
  validatePin,
} from '../../_shared/errors.ts';
import {getUserByPhone} from '../../_shared/db.ts';
import {
  checkRateLimit,
  addRateLimitHeaders,
  RATE_LIMITS,
} from '../../_shared/rateLimiter.ts';
import {logAuthEvent, AUDIT_EVENTS} from '../../_shared/auditLogger.ts';
import {requireCaptcha} from '../../_shared/captcha.ts';

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

    // Rate limiting (10 requests per minute for auth endpoints)
    const rateLimitResult = await checkRateLimit(req, null, 'auth');
    if (rateLimitResult.isRateLimited) {
      return rateLimitResult.errorResponse!;
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['phone', 'pin']);

    const {phone, pin, recaptcha_token} = body;

    // Verify CAPTCHA (optional layer - protects against brute-force bot attacks)
    // Note: Login also has rate limiting and account locking for additional protection
    await requireCaptcha(recaptcha_token, req, 'login');

    // Validate formats
    validatePhone(phone);
    validatePin(pin);

    // Get user
    const user = await getUserByPhone(phone);

    if (!user) {
      // Log failed login attempt
      await logAuthEvent(req, null, AUDIT_EVENTS.LOGIN_FAILED, false, {
        phone,
        reason: 'user_not_found',
      });

      throw new ApiError(
        'Invalid phone number or PIN',
        401,
        ErrorCodes.INVALID_CREDENTIALS,
      );
    }

    // Check if account is deleted
    if (user.deleted_at) {
      // Log login attempt on deleted account
      await logAuthEvent(req, {id: user.id}, AUDIT_EVENTS.LOGIN_FAILED, false, {
        phone,
        reason: 'account_deleted',
      });

      throw new ApiError(
        'Account has been deleted',
        403,
        ErrorCodes.ACCOUNT_DELETED,
      );
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60,
      );

      // Log login attempt on locked account
      await logAuthEvent(req, {id: user.id}, AUDIT_EVENTS.LOGIN_FAILED, false, {
        phone,
        reason: 'account_locked',
        locked_until: user.locked_until,
        minutes_remaining: minutesRemaining,
      });

      throw new ApiError(
        `Account is locked. Try again in ${minutesRemaining} minutes`,
        403,
        ErrorCodes.ACCOUNT_LOCKED,
      );
    }

    // Verify PIN
    const pinValid = await verifyPin(pin, user.pin_hash);

    if (!pinValid) {
      // Log failed PIN verification
      await logAuthEvent(req, {id: user.id}, AUDIT_EVENTS.LOGIN_FAILED, false, {
        phone,
        reason: 'invalid_pin',
        failed_attempts: (user.failed_login_attempts || 0) + 1,
      });

      // Handle failed login (increments counter, locks if needed)
      await handleFailedLogin(user);
      // handleFailedLogin throws an error, so this line won't be reached
      return errorResponse('Invalid phone number or PIN', 401);
    }

    // Reset failed login attempts on successful login
    await resetFailedLoginAttempts(user);

    // Generate JWT token
    const accessToken = await generateToken(user);

    // Log successful login
    await logAuthEvent(req, {id: user.id}, AUDIT_EVENTS.LOGIN, true, {
      phone,
      account_status: user.account_status,
      is_member: user.is_member,
    });

    // Return user data and token (without PIN hash)
    const userData = {
      id: user.id,
      phone: user.phone,
      account_status: user.account_status,
      is_member: user.is_member,
      grandfathered_free: user.grandfathered_free,
      font_size_preference: user.font_size_preference,
      trial_start_date: user.trial_start_date,
      trial_end_date: user.trial_end_date,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      created_at: user.created_at,
    };

    const response = successResponse({
      user: userData,
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 90 * 24 * 60 * 60, // 90 days in seconds
    });

    // Add rate limit headers
    return addRateLimitHeaders(
      response,
      rateLimitResult.remainingRequests,
      rateLimitResult.resetTime,
      RATE_LIMITS.auth.maxRequests,
    );
  } catch (error) {
    return handleError(error);
  }
});
