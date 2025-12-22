# PRUUF COMPREHENSIVE REMEDIATION PLAN

**Document Version:** 1.0
**Created:** December 21, 2025
**Last Updated:** December 21, 2025
**Status:** AWAITING APPROVAL

---

## GUIDING PRINCIPLES

### HONESTY POLICY

> **LYING IS NOT TOLERATED. HONESTY AND COMPLETENESS IS THE ONLY PATH.**

Every specialist agent and every task in this plan operates under these non-negotiable rules:

1. **No False Claims** - Never claim work was done that wasn't actually completed
2. **No Shortcuts** - Never take the easy path if it compromises quality
3. **No Hidden Failures** - Every test failure must be documented and resolved
4. **No Assumptions** - Verify everything; assume nothing works until proven
5. **Complete Transparency** - Report blockers immediately, not at the end
6. **100% Pass Rate Required** - Work continues until ALL tests pass

### VERIFICATION PROTOCOL

For every task:
- [ ] Task is actually completed (not just started)
- [ ] Test commands are run (not just written)
- [ ] Output is captured and verified
- [ ] Failures trigger immediate remediation
- [ ] Success is independently verifiable

---

## EXECUTION PARAMETERS

| Parameter | Value |
|-----------|-------|
| **Git Commits** | NOT PERMITTED - User handles all commits |
| **Push Notifications** | Firebase ONLY |
| **SMS/Phone** | REMOVE ALL - No Twilio, no SMS anywhere |
| **Stripe** | REMOVE ALL - Fully migrated to RevenueCat |
| **iOS Testing** | Simulators + Physical iPhone, iOS 16.2+ (production only, minimum iOS 16.2) |
| **Android Testing** | Simulators only, Android 10 (API 29) - Android 14 (API 34) |
| **Primary Platform** | iOS (prioritize iOS issues) |
| **Timeline** | Quality-driven - takes as long as needed |
| **Pass Rate Required** | 100% on all tests |

---

## TABLE OF CONTENTS

1. [Phase 1: Emergency Foundation](#phase-1-emergency-foundation)
   - 1.1 Security Engineer Tasks
   - 1.2 Database Engineer Tasks
   - 1.3 DevOps Engineer Tasks

2. [Phase 2: Core Implementation](#phase-2-core-implementation)
   - 2.1 Backend Engineer Tasks
   - 2.2 Lead Mobile Engineer Tasks
   - 2.3 Integrations Engineer Tasks
   - 2.4 QA Lead Tasks

3. [Phase 3: Feature Completion](#phase-3-feature-completion)
   - 3.1 Backend Engineer Tasks (continued)
   - 3.2 Product Manager Validation

4. [Phase 4: Polish & Validation](#phase-4-polish--validation)
   - 4.1 UX/UI Designer Tasks
   - 4.2 Accessibility Specialist Tasks
   - 4.3 UX Researcher Validation

5. [Phase 5: Final QA & Launch Prep](#phase-5-final-qa--launch-prep)
   - 5.1 QA Lead Final Testing
   - 5.2 All Specialists Sign-off

6. [Appendix A: Files Requiring Modification](#appendix-a-files-requiring-modification)
7. [Appendix B: Test Commands Reference](#appendix-b-test-commands-reference)
8. [Appendix C: Tier Classification](#appendix-c-tier-classification)

---

# PHASE 1: EMERGENCY FOUNDATION

**Duration:** Until complete (quality over speed)
**Dependencies:** None - this phase unblocks everything else
**Success Criteria:** All Tier 1 blockers resolved, CI/CD operational

---

## 1.1 SECURITY ENGINEER TASKS

### Task 1.1.1: Remove Hardcoded JWT Secret Fallback

**Problem:** `supabase/functions/_shared/auth.ts` has hardcoded JWT secret fallback
**Severity:** CRITICAL
**File:** `/supabase/functions/_shared/auth.ts` (lines 16-18)

**Current Code:**
```typescript
const JWT_SECRET = Deno.env.get('JWT_SECRET') ||
  'your-secret-key-must-be-at-least-32-characters-long';
```

**Required Change:**
```typescript
const JWT_SECRET = Deno.env.get('JWT_SECRET');
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be set and be at least 32 characters');
}
```

**Acceptance Criteria:**
- [ ] Fallback removed
- [ ] Validation added
- [ ] Function throws error if JWT_SECRET missing
- [ ] Existing JWT_SECRET in .env is valid (32+ chars)

**Test:**
```bash
# Verify JWT_SECRET exists and is valid length
grep "JWT_SECRET=" .env | cut -d'=' -f2 | wc -c
# Expected: 65 or more (64 chars + newline)
```

**Verification:**
- [ ] Test command executed
- [ ] Output confirms 65+ characters
- [ ] No hardcoded fallback in code

---

### Task 1.1.2: Remove All Stripe References

**Problem:** Deprecated Stripe code and credentials remain
**Severity:** HIGH

**Files to Modify:**

| File | Lines | Action |
|------|-------|--------|
| `.env` | 11-15 | Remove STRIPE_* variables |
| `.env.local` | 12-16 | Remove STRIPE_* variables |
| `jest.config.js` | 8 | Remove `@stripe/stripe-react-native` from transformIgnorePatterns |
| `supabase/functions/_shared/types.ts` | 33-34 | Remove stripe_customer_id, stripe_subscription_id fields |
| `supabase/functions/auth/login/index.ts` | 161-162 | Remove stripe fields from response |
| `supabase/functions/auth/delete-account/index.ts` | 29, 109-111, 130, 165 | Remove Stripe import and subscription cancellation |
| `supabase/functions/accept-invitation/index.ts` | 214, 223 | Remove stripe_subscription_id checks |
| `supabase/functions/_shared/validators.ts` | 261 | Remove stripe_subscription_id check |

**Acceptance Criteria:**
- [ ] Zero grep results for "stripe" in source files (excluding docs/tests)
- [ ] No Stripe environment variables in .env or .env.local
- [ ] Jest config updated
- [ ] All Edge Functions deploy without Stripe references

**Test:**
```bash
# Search for stripe in source (excluding docs, tests, migrations that document removal)
grep -ri "stripe" --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir="docs" --exclude-dir="tests" \
  --exclude="*migration*" --exclude="*021*" \
  supabase/functions/ src/ | grep -v "revenuecat.ts" | wc -l
# Expected: 0
```

**Verification:**
- [ ] Test command executed
- [ ] Output is 0
- [ ] Manual review confirms no Stripe code

---

### Task 1.1.3: Remove All Twilio References

**Problem:** Deprecated Twilio SMS code and credentials remain
**Severity:** HIGH

**Files to Modify:**

| File | Action |
|------|--------|
| `.env` | Remove lines 17-20 (TWILIO_*) |
| `.env.local` | Remove lines 18-21 (TWILIO_*) |
| `package.json` | Remove `"twilio": "^5.10.6"` dependency |
| `supabase/functions/_shared/sms.ts` | DELETE ENTIRE FILE |
| `supabase/functions/_shared/db.ts` | Remove `logSms` function (lines 680-703) |
| `supabase/functions/_shared/types.ts` | Remove SMS-related types |
| `src/types/database.ts` | Remove `twilio_sid` from SMSLog interface (line 120) |

**Edge Functions Using SMS (must update to use email/push instead):**

| Function | Lines | Change Required |
|----------|-------|-----------------|
| `members/check-in/index.ts` | ~line 24 | Replace SMS late notification with push/email |
| `cron/check-missed-checkins/index.ts` | ~line 11 | Replace SMS alert with push/email |

**Acceptance Criteria:**
- [ ] Zero grep results for "twilio" in source files
- [ ] Zero grep results for "sms" in Edge Functions (except type definitions for legacy data)
- [ ] `sms.ts` file deleted
- [ ] `twilio` package removed from package.json
- [ ] npm install runs without twilio

**Test:**
```bash
# Verify twilio package removed
grep -c "twilio" package.json
# Expected: 0

# Verify sms.ts deleted
ls supabase/functions/_shared/sms.ts 2>&1 | grep -c "No such file"
# Expected: 1

# Search for twilio in source
grep -ri "twilio" --include="*.ts" --include="*.tsx" \
  --exclude-dir="docs" --exclude-dir="tests" \
  supabase/functions/ src/ | wc -l
# Expected: 0
```

**Verification:**
- [ ] All three test commands executed
- [ ] All outputs match expected values
- [ ] `npm install` completes without twilio

---

### Task 1.1.4: Validate Environment Configuration

**Problem:** Missing critical environment variables
**Severity:** CRITICAL (Production Blocker)

**Required Variables Check:**

| Variable | Status | Action |
|----------|--------|--------|
| `SUPABASE_URL` | ✅ Present | Verify valid URL |
| `SUPABASE_ANON_KEY` | ✅ Present | Verify valid key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Present | Verify valid key |
| `REVENUECAT_API_KEY_IOS` | ⚠️ Check | Must have real key (not placeholder) |
| `REVENUECAT_API_KEY_ANDROID` | ⚠️ Check | Must have real key (not placeholder) |
| `FIREBASE_PROJECT_ID` | ⚠️ Check | Must be configured |
| `JWT_SECRET` | ✅ Present | Must be 32+ chars |
| `POSTMARK_SERVER_TOKEN` | ✅ Added | Must be valid token |
| `POSTMARK_FROM_EMAIL` | ✅ Added | Must be noreply@pruuf.me |

**Test:**
```bash
# Check all required variables exist
for var in SUPABASE_URL SUPABASE_ANON_KEY JWT_SECRET \
           REVENUECAT_API_KEY_IOS FIREBASE_PROJECT_ID \
           POSTMARK_SERVER_TOKEN POSTMARK_FROM_EMAIL; do
  grep -q "^${var}=" .env && echo "$var: OK" || echo "$var: MISSING"
done
```

**Verification:**
- [ ] All variables show "OK"
- [ ] No placeholder values (grep for "placeholder", "your_", "xxxxx")
- [ ] Postmark variables present and valid

---

## 1.2 DATABASE ENGINEER TASKS

### Task 1.2.1: Verify Schema Matches RevenueCat Migration

**Problem:** Ensure migration 021 properly removed Stripe columns
**Severity:** MEDIUM

**Verification Query:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id');
-- Expected: 0 rows (columns removed)

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('revenuecat_customer_id', 'revenuecat_subscription_id');
-- Expected: 2 rows (columns exist)
```

**Acceptance Criteria:**
- [ ] No stripe columns exist in users table
- [ ] RevenueCat columns exist in users table
- [ ] Migration 021 has been applied

**Test:**
```bash
# List applied migrations
supabase migration list
# Expected: 021_replace_stripe_with_revenuecat shows as applied
```

---

### Task 1.2.2: Add Missing Check-in Unique Constraint

**Problem:** Check-ins table allows duplicate same-day entries
**Severity:** MEDIUM

**Required Migration:**
```sql
-- Create new migration: 029_check_in_unique_constraint.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_member_day
  ON check_ins(member_id, DATE(checked_in_at AT TIME ZONE timezone));

COMMENT ON INDEX idx_checkins_member_day IS 'Prevents duplicate check-ins on same day';
```

**Acceptance Criteria:**
- [ ] Migration file created
- [ ] Migration applied successfully
- [ ] Duplicate check-in attempt returns error

**Test:**
```sql
-- Attempt duplicate insert (should fail)
INSERT INTO check_ins (member_id, checked_in_at, timezone)
VALUES ('existing-member-uuid', NOW(), 'America/New_York');
-- Then immediately:
INSERT INTO check_ins (member_id, checked_in_at, timezone)
VALUES ('existing-member-uuid', NOW(), 'America/New_York');
-- Expected: Second insert fails with unique constraint violation
```

---

### Task 1.2.3: Add Check-in Status Column

**Problem:** Missing status column (on_time vs late)
**Severity:** MEDIUM

**Required Migration:**
```sql
-- Create new migration: 030_check_in_status.sql
ALTER TABLE check_ins
ADD COLUMN IF NOT EXISTS status VARCHAR(10)
  DEFAULT 'on_time'
  CHECK (status IN ('on_time', 'late'));

COMMENT ON COLUMN check_ins.status IS 'Whether check-in was on_time or late';

-- Backfill existing records
UPDATE check_ins SET status = 'on_time' WHERE status IS NULL;
```

**Acceptance Criteria:**
- [ ] Migration file created
- [ ] Migration applied successfully
- [ ] All existing check-ins have status='on_time'
- [ ] New check-ins require valid status

**Test:**
```sql
SELECT COUNT(*) FROM check_ins WHERE status IS NULL;
-- Expected: 0
```

---

## 1.3 DEVOPS ENGINEER TASKS

### Task 1.3.1: Create GitHub Actions CI/CD Pipeline

**Problem:** No automated testing or build verification
**Severity:** HIGH

**Create File:** `.github/workflows/test.yml`

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage --watchAll=false
```

**Acceptance Criteria:**
- [ ] Workflow file created
- [ ] Workflow runs on push
- [ ] All tests pass in CI
- [ ] Coverage report generated

**Test:**
```bash
# Verify workflow file exists
ls .github/workflows/test.yml
# Expected: File exists

# Dry run locally
npm run lint && npm run type-check && npm test -- --watchAll=false
# Expected: All pass
```

---

### Task 1.3.2: Update iOS Minimum Version to 16.2

**Problem:** Podfile currently targets iOS 15.1, must be updated to 16.2
**Severity:** HIGH
**File:** `/ios/Podfile`

**Current:**
```ruby
platform :ios, '15.1'
```

**Required:**
```ruby
platform :ios, '16.2'
```

**Acceptance Criteria:**
- [ ] Podfile updated to iOS 16.2
- [ ] Pod install succeeds
- [ ] Build succeeds on iOS 16.2+ simulators
- [ ] No iOS 15.x compatibility code needed

---

### Task 1.3.3: Verify iOS Simulator Builds

**Problem:** No device testing has been done
**Severity:** CRITICAL

**Target iOS Versions:**
- iOS 16.2 (minimum supported)
- iOS 17.x
- iOS 18.x (latest stable)

**Test Commands:**
```bash
# Clean and rebuild iOS
cd ios && rm -rf Pods Podfile.lock build && pod install && cd ..

# Build for simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
# Expected: App launches successfully

# Build for older iOS
npx react-native run-ios --simulator="iPhone SE (3rd generation)"
# Expected: App launches successfully
```

**Acceptance Criteria:**
- [ ] Pod install completes without errors
- [ ] iOS build succeeds
- [ ] App launches on iPhone 15 Pro simulator
- [ ] App launches on iPhone SE simulator
- [ ] No crash on startup

**Verification Checklist:**
- [ ] Build command executed
- [ ] App launched successfully
- [ ] Welcome screen displayed
- [ ] No red error screen
- [ ] Console has no critical errors

---

### Task 1.3.4: Verify Android Simulator Builds

**Problem:** Android not tested
**Severity:** MEDIUM (iOS is primary)

**Target Android Versions:**
- Android 10 (API 29) - minimum
- Android 11 (API 30)
- Android 12 (API 31)
- Android 13 (API 33)
- Android 14 (API 34) - latest stable

**Test Commands:**
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Build and run
npx react-native run-android
# Expected: App launches on emulator
```

**Acceptance Criteria:**
- [ ] Gradle build succeeds
- [ ] APK generated
- [ ] App launches on emulator
- [ ] No crash on startup

---

### Task 1.3.5: Run Full Test Suite

**Problem:** Need baseline test results
**Severity:** HIGH

**Test Command:**
```bash
npm test -- --watchAll=false --coverage 2>&1 | tee test-results.txt
```

**Acceptance Criteria:**
- [ ] All tests pass (0 failures)
- [ ] Coverage meets threshold (50%+)
- [ ] Results saved to file

**Current Expected Results:**
- Test Suites: 43 passed
- Tests: 1,339 passed
- Coverage: 50%+

**Verification:**
- [ ] Test command executed
- [ ] Output shows 0 failures
- [ ] `test-results.txt` contains full output

---

# PHASE 2: CORE IMPLEMENTATION

**Duration:** Until complete
**Dependencies:** Phase 1 must be 100% complete
**Success Criteria:** Backend auth fixed, device testing verified, integrations working

---

## 2.1 BACKEND ENGINEER TASKS

### Task 2.1.1: Replace In-Memory Session Storage

**Problem:** Session tokens stored in JavaScript Map (lost on restart)
**Severity:** CRITICAL
**File:** `/supabase/functions/_shared/auth.ts`

**Current Code (lines 190-228):**
```typescript
const sessionTokens = new Map<string, {email: string; expires: Date}>();
```

**Required Change:**
Replace with database storage using existing `user_sessions` table.

**New Implementation:**
```typescript
// Store session in database
async function storeSession(token: string, email: string, expiresAt: Date): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      session_token: token,
      email: email,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to store session: ${error.message}`);
  }
}

// Retrieve session from database
async function getSession(token: string): Promise<{email: string; expires: Date} | null> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('email, expires_at')
    .eq('session_token', token)
    .single();

  if (error || !data) return null;

  const expires = new Date(data.expires_at);
  if (expires < new Date()) {
    // Session expired - delete it
    await supabase.from('user_sessions').delete().eq('session_token', token);
    return null;
  }

  return { email: data.email, expires };
}

// Delete session
async function deleteSession(token: string): Promise<void> {
  await supabase.from('user_sessions').delete().eq('session_token', token);
}
```

**Acceptance Criteria:**
- [ ] In-memory Map removed
- [ ] Database storage implemented
- [ ] Sessions persist across function restarts
- [ ] Expired sessions automatically cleaned
- [ ] Multi-device login works

**Test:**
```bash
# Deploy edge functions
supabase functions deploy

# Test login creates session in database
# (Manual test via API or frontend)
```

---

### Task 2.1.2: Update Check-in to Use Push/Email Instead of SMS

**Problem:** `members/check-in` still calls SMS functions
**Severity:** HIGH
**File:** `/supabase/functions/members/check-in/index.ts`

**Required Changes:**
1. Remove SMS import
2. Replace SMS calls with `sendDualNotification()` from dualNotifications.ts
3. Use LATE_CHECK_IN notification type

**Acceptance Criteria:**
- [ ] No SMS imports
- [ ] Uses dualNotifications for alerts
- [ ] Late check-in sends push + email
- [ ] Contacts notified via Firebase FCM

**Test:**
```bash
# Search for sms in check-in function
grep -n "sms" supabase/functions/members/check-in/index.ts
# Expected: 0 results
```

---

### Task 2.1.3: Update Missed Check-in Cron to Use Push/Email

**Problem:** `cron/check-missed-checkins` still calls SMS functions
**Severity:** HIGH
**File:** `/supabase/functions/cron/check-missed-checkins/index.ts`

**Required Changes:**
1. Remove SMS import
2. Replace SMS calls with `sendDualNotification()`
3. Use MISSED_CHECK_IN notification type (CRITICAL priority = push + email always)

**Acceptance Criteria:**
- [ ] No SMS imports
- [ ] Uses dualNotifications for alerts
- [ ] Missed check-in sends CRITICAL notification (push + email)
- [ ] All contacts notified

**Test:**
```bash
# Search for sms in cron function
grep -n "sms" supabase/functions/cron/check-missed-checkins/index.ts
# Expected: 0 results
```

---

### Task 2.1.4: Validate Firebase FCM Configuration

**Problem:** Firebase server key may not be validated at startup
**Severity:** MEDIUM
**File:** `/supabase/functions/_shared/push.ts`

**Required Change:**
```typescript
const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY');
if (!FIREBASE_SERVER_KEY) {
  console.error('WARNING: FIREBASE_SERVER_KEY not set - push notifications disabled');
}
```

**Acceptance Criteria:**
- [ ] Missing key logs warning (doesn't crash)
- [ ] Push notifications work when key present
- [ ] Graceful fallback to email-only if FCM unavailable

---

## 2.2 LEAD MOBILE ENGINEER TASKS

### Task 2.2.1: Fix SetCheckInTimeScreen

**Problem:** Time picker is non-functional (hardcoded to 10:00 AM)
**Severity:** CRITICAL
**File:** `/src/screens/onboarding/SetCheckInTimeScreen.tsx`

**Current State:**
- Shows hardcoded "10:00" display
- No actual time picker component
- Time cannot be changed

**Required Implementation:**
1. Add DateTimePicker component (react-native-datetimepicker)
2. Store selected time in state
3. Save to user profile on continue
4. Support 12-hour format with AM/PM

**Acceptance Criteria:**
- [ ] Time picker displays and functions
- [ ] Time can be changed by user
- [ ] Selected time saves to backend
- [ ] Time persists after navigation away

**Test:**
```bash
# Run app on simulator
npx react-native run-ios

# Manual test:
# 1. Go through onboarding to SetCheckInTime screen
# 2. Verify time picker appears
# 3. Change time to 2:00 PM
# 4. Continue to next screen
# 5. Go back - verify 2:00 PM is still selected
```

---

### Task 2.2.2: Device Testing on Physical iPhone

**Problem:** No real device testing done
**Severity:** CRITICAL

**Test Checklist:**
- [ ] App installs on device
- [ ] App launches without crash
- [ ] Welcome screen displays correctly
- [ ] Onboarding flow completes
- [ ] Check-in button works
- [ ] Push notifications received
- [ ] Biometric auth works (if enabled)
- [ ] App backgrounding/foregrounding works
- [ ] No memory warnings

**Test Command:**
```bash
# Build for device
npx react-native run-ios --device
```

---

### Task 2.2.3: Remove Any Remaining Expo Notification Code

**Problem:** Ensure no Expo notification conflicts remain
**Severity:** LOW (already verified clean)

**Verification:**
```bash
# Search for expo-notifications
grep -r "expo-notifications" --include="*.ts" --include="*.tsx" src/
# Expected: 0 results

# Search for Expo.Notifications
grep -r "Expo.Notifications" --include="*.ts" --include="*.tsx" src/
# Expected: 0 results
```

**Acceptance Criteria:**
- [ ] Zero Expo notification imports
- [ ] Firebase is only push notification system
- [ ] Local notifications use react-native-push-notification

---

## 2.3 INTEGRATIONS ENGINEER TASKS

### Task 2.3.1: Verify RevenueCat Integration

**Problem:** Need to confirm RevenueCat is fully functional
**Severity:** HIGH

**Test Checklist:**
- [ ] RevenueCat SDK initializes without error
- [ ] Offerings fetch successfully
- [ ] Customer info retrieves correctly
- [ ] Test purchase flow (sandbox)
- [ ] Webhook receives events

**Test Code:**
```typescript
// In App.tsx or debug screen
import Purchases from 'react-native-purchases';

async function testRevenueCat() {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('Offerings:', offerings.current);

    const customerInfo = await Purchases.getCustomerInfo();
    console.log('Customer:', customerInfo.originalAppUserId);

    return true;
  } catch (error) {
    console.error('RevenueCat error:', error);
    return false;
  }
}
```

---

### Task 2.3.2: Verify Firebase FCM Integration

**Problem:** Need to confirm push notifications work end-to-end
**Severity:** HIGH

**Test Checklist:**
- [ ] FCM token generated on app start
- [ ] Token registered with backend
- [ ] Foreground notifications display
- [ ] Background notifications received
- [ ] Notification tap opens correct screen

**Test:**
```bash
# Check FCM token in logs
# Look for: "FCM Token: xxxxx"

# Send test notification via Firebase Console
# Verify received on device
```

---

### Task 2.3.3: Verify Postmark Email Integration

**Problem:** Email configuration was missing
**Severity:** CRITICAL (now added to .env.example)

**Test:**
```bash
# Verify Postmark config exists
grep "POSTMARK" .env.example
# Expected: 3 lines (TOKEN, FROM_EMAIL, FROM_NAME)

# Test email sending (requires backend call)
# Use Postmark dashboard to verify delivery
```

**Acceptance Criteria:**
- [ ] Postmark credentials configured
- [ ] Test email sends successfully
- [ ] Email arrives in inbox (not spam)
- [ ] From address is noreply@pruuf.me

---

## 2.4 QA LEAD TASKS

### Task 2.4.1: Fix Broken paymentSlice Tests

**Problem:** paymentSlice.test.ts references old Stripe implementation
**Severity:** MEDIUM
**File:** `/src/store/slices/__tests__/paymentSlice.test.ts`

**Required Changes:**
- Update all Stripe references to RevenueCat
- Fix mock implementations
- Ensure all tests pass

**Test:**
```bash
npm test -- --testPathPattern="paymentSlice" --watchAll=false
# Expected: All tests pass
```

---

### Task 2.4.2: Create Critical Flow Integration Tests

**Problem:** No integration tests for critical user flows
**Severity:** HIGH

**Required Tests:**
1. **Contact Onboarding Flow**
   - Email entry → Verification → PIN → Member invite

2. **Member Onboarding Flow**
   - Invite code → PIN → Check-in time → Dashboard

3. **Daily Check-in Flow**
   - Tap "I'm OK" → Success → Contacts notified

4. **Payment Flow**
   - View offerings → Purchase → Subscription active

**Acceptance Criteria:**
- [ ] Test files created
- [ ] All critical paths covered
- [ ] Tests pass consistently
- [ ] No flaky tests

---

### Task 2.4.3: Establish Test Baseline

**Problem:** Need documented baseline for all tests
**Severity:** HIGH

**Create:** `TEST_BASELINE.md`

```markdown
# Test Baseline - [DATE]

## Summary
- Total Test Suites: XX
- Total Tests: XX
- Passing: XX
- Failing: XX
- Coverage: XX%

## By Category
| Category | Tests | Passing | Failing |
|----------|-------|---------|---------|
| Components | XX | XX | XX |
| Redux Slices | XX | XX | XX |
| Services | XX | XX | XX |
| Hooks | XX | XX | XX |
| Utils | XX | XX | XX |
```

---

# PHASE 3: FEATURE COMPLETION

**Duration:** Until complete
**Dependencies:** Phase 2 must be 100% complete
**Success Criteria:** All user flows functional, trial/payment mechanics working

---

## 3.1 BACKEND ENGINEER TASKS (Continued)

### Task 3.1.1: Implement Member Invite Acceptance

**Problem:** EnterInviteCodeScreen doesn't validate or process invites
**Severity:** CRITICAL

**Required Implementation:**
1. Validate invite code against database
2. Create member_contact_relationship
3. Set is_member flag on user
4. Set grandfathered_free if applicable
5. Return success/error to frontend

**Acceptance Criteria:**
- [ ] Invite code validates against database
- [ ] Relationship created on acceptance
- [ ] is_member flag set correctly
- [ ] grandfathered_free logic works
- [ ] Frontend receives confirmation

---

### Task 3.1.2: Implement Trial Mechanics

**Problem:** Trial start/end not tracked
**Severity:** HIGH

**Required Implementation:**
1. Set trial_start_date when first Member onboarded
2. Calculate trial_end_date (start + 30 days)
3. Send trial warnings (14d, 7d, 1d)
4. Freeze account when trial ends without payment
5. Show trial countdown in UI

**Acceptance Criteria:**
- [ ] Trial starts on first Member invite sent
- [ ] Trial end date calculated correctly
- [ ] Warning notifications sent
- [ ] Account freezes without payment
- [ ] UI shows days remaining

---

### Task 3.1.3: Implement Grandfathering Logic

**Problem:** Subscription not canceled when Contact becomes Member
**Severity:** MEDIUM

**Required Implementation:**
1. Detect when paying Contact receives Member invite
2. Cancel RevenueCat subscription
3. Set grandfathered_free = true
4. Notify user they're now free forever

**Acceptance Criteria:**
- [ ] Grandfathering triggers on invite acceptance
- [ ] RevenueCat subscription canceled
- [ ] User marked as grandfathered_free
- [ ] User notified of free status

---

## 3.2 PRODUCT MANAGER VALIDATION

### Task 3.2.1: Validate All User Flows

**Problem:** Many flows incomplete or broken
**Severity:** HIGH

**Flow Validation Checklist:**

| Flow | Status | Blocker |
|------|--------|---------|
| Contact Registration | [ ] | |
| Contact Onboarding | [ ] | |
| Member Invitation | [ ] | |
| Member Registration | [ ] | |
| Member Onboarding | [ ] | |
| Daily Check-in | [ ] | |
| Missed Check-in Alert | [ ] | |
| Late Check-in Update | [ ] | |
| Payment/Subscription | [ ] | |
| Trial Expiration | [ ] | |
| Account Settings | [ ] | |
| Account Deletion | [ ] | |

**Acceptance Criteria:**
- [ ] All flows manually tested
- [ ] All flows complete successfully
- [ ] No broken screens or dead ends

---

# PHASE 4: POLISH & VALIDATION

**Duration:** Until complete
**Dependencies:** Phase 3 must be 100% complete
**Success Criteria:** Accessibility compliant, design consistent, elderly-friendly

---

## 4.1 UX/UI DESIGNER TASKS

### Task 4.1.1: Apply Font Scaling Across All Screens

**Problem:** Font scaling built but not applied
**Severity:** HIGH

**Current State:** Only 5 of 30+ screens use font scaling

**Required Changes:**
1. Create `useFontSize()` hook
2. Apply to all Text components
3. Test at 1.0x, 1.25x, 1.5x

**Hook Implementation:**
```typescript
// src/hooks/useFontSize.ts
import { useAppSelector } from '../store/hooks';
import { FONT_SIZES } from '../theme/typography';

export function useFontSize() {
  const preference = useAppSelector(state => state.settings.fontSizePreference);
  return FONT_SIZES[preference || 'standard'];
}
```

**Acceptance Criteria:**
- [ ] Hook created
- [ ] All screens use hook
- [ ] Font scales correctly at all 3 sizes
- [ ] No text overflow at 1.5x

---

### Task 4.1.2: Fix Touch Target Violations

**Problem:** TextInput height is 50pt (should be 60pt)
**Severity:** MEDIUM
**File:** `/src/components/common/TextInput.tsx`

**Required Change:**
```typescript
input: {
  height: 60,  // Changed from 50
  // ... rest of styles
}
```

**Acceptance Criteria:**
- [ ] TextInput height is 60pt
- [ ] All interactive elements >= 60pt
- [ ] Verified with accessibility inspector

---

### Task 4.1.3: Extract Reusable Components

**Problem:** MemberCard, ContactCard duplicated inline
**Severity:** LOW

**Create Components:**
1. `src/components/common/MemberCard.tsx`
2. `src/components/common/ContactCard.tsx`
3. `src/components/common/StatusIndicator.tsx`

**Acceptance Criteria:**
- [ ] Components extracted
- [ ] Used in dashboards
- [ ] Consistent styling

---

## 4.2 ACCESSIBILITY SPECIALIST TASKS

### Task 4.2.1: Add Screen Reader Labels to Settings

**Problem:** Settings rows lack accessibility props
**Severity:** MEDIUM

**Required Changes:**
Add to all SettingRow components:
```typescript
accessible={true}
accessibilityRole="button"
accessibilityLabel={`${label}: ${value}`}
accessibilityHint={`Double tap to change ${label}`}
```

**Acceptance Criteria:**
- [ ] All settings rows accessible
- [ ] VoiceOver reads correctly
- [ ] TalkBack reads correctly

---

### Task 4.2.2: Fix Color-Only Status Indicators

**Problem:** Status badges use color only (fails WCAG)
**Severity:** MEDIUM

**Required Changes:**
Add icon alongside color:
- ✓ Green = checkmark icon
- ⏳ Orange = clock icon
- ✗ Red = alert icon

**Acceptance Criteria:**
- [ ] Icons added to status badges
- [ ] Color-blind users can distinguish states
- [ ] Screen readers announce status

---

### Task 4.2.3: Test With VoiceOver

**Problem:** No screen reader testing done
**Severity:** HIGH

**Test Checklist:**
- [ ] Welcome screen reads correctly
- [ ] Onboarding navigable with VoiceOver
- [ ] Check-in button announces correctly
- [ ] Settings navigable
- [ ] All buttons have labels

---

## 4.3 UX RESEARCHER VALIDATION

### Task 4.3.1: Validate Elderly User Experience

**Problem:** App may still be confusing for elderly users
**Severity:** HIGH

**Validation Checklist (simulate 75-year-old user):**
- [ ] Text is large enough
- [ ] Buttons are easy to tap
- [ ] Instructions are clear
- [ ] Errors are compassionate
- [ ] Navigation is obvious
- [ ] No technical jargon

**Key Screens to Validate:**
1. Welcome screen - Is CTA obvious?
2. PIN entry - Is it confusing?
3. Check-in - Is button obvious?
4. Settings - Too many options?

---

# PHASE 5: FINAL QA & LAUNCH PREP

**Duration:** Until 100% pass rate
**Dependencies:** Phases 1-4 must be 100% complete
**Success Criteria:** Zero failures, production ready

---

## 5.1 QA LEAD FINAL TESTING

### Task 5.1.1: Full Regression Test

**Run all tests and document results:**

```bash
npm test -- --watchAll=false --coverage 2>&1 | tee final-test-results.txt
```

**Acceptance Criteria:**
- [ ] 0 test failures
- [ ] Coverage >= 50%
- [ ] All critical paths tested
- [ ] Results documented

---

### Task 5.1.2: E2E Testing on Simulators

**iOS Simulators to Test:**
- [ ] iPhone 14 - iOS 16.2 (minimum supported)
- [ ] iPhone 14 Pro - iOS 16.4
- [ ] iPhone 15 - iOS 17.x
- [ ] iPhone 15 Pro - iOS 18.x (latest stable)

**Android Emulators to Test:**
- [ ] Pixel 4 - Android 10 (API 29)
- [ ] Pixel 5 - Android 11 (API 30)
- [ ] Pixel 6 - Android 12 (API 31)
- [ ] Pixel 7 - Android 13 (API 33)
- [ ] Pixel 8 - Android 14 (API 34)

---

### Task 5.1.3: Physical Device Testing

**Test on physical iPhone:**
- [ ] App installs
- [ ] All flows complete
- [ ] Push notifications work
- [ ] Performance acceptable
- [ ] No crashes

---

## 5.2 ALL SPECIALISTS SIGN-OFF

### Final Sign-off Checklist

| Specialist | Area | Sign-off |
|------------|------|----------|
| Security Engineer | Auth, secrets, vulnerabilities | [ ] |
| Database Engineer | Schema, RLS, migrations | [ ] |
| DevOps Engineer | CI/CD, builds | [ ] |
| Backend Engineer | Edge Functions, APIs | [ ] |
| Lead Mobile Engineer | Frontend, device testing | [ ] |
| Integrations Engineer | RevenueCat, Firebase, Postmark | [ ] |
| QA Lead | Test coverage, quality | [ ] |
| UX/UI Designer | Design system, consistency | [ ] |
| Accessibility Specialist | WCAG compliance | [ ] |
| Product Manager | Feature completeness | [ ] |
| UX Researcher | Elderly user experience | [ ] |

**All specialists must verify their domain is 100% complete before sign-off.**

---

# APPENDIX A: FILES REQUIRING MODIFICATION

## Files to DELETE

| File | Reason |
|------|--------|
| `supabase/functions/_shared/sms.ts` | Twilio SMS deprecated |

## Files to MODIFY

| File | Changes |
|------|---------|
| `.env` | Remove Stripe/Twilio variables |
| `.env.local` | Remove Stripe/Twilio variables |
| `package.json` | Remove twilio dependency |
| `jest.config.js` | Remove @stripe/stripe-react-native |
| `supabase/functions/_shared/auth.ts` | Fix JWT fallback, session storage |
| `supabase/functions/_shared/types.ts` | Remove stripe fields |
| `supabase/functions/_shared/db.ts` | Remove logSms function |
| `supabase/functions/auth/login/index.ts` | Remove stripe fields from response |
| `supabase/functions/auth/delete-account/index.ts` | Remove Stripe import/usage |
| `supabase/functions/accept-invitation/index.ts` | Remove stripe checks |
| `supabase/functions/_shared/validators.ts` | Remove stripe validation |
| `supabase/functions/members/check-in/index.ts` | Replace SMS with push/email |
| `supabase/functions/cron/check-missed-checkins/index.ts` | Replace SMS with push/email |
| `src/types/database.ts` | Remove twilio_sid |
| `ios/Podfile` | Update minimum iOS to 16.2 |
| `src/screens/onboarding/SetCheckInTimeScreen.tsx` | Add working time picker |
| `src/components/common/TextInput.tsx` | Increase height to 60pt |

## Files to CREATE

| File | Purpose |
|------|---------|
| `.github/workflows/test.yml` | CI/CD pipeline |
| `supabase/migrations/029_check_in_unique_constraint.sql` | Prevent duplicate check-ins |
| `supabase/migrations/030_check_in_status.sql` | Add status column |
| `src/hooks/useFontSize.ts` | Font scaling hook |
| `src/components/common/MemberCard.tsx` | Reusable member card |
| `src/components/common/ContactCard.tsx` | Reusable contact card |
| `TEST_BASELINE.md` | Test documentation |

---

# APPENDIX B: TEST COMMANDS REFERENCE

## Unit Tests
```bash
# Run all tests
npm test -- --watchAll=false

# Run with coverage
npm test -- --watchAll=false --coverage

# Run specific test file
npm test -- --testPathPattern="filename" --watchAll=false

# Run tests matching pattern
npm test -- --testNamePattern="pattern" --watchAll=false
```

## Type Checking
```bash
npm run type-check
```

## Linting
```bash
npm run lint
npm run lint:fix
```

## iOS Build
```bash
# Clean build
cd ios && rm -rf Pods Podfile.lock build && pod install && cd ..

# Run on simulator
npx react-native run-ios --simulator="iPhone 15 Pro"

# Run on device
npx react-native run-ios --device
```

## Android Build
```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Run on emulator
npx react-native run-android
```

## Supabase
```bash
# Deploy functions
supabase functions deploy

# Run migrations
supabase db push

# List migrations
supabase migration list
```

---

# APPENDIX C: TIER CLASSIFICATION

## TIER 1: BLOCKERS (Must Fix First)

| Problem | Owner | Status |
|---------|-------|--------|
| Hardcoded JWT secret fallback | Security Engineer | [ ] |
| In-memory session storage | Backend Engineer | [ ] |
| SetCheckInTimeScreen non-functional | Lead Mobile Engineer | [ ] |
| No device testing | DevOps Engineer | [ ] |
| Remove all Stripe references | Security Engineer | [ ] |
| Remove all Twilio references | Security Engineer | [ ] |

## TIER 2: CRITICAL (Before Beta)

| Problem | Owner | Status |
|---------|-------|--------|
| Member invite acceptance broken | Backend Engineer | [ ] |
| Trial/payment mechanics missing | Backend Engineer | [ ] |
| Missed check-in alerts use SMS | Backend Engineer | [ ] |
| Check-in late notification uses SMS | Backend Engineer | [ ] |
| RevenueCat integration verification | Integrations Engineer | [ ] |
| Firebase FCM verification | Integrations Engineer | [ ] |

## TIER 3: HIGH PRIORITY (Before Launch)

| Problem | Owner | Status |
|---------|-------|--------|
| Font scaling not applied | Accessibility Specialist | [ ] |
| Test quality is illusory | QA Lead | [ ] |
| CI/CD doesn't exist | DevOps Engineer | [ ] |
| TextInput touch target too small | UX/UI Designer | [ ] |
| Settings lack accessibility labels | Accessibility Specialist | [ ] |
| Status indicators color-only | Accessibility Specialist | [ ] |

---

# DOCUMENT END

**This plan will be executed phase by phase. No phase begins until the previous phase is 100% complete. No task is marked complete until verified. Honesty is mandatory.**

**Next Step:** User approval to begin Phase 1 execution.
