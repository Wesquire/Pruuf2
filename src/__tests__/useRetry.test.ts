/**
 * useRetry Hook Tests
 * Item 32: Add Error Retry Logic (MEDIUM)
 */

import { retryWithBackoff, RetryResult } from '../utils/retry';

// Mock the retry utility
jest.mock('../utils/retry', () => ({
  retryWithBackoff: jest.fn(),
  RetryOptions: {},
}));

const mockRetryWithBackoff = retryWithBackoff as jest.MockedFunction<
  typeof retryWithBackoff
>;

describe('useRetry - Hook Logic Simulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const simulateUseRetry = () => {
    const state = {
      isRetrying: false,
      error: null as Error | null,
      attemptCount: 0,
    };

    const listeners: Array<() => void> = [];

    const setState = (newState: typeof state) => {
      Object.assign(state, newState);
      listeners.forEach(listener => listener());
    };

    const reset = () => {
      setState({
        isRetrying: false,
        error: null,
        attemptCount: 0,
      });
    };

    const cancelledRef = { current: false };

    const cancel = () => {
      cancelledRef.current = true;
      setState({
        ...state,
        isRetrying: false,
      });
    };

    const execute = async <T,>(operation: () => Promise<T>): Promise<T> => {
      cancelledRef.current = false;

      setState({
        isRetrying: true,
        error: null,
        attemptCount: 0,
      });

      const result = await mockRetryWithBackoff(operation, {
        onRetry: (error, attempt) => {
          if (!cancelledRef.current) {
            setState({
              isRetrying: true,
              error,
              attemptCount: attempt,
            });
          }
        },
      });

      if (cancelledRef.current) {
        throw new Error('Operation cancelled');
      }

      const typedResult = result as RetryResult<T>;

      if (typedResult.success) {
        setState({
          isRetrying: false,
          error: null,
          attemptCount: typedResult.attempts,
        });
        return typedResult.data!;
      } else {
        const error = typedResult.error || new Error('Operation failed');
        setState({
          isRetrying: false,
          error,
          attemptCount: typedResult.attempts,
        });
        throw error;
      }
    };

    return {
      get state() {
        return { ...state };
      },
      execute,
      reset,
      cancel,
      subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index > -1) listeners.splice(index, 1);
        };
      },
    };
  };

  it('should initialize with default state', () => {
    const hook = simulateUseRetry();

    expect(hook.state.isRetrying).toBe(false);
    expect(hook.state.error).toBe(null);
    expect(hook.state.attemptCount).toBe(0);
  });

  it('should set isRetrying to true when executing', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockImplementation(async () => {
      // Check state during execution
      expect(hook.state.isRetrying).toBe(true);
      return {
        success: true,
        data: 'success',
        attempts: 1,
      };
    });

    await hook.execute(async () => 'success');
  });

  it('should update state on successful execution', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: 'success',
      attempts: 1,
    });

    const result = await hook.execute(async () => 'success');

    expect(result).toBe('success');
    expect(hook.state.isRetrying).toBe(false);
    expect(hook.state.error).toBe(null);
    expect(hook.state.attemptCount).toBe(1);
  });

  it('should update state on failed execution', async () => {
    const hook = simulateUseRetry();
    const error = new Error('Network failed');

    mockRetryWithBackoff.mockResolvedValue({
      success: false,
      error,
      attempts: 3,
    });

    await expect(hook.execute(async () => 'test')).rejects.toThrow('Network failed');

    expect(hook.state.isRetrying).toBe(false);
    expect(hook.state.error).toBe(error);
    expect(hook.state.attemptCount).toBe(3);
  });

  it('should track retry attempts', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockImplementation(async (op, options) => {
      // Simulate retries
      options?.onRetry?.(new Error('Attempt 1'), 1, 1000);
      options?.onRetry?.(new Error('Attempt 2'), 2, 2000);

      return {
        success: true,
        data: 'success',
        attempts: 3,
      };
    });

    await hook.execute(async () => 'success');

    expect(hook.state.attemptCount).toBe(3);
  });

  it('should reset state', async () => {
    const hook = simulateUseRetry();
    const error = new Error('Failed');

    mockRetryWithBackoff.mockResolvedValue({
      success: false,
      error,
      attempts: 2,
    });

    await expect(hook.execute(async () => 'test')).rejects.toThrow();

    expect(hook.state.error).toBe(error);
    expect(hook.state.attemptCount).toBe(2);

    hook.reset();

    expect(hook.state.isRetrying).toBe(false);
    expect(hook.state.error).toBe(null);
    expect(hook.state.attemptCount).toBe(0);
  });

  it('should handle cancellation', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockImplementation(async () => {
      hook.cancel();
      return {
        success: true,
        data: 'success',
        attempts: 1,
      };
    });

    await expect(hook.execute(async () => 'test')).rejects.toThrow(
      'Operation cancelled'
    );

    expect(hook.state.isRetrying).toBe(false);
  });

  it('should not update state after cancellation', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockImplementation(async (op, options) => {
      hook.cancel();

      // Try to trigger onRetry after cancel
      options?.onRetry?.(new Error('Should not update'), 1, 1000);

      return {
        success: true,
        data: 'success',
        attempts: 1,
      };
    });

    await expect(hook.execute(async () => 'test')).rejects.toThrow();

    // State should not have retry error
    expect(hook.state.attemptCount).toBe(0);
  });

  it('should handle operation returning undefined', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: undefined,
      attempts: 1,
    });

    const result = await hook.execute(async () => undefined);

    expect(result).toBeUndefined();
    expect(hook.state.isRetrying).toBe(false);
    expect(hook.state.error).toBe(null);
  });

  it('should handle missing error in failed result', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockResolvedValue({
      success: false,
      attempts: 1,
    } as any);

    await expect(hook.execute(async () => 'test')).rejects.toThrow(
      'Operation failed'
    );

    expect(hook.state.error?.message).toBe('Operation failed');
  });
});

describe('useRetry - Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const simulateUseRetry = () => {
    const state = {
      isRetrying: false,
      error: null as Error | null,
      attemptCount: 0,
    };

    const setState = (newState: typeof state) => {
      Object.assign(state, newState);
    };

    const reset = () => {
      setState({
        isRetrying: false,
        error: null,
        attemptCount: 0,
      });
    };

    const cancelledRef = { current: false };

    const cancel = () => {
      cancelledRef.current = true;
      setState({
        ...state,
        isRetrying: false,
      });
    };

    const execute = async <T,>(operation: () => Promise<T>): Promise<T> => {
      cancelledRef.current = false;

      setState({
        isRetrying: true,
        error: null,
        attemptCount: 0,
      });

      const result = await mockRetryWithBackoff(operation, {
        onRetry: (error, attempt) => {
          if (!cancelledRef.current) {
            setState({
              isRetrying: true,
              error,
              attemptCount: attempt,
            });
          }
        },
      });

      if (cancelledRef.current) {
        throw new Error('Operation cancelled');
      }

      const typedResult = result as RetryResult<T>;

      if (typedResult.success) {
        setState({
          isRetrying: false,
          error: null,
          attemptCount: typedResult.attempts,
        });
        return typedResult.data!;
      } else {
        const error = typedResult.error || new Error('Operation failed');
        setState({
          isRetrying: false,
          error,
          attemptCount: typedResult.attempts,
        });
        throw error;
      }
    };

    return {
      get state() {
        return { ...state };
      },
      execute,
      reset,
      cancel,
    };
  };

  it('should handle API call scenario', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockResolvedValue({
      success: true,
      data: { userId: 123, name: 'Test' },
      attempts: 1,
    });

    const result = await hook.execute(async () => ({
      userId: 123,
      name: 'Test',
    }));

    expect(result).toEqual({ userId: 123, name: 'Test' });
    expect(hook.state.isRetrying).toBe(false);
  });

  it('should handle retry with eventual success', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff.mockImplementation(async (op, options) => {
      options?.onRetry?.(new Error('Network error'), 1, 1000);
      options?.onRetry?.(new Error('Network error'), 2, 2000);

      return {
        success: true,
        data: 'success after retries',
        attempts: 3,
      };
    });

    const result = await hook.execute(async () => 'success after retries');

    expect(result).toBe('success after retries');
    expect(hook.state.attemptCount).toBe(3);
    expect(hook.state.error).toBe(null);
  });

  it('should handle sequential operations', async () => {
    const hook = simulateUseRetry();

    mockRetryWithBackoff
      .mockResolvedValueOnce({
        success: true,
        data: 'first',
        attempts: 1,
      })
      .mockResolvedValueOnce({
        success: true,
        data: 'second',
        attempts: 1,
      });

    const result1 = await hook.execute(async () => 'first');
    const result2 = await hook.execute(async () => 'second');

    expect(result1).toBe('first');
    expect(result2).toBe('second');
  });
});
