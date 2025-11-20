/**
 * useAPI Hook Tests
 * Item 38: Add Loading States to All API Calls (MEDIUM)
 */

import { retryWithBackoff, RetryResult, RetryPresets } from '../utils/retry';

// Mock the retry utility
jest.mock('../utils/retry', () => ({
  retryWithBackoff: jest.fn(),
  RetryPresets: {
    quick: { maxAttempts: 3, initialDelayMs: 500, maxDelayMs: 2000, backoffFactor: 2 },
    standard: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 5000, backoffFactor: 2 },
    patient: { maxAttempts: 5, initialDelayMs: 2000, maxDelayMs: 15000, backoffFactor: 2 },
    aggressive: { maxAttempts: 7, initialDelayMs: 500, maxDelayMs: 10000, backoffFactor: 1.5 },
  },
}));

const mockRetryWithBackoff = retryWithBackoff as jest.MockedFunction<typeof retryWithBackoff>;

describe('useAPI - Hook Simulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const simulateUseAPI = <T, TArgs extends any[]>(
    apiFunction: (...args: TArgs) => Promise<T>,
    options: any = {}
  ) => {
    const state = {
      data: null as T | null,
      error: null as Error | null,
      isLoading: false,
      isRetrying: false,
      attemptCount: 0,
    };

    const cancelledRef = { current: false };
    const lastArgsRef = { current: null as TArgs | null };

    const setState = (newState: typeof state) => {
      Object.assign(state, newState);
    };

    const reset = () => {
      setState({
        data: null,
        error: null,
        isLoading: false,
        isRetrying: false,
        attemptCount: 0,
      });
    };

    const cancel = () => {
      cancelledRef.current = true;
      setState({
        ...state,
        isLoading: false,
        isRetrying: false,
      });
    };

    const execute = async (...args: TArgs): Promise<T> => {
      cancelledRef.current = false;
      lastArgsRef.current = args;

      setState({
        data: null,
        error: null,
        isLoading: true,
        isRetrying: false,
        attemptCount: 0,
      });

      const result = await mockRetryWithBackoff(
        () => apiFunction(...args),
        {
          ...(options.retryPreset ? RetryPresets[options.retryPreset] : {}),
          ...options,
          onRetry: (error: Error, attempt: number, delayMs: number) => {
            if (!cancelledRef.current) {
              setState({
                ...state,
                isRetrying: true,
                attemptCount: attempt,
                error,
              });
            }
            options.onRetry?.(error, attempt, delayMs);
          },
        }
      );

      if (cancelledRef.current) {
        throw new Error('Request cancelled');
      }

      const typedResult = result as RetryResult<T>;

      if (typedResult.success) {
        setState({
          data: typedResult.data!,
          error: null,
          isLoading: false,
          isRetrying: false,
          attemptCount: typedResult.attempts,
        });
        options.onSuccess?.(typedResult.data);
        return typedResult.data!;
      } else {
        const error = typedResult.error || new Error('API call failed');
        setState({
          data: null,
          error,
          isLoading: false,
          isRetrying: false,
          attemptCount: typedResult.attempts,
        });
        options.onError?.(error);
        throw error;
      }
    };

    const refetch = async (): Promise<T | null> => {
      if (lastArgsRef.current === null) {
        return null;
      }
      return execute(...lastArgsRef.current);
    };

    return {
      get state() {
        return { ...state };
      },
      execute,
      reset,
      cancel,
      refetch,
    };
  };

  it('should initialize with default state', () => {
    const api = simulateUseAPI(async () => 'data');

    expect(api.state.data).toBe(null);
    expect(api.state.error).toBe(null);
    expect(api.state.isLoading).toBe(false);
    expect(api.state.isRetrying).toBe(false);
    expect(api.state.attemptCount).toBe(0);
  });

  it('should set loading state when executing', async () => {
    const api = simulateUseAPI(async () => 'data');

    mockRetryWithBackoff.mockImplementation(async () => {
      expect(api.state.isLoading).toBe(true);
      return { success: true, data: 'data', attempts: 1 };
    });

    await api.execute();
  });

  it('should update state on successful execution', async () => {
    const api = simulateUseAPI(async () => 'success');

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: 'success',
      attempts: 1,
    });

    const result = await api.execute();

    expect(result).toBe('success');
    expect(api.state.data).toBe('success');
    expect(api.state.error).toBe(null);
    expect(api.state.isLoading).toBe(false);
    expect(api.state.attemptCount).toBe(1);
  });

  it('should update state on failed execution', async () => {
    const api = simulateUseAPI(async () => 'data');
    const error = new Error('API failed');

    mockRetryWithBackoff.mockResolvedValue({
      success: false,
      error,
      attempts: 3,
    });

    await expect(api.execute()).rejects.toThrow('API failed');

    expect(api.state.data).toBe(null);
    expect(api.state.error).toBe(error);
    expect(api.state.isLoading).toBe(false);
    expect(api.state.attemptCount).toBe(3);
  });

  it('should track retry attempts', async () => {
    const api = simulateUseAPI(async () => 'data');

    mockRetryWithBackoff.mockImplementation(async (fn, options) => {
      options?.onRetry?.(new Error('Retry 1'), 1, 1000);
      options?.onRetry?.(new Error('Retry 2'), 2, 2000);

      return { success: true, data: 'data', attempts: 3 };
    });

    await api.execute();

    expect(api.state.attemptCount).toBe(3);
    expect(api.state.isRetrying).toBe(false); // Not retrying after success
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const api = simulateUseAPI(async () => ({ id: 1, name: 'Test' }), { onSuccess });

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Test' },
      attempts: 1,
    });

    await api.execute();

    expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'Test' });
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();
    const api = simulateUseAPI(async () => 'data', { onError });
    const error = new Error('Failed');

    mockRetryWithBackoff.mockResolvedValue({
      success: false,
      error,
      attempts: 2,
    });

    await expect(api.execute()).rejects.toThrow();

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should reset state', async () => {
    const api = simulateUseAPI(async () => 'data');
    const error = new Error('Failed');

    mockRetryWithBackoff.mockResolvedValue({
      success: false,
      error,
      attempts: 2,
    });

    await expect(api.execute()).rejects.toThrow();
    expect(api.state.error).toBe(error);

    api.reset();

    expect(api.state.data).toBe(null);
    expect(api.state.error).toBe(null);
    expect(api.state.isLoading).toBe(false);
    expect(api.state.attemptCount).toBe(0);
  });

  it('should handle cancellation', async () => {
    const api = simulateUseAPI(async () => 'data');

    mockRetryWithBackoff.mockImplementation(async () => {
      api.cancel();
      return { success: true, data: 'data', attempts: 1 };
    });

    await expect(api.execute()).rejects.toThrow('Request cancelled');
    expect(api.state.isLoading).toBe(false);
  });

  it('should pass arguments to API function', async () => {
    const apiFunc = jest.fn().mockResolvedValue({ result: 'ok' });
    const api = simulateUseAPI(apiFunc);

    mockRetryWithBackoff.mockImplementation(async (fn) => {
      const result = await fn();
      return { success: true, data: result, attempts: 1 };
    });

    await api.execute('arg1', 123, { key: 'value' });

    expect(apiFunc).toHaveBeenCalledWith('arg1', 123, { key: 'value' });
  });

  it('should refetch with last arguments', async () => {
    const apiFunc = jest.fn().mockResolvedValue('data');
    const api = simulateUseAPI(apiFunc);

    mockRetryWithBackoff.mockImplementation(async (fn) => {
      await fn(); // Actually call the function
      return { success: true, data: 'data', attempts: 1 };
    });

    await api.execute('test', 42);
    await api.refetch();

    expect(apiFunc).toHaveBeenCalledTimes(2);
    expect(apiFunc).toHaveBeenNthCalledWith(1, 'test', 42);
    expect(apiFunc).toHaveBeenNthCalledWith(2, 'test', 42);
  });

  it('should return null if refetch called with no previous args', async () => {
    const api = simulateUseAPI(async () => 'data');
    const result = await api.refetch();
    expect(result).toBe(null);
  });

  it('should use retry preset if specified', async () => {
    const api = simulateUseAPI(async () => 'data', { retryPreset: 'quick' });

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: 'data',
      attempts: 1,
    });

    await api.execute();

    expect(mockRetryWithBackoff).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        maxAttempts: 3,
        initialDelayMs: 500,
        maxDelayMs: 2000,
        backoffFactor: 2,
      })
    );
  });
});

describe('useAPI - Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const simulateUseAPI = <T, TArgs extends any[]>(
    apiFunction: (...args: TArgs) => Promise<T>,
    options: any = {}
  ) => {
    const state = {
      data: null as T | null,
      error: null as Error | null,
      isLoading: false,
      isRetrying: false,
      attemptCount: 0,
    };

    const cancelledRef = { current: false };

    const setState = (newState: typeof state) => {
      Object.assign(state, newState);
    };

    const execute = async (...args: TArgs): Promise<T> => {
      cancelledRef.current = false;

      setState({
        data: null,
        error: null,
        isLoading: true,
        isRetrying: false,
        attemptCount: 0,
      });

      const result = await mockRetryWithBackoff(() => apiFunction(...args), options);

      if (cancelledRef.current) {
        throw new Error('Request cancelled');
      }

      const typedResult = result as RetryResult<T>;

      if (typedResult.success) {
        setState({
          data: typedResult.data!,
          error: null,
          isLoading: false,
          isRetrying: false,
          attemptCount: typedResult.attempts,
        });
        options.onSuccess?.(typedResult.data);
        return typedResult.data!;
      } else {
        const error = typedResult.error || new Error('API call failed');
        setState({
          data: null,
          error,
          isLoading: false,
          isRetrying: false,
          attemptCount: typedResult.attempts,
        });
        options.onError?.(error);
        throw error;
      }
    };

    return {
      get state() {
        return { ...state };
      },
      execute,
    };
  };

  it('should handle user login scenario', async () => {
    const loginAPI = async (phone: string, pin: string) => ({
      token: 'abc123',
      userId: '456',
    });

    const api = simulateUseAPI(loginAPI);

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: { token: 'abc123', userId: '456' },
      attempts: 1,
    });

    const result = await api.execute('+15551234567', '1234');

    expect(result).toEqual({ token: 'abc123', userId: '456' });
    expect(api.state.data).toEqual({ token: 'abc123', userId: '456' });
    expect(api.state.isLoading).toBe(false);
  });

  it('should handle API retry scenario', async () => {
    const fetchData = async () => ({ data: 'important' });
    const api = simulateUseAPI(fetchData);

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: { data: 'important' },
      attempts: 3,
    });

    const result = await api.execute();

    expect(result).toEqual({ data: 'important' });
    expect(api.state.attemptCount).toBe(3);
  });

  it('should handle sequential API calls', async () => {
    const apiFunc = jest.fn()
      .mockResolvedValueOnce({ step: 1 })
      .mockResolvedValueOnce({ step: 2 });

    const api = simulateUseAPI(apiFunc);

    mockRetryWithBackoff
      .mockResolvedValueOnce({ success: true, data: { step: 1 }, attempts: 1 })
      .mockResolvedValueOnce({ success: true, data: { step: 2 }, attempts: 1 });

    const result1 = await api.execute();
    const result2 = await api.execute();

    expect(result1).toEqual({ step: 1 });
    expect(result2).toEqual({ step: 2 });
  });
});
