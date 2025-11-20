/**
 * Error Retry Utilities
 * Item 32: Add Error Retry Logic (MEDIUM)
 *
 * Provides retry functionality with exponential backoff for failed operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Default retry condition - retries on network errors
 */
export const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  const errorMessage = error.message.toLowerCase();
  const isNetworkError =
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection');

  // Check for HTTP status codes
  const statusMatch = errorMessage.match(/\b5\d{2}\b/);
  const isServerError = statusMatch !== null;

  return isNetworkError || isServerError;
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export const calculateDelay = (
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffFactor: number
): number => {
  const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±25% randomness) to prevent thundering herd
  const jitter = cappedDelay * 0.25;
  const jitterAmount = Math.random() * jitter * 2 - jitter;

  return Math.round(cappedDelay + jitterAmount);
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error = new Error('Unknown error');
  let attempt = 0;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await operation();
      return {
        success: true,
        data,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isLastAttempt = attempt === maxAttempts;
      const willRetry = !isLastAttempt && shouldRetry(lastError, attempt);

      if (!willRetry) {
        break;
      }

      // Calculate delay and wait
      const delayMs = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffFactor
      );

      onRetry?.(lastError, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt,
  };
}

/**
 * Create a retryable version of an async function
 */
export function withRetry<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const result = await retryWithBackoff(() => fn(...args), options);

    if (result.success && result.data !== undefined) {
      return result.data;
    }

    throw result.error || new Error('Operation failed');
  };
}

/**
 * Common retry configurations
 */
export const RetryPresets = {
  /**
   * Quick retry for fast operations (3 attempts, 500ms initial delay)
   */
  quick: {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 2000,
    backoffFactor: 2,
  },

  /**
   * Standard retry for most API calls (3 attempts, 1s initial delay)
   */
  standard: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffFactor: 2,
  },

  /**
   * Patient retry for critical operations (5 attempts, 2s initial delay)
   */
  patient: {
    maxAttempts: 5,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
    backoffFactor: 2,
  },

  /**
   * Aggressive retry for unreliable connections (7 attempts, 500ms initial)
   */
  aggressive: {
    maxAttempts: 7,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffFactor: 1.5,
  },
} as const;
