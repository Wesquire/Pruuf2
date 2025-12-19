/**
 * Payment Slice - RevenueCat Implementation
 * Manages subscription offerings, purchases, and customer info via RevenueCat SDK
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  PurchasesStoreTransaction,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import {paymentsAPI} from '../../services/api';

/**
 * Type Definitions
 */

interface PruufOffering {
  identifier: string;
  monthlyPackage: PruufPackage | null;
  annualPackage: PruufPackage | null;
  availablePackages: PruufPackage[];
}

interface PruufPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
  offeringIdentifier: string;
}

interface PruufSubscription {
  productIdentifier: string;
  purchaseDate: string;
  originalPurchaseDate: string;
  expirationDate: string | null;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'monthly' | 'annual' | 'unknown';
  store: 'app_store' | 'play_store' | 'unknown';
}

interface PruufCustomerInfo {
  userId: string;
  hasProEntitlement: boolean;
  activeSubscriptions: string[];
  allPurchasedProductIds: string[];
  latestExpirationDate: string | null;
  originalAppUserId: string;
  managementURL: string | null;
}

interface PaymentState {
  // Offerings
  currentOffering: PruufOffering | null;
  availablePackages: PruufPackage[];

  // Customer info
  customerInfo: PruufCustomerInfo | null;
  hasProEntitlement: boolean;

  // Subscription details
  subscription: PruufSubscription | null;

  // UI state
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;

  // Last fetch timestamp for caching
  lastFetchedAt: number | null;
}

const initialState: PaymentState = {
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

/**
 * Helper Functions
 */

function mapRevenueCatPackage(pkg: PurchasesPackage): PruufPackage {
  return {
    identifier: pkg.identifier,
    packageType: pkg.packageType,
    product: {
      identifier: pkg.product.identifier,
      title: pkg.product.title,
      description: pkg.product.description,
      price: pkg.product.price,
      priceString: pkg.product.priceString,
      currencyCode: pkg.product.currencyCode,
    },
    offeringIdentifier: pkg.offeringIdentifier,
  };
}

function mapRevenueCatOffering(offering: any): PruufOffering {
  return {
    identifier: offering.identifier,
    monthlyPackage: offering.monthly
      ? mapRevenueCatPackage(offering.monthly)
      : null,
    annualPackage: offering.annual
      ? mapRevenueCatPackage(offering.annual)
      : null,
    availablePackages: offering.availablePackages.map(mapRevenueCatPackage),
  };
}

function mapRevenueCatCustomerInfo(info: CustomerInfo): PruufCustomerInfo {
  const hasProEntitlement = typeof info.entitlements.active.pro !== 'undefined';

  return {
    userId: info.originalAppUserId,
    hasProEntitlement,
    activeSubscriptions: info.activeSubscriptions,
    allPurchasedProductIds: info.allPurchasedProductIdentifiers,
    latestExpirationDate: info.latestExpirationDate || null,
    originalAppUserId: info.originalAppUserId,
    managementURL: info.managementURL || null,
  };
}

function extractSubscriptionDetails(
  info: CustomerInfo,
): PruufSubscription | null {
  // Get active subscription (prefer monthly, fallback to annual)
  const entitlement = info.entitlements.active.pro;

  if (!entitlement) {
    return null;
  }

  // Determine period type from product identifier
  let periodType: 'monthly' | 'annual' | 'unknown' = 'unknown';
  if (entitlement.productIdentifier.includes('monthly')) {
    periodType = 'monthly';
  } else if (entitlement.productIdentifier.includes('annual')) {
    periodType = 'annual';
  }

  // Determine store
  let store: 'app_store' | 'play_store' | 'unknown' = 'unknown';
  if (entitlement.store === 'APP_STORE') {
    store = 'app_store';
  } else if (entitlement.store === 'PLAY_STORE') {
    store = 'play_store';
  }

  return {
    productIdentifier: entitlement.productIdentifier,
    purchaseDate: entitlement.latestPurchaseDate,
    originalPurchaseDate: entitlement.originalPurchaseDate,
    expirationDate: entitlement.expirationDate || null,
    isActive: entitlement.isActive,
    willRenew: entitlement.willRenew,
    periodType,
    store,
  };
}

/**
 * Async Thunks
 */

export const fetchOfferings = createAsyncThunk(
  'payment/fetchOfferings',
  async (_, {rejectWithValue}) => {
    try {
      const offerings: PurchasesOfferings = await Purchases.getOfferings();

      if (!offerings.current) {
        return rejectWithValue('No offerings available');
      }

      return mapRevenueCatOffering(offerings.current);
    } catch (error: any) {
      console.error('Failed to fetch offerings:', error);
      return rejectWithValue(
        error.message || 'Failed to load subscription options',
      );
    }
  },
);

export const fetchCustomerInfo = createAsyncThunk(
  'payment/fetchCustomerInfo',
  async (_, {rejectWithValue}) => {
    try {
      const info: CustomerInfo = await Purchases.getCustomerInfo();

      const customerInfo = mapRevenueCatCustomerInfo(info);
      const subscription = extractSubscriptionDetails(info);

      return {customerInfo, subscription};
    } catch (error: any) {
      console.error('Failed to fetch customer info:', error);
      return rejectWithValue(
        error.message || 'Failed to load subscription info',
      );
    }
  },
);

export const purchasePackage = createAsyncThunk(
  'payment/purchasePackage',
  async (packageToPurchase: PruufPackage, {rejectWithValue}) => {
    try {
      // Get the actual PurchasesPackage from offerings
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        return rejectWithValue('No offerings available');
      }

      const revenueCatPackage = currentOffering.availablePackages.find(
        pkg => pkg.identifier === packageToPurchase.identifier,
      );

      if (!revenueCatPackage) {
        return rejectWithValue('Package not found');
      }

      // Make purchase
      const {customerInfo, productIdentifier} =
        await Purchases.purchasePackage(revenueCatPackage);

      // Sync with backend
      await paymentsAPI.syncRevenueCatPurchase({
        productIdentifier,
        customerInfo: {
          originalAppUserId: customerInfo.originalAppUserId,
          activeSubscriptions: customerInfo.activeSubscriptions,
        },
      });

      const mappedCustomerInfo = mapRevenueCatCustomerInfo(customerInfo);
      const subscription = extractSubscriptionDetails(customerInfo);

      return {customerInfo: mappedCustomerInfo, subscription};
    } catch (error: any) {
      console.error('Purchase failed:', error);

      // Handle user cancellation
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return rejectWithValue('Purchase was cancelled');
      }

      return rejectWithValue(
        error.message || 'Failed to complete purchase',
      );
    }
  },
);

export const restorePurchases = createAsyncThunk(
  'payment/restorePurchases',
  async (_, {rejectWithValue}) => {
    try {
      const info: CustomerInfo = await Purchases.restorePurchases();

      // Sync with backend
      await paymentsAPI.syncRevenueCatPurchase({
        productIdentifier: null, // Restoration, not new purchase
        customerInfo: {
          originalAppUserId: info.originalAppUserId,
          activeSubscriptions: info.activeSubscriptions,
        },
      });

      const customerInfo = mapRevenueCatCustomerInfo(info);
      const subscription = extractSubscriptionDetails(info);

      return {customerInfo, subscription};
    } catch (error: any) {
      console.error('Restore failed:', error);
      return rejectWithValue(
        error.message || 'Failed to restore purchases',
      );
    }
  },
);

export const syncSubscriptionStatus = createAsyncThunk(
  'payment/syncSubscriptionStatus',
  async (_, {rejectWithValue}) => {
    try {
      // Fetch latest customer info from RevenueCat
      const info: CustomerInfo = await Purchases.getCustomerInfo();

      // Sync with backend
      const response = await paymentsAPI.syncRevenueCatStatus({
        originalAppUserId: info.originalAppUserId,
        activeSubscriptions: info.activeSubscriptions,
        hasProEntitlement:
          typeof info.entitlements.active.pro !== 'undefined',
      });

      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to sync subscription status',
        );
      }

      const customerInfo = mapRevenueCatCustomerInfo(info);
      const subscription = extractSubscriptionDetails(info);

      return {customerInfo, subscription};
    } catch (error: any) {
      console.error('Sync failed:', error);
      return rejectWithValue(error.message || 'Failed to sync status');
    }
  },
);

/**
 * Slice Definition
 */

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    resetPaymentState: () => initialState,
  },
  extraReducers: builder => {
    // Fetch Offerings
    builder
      .addCase(fetchOfferings.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOfferings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOffering = action.payload;
        state.availablePackages = action.payload.availablePackages;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchOfferings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Customer Info
    builder
      .addCase(fetchCustomerInfo.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customerInfo = action.payload.customerInfo;
        state.subscription = action.payload.subscription;
        state.hasProEntitlement = action.payload.customerInfo.hasProEntitlement;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchCustomerInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Purchase Package
    builder
      .addCase(purchasePackage.pending, state => {
        state.isPurchasing = true;
        state.error = null;
      })
      .addCase(purchasePackage.fulfilled, (state, action) => {
        state.isPurchasing = false;
        state.customerInfo = action.payload.customerInfo;
        state.subscription = action.payload.subscription;
        state.hasProEntitlement = action.payload.customerInfo.hasProEntitlement;
      })
      .addCase(purchasePackage.rejected, (state, action) => {
        state.isPurchasing = false;
        state.error = action.payload as string;
      });

    // Restore Purchases
    builder
      .addCase(restorePurchases.pending, state => {
        state.isRestoring = true;
        state.error = null;
      })
      .addCase(restorePurchases.fulfilled, (state, action) => {
        state.isRestoring = false;
        state.customerInfo = action.payload.customerInfo;
        state.subscription = action.payload.subscription;
        state.hasProEntitlement = action.payload.customerInfo.hasProEntitlement;
      })
      .addCase(restorePurchases.rejected, (state, action) => {
        state.isRestoring = false;
        state.error = action.payload as string;
      });

    // Sync Subscription Status
    builder
      .addCase(syncSubscriptionStatus.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customerInfo = action.payload.customerInfo;
        state.subscription = action.payload.subscription;
        state.hasProEntitlement = action.payload.customerInfo.hasProEntitlement;
        state.lastFetchedAt = Date.now();
      })
      .addCase(syncSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, resetPaymentState} = paymentSlice.actions;
export default paymentSlice.reducer;

// Selectors
export const selectCurrentOffering = (state: {payment: PaymentState}) =>
  state.payment.currentOffering;
export const selectAvailablePackages = (state: {payment: PaymentState}) =>
  state.payment.availablePackages;
export const selectCustomerInfo = (state: {payment: PaymentState}) =>
  state.payment.customerInfo;
export const selectHasProEntitlement = (state: {payment: PaymentState}) =>
  state.payment.hasProEntitlement;
export const selectSubscription = (state: {payment: PaymentState}) =>
  state.payment.subscription;
export const selectIsLoading = (state: {payment: PaymentState}) =>
  state.payment.isLoading;
export const selectIsPurchasing = (state: {payment: PaymentState}) =>
  state.payment.isPurchasing;
export const selectIsRestoring = (state: {payment: PaymentState}) =>
  state.payment.isRestoring;
export const selectError = (state: {payment: PaymentState}) =>
  state.payment.error;
