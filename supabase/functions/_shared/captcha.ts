/**
 * CAPTCHA verification using Google reCAPTCHA v3
 * Protects auth endpoints from bot attacks
 *
 * Usage:
 *   const isValid = await verifyCaptcha(token, req);
 *   if (!isValid) throw new ApiError('CAPTCHA verification failed');
 */

import { ApiError, ErrorCodes } from './errors.ts';

// reCAPTCHA secret key (from environment)
const RECAPTCHA_SECRET = Deno.env.get('RECAPTCHA_SECRET_KEY') || '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// Minimum score for reCAPTCHA v3 (0.0 = bot, 1.0 = human)
const RECAPTCHA_MIN_SCORE = parseFloat(Deno.env.get('RECAPTCHA_MIN_SCORE') || '0.5');

// Enable/disable CAPTCHA verification
const CAPTCHA_ENABLED = Deno.env.get('CAPTCHA_ENABLED') !== 'false';

/**
 * reCAPTCHA verification response
 */
interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token
 *
 * @param token - reCAPTCHA token from client
 * @param req - Request object (for IP address)
 * @param expectedAction - Expected action name (optional)
 * @returns Promise<boolean> - True if verification succeeds
 *
 * @example
 * const token = body.recaptcha_token;
 * const isValid = await verifyCaptcha(token, req, 'login');
 * if (!isValid) {
 *   throw new ApiError('CAPTCHA verification failed', 400);
 * }
 */
export async function verifyCaptcha(
  token: string | null | undefined,
  req: Request,
  expectedAction?: string
): Promise<boolean> {
  // Skip verification if disabled (development mode)
  if (!CAPTCHA_ENABLED) {
    console.log('[CAPTCHA] Verification disabled in environment');
    return true;
  }

  // Require token
  if (!token) {
    console.warn('[CAPTCHA] No token provided');
    return false;
  }

  // Require secret key
  if (!RECAPTCHA_SECRET || RECAPTCHA_SECRET === '') {
    console.error('[CAPTCHA] RECAPTCHA_SECRET_KEY not configured');
    throw new ApiError(
      'CAPTCHA verification not configured',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }

  try {
    // Get client IP address
    const remoteIp = req.headers.get('X-Forwarded-For')?.split(',')[0].trim()
      || req.headers.get('X-Real-IP')
      || 'unknown';

    // Call Google reCAPTCHA verify API
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
        remoteip: remoteIp,
      }),
    });

    if (!response.ok) {
      console.error('[CAPTCHA] Verification API error:', response.status);
      return false;
    }

    const data: RecaptchaResponse = await response.json();

    // Check if verification succeeded
    if (!data.success) {
      console.warn('[CAPTCHA] Verification failed:', data['error-codes']);
      return false;
    }

    // For reCAPTCHA v3, check score
    if (data.score !== undefined) {
      if (data.score < RECAPTCHA_MIN_SCORE) {
        console.warn(`[CAPTCHA] Score too low: ${data.score} < ${RECAPTCHA_MIN_SCORE}`);
        return false;
      }
    }

    // Optionally verify action matches
    if (expectedAction && data.action !== expectedAction) {
      console.warn(`[CAPTCHA] Action mismatch: ${data.action} !== ${expectedAction}`);
      return false;
    }

    console.log(`[CAPTCHA] Verification successful (score: ${data.score}, action: ${data.action})`);
    return true;
  } catch (error) {
    console.error('[CAPTCHA] Verification error:', error);
    return false;
  }
}

/**
 * Verify CAPTCHA and throw if invalid
 * Convenience wrapper for common use case
 *
 * @param token - reCAPTCHA token
 * @param req - Request object
 * @param action - Expected action
 * @throws ApiError if verification fails
 */
export async function requireCaptcha(
  token: string | null | undefined,
  req: Request,
  action?: string
): Promise<void> {
  const isValid = await verifyCaptcha(token, req, action);

  if (!isValid) {
    throw new ApiError(
      'CAPTCHA verification failed. Please try again.',
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }
}

/**
 * Check if CAPTCHA is enabled
 */
export function isCaptchaEnabled(): boolean {
  return CAPTCHA_ENABLED;
}

/**
 * Get CAPTCHA configuration for client
 * Returns site key and enabled status
 */
export function getCaptchaConfig(): {
  enabled: boolean;
  siteKey: string | null;
} {
  return {
    enabled: CAPTCHA_ENABLED,
    siteKey: Deno.env.get('RECAPTCHA_SITE_KEY') || null,
  };
}
