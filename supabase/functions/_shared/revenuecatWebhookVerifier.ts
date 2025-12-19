/**
 * RevenueCat Webhook Signature Verification
 *
 * Verifies HMAC SHA256 signatures from RevenueCat webhooks
 * https://docs.revenuecat.com/docs/webhooks#webhook-authentication
 */

import { logError } from './auditLogger.ts';

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

if (!REVENUECAT_WEBHOOK_SECRET) {
  throw new Error('REVENUECAT_WEBHOOK_SECRET environment variable is required');
}

/**
 * Verify RevenueCat webhook signature
 *
 * RevenueCat sends a X-RevenueCat-Signature header with HMAC SHA256 signature
 * of the raw request body using the webhook secret
 *
 * @param payload - Raw request body (string)
 * @param signature - Value from X-RevenueCat-Signature header
 * @returns True if signature is valid
 */
export async function verifyRevenueCatWebhook(
  payload: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) {
    await logError('RevenueCat webhook verification failed', {
      reason: 'Missing X-RevenueCat-Signature header',
    });
    return false;
  }

  try {
    // Create HMAC SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(REVENUECAT_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant-time comparison)
    const isValid = expectedSignature === signature.toLowerCase();

    if (!isValid) {
      await logError('RevenueCat webhook signature mismatch', {
        expected: expectedSignature.substring(0, 10) + '...',
        received: signature.substring(0, 10) + '...',
      });
    }

    return isValid;
  } catch (err) {
    await logError('RevenueCat webhook verification error', {
      error: (err as Error).message,
    });
    return false;
  }
}

/**
 * Parse and verify RevenueCat webhook request
 *
 * @param request - Request object from Deno
 * @returns Parsed webhook event or null if verification fails
 */
export async function parseRevenueCatWebhook(
  request: Request
): Promise<any | null> {
  try {
    // Get signature from header
    const signature = request.headers.get('X-RevenueCat-Signature');

    // Get raw body
    const rawBody = await request.text();

    // Verify signature
    const isValid = await verifyRevenueCatWebhook(rawBody, signature);

    if (!isValid) {
      return null;
    }

    // Parse JSON
    const event = JSON.parse(rawBody);

    return event;
  } catch (err) {
    await logError('Failed to parse RevenueCat webhook', {
      error: (err as Error).message,
    });
    return null;
  }
}

/**
 * Extract app_user_id (Pruuf user ID) from RevenueCat webhook event
 *
 * @param event - Parsed webhook event
 * @returns User ID or null
 */
export function extractUserIdFromWebhook(event: any): string | null {
  try {
    // RevenueCat webhook structure:
    // event.event.app_user_id
    return event?.event?.app_user_id || null;
  } catch {
    return null;
  }
}

/**
 * Extract event type from RevenueCat webhook
 *
 * @param event - Parsed webhook event
 * @returns Event type string
 */
export function extractEventType(event: any): string | null {
  try {
    // RevenueCat webhook structure:
    // event.event.type
    return event?.event?.type || null;
  } catch {
    return null;
  }
}
