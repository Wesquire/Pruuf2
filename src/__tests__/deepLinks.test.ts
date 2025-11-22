/**
 * Deep Links Tests
 */

import { parseDeepLink, buildDeepLink } from '../utils/deepLinks';

describe('deepLinks', () => {
  describe('parseDeepLink', () => {
    it('should parse home route', () => {
      const result = parseDeepLink('pruuf://');
      expect(result.route).toBe('home');
      expect(result.params).toEqual({});
    });

    it('should parse member dashboard route', () => {
      const result = parseDeepLink('pruuf://member-dashboard');
      expect(result.route).toBe('member-dashboard');
      expect(result.params).toEqual({});
    });

    it('should parse contact dashboard route', () => {
      const result = parseDeepLink('pruuf://contact-dashboard');
      expect(result.route).toBe('contact-dashboard');
      expect(result.params).toEqual({});
    });

    it('should parse check-in history route', () => {
      const result = parseDeepLink('pruuf://check-in-history');
      expect(result.route).toBe('check-in-history');
      expect(result.params).toEqual({});
    });

    it('should parse member settings route', () => {
      const result = parseDeepLink('pruuf://member/settings');
      expect(result.route).toBe('member-settings');
      expect(result.params).toEqual({});
    });

    it('should parse contact settings route', () => {
      const result = parseDeepLink('pruuf://contact/settings');
      expect(result.route).toBe('contact-settings');
      expect(result.params).toEqual({});
    });

    it('should parse notification settings route', () => {
      const result = parseDeepLink('pruuf://settings/notifications');
      expect(result.route).toBe('notification-settings');
      expect(result.params).toEqual({});
    });

    it('should parse payment settings route', () => {
      const result = parseDeepLink('pruuf://settings/payment');
      expect(result.route).toBe('payment-settings');
      expect(result.params).toEqual({});
    });

    it('should parse member detail route with params', () => {
      const result = parseDeepLink('pruuf://member/detail?memberId=123');
      expect(result.route).toBe('member-detail');
      expect(result.params).toEqual({ memberId: '123' });
    });

    it('should parse contact detail route with params', () => {
      const result = parseDeepLink('pruuf://contact/detail?contactId=456');
      expect(result.route).toBe('contact-detail');
      expect(result.params).toEqual({ contactId: '456' });
    });

    it('should parse invite code route', () => {
      const result = parseDeepLink('pruuf://invite?code=ABC123');
      expect(result.route).toBe('invite-code');
      expect(result.params).toEqual({ code: 'ABC123' });
    });

    it('should handle multiple params', () => {
      const result = parseDeepLink('pruuf://member/detail?memberId=123&name=John');
      expect(result.route).toBe('member-detail');
      expect(result.params).toEqual({
        memberId: '123',
        name: 'John',
      });
    });

    it('should handle unknown routes', () => {
      const result = parseDeepLink('pruuf://unknown-route');
      expect(result.route).toBeNull();
      expect(result.params).toEqual({});
    });

    it('should handle invalid URLs', () => {
      const result = parseDeepLink('not-a-valid-url');
      expect(result.route).toBeNull();
      expect(result.params).toEqual({});
    });
  });

  describe('buildDeepLink', () => {
    it('should build home link', () => {
      const url = buildDeepLink('home');
      expect(url).toBe('pruuf://');
    });

    it('should build member dashboard link', () => {
      const url = buildDeepLink('member-dashboard');
      expect(url).toBe('pruuf://member-dashboard');
    });

    it('should build contact dashboard link', () => {
      const url = buildDeepLink('contact-dashboard');
      expect(url).toBe('pruuf://contact-dashboard');
    });

    it('should build check-in history link', () => {
      const url = buildDeepLink('check-in-history');
      expect(url).toBe('pruuf://check-in-history');
    });

    it('should build member detail link with params', () => {
      const url = buildDeepLink('member-detail', { memberId: '123' });
      expect(url).toBe('pruuf://member/detail?memberId=123');
    });

    it('should build contact detail link with params', () => {
      const url = buildDeepLink('contact-detail', { contactId: '456' });
      expect(url).toBe('pruuf://contact/detail?contactId=456');
    });

    it('should build invite link with code', () => {
      const url = buildDeepLink('invite-code', { code: 'ABC123' });
      expect(url).toBe('pruuf://invite?code=ABC123');
    });

    it('should build link with multiple params', () => {
      const url = buildDeepLink('member-detail', {
        memberId: '123',
        name: 'John',
      });
      expect(url).toContain('pruuf://member/detail?');
      expect(url).toContain('memberId=123');
      expect(url).toContain('name=John');
    });

    it('should handle params with special characters', () => {
      const url = buildDeepLink('member-detail', {
        name: 'John Doe',
      });
      expect(url).toBe('pruuf://member/detail?name=John+Doe');
    });
  });

  describe('parseDeepLink and buildDeepLink roundtrip', () => {
    it('should maintain data integrity for home route', () => {
      const original = buildDeepLink('home');
      const parsed = parseDeepLink(original);
      expect(parsed.route).toBe('home');
    });

    it('should maintain data integrity for member detail with params', () => {
      const original = buildDeepLink('member-detail', { memberId: '123' });
      const parsed = parseDeepLink(original);
      expect(parsed.route).toBe('member-detail');
      expect(parsed.params.memberId).toBe('123');
    });

    it('should maintain data integrity for invite with code', () => {
      const original = buildDeepLink('invite-code', { code: 'ABC123' });
      const parsed = parseDeepLink(original);
      expect(parsed.route).toBe('invite-code');
      expect(parsed.params.code).toBe('ABC123');
    });
  });
});
