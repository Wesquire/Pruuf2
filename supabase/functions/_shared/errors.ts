/**
 * Error handling utilities for Supabase Edge Functions
 */

import { ApiError, ApiResponse } from './types.ts';

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Authentication errors (1xxx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  ACCESS_DENIED: 'ACCESS_DENIED',

  // Validation errors (2xxx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_PIN: 'INVALID_PIN',
  INVALID_CODE: 'INVALID_CODE',
  CODE_EXPIRED: 'CODE_EXPIRED',
  CODE_USED: 'CODE_USED',
  MAX_ATTEMPTS_EXCEEDED: 'MAX_ATTEMPTS_EXCEEDED',
  INVALID_TIMEZONE: 'INVALID_TIMEZONE',
  INVALID_TIME_FORMAT: 'INVALID_TIME_FORMAT',

  // Resource errors (3xxx)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_RELATIONSHIP: 'DUPLICATE_RELATIONSHIP',
  SELF_RELATIONSHIP: 'SELF_RELATIONSHIP',
  SELF_INVITE: 'SELF_INVITE',

  // Business logic errors (4xxx)
  ONBOARDING_INCOMPLETE: 'ONBOARDING_INCOMPLETE',
  ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
  CHECK_IN_TIME_NOT_SET: 'CHECK_IN_TIME_NOT_SET',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_NOT_REQUIRED: 'PAYMENT_NOT_REQUIRED',
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  NOT_MEMBER: 'NOT_MEMBER',
  GRANDFATHERED_FREE: 'GRANDFATHERED_FREE',
  MEMBER_NO_PAYMENT: 'MEMBER_NO_PAYMENT',
  ALREADY_CANCELED: 'ALREADY_CANCELED',

  // Rate limiting (5xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors (9xxx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SMS_ERROR: 'SMS_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  PUSH_NOTIFICATION_ERROR: 'PUSH_NOTIFICATION_ERROR',
};

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 400,
  code?: string
): Response {
  const body: ApiResponse = {
    success: false,
    error: message,
    ...(code && { code }),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Create a success response
 */
export function successResponse<T = any>(
  data?: T,
  statusCode: number = 200,
  message?: string
): Response {
  const body: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Handle errors in Edge Functions
 */
export function handleError(error: unknown): Response {
  console.error('Edge Function Error:', error);

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('JWT')) {
      return errorResponse(
        'Invalid or expired token',
        401,
        ErrorCodes.INVALID_TOKEN
      );
    }

    if (error.message.includes('duplicate key')) {
      return errorResponse(
        'Resource already exists',
        409,
        ErrorCodes.ALREADY_EXISTS
      );
    }

    if (error.message.includes('foreign key')) {
      return errorResponse(
        'Referenced resource not found',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // Generic error
    return errorResponse(error.message, 500, ErrorCodes.INTERNAL_ERROR);
  }

  // Unknown error
  return errorResponse(
    'An unexpected error occurred',
    500,
    ErrorCodes.INTERNAL_ERROR
  );
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  body: any,
  fields: string[]
): void {
  const missing = fields.filter(field => !body[field]);

  if (missing.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }
}

/**
 * Validate phone number format (E.164)
 */
export function validatePhone(phone: string): void {
  const phoneRegex = /^\+1\d{10}$/;

  if (!phoneRegex.test(phone)) {
    throw new ApiError(
      'Invalid phone number format. Must be E.164 format: +1XXXXXXXXXX',
      400,
      ErrorCodes.INVALID_PHONE
    );
  }
}

/**
 * Validate PIN format (4 digits)
 */
export function validatePin(pin: string): void {
  const pinRegex = /^\d{4}$/;

  if (!pinRegex.test(pin)) {
    throw new ApiError(
      'Invalid PIN format. Must be exactly 4 digits',
      400,
      ErrorCodes.INVALID_PIN
    );
  }
}

/**
 * Validate verification code format (6 digits)
 */
export function validateVerificationCode(code: string): void {
  const codeRegex = /^\d{6}$/;

  if (!codeRegex.test(code)) {
    throw new ApiError(
      'Invalid verification code format. Must be exactly 6 digits',
      400,
      ErrorCodes.INVALID_CODE
    );
  }
}

/**
 * Validate invite code format (6 uppercase alphanumeric)
 */
export function validateInviteCode(code: string): void {
  const codeRegex = /^[A-Z0-9]{6}$/;

  if (!codeRegex.test(code)) {
    throw new ApiError(
      'Invalid invite code format. Must be 6 uppercase alphanumeric characters',
      400,
      ErrorCodes.INVALID_CODE
    );
  }
}

/**
 * Validate time format (HH:MM)
 */
export function validateTimeFormat(time: string): void {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timeRegex.test(time)) {
    throw new ApiError(
      'Invalid time format. Must be HH:MM (24-hour)',
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }
}

/**
 * Validate timezone (basic check)
 */
export function validateTimezone(timezone: string): void {
  // Basic validation - check if it looks like a valid timezone
  if (!timezone || timezone.length < 3 || !timezone.includes('/')) {
    throw new ApiError(
      'Invalid timezone format. Must be IANA timezone format (e.g., America/New_York)',
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }
}
