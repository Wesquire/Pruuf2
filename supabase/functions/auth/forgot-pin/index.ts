/**
 * POST /api/auth/forgot-pin
 * Send verification code for PIN reset
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, generateVerificationCode, createSessionToken } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields, validatePhone } from '../../_shared/errors.ts';
import { getUserByPhone, createVerificationCode, getActiveVerificationCode } from '../../_shared/db.ts';
import { sendForgotPinSms } from '../../_shared/sms.ts';

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
    validateRequiredFields(body, ['phone']);

    const { phone } = body;

    // Validate phone number format
    validatePhone(phone);

    // Check if user exists
    const user = await getUserByPhone(phone);

    if (!user) {
      // Don't reveal if user exists or not for security
      // Return success anyway
      return successResponse({
        message: 'If an account exists with this phone number, a verification code has been sent',
      });
    }

    // Rate limiting: Check if a verification code was sent recently
    const existingCode = await getActiveVerificationCode(phone);
    if (existingCode) {
      const now = new Date();
      const createdAt = new Date(existingCode.created_at);
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60;

      // Allow new code only if 1 minute has passed
      if (minutesSinceCreation < 1) {
        return errorResponse(
          'Please wait before requesting another verification code',
          429
        );
      }
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode();

    // Store verification code in database (expires in 10 minutes)
    await createVerificationCode(phone, code, 10);

    // Send SMS
    await sendForgotPinSms(phone, code);

    // Create session token for next step
    const sessionToken = createSessionToken(phone, 10);

    // Return response
    return successResponse({
      session_token: sessionToken,
      expires_in: 600, // 10 minutes
      message: 'Verification code sent',
    });
  } catch (error) {
    return handleError(error);
  }
});
