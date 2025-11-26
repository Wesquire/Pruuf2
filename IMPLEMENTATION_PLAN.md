# Pruuf - Complete Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan to complete the Pruuf React Native application according to the full 8,000+ word specification. The current implementation has completed the frontend foundation (Phases 1-6), with 62 tests passing. This plan covers all remaining backend infrastructure, API endpoints, business logic, and production features required for App Store launch.

## Current Status

### ✅ Completed (Phases 1-6)
- React Native 0.74 project with TypeScript
- Complete UI component library (Button, TextInput, Card, CodeInput, etc.)
- All authentication screens (Welcome, Phone, PIN, Font Size)
- All onboarding screens (Contact & Member flows)
- Dashboard screens (Member & Contact)
- Payment screens (Stripe integration setup)
- Database schema (2 migrations with 11 tables)
- Utility functions (phone, timezone, validation, date)
- Frontend services (API client, Supabase client, notifications, storage)
- Redux state management
- 62 unit tests passing
- WCAG AAA design system

### ❌ Not Implemented (Phases 7-18)
- Backend API endpoints (all `/api/*` routes)
- Twilio SMS integration
- Stripe webhook handler
- Background jobs/cron tasks
- Additional screens (5+ screens)
- Edge case handling (80+ scenarios)
- Local notifications
- Deep linking
- Analytics & error tracking
- Grandfathered free logic
- Complete payment business rules

## Implementation Phases

---

## Phase 1: Backend API Infrastructure

### 1.1 Supabase Edge Functions Setup
**Goal:** Create the backend infrastructure for all API endpoints

**Tasks:**
- [ ] Set up Supabase Edge Functions project structure
- [ ] Create shared utilities folder for common functions
- [ ] Implement authentication middleware
- [ ] Create error handling utilities
- [ ] Set up logging infrastructure
- [ ] Configure CORS and security headers
- [ ] Create database helper functions
- [ ] Implement bcrypt PIN hashing utilities
- [ ] Create JWT token generation/validation
- [ ] Set up environment variables structure

**Acceptance Criteria:**
- Edge Functions can be deployed to Supabase
- Shared utilities can be imported across functions
- Authentication middleware validates JWT tokens
- Error responses follow consistent format
- All functions have proper logging

**Files to Create:**
```
supabase/functions/
├── _shared/
│   ├── auth.ts          # JWT and auth middleware
│   ├── db.ts            # Database helpers
│   ├── errors.ts        # Error handling
│   ├── sms.ts           # Twilio SMS helpers
│   ├── stripe.ts        # Stripe helpers
│   ├── validation.ts    # Input validation
│   └── types.ts         # Shared types
```

---

## Phase 2: Twilio SMS Service

### 2.1 Twilio Integration
**Goal:** Implement complete SMS functionality using Twilio

**Tasks:**
- [ ] Install Twilio SDK in Edge Functions
- [ ] Create Twilio client initialization
- [ ] Implement sendSMS helper function
- [ ] Create SMS template system
- [ ] Implement verification code SMS
- [ ] Implement invitation SMS
- [ ] Implement missed check-in alert SMS
- [ ] Implement trial expiration SMS
- [ ] Implement payment failure SMS
- [ ] Create SMS logging to database
- [ ] Handle Twilio delivery webhooks
- [ ] Implement SMS error handling and retries

**SMS Templates to Implement:**
1. Verification code: "Your Pruuf verification code is: [CODE]. Valid for 10 minutes."
2. Member invitation: "Hi [NAME]! [CONTACT_NAME] has invited you to Pruuf. Download the app and use code [CODE]."
3. Missed check-in: "[MEMBER_NAME] has not checked in today. Please reach out to ensure they're okay."
4. Trial expiration: "Your 30-day free trial ends in [DAYS] days. Add a payment method to continue."
5. Payment failure: "Your payment failed. Please update your payment method within 7 days."
6. Welcome: "Welcome to Pruuf! Check in daily and your contacts will be alerted if you miss a check-in."

**Acceptance Criteria:**
- SMS can be sent successfully via Twilio
- All SMS templates are implemented
- SMS logs are recorded in database
- Delivery status is tracked
- Error handling works for failed sends

**Files to Create:**
```
supabase/functions/_shared/sms.ts
supabase/functions/_shared/sms-templates.ts
supabase/functions/webhooks/twilio.ts
```

---

## Phase 3: Authentication API Endpoints

### 3.1 POST /api/auth/send-verification-code
**Request:**
```json
{
  "phone": "+15551234567",
  "country_code": "US"
}
```

**Implementation:**
- [ ] Validate phone number format
- [ ] Generate 6-digit verification code
- [ ] Store code in verification_codes table (10min expiration)
- [ ] Send SMS via Twilio
- [ ] Log SMS in sms_logs table
- [ ] Return session_token for next step
- [ ] Rate limit: Max 3 codes per phone per hour

**Response:**
```json
{
  "success": true,
  "session_token": "temp_xyz123",
  "expires_in": 600
}
```

### 3.2 POST /api/auth/verify-code
**Implementation:**
- [ ] Validate session_token
- [ ] Check code matches and not expired
- [ ] Increment attempts counter (max 5)
- [ ] Mark code as used
- [ ] Check if user exists (login vs signup)
- [ ] Return appropriate session_token

### 3.3 POST /api/auth/create-account
**Implementation:**
- [ ] Validate session_token
- [ ] Hash PIN with bcrypt (cost 10)
- [ ] Create user record
- [ ] Set account_status = 'trial'
- [ ] Set trial dates (30 days from now)
- [ ] Generate JWT token (90-day expiration)
- [ ] Return user data + access_token

### 3.4 POST /api/auth/login
**Implementation:**
- [ ] Find user by phone
- [ ] Verify PIN with bcrypt
- [ ] Check account_status (prevent deleted/frozen)
- [ ] Handle failed attempts (lock after 5 failures for 30min)
- [ ] Generate new JWT token
- [ ] Return user data + access_token

### 3.5 POST /api/auth/forgot-pin
**Implementation:**
- [ ] Send verification code
- [ ] Same logic as send-verification-code
- [ ] Different SMS template

### 3.6 POST /api/auth/reset-pin
**Implementation:**
- [ ] Verify code
- [ ] Hash new PIN
- [ ] Update user record
- [ ] Invalidate all existing JWT tokens (optional)

**Acceptance Criteria:**
- All 6 endpoints working
- PIN hashing with bcrypt
- JWT tokens generated correctly
- Rate limiting implemented
- Failed login lockout works
- All responses match spec format

**Files to Create:**
```
supabase/functions/auth/send-verification-code/index.ts
supabase/functions/auth/verify-code/index.ts
supabase/functions/auth/create-account/index.ts
supabase/functions/auth/login/index.ts
supabase/functions/auth/forgot-pin/index.ts
supabase/functions/auth/reset-pin/index.ts
```

---

## Phase 4: Members API Endpoints

### 4.1 POST /api/members/invite
**Implementation:**
- [ ] Authenticate Contact user
- [ ] Validate member phone and name
- [ ] Check if relationship already exists
- [ ] Generate unique 6-character invite code
- [ ] Create member_contact_relationships record
- [ ] Send invitation SMS via Twilio
- [ ] Return relationship data

### 4.2 POST /api/members/accept-invite
**Implementation:**
- [ ] Authenticate Member user
- [ ] Validate invite code
- [ ] Find pending relationship
- [ ] Update relationship status to 'active'
- [ ] Set connected_at timestamp
- [ ] Update user is_member = true
- [ ] Trigger update_is_member_status() function
- [ ] Check if Contact needs grandfathered_free
- [ ] Send confirmation push notification

### 4.3 POST /api/members/:memberId/check-in
**Implementation:**
- [ ] Authenticate Member user
- [ ] Validate timezone
- [ ] Check if already checked in today
- [ ] Create check_ins record
- [ ] Calculate if check-in is late
- [ ] If late, notify all Contacts via push
- [ ] Return check-in data

### 4.4 PATCH /api/members/:memberId/check-in-time
**Implementation:**
- [ ] Authenticate Member user
- [ ] Validate time format (HH:MM)
- [ ] Validate timezone (IANA format)
- [ ] Update members table
- [ ] Cancel old local notifications
- [ ] Schedule new local notifications
- [ ] Notify all Contacts of change

### 4.5 GET /api/members/:memberId/contacts
**Implementation:**
- [ ] Authenticate Member user
- [ ] Query member_contact_relationships
- [ ] Join with users table
- [ ] Filter status = 'active'
- [ ] Return contact list with names, phones (masked)

### 4.6 POST /api/members/complete-onboarding
**Implementation:**
- [ ] Authenticate Member user
- [ ] Validate check_in_time and timezone
- [ ] Update members table
- [ ] Set onboarding_completed = true
- [ ] Schedule local reminder notifications
- [ ] Return success

**Acceptance Criteria:**
- All 6 endpoints working
- Invite codes are unique
- SMS invitations sent
- Check-ins recorded correctly
- Timezone handling works
- Onboarding flow completes

**Files to Create:**
```
supabase/functions/members/invite/index.ts
supabase/functions/members/accept-invite/index.ts
supabase/functions/members/check-in/index.ts
supabase/functions/members/update-check-in-time/index.ts
supabase/functions/members/get-contacts/index.ts
supabase/functions/members/complete-onboarding/index.ts
```

---

## Phase 5: Contacts API Endpoints

### 5.1 GET /api/contacts/me/members
**Implementation:**
- [ ] Authenticate Contact user
- [ ] Query member_contact_relationships where contact_id = user_id
- [ ] Join with users and members tables
- [ ] Include today's check-in status
- [ ] Calculate time until deadline
- [ ] Determine if Member is late
- [ ] Return enriched member list

**Response Example:**
```json
{
  "members": [
    {
      "relationship_id": "uuid",
      "member_id": "uuid",
      "member_name": "Margaret Smith",
      "member_phone_masked": "(***) ***-1234",
      "check_in_time": "10:00",
      "timezone": "America/New_York",
      "status": "checked_in", // checked_in, pending, late, missed
      "checked_in_at": "2024-01-15T09:45:00Z",
      "deadline": "2024-01-15T10:00:00Z",
      "minutes_until_deadline": 15,
      "minutes_late": 0
    }
  ]
}
```

### 5.2 POST /api/contacts/resend-invite
**Implementation:**
- [ ] Authenticate Contact user
- [ ] Validate relationship_id
- [ ] Check relationship belongs to Contact
- [ ] Check status is 'pending'
- [ ] Update last_invite_sent_at
- [ ] Send SMS invitation again
- [ ] Rate limit: Max 1 per hour per relationship

### 5.3 DELETE /api/contacts/relationship/:relationshipId
**Implementation:**
- [ ] Authenticate Contact user
- [ ] Validate ownership
- [ ] Update status to 'removed'
- [ ] Set removed_at timestamp
- [ ] DO NOT delete record (audit trail)
- [ ] Send notification to Member
- [ ] Check if Contact has other active Members
- [ ] If no active Members, change payment logic

**Acceptance Criteria:**
- All 3 endpoints working
- Member list shows real-time status
- Timezone conversions correct
- Resend invites work with rate limiting
- Soft delete preserves audit trail

**Files to Create:**
```
supabase/functions/contacts/get-members/index.ts
supabase/functions/contacts/resend-invite/index.ts
supabase/functions/contacts/remove-relationship/index.ts
```

---

## Phase 6: Payments API Endpoints

### 6.1 POST /api/payments/create-subscription
**Implementation:**
- [ ] Authenticate user
- [ ] Check if user requires_payment() (function in migration)
- [ ] Get or create Stripe customer
- [ ] Attach payment method to customer
- [ ] Create Stripe subscription ($2.99/month)
- [ ] Store stripe_customer_id and stripe_subscription_id
- [ ] Update account_status to 'active'
- [ ] Return subscription data

### 6.2 POST /api/payments/cancel-subscription
**Implementation:**
- [ ] Authenticate user
- [ ] Validate Stripe subscription exists
- [ ] Cancel subscription in Stripe (at period end)
- [ ] Update account_status to 'canceled'
- [ ] Schedule account freezing for period_end date
- [ ] Return cancellation confirmation

### 6.3 GET /api/payments/subscription
**Implementation:**
- [ ] Authenticate user
- [ ] Fetch subscription from Stripe
- [ ] Return current status, next billing date, amount
- [ ] Include trial information if applicable
- [ ] Return payment method last 4 digits

### 6.4 PATCH /api/payments/update-payment-method
**Implementation:**
- [ ] Authenticate user
- [ ] Detach old payment method
- [ ] Attach new payment method
- [ ] Set as default
- [ ] If account was past_due, retry invoice
- [ ] Return updated payment method

**Acceptance Criteria:**
- Stripe integration working
- Subscriptions created at $2.99/month
- Payment methods updated correctly
- Cancellations handled properly
- requires_payment() function respected

**Files to Create:**
```
supabase/functions/payments/create-subscription/index.ts
supabase/functions/payments/cancel-subscription/index.ts
supabase/functions/payments/get-subscription/index.ts
supabase/functions/payments/update-payment-method/index.ts
```

---

## Phase 7: Stripe Webhook Handler

### 7.1 POST /api/webhooks/stripe
**Implementation:**
- [ ] Verify Stripe signature
- [ ] Handle event types:

**customer.subscription.created**
- [ ] Update user account_status = 'active'
- [ ] Record last_payment_date

**customer.subscription.updated**
- [ ] Update subscription status
- [ ] Handle plan changes

**customer.subscription.deleted**
- [ ] Update account_status = 'canceled'
- [ ] Schedule account freezing

**invoice.payment_succeeded**
- [ ] Update last_payment_date
- [ ] If account was past_due, reactivate
- [ ] Update account_status = 'active'

**invoice.payment_failed**
- [ ] Update account_status = 'past_due'
- [ ] Send SMS alert to user
- [ ] Start 7-day grace period timer
- [ ] Schedule follow-up SMS at day 3 and day 6

**customer.subscription.trial_will_end**
- [ ] Send SMS reminder 3 days before trial ends
- [ ] Send push notification

**invoice.payment_action_required**
- [ ] Send SMS with payment link
- [ ] Send push notification

**Acceptance Criteria:**
- Webhook signature verification works
- All event types handled
- Database updated correctly
- SMS alerts sent for payment issues
- Grace period logic implemented

**Files to Create:**
```
supabase/functions/webhooks/stripe/index.ts
supabase/functions/_shared/stripe-events.ts
```

---

## Phase 8: Push Notifications API

### 8.1 POST /api/push-notifications/register-token
**Implementation:**
- [ ] Authenticate user
- [ ] Validate FCM token and platform
- [ ] Upsert push_notification_tokens table
- [ ] Handle token refresh (delete old tokens for same device)
- [ ] Return success

### 8.2 Send Push Notification Helper
**Implementation:**
- [ ] Create sendPushNotification() function
- [ ] Use Firebase Admin SDK
- [ ] Support data and notification payloads
- [ ] Handle badge counts
- [ ] Support iOS silent notifications
- [ ] Log notifications to app_notifications table
- [ ] Handle token expiration/errors

**Notification Types:**
1. **Missed Check-in Alert**: "Margaret Smith has not checked in today."
2. **Late Check-in**: "Margaret Smith checked in 15 minutes late."
3. **Check-in Time Changed**: "Margaret Smith changed their check-in time to 10:00 AM."
4. **Relationship Added**: "John Doe is now monitoring your check-ins."
5. **Relationship Removed**: "John Doe is no longer monitoring your check-ins."
6. **Trial Expiring**: "Your trial ends in 3 days. Add a payment method."
7. **Payment Failed**: "Payment failed. Update your payment method within 7 days."

**Acceptance Criteria:**
- FCM token registration works
- Notifications sent successfully
- iOS and Android supported
- Badge counts work
- Notifications logged to database

**Files to Create:**
```
supabase/functions/push-notifications/register-token/index.ts
supabase/functions/_shared/push.ts
supabase/functions/_shared/notification-types.ts
```

---

## Phase 9: Background Jobs (Cron)

### 9.1 Check Missed Check-ins (Every 5 minutes)
**Implementation:**
- [ ] Query all Members with check_in_time in the past
- [ ] Check if check-in exists for today
- [ ] If missing, check if alert already sent
- [ ] Get all active Contacts for Member
- [ ] Send SMS to all Contacts
- [ ] Send push notifications to all Contacts
- [ ] Create missed_check_in_alerts record
- [ ] Respect timezone conversions

**Cron:** `*/5 * * * *` (every 5 minutes)

### 9.2 Trial Expiration Warnings (Daily at 9 AM UTC)
**Implementation:**
- [ ] Query users where trial_end_date is 3 days away
- [ ] Filter account_status = 'trial'
- [ ] Check if they have active Members (Contacts only pay)
- [ ] Send SMS reminder
- [ ] Send push notification
- [ ] Log notification

**Cron:** `0 9 * * *` (daily at 9 AM)

### 9.3 Trial Expiration (Daily at midnight UTC)
**Implementation:**
- [ ] Query users where trial_end_date is today
- [ ] Check if payment method exists
- [ ] If no payment and requires_payment(), freeze account
- [ ] Update account_status = 'frozen'
- [ ] Send SMS notification
- [ ] Disable access (RLS policies handle this)

**Cron:** `0 0 * * *` (daily at midnight)

### 9.4 Payment Grace Period Expiration (Daily at midnight UTC)
**Implementation:**
- [ ] Query users where account_status = 'past_due'
- [ ] Check if 7 days have passed since payment failure
- [ ] Update account_status = 'frozen'
- [ ] Send final SMS notification
- [ ] Disable access

**Cron:** `0 0 * * *` (daily at midnight)

### 9.5 Reminder Notifications (Every 15 minutes)
**Implementation:**
- [ ] Query Members with reminder_enabled = true
- [ ] Check if check-in time is 15 minutes away
- [ ] Check if not yet checked in today
- [ ] Send local notification (scheduled)
- [ ] OR send push notification as backup

**Cron:** `*/15 * * * *` (every 15 minutes)

**Acceptance Criteria:**
- All cron jobs running on schedule
- Missed check-ins detected accurately
- Timezone handling correct
- Trial expirations handled
- Grace periods enforced
- Notifications sent reliably

**Files to Create:**
```
supabase/functions/cron/check-missed-checkins/index.ts
supabase/functions/cron/trial-warnings/index.ts
supabase/functions/cron/trial-expirations/index.ts
supabase/functions/cron/grace-period-expirations/index.ts
supabase/functions/cron/reminder-notifications/index.ts
```

---

## Phase 10: Additional Frontend Screens

### 10.1 Help/Support Screen
**Location:** `src/screens/settings/HelpScreen.tsx`

**Features:**
- [ ] FAQ accordion
- [ ] Contact support button
- [ ] Email: support@pruuf.app
- [ ] Phone: (555) 123-4567
- [ ] How to check in
- [ ] How to invite members
- [ ] Billing questions
- [ ] App version number
- [ ] Terms of Service link
- [ ] Privacy Policy link

### 10.2 Member Detail Screen
**Location:** `src/screens/contact/MemberDetailScreen.tsx`

**Features:**
- [ ] Member name and photo placeholder
- [ ] Masked phone number
- [ ] Check-in time and timezone
- [ ] Check-in status (today)
- [ ] Last 7 days check-in history
- [ ] Call button
- [ ] Text button
- [ ] Edit check-in time (if they grant permission)
- [ ] Remove member button
- [ ] Confirmation dialog for removal

### 10.3 Contact Detail Screen
**Location:** `src/screens/member/ContactDetailScreen.tsx`

**Features:**
- [ ] Contact name and photo placeholder
- [ ] Masked phone number
- [ ] Call button
- [ ] Text button
- [ ] Remove contact button
- [ ] Confirmation dialog for removal

### 10.4 Check-in History Screen
**Location:** `src/screens/member/CheckInHistoryScreen.tsx`

**Features:**
- [ ] Calendar view of last 30 days
- [ ] Green checkmark for completed days
- [ ] Red X for missed days
- [ ] Yellow warning for late check-ins
- [ ] Tap date to see details
- [ ] Time of check-in
- [ ] Minutes late (if applicable)
- [ ] Filter by date range

### 10.5 Notification Settings Screen
**Location:** `src/screens/settings/NotificationSettingsScreen.tsx`

**Features:**
- [ ] Enable/disable push notifications
- [ ] Enable/disable reminder notifications (Members)
- [ ] Enable/disable SMS alerts (Contacts)
- [ ] Test notification button
- [ ] Notification permission status
- [ ] Link to system settings if denied

**Acceptance Criteria:**
- All screens fully functional
- Navigation integrated
- API calls working
- Accessibility compliant
- Responsive to font size preferences

---

## Phase 11: Edge Case Implementation

### 11.1 Edge Cases from Specification (80+ scenarios)

**Category: Account States**
- [ ] Trial account access (full features)
- [ ] Active account access (full features)
- [ ] Active_free account access (full features, no payment required)
- [ ] Frozen account (read-only, cannot check in)
- [ ] Past_due account (7-day grace period warning)
- [ ] Canceled account (access until period end)
- [ ] Deleted account (no access, soft delete)

**Category: Authentication**
- [ ] Phone already registered (login vs signup)
- [ ] Verification code expired (10 minutes)
- [ ] Verification code max attempts (5)
- [ ] Failed login lockout (5 attempts, 30 min lock)
- [ ] PIN reset while locked
- [ ] Concurrent login sessions

**Category: Member-Contact Relationships**
- [ ] User is both Member and Contact
- [ ] Invite code already used
- [ ] Invite code expired (30 days)
- [ ] Duplicate relationships
- [ ] Self-referential relationships (cannot invite yourself)
- [ ] Removing last Contact (Member still works)
- [ ] Removing last Member (Contact account freezes if trial ended)

**Category: Check-ins**
- [ ] Check in before deadline (success)
- [ ] Check in after deadline but same day (late notification)
- [ ] Check in exactly at deadline (not late)
- [ ] Multiple check-in attempts same day (idempotent)
- [ ] Check in without check_in_time set (error)
- [ ] Check in with wrong timezone (corrects automatically)
- [ ] Check in on frozen account (error)

**Category: Payments**
- [ ] Contact with no Members (no payment required)
- [ ] Contact with Members but is also Member (grandfathered free)
- [ ] Trial expires without payment (frozen)
- [ ] Payment fails (past_due, 7-day grace)
- [ ] Payment succeeds after past_due (reactivate)
- [ ] Cancel subscription (access until period end)
- [ ] Reactivate after cancellation
- [ ] Update payment method during past_due

**Category: Grandfathered Free**
- [ ] Member becomes Contact later (free forever)
- [ ] Contact becomes Member then invites someone (free forever)
- [ ] Grandfathered user removes all Members (still free)
- [ ] Grandfathered user invites new Members (still free)

**Category: Notifications**
- [ ] Push token expired (handle gracefully)
- [ ] User disabled notifications (SMS only)
- [ ] Multiple devices (send to all)
- [ ] Notification while app open
- [ ] Notification while app backgrounded
- [ ] Notification while app killed

**Category: Timezone**
- [ ] Member in different timezone than Contact
- [ ] Daylight saving time transitions
- [ ] Check-in across midnight boundary
- [ ] Invalid timezone string (fallback to UTC)
- [ ] Timezone change affects scheduled notifications

**Category: Onboarding**
- [ ] Skip onboarding partially (prevent access)
- [ ] Complete onboarding multiple times (idempotent)
- [ ] Onboarding as Contact (different flow)
- [ ] Onboarding as Member (different flow)
- [ ] Onboarding interrupted (resume from checkpoint)

**Category: Data Validation**
- [ ] Invalid phone formats
- [ ] International phone numbers (US only for now)
- [ ] PIN with non-digits
- [ ] Name with special characters
- [ ] Time with invalid format
- [ ] Invite code case insensitive
- [ ] SQL injection attempts (parameterized queries)
- [ ] XSS attempts (input sanitization)

**Acceptance Criteria:**
- All 80+ edge cases handled
- Appropriate error messages
- Database constraints enforced
- Business rules respected
- Tests written for critical paths

---

## Phase 12: Local Notifications

### 12.1 iOS Local Notifications
**Implementation:**
- [ ] Install react-native-push-notification or native modules
- [ ] Request notification permissions
- [ ] Schedule daily reminder at (check_in_time - 15 minutes)
- [ ] Cancel notifications when check-in time changes
- [ ] Reschedule on app launch
- [ ] Handle notification tap (open app to check-in screen)
- [ ] Support timezone changes

### 12.2 Android Local Notifications
**Implementation:**
- [ ] Configure Android notification channels
- [ ] Schedule daily reminder at (check_in_time - 15 minutes)
- [ ] Use AlarmManager for precise timing
- [ ] Handle device restart (reschedule)
- [ ] Support timezone changes

**Notification Content:**
- **Title:** "Time to Check In!"
- **Body:** "Don't forget to check in by [TIME]. Tap to check in now."
- **Actions:** "Check In Now" button

**Acceptance Criteria:**
- Notifications scheduled correctly
- Notifications fire on time
- Tapping opens app to check-in screen
- Notifications canceled after check-in
- Works across app restarts

**Files to Create/Modify:**
```
src/services/localNotifications.ts
src/hooks/useLocalNotifications.ts
ios/Pruuf/AppDelegate.mm (modifications)
android/app/src/main/AndroidManifest.xml (modifications)
```

---

## Phase 13: Deep Linking

### 13.1 Invite Code Deep Links
**Implementation:**
- [ ] Configure URL scheme: `pruuf://`
- [ ] Configure Universal Links: `https://pruuf.app/invite/[CODE]`
- [ ] Handle `pruuf://invite/[CODE]`
- [ ] Parse invite code from URL
- [ ] Navigate to EnterInviteCodeScreen with pre-filled code
- [ ] Handle deep link when app is closed
- [ ] Handle deep link when app is backgrounded
- [ ] Handle deep link when app is active

### 13.2 iOS Universal Links
**Implementation:**
- [ ] Configure apple-app-site-association file
- [ ] Host on https://pruuf.app/.well-known/
- [ ] Configure Associated Domains in Xcode
- [ ] Test with physical device (simulator limitations)

### 13.3 Android App Links
**Implementation:**
- [ ] Configure assetlinks.json file
- [ ] Host on https://pruuf.app/.well-known/
- [ ] Configure intent filters in AndroidManifest.xml
- [ ] Test with physical device

**Acceptance Criteria:**
- Deep links work from SMS
- Universal links work from web browser
- App opens to correct screen
- Invite code auto-fills
- Works when app is not running

**Files to Create/Modify:**
```
src/services/deepLinking.ts
src/navigation/RootNavigator.tsx (modifications)
ios/Pruuf/Pruuf.entitlements (modifications)
android/app/src/main/AndroidManifest.xml (modifications)
```

---

## Phase 14: Grandfathered Free Logic

### 14.1 Business Rules Implementation

**Rule 1: Member becomes Contact**
- [ ] When user becomes Member (first time), set is_member = true
- [ ] Trigger updates grandfathered_free = true (database function)
- [ ] If they later become Contact, requires_payment() returns false
- [ ] account_status = 'active_free' (no billing)

**Rule 2: Contact becomes Member**
- [ ] When existing Contact accepts invitation
- [ ] Set is_member = true
- [ ] Database function updates grandfathered_free = true
- [ ] Cancel Stripe subscription
- [ ] Update account_status = 'active_free'
- [ ] Send confirmation SMS

**Rule 3: Grandfathered User Management**
- [ ] Can invite unlimited Members (no billing)
- [ ] Can remove all Members (still grandfathered)
- [ ] Cannot lose grandfathered status
- [ ] Persists across account lifecycle

**Rule 4: Trial Logic**
- [ ] Members never start trial
- [ ] Contacts start 30-day trial
- [ ] If Member invites Contact, Contact gets trial
- [ ] If Contact invited by Member, Contact gets trial
- [ ] Trial countdown based on trial_start_date

**Rule 5: Payment Required Logic**
```sql
CREATE OR REPLACE FUNCTION requires_payment(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT
      CASE
        WHEN grandfathered_free = TRUE THEN FALSE
        WHEN is_member = TRUE AND (
          SELECT COUNT(*) FROM member_contact_relationships
          WHERE member_id = user_id AND status = 'active'
        ) = 0 THEN FALSE
        WHEN (
          SELECT COUNT(*) FROM member_contact_relationships
          WHERE contact_id = user_id AND status = 'active'
        ) > 0 THEN TRUE
        ELSE FALSE
      END
    FROM users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql;
```

**Acceptance Criteria:**
- Database function working correctly
- API endpoints respect requires_payment()
- Stripe subscription only created when required
- Grandfathered status persists
- Account status reflects payment requirements
- SMS notifications sent for status changes

**Files to Modify:**
```
supabase/migrations/003_grandfathered_logic.sql
supabase/functions/_shared/payment-logic.ts
supabase/functions/payments/* (all endpoints)
```

---

## Phase 15: Analytics & Error Tracking

### 15.1 Sentry Integration
**Implementation:**
- [ ] Install @sentry/react-native
- [ ] Configure Sentry project
- [ ] Add DSN to environment variables
- [ ] Wrap App with Sentry.ErrorBoundary
- [ ] Add performance monitoring
- [ ] Track navigation breadcrumbs
- [ ] Tag user data (user_id, phone_masked)
- [ ] Set environment (dev/staging/prod)

**Events to Track:**
- Crashes and errors
- API request failures
- Redux action failures
- Navigation errors
- Payment errors

### 15.2 Firebase Analytics
**Implementation:**
- [ ] Install @react-native-firebase/analytics
- [ ] Configure Firebase project
- [ ] Track screen views
- [ ] Track custom events
- [ ] Track user properties

**Events to Track:**
1. **signup_completed**
2. **login_completed**
3. **onboarding_completed** (Member vs Contact)
4. **member_invited**
5. **invite_accepted**
6. **check_in_completed**
7. **check_in_late**
8. **check_in_missed**
9. **subscription_created**
10. **subscription_canceled**
11. **payment_failed**
12. **relationship_removed**

**User Properties:**
- user_type (member, contact, both)
- account_status
- grandfathered_free
- trial_active
- members_count (for Contacts)
- contacts_count (for Members)

**Acceptance Criteria:**
- Sentry capturing errors
- Source maps uploaded
- Firebase events tracked
- User properties set
- Privacy compliant (no PII)
- Analytics dashboard functional

**Files to Create/Modify:**
```
src/services/analytics.ts
src/services/errorTracking.ts
App.tsx (modifications)
```

---

## Phase 16: Integration Testing

### 16.1 End-to-End Test Scenarios

**Test Suite 1: Contact Onboarding**
- [ ] Complete phone verification
- [ ] Create PIN
- [ ] Select font size
- [ ] View trial welcome
- [ ] Invite Member
- [ ] Review invitation
- [ ] Verify SMS sent
- [ ] Verify invite in database

**Test Suite 2: Member Onboarding**
- [ ] Complete phone verification
- [ ] Create PIN
- [ ] View member welcome
- [ ] Enter invite code
- [ ] Set check-in time
- [ ] Complete onboarding
- [ ] Verify relationship active
- [ ] Verify Contact grandfathered if applicable

**Test Suite 3: Daily Check-in**
- [ ] Member dashboard loads
- [ ] Check-in button available
- [ ] Tap to check in
- [ ] Record created in database
- [ ] Push notification to Contacts
- [ ] Status updates in Contact dashboard

**Test Suite 4: Missed Check-in**
- [ ] Member does not check in
- [ ] Cron job detects missed check-in
- [ ] SMS sent to all Contacts
- [ ] Push notifications sent
- [ ] Alert recorded in database
- [ ] Contact dashboard shows "missed"

**Test Suite 5: Payment Flow**
- [ ] Trial countdown visible
- [ ] Add payment method
- [ ] Stripe subscription created
- [ ] Account status updated
- [ ] Billing information displayed

**Test Suite 6: Grandfathered Free**
- [ ] Contact invites Member
- [ ] Member accepts invitation
- [ ] Contact becomes Member
- [ ] Grandfathered status set
- [ ] No payment required
- [ ] Account status = active_free

**Acceptance Criteria:**
- All test suites passing
- Tests run in CI/CD
- Coverage > 85%
- No flaky tests
- Tests run in < 10 minutes

---

## Phase 17: Accessibility Audit

### 17.1 WCAG 2.1 AAA Compliance Verification

**Color Contrast:**
- [ ] Verify all text has 7:1 contrast ratio
- [ ] Test with color blindness simulators
- [ ] Test in bright sunlight conditions
- [ ] Test in dark mode (if implemented)

**Touch Targets:**
- [ ] Verify all interactive elements ≥ 60pt
- [ ] Test with physical device
- [ ] Test with elderly users

**VoiceOver (iOS):**
- [ ] All buttons have accessibilityLabel
- [ ] All images have accessibilityLabel (if meaningful)
- [ ] Proper reading order
- [ ] Form inputs have accessibilityLabel
- [ ] Alerts announced properly

**TalkBack (Android):**
- [ ] All buttons have contentDescription
- [ ] All images have contentDescription
- [ ] Proper reading order
- [ ] Form inputs have contentDescription
- [ ] Alerts announced properly

**Dynamic Type:**
- [ ] Test at 1.0x (standard)
- [ ] Test at 1.25x (large)
- [ ] Test at 1.5x (extra large)
- [ ] Verify no text truncation
- [ ] Verify layouts adapt

**Keyboard Navigation:**
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] No keyboard traps

**Testing Tools:**
- [ ] Axe accessibility scanner
- [ ] iOS Accessibility Inspector
- [ ] Android Accessibility Scanner
- [ ] Manual testing with VoiceOver
- [ ] Manual testing with TalkBack
- [ ] User testing with elderly participants

**Acceptance Criteria:**
- All WCAG 2.1 AAA criteria met
- No accessibility violations in automated scans
- Positive feedback from elderly user testing
- Accessibility statement published

---

## Phase 18: iOS Deployment Preparation

### 18.1 App Icons & Splash Screen

**App Icon:**
- [ ] Design app icon (1024x1024px)
- [ ] Generate all required sizes
- [ ] Add to Xcode Assets catalog
- [ ] Test on device

**Splash Screen:**
- [ ] Design splash screen
- [ ] Update LaunchScreen.storyboard
- [ ] Test on various screen sizes

### 18.2 App Store Assets

**Screenshots (Required Sizes):**
- [ ] 6.7" Display (iPhone 15 Pro Max): 1290 x 2796
- [ ] 6.5" Display (iPhone 11 Pro Max): 1242 x 2688
- [ ] 5.5" Display (iPhone 8 Plus): 1242 x 2208

**Screenshot Content:**
1. Member Dashboard with check-in button
2. Contact Dashboard with member status
3. Check-in success confirmation
4. Invitation flow
5. Settings/accessibility features

**App Description:**
- [ ] Write compelling 170-character subtitle
- [ ] Write full description (< 4000 chars)
- [ ] Highlight key benefits for elderly users
- [ ] Mention accessibility features
- [ ] Explain pricing clearly

**Keywords:**
- [ ] Research App Store keywords
- [ ] Max 100 characters, comma-separated
- [ ] Focus on: elderly, check-in, safety, family, monitoring

**Privacy Policy & Terms:**
- [ ] Write privacy policy
- [ ] Host at https://pruuf.app/privacy
- [ ] Write terms of service
- [ ] Host at https://pruuf.app/terms

### 18.3 TestFlight Setup

**Internal Testing:**
- [ ] Add internal testers
- [ ] Upload build via Xcode
- [ ] Distribute to testers
- [ ] Gather feedback
- [ ] Fix critical bugs

**External Testing:**
- [ ] Submit for Beta App Review
- [ ] Add external testers
- [ ] Gather feedback
- [ ] Iterate on issues

### 18.4 App Store Submission

**Preparation:**
- [ ] Bump version to 1.0.0
- [ ] Create release notes
- [ ] Complete app information
- [ ] Add screenshots for all sizes
- [ ] Set pricing (Free)
- [ ] Configure in-app purchases (if needed)
- [ ] Complete privacy questionnaire
- [ ] Set age rating
- [ ] Add app category (Health & Fitness)

**Submission:**
- [ ] Submit for App Review
- [ ] Monitor review status
- [ ] Respond to any feedback
- [ ] Prepare for launch

**Post-Launch:**
- [ ] Monitor crash reports
- [ ] Monitor reviews
- [ ] Track analytics
- [ ] Plan first update

**Acceptance Criteria:**
- App approved by Apple
- Listed on App Store
- No crashes in first 24 hours
- Positive user feedback
- Analytics tracking properly

---

## Implementation Timeline

**Week 1-2: Backend Foundation**
- Phase 1: Backend API Infrastructure
- Phase 2: Twilio SMS Service
- Phase 3: Authentication API Endpoints

**Week 3-4: Core API Endpoints**
- Phase 4: Members API Endpoints
- Phase 5: Contacts API Endpoints
- Phase 6: Payments API Endpoints

**Week 5-6: Webhooks & Background Jobs**
- Phase 7: Stripe Webhook Handler
- Phase 8: Push Notifications API
- Phase 9: Background Jobs (Cron)

**Week 7-8: Frontend Completion**
- Phase 10: Additional Frontend Screens
- Phase 11: Edge Case Implementation
- Phase 12: Local Notifications
- Phase 13: Deep Linking

**Week 9-10: Business Logic & Analytics**
- Phase 14: Grandfathered Free Logic
- Phase 15: Analytics & Error Tracking

**Week 11-12: Testing & Deployment**
- Phase 16: Integration Testing
- Phase 17: Accessibility Audit
- Phase 18: iOS Deployment Preparation

**Total Timeline: 12 weeks**

---

## Testing Strategy

### Unit Tests
- All utility functions (already done: 62 tests)
- All database functions
- All API endpoint logic
- All business rules

**Target: 90%+ coverage**

### Integration Tests
- Auth flow end-to-end
- Onboarding flows
- Check-in flow
- Payment flow
- Notification flow

**Target: 85%+ coverage**

### Manual Testing
- All user flows on physical iOS device
- All edge cases from Phase 11
- Accessibility testing with VoiceOver
- Performance testing
- Network offline scenarios
- Push notification scenarios

### User Acceptance Testing
- Beta test with 10+ elderly users (Members)
- Beta test with 10+ family members (Contacts)
- Gather feedback on usability
- Iterate on pain points

---

## Risk Management

### High-Risk Areas

**1. Timezone Handling**
- Risk: Missed check-ins due to timezone bugs
- Mitigation: Comprehensive timezone tests, use moment-timezone, test DST transitions

**2. Payment Logic**
- Risk: Charging users incorrectly, or not charging when should
- Mitigation: Extensive testing of requires_payment(), audit logs, manual testing

**3. Grandfathered Free Logic**
- Risk: Complex business rules may have edge cases
- Mitigation: Database function tested thoroughly, integration tests, manual verification

**4. Background Job Reliability**
- Risk: Cron jobs may fail, miss check-ins not detected
- Mitigation: Monitoring, logging, alerting, redundancy

**5. Push Notification Delivery**
- Risk: Notifications may not be delivered
- Mitigation: SMS fallback, delivery tracking, user can manually refresh

---

## Success Metrics

### Technical Metrics
- 0 crashes per day (Sentry)
- < 100ms API response time (p95)
- > 99% uptime
- > 95% test coverage
- 0 security vulnerabilities

### Business Metrics
- > 4.5 star rating on App Store
- < 5% trial conversion churn (people who start trial but don't complete onboarding)
- > 30% trial to paid conversion
- < 10% monthly churn
- > 80% daily active users (Members should check in daily)

### User Metrics
- > 90% successful check-ins
- < 2% missed check-ins due to app issues
- < 5% support requests per user
- > 80% user satisfaction (survey)

---

## Deployment Checklist

### Environment Configuration
- [ ] Supabase production project created
- [ ] All migrations run on production
- [ ] Environment variables set
- [ ] Stripe production keys configured
- [ ] Twilio production credentials configured
- [ ] Firebase production project configured
- [ ] Sentry production project configured

### Backend Deployment
- [ ] All Edge Functions deployed
- [ ] All cron jobs scheduled
- [ ] Webhook endpoints configured
- [ ] Rate limiting enabled
- [ ] Monitoring enabled
- [ ] Logging configured

### Frontend Deployment
- [ ] Production build created
- [ ] Code signing configured
- [ ] Push notification certificates configured
- [ ] Deep linking configured
- [ ] Analytics configured
- [ ] Error tracking configured

### Final Checks
- [ ] All tests passing
- [ ] No TODO comments in code
- [ ] All console.log removed or wrapped
- [ ] Performance profiling done
- [ ] Security audit done
- [ ] Legal review done (privacy policy, terms)
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

## Conclusion

This implementation plan covers all remaining work to take the Pruuf app from its current state (frontend complete) to a production-ready application ready for App Store launch. The plan is organized into 18 phases spanning 12 weeks, with clear acceptance criteria, testing requirements, and success metrics.

The most critical areas are:
1. Backend API implementation (Phases 1-6)
2. Background jobs for reliability (Phase 9)
3. Complex business logic (Phase 14)
4. Accessibility compliance (Phase 17)

Upon completion, the app will be a fully functional, accessible, production-ready iOS application meeting all requirements from the 8,000+ word specification.
