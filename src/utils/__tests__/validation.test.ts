/**
 * Validation Utility Tests
 */

import {
  phoneSchema,
  pinSchema,
  confirmPinSchema,
  inviteMemberSchema,
  checkInTimeSchema,
  validateField,
} from '../validation';

describe('Validation Utilities', () => {
  describe('phoneSchema', () => {
    it('should validate correct phone number', async () => {
      await expect(
        phoneSchema.validate({phone: '5551234567'}),
      ).resolves.toEqual({
        phone: '5551234567',
      });
    });

    it('should validate formatted phone number', async () => {
      await expect(
        phoneSchema.validate({phone: '(555) 123-4567'}),
      ).resolves.toBeTruthy();
    });

    it('should reject short phone number', async () => {
      await expect(phoneSchema.validate({phone: '123'})).rejects.toThrow();
    });

    it('should reject empty phone number', async () => {
      await expect(phoneSchema.validate({phone: ''})).rejects.toThrow();
    });
  });

  describe('pinSchema', () => {
    it('should validate correct 4-digit PIN', async () => {
      await expect(pinSchema.validate({pin: '1234'})).resolves.toEqual({
        pin: '1234',
      });
    });

    it('should reject short PIN', async () => {
      await expect(pinSchema.validate({pin: '123'})).rejects.toThrow();
    });

    it('should reject long PIN', async () => {
      await expect(pinSchema.validate({pin: '12345'})).rejects.toThrow();
    });

    it('should reject non-numeric PIN', async () => {
      await expect(pinSchema.validate({pin: 'abcd'})).rejects.toThrow();
    });

    it('should reject empty PIN', async () => {
      await expect(pinSchema.validate({pin: ''})).rejects.toThrow();
    });
  });

  describe('confirmPinSchema', () => {
    it('should validate matching PINs', async () => {
      const data = {pin: '1234', confirmPin: '1234'};
      await expect(confirmPinSchema.validate(data)).resolves.toEqual(data);
    });

    it('should reject non-matching PINs', async () => {
      const data = {pin: '1234', confirmPin: '5678'};
      await expect(confirmPinSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('inviteMemberSchema', () => {
    it('should validate correct invite data', async () => {
      const data = {
        name: 'John Doe',
        phone: '5551234567',
      };
      await expect(inviteMemberSchema.validate(data)).resolves.toEqual(data);
    });

    it('should reject empty name', async () => {
      const data = {
        name: '',
        phone: '5551234567',
      };
      await expect(inviteMemberSchema.validate(data)).rejects.toThrow();
    });

    it('should reject invalid phone', async () => {
      const data = {
        name: 'John Doe',
        phone: '123',
      };
      await expect(inviteMemberSchema.validate(data)).rejects.toThrow();
    });

    it('should reject name that is too long', async () => {
      const data = {
        name: 'A'.repeat(256),
        phone: '5551234567',
      };
      await expect(inviteMemberSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('checkInTimeSchema', () => {
    it('should validate correct 24-hour time', async () => {
      const data = {
        time: '09:30',
        timezone: 'America/New_York',
        reminderEnabled: true,
      };
      await expect(checkInTimeSchema.validate(data)).resolves.toEqual(data);
    });

    it('should validate midnight', async () => {
      const data = {
        time: '00:00',
        timezone: 'America/New_York',
      };
      await expect(checkInTimeSchema.validate(data)).resolves.toBeTruthy();
    });

    it('should validate end of day', async () => {
      const data = {
        time: '23:59',
        timezone: 'America/New_York',
      };
      await expect(checkInTimeSchema.validate(data)).resolves.toBeTruthy();
    });

    it('should reject invalid format', async () => {
      const data = {
        time: '9:3', // Missing second digit for minutes
        timezone: 'America/New_York',
      };
      await expect(checkInTimeSchema.validate(data)).rejects.toThrow();
    });

    it('should reject invalid hour', async () => {
      const data = {
        time: '24:00',
        timezone: 'America/New_York',
      };
      await expect(checkInTimeSchema.validate(data)).rejects.toThrow();
    });

    it('should reject invalid minute', async () => {
      const data = {
        time: '09:60',
        timezone: 'America/New_York',
      };
      await expect(checkInTimeSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('validateField', () => {
    it('should return isValid true for valid phone', async () => {
      const result = await validateField(phoneSchema, {phone: '5551234567'});
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return isValid false with error for invalid phone', async () => {
      const result = await validateField(phoneSchema, {phone: '123'});
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });

    it('should return isValid true for valid PIN', async () => {
      const result = await validateField(pinSchema, {pin: '1234'});
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return isValid false with error for invalid PIN', async () => {
      const result = await validateField(pinSchema, {pin: '123'});
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });
  });
});
