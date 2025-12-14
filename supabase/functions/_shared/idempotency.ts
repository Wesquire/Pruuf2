/**
 * Idempotency Key Middleware
 * Prevents duplicate payment operations from network retries or user double-taps
 *
 * Usage:
 *   const { shouldProcessRequest, idempotencyKey, cachedResponse } =
 *     await checkIdempotencyKey(req, body);
 *
 *   if (!shouldProcessRequest) {
 *     return cachedResponse;
 *   }
 *
 *   // Process request...
 *   const response = ...;
 *
 *   await storeIdempotencyKey(idempotencyKey, body, response);
 */

import {getSupabaseClient} from './db.ts';
import {errorResponse} from './errors.ts';

/**
 * Generate SHA-256 hash of request body
 * Used to detect if the same idempotency key is used with different request data
 */
async function hashRequestBody(body: any): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if idempotency key exists and return cached response if valid
 *
 * @param req - Request object
 * @param body - Request body (already parsed JSON)
 * @returns Object with shouldProcessRequest flag, idempotencyKey, and cachedResponse
 */
export async function checkIdempotencyKey(
  req: Request,
  body: any,
): Promise<{
  shouldProcessRequest: boolean;
  idempotencyKey: string | null;
  cachedResponse: Response | null;
}> {
  // Extract idempotency key from header
  const idempotencyKey = req.headers.get('idempotency-key');

  // If no idempotency key provided, process request normally
  if (!idempotencyKey) {
    return {
      shouldProcessRequest: true,
      idempotencyKey: null,
      cachedResponse: null,
    };
  }

  // Validate idempotency key format (should be UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(idempotencyKey)) {
    return {
      shouldProcessRequest: false,
      idempotencyKey: null,
      cachedResponse: errorResponse(
        'Invalid Idempotency-Key format. Must be a valid UUID.',
        400,
      ),
    };
  }

  // Hash the request body
  const requestHash = await hashRequestBody(body);

  // Check if idempotency key exists in database
  const supabase = getSupabaseClient();
  const {data: existingKey, error} = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('key', idempotencyKey)
    .gte('expires_at', new Date().toISOString()) // Only fetch non-expired keys
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is fine
    console.error('Error checking idempotency key:', error);
    // On database error, proceed with request (fail open)
    return {
      shouldProcessRequest: true,
      idempotencyKey,
      cachedResponse: null,
    };
  }

  // If key exists
  if (existingKey) {
    // Check if request body matches
    if (existingKey.request_hash !== requestHash) {
      // Same key, different request - this is an error
      return {
        shouldProcessRequest: false,
        idempotencyKey: null,
        cachedResponse: errorResponse(
          'Idempotency key already used with a different request. Use a new key or retry with the same request.',
          409,
        ),
      };
    }

    // Same key, same request - return cached response
    console.log(
      `Idempotency key matched: ${idempotencyKey}. Returning cached response.`,
    );

    return {
      shouldProcessRequest: false,
      idempotencyKey: null,
      cachedResponse: new Response(JSON.stringify(existingKey.response_data), {
        status: existingKey.status_code,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Replay': 'true', // Indicate this is a cached response
        },
      }),
    };
  }

  // Key doesn't exist - proceed with request
  return {
    shouldProcessRequest: true,
    idempotencyKey,
    cachedResponse: null,
  };
}

/**
 * Store idempotency key with response data for future deduplication
 *
 * @param idempotencyKey - The idempotency key from the request header
 * @param requestBody - Original request body
 * @param response - Response object to cache
 */
export async function storeIdempotencyKey(
  idempotencyKey: string | null,
  requestBody: any,
  response: Response,
): Promise<void> {
  // If no idempotency key, nothing to store
  if (!idempotencyKey) {
    return;
  }

  // Only store successful responses (2xx status codes)
  if (response.status < 200 || response.status >= 300) {
    console.log(
      `Not storing idempotency key for non-success status: ${response.status}`,
    );
    return;
  }

  try {
    // Clone response to read body without consuming original
    const responseClone = response.clone();
    const responseData = await responseClone.json();

    // Hash the request body
    const requestHash = await hashRequestBody(requestBody);

    // Store in database
    const supabase = getSupabaseClient();
    const {error} = await supabase.from('idempotency_keys').insert({
      key: idempotencyKey,
      request_hash: requestHash,
      response_data: responseData,
      status_code: response.status,
    });

    if (error) {
      console.error('Error storing idempotency key:', error);
      // Don't fail the request if we can't store the key
    } else {
      console.log(`Stored idempotency key: ${idempotencyKey}`);
    }
  } catch (err) {
    console.error('Error processing idempotency key storage:', err);
    // Don't fail the request if we can't store the key
  }
}

/**
 * Cleanup expired idempotency keys
 * Should be called by a cron job periodically (e.g., daily)
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase.rpc('cleanup_expired_idempotency_keys');

  if (error) {
    console.error('Error cleaning up expired idempotency keys:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Generate a UUID v4 for use as an idempotency key
 * This is a helper function for testing or client-side generation
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
