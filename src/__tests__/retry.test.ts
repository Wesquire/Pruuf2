/**
 * Retry Utilities Tests
 * Item 32: Add Error Retry Logic (MEDIUM)
 */

import {
  retryWithBackoff,
  withRetry,
  calculateDelay,
  sleep,
  defaultShouldRetry,
  RetryPresets,
} from '../utils/retry';

// Use real timers for async operations

describe('Retry - Delay Calculation', () => {
  it('should calculate exponential backoff correctly', () => {
    const delay1 = calculateDelay(1, 1000, 10000, 2);
    const delay2 = calculateDelay(2, 1000, 10000, 2);
    const delay3 = calculateDelay(3, 1000, 10000, 2);

    // Account for jitter (±25%)
    expect(delay1).toBeGreaterThanOrEqual(750); // 1000 - 250
    expect(delay1).toBeLessThanOrEqual(1250); // 1000 + 250

    expect(delay2).toBeGreaterThanOrEqual(1500); // 2000 - 500
    expect(delay2).toBeLessThanOrEqual(2500); // 2000 + 500

    expect(delay3).toBeGreaterThanOrEqual(3000); // 4000 - 1000
    expect(delay3).toBeLessThanOrEqual(5000); // 4000 + 1000
  });

  it('should cap delay at maxDelayMs', () => {
    const delay = calculateDelay(10, 1000, 5000, 2);

    // Should be capped at 5000 ± 25%
    expect(delay).toBeGreaterThanOrEqual(3750);
    expect(delay).toBeLessThanOrEqual(6250);
  });

  it('should handle different backoff factors', () => {
    const delay1 = calculateDelay(2, 1000, 10000, 1.5);
    const delay2 = calculateDelay(2, 1000, 10000, 3);

    // 1.5^1 = 1.5, so ~1500 ± 25%
    expect(delay1).toBeGreaterThanOrEqual(1125);
    expect(delay1).toBeLessThanOrEqual(1875);

    // 3^1 = 3, so ~3000 ± 25%
    expect(delay2).toBeGreaterThanOrEqual(2250);
    expect(delay2).toBeLessThanOrEqual(3750);
  });
});

describe('Retry - Default Retry Condition', () => {
  it('should retry on network errors', () => {
    expect(defaultShouldRetry(new Error('Network request failed'), 1)).toBe(
      true,
    );
    expect(defaultShouldRetry(new Error('fetch failed'), 1)).toBe(true);
    expect(defaultShouldRetry(new Error('Connection timeout'), 1)).toBe(true);
  });

  it('should retry on 5xx server errors', () => {
    expect(defaultShouldRetry(new Error('500 Internal Server Error'), 1)).toBe(
      true,
    );
    expect(defaultShouldRetry(new Error('502 Bad Gateway'), 1)).toBe(true);
    expect(defaultShouldRetry(new Error('503 Service Unavailable'), 1)).toBe(
      true,
    );
  });

  it('should not retry on client errors', () => {
    expect(defaultShouldRetry(new Error('400 Bad Request'), 1)).toBe(false);
    expect(defaultShouldRetry(new Error('401 Unauthorized'), 1)).toBe(false);
    expect(defaultShouldRetry(new Error('404 Not Found'), 1)).toBe(false);
  });

  it('should not retry on validation errors', () => {
    expect(defaultShouldRetry(new Error('Validation failed'), 1)).toBe(false);
    expect(defaultShouldRetry(new Error('Invalid input'), 1)).toBe(false);
  });
});

describe('Retry - Sleep Utility', () => {
  it('should sleep for specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(45); // Allow small tolerance
  });
});

describe('Retry - retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(operation);

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10, // Very short delay for testing
      maxDelayMs: 50,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(3);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(new Error('Network request failed'));

    const result = await retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Network request failed');
    expect(result.attempts).toBe(3);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry if shouldRetry returns false', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(new Error('Validation failed'));

    const result = await retryWithBackoff(operation, {
      maxAttempts: 3,
      shouldRetry: () => false,
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue('success');

    const onRetry = jest.fn();

    await retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.any(Error),
      1,
      expect.any(Number),
    );
  });

  it('should handle non-Error rejections', async () => {
    const operation = jest.fn().mockRejectedValue('string error');

    const result = await retryWithBackoff(operation, {
      maxAttempts: 2,
      shouldRetry: () => false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('string error');
  });
});

describe('Retry - withRetry Wrapper', () => {
  it('should create retryable function that succeeds', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const retryableFn = withRetry(fn, {maxAttempts: 3});

    const result = await retryableFn('arg1', 'arg2');

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should retry and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue('success');

    const retryableFn = withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
    });

    const result = await retryableFn('test');

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Network request failed'));
    const retryableFn = withRetry(fn, {
      maxAttempts: 2,
      initialDelayMs: 10,
      maxDelayMs: 50,
    });

    await expect(retryableFn()).rejects.toThrow('Network request failed');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('Retry - Presets', () => {
  it('should have quick preset', () => {
    expect(RetryPresets.quick).toEqual({
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 2000,
      backoffFactor: 2,
    });
  });

  it('should have standard preset', () => {
    expect(RetryPresets.standard).toEqual({
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      backoffFactor: 2,
    });
  });

  it('should have patient preset', () => {
    expect(RetryPresets.patient).toEqual({
      maxAttempts: 5,
      initialDelayMs: 2000,
      maxDelayMs: 15000,
      backoffFactor: 2,
    });
  });

  it('should have aggressive preset', () => {
    expect(RetryPresets.aggressive).toEqual({
      maxAttempts: 7,
      initialDelayMs: 500,
      maxDelayMs: 10000,
      backoffFactor: 1.5,
    });
  });
});

describe('Retry - Edge Cases', () => {
  it('should handle operation that returns undefined', async () => {
    const operation = jest.fn().mockResolvedValue(undefined);

    const result = await retryWithBackoff(operation);

    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('should handle operation that returns null', async () => {
    const operation = jest.fn().mockResolvedValue(null);

    const result = await retryWithBackoff(operation);

    expect(result.success).toBe(true);
    expect(result.data).toBe(null);
  });

  it('should handle maxAttempts of 1', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));

    const result = await retryWithBackoff(operation, {maxAttempts: 1});

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe('Retry - Performance', () => {
  it('should handle rapid retries efficiently', async () => {
    const operations = Array.from({length: 50}, () =>
      jest.fn().mockResolvedValue('success'),
    );

    const start = Date.now();

    const promises = operations.map(op =>
      retryWithBackoff(op, {maxAttempts: 1}),
    );

    await Promise.all(promises);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500); // Should handle 50 operations quickly
  });
});
