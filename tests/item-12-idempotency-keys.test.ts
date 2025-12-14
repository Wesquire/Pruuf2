/**
 * Item 12: Idempotency Keys for Payment Operations - Validation Tests
 *
 * HIGH: Tests idempotency key functionality to prevent duplicate payment operations
 * Tests duplicate detection, request hash validation, and caching
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  single: jest.fn(),
  rpc: jest.fn(),
};

// Mock database module
jest.mock('../supabase/functions/_shared/db.ts', () => ({
  getSupabaseClient: () => mockSupabase,
}));

// Import functions after mocking
import { checkIdempotencyKey, storeIdempotencyKey, generateIdempotencyKey } from '../supabase/functions/_shared/idempotency';

describe('Item 12: Idempotency Keys for Payment Operations', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Test 12.1: UUID Generation and Validation', () => {
    it('should generate valid UUID v4', () => {
      const key = generateIdempotencyKey();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(key).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const keys = new Set();

      for (let i = 0; i < 100; i++) {
        keys.add(generateIdempotencyKey());
      }

      expect(keys.size).toBe(100); // All unique
    });

    it('should reject invalid UUID formats', async () => {
      const body = { payment_method_id: 'pm_test' };

      const testCases = [
        'not-a-uuid',
        '12345',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Valid format but 'x' instead of hex
        '550e8400-e29b-41d4-a716', // Too short
        '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
      ];

      for (const invalidKey of testCases) {
        const req = new Request('https://api.pruuf.app/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': invalidKey,
          },
          body: JSON.stringify(body),
        });

        const result = await checkIdempotencyKey(req, body);

        expect(result.shouldProcessRequest).toBe(false);
        expect(result.cachedResponse).not.toBeNull();

        const responseData = await result.cachedResponse!.json();
        expect(responseData.error).toContain('Invalid Idempotency-Key format');
      }
    });
  });

  describe('Test 12.2: Request Without Idempotency Key', () => {
    it('should process request normally when no key provided', async () => {
      const body = { payment_method_id: 'pm_test' };

      const req = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await checkIdempotencyKey(req, body);

      expect(result.shouldProcessRequest).toBe(true);
      expect(result.idempotencyKey).toBeNull();
      expect(result.cachedResponse).toBeNull();
    });
  });

  describe('Test 12.3: First Request With Idempotency Key', () => {
    it('should process request when key does not exist', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      // Mock: Key not found in database
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      const req = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const result = await checkIdempotencyKey(req, body);

      expect(result.shouldProcessRequest).toBe(true);
      expect(result.idempotencyKey).toBe(idempotencyKey);
      expect(result.cachedResponse).toBeNull();

      // Verify database was queried
      expect(mockSupabase.from).toHaveBeenCalledWith('idempotency_keys');
      expect(mockSupabase.eq).toHaveBeenCalledWith('key', idempotencyKey);
    });

    it('should store idempotency key after successful response', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      const responseData = {
        success: true,
        subscription: { id: 'sub_123' },
      };

      const response = new Response(JSON.stringify(responseData), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock: Insert succeeds
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await storeIdempotencyKey(idempotencyKey, body, response);

      // Verify insert was called with correct data
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: idempotencyKey,
          request_hash: expect.any(String),
          response_data: responseData,
          status_code: 201,
        })
      );
    });

    it('should not store key for non-success responses', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      const errorResponse = new Response(JSON.stringify({ error: 'Failed' }), {
        status: 400,
      });

      await storeIdempotencyKey(idempotencyKey, body, errorResponse);

      // Verify insert was NOT called
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
  });

  describe('Test 12.4: Duplicate Request - Same Key, Same Body', () => {
    it('should return cached response for duplicate request', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      // Calculate the request hash (simulate what the middleware does)
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(body));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const requestHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const cachedData = {
        success: true,
        subscription: { id: 'sub_123' },
        message: 'Subscription created successfully',
      };

      // Mock: Key exists in database with matching hash
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          key: idempotencyKey,
          request_hash: requestHash,
          response_data: cachedData,
          status_code: 201,
          expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        },
        error: null,
      });

      const req = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const result = await checkIdempotencyKey(req, body);

      expect(result.shouldProcessRequest).toBe(false);
      expect(result.cachedResponse).not.toBeNull();

      // Verify cached response matches
      const responseData = await result.cachedResponse!.json();
      expect(responseData).toEqual(cachedData);

      // Verify X-Idempotency-Replay header is set
      expect(result.cachedResponse!.headers.get('X-Idempotency-Replay')).toBe('true');
    });
  });

  describe('Test 12.5: Duplicate Key - Different Body', () => {
    it('should return error for same key with different request', async () => {
      const body1 = { payment_method_id: 'pm_test1' };
      const body2 = { payment_method_id: 'pm_test2' }; // Different payment method
      const idempotencyKey = generateIdempotencyKey();

      // Calculate hash for first request
      const encoder = new TextEncoder();
      const data1 = encoder.encode(JSON.stringify(body1));
      const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
      const hashArray1 = Array.from(new Uint8Array(hashBuffer1));
      const requestHash1 = hashArray1.map(b => b.toString(16).padStart(2, '0')).join('');

      // Mock: Key exists with different request hash
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          key: idempotencyKey,
          request_hash: requestHash1, // Hash of body1
          response_data: { success: true },
          status_code: 201,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
        error: null,
      });

      const req = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body2), // body2 is different
      });

      const result = await checkIdempotencyKey(req, body2);

      expect(result.shouldProcessRequest).toBe(false);
      expect(result.cachedResponse).not.toBeNull();

      const responseData = await result.cachedResponse!.json();
      expect(responseData.error).toContain('already used with a different request');
      expect(result.cachedResponse!.status).toBe(409); // Conflict
    });
  });

  describe('Test 12.6: Expired Idempotency Keys', () => {
    it('should process request when key is expired', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      // Mock: No non-expired keys found (expired keys filtered by query)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      const req = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const result = await checkIdempotencyKey(req, body);

      expect(result.shouldProcessRequest).toBe(true);
      expect(result.idempotencyKey).toBe(idempotencyKey);

      // Verify query included expiration filter
      expect(mockSupabase.gte).toHaveBeenCalledWith(
        'expires_at',
        expect.any(String) // Current timestamp
      );
    });
  });

  describe('Test 12.7: Database Error Handling', () => {
    it('should fail open on database error', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      // Mock: Database error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Connection failed' },
      });

      const req = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const result = await checkIdempotencyKey(req, body);

      // Should proceed with request despite database error
      expect(result.shouldProcessRequest).toBe(true);
      expect(result.idempotencyKey).toBe(idempotencyKey);
    });

    it('should not fail request if storing key fails', async () => {
      const body = { payment_method_id: 'pm_test' };
      const idempotencyKey = generateIdempotencyKey();

      const response = new Response(JSON.stringify({ success: true }), {
        status: 201,
      });

      // Mock: Insert fails
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      // Should not throw error
      await expect(
        storeIdempotencyKey(idempotencyKey, body, response)
      ).resolves.not.toThrow();
    });
  });

  describe('Test 12.8: Request Hash Consistency', () => {
    it('should generate same hash for same body', async () => {
      const body = { payment_method_id: 'pm_test', amount: 3.99 };

      // Hash the same body twice
      const encoder = new TextEncoder();
      const data1 = encoder.encode(JSON.stringify(body));
      const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
      const hash1 = Array.from(new Uint8Array(hashBuffer1))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const data2 = encoder.encode(JSON.stringify(body));
      const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
      const hash2 = Array.from(new Uint8Array(hashBuffer2))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different body', async () => {
      const body1 = { payment_method_id: 'pm_test1' };
      const body2 = { payment_method_id: 'pm_test2' };

      const encoder = new TextEncoder();

      const data1 = encoder.encode(JSON.stringify(body1));
      const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
      const hash1 = Array.from(new Uint8Array(hashBuffer1))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const data2 = encoder.encode(JSON.stringify(body2));
      const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
      const hash2 = Array.from(new Uint8Array(hashBuffer2))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      expect(hash1).not.toBe(hash2);
    });

    it('should be sensitive to property order changes', async () => {
      // JSON.stringify maintains property order, so different orders = different hash
      const body1 = { a: 1, b: 2 };
      const body2 = { b: 2, a: 1 };

      const encoder = new TextEncoder();

      const data1 = encoder.encode(JSON.stringify(body1));
      const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
      const hash1 = Array.from(new Uint8Array(hashBuffer1))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const data2 = encoder.encode(JSON.stringify(body2));
      const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
      const hash2 = Array.from(new Uint8Array(hashBuffer2))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Different property order = different string = different hash
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Test 12.9: Integration Test - Complete Flow', () => {
    it('should handle full idempotency lifecycle', async () => {
      const body = { payment_method_id: 'pm_test', user_id: 'user_123' };
      const idempotencyKey = generateIdempotencyKey();

      // Step 1: First request - key doesn't exist
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const req1 = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const result1 = await checkIdempotencyKey(req1, body);
      expect(result1.shouldProcessRequest).toBe(true);

      // Step 2: Process request and store key
      const responseData = { success: true, subscription_id: 'sub_123' };
      const response = new Response(JSON.stringify(responseData), {
        status: 201,
      });

      mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });
      await storeIdempotencyKey(idempotencyKey, body, response);

      expect(mockSupabase.insert).toHaveBeenCalled();

      // Step 3: Duplicate request - key exists
      const requestHash = await (async () => {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(body));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      })();

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          key: idempotencyKey,
          request_hash: requestHash,
          response_data: responseData,
          status_code: 201,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
        error: null,
      });

      const req2 = new Request('https://api.pruuf.app/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const result2 = await checkIdempotencyKey(req2, body);
      expect(result2.shouldProcessRequest).toBe(false);

      const cachedResponse = await result2.cachedResponse!.json();
      expect(cachedResponse).toEqual(responseData);
    });
  });
});
