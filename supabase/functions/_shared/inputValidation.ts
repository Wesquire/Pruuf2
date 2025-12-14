/**
 * Comprehensive Input Validation and Sanitization
 * Combines validation, sanitization, and normalization for secure input handling
 *
 * Usage:
 *   const validatedData = validateAndSanitizeInput(body, {
 *     phone: 'phone',
 *     name: 'text',
 *     email: 'email'
 *   });
 */

import {ApiError, ErrorCodes} from './errors.ts';
import {normalizePhoneNumber} from './phone.ts';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeBoolean,
  sanitizeUUID,
  sanitizeAlphanumeric,
  sanitizeSingleLine,
} from './sanitizer.ts';

/**
 * Input field types and their sanitization rules
 */
export type InputFieldType =
  | 'phone' // Phone number (E.164 normalized)
  | 'text' // General text (XSS protection, single line)
  | 'multiline' // Multi-line text (XSS protection)
  | 'email' // Email address
  | 'url' // URL
  | 'integer' // Integer number
  | 'float' // Float number
  | 'boolean' // Boolean value
  | 'uuid' // UUID
  | 'alphanumeric' // Alphanumeric only
  | 'pin' // 4-digit PIN
  | 'timezone'; // Timezone string

/**
 * Field validation schema
 */
export interface ValidationSchema {
  [fieldName: string]:
    | InputFieldType
    | {
        type: InputFieldType;
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: RegExp;
        custom?: (value: any) => boolean;
        errorMessage?: string;
      };
}

/**
 * Validate and sanitize input data according to schema
 *
 * @param data - Raw input data from request body
 * @param schema - Validation schema defining field types and rules
 * @returns Sanitized and validated data
 * @throws ApiError if validation fails
 *
 * @example
 * const validated = validateAndSanitizeInput(body, {
 *   phone: 'phone',
 *   name: { type: 'text', required: true, maxLength: 100 },
 *   email: 'email',
 *   age: { type: 'integer', min: 0, max: 150 }
 * });
 */
export function validateAndSanitizeInput(
  data: Record<string, any>,
  schema: ValidationSchema,
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [fieldName, fieldConfig] of Object.entries(schema)) {
    // Parse field configuration
    const config =
      typeof fieldConfig === 'string'
        ? {type: fieldConfig as InputFieldType, required: true}
        : {required: true, ...fieldConfig};

    const value = data[fieldName];

    // Check if field is required
    if (
      config.required &&
      (value === undefined || value === null || value === '')
    ) {
      throw new ApiError(
        config.errorMessage || `${fieldName} is required`,
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Skip optional fields that are missing
    if (!config.required && (value === undefined || value === null)) {
      continue;
    }

    // Sanitize based on type
    let sanitizedValue: any;

    try {
      switch (config.type) {
        case 'phone':
          sanitizedValue = sanitizePhone(value);
          break;

        case 'text':
          sanitizedValue = sanitizeTextInput(value, config.maxLength);
          break;

        case 'multiline':
          sanitizedValue = sanitizeText(value);
          if (config.maxLength && sanitizedValue.length > config.maxLength) {
            throw new ApiError(
              `${fieldName} must be at most ${config.maxLength} characters`,
              400,
              ErrorCodes.VALIDATION_ERROR,
            );
          }
          break;

        case 'email':
          sanitizedValue = sanitizeEmailInput(value);
          break;

        case 'url':
          sanitizedValue = sanitizeUrlInput(value);
          break;

        case 'integer':
          sanitizedValue = sanitizeIntegerInput(value, config.min, config.max);
          break;

        case 'float':
          sanitizedValue = sanitizeFloatInput(value, config.min, config.max);
          break;

        case 'boolean':
          sanitizedValue = sanitizeBoolean(value);
          break;

        case 'uuid':
          sanitizedValue = sanitizeUuidInput(value);
          break;

        case 'alphanumeric':
          sanitizedValue = sanitizeAlphanumeric(value);
          if (config.minLength && sanitizedValue.length < config.minLength) {
            throw new ApiError(
              `${fieldName} must be at least ${config.minLength} characters`,
              400,
              ErrorCodes.VALIDATION_ERROR,
            );
          }
          if (config.maxLength && sanitizedValue.length > config.maxLength) {
            throw new ApiError(
              `${fieldName} must be at most ${config.maxLength} characters`,
              400,
              ErrorCodes.VALIDATION_ERROR,
            );
          }
          break;

        case 'pin':
          sanitizedValue = sanitizePinInput(value);
          break;

        case 'timezone':
          sanitizedValue = sanitizeTimezoneInput(value);
          break;

        default:
          // Unknown type - treat as text
          sanitizedValue = sanitizeText(value);
      }

      // Apply custom validation if provided
      if (config.custom && !config.custom(sanitizedValue)) {
        throw new ApiError(
          config.errorMessage || `${fieldName} is invalid`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // Apply pattern validation if provided
      if (config.pattern && !config.pattern.test(sanitizedValue)) {
        throw new ApiError(
          config.errorMessage || `${fieldName} format is invalid`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      sanitized[fieldName] = sanitizedValue;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Invalid ${fieldName}: ${error.message}`,
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }
  }

  return sanitized;
}

/**
 * Sanitize phone number and normalize to E.164 format
 */
function sanitizePhone(value: any): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'Phone number must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const normalized = normalizePhoneNumber(value);

  if (!normalized.success) {
    throw new ApiError(
      normalized.error || 'Invalid phone number',
      400,
      ErrorCodes.INVALID_PHONE,
    );
  }

  return normalized.formatted;
}

/**
 * Sanitize text input (single line, XSS protection)
 */
function sanitizeTextInput(value: any, maxLength?: number): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'Text must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const sanitized = sanitizeSingleLine(value);

  if (sanitized.length === 0) {
    throw new ApiError(
      'Text cannot be empty',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  if (maxLength && sanitized.length > maxLength) {
    throw new ApiError(
      `Text must be at most ${maxLength} characters`,
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  return sanitized;
}

/**
 * Sanitize email input
 */
function sanitizeEmailInput(value: any): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'Email must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const sanitized = sanitizeEmail(value);

  if (!sanitized) {
    throw new ApiError(
      'Invalid email address',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  return sanitized;
}

/**
 * Sanitize URL input
 */
function sanitizeUrlInput(value: any): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'URL must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const sanitized = sanitizeUrl(value);

  if (!sanitized) {
    throw new ApiError('Invalid URL', 400, ErrorCodes.VALIDATION_ERROR);
  }

  return sanitized;
}

/**
 * Sanitize integer input
 */
function sanitizeIntegerInput(value: any, min?: number, max?: number): number {
  const sanitized = sanitizeInteger(value, {min, max});

  if (sanitized === null) {
    throw new ApiError('Invalid integer', 400, ErrorCodes.VALIDATION_ERROR);
  }

  return sanitized;
}

/**
 * Sanitize float input
 */
function sanitizeFloatInput(value: any, min?: number, max?: number): number {
  const sanitized = sanitizeFloat(value, {min, max});

  if (sanitized === null) {
    throw new ApiError('Invalid number', 400, ErrorCodes.VALIDATION_ERROR);
  }

  return sanitized;
}

/**
 * Sanitize UUID input
 */
function sanitizeUuidInput(value: any): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'UUID must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const sanitized = sanitizeUUID(value);

  if (!sanitized) {
    throw new ApiError('Invalid UUID', 400, ErrorCodes.VALIDATION_ERROR);
  }

  return sanitized;
}

/**
 * Sanitize PIN input (4 digits)
 */
function sanitizePinInput(value: any): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'PIN must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const sanitized = sanitizeAlphanumeric(value);

  if (!/^\d{4}$/.test(sanitized)) {
    throw new ApiError(
      'PIN must be exactly 4 digits',
      400,
      ErrorCodes.INVALID_PIN,
    );
  }

  return sanitized;
}

/**
 * Sanitize timezone input
 */
function sanitizeTimezoneInput(value: any): string {
  if (typeof value !== 'string') {
    throw new ApiError(
      'Timezone must be a string',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  const sanitized = sanitizeText(value);

  // Basic timezone format validation (e.g., "America/New_York")
  if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(sanitized)) {
    throw new ApiError(
      'Invalid timezone format',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  return sanitized;
}

/**
 * Quick validation helpers for common use cases
 */

export function validatePhone(phone: any): string {
  return sanitizePhone(phone);
}

export function validateEmail(email: any): string {
  return sanitizeEmailInput(email);
}

export function validateText(text: any, maxLength?: number): string {
  return sanitizeTextInput(text, maxLength);
}

export function validateInteger(
  value: any,
  min?: number,
  max?: number,
): number {
  return sanitizeIntegerInput(value, min, max);
}

export function validateBoolean(value: any): boolean {
  const result = sanitizeBoolean(value);
  if (result === null) {
    throw new ApiError(
      'Invalid boolean value',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }
  return result;
}

export function validateUUID(uuid: any): string {
  return sanitizeUuidInput(uuid);
}

export function validatePin(pin: any): string {
  return sanitizePinInput(pin);
}
