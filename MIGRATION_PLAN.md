# React Native 0.74 → 0.78 Migration Plan

**Project:** Pruuf
**Created:** December 18, 2025
**Updated:** December 20, 2025
**Target:** React Native 0.78.0 with New Architecture (Fabric + TurboModules)
**Audit Trail:** Git commits per task + MIGRATION_LOG.md

---

## Executive Summary

| Metric | Original | Current | Target |
|--------|----------|---------|--------|
| React Native | 0.74.0 | 0.78.0 ✅ | 0.78.0 |
| React | 18.2.0 | 19.0.0 ✅ | 19.0.0 |
| New Architecture | Disabled | Enabled ✅ | Enabled |
| iOS Min Version | 15.0 | 15.1 ✅ | 15.1 |
| Android Min SDK | 23 | 24 ✅ | 24 |
| Gradle | 8.6 | 8.10.2 ✅ | 8.10.2 |

**Total Scope:** 104 source files, 28 screens, 22 components, 14 native modules

**Current Status:** Core upgrade COMPLETE. Test suite fully passing (43 suites, 1339 tests).

---

## PHASE 0: PRE-MIGRATION PREPARATION

### Task 0.1: Create Backup & Migration Branches
**Commit:** `chore: create backup branch before RN 0.76 migration`

```bash
git checkout -b backup/pre-rn-0.76-migration
git push origin backup/pre-rn-0.76-migration
git checkout main
git checkout -b feature/rn-0.76-migration
```

**Verification:**
- [ ] Backup branch exists on remote
- [ ] Migration branch created

---

### Task 0.2: Document Test Baseline
**Commit:** `docs: document pre-migration test baseline`

**Actions:**
1. Run: `npm test -- --coverage --watchAll=false`
2. Save coverage report
3. Document pass/fail counts

**Files:**
- Create: `MIGRATION_LOG.md` (progress tracker)

**Verification:**
- [ ] Test count documented
- [ ] Coverage percentage recorded
- [ ] Known failures documented

---

### Task 0.3: Verify Current Build Works
**Actions:**
1. `npm run clean:all`
2. `npm run reinstall:full`
3. iOS build and launch
4. Android build and launch

**Verification:**
- [ ] iOS builds and launches
- [ ] Android builds and launches
- [ ] All 28 screens accessible

---

## PHASE 1: CORE REACT NATIVE UPGRADE

### Task 1.1: Update Core Dependencies
**Commit:** `chore: upgrade react-native 0.74.0 to 0.76.5`

**File:** [package.json](package.json)

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.5"
  },
  "devDependencies": {
    "@react-native/babel-preset": "0.76.5",
    "@react-native/eslint-config": "0.76.5",
    "@react-native/metro-config": "0.76.5",
    "@react-native/typescript-config": "0.76.5"
  }
}
```

**Verification:**
- [ ] npm install succeeds
- [ ] No peer dependency conflicts

---

### Task 1.2: Update Metro Configuration
**Commit:** `chore: update metro.config.js for RN 0.76`

**File:** [metro.config.js](metro.config.js)

```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

**Verification:**
- [ ] Metro starts without errors

---

### Task 1.3: Verify Babel Configuration
**Commit:** `chore: verify babel.config.js compatibility`

**File:** [babel.config.js](babel.config.js)

Current config should remain compatible. Verify reanimated plugin works.

**Verification:**
- [ ] Babel transforms without errors

---

## PHASE 2: NATIVE PLATFORM UPDATES

### Task 2.1: Update iOS Configuration
**Commit:** `chore: update iOS configuration for RN 0.76`

**Files to Modify:**

1. **[ios/Podfile](ios/Podfile)**
   - Remove `fabric_enabled => false` (RN 0.76 enables by default)
   - Update deployment target if needed

2. **[ios/Pruuf/AppDelegate.mm](ios/Pruuf/AppDelegate.mm)**
   - Verify RCTAppDelegate pattern compatibility

**Commands:**
```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
```

**Verification:**
- [ ] Pod install succeeds
- [ ] No deprecated API warnings

---

### Task 2.2: Update Android Configuration
**Commit:** `chore: update Android configuration for RN 0.76`

**Files to Modify:**

1. **[android/gradle.properties](android/gradle.properties)**
```properties
newArchEnabled=true
```

2. **[android/build.gradle](android/build.gradle)**
```groovy
ext {
    buildToolsVersion = "35.0.0"
    minSdkVersion = 24
    compileSdkVersion = 35
    targetSdkVersion = 35
    ndkVersion = "27.0.12077973"
    kotlinVersion = "1.9.24"
}
```

3. **[android/gradle/wrapper/gradle-wrapper.properties](android/gradle/wrapper/gradle-wrapper.properties)**
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-all.zip
```

**Commands:**
```bash
cd android
./gradlew clean
```

**Verification:**
- [ ] Gradle sync succeeds
- [ ] No deprecation errors

---

## PHASE 3: NATIVE DEPENDENCY UPDATES

### Task 3.1: Update Navigation Stack
**Commit:** `chore: verify react-navigation RN 0.76 compatibility`

**Dependencies (Already Compatible):**
```json
"@react-navigation/native": "^7.1.20",
"@react-navigation/native-stack": "^7.6.3",
"@react-navigation/bottom-tabs": "^7.8.5"
```

**Files to Test:**
- [src/navigation/RootNavigator.tsx](src/navigation/RootNavigator.tsx)
- [src/navigation/MainTabNavigator.tsx](src/navigation/MainTabNavigator.tsx)

**Verification:**
- [ ] Tab navigation works
- [ ] Stack navigation works
- [ ] Screen transitions smooth

---

### Task 3.2: Update Reanimated
**Commit:** `chore: upgrade react-native-reanimated for RN 0.76`

**Change:**
```json
"react-native-reanimated": "^3.16.1"  // From ~3.10.1
```

**Critical Animation Files:**
- [src/screens/member/MemberDashboard.tsx](src/screens/member/MemberDashboard.tsx) - Breathing animation
- [src/components/skeletons/Skeleton.tsx](src/components/skeletons/Skeleton.tsx) - Shimmer animation

**Verification:**
- [ ] Breathing animation smooth at 60fps
- [ ] Shimmer animation works
- [ ] useNativeDriver: true still works

---

### Task 3.3: Update Gesture Handler
**Commit:** `chore: upgrade react-native-gesture-handler for RN 0.76`

**Change:**
```json
"react-native-gesture-handler": "^2.20.2"  // Verify latest compatible
```

**Verification:**
- [ ] Swipe gestures work
- [ ] Touch events responsive

---

### Task 3.4: Update Screens
**Commit:** `chore: upgrade react-native-screens for RN 0.76`

**Change:**
```json
"react-native-screens": "^4.0.0"  // From ~3.31.1
```

**Breaking Changes Possible:**
- Screen options API changes
- Native stack behavior changes

**Verification:**
- [ ] All screen transitions work
- [ ] No visual glitches

---

### Task 3.5: Update Firebase SDKs
**Commit:** `chore: verify @react-native-firebase RN 0.76 compatibility`

**Dependencies:**
```json
"@react-native-firebase/app": "^23.5.0",
"@react-native-firebase/messaging": "^23.5.0"
```

**File:** [src/services/notifications.ts](src/services/notifications.ts)

**Verification:**
- [ ] FCM token retrieved
- [ ] Push notifications received
- [ ] Background handlers work

---

### Task 3.6: Update RevenueCat
**Commit:** `chore: verify react-native-purchases RN 0.76 compatibility`

**Dependencies:**
```json
"react-native-purchases": "^8.2.1",
"react-native-purchases-ui": "^8.2.1"
```

**Verification:**
- [ ] Products load
- [ ] Purchase flow works
- [ ] Subscription status retrieved

---

### Task 3.7: Update Biometrics
**Commit:** `chore: verify react-native-biometrics RN 0.76 compatibility`

**Dependency:** `react-native-biometrics: ^3.0.1`

**Files:**
- [src/hooks/useBiometricAuth.ts](src/hooks/useBiometricAuth.ts)
- [src/utils/biometrics.ts](src/utils/biometrics.ts)

**Verification:**
- [ ] Face ID works (iOS)
- [ ] Fingerprint works (Android)
- [ ] Fallback to PIN works

---

### Task 3.8: Update Encrypted Storage
**Commit:** `chore: verify react-native-encrypted-storage RN 0.76 compatibility`

**Dependency:** `react-native-encrypted-storage: ^4.0.3`

**File:** [src/services/storage.ts](src/services/storage.ts)

**Verification:**
- [ ] Token save/retrieve works
- [ ] Data persists across restarts
- [ ] Clear storage works

---

### Task 3.9: Update Haptic Feedback
**Commit:** `chore: verify react-native-haptic-feedback RN 0.76 compatibility`

**Dependency:** `react-native-haptic-feedback: ^2.3.3`

**File:** [src/services/haptics.ts](src/services/haptics.ts)

**Verification:**
- [ ] Light haptic on tap
- [ ] Medium haptic on check-in
- [ ] Works on both platforms

---

## PHASE 4: ENABLE NEW ARCHITECTURE

### Task 4.1: Enable New Architecture - Android
**Commit:** `feat: enable new architecture on Android`

**File:** [android/gradle.properties](android/gradle.properties)
```properties
newArchEnabled=true
```

**Verification:**
- [ ] Clean build succeeds
- [ ] App launches
- [ ] No TurboModule errors

---

### Task 4.2: Enable New Architecture - iOS
**Commit:** `feat: enable new architecture on iOS`

**File:** [ios/Podfile](ios/Podfile)
- RN 0.76 enables Fabric by default when `fabric_enabled` is not set

**Commands:**
```bash
cd ios && rm -rf Pods Podfile.lock && pod install
```

**Verification:**
- [ ] Pod install succeeds
- [ ] Build succeeds
- [ ] App launches

---

## PHASE 5: COMPONENT VERIFICATION

### All 22 Components Must Pass:

| Component | File | Status |
|-----------|------|--------|
| BiometricPrompt | src/components/auth/BiometricPrompt.tsx | [ ] |
| Button | src/components/common/Button.tsx | [ ] |
| Card | src/components/common/Card.tsx | [ ] |
| CodeInput | src/components/common/CodeInput.tsx | [ ] |
| TextInput | src/components/common/TextInput.tsx | [ ] |
| TimePicker | src/components/common/TimePicker.tsx | [ ] |
| ConfirmDialog | src/components/dialogs/ConfirmDialog.tsx | [ ] |
| Skeleton | src/components/skeletons/Skeleton.tsx | [ ] |
| SkeletonPatterns | src/components/skeletons/SkeletonPatterns.tsx | [ ] |
| EmptyState | src/components/empty-states/EmptyState.tsx | [ ] |
| NotificationPermissionPrompt | src/components/notifications/NotificationPermissionPrompt.tsx | [ ] |
| DeepLinkHandler | src/components/DeepLinkHandler.tsx | [ ] |
| OfflineIndicator | src/components/OfflineIndicator.tsx | [ ] |
| Tutorial | src/components/Tutorial.tsx | [ ] |
| SubscriptionCard | src/components/subscription/SubscriptionCard.tsx | [ ] |

**Per-Component Test:**
- [ ] Renders without errors
- [ ] Touch interactions work
- [ ] Animations play correctly
- [ ] Accessibility labels work
- [ ] No console warnings

---

## PHASE 6: SCREEN VERIFICATION

### All 28 Screens Must Pass:

**Auth Screens (6):**
| Screen | File | Status |
|--------|------|--------|
| WelcomeScreen | src/screens/auth/WelcomeScreen.tsx | [ ] |
| PhoneEntryScreen | src/screens/auth/PhoneEntryScreen.tsx | [ ] |
| VerificationCodeScreen | src/screens/auth/VerificationCodeScreen.tsx | [ ] |
| CreatePinScreen | src/screens/auth/CreatePinScreen.tsx | [ ] |
| ConfirmPinScreen | src/screens/auth/ConfirmPinScreen.tsx | [ ] |
| FontSizeScreen | src/screens/auth/FontSizeScreen.tsx | [ ] |

**Onboarding Screens (7):**
| Screen | File | Status |
|--------|------|--------|
| TrialWelcomeScreen | src/screens/onboarding/TrialWelcomeScreen.tsx | [ ] |
| AddMemberScreen | src/screens/onboarding/AddMemberScreen.tsx | [ ] |
| ReviewMemberScreen | src/screens/onboarding/ReviewMemberScreen.tsx | [ ] |
| InviteSentScreen | src/screens/onboarding/InviteSentScreen.tsx | [ ] |
| MemberWelcomeScreen | src/screens/onboarding/MemberWelcomeScreen.tsx | [ ] |
| EnterInviteCodeScreen | src/screens/onboarding/EnterInviteCodeScreen.tsx | [ ] |
| SetCheckInTimeScreen | src/screens/onboarding/SetCheckInTimeScreen.tsx | [ ] |

**Member Screens (3):**
| Screen | File | Status |
|--------|------|--------|
| MemberDashboard | src/screens/member/MemberDashboard.tsx | [ ] |
| MemberContacts | src/screens/member/MemberContacts.tsx | [ ] |
| MemberSettings | src/screens/member/MemberSettings.tsx | [ ] |

**Contact Screens (2):**
| Screen | File | Status |
|--------|------|--------|
| ContactDashboard | src/screens/contact/ContactDashboard.tsx | [ ] |
| ContactSettings | (via settings) | [ ] |

**Shared Screens (7+):**
| Screen | File | Status |
|--------|------|--------|
| MemberDetailScreen | src/screens/MemberDetailScreen.tsx | [ ] |
| ContactDetailScreen | src/screens/ContactDetailScreen.tsx | [ ] |
| CheckInHistoryScreen | src/screens/CheckInHistoryScreen.tsx | [ ] |
| NotificationSettingsScreen | src/screens/NotificationSettingsScreen.tsx | [ ] |
| HelpScreen | src/screens/HelpScreen.tsx | [ ] |
| PaymentMethodScreen | src/screens/payment/index.ts | [ ] |
| NotificationPreferencesScreen | src/screens/settings/NotificationPreferencesScreen.tsx | [ ] |

---

## PHASE 7: ANIMATION VERIFICATION

### Task 7.1: Verify Breathing Animation (CRITICAL)
**File:** [src/screens/member/MemberDashboard.tsx:44-62](src/screens/member/MemberDashboard.tsx#L44-L62)

```javascript
// Animation: scale 1.0 → 1.02 → 1.0, 3-second loop
const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(scaleAnim, {
      toValue: 1.02,
      duration: 1500,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }),
  ]),
);
```

**Test Criteria:**
- [ ] Animation starts on mount
- [ ] Smooth 3-second loop (no stutter)
- [ ] 60fps performance
- [ ] Button remains tappable during animation
- [ ] Animation stops on unmount (no memory leak)

---

### Task 7.2: Verify Shimmer Animation
**File:** [src/components/skeletons/Skeleton.tsx:36-66](src/components/skeletons/Skeleton.tsx#L36-L66)

**Test Criteria:**
- [ ] Opacity oscillates 0.3 → 0.7
- [ ] Smooth 2-second loop
- [ ] No visual glitches
- [ ] Cleanup on unmount

---

## PHASE 8: NATIVE INTEGRATION TESTING

### Task 8.1: Biometric Authentication
**Files:**
- [src/hooks/useBiometricAuth.ts](src/hooks/useBiometricAuth.ts)
- [src/components/auth/BiometricPrompt.tsx](src/components/auth/BiometricPrompt.tsx)

**Test Matrix:**
| Test Case | iOS | Android |
|-----------|-----|---------|
| Prompt appears | [ ] | [ ] |
| Success returns true | [ ] | [ ] |
| Failure handled | [ ] | [ ] |
| Availability check | [ ] | [ ] |
| PIN fallback | [ ] | [ ] |

---

### Task 8.2: Encrypted Storage
**File:** [src/services/storage.ts](src/services/storage.ts)

**Test Matrix:**
| Test Case | iOS | Android |
|-----------|-----|---------|
| Save token | [ ] | [ ] |
| Retrieve token | [ ] | [ ] |
| Save JSON | [ ] | [ ] |
| Retrieve JSON | [ ] | [ ] |
| Clear storage | [ ] | [ ] |
| Persist restart | [ ] | [ ] |

---

### Task 8.3: Push Notifications
**File:** [src/services/notifications.ts](src/services/notifications.ts)

**Test Matrix:**
| Test Case | iOS | Android |
|-----------|-----|---------|
| Permission request | [ ] | [ ] |
| FCM token retrieval | [ ] | [ ] |
| Foreground notification | [ ] | [ ] |
| Background tap | [ ] | [ ] |
| Token refresh | [ ] | [ ] |

---

### Task 8.4: RevenueCat Payments
**Files:**
- [src/screens/payment/index.ts](src/screens/payment/index.ts)
- [src/store/slices/paymentSlice.ts](src/store/slices/paymentSlice.ts)

**Test Matrix:**
| Test Case | iOS | Android |
|-----------|-----|---------|
| Products load | [ ] | [ ] |
| Purchase initiates | [ ] | [ ] |
| Status retrieved | [ ] | [ ] |
| Restore works | [ ] | [ ] |

---

### Task 8.5: Haptic Feedback
**File:** [src/services/haptics.ts](src/services/haptics.ts)

**Test Matrix:**
| Test Case | iOS | Android |
|-----------|-----|---------|
| Light haptic | [ ] | [ ] |
| Medium haptic | [ ] | [ ] |
| Success haptic | [ ] | [ ] |

---

## PHASE 9: AUTOMATED TESTING

### Task 9.1: Update Jest Configuration
**Commit:** `chore: update jest configuration for RN 0.76`

**File:** [jest.config.js](jest.config.js)

Update `transformIgnorePatterns` if needed for new package names.

---

### Task 9.2: Update Jest Setup
**Commit:** `chore: update jest.setup.js for RN 0.76`

**File:** [jest.setup.js](jest.setup.js)

Verify mocks are compatible:
- Line 7: gesture-handler mock
- Lines 101-105: Reanimated mock

---

### Task 9.3: Update All Mocks
**Directory:** [__mocks__/](__mocks__/)

| Mock | Status |
|------|--------|
| @react-native-community/netinfo.ts | [ ] |
| @react-native-firebase/analytics.ts | [ ] |
| react-native-biometrics.ts | [ ] |
| react-native-push-notification.ts | [ ] |

---

### Task 9.4: Run Full Test Suite
**Command:** `npm test -- --coverage --watchAll=false`

**Acceptance Criteria:**
- [ ] All existing tests pass
- [ ] Coverage ≥ 50%
- [ ] No new failures

---

## PHASE 10: PERFORMANCE VALIDATION

### Task 10.1: Build Time Comparison

| Metric | Before (0.74) | After (0.76) | Delta |
|--------|---------------|--------------|-------|
| iOS cold build | ___ | ___ | ___ |
| iOS hot build | ___ | ___ | ___ |
| Android cold build | ___ | ___ | ___ |
| Android hot build | ___ | ___ | ___ |
| Metro bundle | ___ | ___ | ___ |

**Acceptable:** ±20% cold, ±10% hot

---

### Task 10.2: Startup Time

| Metric | Target | Actual |
|--------|--------|--------|
| Time to interactive | < 3s | ___ |
| Splash visible until ready | Yes | ___ |

---

### Task 10.3: Animation FPS

| Animation | Target | Actual |
|-----------|--------|--------|
| Breathing animation | 60fps | ___ |
| Skeleton shimmer | 60fps | ___ |
| Screen transitions | 60fps | ___ |

---

## PHASE 11: END-TO-END VERIFICATION

### Critical Path 1: Contact Onboarding
- [ ] Welcome screen renders
- [ ] Phone entry works
- [ ] Verification code works
- [ ] PIN creation works
- [ ] Font size selection works
- [ ] Trial welcome modal appears
- [ ] Add member flow works
- [ ] Dashboard renders

### Critical Path 2: Member Onboarding
- [ ] Welcome screen renders
- [ ] Invite code entry works
- [ ] Time picker works
- [ ] Dashboard with breathing animation

### Critical Path 3: Daily Check-in
- [ ] I'm OK button visible and animated
- [ ] Tap triggers haptic
- [ ] API call succeeds
- [ ] Success state shown

### Critical Path 4: Payment Flow
- [ ] PaymentMethodScreen renders
- [ ] RevenueCat works
- [ ] Subscription created

---

## PHASE 12: DEVICE MATRIX

### iOS Devices:
- [ ] iPhone 15 Pro (iOS 17)
- [ ] iPhone 12 (iOS 15)
- [ ] iPad Pro (iPadOS 17)

### Android Devices:
- [ ] Pixel 7 (Android 14)
- [ ] Samsung Galaxy (Android 14)
- [ ] Older device (Android 10+)

---

## ROLLBACK STRATEGY

### Immediate Rollback:
```bash
git checkout backup/pre-rn-0.76-migration
npm install
cd ios && pod install
npm run clean:all
```

### Partial Rollback:
Revert specific dependency to previous version and rebuild.

---

## CRITICAL FILES SUMMARY

| Phase | Files |
|-------|-------|
| Core Upgrade | package.json, metro.config.js, babel.config.js |
| iOS | ios/Podfile, ios/Pruuf/AppDelegate.mm |
| Android | android/gradle.properties, android/build.gradle, gradle-wrapper.properties |
| Animation | src/screens/member/MemberDashboard.tsx, src/components/skeletons/Skeleton.tsx |
| Native | src/services/storage.ts, src/services/notifications.ts, src/hooks/useBiometricAuth.ts |
| Testing | jest.config.js, jest.setup.js, __mocks__/* |

---

## COMMIT STRATEGY

Each task gets its own commit with format:
- `chore: description` for config/dependency changes
- `feat: description` for new features (New Architecture)
- `fix: description` for bug fixes
- `test: description` for test updates
- `docs: description` for documentation

All commits include task reference in body.

---

## MANDATORY FAILURE RESOLUTION POLICY

**THIS IS NON-NEGOTIABLE:**

1. **All failures MUST be resolved** - not just logged. If a test fails, build fails, or verification fails, the team will iterate as many times as necessary until it is fully resolved.

2. **No fabricated progress** - Every claimed completion must have evidence in MIGRATION_LOG.md. No lying, no cutting corners, no claiming something works when it doesn't.

3. **Resolution before progression** - A sub-task cannot be marked complete until ALL its verification criteria pass. The team does not move to the next sub-task until the current one is fully resolved.

4. **Iteration tracking** - When fixing failures, each attempt must be logged:
   ```
   Attempt 1: [what was tried] → [result]
   Attempt 2: [what was tried] → [result]
   ...
   Resolution: [final fix that worked]
   ```

5. **Pre-existing failures** - Even pre-existing test failures discovered during baseline documentation must be resolved before the migration can be considered complete.

6. **No exceptions** - This policy applies to:
   - Build failures
   - Test failures
   - Runtime errors
   - Visual/animation defects
   - Performance regressions
   - Integration failures

7. **TEST PASSING REQUIREMENTS (CRITICAL CLARIFICATION):**
   - **ALL tests must pass** - not just most tests
   - **ALL test suites must pass** - not just most suites
   - A test run is only successful when output shows: `Test Suites: X passed, X total` and `Tests: Y passed, Y total` with ZERO failures
   - Never claim tests or suites passed unless they ACTUALLY passed
   - If even ONE test fails, iterate until it passes
   - If even ONE test suite fails, iterate until it passes
   - The only acceptable final state is: **0 failed tests, 0 failed suites**

8. **RUNTIME AND BLOCKED ISSUES RESOLUTION (MANDATORY):**
   - **ALL runtime issues must be resolved** before moving forward to the next phase
   - **ALL blocked issues must be unblocked** - do whatever is necessary to unblock
   - If a task is blocked by missing dependencies, environment issues, or compatibility problems:
     - Fix the root cause immediately
     - Install missing dependencies
     - Update incompatible versions
     - Configure missing environment components
   - **No task can remain in BLOCKED status** - the team must iterate until it is unblocked
   - If the blockage requires work from a later phase, that work must be pulled forward
   - The migration cannot proceed with any BLOCKED tasks behind it

---

## CHECKPOINT PROTOCOL

After EVERY sub-task (e.g., 0.1, 0.2, 1.1, 1.2):

1. Update MIGRATION_LOG.md with actual results and evidence
2. Report to user with summary
3. **WAIT for explicit user approval** before proceeding
4. Re-read MIGRATION_PLAN.md and MIGRATION_LOG.md before starting next sub-task

This ensures working memory is maintained and no context is lost.

---

## DEFINITION OF DONE

The migration is complete when:

1. [ ] All 12 phases completed
2. [ ] All 28 screens verified working
3. [ ] All 22 components verified working
4. [ ] All animations at 60fps
5. [ ] All native integrations tested on both platforms
6. [ ] All automated tests passing (including resolution of pre-existing failures)
7. [ ] Device matrix tested
8. [ ] MIGRATION_LOG.md complete with evidence
9. [ ] No regressions from pre-migration baseline
10. [ ] Zero unresolved failures of any kind
