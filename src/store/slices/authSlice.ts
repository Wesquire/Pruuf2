/**
 * Auth Slice
 * Manages authentication state
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {authAPI} from '../../services/api';
import {UserProfile} from '../../types';
import {storage} from '../../services/storage';

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, {rejectWithValue}) => {
    try {
      const token = await storage.getAccessToken();
      const user = await storage.getUser();

      if (token && user) {
        return {accessToken: token, user};
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const sendVerificationCode = createAsyncThunk(
  'auth/sendVerificationCode',
  async (email: string, {rejectWithValue}) => {
    try {
      const response = await authAPI.sendVerificationCode(email);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to send code');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const verifyCode = createAsyncThunk(
  'auth/verifyCode',
  async ({email, code}: {email: string; code: string}, {rejectWithValue}) => {
    try {
      const response = await authAPI.verifyCode(email, code);
      if (!response.success) {
        return rejectWithValue(response.error || 'Invalid code');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createAccount = createAsyncThunk(
  'auth/createAccount',
  async (
    {
      email,
      pin,
      sessionToken,
    }: {email: string; pin: string; sessionToken: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await authAPI.createAccount(email, pin, sessionToken);
      if (!response.success || !response.user || !response.access_token) {
        return rejectWithValue(response.error || 'Failed to create account');
      }

      // Save to storage
      await storage.setAccessToken(response.access_token);
      await storage.setUser(response.user);

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async ({email, pin}: {email: string; pin: string}, {rejectWithValue}) => {
    try {
      const response = await authAPI.login(email, pin);
      if (!response.success || !response.user || !response.access_token) {
        return rejectWithValue(response.error || 'Login failed');
      }

      // Save to storage
      await storage.setAccessToken(response.access_token);
      await storage.setUser(response.user);

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await storage.clearAll();
  return true;
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
    },
  },
  extraReducers: builder => {
    // Initialize auth
    builder.addCase(initializeAuth.pending, state => {
      state.isLoading = true;
    });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isInitialized = true;
      if (action.payload) {
        state.isLoggedIn = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
      }
    });
    builder.addCase(initializeAuth.rejected, state => {
      state.isLoading = false;
      state.isInitialized = true;
    });

    // Send verification code
    builder.addCase(sendVerificationCode.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendVerificationCode.fulfilled, state => {
      state.isLoading = false;
    });
    builder.addCase(sendVerificationCode.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Verify code
    builder.addCase(verifyCode.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyCode.fulfilled, state => {
      state.isLoading = false;
    });
    builder.addCase(verifyCode.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create account
    builder.addCase(createAccount.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createAccount.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = true;
      state.user = action.payload.user!;
      state.accessToken = action.payload.access_token!;
    });
    builder.addCase(createAccount.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(login.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = true;
      state.user = action.payload.user!;
      state.accessToken = action.payload.access_token!;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, state => {
      state.isLoggedIn = false;
      state.user = null;
      state.accessToken = null;
    });
  },
});

export const {clearError, setUser} = authSlice.actions;
export default authSlice.reducer;
