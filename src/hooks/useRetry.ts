/**
 * useRetry Hook
 * Item 32: Add Error Retry Logic (MEDIUM)
 *
 * React hook for managing retry state and operations
 */

import {useState, useCallback, useRef} from 'react';
import {retryWithBackoff, RetryOptions, RetryResult} from '../utils/retry';

export interface UseRetryState {
  isRetrying: boolean;
  error: Error | null;
  attemptCount: number;
}

export interface UseRetryReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T>;
  state: UseRetryState;
  reset: () => void;
  cancel: () => void;
}

/**
 * Hook for executing operations with retry logic
 */
export function useRetry<T>(options: RetryOptions = {}): UseRetryReturn<T> {
  const [state, setState] = useState<UseRetryState>({
    isRetrying: false,
    error: null,
    attemptCount: 0,
  });

  const cancelledRef = useRef(false);
  const currentOperationRef = useRef<Promise<any> | null>(null);

  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      error: null,
      attemptCount: 0,
    });
    cancelledRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setState(prev => ({
      ...prev,
      isRetrying: false,
    }));
  }, []);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T> => {
      cancelledRef.current = false;

      setState({
        isRetrying: true,
        error: null,
        attemptCount: 0,
      });

      const retryOptions: RetryOptions = {
        ...options,
        onRetry: (error, attempt, delayMs) => {
          if (!cancelledRef.current) {
            setState({
              isRetrying: true,
              error,
              attemptCount: attempt,
            });
            options.onRetry?.(error, attempt, delayMs);
          }
        },
      };

      const operationPromise = retryWithBackoff(operation, retryOptions);
      currentOperationRef.current = operationPromise;

      const result: RetryResult<T> = await operationPromise;

      if (cancelledRef.current) {
        throw new Error('Operation cancelled');
      }

      if (result.success) {
        setState({
          isRetrying: false,
          error: null,
          attemptCount: result.attempts,
        });
        return result.data!;
      } else {
        const error = result.error || new Error('Operation failed');
        setState({
          isRetrying: false,
          error,
          attemptCount: result.attempts,
        });
        throw error;
      }
    },
    [options],
  );

  return {
    execute,
    state,
    reset,
    cancel,
  };
}

/**
 * Simplified hook for single retry operations
 */
export function useRetryOnce<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): UseRetryReturn<T> {
  const retry = useRetry<T>(options);

  const executeOnce = useCallback(async () => {
    return retry.execute(operation);
  }, [operation, retry]);

  return {
    ...retry,
    execute: executeOnce,
  };
}
