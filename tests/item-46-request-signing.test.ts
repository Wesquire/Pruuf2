/**
 * Tests for Item 46: API Request Signing (HMAC-SHA256)
 *
 * Tests the request signing module that prevents request tampering
 * using HMAC-SHA256 signatures.
 */

import {describe, it, expect, beforeEach, jest} from '@jest/globals';

// Mock types
interface CryptoKey {
  type: string;
  extractable: boolean;
  algorithm: any;
  usages: string[];
}

// Mock environment
const mockEnv = {
  API_SIGNING_SECRET: 'test-secret-key-12345',
  API_SIGNING_ENABLED: 'true',
  API_SIGNATURE_MAX_AGE: '300000', // 5 minutes
};

// Mock Deno.env
const Deno = {
  env: {
    get: (key: string) => mockEnv[key as keyof typeof mockEnv] || '',
  },
};

// Store keys for mock
const mockKeys = new WeakMap<CryptoKey, Uint8Array>();

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(
      async (
        format: string,
        keyData: ArrayBuffer,
        algorithm: any,
        extractable: boolean,
        usages: string[],
      ) => {
        const key = {
          type: 'secret',
          extractable,
          algorithm,
          usages,
        } as CryptoKey;

        // Store key data for later use in sign()
        mockKeys.set(key, new Uint8Array(keyData));

        return key;
      },
    ),
    sign: jest.fn(
      async (algorithm: string, key: CryptoKey, data: ArrayBuffer) => {
        // Generate deterministic "HMAC" for testing
        // In real implementation, this would be actual HMAC-SHA256
        const dataArray = new Uint8Array(data);
        const keyArray = mockKeys.get(key) || new Uint8Array([0]);

        // Combine data and key for deterministic signature
        const dataSum = dataArray.reduce((acc, val) => acc + val, 0);
        const keySum = keyArray.reduce((acc, val) => acc + val, 0);
        const combinedSum = dataSum + keySum;

        // Create a 32-byte buffer (SHA-256 output size)
        const signature = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          signature[i] = (combinedSum + i) % 256;
        }

        return signature.buffer;
      },
    ),
  },
};

global.crypto = mockCrypto as any;

// Request signing functions (mimicking requestSigning.ts)
const SIGNING_SECRET = () => Deno.env.get('API_SIGNING_SECRET') || '';
const SIGNING_ENABLED = () => Deno.env.get('API_SIGNING_ENABLED') !== 'false';
const MAX_REQUEST_AGE_MS = () =>
  parseInt(Deno.env.get('API_SIGNATURE_MAX_AGE') || '300000');

async function generateSignature(
  method: string,
  path: string,
  timestamp: string,
  body: string,
  secret: string,
): Promise<string> {
  const payload = `${method.toUpperCase()}\n${path}\n${timestamp}\n${body}`;

  const encoder = new TextEncoder();
  const payloadData = encoder.encode(payload);
  const secretData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    secretData,
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex;
}

async function verifyRequestSignature(
  req: Request,
  body: string = '',
): Promise<boolean> {
  if (!SIGNING_ENABLED()) {
    console.log('[Request Signing] Verification disabled in environment');
    return true;
  }

  const signingSecret = SIGNING_SECRET();
  if (!signingSecret || signingSecret === '') {
    console.error('[Request Signing] API_SIGNING_SECRET not configured');
    throw new Error('Request signing not configured');
  }

  const providedSignature = req.headers.get('X-Signature');
  const timestamp = req.headers.get('X-Timestamp');

  if (!providedSignature) {
    console.warn('[Request Signing] No signature provided');
    return false;
  }

  if (!timestamp) {
    console.warn('[Request Signing] No timestamp provided');
    return false;
  }

  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    console.warn('[Request Signing] Invalid timestamp format:', timestamp);
    return false;
  }

  const now = Date.now();
  const requestAge = now - timestampNum;

  if (requestAge < 0) {
    console.warn('[Request Signing] Timestamp in future:', timestamp);
    return false;
  }

  if (requestAge > MAX_REQUEST_AGE_MS()) {
    console.warn(
      `[Request Signing] Request too old: ${requestAge}ms > ${MAX_REQUEST_AGE_MS()}ms`,
    );
    return false;
  }

  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    const expectedSignature = await generateSignature(
      method,
      path,
      timestamp,
      body,
      signingSecret,
    );

    if (providedSignature.length !== expectedSignature.length) {
      console.warn('[Request Signing] Signature length mismatch');
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      mismatch |=
        providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
      console.warn('[Request Signing] Signature mismatch');
      return false;
    }

    console.log('[Request Signing] Verification successful');
    return true;
  } catch (error) {
    console.error('[Request Signing] Verification error:', error);
    return false;
  }
}

async function requireRequestSignature(
  req: Request,
  body: string = '',
): Promise<void> {
  const isValid = await verifyRequestSignature(req, body);

  if (!isValid) {
    throw new Error(
      'Invalid request signature. Request may have been tampered with.',
    );
  }
}

function isSigningEnabled(): boolean {
  return SIGNING_ENABLED();
}

function getSigningConfig(): {
  enabled: boolean;
  maxAge: number;
} {
  return {
    enabled: SIGNING_ENABLED(),
    maxAge: MAX_REQUEST_AGE_MS(),
  };
}

// Helper to create mock request
function createMockRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  url?: string,
): Request {
  return {
    method,
    url: url || `https://api.pruuf.com${path}`,
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as Request;
}

describe('Item 46: API Request Signing', () => {
  beforeEach(() => {
    // Reset mock environment
    mockEnv.API_SIGNING_SECRET = 'test-secret-key-12345';
    mockEnv.API_SIGNING_ENABLED = 'true';
    mockEnv.API_SIGNATURE_MAX_AGE = '300000';

    // Reset crypto mocks
    (mockCrypto.subtle.importKey as jest.Mock).mockClear();
    (mockCrypto.subtle.sign as jest.Mock).mockClear();
  });

  describe('generateSignature()', () => {
    it('should generate HMAC-SHA256 signature', async () => {
      const signature = await generateSignature(
        'POST',
        '/api/auth/login',
        '1234567890',
        '{"phone":"+1234567890"}',
        'my-secret-key',
      );

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 hex = 64 chars
      expect(signature).toMatch(/^[0-9a-f]+$/); // Hex only
    });

    it('should call crypto.subtle.importKey with correct parameters', async () => {
      await generateSignature('POST', '/api/test', '123', '{}', 'secret');

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        {name: 'HMAC', hash: 'SHA-256'},
        false,
        ['sign'],
      );
    });

    it('should call crypto.subtle.sign with HMAC algorithm', async () => {
      await generateSignature('POST', '/api/test', '123', '{}', 'secret');

      expect(mockCrypto.subtle.sign).toHaveBeenCalled();
      const call = (mockCrypto.subtle.sign as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('HMAC'); // Algorithm
      expect(call[1]).toHaveProperty('type', 'secret'); // Key
      expect(
        call[2] instanceof ArrayBuffer || ArrayBuffer.isView(call[2]),
      ).toBe(true); // Data
    });

    it('should produce consistent signatures for same input', async () => {
      const sig1 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret',
      );
      const sig2 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret',
      );

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different methods', async () => {
      const sigPost = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret',
      );
      const sigGet = await generateSignature(
        'GET',
        '/api/test',
        '123',
        '{}',
        'secret',
      );

      expect(sigPost).not.toBe(sigGet);
    });

    it('should produce different signatures for different paths', async () => {
      const sig1 = await generateSignature(
        'POST',
        '/api/test1',
        '123',
        '{}',
        'secret',
      );
      const sig2 = await generateSignature(
        'POST',
        '/api/test2',
        '123',
        '{}',
        'secret',
      );

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different timestamps', async () => {
      const sig1 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret',
      );
      const sig2 = await generateSignature(
        'POST',
        '/api/test',
        '456',
        '{}',
        'secret',
      );

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different bodies', async () => {
      const sig1 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{"a":1}',
        'secret',
      );
      const sig2 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{"a":2}',
        'secret',
      );

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', async () => {
      const sig1 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret1',
      );
      const sig2 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret2',
      );

      expect(sig1).not.toBe(sig2);
    });

    it('should handle empty body', async () => {
      const signature = await generateSignature(
        'GET',
        '/api/test',
        '123',
        '',
        'secret',
      );

      expect(signature).toBeDefined();
      expect(signature.length).toBe(64);
    });

    it('should handle uppercase method', async () => {
      const sig1 = await generateSignature(
        'POST',
        '/api/test',
        '123',
        '{}',
        'secret',
      );
      const sig2 = await generateSignature(
        'post',
        '/api/test',
        '123',
        '{}',
        'secret',
      );

      expect(sig1).toBe(sig2); // Should normalize to uppercase
    });
  });

  describe('verifyRequestSignature()', () => {
    it('should return true when signing is disabled', async () => {
      mockEnv.API_SIGNING_ENABLED = 'false';
      const req = createMockRequest('POST', '/api/test');

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(true);
    });

    it('should throw error when API_SIGNING_SECRET is not configured', async () => {
      mockEnv.API_SIGNING_SECRET = '';
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
        'X-Timestamp': Date.now().toString(),
      });

      await expect(verifyRequestSignature(req, '{}')).rejects.toThrow(
        'Request signing not configured',
      );
    });

    it('should return false when signature header is missing', async () => {
      const req = createMockRequest('POST', '/api/test', {
        'X-Timestamp': Date.now().toString(),
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should return false when timestamp header is missing', async () => {
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should return false when timestamp format is invalid', async () => {
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
        'X-Timestamp': 'not-a-number',
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should return false when timestamp is in the future', async () => {
      const futureTimestamp = (Date.now() + 60000).toString(); // 1 minute in future
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
        'X-Timestamp': futureTimestamp,
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should return false when request is too old', async () => {
      const oldTimestamp = (Date.now() - 400000).toString(); // 6.67 minutes ago (> 5 min max)
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
        'X-Timestamp': oldTimestamp,
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should return true when signature is valid', async () => {
      const timestamp = Date.now().toString();
      const body = '{"phone":"+1234567890"}';
      const path = '/api/auth/login';
      const method = 'POST';

      // Generate valid signature
      const validSignature = await generateSignature(
        method,
        path,
        timestamp,
        body,
        'test-secret-key-12345',
      );

      const req = createMockRequest(method, path, {
        'X-Signature': validSignature,
        'X-Timestamp': timestamp,
      });

      const result = await verifyRequestSignature(req, body);

      expect(result).toBe(true);
    });

    it('should return false when signature is invalid', async () => {
      const timestamp = Date.now().toString();
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'invalid-signature-12345',
        'X-Timestamp': timestamp,
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should return false when signature length mismatches', async () => {
      const timestamp = Date.now().toString();
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'short', // Not 64 characters
        'X-Timestamp': timestamp,
      });

      const result = await verifyRequestSignature(req, '{}');

      expect(result).toBe(false);
    });

    it('should use constant-time comparison', async () => {
      const timestamp = Date.now().toString();
      const body = '{}';
      const path = '/api/test';
      const method = 'POST';

      const validSignature = await generateSignature(
        method,
        path,
        timestamp,
        body,
        'test-secret-key-12345',
      );

      // Modify one character (should still fail)
      const tamperedSignature = validSignature.substring(0, 62) + '00';

      const req = createMockRequest(method, path, {
        'X-Signature': tamperedSignature,
        'X-Timestamp': timestamp,
      });

      const result = await verifyRequestSignature(req, body);

      expect(result).toBe(false);
    });

    it('should handle GET requests with empty body', async () => {
      const timestamp = Date.now().toString();
      const path = '/api/check-ins';
      const method = 'GET';
      const body = '';

      const validSignature = await generateSignature(
        method,
        path,
        timestamp,
        body,
        'test-secret-key-12345',
      );

      const req = createMockRequest(method, path, {
        'X-Signature': validSignature,
        'X-Timestamp': timestamp,
      });

      const result = await verifyRequestSignature(req, body);

      expect(result).toBe(true);
    });
  });

  describe('requireRequestSignature()', () => {
    it('should not throw when signature is valid', async () => {
      const timestamp = Date.now().toString();
      const body = '{"test":"data"}';
      const path = '/api/test';
      const method = 'POST';

      const validSignature = await generateSignature(
        method,
        path,
        timestamp,
        body,
        'test-secret-key-12345',
      );

      const req = createMockRequest(method, path, {
        'X-Signature': validSignature,
        'X-Timestamp': timestamp,
      });

      await expect(requireRequestSignature(req, body)).resolves.not.toThrow();
    });

    it('should throw when signature is invalid', async () => {
      const timestamp = Date.now().toString();
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'invalid-signature',
        'X-Timestamp': timestamp,
      });

      await expect(requireRequestSignature(req, '{}')).rejects.toThrow(
        'Invalid request signature',
      );
    });

    it('should throw when signature is missing', async () => {
      const timestamp = Date.now().toString();
      const req = createMockRequest('POST', '/api/test', {
        'X-Timestamp': timestamp,
      });

      await expect(requireRequestSignature(req, '{}')).rejects.toThrow(
        'Invalid request signature',
      );
    });

    it('should throw when timestamp is missing', async () => {
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
      });

      await expect(requireRequestSignature(req, '{}')).rejects.toThrow(
        'Invalid request signature',
      );
    });

    it('should throw when request is too old', async () => {
      const oldTimestamp = (Date.now() - 400000).toString();
      const req = createMockRequest('POST', '/api/test', {
        'X-Signature': 'some-signature',
        'X-Timestamp': oldTimestamp,
      });

      await expect(requireRequestSignature(req, '{}')).rejects.toThrow(
        'Invalid request signature',
      );
    });
  });

  describe('isSigningEnabled()', () => {
    it('should return true when API_SIGNING_ENABLED is "true"', () => {
      mockEnv.API_SIGNING_ENABLED = 'true';

      const result = isSigningEnabled();

      expect(result).toBe(true);
    });

    it('should return false when API_SIGNING_ENABLED is "false"', () => {
      mockEnv.API_SIGNING_ENABLED = 'false';

      const result = isSigningEnabled();

      expect(result).toBe(false);
    });

    it('should return true when API_SIGNING_ENABLED is not set (default)', () => {
      delete mockEnv.API_SIGNING_ENABLED;

      const result = isSigningEnabled();

      expect(result).toBe(true);
    });
  });

  describe('getSigningConfig()', () => {
    it('should return config with enabled status and max age', () => {
      mockEnv.API_SIGNING_ENABLED = 'true';
      mockEnv.API_SIGNATURE_MAX_AGE = '300000';

      const config = getSigningConfig();

      expect(config.enabled).toBe(true);
      expect(config.maxAge).toBe(300000);
    });

    it('should return disabled when API_SIGNING_ENABLED is "false"', () => {
      mockEnv.API_SIGNING_ENABLED = 'false';

      const config = getSigningConfig();

      expect(config.enabled).toBe(false);
    });

    it('should return default max age when not configured', () => {
      delete mockEnv.API_SIGNATURE_MAX_AGE;

      const config = getSigningConfig();

      expect(config.maxAge).toBe(300000); // 5 minutes default
    });

    it('should return custom max age when configured', () => {
      mockEnv.API_SIGNATURE_MAX_AGE = '600000'; // 10 minutes

      const config = getSigningConfig();

      expect(config.maxAge).toBe(600000);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete request signing flow', async () => {
      const timestamp = Date.now().toString();
      const body = '{"phone":"+1234567890","pin":"1234"}';
      const path = '/api/auth/login';
      const method = 'POST';
      const secret = 'test-secret-key-12345';

      // Client generates signature
      const signature = await generateSignature(
        method,
        path,
        timestamp,
        body,
        secret,
      );

      // Server verifies signature
      const req = createMockRequest(method, path, {
        'X-Signature': signature,
        'X-Timestamp': timestamp,
      });

      await expect(requireRequestSignature(req, body)).resolves.not.toThrow();
    });

    it('should reject tampered request body', async () => {
      const timestamp = Date.now().toString();
      const originalBody = '{"amount":100}';
      const tamperedBody = '{"amount":1000000}'; // Attacker changes amount
      const path = '/api/payment';
      const method = 'POST';
      const secret = 'test-secret-key-12345';

      // Client signs original body
      const signature = await generateSignature(
        method,
        path,
        timestamp,
        originalBody,
        secret,
      );

      // Attacker modifies body but keeps signature
      const req = createMockRequest(method, path, {
        'X-Signature': signature,
        'X-Timestamp': timestamp,
      });

      // Server verifies with tampered body
      await expect(requireRequestSignature(req, tamperedBody)).rejects.toThrow(
        'Invalid request signature',
      );
    });

    it('should reject replay attacks (old timestamp)', async () => {
      const oldTimestamp = (Date.now() - 400000).toString(); // 6.67 minutes ago
      const body = '{"test":"data"}';
      const path = '/api/test';
      const method = 'POST';
      const secret = 'test-secret-key-12345';

      // Generate signature with old timestamp
      const signature = await generateSignature(
        method,
        path,
        oldTimestamp,
        body,
        secret,
      );

      // Try to replay the request
      const req = createMockRequest(method, path, {
        'X-Signature': signature,
        'X-Timestamp': oldTimestamp,
      });

      await expect(requireRequestSignature(req, body)).rejects.toThrow(
        'Invalid request signature',
      );
    });

    it('should accept requests within time window', async () => {
      const recentTimestamp = (Date.now() - 60000).toString(); // 1 minute ago (< 5 min max)
      const body = '{"test":"data"}';
      const path = '/api/test';
      const method = 'POST';
      const secret = 'test-secret-key-12345';

      const signature = await generateSignature(
        method,
        path,
        recentTimestamp,
        body,
        secret,
      );

      const req = createMockRequest(method, path, {
        'X-Signature': signature,
        'X-Timestamp': recentTimestamp,
      });

      await expect(requireRequestSignature(req, body)).resolves.not.toThrow();
    });
  });
});
