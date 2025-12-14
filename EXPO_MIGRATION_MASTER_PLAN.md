# PRUUF: COMPREHENSIVE EXPO MIGRATION MASTER PLAN

**Document Version:** 1.0
**Plan Date:** December 2025
**Prepared By:** Orchestrator Agent with Lead Mobile Engineer, DevOps Engineer, Integrations Engineer, QA Lead, and Security Engineer
**Document Purpose:** Complete, implementation-ready migration plan from React Native CLI to Expo with EAS
**Target Audience:** Development team, project owner, QA team
**Estimated Total Effort:** 56-72 hours (1 experienced developer) or 40-55 hours (2 developers)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target State Architecture](#3-target-state-architecture)
4. [Pre-Migration Checklist](#4-pre-migration-checklist)
5. [Phase 1: Project Foundation](#5-phase-1-project-foundation-8-12-hours)
6. [Phase 2: Core Dependencies Migration](#6-phase-2-core-dependencies-migration-12-16-hours)
7. [Phase 3: Notification System Migration](#7-phase-3-notification-system-migration-16-20-hours)
8. [Phase 4: Storage & Security Migration](#8-phase-4-storage--security-migration-8-10-hours)
9. [Phase 5: Build & Deployment Setup](#9-phase-5-build--deployment-setup-8-12-hours)
10. [Phase 6: Testing & Validation](#10-phase-6-testing--validation-12-16-hours)
11. [File-by-File Change Manifest](#11-file-by-file-change-manifest)
12. [Integration Migration Specifications](#12-integration-migration-specifications)
13. [Testing Strategy & Test Cases](#13-testing-strategy--test-cases)
14. [Security Validation Checklist](#14-security-validation-checklist)
15. [Orchestrator Coordination Protocol](#15-orchestrator-coordination-protocol)
16. [Risk Assessment & Mitigation](#16-risk-assessment--mitigation)
17. [Rollback Procedures](#17-rollback-procedures)
18. [Post-Migration Verification](#18-post-migration-verification)
19. [Timeline & Milestones](#19-timeline--milestones)
20. [Appendix: Command Reference](#20-appendix-command-reference)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Migration Objective

Migrate Pruuf from **React Native CLI 0.74.0 (bare workflow)** to **Expo SDK 52 with EAS Development Build**, preserving 100% of existing functionality while gaining:

- Cloud-based builds (no local Xcode/Android Studio required)
- Over-the-air (OTA) JavaScript updates
- Simplified dependency management
- Automatic certificate handling
- Reduced maintenance burden for non-developer owner

### 1.2 Scope Summary

| Category | Current State | Target State | Migration Complexity |
|----------|---------------|--------------|---------------------|
| **Build System** | React Native CLI + Metro | Expo + EAS Build | Medium |
| **Push Notifications** | @react-native-firebase/messaging | expo-notifications | High |
| **Local Notifications** | react-native-push-notification | expo-notifications | High |
| **Encrypted Storage** | react-native-encrypted-storage | expo-secure-store | Low |
| **Icons** | react-native-vector-icons | @expo/vector-icons | Low |
| **Haptics** | react-native-haptic-feedback | expo-haptics | Low (unused) |
| **Payments** | @stripe/stripe-react-native | RevenueCat (post-launch) | **REMOVED** - See Section 1.5 |
| **Deep Linking** | Manual configuration | Expo Router/Config | Low |

### 1.3 Key Decisions Made

1. **Development Build over Managed Workflow** - Allows custom native code if ever needed
2. **Device Push Tokens over Expo Push Tokens** - Direct FCM/APNs integration for reliability
3. **Incremental Migration** - Phase-by-phase approach with validation gates
4. **Parallel Environment** - New Expo project alongside existing, no destructive changes
5. **Feature Parity First** - No new features until migration complete and validated

### 1.4 Success Criteria

The migration is considered successful when:

- [ ] All 8 critical user flows pass end-to-end testing
- [ ] Push notifications deliver to iOS and Android with <5 second latency
- [ ] Encrypted storage persists across app restarts and updates
- [ ] Payment UI displays correctly (RevenueCat integration deferred to post-launch)
- [ ] App builds successfully on EAS for both platforms
- [ ] OTA updates deploy without app store submission
- [ ] No regression in accessibility (60pt touch targets, VoiceOver support)
- [ ] Security audit passes all 12 validation points

### 1.5 Payment Strategy Decision (CRITICAL)

**Decision Date:** December 2025
**Decision:** Remove Stripe SDK entirely, integrate RevenueCat post-launch

#### Rationale

1. **Apple App Store Requirement:** Mobile apps selling digital subscriptions MUST use Apple In-App Purchase (IAP). Stripe's native SDK cannot process IAP transactions on iOS.

2. **Expo Go Compatibility:** `@stripe/stripe-react-native` requires native code that blocks Expo Go development. Removing it enables rapid UI iteration using Expo Go.

3. **RevenueCat Benefits:**
   - Single SDK wraps both Apple IAP and Google Play Billing
   - Handles receipt validation server-side
   - Provides subscription analytics dashboard
   - Supports promotional offers and free trials
   - Webhook integration for backend sync

#### Implementation Timeline

| Phase | Description | When |
|-------|-------------|------|
| **Expo Migration** | Remove Stripe SDK, add payment UI placeholders | Now |
| **UI Development** | Build subscription screens with Expo Go | During Migration |
| **RevenueCat Integration** | Add `react-native-purchases` SDK | Post-Launch Phase 2 |
| **App Store Submission** | Configure IAP products in App Store Connect | Post-Launch Phase 2 |
| **Production Payments** | Enable live subscriptions | Post-Launch Phase 3 |

#### Subscription Details

- **Price:** $3.99/month (USD)
- **Trial Period:** 30 days free (no card required)
- **Platforms:** iOS App Store + Google Play Store
- **Backend Sync:** RevenueCat webhooks → Supabase `users` table

#### What This Means for Development

1. **During Expo Migration:**
   - Remove `@stripe/stripe-react-native` from dependencies
   - Remove StripeProvider from App.tsx
   - Keep subscription UI components (SubscriptionCard, etc.)
   - Payment buttons show "Coming Soon" or navigate to placeholder

2. **For Testing:**
   - Use Expo Go for all UI development
   - Payment flows are UI-only (no transactions)
   - Test account status logic with mock data

3. **Post-Launch:**
   - Add `react-native-purchases` (RevenueCat SDK)
   - Configure App Store Connect IAP products
   - Implement purchase flow
   - Connect webhooks to backend

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Technology Stack Inventory

**React Native Version:** 0.74.0
**React Version:** 18.2.0
**TypeScript Version:** 5.0.4
**Node Requirement:** >=18

### 2.2 Current Dependencies Requiring Migration

```
MIGRATION REQUIRED:
├── @react-native-firebase/app@^23.5.0        → Remove (Expo handles Firebase)
├── @react-native-firebase/messaging@^23.5.0  → expo-notifications
├── react-native-encrypted-storage@^4.0.3     → expo-secure-store
├── react-native-haptic-feedback@^2.3.3       → expo-haptics
├── react-native-vector-icons@^10.3.0         → @expo/vector-icons

COMPATIBLE (No Changes):
├── @supabase/supabase-js@^2.83.0             → No changes
├── @reduxjs/toolkit@^2.10.1                  → No changes
├── @tanstack/react-query@^5.90.10            → No changes
├── react-native-reanimated@^4.1.5            → Built into Expo
├── react-native-gesture-handler@^2.29.1      → Built into Expo
├── react-native-screens@^4.18.0              → Built into Expo
├── react-native-safe-area-context@^5.6.2     → Built into Expo
├── @react-native-async-storage/async-storage → Built into Expo
├── @react-navigation/*                       → No changes
├── react-hook-form@^7.66.1                   → No changes
├── yup@^1.7.1                                → No changes
├── date-fns@^4.1.0                           → No changes
├── moment-timezone@^0.6.0                    → No changes
├── axios@^1.13.2                             → No changes

REMOVE ENTIRELY:
├── @stripe/stripe-react-native@^0.57.0       → Remove (See Section 1.5 - RevenueCat post-launch)
├── twilio@^5.10.6                            → Remove (server-side only, unused)
```

### 2.3 Critical Files Requiring Modification

| File Path | Current Purpose | Migration Impact |
|-----------|-----------------|------------------|
| `App.tsx` | Entry point with providers | Minor updates for Expo |
| `src/services/notifications.ts` | Firebase FCM handling | **Complete rewrite** |
| `src/services/notificationService.ts` | Local notification scheduling | **Complete rewrite** |
| `src/services/storage.ts` | Encrypted storage wrapper | API signature changes |
| `src/services/deepLinkService.ts` | Deep link handling | Simplification with Expo |
| `package.json` | Dependencies | Major updates |
| `app.json` | Basic config | Replace with Expo config |
| `ios/*` | Native iOS project | Remove (EAS Build manages) |
| `android/*` | Native Android project | Remove (EAS Build manages) |

### 2.4 Current Notification Architecture

```
CURRENT FLOW (React Native Firebase):

1. App Launch
   └── messaging().requestPermission()
       └── messaging().getToken()
           └── POST /api/push-notifications/register-token {token, platform}

2. Foreground Notification
   └── messaging().onMessage(remoteMessage)
       └── Display in-app banner

3. Background Notification
   └── messaging().setBackgroundMessageHandler(handler)
       └── Process silently

4. Notification Tap
   └── messaging().onNotificationOpenedApp(remoteMessage)
   └── messaging().getInitialNotification()
       └── Navigate to relevant screen

5. Token Refresh
   └── messaging().onTokenRefresh(newToken)
       └── POST /api/push-notifications/register-token
```

### 2.5 Current Storage Architecture

```
CURRENT STORAGE KEYS:
├── pruuf_access_token     (JWT access token)
├── pruuf_refresh_token    (JWT refresh token)
├── pruuf_user             (JSON serialized user profile)
└── pruuf_font_size        (Accessibility preference)

STORAGE API USAGE:
├── setItem(key, value)
├── getItem(key)
├── removeItem(key)
└── clear()
```

### 2.6 Current Deep Linking Configuration

```
CURRENT DEEP LINKS:
├── pruuf://verify-email?token={token}
├── pruuf://accept-invite?code={code}
├── pruuf://member/{memberId}
└── pruuf://settings/payment
```

---

## 3. TARGET STATE ARCHITECTURE

### 3.1 Expo SDK Configuration

**Target Expo SDK:** 52 (latest stable)
**Build Profile:** Development Build (not Managed)
**Update Channel:** EAS Update with staging/production channels

### 3.2 New Dependencies

```
NEW DEPENDENCIES TO ADD:
├── expo@~52.0.0
├── expo-dev-client@~4.0.0           (Development builds)
├── expo-notifications@~0.29.0       (Push + local notifications)
├── expo-secure-store@~14.0.0        (Encrypted storage)
├── expo-haptics@~14.0.0             (Haptic feedback)
├── expo-constants@~17.0.0           (App constants)
├── expo-device@~7.0.0               (Device info for notifications)
├── expo-linking@~7.0.0              (Deep linking)
├── expo-status-bar@~2.0.0           (Status bar control)
├── expo-splash-screen@~0.29.0       (Splash screen)
├── expo-font@~13.0.0                (Font loading)
├── expo-updates@~0.26.0             (OTA updates)
└── @expo/vector-icons@^14.0.0       (Icon library)

POST-LAUNCH ADDITION (RevenueCat - Not Part of Expo Migration):
└── react-native-purchases@^8.0.0    (RevenueCat SDK - Add after launch)
```

### 3.3 Target Notification Architecture

```
TARGET FLOW (Expo Notifications):

1. App Launch
   └── Notifications.requestPermissionsAsync()
       └── Notifications.getDevicePushTokenAsync()
           └── POST /api/push-notifications/register-token {token, platform}

2. Foreground Notification
   └── Notifications.addNotificationReceivedListener(notification)
       └── Display in-app banner

3. Background Notification
   └── Notifications.setNotificationHandler({...})
       └── Determine show/hide behavior

4. Notification Tap
   └── Notifications.addNotificationResponseReceivedListener(response)
       └── Navigate to relevant screen

5. Token Refresh
   └── Notifications.addPushTokenListener(token)
       └── POST /api/push-notifications/register-token
```

### 3.4 Target Storage Architecture

```
TARGET STORAGE (expo-secure-store):

SAME KEYS, NEW API:
├── setItemAsync(key, value)    (was setItem)
├── getItemAsync(key)           (was getItem)
├── deleteItemAsync(key)        (was removeItem)
└── No clear() equivalent       (must delete keys individually)

IMPORTANT LIMITATION:
└── iOS: 2KB maximum per key (JWT tokens typically <1KB, safe)
```

### 3.5 Target Deep Linking Configuration

```
TARGET DEEP LINKS (Expo Linking):

Universal Links (iOS):
└── https://pruuf.life/verify-email?token={token}
└── https://pruuf.life/accept-invite?code={code}

App Links (Android):
└── https://pruuf.life/verify-email?token={token}
└── https://pruuf.life/accept-invite?code={code}

Custom Scheme (Fallback):
└── pruuf://verify-email?token={token}
└── pruuf://accept-invite?code={code}
```

### 3.6 Target Project Structure

```
/Pruuf2 (after migration)
├── app.json                    (Expo configuration)
├── eas.json                    (EAS Build configuration)
├── App.tsx                     (Updated entry point)
├── package.json                (Updated dependencies)
├── tsconfig.json               (Updated for Expo)
├── babel.config.js             (Expo preset)
├── metro.config.js             (Expo metro config)
├── /src
│   ├── /components             (No changes)
│   ├── /screens                (No changes)
│   ├── /navigation             (No changes)
│   ├── /store                  (No changes)
│   ├── /services
│   │   ├── api.ts              (No changes)
│   │   ├── supabase.ts         (No changes)
│   │   ├── notifications.ts    (REWRITTEN for expo-notifications)
│   │   ├── storage.ts          (UPDATED for expo-secure-store)
│   │   ├── deepLinkService.ts  (SIMPLIFIED for Expo)
│   │   ├── analyticsService.ts (No changes)
│   │   └── haptics.ts          (NEW - expo-haptics wrapper)
│   ├── /theme                  (No changes)
│   ├── /types                  (No changes)
│   ├── /hooks                  (No changes)
│   ├── /utils                  (No changes)
│   └── /constants              (No changes)
├── /assets                     (Expo assets folder)
│   ├── icon.png               (1024x1024 app icon)
│   ├── splash.png             (Splash screen)
│   ├── adaptive-icon.png      (Android adaptive icon)
│   └── favicon.png            (Web favicon if needed)
└── /ios & /android             (REMOVED - EAS manages)
```

---

## 4. PRE-MIGRATION CHECKLIST

### 4.1 Environment Preparation

| Task | Responsible | Verification |
|------|-------------|--------------|
| Install Node.js 18+ LTS | Developer | `node --version` returns 18.x+ |
| Install Expo CLI globally | Developer | `npm install -g expo-cli` |
| Install EAS CLI globally | Developer | `npm install -g eas-cli` |
| Create Expo account | Developer | https://expo.dev account created |
| Login to EAS CLI | Developer | `eas login` successful |
| Verify Apple Developer account | Owner | Active membership confirmed |
| Verify Google Play Console access | Owner | Active membership confirmed |
| Create Firebase project (if new) | Developer | Project ID documented |
| Backup current codebase | Developer | Git branch `pre-expo-migration` created |
| Document all environment variables | Developer | .env.example updated |

### 4.2 Account & Credential Checklist

| Credential | Required For | Status Check |
|------------|--------------|--------------|
| Expo account credentials | EAS Build, EAS Submit | `eas whoami` |
| Apple Developer Team ID | iOS builds | Apple Developer Portal |
| Apple App Store Connect API Key | Automated submission | App Store Connect |
| Google Play Service Account JSON | Android builds | Google Cloud Console |
| Firebase Project Configuration | Push notifications | Firebase Console |
| RevenueCat API Key | Payment processing (post-launch) | RevenueCat Dashboard |
| Supabase Project URL | Backend API | Supabase Dashboard |
| Supabase Anon Key | Client authentication | Supabase Dashboard |

### 4.3 Backup Verification

Before proceeding, ensure:

```bash
# Create backup branch
git checkout -b pre-expo-migration
git push origin pre-expo-migration

# Tag current release
git tag v1.0.0-pre-expo
git push origin v1.0.0-pre-expo

# Verify backup
git log --oneline -5  # Should show current commits
```

---

## 5. PHASE 1: PROJECT FOUNDATION (8-12 Hours)

### 5.1 Phase Objectives

- Initialize Expo in existing project
- Configure app.json with complete settings
- Set up EAS Build configuration
- Update package.json dependencies
- Configure Metro bundler for Expo
- Update TypeScript configuration

### 5.2 Step-by-Step Instructions

#### Step 1.1: Install Expo in Existing Project (30 min)

**What:** Add Expo SDK to existing React Native project without creating new project.

**Why:** Preserves existing code structure, git history, and configuration.

**Commands:**
```bash
cd /Users/wesquire/Documents/GitHub/Pruuf2
npx expo install expo
```

**Verification:**
- [ ] `node_modules/expo` directory exists
- [ ] No errors during installation
- [ ] `package.json` shows `"expo": "~52.0.0"` (or current version)

#### Step 1.2: Create Expo Configuration (1 hour)

**What:** Replace minimal `app.json` with comprehensive Expo configuration.

**File:** `app.json`

**Required Configuration:**
```json
{
  "expo": {
    "name": "Pruuf",
    "slug": "pruuf",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.pruuf.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Pruuf does not use your camera.",
        "NSPhotoLibraryUsageDescription": "Pruuf does not access your photos.",
        "UIBackgroundModes": ["remote-notification"]
      },
      "config": {
        "usesNonExemptEncryption": false
      },
      "entitlements": {
        "aps-environment": "production"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.pruuf.app",
      "versionCode": 1,
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4CAF50",
          "sounds": ["./assets/sounds/notification.wav"],
          "mode": "production"
        }
      ],
      "expo-secure-store",
      "expo-font",
      "expo-haptics"
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "owner": "pruuf",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-eas-project-id"
    }
  }
}
```

**Verification:**
- [ ] JSON syntax is valid (no parsing errors)
- [ ] `npx expo config --type public` runs without errors
- [ ] Bundle identifiers match existing app store listings

#### Step 1.3: Create EAS Configuration (1 hour)

**What:** Configure EAS Build profiles for development, preview, and production.

**File:** `eas.json`

**Required Configuration:**
```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_ENV": "staging"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Verification:**
- [ ] `eas build:configure` runs without errors
- [ ] EAS project linked to Expo account

#### Step 1.4: Update Package.json Dependencies (2 hours)

**What:** Add new Expo dependencies, remove incompatible packages, update scripts.

**Actions Required:**

1. **Remove incompatible packages:**
```bash
npm uninstall @react-native-firebase/app @react-native-firebase/messaging
npm uninstall react-native-encrypted-storage
npm uninstall react-native-vector-icons
npm uninstall react-native-haptic-feedback
npm uninstall react-native-push-notification
npm uninstall twilio  # Server-side only, shouldn't be in mobile app
```

2. **Install Expo packages:**
```bash
npx expo install expo-dev-client
npx expo install expo-notifications
npx expo install expo-secure-store
npx expo install expo-haptics
npx expo install expo-constants
npx expo install expo-device
npx expo install expo-linking
npx expo install expo-status-bar
npx expo install expo-splash-screen
npx expo install expo-font
npx expo install expo-updates
npx expo install @expo/vector-icons
```

3. **Update package.json scripts:**
```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build:dev": "eas build --profile development",
    "build:preview": "eas build --profile preview",
    "build:prod": "eas build --profile production",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "update": "eas update",
    "lint": "eslint .",
    "test": "jest"
  }
}
```

**Verification:**
- [ ] `npm install` completes without errors
- [ ] No peer dependency warnings for Expo packages
- [ ] `npx expo doctor` reports no issues

#### Step 1.5: Configure Metro Bundler (30 min)

**What:** Update Metro configuration for Expo compatibility.

**File:** `metro.config.js`

**Required Configuration:**
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom configuration here
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
```

**Verification:**
- [ ] `npx expo start` launches Metro bundler without errors
- [ ] QR code displays in terminal

#### Step 1.6: Update TypeScript Configuration (30 min)

**What:** Update tsconfig.json for Expo compatibility.

**File:** `tsconfig.json`

**Required Updates:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ]
}
```

**Verification:**
- [ ] `npx tsc --noEmit` completes without errors
- [ ] IDE shows no TypeScript errors

#### Step 1.7: Update Babel Configuration (30 min)

**What:** Configure Babel with Expo preset.

**File:** `babel.config.js`

**Required Configuration:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
```

**Verification:**
- [ ] Metro bundler starts without Babel errors
- [ ] Reanimated animations work (test later)

#### Step 1.8: Create Asset Directory Structure (1 hour)

**What:** Set up required asset files for Expo.

**Directory:** `/assets`

**Required Files:**
| File | Dimensions | Purpose |
|------|------------|---------|
| `icon.png` | 1024x1024 | App icon (all platforms) |
| `splash.png` | 1284x2778 | Splash screen |
| `adaptive-icon.png` | 1024x1024 | Android adaptive icon foreground |
| `notification-icon.png` | 96x96 | Android notification icon (white on transparent) |
| `favicon.png` | 48x48 | Web favicon (if applicable) |

**Verification:**
- [ ] All asset files exist at correct dimensions
- [ ] `npx expo prebuild --clean` runs without asset errors

### 5.3 Phase 1 Completion Checklist

| Checkpoint | Verification Method | Expected Result |
|------------|---------------------|-----------------|
| Expo SDK installed | `npm list expo` | Shows expo@52.x.x |
| app.json valid | `npx expo config` | No errors |
| EAS configured | `eas build:configure` | Project linked |
| Dependencies updated | `npm install` | No errors |
| Metro works | `npx expo start` | QR code displays |
| TypeScript compiles | `npx tsc --noEmit` | No errors |
| Assets in place | Visual inspection | All files exist |

### 5.4 Phase 1 Rollback Procedure

If Phase 1 fails:

```bash
# Revert to pre-migration state
git checkout pre-expo-migration
git branch -D expo-migration  # Delete failed branch

# Clean node_modules
rm -rf node_modules
npm install
```

---

## 6. PHASE 2: CORE DEPENDENCIES MIGRATION (12-16 Hours)

### 6.1 Phase Objectives

- Migrate vector icons to @expo/vector-icons
- Implement haptics with expo-haptics
- Update imports throughout codebase
- Verify UI renders correctly
- Test icon display on both platforms

### 6.2 Step-by-Step Instructions

#### Step 2.1: Migrate Vector Icons (4 hours)

**What:** Replace react-native-vector-icons with @expo/vector-icons.

**Why:** @expo/vector-icons is compatible with Expo and includes all popular icon sets.

**Current Usage Pattern:**
```typescript
// BEFORE
import Icon from 'react-native-vector-icons/MaterialIcons';
<Icon name="check" size={24} color="#4CAF50" />
```

**Target Usage Pattern:**
```typescript
// AFTER
import { MaterialIcons } from '@expo/vector-icons';
<MaterialIcons name="check" size={24} color="#4CAF50" />
```

**Files Requiring Updates:**

Search pattern: `from 'react-native-vector-icons`

| File | Icon Set Used | Action |
|------|---------------|--------|
| `src/components/common/Button.tsx` | MaterialIcons | Update import |
| `src/components/CheckInButton.tsx` | MaterialIcons | Update import |
| `src/components/MemberCard.tsx` | MaterialIcons | Update import |
| `src/screens/member/MemberDashboard.tsx` | MaterialIcons | Update import |
| `src/screens/contact/ContactDashboard.tsx` | MaterialIcons | Update import |
| `src/navigation/MainTabNavigator.tsx` | MaterialIcons | Update import |

**Migration Steps:**

1. Create search query to find all usages:
```bash
grep -r "react-native-vector-icons" --include="*.tsx" --include="*.ts" src/
```

2. For each file found, update import statement:
```typescript
// Find
import Icon from 'react-native-vector-icons/MaterialIcons';
// OR
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Replace with
import { MaterialIcons } from '@expo/vector-icons';
```

3. Update component usage (if component was aliased):
```typescript
// If using: <Icon name="..." />
// Change to: <MaterialIcons name="..." />
```

**Verification:**
- [ ] No imports from 'react-native-vector-icons' remain
- [ ] `npx expo start` shows no icon-related errors
- [ ] Icons render correctly in simulator

#### Step 2.2: Migrate Haptics (2 hours)

**What:** Replace react-native-haptic-feedback with expo-haptics.

**Current Analysis:** Based on codebase search, haptic feedback is imported but may not be actively used. Need to verify usage.

**Current Usage Pattern (if any):**
```typescript
// BEFORE
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
ReactNativeHapticFeedback.trigger('impactMedium');
```

**Target Usage Pattern:**
```typescript
// AFTER
import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

**Create Haptics Service:**

**File:** `src/services/haptics.ts` (NEW)

```typescript
/**
 * Haptics Service
 * Wrapper for expo-haptics providing consistent haptic feedback
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptics = {
  /**
   * Light impact - for button presses
   */
  light: async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Android: impactAsync works but is subtle
  },

  /**
   * Medium impact - for successful actions (check-in)
   */
  medium: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - for important confirmations
   */
  heavy: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success feedback - for positive outcomes
   */
  success: async (): Promise<void> => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning feedback - for alerts
   */
  warning: async (): Promise<void> => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error feedback - for errors
   */
  error: async (): Promise<void> => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection feedback - for picker/selection changes
   */
  selection: async (): Promise<void> => {
    await Haptics.selectionAsync();
  },
};
```

**Update CheckInButton to Use Haptics:**

```typescript
// In src/components/CheckInButton.tsx
import { haptics } from '../services/haptics';

const handlePress = async () => {
  await haptics.medium(); // Tactile feedback
  onPress();
};
```

**Verification:**
- [ ] No imports from 'react-native-haptic-feedback' remain
- [ ] Haptics work on iOS physical device
- [ ] No crash on Android (haptics may be subtle)

#### Step 2.3: Update App Entry Point (2 hours)

**What:** Update App.tsx for Expo compatibility.

**File:** `App.tsx`

**Required Changes:**

1. Add Expo-specific imports
2. Update status bar to expo-status-bar
3. Configure notification handlers at root level
4. Add splash screen handling

**Updated Structure:**
```typescript
/**
 * Pruuf - Daily Check-in Safety App
 * Main application entry point (Expo version)
 */

import React, { useEffect, useCallback } from 'react';
import { LogBox, View } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
// NOTE: Stripe removed - RevenueCat will be added post-launch (See Section 1.5)
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { store, useAppDispatch } from './src/store';
import { initializeAuth } from './src/store/slices/authSlice';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { colors } from './src/theme';
import {
  initializeNotifications,
  requestNotificationPermissions,
  registerForPushNotifications
} from './src/services/notifications';
import { initializeDeepLinking } from './src/services/deepLinkService';
import { initializeAnalytics } from './src/services/analyticsService';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Configure how notifications behave when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// App initialization component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigationRef = React.useRef<any>(null);

  const onLayoutRootView = useCallback(async () => {
    // Hide splash screen after initialization
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize authentication state from storage
      await dispatch(initializeAuth());

      // Initialize notification service
      await initializeNotifications();

      const granted = await requestNotificationPermissions();
      if (granted) {
        await registerForPushNotifications();
      }

      // Initialize analytics service
      initializeAnalytics();

      console.log('App services initialized successfully');
    };

    initializeApp();
  }, [dispatch]);

  useEffect(() => {
    // Initialize deep linking (requires navigation ref)
    if (navigationRef.current) {
      const cleanup = initializeDeepLinking(navigationRef);
      return cleanup;
    }
  }, [navigationRef.current]);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <RootNavigator ref={navigationRef} />
    </View>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
            {/* NOTE: RevenueCat provider will be added here post-launch */}
          </QueryClientProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
```

**Verification:**
- [ ] App launches without errors
- [ ] Splash screen displays then hides
- [ ] Status bar styling correct

#### Step 2.4: Update Icon References Throughout Codebase (4 hours)

**What:** Systematically update all files using vector icons.

**Search and Replace Strategy:**

1. Find all files with vector icon imports:
```bash
grep -rl "react-native-vector-icons" --include="*.tsx" --include="*.ts" src/
```

2. For each file:
   - Note which icon set is used (MaterialIcons, Ionicons, etc.)
   - Update import statement
   - Update component usage if aliased

**Icon Set Mapping:**

| Old Import | New Import |
|------------|------------|
| `react-native-vector-icons/MaterialIcons` | `import { MaterialIcons } from '@expo/vector-icons'` |
| `react-native-vector-icons/MaterialCommunityIcons` | `import { MaterialCommunityIcons } from '@expo/vector-icons'` |
| `react-native-vector-icons/Ionicons` | `import { Ionicons } from '@expo/vector-icons'` |
| `react-native-vector-icons/FontAwesome` | `import { FontAwesome } from '@expo/vector-icons'` |
| `react-native-vector-icons/Feather` | `import { Feather } from '@expo/vector-icons'` |

**Verification:**
- [ ] `grep -r "react-native-vector-icons" src/` returns no results
- [ ] All icons display correctly in app
- [ ] Tab bar icons render properly

### 6.3 Phase 2 Completion Checklist

| Checkpoint | Verification Method | Expected Result |
|------------|---------------------|-----------------|
| All vector icons migrated | grep for old import | 0 matches |
| Haptics service created | File exists | src/services/haptics.ts |
| App.tsx updated | Visual review | Expo imports present |
| Icons render correctly | Run in simulator | All icons visible |
| Haptics work | Physical device test | Tactile feedback felt |
| No TypeScript errors | `npx tsc --noEmit` | 0 errors |

### 6.4 Phase 2 Rollback Procedure

If Phase 2 fails:

```bash
# Revert icon changes
git checkout src/components
git checkout App.tsx

# Reinstall old icon package if needed
npm install react-native-vector-icons
```

---

## 7. PHASE 3: NOTIFICATION SYSTEM MIGRATION (16-20 Hours)

### 7.1 Phase Objectives

- Migrate push notifications from Firebase to expo-notifications
- Migrate local notifications from react-native-push-notification
- Configure Android notification channels
- Implement notification handlers for all scenarios
- Test notification delivery end-to-end

### 7.2 Critical Warning

**This is the highest-risk phase.** Push notifications are critical for Pruuf's core value proposition. Missed check-in alerts MUST deliver reliably.

**Mitigation Strategy:**
- Implement new notification service alongside existing
- Test extensively before removing old service
- Keep backend compatible with both old and new token formats
- Implement rollback capability

### 7.3 Step-by-Step Instructions

#### Step 3.1: Create New Notification Service (8 hours)

**What:** Complete rewrite of notification service for expo-notifications.

**File:** `src/services/notifications.ts` (REPLACE ENTIRE FILE)

**New Implementation:**

```typescript
/**
 * Notification Service
 * Handles push notifications and local reminders using expo-notifications
 *
 * @module notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';
import { api } from './api';

// Types
export interface NotificationData {
  type: 'check_in_confirmation' | 'missed_check_in' | 'late_check_in' |
        'member_connected' | 'trial_reminder' | 'payment_failed' | 'check_in_reminder';
  member_id?: string;
  message?: string;
  title?: string;
}

export interface PushNotificationState {
  token: string | null;
  platform: 'ios' | 'android';
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

// Module state
let notificationListenerSubscription: Notifications.Subscription | null = null;
let responseListenerSubscription: Notifications.Subscription | null = null;
let tokenRefreshSubscription: Notifications.Subscription | null = null;

/**
 * Initialize notification service
 * Must be called once at app startup
 */
export async function initializeNotifications(): Promise<void> {
  console.log('[Notifications] Initializing...');

  // Configure Android notification channels
  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  // Set up notification listeners
  setupNotificationListeners();

  console.log('[Notifications] Initialization complete');
}

/**
 * Set up Android notification channels (required for Android 8+)
 */
async function setupAndroidChannels(): Promise<void> {
  // Critical alerts channel (missed check-ins)
  await Notifications.setNotificationChannelAsync('critical-alerts', {
    name: 'Critical Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    enableLights: true,
    lightColor: '#F44336',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true, // Bypass Do Not Disturb
  });

  // Standard notifications channel (check-in confirmations)
  await Notifications.setNotificationChannelAsync('standard', {
    name: 'Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 100],
  });

  // Reminders channel (check-in reminders)
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  console.log('[Notifications] Android channels configured');
}

/**
 * Set up notification event listeners
 */
function setupNotificationListeners(): void {
  // Clean up existing listeners
  if (notificationListenerSubscription) {
    notificationListenerSubscription.remove();
  }
  if (responseListenerSubscription) {
    responseListenerSubscription.remove();
  }
  if (tokenRefreshSubscription) {
    tokenRefreshSubscription.remove();
  }

  // Listener for notifications received while app is foregrounded
  notificationListenerSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[Notifications] Received in foreground:', notification);
      handleForegroundNotification(notification);
    }
  );

  // Listener for notification interactions (user tapped notification)
  responseListenerSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('[Notifications] User interacted with notification:', response);
      handleNotificationResponse(response);
    }
  );

  // Listener for push token changes
  tokenRefreshSubscription = Notifications.addPushTokenListener((token) => {
    console.log('[Notifications] Token refreshed:', token.data);
    handleTokenRefresh(token.data);
  });
}

/**
 * Request notification permissions from user
 * @returns true if permissions granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  console.log('[Notifications] Requesting permissions...');

  // Check if physical device (notifications don't work on simulators)
  if (!Device.isDevice) {
    console.warn('[Notifications] Not a physical device, skipping permission request');
    return false;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  // Request if not already determined
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
        allowCriticalAlerts: true, // For missed check-in alerts
        provideAppNotificationSettings: true,
      },
    });
    finalStatus = status;
  }

  const granted = finalStatus === 'granted';
  console.log('[Notifications] Permission status:', finalStatus);

  return granted;
}

/**
 * Register for push notifications and send token to backend
 * @returns Push token string or null if failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('[Notifications] Registering for push...');

  if (!Device.isDevice) {
    console.warn('[Notifications] Not a physical device');
    return null;
  }

  try {
    // Get device push token (NOT Expo push token)
    // This gives us the raw FCM/APNs token for direct backend integration
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = tokenResponse.data;
    const platform = Platform.OS as 'ios' | 'android';

    console.log('[Notifications] Got device token:', token.substring(0, 20) + '...');

    // Send token to backend
    await registerTokenWithBackend(token, platform);

    // Store locally for reference
    await storage.setItem('push_token', token);

    return token;
  } catch (error) {
    console.error('[Notifications] Failed to register:', error);
    return null;
  }
}

/**
 * Send push token to backend API
 */
async function registerTokenWithBackend(
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  try {
    await api.post('/api/push-notifications/register-token', {
      token,
      platform,
    });
    console.log('[Notifications] Token registered with backend');
  } catch (error) {
    console.error('[Notifications] Failed to register token with backend:', error);
    throw error;
  }
}

/**
 * Handle token refresh (called when FCM/APNs token changes)
 */
async function handleTokenRefresh(newToken: string): Promise<void> {
  console.log('[Notifications] Handling token refresh');

  const platform = Platform.OS as 'ios' | 'android';
  await registerTokenWithBackend(newToken, platform);
  await storage.setItem('push_token', newToken);
}

/**
 * Handle notification received while app is in foreground
 */
function handleForegroundNotification(
  notification: Notifications.Notification
): void {
  const data = notification.request.content.data as NotificationData;

  // Log for debugging
  console.log('[Notifications] Foreground notification type:', data?.type);

  // The notification will be shown automatically based on setNotificationHandler config
  // Add any additional foreground handling here (e.g., update badge count, refresh data)
}

/**
 * Handle user interaction with notification (tap)
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data as NotificationData;

  console.log('[Notifications] Response for type:', data?.type);

  // Navigate based on notification type
  // Note: Navigation must be handled by app component that has navigation context
  // Store the action for the app to handle
  if (data?.type && data?.member_id) {
    // Emit event or store in state for navigation handler
    pendingNotificationAction = {
      type: data.type,
      memberId: data.member_id,
    };
  }
}

// Store pending notification action for app to handle
interface PendingAction {
  type: string;
  memberId?: string;
}

let pendingNotificationAction: PendingAction | null = null;

/**
 * Get and clear pending notification action
 * Called by navigation handler after app is ready
 */
export function getPendingNotificationAction(): PendingAction | null {
  const action = pendingNotificationAction;
  pendingNotificationAction = null;
  return action;
}

/**
 * Check if notification caused app to open from quit state
 */
export async function getInitialNotification(): Promise<NotificationData | null> {
  const response = await Notifications.getLastNotificationResponseAsync();

  if (response) {
    return response.notification.request.content.data as NotificationData;
  }

  return null;
}

/**
 * Schedule a local notification (for check-in reminders)
 *
 * @param checkInTime - Time in HH:mm format (24-hour)
 * @param timezone - IANA timezone string
 * @param minutesBefore - Minutes before check-in to show reminder
 */
export async function scheduleCheckInReminder(
  checkInTime: string,
  timezone: string,
  minutesBefore: number
): Promise<string> {
  console.log('[Notifications] Scheduling check-in reminder:', {
    checkInTime,
    timezone,
    minutesBefore,
  });

  // Cancel existing reminders first
  await cancelCheckInReminder();

  // Parse check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Calculate reminder time
  let reminderHours = hours;
  let reminderMinutes = minutes - minutesBefore;

  // Handle minute underflow
  while (reminderMinutes < 0) {
    reminderMinutes += 60;
    reminderHours -= 1;
  }

  // Handle hour underflow (reminder before midnight for early morning check-in)
  if (reminderHours < 0) {
    reminderHours += 24;
  }

  // Schedule daily repeating notification
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to check in!',
      body: `Your check-in time is in ${minutesBefore} minutes. Tap to let your family know you're okay.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: {
        type: 'check_in_reminder',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHours,
      minute: reminderMinutes,
      channelId: 'reminders',
    },
  });

  console.log('[Notifications] Reminder scheduled with ID:', identifier);

  // Store identifier for later cancellation
  await storage.setItem('reminder_notification_id', identifier);

  return identifier;
}

/**
 * Cancel scheduled check-in reminder
 */
export async function cancelCheckInReminder(): Promise<void> {
  try {
    const existingId = await storage.getItem('reminder_notification_id');

    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await storage.removeItem('reminder_notification_id');
      console.log('[Notifications] Cancelled reminder:', existingId);
    }
  } catch (error) {
    console.error('[Notifications] Error cancelling reminder:', error);
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] All scheduled notifications cancelled');
}

/**
 * Set badge count (iOS only)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Cleanup function to remove listeners
 * Call when app is closing
 */
export function cleanup(): void {
  if (notificationListenerSubscription) {
    notificationListenerSubscription.remove();
  }
  if (responseListenerSubscription) {
    responseListenerSubscription.remove();
  }
  if (tokenRefreshSubscription) {
    tokenRefreshSubscription.remove();
  }
}
```

**Verification:**
- [ ] File compiles without TypeScript errors
- [ ] All imports resolve correctly

#### Step 3.2: Update Storage Service for Notification IDs (1 hour)

**What:** Add notification-related storage keys to storage service.

**File:** `src/services/storage.ts`

**Add to KEYS constant:**
```typescript
const KEYS = {
  ACCESS_TOKEN: 'pruuf_access_token',
  REFRESH_TOKEN: 'pruuf_refresh_token',
  USER: 'pruuf_user',
  FONT_SIZE: 'pruuf_font_size',
  PUSH_TOKEN: 'pruuf_push_token',           // NEW
  REMINDER_NOTIFICATION_ID: 'pruuf_reminder_id', // NEW
};
```

#### Step 3.3: Update App.tsx Notification Integration (2 hours)

**What:** Integrate new notification service with app root.

**Updates Required:**

1. Import new notification functions
2. Call initialization on app start
3. Handle notification responses for navigation
4. Handle notification that opened app from quit state

**Key Integration Points:**

```typescript
// In AppContent component useEffect
useEffect(() => {
  const initializeApp = async () => {
    // Initialize auth
    await dispatch(initializeAuth());

    // Initialize notifications (UPDATED)
    await initializeNotifications();

    const granted = await requestNotificationPermissions();
    if (granted) {
      await registerForPushNotifications();
    }

    // Check if notification opened app from quit state
    const initialNotification = await getInitialNotification();
    if (initialNotification) {
      handleInitialNotification(initialNotification);
    }

    // Initialize analytics
    initializeAnalytics();
  };

  initializeApp();
}, [dispatch]);

// Add notification response handler
const handleInitialNotification = (data: NotificationData) => {
  // Defer navigation until navigator is ready
  if (data.type === 'missed_check_in' && data.member_id) {
    // Navigate to member detail
    // This must wait for navigation to be ready
  }
};
```

#### Step 3.4: Configure Backend for Device Tokens (2 hours)

**What:** Ensure backend accepts device push tokens (not Expo push tokens).

**Backend Endpoint:** `POST /api/push-notifications/register-token`

**Current Expected Format:**
```json
{
  "token": "device_fcm_or_apns_token_string",
  "platform": "ios" | "android"
}
```

**No Backend Changes Required If:**
- Backend already sends to FCM/APNs directly
- Backend stores raw device tokens

**Backend Changes Required If:**
- Backend expects Expo push tokens (ExponentPushToken[xxx])
- Backend uses Expo push notification service

**Verification Query:**
```sql
-- Check current token format in database
SELECT token, platform, created_at
FROM push_notification_tokens
WHERE user_id = 'test-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

#### Step 3.5: Test Push Notification Flow (4 hours)

**What:** Comprehensive testing of push notification delivery.

**Test Environment Requirements:**
- Physical iOS device with valid provisioning
- Physical Android device with Google Play Services
- Backend running with access to FCM/APNs credentials
- Test user accounts (Contact and Member)

**Test Scenarios:**

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Token Registration | Launch app, grant permissions | Token sent to backend |
| Foreground Notification | Send test push while app open | Banner displays, sound plays |
| Background Notification | Send push while app backgrounded | System notification appears |
| Notification Tap (Background) | Tap notification from background | App opens, navigates correctly |
| Notification Tap (Quit) | Tap notification when app closed | App opens, navigates correctly |
| Token Refresh | Force token refresh | New token sent to backend |
| Permission Denied | Deny permissions | Graceful fallback, no crash |

**Test Push Command (Backend):**
```bash
# Send test notification via backend
curl -X POST https://api.pruuf.life/api/push-notifications/send-test \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "title": "Test Notification",
    "body": "This is a test from migration testing"
  }'
```

#### Step 3.6: Test Local Notification Scheduling (3 hours)

**What:** Test check-in reminder scheduling.

**Test Scenarios:**

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Schedule Reminder | Set 10:00 AM check-in, 60 min reminder | Notification at 9:00 AM next day |
| Cancel Reminder | Disable reminders in settings | No notification fires |
| Update Reminder Time | Change from 10 AM to 2 PM | Old reminder cancelled, new at 1 PM |
| Timezone Change | Change device timezone | Reminder adjusts to new timezone |
| App Update | Update app via OTA | Reminder persists |

**Debug Command:**
```typescript
// Add temporary debug function to check scheduled notifications
const scheduled = await getScheduledNotifications();
console.log('Scheduled notifications:', scheduled);
```

### 7.4 Phase 3 Completion Checklist

| Checkpoint | Verification Method | Expected Result |
|------------|---------------------|-----------------|
| New notification service created | File review | Complete implementation |
| Android channels configured | Device settings | 3 channels visible |
| Push token registration | Backend logs | Token stored |
| Foreground notification | Manual test | Banner displays |
| Background notification | Manual test | System notification |
| Notification tap navigation | Manual test | Correct screen opens |
| Local reminder scheduling | Set and wait | Notification fires on time |
| Permission denied handling | Deny and test | No crash, graceful fallback |

### 7.5 Phase 3 Rollback Procedure

If Phase 3 fails critically:

```bash
# Revert notification service
git checkout src/services/notifications.ts
git checkout src/services/notificationService.ts

# Reinstall Firebase packages
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-push-notification

# Rebuild development client
eas build --profile development --platform all
```

---

## 8. PHASE 4: STORAGE & SECURITY MIGRATION (8-10 Hours)

### 8.1 Phase Objectives

- Migrate from react-native-encrypted-storage to expo-secure-store
- Preserve existing stored data during migration
- Validate encryption security
- Test storage operations across app restarts
- Handle 2KB iOS limitation

### 8.2 Step-by-Step Instructions

#### Step 4.1: Update Storage Service (4 hours)

**What:** Replace encrypted storage implementation with expo-secure-store.

**File:** `src/services/storage.ts` (REPLACE)

**New Implementation:**

```typescript
/**
 * Secure Storage Service
 * Uses expo-secure-store for encrypted storage on iOS Keychain / Android Keystore
 *
 * IMPORTANT: iOS has a 2KB limit per key. JWT tokens are typically <1KB.
 *
 * @module storage
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserProfile } from '../types';

const KEYS = {
  ACCESS_TOKEN: 'pruuf_access_token',
  REFRESH_TOKEN: 'pruuf_refresh_token',
  USER: 'pruuf_user',
  FONT_SIZE: 'pruuf_font_size',
  PUSH_TOKEN: 'pruuf_push_token',
  REMINDER_NOTIFICATION_ID: 'pruuf_reminder_id',
};

// SecureStore options for enhanced security
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Check if value size is within iOS limit
 * @param value - String value to check
 * @returns true if within limit (2048 bytes)
 */
function checkSizeLimit(value: string): boolean {
  if (Platform.OS === 'ios') {
    const bytes = new Blob([value]).size;
    if (bytes > 2048) {
      console.warn(`[Storage] Value exceeds iOS 2KB limit: ${bytes} bytes`);
      return false;
    }
  }
  return true;
}

export const storage = {
  // Generic methods
  async setItem(key: string, value: string): Promise<void> {
    if (!checkSizeLimit(value)) {
      throw new Error(`Value too large for secure storage (${key})`);
    }
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  },

  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  },

  // Access Token
  async setAccessToken(token: string): Promise<void> {
    if (!checkSizeLimit(token)) {
      throw new Error('Access token too large for secure storage');
    }
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token, SECURE_OPTIONS);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN, SECURE_OPTIONS);
  },

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN, SECURE_OPTIONS);
  },

  // Refresh Token
  async setRefreshToken(token: string): Promise<void> {
    if (!checkSizeLimit(token)) {
      throw new Error('Refresh token too large for secure storage');
    }
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token, SECURE_OPTIONS);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN, SECURE_OPTIONS);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN, SECURE_OPTIONS);
  },

  // Set both tokens at once
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    // Validate sizes before storing
    if (!checkSizeLimit(accessToken) || !checkSizeLimit(refreshToken)) {
      throw new Error('Token(s) too large for secure storage');
    }

    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken, SECURE_OPTIONS),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken, SECURE_OPTIONS),
    ]);
  },

  // User Profile
  async setUser(user: UserProfile): Promise<void> {
    const serialized = JSON.stringify(user);
    if (!checkSizeLimit(serialized)) {
      console.warn('[Storage] User profile too large, storing minimal data');
      // Store minimal user data if full profile too large
      const minimalUser = {
        id: user.id,
        email: user.email,
        is_member: user.is_member,
        account_status: user.account_status,
      };
      await SecureStore.setItemAsync(
        KEYS.USER,
        JSON.stringify(minimalUser),
        SECURE_OPTIONS
      );
      return;
    }
    await SecureStore.setItemAsync(KEYS.USER, serialized, SECURE_OPTIONS);
  },

  async getUser(): Promise<UserProfile | null> {
    const data = await SecureStore.getItemAsync(KEYS.USER, SECURE_OPTIONS);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.USER, SECURE_OPTIONS);
  },

  // Font Size Preference
  async setFontSize(size: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.FONT_SIZE, size, SECURE_OPTIONS);
  },

  async getFontSize(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.FONT_SIZE, SECURE_OPTIONS);
  },

  // Push Token
  async setPushToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.PUSH_TOKEN, token, SECURE_OPTIONS);
  },

  async getPushToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.PUSH_TOKEN, SECURE_OPTIONS);
  },

  // Reminder Notification ID
  async setReminderNotificationId(id: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REMINDER_NOTIFICATION_ID, id, SECURE_OPTIONS);
  },

  async getReminderNotificationId(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.REMINDER_NOTIFICATION_ID, SECURE_OPTIONS);
  },

  async removeReminderNotificationId(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.REMINDER_NOTIFICATION_ID, SECURE_OPTIONS);
  },

  // Clear all (must delete keys individually - no bulk clear in expo-secure-store)
  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(KEYS.USER, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(KEYS.FONT_SIZE, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(KEYS.PUSH_TOKEN, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(KEYS.REMINDER_NOTIFICATION_ID, SECURE_OPTIONS),
    ]);
  },

  // Check if storage is available
  async isAvailable(): Promise<boolean> {
    return await SecureStore.isAvailableAsync();
  },
};
```

**Key Differences from Old Implementation:**

| Aspect | Old (react-native-encrypted-storage) | New (expo-secure-store) |
|--------|--------------------------------------|------------------------|
| Set method | `setItem(key, value)` | `setItemAsync(key, value)` |
| Get method | `getItem(key)` | `getItemAsync(key)` |
| Remove method | `removeItem(key)` | `deleteItemAsync(key)` |
| Clear all | `clear()` | Must delete individually |
| Size limit | None | 2KB on iOS |
| Security | AES-256 | iOS Keychain / Android Keystore |

#### Step 4.2: Data Migration Strategy (2 hours)

**What:** Migrate existing stored data from old storage to new storage.

**Challenge:** Old app may have existing users with stored tokens. We need to migrate their data.

**Migration Approach:**

Since both storage solutions use the same underlying secure storage (iOS Keychain, Android Keystore), the data should persist if:
1. Keys are identical
2. No app uninstall occurs

**Migration Code (Add to App.tsx initialization):**

```typescript
/**
 * Migrate storage from old format if needed
 * This runs once on app update
 */
async function migrateStorageIfNeeded(): Promise<void> {
  const MIGRATION_KEY = 'storage_migrated_v1';

  try {
    // Check if migration already done
    const migrated = await storage.getItem(MIGRATION_KEY);
    if (migrated === 'true') {
      return;
    }

    console.log('[Storage] Checking for data migration...');

    // The data should already be accessible since both libraries
    // use the same underlying secure storage. Just verify access.
    const accessToken = await storage.getAccessToken();
    const user = await storage.getUser();

    if (accessToken) {
      console.log('[Storage] Existing access token found, migration not needed');
    }

    if (user) {
      console.log('[Storage] Existing user found, migration not needed');
    }

    // Mark migration as complete
    await storage.setItem(MIGRATION_KEY, 'true');
    console.log('[Storage] Migration check complete');

  } catch (error) {
    console.error('[Storage] Migration error:', error);
    // Don't fail app startup on migration error
    // User may need to re-login
  }
}
```

#### Step 4.3: Test Storage Operations (2 hours)

**What:** Comprehensive testing of all storage operations.

**Test Cases:**

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Store and retrieve token | `setAccessToken('test')`, `getAccessToken()` | Returns 'test' |
| Store large user object | Store user with all fields | Success on Android, may warn on iOS |
| Remove token | `removeAccessToken()`, `getAccessToken()` | Returns null |
| Clear all | `clearAll()`, check all keys | All return null |
| Persist across restart | Store, force close app, reopen | Data persists |
| Size limit check | Store >2KB string on iOS | Throws error |

**Test Script:**

```typescript
// Temporary test function - remove after verification
async function testStorage(): Promise<void> {
  console.log('[Storage Test] Starting...');

  // Test token storage
  await storage.setAccessToken('test_token_12345');
  const token = await storage.getAccessToken();
  console.assert(token === 'test_token_12345', 'Token storage failed');

  // Test user storage
  const testUser: UserProfile = {
    id: 'test-id',
    email: 'test@example.com',
    is_member: true,
    account_status: 'active',
    font_size_preference: 'standard',
    created_at: new Date().toISOString(),
  };
  await storage.setUser(testUser);
  const user = await storage.getUser();
  console.assert(user?.id === 'test-id', 'User storage failed');

  // Test removal
  await storage.removeAccessToken();
  const removedToken = await storage.getAccessToken();
  console.assert(removedToken === null, 'Token removal failed');

  // Clean up
  await storage.clearAll();

  console.log('[Storage Test] All tests passed!');
}
```

### 8.3 Phase 4 Completion Checklist

| Checkpoint | Verification Method | Expected Result |
|------------|---------------------|-----------------|
| Storage service updated | File review | Uses expo-secure-store |
| Size limit checking | Code review | Warns on >2KB |
| Token storage works | Manual test | Token persists |
| User storage works | Manual test | User object persists |
| Clear all works | Manual test | All keys deleted |
| Persist across restart | Kill and reopen app | Data persists |
| Migration runs | Check logs on first launch | Migration message logged |

### 8.4 Phase 4 Rollback Procedure

If Phase 4 fails:

```bash
# Revert storage service
git checkout src/services/storage.ts

# Reinstall old package
npm install react-native-encrypted-storage

# Users may need to re-login after rollback
```

---

## 9. PHASE 5: BUILD & DEPLOYMENT SETUP (8-12 Hours)

### 9.1 Phase Objectives

- Configure EAS Build for iOS and Android
- Set up EAS Submit for app store deployment
- Configure EAS Update for OTA updates
- Create CI/CD pipeline with GitHub Actions
- Verify builds complete successfully
- Test OTA update deployment

### 9.2 Step-by-Step Instructions

#### Step 5.1: Initialize EAS Project (1 hour)

**What:** Link project to Expo Application Services.

**Commands:**
```bash
# Login to EAS
eas login

# Initialize project (creates EAS project ID)
eas build:configure

# Verify configuration
eas project:info
```

**Verification:**
- [ ] EAS project ID in app.json `extra.eas.projectId`
- [ ] `eas project:info` shows correct project

#### Step 5.2: Configure iOS Build (2 hours)

**What:** Set up iOS provisioning and certificates.

**Requirements:**
- Apple Developer account (paid membership)
- App Store Connect app created (if new app)
- Bundle identifier registered

**Commands:**
```bash
# Configure iOS credentials
eas credentials --platform ios

# Follow prompts to:
# 1. Select "Build Credentials"
# 2. Let EAS manage certificates and provisioning profiles
# 3. OR upload existing .p12 and provisioning profile
```

**For Push Notifications:**
```bash
# EAS will prompt for APNs key during credential setup
# Or manually configure:
# 1. Create APNs Key in Apple Developer Portal
# 2. Upload to EAS via credentials manager
```

**Verification:**
- [ ] `eas credentials --platform ios` shows valid credentials
- [ ] APNs key configured for push notifications

#### Step 5.3: Configure Android Build (2 hours)

**What:** Set up Android keystore and Google Play credentials.

**Commands:**
```bash
# Configure Android credentials
eas credentials --platform android

# Follow prompts to:
# 1. Generate new keystore OR
# 2. Upload existing keystore
```

**For Google Play Submission:**
```bash
# Create service account in Google Cloud Console
# 1. Go to Google Cloud Console
# 2. Create service account with "Service Account User" role
# 3. Download JSON key file
# 4. In Google Play Console, grant access to service account
# 5. Place JSON file at ./google-play-service-account.json
```

**For Firebase (Push Notifications):**
```bash
# Get google-services.json from Firebase Console
# 1. Go to Firebase Console > Project Settings > General
# 2. Download google-services.json
# 3. Place at ./google-services.json
```

**Verification:**
- [ ] `eas credentials --platform android` shows valid keystore
- [ ] `google-services.json` present in project root
- [ ] `google-play-service-account.json` present for submissions

#### Step 5.4: Run First Build (2 hours)

**What:** Execute builds for both platforms to verify configuration.

**Development Build (for testing):**
```bash
# Build for both platforms
eas build --profile development --platform all

# Or individually:
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Expected Timeline:**
- iOS build: 15-30 minutes
- Android build: 10-20 minutes

**Monitoring:**
```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

**Verification:**
- [ ] iOS build completes with status "finished"
- [ ] Android build completes with status "finished"
- [ ] Build artifacts downloadable from EAS dashboard

#### Step 5.5: Install and Test Development Build (1 hour)

**What:** Install development builds on physical devices.

**iOS:**
```bash
# Use EAS to create install link
eas build:run --platform ios

# Or download IPA from EAS dashboard
# Install via:
# - Apple Configurator 2
# - Diawi.com
# - Internal distribution via EAS
```

**Android:**
```bash
# Download APK from EAS dashboard
# Or use ADB:
adb install path/to/app.apk

# Or use EAS:
eas build:run --platform android
```

**Verification:**
- [ ] App launches on iOS device
- [ ] App launches on Android device
- [ ] All features functional (login, check-in, notifications)

#### Step 5.6: Configure EAS Update (1 hour)

**What:** Set up OTA updates for JavaScript-only changes.

**Commands:**
```bash
# Create update
eas update --branch production --message "Initial migration release"

# For development testing:
eas update --branch development --message "Development test"
```

**app.json Configuration (already added in Phase 1):**
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

**Verification:**
- [ ] Update uploads successfully
- [ ] App shows update available on restart
- [ ] Update installs and applies

#### Step 5.7: Set Up CI/CD with GitHub Actions (2 hours)

**What:** Automate builds on code push.

**File:** `.github/workflows/eas-build.yml`

```yaml
name: EAS Build

on:
  push:
    branches:
      - main
      - 'release/*'
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Run TypeScript check
        run: npx tsc --noEmit

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build preview (PR only)
        if: github.event_name == 'pull_request'
        run: eas build --profile preview --platform all --non-interactive

      - name: Build production (main branch)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: eas build --profile production --platform all --non-interactive
```

**File:** `.github/workflows/eas-update.yml`

```yaml
name: EAS Update

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'assets/**'
      - 'App.tsx'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish OTA update
        run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

**GitHub Secrets Required:**
- `EXPO_TOKEN`: Generate at https://expo.dev/accounts/[username]/settings/access-tokens

**Verification:**
- [ ] GitHub Action runs on push
- [ ] TypeScript and lint checks pass
- [ ] Build triggers for main branch
- [ ] OTA update publishes on JavaScript changes

### 9.3 Phase 5 Completion Checklist

| Checkpoint | Verification Method | Expected Result |
|------------|---------------------|-----------------|
| EAS project initialized | `eas project:info` | Shows project ID |
| iOS credentials configured | `eas credentials --platform ios` | Valid credentials |
| Android credentials configured | `eas credentials --platform android` | Valid keystore |
| iOS build successful | EAS dashboard | Build status: finished |
| Android build successful | EAS dashboard | Build status: finished |
| Development build installs | Physical device | App launches |
| OTA update works | Publish and test | App updates |
| CI/CD configured | GitHub Actions | Workflows run |

### 9.4 Phase 5 Rollback Procedure

If Phase 5 fails:

```bash
# Builds are non-destructive - existing app store builds remain
# To delete EAS project:
eas project:delete (WARNING: irreversible)

# To continue with bare React Native:
# Restore ios/ and android/ directories from backup
git checkout pre-expo-migration -- ios/ android/
```

---

## 10. PHASE 6: TESTING & VALIDATION (12-16 Hours)

### 10.1 Phase Objectives

- Execute all critical path tests
- Verify notification delivery end-to-end
- Validate storage and authentication
- Test payment flows
- Verify accessibility compliance
- Document any issues found
- Sign off on migration completion

### 10.2 Test Categories

#### 10.2.1 Critical Path Tests (4 hours)

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|-----------------|--------|
| CP-001 | Contact Registration | 1. Launch app 2. Enter email 3. Verify via email 4. Create PIN 5. Confirm PIN 6. Select font size 7. See trial welcome | Account created, dashboard shown | [ ] |
| CP-002 | Member Registration | 1. Launch app 2. Enter email 3. Verify via email 4. Create PIN 5. Enter invite code 6. Set check-in time | Connected to Contact, dashboard shown | [ ] |
| CP-003 | Daily Check-in | 1. As Member, tap "I'm OK" 2. Verify confirmation | Check-in recorded, Contacts notified | [ ] |
| CP-004 | Missed Check-in Alert | 1. Let deadline pass without check-in 2. Wait for alert | Contacts receive push + email | [ ] |
| CP-005 | Late Check-in | 1. Check in after deadline | Status shows "late", update sent | [ ] |
| CP-006 | Payment Flow | 1. Navigate to subscription screen 2. View pricing info | Payment UI displays correctly ($3.99/month) | [ ] |
| CP-007 | App Restart | 1. Login 2. Force close 3. Reopen | Stays logged in | [ ] |
| CP-008 | Deep Link | 1. Click email verification link | App opens to correct screen | [ ] |

#### 10.2.2 Notification Tests (4 hours)

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|-----------------|--------|
| NF-001 | Push Permission | 1. Fresh install 2. Proceed through onboarding | Permission prompt shown | [ ] |
| NF-002 | Token Registration | 1. Grant permissions | Token sent to backend | [ ] |
| NF-003 | Foreground Push | 1. Keep app open 2. Trigger push from backend | Banner displays | [ ] |
| NF-004 | Background Push | 1. Background app 2. Trigger push | System notification appears | [ ] |
| NF-005 | Quit State Push | 1. Force close app 2. Trigger push | System notification appears | [ ] |
| NF-006 | Notification Tap | 1. Tap notification | App navigates to correct screen | [ ] |
| NF-007 | Local Reminder | 1. Set reminder 2. Wait for trigger time | Reminder fires | [ ] |
| NF-008 | Cancel Reminder | 1. Disable reminders | No notification fires | [ ] |
| NF-009 | Android Channel | 1. Check device settings | Channels visible and configurable | [ ] |
| NF-010 | iOS Critical Alert | 1. Trigger missed check-in | Alert bypasses DND | [ ] |

#### 10.2.3 Storage Tests (2 hours)

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|-----------------|--------|
| ST-001 | Token Persistence | 1. Login 2. Restart app | Token restored, stays logged in | [ ] |
| ST-002 | User Profile Storage | 1. Login 2. Restart 3. Check profile | Profile data intact | [ ] |
| ST-003 | Font Size Preference | 1. Change font size 2. Restart | Setting persists | [ ] |
| ST-004 | Logout Clear | 1. Logout | All secure data cleared | [ ] |
| ST-005 | Large Data Warning | 1. Store >2KB on iOS | Warning logged, graceful handling | [ ] |

#### 10.2.4 Payment UI Tests (1 hour)

**NOTE:** Payment processing via RevenueCat deferred to post-launch. These tests verify UI only.

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|-----------------|--------|
| PM-001 | Subscription Card Display | 1. Navigate to subscription screen | Shows pricing ($3.99/month), trial info | [ ] |
| PM-002 | Trial Status Display | 1. Login with trial account | Shows "Free Trial" badge, days remaining | [ ] |
| PM-003 | Active Status Display | 1. Login with active account (mock) | Shows "Active Subscription" badge | [ ] |
| PM-004 | Expired Status Display | 1. Login with expired account (mock) | Shows "Expired" badge, resubscribe CTA | [ ] |
| PM-005 | Payment Button (Placeholder) | 1. Tap "Subscribe" button | Shows "Coming Soon" or placeholder UI | [ ] |

#### 10.2.5 Accessibility Tests (2 hours)

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|-----------------|--------|
| AC-001 | Touch Targets | 1. Measure all interactive elements | All ≥60pt | [ ] |
| AC-002 | VoiceOver | 1. Enable VoiceOver 2. Navigate all screens | All elements have labels | [ ] |
| AC-003 | TalkBack | 1. Enable TalkBack 2. Navigate all screens | All elements have labels | [ ] |
| AC-004 | Font Scaling | 1. Set font to Extra Large 2. Check all screens | No text truncation issues | [ ] |
| AC-005 | Color Contrast | 1. Use contrast checker | All text meets AA | [ ] |
| AC-006 | Screen Reader Button | 1. Use VoiceOver on "I'm OK" button | Reads "I'm OK button, double tap to check in" | [ ] |

#### 10.2.6 Platform-Specific Tests (2 hours)

| Test ID | Platform | Description | Expected Result | Status |
|---------|----------|-------------|-----------------|--------|
| iOS-001 | iOS | Build and run on simulator | App runs | [ ] |
| iOS-002 | iOS | Build and run on device | App runs | [ ] |
| iOS-003 | iOS | Push notifications | Notifications delivered | [ ] |
| iOS-004 | iOS | App backgrounding | No crash | [ ] |
| iOS-005 | iOS | App termination | State preserved | [ ] |
| AND-001 | Android | Build and run on emulator | App runs | [ ] |
| AND-002 | Android | Build and run on device | App runs | [ ] |
| AND-003 | Android | Push notifications | Notifications delivered | [ ] |
| AND-004 | Android | App backgrounding | No crash | [ ] |
| AND-005 | Android | App termination | State preserved | [ ] |

### 10.3 Test Execution Protocol

1. **Create Test User Accounts:**
   - Contact test account: `test-contact@pruuf.life`
   - Member test account: `test-member@pruuf.life`

2. **Test Environment:**
   - Backend: Staging environment
   - Payments: RevenueCat (post-launch) - UI-only testing during migration
   - Firebase: Development project

3. **Test Devices:**
   - iOS: Physical iPhone (iOS 14+)
   - Android: Physical device with Google Play Services (Android 10+)

4. **Payment Testing (Post-Launch with RevenueCat):**
   - RevenueCat Sandbox mode for iOS
   - Google Play Console test track for Android
   - Use sandbox test accounts (not real cards during migration)

5. **Test Recording:**
   - Video record critical tests
   - Screenshot any failures
   - Log exact steps to reproduce issues

### 10.4 Phase 6 Completion Checklist

| Checkpoint | Passing Criteria | Status |
|------------|------------------|--------|
| Critical Path Tests | 8/8 passing | [ ] |
| Notification Tests | 10/10 passing | [ ] |
| Storage Tests | 5/5 passing | [ ] |
| Payment Tests | 5/5 passing | [ ] |
| Accessibility Tests | 6/6 passing | [ ] |
| Platform Tests | 10/10 passing | [ ] |
| Zero Critical Bugs | No blockers | [ ] |
| Performance Baseline | <3s cold start | [ ] |

### 10.5 Sign-Off Requirements

Migration is approved when:

- [ ] All critical path tests pass
- [ ] All notification tests pass
- [ ] All storage tests pass
- [ ] All payment tests pass
- [ ] All accessibility tests pass
- [ ] All platform tests pass
- [ ] No critical or high-severity bugs remain
- [ ] Performance meets baseline requirements
- [ ] Security validation passes (see next section)

---

## 11. FILE-BY-FILE CHANGE MANIFEST

### 11.1 Files to Create (New)

| File Path | Purpose | Created In |
|-----------|---------|------------|
| `app.json` | Expo configuration | Phase 1 |
| `eas.json` | EAS Build configuration | Phase 1 |
| `metro.config.js` | Metro bundler config | Phase 1 |
| `babel.config.js` | Babel configuration | Phase 1 |
| `src/services/haptics.ts` | Haptics wrapper | Phase 2 |
| `assets/icon.png` | App icon | Phase 1 |
| `assets/splash.png` | Splash screen | Phase 1 |
| `assets/adaptive-icon.png` | Android adaptive icon | Phase 1 |
| `assets/notification-icon.png` | Android notification icon | Phase 1 |
| `.github/workflows/eas-build.yml` | CI/CD for builds | Phase 5 |
| `.github/workflows/eas-update.yml` | CI/CD for OTA | Phase 5 |
| `google-services.json` | Firebase Android config | Phase 5 |

### 11.2 Files to Modify

| File Path | Changes | Phase |
|-----------|---------|-------|
| `package.json` | Remove old deps, add Expo deps, update scripts | Phase 1 |
| `tsconfig.json` | Extend Expo base config | Phase 1 |
| `App.tsx` | Expo imports, splash screen, notification setup | Phase 2 |
| `src/services/notifications.ts` | **Complete rewrite** for expo-notifications | Phase 3 |
| `src/services/storage.ts` | **Complete rewrite** for expo-secure-store | Phase 4 |
| `src/services/deepLinkService.ts` | Update for Expo Linking | Phase 2 |
| `src/components/CheckInButton.tsx` | Add haptics import | Phase 2 |
| All files with vector icons | Update imports | Phase 2 |

### 11.3 Files to Delete

| File/Directory | Reason |
|----------------|--------|
| `ios/` | EAS Build manages iOS project |
| `android/` | EAS Build manages Android project |
| `index.js` | Expo uses App.tsx directly |
| `.buckconfig` | Not needed with Expo |
| `Gemfile` | Not needed with Expo |
| `src/services/notificationService.ts` | Merged into notifications.ts |

### 11.4 Unchanged Files

| Category | Files |
|----------|-------|
| Components | All in `src/components/` (except icon imports) |
| Screens | All in `src/screens/` |
| Navigation | All in `src/navigation/` |
| Redux Store | All in `src/store/` |
| API Service | `src/services/api.ts` |
| Supabase | `src/services/supabase.ts` |
| Analytics | `src/services/analyticsService.ts` |
| Theme | All in `src/theme/` |
| Types | All in `src/types/` |
| Utils | All in `src/utils/` |
| Constants | All in `src/constants/` |
| Hooks | All in `src/hooks/` |

---

## 12. INTEGRATION MIGRATION SPECIFICATIONS

### 12.1 Firebase Cloud Messaging Migration

**Old API → New API Mapping:**

| Old (Firebase) | New (Expo) | Notes |
|----------------|------------|-------|
| `messaging().requestPermission()` | `Notifications.requestPermissionsAsync()` | iOS options differ |
| `messaging().getToken()` | `Notifications.getDevicePushTokenAsync()` | Returns device token |
| `messaging().onMessage(handler)` | `Notifications.addNotificationReceivedListener(handler)` | Foreground only |
| `messaging().setBackgroundMessageHandler()` | `Notifications.setNotificationHandler()` | Different signature |
| `messaging().onNotificationOpenedApp()` | `Notifications.addNotificationResponseReceivedListener()` | |
| `messaging().getInitialNotification()` | `Notifications.getLastNotificationResponseAsync()` | |
| `messaging().onTokenRefresh()` | `Notifications.addPushTokenListener()` | |

### 12.2 Storage Migration

**Old API → New API Mapping:**

| Old (EncryptedStorage) | New (SecureStore) | Notes |
|------------------------|-------------------|-------|
| `setItem(key, value)` | `setItemAsync(key, value, options)` | Async naming |
| `getItem(key)` | `getItemAsync(key, options)` | Async naming |
| `removeItem(key)` | `deleteItemAsync(key, options)` | Different name |
| `clear()` | N/A - delete individually | No bulk clear |

### 12.3 Payment Integration (RevenueCat - POST-LAUNCH)

**IMPORTANT:** Payment integration is NOT part of the Expo migration. See Section 1.5 for rationale.

#### During Expo Migration (NOW)

1. **Remove Stripe SDK entirely:**
   ```bash
   npm uninstall @stripe/stripe-react-native
   ```

2. **Remove StripeProvider from App.tsx:**
   - Delete import statement
   - Remove provider wrapper from JSX tree

3. **Keep subscription UI components:**
   - `SubscriptionCard.tsx` - displays status
   - Payment screens - show placeholder or "Coming Soon"

4. **Update pricing displays to $3.99/month:**
   - All UI should reference correct pricing
   - Trial period: 30 days free

#### Post-Launch Integration (FUTURE)

When ready to add payments, follow these steps:

1. **Install RevenueCat SDK:**
   ```bash
   npx expo install react-native-purchases
   ```

2. **Configure app.json:**
   ```json
   {
     "plugins": [
       "react-native-purchases"
     ]
   }
   ```

3. **Initialize RevenueCat in App.tsx:**
   ```typescript
   import Purchases from 'react-native-purchases';

   // In useEffect on app launch:
   Purchases.configure({
     apiKey: Platform.OS === 'ios'
       ? 'appl_YOUR_IOS_KEY'
       : 'goog_YOUR_ANDROID_KEY'
   });
   ```

4. **Configure in App Store Connect:**
   - Create In-App Purchase product ($3.99/month subscription)
   - Configure subscription group
   - Set up sandbox test accounts

5. **Configure in Google Play Console:**
   - Create subscription product ($3.99/month)
   - Configure test tracks

6. **Set up RevenueCat webhooks:**
   - Configure webhook URL in RevenueCat dashboard
   - Handle events in Supabase Edge Functions:
     - `INITIAL_PURCHASE` → Update user to 'active'
     - `RENEWAL` → Extend subscription
     - `CANCELLATION` → Set cancel_at_period_end
     - `EXPIRATION` → Update user to 'expired'

7. **Implement purchase flow:**
   ```typescript
   const purchaseSubscription = async () => {
     try {
       const offerings = await Purchases.getOfferings();
       const package = offerings.current?.monthly;
       if (package) {
         const { customerInfo } = await Purchases.purchasePackage(package);
         // Update local state based on customerInfo
       }
     } catch (error) {
       // Handle purchase error
     }
   };
   ```

### 12.4 Deep Linking Migration

**Old Configuration → New Configuration:**

| Aspect | Old (Manual) | New (Expo) |
|--------|--------------|------------|
| iOS URL Schemes | Info.plist | app.json `scheme` |
| Android URL Schemes | AndroidManifest.xml | app.json `scheme` |
| Universal Links | apple-app-site-association | EAS handles |
| App Links | assetlinks.json | EAS handles |
| Handling | Manual parsing | `Linking.useURL()` hook |

**app.json configuration:**
```json
{
  "expo": {
    "scheme": "pruuf",
    "ios": {
      "associatedDomains": ["applinks:pruuf.life"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "pruuf.life",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 12.5 Expo Go Development Strategy

**Purpose:** Enable rapid UI development and testing without native builds.

#### Why Expo Go

1. **Instant Previews:** Scan QR code to view changes immediately
2. **No Xcode/Android Studio Required:** Develop on any machine
3. **Hot Reload:** See changes in <1 second
4. **Team Sharing:** Non-developers can preview on their devices

#### What Works in Expo Go

| Feature | Works in Expo Go | Notes |
|---------|-----------------|-------|
| All UI Components | ✅ | Full React Native support |
| Navigation | ✅ | React Navigation works fully |
| State Management | ✅ | Redux, React Query work fully |
| Animations | ✅ | Reanimated built into Expo Go |
| Secure Storage | ✅ | expo-secure-store included |
| Push Notifications | ⚠️ | Works with Expo Push Tokens only |
| Local Notifications | ✅ | expo-notifications included |
| Supabase/API Calls | ✅ | All network requests work |
| Deep Linking | ✅ | Expo scheme works |
| **Payments (RevenueCat)** | ❌ | Requires native build (post-launch) |

#### Development Workflow

1. **Start Development Server:**
   ```bash
   npx expo start
   ```

2. **View on Device:**
   - Install "Expo Go" from App Store / Play Store
   - Scan QR code displayed in terminal
   - App loads instantly

3. **Test UI Components:**
   - All screens render identically to production
   - Test full user flows (except payments)
   - Test account status UI with mock data

4. **When Native Build Needed:**
   - Push notification testing with FCM/APNs tokens
   - Payment integration (RevenueCat - post-launch)
   - Final pre-submission testing

#### Creating EAS Development Build (When Needed)

For features requiring native code:

```bash
# Create development build for iOS simulator
eas build --profile development --platform ios

# Create development build for Android emulator
eas build --profile development --platform android

# Create development build for physical device
eas build --profile development --platform all
```

Install the development build, then connect to the same dev server as Expo Go.

---

## 13. TESTING STRATEGY & TEST CASES

### 13.1 Unit Test Requirements

**Notification Service Tests:**
```typescript
// __tests__/services/notifications.test.ts
describe('Notification Service', () => {
  test('requestPermissions returns boolean', async () => {
    const result = await requestNotificationPermissions();
    expect(typeof result).toBe('boolean');
  });

  test('scheduleCheckInReminder returns identifier', async () => {
    const id = await scheduleCheckInReminder('10:00', 'America/Los_Angeles', 60);
    expect(id).toBeTruthy();
  });

  test('cancelCheckInReminder removes scheduled notification', async () => {
    await scheduleCheckInReminder('10:00', 'America/Los_Angeles', 60);
    await cancelCheckInReminder();
    const scheduled = await getScheduledNotifications();
    expect(scheduled.length).toBe(0);
  });
});
```

**Storage Service Tests:**
```typescript
// __tests__/services/storage.test.ts
describe('Storage Service', () => {
  beforeEach(async () => {
    await storage.clearAll();
  });

  test('setAccessToken and getAccessToken', async () => {
    await storage.setAccessToken('test_token');
    const token = await storage.getAccessToken();
    expect(token).toBe('test_token');
  });

  test('setUser stores and retrieves user object', async () => {
    const user = { id: '123', email: 'test@test.com' };
    await storage.setUser(user);
    const retrieved = await storage.getUser();
    expect(retrieved?.id).toBe('123');
  });

  test('clearAll removes all data', async () => {
    await storage.setAccessToken('test');
    await storage.clearAll();
    const token = await storage.getAccessToken();
    expect(token).toBeNull();
  });
});
```

### 13.2 Integration Test Requirements

**Push Notification Integration Test:**
```typescript
// __tests__/integration/notifications.integration.test.ts
describe('Push Notification Integration', () => {
  test('registration flow sends token to backend', async () => {
    // Mock device environment
    jest.mock('expo-device', () => ({ isDevice: true }));

    // Mock notification permissions granted
    jest.mock('expo-notifications', () => ({
      requestPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
      getDevicePushTokenAsync: () => Promise.resolve({ data: 'mock_token' }),
    }));

    // Mock API
    const apiMock = jest.spyOn(api, 'post').mockResolvedValue({ success: true });

    await registerForPushNotifications();

    expect(apiMock).toHaveBeenCalledWith(
      '/api/push-notifications/register-token',
      { token: 'mock_token', platform: expect.any(String) }
    );
  });
});
```

### 13.3 End-to-End Test Requirements

**Check-in Flow E2E Test:**
```typescript
// __tests__/e2e/checkin.e2e.test.ts
describe('Check-in Flow', () => {
  test('Member can complete daily check-in', async () => {
    // 1. Login as Member
    await device.launchApp();
    await element(by.id('email-input')).typeText('test-member@pruuf.life');
    await element(by.id('continue-button')).tap();
    // ... complete login flow

    // 2. Wait for dashboard
    await waitFor(element(by.id('check-in-button'))).toBeVisible().withTimeout(5000);

    // 3. Tap check-in button
    await element(by.id('check-in-button')).tap();

    // 4. Verify success state
    await waitFor(element(by.text('Checked In!'))).toBeVisible().withTimeout(3000);

    // 5. Verify button state changed
    await expect(element(by.id('check-in-button'))).toHaveText('Already Checked In');
  });
});
```

---

## 14. SECURITY VALIDATION CHECKLIST

### 14.1 Authentication Security

| Check | Description | Status |
|-------|-------------|--------|
| SEC-001 | PIN stored as bcrypt hash (never plain text) | [ ] |
| SEC-002 | JWT tokens stored in secure storage | [ ] |
| SEC-003 | Failed login lockout (5 attempts = 5 min) | [ ] |
| SEC-004 | Session tokens expire after 90 days | [ ] |
| SEC-005 | Refresh token rotation working | [ ] |

### 14.2 Data Protection

| Check | Description | Status |
|-------|-------------|--------|
| SEC-006 | All API calls use HTTPS | [ ] |
| SEC-007 | No sensitive data in logs | [ ] |
| SEC-008 | Secure storage uses iOS Keychain/Android Keystore | [ ] |
| SEC-009 | User data cleared on logout | [ ] |
| SEC-010 | No sensitive data in Redux state serialization | [ ] |

### 14.3 Push Notification Security

| Check | Description | Status |
|-------|-------------|--------|
| SEC-011 | Push tokens sent over HTTPS | [ ] |
| SEC-012 | No sensitive data in notification payload | [ ] |

### 14.4 Payment Security (RevenueCat - POST-LAUNCH)

**NOTE:** These checks apply when RevenueCat integration is added post-launch.

| Check | Description | Status |
|-------|-------------|--------|
| SEC-013 | RevenueCat API keys stored in environment variables (not hardcoded) | [ ] |
| SEC-014 | Receipt validation happens server-side via RevenueCat (not client-side) | [ ] |
| SEC-015 | Subscription status synced via webhooks (not client-trusted) | [ ] |
| SEC-016 | No sensitive payment info stored locally (RevenueCat handles) | [ ] |
| SEC-017 | Subscription entitlements verified on backend before granting access | [ ] |

---

## 15. ORCHESTRATOR COORDINATION PROTOCOL

### 15.1 Role Definition

The Orchestrator serves as the central coordination point for the migration project. Responsibilities include:

1. **Task Distribution:** Assign work packages to appropriate specialists
2. **Progress Tracking:** Monitor completion of each phase
3. **Blocker Resolution:** Identify and escalate blockers
4. **Quality Gates:** Enforce completion criteria before phase advancement
5. **Communication:** Provide regular status updates to stakeholders
6. **Risk Management:** Track risks and ensure mitigations are in place
7. **Decision Making:** Make technical decisions when specialists disagree

### 15.2 Daily Standup Format

**Time:** 9:00 AM daily during active migration
**Duration:** 15 minutes maximum
**Format:**

```
1. Phase Status (2 min)
   - Current phase: [Phase X]
   - Completion: [X%]
   - Target date: [Date]

2. Yesterday's Progress (3 min)
   - Completed tasks
   - Blocked tasks

3. Today's Focus (3 min)
   - Priority tasks
   - Required resources

4. Blockers (5 min)
   - Active blockers
   - Resolution plans
   - Escalations needed

5. Risks (2 min)
   - New risks identified
   - Risk status updates
```

### 15.3 Phase Gate Checklist

Before advancing to next phase, Orchestrator must verify:

| Gate | Requirements |
|------|--------------|
| Phase 1 → 2 | All Phase 1 checkpoints pass, `npx expo start` works |
| Phase 2 → 3 | All icons render, haptics work, no TypeScript errors |
| Phase 3 → 4 | Push notifications deliver on both platforms |
| Phase 4 → 5 | Storage tests pass, data persists across restarts |
| Phase 5 → 6 | Both platform builds complete successfully |
| Phase 6 → Done | All tests pass, no critical bugs |

### 15.4 Escalation Path

| Issue Severity | Response Time | Escalation To |
|----------------|---------------|---------------|
| Critical (app won't launch) | 1 hour | Project Owner + All Specialists |
| High (feature broken) | 4 hours | Lead Mobile Engineer |
| Medium (minor issue) | 1 day | Relevant Specialist |
| Low (cosmetic) | End of sprint | Backlog |

### 15.5 Communication Channels

| Purpose | Channel | Participants |
|---------|---------|--------------|
| Daily Updates | Slack #pruuf-migration | All team |
| Technical Discussions | GitHub Issues | Engineers |
| Blocker Escalations | Direct message | Orchestrator + Owner |
| Status Reports | Weekly email | Owner |

### 15.6 Documentation Requirements

The Orchestrator ensures these documents are maintained:

1. **Daily Log:** Brief summary of work completed
2. **Blocker Log:** All blockers with status
3. **Decision Log:** Technical decisions with rationale
4. **Test Results:** Test execution results by phase
5. **Migration Report:** Final summary document

---

## 16. RISK ASSESSMENT & MITIGATION

### 16.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-001 | Push notifications fail to deliver | Medium | Critical | Parallel testing with old system, backend token compatibility |
| R-002 | Storage data migration fails | Low | High | Data exists in same keychain, backup before migration |
| R-003 | Build fails on EAS | Low | Medium | Follow EAS documentation precisely, test on preview first |
| R-004 | Performance regression | Low | Medium | Benchmark before/after, 3-second cold start target |
| R-005 | Third-party API changes | Low | Medium | Pin dependency versions, test before upgrading |
| R-006 | iOS App Store rejection | Medium | High | Review guidelines, test all features before submission |
| R-007 | Android Play Store rejection | Low | Medium | Review policies, use official APIs |
| R-008 | Timeline overrun | Medium | Medium | Buffer time in estimate, prioritize critical path |
| R-009 | RevenueCat integration complexity (POST-LAUNCH) | Medium | High | Deferred to post-launch, use RevenueCat sandbox testing, follow official docs |
| R-010 | App Store IAP configuration issues (POST-LAUNCH) | Medium | Medium | Create IAP products early, test in sandbox before submission |

### 16.2 Contingency Plans

**If Push Notifications Fail:**
1. Keep react-native-firebase as backup
2. Backend supports both token formats
3. Can roll back notification service independently

**If Storage Migration Fails:**
1. Users re-authenticate (tokens regenerate)
2. No critical data loss (backend is source of truth)
3. User preferences can be re-selected

**If Build Fails:**
1. Review EAS logs for specific error
2. Consult Expo documentation
3. Contact Expo support (paid plan)
4. As last resort, continue with bare React Native

---

## 17. ROLLBACK PROCEDURES

### 17.1 Full Rollback (Return to React Native CLI)

**When to Use:** Critical failure in Phase 1-2 where Expo fundamentally doesn't work.

```bash
# 1. Restore from backup branch
git checkout pre-expo-migration
git branch -D expo-migration

# 2. Clean node_modules
rm -rf node_modules
npm install

# 3. Rebuild native projects
cd ios && pod install && cd ..

# 4. Test app launches
npx react-native run-ios
npx react-native run-android
```

### 17.2 Partial Rollback (Notification Service Only)

**When to Use:** Notification migration fails but rest of Expo works.

```bash
# 1. Revert notification service file
git checkout pre-expo-migration -- src/services/notifications.ts
git checkout pre-expo-migration -- src/services/notificationService.ts

# 2. Reinstall Firebase packages
npm install @react-native-firebase/app @react-native-firebase/messaging

# 3. Update app.json plugins to include Firebase
# 4. Rebuild development client
eas build --profile development --platform all
```

### 17.3 OTA Rollback (After Production Release)

**When to Use:** Bug discovered after OTA update deployed.

```bash
# 1. Identify last good update
eas update:list --branch production

# 2. Rollback to previous update
eas update:republish --group [previous-update-group-id]

# 3. Verify rollback
# Users will receive previous JavaScript bundle on next app restart
```

---

## 18. POST-MIGRATION VERIFICATION

### 18.1 Production Smoke Tests

After app store approval and release, verify:

| Test | Steps | Expected |
|------|-------|----------|
| Fresh Install | Download from store, complete onboarding | App works |
| Update Existing | Update from previous version | Data preserved |
| Push Notification | Send test push | Delivered |
| Check-in Flow | Complete daily check-in | Success, Contacts notified |
| Payment UI | Navigate to subscription screen | Displays correctly ($3.99/month, trial info) |

### 18.2 Monitoring Checklist

| Metric | Tool | Threshold |
|--------|------|-----------|
| Crash Rate | Sentry | <0.1% |
| API Errors | Backend logs | <1% |
| Push Delivery | Firebase Console | >95% |
| App Launch Time | Analytics | <3 seconds |
| User Reports | App Store reviews | Monitor |

### 18.3 Success Criteria

Migration is considered successful when:

1. [ ] App runs stably for 7 days post-release
2. [ ] Crash rate remains below 0.1%
3. [ ] Push notification delivery rate >95%
4. [ ] No critical user-reported issues
5. [ ] OTA update deploys successfully
6. [ ] All original functionality preserved

---

## 19. TIMELINE & MILESTONES

### 19.1 Recommended Schedule

| Day | Phase | Activities | Deliverable |
|-----|-------|------------|-------------|
| 1 | Prep | Environment setup, backups | Pre-migration branch |
| 2-3 | Phase 1 | Project foundation | Expo configured |
| 4-5 | Phase 2 | Dependencies migration | Icons, haptics working |
| 6-9 | Phase 3 | Notification migration | Push + local notifications |
| 10-11 | Phase 4 | Storage migration | Secure storage working |
| 12-13 | Phase 5 | Build setup | EAS builds successful |
| 14-16 | Phase 6 | Testing | All tests pass |
| 17 | Buffer | Issue resolution | Bugs fixed |
| 18 | Release | Submit to stores | Apps in review |

**Total Estimated Duration:** 18 working days (3.5 weeks)

### 19.2 Milestone Definitions

| Milestone | Definition | Date |
|-----------|------------|------|
| M1: Foundation Complete | Expo project configured, builds | Day 3 |
| M2: Dependencies Migrated | All non-notification deps working | Day 5 |
| M3: Notifications Working | Push and local notifications verified | Day 9 |
| M4: Storage Migrated | Data persists correctly | Day 11 |
| M5: Builds Ready | Production builds successful | Day 13 |
| M6: Testing Complete | All tests pass | Day 16 |
| M7: Release | Apps submitted to stores | Day 18 |

---

## 20. APPENDIX: COMMAND REFERENCE

### 20.1 Expo CLI Commands

```bash
# Start development server
npx expo start

# Start with development client
npx expo start --dev-client

# Clear cache and start
npx expo start --clear

# Check project configuration
npx expo config --type public

# Run diagnostics
npx expo doctor

# Install Expo-compatible package
npx expo install [package-name]

# Generate native projects (if needed)
npx expo prebuild

# Clean generated native projects
npx expo prebuild --clean
```

### 20.2 EAS CLI Commands

```bash
# Login to EAS
eas login

# View account info
eas whoami

# Configure EAS for project
eas build:configure

# View project info
eas project:info

# Build for development
eas build --profile development --platform all

# Build for preview (internal testing)
eas build --profile preview --platform all

# Build for production
eas build --profile production --platform all

# List builds
eas build:list

# View specific build
eas build:view [build-id]

# Run build on device/simulator
eas build:run --platform [ios|android]

# Manage credentials
eas credentials --platform [ios|android]

# Submit to app stores
eas submit --platform [ios|android]

# Create OTA update
eas update --branch [branch-name] --message "[message]"

# List updates
eas update:list --branch [branch-name]

# Rollback update
eas update:republish --group [group-id]
```

### 20.3 Useful Debug Commands

```bash
# View Metro bundler logs
npx expo start --verbose

# Clear Metro cache
npx expo start --clear

# Check installed Expo packages
npx expo install --check

# View device logs (iOS)
xcrun simctl spawn booted log stream --predicate 'process == "Pruuf"'

# View device logs (Android)
adb logcat -s ReactNativeJS

# Test OTA update locally
npx expo export --platform all
```

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | Orchestrator Agent | Initial comprehensive plan |

---

## SIGNATURES

| Role | Name | Date | Approval |
|------|------|------|----------|
| Project Owner | | | [ ] |
| Lead Mobile Engineer | | | [ ] |
| DevOps Engineer | | | [ ] |
| Integrations Engineer | | | [ ] |
| QA Lead | | | [ ] |
| Security Engineer | | | [ ] |
| Orchestrator | Claude Code Agent | December 2025 | [x] |

---

**END OF MIGRATION MASTER PLAN**

*This document was generated by synthesizing inputs from Lead Mobile Engineer (technical architecture, 56-hour plan), Integrations Engineer (API mappings, 6 integration domains), QA Lead (testing strategy), Security Engineer (security validation), and DevOps Engineer (CI/CD configuration). The Orchestrator coordinated all inputs into this unified migration plan.*
