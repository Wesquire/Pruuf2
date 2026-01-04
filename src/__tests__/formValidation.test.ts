/**
 * Form Validation Tests
 * Item 39: Implement Form Validation (HIGH)
 *
 * Tests all validation schemas and validation helpers
 */

import * as yup from 'yup';
import {
  verificationCodeSchema,
  pinSchema,
  confirmPinSchema,
  inviteMemberSchema,
  inviteCodeSchema,
  checkInTimeSchema,
  validateField,
} from '../utils/validation';

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
        email: 'john@example.com',
      }),
    ).resolves.toBeTruthy();
  });

  it('should reject name shorter than 2 characters', async () => {
    await expect(
      inviteMemberSchema.validate({
        name: 'J',
        email: 'john@example.com',
      }),
    ).rejects.toThrow('Name must be at least 2 characters');
  });

  it('should reject name longer than 255 characters', async () => {
    const longName = 'a'.repeat(256);
    await expect(
      inviteMemberSchema.validate({
        name: longName,
        email: 'john@example.com',
      }),
    ).rejects.toThrow('Name is too long');
  });

  it('should require both name and email', async () => {
    await expect(inviteMemberSchema.validate({name: 'John'})).rejects.toThrow();
    await expect(
      inviteMemberSchema.validate({email: 'john@example.com'}),
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

describe('Form Validation - validateField Helper', () => {
  it('should return isValid true for valid values', async () => {
    const result = await validateField(pinSchema, {pin: '1234'});
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return isValid false with error message for invalid values', async () => {
    const result = await validateField(pinSchema, {pin: '12'});
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should work with all schemas', async () => {
    const schemas = [
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
    await expect(pinSchema.validate({pin: ''})).rejects.toThrow();
    await expect(verificationCodeSchema.validate({code: ''})).rejects.toThrow();
  });

  it('should handle null values', async () => {
    await expect(pinSchema.validate({pin: null})).rejects.toThrow();
  });

  it('should handle undefined values', async () => {
    await expect(pinSchema.validate({pin: undefined})).rejects.toThrow();
  });

  it('should trim whitespace where appropriate', async () => {
    const result = await inviteMemberSchema.validate({
      name: '  John Doe  ',
      email: 'john@example.com',
    });
    expect(result.name).toBe('John Doe');
  });
});

describe('Form Validation - Performance', () => {
  it('should validate quickly', async () => {
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      await pinSchema.validate({pin: '1234'});
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should validate 100 items in <1s
  });

  it('should handle concurrent validations', async () => {
    const promises = Array.from({length: 50}, (_, i) =>
      pinSchema.validate({pin: '1234'}),
    );

    await expect(Promise.all(promises)).resolves.toHaveLength(50);
  });
});
