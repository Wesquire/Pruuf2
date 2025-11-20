/**
 * Form Validation Schemas
 * Yup validation schemas for all forms
 */

import * as yup from 'yup';

/**
 * Phone number validation
 */
export const phoneSchema = yup.object({
  phone: yup
    .string()
    .required('Phone number is required')
    .test('valid-phone', 'Please enter a valid 10-digit phone number', value => {
      if (!value) return false;
      const cleaned = value.replace(/\D/g, '');
      return cleaned.length === 10;
    }),
});

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
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long'),
  phone: yup
    .string()
    .required('Phone number is required')
    .test('valid-phone', 'Please enter a valid 10-digit phone number', value => {
      if (!value) return false;
      const cleaned = value.replace(/\D/g, '');
      return cleaned.length === 10;
    }),
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
 * Payment method validation (for Stripe)
 */
export const paymentMethodSchema = yup.object({
  cardNumber: yup
    .string()
    .required('Card number is required')
    .test('valid-card', 'Invalid card number', value => {
      if (!value) return false;
      const cleaned = value.replace(/\s/g, '');
      return cleaned.length >= 13 && cleaned.length <= 19;
    }),
  expiryMonth: yup
    .number()
    .required('Expiry month is required')
    .min(1, 'Invalid month')
    .max(12, 'Invalid month'),
  expiryYear: yup
    .number()
    .required('Expiry year is required')
    .min(new Date().getFullYear(), 'Card is expired'),
  cvc: yup
    .string()
    .required('CVC is required')
    .matches(/^\d{3,4}$/, 'Invalid CVC'),
  zipCode: yup
    .string()
    .required('ZIP code is required')
    .matches(/^\d{5}$/, 'Invalid ZIP code'),
});

/**
 * Helper: Validate a value against a schema
 */
export async function validateField<T>(
  schema: yup.Schema<T>,
  value: any
): Promise<{ isValid: boolean; error?: string }> {
  try {
    await schema.validate(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { isValid: false, error: error.message };
    }
    return { isValid: false, error: 'Validation error' };
  }
}
