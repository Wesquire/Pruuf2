# EXPO MIGRATION PLAN - PRUUF APPLICATION

## Document Information

| Field | Value |
|-------|-------|
| Created | 2026-01-02 |
| Purpose | Ultra-detailed migration plan for 100% Expo/EAS compatibility |
| Status | PENDING APPROVAL |
| Approval Required | Yes - before any implementation begins |

---

## Executive Summary

This plan details the complete migration of the Pruuf React Native application from a bare CLI workflow to a 100% Expo Managed Workflow with EAS Build compatibility. The migration includes:

1. **Full Expo Compatibility** - Convert to Expo Managed Workflow with SDK 52
2. **Remove Firebase** - Replace FCM with Expo Notifications
3. **Remove Payments** - App becomes 100% free (no RevenueCat, no trials)
4. **Remove Phone/SMS** - Email-only authentication (no Twilio)
5. **Real Testing** - Replace placeholder tests with actual Supabase integration tests
6. **Address All Issues** - Fix all critical and medium issues identified in codebase review

---

## Target Configuration

| Parameter | Value |
|-----------|-------|
| Expo SDK | 52 |
| iOS Minimum | 15.0 |
| Android Minimum SDK | 24 (Android 7.0) |
| Workflow | Expo Managed |
| Build System | EAS Build |
| Notifications | Expo Notifications (Expo Push Service) |
| Authentication | Email + PIN only |
| Payment | None (free app) |

---

## Phase Overview

| Phase | Description | Sections |
|-------|-------------|----------|
| Phase 1 | Remove Payment Features | 12 sections |
| Phase 2 | Remove Phone/SMS Features | 14 sections |
| Phase 3 | Remove Firebase | 10 sections |
| Phase 4 | Initialize Expo Managed Workflow | 8 sections |
| Phase 5 | Replace Native Modules with Expo Equivalents | 10 sections |
| Phase 6 | Implement Expo Notifications | 12 sections |
| Phase 7 | Environment & Configuration | 9 sections |
| Phase 8 | Database Migrations & Cleanup | 11 sections |
| Phase 9 | Update Edge Functions | 13 sections |
| Phase 10 | Testing Infrastructure Overhaul | 14 sections |
| Phase 11 | Final Integration & Verification | 8 sections |
| Phase 12| COMPLETE FILE DELETION LIST | 5 sections |
| Phase 13 | COMPLETE FILE DELETION LIST -  PACKAGE CHANGES SUMMARY | 4 sections |
| Phase 14 | DATABASE MIGRATION SUMMARY | 1 sections |

| **TOTAL** | | **131 sections** |

---

## Process for Each Section

Before starting each section:
1. Read `SECTION_COMPLETION_LOG.md` to review all prior work
2. Read `the_rules.md` to ensure compliance
3. Complete the section work
4. Update `SECTION_COMPLETION_LOG.md` with detailed summary
5. Ask for approval before proceeding

---

# PHASE 1: REMOVE PAYMENT FEATURES

## Phase 1 Objective
Remove all payment-related functionality including RevenueCat, subscriptions, trials, and payment UI. The app will be 100% free with no monetization.

## Phase 1 Dependencies
- None (this is the first phase)

## Phase 1 Files Affected Summary
- **Delete**: 8 files
- **Modify**: 25+ files
- **Database**: 2 migrations

---

### Section 1.1: Remove RevenueCat Package
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove the `react-native-purchases` and `react-native-purchases-ui` packages from the project.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Remove `react-native-purchases` from dependencies |
| `package.json` | Modify | Remove `react-native-purchases-ui` from dependencies |
| `package-lock.json` | Regenerate | Will be regenerated after npm install |

**Specific Changes**:
1. In `package.json`, locate and remove:
   ```
   "react-native-purchases": "^8.2.1"
   "react-native-purchases-ui": "^8.2.1"
   ```
2. Run `npm install` to regenerate lock file and remove from node_modules

**Verification**:
- [ ] `package.json` no longer contains `react-native-purchases`
- [ ] `package.json` no longer contains `react-native-purchases-ui`
- [ ] `node_modules/react-native-purchases` directory does not exist
- [ ] `node_modules/react-native-purchases-ui` directory does not exist
- [ ] `npm ls react-native-purchases` returns empty

**Rollback**: Restore `package.json` from git and run `npm install`

---

### Section 1.2: Remove Payment Slice from Redux Store
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove the `paymentSlice` from the Redux store configuration.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/store/index.ts` | Modify | Remove paymentSlice import and reducer registration |
| `src/store/slices/paymentSlice.ts` | Delete | Remove entire file (462 lines) |

**Specific Changes**:

1. In `src/store/index.ts`:
   - Remove import: `import paymentReducer from './slices/paymentSlice';`
   - Remove from reducer object: `payment: paymentReducer,`

2. Delete file: `src/store/slices/paymentSlice.ts`

**Verification**:
- [ ] `src/store/index.ts` has no reference to `payment` or `paymentSlice`
- [ ] `src/store/slices/paymentSlice.ts` does not exist
- [ ] TypeScript compilation succeeds (will fail until all payment references removed)
- [ ] Redux store initializes without `payment` slice

**Rollback**: Restore files from git

---

### Section 1.3: Remove Payment Slice Tests

**Objective**: Remove test files for the payment slice.
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Files to Delete**:
| File | Lines | Details |
|------|-------|---------|
| `src/store/slices/__tests__/paymentSlice.test.ts` | ~300 | Payment slice unit tests |

**Verification**:
- [ ] `src/store/slices/__tests__/paymentSlice.test.ts` does not exist
- [ ] No test files reference `paymentSlice`

**Rollback**: Restore file from git

---

### Section 1.4: Remove Payment-Related Type Definitions
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove TypeScript types related to payments, subscriptions, and trials.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/types/index.ts` | Modify | Remove payment-related navigation types |
| `src/types/database.ts` | Modify | Remove payment-related database types |

**Specific Changes**:

1. In `src/types/index.ts`:
   - Remove any navigation params for payment screens (e.g., `PaymentScreen`, `SubscriptionScreen`)
   - Remove payment-related type exports

2. In `src/types/database.ts`:
   - Remove types: `Subscription`, `PaymentMethod`, `TrialStatus` (if present)
   - Remove fields from `User` type: `stripe_customer_id`, `stripe_subscription_id`, `trial_start_date`, `trial_end_date`, `account_status` (or modify `account_status` to always be 'active')

**Verification**:
- [ ] No TypeScript errors related to missing payment types
- [ ] `User` type no longer has payment/trial fields
- [ ] Navigation types no longer include payment screens

**Rollback**: Restore files from git

---

### Section 1.5: Remove Payment Screens
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Delete all payment-related screen components.

**Files to Delete**:
| File | Details |
|------|---------|
| `src/screens/payment/` | Entire directory if exists |
| `src/screens/PaymentScreen.tsx` | If exists at this path |
| `src/screens/SubscriptionScreen.tsx` | If exists at this path |
| `src/screens/PaymentMethodScreen.tsx` | If exists |
| Any screen with "Payment", "Subscription", "Upgrade", "Trial" in name | Delete |

**Pre-Deletion Inventory**:
- Search for files: `**/screens/**/*[Pp]ayment*.tsx`
- Search for files: `**/screens/**/*[Ss]ubscription*.tsx`
- Search for files: `**/screens/**/*[Tt]rial*.tsx`
- Search for files: `**/screens/**/*[Uu]pgrade*.tsx`

**Verification**:
- [ ] No screen files with payment/subscription/trial/upgrade in name exist
- [ ] `src/screens/payment/` directory does not exist (if it existed)

**Rollback**: Restore files from git

---

### Section 1.6: Remove Payment Components
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Delete all payment-related UI components.

**Files to Delete**:
| File | Details |
|------|---------|
| `src/components/subscription/` | Entire directory |
| Any component with "Payment", "Subscription", "Trial", "Upgrade" in name | Delete |

**Pre-Deletion Inventory**:
- Search for files: `**/components/**/*[Pp]ayment*.tsx`
- Search for files: `**/components/**/*[Ss]ubscription*.tsx`
- Search for files: `**/components/**/*[Tt]rial*.tsx`
- Search for files: `**/components/**/*[Pp]rice*.tsx`

**Verification**:
- [ ] No component files with payment-related names exist
- [ ] `src/components/subscription/` directory does not exist

**Rollback**: Restore files from git

---

### Section 1.7: Remove Payment Navigation Routes
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove payment-related routes from navigation configuration.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/navigation/RootNavigator.tsx` | Modify | Remove payment screen imports and routes |
| `src/navigation/MainTabNavigator.tsx` | Modify | Remove payment-related tabs or navigation |
| Any other navigation files | Modify | Remove payment references |

**Specific Changes**:

1. In `src/navigation/RootNavigator.tsx`:
   - Remove imports for payment screens
   - Remove `<Stack.Screen>` components for payment routes
   - Remove any conditional navigation based on payment status

2. In `src/navigation/MainTabNavigator.tsx`:
   - Remove payment/subscription tabs
   - Remove upgrade prompts in tab bar

**Verification**:
- [ ] No navigation files import payment screens
- [ ] No `Stack.Screen` or `Tab.Screen` for payment routes
- [ ] App can navigate without payment routes
- [ ] TypeScript compilation succeeds for navigation

**Rollback**: Restore files from git

---

### Section 1.8: Remove Trial Logic from Auth Flow
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove all trial period checking and enforcement from authentication and app initialization.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/store/slices/authSlice.ts` | Modify | Remove trial status checks |
| `src/App.tsx` | Modify | Remove RevenueCat configuration and trial checks |
| `src/screens/auth/*.tsx` | Modify | Remove trial-related UI and logic |
| `src/screens/onboarding/*.tsx` | Modify | Remove trial welcome/setup screens |

**Specific Changes**:

1. In `src/App.tsx`:
   - Remove `import Purchases from 'react-native-purchases'`
   - Remove `Purchases.configure()` call
   - Remove any RevenueCat API key references
   - Remove trial status checking on app launch

2. In `src/store/slices/authSlice.ts`:
   - Remove `trial_start_date`, `trial_end_date` from user state
   - Remove `account_status` checks for 'trial', 'expired', 'grace_period'
   - Simplify user state to always assume 'active' status
   - Remove async thunks related to subscription status

3. In onboarding screens:
   - Remove `TrialWelcomeScreen.tsx` if it exists
   - Remove trial-specific messaging from other onboarding screens

**Verification**:
- [ ] `App.tsx` has no RevenueCat imports or configuration
- [ ] `authSlice.ts` has no trial-related logic
- [ ] No screens display trial countdown or upgrade prompts
- [ ] User can complete onboarding without payment prompts

**Rollback**: Restore files from git

---

### Section 1.9: Remove Payment References from Settings Screens
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove subscription management from settings screens.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/settings/ContactSettings.tsx` | Modify | Remove subscription section |
| `src/screens/settings/MemberSettings.tsx` | Modify | Remove any payment references |
| Any settings screen with payment options | Modify | Remove payment sections |

**Specific Changes**:

1. In settings screens:
   - Remove "Manage Subscription" menu items
   - Remove "Payment Method" menu items
   - Remove trial status display
   - Remove upgrade banners/prompts

**Verification**:
- [ ] Settings screens have no payment-related menu items
- [ ] No "Manage Subscription" or "Upgrade" buttons visible
- [ ] Settings screens render without errors

**Rollback**: Restore files from git

---

### Section 1.10: Remove Payment Integration Tests
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Delete payment-related integration and E2E test files.

**Files to Delete**:
| File | Details |
|------|---------|
| `tests/integration/payment.integration.test.ts` | Payment integration tests |
| `tests/integration/revenuecat-webhooks.test.ts` | RevenueCat webhook tests |
| Any test file with "payment", "subscription", "trial" in name | Delete |

**Pre-Deletion Inventory**:
- Search: `tests/**/*[Pp]ayment*.test.ts`
- Search: `tests/**/*[Ss]ubscription*.test.ts`
- Search: `tests/**/*[Rr]evenue[Cc]at*.test.ts`
- Search: `tests/**/*[Tt]rial*.test.ts`

**Verification**:
- [ ] No test files with payment-related names exist
- [ ] `npm test` runs without missing file errors

**Rollback**: Restore files from git

---

### Section 1.11: Update Jest Setup to Remove Payment Mocks
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove RevenueCat mocks from Jest configuration.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `jest.setup.js` | Modify | Remove `react-native-purchases` mock |
| `jest.setup.js` | Modify | Remove `react-native-purchases-ui` mock |

**Specific Changes**:

1. In `jest.setup.js`:
   - Remove the `jest.mock('react-native-purchases', ...)` block (lines ~141-150)
   - Remove the `jest.mock('react-native-purchases-ui', ...)` block (lines ~152-154)

**Verification**:
- [ ] `jest.setup.js` has no references to `react-native-purchases`
- [ ] Jest initializes without errors about missing mocks
- [ ] Existing tests still pass

**Rollback**: Restore file from git

---

### Section 1.12: Verify Phase 1 Completion

**Objective**: Comprehensive verification that all payment features have been removed.

**Verification Checklist**:

**Package Verification**:
- [ ] `npm ls react-native-purchases` returns empty
- [ ] `npm ls react-native-purchases-ui` returns empty

**Code Verification** (run these grep commands):
- [ ] `grep -r "react-native-purchases" src/` returns no results
- [ ] `grep -r "RevenueCat" src/` returns no results
- [ ] `grep -r "Purchases\." src/` returns no results (the RevenueCat API)
- [ ] `grep -r "subscription" src/` returns no results (case insensitive)
- [ ] `grep -r "trial" src/` returns no results related to payment trials
- [ ] `grep -r "stripe" src/` returns no results
- [ ] `grep -r "payment" src/` returns no results (case insensitive)

**Build Verification**:
- [ ] `npx tsc --noEmit` completes without errors
- [ ] Metro bundler starts without errors
- [ ] App launches in development mode

**Test Verification**:
- [ ] `npm test` runs without payment-related failures

**Files Existence Check**:
- [ ] `src/store/slices/paymentSlice.ts` does NOT exist
- [ ] `src/components/subscription/` does NOT exist
- [ ] `tests/integration/payment.integration.test.ts` does NOT exist

---

# PHASE 2: REMOVE PHONE/SMS FEATURES

## Phase 2 Objective
Remove all phone number and SMS-related functionality. The app will use email-only authentication. ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

## Phase 2 Dependencies
- Phase 1 must be complete (payment removal may have touched some auth files)

## Phase 2 Files Affected Summary
- **Delete**: 6+ files
- **Modify**: 30+ files
- **Database**: 3 migrations

---

### Section 2.1: Remove Twilio Package References
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove any Twilio-related code from the frontend (Twilio is backend-only but may have type references).

**Files to Check/Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Check | Verify no Twilio packages (should be backend only) |
| `src/types/*.ts` | Modify | Remove any SMS-related type definitions |
| `.env` | Modify | Remove `TWILIO_*` environment variables |
| `.env.example` | Modify | Remove `TWILIO_*` environment variables |

**Specific Changes**:

1. In `.env` and `.env.example`:
   - Remove `TWILIO_ACCOUNT_SID`
   - Remove `TWILIO_AUTH_TOKEN`
   - Remove any other `TWILIO_*` variables

**Verification**:
- [ ] No Twilio packages in `package.json`
- [ ] No `TWILIO_*` in `.env` or `.env.example`
- [ ] `grep -r "twilio" src/` returns no results (case insensitive)

**Rollback**: Restore files from git

---

### Section 2.2: Remove Phone Normalization Utility
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Delete the phone number normalization utility that is no longer needed.

**Files to Delete**:
| File | Lines | Details |
|------|-------|---------|
| `src/utils/phone.ts` | ~150 | Phone normalization functions |
| `src/utils/__tests__/phone.test.ts` | ~150 | Phone normalization tests |

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/utils/index.ts` | Modify | Remove phone utility export (if exists) |

**Verification**:
- [ ] `src/utils/phone.ts` does not exist
- [ ] `src/utils/__tests__/phone.test.ts` does not exist
- [ ] No files import from `utils/phone`
- [ ] `grep -r "normalizePhone\|formatPhone" src/` returns no results

**Rollback**: Restore files from git

---

### Section 2.3: Update Auth Screens - Remove Phone Input
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Modify authentication screens to remove phone number input, keeping only email.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/auth/PhoneEntryScreen.tsx` | Delete or Rename | Remove or convert to EmailEntryScreen |
| `src/screens/auth/EmailEntryScreen.tsx` | Keep/Verify | Ensure this is the primary entry point |
| `src/screens/auth/WelcomeScreen.tsx` | Modify | Update to navigate to email entry only |

**Specific Changes**:

1. If `PhoneEntryScreen.tsx` exists:
   - Delete the file entirely
   - Ensure `EmailEntryScreen.tsx` handles all entry

2. In `WelcomeScreen.tsx`:
   - Verify navigation goes to `EmailEntryScreen`
   - Remove any phone-related UI or messaging

3. In `EmailEntryScreen.tsx`:
   - Verify it only handles email input
   - Remove any references to phone as alternative

**Verification**:
- [ ] `PhoneEntryScreen.tsx` does not exist
- [ ] `EmailEntryScreen.tsx` is the only entry method
- [ ] Welcome screen navigates to email entry
- [ ] No "phone" text visible in auth flow UI

**Rollback**: Restore files from git

---

### Section 2.4: Update Verification Screen - Email Only
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Ensure verification code screen is email-only with no SMS references.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/auth/VerificationCodeScreen.tsx` | Modify | Remove SMS-related messaging |

**Specific Changes**:

1. In `VerificationCodeScreen.tsx`:
   - Change any text from "Enter the code sent to your phone" to "Enter the code sent to your email"
   - Remove SMS resend logic (keep email resend)
   - Update accessibility labels to reference email
   - Remove phone number display (show email instead)

**Verification**:
- [ ] No "SMS", "phone", "text message" text in verification screen
- [ ] Screen displays email address user entered
- [ ] Resend button sends email, not SMS
- [ ] Accessibility labels reference email

**Rollback**: Restore file from git

---

### Section 2.5: Update Auth Slice - Remove Phone Fields

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove phone-related state and logic from the auth Redux slice.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/store/slices/authSlice.ts` | Modify | Remove phone from user state and async thunks |

**Specific Changes**:

1. In `authSlice.ts`:
   - Remove `phone` from user state interface
   - Remove `phone` from `sendVerificationCode` thunk parameters
   - Remove any phone normalization calls
   - Ensure all auth thunks use `email` as identifier
   - Remove phone validation logic

**Verification**:
- [ ] User state interface has no `phone` field
- [ ] `sendVerificationCode` thunk uses email only
- [ ] `login` thunk uses email only
- [ ] No phone validation or normalization in slice
- [ ] TypeScript compilation succeeds

**Rollback**: Restore file from git

---

### Section 2.6: Update API Service - Remove Phone Endpoints
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  You  must alsways ask me before you move on to the next section. 

**Objective**: Remove phone-related API calls from the frontend API service.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/api.ts` | Modify | Remove phone-related API methods |

**Specific Changes**:

1. In `src/services/api.ts`:
   - Remove `sendSmsVerificationCode` method (if exists)
   - Remove any methods that pass phone numbers
   - Ensure all auth methods use email
   - Remove phone normalization before API calls

**Verification**:
- [ ] No methods in api.ts accept phone parameters
- [ ] No methods call SMS-related endpoints
- [ ] `grep -r "phone" src/services/api.ts` returns no results
- [ ] All auth API calls use email

**Rollback**: Restore file from git

---

### Section 2.7: Update User Profile Screens - Remove Phone Display
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  You  must alsways ask me before you move on to the next section. 

**Objective**: Remove phone number display and editing from profile/settings screens.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/settings/ProfileScreen.tsx` | Modify | Remove phone display/edit |
| `src/screens/settings/MemberSettings.tsx` | Modify | Remove phone references |
| `src/screens/settings/ContactSettings.tsx` | Modify | Remove phone references |
| Any screen displaying user phone | Modify | Remove phone display |

**Specific Changes**:

1. In profile/settings screens:
   - Remove phone number display fields
   - Remove "Update Phone" functionality
   - Keep email display
   - Update layouts to remove phone sections

**Verification**:
- [ ] No settings screens display phone numbers
- [ ] No "Update Phone" or "Change Phone" buttons
- [ ] Profile shows email as primary identifier
- [ ] Screens render without layout issues

**Rollback**: Restore files from git

---

### Section 2.8: Update Member/Contact Display - Remove Phone

ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.   

**Objective**: Remove phone number display from member and contact cards/lists.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/member/MemberDashboard.tsx` | Modify | Remove phone from contact display |
| `src/screens/contact/ContactDashboard.tsx` | Modify | Remove phone from member display |
| `src/screens/MemberDetailScreen.tsx` | Modify | Remove phone display |
| `src/screens/ContactDetailScreen.tsx` | Modify | Remove phone display |
| `src/components/common/Card.tsx` | Check | Remove phone props if present |

**Specific Changes**:

1. In dashboard and detail screens:
   - Remove phone number display
   - Remove "Call" button that dials phone (replace with email or remove)
   - Remove "Text" button that opens SMS
   - Update layouts to remove phone sections

**Verification**:
- [ ] No phone numbers displayed in member/contact lists
- [ ] No "Call" or "Text" buttons (unless they use email)
- [ ] Cards and lists display email instead
- [ ] All screens render correctly

**Rollback**: Restore files from git

---

### Section 2.9: Remove Phone-Related Tests
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  


**Objective**: Delete tests for phone normalization and SMS functionality.

**Files to Delete**:
| File | Details |
|------|---------|
| `src/utils/__tests__/phone.test.ts` | Already deleted in 2.2, verify |
| `tests/item-14-phone-normalization.test.ts` | Phone normalization tests |
| Any test file with "phone" or "sms" in name | Delete |

**Pre-Deletion Inventory**:
- Search: `tests/**/*[Pp]hone*.test.ts`
- Search: `tests/**/*[Ss]ms*.test.ts`
- Search: `src/**/__tests__/*[Pp]hone*.test.ts`

**Verification**:
- [ ] No test files with phone/sms in name exist
- [ ] `npm test` runs without missing file errors
- [ ] No tests reference phone utilities

**Rollback**: Restore files from git

---

### Section 2.10: Update Database Types - Remove Phone Column
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update TypeScript database types to remove phone field from User type.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/types/database.ts` | Modify | Remove `phone` from User interface |

**Specific Changes**:

1. In `src/types/database.ts`:
   - Remove `phone: string` from User interface
   - Remove any phone-related type aliases
   - Ensure User interface matches new database schema

**Verification**:
- [ ] User interface has no `phone` field
- [ ] TypeScript compilation succeeds
- [ ] No type errors about missing phone property

**Rollback**: Restore file from git

---

### Section 2.11: Update Invitation Flow - Email Only
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Ensure member invitation uses email only, not phone.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/onboarding/AddMemberScreen.tsx` | Modify | Remove phone input from invitation |
| `src/screens/onboarding/ReviewMemberScreen.tsx` | Modify | Remove phone display |
| `src/screens/onboarding/InviteSentScreen.tsx` | Modify | Update messaging to email |

**Specific Changes**:

1. In `AddMemberScreen.tsx`:
   - Remove phone number input field
   - Keep only name and email fields
   - Update validation to require email only

2. In `ReviewMemberScreen.tsx`:
   - Remove phone number from review display
   - Show name and email only

3. In `InviteSentScreen.tsx`:
   - Change "Invitation sent via SMS" to "Invitation sent via email"
   - Update any phone-related messaging

**Verification**:
- [ ] Invitation flow only asks for name and email
- [ ] No phone input fields in invitation screens
- [ ] Confirmation shows email, not phone
- [ ] Messaging references email, not SMS

**Rollback**: Restore files from git

---

### Section 2.12: Update Contact Actions - Remove Call/Text
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove call and text actions that require phone numbers.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/contact/ContactDashboard.tsx` | Modify | Remove call/text buttons |
| `src/screens/MemberDetailScreen.tsx` | Modify | Remove call/text buttons |
| Any screen with phone-based actions | Modify | Remove or convert to email |

**Specific Changes**:

1. Remove or update action buttons:
   - Remove "Call" button (opens phone dialer)
   - Remove "Text" button (opens SMS app)
   - Optionally add "Email" button (opens email client)
   - Remove Linking.openURL('tel:...') calls
   - Remove Linking.openURL('sms:...') calls

**Verification**:
- [ ] No "Call" or "Text" buttons in UI
- [ ] No `tel:` or `sms:` URL schemes used
- [ ] Contact actions use email if any communication button exists
- [ ] `grep -r "tel:" src/` returns no results
- [ ] `grep -r "sms:" src/` returns no results

**Rollback**: Restore files from git

---

### Section 2.13: Update Notification Content - Remove Phone References
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Ensure notification content doesn't reference phone or SMS.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/notificationService.ts` | Modify | Update notification templates |
| `src/services/notifications.ts` | Modify | Update notification content |

**Specific Changes**:

1. In notification services:
   - Change "SMS sent" to "Email sent" where applicable
   - Remove phone number display in notifications
   - Update notification strings to reference email

**Verification**:
- [ ] No notification content references SMS or phone
- [ ] Notification messages reference email appropriately
- [ ] No hardcoded phone-related strings

**Rollback**: Restore files from git

---

### Section 2.14: Verify Phase 2 Completion
ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Comprehensive verification that all phone/SMS features have been removed.

**Verification Checklist**:

**Code Verification** (run these grep commands):
- [ ] `grep -ri "phone" src/` returns no results (excluding "smartphone" in comments if any)
- [ ] `grep -ri "sms" src/` returns no results
- [ ] `grep -ri "twilio" src/` returns no results
- [ ] `grep -ri "tel:" src/` returns no results
- [ ] `grep -r "normalizePhone\|formatPhone" src/` returns no results
- [ ] `grep -r "text message" src/` returns no results (case insensitive)

**File Existence Check**:
- [ ] `src/utils/phone.ts` does NOT exist
- [ ] No `PhoneEntryScreen` exists
- [ ] No phone-related test files exist

**UI Verification**:
- [ ] Auth flow uses email only
- [ ] No phone input fields anywhere
- [ ] No Call/Text action buttons
- [ ] Settings show email, not phone

**Build Verification**:
- [ ] TypeScript compilation succeeds
- [ ] App launches without phone-related errors
- [ ] All auth flows work with email

---

# PHASE 3: REMOVE FIREBASE

## Phase 3 Objective
Remove all Firebase dependencies including Analytics and Cloud Messaging. Notifications will be handled by Expo Notifications in a later phase.

## Phase 3 Dependencies
- Phase 1 must be complete
- Phase 2 must be complete

## Phase 3 Files Affected Summary
- **Delete**: 5+ files
- **Modify**: 15+ files
- **Remove Packages**: 3 packages

---

### Section 3.1: Remove Firebase Packages
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove all `@react-native-firebase/*` packages from the project.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Remove all `@react-native-firebase/*` dependencies |

**Specific Packages to Remove**:
- `@react-native-firebase/app`
- `@react-native-firebase/analytics`
- `@react-native-firebase/messaging`
- Any other `@react-native-firebase/*` packages

**Specific Changes**:
1. In `package.json`, remove all lines containing `@react-native-firebase`
2. Run `npm install` to update lock file

**Verification**:
- [ ] `npm ls @react-native-firebase/app` returns empty
- [ ] `npm ls @react-native-firebase/analytics` returns empty
- [ ] `npm ls @react-native-firebase/messaging` returns empty
- [ ] No `@react-native-firebase` in node_modules

**Rollback**: Restore `package.json` from git and run `npm install`

---

### Section 3.2: Remove Firebase Configuration Files
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Delete Firebase configuration files from iOS and Android directories.

**Files to Delete**:
| File | Details |
|------|---------|
| `ios/Pruuf/GoogleService-Info.plist` | iOS Firebase config |
| `android/app/google-services.json` | Android Firebase config (if exists) |
| `android/app/google-services.json.example` | Example file |

**Note**: These files will be completely removed since we're moving to Expo Managed Workflow where the entire `ios/` and `android/` directories will be deleted.

**Verification**:
- [ ] `ios/Pruuf/GoogleService-Info.plist` does not exist
- [ ] `android/app/google-services.json` does not exist
- [ ] No Firebase config files remain

**Rollback**: Restore files from git (though they will be deleted anyway in Phase 4)

---

### Section 3.3: Remove Firebase Initialization from App
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove Firebase initialization code from the main App component.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/App.tsx` | Modify | Remove Firebase imports and initialization |

**Specific Changes**:

1. In `src/App.tsx`:
   - Remove `import analytics from '@react-native-firebase/analytics'`
   - Remove `import messaging from '@react-native-firebase/messaging'`
   - Remove any Firebase initialization in useEffect
   - Remove analytics tracking calls
   - Remove FCM token registration

**Verification**:
- [ ] `App.tsx` has no `@react-native-firebase` imports
- [ ] No Firebase initialization code in App.tsx
- [ ] App launches without Firebase errors

**Rollback**: Restore file from git

---

### Section 3.4: Remove Firebase from Notification Service
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove Firebase messaging from the notification service. This will be replaced with Expo Notifications in Phase 6.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/notificationService.ts` | Modify | Remove FCM, add placeholder for Expo |
| `src/services/notifications.ts` | Modify | Remove FCM references |

**Specific Changes**:

1. In `src/services/notificationService.ts`:
   - Remove `import messaging from '@react-native-firebase/messaging'`
   - Remove FCM token retrieval
   - Remove FCM permission requests
   - Comment out notification registration (will be replaced in Phase 6)
   - Keep local notification scheduling logic (will be migrated to Expo)

2. In `src/services/notifications.ts`:
   - Remove Firebase messaging imports
   - Remove FCM-specific code
   - Add TODO comments for Expo Notifications migration

**Verification**:
- [ ] No `@react-native-firebase/messaging` imports
- [ ] No FCM token handling
- [ ] File compiles (may have reduced functionality until Phase 6)

**Rollback**: Restore files from git

---

### Section 3.5: Remove Firebase from Notification Slice
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove FCM token registration from the notification Redux slice.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/store/slices/notificationSlice.ts` | Modify | Remove FCM token thunks |

**Specific Changes**:

1. In `notificationSlice.ts`:
   - Remove `registerFCMToken` async thunk (or rename to `registerPushToken`)
   - Remove FCM-specific token handling
   - Keep notification state management
   - Add placeholder for Expo Push Token registration

**Verification**:
- [ ] No FCM-specific code in notification slice
- [ ] Slice compiles and initializes
- [ ] Token registration will be re-implemented in Phase 6

**Rollback**: Restore file from git

---

### Section 3.6: Remove Firebase Analytics Tracking
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove all Firebase Analytics calls throughout the app.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| All files calling `analytics().logEvent()` | Modify | Remove analytics calls |
| All files calling `analytics().setUserProperty()` | Modify | Remove analytics calls |

**Pre-Modification Inventory**:
- Search: `grep -r "analytics()" src/`
- Search: `grep -r "logEvent" src/`
- Search: `grep -r "@react-native-firebase/analytics" src/`

**Specific Changes**:
1. Remove all `analytics().logEvent()` calls
2. Remove all `analytics().setUserProperty()` calls
3. Remove all analytics imports

**Note**: Analytics can be re-added later using Expo's analytics solutions or third-party services if needed.

**Verification**:
- [ ] `grep -r "analytics()" src/` returns no results
- [ ] `grep -r "@react-native-firebase/analytics" src/` returns no results
- [ ] No analytics tracking code remains

**Rollback**: Restore files from git

---

### Section 3.7: Update Jest Setup - Remove Firebase Mocks
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove Firebase mocks from Jest configuration.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `jest.setup.js` | Modify | Remove Firebase analytics mock |
| `jest.setup.js` | Modify | Remove Firebase messaging mock |

**Specific Changes**:

1. In `jest.setup.js`:
   - Remove `jest.mock('@react-native-firebase/analytics', ...)` block
   - Remove `jest.mock('@react-native-firebase/messaging', ...)` block

**Verification**:
- [ ] `jest.setup.js` has no `@react-native-firebase` mocks
- [ ] Jest initializes without Firebase mock errors
- [ ] Tests run without Firebase-related failures

**Rollback**: Restore file from git

---

### Section 3.8: Remove react-native-push-notification Package
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove the `react-native-push-notification` package that depends on native modules.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Remove `react-native-push-notification` |
| `package.json` | Modify | Remove `@react-native-community/push-notification-ios` |

**Specific Changes**:
1. Remove `"react-native-push-notification": "^8.1.1"` from package.json
2. Remove `"@react-native-community/push-notification-ios": "..."` from package.json
3. Run `npm install` to update lock file

**Verification**:
- [ ] `npm ls react-native-push-notification` returns empty
- [ ] `npm ls @react-native-community/push-notification-ios` returns empty
- [ ] Packages removed from node_modules

**Rollback**: Restore `package.json` from git and run `npm install`

---

### Section 3.9: Update Jest Setup - Remove Push Notification Mocks
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove push notification mocks from Jest that are no longer needed.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `jest.setup.js` | Modify | Remove `react-native-push-notification` mock |
| `jest.setup.js` | Modify | Remove `@react-native-community/push-notification-ios` mock |

**Specific Changes**:

1. In `jest.setup.js`:
   - Remove `jest.mock('react-native-push-notification', ...)` block
   - Remove `jest.mock('@react-native-community/push-notification-ios', ...)` block

**Verification**:
- [ ] `jest.setup.js` has no push notification mocks
- [ ] Jest initializes correctly
- [ ] No mock-related errors

**Rollback**: Restore file from git

---

### Section 3.10: Verify Phase 3 Completion
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Comprehensive verification that all Firebase and non-Expo notifications have been removed.

**Verification Checklist**:

**Package Verification**:
- [ ] `npm ls @react-native-firebase/app` returns empty
- [ ] `npm ls @react-native-firebase/analytics` returns empty
- [ ] `npm ls @react-native-firebase/messaging` returns empty
- [ ] `npm ls react-native-push-notification` returns empty

**Code Verification**:
- [ ] `grep -r "@react-native-firebase" src/` returns no results
- [ ] `grep -r "firebase" src/` returns no results (case insensitive)
- [ ] `grep -r "FCM\|fcm" src/` returns no results
- [ ] `grep -r "react-native-push-notification" src/` returns no results
- [ ] `grep -r "GoogleService-Info" .` returns no results
- [ ] `grep -r "google-services.json" .` returns no results

**File Verification**:
- [ ] `ios/Pruuf/GoogleService-Info.plist` does NOT exist
- [ ] `android/app/google-services.json` does NOT exist

**Build Verification**:
- [ ] TypeScript compilation succeeds
- [ ] App launches (notifications will be non-functional until Phase 6)

---

# PHASE 4: INITIALIZE EXPO MANAGED WORKFLOW

## Phase 4 Objective
Convert the project from bare React Native CLI to Expo Managed Workflow with SDK 52.

## Phase 4 Dependencies
- Phase 1 must be complete (no RevenueCat native modules)
- Phase 2 must be complete (no phone/SMS)
- Phase 3 must be complete (no Firebase native modules)

## Phase 4 Critical Notes
- This phase involves significant project restructuring
- The `ios/` and `android/` directories will be removed
- Native configuration moves to `app.config.js`
- All native modules must be Expo-compatible

---

### Section 4.1: Install Expo CLI and Dependencies
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Install Expo CLI globally and add Expo packages to the project.

**Commands to Run**:
```bash
npm install -g expo-cli eas-cli
npx expo install expo
```

**Files Modified**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Add `expo` as dependency |

**Verification**:
- [ ] `expo --version` returns version number
- [ ] `eas --version` returns version number
- [ ] `expo` is in package.json dependencies
- [ ] `npm ls expo` shows installed version

**Rollback**: `npm uninstall expo` and restore package.json

---

### Section 4.2: Create app.config.js
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Create the Expo configuration file that replaces native configuration.

**Files to Create**:
| File | Details |
|------|---------|
| `app.config.js` | Dynamic Expo configuration |

**File Content Structure**:
```javascript
// app.config.js structure (not actual code)
module.exports = {
  expo: {
    name: "Pruuf",
    slug: "pruuf",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: { ... },
    ios: {
      bundleIdentifier: "com.pruuf",
      supportsTablet: false,
      infoPlist: { ... },
      config: { ... }
    },
    android: {
      package: "com.pruuf",
      adaptiveIcon: { ... },
      permissions: [ ... ]
    },
    plugins: [ ... ],
    extra: {
      // Environment variables via eas.json
    }
  }
};
```

**Key Configuration Items**:
- App name, slug, version
- iOS bundle identifier: `com.pruuf`
- Android package: `com.pruuf`
- iOS minimum version: 15.0
- Android minimum SDK: 24
- Required permissions for notifications, biometrics
- Expo plugins for native functionality

**Verification**:
- [ ] `app.config.js` exists and is valid JavaScript
- [ ] `npx expo config` outputs valid configuration
- [ ] All required fields are present

**Rollback**: Delete `app.config.js`

---

### Section 4.3: Create eas.json for Build Configuration
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Create EAS Build configuration for different environments.

**Files to Create**:
| File | Details |
|------|---------|
| `eas.json` | EAS Build and Submit configuration |

**File Content Structure**:
```javascript
// eas.json structure (not actual code)
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "env": { ... }
    },
    "preview": {
      "distribution": "internal",
      "env": { ... }
    },
    "production": {
      "env": { ... }
    }
  },
  "submit": {
    "production": { ... }
  }
}
```

**Verification**:
- [ ] `eas.json` exists and is valid JSON
- [ ] `eas build:configure` succeeds
- [ ] Development, preview, and production profiles defined

**Rollback**: Delete `eas.json`

---

### Section 4.4: Migrate app.json to app.config.js
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Move existing app.json configuration into app.config.js and delete app.json.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `app.json` | Delete | After migrating to app.config.js |
| `app.config.js` | Modify | Add migrated configuration |

**Specific Changes**:
1. Copy relevant fields from `app.json` to `app.config.js`
2. Convert static JSON to dynamic JavaScript configuration
3. Add environment variable handling
4. Delete `app.json`

**Verification**:
- [ ] `app.json` does NOT exist
- [ ] `app.config.js` contains all necessary configuration
- [ ] `npx expo config` outputs correct values

**Rollback**: Restore `app.json` from git

---

### Section 4.5: Update package.json Scripts
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update npm scripts for Expo workflow.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Update scripts section |

**Scripts to Add/Update**:
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "build:dev": "eas build --profile development",
    "build:preview": "eas build --profile preview",
    "build:prod": "eas build --profile production",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android"
  }
}
```

**Scripts to Remove**:
- Any scripts referencing `react-native run-ios`
- Any scripts referencing `react-native run-android`
- Any scripts referencing native build commands

**Verification**:
- [ ] `npm start` runs `expo start`
- [ ] Old react-native scripts removed
- [ ] EAS build scripts present

**Rollback**: Restore `package.json` from git

---

### Section 4.6: Remove Native Directories
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Delete the `ios/` and `android/` directories since they are now managed by Expo.

**Directories to Delete**:
| Directory | Details |
|-----------|---------|
| `ios/` | Entire iOS native directory |
| `android/` | Entire Android native directory |

**Pre-Deletion Backup**:
- Ensure git has committed all changes
- These directories can be regenerated with `npx expo prebuild` if needed

**Verification**:
- [ ] `ios/` directory does NOT exist
- [ ] `android/` directory does NOT exist
- [ ] `npx expo start` works without native directories

**Rollback**: Restore from git or run `npx expo prebuild`

---

### Section 4.7: Update .gitignore for Expo
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update .gitignore with Expo-specific entries.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `.gitignore` | Modify | Add Expo ignores, remove native ignores |

**Entries to Add**:
```
# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# EAS
.eas/

# Native directories (managed by Expo)
ios/
android/
```

**Entries to Review/Remove**:
- Old iOS/Android specific ignores that are no longer relevant

**Verification**:
- [ ] `.gitignore` includes Expo directories
- [ ] `git status` shows expected files

**Rollback**: Restore `.gitignore` from git

---

### Section 4.8: Verify Phase 4 Completion
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Verify Expo Managed Workflow is properly initialized.

**Verification Checklist**:

**File Structure**:
- [ ] `app.config.js` exists
- [ ] `eas.json` exists
- [ ] `app.json` does NOT exist
- [ ] `ios/` directory does NOT exist
- [ ] `android/` directory does NOT exist

**Command Verification**:
- [ ] `npx expo config` outputs valid configuration
- [ ] `npx expo start` launches Metro bundler
- [ ] `npx expo doctor` reports no critical issues (may have warnings for missing modules)

**Package Verification**:
- [ ] `expo` is in package.json dependencies
- [ ] Version is SDK 52 compatible

**Note**: The app will not fully run until Phase 5 (replacing native modules) and Phase 6 (implementing notifications) are complete.

---

# PHASE 5: REPLACE NATIVE MODULES WITH EXPO EQUIVALENTS

## Phase 5 Objective
Replace all bare React Native native modules with their Expo SDK equivalents.

## Phase 5 Dependencies
- Phase 4 must be complete (Expo initialized)

## Phase 5 Module Mapping

| Current Module | Expo Replacement |
|----------------|------------------|
| `react-native-encrypted-storage` | `expo-secure-store` |
| `react-native-biometrics` | `expo-local-authentication` |
| `react-native-haptic-feedback` | `expo-haptics` |
| `react-native-vector-icons` | `@expo/vector-icons` |

---

### Section 5.1: Install Expo Secure Store
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Install `expo-secure-store` to replace `react-native-encrypted-storage`.

**Commands**:
```bash
npx expo install expo-secure-store
```

**Files Modified**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Add `expo-secure-store` |

**Verification**:
- [ ] `expo-secure-store` in package.json
- [ ] `npm ls expo-secure-store` shows installed

**Rollback**: `npm uninstall expo-secure-store`

---

### Section 5.2: Migrate Storage Service to Expo Secure Store
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update the storage service to use `expo-secure-store` instead of `react-native-encrypted-storage`.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/storage.ts` | Modify | Replace import and API calls |

**API Mapping**:
| Old API | New API |
|---------|---------|
| `EncryptedStorage.setItem(key, value)` | `SecureStore.setItemAsync(key, value)` |
| `EncryptedStorage.getItem(key)` | `SecureStore.getItemAsync(key)` |
| `EncryptedStorage.removeItem(key)` | `SecureStore.deleteItemAsync(key)` |
| `EncryptedStorage.clear()` | Loop through keys and delete |

**Specific Changes**:
1. Change import from `react-native-encrypted-storage` to `expo-secure-store`
2. Update all method calls to async Expo equivalents
3. Note: `expo-secure-store` has 2048 byte value limit per key

**Verification**:
- [ ] Import uses `expo-secure-store`
- [ ] All storage methods work correctly
- [ ] No references to `react-native-encrypted-storage`

**Rollback**: Restore file from git

---

### Section 5.3: Remove react-native-encrypted-storage Package
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove the old storage package.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Remove `react-native-encrypted-storage` |

**Verification**:
- [ ] `npm ls react-native-encrypted-storage` returns empty
- [ ] Package removed from node_modules

**Rollback**: Restore package.json and run `npm install`

---

### Section 5.4: Install Expo Local Authentication
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Install `expo-local-authentication` to replace `react-native-biometrics`.

**Commands**:
```bash
npx expo install expo-local-authentication
```

**Files Modified**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Add `expo-local-authentication` |

**Verification**:
- [ ] `expo-local-authentication` in package.json
- [ ] `npm ls expo-local-authentication` shows installed

**Rollback**: `npm uninstall expo-local-authentication`

---

### Section 5.5: Migrate Biometrics Utility to Expo
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update the biometrics utility to use `expo-local-authentication`.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/utils/biometrics.ts` | Modify | Replace with Expo API |
| `src/hooks/useBiometricAuth.ts` | Modify | Update to use new utility |

**API Mapping**:
| Old API (react-native-biometrics) | New API (expo-local-authentication) |
|-----------------------------------|-------------------------------------|
| `ReactNativeBiometrics.isSensorAvailable()` | `LocalAuthentication.hasHardwareAsync()` + `LocalAuthentication.isEnrolledAsync()` |
| `ReactNativeBiometrics.simplePrompt()` | `LocalAuthentication.authenticateAsync()` |
| `biometryType` detection | `LocalAuthentication.supportedAuthenticationTypesAsync()` |

**Specific Changes**:
1. Replace import
2. Update `checkBiometricAvailability` function
3. Update `authenticateWithBiometrics` function
4. Update biometry type detection (Face ID vs Touch ID vs Fingerprint)
5. Update the hook to use new async patterns

**Verification**:
- [ ] Biometric check works on device
- [ ] Authentication prompt appears correctly
- [ ] Correct biometry type detected

**Rollback**: Restore files from git

---

### Section 5.6: Remove react-native-biometrics Package
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove the old biometrics package.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Remove `react-native-biometrics` |

**Verification**:
- [ ] `npm ls react-native-biometrics` returns empty
- [ ] Package removed from node_modules

**Rollback**: Restore package.json and run `npm install`

---

### Section 5.7: Install Expo Haptics
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Install `expo-haptics` to replace `react-native-haptic-feedback`.

**Commands**:
```bash
npx expo install expo-haptics
```

**Files Modified**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Add `expo-haptics` |

**Verification**:
- [ ] `expo-haptics` in package.json
- [ ] `npm ls expo-haptics` shows installed

**Rollback**: `npm uninstall expo-haptics`

---

### Section 5.8: Migrate Haptic Feedback to Expo
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update all haptic feedback calls to use `expo-haptics`.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| All files using haptic feedback | Modify | Replace API calls |

**API Mapping**:
| Old API | New API |
|---------|---------|
| `HapticFeedback.trigger('impactLight')` | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` |
| `HapticFeedback.trigger('impactMedium')` | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` |
| `HapticFeedback.trigger('impactHeavy')` | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)` |
| `HapticFeedback.trigger('selection')` | `Haptics.selectionAsync()` |
| `HapticFeedback.trigger('notificationSuccess')` | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` |
| `HapticFeedback.trigger('notificationWarning')` | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)` |
| `HapticFeedback.trigger('notificationError')` | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` |

**Pre-Modification Inventory**:
- Search: `grep -r "HapticFeedback\|haptic" src/`

**Verification**:
- [ ] All haptic calls use Expo API
- [ ] No references to `react-native-haptic-feedback`
- [ ] Haptics work on physical device

**Rollback**: Restore files from git

---

### Section 5.9: Remove react-native-haptic-feedback Package and Update Icons
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Remove old haptic package and ensure vector icons work with Expo.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Remove `react-native-haptic-feedback` |
| `package.json` | Verify | `@expo/vector-icons` is available via Expo |

**Note**: `@expo/vector-icons` is included with Expo and includes Feather icons (currently used). The existing `react-native-vector-icons/Feather` imports should be updated to `@expo/vector-icons/Feather`.

**Files to Update for Icons**:
- All files importing from `react-native-vector-icons/Feather`
- Change to `import { Feather } from '@expo/vector-icons'`

**Verification**:
- [ ] `npm ls react-native-haptic-feedback` returns empty
- [ ] Icons render correctly with Expo vector icons
- [ ] No references to `react-native-vector-icons`

**Rollback**: Restore files from git

---

### Section 5.10: Update Jest Setup for Expo Modules
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update Jest mocks for Expo modules.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `jest.setup.js` | Modify | Replace native mocks with Expo mocks |
| `jest.config.js` | Modify | Update preset to `jest-expo` |

**Specific Changes**:

1. In `jest.config.js`:
   - Change `preset: 'react-native'` to `preset: 'jest-expo'`

2. In `jest.setup.js`:
   - Remove `react-native-encrypted-storage` mock
   - Remove `react-native-biometrics` mock (if present)
   - Remove `react-native-haptic-feedback` mock
   - Add `expo-secure-store` mock
   - Add `expo-local-authentication` mock
   - Add `expo-haptics` mock

**Verification**:
- [ ] `jest.config.js` uses `jest-expo` preset
- [ ] All Expo modules have appropriate mocks
- [ ] `npm test` runs without mock errors

**Rollback**: Restore files from git

---

### Section 5.11: Verify Phase 5 Completion
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Verify all native modules have been replaced with Expo equivalents.

**Verification Checklist**:

**Package Verification**:
- [ ] `npm ls react-native-encrypted-storage` returns empty
- [ ] `npm ls react-native-biometrics` returns empty
- [ ] `npm ls react-native-haptic-feedback` returns empty
- [ ] `npm ls react-native-vector-icons` returns empty
- [ ] `npm ls expo-secure-store` shows installed
- [ ] `npm ls expo-local-authentication` shows installed
- [ ] `npm ls expo-haptics` shows installed

**Code Verification**:
- [ ] `grep -r "react-native-encrypted-storage" src/` returns no results
- [ ] `grep -r "react-native-biometrics" src/` returns no results
- [ ] `grep -r "react-native-haptic-feedback" src/` returns no results
- [ ] `grep -r "react-native-vector-icons" src/` returns no results

**Functionality Verification**:
- [ ] Secure storage works (save and retrieve data)
- [ ] Biometric authentication works
- [ ] Haptic feedback works
- [ ] Icons display correctly

---

# PHASE 6: IMPLEMENT EXPO NOTIFICATIONS

## Phase 6 Objective
Implement push notifications using Expo Notifications to replace the removed Firebase/FCM system.

## Phase 6 Dependencies
- Phase 3 must be complete (Firebase removed)
- Phase 4 must be complete (Expo initialized)
- Phase 5 must be complete (Expo modules installed)

## Phase 6 Key Concepts
- **Expo Push Token**: Device token for Expo Push Service
- **Expo Push Service**: Expo's push notification infrastructure
- **Backend Integration**: Edge Functions will send to Expo Push API

---

### Section 6.1: Install Expo Notifications
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Install `expo-notifications` and related packages.

**Commands**:
```bash
npx expo install expo-notifications expo-device expo-constants
```

**Files Modified**:
| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | Add notification packages |

**Verification**:
- [ ] `expo-notifications` in package.json
- [ ] `expo-device` in package.json
- [ ] `expo-constants` in package.json

**Rollback**: Uninstall packages

---

### Section 6.2: Configure Notifications in app.config.js
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Add notification configuration to Expo config.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `app.config.js` | Modify | Add notification plugin and config |

**Configuration to Add**:
```javascript
// In app.config.js expo object:
{
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#4CAF50",
        sounds: ["./assets/sounds/notification.wav"]
      }
    ]
  ],
  ios: {
    infoPlist: {
      UIBackgroundModes: ["remote-notification"]
    }
  },
  android: {
    permissions: ["RECEIVE_BOOT_COMPLETED", "VIBRATE"]
  }
}
```

**Verification**:
- [ ] `app.config.js` includes expo-notifications plugin
- [ ] iOS background modes configured
- [ ] Android permissions configured

**Rollback**: Restore file from git

---

### Section 6.3: Create Notification Service with Expo
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Rewrite notification service using Expo Notifications API.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/notificationService.ts` | Rewrite | Use Expo Notifications |
| `src/services/notifications.ts` | Rewrite | Use Expo Notifications |

**Key Functions to Implement**:

1. **registerForPushNotificationsAsync()**
   - Check if physical device
   - Request permissions
   - Get Expo Push Token
   - Return token for backend registration

2. **setupNotificationListeners()**
   - Handle notification received while app in foreground
   - Handle notification response (user tapped notification)
   - Handle notification received while app in background

3. **scheduleLocalNotification()**
   - Schedule check-in reminders
   - Schedule other local notifications

4. **cancelAllScheduledNotifications()**
   - Clear all pending notifications

**Verification**:
- [ ] Service exports all required functions
- [ ] TypeScript compilation succeeds
- [ ] No Firebase references

**Rollback**: Restore files from git

---

### Section 6.4: Update Notification Slice for Expo
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Update Redux slice to work with Expo Push Tokens.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/store/slices/notificationSlice.ts` | Modify | Use Expo Push Token |

**Specific Changes**:
1. Rename `registerFCMToken` to `registerPushToken`
2. Update token type from FCM token to Expo Push Token format
3. Update API call to send Expo Push Token to backend
4. Ensure notification state management remains intact

**Verification**:
- [ ] Slice uses Expo Push Token terminology
- [ ] Token registration thunk works
- [ ] No FCM references

**Rollback**: Restore file from git

---

### Section 6.5: Update API Service for Expo Push Token

**Objective**: Update API service to register Expo Push Token with backend.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/api.ts` | Modify | Update token registration endpoint |

**Specific Changes**:
1. Update `registerPushToken` method to send Expo Push Token format
2. Token format: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
3. Include platform (ios/android) with registration

**Verification**:
- [ ] API method sends correct token format
- [ ] Backend receives and stores token

**Rollback**: Restore file from git

---

### Section 6.6: Implement Foreground Notification Handler
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Handle notifications when app is in foreground.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/App.tsx` | Modify | Add notification listeners |

**Specific Changes**:
1. Set up notification handler in App.tsx useEffect
2. Configure how notifications appear when app is open
3. Set notification channel for Android

**Code Pattern**:
```javascript
// Pattern for App.tsx (not actual implementation)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

**Verification**:
- [ ] Notifications show when app is in foreground
- [ ] Sound plays for notifications
- [ ] Badge updates correctly

**Rollback**: Restore file from git

---

### Section 6.7: Implement Notification Response Handler
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Handle user tapping on notifications.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/App.tsx` | Modify | Add response listener |
| `src/navigation/RootNavigator.tsx` | Modify | Handle deep links from notifications |

**Specific Changes**:
1. Add `addNotificationResponseReceivedListener`
2. Parse notification data to determine navigation
3. Navigate to appropriate screen based on notification type

**Notification Types and Navigation**:
| Notification Type | Navigate To |
|-------------------|-------------|
| MISSED_CHECK_IN | MemberDetailScreen |
| CHECK_IN_REMINDER | MemberDashboard |
| LATE_CHECK_IN | MemberDetailScreen |
| INVITATION | EnterInviteCodeScreen |

**Verification**:
- [ ] Tapping notification opens correct screen
- [ ] Navigation works from background state
- [ ] Navigation works from quit state

**Rollback**: Restore files from git

---

### Section 6.8: Implement Local Notification Scheduling
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Implement local notifications for check-in reminders.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/notificationService.ts` | Modify | Add scheduling functions |

**Functions to Implement**:

1. **scheduleCheckInReminder(checkInTime, reminderMinutesBefore)**
   - Calculate trigger time
   - Schedule repeating daily notification
   - Store scheduled notification ID

2. **cancelCheckInReminder()**
   - Cancel existing reminder
   - Clear stored notification ID

3. **updateCheckInReminder(newTime, reminderMinutesBefore)**
   - Cancel old reminder
   - Schedule new reminder

**Verification**:
- [ ] Reminders schedule correctly
- [ ] Reminders fire at correct time
- [ ] Reminders can be cancelled
- [ ] Reminders persist across app restarts

**Rollback**: Restore file from git

---

### Section 6.9: Update Settings Screen for Notifications
ensure that you are updating and reading the log fil,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. You  must alsways ask me before you move on to the next section.  

**Objective**: Ensure notification settings work with Expo Notifications.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/settings/NotificationSettingsScreen.tsx` | Modify | Use Expo APIs |

**Specific Changes**:
1. Check notification permission status with Expo
2. Request permissions using Expo API
3. Link to system settings if permission denied
4. Update reminder scheduling to use new service

**Verification**:
- [ ] Permission status displays correctly
- [ ] Permission request works
- [ ] Reminder toggle works
- [ ] Reminder time picker works

**Rollback**: Restore file from git

---

### Section 6.10: Add Expo Notification Mocks for Testing

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Add Jest mocks for Expo Notifications.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `jest.setup.js` | Modify | Add expo-notifications mock |

**Mock to Add**:
```javascript
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[mock]' })),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
}));
```

**Verification**:
- [ ] Tests run without notification errors
- [ ] Mock functions callable in tests

**Rollback**: Restore file from git

---

### Section 6.11: Test Notification Flow End-to-End

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Verify the complete notification flow works.

**Manual Test Cases**:

1. **Permission Request**
   - [ ] Fresh install prompts for permission
   - [ ] Permission grant enables notifications
   - [ ] Permission deny shows appropriate UI

2. **Push Token Registration**
   - [ ] Token obtained after permission grant
   - [ ] Token sent to backend successfully
   - [ ] Token stored in database

3. **Local Notifications**
   - [ ] Check-in reminder schedules correctly
   - [ ] Reminder fires at scheduled time
   - [ ] Reminder can be cancelled
   - [ ] Reminder settings persist

4. **Push Notifications** (requires backend update in Phase 9)
   - [ ] Push received when app in foreground
   - [ ] Push received when app in background
   - [ ] Push received when app killed
   - [ ] Tapping push navigates correctly

**Verification**:
- [ ] All manual test cases pass
- [ ] No notification-related crashes

---

### Section 6.12: Verify Phase 6 Completion

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Comprehensive verification of Expo Notifications implementation.

**Verification Checklist**:

**Package Verification**:
- [ ] `npm ls expo-notifications` shows installed
- [ ] `npm ls expo-device` shows installed
- [ ] `npm ls expo-constants` shows installed

**Code Verification**:
- [ ] `grep -r "expo-notifications" src/` shows usage
- [ ] `grep -r "@react-native-firebase/messaging" src/` returns no results
- [ ] `grep -r "react-native-push-notification" src/` returns no results
- [ ] `grep -r "FCM\|fcm" src/` returns no results

**Configuration Verification**:
- [ ] `app.config.js` includes expo-notifications plugin
- [ ] Notification permissions configured

**Functionality Verification**:
- [ ] Push token obtained successfully
- [ ] Local notifications work
- [ ] Notification listeners set up
- [ ] Settings screen works

---

# PHASE 7: ENVIRONMENT & CONFIGURATION

## Phase 7 Objective
Properly configure environment variables, remove hardcoded placeholders, and set up secure configuration for all environments.

## Phase 7 Dependencies
- Phase 4 must be complete (app.config.js exists)
- Phase 6 must be complete (notifications configured)

---

### Section 7.1: Audit All Placeholder Values

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Identify all hardcoded placeholder values in the codebase.

**Files to Audit**:
| File | Known Placeholders |
|------|-------------------|
| `src/constants/config.ts` | `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY` |
| `src/services/supabase.ts` | Supabase URL/key |
| `.env` | Various placeholders |
| `.env.example` | Template values |

**Action**: Create comprehensive list of all placeholders that need real values.

**Verification**:
- [ ] Complete list of placeholders documented
- [ ] Each placeholder has identified source for real value

**Rollback**: N/A (audit only)

---

### Section 7.2: Create Environment Variable Structure

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Define the proper environment variable structure for Expo.

**Files to Create/Modify**:
| File | Action | Details |
|------|--------|---------|
| `.env.development` | Create | Development environment variables |
| `.env.production` | Create | Production environment variables |
| `.env.example` | Update | Document all required variables |

**Environment Variables Needed**:
```
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Expo
EXPO_PUBLIC_EXPO_PROJECT_ID=

# Feature Flags (if any)
EXPO_PUBLIC_ENABLE_DEV_TOOLS=
```

**Note**: `EXPO_PUBLIC_` prefix makes variables available in the app via `process.env`.

**Verification**:
- [ ] All env files created
- [ ] All required variables defined
- [ ] No secrets in EXPO_PUBLIC_ variables

**Rollback**: Delete created files

---

### Section 7.3: Update app.config.js for Environment Variables

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Configure app.config.js to read environment variables.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `app.config.js` | Modify | Add environment variable handling |

**Specific Changes**:
```javascript
// Pattern for app.config.js
module.exports = {
  expo: {
    // ... other config
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID
      }
    }
  }
};
```

**Verification**:
- [ ] `npx expo config` shows extra values populated
- [ ] Environment variables accessible in config

**Rollback**: Restore file from git

---

### Section 7.4: Update Supabase Client Configuration

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update Supabase client to use proper environment variables.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/services/supabase.ts` | Modify | Use expo-constants for config |
| `src/constants/config.ts` | Modify | Use expo-constants for config |

**Specific Changes**:
1. Import `Constants` from `expo-constants`
2. Access config via `Constants.expoConfig?.extra`
3. Remove hardcoded placeholder values
4. Add runtime validation for required values

**Code Pattern**:
```javascript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}
```

**Verification**:
- [ ] No hardcoded URLs or keys in source
- [ ] App reads config from Constants
- [ ] Missing config throws clear error

**Rollback**: Restore files from git

---

### Section 7.5: Configure EAS Secrets for Production

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Document how to set up EAS Secrets for production builds.

**Actions**:
1. Document required secrets for EAS
2. Document commands to set secrets
3. Create secrets checklist

**Required EAS Secrets**:
```bash
eas secret:create --name SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --name SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --name POSTMARK_SERVER_TOKEN --value "xxx" # Backend only
```

**Note**: This section documents the process; actual secrets are set via EAS CLI.

**Verification**:
- [ ] Documentation complete
- [ ] All required secrets listed

**Rollback**: N/A (documentation only)

---

### Section 7.6: Update eas.json with Environment Profiles

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Configure eas.json to use different environments for different build profiles.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `eas.json` | Modify | Add environment configuration per profile |

**Configuration**:
```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://dev.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "dev-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "@supabase_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
      }
    }
  }
}
```

**Note**: `@secret_name` syntax references EAS Secrets.

**Verification**:
- [ ] eas.json has env for each profile
- [ ] Production uses EAS Secrets references

**Rollback**: Restore file from git

---

### Section 7.7: Remove All Remaining Placeholder Values

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Final sweep to remove any remaining placeholder values.

**Search Commands**:
```bash
grep -r "YOUR_" src/
grep -r "xxx" src/
grep -r "placeholder" src/
grep -r "REPLACE_" src/
grep -r "TODO.*key\|TODO.*token\|TODO.*secret" src/
```

**Action**: Replace all found placeholders with proper environment variable references.

**Verification**:
- [ ] All searches return no results
- [ ] No placeholder values in source code

**Rollback**: Restore files from git

---

### Section 7.8: Update .gitignore for Environment Files

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Ensure sensitive environment files are not committed.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `.gitignore` | Modify | Add env file ignores |

**Entries to Add**:
```
# Environment files
.env
.env.local
.env.development.local
.env.production.local

# Keep example
!.env.example
```

**Verification**:
- [ ] `.env` files (except .example) are ignored
- [ ] `git status` doesn't show env files

**Rollback**: Restore file from git

---

### Section 7.9: Verify Phase 7 Completion

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Verify all configuration is properly set up.

**Verification Checklist**:

**File Verification**:
- [ ] `.env.example` documents all variables
- [ ] `.env.development` exists with dev values
- [ ] `app.config.js` reads environment variables
- [ ] `eas.json` has environment configuration

**Code Verification**:
- [ ] `grep -r "YOUR_\|xxx\|placeholder\|REPLACE_" src/` returns no results
- [ ] All config accessed via expo-constants
- [ ] No hardcoded URLs or keys

**Build Verification**:
- [ ] `npx expo config` shows correct values
- [ ] App runs with development configuration

---

# PHASE 8: DATABASE MIGRATIONS & CLEANUP

## Phase 8 Objective
Create and run database migrations to remove unused columns/tables and clean up the schema to match the new application state.

## Phase 8 Dependencies
- Phase 1 complete (payments removed - need DB cleanup)
- Phase 2 complete (phone/SMS removed - need DB cleanup)

## Phase 8 Critical Notes
- All migrations must be reversible
- Test migrations on development database first
- Create backup before production migration

---

### Section 8.1: Create Migration - Remove Phone Column from Users

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create SQL migration to remove phone-related columns from users table.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/029_remove_phone_column.sql` | Remove phone from users |

**Migration Content**:
```sql
-- Migration: Remove phone column from users table
-- Reason: App now uses email-only authentication

-- Remove phone column
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- Remove phone-related indexes if any
DROP INDEX IF EXISTS idx_users_phone;

-- Update any RLS policies that reference phone
-- (audit and update as needed)
```

**Verification**:
- [ ] Migration file created
- [ ] SQL syntax is valid
- [ ] Migration is reversible (document rollback)

**Rollback SQL**:
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

---

### Section 8.2: Create Migration - Remove SMS Logs Table

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create SQL migration to drop the sms_logs table.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/030_remove_sms_logs.sql` | Drop sms_logs table |

**Migration Content**:
```sql
-- Migration: Remove sms_logs table
-- Reason: App no longer uses SMS

-- Drop table
DROP TABLE IF EXISTS sms_logs;
```

**Verification**:
- [ ] Migration file created
- [ ] SQL syntax is valid

**Rollback**: Would need to recreate table structure from migration 001.

---

### Section 8.3: Create Migration - Remove Payment Columns from Users

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove Stripe/RevenueCat related columns from users table.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/031_remove_payment_columns.sql` | Remove payment fields |

**Migration Content**:
```sql
-- Migration: Remove payment-related columns from users table
-- Reason: App is now free, no payment processing

-- Remove Stripe columns
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;

-- Remove trial columns
ALTER TABLE users DROP COLUMN IF EXISTS trial_start_date;
ALTER TABLE users DROP COLUMN IF EXISTS trial_end_date;

-- Modify account_status to remove payment-related statuses
-- Set all users to 'active' status
UPDATE users SET account_status = 'active' WHERE account_status IN ('trial', 'expired', 'grace_period', 'suspended');

-- Consider removing account_status column entirely if only 'active' remains
-- Or modify the CHECK constraint
```

**Verification**:
- [ ] Migration file created
- [ ] All payment columns identified and removed
- [ ] Existing users updated to 'active' status

**Rollback**: Would need to recreate columns.

---

### Section 8.4: Create Migration - Remove Webhook Events Log Table

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove the RevenueCat webhook events table.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/032_remove_webhook_events.sql` | Drop webhook table |

**Migration Content**:
```sql
-- Migration: Remove webhook_events_log table
-- Reason: No longer using RevenueCat webhooks

DROP TABLE IF EXISTS webhook_events_log;

-- Remove related function
DROP FUNCTION IF EXISTS is_duplicate_webhook_event;
```

**Verification**:
- [ ] Migration file created
- [ ] Table and related functions removed

**Rollback**: Recreate from migration 022.

---

### Section 8.5: Create Migration - Update Push Token Table for Expo

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update push_notification_tokens table for Expo Push Token format.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/033_update_push_tokens_for_expo.sql` | Update token format |

**Migration Content**:
```sql
-- Migration: Update push_notification_tokens for Expo Push Tokens
-- Reason: Migrating from FCM to Expo Push Service

-- Update column comment to reflect new token format
COMMENT ON COLUMN push_notification_tokens.token IS 'Expo Push Token in format ExponentPushToken[xxx]';

-- Clear existing FCM tokens (they won't work with Expo)
-- Users will re-register on next app launch
DELETE FROM push_notification_tokens;

-- Optional: Add validation for Expo token format
ALTER TABLE push_notification_tokens
ADD CONSTRAINT check_expo_token_format
CHECK (token ~ '^ExponentPushToken\[.+\]$');
```

**Verification**:
- [ ] Migration file created
- [ ] Token format constraint added
- [ ] Old tokens cleared

**Rollback**: Remove constraint, tokens need re-registration anyway.

---

### Section 8.6: Create Migration - Remove Payment-Related Functions

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove database functions related to payments.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/034_remove_payment_functions.sql` | Drop payment functions |

**Migration Content**:
```sql
-- Migration: Remove payment-related database functions
-- Reason: App is now free

-- Remove requires_payment function
DROP FUNCTION IF EXISTS requires_payment(uuid);

-- Remove any subscription-related functions
DROP FUNCTION IF EXISTS check_subscription_status(uuid);
DROP FUNCTION IF EXISTS update_subscription_status(uuid, text);

-- Remove trial-related functions
DROP FUNCTION IF EXISTS is_trial_expired(uuid);
DROP FUNCTION IF EXISTS get_trial_days_remaining(uuid);
```

**Verification**:
- [ ] All payment functions identified
- [ ] Functions removed
- [ ] No errors from dependent objects

**Rollback**: Recreate functions from original migrations.

---

### Section 8.7: Update RLS Policies - Remove Payment/Phone References

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update RLS policies that reference removed columns.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/migrations/035_update_rls_policies.sql` | Update RLS |

**Actions**:
1. Audit all RLS policies for references to:
   - `phone` column
   - `stripe_*` columns
   - `trial_*` columns
   - `account_status` payment values

2. Update or recreate policies as needed

**Verification**:
- [ ] All RLS policies audited
- [ ] No policies reference removed columns
- [ ] Policies still enforce correct access control

**Rollback**: Restore original policies from earlier migrations.

---

### Section 8.8: Test Migrations on Development Database

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Run all new migrations on development Supabase instance.

**Commands**:
```bash
supabase db reset  # Reset local database
supabase db push   # Apply migrations to remote dev
```

**Verification**:
- [ ] All migrations run without error
- [ ] Database schema matches expected state
- [ ] Application connects successfully
- [ ] Basic operations work (create user, check-in, etc.)

**Rollback**: `supabase db reset` on development

---

### Section 8.9: Create Database Schema Documentation

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Document the new database schema after cleanup.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/SCHEMA.md` | Database schema documentation |

**Content**:
- List of all tables
- Column definitions for each table
- Relationships between tables
- RLS policies summary
- Removed tables/columns noted

**Verification**:
- [ ] Documentation created
- [ ] Matches actual schema
- [ ] Removed items documented

**Rollback**: N/A (documentation only)

---

### Section 8.10: Create QA Test Data Script

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create script to generate test data for QA testing.

**File to Create**:
| File | Details |
|------|---------|
| `supabase/seed/qa_test_data.sql` | Test data generation |

**Content**:
```sql
-- Create test users
INSERT INTO users (email, pin_hash, account_status) VALUES
  ('test+member1@pruuf.me', '$2b$10$...', 'active'),
  ('test+contact1@pruuf.me', '$2b$10$...', 'active');

-- Create test members
-- Create test relationships
-- Create test check-ins
```

**Verification**:
- [ ] Script creates valid test data
- [ ] Test data covers all scenarios
- [ ] Script is idempotent (can run multiple times)

**Rollback**: Delete test data by email pattern

---

### Section 8.11: Verify Phase 8 Completion

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Verify all database migrations and cleanup complete.

**Verification Checklist**:

**Migration Files**:
- [ ] `029_remove_phone_column.sql` exists
- [ ] `030_remove_sms_logs.sql` exists
- [ ] `031_remove_payment_columns.sql` exists
- [ ] `032_remove_webhook_events.sql` exists
- [ ] `033_update_push_tokens_for_expo.sql` exists
- [ ] `034_remove_payment_functions.sql` exists
- [ ] `035_update_rls_policies.sql` exists

**Schema Verification** (after migrations):
- [ ] `users` table has no `phone` column
- [ ] `users` table has no `stripe_*` columns
- [ ] `users` table has no `trial_*` columns
- [ ] `sms_logs` table does not exist
- [ ] `webhook_events_log` table does not exist
- [ ] Push token table has Expo format constraint

**Application Verification**:
- [ ] App connects to updated database
- [ ] User registration works
- [ ] Check-in works
- [ ] Notifications register (with Expo tokens)

---

# PHASE 9: UPDATE EDGE FUNCTIONS

## Phase 9 Objective
Update Supabase Edge Functions to:
- Remove phone/SMS functionality
- Remove payment functionality
- Update push notifications for Expo Push Service
- Remove unused functions

## Phase 9 Dependencies
- Phase 8 must be complete (database schema updated)

---

### Section 9.1: Inventory Edge Functions

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create complete inventory of all Edge Functions and their status.

**Functions to Review**:

| Function | Category | Action |
|----------|----------|--------|
| `auth/send-verification-code` | Auth | Modify (email only) |
| `auth/verify-code` | Auth | Keep |
| `auth/create-account` | Auth | Modify (remove phone) |
| `auth/login` | Auth | Modify (email only) |
| `auth/logout` | Auth | Keep |
| `auth/reset-pin` | Auth | Modify (email only) |
| `auth/delete-account` | Auth | Keep |
| `auth/email-verification` | Auth | Keep |
| `members/check-in` | Members | Keep |
| `members/invite` | Members | Modify (email only) |
| `members/accept-invite` | Members | Keep |
| `members/get-contacts` | Members | Keep |
| `members/update-check-in-time` | Members | Keep |
| `contacts/get-members` | Contacts | Keep |
| `contacts/get-member-checkins` | Contacts | Keep |
| `contacts/remove-relationship` | Contacts | Keep |
| `payments/get-subscription` | Payments | **DELETE** |
| `webhooks/revenuecat` | Payments | **DELETE** |
| `cron/check-missed-checkins` | Cron | Modify (Expo push) |
| `cron/trial-expirations` | Cron | **DELETE** |
| `cron/grace-period-expirations` | Cron | **DELETE** |
| `cron/send-reminders` | Cron | Modify (Expo push) |
| `cron/cleanup-rate-limits` | Cron | Keep |
| `notifications/register-token` | Notifications | Modify (Expo token) |

**Verification**:
- [ ] Complete inventory created
- [ ] Each function has clear action defined

**Rollback**: N/A (inventory only)

---

### Section 9.2: Delete Payment Edge Functions

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove payment-related Edge Functions.

**Directories to Delete**:
| Directory | Details |
|-----------|---------|
| `supabase/functions/payments/` | Entire directory |
| `supabase/functions/webhooks/revenuecat/` | RevenueCat webhook |

**Verification**:
- [ ] `supabase/functions/payments/` does not exist
- [ ] `supabase/functions/webhooks/revenuecat/` does not exist
- [ ] No references to these functions in other code

**Rollback**: Restore from git

---

### Section 9.3: Delete Trial/Payment Cron Functions

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove trial and payment expiration cron jobs.

**Directories to Delete**:
| Directory | Details |
|-----------|---------|
| `supabase/functions/cron/trial-expirations/` | Trial expiration cron |
| `supabase/functions/cron/grace-period-expirations/` | Grace period cron |

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/config.toml` | Modify | Remove cron schedules for deleted functions |

**Verification**:
- [ ] Cron function directories deleted
- [ ] Cron schedules removed from config.toml
- [ ] Remaining cron functions still scheduled

**Rollback**: Restore from git

---

### Section 9.4: Update Shared Module - Remove Phone Utilities

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update shared modules to remove phone-related functionality.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/_shared/validators.ts` | Modify | Remove phone validation |
| `supabase/functions/_shared/sanitizer.ts` | Modify | Remove sanitizePhone |
| `supabase/functions/_shared/inputValidation.ts` | Modify | Remove phone field type |

**Specific Changes**:
1. Remove `validatePhone()` function
2. Remove `sanitizePhone()` function
3. Remove `phone` from input validation schemas
4. Remove phone normalization utilities

**Verification**:
- [ ] No phone-related functions in shared modules
- [ ] `grep -r "phone" supabase/functions/_shared/` returns minimal results
- [ ] Modules compile without errors

**Rollback**: Restore from git

---

### Section 9.5: Update Shared Module - Remove Payment Utilities

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove payment-related shared utilities.

**Files to Delete**:
| File | Details |
|------|---------|
| `supabase/functions/_shared/revenuecat.ts` | RevenueCat API wrapper |
| `supabase/functions/_shared/revenuecatWebhookVerifier.ts` | Webhook verification |

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/_shared/db.ts` | Modify | Remove payment-related DB functions |

**Verification**:
- [ ] RevenueCat files deleted
- [ ] No payment functions in db.ts
- [ ] `grep -r "revenuecat\|stripe\|payment\|subscription" supabase/functions/_shared/` returns no results

**Rollback**: Restore from git

---

### Section 9.6: Update Push Notification Module for Expo

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update the push notification module to use Expo Push API.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/_shared/push.ts` | Rewrite | Use Expo Push API |

**Key Changes**:

1. **Remove FCM Integration**:
   - Remove Firebase Admin SDK references
   - Remove FCM token handling

2. **Add Expo Push API**:
   - Endpoint: `https://exp.host/--/api/v2/push/send`
   - Token format: `ExponentPushToken[xxx]`
   - Batch up to 100 notifications per request

3. **Expo Push API Format**:
```javascript
// Expo push message format
{
  to: "ExponentPushToken[xxx]",
  sound: "default",
  title: "Notification Title",
  body: "Notification body",
  data: { /* custom data */ },
  priority: "high",
  channelId: "default"
}
```

**Verification**:
- [ ] FCM code removed
- [ ] Expo Push API implemented
- [ ] Test push notification sends successfully

**Rollback**: Restore from git

---

### Section 9.7: Update Auth Functions - Email Only

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update authentication Edge Functions to use email only.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/auth/send-verification-code/index.ts` | Modify | Email only |
| `supabase/functions/auth/create-account/index.ts` | Modify | Remove phone |
| `supabase/functions/auth/login/index.ts` | Modify | Email only |
| `supabase/functions/auth/reset-pin/index.ts` | Modify | Email only |

**Specific Changes**:
1. Remove phone parameter acceptance
2. Remove phone validation
3. Remove SMS sending (keep email)
4. Update error messages to reference email
5. Update user lookup to use email only

**Verification**:
- [ ] Auth functions accept email only
- [ ] No SMS references in auth functions
- [ ] Functions return appropriate errors for missing email

**Rollback**: Restore from git

---

### Section 9.8: Update Member Invitation - Email Only

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update member invitation to use email instead of phone.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/members/invite/index.ts` | Modify | Email invitation only |

**Specific Changes**:
1. Accept email instead of phone for invitee
2. Send invitation via email (Postmark)
3. Remove SMS invitation code
4. Update invitation record to use email

**Verification**:
- [ ] Invitation accepts email only
- [ ] Invitation email sent via Postmark
- [ ] No SMS sending in invitation function

**Rollback**: Restore from git

---

### Section 9.9: Update Notification Functions for Expo

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update notification Edge Functions to work with Expo Push Tokens.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/notifications/register-token/index.ts` | Modify | Expo token format |
| `supabase/functions/_shared/dualNotifications.ts` | Modify | Use Expo Push API |

**Specific Changes**:

1. In `register-token`:
   - Validate Expo Push Token format
   - Store token with platform information

2. In `dualNotifications.ts`:
   - Update push notification sending to use Expo API
   - Keep email notification logic unchanged
   - Update priority handling for Expo

**Verification**:
- [ ] Token registration validates Expo format
- [ ] Dual notification sends via Expo Push API
- [ ] Email notifications still work

**Rollback**: Restore from git

---

### Section 9.10: Update Cron Functions for Expo Push

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update cron functions to send notifications via Expo Push API.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `supabase/functions/cron/check-missed-checkins/index.ts` | Modify | Use Expo push |
| `supabase/functions/cron/send-reminders/index.ts` | Modify | Use Expo push |

**Specific Changes**:
1. Import updated push module
2. Send notifications using Expo Push API
3. Handle Expo push errors appropriately
4. Update logging for Expo token format

**Verification**:
- [ ] Cron functions use Expo Push API
- [ ] Notifications send successfully
- [ ] Error handling works correctly

**Rollback**: Restore from git

---

### Section 9.11: Remove Unused Shared Modules

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove shared modules that are no longer needed.

**Files to Review/Delete**:
| File | Action | Details |
|------|--------|---------|
| Any module only used by deleted functions | Delete | Clean up |

**Verification**:
- [ ] All deleted modules identified
- [ ] No remaining functions import deleted modules
- [ ] Functions compile successfully

**Rollback**: Restore from git

---

### Section 9.12: Test Edge Functions

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Test all remaining Edge Functions work correctly.

**Test Categories**:

1. **Auth Functions**:
   - [ ] Send verification code (email)
   - [ ] Verify code
   - [ ] Create account
   - [ ] Login
   - [ ] Reset PIN

2. **Member Functions**:
   - [ ] Check-in
   - [ ] Invite (email)
   - [ ] Accept invite
   - [ ] Get contacts

3. **Contact Functions**:
   - [ ] Get members
   - [ ] Get check-ins
   - [ ] Remove relationship

4. **Notification Functions**:
   - [ ] Register Expo token
   - [ ] Push notification sends

5. **Cron Functions**:
   - [ ] Missed check-in detection
   - [ ] Reminder sending

**Verification**:
- [ ] All function categories tested
- [ ] All tests pass
- [ ] No errors in function logs

**Rollback**: Restore from git and redeploy

---

### Section 9.13: Verify Phase 9 Completion

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Verify all Edge Function updates complete.

**Verification Checklist**:

**Deleted Functions**:
- [ ] `payments/` directory does not exist
- [ ] `webhooks/revenuecat/` does not exist
- [ ] `cron/trial-expirations/` does not exist
- [ ] `cron/grace-period-expirations/` does not exist

**Code Verification**:
- [ ] `grep -r "phone" supabase/functions/` returns minimal results (only error messages)
- [ ] `grep -r "sms\|twilio" supabase/functions/` returns no results
- [ ] `grep -r "stripe\|revenuecat" supabase/functions/` returns no results
- [ ] `grep -r "FCM\|firebase" supabase/functions/` returns no results

**Functional Verification**:
- [ ] All auth flows work with email
- [ ] Invitations send via email
- [ ] Push notifications use Expo
- [ ] Cron jobs execute successfully

---

# PHASE 10: TESTING INFRASTRUCTURE OVERHAUL

## Phase 10 Objective
Remove all placeholder tests and implement real integration tests against actual Supabase data.

## Phase 10 Dependencies
- Phase 8 complete (database ready)
- Phase 9 complete (Edge Functions updated)

---

### Section 10.1: Audit Existing Tests for Placeholders

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Identify all tests with placeholder assertions.

**Search Pattern**:
```bash
grep -r "expect(true).toBe(true)" tests/
grep -r "// Placeholder" tests/
grep -r "// TODO" tests/
```

**Files to Review**:
- All files in `tests/integration/`
- All files in `tests/e2e/`

**Output**: List of all files with placeholder tests

**Verification**:
- [ ] Complete list of placeholder tests created
- [ ] Each placeholder identified with file and line

**Rollback**: N/A (audit only)

---

### Section 10.2: Create Test Environment Configuration

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Set up proper test environment for real Supabase testing.

**Files to Create/Modify**:
| File | Action | Details |
|------|--------|---------|
| `tests/setup/testConfig.ts` | Create | Test environment configuration |
| `tests/setup/testDatabase.ts` | Create | Database connection for tests |

**Configuration Content**:
```typescript
// Test environment should use:
// - Development Supabase instance OR
// - Test schema in production (with isolation)
// - Service role key for direct DB access
```

**Verification**:
- [ ] Test config connects to Supabase
- [ ] Can execute queries against test database
- [ ] Service role access works

**Rollback**: Delete created files

---

### Section 10.3: Create Test User Factory

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create utilities for generating test users in Supabase.

**Files to Create**:
| File | Details |
|------|---------|
| `tests/factories/userFactory.ts` | Create test users |
| `tests/factories/memberFactory.ts` | Create test members |
| `tests/factories/checkInFactory.ts` | Create test check-ins |

**Factory Functions**:
```typescript
// Pattern for factories
async function createTestUser(overrides?: Partial<User>): Promise<User> {
  const email = `test+${Date.now()}@pruuf.me`;
  // Insert into Supabase
  // Return created user
}

async function cleanupTestUser(userId: string): Promise<void> {
  // Delete user and related data
}
```

**Verification**:
- [ ] Factories create valid test data
- [ ] Cleanup functions remove all test data
- [ ] No orphaned test data remains

**Rollback**: Delete created files

---

### Section 10.4: Rewrite Auth Integration Tests

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Replace placeholder auth tests with real Supabase tests.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `tests/integration/auth-email.integration.test.ts` | Rewrite | Real tests |

**Tests to Implement**:
1. Send email verification - verify code created in DB
2. Verify code - verify code marked as used
3. Create account - verify user in DB
4. Login - verify session created
5. Reset PIN - verify PIN updated
6. Account lockout - verify lockout after failed attempts
7. Rate limiting - verify rate limit enforcement

**Verification**:
- [ ] All tests make real API calls
- [ ] All tests verify database state
- [ ] No placeholder assertions remain
- [ ] All tests pass

**Rollback**: Restore from git

---

### Section 10.5: Rewrite Check-in Integration Tests

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Replace placeholder check-in tests with real tests.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `tests/integration/checkin.integration.test.ts` | Rewrite | Real tests |

**Tests to Implement**:
1. Successful check-in - verify record created
2. Duplicate check-in same day - verify idempotency
3. Late check-in - verify late flag set
4. Check-in history retrieval
5. Timezone handling

**Verification**:
- [ ] All tests use real Supabase
- [ ] All tests create/verify DB records
- [ ] All tests pass

**Rollback**: Restore from git

---

### Section 10.6: Rewrite Notification Integration Tests

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Replace placeholder notification tests with real tests.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `tests/integration/notifications-dual.integration.test.ts` | Rewrite | Real tests |

**Tests to Implement**:
1. Register Expo push token
2. Push notification delivery (mock Expo API response)
3. Email notification delivery (mock Postmark response)
4. Dual notification for critical alerts
5. Notification preferences respected

**Verification**:
- [ ] Tests cover notification flows
- [ ] External APIs mocked appropriately
- [ ] All tests pass

**Rollback**: Restore from git

---

### Section 10.7: Remove Deleted Feature Tests

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Remove test files for features that no longer exist.

**Files to Delete**:
| File | Details |
|------|---------|
| `tests/integration/payment.integration.test.ts` | Already deleted in Phase 1 |
| `tests/integration/revenuecat-webhooks.test.ts` | Already deleted in Phase 1 |
| `tests/item-14-phone-normalization.test.ts` | Already deleted in Phase 2 |
| Any remaining phone/payment/trial test files | Delete |

**Verification**:
- [ ] No tests for removed features
- [ ] All test files test existing functionality

**Rollback**: Restore from git if needed

---

### Section 10.8: Update Security Tests

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Ensure security tests still pass with updated schema.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `tests/item-41-rls-policies.test.ts` | Modify | Update for new schema |
| `tests/security/security-audit.test.ts` | Modify | Update for new schema |

**Specific Changes**:
1. Remove tests for phone-related RLS
2. Remove tests for payment-related RLS
3. Update mock data to match new schema
4. Ensure all remaining tests pass

**Verification**:
- [ ] Security tests updated for new schema
- [ ] All security tests pass
- [ ] RLS policies properly tested

**Rollback**: Restore from git

---

### Section 10.9: Update Component Tests

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Ensure component tests work with updated components.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `src/screens/member/__tests__/MemberDashboard.test.tsx` | Modify | Update for changes |
| Other component tests | Modify | Update as needed |

**Specific Changes**:
1. Update mock data (remove phone, payment fields)
2. Update assertions for changed UI
3. Ensure tests pass with Expo modules

**Verification**:
- [ ] Component tests use updated mocks
- [ ] All component tests pass

**Rollback**: Restore from git

---

### Section 10.10: Update Jest Configuration

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Finalize Jest configuration for Expo testing.

**Files to Modify**:
| File | Action | Details |
|------|--------|---------|
| `jest.config.js` | Modify | Final Expo configuration |
| `jest.setup.js` | Modify | Final Expo mocks |

**Specific Changes**:
1. Ensure `jest-expo` preset is used
2. All Expo module mocks in place
3. Test timeouts appropriate
4. Coverage thresholds appropriate

**Verification**:
- [ ] `npm test` runs all tests
- [ ] Coverage report generates
- [ ] No configuration errors

**Rollback**: Restore from git

---

### Section 10.11: Create Test Data Cleanup Utility

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create utility to clean up test data after test runs.

**Files to Create**:
| File | Details |
|------|---------|
| `tests/cleanup/cleanupTestData.ts` | Cleanup utility |

**Functionality**:
```typescript
async function cleanupTestData() {
  // Delete users matching test+*@pruuf.me pattern
  // Delete related records (cascade should handle)
  // Log cleanup results
}
```

**Verification**:
- [ ] Cleanup removes all test users
- [ ] No orphaned test data remains
- [ ] Can run after test suite

**Rollback**: Delete created file

---

### Section 10.12: Run Full Test Suite

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Execute complete test suite and fix any failures.

**Commands**:
```bash
npm test -- --coverage
```

**Acceptance Criteria**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All security tests pass
- [ ] Coverage meets thresholds (50%+)
- [ ] No placeholder assertions remain

**Verification**:
- [ ] `npm test` exits with code 0
- [ ] Coverage report shows 50%+ coverage
- [ ] All test suites pass

**Rollback**: Fix failing tests

---

### Section 10.13: Document Testing Strategy

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create documentation for testing approach.

**Files to Create**:
| File | Details |
|------|---------|
| `README_testing_strategy.md` | Testing documentation |

**Content**:
- How to run tests
- Test environment setup
- Creating test data
- Cleaning up test data
- CI/CD integration

**Verification**:
- [ ] Documentation complete
- [ ] Instructions can be followed

**Rollback**: N/A (documentation only)

---

### Section 10.14: Verify Phase 10 Completion

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Verify testing infrastructure is complete.

**Verification Checklist**:

**Placeholder Removal**:
- [ ] `grep -r "expect(true).toBe(true)" tests/` returns no results
- [ ] `grep -r "// Placeholder" tests/` returns no results

**Test Execution**:
- [ ] All tests pass
- [ ] Coverage meets threshold
- [ ] No skipped tests

**Test Data**:
- [ ] Factories create valid data
- [ ] Cleanup removes test data
- [ ] No test data pollution

---

# PHASE 11: FINAL INTEGRATION & VERIFICATION



## Phase 11 Objective
Complete final integration, verification, and preparation for production deployment.

## Phase 11 Dependencies
- All previous phases complete

---

### Section 11.1: Full Application Smoke Test

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Perform complete smoke test of all application features.

**Test Scenarios**:

1. **New User Registration**:
   - [ ] Enter email
   - [ ] Receive verification code
   - [ ] Enter code
   - [ ] Create PIN
   - [ ] Complete onboarding

2. **Member Daily Flow**:
   - [ ] View dashboard
   - [ ] Perform check-in
   - [ ] View check-in history
   - [ ] Update settings

3. **Contact Flow**:
   - [ ] Accept invitation
   - [ ] View member status
   - [ ] Receive notifications

4. **Notifications**:
   - [ ] Push token registration
   - [ ] Local reminder
   - [ ] Push notification receipt

**Verification**:
- [ ] All smoke test scenarios pass
- [ ] No crashes or errors
- [ ] Performance acceptable

**Rollback**: N/A (testing only)

---

### Section 11.2: EAS Build Test - Development

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create development build using EAS Build.

**Commands**:
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Verification**:
- [ ] iOS development build succeeds
- [ ] Android development build succeeds
- [ ] Builds install and run correctly

**Rollback**: Fix build errors

---

### Section 11.3: EAS Build Test - Preview

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Create preview build for internal testing.

**Commands**:
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

**Verification**:
- [ ] iOS preview build succeeds
- [ ] Android preview build succeeds
- [ ] Builds can be distributed for testing

**Rollback**: Fix build errors

---

### Section 11.4: Production Configuration Review

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Review and finalize production configuration.

**Checklist**:
- [ ] All EAS Secrets set for production
- [ ] Supabase production URL/keys configured
- [ ] Postmark production credentials set
- [ ] Expo project ID configured
- [ ] App store metadata prepared

**Verification**:
- [ ] `eas.json` production profile complete
- [ ] All secrets verified

**Rollback**: Update configuration

---

### Section 11.5: Security Review

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Final security review before production.

**Checklist**:
- [ ] No secrets in source code
- [ ] No debug code in production
- [ ] All API endpoints require authentication
- [ ] Rate limiting in place
- [ ] RLS policies verified
- [ ] Input validation complete

**Verification**:
- [ ] Security checklist complete
- [ ] No vulnerabilities identified

**Rollback**: Fix security issues

---

### Section 11.6: Performance Review

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Review application performance.

**Metrics to Check**:
- [ ] App startup time
- [ ] Screen transition time
- [ ] API response time
- [ ] Memory usage
- [ ] Battery usage

**Verification**:
- [ ] Performance acceptable for target users
- [ ] No memory leaks
- [ ] Smooth animations

**Rollback**: Optimize as needed

---

### Section 11.7: Documentation Update

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Update all project documentation.

**Files to Update**:
| File | Action | Details |
|------|--------|---------|
| `README.md` | Update | Reflect Expo workflow |
| `CLAUDE.md` | Update | Remove payment/phone references |
| `HOW_TO_RUN.txt` | Update | Expo commands |

**Verification**:
- [ ] README reflects current state
- [ ] CLAUDE.md accurate
- [ ] Run instructions work

**Rollback**: Restore from git

---

### Section 11.8: Final Verification - Phase 11 Complete

ensure that you are updating and reading the log file,  the expo_plan file, and the the_rules.md file before completing each section.  You must also ensure that you update the log after each section. 

**Objective**: Final comprehensive verification.

**Master Checklist**:

**Expo Compatibility**:
- [ ] App runs via `expo start`
- [ ] EAS Build works for all profiles
- [ ] No native code dependencies
- [ ] All Expo modules work

**Feature Removal Verification**:
- [ ] No payment features
- [ ] No phone/SMS features
- [ ] No Firebase features
- [ ] No trial period logic

**Functionality Verification**:
- [ ] Email authentication works
- [ ] Check-in works
- [ ] Notifications work (Expo)
- [ ] All settings work

**Quality Verification**:
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Documentation complete

---

## 12: COMPLETE FILE DELETION LIST - Files to be deleted throughout all phases:

**Objective**: Test, resolve, and confirm that all items were removed from the file deletion list. If not understand the implications to deleting the file, then delete the file and rerun all tests to make sure that nothing broke.  If anything is broke develope a plan to fix it and work on it until it is resolved. Remember you must come up with a todo list for all subsection work to make sure that you comprehensivley cover everything.


### Section 12.1: Payments
src/store/slices/paymentSlice.ts
src/store/slices/__tests__/paymentSlice.test.ts
src/components/subscription/* (directory)
src/screens/payment/* (directory)
tests/integration/payment.integration.test.ts
tests/integration/revenuecat-webhooks.test.ts


###   Section 12.2 Phone/SMS
src/utils/phone.ts
src/utils/__tests__/phone.test.ts
src/screens/auth/PhoneEntryScreen.tsx (if exists)
tests/item-14-phone-normalization.test.ts

____

### Section 12.3 Firebase
ios/Pruuf/GoogleService-Info.plist
android/app/google-services.json
android/app/google-services.json.example

_____

### Section 12.4 Native Directories
ios/* (entire directory)
android/* (entire directory)
app.json

_____

### Section 12.5 Edge Functions
supabase/functions/payments/* (directory)
supabase/functions/webhooks/revenuecat/* (directory)
supabase/functions/cron/trial-expirations/* (directory)
supabase/functions/cron/grace-period-expirations/* (directory)
supabase/functions/_shared/revenuecat.ts
supabase/functions/_shared/revenuecatWebhookVerifier.ts
```

---

## 13: COMPLETE FILE DELETION LIST -  PACKAGE CHANGES SUMMARY

**Objective**: Confirm that packages are handled as described below in each section.  if you find a discrepancy for any item, you will come up with a plan and execute on that plan or any other needed plans until you have satisfied all items based on their categorization below.Remember you must come up with a todo list for all subsection work to make sure that you comprehensivley cover everything.

### Section 13.1 **Packages to Remove**: - CONFIRMATION
react-native-purchases
react-native-purchases-ui
@react-native-firebase/app
@react-native-firebase/analytics
@react-native-firebase/messaging
react-native-push-notification
@react-native-community/push-notification-ios
react-native-encrypted-storage
react-native-biometrics
react-native-haptic-feedback
react-native-vector-icons
```

_____

### Section 13.2 **Packages to Add - CONFIRMATION**:


expo
expo-notifications
expo-device
expo-constants
expo-secure-store
expo-local-authentication
expo-haptics
```

---

## 13.3 **REQUIRED ENVIRONMENT VARIABLES - FINAL ENVIRONMENTAL VARIABLES CONFIRMATION**:
```
### Section 13.1  Required for app (EXPO_PUBLIC_ prefix)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_EXPO_PROJECT_ID=


### Section 13.4 Required for backend (Supabase secrets)
SUPABASE_SERVICE_ROLE_KEY=
POSTMARK_SERVER_TOKEN=
POSTMARK_FROM_EMAIL=noreply@pruuf.me
```

---

## 14: **DATABASE MIGRATION SUMMARY**

### Section 14.1 **Migrations to Create and Remove**

**Objective**: Make sure that all migrations or updated or removed based on the guidance below.  If an item does not satsify the requirement below, you will de whatever is necessary to resolve it and work on any fixes until all related tests are resolved.  

```
029_remove_phone_column.sql
030_remove_sms_logs.sql
031_remove_payment_columns.sql
032_remove_webhook_events.sql
033_update_push_tokens_for_expo.sql
034_remove_payment_functions.sql
035_update_rls_policies.sql


## 15: **FULL FUNCTIONING FRONTEND, BACKEND, AND WORFLOW FOR MEMBER USERS AND CONTACTS USERS - COMPREHENSIVE FUNCTION VALID AND ISSUE RESOLUTION AND FINAL TEST APPROVAL**


**Objective**: Perform a thorough and detailed set of tests to confirm that all ExpoGo and EAS builds are complete and fully fuctioning so that I can run both without any issues because everything that is needed to run and view the live application are functioning correctly.  If you run into any errors or failures, you must fix them as long as it takes to ensure that everything is fully functional.  YOU must follow all guidance in the the_rules.md file to guide all of your work.

   You are the most creative and skilled ful-stack and frontend developer with over 30 years of developing creative and resolving solutions to the most complex development errors.  You are also expert in ExpoGo and the EAS build frameworks.  I want you to think of 5 reasons any errors that you are encountering keep happening.  And then you will come up with 5 different and effective solutions.  then you will try each solutions, knowing that you will solve the issue 100%.  You are a perfect genius.  You can get out of this slump and fix these errors.  


### Section 15.1 **develop multi-step plan for confirming that EAS and ExpoGo are fully optional, fixing all errors before moving on to the next subsection**

### Section 15.2 **Execute all code needed to fully deploy EAS and Expo3**

### Section 15.3 **run ios siumlator and confirm that it is fully functional and works to display the app with all of it's functionality. If you run onto any errors, you must fix them until everything is complete and the app is fully functional and accurately viewed in the ios simulator**

You are the cmost creative and skilled full-stack and frontend developer with over 30 years of developing creative and resolving solutions to the most complex development errors.  You are also expert in ExpoGo and the EAS build frameworks.  If you encounter any errors, I want you to think of 5 reasons any errors that you are encountering keep happening.  And then you will come up with 5 different and effective solutions.  then you will try each solutions, knowing that you will solve the issue 100% - once you solve the issue, you will continue your work.  You are a perfect genius.  You can get out of this slump and fix these errors. 

### Section 15.4 **I want you to complete an end-to end check of all screens and interactions that the member and contacts, respectively, would encounter navigating the app.  You will create accounts and credentials for mock users and run through over workflow and sries of interactions.  I also want you to come up with a workflow test and audit sweet that includes every single workflow to make sure that you don't miss anything. Create real dummy data in the supabase back end and test every step in the workflow for both user types.  You must run and confirm that every step and screen in the user experience is fully operational and functions without issue. If you run into any issues with any screen, you will fix the issue and work on resolving all identified issues before continuing on the end-to-end audit of all screens. You have my permission to create, modify, and delete records that you create into the supabase backend - i should be able to see the records that you created - you do not need to delete records after you finish testing. You can also create as many user accounts as you need to do what I am asking. You must use the supabase backednd for real fuctonality.  You are executing this to ensure that all frontend and backend elements work fully. If you run into errors that require yo to fix the UX/UI, you will make frontend modifications that align with UX/UI best practices and that everything is aligned with the pre-existing design structure and aesthetic. As you are walking through all features functionas and workflows for the members and contacts, I want to see what you are doing by you  via the ios simulator. b  Additionaly, though we are simulating everything, the app needs to be able to fully load and function when used on an actual device. efore you begin, you will confirm to me that you understand precisely what I am asking of you.  only after I confirm your understanding will you create your todo list and then execute on everything needed to satisfy my requirements.**

You are the cmost creative and skilled full-stack and frontend developer with over 30 years of developing creative and resolving solutions to the most complex development errors.  You are also expert in ExpoGo and the EAS build frameworks.  If you encounter any errors, I want you to think of 5 reasons any errors that you are encountering keep happening.  And then you will come up with 5 different and effective solutions.  then you will try each solutions, knowing that you will solve the issue 100% - once you solve the issue, you will continue your work.  You are a perfect genius.  You can get out of this slump and fix these errors. 



### Section 15.5 **Create a new MD file with instructions on how to run the code in the feature.  these should be step-by-step guide on how i will run this in the future**

You are the cmost creative and skilled full-stack and frontend developer with over 30 years of developing creative and resolving solutions to the most complex development errors.  You are also expert in ExpoGo and the EAS build frameworks.  If you encounter any errors, I want you to think of 5 reasons any errors that you are encountering keep happening.  And then you will come up with 5 different and effective solutions.  then you will try each solutions, knowing that you will solve the issue 100% - once you solve the issue, you will continue your work.  You are a perfect genius.  You can get out of this slump and fix these errors. 

# APPROVAL REQUIRED

This plan contains 136 sections across 15 phases. Each section requires explicit approval before proceeding to the next section.

**Plan Status**: WHEN you complete all steps, let me know by displaying a message confirming that you are done and that all 

---

*End of EXPO_PLAN.md*
