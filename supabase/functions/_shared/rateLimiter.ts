/**
 * Rate Limiting Middleware
 * Implements tiered rate limits to prevent API abuse and control costs
 *
 * Usage:
 *   const rateLimitResult = await checkRateLimit(req, user, 'auth');
 *   if (rateLimitResult.isRateLimited) {
 *     return rateLimitResult.errorResponse;
 *   }
 */

import { getSupabaseClient } from './db.ts';
import { errorResponse } from './errors.ts';

/**
 * Rate limit configuration for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints (prevent brute force attacks)
  auth: {
    maxRequests: 10,
    windowMinutes: 1,
    description: 'Auth endpoints (login, verify code, etc.)',
  },

  // SMS endpoints (prevent cost abuse - Twilio charges per SMS)
  sms: {
    maxRequests: 5,
    windowMinutes: 1,
    description: 'SMS endpoints (send verification, alerts, etc.)',
  },

  // Check-in endpoints (prevent spam)
  checkin: {
    maxRequests: 10,
    windowMinutes: 1,
    description: 'Check-in endpoints',
  },

  // Payment endpoints (prevent duplicate subscription attempts)
  payment: {
    maxRequests: 5,
    windowMinutes: 1,
    description: 'Payment endpoints (create subscription, etc.)',
  },

  // Read endpoints (GET requests)
  read: {
    maxRequests: 100,
    windowMinutes: 1,
    description: 'Read-only endpoints (GET requests)',
  },

  // Write endpoints (POST/PUT/PATCH/DELETE requests)
  write: {
    maxRequests: 30,
    windowMinutes: 1,
    description: 'Write endpoints (POST/PUT/PATCH/DELETE)',
  },

  // Default (fallback)
  default: {
    maxRequests: 60,
    windowMinutes: 1,
    description: 'Default rate limit',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getIdentifier(req: Request, user?: { id: string } | null): string {
  // Prefer user ID if authenticated
  if (user?.id) {
    return `user:${user.id}`;
  }

  // Fallback to IP address
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Generate bucket ID for rate limiting
 */
function generateBucketId(
  identifier: string,
  limitType: RateLimitType,
  windowStart: Date
): string {
  const timestamp = Math.floor(windowStart.getTime() / 1000);
  return `${identifier}:${limitType}:${timestamp}`;
}

/**
 * Check if request exceeds rate limit
 *
 * @param req - Request object
 * @param user - Authenticated user (null if unauthenticated)
 * @param limitType - Type of rate limit to apply
 * @returns Object with isRateLimited flag and optional errorResponse
 */
export async function checkRateLimit(
  req: Request,
  user?: { id: string } | null,
  limitType: RateLimitType = 'default'
): Promise<{
  isRateLimited: boolean;
  errorResponse?: Response;
  remainingRequests?: number;
  resetTime?: Date;
}> {
  try {
    // Get rate limit config
    const config = RATE_LIMITS[limitType];

    // Get identifier (user ID or IP)
    const identifier = getIdentifier(req, user);

    // Calculate current window
    const now = new Date();
    const windowMs = config.windowMinutes * 60 * 1000;
    const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
    const windowEnd = new Date(windowStart.getTime() + windowMs);

    // Generate bucket ID
    const bucketId = generateBucketId(identifier, limitType, windowStart);

    // Get or create rate limit bucket
    const supabase = getSupabaseClient();

    // Try to get existing bucket
    const { data: existingBucket, error: fetchError } = await supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('id', bucketId)
      .gte('window_end', now.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Database error (not "not found") - fail open
      console.error('Rate limit check error:', fetchError);
      return { isRateLimited: false };
    }

    let currentCount = 0;

    if (existingBucket) {
      // Bucket exists, check count
      currentCount = existingBucket.request_count;

      if (currentCount >= config.maxRequests) {
        // Rate limit exceeded
        console.log(
          `Rate limit exceeded for ${identifier} on ${limitType}: ${currentCount}/${config.maxRequests}`
        );

        return {
          isRateLimited: true,
          errorResponse: new Response(
            JSON.stringify({
              success: false,
              error: 'RATE_LIMIT_EXCEEDED',
              message: `Too many requests. Limit: ${config.maxRequests} requests per ${config.windowMinutes} minute(s).`,
              limit: config.maxRequests,
              window_minutes: config.windowMinutes,
              reset_time: windowEnd.toISOString(),
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': String(config.maxRequests),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.floor(windowEnd.getTime() / 1000)),
                'Retry-After': String(
                  Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)
                ),
              },
            }
          ),
          remainingRequests: 0,
          resetTime: windowEnd,
        };
      }

      // Increment count
      currentCount++;

      await supabase
        .from('rate_limit_buckets')
        .update({
          request_count: currentCount,
          updated_at: now.toISOString(),
        })
        .eq('id', bucketId);
    } else {
      // Create new bucket
      currentCount = 1;

      await supabase.from('rate_limit_buckets').insert({
        id: bucketId,
        request_count: 1,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
      });
    }

    // Request allowed
    return {
      isRateLimited: false,
      remainingRequests: config.maxRequests - currentCount,
      resetTime: windowEnd,
    };
  } catch (error) {
    // On error, fail open (allow request)
    console.error('Rate limiting error:', error);
    return { isRateLimited: false };
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  remainingRequests?: number,
  resetTime?: Date,
  limit?: number
): Response {
  if (remainingRequests !== undefined && resetTime && limit) {
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(limit));
    headers.set('X-RateLimit-Remaining', String(remainingRequests));
    headers.set('X-RateLimit-Reset', String(Math.floor(resetTime.getTime() / 1000)));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}

/**
 * Cleanup expired rate limit buckets
 * Should be called by a cron job periodically (e.g., hourly)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('cleanup_expired_rate_limits');

  if (error) {
    console.error('Error cleaning up expired rate limits:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Get current rate limit status for debugging
 */
export async function getRateLimitStatus(
  identifier: string,
  limitType: RateLimitType
): Promise<{
  currentCount: number;
  maxRequests: number;
  resetTime: Date;
} | null> {
  try {
    const config = RATE_LIMITS[limitType];
    const now = new Date();
    const windowMs = config.windowMinutes * 60 * 1000;
    const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
    const windowEnd = new Date(windowStart.getTime() + windowMs);

    const bucketId = generateBucketId(identifier, limitType, windowStart);

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('id', bucketId)
      .single();

    if (error || !data) {
      return {
        currentCount: 0,
        maxRequests: config.maxRequests,
        resetTime: windowEnd,
      };
    }

    return {
      currentCount: data.request_count,
      maxRequests: config.maxRequests,
      resetTime: new Date(data.window_end),
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return null;
  }
}
