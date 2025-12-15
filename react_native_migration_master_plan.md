# PRUUF: REACT NATIVE CLI MIGRATION MASTER PLAN

**Document Version:** 1.0
**Created:** December 15, 2025
**Migration Direction:** FROM Expo Dependencies TO Pure React Native CLI
**Target Architecture:** React Native CLI 0.74.0 (Bare Workflow)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target State Specification](#3-target-state-specification)
4. [Migration Scope Overview](#4-migration-scope-overview)
5. [Phase 1: Icon Migration](#5-phase-1-icon-migration)
6. [Phase 2: Haptics Migration](#6-phase-2-haptics-migration)
7. [Phase 3: Payment Migration (Stripe to RevenueCat)](#7-phase-3-payment-migration-stripe-to-revenuecat)
8. [Phase 4: Twilio/SMS Complete Removal](#8-phase-4-twiliosms-complete-removal)
9. [Phase 5: Domain Corrections](#9-phase-5-domain-corrections)
10. [Phase 6: Package.json Cleanup](#10-phase-6-packagejson-cleanup)
11. [Phase 7: Native Configuration Updates](#11-phase-7-native-configuration-updates)
12. [Phase 8: Testing & Validation](#12-phase-8-testing--validation)
13. [Account Setup Checklist Reference](#13-account-setup-checklist-reference)
14. [Rollback Plan](#14-rollback-plan)
15. [File Change Manifest](#15-file-change-manifest)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Migration Purpose

This document provides a comprehensive, step-by-step plan to migrate the Pruuf application **FROM** its current hybrid state with Expo dependencies **TO** a pure React Native CLI (bare workflow) architecture.

### 1.2 Key Migrations

| Category | FROM (Current) | TO (Target) | Impact |
|----------|----------------|-------------|--------|
| **Icons** | `@expo/vector-icons` | `react-native-vector-icons` | 19 files |
| **Haptics** | `expo-haptics` | `react-native-haptic-feedback` | 1 file |
| **Payments** | Stripe SDK | RevenueCat (Apple IAP / Google Play) | 4+ files |
| **Notifications** | SMS/Twilio references | FCM + Postmark Email ONLY | 10+ files |
| **Domain** | pruuf.com, pruuf.life | pruuf.me | 3 source files |

### 1.3 What This Migration Does NOT Change

- React Native version (remains 0.74.0)
- Redux Toolkit state management
- Supabase backend integration
- Firebase Cloud Messaging (FCM) for push notifications
- Postmark for transactional emails
- Core navigation structure
- UI/UX design patterns

### 1.4 Critical Rules

1. **Members NEVER pay** - This business logic is preserved
2. **Domain is pruuf.me** - NOT pruuf.com, NOT pruuf.life
3. **App identifier is me.pruuf.app** - Bundle ID for iOS, application ID for Android
4. **Pricing: $3.99/month or $29/year** - 30-day free trial
5. **SMS/Twilio is REMOVED completely** - Not replaced, just deleted

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Package Dependencies (Current package.json)

```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",      // TO BE REMOVED
    "@stripe/stripe-react-native": "^0.57.0", // TO BE REMOVED
    "twilio": "^5.10.6",                  // TO BE REMOVED
    "react-native-vector-icons": "^10.3.0", // ALREADY PRESENT (keep)
    "react-native-haptic-feedback": "^2.3.3" // ALREADY PRESENT (keep)
  }
}
```

### 2.2 Files Using @expo/vector-icons (19 files)

All files import: `import {Feather as Icon} from '@expo/vector-icons';`

| File Path | Line |
|-----------|------|
| `src/screens/auth/FontSizeScreen.tsx` | 15 |
| `src/screens/auth/PhoneEntryScreen.tsx` | 19 |
| `src/screens/auth/VerificationCodeScreen.tsx` | 16 |
| `src/screens/auth/CreatePinScreen.tsx` | 15 |
| `src/screens/auth/ConfirmPinScreen.tsx` | 16 |
| `src/screens/auth/EmailVerificationScreen.tsx` | 19 |
| `src/screens/onboarding/InviteSentScreen.tsx` | 7 |
| `src/screens/onboarding/AddMemberScreen.tsx` | 15 |
| `src/screens/onboarding/ReviewMemberScreen.tsx` | 14 |
| `src/screens/onboarding/TrialWelcomeScreen.tsx` | 9 |
| `src/screens/onboarding/EnterInviteCodeScreen.tsx` | 13 |
| `src/screens/member/MemberSettings.tsx` | 15 |
| `src/screens/member/MemberDashboard.tsx` | 18 |
| `src/screens/member/MemberContacts.tsx` | 13 |
| `src/screens/contact/ContactSettings.tsx` | 14 |
| `src/screens/contact/ContactDashboard.tsx` | 15 |
| `src/screens/settings/NotificationPreferencesScreen.tsx` | 22 |
| `src/screens/CheckInHistoryScreen.tsx` | 13 |
| `src/screens/payment/PaymentMethodScreen.tsx` | Uses Stripe icons |

### 2.3 Files Using expo-haptics (1 file)

| File Path | Lines |
|-----------|-------|
| `src/services/haptics.ts` | 7, 18, 23, 38, 43, 55 |

### 2.4 Files Using Stripe SDK (4+ files)

| File Path | Purpose |
|-----------|---------|
| `App.tsx` | StripeProvider wrapper (lines 12, 88) |
| `src/screens/payment/PaymentMethodScreen.tsx` | CardField, useStripe (line 15) |
| `src/services/api.ts` | paymentsAPI.createSubscription |
| `src/store/slices/paymentSlice.ts` | Stripe subscription state |
| `src/types/database.ts` | stripe_customer_id, stripe_subscription_id |

### 2.5 Files with Twilio/SMS References (10+ files)

| File Path | Lines | Content |
|-----------|-------|---------|
| `src/constants/config.ts` | 34-39 | TWILIO_CONFIG object |
| `src/screens/NotificationSettingsScreen.tsx` | 29, 53, 159, 331-365 | SMS toggle settings |
| `src/screens/HelpScreen.tsx` | 55, 60, 65, 70, 90 | FAQ mentions SMS |
| `src/screens/ContactDetailScreen.tsx` | 79, 277 | "notified via SMS" |
| `src/screens/MemberDetailScreen.tsx` | 121 | "notified via SMS" |
| `src/screens/settings/PaymentSettingsScreen.tsx` | 135 | "SMS alerts" |
| `src/types/database.ts` | 20-22, 113-120 | SMSType, SMSLog types |

### 2.6 Files with Wrong Domain References (3 source files)

| File Path | Line | Current | Should Be |
|-----------|------|---------|-----------|
| `src/services/deepLinkService.ts` | 12 | `https://pruuf.com` | `https://pruuf.me` |
| `src/services/deepLinkService.ts` | 90 | `https://pruuf.com` | `https://pruuf.me` |
| `src/screens/HelpScreen.tsx` | 114 | `support@pruuf.com` | `support@pruuf.me` |

---

## 3. TARGET STATE SPECIFICATION

### 3.1 Target Package.json Dependencies

```json
{
  "dependencies": {
    "react-native-vector-icons": "^10.3.0",
    "react-native-haptic-feedback": "^2.3.3",
    "react-native-purchases": "^8.0.0",
    "@react-native-firebase/app": "^23.5.0",
    "@react-native-firebase/messaging": "^23.5.0",
    "react-native-encrypted-storage": "^4.0.3"
  }
}
```

**REMOVED:**
- `@expo/vector-icons`
- `@stripe/stripe-react-native`
- `twilio`

**ADDED:**
- `react-native-purchases` (RevenueCat SDK)

### 3.2 Target App Architecture

```
App.tsx
├── Provider (Redux)
├── QueryClientProvider (React Query)
├── SafeAreaProvider
└── AppContent (NO Stripe/RevenueCat provider - handled differently)

Payment Flow:
├── RevenueCat SDK initialized in services/revenuecat.ts
├── Purchases happen via native Apple IAP / Google Play
└── Subscription state managed in paymentSlice.ts
```

### 3.3 Target Domain Configuration

- **Universal Links (iOS):** `https://pruuf.me`
- **App Links (Android):** `https://pruuf.me`
- **Support Email:** `support@pruuf.me`
- **API Base URL:** `https://api.pruuf.me`
- **Bundle ID (iOS):** `me.pruuf.app`
- **Application ID (Android):** `me.pruuf.app`

---

## 4. MIGRATION SCOPE OVERVIEW

### 4.1 Total Files to Modify

| Category | File Count | Complexity |
|----------|------------|------------|
| Icon imports | 18 | Low |
| Haptics service | 1 | Low |
| Payment screens | 3 | High |
| Payment services | 2 | High |
| Payment state | 1 | Medium |
| Twilio removal | 6 | Medium |
| Domain corrections | 3 | Low |
| Configuration files | 3 | Low |
| Test files | 5 | Medium |
| **TOTAL** | **42** | - |

### 4.2 Migration Order

```
Phase 1: Icon Migration (Low Risk)
    ↓
Phase 2: Haptics Migration (Low Risk)
    ↓
Phase 3: Payment Migration (High Risk - Requires RevenueCat Account)
    ↓
Phase 4: Twilio/SMS Removal (Medium Risk)
    ↓
Phase 5: Domain Corrections (Low Risk)
    ↓
Phase 6: Package.json Cleanup (Medium Risk)
    ↓
Phase 7: Native Configuration (Medium Risk)
    ↓
Phase 8: Testing & Validation (Critical)
```

---

## 5. PHASE 1: ICON MIGRATION

### 5.1 Overview

**FROM:** `import {Feather as Icon} from '@expo/vector-icons';`
**TO:** `import Icon from 'react-native-vector-icons/Feather';`

### 5.2 Migration Steps

#### Step 1.1: Verify react-native-vector-icons is installed

```bash
# Already in package.json, but verify
npm list react-native-vector-icons
```

#### Step 1.2: Update all 18 screen files

For each file listed in Section 2.2, make this change:

**BEFORE:**
```typescript
import {Feather as Icon} from '@expo/vector-icons';
```

**AFTER:**
```typescript
import Icon from 'react-native-vector-icons/Feather';
```

### 5.3 File-by-File Changes

| File | Line to Change | Search | Replace |
|------|----------------|--------|---------|
| `src/screens/auth/FontSizeScreen.tsx` | 15 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/auth/PhoneEntryScreen.tsx` | 19 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/auth/VerificationCodeScreen.tsx` | 16 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/auth/CreatePinScreen.tsx` | 15 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/auth/ConfirmPinScreen.tsx` | 16 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/auth/EmailVerificationScreen.tsx` | 19 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/onboarding/InviteSentScreen.tsx` | 7 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/onboarding/AddMemberScreen.tsx` | 15 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/onboarding/ReviewMemberScreen.tsx` | 14 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/onboarding/TrialWelcomeScreen.tsx` | 9 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/onboarding/EnterInviteCodeScreen.tsx` | 13 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/member/MemberSettings.tsx` | 15 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/member/MemberDashboard.tsx` | 18 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/member/MemberContacts.tsx` | 13 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/contact/ContactSettings.tsx` | 14 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/contact/ContactDashboard.tsx` | 15 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/settings/NotificationPreferencesScreen.tsx` | 22 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |
| `src/screens/CheckInHistoryScreen.tsx` | 13 | `import {Feather as Icon} from '@expo/vector-icons';` | `import Icon from 'react-native-vector-icons/Feather';` |

### 5.4 Update jest.config.js

**BEFORE:**
```javascript
transformIgnorePatterns: [
  'node_modules/(?!(react-native|@react-native|...|@expo/vector-icons|expo-modules-core|expo-status-bar|expo-splash-screen)/)',
],
```

**AFTER:**
```javascript
transformIgnorePatterns: [
  'node_modules/(?!(react-native|@react-native|@react-navigation|@stripe/stripe-react-native|@supabase|@tanstack|react-redux|@reduxjs|immer|react-native-vector-icons)/)',
],
```

### 5.5 Update jest.setup.js

**REMOVE this mock block:**
```javascript
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  MaterialIcons: 'MaterialIcons',
}));
```

**ADD this mock block:**
```javascript
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
```

### 5.6 Validation

```bash
# After all changes, verify no @expo/vector-icons references remain
grep -r "@expo/vector-icons" src/
# Should return nothing

# Run TypeScript check
npx tsc --noEmit

# Run tests
npm test
```

---

## 6. PHASE 2: HAPTICS MIGRATION

### 6.1 Overview

**FROM:** `expo-haptics`
**TO:** `react-native-haptic-feedback`

### 6.2 Current Implementation (src/services/haptics.ts)

```typescript
import * as Haptics from 'expo-haptics';

export const triggerImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  const impactStyle = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  }[style];
  await Haptics.impactAsync(impactStyle);
};
```

### 6.3 Target Implementation

**REPLACE entire file `src/services/haptics.ts`:**

```typescript
/**
 * Haptics Service
 * Provides haptic feedback using react-native-haptic-feedback
 * Pure React Native CLI implementation
 */

import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import {Platform} from 'react-native';

// Haptic options for consistency
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Trigger haptic feedback for button presses and interactions
 */
export const triggerImpact = (
  style: 'light' | 'medium' | 'heavy' = 'medium',
): void => {
  try {
    const impactType: HapticFeedbackTypes = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
    }[style] as HapticFeedbackTypes;

    ReactNativeHapticFeedback.trigger(impactType, hapticOptions);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic feedback failed:', error);
  }
};

/**
 * Trigger haptic feedback for notifications (success, warning, error)
 */
export const triggerNotification = (
  type: 'success' | 'warning' | 'error' = 'success',
): void => {
  try {
    const notificationType: HapticFeedbackTypes = {
      success: 'notificationSuccess',
      warning: 'notificationWarning',
      error: 'notificationError',
    }[type] as HapticFeedbackTypes;

    ReactNativeHapticFeedback.trigger(notificationType, hapticOptions);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic notification failed:', error);
  }
};

/**
 * Trigger selection feedback (for picker/selection changes)
 */
export const triggerSelection = (): void => {
  try {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic selection failed:', error);
  }
};

/**
 * Check if haptics are supported on the current device
 */
export const isHapticsSupported = (): boolean => {
  // Haptics are supported on iOS and most Android devices
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Convenience function for check-in button haptic
 */
export const triggerCheckInHaptic = (): void => {
  triggerNotification('success');
};

/**
 * Convenience function for error haptic
 */
export const triggerErrorHaptic = (): void => {
  triggerNotification('error');
};

/**
 * Convenience function for button tap haptic
 */
export const triggerButtonHaptic = (): void => {
  triggerImpact('light');
};

export default {
  triggerImpact,
  triggerNotification,
  triggerSelection,
  isHapticsSupported,
  triggerCheckInHaptic,
  triggerErrorHaptic,
  triggerButtonHaptic,
};
```

### 6.4 Key API Differences

| expo-haptics | react-native-haptic-feedback |
|--------------|------------------------------|
| `Haptics.impactAsync(style)` | `trigger('impactMedium', options)` |
| `Haptics.notificationAsync(type)` | `trigger('notificationSuccess', options)` |
| `Haptics.selectionAsync()` | `trigger('selection', options)` |
| Returns Promise | Synchronous (void) |

### 6.5 Update Jest Mock

In `jest.setup.js`, update the mock:

```javascript
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
```

---

## 7. PHASE 3: PAYMENT MIGRATION (STRIPE TO REVENUECAT)

### 7.1 Overview

**FROM:** Stripe SDK with direct card input
**TO:** RevenueCat with Apple IAP / Google Play Billing

### 7.2 Why RevenueCat?

1. **No card input required** - Uses native app store billing
2. **Apple/Google handle payments** - Reduces PCI compliance burden
3. **Cross-platform subscriptions** - One API for iOS and Android
4. **Automatic receipt validation** - No backend webhook complexity
5. **Built-in analytics** - Subscription metrics out of the box

### 7.3 Prerequisites (See Account Setup Checklist)

Before starting this phase, you MUST have:

- [ ] RevenueCat account created
- [ ] RevenueCat project created with App ID `me.pruuf.app`
- [ ] Apple App Store Connect configured with products
- [ ] Google Play Console configured with products
- [ ] RevenueCat API keys obtained

### 7.4 Install RevenueCat SDK

```bash
npm install react-native-purchases

# iOS
cd ios && pod install && cd ..
```

### 7.5 Create RevenueCat Service

**NEW FILE: `src/services/revenuecat.ts`**

```typescript
/**
 * RevenueCat Service
 * Handles subscription purchases via Apple IAP / Google Play
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import {Platform} from 'react-native';

// RevenueCat API Keys (from RevenueCat Dashboard)
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_API_KEY';

// Entitlement identifier (configured in RevenueCat)
export const ENTITLEMENT_ID = 'premium';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'me.pruuf.app.monthly',
  ANNUAL: 'me.pruuf.app.annual',
};

/**
 * Initialize RevenueCat SDK
 * Call this once at app startup
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  const apiKey =
    Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({apiKey, appUserID: userId});
}

/**
 * Set the RevenueCat user ID (call after login)
 */
export async function setRevenueCatUserId(userId: string): Promise<void> {
  await Purchases.logIn(userId);
}

/**
 * Get available subscription packages
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return [];
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo | null> {
  try {
    const {customerInfo} = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      // User cancelled, not an error
      return null;
    }
    throw error;
  }
}

/**
 * Check if user has active subscription
 */
export async function checkSubscriptionStatus(): Promise<{
  isActive: boolean;
  expiresAt: string | null;
  willRenew: boolean;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      return {
        isActive: true,
        expiresAt: entitlement.expirationDate,
        willRenew: entitlement.willRenew,
      };
    }

    return {
      isActive: false,
      expiresAt: null,
      willRenew: false,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      isActive: false,
      expiresAt: null,
      willRenew: false,
    };
  }
}

/**
 * Restore purchases (for users who reinstall)
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return null;
  }
}

/**
 * Listen for subscription changes
 */
export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void,
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    // RevenueCat doesn't have removeListener, but updates stop when app closes
  };
}

export default {
  initializeRevenueCat,
  setRevenueCatUserId,
  getOfferings,
  purchasePackage,
  checkSubscriptionStatus,
  restorePurchases,
  addCustomerInfoListener,
  ENTITLEMENT_ID,
  PRODUCT_IDS,
};
```

### 7.6 Update App.tsx

**BEFORE:**
```typescript
import {StripeProvider} from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = __DEV__
  ? 'pk_test_your_test_key_here'
  : 'pk_live_your_live_key_here';

// In render:
<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
  <SafeAreaProvider>
    <AppContent />
  </SafeAreaProvider>
</StripeProvider>
```

**AFTER:**
```typescript
// Remove StripeProvider import entirely
import {initializeRevenueCat} from './src/services/revenuecat';

// In AppContent useEffect:
useEffect(() => {
  // Initialize RevenueCat
  initializeRevenueCat().then(() => {
    console.log('RevenueCat initialized');
  });

  // ... rest of initialization
}, [dispatch]);

// Remove StripeProvider wrapper:
<SafeAreaProvider>
  <AppContent />
</SafeAreaProvider>
```

### 7.7 Replace PaymentMethodScreen.tsx

**REPLACE entire file `src/screens/payment/PaymentMethodScreen.tsx`:**

```typescript
/**
 * Subscription Screen
 * Allows users to subscribe via Apple IAP / Google Play
 * Uses RevenueCat for subscription management
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {PurchasesPackage} from 'react-native-purchases';
import {RootStackParamList} from '../../types';
import {Button} from '../../components/common';
import {colors, spacing, typography} from '../../theme';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PRODUCT_IDS,
} from '../../services/revenuecat';
import {useAppDispatch} from '../../store';
import {updateSubscriptionStatus} from '../../store/slices/paymentSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPayment'>;

export const PaymentMethodScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    const offerings = await getOfferings();
    setPackages(offerings);

    // Default to monthly
    const monthly = offerings.find(
      p => p.product.identifier === PRODUCT_IDS.MONTHLY,
    );
    if (monthly) {
      setSelectedPackage(monthly);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setPurchasing(true);

    try {
      const customerInfo = await purchasePackage(selectedPackage);

      if (customerInfo) {
        // Update Redux state
        dispatch(updateSubscriptionStatus({
          isActive: true,
          source: 'revenuecat',
        }));

        Alert.alert(
          'Success',
          'Your subscription is now active!',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to complete purchase. Please try again.',
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const customerInfo = await restorePurchases();

    if (customerInfo?.entitlements.active['premium']) {
      dispatch(updateSubscriptionStatus({
        isActive: true,
        source: 'revenuecat',
      }));
      Alert.alert('Success', 'Your subscription has been restored!');
      navigation.goBack();
    } else {
      Alert.alert('No Subscription', 'No active subscription found to restore.');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Monitor unlimited loved ones with daily check-in alerts
          </Text>
        </View>

        {/* Subscription Options */}
        <View style={styles.packagesContainer}>
          {packages.map(pkg => (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.packageCard,
                selectedPackage?.identifier === pkg.identifier &&
                  styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage(pkg)}
              activeOpacity={0.8}>
              <View style={styles.packageHeader}>
                <Text style={styles.packageTitle}>
                  {pkg.product.identifier === PRODUCT_IDS.ANNUAL
                    ? 'Annual'
                    : 'Monthly'}
                </Text>
                {pkg.product.identifier === PRODUCT_IDS.ANNUAL && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save 39%</Text>
                  </View>
                )}
              </View>
              <Text style={styles.packagePrice}>
                {pkg.product.priceString}
                <Text style={styles.packagePeriod}>
                  /{pkg.product.identifier === PRODUCT_IDS.ANNUAL ? 'year' : 'month'}
                </Text>
              </Text>
              {selectedPackage?.identifier === pkg.identifier && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Trial Info */}
        <View style={styles.trialInfo}>
          <Text style={styles.trialTitle}>30-Day Free Trial Included</Text>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>✓</Text>
            <Text style={styles.trialText}>No charge for 30 days</Text>
          </View>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>✓</Text>
            <Text style={styles.trialText}>Cancel anytime before trial ends</Text>
          </View>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>✓</Text>
            <Text style={styles.trialText}>Monitor unlimited family members</Text>
          </View>
        </View>

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
          <Text style={styles.restoreText}>Restore Previous Purchase</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <Button
          title={purchasing ? 'Processing...' : 'Start Free Trial'}
          onPress={handlePurchase}
          disabled={!selectedPackage || purchasing}
          size="large"
        />
        <Text style={styles.legalText}>
          Payment will be charged to your {'\n'}
          Apple ID / Google Play account
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  packagesContainer: {
    marginBottom: spacing.xl,
  },
  packageCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  packageTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
  },
  savingsBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
  },
  packagePrice: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
  },
  packagePeriod: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular as any,
    color: colors.text.secondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  trialInfo: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  trialTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  trialStep: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  trialBullet: {
    fontSize: typography.sizes.md,
    color: colors.success,
    marginRight: spacing.sm,
    width: 20,
  },
  trialText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  restoreButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  restoreText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  legalText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PaymentMethodScreen;
```

### 7.8 Update paymentSlice.ts

**BEFORE:**
```typescript
interface PaymentState {
  paymentMethods: PaymentMethod[];
  subscription: Subscription | null;
  stripeCustomerId: string | null;
  // ...
}
```

**AFTER:**
```typescript
interface PaymentState {
  subscription: {
    isActive: boolean;
    expiresAt: string | null;
    willRenew: boolean;
    source: 'revenuecat' | 'legacy_stripe' | null;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  subscription: {
    isActive: false,
    expiresAt: null,
    willRenew: false,
    source: null,
  },
  isLoading: false,
  error: null,
};

// New thunk for RevenueCat
export const checkSubscription = createAsyncThunk(
  'payment/checkSubscription',
  async () => {
    const {checkSubscriptionStatus} = await import('../services/revenuecat');
    return await checkSubscriptionStatus();
  },
);
```

### 7.9 Update database.ts Types

**REMOVE:**
```typescript
stripe_customer_id: string | null;
stripe_subscription_id: string | null;
```

**ADD:**
```typescript
revenuecat_app_user_id: string | null;
subscription_source: 'revenuecat' | 'legacy_stripe' | null;
```

---

## 8. PHASE 4: TWILIO/SMS COMPLETE REMOVAL

### 8.1 Overview

All SMS/Twilio functionality is being **REMOVED**, not replaced. Notifications will use:
- **Push notifications:** Firebase Cloud Messaging (FCM)
- **Email:** Postmark

### 8.2 Files to Modify

#### 8.2.1 DELETE: TWILIO_CONFIG from config.ts

**FILE:** `src/constants/config.ts`

**REMOVE lines 34-39:**
```typescript
export const TWILIO_CONFIG = {
  // Twilio configuration (used on backend)
  ACCOUNT_SID: 'YOUR_TWILIO_ACCOUNT_SID',
  AUTH_TOKEN: 'YOUR_TWILIO_AUTH_TOKEN',
  PHONE_NUMBER: '+1XXXXXXXXXX',
};
```

#### 8.2.2 UPDATE: NotificationSettingsScreen.tsx

**FILE:** `src/screens/NotificationSettingsScreen.tsx`

**REMOVE:**
- Line 29: `sms_notifications_enabled: boolean;`
- Line 53: `sms_notifications_enabled: true,`
- Line 159: `savePreferences({sms_notifications_enabled: value});`
- Lines 331-365: Entire SMS Notifications section

**The SMS section to REMOVE:**
```tsx
{/* SMS Notifications Section */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>
    SMS Notifications
  </Text>
  // ... entire section ...
</View>
```

#### 8.2.3 UPDATE: HelpScreen.tsx FAQ Content

**FILE:** `src/screens/HelpScreen.tsx`

**CHANGE these FAQ answers to remove SMS references:**

| Question | OLD Answer | NEW Answer |
|----------|------------|------------|
| "How do I invite someone to be a Member?" | "They'll receive an SMS with an invite code" | "They'll receive an email with an invite code" |
| "How do I accept an invitation to be a Member?" | "phone number where you received the invitation... from the SMS" | "email where you received the invitation... from the email" |
| "What happens if a Member misses their check-in?" | "receive an SMS and push notification" | "receive a push notification and email" |
| "Can I change my check-in time?" | "notified of the change via SMS and push notification" | "notified of the change via push notification and email" |
| "Can I remove a Member or Contact?" | "Both parties will be notified via SMS" | "Both parties will be notified via email" |

#### 8.2.4 UPDATE: ContactDetailScreen.tsx

**FILE:** `src/screens/ContactDetailScreen.tsx`

**Line 79 - CHANGE:**
```typescript
// OLD:
'Are you sure you want to remove this contact? Both of you will be notified via SMS.',
// NEW:
'Are you sure you want to remove this contact? Both of you will be notified via email.',
```

**Line 277 - CHANGE:**
```typescript
// OLD:
about your check-ins. Both of you will be notified via SMS.
// NEW:
about your check-ins. Both of you will be notified via email.
```

#### 8.2.5 UPDATE: MemberDetailScreen.tsx

**FILE:** `src/screens/MemberDetailScreen.tsx`

**Line 121 - CHANGE:**
```typescript
// OLD:
message: `Are you sure you want to remove ${memberDetails?.name}? Both of you will be notified via SMS.`,
// NEW:
message: `Are you sure you want to remove ${memberDetails?.name}? Both of you will be notified via email.`,
```

#### 8.2.6 UPDATE: PaymentSettingsScreen.tsx

**FILE:** `src/screens/settings/PaymentSettingsScreen.tsx`

**Line 135 - CHANGE:**
```typescript
// OLD:
SMS alerts when check-ins are missed
// NEW:
Push and email alerts when check-ins are missed
```

#### 8.2.7 UPDATE: database.ts Types

**FILE:** `src/types/database.ts`

**REMOVE lines 20-22:**
```typescript
export type SMSType =
  | 'verification'
  | 'invite'
  // ...
```

**REMOVE lines 113-120:**
```typescript
export interface SMSLog {
  id: string;
  // ...
  twilio_sid: string | null;
}
```

---

## 9. PHASE 5: DOMAIN CORRECTIONS

### 9.1 Files to Update

#### 9.1.1 deepLinkService.ts

**FILE:** `src/services/deepLinkService.ts`

**Line 12 - CHANGE:**
```typescript
// OLD:
const UNIVERSAL_LINK_DOMAIN = 'https://pruuf.com';
// NEW:
const UNIVERSAL_LINK_DOMAIN = 'https://pruuf.me';
```

**Line 90 comment - CHANGE:**
```typescript
// OLD:
// Universal link: https://pruuf.com/invite/ABC123
// NEW:
// Universal link: https://pruuf.me/invite/ABC123
```

#### 9.1.2 HelpScreen.tsx

**FILE:** `src/screens/HelpScreen.tsx`

**Line 114 - CHANGE:**
```typescript
// OLD:
const supportEmail = 'support@pruuf.com';
// NEW:
const supportEmail = 'support@pruuf.me';
```

#### 9.1.3 config.ts API URL

**FILE:** `src/constants/config.ts`

**Verify line 7 is correct:**
```typescript
API_BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.pruuf.me',
```
(If it says pruuf.app, that's fine - keep api.pruuf.me for consistency)

---

## 10. PHASE 6: PACKAGE.JSON CLEANUP

### 10.1 Dependencies to Remove

```bash
npm uninstall @expo/vector-icons @stripe/stripe-react-native twilio
```

### 10.2 Verify Remaining Dependencies

After removal, verify these remain:
```json
{
  "dependencies": {
    "react-native-vector-icons": "^10.3.0",
    "react-native-haptic-feedback": "^2.3.3",
    "react-native-purchases": "^8.0.0",
    "@react-native-firebase/app": "^23.5.0",
    "@react-native-firebase/messaging": "^23.5.0"
  }
}
```

### 10.3 Clean Install

```bash
rm -rf node_modules
rm package-lock.json
npm install

# iOS
cd ios && pod install && cd ..
```

---

## 11. PHASE 7: NATIVE CONFIGURATION UPDATES

### 11.1 iOS Configuration (ios/Pruuf/Info.plist)

#### 11.1.1 Bundle Identifier

Ensure bundle identifier is `me.pruuf.app`:
```xml
<key>CFBundleIdentifier</key>
<string>me.pruuf.app</string>
```

#### 11.1.2 Associated Domains (Universal Links)

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:pruuf.me</string>
  <string>applinks:www.pruuf.me</string>
</array>
```

#### 11.1.3 In-App Purchase Capability

Add to entitlements file or via Xcode:
```xml
<key>com.apple.developer.in-app-payments</key>
<array>
  <string>merchant.me.pruuf.app</string>
</array>
```

### 11.2 Android Configuration

#### 11.2.1 Application ID (android/app/build.gradle)

```gradle
android {
    defaultConfig {
        applicationId "me.pruuf.app"
    }
}
```

#### 11.2.2 App Links (android/app/src/main/AndroidManifest.xml)

Add inside `<activity>`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="pruuf.me" />
</intent-filter>
```

#### 11.2.3 Billing Permission

```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

### 11.3 RevenueCat Configuration Files

#### 11.3.1 iOS (Revenue Cat SDK initialization is in code)

No additional plist changes needed - SDK is initialized in JavaScript.

#### 11.3.2 Android (No additional manifest changes)

The Billing permission above is all that's needed.

---

## 12. PHASE 8: TESTING & VALIDATION

### 12.1 Pre-Deployment Checklist

#### Icon Migration Validation
- [ ] No `@expo/vector-icons` imports in any .tsx file
- [ ] All icons render correctly on iOS
- [ ] All icons render correctly on Android
- [ ] Icons scale properly with font size preference

#### Haptics Validation
- [ ] Check-in button provides haptic feedback
- [ ] Error states trigger error haptic
- [ ] Selection changes trigger selection haptic
- [ ] Works on physical iOS device
- [ ] Works on physical Android device

#### Payment Validation
- [ ] RevenueCat SDK initializes without error
- [ ] Subscription packages load correctly
- [ ] Can complete test purchase in sandbox
- [ ] Subscription status persists across app restart
- [ ] Restore purchases works
- [ ] Members NEVER see payment screen

#### SMS Removal Validation
- [ ] No "SMS" text appears anywhere in app
- [ ] No "Twilio" references in codebase
- [ ] Notification settings only show push/email options
- [ ] Help screen updated with email references

#### Domain Validation
- [ ] Deep links use pruuf.me domain
- [ ] Support email is support@pruuf.me
- [ ] No pruuf.com or pruuf.life references

### 12.2 Test Commands

```bash
# Verify no Expo icon imports
grep -r "@expo/vector-icons" src/
# Expected: No output

# Verify no Stripe imports
grep -r "@stripe/stripe-react-native" src/
# Expected: No output

# Verify no Twilio references
grep -r "twilio\|Twilio" src/
# Expected: No output

# Verify no wrong domains
grep -r "pruuf\.com\|pruuf\.life" src/
# Expected: No output

# TypeScript check
npx tsc --noEmit
# Expected: No errors

# Run tests
npm test
# Expected: All pass
```

### 12.3 Manual Testing Flows

#### Flow 1: Contact Onboarding
1. Fresh install
2. Create account with email
3. Verify email
4. Create PIN
5. Select font size
6. Add first Member
7. **Verify**: No SMS mentioned, email invite sent

#### Flow 2: Member Onboarding
1. Fresh install
2. Create account with email
3. Enter invite code
4. Set check-in time
5. **Verify**: Connected to Contact successfully

#### Flow 3: Daily Check-in
1. Open app as Member
2. Tap "I'm OK" button
3. **Verify**: Haptic feedback felt
4. **Verify**: Contact receives push notification

#### Flow 4: Subscription
1. Open app as Contact after trial
2. Navigate to subscription screen
3. Select monthly plan
4. Complete sandbox purchase
5. **Verify**: Subscription active
6. Force close and reopen
7. **Verify**: Subscription still active

---

## 13. ACCOUNT SETUP CHECKLIST REFERENCE

See separate document: `ACCOUNT_SETUP_CHECKLIST.md`

Required accounts before migration:
1. **RevenueCat** - For subscription management
2. **Apple Developer** - For App Store and IAP
3. **Google Play Console** - For Play Store and billing
4. **Postmark** - For transactional emails
5. **Firebase** - Already configured for FCM

---

## 14. ROLLBACK PLAN

### 14.1 Before Starting Migration

```bash
# Create backup branch
git checkout -b pre-rn-migration-backup
git push origin pre-rn-migration-backup

# Create migration branch
git checkout main
git checkout -b rn-migration
```

### 14.2 If Migration Fails

```bash
# Return to main branch
git checkout main

# Delete failed migration branch
git branch -D rn-migration

# If changes were committed to main accidentally
git reset --hard pre-rn-migration-backup
```

### 14.3 Partial Rollback

To rollback specific files:
```bash
git checkout pre-rn-migration-backup -- src/services/haptics.ts
git checkout pre-rn-migration-backup -- src/screens/payment/PaymentMethodScreen.tsx
```

---

## 15. FILE CHANGE MANIFEST

### 15.1 Files to MODIFY

| File | Changes |
|------|---------|
| `src/screens/auth/FontSizeScreen.tsx` | Icon import |
| `src/screens/auth/PhoneEntryScreen.tsx` | Icon import |
| `src/screens/auth/VerificationCodeScreen.tsx` | Icon import |
| `src/screens/auth/CreatePinScreen.tsx` | Icon import |
| `src/screens/auth/ConfirmPinScreen.tsx` | Icon import |
| `src/screens/auth/EmailVerificationScreen.tsx` | Icon import |
| `src/screens/onboarding/InviteSentScreen.tsx` | Icon import |
| `src/screens/onboarding/AddMemberScreen.tsx` | Icon import |
| `src/screens/onboarding/ReviewMemberScreen.tsx` | Icon import |
| `src/screens/onboarding/TrialWelcomeScreen.tsx` | Icon import |
| `src/screens/onboarding/EnterInviteCodeScreen.tsx` | Icon import |
| `src/screens/member/MemberSettings.tsx` | Icon import |
| `src/screens/member/MemberDashboard.tsx` | Icon import |
| `src/screens/member/MemberContacts.tsx` | Icon import |
| `src/screens/contact/ContactSettings.tsx` | Icon import |
| `src/screens/contact/ContactDashboard.tsx` | Icon import |
| `src/screens/settings/NotificationPreferencesScreen.tsx` | Icon import, remove SMS section |
| `src/screens/CheckInHistoryScreen.tsx` | Icon import |
| `src/screens/HelpScreen.tsx` | Remove SMS references, fix domain |
| `src/screens/ContactDetailScreen.tsx` | Remove SMS references |
| `src/screens/MemberDetailScreen.tsx` | Remove SMS references |
| `src/screens/settings/PaymentSettingsScreen.tsx` | Remove SMS references |
| `src/services/haptics.ts` | Complete rewrite for react-native-haptic-feedback |
| `src/services/deepLinkService.ts` | Fix domain to pruuf.me |
| `src/constants/config.ts` | Remove TWILIO_CONFIG |
| `src/types/database.ts` | Remove SMS types, update subscription types |
| `src/store/slices/paymentSlice.ts` | Update for RevenueCat |
| `App.tsx` | Remove StripeProvider, add RevenueCat init |
| `jest.config.js` | Update transformIgnorePatterns |
| `jest.setup.js` | Update mocks |
| `package.json` | Remove Expo/Stripe/Twilio deps |

### 15.2 Files to CREATE

| File | Purpose |
|------|---------|
| `src/services/revenuecat.ts` | RevenueCat SDK wrapper |

### 15.3 Files to REPLACE

| File | Reason |
|------|--------|
| `src/screens/payment/PaymentMethodScreen.tsx` | Complete rewrite for RevenueCat |

---

## SUMMARY

This migration plan transforms Pruuf from a hybrid Expo/React Native app to a pure React Native CLI application with:

- **19 icon imports** changed from @expo/vector-icons to react-native-vector-icons
- **1 haptics service** rewritten for react-native-haptic-feedback
- **Payment system** completely replaced from Stripe to RevenueCat
- **All SMS/Twilio references** removed (10+ files)
- **Domain corrected** to pruuf.me throughout
- **3 npm packages** removed (@expo/vector-icons, @stripe/stripe-react-native, twilio)
- **1 npm package** added (react-native-purchases)

Total estimated files changed: **35+**

---

**END OF MIGRATION MASTER PLAN**

*Document generated by comprehensive multi-agent audit including Lead Mobile Engineer, Senior Mobile Engineer, Database Engineer, Backend Engineer, Integrations Engineer, DevOps Engineer, Security Engineer, QA Lead, QA Engineer, Product Manager, UX/UI Designer, UX Researcher, Accessibility Specialist, and CEO perspectives.*
