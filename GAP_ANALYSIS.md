# Pruuf App - Comprehensive Gap Analysis & 40-Point Implementation Plan

## Overview

This document identifies all gaps between the current implementation and the full 8,000+ word specification. Each item includes:
- **Gap Description**: What's missing
- **Priority**: Critical / High / Medium / Low
- **Estimated Effort**: Hours
- **Related Files**: Where changes needed
- **Implementation Notes**: Specific requirements

---

## Category 1: Frontend Integration & Navigation (10 items)

### 1. Register Navigation Routes for New Screens
**Priority**: High
**Effort**: 1 hour
**Files**: `src/navigation/RootNavigator.tsx`

**Gap**: New screens (HelpScreen, MemberDetailScreen, ContactDetailScreen, CheckInHistoryScreen, NotificationSettingsScreen) need to be registered in navigation.

**Implementation**:
- Add screen definitions to stack navigators
- Configure header titles and back buttons
- Set up deep linking routes
- Add navigation from existing screens (Settings → Help, Member list → MemberDetail, etc.)

---

### 2. Integrate NotificationService in App Initialization
**Priority**: High
**Effort**: 1 hour
**Files**: `App.tsx`, `src/services/notificationService.ts`

**Gap**: notificationService.ts created but not initialized in app bootstrap.

**Implementation**:
- Call `initializeNotifications()` in App.tsx componentDidMount
- Request permissions on first launch
- Handle permission denied scenarios
- Update Redux state with permission status

---

### 3. Integrate DeepLinkService in App Initialization
**Priority**: High
**Effort**: 1 hour
**Files**: `App.tsx`, `src/services/deepLinkService.ts`

**Gap**: deepLinkService.ts created but not initialized with navigation ref.

**Implementation**:
- Create navigation ref in App.tsx
- Pass ref to `initializeDeepLinking()`
- Test invite link flows
- Configure iOS universal links in Xcode
- Configure Android app links in AndroidManifest.xml

---

### 4. Integrate AnalyticsService in App Initialization
**Priority**: High
**Effort**: 1 hour
**Files**: `App.tsx`, `src/services/analyticsService.ts`

**Gap**: analyticsService.ts created but not initialized.

**Implementation**:
- Call `initializeAnalytics()` in App.tsx
- Set user context after login
- Add trackScreenView() to navigation state change listener
- Add trackEvent() calls for key user actions
- Configure Sentry DSN from environment variable

---

### 5. Connect NotificationSettings Screen to Redux
**Priority**: Medium
**Effort**: 2 hours
**Files**: `src/screens/NotificationSettingsScreen.tsx`, `src/store/memberSlice.ts`

**Gap**: NotificationSettings screen updates API but doesn't update Redux state.

**Implementation**:
- Create Redux actions for updating notification preferences
- Dispatch actions after successful API calls
- Update Member state in Redux
- Sync with notificationService when reminder settings change
- Call `updateCheckInReminder()` when settings change

---

### 6. Implement Check-in Reminder Sync After Settings Change
**Priority**: High
**Effort**: 1 hour
**Files**: `src/screens/NotificationSettingsScreen.tsx`, `src/services/notificationService.ts`

**Gap**: When user changes reminder settings, local notifications aren't rescheduled.

**Implementation**:
- After successful API update, call `updateCheckInReminder()`
- Pass enabled, checkInTime, reminderMinutesBefore, timezone
- Show confirmation message to user
- Test timezone changes trigger reschedule

---

### 7. Add Navigation from Settings to New Screens
**Priority**: Medium
**Effort**: 1 hour
**Files**: `src/screens/SettingsScreen.tsx`

**Gap**: Settings screen needs links to Help, NotificationSettings, etc.

**Implementation**:
- Add "Help & Support" menu item → HelpScreen
- Add "Notification Settings" menu item → NotificationSettingsScreen
- Add visual indicators (chevron right icons)
- Group settings logically (Account, Preferences, Support)

---

### 8. Add Navigation from Dashboard to Detail Screens
**Priority**: Medium
**Effort**: 1 hour
**Files**: `src/screens/ContactDashboardScreen.tsx`, `src/screens/MemberDashboardScreen.tsx`

**Gap**: Dashboard member/contact lists need to navigate to detail screens on tap.

**Implementation**:
- Add onPress handlers to list items
- Navigate to MemberDetailScreen with memberId param
- Navigate to ContactDetailScreen with contactId param
- Pass memberName for history screen title

---

### 9. Implement Pull-to-Refresh on Dashboards
**Priority**: Low
**Effort**: 1 hour
**Files**: `src/screens/ContactDashboardScreen.tsx`, `src/screens/MemberDashboardScreen.tsx`

**Gap**: No pull-to-refresh to reload member/contact data.

**Implementation**:
- Add RefreshControl to ScrollView
- Implement onRefresh handler that calls API
- Show loading spinner during refresh
- Update Redux state with fresh data

---

### 10. Add Loading States to New Screens
**Priority**: Medium
**Effort**: 1 hour
**Files**: All new screens

**Gap**: Some screens show ActivityIndicator during loading, but error states and retry logic missing.

**Implementation**:
- Add error state handling
- Show retry button on API failures
- Add empty states with helpful messages
- Implement skeleton loaders for better UX

---

## Category 2: Backend API Enhancements (8 items)

### 11. Add Pagination to Check-in History Endpoint
**Priority**: Low
**Effort**: 2 hours
**Files**: `supabase/functions/contacts/get-member-checkins/index.ts`

**Gap**: Check-in history endpoint returns all records without pagination.

**Implementation**:
- Add `limit` and `offset` query parameters
- Default to 50 records per page
- Return `total_count` and `has_more` in response
- Update frontend to implement infinite scroll

---

### 12. Implement Timezone Library for Accurate DST Handling
**Priority**: High
**Effort**: 3 hours
**Files**: All cron jobs, check-in endpoints, validators

**Gap**: Current timezone handling uses simplified offsets, doesn't account for DST transitions.

**Implementation**:
- Install moment-timezone or date-fns-tz
- Replace manual timezone offset calculations
- Use proper timezone conversion functions
- Test across DST boundaries (spring forward, fall back)
- Update `getTodayStartInTimezone()` and related functions

---

### 13. Add Rate Limiting Middleware
**Priority**: Medium
**Effort**: 3 hours
**Files**: `supabase/functions/_shared/rateLimit.ts`, all endpoints

**Gap**: No global rate limiting to prevent API abuse.

**Implementation**:
- Create rate limit middleware using Redis or in-memory cache
- Implement sliding window algorithm
- Different limits for auth vs data endpoints (e.g., 10/min auth, 100/min data)
- Return 429 with Retry-After header
- Track by user ID + IP address

---

### 14. Implement Idempotency Keys for Payment Operations
**Priority**: High
**Effort**: 2 hours
**Files**: `supabase/functions/payments/create-subscription/index.ts`, `supabase/functions/payments/update-payment-method/index.ts`

**Gap**: Payment operations don't have idempotency protection against duplicate requests.

**Implementation**:
- Accept `idempotency_key` header
- Store in database table with expiration (24 hours)
- Return cached response if key already used
- Prevent double charges from network retries
- Follow Stripe's idempotency key pattern

---

### 15. Add Audit Logging for Critical Operations
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/_shared/audit.ts`, all endpoints

**Gap**: audit_logs table exists but not used consistently.

**Implementation**:
- Create `logAudit()` helper function
- Log all authentication attempts (success/failure)
- Log payment operations
- Log relationship changes (invite, accept, remove)
- Log account status changes
- Include IP address and user agent

---

### 16. Implement Soft Delete for Relationships
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/contacts/remove-relationship/index.ts`, database queries

**Gap**: Relationship removal should use soft delete (deleted_at) for data retention.

**Implementation**:
- Update remove-relationship endpoint to set deleted_at instead of hard delete
- Update all queries to filter `is('deleted_at', null)`
- Add endpoint to restore soft-deleted relationships (optional)
- Clean up old soft-deleted records after 90 days (cron job)

---

### 17. Add Webhook Retry Logic for Failed SMS
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/webhooks/twilio/index.ts` (new)

**Gap**: No retry logic if Twilio SMS delivery fails.

**Implementation**:
- Create Twilio webhook endpoint to receive delivery status
- Update sms_logs table with delivery status and errors
- Implement exponential backoff retry (3 attempts)
- Send fallback push notification if SMS fails permanently
- Alert admin if critical SMS fails (missed check-in alerts)

---

### 18. Implement Request Logging and Monitoring
**Priority**: Low
**Effort**: 3 hours
**Files**: `supabase/functions/_shared/logger.ts`, all endpoints

**Gap**: No structured logging for debugging and monitoring.

**Implementation**:
- Create logger utility with log levels (debug, info, warn, error)
- Log all requests (method, path, user ID, duration)
- Log all errors with stack traces
- Send logs to external service (Datadog, Logtail, etc.)
- Create dashboard for monitoring API health

---

## Category 3: Data Validation & Edge Cases (10 items)

### 19. Validate Member Cannot Have Duplicate Check-in Times
**Priority**: Low
**Effort**: 1 hour
**Files**: `supabase/functions/members/update-check-in-time/index.ts`

**Gap**: Multiple Members could theoretically have same check-in time, causing confusion.

**Implementation**:
- Not actually a problem - each Member should have their own time
- Remove from implementation plan (false alarm)

---

### 20. Prevent Contact from Inviting Already-Registered Member
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/contacts/invite/index.ts`

**Gap**: If Member already has account, invitation creates duplicate user record.

**Implementation**:
- Check if phone number already exists in users table
- If exists and is_member = true, throw error "This Member already has a Pruuf account"
- If exists but is_member = false, create relationship directly (no invite code needed)
- Send different SMS template for existing users

---

### 21. Handle Timezone Changes Gracefully
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/members/update-check-in-time/index.ts`, frontend screens

**Gap**: If Member changes timezone, check-in history and deadlines need recalculation.

**Implementation**:
- Add endpoint to update Member timezone
- Recalculate today's deadline based on new timezone
- Send SMS to all Contacts about timezone change
- Update scheduled local notifications
- Add validator `validateTimezoneChange()`

---

### 22. Validate Payment Method Before Subscription Creation
**Priority**: High
**Effort**: 2 hours
**Files**: `supabase/functions/payments/create-subscription/index.ts`

**Gap**: Should verify payment method is valid before creating subscription.

**Implementation**:
- Fetch payment method from Stripe
- Verify it belongs to customer
- Check if it's valid (not expired, no errors)
- Handle 3D Secure authentication requirements
- Return clear error if payment method invalid

---

### 23. Implement Webhook Signature Verification
**Priority**: Critical
**Effort**: 1 hour
**Files**: `supabase/functions/webhooks/stripe/index.ts`

**Gap**: Webhook signature verification implemented but should double-check security.

**Implementation**:
- Review existing `verifyWebhookSignature()` implementation
- Ensure using constant-time comparison to prevent timing attacks
- Log signature verification failures
- Return 401 immediately on signature mismatch
- Add monitoring alerts for repeated failures

---

### 24. Handle Concurrent Check-ins (Race Condition)
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/members/check-in/index.ts`, database

**Gap**: If Member taps "I'm OK" multiple times quickly, could create duplicate check-ins.

**Implementation**:
- Add UNIQUE constraint on (member_id, date(checked_in_at AT TIME ZONE timezone))
- Catch unique violation error in endpoint
- Return existing check-in instead of error
- Add database-level trigger to prevent duplicates
- Test with concurrent requests

---

### 25. Validate Invite Code Expiration
**Priority**: Low
**Effort**: 1 hour
**Files**: `supabase/functions/members/accept-invite/index.ts`, database

**Gap**: Invite codes never expire, could be used months later.

**Implementation**:
- Add `invite_expires_at` column to relationships table
- Set expiration to 30 days from invited_at
- Check expiration in accept-invite endpoint
- Allow Contact to resend (which extends expiration)
- Add cron job to clean up expired invites

---

### 26. Implement Phone Number Normalization
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/_shared/phone.ts`, all endpoints

**Gap**: Phone numbers must be exactly +1XXXXXXXXXX format, but users might enter differently.

**Implementation**:
- Create `normalizePhone()` function
- Accept formats: (123) 456-7890, 123-456-7890, 1234567890
- Strip non-digits, add +1 prefix if missing
- Validate length after normalization
- Apply to all phone inputs (auth, invites, etc.)

---

### 27. Add PIN Strength Validation
**Priority**: Low
**Effort**: 1 hour
**Files**: `supabase/functions/_shared/errors.ts`

**Gap**: PIN can be 0000, 1234, etc. - no strength requirements.

**Implementation**:
- Add `validatePinStrength()` function
- Reject common PINs (0000, 1111, 1234, etc.)
- Reject sequential (1234, 4321, etc.)
- Reject repeated (1111, 2222, etc.)
- Return helpful error message
- Add to create-account and reset-pin endpoints

---

### 28. Handle Account Deletion with Active Subscriptions
**Priority**: Medium
**Effort**: 2 hours
**Files**: `supabase/functions/auth/delete-account/index.ts` (new)

**Gap**: No account deletion endpoint exists.

**Implementation**:
- Create DELETE /api/auth/delete-account endpoint
- Check for active subscription, cancel if exists
- Soft delete user record (set deleted_at)
- Remove all relationships
- Send final SMS notification
- Send email confirmation (if we collect email)
- Keep data for 30 days before hard delete

---

## Category 4: Missing Frontend Features (6 items)

### 29. Implement Font Size Preferences Throughout App
**Priority**: Medium
**Effort**: 3 hours
**Files**: All screens

**Gap**: font_size_preference exists in user table but not applied consistently.

**Implementation**:
- Verify all screens use FONT_SIZES[fontSize] pattern
- Test with standard/large/extra_large settings
- Ensure buttons, inputs, and labels scale properly
- Test on small and large devices
- Add toggle in Settings screen

---

### 30. Add Loading Skeletons Instead of Spinners
**Priority**: Low
**Effort**: 3 hours
**Files**: All screens with loading states

**Gap**: Current loading states show ActivityIndicator, skeletons provide better UX.

**Implementation**:
- Create SkeletonLoader component
- Add shimmer animation
- Match skeleton shape to actual content
- Use in dashboards, detail screens, history screens
- Improve perceived performance

---

### 31. Implement Offline Mode with Queue
**Priority**: Low
**Effort**: 4 hours
**Files**: `src/utils/offlineQueue.ts`, `src/utils/api.ts`

**Gap**: No offline support - all API calls fail without internet.

**Implementation**:
- Detect network connectivity
- Queue API requests when offline
- Store in AsyncStorage
- Process queue when connection restored
- Show offline indicator in UI
- Critical for check-ins (allow offline, sync later)

---

### 32. Add Biometric Authentication (Face ID / Touch ID)
**Priority**: Medium
**Effort**: 3 hours
**Files**: `src/services/biometricService.ts`, `src/screens/LoginScreen.tsx`

**Gap**: Users must enter PIN every time, biometrics would improve UX.

**Implementation**:
- Install react-native-biometrics
- Check if biometrics available
- Prompt user to enable on first login
- Store encrypted PIN in Keychain
- Show biometric prompt on login screen
- Fallback to PIN if biometric fails
- Add toggle in Settings

---

### 33. Implement In-App Tutorial/Onboarding Flow
**Priority**: Low
**Effort**: 4 hours
**Files**: `src/screens/TutorialScreen.tsx`, `src/components/Tooltip.tsx`

**Gap**: First-time users might not understand Member vs Contact roles.

**Implementation**:
- Create tutorial screens explaining concepts
- Show on first launch only
- Explain Member role (daily check-in)
- Explain Contact role (monitoring, payment)
- Explain grandfathered free access
- Add skip button
- Store completion in AsyncStorage

---

### 34. Add Search and Filter to Check-in History
**Priority**: Low
**Effort**: 2 hours
**Files**: `src/screens/CheckInHistoryScreen.tsx`

**Gap**: History screen shows all check-ins, no search by date.

**Implementation**:
- Add date range picker
- Add filter for on-time/late/missed
- Implement search in Redux state (no API change)
- Show filtered count
- Add clear filters button

---

## Category 5: Security & Privacy Enhancements (6 items)

### 35. Implement Row-Level Security (RLS) Policies
**Priority**: Critical
**Effort**: 4 hours
**Files**: `supabase/migrations/003_row_level_security.sql`

**Gap**: Database has no RLS policies - relies on service role key.

**Implementation**:
- Enable RLS on all tables
- Create policies for users table (users can read/update own record)
- Create policies for members table (user can read/update own member profile)
- Create policies for relationships table (users can only see their own relationships)
- Create policies for check_ins table (only member can insert, contacts can read)
- Test with anon key instead of service role key

---

### 36. Add HTTPS-Only API Calls
**Priority**: Critical
**Effort**: 1 hour
**Files**: `src/utils/api.ts`

**Gap**: Should enforce HTTPS for all API calls.

**Implementation**:
- Verify all API_BASE_URL uses https://
- Reject http:// URLs in development mode
- Add certificate pinning for production
- Add network security config for Android
- Test SSL certificate validation

---

### 37. Implement Token Refresh Logic
**Priority**: High
**Effort**: 3 hours
**Files**: `src/utils/api.ts`, `src/store/authSlice.ts`

**Gap**: JWT tokens expire after 90 days but no automatic refresh.

**Implementation**:
- Add refresh token endpoint
- Intercept 401 responses
- Attempt token refresh
- Retry original request with new token
- Logout if refresh fails
- Handle concurrent refresh requests

---

### 38. Add Content Security Policy Headers
**Priority**: Medium
**Effort**: 1 hour
**Files**: `supabase/functions/_shared/headers.ts`

**Gap**: API responses don't include security headers.

**Implementation**:
- Add CSP header to all responses
- Add X-Content-Type-Options: nosniff
- Add X-Frame-Options: DENY
- Add X-XSS-Protection: 1; mode=block
- Add Strict-Transport-Security header
- Update errorResponse() and successResponse()

---

### 39. Implement PII Encryption at Rest
**Priority**: Medium
**Effort**: 4 hours
**Files**: `supabase/migrations/004_encrypt_pii.sql`, backend functions

**Gap**: Phone numbers stored in plain text.

**Implementation**:
- Use Supabase's pgcrypto extension
- Encrypt phone numbers before storage
- Decrypt when retrieving
- Update all queries
- Test performance impact
- Consider column-level encryption vs application-level

---

### 40. Add CAPTCHA to Verification Code Endpoint
**Priority**: Low
**Effort**: 2 hours
**Files**: `supabase/functions/auth/send-verification-code/index.ts`

**Gap**: No protection against automated SMS bombing attacks.

**Implementation**:
- Integrate reCAPTCHA or hCaptcha
- Require CAPTCHA token in request
- Verify token server-side
- Rate limit per IP address (10 codes/day)
- Add honeypot field for bot detection
- Log suspicious activity

---

## Summary Statistics

**Total Items**: 40
**Critical Priority**: 2 items
**High Priority**: 9 items
**Medium Priority**: 18 items
**Low Priority**: 11 items

**Total Estimated Effort**: 82 hours (~10-11 working days)

**Categories**:
- Frontend Integration & Navigation: 10 items (12 hours)
- Backend API Enhancements: 8 items (19 hours)
- Data Validation & Edge Cases: 10 items (17 hours)
- Missing Frontend Features: 6 items (19 hours)
- Security & Privacy Enhancements: 6 items (15 hours)

---

## Recommended Implementation Order

**Phase 1 - Critical (1-2 days)**:
- Item 23: Webhook signature verification review
- Item 35: Implement RLS policies
- Item 36: HTTPS-only enforcement

**Phase 2 - High Priority (3-4 days)**:
- Items 1-4: Service integration in App.tsx
- Item 6: Check-in reminder sync
- Item 12: Timezone library for DST
- Item 14: Idempotency keys for payments
- Item 22: Payment method validation
- Item 37: Token refresh logic

**Phase 3 - Medium Priority (4-5 days)**:
- Items 5, 7-10: Navigation and screen connections
- Items 13, 15-18, 20-21, 24-28: Backend enhancements
- Items 29, 32, 38-39: Security and UX improvements

**Phase 4 - Low Priority (2-3 days)**:
- Items 11, 19, 25, 27, 30-31, 33-34, 40: Nice-to-have features

---

*Generated*: Current session
*Next Action*: Begin implementing Critical and High priority items
