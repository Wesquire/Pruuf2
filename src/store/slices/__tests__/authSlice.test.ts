/**
 * Auth Slice Tests
 */

import authReducer, {setUser, clearError, logout} from '../authSlice';

describe('Auth Slice', () => {
  const initialState = {
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
        email: 'test@example.com',
        account_status: 'active' as const,
        is_member: false,
        font_size_preference: 'standard' as const,
      };

      const state = authReducer(initialState, setUser(user));
      expect(state.user).toEqual(user);
    });

    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: 'Test error',
      };

      const state = authReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });

    it('should handle logout fulfilled', () => {
      const loggedInState = {
        isLoggedIn: true,
        isInitialized: true,
        user: {
          id: '123',
          email: 'test@example.com',
          account_status: 'active' as const,
          is_member: false,
          font_size_preference: 'standard' as const,
        },
        accessToken: 'test-token',
        isLoading: false,
        error: null,
      };

      const action = {type: logout.fulfilled.type};
      const state = authReducer(loggedInState, action);
      expect(state.isLoggedIn).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });
  });
});
