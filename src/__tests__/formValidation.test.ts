/**
 * Form Validation Tests
 * Item 39: Implement Form Validation (HIGH)
 *
 * Tests all validation schemas and validation helpers
 */

import * as yup from 'yup';
import {
  phoneSchema,
  verificationCodeSchema,
  pinSchema,
  confirmPinSchema,
  inviteMemberSchema,
  inviteCodeSchema,
  checkInTimeSchema,
  paymentMethodSchema,
  validateField,
} from '../utils/validation';

describe('Form Validation - Phone Schema', () => {
  it('should accept valid 10-digit phone number', async () => {
    const validPhones = [
      {phone: '1234567890'},
      {phone: '(123) 456-7890'},
      {phone: '123-456-7890'},
    ];

    for (const phone of validPhones) {
      await expect(phoneSchema.validate(phone)).resolves.toBeTruthy();
    }
  });

  it('should reject invalid phone numbers', async () => {
    const invalidPhones = [
      {phone: ''},
      {phone: '123'},
      {phone: '12345678901'}, // 11 digits
      {phone: 'abcdefghij'},
    ];

    for (const phone of invalidPhones) {
      await expect(phoneSchema.validate(phone)).rejects.toThrow();
    }
  });

  it('should require phone field', async () => {
    await expect(phoneSchema.validate({})).rejects.toThrow(
      'Phone number is required',
    );
  });
});

describe('Form Validation - Verification Code Schema', () => {
  it('should accept valid 6-digit code', async () => {
    await expect(
      verificationCodeSchema.validate({code: '123456'}),
    ).resolves.toBeTruthy();
  });

  it('should reject codes with wrong length', async () => {
    await expect(
      verificationCodeSchema.validate({code: '12345'}),
    ).rejects.toThrow('Code must be 6 digits');
    await expect(
      verificationCodeSchema.validate({code: '1234567'}),
    ).rejects.toThrow('Code must be 6 digits');
  });

  it('should reject codes with non-numeric characters', async () => {
    await expect(
      verificationCodeSchema.validate({code: '12345a'}),
    ).rejects.toThrow('Code must contain only numbers');
  });

  it('should require code field', async () => {
    await expect(verificationCodeSchema.validate({})).rejects.toThrow(
      'Verification code is required',
    );
  });
});

describe('Form Validation - PIN Schema', () => {
  it('should accept valid 4-digit PIN', async () => {
    await expect(pinSchema.validate({pin: '1234'})).resolves.toBeTruthy();
    await expect(pinSchema.validate({pin: '0000'})).resolves.toBeTruthy();
    await expect(pinSchema.validate({pin: '9999'})).resolves.toBeTruthy();
  });

  it('should reject PINs with wrong length', async () => {
    await expect(pinSchema.validate({pin: '123'})).rejects.toThrow(
      'PIN must be 4 digits',
    );
    await expect(pinSchema.validate({pin: '12345'})).rejects.toThrow(
      'PIN must be 4 digits',
    );
  });

  it('should reject PINs with non-numeric characters', async () => {
    await expect(pinSchema.validate({pin: '12ab'})).rejects.toThrow(
      'PIN must contain only numbers',
    );
  });

  it('should require PIN field', async () => {
    await expect(pinSchema.validate({})).rejects.toThrow('PIN is required');
  });
});

describe('Form Validation - Confirm PIN Schema', () => {
  it('should accept matching PINs', async () => {
    await expect(
      confirmPinSchema.validate({pin: '1234', confirmPin: '1234'}),
    ).resolves.toBeTruthy();
  });

  it('should reject non-matching PINs', async () => {
    await expect(
      confirmPinSchema.validate({pin: '1234', confirmPin: '5678'}),
    ).rejects.toThrow("PINs don't match");
  });

  it('should require confirmPin field', async () => {
    await expect(confirmPinSchema.validate({pin: '1234'})).rejects.toThrow(
      'Please confirm your PIN',
    );
  });
});

describe('Form Validation - Invite Member Schema', () => {
  it('should accept valid member invitation', async () => {
    await expect(
      inviteMemberSchema.validate({
        name: 'John Doe',
        phone: '1234567890',
      }),
    ).resolves.toBeTruthy();
  });

  it('should reject name shorter than 2 characters', async () => {
    await expect(
      inviteMemberSchema.validate({
        name: 'J',
        phone: '1234567890',
      }),
    ).rejects.toThrow('Name must be at least 2 characters');
  });

  it('should reject name longer than 255 characters', async () => {
    const longName = 'a'.repeat(256);
    await expect(
      inviteMemberSchema.validate({
        name: longName,
        phone: '1234567890',
      }),
    ).rejects.toThrow('Name is too long');
  });

  it('should require both name and phone', async () => {
    await expect(inviteMemberSchema.validate({name: 'John'})).rejects.toThrow();
    await expect(
      inviteMemberSchema.validate({phone: '1234567890'}),
    ).rejects.toThrow();
  });
});

describe('Form Validation - Invite Code Schema', () => {
  it('should accept valid 6-character alphanumeric code', async () => {
    await expect(
      inviteCodeSchema.validate({code: 'ABC123'}),
    ).resolves.toBeTruthy();
    await expect(
      inviteCodeSchema.validate({code: '123456'}),
    ).resolves.toBeTruthy();
    await expect(
      inviteCodeSchema.validate({code: 'ABCDEF'}),
    ).resolves.toBeTruthy();
  });

  it('should reject codes with wrong length', async () => {
    await expect(inviteCodeSchema.validate({code: 'ABC12'})).rejects.toThrow(
      'Code must be 6 characters',
    );
  });

  it('should reject codes with invalid characters', async () => {
    await expect(inviteCodeSchema.validate({code: 'ABC@12'})).rejects.toThrow(
      'Invalid code format',
    );
  });

  it('should require code field', async () => {
    await expect(inviteCodeSchema.validate({})).rejects.toThrow(
      'Invite code is required',
    );
  });
});

describe('Form Validation - Check-in Time Schema', () => {
  it('should accept valid check-in time', async () => {
    await expect(
      checkInTimeSchema.validate({
        time: '09:00',
        timezone: 'America/New_York',
        reminderEnabled: true,
      }),
    ).resolves.toBeTruthy();
  });

  it('should accept 24-hour format', async () => {
    await expect(
      checkInTimeSchema.validate({
        time: '00:00',
        timezone: 'America/New_York',
      }),
    ).resolves.toBeTruthy();

    await expect(
      checkInTimeSchema.validate({
        time: '23:59',
        timezone: 'America/New_York',
      }),
    ).resolves.toBeTruthy();
  });

  it('should reject invalid time format', async () => {
    await expect(
      checkInTimeSchema.validate({
        time: '25:00',
        timezone: 'America/New_York',
      }),
    ).rejects.toThrow();

    await expect(
      checkInTimeSchema.validate({
        time: '09:60',
        timezone: 'America/New_York',
      }),
    ).rejects.toThrow();
  });

  it('should require time and timezone', async () => {
    await expect(
      checkInTimeSchema.validate({
        time: '09:00',
      }),
    ).rejects.toThrow('Timezone is required');

    await expect(
      checkInTimeSchema.validate({
        timezone: 'America/New_York',
      }),
    ).rejects.toThrow('Check-in time is required');
  });
});

describe('Form Validation - Payment Method Schema', () => {
  it('should accept valid payment details', async () => {
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '12345',
      }),
    ).resolves.toBeTruthy();
  });

  it('should reject invalid card numbers', async () => {
    // Too short
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '411111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Invalid card number');

    // Too long
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '41111111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Invalid card number');
  });

  it('should reject invalid expiry month', async () => {
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 0,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Invalid month');

    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 13,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Invalid month');
  });

  it('should reject expired cards', async () => {
    const pastYear = new Date().getFullYear() - 1;
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: pastYear,
        cvc: '123',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Card is expired');
  });

  it('should reject invalid CVC', async () => {
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '12',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Invalid CVC');

    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '12345',
        zipCode: '12345',
      }),
    ).rejects.toThrow('Invalid CVC');
  });

  it('should reject invalid ZIP code', async () => {
    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '1234',
      }),
    ).rejects.toThrow('Invalid ZIP code');

    await expect(
      paymentMethodSchema.validate({
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        zipCode: '123456',
      }),
    ).rejects.toThrow('Invalid ZIP code');
  });
});

describe('Form Validation - validateField Helper', () => {
  it('should return isValid true for valid values', async () => {
    const result = await validateField(phoneSchema, {phone: '1234567890'});
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return isValid false with error message for invalid values', async () => {
    const result = await validateField(phoneSchema, {phone: '123'});
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should work with all schemas', async () => {
    const schemas = [
      {
        schema: phoneSchema,
        valid: {phone: '1234567890'},
        invalid: {phone: '123'},
      },
      {
        schema: verificationCodeSchema,
        valid: {code: '123456'},
        invalid: {code: '12'},
      },
      {schema: pinSchema, valid: {pin: '1234'}, invalid: {pin: '12'}},
      {
        schema: inviteCodeSchema,
        valid: {code: 'ABC123'},
        invalid: {code: 'AB'},
      },
    ];

    for (const {schema, valid, invalid} of schemas) {
      const validResult = await validateField(schema, valid);
      expect(validResult.isValid).toBe(true);

      const invalidResult = await validateField(schema, invalid);
      expect(invalidResult.isValid).toBe(false);
    }
  });
});

describe('Form Validation - Edge Cases', () => {
  it('should handle empty strings', async () => {
    await expect(phoneSchema.validate({phone: ''})).rejects.toThrow();
    await expect(pinSchema.validate({pin: ''})).rejects.toThrow();
  });

  it('should handle null values', async () => {
    await expect(phoneSchema.validate({phone: null})).rejects.toThrow();
  });

  it('should handle undefined values', async () => {
    await expect(phoneSchema.validate({phone: undefined})).rejects.toThrow();
  });

  it('should trim whitespace where appropriate', async () => {
    const result = await inviteMemberSchema.validate({
      name: '  John Doe  ',
      phone: '1234567890',
    });
    expect(result.name).toBe('John Doe');
  });

  it('should handle special characters in phone formatting', async () => {
    const phones = [
      '123-456-7890',
      '(123) 456-7890',
      '123.456.7890',
      '123 456 7890',
    ];

    for (const phone of phones) {
      await expect(phoneSchema.validate({phone})).resolves.toBeTruthy();
    }
  });
});

describe('Form Validation - Performance', () => {
  it('should validate quickly', async () => {
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      await phoneSchema.validate({phone: '1234567890'});
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should validate 100 items in <1s
  });

  it('should handle concurrent validations', async () => {
    const promises = Array.from({length: 50}, (_, i) =>
      phoneSchema.validate({phone: '1234567890'}),
    );

    await expect(Promise.all(promises)).resolves.toHaveLength(50);
  });
});
