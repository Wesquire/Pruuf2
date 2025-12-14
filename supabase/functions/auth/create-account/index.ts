/**
 * POST /api/auth/create-account
 * Create new user account after verification
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  handleCors,
  validateSessionToken,
  hashPin,
  generateToken,
  invalidateSessionToken,
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
import {getUserByPhone, createUser} from '../../_shared/db.ts';
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

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, [
      'phone',
      'pin',
      'pin_confirmation',
      'session_token',
    ]);

    const {phone, pin, pin_confirmation, session_token, font_size_preference} =
      body;

    // Validate formats
    validatePhone(phone);
    validatePin(pin);

    // Verify session token
    const sessionPhone = validateSessionToken(session_token);
    if (!sessionPhone || sessionPhone !== phone) {
      throw new ApiError(
        'Invalid or expired session token',
        401,
        ErrorCodes.INVALID_TOKEN,
      );
    }

    // Validate PIN confirmation
    if (pin !== pin_confirmation) {
      throw new ApiError(
        'PIN and PIN confirmation do not match',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Check if user already exists
    const existingUser = await getUserByPhone(phone);
    if (existingUser) {
      throw new ApiError(
        'Account already exists. Please log in instead',
        409,
        ErrorCodes.ALREADY_EXISTS,
      );
    }

    // Hash PIN
    const pinHash = await hashPin(pin);

    // Create user
    const user = await createUser(
      phone,
      pinHash,
      font_size_preference || 'standard',
    );

    // Invalidate session token
    invalidateSessionToken(session_token);

    // Generate JWT token
    const accessToken = await generateToken(user);

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
      created_at: user.created_at,
    };

    return successResponse(
      {
        user: userData,
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 90 * 24 * 60 * 60, // 90 days in seconds
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
});
