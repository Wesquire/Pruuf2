/**
 * API Request Signing with HMAC-SHA256
 *
 * Prevents request tampering by signing requests with a shared secret.
 * Client and server both generate signature from request data + secret.
 * Server verifies signature matches before processing request.
 *
 * Usage (Server):
 *   const isValid = await verifyRequestSignature(req);
 *   if (!isValid) throw new ApiError('Invalid signature');
 *
 * Usage (Client):
 *   const signature = generateSignature(method, path, timestamp, body, secret);
 *   headers['X-Signature'] = signature;
 *   headers['X-Timestamp'] = timestamp;
 */

import { ApiError, ErrorCodes } from './errors.ts';

// Signing secret key (from environment)
const SIGNING_SECRET = Deno.env.get('API_SIGNING_SECRET') || '';

// Enable/disable request signing
const SIGNING_ENABLED = Deno.env.get('API_SIGNING_ENABLED') !== 'false';

// Maximum age for signed requests (prevents replay attacks)
const MAX_REQUEST_AGE_MS = parseInt(Deno.env.get('API_SIGNATURE_MAX_AGE') || '300000'); // 5 minutes

/**
 * Generate HMAC-SHA256 signature for request
 *
 * Signature input format:
 *   METHOD\nPATH\nTIMESTAMP\nBODY
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Request path (/api/auth/login)
 * @param timestamp - Unix timestamp in milliseconds
 * @param body - Request body (empty string for GET)
 * @param secret - Signing secret key
 * @returns HMAC-SHA256 signature (hex encoded)
 *
 * @example
 * const signature = await generateSignature(
 *   'POST',
 *   '/api/auth/login',
 *   Date.now().toString(),
 *   '{"phone":"+1234567890","pin":"1234"}',
 *   'my-secret-key'
 * );
 * // Returns: "a1b2c3d4e5f6..."
 */
export async function generateSignature(
  method: string,
  path: string,
  timestamp: string,
  body: string,
  secret: string
): Promise<string> {
  // Construct signature payload
  const payload = `${method.toUpperCase()}\n${path}\n${timestamp}\n${body}`;

  // Encode payload and secret as UTF-8
  const encoder = new TextEncoder();
  const payloadData = encoder.encode(payload);
  const secretData = encoder.encode(secret);

  // Import secret key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Generate HMAC signature
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);

  // Convert to hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex;
}

/**
 * Verify request signature
 *
 * Checks:
 * 1. Signature header present
 * 2. Timestamp header present and valid
 * 3. Request not too old (replay attack prevention)
 * 4. Signature matches expected value
 *
 * @param req - Request object
 * @param body - Request body (already parsed as string)
 * @returns Promise<boolean> - True if signature valid
 *
 * @throws ApiError if signing is enabled but signature missing/invalid
 *
 * @example
 * const bodyText = await req.text();
 * const isValid = await verifyRequestSignature(req, bodyText);
 * if (!isValid) {
 *   throw new ApiError('Invalid signature', 401);
 * }
 */
export async function verifyRequestSignature(
  req: Request,
  body: string = ''
): Promise<boolean> {
  // Skip verification if disabled (development mode)
  if (!SIGNING_ENABLED) {
    console.log('[Request Signing] Verification disabled in environment');
    return true;
  }

  // Require signing secret
  if (!SIGNING_SECRET || SIGNING_SECRET === '') {
    console.error('[Request Signing] API_SIGNING_SECRET not configured');
    throw new ApiError(
      'Request signing not configured',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }

  // Extract headers
  const providedSignature = req.headers.get('X-Signature');
  const timestamp = req.headers.get('X-Timestamp');

  // Require signature header
  if (!providedSignature) {
    console.warn('[Request Signing] No signature provided');
    return false;
  }

  // Require timestamp header
  if (!timestamp) {
    console.warn('[Request Signing] No timestamp provided');
    return false;
  }

  // Validate timestamp format
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    console.warn('[Request Signing] Invalid timestamp format:', timestamp);
    return false;
  }

  // Check request age (prevent replay attacks)
  const now = Date.now();
  const requestAge = now - timestampNum;

  if (requestAge < 0) {
    console.warn('[Request Signing] Timestamp in future:', timestamp);
    return false;
  }

  if (requestAge > MAX_REQUEST_AGE_MS) {
    console.warn(
      `[Request Signing] Request too old: ${requestAge}ms > ${MAX_REQUEST_AGE_MS}ms`
    );
    return false;
  }

  // Extract method and path
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  // Generate expected signature
  try {
    const expectedSignature = await generateSignature(
      method,
      path,
      timestamp,
      body,
      SIGNING_SECRET
    );

    // Constant-time comparison (prevent timing attacks)
    if (providedSignature.length !== expectedSignature.length) {
      console.warn('[Request Signing] Signature length mismatch');
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      mismatch |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
      console.warn('[Request Signing] Signature mismatch');
      return false;
    }

    console.log('[Request Signing] Verification successful');
    return true;
  } catch (error) {
    console.error('[Request Signing] Verification error:', error);
    return false;
  }
}

/**
 * Verify request signature and throw if invalid
 * Convenience wrapper for common use case
 *
 * @param req - Request object
 * @param body - Request body (already parsed as string)
 * @throws ApiError if verification fails
 *
 * @example
 * const bodyText = await req.text();
 * await requireRequestSignature(req, bodyText);
 * // If we get here, signature is valid
 */
export async function requireRequestSignature(
  req: Request,
  body: string = ''
): Promise<void> {
  const isValid = await verifyRequestSignature(req, body);

  if (!isValid) {
    throw new ApiError(
      'Invalid request signature. Request may have been tampered with.',
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }
}

/**
 * Check if request signing is enabled
 */
export function isSigningEnabled(): boolean {
  return SIGNING_ENABLED;
}

/**
 * Get signing configuration for client
 * Returns enabled status only (not secret)
 */
export function getSigningConfig(): {
  enabled: boolean;
  maxAge: number;
} {
  return {
    enabled: SIGNING_ENABLED,
    maxAge: MAX_REQUEST_AGE_MS,
  };
}
