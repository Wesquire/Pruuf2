/**
 * Authentication middleware and JWT utilities for Supabase Edge Functions
 */

import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { ApiError, ErrorCodes } from './errors.ts';
import { getUserById } from './db.ts';
import type { JwtPayload, User } from './types.ts';

// JWT secret key (must be at least 32 characters)
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-must-be-at-least-32-characters-long';
const JWT_EXPIRATION_DAYS = 90;

/**
 * Hash a PIN using bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pin, salt);
}

/**
 * Verify a PIN against a hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash);
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
  const payload: JwtPayload = {
    user_id: user.id,
    phone: user.phone,
    iat: getNumericDate(new Date()),
    exp: getNumericDate(new Date(Date.now() + JWT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)),
  };

  // Create a crypto key from the secret
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  return await create({ alg: 'HS256', typ: 'JWT' }, payload, key);
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    // Create a crypto key from the secret
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const payload = await verify(token, key);
    return payload as unknown as JwtPayload;
  } catch (error) {
    throw new ApiError(
      'Invalid or expired token',
      401,
      ErrorCodes.INVALID_TOKEN
    );
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Authenticate a request and return the user
 */
export async function authenticateRequest(request: Request): Promise<User> {
  const token = extractToken(request);

  if (!token) {
    throw new ApiError(
      'Missing authentication token',
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }

  const payload = await verifyToken(token);

  const user = await getUserById(payload.user_id);

  if (!user) {
    throw new ApiError(
      'User not found',
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }

  // Check if account is deleted
  if (user.deleted_at) {
    throw new ApiError(
      'Account has been deleted',
      403,
      ErrorCodes.ACCOUNT_DELETED
    );
  }

  // Check if account is frozen
  if (user.account_status === 'frozen') {
    throw new ApiError(
      'Account is frozen due to unpaid subscription',
      403,
      ErrorCodes.ACCOUNT_FROZEN
    );
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60
    );
    throw new ApiError(
      `Account is locked. Try again in ${minutesRemaining} minutes`,
      403,
      ErrorCodes.ACCOUNT_LOCKED
    );
  }

  return user;
}

/**
 * Optional authentication - returns user if token is valid, null otherwise
 */
export async function optionalAuth(request: Request): Promise<User | null> {
  try {
    return await authenticateRequest(request);
  } catch (error) {
    return null;
  }
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a session token (temporary token for multi-step auth)
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify session token (simple implementation - should use Redis in production)
 */
const sessionTokens = new Map<string, { phone: string; expires: Date }>();

export function createSessionToken(phone: string, expiresInMinutes: number = 10): string {
  const token = generateSessionToken();
  const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  sessionTokens.set(token, { phone, expires });

  // Clean up expired tokens
  for (const [key, value] of sessionTokens.entries()) {
    if (value.expires < new Date()) {
      sessionTokens.delete(key);
    }
  }

  return token;
}

export function validateSessionToken(token: string): string | null {
  const session = sessionTokens.get(token);

  if (!session) {
    return null;
  }

  if (session.expires < new Date()) {
    sessionTokens.delete(token);
    return null;
  }

  return session.phone;
}

export function invalidateSessionToken(token: string): void {
  sessionTokens.delete(token);
}

/**
 * Check failed login attempts and handle account locking
 */
export async function handleFailedLogin(user: User): Promise<void> {
  const newAttempts = user.failed_login_attempts + 1;

  if (newAttempts >= 5) {
    // Lock account for 30 minutes
    const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);

    const { updateUser } = await import('./db.ts');
    await updateUser(user.id, {
      failed_login_attempts: newAttempts,
      locked_until: lockedUntil.toISOString(),
    } as Partial<User>);

    throw new ApiError(
      'Too many failed login attempts. Account locked for 30 minutes',
      403,
      ErrorCodes.ACCOUNT_LOCKED
    );
  } else {
    const { updateUser } = await import('./db.ts');
    await updateUser(user.id, {
      failed_login_attempts: newAttempts,
    } as Partial<User>);

    throw new ApiError(
      `Invalid PIN. ${5 - newAttempts} attempts remaining`,
      401,
      ErrorCodes.INVALID_CREDENTIALS
    );
  }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLoginAttempts(user: User): Promise<void> {
  if (user.failed_login_attempts > 0 || user.locked_until) {
    const { updateUser } = await import('./db.ts');
    await updateUser(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
    } as Partial<User>);
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null;
}
