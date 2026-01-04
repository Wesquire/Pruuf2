/**
 * POST /api/auth/create-account
 * Create new user account after email verification
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
  validatePin,
} from '../../_shared/errors.ts';
import {getUserByEmail, createUser} from '../../_shared/db.ts';
import {validateEmail} from '../../_shared/inputValidation.ts';
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
      'email',
      'pin',
      'pin_confirmation',
      'session_token',
    ]);

    const {pin, pin_confirmation, session_token, font_size_preference} = body;

    // Validate and normalize email
    const email = validateEmail(body.email);

    // Validate PIN format
    validatePin(pin);

    // Verify session token
    const sessionEmail = validateSessionToken(session_token);
    if (!sessionEmail || sessionEmail.toLowerCase() !== email.toLowerCase()) {
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
    const existingUser = await getUserByEmail(email);
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
      email,
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
      email: user.email,
      account_status: user.account_status,
      font_size_preference: user.font_size_preference,
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
