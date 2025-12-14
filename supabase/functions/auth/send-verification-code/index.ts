/**
 * POST /api/auth/send-verification-code
 * Send verification code to email address
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, generateVerificationCode, createSessionToken } from '../../_shared/auth.ts';
import { errorResponse, successResponse, handleError, validateRequiredFields } from '../../_shared/errors.ts';
import { createVerificationCode, getActiveVerificationCode } from '../../_shared/db.ts';
import { sendVerificationCodeEmail } from '../../_shared/email.ts';
import { validateEmail } from '../../_shared/inputValidation.ts';
import { requireCaptcha } from '../../_shared/captcha.ts';

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
    validateRequiredFields(body, ['email']);

    const { recaptcha_token } = body;

    // Validate and normalize email
    const email = validateEmail(body.email);

    // Verify CAPTCHA (protects against bot attacks)
    await requireCaptcha(recaptcha_token, req, 'send_verification_code');

    // Rate limiting: Check if a verification code was sent recently
    const existingCode = await getActiveVerificationCode(email);
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
    await createVerificationCode(email, code, 10);

    // Send verification email
    await sendVerificationCodeEmail(email, code);

    // Create session token for next step
    const sessionToken = createSessionToken(email, 10);

    // Return response
    return successResponse({
      session_token: sessionToken,
      expires_in: 600, // 10 minutes
    });
  } catch (error) {
    return handleError(error);
  }
});
