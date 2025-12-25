/**
 * Deep Linking Utilities Tests
 * Tests for src/utils/deepLinking.ts - the utilities used by DeepLinkHandler
 */

import {
  parseDeepLink,
  parseInvitationLink,
  parseEmailVerificationLink,
  generateDeepLink,
  generateWebDeepLink,
  generateInvitationMagicLink,
  generateEmailVerificationMagicLink,
  isValidInviteCode,
  isValidVerificationCode,
  DEEP_LINK_SCHEMES,
  DEEP_LINK_PATHS,
} from '../utils/deepLinking';

describe('deepLinking utilities', () => {
  describe('DEEP_LINK_SCHEMES', () => {
    it('should have correct app scheme', () => {
      expect(DEEP_LINK_SCHEMES.APP).toBe('pruuf://');
    });

    it('should have correct web scheme', () => {
      expect(DEEP_LINK_SCHEMES.WEB).toBe('https://pruuf.me/');
    });
  });

  describe('DEEP_LINK_PATHS', () => {
    it('should have all required paths', () => {
      expect(DEEP_LINK_PATHS.INVITE).toBe('invite');
      expect(DEEP_LINK_PATHS.VERIFY_EMAIL).toBe('verify-email');
      expect(DEEP_LINK_PATHS.CHECK_IN).toBe('check-in');
      expect(DEEP_LINK_PATHS.MEMBER_DETAIL).toBe('member');
      expect(DEEP_LINK_PATHS.SETTINGS).toBe('settings');
    });
  });

  describe('parseDeepLink', () => {
    describe('app scheme (pruuf://)', () => {
      it('should parse invite link with code', () => {
        const result = parseDeepLink('pruuf://invite/ABC123');
        expect(result).not.toBeNull();
        expect(result?.scheme).toBe('pruuf');
        expect(result?.path).toBe('invite');
        expect(result?.params).toEqual(['ABC123']);
      });

      it('should parse verify-email link with code', () => {
        const result = parseDeepLink('pruuf://verify-email/XYZ789');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('verify-email');
        expect(result?.params).toEqual(['XYZ789']);
      });

      it('should parse check-in link', () => {
        const result = parseDeepLink('pruuf://check-in');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('check-in');
        expect(result?.params).toEqual([]);
      });

      it('should parse member detail link', () => {
        const result = parseDeepLink('pruuf://member/uuid-123');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('member');
        expect(result?.params).toEqual(['uuid-123']);
      });

      it('should parse settings link', () => {
        const result = parseDeepLink('pruuf://settings');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('settings');
        expect(result?.params).toEqual([]);
      });

      it('should parse settings/payment link', () => {
        const result = parseDeepLink('pruuf://settings/payment');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('settings');
        expect(result?.params).toEqual(['payment']);
      });

      it('should parse query parameters', () => {
        const result = parseDeepLink('pruuf://invite/ABC123?source=email');
        expect(result).not.toBeNull();
        expect(result?.queryParams).toEqual({source: 'email'});
      });

      it('should handle multiple query parameters', () => {
        const result = parseDeepLink('pruuf://settings?tab=notifications&scroll=top');
        expect(result).not.toBeNull();
        expect(result?.queryParams).toEqual({tab: 'notifications', scroll: 'top'});
      });

      it('should handle empty path', () => {
        const result = parseDeepLink('pruuf://');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('');
        expect(result?.params).toEqual([]);
      });
    });

    describe('web scheme (https://pruuf.me/)', () => {
      it('should parse web invite link', () => {
        const result = parseDeepLink('https://pruuf.me/invite/ABC123');
        expect(result).not.toBeNull();
        expect(result?.scheme).toBe('https');
        expect(result?.host).toBe('pruuf.me');
        expect(result?.path).toBe('invite');
        expect(result?.params).toEqual(['ABC123']);
      });

      it('should parse web verify-email link', () => {
        const result = parseDeepLink('https://pruuf.me/verify-email/XYZ789');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('verify-email');
        expect(result?.params).toEqual(['XYZ789']);
      });

      it('should parse web settings link', () => {
        const result = parseDeepLink('https://pruuf.me/settings/payment');
        expect(result).not.toBeNull();
        expect(result?.path).toBe('settings');
        expect(result?.params).toEqual(['payment']);
      });
    });

    describe('error handling', () => {
      it('should return null for empty string', () => {
        const result = parseDeepLink('');
        expect(result).toBeNull();
      });

      it('should return null for invalid scheme', () => {
        const result = parseDeepLink('http://example.com/invite/ABC123');
        expect(result).toBeNull();
      });

      it('should return null for malformed URL', () => {
        const result = parseDeepLink('not-a-url');
        expect(result).toBeNull();
      });

      it('should return null for different host', () => {
        const result = parseDeepLink('https://other-site.com/invite/ABC123');
        expect(result).toBeNull();
      });
    });
  });

  describe('parseInvitationLink', () => {
    it('should parse valid invitation link', () => {
      const deepLinkData = parseDeepLink('pruuf://invite/ABC123');
      expect(deepLinkData).not.toBeNull();

      const result = parseInvitationLink(deepLinkData!);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('invitation');
      expect(result?.inviteCode).toBe('ABC123');
    });

    it('should return null for non-invite path', () => {
      const deepLinkData = parseDeepLink('pruuf://settings');
      expect(deepLinkData).not.toBeNull();

      const result = parseInvitationLink(deepLinkData!);
      expect(result).toBeNull();
    });

    it('should return null for invalid invite code format', () => {
      const deepLinkData = parseDeepLink('pruuf://invite/abc'); // lowercase, only 3 chars
      expect(deepLinkData).not.toBeNull();

      const result = parseInvitationLink(deepLinkData!);
      expect(result).toBeNull();
    });

    it('should return null for missing invite code', () => {
      const deepLinkData = parseDeepLink('pruuf://invite');
      expect(deepLinkData).not.toBeNull();

      const result = parseInvitationLink(deepLinkData!);
      expect(result).toBeNull();
    });

    it('should accept valid 6-character alphanumeric codes', () => {
      const validCodes = ['ABC123', 'XYZ789', '123456', 'AAAAAA'];

      validCodes.forEach(code => {
        const deepLinkData = parseDeepLink(`pruuf://invite/${code}`);
        const result = parseInvitationLink(deepLinkData!);
        expect(result?.inviteCode).toBe(code);
      });
    });
  });

  describe('parseEmailVerificationLink', () => {
    it('should parse valid email verification link', () => {
      const deepLinkData = parseDeepLink('pruuf://verify-email/ABC123');
      expect(deepLinkData).not.toBeNull();

      const result = parseEmailVerificationLink(deepLinkData!);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('email_verification');
      expect(result?.verificationCode).toBe('ABC123');
    });

    it('should return null for non-verify-email path', () => {
      const deepLinkData = parseDeepLink('pruuf://invite/ABC123');
      expect(deepLinkData).not.toBeNull();

      const result = parseEmailVerificationLink(deepLinkData!);
      expect(result).toBeNull();
    });

    it('should return null for invalid verification code format', () => {
      const deepLinkData = parseDeepLink('pruuf://verify-email/ab'); // too short
      expect(deepLinkData).not.toBeNull();

      const result = parseEmailVerificationLink(deepLinkData!);
      expect(result).toBeNull();
    });

    it('should return null for missing verification code', () => {
      const deepLinkData = parseDeepLink('pruuf://verify-email');
      expect(deepLinkData).not.toBeNull();

      const result = parseEmailVerificationLink(deepLinkData!);
      expect(result).toBeNull();
    });
  });

  describe('generateDeepLink', () => {
    it('should generate invite deep link', () => {
      const url = generateDeepLink('invite', ['ABC123']);
      expect(url).toBe('pruuf://invite/ABC123');
    });

    it('should generate settings deep link', () => {
      const url = generateDeepLink('settings');
      expect(url).toBe('pruuf://settings');
    });

    it('should generate settings/payment deep link', () => {
      const url = generateDeepLink('settings', ['payment']);
      expect(url).toBe('pruuf://settings/payment');
    });

    it('should generate member detail deep link', () => {
      const url = generateDeepLink('member', ['uuid-123']);
      expect(url).toBe('pruuf://member/uuid-123');
    });

    it('should generate deep link with query params', () => {
      const url = generateDeepLink('settings', undefined, {tab: 'notifications'});
      expect(url).toBe('pruuf://settings?tab=notifications');
    });

    it('should generate deep link with path and query params', () => {
      const url = generateDeepLink('invite', ['ABC123'], {source: 'email'});
      expect(url).toBe('pruuf://invite/ABC123?source=email');
    });

    it('should encode query parameter values', () => {
      const url = generateDeepLink('settings', undefined, {name: 'John Doe'});
      expect(url).toContain('name=John%20Doe');
    });
  });

  describe('generateWebDeepLink', () => {
    it('should generate web invite link', () => {
      const url = generateWebDeepLink('invite', ['ABC123']);
      expect(url).toBe('https://pruuf.me/invite/ABC123');
    });

    it('should generate web settings link', () => {
      const url = generateWebDeepLink('settings', ['payment']);
      expect(url).toBe('https://pruuf.me/settings/payment');
    });

    it('should generate web link with query params', () => {
      const url = generateWebDeepLink('invite', ['ABC123'], {utm: 'email'});
      expect(url).toBe('https://pruuf.me/invite/ABC123?utm=email');
    });
  });

  describe('generateInvitationMagicLink', () => {
    it('should generate web-based invitation magic link', () => {
      const url = generateInvitationMagicLink('ABC123');
      expect(url).toBe('https://pruuf.me/invite/ABC123');
    });

    it('should handle different invite codes', () => {
      const url = generateInvitationMagicLink('XYZ789');
      expect(url).toBe('https://pruuf.me/invite/XYZ789');
    });
  });

  describe('generateEmailVerificationMagicLink', () => {
    it('should generate web-based email verification magic link', () => {
      const url = generateEmailVerificationMagicLink('CODE99');
      expect(url).toBe('https://pruuf.me/verify-email/CODE99');
    });

    it('should handle different verification codes', () => {
      const url = generateEmailVerificationMagicLink('VERIFY');
      expect(url).toBe('https://pruuf.me/verify-email/VERIFY');
    });
  });

  describe('isValidInviteCode', () => {
    it('should accept valid 6-character uppercase alphanumeric codes', () => {
      expect(isValidInviteCode('ABC123')).toBe(true);
      expect(isValidInviteCode('XYZ789')).toBe(true);
      expect(isValidInviteCode('AAAAAA')).toBe(true);
      expect(isValidInviteCode('123456')).toBe(true);
    });

    it('should convert lowercase to uppercase and validate', () => {
      expect(isValidInviteCode('abc123')).toBe(true);
      expect(isValidInviteCode('AbC123')).toBe(true);
    });

    it('should reject codes with wrong length', () => {
      expect(isValidInviteCode('ABC')).toBe(false);
      expect(isValidInviteCode('ABC12')).toBe(false);
      expect(isValidInviteCode('ABC1234')).toBe(false);
    });

    it('should reject codes with special characters', () => {
      expect(isValidInviteCode('ABC12!')).toBe(false);
      expect(isValidInviteCode('ABC-12')).toBe(false);
      expect(isValidInviteCode('ABC 12')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidInviteCode('')).toBe(false);
    });
  });

  describe('isValidVerificationCode', () => {
    it('should accept valid 6-character uppercase alphanumeric codes', () => {
      expect(isValidVerificationCode('VERIFY')).toBe(true);
      expect(isValidVerificationCode('CODE12')).toBe(true);
      expect(isValidVerificationCode('123456')).toBe(true);
    });

    it('should convert lowercase to uppercase and validate', () => {
      expect(isValidVerificationCode('verify')).toBe(true);
      expect(isValidVerificationCode('Code12')).toBe(true);
    });

    it('should reject codes with wrong length', () => {
      expect(isValidVerificationCode('CODE')).toBe(false);
      expect(isValidVerificationCode('CODE123')).toBe(false);
    });

    it('should reject codes with special characters', () => {
      expect(isValidVerificationCode('CODE-1')).toBe(false);
    });
  });

  describe('roundtrip parsing', () => {
    it('should parse generated invite links correctly', () => {
      const generated = generateDeepLink('invite', ['ABC123']);
      const parsed = parseDeepLink(generated);

      expect(parsed?.path).toBe('invite');
      expect(parsed?.params).toEqual(['ABC123']);
    });

    it('should parse generated web invite links correctly', () => {
      const generated = generateWebDeepLink('invite', ['XYZ789']);
      const parsed = parseDeepLink(generated);

      expect(parsed?.path).toBe('invite');
      expect(parsed?.params).toEqual(['XYZ789']);
    });

    it('should parse generated settings links correctly', () => {
      const generated = generateDeepLink('settings', ['payment']);
      const parsed = parseDeepLink(generated);

      expect(parsed?.path).toBe('settings');
      expect(parsed?.params).toEqual(['payment']);
    });

    it('should preserve query parameters in roundtrip', () => {
      const generated = generateDeepLink('settings', undefined, {tab: 'notifications'});
      const parsed = parseDeepLink(generated);

      expect(parsed?.queryParams).toEqual({tab: 'notifications'});
    });
  });
});
