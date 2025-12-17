# PRUUF: EXHAUSTIVE APPLICATION SPECIFICATION & IMPLEMENTATION BLUEPRINT

**Document Version:** 3.0
**Specification Date:** December 2025
**Document Purpose:** Complete AI-reproducible application specification
**Target Platforms:** iOS 14+ & Android 10+ (React Native)
**Backend Infrastructure:** Supabase (PostgreSQL) + Edge Functions
**Payment Processing:** RevenueCat
**Notification Delivery:** Firebase Cloud Messaging (FCM) + Email (Postmark)
**Total Codebase:** ~23,706 lines of TypeScript/JavaScript

---

## TABLE OF CONTENTS

1. [Executive Summary](#part-i-executive-summary)
2. [Product Philosophy & Design Principles](#part-ii-product-philosophy--design-principles)
3. [User Roles & Personas](#part-iii-user-roles--personas)
4. [Business Model & Pricing Logic](#part-iv-business-model--pricing-logic)
5. [Complete User Flows](#part-v-complete-user-flows)
6. [Database Schema & Data Models](#part-vi-database-schema--data-models)
7. [API Endpoints & Backend Services](#part-vii-api-endpoints--backend-services)
8. [Frontend Architecture](#part-viii-frontend-architecture)
9. [State Management (Redux)](#part-ix-state-management-redux)
10. [Design System & Component Library](#part-x-design-system--component-library)
11. [Notification System](#part-xi-notification-system)
12. [External Service Integrations](#part-xii-external-service-integrations)
13. [Security Implementation](#part-xiii-security-implementation)
14. [Accessibility Implementation](#part-xiv-accessibility-implementation)
15. [Edge Cases & Error Handling](#part-xv-edge-cases--error-handling)
16. [Cron Jobs & Background Tasks](#part-xvi-cron-jobs--background-tasks)
17. [File Structure & Code Organization](#part-xvii-file-structure--code-organization)
18. [Environment Configuration](#part-xviii-environment-configuration)
19. [Testing Strategy](#part-xix-testing-strategy)
20. [Deployment & Infrastructure](#part-xx-deployment--infrastructure)

---

## PART I: EXECUTIVE SUMMARY

### 1.1 Product Overview

Pruuf is a compassionate daily wellness check-in application designed specifically for elderly adults (called "Members") and their family caregivers (called "Contacts"). The application operates on a simple but powerful premise: Members confirm their wellbeing once per day by tapping a single large button, and their designated Contacts receive automatic notification of this check-in or immediate alerts if the check-in is missed.

The application prioritizes radical simplicity, accessibility for aging users with potential vision and motor impairments, and emotional reassurance for both the elderly user and their concerned family members. Every design decision, from the 120-point "I'm OK" button to the warm green color palette, is intentional and serves the product's core mission of providing peace of mind.

### 1.2 Core Value Proposition

**For Members (Elderly Users):**
- One-tap daily ritual that takes less than 5 seconds
- Preserves dignity by framing check-in as reassurance rather than surveillance
- Large, accessible interface designed for reduced vision and dexterity
- No payment required, ever (even if they also monitor other Members)

**For Contacts (Family Caregivers):**
- Automatic daily confirmation that loved one is well
- Immediate alerts via push notification and email if check-in is missed
- Can monitor multiple elderly relatives from single subscription
- Peace of mind without intrusive daily phone calls

### 1.3 Technical Architecture Summary

The application is built with:
- **React Native 0.74.0** with TypeScript strict mode for cross-platform mobile development
- **Redux Toolkit 2.10.1** for predictable state management across 5 domain slices
- **Supabase** for PostgreSQL database with Row Level Security and Edge Functions
- **Firebase Cloud Messaging** for reliable push notification delivery
- **Postmark** for transactional email delivery (verification, critical alerts)
- **RevenueCat** for payment processing with $3.99/month (or $29/year) subscription model

---

## PART II: PRODUCT PHILOSOPHY & DESIGN PRINCIPLES

### 2.1 The Five Pillars of Pruuf Design

Every feature, screen, component, and interaction in Pruuf must adhere to these five non-negotiable design principles:

#### PILLAR 1: RADICAL SIMPLICITY

The application must be usable by someone with limited technology experience, age-related vision impairment, and reduced fine motor control. This is achieved through:

- **Maximum 3 interactive elements per screen** - No screen overwhelms the user with choices
- **One clearly dominant primary action per screen** - The main action button is always obvious
- **No hidden gestures** - No swipe-to-delete, no long-press menus, no pull-to-refresh without visual indicator
- **No hamburger menus or complex navigation** - Tab bar navigation only
- **Every action requires exactly one tap** - Except destructive actions which require confirmation
- **Zero UI jargon** - "Settings" not "Preferences", "Check In" not "Submit Status"
- **No nested menus deeper than 2 levels** - All functionality accessible within 2 taps

#### PILLAR 2: EMOTIONAL DESIGN

Technology should feel warm, not clinical. Every interaction communicates care, safety, and competence:

**Language Principles:**
- First person, conversational tone: "You checked in!" not "Check-in recorded"
- Positive framing: "Great job!" not "Task completed"
- Explicit reassurance: "Your family has been notified" not "Notification sent"
- Never use guilt or fear: "Time for your daily check-in" not "Your daughter is worried"
- Apologize when errors occur: "Sorry, something went wrong" not "Error 500"

**Visual Principles:**
- Warm color palette with greens representing safety and success
- Generous whitespace with no cramped layouts
- Friendly, rounded iconography (no sharp, angular icons)
- Subtle success animations that celebrate without overwhelming
- Soft shadows that provide depth without harsh contrast

#### PILLAR 3: ACCESSIBILITY FIRST

Accessibility is not a feature to be added later - it is the foundation of every design decision:

- **Touch Targets:** All interactive elements are minimum 60 points (Apple recommends 44pt, we exceed this by 36%)
- **Color Contrast:** AAA-compliant ratios (7:1 for normal text, 4.5:1 for large text)
- **Screen Reader Support:** Full VoiceOver (iOS) and TalkBack (Android) compatibility with descriptive labels
- **Dynamic Type:** Respects system font size settings with 3 manual override options (Standard 1.0x, Large 1.25x, Extra Large 1.5x)
- **Color Independence:** Never rely on color alone - always use icon + text + shape
- **Haptic Feedback:** Tactile confirmation for all critical actions
- **Error Identification:** Clear, non-judgmental error messages with specific recovery instructions

#### PILLAR 4: TRUST THROUGH TRANSPARENCY

Users trust Pruuf with their safety. Trust comes from predictability, clarity, and control:

**Transparency Requirements:**
- Members see exactly who monitors them (complete Contact list with names visible)
- Contacts see exact check-in times and deadlines (no ambiguity about "when should I worry")
- All notifications explain exactly what happened and what happens next
- Payment terms are explicit and predictable (no surprise charges, clear trial end dates)
- User can export their data and delete their account completely at any time
- Privacy policy uses plain language, not legal jargon

**Control Requirements:**
- Members set their own check-in time (not imposed by family)
- Members can change check-in time anytime (with notification to Contacts)
- Members can add or remove Contacts freely
- Contacts can cancel subscription with one tap, effective immediately
- All notification preferences can be customized (though critical alerts cannot be disabled)

#### PILLAR 5: ZERO BURDEN PRINCIPLE

Pruuf requires the absolute minimum effort from both Members and Contacts:

**For Members:**
- One tap per day (literally one tap on "I'm OK" button)
- No forced conversations, journaling, or multiple inputs
- No guilt trips or nagging (optional reminder at most)
- No payment, no credit card, no subscription management ever

**For Contacts:**
- Zero effort when things are normal (automatic confirmation)
- Single notification when action needed (missed check-in)
- No daily app opening required (notifications provide info)
- Simple subscription ($3.99/month or $29/year, no tiers, no add-ons)
- Can monitor unlimited Members without additional complexity

### 2.2 Success Metrics

The application succeeds when it achieves these measurable outcomes:

**User Engagement:**
- Members check in ≥90% of days within their deadline
- Contacts respond to missed check-in alerts within 30 minutes ≥80% of time
- Member 90-day retention ≥80%

**Business Viability:**
- Contact trial-to-paid conversion ≥65%
- Monthly churn ≤5%
- Average Contacts per Member ≥2.5 (viral growth indicator)

**Product Quality:**
- App crash rate <0.1% of sessions
- API p99 latency <500ms
- Push notification delivery rate ≥95%
- Email delivery success rate ≥99%

---

## PART III: USER ROLES & PERSONAS

### 3.1 Member Role (The Elderly User Being Monitored)

**Database Identifier:** `is_member: true`

**Demographic Profile:**
- Age: Typically 65-90+ years old
- Living situation: Independent living, assisted living, or aging in place
- Technology comfort: Low to moderate; may own smartphone but uses limited features
- Physical considerations: Potential vision impairment, reduced dexterity, possible tremor
- Cognitive considerations: May struggle with multi-step processes

**Primary User Journey:**
1. Receives email invite from family member (Contact)
2. Creates account via email verification and 4-digit PIN
3. Enters 6-character invite code to connect with Contact
4. Sets daily check-in time (default: 10:00 AM)
5. Each day, taps "I'm OK" button before deadline
6. Optionally receives reminder notification before deadline

**Key Interface Requirements:**
- Giant "I'm OK" button dominates dashboard (120pt height, 90% screen width)
- Font size defaults to "Large" (1.25x multiplier)
- Confirmation feedback is immediate and obvious
- Settings are accessible but not prominent
- No gamification or streaks (creates anxiety about breaking streak)

**What Members NEVER Do:**
- Pay for the service (ever, under any circumstances)
- Enter credit card information
- See pricing or subscription screens
- Manage payment methods

### 3.2 Contact Role (The Family Caregiver Who Monitors)

**Database Identifier:** `is_member: false` (unless also monitored by someone else)

**Demographic Profile:**
- Age: Typically 35-70 years old (adult children, siblings, close friends)
- Technology comfort: Moderate to high; daily smartphone users
- Primary motivation: Ensure elderly loved one's safety without daily intrusive calls

**Primary User Journey:**
1. Downloads app and creates account via email verification
2. Creates 4-digit PIN for app security
3. Invites first Member (elderly relative) via email
4. Receives daily check-in confirmations via push notification
5. Receives immediate alerts if Member misses check-in deadline
6. After 30-day trial, adds payment method to continue service

**Key Interface Requirements:**
- Dashboard shows all Members at a glance with status indicators
- "Last checked in" timestamp is prominently displayed
- Call/Text buttons are one-tap from dashboard
- Trial reminders are gentle (user will likely pay, no hard sell needed)
- Can view pending invites and resend if needed

### 3.3 Member-as-Contact Role (Dual Role User)

**Database Identifiers:** `is_member: true` AND `grandfathered_free: true`

**Scenario Description:**
A user who is both monitored by family (Member role) AND monitors someone else (Contact role). Example: An 71-year-old woman whose daughter monitors her, but who also monitors her older 76-year-old sister.

**Special Behavior:**
- Functions as both roles simultaneously
- Has access to all Contact features (invite Members, view dashboard)
- Has access to all Member features (check-in, view their own Contacts)
- **NEVER pays** - the Member status grants permanent free Contact access
- Even if all Contacts stop monitoring them (no longer technically a Member), `grandfathered_free` flag persists forever
- If they were previously paying when they became a Member, subscription does not renew at end of billing cycle

**Database Logic:**
```sql
-- A user never pays if ANY of these conditions are true:
-- 1. They are currently a Member (someone actively monitors them)
-- 2. They were ever a Member (grandfathered_free = true)
CREATE OR REPLACE FUNCTION requires_payment(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  active_monitoring_exists BOOLEAN;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;

  -- Grandfathered users never pay
  IF user_record.grandfathered_free = TRUE THEN
    RETURN FALSE;
  END IF;

  -- Current Members never pay
  IF user_record.is_member = TRUE THEN
    RETURN FALSE;
  END IF;

  -- Everyone else requires payment (unless already subscribed)
  IF user_record.account_status IN ('active', 'active_free') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## PART IV: BUSINESS MODEL & PRICING LOGIC

### 4.1 Pricing Structure

**Single Tier Model:**
- **Monthly Price:** $3.99 USD per month
- **Annual Price:** $29 USD per year (39% savings vs monthly)
- **Billing Cycle:** Monthly (every 30 days) or Annual (every 365 days)
- **Payment Method:** Credit/debit card via RevenueCat
- **Trial Period:** 30 calendar days, starts when first Member completes onboarding, no credit card required
- **Currency:** USD (international expansion requires additional currency support)

**What's Included (Unlimited):**
- Monitor unlimited Members (no cap at 2, 5, or 10)
- Each Member can have unlimited Contacts (up to 10, database constraint)
- Unlimited email verification
- Unlimited push notifications
- Unlimited Member invitation emails
- Full access to all features (no premium tier exists)
- 24/7 check-in deadline monitoring
- Immediate alert delivery via push + email

### 4.2 Payment Rules (The Core Logic)

**Rule 1: Contacts Pay**
Any user who acts as a Contact (monitors at least one Member) must pay $3.99/month (or $29/year) after their 30-day trial ends, UNLESS they are also a Member.

**Rule 2: Members Never Pay**
Any user who is a Member (someone monitors them) NEVER pays, NEVER enters payment information, and NEVER sees pricing screens. This is absolute and non-negotiable.

**Rule 3: Member-as-Contact Never Pays**
If a user is BOTH a Member AND a Contact, they never pay. The Member status takes precedence. This is "grandfathered free forever" benefit.

**Rule 4: Once a Member, Always Free**
If a user becomes a Member (someone invites them and they accept), they receive permanent free Contact access. Even if all their Contacts later stop monitoring them (they're no longer technically a Member), they retain free Contact access forever via `grandfathered_free = true` flag.

**Rule 5: Subscription is Per Contact, Not Per Member**
One Contact monitoring 5 Members pays $3.99/month total (not $3.99 per Member). Unlimited Members for one flat fee.

### 4.3 Subscription Lifecycle States

| State | Database Value | Description |
|-------|----------------|-------------|
| Trial | `trial` | 30-day free trial active (starts when first Member onboards), no payment method required |
| Active Paid | `active` | Paying subscription active via RevenueCat |
| Active Free | `active_free` | Member or grandfathered user, never charged |
| Past Due | `past_due` | Payment failed, 3-day grace period active |
| Frozen | `frozen` | Trial ended without payment OR grace period expired |
| Canceled | `canceled` | User canceled, access retained until billing period end |
| Deleted | `deleted` | Account soft-deleted, pending 30-day hard delete |

### 4.4 Trial Mechanics (Detailed)

**Trial Start:**
- Trigger: First Member completes onboarding (not when Contact signs up)
- Before first Member: `account_status = 'trial_pending'` (no timer running)
- After first Member onboards: `trial_start_date = NOW()`, `trial_end_date = NOW() + INTERVAL '30 days'`
- Duration: Exactly 30 calendar days from first Member onboarding
- Access: Full access to all features
- Payment: No credit card required, no pre-authorization

**During Trial (Days 1-30):**
- User can invite unlimited Members
- User receives all push and email notifications
- User can add payment method in Settings at any time (optional)
- Push notifications at 14 days, 7 days, and 1 day before trial ends remind user to set up payment

**Trial End (Day 31):**
At midnight UTC on the 31st day after first Member onboarded, the system evaluates:
```javascript
if (user.RevenueCat_subscription_id && subscription.status === 'active') {
  // User already paid, continue service
  user.account_status = 'active';
} else if (user.is_member || user.grandfathered_free) {
  // User is Member or grandfathered, no payment required
  user.account_status = 'active_free';
} else {
  // User needs to pay but hasn't
  user.account_status = 'frozen';
  sendTrialEndedNotification(user.id);
}
```

**Frozen Account Behavior:**
- User can open app (not locked out)
- Dashboard shows banner: "Add payment to continue receiving alerts"
- Cannot receive new missed check-in alerts
- Cannot invite new Members
- Can view existing Members (read-only)
- Can add payment method to reactivate immediately
- Existing Member connections preserved in database

### 4.5 Grandfathering Logic (When Contact Becomes Member)

**Scenario:** Jennifer (Contact, paying $3.99/month for 3 months) gets invited by her own daughter Emily to be a Member.

**Step-by-Step Flow:**
1. Emily downloads Pruuf, creates account, invites Jennifer to be a Member
2. Jennifer receives email with 6-character invite code
3. Jennifer opens Pruuf app (already logged in), sees in-app notification
4. Jennifer taps notification, enters invite code, accepts
5. System creates relationship: `member_contact_relationships { member_id: jennifer_id, contact_id: emily_id, status: 'active' }`
6. System detects Jennifer is now a Member via query
7. System sets: `users.grandfathered_free = TRUE WHERE id = jennifer_id`
8. Jennifer's current billing cycle ends on Dec 15 (today is Dec 1)
9. At Dec 15, RevenueCat webhook fires, system checks `grandfathered_free`
10. Subscription set to `cancel_at_period_end = true`, does NOT renew
11. Jennifer receives notification: "Great news! Since you're now a Pruuf Member, you'll never pay again. You can continue monitoring others for free, forever."
12. `RevenueCat_subscription_id = NULL`, `account_status = 'active_free'`

**Critical Edge Case:** If Emily later stops monitoring Jennifer (removes her as Contact), Jennifer's `grandfathered_free = true` persists. She remains free forever.

---

## PART V: COMPLETE USER FLOWS

### 5.1 Contact Onboarding Flow (8 Steps)

**STEP 1: Welcome Screen**
- Hero image with warm, friendly elderly person photo
- Headline: "Stay connected to loved ones with daily check-ins"
- Subheadline: "30-day free trial • $3.99/month after • Cancel anytime"
- Primary CTA: "Get Started" (60pt height, full-width button)
- Secondary link: "Already have an account? Log in"
- VoiceOver: "Pruuf welcome screen. Tap Get Started to begin."

**STEP 2: Email Entry**
- Screen title: "What's your email?"
- Input field with email keyboard type
- Helper text: "We'll send you a verification link"
- Continue button (disabled until valid email format)
- Validation: RFC 5322 compliant email format
- On submit: POST `/api/auth/send-email-verification`
- Backend sends verification email via Postmark

**STEP 3: Email Verification Waiting**
- Screen title: "Check your email"
- Body: "We sent a verification link to {email}. Tap the link to continue."
- Polling: Check verification status every 3 seconds via `/api/auth/check-email-verification-status`
- Resend link: "Didn't receive it? Resend" (60-second cooldown)
- Edit link: "Wrong email? Go back"
- On verification complete: Returns `session_token`, auto-advances to PIN creation

**STEP 4: Create PIN**
- Screen title: "Create a 4-digit PIN"
- Subheadline: "You'll use this to log in"
- 4 input boxes (56pt x 56pt each, 12pt gap between)
- Digits obscured as dots immediately on entry
- Auto-advances to next box on digit entry
- After 4 digits: Auto-navigates to Confirm PIN

**STEP 5: Confirm PIN**
- Screen title: "Confirm your PIN"
- Same 4-box layout
- Validation: Must match previous entry exactly
- On mismatch: Error shake animation, "PINs don't match. Try again.", clears both
- On match: POST `/api/auth/create-account` with email, hashed PIN, session_token
- Returns: `access_token` (JWT, 90-day expiry)
- Token stored in encrypted storage

**STEP 6: Font Size Selection**
- Screen title: "Choose your text size"
- Live preview paragraph that updates in real-time
- 3 radio button options (60pt touch targets each):
  - Standard (16pt base) - Default for Contacts
  - Large (20pt base, 1.25x multiplier)
  - Extra Large (24pt base, 1.5x multiplier)
- Sample "I'm OK" button below preview (also scales)
- Continue button (always enabled, Standard selected by default)

**STEP 7: Trial Welcome Modal**
- Full-screen modal (cannot dismiss without tapping button)
- Animated green checkmark icon (scales in)
- Headline: "Your 30-day free trial starts now!"
- Bullet points:
  - "✓ Monitor unlimited loved ones"
  - "✓ Get instant alerts if they miss check-ins"
  - "✓ No credit card required during trial"
  - "✓ $3.99/month after trial • Cancel anytime"
- Primary CTA: "Add Your First Member"
- VoiceOver: "Trial started. Tap Add Your First Member to invite someone."

**STEP 8: Add First Member**
- Screen title: "Who would you like to check on daily?"
- Two options:
  - "Choose from Contacts" - Requests iOS/Android contacts permission, opens native picker
  - "Enter Manually" - Form with Name and Email fields
- Form validation: Name 2-255 chars, valid email format
- On submit: POST `/api/members/invite`
- Backend generates 6-character invite code, sends email via Postmark
- Email template includes app download link + invite code
- Navigation: Invite Sent confirmation → Contact Dashboard

### 5.2 Member Onboarding Flow (8 Steps)

**STEPS 1-6:** Identical to Contact flow, except:
- Font size defaults to "Large" (not Standard)
- No trial welcome modal shown

**STEP 7: Member Welcome**
- Screen title: "Welcome to Pruuf!"
- Body text: "{ContactName} invited you to Pruuf. They'll receive a daily notification when you check in, so they know you're okay."
- Info box with icon: "Your job is simple: 1. Tap 'I'm OK' once a day. 2. That's it!"
- Continue button

**STEP 8: Enter Invite Code**
- Screen title: "Enter your invite code"
- Subheadline: "{ContactName} sent this in your email"
- 6 input boxes for alphanumeric code (auto-uppercase)
- Paste support (auto-fills all 6 boxes)
- Continue button (enabled after 6 characters)
- On submit: POST `/api/members/accept-invite` with invite_code
- Validation: Code must exist, status must be 'pending', email must match
- On success: Creates relationship, sets `is_member = true`, `grandfathered_free = true`
- Sends push notification to Contact: "{MemberName} joined Pruuf!"
- Navigation: Set Check-in Time screen

**STEP 9: Set Check-in Time**
- Screen title: "When should we remind your family you're okay?"
- Time picker with Hour (1-12), Minute (00-59, 5-min increments), AM/PM wheels
- Default: 10:00 AM
- Helper text: "Pick a time that fits your daily routine"
- Checkbox (60pt): "Send me a reminder before my check-in" (checked by default)
- If checked, shows dropdown: "How long before?" → 15 min, 30 min, 60 min (default)
- Timezone auto-detected from device
- Continue button
- On submit: POST `/api/members/complete-onboarding`
- Navigation: Member Dashboard

### 5.3 Daily Check-in Flow (Member Perspective)

**Member Dashboard Layout:**
```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │ DEADLINE BANNER (blue gradient)    │ │
│ │ "Next check-in: Today at 10:00 AM" │ │
│ │ "in 2 hours 34 minutes"            │ │
│ │ [PST timezone badge]               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │           ┌──────────────┐         │ │
│ │           │              │         │ │
│ │           │    I'M OK    │         │ │ ← 120pt height
│ │           │              │         │ │ ← 90% screen width
│ │           │  Tap to      │         │ │ ← Breathing animation
│ │           │  check in    │         │ │
│ │           └──────────────┘         │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ YOUR CONTACTS                      │ │
│ │ ┌──────────────────────────────┐   │ │
│ │ │ Jennifer      Active      🟢 │   │ │
│ │ │ [Call]  [Text]               │   │ │
│ │ └──────────────────────────────┘   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ──────────────────────────────────── │
│ [Dashboard]  [Contacts]  [Settings]    │ ← Tab bar
└────────────────────────────────────────┘
```

**"I'm OK" Button Specifications:**
- Dimensions: 90% screen width × 120pt height
- Background: Primary green (#4CAF50)
- Text: "I'm OK" in 32pt bold white, "Tap to check in" in 14pt white below
- Border radius: 16pt
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
- Animation: Breathing effect (scale 1.0 → 1.02 → 1.0, 3-second loop, ease-in-out)
- Haptic: Medium impact on tap
- State changes:
  - Default: Breathing animation active
  - Pressed: Scale 0.98, darker green
  - Loading: Spinner, text "Checking in..."
  - Success: Checkmark icon, text "Checked In!" (holds 2 seconds)
  - Already checked in today: Gray background, text "Already Checked In ✓"

**Check-in API Flow:**
1. User taps "I'm OK" button
2. Button shows loading state
3. Redux dispatches `performCheckIn(memberId)` async thunk
4. POST to `/api/members/{memberId}/check-in` with `{ timezone: "America/Los_Angeles" }`
5. Backend:
   - Checks if check-in already exists for today (same calendar day in member's timezone)
   - If exists: Updates timestamp (allows re-check-in)
   - If not exists: Creates new check-in record
   - Determines status: 'on_time' (before deadline) or 'late' (after deadline)
   - Gets all active Contacts for this Member
   - Sends push notification to each Contact (if account active/not frozen)
   - If late: Also sends email notification
   - Cancels any scheduled missed check-in alert for today
6. Response: `{ success: true, check_in: {...}, status: 'on_time', notifications_sent: 2 }`
7. UI shows success alert: "Great job! Your contacts have been notified."
8. Button changes to "Already Checked In" state

### 5.4 Missed Check-in Flow

**10:00 AM (Deadline Time):**
- Cron job runs every minute checking all Members
- Finds Members whose deadline has passed without check-in
- For each missed Member:
  - Creates `missed_check_in_alerts` record (constraint: one per day)
  - Gets all active Contacts (account_status not 'frozen' or 'canceled')
  - Sends push notification (HIGH priority): "{MemberName} missed check-in - No check-in by 10:00 AM PST"
  - Sends email via Postmark with call-to-action button

**Contact Receives Alert:**
- Push notification appears (even with app closed)
- Tapping notification opens app to Member detail screen
- Member card shows red status: "Missed Check-in"
- Call/Text buttons prominent for immediate contact

**10:15 AM (Late Check-in):**
- Member finally opens app, taps "I'm OK"
- Check-in recorded with status 'late'
- Update push notification sent to Contacts: "Update: {MemberName} checked in at 10:15 AM (15 min late). All is well!"
- Email sent with update

---

## PART VI: DATABASE SCHEMA & DATA MODELS

### 6.1 Core Tables

**USERS TABLE**
```sql
CREATE TABLE users (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,

  -- Email verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_code VARCHAR(10),
  email_verification_expires_at TIMESTAMP WITH TIME ZONE,
  email_verified_at TIMESTAMP WITH TIME ZONE,

  -- Authentication
  pin_hash VARCHAR(255) NOT NULL,  -- bcrypt hash, cost factor 10
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,

  -- Account status
  account_status VARCHAR(20) NOT NULL DEFAULT 'trial',
    -- Values: 'trial', 'active', 'active_free', 'past_due', 'frozen', 'canceled', 'deleted'

  -- Role flags
  is_member BOOLEAN DEFAULT FALSE,        -- TRUE if anyone monitors this user
  grandfathered_free BOOLEAN DEFAULT FALSE, -- TRUE if was ever a Member

  -- Preferences
  font_size_preference VARCHAR(20) DEFAULT 'standard',
    -- Values: 'standard', 'large', 'extra_large'

  -- Trial tracking
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,

  -- RevenueCat integration
  RevenueCat_customer_id VARCHAR(255),
  RevenueCat_subscription_id VARCHAR(255),
  last_payment_date TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_RevenueCat_customer ON users(RevenueCat_customer_id);
CREATE INDEX idx_users_trial_end ON users(trial_end_date) WHERE account_status = 'trial';
```

**MEMBERS TABLE**
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Display name (how Contacts refer to them)
  name VARCHAR(255) NOT NULL,

  -- Check-in schedule
  check_in_time TIME,                    -- Local time: 10:00:00
  timezone VARCHAR(50),                  -- IANA: "America/Los_Angeles"

  -- Reminder settings
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_minutes_before INT DEFAULT 60,  -- 15, 30, or 60 minutes

  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_check_in_time ON members(check_in_time);
```

**MEMBER_CONTACT_RELATIONSHIPS TABLE**
```sql
CREATE TABLE member_contact_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship parties
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Invitation
  invite_code VARCHAR(10) UNIQUE NOT NULL,  -- 6 alphanumeric: "AB3X7M"
  status VARCHAR(20) DEFAULT 'pending',
    -- Values: 'pending', 'active', 'removed'

  -- Timestamps
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,       -- When Member accepted
  last_invite_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate relationships
  CONSTRAINT unique_active_relationship UNIQUE(member_id, contact_id)
);

CREATE INDEX idx_relationships_member ON member_contact_relationships(member_id);
CREATE INDEX idx_relationships_contact ON member_contact_relationships(contact_id);
CREATE INDEX idx_relationships_status ON member_contact_relationships(status);
CREATE INDEX idx_relationships_invite_code ON member_contact_relationships(invite_code);
```

**CHECK_INS TABLE**
```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Check-in data
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timezone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'on_time',  -- 'on_time', 'late'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkins_member ON check_ins(member_id);
CREATE INDEX idx_checkins_date ON check_ins(checked_in_at DESC);
CREATE INDEX idx_checkins_member_date ON check_ins(member_id, checked_in_at DESC);

-- Prevent duplicate check-ins same day
CREATE UNIQUE INDEX idx_checkins_member_day
ON check_ins(member_id, DATE(checked_in_at AT TIME ZONE timezone));
```

**MISSED_CHECK_IN_ALERTS TABLE**
```sql
CREATE TABLE missed_check_in_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Alert data
  alert_type VARCHAR(50),  -- 'missed_deadline', 'late_checkin_update'
  contacts_notified INT DEFAULT 0,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_member ON missed_check_in_alerts(member_id);
CREATE INDEX idx_alerts_sent_at ON missed_check_in_alerts(sent_at);

-- Prevent duplicate alerts same day
CREATE UNIQUE INDEX idx_alerts_member_day
ON missed_check_in_alerts(member_id, DATE(sent_at));
```

**PUSH_NOTIFICATION_TOKENS TABLE**
```sql
CREATE TABLE push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token data
  token TEXT NOT NULL,
  platform VARCHAR(10),  -- 'ios' or 'android'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);
CREATE UNIQUE INDEX idx_push_tokens_unique ON push_notification_tokens(user_id, token);
```

**APP_NOTIFICATIONS TABLE (In-App Notification Center)**
```sql
CREATE TABLE app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50),  -- 'trial_reminder', 'payment_failed', 'member_connected', etc.

  -- State
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),  -- Deep link: '/settings/payment'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_app_notif_user ON app_notifications(user_id);
CREATE INDEX idx_app_notif_unread ON app_notifications(user_id, read) WHERE read = FALSE;
```

### 6.2 Key Database Functions

**Generate Unique Invite Code:**
```sql
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- No O/0/I/1 confusion
  code VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Check uniqueness (extremely rare collision)
  IF EXISTS (SELECT 1 FROM member_contact_relationships WHERE invite_code = code) THEN
    RETURN generate_invite_code();  -- Recursive retry
  END IF;

  RETURN code;
END;
$$ LANGUAGE plpgsql;
```

**Enforce 10-Contact Limit Per Member:**
```sql
CREATE OR REPLACE FUNCTION check_member_contact_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM member_contact_relationships
      WHERE member_id = NEW.member_id AND status = 'active') >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 contacts per member';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_contact_limit
BEFORE INSERT ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION check_member_contact_limit();
```

**Update is_member Flag on Relationship Change:**
```sql
CREATE OR REPLACE FUNCTION update_is_member_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When relationship becomes active, set user as Member
  IF NEW.status = 'active' THEN
    UPDATE users SET
      is_member = TRUE,
      grandfathered_free = TRUE
    WHERE id = NEW.member_id;
  END IF;

  -- When relationship removed, check if still a Member
  IF NEW.status = 'removed' OR TG_OP = 'DELETE' THEN
    UPDATE users SET is_member = FALSE
    WHERE id = NEW.member_id
    AND NOT EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = NEW.member_id
      AND status = 'active'
      AND id != NEW.id
    );
    -- Note: grandfathered_free remains TRUE (never revoked)
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_is_member
AFTER INSERT OR UPDATE OR DELETE ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION update_is_member_status();
```

### 6.3 Row Level Security Policies

```sql
-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own record
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Members can see their Member data
CREATE POLICY members_select_own ON members
  FOR SELECT USING (auth.uid() = user_id);

-- Contacts can see Members they're connected to
CREATE POLICY members_select_contacts ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = members.user_id
      AND contact_id = auth.uid()
      AND status = 'active'
    )
  );

-- Users can see relationships where they're Member or Contact
CREATE POLICY relationships_select ON member_contact_relationships
  FOR SELECT USING (
    auth.uid() = member_id OR auth.uid() = contact_id
  );

-- Members can see their own check-ins
CREATE POLICY checkins_select_own ON check_ins
  FOR SELECT USING (auth.uid() = member_id);

-- Contacts can see check-ins of Members they monitor
CREATE POLICY checkins_select_contacts ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = check_ins.member_id
      AND contact_id = auth.uid()
      AND status = 'active'
    )
  );
```

---

## PART VII: API ENDPOINTS & BACKEND SERVICES

### 7.1 Authentication Endpoints

**POST /api/auth/send-email-verification**
```typescript
// Request
{ email: "user@example.com" }

// Backend Process
1. Validate email format
2. Check if email already registered → error if exists
3. Generate 6-character verification token
4. Store token with 24-hour expiry
5. Send email via Postmark with verification link

// Response
{ success: true, message: "Verification email sent" }
```

**POST /api/auth/check-email-verification-status**
```typescript
// Request (polled every 3 seconds)
{ email: "user@example.com" }

// Response (not verified)
{ success: true, verified: false }

// Response (verified)
{ success: true, verified: true, session_token: "jwt..." }
```

**POST /api/auth/verify-email-token**
```typescript
// Called when user clicks link in email
// Request (from URL query param)
{ token: "ABC123" }

// Backend Process
1. Find token in database
2. Check not expired (24-hour window)
3. Mark email as verified
4. Generate session token

// Response
{ success: true, session_token: "jwt...", email: "user@example.com" }
```

**POST /api/auth/create-account**
```typescript
// Request
{
  email: "user@example.com",
  pin: "1234",
  pin_confirmation: "1234",
  session_token: "jwt_from_verification"
}

// Backend Process
1. Validate session token matches email
2. Validate PINs match
3. Hash PIN with bcrypt (cost factor 10)
4. Create user record with trial_start_date = NOW()
5. Generate access token (JWT, 90-day expiry)

// Response
{
  success: true,
  user: {
    id: "uuid",
    email: "user@example.com",
    account_status: "trial",
    trial_end_date: "2026-01-10T00:00:00Z",
    is_member: false,
    font_size_preference: "standard"
  },
  access_token: "jwt_access_token"
}
```

**POST /api/auth/login**
```typescript
// Request
{ email: "user@example.com", pin: "1234" }

// Backend Process
1. Find user by email
2. Check not locked (failed_login_attempts >= 5)
3. Compare PIN with bcrypt
4. If match: Reset failed attempts, generate token
5. If no match: Increment failed attempts, check lockout

// Response (success)
{
  success: true,
  user: { id, email, account_status, is_member, ... },
  access_token: "jwt..."
}

// Response (incorrect PIN)
{ success: false, error: "INCORRECT_PIN", attempts_remaining: 3 }

// Response (locked)
{ success: false, error: "ACCOUNT_LOCKED", locked_until: "2025-12-10T10:05:00Z" }
```

**POST /api/auth/refresh-token**
```typescript
// Request
{ refresh_token: "jwt_refresh_token" }

// Response
{ access_token: "new_jwt...", refresh_token: "new_refresh_jwt..." }
```

### 7.2 Member Endpoints

**POST /api/members/invite**
```typescript
// Request (authenticated Contact)
{
  member_name: "Mom",
  member_email: "mom@example.com"
}

// Backend Process
1. Verify Contact account is active (not frozen)
2. Generate unique 6-character invite code
3. Create/update member record if email exists
4. Create relationship with status 'pending'
5. Send invite email via Postmark

// Response
{
  success: true,
  member: {
    id: "uuid",
    name: "Mom",
    email: "mom@example.com",
    status: "pending",
    invite_code: "AB3X7M",
    invited_at: "2025-12-10T10:00:00Z"
  }
}
```

**POST /api/members/accept-invite**
```typescript
// Request (authenticated new Member)
{ invite_code: "AB3X7M" }

// Backend Process
1. Find relationship by invite code
2. Verify status is 'pending'
3. Verify authenticated user's email matches member's email
4. Update relationship status to 'active'
5. Set connected_at timestamp
6. Update user: is_member = true, grandfathered_free = true
7. Send push notification to Contact

// Response
{
  success: true,
  relationship: {
    contact: { id: "uuid", name: "Jennifer" },
    connected_at: "2025-12-10T10:05:00Z"
  },
  message: "You're now connected to Jennifer!",
  grandfathered_free: true
}
```

**POST /api/members/{memberId}/check-in**
```typescript
// Request (authenticated Member)
{ timezone: "America/Los_Angeles" }

// Backend Process
1. Verify authenticated user owns memberId
2. Get member's check_in_time and timezone
3. Determine if check-in is on_time or late
4. Check for existing check-in today
   - If exists: Update timestamp
   - If not: Create new record
5. Get all active Contacts (account not frozen)
6. Send push notification to each Contact
7. If late: Also send email
8. Cancel scheduled missed check-in alert

// Response
{
  success: true,
  check_in: {
    id: "uuid",
    checked_in_at: "2025-12-10T09:45:00Z",
    timezone: "America/Los_Angeles",
    local_time: "9:45 AM PST"
  },
  status: "on_time",  // or "late"
  notifications_sent: 2
}
```

**PATCH /api/members/{memberId}/check-in-time**
```typescript
// Request
{
  check_in_time: "14:00",
  timezone: "America/New_York"
}

// Backend Process
1. Update member record
2. Notify all active Contacts via push notification
3. Reschedule local reminder notification if enabled

// Response
{
  success: true,
  member: {
    check_in_time: "14:00",
    timezone: "America/New_York",
    formatted_time: "2:00 PM EST"
  },
  notifications_sent: 2
}
```

**GET /api/members/{memberId}/contacts**
```typescript
// Response
{
  success: true,
  contacts: [
    {
      id: "relationship_uuid",
      contact: {
        id: "contact_uuid",
        name: "Jennifer",
        email: "j***@example.com"  // Masked
      },
      status: "active",
      connected_at: "2025-12-05T10:00:00Z"
    }
  ],
  total_active: 1,
  total_pending: 0
}
```

### 7.3 Contact Endpoints

**GET /api/contacts/me/members**
```typescript
// Response
{
  success: true,
  members: [
    {
      id: "member_uuid",
      name: "Mom",
      status: "active",
      check_in_time: "10:00",
      timezone: "America/Los_Angeles",
      formatted_time: "10:00 AM PST",
      last_check_in: {
        checked_in_at: "2025-12-10T09:45:00Z",
        local_time: "9:45 AM PST",
        status: "on_time"
      },
      next_deadline: "2025-12-11T18:00:00Z",  // UTC
      connected_at: "2025-12-01T10:00:00Z"
    }
  ],
  total_active: 1,
  total_pending: 0,
  account_status: "trial"
}
```

**POST /api/contacts/resend-invite**
```typescript
// Request
{ relationship_id: "uuid" }

// Backend Process
1. Verify relationship belongs to authenticated Contact
2. Check rate limit (60-second cooldown)
3. Send invite email again via Postmark
4. Update last_invite_sent_at

// Response
{ success: true, message: "Invite resent to Mom" }
```

**DELETE /api/contacts/relationship/{relationshipId}**
```typescript
// Backend Process
1. Verify relationship belongs to authenticated Contact
2. Update status to 'removed', set removed_at
3. Check if Member has other active Contacts
4. If no other Contacts: Update user.is_member = false

// Response
{ success: true, message: "No longer monitoring Mom" }
```

### 7.4 Payment Endpoints

**POST /api/payments/create-subscription**
```typescript
// Request
{ payment_method_id: "pm_RevenueCat_xxxxx" }

// Backend Process
1. Check if user requires payment (not Member/grandfathered)
2. Create RevenueCat Customer if doesn't exist
3. Attach payment method
4. Create Subscription with $3.99/month (or $29/year) price
5. If in trial: Set trial_end to existing trial_end_date
6. Save RevenueCat_customer_id, RevenueCat_subscription_id
7. Update account_status to 'active'

// Response
{
  success: true,
  subscription: {
    id: "sub_xxxxx",
    status: "active",
    current_period_end: "2026-01-10T00:00:00Z",
    price: "$3.99/month"
  },
  account_status: "active"
}
```

**POST /api/payments/cancel-subscription**
```typescript
// Backend Process
1. Set RevenueCat subscription cancel_at_period_end = true
2. User retains access until current_period_end
3. Update account_status to 'canceled'

// Response
{
  success: true,
  message: "Subscription canceled. Access until Jan 10, 2026.",
  access_until: "2026-01-10T00:00:00Z"
}
```

### 7.5 Push Notification Endpoints

**POST /api/push-notifications/register-token**
```typescript
// Request
{
  token: "fcm_token_string",
  platform: "ios"  // or "android"
}

// Backend Process
1. Delete any existing token for this user
2. Insert new token record

// Response
{ success: true }
```

---

## PART VIII: FRONTEND ARCHITECTURE

### 8.1 Technology Stack

```json
{
  "react-native": "0.74.0",
  "react": "18.2.0",
  "typescript": "5.x",
  "@react-navigation/native": "6.x",
  "@react-navigation/native-stack": "6.x",
  "@react-navigation/bottom-tabs": "6.x",
  "@reduxjs/toolkit": "2.10.1",
  "react-redux": "9.x",
  "@RevenueCat/RevenueCat-react-native": "0.35.x",
  "@react-native-firebase/app": "18.x",
  "@react-native-firebase/messaging": "18.x",
  "@supabase/supabase-js": "2.x",
  "react-native-encrypted-storage": "4.x",
  "moment-timezone": "0.5.x",
  "react-native-push-notification": "8.x"
}
```

### 8.2 Navigation Structure

**Root Navigator (Conditional):**
```typescript
function RootNavigator() {
  const { isLoggedIn, isInitialized, user } = useSelector(state => state.auth);

  if (!isInitialized) {
    return <SplashScreen />;
  }

  if (!isLoggedIn) {
    return <AuthStack />;
  }

  // Determine which onboarding is needed
  if (user?.is_member && !user?.onboarding_completed) {
    return <MemberOnboardingStack />;
  }

  if (!user?.is_member && user?.account_status === 'trial' && !user?.has_invited_member) {
    return <ContactOnboardingStack />;
  }

  return <MainTabNavigator />;
}
```

**Auth Stack:**
```
WelcomeScreen
└── EmailEntryScreen
    └── EmailVerificationScreen
        └── CreatePinScreen
            └── ConfirmPinScreen
                └── FontSizeScreen
```

**Contact Onboarding Stack:**
```
TrialWelcomeScreen
└── AddMemberScreen (manual or contacts picker)
    └── InviteSentScreen
        └── MainTabNavigator
```

**Member Onboarding Stack:**
```
MemberWelcomeScreen
└── EnterInviteCodeScreen
    └── SetCheckInTimeScreen
        └── MainTabNavigator
```

**Main Tab Navigator:**
```
[Member Role]                    [Contact Role]
├── Dashboard (MemberDashboard)  ├── Members (ContactDashboard)
├── Contacts (MemberContacts)    └── Settings (ContactSettings)
└── Settings (MemberSettings)

Shared Modal Screens:
├── MemberDetailScreen
├── ContactDetailScreen
├── CheckInHistoryScreen
├── PaymentMethodScreen
├── NotificationSettingsScreen
└── ConfirmDialog (overlay)
```

### 8.3 Screen Inventory (30+ Screens)

**Authentication Screens (6):**
1. WelcomeScreen - App entry point with Get Started CTA
2. EmailEntryScreen - Email input with validation
3. EmailVerificationScreen - Polling for verification status
4. CreatePinScreen - 4-digit PIN entry
5. ConfirmPinScreen - PIN confirmation
6. FontSizeScreen - Accessibility preference selection

**Onboarding Screens (6):**
7. TrialWelcomeScreen - Trial start celebration modal
8. AddMemberScreen - Invite Member form (Contact flow)
9. InviteSentScreen - Confirmation after sending invite
10. MemberWelcomeScreen - Welcome message for new Members
11. EnterInviteCodeScreen - 6-character code input
12. SetCheckInTimeScreen - Time picker with reminder toggle

**Member Screens (4):**
13. MemberDashboard - Giant "I'm OK" button, deadline banner
14. MemberContacts - List of Contacts monitoring this Member
15. MemberSettings - Check-in time, reminders, font size, account
16. AddContactScreen - Member inviting additional Contacts

**Contact Screens (3):**
17. ContactDashboard - Member cards with status indicators
18. ContactSettings - Payment, notification preferences, account
19. MemberDetailScreen - Detailed view of one Member

**Shared Screens (6):**
20. CheckInHistoryScreen - Calendar view of past check-ins
21. PaymentMethodScreen - RevenueCat card input
22. NotificationSettingsScreen - Push/email preferences
23. ContactDetailScreen - View single Contact details
24. PrivacyPolicyScreen - WebView of privacy policy
25. TermsScreen - WebView of terms of service

**Overlay/Modal Screens (3):**
26. ConfirmDialog - Destructive action confirmation
27. LoadingOverlay - Full-screen loading state
28. OfflineIndicator - Connection status banner

---

## PART IX: STATE MANAGEMENT (REDUX)

### 9.1 Store Configuration

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import memberReducer from './slices/memberSlice';
import settingsReducer from './slices/settingsSlice';
import paymentReducer from './slices/paymentSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    member: memberReducer,
    settings: settingsReducer,
    payment: paymentReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 9.2 Auth Slice

```typescript
interface AuthState {
  isLoggedIn: boolean;
  isInitialized: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  isInitialized: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const token = await EncryptedStorage.getItem('access_token');
  if (token) {
    const user = await api.get('/api/users/me');
    return { user, token };
  }
  return null;
});

export const login = createAsyncThunk('auth/login', async ({ email, pin }) => {
  const response = await api.post('/api/auth/login', { email, pin });
  await EncryptedStorage.setItem('access_token', response.access_token);
  return response;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await EncryptedStorage.removeItem('access_token');
  await EncryptedStorage.removeItem('refresh_token');
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    updateUser: (state, action) => { state.user = { ...state.user, ...action.payload }; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => { state.isLoading = true; })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.isLoading = false;
        if (action.payload) {
          state.isLoggedIn = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.token;
        }
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoggedIn = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});
```

### 9.3 Member Slice

```typescript
interface MemberState {
  // For Contact users: Members they monitor
  members: Member[];

  // For Member users: Contacts who monitor them
  contacts: Contact[];

  // Check-in history
  checkIns: CheckIn[];

  // UI state
  selectedMember: Member | null;
  isLoading: boolean;
  error: string | null;
}

// Key Async Thunks
export const fetchMembers = createAsyncThunk('member/fetchMembers', async () => {
  const response = await api.get('/api/contacts/me/members');
  return response.members;
});

export const performCheckIn = createAsyncThunk(
  'member/performCheckIn',
  async (memberId: string, { getState }) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await api.post(`/api/members/${memberId}/check-in`, { timezone });
    return response;
  }
);

export const inviteMember = createAsyncThunk(
  'member/inviteMember',
  async ({ name, email }: { name: string; email: string }) => {
    const response = await api.post('/api/members/invite', {
      member_name: name,
      member_email: email,
    });
    return response.member;
  }
);
```

### 9.4 Settings Slice

```typescript
interface SettingsState {
  fontSize: 'standard' | 'large' | 'extraLarge';
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  remindersEnabled: boolean;
  reminderMinutesBefore: 15 | 30 | 60;
  timezone: string;
}

const initialState: SettingsState = {
  fontSize: 'standard',
  notificationsEnabled: true,
  emailNotificationsEnabled: true,
  remindersEnabled: true,
  reminderMinutesBefore: 60,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};
```

### 9.5 Payment Slice

```typescript
interface PaymentState {
  paymentMethods: PaymentMethod[];
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

// Key Async Thunks
export const createSubscription = createAsyncThunk(
  'payment/createSubscription',
  async (paymentMethodId: string) => {
    const response = await api.post('/api/payments/create-subscription', {
      payment_method_id: paymentMethodId,
    });
    return response;
  }
);

export const cancelSubscription = createAsyncThunk(
  'payment/cancelSubscription',
  async () => {
    const response = await api.post('/api/payments/cancel-subscription');
    return response;
  }
);
```

### 9.6 Notification Slice

```typescript
interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
  fcmToken: string | null;
  permissionStatus: 'granted' | 'denied' | 'not_determined';
}

// Key Async Thunks
export const registerFCMToken = createAsyncThunk(
  'notification/registerToken',
  async (token: string) => {
    const platform = Platform.OS;
    await api.post('/api/push-notifications/register-token', { token, platform });
    return token;
  }
);

export const fetchNotifications = createAsyncThunk(
  'notification/fetch',
  async () => {
    const response = await api.get('/api/notifications');
    return response.notifications;
  }
);
```

---

## PART X: DESIGN SYSTEM & COMPONENT LIBRARY

### 10.1 Color Palette

```typescript
// src/theme/colors.ts
export const colors = {
  // Primary (Green - Safety, Reassurance)
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',

  // Accent (Blue - Trust, Reliability)
  accent: '#2196F3',
  accentDark: '#1976D2',
  accentLight: '#BBDEFB',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutrals
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textInverse: '#FFFFFF',

  // Backgrounds
  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  surface: '#FFFFFF',

  // Borders
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  divider: '#E0E0E0',

  // Status Indicators
  statusActive: '#4CAF50',
  statusPending: '#FF9800',
  statusInactive: '#9E9E9E',
  statusMissed: '#F44336',
};
```

### 10.2 Typography System

```typescript
// src/theme/typography.ts
export const typography = {
  // Headings
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 26 },

  // Body
  bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },

  // UI Elements
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
  buttonLarge: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  // Special
  checkInButton: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
};

// Font size multipliers for accessibility
export const fontSizeMultipliers = {
  standard: 1.0,
  large: 1.25,
  extraLarge: 1.5,
};

// Helper function
export function scaledFontSize(baseSize: number, preference: string): number {
  return baseSize * fontSizeMultipliers[preference];
}
```

### 10.3 Spacing System

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const touchTargets = {
  minimum: 44,    // Apple's minimum
  standard: 60,   // Our standard (36% larger)
  large: 80,      // For critical actions
  checkInButton: 120,  // The "I'm OK" button
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

### 10.4 Component Library

**Button Component:**
```typescript
// src/components/common/Button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  testID?: string;
}

// Size mappings
const sizeStyles = {
  small: { height: 40, paddingHorizontal: 16, fontSize: 14 },
  medium: { height: 50, paddingHorizontal: 20, fontSize: 16 },
  large: { height: 60, paddingHorizontal: 24, fontSize: 18 },
  xlarge: { height: 80, paddingHorizontal: 32, fontSize: 20 },
};

// Variant mappings
const variantStyles = {
  primary: {
    background: colors.primary,
    text: colors.textInverse,
    border: colors.primary
  },
  secondary: {
    background: colors.accentLight,
    text: colors.accent,
    border: colors.accentLight
  },
  outline: {
    background: 'transparent',
    text: colors.primary,
    border: colors.primary
  },
  danger: {
    background: colors.error,
    text: colors.textInverse,
    border: colors.error
  },
  ghost: {
    background: 'transparent',
    text: colors.primary,
    border: 'transparent'
  },
};

// Accessibility
accessible={true}
accessibilityRole="button"
accessibilityLabel={title}
accessibilityState={{ disabled: disabled || loading }}
accessibilityHint={hint}
```

**CodeInput Component (PIN/Invite Code):**
```typescript
// src/components/common/CodeInput.tsx
interface CodeInputProps {
  length: 4 | 6;  // 4 for PIN, 6 for invite code
  value: string;
  onChangeText: (value: string) => void;
  onComplete?: (value: string) => void;
  secure?: boolean;  // Show dots instead of digits
  error?: string;
  autoFocus?: boolean;
  testID?: string;
}

// Individual box: 56pt × 56pt with 12pt gap
// Auto-advance to next box on digit entry
// Backspace returns to previous box
// Paste support (fills all boxes)
// Error state: Red border + shake animation
```

**Card Component:**
```typescript
// src/components/common/Card.tsx
interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

// Variants
const variantStyles = {
  elevated: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.backgroundGray,
  },
};
```

**MemberCard Component:**
```typescript
// src/components/MemberCard.tsx
interface MemberCardProps {
  member: Member;
  onPress: () => void;
  onCallPress: () => void;
  onTextPress: () => void;
}

// Layout:
// ┌─────────────────────────────────────────┐
// │ [Avatar]  Name                    [●]   │
// │           Status Badge                   │
// │           Last check-in: Today 9:45 AM  │
// │           Deadline: 10:00 AM PST        │
// │           [Call]  [Text]                 │
// └─────────────────────────────────────────┘

// Status indicator colors:
// - Green dot + "Checked In" for checked_in_today
// - Yellow dot + "Pending" for pending invite
// - Orange dot + countdown for approaching deadline
// - Red dot + "Missed" for missed deadline
```

**CheckInButton Component:**
```typescript
// src/components/CheckInButton.tsx
interface CheckInButtonProps {
  onPress: () => void;
  isLoading: boolean;
  isCheckedIn: boolean;
  disabled: boolean;
}

// Dimensions: 90% screen width × 120pt height
// States:
// - default: Green background, breathing animation (scale 1.0→1.02→1.0)
// - loading: Spinner, "Checking in..."
// - success: Checkmark, "Checked In!" (2-second display)
// - already_checked_in: Gray background, "Already Checked In ✓"
// - disabled: Gray background, no animation

// Animation (breathing effect):
useEffect(() => {
  const animation = Animated.loop(
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.02, duration: 1500, easing: Easing.ease }),
      Animated.timing(scale, { toValue: 1.0, duration: 1500, easing: Easing.ease }),
    ])
  );
  animation.start();
  return () => animation.stop();
}, []);
```

---

## PART XI: NOTIFICATION SYSTEM

### 11.1 Notification Priority Levels

| Priority | Channels | Use Cases | Behavior |
|----------|----------|-----------|----------|
| CRITICAL | Push + Email | Missed check-in, payment failed, account frozen | Always delivered, ignores quiet hours |
| HIGH | Push (+ Email fallback) | Check-in confirmation, late check-in, member connected | Normal delivery |
| NORMAL | Push only | Check-in reminder, trial reminder | Respects quiet hours |
| LOW | Push only (batched) | Weekly summary, announcements | Batched delivery |

### 11.2 Notification Types

```typescript
enum NotificationType {
  // CRITICAL Priority
  MISSED_CHECK_IN = 'missed_check_in',
  PAYMENT_FAILED = 'payment_failed',
  ACCOUNT_FROZEN = 'account_frozen',

  // HIGH Priority
  CHECK_IN_CONFIRMATION = 'check_in_confirmation',
  LATE_CHECK_IN = 'late_check_in',
  MEMBER_CONNECTED = 'member_connected',
  CONTACT_CONNECTED = 'contact_connected',

  // NORMAL Priority
  CHECK_IN_REMINDER = 'check_in_reminder',
  TRIAL_REMINDER_14_DAYS = 'trial_reminder_14_days', // 14 days before trial ends
  TRIAL_REMINDER_7_DAYS = 'trial_reminder_7_days',   // 7 days before trial ends
  TRIAL_REMINDER_1_DAY = 'trial_reminder_1_day',     // 1 day before trial ends
  INVITATION_SENT = 'invitation_sent',

  // LOW Priority
  WEEKLY_SUMMARY = 'weekly_summary',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
}
```

### 11.3 Push Notification Templates

**Missed Check-in (to Contacts):**
```
Title: "{MemberName} missed check-in"
Body: "No check-in received by {deadline} {timezone}. You may want to check on them."
Data: { type: 'missed_check_in', member_id: 'uuid' }
Priority: HIGH
Sound: default
Badge: +1
```

**Check-in Confirmation (to Contacts):**
```
Title: "{MemberName} checked in"
Body: "Checked in at {time} {timezone}. All is well!"
Data: { type: 'check_in_confirmation', member_id: 'uuid' }
Priority: NORMAL
Sound: default
```

**Late Check-in Update (to Contacts):**
```
Title: "Update: {MemberName} checked in late"
Body: "Checked in at {time} ({minutes} min late). All is well!"
Data: { type: 'late_check_in', member_id: 'uuid' }
Priority: HIGH
Sound: default
```

**Check-in Reminder (to Members):**
```
Title: "Time to check in!"
Body: "Your check-in time is in {minutes} minutes. Tap to let your family know you're okay."
Data: { type: 'check_in_reminder' }
Priority: NORMAL
Sound: default
```

### 11.4 Email Templates (Postmark)

**Email Verification:**
```
Subject: Verify your Pruuf account
From: Pruuf <noreply@pruuf.me>
Template: email-verification

Content:
"Welcome to Pruuf!

Click the link below to verify your email address:
[Verify Email Button → {verification_url}]

This link expires in 24 hours.

If you didn't create a Pruuf account, you can safely ignore this email."
```

**Member Invitation:**
```
Subject: {ContactName} invited you to Pruuf
From: Pruuf <noreply@pruuf.me>
Template: member-invitation

Content:
"{ContactName} invited you to Pruuf, a simple daily check-in app.

With Pruuf, you tap one button each day to let your family know you're okay.
If you forget, they'll get a notification to check on you.

Your invite code: {invite_code}

[Download Pruuf Button → {app_store_url}]

Once installed, enter your code to connect with {ContactName}."
```

**Missed Check-in Alert (CRITICAL):**
```
Subject: ⚠️ {MemberName} missed their check-in
From: Pruuf Alerts <alerts@pruuf.me>
Template: missed-checkin-alert

Content:
"{MemberName} hasn't checked in.

Deadline: {deadline} {timezone}
Last check-in: {last_check_in_date} at {last_check_in_time}

You may want to reach out to make sure they're okay.

[Call {MemberName} Button → tel:{member_phone}]

---
You're receiving this because you're monitoring {MemberName} on Pruuf."
```

### 11.5 Local Notifications (Member Reminders)

```typescript
// src/services/notificationService.ts

export async function scheduleCheckInReminder(
  checkInTime: string,
  timezone: string,
  minutesBefore: number
) {
  // Cancel existing reminder
  await PushNotification.cancelLocalNotifications({ id: 'check_in_reminder' });

  // Calculate reminder time
  const deadline = moment.tz(checkInTime, 'HH:mm', timezone);
  const reminderTime = deadline.subtract(minutesBefore, 'minutes');

  // Schedule daily repeating notification
  PushNotification.localNotificationSchedule({
    id: 'check_in_reminder',
    channelId: 'check-in-reminders',
    title: 'Time to check in!',
    message: `Your check-in time is in ${minutesBefore} minutes.`,
    date: reminderTime.toDate(),
    repeatType: 'day',
    allowWhileIdle: true,
    importance: 'high',
  });
}
```

---

## PART XII: EXTERNAL SERVICE INTEGRATIONS

### 12.1 Supabase Integration

**Configuration:**
```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

**Services Used:**
- **Database:** PostgreSQL with Row Level Security
- **Auth:** Custom JWT-based (not Supabase Auth)
- **Edge Functions:** For notification sending, cron jobs
- **Realtime:** Not used (polling instead for simplicity)

### 12.2 RevenueCat Integration

**Configuration:**
```typescript
// App.tsx
import { RevenueCatProvider } from '@RevenueCat/RevenueCat-react-native';

<RevenueCatProvider publishableKey={process.env.RevenueCat_PUBLISHABLE_KEY}>
  <App />
</RevenueCatProvider>
```

**Payment Flow:**
```typescript
// src/screens/PaymentMethodScreen.tsx
import { CardField, useRevenueCat } from '@RevenueCat/RevenueCat-react-native';

const { createPaymentMethod } = useRevenueCat();

const handleAddPayment = async () => {
  const { paymentMethod, error } = await createPaymentMethod({
    paymentMethodType: 'Card',
  });

  if (!error && paymentMethod) {
    // Send to backend
    const response = await api.post('/api/payments/create-subscription', {
      payment_method_id: paymentMethod.id,
    });

    if (response.success) {
      dispatch(updateSubscription(response.subscription));
      navigation.goBack();
    }
  }
};
```

**Webhook Events Handled:**
- `customer.subscription.created` - Update account_status to 'active'
- `customer.subscription.updated` - Handle status changes
- `customer.subscription.deleted` - Set account_status to 'frozen'
- `invoice.payment_succeeded` - Log successful payment
- `invoice.payment_failed` - Set account_status to 'past_due', send notification
- `customer.subscription.trial_will_end` - Send trial ending notification

### 12.3 Firebase Cloud Messaging (FCM)

**Configuration:**
```typescript
// src/services/notifications.ts
import messaging from '@react-native-firebase/messaging';

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
}

export async function getFCMToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(handler: (message: any) => void) {
  return messaging().onMessage(handler);
}

export function onBackgroundMessage(handler: (message: any) => void) {
  messaging().setBackgroundMessageHandler(handler);
}
```

**Backend Sending:**
```typescript
// Backend: sendPushNotification
import admin from 'firebase-admin';

export async function sendPushNotification(
  userId: string,
  notification: { title: string; body: string; data?: any; priority?: string }
) {
  const tokens = await getTokensForUser(userId);

  if (tokens.length === 0) return { success: false, reason: 'no_tokens' };

  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    tokens: tokens.map(t => t.token),
  };

  if (notification.priority === 'high') {
    message.android = { priority: 'high' };
    message.apns = { payload: { aps: { sound: 'default' } } };
  }

  const response = await admin.messaging().sendMulticast(message);
  return { success: true, successCount: response.successCount };
}
```

### 12.4 Postmark Email Integration

**Configuration:**
```typescript
// Backend: emailService.ts
import postmark from 'postmark';

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);

export async function sendTemplateEmail(
  to: string,
  templateAlias: string,
  templateModel: object
) {
  return client.sendEmailWithTemplate({
    From: 'Pruuf <noreply@pruuf.me>',
    To: to,
    TemplateAlias: templateAlias,
    TemplateModel: templateModel,
  });
}
```

**Templates:**
- `email-verification` - Account verification link
- `member-invitation` - Invite code for new Members
- `missed-checkin-alert` - CRITICAL alert to Contacts
- `late-checkin-update` - Update after late check-in
- `payment-failed` - Payment failure notification
- `trial-ending` - Trial expiration reminder

---

## PART XIII: SECURITY IMPLEMENTATION

### 13.1 Authentication Security

**PIN Storage:**
- 4-digit PIN (10,000 combinations)
- Hashed with bcrypt, cost factor 10
- Never stored in plain text, never logged
- Hash computed client-side, only hash sent to server

**Failed Attempt Lockout:**
```typescript
const LOCKOUT_RULES = {
  5: 5 * 60 * 1000,   // 5 attempts = 5 minute lockout
  10: 15 * 60 * 1000, // 10 attempts = 15 minute lockout
};

async function handleFailedLogin(userId: string) {
  const user = await db.query('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1 RETURNING *', [userId]);

  const attempts = user.failed_login_attempts;

  if (attempts >= 10) {
    await db.query('UPDATE users SET locked_until = $1 WHERE id = $2',
      [new Date(Date.now() + LOCKOUT_RULES[10]), userId]);
  } else if (attempts >= 5) {
    await db.query('UPDATE users SET locked_until = $1 WHERE id = $2',
      [new Date(Date.now() + LOCKOUT_RULES[5]), userId]);
  }
}
```

**JWT Tokens:**
- Access token: 90-day expiry (long-lived for mobile convenience)
- Refresh token: 1-year expiry
- Stored in react-native-encrypted-storage (AES-256)
- Token refresh on 401 response with request queue

### 13.2 API Security

**HTTPS Enforcement:**
```typescript
// src/services/api.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.pruuf.me';

// Throw error if production URL is HTTP
if (!__DEV__ && !API_BASE_URL.startsWith('https://')) {
  throw new Error('Production API must use HTTPS');
}
```

**Request Interceptor:**
```typescript
api.interceptors.request.use(async (config) => {
  const token = await EncryptedStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Token Refresh Interceptor:**
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 13.3 Data Protection

**Email Masking in UI:**
```typescript
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.charAt(0) + '***';
  return `${masked}@${domain}`;
}
// "jennifer@example.com" → "j***@example.com"
```

**Soft Delete:**
- All account deletions are soft delete first (deleted_at timestamp)
- 30-day retention period for data recovery
- Hard delete via scheduled job after 30 days
- RevenueCat subscription canceled immediately

### 13.4 Security Rating

Based on security audit:
- **Overall Score:** 8.5/10
- **Strengths:** Encrypted storage, HTTPS enforcement, PIN hashing, RLS policies
- **Recommendations:**
  - Implement certificate pinning for production
  - Add request signing for sensitive operations
  - Restrict CORS to known domains (currently `*` in development)

---

## PART XIV: ACCESSIBILITY IMPLEMENTATION

### 14.1 Touch Target Compliance

| Element | Minimum | Pruuf Implementation | Compliance |
|---------|---------|---------------------|------------|
| Buttons | 44pt (Apple) | 60pt standard | ✓ +36% |
| Tab bar items | 44pt | 60pt | ✓ +36% |
| Check-in button | 44pt | 120pt | ✓ +172% |
| Form inputs | 44pt | 50pt | ✓ +14% |
| Radio buttons | 44pt | 60pt | ✓ +36% |

### 14.2 Color Contrast Compliance

| Combination | Ratio | WCAG Level | Status |
|-------------|-------|------------|--------|
| Text Primary on White | 16.1:1 | AAA | ✓ |
| Text Secondary on White | 4.6:1 | AA | ✓ |
| White on Primary Green | 4.6:1 | AA Large | ✓ |
| White on Error Red | 5.5:1 | AA | ✓ |

**Known Issue:** Primary button (white on #4CAF50) is 3.75:1 (fails WCAG AA for small text).
**Recommendation:** Use primaryDark (#388E3C) for 5.8:1 ratio, or ensure button text is always ≥18pt.

### 14.3 Screen Reader Support

**VoiceOver/TalkBack Labels:**
```typescript
// Every interactive element includes:
accessible={true}
accessibilityRole="button" | "link" | "checkbox" | "text"
accessibilityLabel="Descriptive label"
accessibilityHint="What happens when activated"
accessibilityState={{ disabled: false, selected: false }}
```

**Example - Check-in Button:**
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="I'm OK"
  accessibilityHint="Double tap to check in and notify your contacts"
  accessibilityState={{ disabled: isLoading }}
>
```

### 14.4 Dynamic Type Support

```typescript
// Apply font scaling to all text
const scaledStyles = StyleSheet.create({
  heading: {
    fontSize: scaledFontSize(24, fontSizePreference),
    lineHeight: scaledFontSize(30, fontSizePreference),
  },
  body: {
    fontSize: scaledFontSize(16, fontSizePreference),
    lineHeight: scaledFontSize(22, fontSizePreference),
  },
});

// All Text components allow system scaling
<Text allowFontScaling={true} maxFontSizeMultiplier={2}>
```

### 14.5 Accessibility Audit Score

**Current Score:** 78/100

**Critical Issues (3):**
1. Primary button contrast ratio 3.75:1 (needs 4.5:1)
2. Some placeholder text contrast 3.2:1 (needs 4.5:1)
3. Tab bar active indicator relies on color alone

**Recommendations:**
1. Darken primary button background to #388E3C
2. Darken placeholder text to #757575
3. Add underline/shape to active tab indicator

---

## PART XV: EDGE CASES & ERROR HANDLING

### 15.1 Check-in Edge Cases

| Scenario | Handling |
|----------|----------|
| Double tap on button | Debounced (2s cooldown), database prevents duplicates |
| Check-in at 9:59, deadline 10:00 | Status = 'on_time', no alert sent |
| Check-in at 10:01, deadline 10:00 | Status = 'late', update notification sent |
| Check-in at 11:30 PM, deadline 10:00 AM | Same calendar day counts as late |
| Check-in at 12:01 AM | Counts as NEXT day's check-in |
| App offline during check-in | Queue locally, retry with exponential backoff when online |
| Member changes timezone mid-day | May trigger missed alert, prompt to update time |
| Daylight Saving Time transition | Use moment-timezone for proper handling |

### 15.2 Authentication Edge Cases

| Scenario | Handling |
|----------|----------|
| Verification email never arrives | 60s cooldown, then allow resend |
| Verification link expired | 24-hour window, show "Link expired, resend" |
| PINs don't match | Shake animation, clear both fields, focus first |
| 5 failed login attempts | 5-minute lockout, show countdown |
| 10 failed login attempts | 15-minute lockout |
| Multiple devices, same account | Each device gets own session, all valid |
| Token expired during use | Automatic refresh via interceptor |

### 15.3 Payment Edge Cases

| Scenario | Handling |
|----------|----------|
| Card declined | Show RevenueCat error message, allow retry |
| Trial ends without payment | Freeze account, show banner to add payment |
| Payment fails after active | 3-day grace period, then freeze |
| Contact becomes Member | Cancel subscription at period end, grandfathered free |
| User cancels subscription | Access until period end, then freeze |
| Refund requested | Manual process via support |

### 15.4 Notification Edge Cases

| Scenario | Handling |
|----------|----------|
| Push permission denied | Fall back to email for CRITICAL notifications |
| FCM token invalid | Remove from database, re-register on next app open |
| Device offline | FCM queues up to 4 weeks, email delivers immediately |
| Duplicate notification attempt | Database constraint prevents |
| Member already checked in, reminder fires | Cancel reminder after check-in |

### 15.5 Error Handling Strategy

```typescript
// Global error handler
class AppError extends Error {
  code: string;
  userMessage: string;

  constructor(code: string, message: string, userMessage?: string) {
    super(message);
    this.code = code;
    this.userMessage = userMessage || 'Something went wrong. Please try again.';
  }
}

// Common error codes
const ERROR_CODES = {
  // Auth
  INVALID_EMAIL: 'Please enter a valid email address',
  EMAIL_ALREADY_EXISTS: 'This email is already registered',
  INCORRECT_PIN: 'Incorrect PIN',
  ACCOUNT_LOCKED: 'Too many attempts. Try again later.',

  // Members
  INVALID_INVITE_CODE: 'Code not found. Check your email.',
  ALREADY_CONNECTED: 'You're already connected to this person',
  MAX_CONTACTS_REACHED: 'Maximum 10 contacts per member',

  // Payment
  CARD_DECLINED: 'Card declined. Please try another card.',
  NO_PAYMENT_REQUIRED: 'You don't need to pay - you're a Member!',

  // Network
  NETWORK_ERROR: 'No internet connection. Check your connection and try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again.',
};
```

---

## PART XVI: CRON JOBS & BACKGROUND TASKS

### 16.1 Check Missed Check-ins

**Schedule:** Every minute (`* * * * *`)

```typescript
async function checkMissedCheckIns() {
  const now = moment();

  // Find all Members whose deadline passed without check-in today
  const members = await db.query(`
    SELECT m.*, u.id as user_id, u.email
    FROM members m
    JOIN users u ON m.user_id = u.id
    WHERE m.onboarding_completed = TRUE
    AND (CURRENT_TIME AT TIME ZONE m.timezone) >= m.check_in_time
    AND NOT EXISTS (
      SELECT 1 FROM check_ins c
      WHERE c.member_id = u.id
      AND DATE(c.checked_in_at AT TIME ZONE m.timezone) = CURRENT_DATE
    )
    AND NOT EXISTS (
      SELECT 1 FROM missed_check_in_alerts a
      WHERE a.member_id = u.id
      AND DATE(a.sent_at) = CURRENT_DATE
    )
  `);

  for (const member of members) {
    // Only process if deadline was within last 5 minutes (prevent duplicates)
    const deadlineTime = moment.tz(member.check_in_time, 'HH:mm:ss', member.timezone);
    const minutesSinceDeadline = now.diff(deadlineTime, 'minutes');

    if (minutesSinceDeadline >= 0 && minutesSinceDeadline < 5) {
      await sendMissedCheckInAlerts(member);
    }
  }
}

async function sendMissedCheckInAlerts(member) {
  // Get active Contacts (not frozen/canceled)
  const contacts = await db.query(`
    SELECT u.* FROM users u
    JOIN member_contact_relationships r ON r.contact_id = u.id
    WHERE r.member_id = $1
    AND r.status = 'active'
    AND u.account_status NOT IN ('frozen', 'canceled', 'deleted')
  `, [member.user_id]);

  // Send push + email to each Contact
  for (const contact of contacts) {
    await sendPushNotification(contact.id, {
      title: `${member.name} missed check-in`,
      body: `No check-in by ${member.check_in_time} ${member.timezone}`,
      data: { type: 'missed_check_in', member_id: member.user_id },
      priority: 'high',
    });

    await sendTemplateEmail(contact.email, 'missed-checkin-alert', {
      member_name: member.name,
      deadline: member.check_in_time,
      timezone: member.timezone,
    });
  }

  // Log alert (prevents duplicate alerts same day)
  await db.query(`
    INSERT INTO missed_check_in_alerts (member_id, alert_type, contacts_notified, sent_at)
    VALUES ($1, 'missed_deadline', $2, NOW())
  `, [member.user_id, contacts.length]);
}
```

### 16.2 Process Trial Expirations

**Schedule:** Daily at midnight UTC (`0 0 * * *`)

```typescript
async function processTrialExpirations() {
  const users = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'trial'
    AND DATE(trial_end_date) <= CURRENT_DATE
  `);

  for (const user of users) {
    const needsPayment = await requiresPayment(user.id);

    if (!needsPayment) {
      // User is Member or grandfathered
      await db.query(`
        UPDATE users SET account_status = 'active_free' WHERE id = $1
      `, [user.id]);

    } else if (user.RevenueCat_subscription_id) {
      // Has subscription, mark active
      await db.query(`
        UPDATE users SET account_status = 'active' WHERE id = $1
      `, [user.id]);

    } else {
      // No payment, freeze account
      await db.query(`
        UPDATE users SET account_status = 'frozen' WHERE id = $1
      `, [user.id]);

      await sendPushNotification(user.id, {
        title: 'Trial ended',
        body: 'Add payment to continue receiving alerts.',
        data: { type: 'trial_ended' },
      });

      await sendTemplateEmail(user.email, 'trial-ended', {
        trial_end_date: user.trial_end_date,
      });
    }
  }
}
```

### 16.3 Send Trial Reminders

**Schedule:** Daily at 10 AM user's local time

```typescript
async function sendTrialReminders() {
  // 15-day reminder (halfway)
  await sendReminders(15, 'trial_reminder_15',
    "You're halfway through your free trial",
    '15 days left. Enjoying Pruuf?');

  // 7-day reminder
  await sendReminders(7, 'trial_reminder_7',
    '7 days left in your free trial',
    'Add payment now to avoid interruption.');

  // 1-day reminder
  await sendReminders(1, 'trial_reminder_1',
    'Your trial ends tomorrow',
    'Add payment to keep monitoring loved ones.');
}

async function sendReminders(daysLeft, type, title, body) {
  const users = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'trial'
    AND DATE(trial_end_date) = CURRENT_DATE + INTERVAL '${daysLeft} days'
  `);

  for (const user of users) {
    await sendPushNotification(user.id, {
      title, body,
      data: { type, days_left: daysLeft },
    });
  }
}
```

### 16.4 Grace Period Expiration

**Schedule:** Every hour (`0 * * * *`)

```typescript
async function processGracePeriodExpirations() {
  // Find users past_due for >3 days
  const users = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'past_due'
    AND last_payment_date < NOW() - INTERVAL '3 days'
  `);

  for (const user of users) {
    await db.query(`
      UPDATE users SET account_status = 'frozen' WHERE id = $1
    `, [user.id]);

    await sendPushNotification(user.id, {
      title: 'Account frozen',
      body: 'Update payment to continue service.',
      data: { type: 'account_frozen' },
      priority: 'high',
    });

    await sendTemplateEmail(user.email, 'account-frozen', {});
  }
}
```

---

## PART XVII: FILE STRUCTURE & CODE ORGANIZATION

```
/src
├── /components
│   ├── /common
│   │   ├── Button.tsx              # Universal button component
│   │   ├── TextInput.tsx           # Form input with validation
│   │   ├── CodeInput.tsx           # PIN (4) / Invite code (6) input
│   │   ├── Card.tsx                # Card container variants
│   │   ├── ErrorBoundary.tsx       # Error boundary wrapper
│   │   └── Skeleton.tsx            # Loading placeholder
│   ├── /dialogs
│   │   └── ConfirmDialog.tsx       # Confirmation modal
│   ├── CheckInButton.tsx           # The 120pt "I'm OK" button
│   ├── MemberCard.tsx              # Member status card for Contact dashboard
│   ├── ContactCard.tsx             # Contact display card for Member
│   ├── DeadlineBanner.tsx          # Countdown to check-in deadline
│   └── OfflineIndicator.tsx        # Network status banner
│
├── /screens
│   ├── /auth
│   │   ├── WelcomeScreen.tsx
│   │   ├── EmailEntryScreen.tsx
│   │   ├── EmailVerificationScreen.tsx
│   │   ├── CreatePinScreen.tsx
│   │   ├── ConfirmPinScreen.tsx
│   │   └── FontSizeScreen.tsx
│   ├── /onboarding
│   │   ├── TrialWelcomeScreen.tsx
│   │   ├── AddMemberScreen.tsx
│   │   ├── InviteSentScreen.tsx
│   │   ├── MemberWelcomeScreen.tsx
│   │   ├── EnterInviteCodeScreen.tsx
│   │   └── SetCheckInTimeScreen.tsx
│   ├── /member
│   │   ├── MemberDashboard.tsx     # "I'm OK" button screen
│   │   ├── MemberContacts.tsx      # List of Contacts monitoring
│   │   └── MemberSettings.tsx      # Member preferences
│   ├── /contact
│   │   ├── ContactDashboard.tsx    # Member status cards
│   │   └── ContactSettings.tsx     # Contact preferences + payment
│   └── /shared
│       ├── MemberDetailScreen.tsx
│       ├── ContactDetailScreen.tsx
│       ├── CheckInHistoryScreen.tsx
│       ├── PaymentMethodScreen.tsx
│       └── NotificationSettingsScreen.tsx
│
├── /navigation
│   ├── RootNavigator.tsx           # Auth/App stack switching
│   ├── AuthStack.tsx               # Welcome → Font Size
│   ├── OnboardingStack.tsx         # Role-specific onboarding
│   ├── MainTabNavigator.tsx        # Tab bar navigation
│   └── index.ts
│
├── /store
│   ├── index.ts                    # Store configuration
│   └── /slices
│       ├── authSlice.ts            # Authentication state
│       ├── memberSlice.ts          # Members, contacts, check-ins
│       ├── settingsSlice.ts        # User preferences
│       ├── paymentSlice.ts         # Subscription state
│       └── notificationSlice.ts    # FCM token, in-app notifications
│
├── /services
│   ├── api.ts                      # Axios instance with interceptors
│   ├── supabase.ts                 # Supabase client
│   ├── storage.ts                  # Encrypted storage wrapper
│   ├── notifications.ts            # FCM setup and handlers
│   └── analytics.ts                # Analytics tracking
│
├── /theme
│   ├── colors.ts                   # Color palette
│   ├── typography.ts               # Font styles and scaling
│   ├── spacing.ts                  # Spacing and touch targets
│   └── index.ts                    # Theme exports
│
├── /types
│   ├── index.ts                    # Shared types
│   ├── api.ts                      # API request/response types
│   └── database.ts                 # Database entity types
│
├── /hooks
│   ├── useNotifications.ts         # Notification permission + token
│   ├── useCheckIn.ts               # Check-in logic
│   └── useFontScale.ts             # Font size preference
│
├── /utils
│   ├── validation.ts               # Form validation helpers
│   ├── formatting.ts               # Date, time, phone formatting
│   └── retry.ts                    # Exponential backoff utility
│
├── /constants
│   ├── config.ts                   # App configuration
│   └── errorCodes.ts               # Error code mapping
│
└── App.tsx                         # Root component
```

---

## PART XVIII: ENVIRONMENT CONFIGURATION

### 18.1 Mobile App Environment Variables

```bash
# .env (React Native)

# API
API_BASE_URL=https://api.pruuf.me

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RevenueCat
RevenueCat_PUBLISHABLE_KEY=pk_live_xxxxx

# App Configuration
APP_NAME=Pruuf
APP_VERSION=1.0.0
```

### 18.2 Backend Environment Variables

```bash
# .env (Backend)

# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.pruuf.me

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RevenueCat
RevenueCat_SECRET_KEY=sk_live_xxxxx
RevenueCat_WEBHOOK_SECRET=whsec_xxxxx
RevenueCat_PRICE_ID_MONTHLY=price_xxxxx  # $3.99/month price ID
RevenueCat_PRICE_ID_ANNUAL=price_xxxxx   # $29/year price ID

# Firebase
FIREBASE_PROJECT_ID=pruuf-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@pruuf-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Postmark Email
POSTMARK_SERVER_TOKEN=xxxxx
POSTMARK_FROM_EMAIL=noreply@pruuf.me
POSTMARK_FROM_NAME=Pruuf

# JWT
JWT_SECRET=random_256_bit_secret_here
JWT_ACCESS_EXPIRY=90d
JWT_REFRESH_EXPIRY=1y

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## PART XIX: TESTING STRATEGY

### 19.1 Critical Path Tests

1. **Contact Onboarding (Complete Flow)**
   - Welcome → Email Entry → Verification → Create PIN → Confirm PIN → Font Size → Trial Welcome → Add Member → Invite Sent → Dashboard
   - Verify: Account created, trial started, Member invited

2. **Member Onboarding (Complete Flow)**
   - Welcome → Email Entry → Verification → Create PIN → Confirm PIN → Font Size → Member Welcome → Enter Code → Set Time → Dashboard
   - Verify: Connected to Contact, is_member = true, grandfathered_free = true

3. **Daily Check-in (Happy Path)**
   - Member taps "I'm OK" button
   - Verify: Check-in recorded, Contacts receive push notification, button changes to "Checked In"

4. **Missed Check-in (Alert Flow)**
   - Deadline passes without check-in
   - Verify: Missed alert record created, Contacts receive push + email, Member card shows "Missed"

5. **Late Check-in (Update Flow)**
   - Member checks in after deadline
   - Verify: Status = 'late', Contacts receive update notification

6. **Payment Flow**
   - Add card → Create subscription
   - Verify: RevenueCat subscription created, account_status = 'active'

7. **Subscription Cancellation**
   - Cancel subscription
   - Verify: cancel_at_period_end = true, access until period end, then frozen

8. **Grandfathering Flow**
   - Paying Contact becomes Member
   - Verify: grandfathered_free = true, subscription canceled at period end

### 19.2 Edge Case Tests

- [ ] Double tap on check-in button (should not create duplicate)
- [ ] Check-in exactly at deadline (should be on_time)
- [ ] Check-in 1 minute after deadline (should be late)
- [ ] Check-in at 11:59 PM (should count for current day)
- [ ] Check-in at 12:01 AM (should count for next day)
- [ ] Offline check-in (should queue and retry)
- [ ] Contact becomes Member (should be grandfathered)
- [ ] All Contacts stop monitoring (grandfathered should persist)
- [ ] Payment failure (should have 3-day grace period)
- [ ] 5 failed login attempts (should lock 5 minutes)
- [ ] Token expiration during request (should auto-refresh)
- [ ] Push permission denied (should fall back to email)

### 19.3 Accessibility Tests

- [ ] All buttons have 60pt+ touch targets
- [ ] All text passes color contrast ratios
- [ ] All interactive elements have VoiceOver labels
- [ ] Font scaling works at 1.5x multiplier
- [ ] Tab order is logical
- [ ] Error messages are descriptive

---

## PART XX: DEPLOYMENT & INFRASTRUCTURE

### 20.1 Production Infrastructure

**Backend Hosting:**
- Platform: Railway / Render / Vercel Edge Functions
- Auto-scaling: Enabled
- Health check: `GET /health` endpoint

**Database:**
- Provider: Supabase (managed PostgreSQL)
- Region: US-West-2
- Backups: Automatic daily, 30-day retention

**CDN:**
- Provider: Cloudflare
- Features: SSL, DDoS protection, caching

### 20.2 Mobile App Distribution

**iOS:**
- App Store Connect submission
- TestFlight for beta testing
- Minimum iOS version: 14.0

**Android:**
- Google Play Console submission
- Internal testing track for beta
- Minimum Android version: 10 (API 29)

### 20.3 Monitoring

**Error Tracking:**
- Sentry for frontend + backend errors
- Automatic error grouping and alerting

**Analytics:**
- Mixpanel or Amplitude for user events
- Key events: signup, check_in, missed_check_in, subscription_created

**Uptime Monitoring:**
- Pingdom or UptimeRobot for API health
- Alert on >30s response time or 5xx errors

---

## SUMMARY

Pruuf is a comprehensively designed React Native application that prioritizes accessibility, simplicity, and emotional design for its target demographic of elderly adults and their family caregivers.

**Key Technical Decisions:**
1. **60pt touch targets** (36% larger than Apple's minimum) for elderly users
2. **Email + push notification** for critical alerts (no SMS dependency)
3. **Grandfathering logic** ensures Members never pay
4. **Row Level Security** on all database tables for data protection
5. **Automatic token refresh** for seamless user experience
6. **Multi-channel notifications** for reliability

**Core Features:**
1. One-tap daily check-in (120pt button)
2. Automatic push notification to Contacts on check-in
3. Immediate alerts on missed check-in (push + email)
4. $3.99/month (or $29/year) subscription for Contacts (Members always free)
5. 30-day free trial with no credit card required (starts when first Member onboards)
6. Support for multiple Members per Contact
7. Maximum 10 Contacts per Member

This specification provides complete implementation details for building Pruuf from scratch. An AI developer should be able to implement the entire application using only this document.

---

**DOCUMENT STATISTICS:**
- Total Sections: 20
- Total Words: ~9,500
- Total Lines: ~2,400
- Database Tables: 6
- API Endpoints: 27
- Screen Count: 30+
- Component Count: 15+

---

**END OF SPECIFICATION**

*This document was generated by synthesizing findings from 12 specialized agent audits covering frontend architecture, component library, screen flows, design system, accessibility, Redux state management, backend API, database schema, external integrations, security implementation, business logic, and notification systems.*
