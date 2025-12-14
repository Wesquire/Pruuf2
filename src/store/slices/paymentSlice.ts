/**
 * Payment Slice
 * Manages payment and subscription state
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {paymentAPI} from '../../services/api';

interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Subscription {
  id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trial';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

interface PaymentState {
  paymentMethods: PaymentMethod[];
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  setupIntentClientSecret: string | null;
}

const initialState: PaymentState = {
  paymentMethods: [],
  subscription: null,
  isLoading: false,
  error: null,
  setupIntentClientSecret: null,
};

// Async thunks
export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchPaymentMethods',
  async (_, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to fetch payment methods',
        );
      }
      return response.paymentMethods || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchSubscription = createAsyncThunk(
  'payment/fetchSubscription',
  async (_, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.getSubscription();
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to fetch subscription',
        );
      }
      return response.subscription;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createSetupIntent = createAsyncThunk(
  'payment/createSetupIntent',
  async (_, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.createSetupIntent();
      if (!response.success || !response.clientSecret) {
        return rejectWithValue(
          response.error || 'Failed to create setup intent',
        );
      }
      return response.clientSecret;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const addPaymentMethod = createAsyncThunk(
  'payment/addPaymentMethod',
  async (paymentMethodId: string, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.attachPaymentMethod(paymentMethodId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to add payment method',
        );
      }
      return response.paymentMethod;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const removePaymentMethod = createAsyncThunk(
  'payment/removePaymentMethod',
  async (paymentMethodId: string, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.detachPaymentMethod(paymentMethodId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to remove payment method',
        );
      }
      return paymentMethodId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const setDefaultPaymentMethod = createAsyncThunk(
  'payment/setDefaultPaymentMethod',
  async (paymentMethodId: string, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.setDefaultPaymentMethod(
        paymentMethodId,
      );
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to set default payment method',
        );
      }
      return paymentMethodId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createSubscription = createAsyncThunk(
  'payment/createSubscription',
  async (paymentMethodId: string, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.createSubscription(paymentMethodId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to create subscription',
        );
      }
      return response.subscription;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const cancelSubscription = createAsyncThunk(
  'payment/cancelSubscription',
  async (_, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.cancelSubscription();
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to cancel subscription',
        );
      }
      return response.subscription;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const reactivateSubscription = createAsyncThunk(
  'payment/reactivateSubscription',
  async (_, {rejectWithValue}) => {
    try {
      const response = await paymentAPI.reactivateSubscription();
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to reactivate subscription',
        );
      }
      return response.subscription;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearSetupIntent: state => {
      state.setupIntentClientSecret = null;
    },
  },
  extraReducers: builder => {
    // Fetch payment methods
    builder.addCase(fetchPaymentMethods.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPaymentMethods.fulfilled, (state, action) => {
      state.isLoading = false;
      state.paymentMethods = action.payload;
    });
    builder.addCase(fetchPaymentMethods.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch subscription
    builder.addCase(fetchSubscription.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSubscription.fulfilled, (state, action) => {
      state.isLoading = false;
      state.subscription = action.payload;
    });
    builder.addCase(fetchSubscription.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create setup intent
    builder.addCase(createSetupIntent.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createSetupIntent.fulfilled, (state, action) => {
      state.isLoading = false;
      state.setupIntentClientSecret = action.payload;
    });
    builder.addCase(createSetupIntent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add payment method
    builder.addCase(addPaymentMethod.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addPaymentMethod.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.paymentMethods.push(action.payload);
      }
    });
    builder.addCase(addPaymentMethod.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Remove payment method
    builder.addCase(removePaymentMethod.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removePaymentMethod.fulfilled, (state, action) => {
      state.isLoading = false;
      state.paymentMethods = state.paymentMethods.filter(
        pm => pm.id !== action.payload,
      );
    });
    builder.addCase(removePaymentMethod.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Set default payment method
    builder.addCase(setDefaultPaymentMethod.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(setDefaultPaymentMethod.fulfilled, (state, action) => {
      state.isLoading = false;
      state.paymentMethods.forEach(pm => {
        pm.isDefault = pm.id === action.payload;
      });
    });
    builder.addCase(setDefaultPaymentMethod.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create subscription
    builder.addCase(createSubscription.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createSubscription.fulfilled, (state, action) => {
      state.isLoading = false;
      state.subscription = action.payload;
    });
    builder.addCase(createSubscription.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Cancel subscription
    builder.addCase(cancelSubscription.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(cancelSubscription.fulfilled, (state, action) => {
      state.isLoading = false;
      state.subscription = action.payload;
    });
    builder.addCase(cancelSubscription.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Reactivate subscription
    builder.addCase(reactivateSubscription.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(reactivateSubscription.fulfilled, (state, action) => {
      state.isLoading = false;
      state.subscription = action.payload;
    });
    builder.addCase(reactivateSubscription.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const {clearError, clearSetupIntent} = paymentSlice.actions;
export default paymentSlice.reducer;
