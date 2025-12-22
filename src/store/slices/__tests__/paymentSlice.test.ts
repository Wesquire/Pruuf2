/**
 * Payment Slice Tests - RevenueCat Implementation
 * Tests for the RevenueCat-based payment state management
 */

import paymentReducer, {
  fetchOfferings,
  fetchCustomerInfo,
  purchasePackage,
  restorePurchases,
  syncSubscriptionStatus,
  clearError,
  resetPaymentState,
} from '../paymentSlice';

describe('paymentSlice', () => {
  const initialState = {
    currentOffering: null,
    availablePackages: [],
    customerInfo: null,
    hasProEntitlement: false,
    subscription: null,
    isLoading: false,
    isPurchasing: false,
    isRestoring: false,
    error: null,
    lastFetchedAt: null,
  };

  const mockOffering = {
    identifier: 'default',
    monthlyPackage: {
      identifier: '$rc_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'pruuf_monthly_499',
        title: 'Pruuf Monthly',
        description: 'Monthly subscription',
        price: 4.99,
        priceString: '$4.99',
        currencyCode: 'USD',
      },
      offeringIdentifier: 'default',
    },
    annualPackage: {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: {
        identifier: 'pruuf_annual_4999',
        title: 'Pruuf Annual',
        description: 'Annual subscription',
        price: 49.99,
        priceString: '$49.99',
        currencyCode: 'USD',
      },
      offeringIdentifier: 'default',
    },
    availablePackages: [],
  };

  const mockCustomerInfo = {
    userId: 'user_123',
    hasProEntitlement: true,
    activeSubscriptions: ['pruuf_monthly_499'],
    allPurchasedProductIds: ['pruuf_monthly_499'],
    latestExpirationDate: '2025-02-01T00:00:00Z',
    originalAppUserId: 'user_123',
    managementURL: 'https://apps.apple.com/account/subscriptions',
  };

  const mockSubscription = {
    productIdentifier: 'pruuf_monthly_499',
    purchaseDate: '2025-01-01T00:00:00Z',
    originalPurchaseDate: '2025-01-01T00:00:00Z',
    expirationDate: '2025-02-01T00:00:00Z',
    isActive: true,
    willRenew: true,
    periodType: 'monthly' as const,
    store: 'app_store' as const,
  };

  describe('reducers', () => {
    it('should return initial state', () => {
      expect(paymentReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const state = {...initialState, error: 'Test error'};
      expect(paymentReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle resetPaymentState', () => {
      const state = {
        ...initialState,
        currentOffering: mockOffering,
        hasProEntitlement: true,
        error: 'Some error',
      };
      expect(paymentReducer(state, resetPaymentState())).toEqual(initialState);
    });
  });

  describe('fetchOfferings', () => {
    it('should set loading state on pending', () => {
      const action = {type: fetchOfferings.pending.type};
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set offering on fulfilled', () => {
      const action = {
        type: fetchOfferings.fulfilled.type,
        payload: mockOffering,
      };
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(false);
      expect(state.currentOffering).toEqual(mockOffering);
      expect(state.lastFetchedAt).not.toBe(null);
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchOfferings.rejected.type,
        payload: 'Failed to fetch offerings',
      };
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch offerings');
    });
  });

  describe('fetchCustomerInfo', () => {
    it('should set loading state on pending', () => {
      const action = {type: fetchCustomerInfo.pending.type};
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set customer info and subscription on fulfilled', () => {
      const action = {
        type: fetchCustomerInfo.fulfilled.type,
        payload: {customerInfo: mockCustomerInfo, subscription: mockSubscription},
      };
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(false);
      expect(state.customerInfo).toEqual(mockCustomerInfo);
      expect(state.subscription).toEqual(mockSubscription);
      expect(state.hasProEntitlement).toBe(true);
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchCustomerInfo.rejected.type,
        payload: 'Failed to fetch customer info',
      };
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch customer info');
    });
  });

  describe('purchasePackage', () => {
    it('should set purchasing state on pending', () => {
      const action = {type: purchasePackage.pending.type};
      const state = paymentReducer(initialState, action);
      expect(state.isPurchasing).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state on successful purchase', () => {
      const action = {
        type: purchasePackage.fulfilled.type,
        payload: {customerInfo: mockCustomerInfo, subscription: mockSubscription},
      };
      const state = paymentReducer(initialState, action);
      expect(state.isPurchasing).toBe(false);
      expect(state.customerInfo).toEqual(mockCustomerInfo);
      expect(state.subscription).toEqual(mockSubscription);
      expect(state.hasProEntitlement).toBe(true);
    });

    it('should set error on rejected purchase', () => {
      const action = {
        type: purchasePackage.rejected.type,
        payload: 'Purchase was cancelled',
      };
      const state = paymentReducer(initialState, action);
      expect(state.isPurchasing).toBe(false);
      expect(state.error).toBe('Purchase was cancelled');
    });
  });

  describe('restorePurchases', () => {
    it('should set restoring state on pending', () => {
      const action = {type: restorePurchases.pending.type};
      const state = paymentReducer(initialState, action);
      expect(state.isRestoring).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state on successful restore', () => {
      const action = {
        type: restorePurchases.fulfilled.type,
        payload: {customerInfo: mockCustomerInfo, subscription: mockSubscription},
      };
      const state = paymentReducer(initialState, action);
      expect(state.isRestoring).toBe(false);
      expect(state.customerInfo).toEqual(mockCustomerInfo);
      expect(state.subscription).toEqual(mockSubscription);
      expect(state.hasProEntitlement).toBe(true);
    });

    it('should set error on rejected restore', () => {
      const action = {
        type: restorePurchases.rejected.type,
        payload: 'Failed to restore purchases',
      };
      const state = paymentReducer(initialState, action);
      expect(state.isRestoring).toBe(false);
      expect(state.error).toBe('Failed to restore purchases');
    });
  });

  describe('syncSubscriptionStatus', () => {
    it('should set loading state on pending', () => {
      const action = {type: syncSubscriptionStatus.pending.type};
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state on successful sync', () => {
      const action = {
        type: syncSubscriptionStatus.fulfilled.type,
        payload: {customerInfo: mockCustomerInfo, subscription: mockSubscription},
      };
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(false);
      expect(state.customerInfo).toEqual(mockCustomerInfo);
      expect(state.subscription).toEqual(mockSubscription);
      expect(state.hasProEntitlement).toBe(true);
      expect(state.lastFetchedAt).not.toBe(null);
    });

    it('should set error on rejected sync', () => {
      const action = {
        type: syncSubscriptionStatus.rejected.type,
        payload: 'Failed to sync status',
      };
      const state = paymentReducer(initialState, action);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to sync status');
    });
  });

  describe('state transitions', () => {
    it('should handle entitlement change from false to true', () => {
      const stateWithoutEntitlement = {...initialState, hasProEntitlement: false};
      const action = {
        type: fetchCustomerInfo.fulfilled.type,
        payload: {customerInfo: mockCustomerInfo, subscription: mockSubscription},
      };
      const newState = paymentReducer(stateWithoutEntitlement, action);
      expect(newState.hasProEntitlement).toBe(true);
    });

    it('should handle subscription expiration', () => {
      const expiredCustomerInfo = {
        ...mockCustomerInfo,
        hasProEntitlement: false,
        activeSubscriptions: [],
      };
      const action = {
        type: fetchCustomerInfo.fulfilled.type,
        payload: {customerInfo: expiredCustomerInfo, subscription: null},
      };
      const state = paymentReducer(initialState, action);
      expect(state.hasProEntitlement).toBe(false);
      expect(state.subscription).toBe(null);
    });
  });
});
