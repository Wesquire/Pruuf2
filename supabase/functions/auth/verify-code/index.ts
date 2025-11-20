/**
 * POST /api/auth/verify-code
 * Verify SMS verification code
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, validateSessionToken, createSessionToken, invalidateSessionToken } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields, validatePhone, validateVerificationCode } from '../../_shared/errors.ts';
import { getUserByPhone, getActiveVerificationCode, markVerificationCodeAsUsed, incrementVerificationCodeAttempts } from '../../_shared/db.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['phone', 'code']);

    const { phone, code } = body;

    // Validate formats
    validatePhone(phone);
    validateVerificationCode(code);

    // Get active verification code for phone
    const verificationCode = await getActiveVerificationCode(phone);

    if (!verificationCode) {
      throw new ApiError(
        'No active verification code found',
        404,
        ErrorCodes.CODE_EXPIRED
      );
    }

    // Check if code is expired
    if (new Date(verificationCode.expires_at) < new Date()) {
      throw new ApiError(
        'Verification code has expired',
        400,
        ErrorCodes.CODE_EXPIRED
      );
    }

    // Check if code has been used
    if (verificationCode.used) {
      throw new ApiError(
        'Verification code has already been used',
        400,
        ErrorCodes.CODE_USED
      );
    }

    // Check max attempts (5 attempts allowed)
    if (verificationCode.attempts >= 5) {
      throw new ApiError(
        'Maximum verification attempts exceeded',
        400,
        ErrorCodes.MAX_ATTEMPTS_EXCEEDED
      );
    }

    // Verify code matches
    if (verificationCode.code !== code) {
      // Increment attempts
      const newAttempts = await incrementVerificationCodeAttempts(verificationCode.id);

      if (newAttempts >= 5) {
        throw new ApiError(
          'Maximum verification attempts exceeded',
          400,
          ErrorCodes.MAX_ATTEMPTS_EXCEEDED
        );
      }

      throw new ApiError(
        `Invalid verification code. ${5 - newAttempts} attempts remaining`,
        400,
        ErrorCodes.INVALID_CODE
      );
    }

    // Mark code as used
    await markVerificationCodeAsUsed(verificationCode.id);

    // Check if user exists
    const existingUser = await getUserByPhone(phone);

    // Create new session token for next step
    const sessionToken = createSessionToken(phone, 10);

    // Return response indicating if user exists (login) or needs to create account (signup)
    return successResponse({
      session_token: sessionToken,
      user_exists: !!existingUser,
      requires_account_creation: !existingUser,
      expires_in: 600,
    });
  } catch (error) {
    return handleError(error);
  }
});
