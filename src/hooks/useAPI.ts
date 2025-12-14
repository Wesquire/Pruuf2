/**
 * useAPI Hook
 * Item 38: Add Loading States to All API Calls (MEDIUM)
 *
 * Comprehensive hook for managing API call states with retry logic
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {retryWithBackoff, RetryOptions, RetryPresets} from '../utils/retry';

export interface UseAPIState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRetrying: boolean;
  attemptCount: number;
}

export interface UseAPIOptions extends RetryOptions {
  immediate?: boolean; // Execute immediately on mount
  retryPreset?: keyof typeof RetryPresets;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseAPIReturn<T, TArgs extends any[]> {
  /** Current state of the API call */
  state: UseAPIState<T>;
  /** Execute the API call */
  execute: (...args: TArgs) => Promise<T>;
  /** Reset state to initial values */
  reset: () => void;
  /** Cancel ongoing request */
  cancel: () => void;
  /** Refetch with last used arguments */
  refetch: () => Promise<T | null>;
}

/**
 * Hook for managing API calls with loading, error, and retry states
 */
export function useAPI<T, TArgs extends any[] = []>(
  apiFunction: (...args: TArgs) => Promise<T>,
  options: UseAPIOptions = {},
): UseAPIReturn<T, TArgs> {
  const {
    immediate = false,
    retryPreset,
    onSuccess,
    onError,
    ...retryOptions
  } = options;

  const [state, setState] = useState<UseAPIState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isRetrying: false,
    attemptCount: 0,
  });

  const cancelledRef = useRef(false);
  const lastArgsRef = useRef<TArgs | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
    };
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRetrying: false,
      attemptCount: 0,
    });
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
      }));
    }
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
      cancelledRef.current = false;
      lastArgsRef.current = args;

      if (mountedRef.current) {
        setState({
          data: null,
          error: null,
          isLoading: true,
          isRetrying: false,
          attemptCount: 0,
        });
      }

      // Merge retry options with preset if specified
      const finalRetryOptions: RetryOptions = retryPreset
        ? {...RetryPresets[retryPreset], ...retryOptions}
        : retryOptions;

      const result = await retryWithBackoff(() => apiFunction(...args), {
        ...finalRetryOptions,
        onRetry: (error, attempt, delayMs) => {
          if (!cancelledRef.current && mountedRef.current) {
            setState(prev => ({
              ...prev,
              isRetrying: true,
              attemptCount: attempt,
              error,
            }));
          }
          finalRetryOptions.onRetry?.(error, attempt, delayMs);
        },
      });

      if (cancelledRef.current) {
        throw new Error('Request cancelled');
      }

      if (result.success && mountedRef.current) {
        setState({
          data: result.data!,
          error: null,
          isLoading: false,
          isRetrying: false,
          attemptCount: result.attempts,
        });
        onSuccess?.(result.data);
        return result.data!;
      } else {
        const error = result.error || new Error('API call failed');
        if (mountedRef.current) {
          setState({
            data: null,
            error,
            isLoading: false,
            isRetrying: false,
            attemptCount: result.attempts,
          });
        }
        onError?.(error);
        throw error;
      }
    },
    [apiFunction, retryPreset, retryOptions, onSuccess, onError],
  );

  const refetch = useCallback(async (): Promise<T | null> => {
    if (lastArgsRef.current === null) {
      console.warn('Cannot refetch: no previous arguments stored');
      return null;
    }
    return execute(...lastArgsRef.current);
  }, [execute]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && lastArgsRef.current === null) {
      // Can only execute immediately if function takes no args
      execute([] as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return {
    state,
    execute,
    reset,
    cancel,
    refetch,
  };
}

/**
 * Simplified hook for GET requests (queries)
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseAPIOptions = {},
): Omit<UseAPIReturn<T, []>, 'execute'> & {refetch: () => Promise<T | null>} {
  const api = useAPI(queryFn, {immediate: true, ...options});

  return {
    state: api.state,
    reset: api.reset,
    cancel: api.cancel,
    refetch: api.refetch,
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export function useMutation<T, TArgs extends any[] = []>(
  mutationFn: (...args: TArgs) => Promise<T>,
  options: UseAPIOptions = {},
): Pick<UseAPIReturn<T, TArgs>, 'state' | 'execute' | 'reset' | 'cancel'> {
  const api = useAPI(mutationFn, options);

  return {
    state: api.state,
    execute: api.execute,
    reset: api.reset,
    cancel: api.cancel,
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticMutation<T, TArgs extends any[]>(
  mutationFn: (...args: TArgs) => Promise<T>,
  optimisticUpdate: (...args: TArgs) => T,
  options: UseAPIOptions = {},
): Pick<UseAPIReturn<T, TArgs>, 'state' | 'reset' | 'cancel'> & {
  execute: (...args: TArgs) => Promise<T>;
} {
  const [state, setState] = useState<UseAPIState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isRetrying: false,
    attemptCount: 0,
  });

  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const previousDataRef = useRef<T | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
    };
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRetrying: false,
      attemptCount: 0,
    });
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
      }));
    }
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
      cancelledRef.current = false;

      // Store previous data for rollback
      previousDataRef.current = state.data;

      // Apply optimistic update immediately
      const optimisticData = optimisticUpdate(...args);

      if (mountedRef.current) {
        setState({
          data: optimisticData,
          error: null,
          isLoading: true,
          isRetrying: false,
          attemptCount: 0,
        });
      }

      try {
        const api = useAPI(mutationFn, options);
        const result = await api.execute(...args);

        if (mountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isRetrying: false,
            attemptCount: state.attemptCount,
          });
        }

        options.onSuccess?.(result);
        return result;
      } catch (error) {
        // Rollback to previous data on error
        const err = error instanceof Error ? error : new Error(String(error));

        if (mountedRef.current) {
          setState({
            data: previousDataRef.current,
            error: err,
            isLoading: false,
            isRetrying: false,
            attemptCount: state.attemptCount,
          });
        }

        options.onError?.(err);
        throw error;
      }
    },
    [mutationFn, optimisticUpdate, options, state.data, state.attemptCount],
  );

  return {
    state,
    execute,
    reset,
    cancel,
  };
}
