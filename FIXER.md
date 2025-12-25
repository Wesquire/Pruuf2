# PRUUF COMPREHENSIVE REMEDIATION PLAN (FIXER.md)

**Created:** 2025-12-22
**Status:** ACTIVE
**Objective:** Get Pruuf to 100% complete - all features working, all tests passing, App Store ready, production ready

---

## VERIFIED BASELINE METRICS

| Metric | Previous Claim | Verified Value | Variance |
|--------|---------------|----------------|----------|
| Test Count | 1,339 passing | **599 passing** | -740 (55% fewer) |
| Test Suites | Unknown | 38 suites | - |
| Source Files | 142 TypeScript | 141 files | -1 |
| Lines of Code | ~23,706 | **26,627 lines** | +2,921 |
| Edge Functions | 34 functions | 18 directories | Different counting |
| Migrations | 28 SQL files | 19 SQL files | -9 |

---

## CRITICAL BLOCKERS IDENTIFIED

### BLOCKER 1: BROKEN IMPORT - ACCOUNT DELETION WILL CRASH
**File:** `supabase/functions/auth/delete-account/index.ts`
**Line 29:** `import {cancelSubscription} from '../../_shared/stripe.ts';`
**Problem:** File `stripe.ts` does not exist - this will cause runtime crash
**Impact:** Users CANNOT delete their accounts
**Priority:** P0 - CRITICAL

### BLOCKER 2: FIREBASE NOT CONFIGURED
**File:** `ios/Pruuf/GoogleService-Info.plist`
**Status:** FILE DOES NOT EXIST
**Impact:** Push notifications will NOT work on iOS
**Priority:** P0 - CRITICAL

### BLOCKER 3: ENVIRONMENT MISCONFIGURATION
**File:** `.env` vs `.env.example`
- `.env` points to LOCAL Supabase: `http://127.0.0.1:54321`
- `.env.example` points to PRODUCTION: `https://ivnstzpolgjzfqduhlvw.supabase.co`
- `.env` has STRIPE credentials (deprecated)
- `.env` has TWILIO credentials (to be removed)
- `.env` MISSING Postmark configuration
- `.env` MISSING RevenueCat configuration

---

## COMPLETE REMOVAL SCOPE

### EXPO REMOVAL (33 files affected)

#### Package Dependencies to Remove:
```json
"@expo/vector-icons": "^15.0.3",
"expo-asset": "^12.0.12",
"expo-font": "^14.0.10",
"expo-modules-core": "^3.0.29"
```

#### Files with Expo Imports (18 screens):
1. `src/screens/member/MemberDashboard.tsx:18`
2. `src/screens/auth/CreatePinScreen.tsx:15`
3. `src/screens/auth/ConfirmPinScreen.tsx:16`
4. `src/screens/auth/EmailVerificationScreen.tsx:19`
5. `src/screens/auth/VerificationCodeScreen.tsx:16`
6. `src/screens/auth/FontSizeScreen.tsx:15`
7. `src/screens/auth/PhoneEntryScreen.tsx:19`
8. `src/screens/onboarding/AddMemberScreen.tsx:15`
9. `src/screens/onboarding/ReviewMemberScreen.tsx:14`
10. `src/screens/onboarding/EnterInviteCodeScreen.tsx:13`
11. `src/screens/onboarding/InviteSentScreen.tsx:7`
12. `src/screens/onboarding/TrialWelcomeScreen.tsx:9`
13. `src/screens/member/MemberSettings.tsx:15`
14. `src/screens/member/MemberContacts.tsx:13`
15. `src/screens/contact/ContactDashboard.tsx:15`
16. `src/screens/contact/ContactSettings.tsx:14`
17. `src/screens/settings/NotificationPreferencesScreen.tsx:22`
18. `src/screens/CheckInHistoryScreen.tsx:13`

#### Replacement Strategy:
- Replace `@expo/vector-icons` with `react-native-vector-icons` (already in dependencies)
- Remove `expo-asset`, `expo-font`, `expo-modules-core` entirely

#### Other Expo Files to Remove:
- `__mocks__/expo-splash-screen.js`
- `__mocks__/expo-status-bar.js`
- `eas.json` (EAS build config)
- `.github/workflows/eas-build.yml`
- `.github/workflows/eas-update.yml`
- `docs/EXPO_MIGRATION_TEST_CHECKLIST.md`
- `.expo/` directory
- Update `jest.setup.js` (remove Expo mocks)
- Update `jest.config.js` (remove Expo from transforms)
- Update `src/types/modules.d.ts` (remove expo-haptics declaration)

---

### TWILIO/SMS REMOVAL (42+ files affected)

#### Package Dependencies to Remove:
```json
"twilio": "^5.10.6"
```

#### Environment Variables to Remove:
```
TWILIO_ACCOUNT_SID=ACfe25e9146c7b640920b99b66378e4115
TWILIO_AUTH_TOKEN=faa9c608b79b104b00ae559d4f7e42c7
TWILIO_PHONE_NUMBER=+14843263161
```

#### Edge Functions to Modify/Remove:
1. **DELETE:** `supabase/functions/_shared/sms.ts` (entire file - 308 lines)
2. **MODIFY:** `supabase/functions/_shared/db.ts` - Remove `logSms()` function (lines 678-703)
3. **MODIFY:** `supabase/functions/members/check-in/index.ts` - Remove SMS import (line 24)
4. **MODIFY:** `supabase/functions/cron/check-missed-checkins/index.ts` - Remove SMS (line 11, 133)
5. **MODIFY:** `supabase/functions/cron/grace-period-expirations/index.ts` - Remove SMS (line 11, 87)

#### Database Changes Required:
1. **Migration to create:** Remove `sms_logs` table if still exists
2. **Verify:** Migration 025 already drops `sms_logs` - confirm executed
3. **Verify:** Migration 026 removes phone verification fields

#### Frontend Screens to Update:
1. `src/screens/NotificationSettingsScreen.tsx` - Remove SMS toggle (lines 29, 53, 159, 331-365)
2. `src/screens/HelpScreen.tsx` - Update text (lines 55, 60, 65, 70, 90)
3. `src/screens/MemberDetailScreen.tsx` - Update text (line 121)
4. `src/screens/ContactDetailScreen.tsx` - Update text (lines 79, 277)
5. `src/screens/settings/PaymentSettingsScreen.tsx` - Update text (line 140)

#### Type Definitions to Update:
- `src/types/database.ts` - Remove `SMSType` enum (lines 20-27)
- `src/types/database.ts` - Remove `SMSLog` interface (lines 113-125)

#### Config Files to Update:
- `src/constants/config.ts` - Remove `TWILIO_CONFIG` (lines 66-71)
- `supabase/config.toml` - Remove SMS/Twilio config (lines 234-271)

---

### STRIPE REMOVAL (26 files affected)

#### Environment Variables to Remove:
```
STRIPE_PUBLISHABLE_KEY=pk_live_51Qsv...
STRIPE_SECRET_KEY=sk_live_51Qsv...
STRIPE_WEBHOOK_SECRET=whsec_GCAqi...
STRIPE_PRICE_ID=prod_TSCMX9lyTb7DLH
```

#### Edge Functions to Fix:
1. **CRITICAL FIX:** `supabase/functions/auth/delete-account/index.ts`
   - Line 29: Remove broken import `import {cancelSubscription} from '../../_shared/stripe.ts';`
   - Lines 109-111: Replace with RevenueCat cancellation or remove
   - Line 130: Keep clearing subscription (but use RevenueCat field)

2. **MODIFY:** `supabase/functions/auth/login/index.ts`
   - Lines 161-162: Remove Stripe fields from response

3. **MODIFY:** `supabase/functions/accept-invitation/index.ts`
   - Line 214: Remove stripe_subscription_id from select
   - Line 223: Update subscription check to use RevenueCat

#### Shared Utilities to Update:
1. `supabase/functions/_shared/types.ts` - Remove Stripe type fields (lines 33-34)
2. `supabase/functions/_shared/revenuecat.ts` - Remove Stripe store type (line 25, 261)
3. `supabase/functions/_shared/validators.ts` - Remove Stripe field (line 20)

#### Jest Config to Update:
- `jest.config.js` - Remove `@stripe/stripe-react-native` from transforms (line 8)

---

## PHASE IMPLEMENTATION PLAN

### PHASE 1: EMERGENCY FOUNDATION (3 Waves)

#### Wave 1.1: Security Engineer - Credential & Auth Fixes
**Scope:**
- [ ] Fix .env configuration (use production Supabase, add Postmark, add RevenueCat placeholders)
- [ ] Remove deprecated credentials (Stripe, Twilio)
- [ ] Verify JWT secret is properly configured
- [ ] Audit authentication flow for security issues

**Acceptance Criteria:**
- .env properly configured for production
- No deprecated service credentials in .env
- Authentication works end-to-end

---

#### Wave 1.2: Database Engineer - Schema & Migration Fixes
**Scope:**
- [ ] Verify all 19 migrations have been applied to production
- [ ] Create migration to remove any remaining SMS/Stripe artifacts
- [ ] Verify RLS policies are properly configured
- [ ] Test database connection from Edge Functions

**Acceptance Criteria:**
- All migrations applied successfully
- No Stripe/SMS columns exist in production database
- RLS policies allow proper access

---

#### Wave 1.3: DevOps Engineer - Build & CI/CD Setup
**Scope:**
- [ ] Verify iOS build compiles successfully
- [ ] Set up Supabase CLI configuration
- [ ] Create basic CI/CD for testing
- [ ] Document build process

**Acceptance Criteria:**
- iOS simulator build succeeds
- Supabase CLI can connect to production
- Tests run in CI

---

### PHASE 2: CORE IMPLEMENTATION (4 Parallel Tracks)

#### Track 2.1: Backend Engineer - Edge Function Fixes
**Scope:**
- [ ] Fix broken delete-account import (P0 CRITICAL)
- [ ] Remove all SMS imports and calls from Edge Functions
- [ ] Remove Stripe imports and replace with RevenueCat
- [ ] Implement proper error handling
- [ ] Test all Edge Functions

**Subsections:**
- 2.1.1: Fix delete-account broken import
- 2.1.2: Remove SMS from check-in function
- 2.1.3: Remove SMS from cron functions
- 2.1.4: Update login to remove Stripe fields
- 2.1.5: Update accept-invitation to use RevenueCat
- 2.1.6: Delete sms.ts shared module
- 2.1.7: Update db.ts to remove logSms
- 2.1.8: Update types.ts to remove Stripe/SMS types
- 2.1.9: Test all modified Edge Functions

---

#### Track 2.2: Lead Mobile Engineer - Frontend Fixes
**Scope:**
- [ ] Replace @expo/vector-icons with react-native-vector-icons
- [ ] Remove all Expo dependencies
- [ ] Update notification screens to remove SMS references
- [ ] Update help text to remove SMS mentions
- [ ] Fix any UI bugs discovered
- [ ] Run all tests until passing

**Subsections:**
- 2.2.1: Replace Expo vector icons in all 18 screens
- 2.2.2: Remove Expo packages from package.json
- 2.2.3: Update jest mocks and config
- 2.2.4: Update NotificationSettingsScreen (remove SMS toggle)
- 2.2.5: Update HelpScreen text
- 2.2.6: Update MemberDetailScreen text
- 2.2.7: Update ContactDetailScreen text
- 2.2.8: Update PaymentSettingsScreen text
- 2.2.9: Remove Expo build files (eas.json, workflows)
- 2.2.10: Run tests and fix failures

---

#### Track 2.3: Integrations Engineer - Service Setup
**Scope:**
- [ ] Guide Firebase project setup (you execute in console)
- [ ] Implement Firebase integration code
- [ ] Configure APNs for iOS push notifications
- [ ] Implement RevenueCat integration with placeholders
- [ ] Verify Postmark email integration
- [ ] Test notification flow end-to-end

**Subsections:**
- 2.3.1: Firebase project configuration guide
- 2.3.2: Generate and upload APNs key
- 2.3.3: Download and place GoogleService-Info.plist
- 2.3.4: Verify Firebase code integration
- 2.3.5: Test push notification delivery
- 2.3.6: Verify RevenueCat placeholder integration
- 2.3.7: Test Postmark email sending

---

#### Track 2.4: QA Lead - Test Infrastructure
**Scope:**
- [ ] Audit existing test quality
- [ ] Create test user accounts in production database
- [ ] Implement meaningful integration tests
- [ ] Set up test data cleanup process

**Subsections:**
- 2.4.1: Audit 599 existing tests for quality
- 2.4.2: Create production test accounts
- 2.4.3: Implement critical flow tests
- 2.4.4: Document test execution process

---

### PHASE 3: FEATURE COMPLETION

#### 3.1: Complete Check-in Flow
- [ ] Member can check in successfully
- [ ] Contacts receive notification (push + email)
- [ ] Late check-in updates work
- [ ] Missed check-in alerts work

#### 3.2: Complete Invitation Flow
- [ ] Contact can invite Member
- [ ] Member receives email invitation
- [ ] Member can accept invitation
- [ ] Relationship is created correctly

#### 3.3: Complete Payment Flow
- [ ] Trial period works correctly
- [ ] RevenueCat subscription works (with placeholder keys)
- [ ] Grandfathering logic works
- [ ] Payment failure handling works

---

### PHASE 4: POLISH & VALIDATION

#### 4.1: UX/UI Designer - Design Consistency
- [ ] Verify theme system is applied consistently
- [ ] Check all touch targets meet 60pt minimum
- [ ] Verify color contrast meets WCAG AA

#### 4.2: Accessibility Specialist - WCAG Compliance
- [ ] Audit all screens for accessibility
- [ ] Implement font scaling properly
- [ ] Add missing accessibility labels
- [ ] Test with VoiceOver

#### 4.3: Product Manager - Feature Validation
- [ ] Verify all features work end-to-end
- [ ] Document any remaining gaps
- [ ] Create user acceptance test plan

---

### PHASE 5: FINAL QA & LAUNCH PREP

#### 5.1: Full Regression Testing
- [ ] All 599+ tests pass
- [ ] E2E tests pass
- [ ] Physical device testing passes
- [ ] No console errors

#### 5.2: Production Readiness
- [ ] Security review complete
- [ ] Performance acceptable
- [ ] Error handling complete
- [ ] Logging/monitoring in place

---

## EXECUTION TRACKING

### Current Status
- **Phase:** 2 - Core Implementation
- **Wave:** Starting
- **Subsection:** N/A
- **Blocker:** macOS system bug requires Mac restart before iOS build will work

### Completed Phases

#### ✅ PHASE 1.1: Security Engineer (COMPLETED 2025-12-22)
| Subsection | Task | Status |
|------------|------|--------|
| 1.1.1 | Fix .env configuration | ✅ DONE |
| 1.1.2 | Remove deprecated credentials | ✅ DONE |
| 1.1.3 | Verify JWT configuration | ✅ DONE - Fixed hardcoded fallback vulnerability |
| 1.1.4 | Audit authentication flow | ✅ DONE - Fixed broken Stripe import in delete-account |

**Key Changes:**
- `.env` updated to production Supabase URL
- Removed Stripe/Twilio credentials
- Added Postmark placeholders
- Added RevenueCat placeholders
- Fixed JWT secret vulnerability in `supabase/functions/_shared/auth.ts`
- Fixed `supabase/functions/auth/delete-account/index.ts` - replaced broken Stripe import with RevenueCat

#### ✅ PHASE 1.2: Database Engineer (COMPLETED 2025-12-22)
| Subsection | Task | Status |
|------------|------|--------|
| 1.2.1 | Analyze current database schema | ✅ DONE |
| 1.2.2 | Create comprehensive migration SQL | ✅ DONE |
| 1.2.3 | Apply migrations (USER) | ✅ DONE |
| 1.2.4 | Verify tables created via API | ✅ DONE |
| 1.2.5 | Confirm old tables deleted | ✅ DONE |

**Key Changes:**
- Created `COMPLETE_DATABASE_RESET.sql` (1,437 lines)
- User executed SQL in Supabase Dashboard
- Old tables deleted (contacts, checkins, admin_users, sms_logs, etc.)
- New tables created (users, members, check_ins, email_logs, audit_logs, etc.)

#### ✅ PHASE 1.3: DevOps Engineer (COMPLETED 2025-12-22)
| Subsection | Task | Status |
|------------|------|--------|
| 1.3.1 | Fix Bundle ID in Xcode | ✅ DONE - Changed to me.pruuf.pruuf |
| 1.3.2 | Create GoogleService-Info.plist placeholder | ✅ DONE |
| 1.3.3 | Update AppDelegate.mm with Firebase | ✅ DONE |
| 1.3.4 | Add Background Modes to Info.plist | ✅ DONE |
| 1.3.5 | Verify iOS build compiles | ⚠️ BLOCKED - macOS system bug |

**Key Changes:**
- Fixed Bundle ID from `org.reactjs.native.example...` to `me.pruuf.pruuf`
- Added CODE_SIGN_ENTITLEMENTS to project
- Created `ios/Pruuf/GoogleService-Info.plist.example` template
- Added GoogleService-Info.plist references to Xcode project
- Updated `ios/Pruuf/AppDelegate.mm` with `[FIRApp configure]`
- Updated `ios/Pruuf/AppDelegate.h` with UNUserNotificationCenterDelegate
- Added `UIBackgroundModes` → `remote-notification` to Info.plist
- pod install succeeded (84 deps, 99 pods)
- Build blocked by AssetCatalogSimulatorAgent macOS bug (NOT code issue)

**User Actions Required:**
1. ⚠️ RESTART YOUR MAC to fix AssetCatalogSimulatorAgent issue
2. Download GoogleService-Info.plist from Firebase Console (Bundle ID: me.pruuf.pruuf)
3. Save to: `ios/Pruuf/GoogleService-Info.plist`

---

### 📋 PHASE 2: CORE IMPLEMENTATION (CURRENT)

#### ✅ Track 2.1: Backend Engineer - Edge Function Fixes (COMPLETED 2025-12-22)
| Subsection | Task | Status |
|------------|------|--------|
| 2.1.1 | Fix delete-account broken import | ✅ DONE (Phase 1.1) |
| 2.1.2 | Remove SMS from check-in function | ✅ DONE |
| 2.1.3 | Remove SMS from cron/check-missed-checkins | ✅ DONE |
| 2.1.4 | Remove SMS from cron/grace-period-expirations | ✅ DONE |
| 2.1.5 | Update login to remove Stripe fields | ✅ DONE |
| 2.1.6 | Update accept-invitation to use RevenueCat | ✅ DONE |
| 2.1.7 | Delete sms.ts shared module | ✅ DONE |
| 2.1.8 | Update db.ts to remove logSms | ✅ DONE |
| 2.1.9 | Update types.ts to remove Stripe fields | ✅ DONE |
| 2.1.10 | Update validators.ts and errors.ts | ✅ DONE |
| 2.1.11 | Test all modified Edge Functions | ✅ DONE - All 599 tests pass |

**Key Changes:**
- Replaced SMS with dual notification service (push + email) in all Edge Functions
- Removed `sms.ts` shared module entirely
- Updated all queries to fetch `email` instead of `phone` for notifications
- Replaced Stripe fields with RevenueCat (`revenuecat_app_user_id`)
- Updated `types.ts`, `validators.ts`, `errors.ts` to remove SMS/Stripe references

#### Track 2.2: Lead Mobile Engineer - Frontend Fixes
| Subsection | Task | Status |
|------------|------|--------|
| 2.2.1 | Replace Expo vector icons in all 18 screens | 🔲 PENDING |
| 2.2.2 | Remove Expo packages from package.json | 🔲 PENDING |
| 2.2.3 | Update jest mocks and config | 🔲 PENDING |
| 2.2.4 | Update NotificationSettingsScreen (remove SMS toggle) | 🔲 PENDING |
| 2.2.5 | Update HelpScreen text | 🔲 PENDING |
| 2.2.6 | Update MemberDetailScreen text | 🔲 PENDING |
| 2.2.7 | Update ContactDetailScreen text | 🔲 PENDING |
| 2.2.8 | Update PaymentSettingsScreen text | 🔲 PENDING |
| 2.2.9 | Remove Expo build files (eas.json, workflows) | 🔲 PENDING |
| 2.2.10 | Run tests and fix failures | 🔲 PENDING |

#### Track 2.3: Integrations Engineer - Service Setup
| Subsection | Task | Status |
|------------|------|--------|
| 2.3.1 | Firebase project configuration guide | ✅ DONE (Phase 1.3) |
| 2.3.2 | Generate and upload APNs key | 🔲 USER ACTION |
| 2.3.3 | Download and place GoogleService-Info.plist | 🔲 USER ACTION |
| 2.3.4 | Verify Firebase code integration | ✅ DONE (Phase 1.3) |
| 2.3.5 | Test push notification delivery | 🔲 PENDING |
| 2.3.6 | Verify RevenueCat placeholder integration | 🔲 PENDING |
| 2.3.7 | Test Postmark email sending | 🔲 PENDING |

#### Track 2.4: QA Lead - Test Infrastructure
| Subsection | Task | Status |
|------------|------|--------|
| 2.4.1 | Audit 599 existing tests for quality | 🔲 PENDING |
| 2.4.2 | Create production test accounts | 🔲 PENDING |
| 2.4.3 | Implement critical flow tests | 🔲 PENDING |
| 2.4.4 | Document test execution process | 🔲 PENDING |

---

### 📋 PHASE 3: FEATURE COMPLETION (PENDING)

| Subsection | Task | Status |
|------------|------|--------|
| 3.1.1 | Member can check in successfully | 🔲 PENDING |
| 3.1.2 | Contacts receive notification (push + email) | 🔲 PENDING |
| 3.1.3 | Late check-in updates work | 🔲 PENDING |
| 3.1.4 | Missed check-in alerts work | 🔲 PENDING |
| 3.2.1 | Contact can invite Member | 🔲 PENDING |
| 3.2.2 | Member receives email invitation | 🔲 PENDING |
| 3.2.3 | Member can accept invitation | 🔲 PENDING |
| 3.2.4 | Relationship is created correctly | 🔲 PENDING |
| 3.3.1 | Trial period works correctly | 🔲 PENDING |
| 3.3.2 | RevenueCat subscription works | 🔲 PENDING |
| 3.3.3 | Grandfathering logic works | 🔲 PENDING |
| 3.3.4 | Payment failure handling works | 🔲 PENDING |

---

### 📋 PHASE 4: POLISH & VALIDATION (PENDING)

| Subsection | Task | Status |
|------------|------|--------|
| 4.1.1 | Verify theme system is applied consistently | 🔲 PENDING |
| 4.1.2 | Check all touch targets meet 60pt minimum | 🔲 PENDING |
| 4.1.3 | Verify color contrast meets WCAG AA | 🔲 PENDING |
| 4.2.1 | Audit all screens for accessibility | 🔲 PENDING |
| 4.2.2 | Implement font scaling properly | 🔲 PENDING |
| 4.2.3 | Add missing accessibility labels | 🔲 PENDING |
| 4.2.4 | Test with VoiceOver | 🔲 PENDING |
| 4.3.1 | Verify all features work end-to-end | 🔲 PENDING |
| 4.3.2 | Document any remaining gaps | 🔲 PENDING |
| 4.3.3 | Create user acceptance test plan | 🔲 PENDING |

---

### 📋 PHASE 5: FINAL QA & LAUNCH PREP (PENDING)

| Subsection | Task | Status |
|------------|------|--------|
| 5.1.1 | All 599+ tests pass | 🔲 PENDING |
| 5.1.2 | E2E tests pass | 🔲 PENDING |
| 5.1.3 | Physical device testing passes | 🔲 PENDING |
| 5.1.4 | No console errors | 🔲 PENDING |
| 5.2.1 | Security review complete | 🔲 PENDING |
| 5.2.2 | Performance acceptable | 🔲 PENDING |
| 5.2.3 | Error handling complete | 🔲 PENDING |
| 5.2.4 | Logging/monitoring in place | 🔲 PENDING |

---

### Test Results Log

| Date | Phase | Tests Run | Passed | Failed | Notes |
|------|-------|-----------|--------|--------|-------|
| 2025-12-22 | Baseline | 599 | 599 | 0 | Initial verification |
| 2025-12-22 | Phase 1.1 | 599 | 599 | 0 | All security fixes pass |
| 2025-12-22 | Phase 2.1 | 599 | 599 | 0 | SMS/Stripe removal, RevenueCat integration |

---

## FILES TO DELETE

### Complete Removal List:
1. `supabase/functions/_shared/sms.ts`
2. `__mocks__/expo-splash-screen.js`
3. `__mocks__/expo-status-bar.js`
4. `eas.json`
5. `.github/workflows/eas-build.yml`
6. `.github/workflows/eas-update.yml`
7. `.expo/` directory (if exists)

### Files to Potentially Delete (after review):
1. `src/screens/auth/PhoneEntryScreen.tsx` (if not used for email)
2. `docs/EXPO_MIGRATION_TEST_CHECKLIST.md`

---

## NOTES

1. **No Android Focus:** All Android code remains but is not tested/fixed
2. **iOS Only:** Exclusive focus on iOS simulator + physical device
3. **No Commits:** Only the user commits code
4. **All Tests Must Pass:** No moving forward until tests pass
5. **Subsection Checkpoints:** Ask permission after each subsection

---

**Last Updated:** 2025-12-22
**Next Action:** Begin Phase 1, Wave 1.1 (Security Engineer - Credential & Auth Fixes)
