/**
 * Item 18: Input Sanitization - Tests
 *
 * HIGH: Tests comprehensive input sanitization
 */

import { describe, it, expect } from '@jest/globals';

// Import sanitization functions
const {
  escapeHtml,
  stripHtmlTags,
  removeDangerousChars,
  sanitizeSql,
  sanitizeFilePath,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeString,
  sanitizeInteger,
  sanitizeBoolean,
  sanitizeUuid,
  sanitizeObject,
  sanitizeJson,
  sanitizePhone,
} = require('../supabase/functions/_shared/sanitizer.ts');

describe('Item 18: Input Sanitization', () => {
  describe('Test 18.1: HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml(`Hello "World"`)).toBe('Hello &quot;World&quot;');
      expect(escapeHtml(`Hello 'World'`)).toBe('Hello &#x27;World&#x27;');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should convert non-strings to string', () => {
      expect(escapeHtml(123 as any)).toBe('123');
    });
  });

  describe('Test 18.2: HTML Tag Stripping', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should remove script tags', () => {
      // stripHtmlTags removes script tags AND their content for security
      expect(stripHtmlTags('<script>alert(1)</script>Hello')).toBe('Hello');
    });

    it('should remove self-closing tags', () => {
      expect(stripHtmlTags('Hello<br/>World')).toBe('HelloWorld');
    });

    it('should handle nested tags', () => {
      expect(stripHtmlTags('<div><p><span>Text</span></p></div>')).toBe('Text');
    });

    it('should handle malformed HTML', () => {
      // Removes whatever looks like a tag
      expect(stripHtmlTags('<div<p>Text</p>')).toBe('Text');
    });
  });

  describe('Test 18.3: Dangerous Character Removal', () => {
    it('should remove semicolons', () => {
      expect(removeDangerousChars('hello; DROP TABLE')).toBe('hello DROP TABLE');
    });

    it('should remove backticks', () => {
      expect(removeDangerousChars('hello `world`')).toBe('hello world');
    });

    it('should remove null bytes', () => {
      expect(removeDangerousChars('hello\x00world')).toBe('helloworld');
    });

    it('should remove backslashes', () => {
      expect(removeDangerousChars('hello\\world')).toBe('helloworld');
    });

    it('should trim whitespace', () => {
      expect(removeDangerousChars('  hello  ')).toBe('hello');
    });
  });

  describe('Test 18.4: SQL Injection Prevention', () => {
    it('should remove SQL injection patterns', () => {
      // Removes quotes, semicolons, comments, and trims
      expect(sanitizeSql("'; DROP TABLE users; --")).toBe('DROP TABLE users');
    });

    it('should remove quotes', () => {
      expect(sanitizeSql(`'OR'1'='1`)).toBe('OR1=1');
    });

    it('should remove SQL comments', () => {
      expect(sanitizeSql('SELECT * FROM users -- comment')).toBe('SELECT * FROM users  comment');
    });

    it('should remove /* */ comments', () => {
      expect(sanitizeSql('SELECT /* comment */ * FROM users')).toBe('SELECT  * FROM users');
    });

    it('should allow safe input', () => {
      expect(sanitizeSql('John Doe')).toBe('John Doe');
    });
  });

  describe('Test 18.5: Path Traversal Prevention', () => {
    it('should reject ../ patterns', () => {
      expect(sanitizeFilePath('../../etc/passwd')).toBeNull();
    });

    it('should reject ..\\ patterns', () => {
      expect(sanitizeFilePath('..\\..\\windows\\system32')).toBeNull();
    });

    it('should reject URL encoded patterns', () => {
      expect(sanitizeFilePath('%2e%2e/etc/passwd')).toBeNull();
      expect(sanitizeFilePath('%252e%252e/etc/passwd')).toBeNull();
    });

    it('should reject absolute paths', () => {
      expect(sanitizeFilePath('/etc/passwd')).toBeNull();
      expect(sanitizeFilePath('C:\\Windows\\System32')).toBeNull();
    });

    it('should allow safe relative paths', () => {
      expect(sanitizeFilePath('uploads/image.jpg')).toBe('uploads/image.jpg');
      expect(sanitizeFilePath('docs/file.pdf')).toBe('docs/file.pdf');
    });

    it('should remove null bytes', () => {
      const result = sanitizeFilePath('file\x00.txt');
      expect(result).toBe('file.txt');
    });
  });

  describe('Test 18.6: Email Sanitization', () => {
    it('should accept valid emails', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(sanitizeEmail('first.last@example.co.uk')).toBe('first.last@example.co.uk');
    });

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('not-an-email')).toBeNull();
      expect(sanitizeEmail('@example.com')).toBeNull();
      expect(sanitizeEmail('user@')).toBeNull();
    });

    it('should lowercase and trim', () => {
      expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('should reject emails over 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(sanitizeEmail(longEmail)).toBeNull();
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(123 as any)).toBeNull();
    });
  });

  describe('Test 18.7: URL Sanitization', () => {
    it('should accept valid HTTP URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject vbscript: protocol', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
    });

    it('should reject file: protocol', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('should reject non-HTTP protocols', () => {
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
    });

    it('should reject malformed URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
    });
  });

  describe('Test 18.8: String Sanitization', () => {
    it('should escape HTML by default', () => {
      const result = sanitizeString('<script>alert(1)</script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should strip HTML when requested', () => {
      const result = sanitizeString('<p>Hello</p>', { stripHtml: true });
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove dangerous chars when requested', () => {
      const result = sanitizeString('hello; world', { removeDangerous: true });
      expect(result).not.toContain(';');
    });

    it('should enforce max length', () => {
      const result = sanitizeString('hello world', { maxLength: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
  });

  describe('Test 18.9: Integer Sanitization', () => {
    it('should parse valid integers', () => {
      expect(sanitizeInteger('42')).toBe(42);
      expect(sanitizeInteger(42)).toBe(42);
      expect(sanitizeInteger('-10')).toBe(-10);
    });

    it('should reject non-integers', () => {
      expect(sanitizeInteger('not-a-number')).toBeNull();
      expect(sanitizeInteger('3.14')).toBeNull();
      expect(sanitizeInteger(3.14)).toBeNull();
    });

    it('should reject NaN and Infinity', () => {
      expect(sanitizeInteger(NaN)).toBeNull();
      expect(sanitizeInteger(Infinity)).toBeNull();
    });

    it('should enforce min/max bounds', () => {
      expect(sanitizeInteger(5, { min: 0, max: 10 })).toBe(5);
      expect(sanitizeInteger(-1, { min: 0 })).toBeNull();
      expect(sanitizeInteger(100, { max: 10 })).toBeNull();
    });

    it('should reject unsafe integers', () => {
      expect(sanitizeInteger(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
    });
  });

  describe('Test 18.10: Boolean Sanitization', () => {
    it('should parse boolean strings', () => {
      expect(sanitizeBoolean('true')).toBe(true);
      expect(sanitizeBoolean('false')).toBe(false);
      expect(sanitizeBoolean('TRUE')).toBe(true);
    });

    it('should parse numeric strings', () => {
      expect(sanitizeBoolean('1')).toBe(true);
      expect(sanitizeBoolean('0')).toBe(false);
    });

    it('should parse yes/no', () => {
      expect(sanitizeBoolean('yes')).toBe(true);
      expect(sanitizeBoolean('no')).toBe(false);
    });

    it('should handle boolean types', () => {
      expect(sanitizeBoolean(true)).toBe(true);
      expect(sanitizeBoolean(false)).toBe(false);
    });

    it('should handle numbers', () => {
      expect(sanitizeBoolean(1)).toBe(true);
      expect(sanitizeBoolean(0)).toBe(false);
      expect(sanitizeBoolean(42)).toBe(true);
    });
  });

  describe('Test 18.11: UUID Sanitization', () => {
    it('should accept valid UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(sanitizeUuid(uuid)).toBe(uuid);
    });

    it('should lowercase UUIDs', () => {
      const uuid = '123E4567-E89B-12D3-A456-426614174000';
      expect(sanitizeUuid(uuid)).toBe(uuid.toLowerCase());
    });

    it('should reject invalid UUIDs', () => {
      expect(sanitizeUuid('not-a-uuid')).toBeNull();
      expect(sanitizeUuid('123e4567-e89b-12d3-a456')).toBeNull();
    });

    it('should handle non-string input', () => {
      expect(sanitizeUuid(123 as any)).toBeNull();
    });
  });

  describe('Test 18.12: Object Sanitization', () => {
    it('should sanitize string properties', () => {
      const obj = {
        name: '<script>alert(1)</script>',
        age: 25,
      };

      const result = sanitizeObject(obj);
      expect(result.name).toContain('&lt;');
      expect(result.age).toBe(25);
    });

    it('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<b>John</b>',
          profile: {
            bio: '<script>XSS</script>',
          },
        },
      };

      const result = sanitizeObject(obj);
      expect(result.user.name).toContain('&lt;');
      expect(result.user.profile.bio).toContain('&lt;');
    });

    it('should sanitize arrays', () => {
      const obj = {
        tags: ['<script>alert(1)</script>', 'safe', '<b>bold</b>'],
      };

      const result = sanitizeObject(obj);
      expect(result.tags[0]).toContain('&lt;');
      expect(result.tags[1]).toBe('safe');
    });

    it('should prevent infinite recursion', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw
      expect(() => sanitizeObject(circular, { maxDepth: 5 })).not.toThrow();
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });

  describe('Test 18.13: JSON Sanitization', () => {
    it('should parse and sanitize valid JSON', () => {
      const json = '{"name":"<script>alert(1)</script>"}';
      const result = sanitizeJson(json);

      expect(result).toBeDefined();
      expect(result.name).toContain('&lt;');
    });

    it('should reject invalid JSON', () => {
      expect(sanitizeJson('not json')).toBeNull();
      expect(sanitizeJson('{invalid}')).toBeNull();
    });

    it('should reject oversized JSON', () => {
      const large = '{"data":"' + 'a'.repeat(2000000) + '"}';
      expect(sanitizeJson(large, 1000)).toBeNull();
    });

    it('should handle nested JSON', () => {
      const json = '{"user":{"name":"<b>John</b>"}}';
      const result = sanitizeJson(json);

      expect(result.user.name).toContain('&lt;');
    });
  });

  describe('Test 18.14: Phone Number Sanitization', () => {
    it('should remove formatting characters', () => {
      expect(sanitizePhone('(555) 123-4567')).toBe('5551234567');
      expect(sanitizePhone('555-123-4567')).toBe('5551234567');
    });

    it('should keep + for international', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    });

    it('should remove letters', () => {
      expect(sanitizePhone('1-800-FLOWERS')).toBe('1800');
    });

    it('should handle empty string', () => {
      expect(sanitizePhone('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizePhone(123 as any)).toBe('');
    });
  });

  describe('Test 18.15: XSS Attack Vectors', () => {
    it('should prevent script tag injection', () => {
      const xss = '<script>alert(document.cookie)</script>';
      const result = sanitizeString(xss);
      expect(result).not.toContain('<script');
      expect(result).toContain('&lt;');
    });

    it('should prevent img tag XSS', () => {
      const xss = '<img src=x onerror=alert(1)>';
      const result = sanitizeString(xss);
      expect(result).toContain('&lt;');
    });

    it('should prevent event handler XSS', () => {
      const xss = '<div onclick="alert(1)">Click</div>';
      const result = sanitizeString(xss);
      expect(result).toContain('&lt;');
    });

    it('should prevent javascript: URL XSS', () => {
      const xss = 'javascript:alert(1)';
      const result = sanitizeUrl(xss);
      expect(result).toBeNull();
    });

    it('should prevent data: URL XSS', () => {
      const xss = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeUrl(xss);
      expect(result).toBeNull();
    });
  });

  describe('Test 18.16: SQL Injection Vectors', () => {
    it('should prevent classic SQL injection', () => {
      const sql = "1' OR '1'='1";
      const result = sanitizeSql(sql);
      expect(result).not.toContain("'");
    });

    it('should prevent UNION attacks', () => {
      const sql = "1' UNION SELECT * FROM users--";
      const result = sanitizeSql(sql);
      expect(result).not.toContain("'");
      expect(result).not.toContain('--');
    });

    it('should prevent comment-based injection', () => {
      const sql = "admin'--";
      const result = sanitizeSql(sql);
      expect(result).not.toContain("'");
      expect(result).not.toContain('--');
    });

    it('should prevent batch queries', () => {
      const sql = "'; DROP TABLE users;--";
      const result = sanitizeSql(sql);
      expect(result).not.toContain(';');
    });
  });

  describe('Test 18.17: Command Injection Prevention', () => {
    it('should remove semicolons (command separator)', () => {
      const cmd = 'filename.txt; rm -rf /';
      const result = removeDangerousChars(cmd);
      expect(result).not.toContain(';');
    });

    it('should remove backticks (command substitution)', () => {
      const cmd = 'file`whoami`.txt';
      const result = removeDangerousChars(cmd);
      expect(result).not.toContain('`');
    });

    it('should remove null bytes', () => {
      const cmd = 'file.txt\x00; rm -rf /';
      const result = removeDangerousChars(cmd);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain(';');
    });
  });

  describe('Test 18.18: Path Traversal Vectors', () => {
    it('should prevent Unix path traversal', () => {
      expect(sanitizeFilePath('../../../etc/passwd')).toBeNull();
    });

    it('should prevent Windows path traversal', () => {
      expect(sanitizeFilePath('..\\..\\..\\windows\\system32')).toBeNull();
    });

    it('should prevent URL encoded traversal', () => {
      expect(sanitizeFilePath('%2e%2e%2f%2e%2e%2fetc%2fpasswd')).toBeNull();
    });

    it('should prevent double encoded traversal', () => {
      expect(sanitizeFilePath('%252e%252e%252f')).toBeNull();
    });
  });

  describe('Test 18.19: Edge Cases', () => {
    it('should handle very long strings', () => {
      const long = 'a'.repeat(100000);
      const result = sanitizeString(long, { maxLength: 1000 });
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('should handle Unicode characters', () => {
      const unicode = 'Hello 世界 🌍';
      const result = sanitizeString(unicode);
      expect(result).toContain('Hello');
    });

    it('should handle mixed attacks', () => {
      const mixed = '<script>alert(1)</script>; DROP TABLE users; --';
      const result = sanitizeString(mixed, { removeDangerous: true });
      expect(result).not.toContain('<script');
      expect(result).not.toContain(';');
    });

    it('should handle empty objects', () => {
      expect(sanitizeObject({})).toEqual({});
    });

    it('should handle empty arrays', () => {
      expect(sanitizeObject([])).toEqual([]);
    });
  });

  describe('Test 18.20: Integration Tests', () => {
    it('should sanitize complete request body', () => {
      const body = {
        name: '<script>alert(1)</script>',
        email: '  USER@EXAMPLE.COM  ',
        bio: '<b>Hello</b> World; DROP TABLE',
        age: '25',
        active: 'true',
      };

      const result = sanitizeObject(body, { removeDangerous: true });

      expect(result.name).not.toContain('<script');
      expect(result.bio).not.toContain(';');
      expect(result).toBeDefined();
    });

    it('should handle complex nested data', () => {
      const data = {
        user: {
          profile: {
            name: '<script>XSS</script>',
            urls: [
              'javascript:alert(1)',
              'https://safe.com',
            ],
          },
        },
      };

      const result = sanitizeObject(data);
      expect(result.user.profile.name).toContain('&lt;');
    });
  });
});
