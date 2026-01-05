# Pruuf Email Notification Audit Report

**Date:** 2026-01-04
**Purpose:** Complete audit of all email notification triggers and Postmark integration

---

## Executive Summary

The Pruuf application uses **Postmark** as its email service provider. All emails flow through a centralized email service module with proper error handling, logging, and dual-notification fallback strategies.

### Environment Variables Status: CONFIGURED

| Variable | Status | Location |
|----------|--------|----------|
| `POSTMARK_SERVER_TOKEN` | Configured | Supabase Secrets |
| `POSTMARK_FROM_EMAIL` | Configured | Supabase Secrets |
| `POSTMARK_FROM_NAME` | Configured | Supabase Secrets |

---

## 1. Core Email Service Module

### File: [email.ts](supabase/functions/_shared/email.ts)

This is the **central email service** that all email triggers use.

#### Environment Variables Used (Lines 10-12)
```typescript
const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN') || '';
const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL') || 'noreply@pruuf.me';
```

#### Email Functions Provided

| Function | Line | Purpose | Email Type |
|----------|------|---------|------------|
| `sendEmail()` | 17-100 | Generic email wrapper | varies |
| `sendVerificationCodeEmail()` | 105-163 | 6-digit verification code | `verification_code` |
| `sendMemberInvitationEmail()` | 168-251 | Member invitation with magic link | `member_invitation` |
| `sendCheckInConfirmationEmail()` | 256-317 | Check-in confirmation | `check_in_confirmation` |
| `sendLateCheckInEmail()` | 322-382 | Late check-in notification | `late_check_in` |

#### Utilities
- `isValidEmail()` - Email format validation
- `normalizeEmail()` - Lowercase and trim
- `maskEmail()` - Hide email for display

---

## 2. Dual Notification Service

### File: [dualNotifications.ts](supabase/functions/_shared/dualNotifications.ts)

Implements **dual notification strategy**: Push + Email for redundancy.

#### Notification Priority Levels

| Priority | Behavior | Email Sent? |
|----------|----------|-------------|
| `CRITICAL` | Always send both Push AND Email | YES - Always |
| `HIGH` | Push first, Email fallback if push fails | YES - Fallback |
| `NORMAL` | Push only | NO |
| `LOW` | Push only (batchable) | NO |

#### Notification Types & Priorities

| Type | Priority | Sends Email? |
|------|----------|--------------|
| `MISSED_CHECK_IN` | CRITICAL | YES - Always |
| `CHECK_IN_CONFIRMATION` | HIGH | YES - If push fails |
| `LATE_CHECK_IN` | HIGH | YES - If push fails |
| `MEMBER_CONNECTED` | HIGH | YES - If push fails |
| `CHECK_IN_REMINDER` | NORMAL | NO |
| `CHECK_IN_TIME_CHANGED` | NORMAL | NO |
| `INVITATION_SENT` | NORMAL | NO |
| `WEEKLY_SUMMARY` | LOW | NO |
| `FEATURE_ANNOUNCEMENT` | LOW | NO |

#### Helper Functions

| Function | Line | Priority | Trigger |
|----------|------|----------|---------|
| `sendMissedCheckInAlert()` | 363-381 | CRITICAL | Cron job - deadline passed |
| `sendCheckInConfirmation()` | 383-400 | HIGH | Member checks in on time |
| `sendLateCheckInAlert()` | 402-421 | HIGH | Member checks in late (>5 min) |
| `sendMemberConnectedNotification()` | 423-439 | HIGH | Member accepts invitation |
| `sendCheckInReminderNotification()` | 441-455 | NORMAL | Approaching deadline |

---

## 3. All Email Trigger Points

### 3.1 Authentication Flow

#### Trigger: New User Registration / Email Verification
- **File:** [auth/send-verification-code/index.ts](supabase/functions/auth/send-verification-code/index.ts)
- **Endpoint:** `POST /api/auth/send-verification-code`
- **Email Function:** `sendVerificationCodeEmail()` (Line 77)
- **Email Type:** `verification_code`
- **Rate Limit:** 1 code per 60 seconds
- **Code Expiry:** 10 minutes

#### Trigger: PIN Reset / Forgot PIN
- **File:** [auth/forgot-pin/index.ts](supabase/functions/auth/forgot-pin/index.ts)
- **Endpoint:** `POST /api/auth/forgot-pin`
- **Email Function:** `sendVerificationCodeEmail()` (Line 84)
- **Email Type:** `verification_code`
- **Rate Limit:** 1 code per 60 seconds
- **Code Expiry:** 10 minutes

---

### 3.2 Member Invitation Flow

#### Trigger: Contact Invites a Member
- **File:** [members/invite/index.ts](supabase/functions/members/invite/index.ts)
- **Endpoint:** `POST /api/members/invite`
- **Email Function:** `sendMemberInvitationEmail()` (Lines 79-85)
- **Email Type:** `member_invitation`
- **Contains:** Magic link + 6-character invite code

#### Trigger: Resend Pending Invitation
- **File:** [contacts/resend-invite/index.ts](supabase/functions/contacts/resend-invite/index.ts)
- **Endpoint:** `POST /api/contacts/resend-invite`
- **Email Function:** `sendMemberInvitationEmail()` (Lines 112-118)
- **Email Type:** `member_invitation`
- **Rate Limit:** 1 hour between resends

---

### 3.3 Member Connected Notification

#### Trigger: Member Accepts Invitation
- **File:** [accept-invitation/index.ts](supabase/functions/accept-invitation/index.ts)
- **Endpoint:** `POST /accept-invitation`
- **Email Function:** `sendMemberConnectedNotification()` via dualNotifications (Lines 232-248)
- **Priority:** HIGH (push + email fallback)
- **Recipient:** Contact who sent invitation

---

### 3.4 Check-In Notifications

#### Trigger: Member Checks In Late (>5 minutes)
- **File:** [members/check-in/index.ts](supabase/functions/members/check-in/index.ts)
- **Endpoint:** `POST /api/members/:memberId/check-in`
- **Email Function:** `sendLateCheckInAlert()` via dualNotifications (Lines 134-140)
- **Priority:** HIGH (push + email fallback)
- **Recipients:** All active Contacts

#### Trigger: Member Misses Check-In Deadline (CRON)
- **File:** [cron/check-missed-checkins/index.ts](supabase/functions/cron/check-missed-checkins/index.ts)
- **Schedule:** Every 5 minutes (`*/5 * * * *`)
- **Email Function:** `sendMissedCheckInAlert()` via dualNotifications (Lines 134-139)
- **Priority:** CRITICAL (always push + email)
- **Recipients:** All active Contacts
- **Deduplication:** One alert per member per day

---

### 3.5 Generic Email Notification

#### Trigger: Direct API Call
- **File:** [send-email-notification/index.ts](supabase/functions/send-email-notification/index.ts)
- **Endpoint:** `POST /send-email-notification`
- **Email Function:** `sendEmail()` (Lines 137-144)
- **Use Case:** Generic notifications, dual notification fallback

---

## 4. Email Flow Diagram

```
AUTHENTICATION FLOW
-------------------
User enters email → send-verification-code endpoint
                  → sendVerificationCodeEmail()
                  → Postmark API → User inbox

INVITATION FLOW
---------------
Contact clicks "Add Member" → members/invite endpoint
                            → sendMemberInvitationEmail()
                            → Postmark API → Invited person inbox

MEMBER ACCEPTS INVITATION
-------------------------
User clicks magic link/enters code → accept-invitation endpoint
                                   → sendMemberConnectedNotification()
                                   → Postmark API → Contact's inbox

DAILY CHECK-IN FLOW (MISSED)
----------------------------
Cron job runs every 5 min → check-missed-checkins
                          → sendMissedCheckInAlert() [CRITICAL]
                          → Postmark API → All Contacts' inboxes

DAILY CHECK-IN FLOW (LATE)
--------------------------
Member taps "I'm OK" (>5 min late) → members/check-in endpoint
                                   → sendLateCheckInAlert() [HIGH]
                                   → Postmark API → All Contacts' inboxes (fallback)
```

---

## 5. Environment Variables Verification

### Supabase Secrets (VERIFIED DEPLOYED)

Confirmed via `supabase secrets list`:

| Secret Name | Status |
|-------------|--------|
| `POSTMARK_SERVER_TOKEN` | Configured |
| `POSTMARK_FROM_EMAIL` | Configured |
| `POSTMARK_FROM_NAME` | Configured |

### Local .env File

**File:** [.env](.env)

```
POSTMARK_SERVER_TOKEN=5df12227-22b2-43ed-b03f-8ae5e01b0f0a
POSTMARK_FROM_EMAIL=wesley@kndinfusions.com
POSTMARK_FROM_NAME=Pruuf
```

### Production .env.production File

**File:** [.env.production](.env.production)

Postmark variables are **commented out** with instruction to set via Supabase secrets:
```
# POSTMARK_SERVER_TOKEN=<set via supabase secrets>
# POSTMARK_FROM_EMAIL=noreply@pruuf.me
```

---

## 6. Issues & Recommendations

### Issue 1: POSTMARK_FROM_EMAIL Mismatch

| Location | Value |
|----------|-------|
| .env (local) | `wesley@kndinfusions.com` |
| .env.example | `Support@pruuf.me` |
| Code fallback | `noreply@pruuf.me` |

**Recommendation:** Standardize to `noreply@pruuf.me` or `support@pruuf.me` across all environments.

### Issue 2: No Check-In Confirmation Email on Time

Currently, when a member checks in **on time**, no email is sent. The `sendCheckInConfirmation()` function exists but is **not called** in the check-in flow.

**Current behavior:**
- Late check-in (>5 min): Sends email via `sendLateCheckInAlert()` [HIGH priority]
- On-time check-in: No email sent

**Expected behavior (based on dualNotifications.ts):**
- `CHECK_IN_CONFIRMATION` type exists with HIGH priority

**Recommendation:** If on-time confirmations are desired, add call to `sendCheckInConfirmation()` in the check-in endpoint.

### Issue 3: Missing Email Templates

The following notification types in dualNotifications.ts have no dedicated email templates:

| Type | Status |
|------|--------|
| `WEEKLY_SUMMARY` | No template |
| `FEATURE_ANNOUNCEMENT` | No template |
| `CHECK_IN_TIME_CHANGED` | No template |
| `INVITATION_SENT` | No template |

These are all LOW/NORMAL priority (push only), so no email template is needed.

---

## 7. Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Email Trigger Points** | 9 |
| **Unique Email Types** | 6 |
| **Email Functions** | 5 |
| **Edge Functions Sending Email** | 7 |
| **Cron Jobs Sending Email** | 1 |
| **CRITICAL Priority (always email)** | 1 |
| **HIGH Priority (email fallback)** | 4 |

---

## 8. Complete Email Type Reference

| Email Type | Template | Trigger | Priority |
|------------|----------|---------|----------|
| `verification_code` | Yes | Auth flow, forgot PIN | N/A |
| `member_invitation` | Yes | Contact invites member | N/A |
| `check_in_confirmation` | Yes | Member checks in on time | HIGH (unused) |
| `late_check_in` | Yes | Member checks in late | HIGH |
| `missed_check_in` | Yes (via dual) | Cron - deadline passed | CRITICAL |
| `member_connected` | Yes (via dual) | Member accepts invitation | HIGH |

---

## 9. Testing Recommendations

1. **Verify Postmark Token:** Send test email via Postmark dashboard
2. **Test verification code flow:** Create new account, verify code arrives
3. **Test invitation flow:** Invite member, verify email arrives with magic link
4. **Test missed check-in:** Manually trigger cron job, verify alert sent
5. **Test late check-in:** Check in >5 minutes late, verify notification sent

---

## Appendix: File Reference

| File | Line | Email Function |
|------|------|----------------|
| [email.ts](supabase/functions/_shared/email.ts) | 17 | `sendEmail()` |
| [email.ts](supabase/functions/_shared/email.ts) | 105 | `sendVerificationCodeEmail()` |
| [email.ts](supabase/functions/_shared/email.ts) | 168 | `sendMemberInvitationEmail()` |
| [email.ts](supabase/functions/_shared/email.ts) | 256 | `sendCheckInConfirmationEmail()` |
| [email.ts](supabase/functions/_shared/email.ts) | 322 | `sendLateCheckInEmail()` |
| [dualNotifications.ts](supabase/functions/_shared/dualNotifications.ts) | 131 | `sendDualNotification()` |
| [dualNotifications.ts](supabase/functions/_shared/dualNotifications.ts) | 363 | `sendMissedCheckInAlert()` |
| [dualNotifications.ts](supabase/functions/_shared/dualNotifications.ts) | 383 | `sendCheckInConfirmation()` |
| [dualNotifications.ts](supabase/functions/_shared/dualNotifications.ts) | 402 | `sendLateCheckInAlert()` |
| [dualNotifications.ts](supabase/functions/_shared/dualNotifications.ts) | 423 | `sendMemberConnectedNotification()` |
| [auth/send-verification-code/index.ts](supabase/functions/auth/send-verification-code/index.ts) | 77 | Calls `sendVerificationCodeEmail()` |
| [auth/forgot-pin/index.ts](supabase/functions/auth/forgot-pin/index.ts) | 84 | Calls `sendVerificationCodeEmail()` |
| [members/invite/index.ts](supabase/functions/members/invite/index.ts) | 79 | Calls `sendMemberInvitationEmail()` |
| [contacts/resend-invite/index.ts](supabase/functions/contacts/resend-invite/index.ts) | 112 | Calls `sendMemberInvitationEmail()` |
| [accept-invitation/index.ts](supabase/functions/accept-invitation/index.ts) | 236 | Calls `sendMemberConnectedNotification()` |
| [members/check-in/index.ts](supabase/functions/members/check-in/index.ts) | 134 | Calls `sendLateCheckInAlert()` |
| [cron/check-missed-checkins/index.ts](supabase/functions/cron/check-missed-checkins/index.ts) | 134 | Calls `sendMissedCheckInAlert()` |
| [send-email-notification/index.ts](supabase/functions/send-email-notification/index.ts) | 138 | Calls `sendEmail()` |

---

## 10. INTEGRATION SETUP GUIDE

### Step 1: Postmark Account Setup

1. **Create Postmark Account:** Go to https://postmarkapp.com and create an account
2. **Create Server:** Create a new server for Pruuf
3. **Get Server Token:** Copy the Server API Token from Server settings
4. **Verify Sender Signature:**
   - Go to "Sender Signatures" in Postmark
   - Add `noreply@pruuf.me` (or your desired sender email)
   - Verify the email/domain ownership

### Step 2: Supabase Backend Configuration

#### Option A: Via Supabase CLI (Recommended for Production)

```bash
# Set all required Postmark secrets
supabase secrets set POSTMARK_SERVER_TOKEN=your_actual_postmark_server_token
supabase secrets set POSTMARK_FROM_EMAIL=noreply@pruuf.me
supabase secrets set POSTMARK_FROM_NAME=Pruuf

# Verify secrets are set
supabase secrets list --project-ref ivnstzpolgjzfqduhlvw
```

#### Option B: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ivnstzpolgjzfqduhlvw/settings/vault
2. Add secrets:
   - `POSTMARK_SERVER_TOKEN` = your Postmark server token
   - `POSTMARK_FROM_EMAIL` = noreply@pruuf.me
   - `POSTMARK_FROM_NAME` = Pruuf

### Step 3: Deploy Edge Functions

After setting secrets, redeploy all edge functions to pick up the new environment:

```bash
# Set your Supabase access token
export SUPABASE_ACCESS_TOKEN=your_access_token

# Deploy all functions
supabase functions deploy --project-ref ivnstzpolgjzfqduhlvw
```

Or deploy specific email-related functions:

```bash
# Core auth functions that send verification emails
supabase functions deploy auth/send-verification-code --project-ref ivnstzpolgjzfqduhlvw
supabase functions deploy auth/forgot-pin --project-ref ivnstzpolgjzfqduhlvw

# Member invitation functions
supabase functions deploy members/invite --project-ref ivnstzpolgjzfqduhlvw
supabase functions deploy contacts/resend-invite --project-ref ivnstzpolgjzfqduhlvw
supabase functions deploy accept-invitation --project-ref ivnstzpolgjzfqduhlvw

# Check-in notifications
supabase functions deploy members/check-in --project-ref ivnstzpolgjzfqduhlvw

# Cron job for missed check-ins
supabase functions deploy cron/check-missed-checkins --project-ref ivnstzpolgjzfqduhlvw

# Generic email notification
supabase functions deploy send-email-notification --project-ref ivnstzpolgjzfqduhlvw

# Shared modules (automatically included)
supabase functions deploy api --project-ref ivnstzpolgjzfqduhlvw
```

### Step 4: Frontend Environment Configuration

The frontend **does not** need Postmark configuration because emails are sent from the backend Edge Functions.

#### Required Frontend Environment Variables (.env.production)

```bash
# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=https://ivnstzpolgjzfqduhlvw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Base URL (points to Edge Functions)
EXPO_PUBLIC_API_BASE_URL=https://ivnstzpolgjzfqduhlvw.supabase.co/functions/v1/api

# Expo Project ID
EXPO_PUBLIC_EXPO_PROJECT_ID=bd21c5ca-f051-4310-8985-70f10ec8a2db
```

These values are read by [app.config.js](app.config.js) and passed to the app via `Constants.expoConfig.extra`.

### Step 5: Local Development Configuration

For local development, update [.env](.env):

```bash
# Postmark Email Configuration (for local Supabase)
POSTMARK_SERVER_TOKEN=your_postmark_server_token
POSTMARK_FROM_EMAIL=noreply@pruuf.me
POSTMARK_FROM_NAME=Pruuf
```

Then start local Supabase:

```bash
supabase start
supabase functions serve
```

### Step 6: Verify Integration

#### Test 1: Verification Code Email

```bash
curl -X POST "https://ivnstzpolgjzfqduhlvw.supabase.co/functions/v1/api/auth/send-verification-code" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```

**Expected Result:** Email with 6-digit verification code sent to test@example.com

#### Test 2: Member Invitation Email

```bash
curl -X POST "https://ivnstzpolgjzfqduhlvw.supabase.co/functions/v1/api/members/invite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"member_name":"John Doe","member_email":"john@example.com"}'
```

**Expected Result:** Invitation email with magic link sent to john@example.com

#### Test 3: Check Postmark Logs

Go to Postmark dashboard -> Activity -> Outbound to see sent emails.

---

## 11. Architecture Overview

```
+-------------------------------------------------------------------+
|                     FRONTEND (React Native)                        |
|                                                                    |
|  +---------------+  +---------------+  +---------------+           |
|  | EmailEntry    |  | Verification  |  | AddMember     |           |
|  | Screen        |  | Code Screen   |  | Screen        |           |
|  +------+--------+  +-------+-------+  +-------+-------+           |
|         |                   |                  |                   |
|         | authAPI           | authAPI          | membersAPI        |
|         v                   v                  v                   |
|  +-------------------------------------------------------------+  |
|  |              src/services/api.ts                             |  |
|  |  - authAPI.sendVerificationCode()                            |  |
|  |  - authAPI.forgotPin()                                       |  |
|  |  - membersAPI.invite()                                       |  |
|  |  - contactsAPI.resendInvite()                                |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                              |
                              | HTTPS POST to Edge Functions
                              v
+-------------------------------------------------------------------+
|                 SUPABASE EDGE FUNCTIONS (Deno)                     |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |              API Endpoints (supabase/functions/)              | |
|  |                                                               | |
|  |  auth/send-verification-code  --+                             | |
|  |  auth/forgot-pin              --+                             | |
|  |  members/invite               --+                             | |
|  |  contacts/resend-invite       --+--> Import email.ts          | |
|  |  accept-invitation            --+                             | |
|  |  members/check-in             --+                             | |
|  |                                                               | |
|  |  cron/check-missed-checkins   --> Import dualNotifications    | |
|  +--------------------------------------------------------------+ |
|                              |                                     |
|                              v                                     |
|  +--------------------------------------------------------------+ |
|  |            Shared Modules (_shared/)                          | |
|  |                                                               | |
|  |  +----------------------------------------------------------+ | |
|  |  | email.ts                                                  | | |
|  |  | - sendEmail()                                             | | |
|  |  | - sendVerificationCodeEmail()                             | | |
|  |  | - sendMemberInvitationEmail()                             | | |
|  |  | - sendCheckInConfirmationEmail()                          | | |
|  |  | - sendLateCheckInEmail()                                  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                               | |
|  |  +----------------------------------------------------------+ | |
|  |  | dualNotifications.ts                                      | | |
|  |  | - sendMissedCheckInAlert()     [CRITICAL]                 | | |
|  |  | - sendCheckInConfirmation()    [HIGH]                     | | |
|  |  | - sendLateCheckInAlert()       [HIGH]                     | | |
|  |  | - sendMemberConnectedNotification() [HIGH]                | | |
|  |  +-------------------+--------------------------------------+ | |
|  |                      |                                        | |
|  |                      | Calls email.ts functions               | |
|  |                      v                                        | |
|  |  +----------------------------------------------------------+ | |
|  |  | Environment Variables (Supabase Secrets)                  | | |
|  |  | - POSTMARK_SERVER_TOKEN                                   | | |
|  |  | - POSTMARK_FROM_EMAIL                                     | | |
|  |  | - POSTMARK_FROM_NAME                                      | | |
|  |  +----------------------------------------------------------+ | |
|  +--------------------------------------------------------------+ |
+-------------------------------------------------------------------+
                              |
                              | HTTPS POST to Postmark API
                              v
+-------------------------------------------------------------------+
|                      POSTMARK API                                  |
|                 https://api.postmarkapp.com/email                  |
|                                                                    |
|  Headers:                                                          |
|    X-Postmark-Server-Token: $POSTMARK_SERVER_TOKEN                 |
|                                                                    |
|  Payload:                                                          |
|    From: $POSTMARK_FROM_EMAIL                                      |
|    To: recipient@email.com                                         |
|    Subject: "Your Pruuf Verification Code"                         |
|    HtmlBody: <email HTML>                                          |
|    TextBody: <email plain text>                                    |
|    MessageStream: "outbound"                                       |
+-------------------------------------------------------------------+
                              |
                              | Email Delivery
                              v
                    +-------------------+
                    |   USER'S INBOX    |
                    +-------------------+
```

---

## 12. Troubleshooting Guide

### Problem: "Postmark credentials not configured" Error

**Cause:** `POSTMARK_SERVER_TOKEN` is empty or not set in Supabase secrets.

**Solution:**
```bash
supabase secrets set POSTMARK_SERVER_TOKEN=your_actual_token
supabase functions deploy --project-ref ivnstzpolgjzfqduhlvw
```

### Problem: Emails Not Being Sent

**Check 1:** Verify secrets are configured
```bash
supabase secrets list --project-ref ivnstzpolgjzfqduhlvw
```

**Check 2:** Check Postmark Activity log for errors
- Go to Postmark dashboard -> Activity -> Outbound

**Check 3:** Verify sender signature is verified in Postmark
- Go to Postmark -> Sender Signatures
- Ensure `noreply@pruuf.me` is verified

**Check 4:** Check Edge Function logs
```bash
supabase functions logs auth/send-verification-code --project-ref ivnstzpolgjzfqduhlvw
```

### Problem: Emails Going to Spam

**Solution 1:** Set up SPF record for pruuf.me domain
```
TXT @ "v=spf1 include:spf.mtasv.net ~all"
```

**Solution 2:** Set up DKIM in Postmark
- Go to Postmark -> Sender Signatures -> Domain
- Copy the DKIM TXT record and add to DNS

**Solution 3:** Set up DMARC record
```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@pruuf.me"
```

### Problem: Rate Limit Exceeded (429 Error)

**Cause:** User requesting verification codes too frequently

**Solution:** This is expected behavior. Wait 1 minute between requests.

### Problem: Email Template Not Rendering Correctly

**Check:** View the HTML in Postmark Activity -> click on email -> View HTML Source

---

## 13. Postmark Best Practices

### 1. Use Message Streams

All Pruuf emails use the `outbound` message stream. Consider creating separate streams for:
- `transactional` - Verification codes, critical alerts
- `marketing` - Feature announcements, newsletters

### 2. Monitor Bounce Rates

Set up bounce webhooks in Postmark to:
- Mark invalid emails in database
- Prevent sending to bounced addresses

### 3. Track Email Delivery

The codebase already logs all emails to database:
- `email_logs` table (via `logEmail()` in db.ts)
- `email_notification_logs` table (via dualNotifications)

### 4. Handle Failures Gracefully

All email-sending functions are wrapped in try-catch and:
- Log failures to audit_logs
- Don't fail the parent request if email fails
- Continue processing (e.g., still create relationship even if invite email fails)

---

## 14. Quick Reference Checklist

### Backend Setup (One-time)

- [ ] Create Postmark account at https://postmarkapp.com
- [ ] Create a server in Postmark
- [ ] Get Server API Token
- [ ] Add and verify sender signature (noreply@pruuf.me)
- [ ] Set Supabase secrets:
  ```bash
  supabase secrets set POSTMARK_SERVER_TOKEN=xxx
  supabase secrets set POSTMARK_FROM_EMAIL=noreply@pruuf.me
  supabase secrets set POSTMARK_FROM_NAME=Pruuf
  ```
- [ ] Deploy edge functions
- [ ] Test with verification code flow

### Frontend Setup (One-time)

- [ ] Ensure `.env.production` has correct `EXPO_PUBLIC_API_BASE_URL`
- [ ] Build and deploy app

### DNS Setup (One-time for better deliverability)

- [ ] Add SPF record
- [ ] Add DKIM record (from Postmark)
- [ ] Add DMARC record

### Monitoring (Ongoing)

- [ ] Check Postmark Activity for delivery issues
- [ ] Monitor bounce rates
- [ ] Check Edge Function logs for errors
