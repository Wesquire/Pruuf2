/**
 * Webhook Signature Verification
 * Verifies webhook requests are from trusted sources (Stripe, etc.)
 *
 * Usage:
 *   const isValid = await verifyStripeSignature(req, body, signature);
 *   if (!isValid) throw new Error('Invalid signature');
 */

/**
 * Verify Stripe webhook signature
 * Uses HMAC SHA256 to verify webhook authenticity
 *
 * @param payload - Raw request body (string)
 * @param signature - Stripe-Signature header value
 * @param secret - Webhook signing secret from Stripe dashboard
 * @returns Promise<boolean> - True if signature is valid
 *
 * @example
 * const signature = req.headers.get('stripe-signature');
 * const body = await req.text();
 * const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
 */
export async function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    // Parse Stripe signature header
    // Format: t=1234567890,v1=signature_hash,v0=old_signature_hash
    const elements = signature.split(',');
    const timestampElement = elements.find(e => e.startsWith('t='));
    const signatureElement = elements.find(e => e.startsWith('v1='));

    if (!timestampElement || !signatureElement) {
      return false;
    }

    const timestamp = timestampElement.split('=')[1];
    const expectedSignature = signatureElement.split('=')[1];

    // Check timestamp is within tolerance (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const timestampNumber = parseInt(timestamp, 10);

    if (Math.abs(currentTime - timestampNumber) > 300) {
      console.warn('Stripe webhook timestamp too old or in future');
      return false;
    }

    // Construct signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Compute expected signature using HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(signedPayload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      {name: 'HMAC', hash: 'SHA-256'},
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);

    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant-time comparison)
    return secureCompare(computedSignature, expectedSignature);
  } catch (error) {
    console.error('Stripe signature verification error:', error);
    return false;
  }
}

/**
 * Secure string comparison (constant-time to prevent timing attacks)
 *
 * @param a - First string
 * @param b - Second string
 * @returns boolean - True if strings are equal
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generic webhook signature verifier
 * Supports custom HMAC algorithms
 *
 * @param payload - Raw request body
 * @param signature - Signature from header
 * @param secret - Signing secret
 * @param algorithm - HMAC algorithm ('SHA-256', 'SHA-1', 'SHA-512')
 * @returns Promise<boolean> - True if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string,
  algorithm: 'SHA-256' | 'SHA-1' | 'SHA-512' = 'SHA-256',
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      {name: 'HMAC', hash: algorithm},
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);

    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Remove common signature prefixes
    const cleanSignature = signature.replace(/^(sha256=|sha1=|sha512=)/i, '');

    return secureCompare(computedSignature, cleanSignature);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Verify webhook with bearer token
 * Simple token-based authentication
 *
 * @param authHeader - Authorization header value
 * @param expectedToken - Expected bearer token
 * @returns boolean - True if token is valid
 */
export function verifyBearerToken(
  authHeader: string | null,
  expectedToken: string,
): boolean {
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return secureCompare(token, expectedToken);
}
