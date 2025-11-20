/**
 * Auth Slice Tests
 */

import authReducer, {
  setUser,
  setAccessToken,
  logout,
  AuthState,
} from '../authSlice';

describe('Auth Slice', () => {
  const initialState: AuthState = {
    isLoggedIn: false,
    isInitialized: false,
    user: null,
    accessToken: null,
    isLoading: false,
    error: null,
  };

  describe('reducers', () => {
    it('should handle setUser', () => {
      const user = {
        id: '123',
        phone: '+15551234567',
        account_status: 'trial' as const,
        is_member: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      const state = authReducer(initialState, setUser(user));
      expect(state.user).toEqual(user);
    });

    it('should handle setAccessToken', () => {
      const token = 'test-token-123';
      const state = authReducer(initialState, setAccessToken(token));
      expect(state.accessToken).toBe(token);
    });

    it('should handle logout', () => {
      const loggedInState: AuthState = {
        isLoggedIn: true,
        isInitialized: true,
        user: {
          id: '123',
          phone: '+15551234567',
          account_status: 'trial',
          is_member: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        accessToken: 'test-token',
        isLoading: false,
        error: null,
      };

      const state = authReducer(loggedInState, logout());
      expect(state.isLoggedIn).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });
});
