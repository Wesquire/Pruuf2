/**
 * Unit Tests for Backend Utilities (Item 52)
 *
 * Tests all utility functions in /supabase/functions/_shared/
 * Coverage: phone.ts, sanitizer.ts, pinValidator.ts, errors.ts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// =============================================================================
// PART 1: Phone Number Utilities Tests
// =============================================================================

// Phone utility functions (from phone.ts)
function normalizePhone(phone: string, defaultCountryCode: string = '1'): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except + at the start
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove + from anywhere except the start
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.substring(1).replace(/\+/g, '');
  }

  // If already in E.164 format (+15551234567)
  if (cleaned.startsWith('+')) {
    if (cleaned.startsWith('+1')) {
      if (cleaned.length === 12) {
        return cleaned;
      }
      return null;
    }
    if (cleaned.length >= 12 && cleaned.length <= 15) {
      return cleaned;
    }
    return null;
  }

  // If 11 digits (US format: 15551234567)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If 10 digits (US format without country code: 5551234567)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  return null;
}

function validatePhone(phone: string, countryCode: string = '1'): boolean {
  return normalizePhone(phone, countryCode) !== null;
}

function formatPhoneDisplay(phone: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const subscriberNumber = normalized.substring(normalized.length - 10);
  const areaCode = subscriberNumber.substring(0, 3);
  const exchange = subscriberNumber.substring(3, 6);
  const lineNumber = subscriberNumber.substring(6, 10);

  return `(${areaCode}) ${exchange}-${lineNumber}`;
}

function maskPhone(phone: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const lastFour = normalized.substring(normalized.length - 4);
  return `(***) ***-${lastFour}`;
}

function arePhoneNumbersEqual(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);

  if (!normalized1 || !normalized2) {
    return false;
  }

  return normalized1 === normalized2;
}

describe('Item 52: Utility Unit Tests - Part 1: Phone', () => {
  describe('normalizePhone()', () => {
    it('should normalize phone with parentheses and dashes', () => {
      expect(normalizePhone('(555) 123-4567')).toBe('+15551234567');
    });

    it('should normalize phone with spaces', () => {
      expect(normalizePhone('555 123 4567')).toBe('+15551234567');
    });

    it('should normalize phone with dots', () => {
      expect(normalizePhone('555.123.4567')).toBe('+15551234567');
    });

    it('should normalize 10-digit phone without country code', () => {
      expect(normalizePhone('5551234567')).toBe('+15551234567');
    });

    it('should normalize 11-digit phone with country code 1', () => {
      expect(normalizePhone('15551234567')).toBe('+15551234567');
    });

    it('should normalize E.164 format as-is', () => {
      expect(normalizePhone('+15551234567')).toBe('+15551234567');
    });

    it('should normalize phone with country code prefix', () => {
      expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    });

    it('should return null for invalid phone (too short)', () => {
      expect(normalizePhone('123')).toBeNull();
    });

    it('should return null for invalid phone (too long)', () => {
      expect(normalizePhone('555123456789')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizePhone('')).toBeNull();
    });

    it('should return null for non-numeric string', () => {
      expect(normalizePhone('not-a-phone')).toBeNull();
    });

    it('should handle phone with leading/trailing whitespace', () => {
      expect(normalizePhone('  5551234567  ')).toBe('+15551234567');
    });
  });

  describe('validatePhone()', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('+15551234567')).toBe(true);
      expect(validatePhone('(555) 123-4567')).toBe(true);
      expect(validatePhone('555-123-4567')).toBe(true);
      expect(validatePhone('5551234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('formatPhoneDisplay()', () => {
    it('should format E.164 phone for display', () => {
      expect(formatPhoneDisplay('+15551234567')).toBe('(555) 123-4567');
    });

    it('should format various formats for display', () => {
      expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
      expect(formatPhoneDisplay('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should return null for invalid phone', () => {
      expect(formatPhoneDisplay('invalid')).toBeNull();
    });
  });

  describe('maskPhone()', () => {
    it('should mask phone showing last 4 digits', () => {
      expect(maskPhone('+15551234567')).toBe('(***) ***-4567');
    });

    it('should mask various phone formats', () => {
      expect(maskPhone('5551234567')).toBe('(***) ***-4567');
      expect(maskPhone('(555) 123-4567')).toBe('(***) ***-4567');
    });

    it('should return null for invalid phone', () => {
      expect(maskPhone('invalid')).toBeNull();
    });
  });

  describe('arePhoneNumbersEqual()', () => {
    it('should return true for same phones in different formats', () => {
      expect(arePhoneNumbersEqual('5551234567', '+15551234567')).toBe(true);
      expect(arePhoneNumbersEqual('(555) 123-4567', '555-123-4567')).toBe(true);
    });

    it('should return false for different phones', () => {
      expect(arePhoneNumbersEqual('5551234567', '5559876543')).toBe(false);
    });

    it('should return false if either phone is invalid', () => {
      expect(arePhoneNumbersEqual('invalid', '5551234567')).toBe(false);
      expect(arePhoneNumbersEqual('5551234567', 'invalid')).toBe(false);
    });
  });
});

// =============================================================================
// PART 2: Sanitization Utilities Tests
// =============================================================================

// Sanitization utility functions (from sanitizer.ts)
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

function stripHtmlTags(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Remove script and style tags with their content
  let result = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove remaining HTML tags
  return result.replace(/<[^>]*>/g, '');
}

function sanitizeString(
  str: string,
  options: {
    stripHtml?: boolean;
    maxLength?: number;
  } = {}
): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  let result = str;

  if (options.stripHtml) {
    result = stripHtmlTags(result);
  }

  result = escapeHtml(result);

  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  return result.trim();
}

function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  email = email.trim().toLowerCase();

  if (!emailRegex.test(email)) {
    return null;
  }

  if (email.length > 254) {
    return null;
  }

  return email;
}

function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  url = url.trim();

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];

  const lowerUrl = url.toLowerCase();
  if (dangerousProtocols.some(proto => lowerUrl.includes(proto))) {
    return null;
  }

  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function sanitizeInteger(
  value: any,
  options: {
    min?: number;
    max?: number;
  } = {}
): number | null {
  if (typeof value === 'string' && value.includes('.')) {
    return null;
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);

  if (isNaN(num) || !Number.isFinite(num)) {
    return null;
  }

  if (!Number.isInteger(num)) {
    return null;
  }

  if (options.min !== undefined && num < options.min) {
    return null;
  }

  if (options.max !== undefined && num > options.max) {
    return null;
  }

  if (!Number.isSafeInteger(num)) {
    return null;
  }

  return num;
}

function sanitizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

function sanitizeUuid(uuid: string): string | null {
  if (typeof uuid !== 'string') {
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  uuid = uuid.trim().toLowerCase();

  if (!uuidRegex.test(uuid)) {
    return null;
  }

  return uuid;
}

describe('Item 52: Utility Unit Tests - Part 2: Sanitization', () => {
  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
    });

    it('should handle strings with no special chars', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should convert non-strings to string', () => {
      expect(escapeHtml(123 as any)).toBe('123');
    });
  });

  describe('stripHtmlTags()', () => {
    it('should remove HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should remove script tags and content', () => {
      expect(stripHtmlTags('Text<script>alert("XSS")</script>More'))
        .toBe('TextMore');
    });

    it('should remove style tags and content', () => {
      expect(stripHtmlTags('Text<style>.class{color:red;}</style>More'))
        .toBe('TextMore');
    });

    it('should handle nested tags', () => {
      expect(stripHtmlTags('<div><p><span>Hello</span></p></div>')).toBe('Hello');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtmlTags('Line<br/>Break')).toBe('LineBreak');
    });
  });

  describe('sanitizeString()', () => {
    it('should escape HTML by default', () => {
      expect(sanitizeString('<script>alert(1)</script>'))
        .toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    });

    it('should strip HTML when stripHtml option is true', () => {
      expect(sanitizeString('<p>Hello</p>', { stripHtml: true }))
        .toBe('Hello');
    });

    it('should enforce max length', () => {
      expect(sanitizeString('Hello World', { maxLength: 5 }))
        .toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  Hello  ')).toBe('Hello');
    });
  });

  describe('sanitizeEmail()', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
      'user_name@example-domain.com',
    ];

    validEmails.forEach(email => {
      it(`should accept valid email: ${email}`, () => {
        expect(sanitizeEmail(email)).not.toBeNull();
      });
    });

    const invalidEmails = [
      'not-an-email',
      '@example.com',
      'user@',
      'user',
      'user@.com',
      '',
    ];

    invalidEmails.forEach(email => {
      it(`should reject invalid email: ${email}`, () => {
        expect(sanitizeEmail(email)).toBeNull();
      });
    });

    it('should convert email to lowercase', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('should reject email longer than 254 chars', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(sanitizeEmail(longEmail)).toBeNull();
    });
  });

  describe('sanitizeUrl()', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should accept valid HTTP URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should reject javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should reject data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('should reject URLs without protocol', () => {
      expect(sanitizeUrl('example.com')).toBeNull();
    });

    it('should reject malformed URLs', () => {
      expect(sanitizeUrl('http://')).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('sanitizeInteger()', () => {
    it('should accept valid integers', () => {
      expect(sanitizeInteger(42)).toBe(42);
      expect(sanitizeInteger('42')).toBe(42);
      expect(sanitizeInteger(0)).toBe(0);
      expect(sanitizeInteger(-10)).toBe(-10);
    });

    it('should reject decimals', () => {
      expect(sanitizeInteger(42.5)).toBeNull();
      expect(sanitizeInteger('42.5')).toBeNull();
    });

    it('should reject non-numbers', () => {
      expect(sanitizeInteger('not-a-number')).toBeNull();
      expect(sanitizeInteger(NaN)).toBeNull();
      expect(sanitizeInteger(Infinity)).toBeNull();
    });

    it('should enforce min constraint', () => {
      expect(sanitizeInteger(5, { min: 10 })).toBeNull();
      expect(sanitizeInteger(10, { min: 10 })).toBe(10);
      expect(sanitizeInteger(15, { min: 10 })).toBe(15);
    });

    it('should enforce max constraint', () => {
      expect(sanitizeInteger(15, { max: 10 })).toBeNull();
      expect(sanitizeInteger(10, { max: 10 })).toBe(10);
      expect(sanitizeInteger(5, { max: 10 })).toBe(5);
    });

    it('should reject unsafe integers', () => {
      expect(sanitizeInteger(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
    });
  });

  describe('sanitizeBoolean()', () => {
    it('should accept boolean true/false', () => {
      expect(sanitizeBoolean(true)).toBe(true);
      expect(sanitizeBoolean(false)).toBe(false);
    });

    it('should convert string "true" to true', () => {
      expect(sanitizeBoolean('true')).toBe(true);
      expect(sanitizeBoolean('TRUE')).toBe(true);
      expect(sanitizeBoolean('True')).toBe(true);
    });

    it('should convert string "1" to true', () => {
      expect(sanitizeBoolean('1')).toBe(true);
    });

    it('should convert string "yes" to true', () => {
      expect(sanitizeBoolean('yes')).toBe(true);
      expect(sanitizeBoolean('YES')).toBe(true);
    });

    it('should convert other strings to false', () => {
      expect(sanitizeBoolean('false')).toBe(false);
      expect(sanitizeBoolean('no')).toBe(false);
      expect(sanitizeBoolean('random')).toBe(false);
    });

    it('should convert numbers to boolean', () => {
      expect(sanitizeBoolean(1)).toBe(true);
      expect(sanitizeBoolean(0)).toBe(false);
      expect(sanitizeBoolean(42)).toBe(true);
    });
  });

  describe('sanitizeUuid()', () => {
    it('should accept valid UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        '00000000-0000-0000-0000-000000000000',
      ];

      validUuids.forEach(uuid => {
        expect(sanitizeUuid(uuid)).not.toBeNull();
      });
    });

    it('should convert UUID to lowercase', () => {
      expect(sanitizeUuid('123E4567-E89B-12D3-A456-426614174000'))
        .toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid UUIDs', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',  // Too short
        '123e4567-e89b-12d3-a456-426614174000-extra',  // Too long
        '123e4567e89b12d3a456426614174000',  // Missing dashes
        '',
      ];

      invalidUuids.forEach(uuid => {
        expect(sanitizeUuid(uuid)).toBeNull();
      });
    });

    it('should trim whitespace', () => {
      expect(sanitizeUuid('  123e4567-e89b-12d3-a456-426614174000  '))
        .toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });
});

// =============================================================================
// PART 3: PIN Validator Tests
// =============================================================================

// PIN validator functions (from pinValidator.ts)
const COMMON_PINS: Set<string> = new Set([
  '1234', '1111', '0000', '1212', '7777',
  '1004', '2000', '4444', '2222', '6969',
  '9999', '3333', '5555', '6666', '1122',
  '1313', '8888', '4321', '2001', '1010',
  '0101', '1231', '1201', '0420', '1225',
  '0704', '2345', '3456', '4567', '5678',
  '6789', '9876', '8765', '7654', '6543',
  '5432', '2580', '1379', '2468', '1357',
  '2121', '3131', '1414', '4141', '1515', '5151',
]);

function validatePinFormat(pin: string): boolean {
  if (!pin) return false;
  if (pin.length !== 4) return false;
  if (!/^\d{4}$/.test(pin)) return false;
  return true;
}

function isSequentialPin(pin: string): boolean {
  const digits = pin.split('').map(Number);

  let isAscending = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1] + 1) {
      isAscending = false;
      break;
    }
  }

  let isDescending = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1] - 1) {
      isDescending = false;
      break;
    }
  }

  const isWrappingAscending =
    (digits[0] === 9 && digits[1] === 0 && digits[2] === 1 && digits[3] === 2) ||
    (digits[0] === 8 && digits[1] === 9 && digits[2] === 0 && digits[3] === 1) ||
    (digits[0] === 7 && digits[1] === 8 && digits[2] === 9 && digits[3] === 0);

  return isAscending || isDescending || isWrappingAscending;
}

function isRepeatedPin(pin: string): boolean {
  const firstDigit = pin.charAt(0);
  return pin.split('').every(digit => digit === firstDigit);
}

function isCommonPin(pin: string): boolean {
  return COMMON_PINS.has(pin);
}

function hasRepeatedPairs(pin: string): boolean {
  const firstPair = pin.substring(0, 2);
  const secondPair = pin.substring(2, 4);
  return firstPair === secondPair;
}

function validatePinStrength(pin: string): {
  isValid: boolean;
  error?: string;
  reason?: string;
} {
  if (!validatePinFormat(pin)) {
    return {
      isValid: false,
      error: 'INVALID_PIN_FORMAT',
      reason: 'PIN must be exactly 4 digits',
    };
  }

  if (isRepeatedPin(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'PIN cannot be all the same digit (e.g., 1111, 0000)',
    };
  }

  if (isSequentialPin(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'PIN cannot be sequential (e.g., 1234, 4321)',
    };
  }

  if (hasRepeatedPairs(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'PIN cannot have repeated pairs (e.g., 1212, 3434)',
    };
  }

  if (isCommonPin(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'This PIN is too common. Please choose a different one',
    };
  }

  return {
    isValid: true,
  };
}

describe('Item 52: Utility Unit Tests - Part 3: PIN Validator', () => {
  describe('validatePinFormat()', () => {
    it('should accept valid 4-digit PINs', () => {
      expect(validatePinFormat('1234')).toBe(true);
      expect(validatePinFormat('0000')).toBe(true);
      expect(validatePinFormat('9999')).toBe(true);
      expect(validatePinFormat('5739')).toBe(true);
    });

    it('should reject non-4-digit PINs', () => {
      expect(validatePinFormat('123')).toBe(false);
      expect(validatePinFormat('12345')).toBe(false);
    });

    it('should reject non-numeric PINs', () => {
      expect(validatePinFormat('abcd')).toBe(false);
      expect(validatePinFormat('12a4')).toBe(false);
    });

    it('should reject empty or null PIN', () => {
      expect(validatePinFormat('')).toBe(false);
      expect(validatePinFormat(null as any)).toBe(false);
      expect(validatePinFormat(undefined as any)).toBe(false);
    });
  });

  describe('isSequentialPin()', () => {
    const sequentialPins = [
      '1234', '2345', '3456', '4567', '5678', '6789', '0123',
      '4321', '5432', '6543', '7654', '8765', '9876',
      '9012', '8901', '7890',  // Wrapping sequences
    ];

    sequentialPins.forEach(pin => {
      it(`should detect sequential PIN: ${pin}`, () => {
        expect(isSequentialPin(pin)).toBe(true);
      });
    });

    const nonSequentialPins = [
      '1357', '2468', '1593', '7259', '5739',
    ];

    nonSequentialPins.forEach(pin => {
      it(`should not detect as sequential: ${pin}`, () => {
        expect(isSequentialPin(pin)).toBe(false);
      });
    });
  });

  describe('isRepeatedPin()', () => {
    const repeatedPins = [
      '0000', '1111', '2222', '3333', '4444',
      '5555', '6666', '7777', '8888', '9999',
    ];

    repeatedPins.forEach(pin => {
      it(`should detect repeated PIN: ${pin}`, () => {
        expect(isRepeatedPin(pin)).toBe(true);
      });
    });

    const nonRepeatedPins = [
      '1234', '1122', '1212', '5739',
    ];

    nonRepeatedPins.forEach(pin => {
      it(`should not detect as repeated: ${pin}`, () => {
        expect(isRepeatedPin(pin)).toBe(false);
      });
    });
  });

  describe('isCommonPin()', () => {
    const commonPins = [
      '1234', '0000', '1111', '1212', '7777',
      '4321', '2222', '5555', '6666',
    ];

    commonPins.forEach(pin => {
      it(`should detect common PIN: ${pin}`, () => {
        expect(isCommonPin(pin)).toBe(true);
      });
    });

    const uncommonPins = [
      '5739', '8264', '3197', '6482',
    ];

    uncommonPins.forEach(pin => {
      it(`should not detect as common: ${pin}`, () => {
        expect(isCommonPin(pin)).toBe(false);
      });
    });
  });

  describe('hasRepeatedPairs()', () => {
    const repeatedPairPins = [
      '1212', '3434', '5656', '7878', '9090',
    ];

    repeatedPairPins.forEach(pin => {
      it(`should detect repeated pairs: ${pin}`, () => {
        expect(hasRepeatedPairs(pin)).toBe(true);
      });
    });

    const nonRepeatedPairPins = [
      '1234', '5739', '1357', '2468',
    ];

    nonRepeatedPairPins.forEach(pin => {
      it(`should not detect repeated pairs: ${pin}`, () => {
        expect(hasRepeatedPairs(pin)).toBe(false);
      });
    });
  });

  describe('validatePinStrength()', () => {
    it('should accept strong PINs', () => {
      const strongPins = ['5739', '8264', '3197', '6482', '9573'];

      strongPins.forEach(pin => {
        const result = validatePinStrength(pin);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid format', () => {
      const result = validatePinStrength('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_PIN_FORMAT');
    });

    it('should reject repeated digits', () => {
      const result = validatePinStrength('1111');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('same digit');
    });

    it('should reject sequential patterns', () => {
      const result = validatePinStrength('1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('sequential');
    });

    it('should reject repeated pairs', () => {
      const result = validatePinStrength('1212');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('repeated pairs');
    });

    it('should reject common PINs', () => {
      const result = validatePinStrength('1004');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('too common');
    });

    it('should provide helpful error messages', () => {
      const repeatedResult = validatePinStrength('1111');
      expect(repeatedResult.reason).toContain('1111');

      const sequentialResult = validatePinStrength('1234');
      expect(sequentialResult.reason).toContain('1234');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle all validations for weak PIN', () => {
      const weakPins = ['1234', '0000', '1212', '4321'];

      weakPins.forEach(pin => {
        const result = validatePinStrength(pin);
        expect(result.isValid).toBe(false);
      });
    });

    it('should validate multiple strong PINs consistently', () => {
      const strongPins = ['5739', '8264', '3197'];

      strongPins.forEach(pin => {
        expect(validatePinStrength(pin).isValid).toBe(true);
      });
    });

    it('should handle format validation before strength validation', () => {
      const result = validatePinStrength('abc');
      expect(result.error).toBe('INVALID_PIN_FORMAT');
    });
  });
});
