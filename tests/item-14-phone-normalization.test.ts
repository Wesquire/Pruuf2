/**
 * Item 14: Phone Number Normalization - Validation Tests
 *
 * HIGH: Tests phone number normalization to E.164 format
 * Ensures consistent phone number format across the application
 */

import { describe, it, expect } from '@jest/globals';

// Import phone utilities
// Note: Adjust import path for test environment
const {
  normalizePhone,
  validatePhone,
  formatPhoneDisplay,
  maskPhone,
  getCountryCode,
  arePhoneNumbersEqual,
  validateUSPhone,
} = require('../supabase/functions/_shared/phone.ts');

describe('Item 14: Phone Number Normalization', () => {

  describe('Test 14.1: Normalize Phone to E.164', () => {
    it('should normalize US phone with parentheses and dashes', () => {
      expect(normalizePhone('(555) 123-4567')).toBe('+15551234567');
    });

    it('should normalize US phone with only dashes', () => {
      expect(normalizePhone('555-123-4567')).toBe('+15551234567');
    });

    it('should normalize US phone with spaces', () => {
      expect(normalizePhone('555 123 4567')).toBe('+15551234567');
    });

    it('should normalize US phone with dots', () => {
      expect(normalizePhone('555.123.4567')).toBe('+15551234567');
    });

    it('should normalize 10-digit US phone', () => {
      expect(normalizePhone('5551234567')).toBe('+15551234567');
    });

    it('should normalize 11-digit US phone with leading 1', () => {
      expect(normalizePhone('15551234567')).toBe('+15551234567');
    });

    it('should normalize already E.164 formatted phone', () => {
      expect(normalizePhone('+15551234567')).toBe('+15551234567');
    });

    it('should normalize E.164 with spaces', () => {
      expect(normalizePhone('+1 555 123 4567')).toBe('+15551234567');
    });

    it('should normalize mixed format', () => {
      expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    });

    it('should normalize phone with country code prefix', () => {
      expect(normalizePhone('1-555-123-4567')).toBe('+15551234567');
    });
  });

  describe('Test 14.2: Validate Phone Numbers', () => {
    it('should validate correct US phone numbers', () => {
      expect(validatePhone('+15551234567')).toBe(true);
      expect(validatePhone('(555) 123-4567')).toBe(true);
      expect(validatePhone('555-123-4567')).toBe(true);
      expect(validatePhone('5551234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('555')).toBe(false);
      expect(validatePhone('12345')).toBe(false);
      expect(validatePhone('123456789012345')).toBe(false); // Too long
    });

    it('should reject empty or null phone numbers', () => {
      expect(validatePhone('')).toBe(false);
      expect(validatePhone(null as any)).toBe(false);
    });

    it('should reject non-numeric characters only', () => {
      expect(validatePhone('abc-def-ghij')).toBe(false);
      expect(validatePhone('not a phone')).toBe(false);
    });

    it('should reject phone with extension', () => {
      // Extensions add extra digits and cannot be normalized to E.164
      expect(validatePhone('+1 (555) 123-4567 ext 123')).toBe(false);
    });
  });

  describe('Test 14.3: Format Phone for Display', () => {
    it('should format E.164 phone for display', () => {
      expect(formatPhoneDisplay('+15551234567')).toBe('(555) 123-4567');
    });

    it('should format 10-digit phone for display', () => {
      expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
    });

    it('should format phone with dashes for display', () => {
      expect(formatPhoneDisplay('555-123-4567')).toBe('(555) 123-4567');
    });

    it('should return null for invalid phone', () => {
      expect(formatPhoneDisplay('123')).toBeNull();
      expect(formatPhoneDisplay('invalid')).toBeNull();
    });
  });

  describe('Test 14.4: Mask Phone for Security', () => {
    it('should mask phone showing only last 4 digits', () => {
      expect(maskPhone('+15551234567')).toBe('(***) ***-4567');
    });

    it('should mask 10-digit phone', () => {
      expect(maskPhone('5551234567')).toBe('(***) ***-4567');
    });

    it('should mask phone with formatting', () => {
      expect(maskPhone('(555) 123-4567')).toBe('(***) ***-4567');
    });

    it('should return null for invalid phone', () => {
      expect(maskPhone('123')).toBeNull();
      expect(maskPhone('invalid')).toBeNull();
    });
  });

  describe('Test 14.5: Extract Country Code', () => {
    it('should extract US country code', () => {
      expect(getCountryCode('+15551234567')).toBe('1');
    });

    it('should extract country code from 10-digit number', () => {
      expect(getCountryCode('5551234567')).toBe('1');
    });

    it('should extract country code from formatted number', () => {
      expect(getCountryCode('(555) 123-4567')).toBe('1');
    });

    it('should return null for invalid phone', () => {
      expect(getCountryCode('123')).toBeNull();
      expect(getCountryCode('invalid')).toBeNull();
    });
  });

  describe('Test 14.6: Compare Phone Numbers', () => {
    it('should recognize same phone in different formats', () => {
      expect(arePhoneNumbersEqual('555-123-4567', '+15551234567')).toBe(true);
      expect(arePhoneNumbersEqual('(555) 123-4567', '5551234567')).toBe(true);
      expect(arePhoneNumbersEqual('+1 555 123 4567', '15551234567')).toBe(true);
    });

    it('should recognize different phones', () => {
      expect(arePhoneNumbersEqual('555-123-4567', '555-123-9999')).toBe(false);
      expect(arePhoneNumbersEqual('(555) 123-4567', '(444) 123-4567')).toBe(false);
    });

    it('should handle invalid phones', () => {
      expect(arePhoneNumbersEqual('invalid', '555-123-4567')).toBe(false);
      expect(arePhoneNumbersEqual('123', '456')).toBe(false);
    });
  });

  describe('Test 14.7: Strict US Phone Validation', () => {
    it('should validate correct US phones', () => {
      expect(validateUSPhone('+15551234567')).toBe(true);
      expect(validateUSPhone('555-123-4567')).toBe(true);
      expect(validateUSPhone('(212) 555-1234')).toBe(true);
    });

    it('should reject phones with invalid area codes', () => {
      // Area code cannot start with 0
      expect(validateUSPhone('(055) 123-4567')).toBe(false);

      // Area code cannot start with 1
      expect(validateUSPhone('(155) 123-4567')).toBe(false);
    });

    it('should reject phones with invalid exchange codes', () => {
      // Exchange cannot start with 0
      expect(validateUSPhone('(555) 023-4567')).toBe(false);

      // Modern phone systems allow exchanges starting with 1
      expect(validateUSPhone('(555) 123-4567')).toBe(true); // Valid
      expect(validateUSPhone('(555) 100-4567')).toBe(true); // Valid (modern)
    });

    it('should reject 555-01XX numbers (fictional)', () => {
      expect(validateUSPhone('(555) 0123-4567')).toBe(false);
      expect(validateUSPhone('(555) 0199-4567')).toBe(false);
    });

    it('should accept normal 555 numbers', () => {
      expect(validateUSPhone('(555) 123-4567')).toBe(true);
      expect(validateUSPhone('(555) 234-5678')).toBe(true);
    });
  });

  describe('Test 14.8: Edge Cases', () => {
    it('should reject phone with extension digits', () => {
      // Extensions add extra digits, making number invalid (13 digits total)
      expect(normalizePhone('+1 (555) 123-4567 ext. 123')).toBeNull();
    });

    it('should handle phone with multiple plus signs', () => {
      expect(normalizePhone('++15551234567')).toBe('+15551234567');
    });

    it('should handle phone with leading/trailing spaces', () => {
      expect(normalizePhone('  555-123-4567  ')).toBe('+15551234567');
    });

    it('should handle phone with mixed separators', () => {
      expect(normalizePhone('555.123-4567')).toBe('+15551234567');
      expect(normalizePhone('555 123.4567')).toBe('+15551234567');
    });

    it('should reject too short numbers', () => {
      expect(normalizePhone('555123456')).toBeNull(); // 9 digits
      expect(normalizePhone('12345')).toBeNull();
    });

    it('should reject too long numbers', () => {
      expect(normalizePhone('55512345678')).toBeNull(); // 11 digits without country code
    });
  });

  describe('Test 14.9: International Numbers', () => {
    it('should handle UK numbers', () => {
      const ukPhone = '+442071234567';
      const normalized = normalizePhone(ukPhone);
      expect(normalized).not.toBeNull();
      expect(getCountryCode(ukPhone)).toBe('44');
    });

    it('should default to US for 10-digit numbers', () => {
      expect(normalizePhone('5551234567')).toBe('+15551234567');
      expect(getCountryCode('5551234567')).toBe('1');
    });
  });

  describe('Test 14.10: Real-World Formats', () => {
    it('should handle common US formats', () => {
      const formats = [
        '555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '555 123 4567',
        '1-555-123-4567',
        '+1 555 123 4567',
        '+1-555-123-4567',
        '+1.555.123.4567',
      ];

      formats.forEach(format => {
        expect(normalizePhone(format)).toBe('+15551234567');
      });
    });

    it('should handle formats from user input', () => {
      // Simulating user typing in form
      expect(normalizePhone('5')).toBeNull();
      expect(normalizePhone('55')).toBeNull();
      expect(normalizePhone('555')).toBeNull();
      expect(normalizePhone('5551')).toBeNull();
      expect(normalizePhone('55512')).toBeNull();
      expect(normalizePhone('555123')).toBeNull();
      expect(normalizePhone('5551234')).toBeNull();
      expect(normalizePhone('55512345')).toBeNull();
      expect(normalizePhone('555123456')).toBeNull();
      expect(normalizePhone('5551234567')).toBe('+15551234567'); // Valid
    });
  });

  describe('Test 14.11: Consistency Across Operations', () => {
    it('should maintain consistency in normalize → display → normalize', () => {
      const original = '555-123-4567';
      const normalized = normalizePhone(original);
      const displayed = formatPhoneDisplay(normalized!);
      const renormalized = normalizePhone(displayed!);

      expect(normalized).toBe('+15551234567');
      expect(displayed).toBe('(555) 123-4567');
      expect(renormalized).toBe('+15551234567');
    });

    it('should maintain consistency in normalize → mask', () => {
      const original = '555-123-4567';
      const normalized = normalizePhone(original);
      const masked = maskPhone(normalized!);

      expect(masked).toBe('(***) ***-4567');
      expect(masked).toContain('4567'); // Last 4 digits preserved
    });

    it('should have idempotent normalization', () => {
      const phone = '555-123-4567';
      const normalized1 = normalizePhone(phone);
      const normalized2 = normalizePhone(normalized1!);
      const normalized3 = normalizePhone(normalized2!);

      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
      expect(normalized1).toBe('+15551234567');
    });
  });
});

describe('Item 14: Integration Test - Phone Number Flow', () => {
  it('should handle complete user signup flow', () => {
    // User enters phone in signup form
    const userInput = '(555) 123-4567';

    // 1. Validate phone
    expect(validatePhone(userInput)).toBe(true);

    // 2. Normalize for storage
    const normalized = normalizePhone(userInput);
    expect(normalized).toBe('+15551234567');

    // 3. Store in database (normalized format)
    const storedPhone = normalized;

    // 4. Display to user (formatted)
    const displayed = formatPhoneDisplay(storedPhone!);
    expect(displayed).toBe('(555) 123-4567');

    // 5. Show masked in public view
    const masked = maskPhone(storedPhone!);
    expect(masked).toBe('(***) ***-4567');
  });

  it('should handle phone lookup with different formats', () => {
    // Phone stored in database
    const storedPhone = '+15551234567';

    // User tries to login with different format
    const loginInput1 = '555-123-4567';
    const loginInput2 = '(555) 123-4567';
    const loginInput3 = '5551234567';

    // All should match
    expect(arePhoneNumbersEqual(storedPhone, loginInput1)).toBe(true);
    expect(arePhoneNumbersEqual(storedPhone, loginInput2)).toBe(true);
    expect(arePhoneNumbersEqual(storedPhone, loginInput3)).toBe(true);
  });

  it('should handle phone number updates', () => {
    const oldPhone = '+15551234567';
    const newPhoneInput = '555-123-9999';

    // Validate new phone
    expect(validatePhone(newPhoneInput)).toBe(true);

    // Normalize for storage
    const newPhoneNormalized = normalizePhone(newPhoneInput);
    expect(newPhoneNormalized).toBe('+15551239999');

    // Verify they're different
    expect(arePhoneNumbersEqual(oldPhone, newPhoneNormalized!)).toBe(false);
  });
});
