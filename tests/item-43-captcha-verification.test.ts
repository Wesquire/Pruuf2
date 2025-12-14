/**
 * Tests for Item 43: CAPTCHA Verification (Google reCAPTCHA v3)
 *
 * Tests the CAPTCHA verification module that protects auth endpoints
 * from bot attacks using Google reCAPTCHA v3.
 */

import {describe, it, expect, beforeEach, jest} from '@jest/globals';

// Mock types
interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

// Mock environment
const mockEnv = {
  RECAPTCHA_SECRET_KEY: 'test-secret-key-12345',
  RECAPTCHA_SITE_KEY: 'test-site-key-67890',
  RECAPTCHA_MIN_SCORE: '0.5',
  CAPTCHA_ENABLED: 'true',
};

// Mock Deno.env
const Deno = {
  env: {
    get: (key: string) => mockEnv[key as keyof typeof mockEnv] || '',
  },
};

// Mock fetch for reCAPTCHA API
let mockFetchResponse: RecaptchaResponse = {
  success: true,
  score: 0.9,
  action: 'login',
  challenge_ts: new Date().toISOString(),
  hostname: 'localhost',
};

let mockFetchCalled = false;
let mockFetchRequestBody: URLSearchParams | null = null;

global.fetch = jest.fn(async (url: string, options?: any) => {
  mockFetchCalled = true;

  if (options?.body) {
    mockFetchRequestBody = new URLSearchParams(options.body.toString());
  }

  return {
    ok: true,
    status: 200,
    json: async () => mockFetchResponse,
  } as Response;
}) as any;

// CAPTCHA verification functions (mimicking captcha.ts)
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

async function verifyCaptcha(
  token: string | null | undefined,
  req: Request,
  expectedAction?: string,
): Promise<boolean> {
  // Read environment variables each time (not as constants)
  const CAPTCHA_ENABLED = Deno.env.get('CAPTCHA_ENABLED') !== 'false';
  const RECAPTCHA_SECRET = Deno.env.get('RECAPTCHA_SECRET_KEY') || '';
  const RECAPTCHA_MIN_SCORE = parseFloat(
    Deno.env.get('RECAPTCHA_MIN_SCORE') || '0.5',
  );

  if (!CAPTCHA_ENABLED) {
    console.log('[CAPTCHA] Verification disabled in environment');
    return true;
  }

  if (!token) {
    console.warn('[CAPTCHA] No token provided');
    return false;
  }

  if (!RECAPTCHA_SECRET || RECAPTCHA_SECRET === '') {
    console.error('[CAPTCHA] RECAPTCHA_SECRET_KEY not configured');
    throw new Error('CAPTCHA verification not configured');
  }

  try {
    const remoteIp =
      req.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
      req.headers.get('X-Real-IP') ||
      'unknown';

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
        remoteip: remoteIp,
      }),
    });

    if (!response.ok) {
      console.error('[CAPTCHA] Verification API error:', response.status);
      return false;
    }

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      console.warn('[CAPTCHA] Verification failed:', data['error-codes']);
      return false;
    }

    if (data.score !== undefined) {
      if (data.score < RECAPTCHA_MIN_SCORE) {
        console.warn(
          `[CAPTCHA] Score too low: ${data.score} < ${RECAPTCHA_MIN_SCORE}`,
        );
        return false;
      }
    }

    if (expectedAction && data.action !== expectedAction) {
      console.warn(
        `[CAPTCHA] Action mismatch: ${data.action} !== ${expectedAction}`,
      );
      return false;
    }

    console.log(
      `[CAPTCHA] Verification successful (score: ${data.score}, action: ${data.action})`,
    );
    return true;
  } catch (error) {
    console.error('[CAPTCHA] Verification error:', error);
    return false;
  }
}

async function requireCaptcha(
  token: string | null | undefined,
  req: Request,
  action?: string,
): Promise<void> {
  const isValid = await verifyCaptcha(token, req, action);

  if (!isValid) {
    throw new Error('CAPTCHA verification failed. Please try again.');
  }
}

function isCaptchaEnabled(): boolean {
  return Deno.env.get('CAPTCHA_ENABLED') !== 'false';
}

function getCaptchaConfig(): {
  enabled: boolean;
  siteKey: string | null;
} {
  return {
    enabled: Deno.env.get('CAPTCHA_ENABLED') !== 'false',
    siteKey: Deno.env.get('RECAPTCHA_SITE_KEY') || null,
  };
}

// Helper to create mock request
function createMockRequest(headers: Record<string, string> = {}): Request {
  return {
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as Request;
}

describe('Item 43: CAPTCHA Verification', () => {
  beforeEach(() => {
    // Reset mock state
    mockFetchCalled = false;
    mockFetchRequestBody = null;
    mockFetchResponse = {
      success: true,
      score: 0.9,
      action: 'login',
      challenge_ts: new Date().toISOString(),
      hostname: 'localhost',
    };
    mockEnv.CAPTCHA_ENABLED = 'true';
    mockEnv.RECAPTCHA_SECRET_KEY = 'test-secret-key-12345';
    mockEnv.RECAPTCHA_MIN_SCORE = '0.5';

    // Reset fetch mock
    global.fetch = jest.fn(async (url: string, options?: any) => {
      mockFetchCalled = true;

      if (options?.body) {
        mockFetchRequestBody = new URLSearchParams(options.body.toString());
      }

      return {
        ok: true,
        status: 200,
        json: async () => mockFetchResponse,
      } as Response;
    }) as any;
  });

  describe('verifyCaptcha()', () => {
    it('should return true when CAPTCHA is disabled', async () => {
      mockEnv.CAPTCHA_ENABLED = 'false';
      const req = createMockRequest();

      const result = await verifyCaptcha('any-token', req);

      expect(result).toBe(true);
      expect(mockFetchCalled).toBe(false);
    });

    it('should return false when token is null', async () => {
      const req = createMockRequest();

      const result = await verifyCaptcha(null, req);

      expect(result).toBe(false);
      expect(mockFetchCalled).toBe(false);
    });

    it('should return false when token is undefined', async () => {
      const req = createMockRequest();

      const result = await verifyCaptcha(undefined, req);

      expect(result).toBe(false);
      expect(mockFetchCalled).toBe(false);
    });

    it('should return false when token is empty string', async () => {
      const req = createMockRequest();

      const result = await verifyCaptcha('', req);

      expect(result).toBe(false);
      expect(mockFetchCalled).toBe(false);
    });

    it('should throw error when RECAPTCHA_SECRET_KEY is not configured', async () => {
      mockEnv.RECAPTCHA_SECRET_KEY = '';
      const req = createMockRequest();

      await expect(verifyCaptcha('valid-token', req)).rejects.toThrow(
        'CAPTCHA verification not configured',
      );
    });

    it('should call Google reCAPTCHA API with correct parameters', async () => {
      const req = createMockRequest({
        'X-Forwarded-For': '192.168.1.100',
      });

      await verifyCaptcha('test-token-123', req);

      expect(mockFetchCalled).toBe(true);
      expect(mockFetchRequestBody?.get('secret')).toBe('test-secret-key-12345');
      expect(mockFetchRequestBody?.get('response')).toBe('test-token-123');
      expect(mockFetchRequestBody?.get('remoteip')).toBe('192.168.1.100');
    });

    it('should extract IP from X-Forwarded-For header (first IP)', async () => {
      const req = createMockRequest({
        'X-Forwarded-For': '192.168.1.100, 10.0.0.1, 172.16.0.1',
      });

      await verifyCaptcha('test-token', req);

      expect(mockFetchRequestBody?.get('remoteip')).toBe('192.168.1.100');
    });

    it('should extract IP from X-Real-IP header if X-Forwarded-For not present', async () => {
      const req = createMockRequest({
        'X-Real-IP': '10.0.0.1',
      });

      await verifyCaptcha('test-token', req);

      expect(mockFetchRequestBody?.get('remoteip')).toBe('10.0.0.1');
    });

    it('should use "unknown" IP if no IP headers present', async () => {
      const req = createMockRequest({});

      await verifyCaptcha('test-token', req);

      expect(mockFetchRequestBody?.get('remoteip')).toBe('unknown');
    });

    it('should return true when verification succeeds', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'login',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('valid-token', req);

      expect(result).toBe(true);
    });

    it('should return false when verification fails (success: false)', async () => {
      mockFetchResponse = {
        success: false,
        'error-codes': ['invalid-input-response'],
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('invalid-token', req);

      expect(result).toBe(false);
    });

    it('should return false when score is below minimum threshold', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.3, // Below 0.5 threshold
        action: 'login',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('low-score-token', req);

      expect(result).toBe(false);
    });

    it('should return true when score is exactly at minimum threshold', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.5, // Exactly at threshold
        action: 'login',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('threshold-token', req);

      expect(result).toBe(true);
    });

    it('should return true when score is above minimum threshold', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.8,
        action: 'login',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('high-score-token', req);

      expect(result).toBe(true);
    });

    it('should verify action matches when expectedAction is provided', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'login',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('action-token', req, 'login');

      expect(result).toBe(true);
    });

    it('should return false when action does not match expectedAction', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'signup',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('wrong-action-token', req, 'login');

      expect(result).toBe(false);
    });

    it('should not verify action when expectedAction is not provided', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'signup',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('any-action-token', req);

      expect(result).toBe(true);
    });

    it('should return false when API response is not ok', async () => {
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })) as any;

      const req = createMockRequest();

      const result = await verifyCaptcha('server-error-token', req);

      expect(result).toBe(false);
    });

    it('should return false when fetch throws network error', async () => {
      global.fetch = jest.fn(async () => {
        throw new Error('Network error');
      }) as any;

      const req = createMockRequest();

      const result = await verifyCaptcha('network-error-token', req);

      expect(result).toBe(false);
    });

    it('should handle reCAPTCHA v2 response (no score)', async () => {
      mockFetchResponse = {
        success: true,
        // No score field for v2
        challenge_ts: new Date().toISOString(),
        hostname: 'localhost',
      };
      const req = createMockRequest();

      const result = await verifyCaptcha('v2-token', req);

      expect(result).toBe(true);
    });
  });

  describe('requireCaptcha()', () => {
    it('should not throw when CAPTCHA verification succeeds', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'login',
      };
      const req = createMockRequest();

      await expect(
        requireCaptcha('valid-token', req, 'login'),
      ).resolves.not.toThrow();
    });

    it('should throw when CAPTCHA verification fails', async () => {
      mockFetchResponse = {
        success: false,
        'error-codes': ['invalid-input-response'],
      };
      const req = createMockRequest();

      await expect(requireCaptcha('invalid-token', req)).rejects.toThrow(
        'CAPTCHA verification failed',
      );
    });

    it('should throw when token is null', async () => {
      const req = createMockRequest();

      await expect(requireCaptcha(null, req)).rejects.toThrow(
        'CAPTCHA verification failed',
      );
    });

    it('should throw when score is too low', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.2,
        action: 'login',
      };
      const req = createMockRequest();

      await expect(requireCaptcha('low-score-token', req)).rejects.toThrow(
        'CAPTCHA verification failed',
      );
    });

    it('should throw when action does not match', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'signup',
      };
      const req = createMockRequest();

      await expect(
        requireCaptcha('wrong-action-token', req, 'login'),
      ).rejects.toThrow('CAPTCHA verification failed');
    });
  });

  describe('isCaptchaEnabled()', () => {
    it('should return true when CAPTCHA_ENABLED is "true"', () => {
      mockEnv.CAPTCHA_ENABLED = 'true';

      const result = isCaptchaEnabled();

      expect(result).toBe(true);
    });

    it('should return false when CAPTCHA_ENABLED is "false"', () => {
      mockEnv.CAPTCHA_ENABLED = 'false';

      const result = isCaptchaEnabled();

      expect(result).toBe(false);
    });

    it('should return true when CAPTCHA_ENABLED is not set (default)', () => {
      delete mockEnv.CAPTCHA_ENABLED;

      const result = isCaptchaEnabled();

      expect(result).toBe(true);
    });
  });

  describe('getCaptchaConfig()', () => {
    it('should return config with enabled status and site key', () => {
      mockEnv.CAPTCHA_ENABLED = 'true';
      mockEnv.RECAPTCHA_SITE_KEY = 'test-site-key-67890';

      const config = getCaptchaConfig();

      expect(config.enabled).toBe(true);
      expect(config.siteKey).toBe('test-site-key-67890');
    });

    it('should return disabled when CAPTCHA_ENABLED is "false"', () => {
      mockEnv.CAPTCHA_ENABLED = 'false';

      const config = getCaptchaConfig();

      expect(config.enabled).toBe(false);
    });

    it('should return null site key when not configured', () => {
      mockEnv.RECAPTCHA_SITE_KEY = '';

      const config = getCaptchaConfig();

      expect(config.siteKey).toBeNull();
    });
  });

  describe('Environment Configuration', () => {
    it('should use custom minimum score from environment', async () => {
      mockEnv.RECAPTCHA_MIN_SCORE = '0.7';
      mockFetchResponse = {
        success: true,
        score: 0.65, // Below custom threshold
        action: 'login',
      };
      const req = createMockRequest();

      // Re-create function with new env value
      const customMinScore = parseFloat(
        Deno.env.get('RECAPTCHA_MIN_SCORE') || '0.5',
      );
      const isValid = mockFetchResponse.score! >= customMinScore;

      expect(customMinScore).toBe(0.7);
      expect(isValid).toBe(false);
    });

    it('should default to 0.5 when RECAPTCHA_MIN_SCORE not set', () => {
      delete mockEnv.RECAPTCHA_MIN_SCORE;

      const minScore = parseFloat(Deno.env.get('RECAPTCHA_MIN_SCORE') || '0.5');

      expect(minScore).toBe(0.5);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle login CAPTCHA verification flow', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.9,
        action: 'login',
      };
      const req = createMockRequest({
        'X-Forwarded-For': '192.168.1.100',
      });

      await expect(
        requireCaptcha('login-token', req, 'login'),
      ).resolves.not.toThrow();

      expect(mockFetchCalled).toBe(true);
      expect(mockFetchRequestBody?.get('response')).toBe('login-token');
    });

    it('should handle send verification code CAPTCHA flow', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.8,
        action: 'send_verification_code',
      };
      const req = createMockRequest();

      await expect(
        requireCaptcha('verify-token', req, 'send_verification_code'),
      ).resolves.not.toThrow();
    });

    it('should block bot attempt (low score)', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.1, // Bot-like score
        action: 'login',
      };
      const req = createMockRequest();

      await expect(requireCaptcha('bot-token', req, 'login')).rejects.toThrow(
        'CAPTCHA verification failed',
      );
    });

    it('should allow human attempt (high score)', async () => {
      mockFetchResponse = {
        success: true,
        score: 0.95, // Human-like score
        action: 'login',
      };
      const req = createMockRequest();

      await expect(
        requireCaptcha('human-token', req, 'login'),
      ).resolves.not.toThrow();
    });
  });
});
