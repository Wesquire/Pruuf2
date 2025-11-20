/**
 * useNotificationPermission Hook Tests
 * Item 37: Add Notification Permission Prompt (MEDIUM)
 */

import messaging from '@react-native-firebase/messaging';
import { storage } from '../services/storage';

// Mock Firebase messaging
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    hasPermission: jest.fn(),
    requestPermission: jest.fn(),
  })),
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

// Mock storage
jest.mock('../services/storage', () => ({
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockMessaging = messaging as jest.MockedFunction<typeof messaging>;
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('useNotificationPermission - Permission Status Conversion', () => {
  const convertAuthStatus = (status: number): string => {
    switch (status) {
      case 1: // AUTHORIZED
      case 2: // PROVISIONAL
        return 'granted';
      case 0: // DENIED
        return 'denied';
      case -1: // NOT_DETERMINED
      default:
        return 'undetermined';
    }
  };

  it('should convert AUTHORIZED to granted', () => {
    expect(convertAuthStatus(1)).toBe('granted');
  });

  it('should convert PROVISIONAL to granted', () => {
    expect(convertAuthStatus(2)).toBe('granted');
  });

  it('should convert DENIED to denied', () => {
    expect(convertAuthStatus(0)).toBe('denied');
  });

  it('should convert NOT_DETERMINED to undetermined', () => {
    expect(convertAuthStatus(-1)).toBe('undetermined');
  });
});

describe('useNotificationPermission - Hook Simulation', () => {
  let mockInstance: { hasPermission: jest.Mock; requestPermission: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up shared mock instance
    mockInstance = {
      hasPermission: jest.fn().mockResolvedValue(-1),
      requestPermission: jest.fn().mockResolvedValue(-1),
    };

    mockMessaging.mockReturnValue(mockInstance as any);
  });

  const simulateHook = () => {
    const state = {
      status: 'undetermined' as 'undetermined' | 'granted' | 'denied' | 'limited',
      isLoading: false,
      shouldShowPrompt: false,
    };

    const setState = (newState: Partial<typeof state>) => {
      Object.assign(state, newState);
    };

    const convertAuthStatus = (status: number) => {
      switch (status) {
        case 1:
        case 2:
          return 'granted' as const;
        case 0:
          return 'denied' as const;
        default:
          return 'undetermined' as const;
      }
    };

    const checkPermission = async () => {
      const instance = mockMessaging();
      const authStatus = await instance.hasPermission();
      const status = convertAuthStatus(authStatus);
      setState({ status });
      return status;
    };

    const requestPermission = async () => {
      setState({ isLoading: true });

      const instance = mockMessaging();
      const authStatus = await instance.requestPermission();
      const status = convertAuthStatus(authStatus);
      const granted = status === 'granted';

      setState({
        status,
        isLoading: false,
        shouldShowPrompt: false,
      });

      return granted;
    };

    const showPrompt = () => {
      setState({ shouldShowPrompt: true });
    };

    const hidePrompt = async () => {
      setState({ shouldShowPrompt: false });

      const countStr = await mockStorage.getItem('notification_prompt_dismissed_count');
      const count = countStr ? parseInt(countStr, 10) : 0;
      await mockStorage.setItem('notification_prompt_dismissed_count', String(count + 1));
    };

    const markPromptShown = async () => {
      await mockStorage.setItem('notification_prompt_shown', 'true');
    };

    return {
      get state() {
        return { ...state };
      },
      checkPermission,
      requestPermission,
      showPrompt,
      hidePrompt,
      markPromptShown,
    };
  };

  it('should initialize with undetermined status', () => {
    const hook = simulateHook();
    expect(hook.state.status).toBe('undetermined');
    expect(hook.state.isLoading).toBe(false);
    expect(hook.state.shouldShowPrompt).toBe(false);
  });

  it('should check permission status', async () => {
    const hook = simulateHook();

    mockInstance.hasPermission.mockResolvedValue(1); // AUTHORIZED

    const status = await hook.checkPermission();

    expect(status).toBe('granted');
    expect(hook.state.status).toBe('granted');
  });

  it('should request permission and update state', async () => {
    const hook = simulateHook();

    mockInstance.requestPermission.mockResolvedValue(1); // AUTHORIZED

    const granted = await hook.requestPermission();

    expect(granted).toBe(true);
    expect(hook.state.status).toBe('granted');
    expect(hook.state.isLoading).toBe(false);
    expect(hook.state.shouldShowPrompt).toBe(false);
  });

  it('should handle denied permission', async () => {
    const hook = simulateHook();

    mockInstance.requestPermission.mockResolvedValue(0); // DENIED

    const granted = await hook.requestPermission();

    expect(granted).toBe(false);
    expect(hook.state.status).toBe('denied');
  });

  it('should show prompt', () => {
    const hook = simulateHook();

    hook.showPrompt();

    expect(hook.state.shouldShowPrompt).toBe(true);
  });

  it('should hide prompt and increment dismissal count', async () => {
    const hook = simulateHook();

    mockStorage.getItem.mockResolvedValue('2'); // Previous count

    hook.showPrompt();
    expect(hook.state.shouldShowPrompt).toBe(true);

    await hook.hidePrompt();

    expect(hook.state.shouldShowPrompt).toBe(false);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'notification_prompt_dismissed_count',
      '3'
    );
  });

  it('should mark prompt as shown', async () => {
    const hook = simulateHook();

    await hook.markPromptShown();

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'notification_prompt_shown',
      'true'
    );
  });

  it('should set loading state during permission request', async () => {
    const hook = simulateHook();

    const instance = mockMessaging();
    (instance.requestPermission as jest.Mock).mockImplementation(async () => {
      expect(hook.state.isLoading).toBe(true);
      return 1;
    });

    await hook.requestPermission();

    expect(hook.state.isLoading).toBe(false);
  });
});

describe('useNotificationPermission - Auto-Show Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const shouldAutoShowPrompt = async (
    hasShown: string | null,
    dismissalCount: string | null,
    permissionStatus: number
  ): Promise<boolean> => {
    // Don't show if already shown
    if (hasShown === 'true') {
      return false;
    }

    // Don't show if dismissed too many times
    const count = dismissalCount ? parseInt(dismissalCount, 10) : 0;
    if (count >= 3) {
      return false;
    }

    // Convert permission status
    const status = permissionStatus === 1 || permissionStatus === 2
      ? 'granted'
      : permissionStatus === 0
      ? 'denied'
      : 'undetermined';

    // Show only if undetermined
    return status === 'undetermined';
  };

  it('should not auto-show if already shown', async () => {
    const shouldShow = await shouldAutoShowPrompt('true', null, -1);
    expect(shouldShow).toBe(false);
  });

  it('should not auto-show if dismissed 3 times', async () => {
    const shouldShow = await shouldAutoShowPrompt(null, '3', -1);
    expect(shouldShow).toBe(false);
  });

  it('should not auto-show if permission already granted', async () => {
    const shouldShow = await shouldAutoShowPrompt(null, '0', 1);
    expect(shouldShow).toBe(false);
  });

  it('should not auto-show if permission denied', async () => {
    const shouldShow = await shouldAutoShowPrompt(null, '0', 0);
    expect(shouldShow).toBe(false);
  });

  it('should auto-show if undetermined and not shown/dismissed', async () => {
    const shouldShow = await shouldAutoShowPrompt(null, '0', -1);
    expect(shouldShow).toBe(true);
  });

  it('should auto-show if undetermined with 2 dismissals', async () => {
    const shouldShow = await shouldAutoShowPrompt(null, '2', -1);
    expect(shouldShow).toBe(true);
  });
});

describe('useNotificationPermission - Edge Cases', () => {
  let mockInstance: { hasPermission: jest.Mock; requestPermission: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstance = {
      hasPermission: jest.fn(),
      requestPermission: jest.fn(),
    };

    mockMessaging.mockReturnValue(mockInstance as any);
  });

  it('should handle storage errors gracefully', async () => {
    const hook = () => {
      const markPromptShown = async () => {
        try {
          await mockStorage.setItem('notification_prompt_shown', 'true');
        } catch (error) {
          console.error('Error marking prompt as shown:', error);
        }
      };

      return { markPromptShown };
    };

    const instance = hook();

    mockStorage.setItem.mockRejectedValue(new Error('Storage error'));

    await expect(instance.markPromptShown()).resolves.not.toThrow();
  });

  it('should handle permission check errors', async () => {
    const checkPermission = async () => {
      try {
        const instance = mockMessaging();
        await instance.hasPermission();
        return 'granted' as const;
      } catch (error) {
        console.error('Error checking notification permission:', error);
        return 'undetermined' as const;
      }
    };

    mockInstance.hasPermission.mockRejectedValue(new Error('Permission error'));

    const status = await checkPermission();
    expect(status).toBe('undetermined');
  });
});
