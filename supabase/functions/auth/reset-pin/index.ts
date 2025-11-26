/**
 * POST /api/auth/reset-pin
 * Reset PIN after verification
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, validateSessionToken, hashPin, invalidateSessionToken } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields, validatePhone, validatePin } from '../../_shared/errors.ts';
import { getUserByPhone, updateUser } from '../../_shared/db.ts';
import { sendPinResetConfirmationSms } from '../../_shared/sms.ts';
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

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['phone', 'new_pin', 'new_pin_confirmation', 'session_token']);

    const { phone, new_pin, new_pin_confirmation, session_token } = body;

    // Validate formats
    validatePhone(phone);
    validatePin(new_pin);

    // Verify session token
    const sessionPhone = validateSessionToken(session_token);
    if (!sessionPhone || sessionPhone !== phone) {
      throw new ApiError(
        'Invalid or expired session token',
        401,
        ErrorCodes.INVALID_TOKEN
      );
    }

    // Validate PIN confirmation
    if (new_pin !== new_pin_confirmation) {
      throw new ApiError(
        'PIN and PIN confirmation do not match',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Get user
    const user = await getUserByPhone(phone);

    if (!user) {
      throw new ApiError(
        'User not found',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if account is deleted
    if (user.deleted_at) {
      throw new ApiError(
        'Account has been deleted',
        403,
        ErrorCodes.ACCOUNT_DELETED
      );
    }

    // Hash new PIN
    const pinHash = await hashPin(new_pin);

    // Update user's PIN and reset failed attempts
    await updateUser(user.id, {
      pin_hash: pinHash,
      failed_login_attempts: 0,
      locked_until: null,
    } as Partial<User>);

    // Invalidate session token
    invalidateSessionToken(session_token);

    // Send confirmation SMS
    await sendPinResetConfirmationSms(phone);

    // Return success
    return successResponse({
      message: 'PIN has been reset successfully',
    });
  } catch (error) {
    return handleError(error);
  }
});
