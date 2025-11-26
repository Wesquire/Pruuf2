/**
 * Phone Utility Tests
 */

import {
  formatPhoneE164,
  formatPhoneDisplay,
  maskPhone,
  isValidPhone,
  formatPhoneInput,
} from '../phone';

describe('Phone Utilities', () => {
  describe('formatPhoneE164', () => {
    it('should format 10-digit number to E.164', () => {
      expect(formatPhoneE164('5551234567')).toBe('+15551234567');
    });

    it('should format formatted number to E.164', () => {
      expect(formatPhoneE164('(555) 123-4567')).toBe('+15551234567');
    });

    it('should handle already formatted E.164', () => {
      expect(formatPhoneE164('+15551234567')).toBe('+15551234567');
    });

    it('should handle 11-digit number starting with 1', () => {
      expect(formatPhoneE164('15551234567')).toBe('+15551234567');
    });

    it('should return original for invalid input', () => {
      expect(formatPhoneE164('123')).toBe('123');
    });
  });

  describe('formatPhoneDisplay', () => {
    it('should format 10-digit number for display', () => {
      expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
    });

    it('should format E.164 number for display', () => {
      expect(formatPhoneDisplay('+15551234567')).toBe('(555) 123-4567');
    });

    it('should handle already formatted number', () => {
      expect(formatPhoneDisplay('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should return original for invalid input', () => {
      expect(formatPhoneDisplay('123')).toBe('123');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number', () => {
      expect(maskPhone('5551234567')).toBe('(***) ***-4567');
    });

    it('should mask E.164 number', () => {
      expect(maskPhone('+15551234567')).toBe('(***) ***-4567');
    });

    it('should mask formatted number', () => {
      expect(maskPhone('(555) 123-4567')).toBe('(***) ***-4567');
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct 10-digit number', () => {
      expect(isValidPhone('5551234567')).toBe(true);
    });

    it('should validate formatted number', () => {
      expect(isValidPhone('(555) 123-4567')).toBe(true);
    });

    it('should reject short numbers', () => {
      expect(isValidPhone('123')).toBe(false);
    });

    it('should reject long numbers', () => {
      expect(isValidPhone('12345678901')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('formatPhoneInput', () => {
    it('should format as user types', () => {
      expect(formatPhoneInput('5')).toBe('(5');
      expect(formatPhoneInput('55')).toBe('(55');
      expect(formatPhoneInput('555')).toBe('(555');
      expect(formatPhoneInput('5551')).toBe('(555) 1');
      expect(formatPhoneInput('555123')).toBe('(555) 123');
      expect(formatPhoneInput('5551234')).toBe('(555) 123-4');
      expect(formatPhoneInput('5551234567')).toBe('(555) 123-4567');
    });

    it('should handle paste of formatted number', () => {
      expect(formatPhoneInput('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should limit to 10 digits', () => {
      expect(formatPhoneInput('55512345678901')).toBe('(555) 123-4567');
    });

    it('should handle empty input', () => {
      expect(formatPhoneInput('')).toBe('');
    });
  });
});
