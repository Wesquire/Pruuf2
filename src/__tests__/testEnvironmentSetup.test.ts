/**
 * Test Environment Setup Verification
 *
 * Verifies that the test environment configuration works correctly.
 * These tests validate:
 * 1. Test configuration is valid
 * 2. Test email/ID generation works
 * 3. Configuration validation works
 *
 * Note: Live Supabase tests are conditional on having credentials.
 */

import {describe, it, expect} from '@jest/globals';

// Import from tests/setup (these are utility modules, not test files)
import {
  TEST_CONFIG,
  generateTestEmail,
  generateTestId,
  isTestEmail,
  validateTestConfig,
} from '../../tests/setup/testConfig';

describe('Test Environment Setup Verification', () => {
  describe('1. Test Configuration', () => {
    it('should have Supabase URL configured', () => {
      expect(TEST_CONFIG.supabase.url).toBeDefined();
      expect(TEST_CONFIG.supabase.url).toContain('supabase.co');
    });

    it('should have test prefixes configured', () => {
      expect(TEST_CONFIG.testPrefixes.email).toBe('test+');
      expect(TEST_CONFIG.testPrefixes.emailDomain).toBe('@pruuf.me');
    });

    it('should have timeouts configured', () => {
      expect(TEST_CONFIG.timeouts.api).toBe(10000);
      expect(TEST_CONFIG.timeouts.database).toBe(5000);
      expect(TEST_CONFIG.timeouts.cleanup).toBe(30000);
    });

    it('should have isolation settings configured', () => {
      expect(TEST_CONFIG.isolation.useTimestampSuffix).toBe(true);
      expect(TEST_CONFIG.isolation.cleanupAfterSuite).toBe(true);
    });
  });

  describe('2. Test Email Generation', () => {
    it('should generate unique test emails', () => {
      const email1 = generateTestEmail('user');
      const email2 = generateTestEmail('user');

      expect(email1).not.toBe(email2);
      expect(email1).toMatch(/^test\+user_\d+_[a-z0-9]+@pruuf\.me$/);
      expect(email2).toMatch(/^test\+user_\d+_[a-z0-9]+@pruuf\.me$/);
    });

    it('should generate emails with custom prefix', () => {
      const email = generateTestEmail('member');
      expect(email).toMatch(/^test\+member_\d+_[a-z0-9]+@pruuf\.me$/);
    });

    it('should generate emails with default prefix', () => {
      const email = generateTestEmail();
      expect(email).toMatch(/^test\+user_\d+_[a-z0-9]+@pruuf\.me$/);
    });

    it('should identify test emails correctly', () => {
      expect(isTestEmail('test+user_123@pruuf.me')).toBe(true);
      expect(isTestEmail('test+abc@pruuf.me')).toBe(true);
      expect(isTestEmail('test+member_456_xyz@pruuf.me')).toBe(true);
    });

    it('should reject non-test emails', () => {
      expect(isTestEmail('user@pruuf.me')).toBe(false);
      expect(isTestEmail('test+user@gmail.com')).toBe(false);
      expect(isTestEmail('admin@pruuf.me')).toBe(false);
      expect(isTestEmail('')).toBe(false);
    });
  });

  describe('3. Test ID Generation', () => {
    it('should generate unique test IDs', () => {
      const id1 = generateTestId();
      const id2 = generateTestId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
    });

    it('should generate IDs with timestamp component', () => {
      const id = generateTestId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('test');
      expect(parseInt(parts[1])).toBeGreaterThan(0);
    });
  });

  describe('4. Configuration Validation', () => {
    it('should return validation result object', () => {
      const result = validateTestConfig();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should validate Supabase URL is set', () => {
      // URL should always be set (has default)
      const result = validateTestConfig();
      expect(result.errors).not.toContain('SUPABASE_URL is not configured');
    });

    it('should report service role key status correctly', () => {
      const result = validateTestConfig();
      if (!TEST_CONFIG.supabase.serviceRoleKey) {
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'SUPABASE_SERVICE_ROLE_KEY is not configured (required for integration tests)'
        );
      } else {
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      }
    });
  });
});
