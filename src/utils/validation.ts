/**
 * Form Validation Schemas
 * Yup validation schemas for all forms
 */

import * as yup from 'yup';

/**
 * Verification code validation
 */
export const verificationCodeSchema = yup.object({
  code: yup
    .string()
    .required('Verification code is required')
    .length(6, 'Code must be 6 digits')
    .matches(/^\d+$/, 'Code must contain only numbers'),
});

/**
 * PIN validation
 */
export const pinSchema = yup.object({
  pin: yup
    .string()
    .required('PIN is required')
    .length(4, 'PIN must be 4 digits')
    .matches(/^\d+$/, 'PIN must contain only numbers'),
});

/**
 * PIN confirmation validation
 */
export const confirmPinSchema = yup.object({
  pin: yup
    .string()
    .required('PIN is required')
    .length(4, 'PIN must be 4 digits')
    .matches(/^\d+$/, 'PIN must contain only numbers'),
  confirmPin: yup
    .string()
    .required('Please confirm your PIN')
    .oneOf([yup.ref('pin')], "PINs don't match"),
});

/**
 * Member invitation validation
 */
export const inviteMemberSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

/**
 * Invite code validation
 */
export const inviteCodeSchema = yup.object({
  code: yup
    .string()
    .required('Invite code is required')
    .length(6, 'Code must be 6 characters')
    .matches(/^[A-Z0-9]+$/i, 'Invalid code format'),
});

/**
 * Check-in time validation
 */
export const checkInTimeSchema = yup.object({
  time: yup
    .string()
    .required('Check-in time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timezone: yup.string().required('Timezone is required'),
  reminderEnabled: yup.boolean(),
});

/**
 * Helper: Validate a value against a schema
 */
export async function validateField<T>(
  schema: yup.Schema<T>,
  value: any,
): Promise<{isValid: boolean; error?: string}> {
  try {
    await schema.validate(value);
    return {isValid: true};
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return {isValid: false, error: error.message};
    }
    return {isValid: false, error: 'Validation error'};
  }
}

/**
 * Simple PIN format validation
 * Checks if PIN is exactly 4 digits
 */
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Simple email format validation
 * Basic check for email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
