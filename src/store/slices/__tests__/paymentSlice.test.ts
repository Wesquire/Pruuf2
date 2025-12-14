/**
 * Payment Slice Tests
 */

import paymentReducer, {
  fetchPaymentMethods,
  fetchSubscription,
  createSetupIntent,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  clearError,
  clearSetupIntent,
} from '../paymentSlice';

describe('paymentSlice', () => {
  const initialState = {
    paymentMethods: [],
    subscription: null,
    isLoading: false,
    error: null,
    setupIntentClientSecret: null,
  };

  describe('reducers', () => {
    it('should handle clearError', () => {
      const state = {...initialState, error: 'Test error'};
      expect(paymentReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle clearSetupIntent', () => {
      const state = {...initialState, setupIntentClientSecret: 'secret-123'};
      expect(paymentReducer(state, clearSetupIntent())).toEqual({
        ...state,
        setupIntentClientSecret: null,
      });
    });
  });

  describe('fetchPaymentMethods', () => {
    it('should set payment methods on fulfilled', () => {
      const paymentMethods = [
        {
          id: 'pm_123',
          type: 'card' as const,
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
      ];

      const action = {
        type: fetchPaymentMethods.fulfilled.type,
        payload: paymentMethods,
      };
      expect(paymentReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        paymentMethods,
      });
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchPaymentMethods.rejected.type,
        payload: 'Error',
      };
      expect(paymentReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        error: 'Error',
      });
    });
  });

  describe('fetchSubscription', () => {
    it('should set subscription on fulfilled', () => {
      const subscription = {
        id: 'sub_123',
        status: 'active' as const,
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        cancelAtPeriodEnd: false,
      };

      const action = {
        type: fetchSubscription.fulfilled.type,
        payload: subscription,
      };
      expect(paymentReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        subscription,
      });
    });
  });

  describe('createSetupIntent', () => {
    it('should set setup intent client secret on fulfilled', () => {
      const action = {
        type: createSetupIntent.fulfilled.type,
        payload: 'secret-123',
      };
      expect(paymentReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        setupIntentClientSecret: 'secret-123',
      });
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method on fulfilled', () => {
      const paymentMethod = {
        id: 'pm_123',
        type: 'card' as const,
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      };

      const action = {
        type: addPaymentMethod.fulfilled.type,
        payload: paymentMethod,
      };
      expect(paymentReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        paymentMethods: [paymentMethod],
      });
    });
  });

  describe('removePaymentMethod', () => {
    it('should remove payment method on fulfilled', () => {
      const state = {
        ...initialState,
        paymentMethods: [
          {
            id: 'pm_123',
            type: 'card' as const,
            brand: 'visa',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          },
          {
            id: 'pm_456',
            type: 'card' as const,
            brand: 'mastercard',
            last4: '5555',
            expiryMonth: 6,
            expiryYear: 2026,
            isDefault: false,
          },
        ],
      };

      const action = {
        type: removePaymentMethod.fulfilled.type,
        payload: 'pm_123',
      };
      const result = paymentReducer(state, action);

      expect(result.paymentMethods).toHaveLength(1);
      expect(result.paymentMethods[0].id).toBe('pm_456');
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method on fulfilled', () => {
      const state = {
        ...initialState,
        paymentMethods: [
          {
            id: 'pm_123',
            type: 'card' as const,
            brand: 'visa',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          },
          {
            id: 'pm_456',
            type: 'card' as const,
            brand: 'mastercard',
            last4: '5555',
            expiryMonth: 6,
            expiryYear: 2026,
            isDefault: false,
          },
        ],
      };

      const action = {
        type: setDefaultPaymentMethod.fulfilled.type,
        payload: 'pm_456',
      };
      const result = paymentReducer(state, action);

      expect(result.paymentMethods[0].isDefault).toBe(false);
      expect(result.paymentMethods[1].isDefault).toBe(true);
    });
  });

  describe('createSubscription', () => {
    it('should set subscription on fulfilled', () => {
      const subscription = {
        id: 'sub_123',
        status: 'active' as const,
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        cancelAtPeriodEnd: false,
      };

      const action = {
        type: createSubscription.fulfilled.type,
        payload: subscription,
      };
      expect(paymentReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        subscription,
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should update subscription on fulfilled', () => {
      const state = {
        ...initialState,
        subscription: {
          id: 'sub_123',
          status: 'active' as const,
          currentPeriodEnd: '2025-02-01T00:00:00Z',
          cancelAtPeriodEnd: false,
        },
      };

      const updatedSubscription = {
        id: 'sub_123',
        status: 'active' as const,
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        cancelAtPeriodEnd: true,
      };

      const action = {
        type: cancelSubscription.fulfilled.type,
        payload: updatedSubscription,
      };
      expect(paymentReducer(state, action)).toEqual({
        ...state,
        isLoading: false,
        subscription: updatedSubscription,
      });
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate subscription on fulfilled', () => {
      const state = {
        ...initialState,
        subscription: {
          id: 'sub_123',
          status: 'active' as const,
          currentPeriodEnd: '2025-02-01T00:00:00Z',
          cancelAtPeriodEnd: true,
        },
      };

      const reactivatedSubscription = {
        id: 'sub_123',
        status: 'active' as const,
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        cancelAtPeriodEnd: false,
      };

      const action = {
        type: reactivateSubscription.fulfilled.type,
        payload: reactivatedSubscription,
      };
      expect(paymentReducer(state, action)).toEqual({
        ...state,
        isLoading: false,
        subscription: reactivatedSubscription,
      });
    });
  });
});
