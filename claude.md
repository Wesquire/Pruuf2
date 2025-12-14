 # PRUUF: EXHAUSTIVE APPLICATION SPECIFICATION & IMPLEMENTATION BLUEPRINT

**Document Version:** 3.0
**Specification Date:** December 2025
**Document Purpose:** Complete AI-reproducible application specification
**Target Platforms:** iOS 14+ & Android 10+ (React Native)
**Backend Infrastructure:** Supabase (PostgreSQL) + Edge Functions
**Payment Processing:** Stripe
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
- **Stripe** for payment processing with $3.99/month (or $29/year) subscription model

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
<<<<<<< Updated upstream
    3.5 Unlimited Limits
    No caps on:
        • Number of Members a Contact can monitor
        • Number of Contacts a Member can have
        • Number of Members a Member-as-Contact can monitor (all free if they're a Member)
    Rationale: Simplified pricing, viral growth (elderly Members invite multiple family members), no complex tier logic.
    
    4. COMPLETE USER FLOWS
    4.1 Contact Onboarding Flow
    Step 1: Download & Launch
        • User downloads "Pruuf" from App Store or Google Play Store
        • Opens app → sees welcome screen
    Welcome Screen:
        • Headline: "Stay connected to loved ones with daily check-ins"
        • Subheadline: "30-day free trial. $2.99/month after. Cancel anytime."
        • Primary CTA: "Get Started" (large button, 60pt height)
        • Secondary link: "Already have an account? Log in"
    Step 2: Account Creation
        • Tap "Get Started" → Phone Number Entry screen
        • Input: Phone number field (auto-formatted as user types: (555) 123-4567)
        • Label above field: "Your phone number"
        • Helper text below: "We'll send a verification code"
        • Primary CTA: "Continue" (disabled until valid phone entered)
        • VoiceOver: "Phone number text field. Enter your mobile number to receive a verification code."
    Step 3: Phone Verification
        • System sends 6-digit SMS code via Twilio
        • SMS template: "Your Pruuf verification code is: 123456. This code expires in 10 minutes."
        • Screen shows: "Enter the code we sent to (555) 123-4567"
        • Six individual boxes for digits (auto-advances on entry)
        • Resend link: "Didn't receive code? Resend" (disabled for 30 seconds after initial send)
        • Error state: "Code didn't match. Please try again." (red text below boxes if invalid)
        • Success: Auto-advances to next screen on valid code entry
    Step 4: Create PIN
        • Headline: "Create a 4-digit PIN"
        • Subheadline: "You'll use this to log in"
        • Four boxes for PIN digits (obscured immediately on entry)
        • After 4 digits entered → "Confirm your PIN" screen
        • Re-enter 4 digits
        • Validation: Must match exactly
        • Error: "PINs don't match. Try again." (clears both fields, returns to first entry)
        • Success: Auto-advances to font size selection
    Step 5: Font Size Selection
        • Headline: "Choose your text size"
        • Preview paragraph (live updates as selection changes): "This is how Pruuf will look. You can change this anytime in Settings."
        • Three options (radio buttons): 
            ○ Standard (16pt base)
            ○ Large (20pt base)
            ○ Extra Large (24pt base)
        • Default selected: Standard
        • Sample button below preview (also updates size): "I'm OK"
        • Primary CTA: "Continue"
        • This preference saves to users.font_size_preference
    Step 6: Trial Welcome
        • Full-screen modal (cannot dismiss)
        • Headline: "Your 30-day free trial starts now"
        • Bullet points: 
            ○ "Monitor unlimited loved ones"
            ○ "Receive instant alerts if they miss check-ins"
            ○ "No credit card required during trial"
            ○ "$2.99/month after trial. Cancel anytime."
        • Primary CTA: "Add Your First Member"
        • VoiceOver: "You're now on a 30-day free trial. Tap Add Your First Member to invite someone to Pruuf."
    Step 7: Invite First Member
        • Screen: "Add a Member"
        • Headline: "Who would you like to check on daily?"
        • Input fields: 
            ○ Member's Name (text input)
            ○ Member's Phone Number (formatted input)
        • Secondary option: "Choose from Contacts" (iOS/Android contacts permission required) 
            ○ If permission granted: Opens native contact picker
            ○ If denied: Shows banner "Allow Pruuf to access contacts in Settings to select from your phone"
        • Validation: Both name and phone required
        • Primary CTA: "Send Invite"
    Step 8: Invite Sent Confirmation
        • Modal overlay: "Invite sent to [Name]!"
        • Body text: "We sent them a text message with instructions to download Pruuf and connect with you. We'll notify you when they join."
        • Code display (for reference): "Their invite code: ABC123"
        • Helper text: "You might want to call them to let them know it's coming."
        • Primary CTA: "Got it"
        • Secondary CTA: "Invite Another Member"
    Step 9: Contact Dashboard (Initial State)
        • Tab bar navigation appears (bottom of screen) 
            ○ Members tab (icon: person, label: "Members") [active]
            ○ Settings tab (icon: gear, label: "Settings")
        • Members screen shows: 
            ○ Section header: "Your Members"
            ○ Pending card (gray background): 
                § Name: [Name]
                § Status badge: "Pending Invite"
                § Subtext: "Invited on [date]"
                § Action button: "Resend Invite"
            ○ Empty state message (if no Members yet): "No members yet. Tap + to invite
    Retry
    WW
    I need you to start your 8,000+ word spec document again. I need you to know that I am using Twilio as my SMS service. Incorporate this where necessary. Begin again. Do an even more thorough job that you are already doing. You've done some good work, now show me what great work looks like. You are a genius full-stack dev and ux/ui mastermind. Do your best work for me now.
    PRUUF: EXHAUSTIVE TECHNICAL SPECIFICATION FOR COMPLETE MOBILE APPLICATION DEVELOPMENT
    Document Version: 1.0
    Last Updated: November 18, 2025
    Specification Author: Senior Full-Stack Architect & UX/UI Lead
    Target Audience: AI Developer / Development Team
    Platform Targets: iOS (App Store) & Android (Google Play Store)
    Backend Infrastructure: Supabase (PostgreSQL, Auth, Realtime, Storage)
    SMS Provider: Twilio
    Payment Processor: Stripe
    Estimated Implementation: 8-12 weeks for MVP
    
    DOCUMENT PURPOSE & USAGE
    This specification document serves as the complete, exhaustive blueprint for building Pruuf from zero to production-ready state. Every decision, every edge case, every user interaction, every database field, every API endpoint, and every notification template is documented with obsessive precision. An AI developer or development team should be able to implement the entire application using only this document, requiring zero additional clarification or external research.
    What This Document Covers:
        • Complete product philosophy and design principles
        • Exhaustive user flows with pixel-perfect UI specifications
        • Full database schema with indexes, constraints, and sample data
        • Backend architecture using Supabase services
        • Stripe subscription lifecycle management with webhook handling
        • Twilio SMS integration with all message templates
        • Push notification implementation for iOS and Android
        • Authentication and security protocols
        • Edge case handling for 75+ scenarios
        • Accessibility requirements meeting WCAG 2.1 AAA standards
        • QA test cases and acceptance criteria
        • Technology stack with specific versions and configuration
    How to Use This Document:
        1. Read sections 1-3 to understand product vision and business logic
        2. Study section 4 (User Flows) to understand all user journeys
        3. Implement database schema (section 5) before any code
        4. Build authentication system (section 6) as foundation
        5. Implement backend services (section 7-10) before frontend
        6. Build UI screens (sections 11-12) using provided specifications
        7. Integrate all services (section 13) via documented API endpoints
        8. Handle edge cases (section 14) during implementation
        9. Test against criteria (section 16) before launch
    
    TABLE OF CONTENTS
    PART I: FOUNDATION
        1. Product Vision & Philosophy
        2. User Personas & Psychology
        3. Business Model & Pricing Logic
        4. Core User Flows (Contact & Member Journeys)
    PART II: TECHNICAL ARCHITECTURE 5. Database Schema & Data Models 6. Authentication & Security Infrastructure 7. Supabase Backend Configuration 8. Stripe Payment Integration 9. Twilio SMS System 10. Push Notification Architecture
    PART III: USER INTERFACE 11. Design System & Component Library 12. Screen-by-Screen Specifications 13. Interaction Patterns & Animations
    PART IV: INTEGRATION 14. API Endpoint Definitions 15. Edge Case Handling & Error States 16. Accessibility Implementation
    PART V: DEPLOYMENT 17. Testing & Quality Assurance 18. Technology Stack & Dependencies 19. Environment Configuration & Deployment 20. Monitoring & Analytics
    
    PART I: FOUNDATION
    1. PRODUCT VISION & PHILOSOPHY
    1.1 The Core Problem We Solve
    Adult children of elderly parents face a daily anxiety: "Is Mom okay today?" Traditional solutions are inadequate:
    Daily Phone Calls: Feel intrusive, create burden on both parties, communicate distrust ("I need to check if you're still alive"), consume time, and create guilt when missed.
    Medical Alert Systems: Expensive ($30-50/month), require hardware installation, carry stigma ("I'm old and helpless"), only work during emergencies (not preventative), have poor user experience.
    Location Tracking Apps: Invasive, violate privacy, generate false alarms, feel dystopian ("I'm tracking you"), don't confirm actual wellbeing.
    Doing Nothing: Creates constant low-grade anxiety for adult children, delays intervention when problems occur, leads to tragic outcomes when elderly person has no way to signal distress.
    1.2 The Pruuf Solution
    Pruuf reframes the daily wellness check as a simple ritual of mutual reassurance:
    For the Member (elderly parent): One tap per day, at a time they choose, signals "I'm alive and well." It's dignified, takes five seconds, requires no conversation, and demonstrates consideration for their children's peace of mind.
    For the Contact (adult child): Automatic confirmation each day that parent is well, with immediate alert if parent doesn't check in. No daily phone calls needed, no invasive tracking, just confidence that "if something's wrong, I'll know immediately."
    The Emotional Shift: From "My kids are checking up on me" (negative, infantilizing) to "I'm reassuring my kids I'm okay" (positive, agency-preserving). From "I need to call Mom every day" (burden) to "I'll hear from Pruuf if Mom needs me" (peace of mind).
    1.3 Design Philosophy (The Five Pillars)
    PILLAR 1: RADICAL SIMPLICITY
    Every screen must pass the "grandmother test": Could your 85-year-old grandmother with mild presbyopia and arthritic fingers use this without help?
    Implementation rules:
        • Maximum 3 interactive elements per screen
        • One primary action per screen (clearly dominant)
        • No hidden gestures (no swipe-to-delete, no long-press menus)
        • No hamburger menus or complex navigation
        • Every action requires exactly one tap (except confirmations for destructive actions)
        • Zero tolerance for UI jargon ("Settings" not "Preferences," "Check In" not "Submit Status")
    PILLAR 2: EMOTIONAL DESIGN
    Technology should feel warm, not clinical. Every interaction should communicate care, safety, and competence.
    Language principles:
        • First person, conversational tone ("You checked in!" not "Check-in recorded")
        • Positive framing ("Great job!" not "Task completed")
        • Explicit reassurance ("Your family has been notified" not "Notification sent")
        • Never use guilt or fear ("Your daughter is worried" ❌ vs. "Time for your daily check-in" ✓)
        • Apology when errors occur ("Sorry, something went wrong" not "Error 500")
    Visual principles:
        • Warm color palette (greens for success, soft reds for alerts, never harsh colors)
        • Generous whitespace (no cramped layouts)
        • Friendly iconography (rounded, not sharp)
        • Success animations (subtle celebration on check-in, gentle confirmations)
    PILLAR 3: ACCESSIBILITY FIRST
    Accessibility is not a feature, it's the foundation. Every design decision must consider users with:
        • Low vision (60% of users over 75 have vision impairment)
        • Tremor or reduced dexterity (Parkinson's, arthritis)
        • Cognitive load sensitivity (easily overwhelmed by complexity)
        • Hearing impairment (cannot rely on audio cues)
    Mandatory requirements:
        • All interactive elements ≥60pt touch targets (Apple recommends 44pt; we exceed)
        • AAA color contrast ratios (7:1 minimum for normal text, 4.5:1 for large text)
        • Full VoiceOver/TalkBack support with descriptive labels
        • Dynamic Type support (respects iOS/Android system text size settings)
        • No reliance on color alone (use icons + text + shape)
        • Haptic feedback for all critical actions
        • Text alternatives for all visual information
    PILLAR 4: TRUST THROUGH TRANSPARENCY
    Users must trust Pruuf with their safety. Trust comes from predictability, clarity, and control.
    Transparency requirements:
        • Members can see exactly who monitors them (full list of Contacts with names/phones)
        • Contacts can see exact check-in times and deadlines (no ambiguity about "when should I worry?")
        • All notifications explain exactly what happened and what happens next
        • Payment is explicit and predictable (no surprise charges, clear trial end dates)
        • User can delete account and data completely at any time
        • Privacy policy in plain language (not legal jargon)
    Control requirements:
        • Members set their own check-in time (not imposed by family)
        • Members can change check-in time anytime (with notification to Contacts)
        • Members can add or remove Contacts freely
        • Contacts can cancel subscription with one tap, effective immediately
        • All notifications can be customized (though SMS alerts cannot be disabled)
    PILLAR 5: ZERO BURDEN PRINCIPLE
    Pruuf must require the absolute minimum effort from both Members and Contacts.
    For Members:
        • One tap per day (literally one tap on "I'm OK" button)
        • No daily app opening required (push notification can trigger check-in)
        • No forced conversations or journaling
        • No guilt trips or nagging (optional reminder at most)
        • No payment, no credit card, no subscriptions to manage
    For Contacts:
        • Zero effort when things are normal (automatic confirmation)
        • One notification when action needed (missed check-in)
        • No daily app opening required (SMS works even with app closed)
        • Simple subscription ($2.99/month, no tiers, no add-ons)
        • Can monitor unlimited Members without complexity
    1.4 Success Criteria
    The application succeeds when it achieves these measurable outcomes:
    User Engagement:
        • Members check in ≥90% of days within 30 days of onboarding
        • Contacts respond to missed check-in alerts within 30 minutes ≥80% of time
        • Member 90-day retention ≥80% (most drop-off is death, relocation to facility, or family conflict, not product dissatisfaction)
    Business Viability:
        • Contact trial-to-paid conversion ≥65% (industry standard is 40-60% for B2C SaaS)
        • Monthly churn ≤5% (elderly user products have low churn due to habit formation)
        • Average Contacts per Member ≥2.5 (viral coefficient; each Member invites multiple family)
        • Customer acquisition cost (CAC) ≤$15, Lifetime Value (LTV) ≥$100 (LTV:CAC ratio >6)
    Product Quality:
        • App crash rate <0.1% of sessions
        • API p99 latency <500ms
        • SMS delivery success rate ≥99.5% (Twilio SLA)
        • Push notification delivery rate ≥95% (accounting for disabled notifications)
        • Support tickets <2% of monthly active users
    Social Impact:
        • Zero preventable deaths (elderly user found within 24 hours of missed check-in)
        • Reduction in daily "check-in" phone calls (measured via user surveys)
        • Family relationship quality improvement (reduced anxiety, preserved dignity)
    
    2. USER PERSONAS & PSYCHOLOGY
    2.1 Member Persona: "Margaret" (The Monitored Parent)
    Demographics:
        • Age: 78 years old
        • Living Situation: Lives alone in a single-family home (husband passed 3 years ago)
        • Family: 2 adult children (daughter in same city, son 500 miles away), 4 grandchildren
        • Health: Generally healthy with managed hypertension and early-stage osteoarthritis
        • Technology: Owns iPhone 11 (gift from daughter), uses for calls, texts, photos; intimidated by "apps"
        • Daily Routine: Wakes 6:30 AM, coffee and newspaper, lunch with friends twice weekly, bed by 9 PM
    Motivations:
        • Maintain independence and dignity ("I don't want to be a burden")
        • Reassure children without daily phone calls ("They worry too much")
        • Avoid moving to assisted living as long as possible
        • Stay connected to family despite distance
    Fears & Anxieties:
        • Technology failure leaving her stranded ("What if the app doesn't work?")
        • Making mistakes with technology ("I'll press the wrong button and break something")
        • Children thinking she's incompetent ("They'll think I can't take care of myself")
        • Losing autonomy ("Next they'll want to move me to a facility")
        • Being a burden ("I don't want them spending money on me")
    Technology Behaviors:
        • Needs large text and simple interfaces
        • Reads every word on screen (won't skip instructions)
        • Afraid to explore or tap things experimentally
        • Calls daughter when confused rather than trying to figure it out
        • Resists installing new apps (phone storage anxiety, overwhelm)
        • Successfully uses: Phone calls, text messages, Photos app, occasionally FaceTime
    Pain Points with Existing Solutions:
        • Daily check-in calls from daughter feel infantilizing
        • Medical alert pendant has monthly fee she resents paying
        • Life Alert commercials ("I've fallen and can't get up") feel depressing
        • Doesn't want cameras in her house (privacy concerns)
        • Smartphone apps are "too complicated"
    Pruuf Usage Pattern:
        • Will check in at same time daily (creature of habit: 10 AM after breakfast)
        • Will panic first time she forgets and gets calls from children ("I broke it!")
        • Needs reassurance that missing once isn't a big deal
        • Will eventually form habit and check in reliably
        • May check in multiple times "just to be sure it worked"
        • Will rarely change check-in time (routine-oriented)
    Key Design Implications:
        • Giant "I'm OK" button must dominate screen (no scrolling required)
        • Confirmation must be immediate and obvious ("You checked in! ✓")
        • Font size must default to Large for Member accounts
        • Error messages must be non-judgmental ("No problem! Try again")
        • Settings must be accessible but not prominent (she won't change them often)
        • No gamification or streaks (creates anxiety about breaking streak)
    2.2 Contact Persona: "Jennifer" (The Adult Daughter)
    Demographics:
        • Age: 52 years old
        • Occupation: Marketing manager at mid-size company
        • Family: Married, 2 teenage children
        • Location: Same city as mother Margaret, 15-minute drive
        • Technology: Power smartphone user, uses 20+ apps daily, comfortable with subscriptions
    Motivations:
        • Ensure mother's safety without daily intrusive calls
        • Balance caregiving with full-time job and own family
        • Coordinate with brother on mother's care
        • Delay or prevent mother's move to assisted living
        • Reduce own anxiety about "what if something happened and I didn't know for days"
    Fears & Anxieties:
        • Missing a critical alert when mother needs help
        • Mother falling and not being discovered for hours/days
        • Brother blaming her if something happens ("You live in the same city, why didn't you check?")
        • Guilt over not calling mother every day ("I'm a bad daughter")
        • Mother's independence declining (each incident is a step toward assisted living)
    Technology Behaviors:
        • Expects consumer-grade UX (compares to apps like Uber, Venmo, Instagram)
        • Will abandon app if onboarding takes >3 minutes
        • Reads reviews obsessively before trying new services
        • Comfortable with $2.99/month subscription (pays for Netflix, Spotify, iCloud, etc.)
        • Expects push notifications to work reliably
        • Will contact support immediately if something seems broken
    Pain Points with Existing Solutions:
        • Calling mother daily feels forced and routine ("We run out of things to talk about")
        • Mother resents daily calls ("I'm fine! You don't need to check on me!")
        • Life Alert too expensive for mother's limited budget ($30-50/month)
        • Location tracking apps feel invasive and creepy
        • Mother refuses to wear medical alert pendant ("I'm not that old")
    Pruuf Usage Pattern:
        • Will onboard mother herself (hands mother phone, enters info, sets up together)
        • Will invite brother immediately (wants shared responsibility)
        • Will check app daily even when notifications confirm check-in (anxious personality)
        • Will text mother if check-in is late ("Hey Mom, don't forget to check in!")
        • Will upgrade to paid immediately when trial ends (values peace of mind at $2.99)
        • May invite other family members (aunt, cousin) to also monitor mother
    Key Design Implications:
        • Contact dashboard must show all Members at a glance (no scrolling for 1-3 Members)
        • "Last checked in" timestamp must be prominent (she'll look for this first)
        • Missed check-in alerts must be LOUD (push + SMS, not just one)
        • Call/Text buttons must be one-tap from dashboard (immediate communication)
        • Trial reminders must be gentle (she'll pay, doesn't need hard sell)
        • Must support multiple Members (she may also monitor her aunt)
    2.3 Member-as-Contact Persona: "Robert" (The Dual Role User)
    Demographics:
        • Age: 71 years old
        • Situation: Retired, widowed, lives alone
        • Family: 1 adult daughter (monitors him as Member), 1 older sister age 76 (he monitors her as Contact)
        • Health: Good health, early-stage diabetes, hearing aids
        • Technology: Comfortable with smartphone basics, uses email and Facebook
    Unique Characteristics:
        • Both elderly (Member) and caregiver (Contact) simultaneously
        • Has firsthand understanding of both sides of the check-in dynamic
        • Appreciates routine and simplicity
        • Financially conscious (appreciates not paying since he's a Member)
        • Values family connection
    Pruuf Usage Pattern:
        • Checks in for himself daily at 8 AM (early riser)
        • Monitors sister's check-ins throughout day (she checks in at 11 AM)
        • Appreciates receiving "Your sister checked in" confirmations
        • Will call sister if she misses check-in (close relationship)
        • Grateful he doesn't pay since he's already a Member ("That's fair")
    Key Design Implications:
        • App must clearly distinguish between "Your check-in" and "Sister's check-in"
        • Notification for own reminder vs. alert about sister must be visually distinct
        • Settings must show both roles clearly (Member settings, Contact settings)
        • Grandfathered-free messaging must be prominent ("You'll never pay!" reinforces value)
        • Must be able to invite additional Members (may add elderly friends to network)
    2.4 Secondary Persona: "Michael" (The Out-of-Town Son)
    Demographics:
        • Age: 49 years old
        • Occupation: Software engineer
        • Location: 500 miles from mother
        • Technology: Extremely tech-savvy
        • Family: Married, 1 young child
    Unique Needs:
        • Cannot easily visit mother to help with onboarding
        • Relies on sister Jennifer for in-person support
        • Wants equal visibility into mother's status despite distance
        • Needs alerts to work even when traveling internationally for work
    Key Design Implications:
        • Onboarding must work remotely (Jennifer sets up mother's phone, Michael joins as Contact separately)
        • Multiple Contacts must have identical alert access (no "primary" Contact)
        • SMS must work internationally (Twilio supports this)
        • Timezone handling must be clear (Michael is in PST, mother is EST)
    
    3. BUSINESS MODEL & PRICING LOGIC
    3.1 Pricing Structure (Detailed)
    Single Tier: Pruuf
    Price: $2.99 USD/month
    Billing Cycle: Monthly (every 30 days from subscription start)
    Payment Method: Credit/debit card via Stripe
    Trial Period: 30 days, no credit card required
    Currency: USD (international expansion requires additional currency support)
    What's Included (Unlimited):
        • Monitor unlimited Members (no cap at 2, 5, or 10)
        • Each Member can have unlimited Contacts (no cap)
        • Unlimited SMS alerts via Twilio (bundled into subscription cost)
        • Unlimited push notifications (free iOS/Android service)
        • Unlimited Member invitation codes
        • Full access to all features (no premium tier exists)
        • 24/7 check-in monitoring
        • Immediate alert delivery
    What's Not Included:
        • Phone support (email/in-app support only for MVP)
        • Custom check-in schedules (only once per day)
        • Historical analytics beyond last check-in timestamp
        • Integration with medical alert systems
        • Video check-ins or two-way communication
    3.2 Who Pays What (The Core Rules)
    Rule 1: Contacts Pay Any user who acts as a Contact (monitors at least one Member) must pay $2.99/month after their 30-day trial ends, UNLESS they are also a Member.
    Rule 2: Members Never Pay Any user who is a Member (someone monitors them) never pays, never enters payment information, never sees pricing screens. This is absolute and non-negotiable.
    Rule 3: Member-as-Contact Never Pays If a user is BOTH a Member (someone monitors them) AND a Contact (they monitor someone else), they never pay. The Member status takes precedence. This is a "grandfathered free forever" benefit.
    Rule 4: Once a Member, Always Free If a user becomes a Member (someone invites them and they accept), they receive permanent free Contact access. Even if all their Contacts later stop monitoring them (they're no longer technically a Member), they retain free Contact access forever. This is tracked via users.grandfathered_free = true flag.
    Rule 5: Subscription is Per Contact, Not Per Member One Contact monitoring 5 Members pays $2.99/month total (not $2.99 per Member). Unlimited Members for one flat fee.
    3.3 Trial Mechanics (Exhaustive Detail)
    Trial Start:
        • Trigger: User creates Contact account (completes phone verification + PIN creation)
        • Database action: INSERT INTO users (trial_start_date, account_status) VALUES (NOW(), 'trial')
        • Duration: Exactly 30 calendar days from trial_start_date (not 30 billing days)
        • Access: Full access to all features during trial (can invite Members, receive alerts, everything)
        • Payment: No credit card required, no pre-authorization charge, no payment method on file
    During Trial (Days 1-30):
        • User can invite unlimited Members
        • User receives all SMS and push notifications
        • User can add payment method in Settings at any time (optional)
        • In-app notifications on days 15, 23, and 29 (see notification section for exact copy)
        • If user adds payment before trial ends, subscription starts immediately on day 31 (not early)
    Trial End (Day 31): The system performs this check at midnight UTC on the 31st day:
    sql
    -- Pseudocode for trial end logic
IF user.stripe_subscription_id EXISTS AND subscription.status = 'active' THEN
  -- User already paid, continue service
  UPDATE users SET account_status = 'active' WHERE user_id = X;
  
ELSE IF user.is_member = TRUE OR user.grandfathered_free = TRUE THEN
  -- User is Member or grandfathered, no payment required
  UPDATE users SET account_status = 'active_free' WHERE user_id = X;
  
ELSE
  -- User needs to pay but hasn't
  UPDATE users SET account_status = 'frozen' WHERE user_id = X;
  -- Send notification (see notification section)
END IF;
    Frozen Account Behavior:
        • User can open app (not locked out)
        • Dashboard shows banner: "Add payment to continue receiving alerts"
        • Cannot receive new missed check-in alerts (Contacts won't know if Member misses check-in)
        • Cannot invite new Members
        • Can view existing Members (read-only)
        • Can add payment method (reactivates immediately)
        • Existing Member connections remain in database (not deleted)
    Reactivation from Frozen:
        • User adds payment method in Settings
        • Stripe subscription created immediately
        • account_status changes from 'frozen' to 'active'
        • Banner disappears
        • All functionality restores instantly
        • Missed check-in monitoring resumes immediately
        • No back-payment required for frozen period
    3.4 Payment Method Management
    Adding Payment (During or After Trial):
    User navigates to Settings > Payment Method > Add Card
    Screen shows:
        • Stripe Elements embedded card form (PCI-compliant, Stripe handles security)
        • Fields: Card number, Expiration, CVC, ZIP code
        • "Save Card" button
        • Helper text: "Secure payment via Stripe. We never see your card details."
    On save:
        1. Stripe.js tokenizes card (client-side, Pruuf never sees raw card number)
        2. App sends token to Pruuf backend
        3. Backend creates Stripe Customer: POST /api/stripe/create-customer
        4. Backend creates Stripe Subscription: POST /api/stripe/create-subscription
        5. Subscription parameters: 
            ○ Product: "Pruuf Contact Subscription"
            ○ Price: $2.99/month
            ○ Trial behavior: If during trial, trial_end = trial_end_date; if after trial, immediate charge
        6. Backend saves stripe_customer_id and stripe_subscription_id to users table
        7. App shows success message: "Payment added! You're all set."
    Updating Payment:
        • User navigates Settings > Payment Method > Update Card
        • Same Stripe Elements form
        • On save, creates new Payment Method, attaches to Customer, sets as default
        • Old card removed from Stripe (not stored in Pruuf database)
    Removing Payment:
        • Not allowed while subscription is active
        • User must cancel subscription first
        • After cancellation (end of billing period), user can remove card in Stripe Customer Portal
    3.5 Subscription Lifecycle States
    State 1: Trial (Days 1-30)
        • account_status = 'trial'
        • stripe_subscription_id = NULL
        • Full access to features
        • No charges
    State 2: Active Paid
        • account_status = 'active'
        • stripe_subscription_id = sub_xxxxx
        • stripe_subscription_status = 'active'
        • Charged $2.99 every 30 days
        • Full access to features
    State 3: Active Free (Member or Grandfathered)
        • account_status = 'active_free'
        • stripe_subscription_id = NULL
        • is_member = TRUE OR grandfathered_free = TRUE
        • No charges ever
        • Full access to features
    State 4: Frozen (Trial Ended, No Payment)
        • account_status = 'frozen'
        • stripe_subscription_id = NULL
        • Limited access (no alerts, no new invites)
        • Can add payment to reactivate
    State 5: Past Due (Payment Failed)
        • account_status = 'past_due'
        • stripe_subscription_status = 'past_due'
        • Grace period: 3 days
        • Shows banner: "Payment failed. Update card to continue service."
        • After 3 days, becomes Frozen
    State 6: Canceled
        • account_status = 'canceled'
        • stripe_subscription_status = 'canceled'
        • Access continues until end of current billing period
        • Then transitions to Frozen
        • Can resubscribe anytime (no new trial, immediate charge)
    State 7: Deleted Account
        • User deleted account entirely
        • All data deleted (Members, Contacts, check-ins)
        • Stripe subscription canceled immediately
        • Cannot reactivate (must create new account)
    3.6 Member Becomes Contact (Grandfathering Logic)
    Scenario: Jennifer (Contact, paying $2.99/month) gets invited by her own daughter to be a Member.
    Step-by-Step:
        1. Jennifer is Contact (paying $2.99/month since 3 months ago)
        2. Jennifer's daughter downloads Pruuf, invites Jennifer to be a Member
        3. Jennifer receives SMS with invite code
        4. Jennifer opens Pruuf app (already logged in), sees notification: "Emily invited you to be a Member! Enter code to connect."
        5. Jennifer taps notification, enters code
        6. System creates: member_contact_relationships { member_id: jennifer_id, contact_id: emily_id }
        7. System queries: SELECT COUNT(*) FROM member_contact_relationships WHERE member_id = jennifer_id → Returns 1 (Emily is monitoring her)
        8. System sets: users.grandfathered_free = TRUE WHERE id = jennifer_id
        9. System checks: Jennifer's current billing cycle ends on Dec 15 (today is Dec 1)
        10. System does NOT cancel subscription immediately (Rule: finish billing cycle)
        11. On Dec 15, Stripe webhook subscription.updated fires with cancel_at_period_end = true
        12. Pruuf webhook handler: 
            ○ Checks if user.grandfathered_free = TRUE
            ○ Cancels Stripe subscription: stripe.subscriptions.cancel(sub_id, {prorate: false})
            ○ Sets stripe_subscription_id = NULL
            ○ Sets account_status = 'active_free'
        13. Jennifer receives in-app notification: "Great news! Since you're now a Pruuf Member, your subscription has ended. You can monitor others for free, forever. No charges starting Dec 15."
    Edge Case: What if Emily later stops monitoring Jennifer (removes her as Contact)?
        • Jennifer's member_contact_relationships entry is deleted or set to status = 'removed'
        • Query SELECT COUNT(*) WHERE member_id = jennifer_id AND status = 'active' → Returns 0
        • Jennifer is no longer technically a Member
        • BUT: grandfathered_free = TRUE persists
        • Jennifer remains free forever (grandfathered benefit never revoked)
    3.7 Stripe Integration Architecture
    Stripe Products & Prices:
    In Stripe Dashboard, create:
        • Product Name: "Pruuf Contact Subscription"
        • Product Description: "Monthly subscription to monitor unlimited Members via Pruuf"
        • Pricing: 
            ○ Price ID: price_pruuf_monthly (use this in code)
            ○ Amount: $2.99 USD
            ○ Billing Period: Monthly (every 30 days)
            ○ Currency: USD
    Webhook Events to Handle:
        1. customer.subscription.created 
            ○ User added payment and subscription started
            ○ Action: Update users.stripe_subscription_id, set account_status = 'active'
        2. customer.subscription.updated 
            ○ Subscription status changed (active → past_due, active → canceled, etc.)
            ○ Action: Update account_status based on new status
        3. customer.subscription.deleted 
            ○ Subscription fully canceled
            ○ Action: Set stripe_subscription_id = NULL, account_status = 'frozen'
        4. invoice.payment_succeeded 
            ○ Monthly payment succeeded
            ○ Action: Log successful payment, send receipt email, update last_payment_date
        5. invoice.payment_failed 
            ○ Monthly payment failed (card declined, insufficient funds, etc.)
            ○ Action: Set account_status = 'past_due', send notification to user, start 3-day grace period timer
        6. customer.subscription.trial_will_end 
            ○ Fired 3 days before trial ends (Stripe setting)
            ○ Action: Send in-app notification reminding user to add payment
    Stripe Customer Metadata:
    When creating Stripe Customer, include:
    javascript
    {
  metadata: {
    pruuf_user_id: "uuid-here",
    user_phone: "+15551234567",
    user_role: "contact",
    signup_date: "2025-11-18"
  }
}
    This helps customer support lookup users in Stripe Dashboard.
    3.8 Revenue Projections & Unit Economics
    Assumptions:
        • Target: 10,000 Contacts within 12 months of launch
        • Trial conversion rate: 65%
        • Monthly churn: 5%
        • Average Members per Contact: 2.5
        • Member → Contact conversion (dual role): 30%
    Month 1:
        • 500 Contacts sign up
        • All in trial (0 revenue)
    Month 2:
        • 500 existing + 500 new = 1,000 total Contacts
        • 325 convert from trial (500 × 65%) = $971/month revenue
        • 500 still in trial
    Month 6:
        • 3,000 total Contacts (500/month growth)
        • ~1,950 paying (65% conversion, 5% churn) = $5,835/month
        • Run rate: $70,020/year
    Month 12:
        • 6,000 total Contacts
        • ~3,900 paying = $11,661/month
        • Run rate: $139,932/year
    Unit Economics:
        • Revenue per Contact: $2.99/month × 12 = $35.88/year
        • Costs per Contact: Twilio SMS ($0.02/message × ~20/month) + Supabase ($0.10/month) + Stripe (2.9% + $0.30 = $1.17/month) = ~$1.70/month
        • Gross margin: $2.99 - $1.70 = $1.29/month = 43% margin
        • LTV (18 month avg retention): $35.88 × 1.5 years = $53.82
        • Target CAC: <$15 (LTV:CAC = 3.6x)
    
    4. CORE USER FLOWS (EXHAUSTIVE DETAIL)
    4.1 Contact Onboarding Flow (Complete Journey)
    SCREEN 1: App Launch (First Time)
    Visual Layout:
        • Full-screen hero image: Elderly woman smiling at phone, warm lighting
        • Overlay gradient (dark at bottom for text contrast)
        • Headline (centered, 28pt, bold, white text): "Stay connected to loved ones with daily check-ins"
        • Subheadline (centered, 18pt, regular, white text): "30-day free trial • $2.99/month after • Cancel anytime"
        • Primary CTA button (bottom 20% of screen, 60pt height, green background, white text, rounded corners): "Get Started"
        • Secondary text link (below button, 16pt, white, 50% opacity): "Already have an account? Log in"
    Interactions:
        • Tap "Get Started" → Navigate to Phone Number Entry (Screen 2)
        • Tap "Log in" → Navigate to Login Screen (separate flow, not detailed here)
    VoiceOver:
        • "Pruuf welcome screen. Headline: Stay connected to loved ones with daily check-ins. Button: Get Started. Link: Already have an account? Log in."
    SCREEN 2: Phone Number Entry
    Visual Layout:
        • Top navigation: Back button (top-left, "<")
        • Progress indicator (top-center): "Step 1 of 6"
        • Headline (top 15%, 24pt, bold, dark text): "What's your phone number?"
        • Subheadline (below headline, 16pt, regular, gray text): "We'll send you a verification code"
        • Phone input field (center, large text field, 48pt height): 
            ○ Label above: "Phone number"
            ○ Placeholder: "(555) 123-4567"
            ○ Auto-formats as user types: (555) 123-4567
            ○ Keyboard: Numeric phone pad
        • Helper text (below field, 14pt, gray): "Standard SMS rates may apply"
        • Primary CTA (bottom safe area, 60pt, green, disabled state initially): "Continue"
        • Error state (if shown): Red text below field, "Please enter a valid phone number"
    Interactions:
        • On field focus: Keyboard appears, cursor blinks
        • As user types: Auto-format with parentheses and hyphen
        • Validation: Must be exactly 10 digits (US numbers only for MVP)
        • When valid: "Continue" button enables (green becomes saturated, bounces slightly)
        • Tap "Continue": 
            ○ Button shows loading spinner
            ○ Backend POST /api/auth/send-verification-code with phone number
            ○ Twilio sends SMS
            ○ Navigate to Code Entry (Screen 3)
        • Tap Back: Return to Welcome (Screen 1)
    Backend Action:
    javascript
    // POST /api/auth/send-verification-code
{
  phone: "+15551234567", // E.164 format
  country_code: "US"
}
    // Twilio API call
twilio.messages.create({
  body: "Your Pruuf verification code is: 582614. This code expires in 10 minutes.",
  from: process.env.TWILIO_PHONE_NUMBER, // Pruuf's Twilio number
  to: "+15551234567"
});
    // Database action
INSERT INTO verification_codes (phone, code, expires_at, created_at)
VALUES ('+15551234567', '582614', NOW() + INTERVAL '10 minutes', NOW());
    Error Handling:
        • Phone number already exists: "This number is already registered. Log in instead?"
        • Twilio API failure: "Couldn't send code. Check your number and try again."
        • Rate limiting (>3 codes in 1 hour): "Too many attempts. Try again in 30 minutes."
    SCREEN 3: Verification Code Entry
    Visual Layout:
        • Back button (top-left)
        • Progress: "Step 2 of 6"
        • Headline: "Enter the code we sent to (555) 123-4567"
        • Edit link (next to phone number): "Edit" (tappable, returns to Screen 2)
        • Six input boxes (center, side-by-side, 60pt × 60pt each, rounded corners, large text): 
            ○ Auto-focus on first box
            ○ Auto-advance on digit entry
            ○ Auto-submit when 6 digits entered
        • Resend link (below boxes): "Didn't receive code? Resend" 
            ○ Disabled for 30 seconds after initial send
            ○ Shows countdown: "Resend in 0:28"
            ○ After 30s: "Resend" becomes tappable
        • Error state: Red border on boxes, red text below: "Code didn't match. Try again."
        • Success state: Green checkmarks in boxes, auto-advance after 0.5s
    Interactions:
        • Auto-focus first box on screen load
        • User types digit → auto-advance to next box
        • Backspace → delete current digit, move to previous box
        • Paste: If user pastes "582614" from SMS app, auto-fill all six boxes
        • When 6 digits entered: 
            ○ POST /api/auth/verify-code
            ○ If valid: Navigate to Create PIN (Screen 4)
            ○ If invalid: Show error, clear boxes, re-focus first box
        • Tap "Resend": 
            ○ If <30s since last send: No action (button disabled)
            ○ If >30s: Repeat Twilio send, reset 30s timer, show toast "Code resent!"
    Backend Action:
    javascript
    // POST /api/auth/verify-code
{
  phone: "+15551234567",
  code: "582614"
}
    // Database query
SELECT * FROM verification_codes 
WHERE phone = '+15551234567' 
AND code = '582614' 
AND expires_at > NOW() 
AND used = FALSE;
    // If match found:
UPDATE verification_codes SET used = TRUE WHERE id = X;
// Generate session token, return to app
RETURN { success: true, session_token: "jwt_token_here" };
    // If no match or expired:
RETURN { success: false, error: "Code didn't match or expired" };
    Security:
        • Codes expire after 10 minutes
        • Codes cannot be reused (marked used = TRUE after verification)
        • Max 3 verification attempts before requiring new code
        • Rate limit: Max 5 codes per phone per hour
    SCREEN 4: Create PIN
    Visual Layout:
        • Back button (top-left)
        • Progress: "Step 3 of 6"
        • Headline: "Create a 4-digit PIN"
        • Subheadline: "You'll use this to log in to Pruuf"
        • Four input boxes (center, 60pt × 60pt, rounded, dark borders): 
            ○ Display: Obscured dots (not numbers) immediately on entry
            ○ Auto-focus first box
        • Helper text (below boxes): "Choose a PIN you'll remember"
        • Continue button (bottom, disabled until 4 digits entered)
    Interactions:
        • User enters 4 digits → auto-advance to Confirm PIN screen
        • Backspace: Delete current digit, move back
        • No submit button needed (auto-advances)
    SCREEN 5: Confirm PIN
    Visual Layout:
        • Back button (top-left)
        • Progress: "Step 3 of 6" (same step as Screen 4, confirmation sub-step)
        • Headline: "Confirm your PIN"
        • Four input boxes (same as Screen 4)
        • Error state: "PINs don't match. Try again." (clears both screens, returns to Screen 4)
        • Success state: Auto-advances to Font Size (Screen 6)
    Backend Action:
    javascript
    // After PIN confirmation succeeds
// POST /api/auth/create-account
{
  phone: "+15551234567",
  pin_hash: "bcrypt_hash_of_pin", // Never store raw PIN
  session_token: "jwt_from_verification"
}
    // Database action
INSERT INTO users (
  id, 
  phone, 
  pin_hash, 
  account_status, 
  trial_start_date, 
  created_at
) VALUES (
  uuid_generate_v4(),
  '+15551234567',
  '$2b$10$hashed_pin_here',
  'trial',
  NOW(),
  NOW()
);
    // Return user object
RETURN { 
  user_id: "uuid",
  account_status: "trial",
  trial_end_date: "2025-12-18T23:59:59Z"
};
    Security:
        • PIN hashed with bcrypt (cost factor 10)
        • Never store raw PIN in database or logs
        • Session token (JWT) valid for 90 days
        • After 5 failed PIN attempts: 5-minute lockout
    SCREEN 6: Font Size Selection
    Visual Layout:
        • Back button (top-left)
        • Progress: "Step 4 of 6"
        • Headline: "Choose your text size"
        • Subheadline: "You can change this anytime in Settings"
        • Preview paragraph (center, live updates): 
            ○ Text: "This is how Pruuf will look. Buttons and text will match this size."
            ○ Updates in real-time as user selects option
        • Three radio buttons (large touch targets, 60pt height each): 
            ○ ○ Standard (16pt base font)
            ○ ○ Large (20pt base font) [DEFAULT for Contacts]
            ○ ○ Extra Large (24pt base font)
        • Sample button (below preview): "I'm OK" (sized according to selection)
        • Continue button (bottom, always enabled)
    Interactions:
        • Default selection: Standard (Contacts are typically younger, better vision)
        • Tap any radio button: Preview text and button resize immediately
        • Tap Continue: Save preference, navigate to Trial Welcome (Screen 7)
    Backend Action:
    javascript
    // POST /api/users/update-preferences
{
  user_id: "uuid",
  font_size_preference: "standard" // or "large" or "extra_large"
}
    UPDATE users SET font_size_preference = 'standard' WHERE id = 'uuid';
    SCREEN 7: Trial Welcome Modal
    Visual Layout:
        • Full-screen modal (cannot dismiss without tapping button)
        • Confetti animation (subtle, 2 seconds)
        • Icon: Green checkmark in circle (60pt)
        • Headline: "Your 30-day free trial starts now!"
        • Bullet points (left-aligned, 18pt): 
            ○ "✓ Monitor unlimited loved ones"
            ○ "✓ Get instant alerts if they miss check-ins"
            ○ "✓ No credit card required during trial"
            ○ "✓ $2.99/month after trial • Cancel anytime"
        • Primary CTA (bottom, large, green): "Add Your First Member"
        • Small print (14pt, gray, centered): "By continuing, you agree to our Terms of Service and Privacy Policy"
    Interactions:
        • Tap "Add Your First Member": Dismiss modal, navigate to Add Member (Screen 8)
        • No dismiss X (must tap button to proceed)
    SCREEN 8: Add Member (Contact Permission Request)
    Visual Layout:
        • Navigation: Title "Add a Member", X button (top-right to skip this member and go to dashboard)
        • Headline: "Who would you like to check on daily?"
        • Subheadline: "We'll send them an invite to join Pruuf"
        • Two large buttons (stacked, 70pt height each): 
            ○ Button 1 (blue background): "📱 Choose from Contacts" 
                § Helper text below: "Select from your phone's contacts"
            ○ Button 2 (white background, blue border): "✏️ Enter Manually" 
                § Helper text below: "Type their name and phone number"
        • Illustration (center): Friendly graphic of elderly person with phone
    Interactions:
        • Tap "Choose from Contacts": 
            ○ Request iOS/Android contacts permission
            ○ If granted: Open native contact picker (iOS: CNContactPickerViewController, Android: ContactsContract)
            ○ User selects contact
            ○ Auto-fill Name and Phone fields
            ○ Navigate to Review Member (Screen 9)
            ○ If denied: Show alert "Allow Pruuf to access contacts in Settings to make this easier. Or enter details manually."
        • Tap "Enter Manually": Navigate to Manual Entry (Screen 8b)
        • Tap X: Navigate to Contact Dashboard (Screen 10, empty state)
    SCREEN 8b: Manual Member Entry
    Visual Layout:
        • Navigation: Back button, Title "Add a Member"
        • Form fields (vertically stacked, generous spacing): 
            ○ Label: "Member's Name"
            ○ Input: Text field, placeholder "e.g., Mom, Grandma, Aunt Sarah"
            ○ Label: "Member's Phone Number"
            ○ Input: Phone field, auto-formatting, placeholder "(555) 123-4567"
        • Helper text: "Make sure this number can receive text messages"
        • Continue button (bottom, enabled when both fields valid)
    Validation:
        • Name: At least 2 characters, letters/spaces/hyphens only
        • Phone: Exactly 10 digits, US format (for MVP)
        • Duplicate check: Query if phone already exists as Member 
            ○ If exists and connected to this Contact: "You're already monitoring [Name]"
            ○ If exists and connected to different Contact: Allow (multiple Contacts can monitor same Member)
    SCREEN 9: Review Member & Send Invite
    Visual Layout:
        • Navigation: Back button, Title "Confirm Details"
        • Review card (centered, elevated shadow): 
            ○ "You're about to invite:"
            ○ Name: [Member's Name] (24pt, bold)
            ○ Phone: (555) 123-4567 (18pt, gray)
            ○ Edit link (top-right of card): "Edit"
        • Explanation text: 
            ○ "We'll send [Name] a text message with:"
            ○ Bullet: "Instructions to download Pruuf"
            ○ Bullet: "A unique invite code to connect with you"
        • Primary button (bottom, green, 60pt): "Send Invite"
        • Secondary link (center, below button): "Skip for Now"
    Interactions:
        • Tap "Edit": Return to Screen 8b with fields pre-filled
        • Tap "Skip for Now": Save Member as pending (no SMS sent), go to Dashboard
        • Tap "Send Invite": 
            ○ Show loading state on button
            ○ Backend creates Member record, generates invite code
            ○ Twilio sends SMS
            ○ Navigate to Invite Sent Confirmation (Screen 9b)
    Backend Action:
    javascript
    // POST /api/members/invite
{
  contact_id: "contact_uuid",
  member_name: "Mom",
  member_phone: "+15559876543"
}
    // Generate unique invite code (6 alphanumeric, no confusing chars)
const code = generateCode(); // Returns e.g., "AB3X7M"
    // Database actions
INSERT INTO members (id, name, phone, created_at)
VALUES (uuid_generate_v4(), 'Mom', '+15559876543', NOW())
ON CONFLICT (phone) DO UPDATE SET name = 'Mom'; // Update name if phone exists
    INSERT INTO member_contact_relationships (
  id,
  member_id,
  contact_id,
  invite_code,
  status,
  invited_at
) VALUES (
  uuid_generate_v4(),
  member_id,
  contact_uuid,
  'AB3X7M',
  'pending',
  NOW()
);
    // Twilio SMS
twilio.messages.create({
  body: `Jennifer invited you to Pruuf, a daily check-in app that lets you reassure family with one tap.
    Download: https://pruuf.app/download
    Once installed, open the app and enter this code: AB3X7M
    Questions? Text Jennifer at (555) 123-4567`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+15559876543'
});
    // Log message
INSERT INTO sms_logs (
  to_phone,
  from_phone,
  body,
  type,
  status,
  twilio_sid,
  sent_at
) VALUES (
  '+15559876543',
  process.env.TWILIO_PHONE_NUMBER,
  'Jennifer invited you to Pruuf...',
  'member_invite',
  'sent',
  twilio_response.sid,
  NOW()
);
```
    **SCREEN 9b: Invite Sent Confirmation**
    Visual Layout:
- Success icon: Green checkmark in circle (animated, scales in)
- Headline: "Invite sent to Mom!"
- Body text: "We sent a text message to (555) 987-6543 with:"
- Bullet: "Download link for Pruuf"
- Bullet: "Invite code: AB3X7M"
- Info box (light blue background, rounded):
  - Icon: 💡
  - Text: "You might want to call Mom to let her know the text is coming and help her get set up."
- Two buttons (stacked):
  - Primary (green): "Invite Another Member"
  - Secondary (white/blue border): "Go to Dashboard"
    Interactions:
- Tap "Invite Another Member": Return to Screen 8
- Tap "Go to Dashboard": Navigate to Contact Dashboard (Screen 10)
    **SCREEN 10: Contact Dashboard (Initial State - One Pending Member)**
    Visual Layout:
- Top navigation bar:
  - Title: "Members" (centered, 20pt bold)
  - + button (top-right): Add new Member
  - Settings gear icon (top-left)
- Tab bar (bottom, 2 tabs):
  - Members (person icon, blue when active)
  - Settings (gear icon, gray when inactive)
    Main content area:
- Section header: "Your Members" (18pt, semibold, gray)
- Member card (rounded corners, shadow, white background):
  - Left side:
    - Name: "Mom" (22pt, bold, dark)
    - Status badge: "Pending Invite" (orange background, white text, rounded pill)
    - Subtext: "Invited on Nov 18, 2025" (14pt, gray)
  - Right side:
    - Action button: "Resend Invite" (blue text, tappable)
- Empty state (if no Members): 
  - Illustration (center): Friendly graphic
  - Text: "No members yet"
  - Button: "Invite Your First Member"
    Interactions:
- Tap Member card: Navigate to Member Detail (Screen 11)
- Tap "Resend Invite": Show confirmation dialog
- Tap + button: Navigate to Add Member (Screen 8)
- Tap Settings tab: Navigate to Settings screen
- Pull to refresh: Check for updates (Member may have accepted invite)
    **Resend Invite Confirmation Dialog:**
- Title: "Resend invite to Mom?"
- Body: "We'll send another text message to (555) 987-6543"
- Buttons:
  - "Cancel" (gray)
  - "Resend" (blue)
- On Resend:
  - Same Twilio SMS as original invite
  - Update `last_invited_at` timestamp
  - Show toast: "Invite sent!"
  - Prevent spam: If last sent <60 seconds ago, show "Please wait a minute before resending"
    ---
    ### 4.2 Member Onboarding Flow (Complete Journey)
    **SCREEN M1: Member Receives SMS Invite**
    SMS appears on Member's phone:
```
Jennifer invited you to Pruuf, a daily check-in app that lets you reassure family with one tap.
    Download: https://pruuf.app/download
    Once installed, open the app and enter this code: AB3X7M
    Questions? Text Jennifer at (555) 123-4567
    Member taps link → Redirects to App Store (iOS) or Google Play (Android)
    SCREEN M2: Member Downloads & Launches App
        • Member downloads Pruuf
        • Opens app for first time
        • Sees same Welcome screen as Contact (Screen 1)
        • Taps "Get Started"
    SCREEN M3-M5: Phone Verification & PIN Creation
    (Same as Contact flow, Screens 2-5)
        • Enter phone number → (+15559876543, the phone that received invite)
        • Receive verification code
        • Enter code
        • Create 4-digit PIN
        • Confirm PIN
    SCREEN M6: Member Font Size Selection
    Visual Layout:
        • Same as Contact Screen 6
        • IMPORTANT DIFFERENCE: Default selection is "Large" (not Standard) 
            ○ Members are typically elderly with vision challenges
            ○ Large text should be pre-selected
    SCREEN M7: Member Welcome (Different from Contact)
    Visual Layout:
        • Headline: "Welcome to Pruuf!"
        • Body text: "Jennifer invited you to Pruuf. She'll receive a daily notification when you check in, so she knows you're okay."
        • Info box: 
            ○ "Your job is simple:"
            ○ "1. Tap 'I'm OK' once a day"
            ○ "2. That's it!"
        • Primary button: "Continue"
    Interaction:
        • Tap Continue → Navigate to Enter Invite Code (Screen M8)
    SCREEN M8: Enter Invite Code
    Visual Layout:
        • Headline: "Enter your invite code"
        • Subheadline: "Jennifer sent this to you via text message"
        • Six input boxes (same as verification code screen)
        • Placeholder hint above boxes: "e.g., AB3X7M"
        • Helper text: "Can't find your code? Ask Jennifer to resend it."
        • Continue button (enabled after 6 characters entered)
    Interactions:
        • User types code → Auto-uppercase (AB3X7M not ab3x7m)
        • When 6 characters entered: Enable Continue button
        • Tap Continue: 
            ○ POST /api/members/accept-invite
            ○ If valid: Navigate to Set Check-in Time (Screen M9)
            ○ If invalid: Show error "Code not found. Check your text message and try again."
    Backend Action:
    javascript
    // POST /api/members/accept-invite
{
  member_phone: "+15559876543",
  invite_code: "AB3X7M"
}
    // Database query
SELECT * FROM member_contact_relationships
WHERE invite_code = 'AB3X7M'
AND status = 'pending';
    // If found:
const member_phone_from_db = await getPhoneFromMemberId(relationship.member_id);
    // Verify phone matches
if (member_phone !== member_phone_from_db) {
  RETURN { error: "This code wasn't sent to your number" };
}
    // Update relationship status
UPDATE member_contact_relationships 
SET status = 'active', connected_at = NOW()
WHERE invite_code = 'AB3X7M';
    // Update user record to mark as Member
UPDATE users 
SET is_member = TRUE, grandfathered_free = TRUE
WHERE phone = '+15559876543';
    // Send notification to Contact (Jennifer)
// Push notification: "Mom joined Pruuf!"
// Navigate to next screen
    SCREEN M9: Set Check-in Time
    Visual Layout:
        • Headline: "When should we remind Jennifer you're okay?"
        • Subheadline: "Choose a time you'll check in each day"
        • Time picker (center, large): 
            ○ Hour wheel (01-12)
            ○ Minute wheel (00-59, 5-minute increments: 00, 05, 10...)
            ○ AM/PM wheel
            ○ Default: 10:00 AM (common morning time after breakfast)
        • Helper text: "Pick a time that fits your daily routine"
        • Info box: 
            ○ Icon: 💡
            ○ "We'll send you a reminder 1 hour before (if you want)"
        • Checkbox (large, 60pt): "☐ Send me a reminder" [CHECKED by default]
        • Continue button (bottom)
    Interactions:
        • User scrolls time picker wheels
        • Checkbox toggle on/tap
        • Tap Continue → Navigate to Review & Finish (Screen M10)
    SCREEN M10: Review & Finish
    Visual Layout:
        • Headline: "You're all set!"
        • Summary card: 
            ○ "Daily check-in time: 10:00 AM PST"
            ○ "Reminder: 1 hour before (9:00 AM)" [if enabled]
            ○ "Jennifer will be notified if you don't check in by 10:00 AM"
        • Info box: 
            ○ "You can change your check-in time anytime in Settings"
        • Primary button (large, green): "Take Me to My Dashboard"
    Interactions:
        • Tap button → Navigate to Member Dashboard (Screen M11)
    Backend Action:
    javascript
    // POST /api/members/complete-onboarding
{
  member_id: "uuid",
  check_in_time: "10:00",
  timezone: "America/Los_Angeles", // Detected from device
  reminder_enabled: true
}
    UPDATE members SET
  check_in_time = '10:00:00',
  timezone = 'America/Los_Angeles',
  reminder_enabled = TRUE,
  onboarding_completed = TRUE,
  onboarding_completed_at = NOW()
WHERE id = 'uuid';
    // Schedule local notification (iOS/Android)
scheduleLocalNotification({
  title: "Time for your Pruuf check-in",
  body: "Tap to let Jennifer know you're okay",
  time: "09:00", // 1 hour before check-in
  repeat: "daily",
  identifier: "member_reminder_uuid"
});
    SCREEN M11: Member Dashboard (Initial State)
    Visual Layout:
        • Top banner (blue background, white text, rounded): 
            ○ "Next check-in: Today at 10:00 AM PST"
            ○ Countdown: "in 2 hours 34 minutes" (updates every minute)
            ○ Timezone badge: "PST" (pill shape)
        • Main content (center): 
            ○ Giant "I'm OK" button (fills most of screen): 
                § 80% screen width
                § 120pt height
                § Green background (#4CAF50)
                § White text, 32pt bold
                § Rounded corners (16pt radius)
                § Subtle shadow
                § Breathing animation (gentle scale 1.0 → 1.02 → 1.0, 3-second loop)
            ○ VoiceOver: "I'm OK button. Double tap to confirm you're okay today."
        • Bottom section: 
            ○ "Your Contacts" label (16pt, gray)
            ○ Contact card (rounded, white background): 
                § Name: "Jennifer" (18pt, bold)
                § Phone: "(...4567)" (14pt, gray, masked)
                § Status: "Active" (green dot)
                § Two buttons (side by side, 50% width each): 
                    □ "Call" (phone icon, blue)
                    □ "Text" (message icon, blue)
        • Tab bar (bottom): 
            ○ Dashboard (home icon, active)
            ○ Contacts (person icon)
            ○ Settings (gear icon)
    Interactions:
        • Tap "I'm OK" button: 
            ○ Haptic feedback (medium impact)
            ○ Button animates (scale down then up)
            ○ POST /api/check-ins/create
            ○ Show success modal (Screen M12)
        • Tap "Call" on Contact card: Open native phone app with Jennifer's number pre-dialed
        • Tap "Text": Open native SMS app with Jennifer's number in recipient field
        • Tap Contacts tab: Navigate to Contacts List (Screen M13)
        • Tap Settings tab: Navigate to Settings (Screen M14)
    Backend Action (Check-in):
    javascript
    // POST /api/check-ins/create
{
  member_id: "uuid",
  checked_in_at: NOW(),
  timezone: "America/Los_Angeles"
}
    // Prevent duplicate check-ins same day
const existingToday = await db.query(`
  SELECT * FROM check_ins 
  WHERE member_id = $1 
  AND DATE(checked_in_at AT TIME ZONE $2) = CURRENT_DATE
`, [member_id, timezone]);
    if (existingToday.length > 0) {
  // Update existing check-in to latest time
  UPDATE check_ins SET checked_in_at = NOW() WHERE id = existingToday[0].id;
=======
```

---

## PART IV: BUSINESS MODEL & PRICING LOGIC

### 4.1 Pricing Structure

**Single Tier Model:**
- **Monthly Price:** $3.99 USD per month
- **Annual Price:** $29 USD per year (39% savings vs monthly)
- **Billing Cycle:** Monthly (every 30 days) or Annual (every 365 days)
- **Payment Method:** Credit/debit card via Stripe
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
| Active Paid | `active` | Paying subscription active via Stripe |
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
if (user.stripe_subscription_id && subscription.status === 'active') {
  // User already paid, continue service
  user.account_status = 'active';
} else if (user.is_member || user.grandfathered_free) {
  // User is Member or grandfathered, no payment required
  user.account_status = 'active_free';
>>>>>>> Stashed changes
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
9. At Dec 15, Stripe webhook fires, system checks `grandfathered_free`
10. Subscription set to `cancel_at_period_end = true`, does NOT renew
11. Jennifer receives notification: "Great news! Since you're now a Pruuf Member, you'll never pay again. You can continue monitoring others for free, forever."
12. `stripe_subscription_id = NULL`, `account_status = 'active_free'`

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

  -- Stripe integration
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  last_payment_date TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
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
<<<<<<< Updated upstream
    Validation:
- Phone must be valid E.164 format
- Country code must be supported (US only for MVP)
- Rate limit: Max 5 codes per phone per hour
    Process:
1. Check if phone already registered (return error if exists)
2. Generate 6-digit code (random, 000000-999999)
3. Store in `verification_codes` table with 10-minute expiry
4. Send SMS via Twilio
5. Log in `sms_logs` table
    Response (Success):
```json
{
  "success": true,
  "message": "Code sent to (555) 123-4567",
  "code_expires_at": "2025-11-18T10:15:00Z"
}
```
    Response (Error - Already Registered):
```json
{
  "success": false,
  "error": "PHONE_ALREADY_REGISTERED",
  "message": "This number is already registered. Try logging in instead."
}
```
    Response (Error - Rate Limited):
```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many attempts. Try again in 30 minutes.",
  "retry_after": 1800
}
```
    ---
    **POST /api/auth/verify-code**
    Purpose: Verify SMS code and return session token
    Request:
```json
{
  "phone": "+15551234567",
  "code": "582614"
}
```
    Validation:
- Code must be 6 digits
- Code must exist in database
- Code must not be expired
- Code must not be used already
- Max 3 verification attempts before requiring new code
    Process:
1. Query `verification_codes` WHERE phone = X AND code = Y AND expires_at > NOW() AND used = FALSE
2. If no match: Increment attempts, return error
3. If match: Mark code as used, generate session token
4. If attempts >= 3: Require new code ("Too many wrong attempts. Request new code.")
    Response (Success):
```json
{
  "success": true,
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2026-02-18T10:00:00Z"
}
```
    Response (Error - Invalid Code):
```json
{
  "success": false,
  "error": "INVALID_CODE",
  "message": "Code didn't match. Try again.",
  "attempts_remaining": 2
}
```
    Response (Error - Expired Code):
```json
{
  "success": false,
  "error": "CODE_EXPIRED",
  "message": "This code expired. Request a new one."
}
```
    ---
    **POST /api/auth/create-account**
    Purpose: Create new user account after verification
    Request:
```json
{
  "phone": "+15551234567",
  "pin": "1234",
  "pin_confirmation": "1234",
  "session_token": "token_from_verification"
}
```
    Validation:
- PIN must be exactly 4 digits
- PIN and confirmation must match
- Session token must be valid (from verification step)
- Phone must not already have account
    Process:
1. Verify session token corresponds to phone
2. Hash PIN with bcrypt (cost 10)
3. Create Supabase auth user
4. Insert into `users` table
5. Set trial dates (start: now, end: now + 30 days)
6. Generate new session token (JWT)
7. Log in `audit_logs`
    Response (Success):
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "phone": "+15551234567",
    "account_status": "trial",
    "trial_end_date": "2025-12-18T23:59:59Z",
    "is_member": false,
    "font_size_preference": "standard"
  },
  "access_token": "jwt_token_here"
}
```
    Response (Error - PINs Don't Match):
```json
{
  "success": false,
  "error": "PINS_DONT_MATCH",
  "message": "PINs don't match. Try again."
}
```
    ---
    **POST /api/auth/login**
    Purpose: Log in existing user with phone + PIN
    Request:
```json
{
  "phone": "+15551234567",
  "pin": "1234"
}
```
    Validation:
- Phone must exist in database
- PIN must match hashed PIN
- Account must not be deleted
    Process:
1. Query user by phone
2. Check if locked out (failed attempts >= 5)
3. Compare PIN with bcrypt
4. If match: Reset failed attempts, generate session token
5. If no match: Increment failed attempts, lock after 5 attempts
6. Log in `audit_logs`
    Response (Success):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "phone": "+15551234567",
    "account_status": "active",
    "is_member": false,
    "grandfathered_free": false,
    "font_size_preference": "large"
  },
  "access_token": "jwt_token"
}
```
    Response (Error - Incorrect PIN):
```json
{
  "success": false,
  "error": "INCORRECT_PIN",
  "message": "Incorrect PIN. Try again.",
  "attempts_remaining": 3
}
```
    Response (Error - Account Locked):
```json
{
  "success": false,
  "error": "ACCOUNT_LOCKED",
  "message": "Too many failed attempts. Try again in 5 minutes.",
  "locked_until": "2025-11-18T10:20:00Z"
}
```
    ---
    **POST /api/auth/forgot-pin**
    Purpose: Initiate PIN reset via SMS verification
    Request:
```json
{
  "phone": "+15551234567"
}
```
    Process:
1. Verify phone exists in database
2. Generate 6-digit verification code
3. Send SMS via Twilio
4. Return success (same response regardless of whether phone exists, to prevent enumeration)
    Response:
```json
{
  "success": true,
  "message": "If this number is registered, we sent a verification code."
}
```
    ---
    **POST /api/auth/reset-pin**
    Purpose: Reset PIN after verification code confirmed
    Request:
```json
{
  "phone": "+15551234567",
  "verification_code": "582614",
  "new_pin": "5678",
  "new_pin_confirmation": "5678"
}
```
    Validation:
- Verification code must be valid (same logic as signup)
- New PIN must be 4 digits
- Confirmation must match
    Process:
1. Verify code (same as signup verification)
2. Hash new PIN
3. Update `users.pin_hash`
4. Invalidate all existing session tokens (force re-login)
5. Log in `audit_logs` (action: 'pin_reset')
    Response (Success):
```json
{
  "success": true,
  "message": "PIN updated successfully. Please log in with your new PIN."
}
```
    ---
    **MEMBER ENDPOINTS**
    ---
    **POST /api/members/invite**
    Purpose: Contact invites a Member to join Pruuf
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "member_name": "Mom",
  "member_phone": "+15559876543"
}
```
    Validation:
- Contact must be authenticated
- Phone must be valid E.164 format
- Name must be 2-255 characters
    Authorization:
- Contact account must be active (not frozen/canceled)
- Exception: If Contact is grandfathered free, allow even if no payment
    Process:
1. Check if Member already exists (by phone)
   - If exists: Check if Contact already connected
   - If already connected: Return error "You're already monitoring this person"
   - If exists but not connected: Create new relationship
   - If doesn't exist: Create Member user record
2. Generate unique 6-character invite code
3. Create `member_contact_relationships` record (status: 'pending')
4. Send SMS via Twilio
5. Log in `sms_logs`
6. Return success
    Twilio SMS Template:
    {contact_name} invited you to Pruuf, a daily check-in app that lets you reassure family with one tap.
    Download: https://pruuf.app/download
    Once installed, open the app and enter this code: {invite_code}
    Questions? Text {contact_name} at {contact_phone}
    
Response (Success):
```json
{
  "success": true,
  "member": {
    "id": "member_uuid",
    "name": "Mom",
    "phone": "+15559876543",
    "status": "pending",
    "invite_code": "AB3X7M",
    "invited_at": "2025-11-18T10:00:00Z"
  },
  "message": "Invite sent to Mom"
}
```
    Response (Error - Account Frozen):
```json
{
  "success": false,
  "error": "ACCOUNT_FROZEN",
  "message": "Add payment to continue inviting members.",
  "action_required": "add_payment"
}
```
    Response (Error - Already Connected):
```json
{
  "success": false,
  "error": "ALREADY_CONNECTED",
  "message": "You're already monitoring Mom."
}
```
    ---
    **POST /api/members/accept-invite**
    Purpose: Member accepts invite code and connects to Contact
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "invite_code": "AB3X7M"
}
```
    Validation:
- Member must be authenticated
- Invite code must exist
- Invite code must be pending (not already accepted)
- Member's phone must match phone associated with invite
    Process:
1. Query `member_contact_relationships` WHERE invite_code = X AND status = 'pending'
2. Verify member_phone matches authenticated user's phone
3. Update relationship status to 'active', set connected_at = NOW()
4. Update `users.is_member = TRUE` and `grandfathered_free = TRUE`
5. If user has active Stripe subscription (was Contact-only), schedule cancellation at end of billing period
6. Send push notification to Contact: "{member_name} joined Pruuf!"
7. Return success with Contact details
    Response (Success):
```json
{
  "success": true,
  "relationship": {
    "id": "relationship_uuid",
    "contact": {
      "id": "contact_uuid",
      "name": "Jennifer",
      "phone": "+15551234567"
    },
    "connected_at": "2025-11-18T10:05:00Z"
  },
  "message": "You're now connected to Jennifer!",
  "grandfathered_free": true
}
```
    Response (Error - Invalid Code):
```json
{
  "success": false,
  "error": "INVALID_CODE",
  "message": "Code not found. Check your text message and try again."
}
```
    Response (Error - Wrong Phone):
```json
{
  "success": false,
  "error": "WRONG_PHONE",
  "message": "This code wasn't sent to your phone number."
}
```
    ---
    **POST /api/members/:memberId/check-in**
    Purpose: Member checks in for the day
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "timezone": "America/Los_Angeles"
}
```
    Validation:
- Member must be authenticated
- Member must own this memberId (authorization check)
- Timezone must be valid IANA timezone
    Process:
1. Check if Member already checked in today (same calendar day in their timezone)
2. If yes: Update existing check-in timestamp (allows multiple check-ins, latest wins)
3. If no: Create new check-in record
4. Get all active Contacts for this Member
5. Send confirmation SMS to each Contact
6. Send push notification to each Contact
7. Cancel any scheduled missed check-in alerts for today
8. Return success
    Twilio SMS Template (to Contacts):
    {member_name} checked in at {time} {timezone}. All is well!
    
If check-in is LATE (after deadline):
    Update: {member_name} checked in at {time} {timezone} ({minutes} min late). All is well!
    
Response (Success):
```json
{
  "success": true,
  "check_in": {
    "id": "checkin_uuid",
    "checked_in_at": "2025-11-18T10:05:00Z",
    "timezone": "America/Los_Angeles",
    "local_time": "10:05 AM PST"
  },
  "status": "on_time",
  "message": "Great job! You checked in for today.",
  "notifications_sent": 2
}
```
    Response (Success - Late Check-in):
```json
{
  "success": true,
  "check_in": {
    "id": "checkin_uuid",
    "checked_in_at": "2025-11-18T10:15:00Z",
    "timezone": "America/Los_Angeles",
    "local_time": "10:15 AM PST"
  },
  "status": "late",
  "minutes_late": 15,
  "message": "You checked in 15 minutes late. Your contacts have been notified.",
  "notifications_sent": 2
}
```
    ---
    **PATCH /api/members/:memberId/check-in-time**
    Purpose: Member updates their daily check-in time
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "check_in_time": "14:00", // 24-hour format
  "timezone": "America/New_York"
}
```
    Validation:
- Member must be authenticated and own this memberId
- Time must be valid 24-hour format (00:00 - 23:59)
- Timezone must be valid IANA timezone
    Process:
1. Update `members.check_in_time` and `members.timezone`
2. Get all active Contacts
3. Send SMS notification to each Contact
4. Update scheduled local notification (if reminder enabled)
5. Log in `audit_logs` (action: 'check_in_time_changed')
    Twilio SMS Template (to Contacts):
    {member_name} updated their check-in time to {time} {timezone} (was {old_time} {old_timezone}).
    You'll now receive alerts if they don't check in by {time} {timezone}.
    
Response (Success):
```json
{
  "success": true,
  "member": {
    "id": "member_uuid",
    "check_in_time": "14:00",
    "timezone": "America/New_York",
    "formatted_time": "2:00 PM EST"
  },
  "message": "Check-in time updated. Your contacts have been notified.",
  "notifications_sent": 2
}
```
    ---
    **GET /api/members/:memberId/contacts**
    Purpose: Member views list of Contacts monitoring them
    Headers:
    Authorization: Bearer {access_token}
    
Response (Success):
```json
{
  "success": true,
  "contacts": [
    {
      "id": "relationship_uuid",
      "contact": {
        "id": "contact_uuid",
        "name": "Jennifer",
        "phone": "+15551234567",
        "phone_masked": "(555) ...4567"
      },
      "status": "active",
      "connected_at": "2025-11-18T10:00:00Z"
    },
    {
      "id": "relationship_uuid_2",
      "contact": {
        "id": "contact_uuid_2",
        "name": "Michael",
        "phone": "+15559876543",
        "phone_masked": "(555) ...6543"
      },
      "status": "pending",
      "invited_at": "2025-11-18T10:30:00Z",
      "last_invite_sent_at": "2025-11-18T10:30:00Z"
    }
  ],
  "total_active": 1,
  "total_pending": 1
}
```
    ---
    **CONTACT ENDPOINTS**
    ---
    **GET /api/contacts/me/members**
    Purpose: Contact views all Members they monitor
    Headers:
    Authorization: Bearer {access_token}
    
Query Parameters:
- `status` (optional): Filter by status ('active', 'pending', 'all'). Default: 'all'
    Response (Success):
```json
{
  "success": true,
  "members": [
    {
      "id": "member_uuid",
      "name": "Mom",
      "phone": "+15559876543",
      "phone_masked": "(555) ...6543",
      "status": "active",
      "check_in_time": "10:00",
      "timezone": "America/Los_Angeles",
      "formatted_time": "10:00 AM PST",
      "last_check_in": {
        "checked_in_at": "2025-11-18T10:05:00Z",
        "local_time": "10:05 AM PST",
        "minutes_early": -5
      },
      "next_deadline": "2025-11-19T10:00:00-08:00",
      "connected_at": "2025-11-15T09:00:00Z"
    },
    {
      "id": "member_uuid_2",
      "name": "Dad",
      "phone": "+15551112222",
      "phone_masked": "(555) ...2222",
      "status": "pending",
      "invite_code": "XY9K3M",
      "invited_at": "2025-11-18T11:00:00Z",
      "last_invite_sent_at": "2025-11-18T11:00:00Z"
    }
  ],
  "total_active": 1,
  "total_pending": 1,
  "account_status": "active"
}
```
    ---
    **POST /api/contacts/resend-invite**
    Purpose: Contact resends invite to pending Member
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "relationship_id": "relationship_uuid"
}
```
    Validation:
- Relationship must exist and belong to authenticated Contact
- Relationship status must be 'pending'
- Rate limit: Cannot resend if last sent <60 seconds ago
    Process:
1. Verify relationship ownership
2. Check rate limit
3. Send SMS via Twilio (same template as original invite)
4. Update `last_invite_sent_at` timestamp
5. Log in `sms_logs`
    Response (Success):
```json
{
  "success": true,
  "message": "Invite resent to Mom",
  "sent_at": "2025-11-18T12:00:00Z"
}
```
    Response (Error - Rate Limited):
```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Please wait 45 seconds before resending.",
  "retry_after": 45
}
```
    ---
    **DELETE /api/contacts/relationship/:relationshipId**
    Purpose: Contact removes a Member (stops monitoring them)
    Headers:
    Authorization: Bearer {access_token}
    
Validation:
- Relationship must exist and belong to authenticated Contact
- Relationship status must be 'active' (can't remove pending)
    Process:
1. Update relationship status to 'removed', set removed_at = NOW()
2. Check if Member has any other active Contacts
3. If no other active Contacts: Set `users.is_member = FALSE` (but keep grandfathered_free = TRUE)
4. Send SMS to Member notifying of removal
5. Log in `audit_logs`
    Twilio SMS Template (to Member):
    {contact_name} removed you from their Pruuf safety contacts. If you have questions, please contact them directly.
    
Response (Success):
```json
{
  "success": true,
  "message": "You're no longer monitoring Mom."
}
```
    ---
    **PAYMENT ENDPOINTS**
    ---
    **POST /api/payments/create-subscription**
    Purpose: Contact adds payment method and creates Stripe subscription
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "payment_method_id": "pm_xxxxx" // Stripe Payment Method ID (from Stripe Elements)
}
```
    Validation:
- User must be authenticated
- User must be a Contact (has at least one Member relationship)
- User must not already have active subscription
- User account must not be 'active_free' (Members/grandfathered never pay)
    Process:
1. Check if user requires payment (query function `requires_payment(user_id)`)
2. If requires_payment = FALSE: Return error "You don't need to pay"
3. Create Stripe Customer (if doesn't exist)
4. Attach Payment Method to Customer
5. Set as default payment method
6. Create Stripe Subscription:
   - Product: "Pruuf Contact Subscription"
   - Price: $2.99/month
   - Trial: If user is still in trial period, set trial_end to user's trial_end_date
7. Save `stripe_customer_id` and `stripe_subscription_id` to `users` table
8. Update `account_status` to 'active'
9. Send confirmation email (receipt)
10. Log in `audit_logs`
    Stripe API Call:
```javascript
const customer = await stripe.customers.create({
  payment_method: payment_method_id,
  phone: user.phone,
  invoice_settings: { default_payment_method: payment_method_id },
  metadata: {
    pruuf_user_id: user.id,
    pruuf_phone: user.phone
  }
});
    const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: process.env.STRIPE_PRICE_ID }], // $2.99/month price
  trial_end: user.trial_end_date ? Math.floor(new Date(user.trial_end_date).getTime() / 1000) : 'now',
  expand: ['latest_invoice.payment_intent']
});
```
    Response (Success):
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxx",
    "status": "active",
    "current_period_end": "2025-12-18T23:59:59Z",
    "price": "$2.99/month"
  },
  "message": "Payment added! You're all set.",
  "account_status": "active"
}
```
    Response (Error - No Payment Required):
```json
{
  "success": false,
  "error": "NO_PAYMENT_REQUIRED",
  "message": "You don't need to pay. You're a Pruuf Member, so monitoring others is free!"
}
```
    ---
    **POST /api/payments/update-payment-method**
    Purpose: Contact updates credit card on file
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "payment_method_id": "pm_new_card_xxxxx"
}
```
    Process:
1. Verify user has Stripe customer
2. Attach new payment method
3. Update subscription's default payment method
4. Detach old payment method
5. Log in `audit_logs`
    Response (Success):
```json
{
  "success": true,
  "message": "Payment method updated successfully."
}
```
    ---
    **POST /api/payments/cancel-subscription**
    Purpose: Contact cancels their subscription
    Headers:
    Authorization: Bearer {access_token}
    
Request:
```json
{
  "reason": "Too expensive" // Optional feedback
}
```
    Process:
1. Update Stripe subscription: Set `cancel_at_period_end = true`
2. User retains access until current period ends
3. Update `users.account_status` to 'canceled' (will become 'frozen' at period end)
4. Send confirmation email
5. Schedule job to freeze account at period end
6. Log in `audit_logs`
    Stripe API Call:
```javascript
await stripe.subscriptions.update(user.stripe_subscription_id, {
  cancel_at_period_end: true
});
```
    Response (Success):
```json
{
  "success": true,
  "message": "Subscription canceled. You'll retain access until Dec 18, 2025.",
  "access_until": "2025-12-18T23:59:59Z"
}
```
    ---
    **POST /api/payments/reactivate-subscription**
    Purpose: Contact reactivates canceled subscription (before period ends)
    Headers:
    Authorization: Bearer {access_token}
    
Process:
1. Update Stripe subscription: Set `cancel_at_period_end = false`
2. Update `account_status` back to 'active'
3. Log in `audit_logs`
    Response (Success):
```json
{
  "success": true,
  "message": "Subscription reactivated. You won't be charged again until Dec 18.",
  "next_billing_date": "2025-12-18T23:59:59Z"
}
```
    ---
    **WEBHOOK ENDPOINTS**
    ---
    **POST /api/stripe-webhooks/webhook**
    Purpose: Receive Stripe webhook events
    Headers:
    Stripe-Signature: {signature}
    
Request: Raw Stripe webhook payload
    Validation:
- Verify Stripe signature using webhook secret
- Only process events from Stripe (security)
    Events to Handle:
    **1. customer.subscription.created**
```javascript
// User just subscribed
const subscription = event.data.object;
await updateUserSubscription(subscription.customer, subscription.id, 'active');
```
    **2. customer.subscription.updated**
```javascript
// Subscription status changed (active → past_due, etc.)
const subscription = event.data.object;
await updateUserAccountStatus(subscription.customer, subscription.status);
    // If subscription canceled at period end, schedule freeze job
if (subscription.cancel_at_period_end) {
  await scheduleAccountFreeze(subscription.customer, subscription.current_period_end);
}
```
    **3. customer.subscription.deleted**
```javascript
// Subscription fully canceled or expired
const subscription = event.data.object;
await freezeUserAccount(subscription.customer);
```
    **4. invoice.payment_succeeded**
```javascript
// Monthly payment succeeded
const invoice = event.data.object;
await logPayment(invoice.customer, invoice.amount_paid, 'succeeded');
await sendReceiptEmail(invoice.customer, invoice);
```
    **5. invoice.payment_failed**
```javascript
// Monthly payment failed (card declined, etc.)
const invoice = event.data.object;
await updateAccountStatus(invoice.customer, 'past_due');
await sendPaymentFailedNotification(invoice.customer);
await startGracePeriod(invoice.customer, 3); // 3-day grace period
```
    **6. customer.subscription.trial_will_end**
```javascript
// Trial ending in 3 days (Stripe default)
const subscription = event.data.object;
await sendTrialEndingNotification(subscription.customer);
```
    Response:
```json
{
  "received": true
}
```
    ---
    **POST /api/twilio-webhooks/sms-status**
    Purpose: Receive Twilio delivery status updates for SMS
    Request (from Twilio):
    MessageSid=SMxxxxxx MessageStatus=delivered To=+15551234567 From=+15559999999
    
Process:
1. Find SMS log by `twilio_sid`
2. Update `status` field ('delivered', 'failed', 'undelivered')
3. If failed: Log error_message
    Response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```
    ---
    ### 7.4 Background Jobs (Scheduled Tasks)
    **Job: Check Missed Check-ins**
    Schedule: Every minute (cron: `* * * * *`)
    Pseudocode:
```javascript
async function checkMissedCheckIns() {
  // Get current time
  const now = moment();
  
  // Query all Members whose deadline just passed
  const members = await db.query(`
    SELECT m.*, u.phone, u.id as user_id
    FROM members m
    JOIN users u ON m.user_id = u.id
    WHERE m.onboarding_completed = TRUE
    AND (
      -- Convert check-in time to UTC and compare with current UTC time
      (CURRENT_TIME AT TIME ZONE m.timezone) >= m.check_in_time
    )
    AND NOT EXISTS (
      -- No check-in today
      SELECT 1 FROM check_ins c
      WHERE c.member_id = u.id
      AND DATE(c.checked_in_at AT TIME ZONE m.timezone) = CURRENT_DATE
    )
    AND NOT EXISTS (
      -- No alert sent today yet
      SELECT 1 FROM missed_check_in_alerts a
      WHERE a.member_id = u.id
      AND DATE(a.sent_at) = CURRENT_DATE
    )
  `);
  
  for (const member of members) {
    // Only send alert if deadline was within last 5 minutes (prevents duplicate alerts)
    const deadlineTime = moment.tz(member.check_in_time, 'HH:mm:ss', member.timezone);
    const minutesSinceDeadline = now.diff(deadlineTime, 'minutes');
    
    if (minutesSinceDeadline >= 0 && minutesSinceDeadline < 5) {
      await sendMissedCheckInAlerts(member);
    }
  }
}
```
    **Job: Process Trial Expirations**
    Schedule: Daily at midnight UTC (cron: `0 0 * * *`)
    Pseudocode:
```javascript
async function processTrialExpirations() {
  // Get all users whose trial ends today
  const users = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'trial'
    AND DATE(trial_end_date) = CURRENT_DATE
  `);
  
  for (const user of users) {
    // Check if requires payment
    const needsPayment = await requiresPayment(user.id);
    
    if (!needsPayment) {
      // User is Member or grandfathered, no payment needed
      await db.query(`
        UPDATE users SET account_status = 'active_free'
        WHERE id = $1
      `, [user.id]);
      continue;
    }
    
    // Check if has payment method
    if (user.stripe_subscription_id) {
      // Has subscription, mark active
      await db.query(`
        UPDATE users SET account_status = 'active'
        WHERE id = $1
      `, [user.id]);
    } else {
      // No payment, freeze account
      await db.query(`
        UPDATE users SET account_status = 'frozen'
        WHERE id = $1
      `, [user.id]);
      
      // Send notification
      await sendInAppNotification(user.id, {
        title: 'Trial ended',
        body: 'Add payment to continue receiving alerts.',
        type: 'trial_ended',
        action_url: '/settings/payment'
      });
    }
  }
}
```
    **Job: Send Trial Reminders**
    Schedule: Daily at 10 AM user's local time (complex scheduling)
    Pseudocode:
```javascript
async function sendTrialReminders() {
  const now = moment();
  
  // 15-day reminder (halfway through trial)
  const users15Days = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'trial'
    AND DATE(trial_end_date) = CURRENT_DATE + INTERVAL '15 days'
  `);
  
  for (const user of users15Days) {
    await sendInAppNotification(user.id, {
      title: 'You're halfway through your free trial',
      body: '15 days left. Enjoying Pruuf?',
      type: 'trial_reminder_15'
    });
  }
  
  // 7-day reminder
  const users7Days = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'trial'
    AND DATE(trial_end_date) = CURRENT_DATE + INTERVAL '7 days'
  `);
  
  for (const user of users7Days) {
    await sendInAppNotification(user.id, {
      title: '7 days left in your free trial',
      body: 'Add payment now to avoid interruption.',
      type: 'trial_reminder_7',
      action_url: '/settings/payment'
    });
  }
  
  // 1-day reminder
  const users1Day = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'trial'
    AND DATE(trial_end_date) = CURRENT_DATE + INTERVAL '1 day'
  `);
  
  for (const user of users1Day) {
    await sendInAppNotification(user.id, {
      title: 'Your trial ends tomorrow',
      body: 'Add payment to keep monitoring loved ones.',
      type: 'trial_reminder_1',
      action_url: '/settings/payment'
    });
  }
}
```
    **Job: Monthly "Invite More Contacts" Nudge (for Members)**
    Schedule: Monthly on anniversary of onboarding (complex scheduling)
    Pseudocode:
```javascript
async function sendMonthlyInviteNudge() {
  // Get Members who completed onboarding exactly 1, 2, 3... months ago
  const members = await db.query(`
    SELECT m.*, u.id as user_id
    FROM members m
    JOIN users u ON m.user_id = u.id
    WHERE m.onboarding_completed = TRUE
    AND DATE_PART('day', m.onboarding_completed_at) = DATE_PART('day', CURRENT_DATE)
    AND DATE_PART('month', m.onboarding_completed_at) != DATE_PART('month', CURRENT_DATE)
  `);
  
  for (const member of members) {
    // Check how many active Contacts they have
    const contactCount = await db.query(`
      SELECT COUNT(*) FROM member_contact_relationships
      WHERE member_id = $1 AND status = 'active'
    `, [member.user_id]);
    
    if (contactCount.rows[0].count < 3) {
      // Encourage adding more Contacts
      await sendInAppNotification(member.user_id, {
        title: 'Strengthen your safety net',
        body: 'Add more family members to your Pruuf contacts.',
        type: 'invite_nudge_monthly',
        action_url: '/contacts/invite'
      });
    }
  }
}
```
    **Job: Grace Period Expiration (Payment Failed → Frozen)**
    Schedule: Every hour (cron: `0 * * * *`)
    Pseudocode:
```javascript
async function processGracePeriodExpirations() {
  // Get users past_due for >3 days
  const users = await db.query(`
    SELECT * FROM users
    WHERE account_status = 'past_due'
    AND last_payment_date < NOW() - INTERVAL '3 days'
  `);
  
  for (const user of users) {
    // Freeze account
    await db.query(`
      UPDATE users SET account_status = 'frozen'
      WHERE id = $1
    `, [user.id]);
    
    // Send notification
    await sendInAppNotification(user.id, {
      title: 'Account frozen',
      body: 'Update payment to continue service.',
      type: 'account_frozen',
      action_url: '/settings/payment'
    });
    
    await sendSMS(user.phone, 
      'Your Pruuf account is frozen due to payment failure. Update payment to continue: https://pruuf.app/payment'
    );
  }
}
```
    ---
    ## 8. STRIPE PAYMENT INTEGRATION (COMPLETE IMPLEMENTATION)
    ### 8.1 Stripe Configuration
    **Products & Prices:**
    In Stripe Dashboard:
1. Create Product:
   - Name: "Pruuf Contact Subscription"
   - Description: "Monthly subscription for monitoring unlimited Members"
   - Statement Descriptor: "PRUUF MONTHLY"
   
2. Create Price:
   - Product: "Pruuf Contact Subscription"
   - Pricing Model: Standard pricing
   - Price: $2.99 USD
   - Billing Period: Monthly
   - Usage Type: Licensed
   - Price ID: `price_xxxxxxxxxxxxx` (save to environment variable)
    **Webhook Configuration:**
    1. Create Webhook Endpoint:
   - URL: `https://api.pruuf.app/api/stripe-webhooks/webhook`
   - Events to send:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
     - invoice.payment_failed
     - customer.subscription.trial_will_end
   
2. Save Webhook Secret: `whsec_xxxxxxxxxxxxx` (environment variable)
    **API Keys:**
    - Publishable Key: `pk_live_xxxxx` (frontend, safe to expose)
- Secret Key: `sk_live_xxxxx` (backend only, never expose)
    ### 8.2 Frontend Integration (React Native)
    **Install Stripe SDK:**
```bash
npm install @stripe/stripe-react-native
```
    **Initialize Stripe:**
```javascript
// App.js
import { StripeProvider } from '@stripe/stripe-react-native';
    export default function App() {
  return (
    <StripeProvider publishableKey="pk_live_xxxxx">
      <NavigationContainer>
        {/* App content */}
      </NavigationContainer>
    </StripeProvider>
  );
}
```
    **Payment Method Collection Screen:**
```javascript
// screens/PaymentMethodScreen.js
import { CardField, useStripe } from '@stripe/stripe-react-native';
    export default function PaymentMethodScreen() {
  const { createPaymentMethod } = useStripe();
  const [loading, setLoading] = useState(false);
  
  const handleAddPayment = async () => {
    setLoading(true);
    
    try {
      // Create Payment Method with Stripe
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          // Card data collected by CardField component
        }
      });
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      
      // Send Payment Method ID to backend
      const response = await fetch('https://api.pruuf.app/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Payment added! You\'re all set.');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message);
      }
      
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Payment Method</Text>
      <Text style={styles.subtitle}>
        You'll be charged $2.99/month after your trial ends
      </Text>
      
      <CardField
        postalCodeEnabled={true}
        placeholder={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={{
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 30,
        }}
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleAddPayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Add Card'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.secureText}>
        🔒 Secure payment via Stripe
      </Text>
    </View>
  );
}
```
    ### 8.3 Backend Subscription Management
    **Create Subscription Endpoint:**
```javascript
// POST /api/payments/create-subscription
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    app.post('/api/payments/create-subscription', async (req, res) => {
  const { payment_method_id } = req.body;
  const user = req.user; // From auth middleware
  
  try {
    // Check if user requires payment
    const needsPayment = await requiresPayment(user.id);
    
    if (!needsPayment) {
      return res.status(400).json({
        success: false,
        error: 'NO_PAYMENT_REQUIRED',
        message: 'You don\'t need to pay. You\'re a Pruuf Member, so monitoring is free!'
      });
    }
    
    // Create or retrieve Stripe Customer
    let customer;
    if (user.stripe_customer_id) {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        payment_method: payment_method_id,
        phone: user.phone,
        invoice_settings: {
          default_payment_method: payment_method_id
        },
        metadata: {
          pruuf_user_id: user.id,
          pruuf_phone: user.phone
        }
      });
      
      // Save Customer ID
      await supabase.from('users').update({
        stripe_customer_id: customer.id
      }).eq('id', user.id);
    }
    
    // Attach Payment Method if customer already existed
    if (user.stripe_customer_id) {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customer.id
      });
      
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: payment_method_id
        }
      });
    }
    
    // Calculate trial end (if still in trial)
    let trialEnd = 'now'; // Immediate charge by default
    
    if (user.account_status === 'trial' && user.trial_end_date) {
      const trialEndDate = new Date(user.trial_end_date);
      if (trialEndDate > new Date()) {
        // Still in trial, extend subscription trial to match
        trialEnd = Math.floor(trialEndDate.getTime() / 1000);
      }
    }
    
    // Create Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: process.env.STRIPE_PRICE_ID // $2.99/month price
      }],
      trial_end: trialEnd,
      expand: ['latest_invoice.payment_intent']
    });
    
    // Save Subscription ID
    await supabase.from('users').update({
      stripe_subscription_id: subscription.id,
      account_status: 'active',
      last_payment_date: new Date()
    }).eq('id', user.id);
    
    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'subscription_created',
      details: {
        subscription_id: subscription.id,
        price: '$2.99/month'
      }
    });
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        price: '$2.99/month'
      },
      message: 'Payment added! You\'re all set.',
      account_status: 'active'
    });
    
  } catch (error) {
    console.error('Stripe subscription error:', error);
    
    res.status(500).json({
      success: false,
      error: 'STRIPE_ERROR',
      message: error.message || 'Failed to process payment. Please try again.'
    });
  }
});
```
    **Webhook Handler:**
```javascript
// POST /api/stripe-webhooks/webhook
app.post('/api/stripe-webhooks/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle event
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});
    async function handleSubscriptionCreated(subscription) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .single();
  
  if (!user) return;
  
  await supabase.from('users').update({
    stripe_subscription_id: subscription.id,
    account_status: 'active'
  }).eq('id', user.id);
  
  console.log(`Subscription created for user ${user.id}`);
}
    async function handleSubscriptionUpdated(subscription) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (!user) return;
  
  // Map Stripe status to account status
  let accountStatus = user.account_status;
  
  switch (subscription.status) {
    case 'active':
      accountStatus = 'active';
      break;
    case 'past_due':
      accountStatus = 'past_due';
      break;
    case 'canceled':
      accountStatus = 'canceled';
      break;
    case 'unpaid':
      accountStatus = 'frozen';
      break;
  }
  
  await supabase.from('users').update({
    account_status: accountStatus
  }).eq('id', user.id);
  
  // If cancel_at_period_end is true, notify user
  if (subscription.cancel_at_period_end) {
    await sendInAppNotification(user.id, {
      title: 'Subscription canceled',
      body: `You'll retain access until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.`,
      type: 'subscription_canceled'
    });
  }
  
  console.log(`Subscription updated for user ${user.id}: ${subscription.status}`);
}
    async function handleSubscriptionDeleted(subscription) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (!user) return;
  
  await supabase.from('users').update({
    stripe_subscription_id: null,
    account_status: 'frozen'
  }).eq('id', user.id);
  
  await sendInAppNotification(user.id, {
    title: 'Subscription ended',
    body: 'Add payment to continue monitoring loved ones.',
    type: 'subscription_ended',
    action_url: '/settings/payment'
  });
  
  console.log(`Subscription deleted for user ${user.id}`);
}
    async function handlePaymentSucceeded(invoice) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer)
    .single();
  
  if (!user) return;
  
  await supabase.from('users').update({
    last_payment_date: new Date(),
    account_status: 'active'
  }).eq('id', user.id);
  
  // Send receipt email (optional for MVP)
  // await sendReceiptEmail(user, invoice);
  
  console.log(`Payment succeeded for user ${user.id}: $${invoice.amount_paid / 100}`);
}
    async function handlePaymentFailed(invoice) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer)
    .single();
  
  if (!user) return;
  
  await supabase.from('users').update({
    account_status: 'past_due'
  }).eq('id', user.id);
  
  // Send notification
  await sendInAppNotification(user.id, {
    title: 'Payment failed',
    body: 'Update your card to continue service.',
    type: 'payment_failed',
    action_url: '/settings/payment'
  });
  
  await sendSMS(user.phone, 
    'Your Pruuf payment failed. Update your card in Settings to continue receiving alerts: https://pruuf.app/settings'
  );
  
  console.log(`Payment failed for user ${user.id}`);
}
    async function handleTrialWillEnd(subscription) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (!user) return;
  
  await sendInAppNotification(user.id, {
    title: 'Trial ending soon',
    body: 'Your trial ends in 3 days. You'll be charged $2.99/month.',
    type: 'trial_ending'
  });
  
  console.log(`Trial will end for user ${user.id}`);
}
```
    ### 8.4 Subscription State Machine
    **States:**
1. **trial** → User is in 30-day trial, no charges
2. **active** → User is paying, subscription active
3. **active_free** → User is Member/grandfathered, free forever
4. **past_due** → Payment failed, 3-day grace period
5. **frozen** → No payment after grace period, no alerts sent
6. **canceled** → User canceled, retains access until period end
7. **deleted** → Account deleted permanently
    **Transitions:**
- trial → active (payment added during trial, first charge at trial end)
- trial → frozen (trial ended, no payment added)
- trial → active_free (user became Member during trial)
- active → past_due (payment failed)
- active → canceled (user canceled subscription)
- past_due → active (user updated payment)
- past_due → frozen (3 days passed, no update)
- frozen → active (user added payment)
- canceled → active (user reactivated before period end)
- canceled → frozen (period ended, no reactivation)
- any → deleted (user deleted account)
    ---
    ## 9. TWILIO SMS SYSTEM (COMPLETE IMPLEMENTATION)
    ### 9.1 Twilio Configuration
    **Account Setup:**
1. Create Twilio account at twilio.com
2. Purchase phone number (US number for MVP)
3. Enable SMS capabilities on number
4. Save credentials:
   - Account SID: `ACxxxxxxxxxxxxx`
   - Auth Token: `xxxxxxxxxxxxx`
   - Phone Number: `+15555551234`
    **Webhook Configuration:**
1. Configure Status Callback URL: `https://api.pruuf.app/api/twilio-webhooks/sms-status`
2. Enable delivery receipts for all messages
    ### 9.2 SMS Templates
    **All SMS templates stored in database for easy updates:**
```sql
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  template_body TEXT NOT NULL,
  variables JSONB, -- Array of variable names: ["contact_name", "member_name", etc.]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Insert templates
INSERT INTO sms_templates (template_key, template_body, variables) VALUES
('member_invite', 
 '{contact_name} invited you to Pruuf, a daily check-in app that lets you reassure family with one tap.
    Download: https://pruuf.app/download
    Once installed, open the app and enter this code: {invite_code}
    Questions? Text {contact_name} at {contact_phone}',
 '["contact_name", "invite_code", "contact_phone"]'),
    ('check_in_confirmation',
 '{member_name} checked in at {time} {timezone}. All is well!',
 '["member_name", "time", "timezone"]'),
    ('late_check_in_update',
 'Update: {member_name} checked in at {time} {timezone} ({minutes} min late). All is well!',
 '["member_name", "time", "timezone", "minutes"]'),
    ('missed_check_in',
 '{member_name} hasn''t checked in by their {deadline} {timezone} deadline.
    Last check-in: {last_check_in}
    You may want to call them to make sure they''re okay.
    Call {member_name}: {member_phone}',
 '["member_name", "deadline", "timezone", "last_check_in", "member_phone"]'),
    ('check_in_time_changed',
 '{member_name} updated their check-in time to {new_time} {new_timezone} (was {old_time} {old_timezone}).
    You''ll now receive alerts if they don''t check in by {new_time} {new_timezone}.',
 '["member_name", "new_time", "new_timezone", "old_time", "old_timezone"]'),
    ('contact_removed',
 '{member_name} removed you from their Pruuf safety contacts. If you have questions, please contact them directly.',
 '["member_name"]'),
    ('verification_code',
 'Your Pruuf verification code is: {code}. This code expires in 10 minutes.',
 '["code"]');
```
    ### 9.3 SMS Sending Service
```javascript
// services/smsService.js
const twilio = require('twilio');
    const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
    const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
    /**
 * Send SMS using template
 */
async function sendSMS(toPhone, templateKey, variables = {}) {
  try {
    // Get template from database
    const { data: template } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('template_key', templateKey)
      .single();
    
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }
    
    // Replace variables in template
    let body = template.template_body;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    
    // Send SMS via Twilio
    const message = await client.messages.create({
      body: body,
      from: TWILIO_PHONE,
      to: toPhone,
      statusCallback: `${process.env.API_BASE_URL}/api/twilio-webhooks/sms-status`
    });
    
    // Log in database
    await supabase.from('sms_logs').insert({
      to_phone: toPhone,
      from_phone: TWILIO_PHONE,
      body: body,
      type: templateKey,
      status: 'sent',
      twilio_sid: message.sid,
      sent_at: new Date()
    });
    
    console.log(`SMS sent: ${message.sid} to ${toPhone}`);
    
    return {
      success: true,
      sid: message.sid
    };
    
  } catch (error) {
    console.error('SMS send error:', error);
    
    // Log error
    await supabase.from('sms_logs').insert({
      to_phone: toPhone,
      from_phone: TWILIO_PHONE,
      body: `Error: ${error.message}`,
      type: templateKey,
      status: 'failed',
      error_message: error.message,
      sent_at: new Date()
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}
    /**
 * Send verification code SMS
 */
async function sendVerificationCode(phone, code) {
  return sendSMS(phone, 'verification_code', { code });
}
    /**
 * Send Member invite SMS
 */
async function sendMemberInvite(memberPhone, contactName, contactPhone, inviteCode) {
  return sendSMS(memberPhone, 'member_invite', {
    contact_name: contactName,
    contact_phone: contactPhone,
    invite_code: inviteCode
  });
}
    /**
 * Send check-in confirmation to Contacts
 */
async function sendCheckInConfirmation(contactPhone, memberName, time, timezone) {
  return sendSMS(contactPhone, 'check_in_confirmation', {
    member_name: memberName,
    time: time,
    timezone: timezone
  });
}
    /**
 * Send late check-in update to Contacts
 */
async function sendLateCheckInUpdate(contactPhone, memberName, time, timezone, minutesLate) {
  return sendSMS(contactPhone, 'late_check_in_update', {
    member_name: memberName,
    time: time,
    timezone: timezone,
    minutes: minutesLate
  });
}
    /**
 * Send missed check-in alert to Contacts
 */
async function sendMissedCheckInAlert(contactPhone, memberName, memberPhone, deadline, timezone, lastCheckIn) {
  return sendSMS(contactPhone, 'missed_check_in', {
    member_name: memberName,
    member_phone: formatPhoneForCall(memberPhone),
    deadline: deadline,
    timezone: timezone,
    last_check_in: lastCheckIn || 'Never'
  });
}
    /**
 * Send check-in time changed notification to Contacts
 */
async function sendCheckInTimeChanged(contactPhone, memberName, newTime, newTimezone, oldTime, oldTimezone) {
  return sendSMS(contactPhone, 'check_in_time_changed', {
    member_name: memberName,
    new_time: newTime,
    new_timezone: newTimezone,
    old_time: oldTime,
    old_timezone: oldTimezone
  });
}
    /**
 * Send Contact removed notification to Contact
 */
async function sendContactRemoved(contactPhone, memberName) {
  return sendSMS(contactPhone, 'contact_removed', {
    member_name: memberName
  });
}
    /**
 * Format phone for clickable call link
 */
function formatPhoneForCall(phone) {
  // +15551234567 → (555) 123-4567
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}
    module.exports = {
  sendSMS,
  sendVerificationCode,
  sendMemberInvite,
  sendCheckInConfirmation,
  sendLateCheckInUpdate,
  sendMissedCheckInAlert,
  sendCheckInTimeChanged,
  sendContactRemoved
};
```
    ### 9.4 SMS Delivery Webhook Handler
```javascript
// POST /api/twilio-webhooks/sms-status
app.post('/api/twilio-webhooks/sms-status', express.urlencoded({extended: false}), async (req, res) => {
  const {
    MessageSid,
    MessageStatus,
    To,
    From,
    ErrorCode,
    ErrorMessage
  } = req.body;
  
  console.log(`SMS status update: ${MessageSid} - ${MessageStatus}`);
  
  try {
    // Update SMS log
    await supabase
      .from('sms_logs')
      .update({
        status: MessageStatus, // 'delivered', 'undelivered', 'failed'
        error_message: ErrorMessage || null,
        delivered_at: MessageStatus === 'delivered' ? new Date() : null
      })
      .eq('twilio_sid', MessageSid);
    
  } catch (error) {
    console.error('Error updating SMS log:', error);
  }
  
  // Respond to Twilio
  res.type('text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});
```
    ### 9.5 SMS Rate Limiting & Cost Management
    **Rate Limits:**
- Verification codes: Max 5 per phone per hour
- Member invites: Max 1 per phone per 60 seconds (prevent spam)
- Check-in notifications: Unlimited (critical alerts)
    **Cost Estimation:**
- Twilio SMS cost: $0.0079 per message (US)
- Average messages per Contact per month:
  - Verification (signup): 1
  - Member invites: 2-3 (initial + maybe resend)
  - Check-in confirmations: 30 (daily)
  - Missed check-ins: 2-3 (occasional)
  - Total: ~35 messages/month
- Cost per Contact: $0.0079 × 35 = $0.28/month
- Revenue per Contact: $2.99/month
- Gross margin: $2.71/month (91%)
    **Cost Optimization:**
- Only send check-in confirmation SMS if Member checks in on time (skip if late, send update instead)
- Bundle multiple updates into single SMS when possible
- Use push notifications where possible (free)
    ---
    ## 10. PUSH NOTIFICATION ARCHITECTURE
    ### 10.1 Push Notification Strategy
    **When to Use Push vs. SMS:**
    | Scenario | Push | SMS | Both |
|----------|------|-----|------|
| Missed check-in alert (Contact) | ✓ | ✓ | ✓ |
| Check-in confirmation (Contact) | ✓ | ✓ | ✓ |
| Check-in reminder (Member) | ✓ | | |
| Trial reminders | ✓ | | |
| Payment failed | ✓ | ✓ | ✓ |
| Member invited Contact | ✓ | | |
| Verification code | | ✓ | |
    **Rationale:**
- Critical alerts (missed check-in, payment failed): Both push + SMS (redundancy)
- Confirmations (check-in success): Both (Contact wants immediate visibility)
- Reminders (Member daily reminder): Push only (less intrusive)
- Verification: SMS only (required for auth)
    ### 10.2 Firebase Cloud Messaging (FCM) Setup
    **Install Dependencies:**
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```
    **iOS Configuration:**
1. Enable Push Notifications capability in Xcode
2. Upload APNs certificate to Firebase Console
3. Add GoogleService-Info.plist to project
    **Android Configuration:**
1. Add google-services.json to android/app/
2. Configure AndroidManifest.xml with permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```
    ### 10.3 Push Notification Handling (React Native)
```javascript
// services/pushNotificationService.js
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
    /**
 * Request push notification permission
 */
export async function requestPushPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
    console.log('Push notification permission granted');
    return true;
  } else {
    console.log('Push notification permission denied');
    return false;
  }
}
    /**
 * Get FCM token
 */
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}
    /**
 * Register token with backend
 */
export async function registerPushToken(accessToken) {
  const fcmToken = await getFCMToken();
  
  if (!fcmToken) return false;
  
  try {
    const response = await fetch('https://api.pruuf.app/api/push-notifications/register-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: fcmToken,
        platform: Platform.OS // 'ios' or 'android'
      })
    });
    
    const data = await response.json();
    return data.success;
    
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}
    /**
 * Handle foreground notifications
 */
export function onForegroundNotification(handler) {
  return messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification:', remoteMessage);
    handler(remoteMessage);
  });
}
    /**
 * Handle background/quit notifications
 */
export function onBackgroundNotification(handler) {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background notification:', remoteMessage);
    handler(remoteMessage);
  });
}
    /**
 * Handle notification tap (opens app)
 */
export function onNotificationTap(handler) {
  // Notification caused app to open from quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification opened app from quit state:', remoteMessage);
        handler(remoteMessage);
      }
    });
      // Notification caused app to open from background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app from background:', remoteMessage);
    handler(remoteMessage);
  });
}
```
    **App Integration:**
```javascript
// App.js
import { useEffect } from 'react';
import { 
  requestPushPermission, 
  registerPushToken,
  onForegroundNotification,
  onNotificationTap
} from './services/pushNotificationService';
    export default function App() {
  useEffect(() => {
    // Request permission on app launch
    requestPushPermission().then(granted => {
      if (granted) {
        registerPushToken(accessToken);
      }
    });
    
    // Handle foreground notifications (show in-app banner)
    const unsubscribeForeground = onForegroundNotification(notification => {
      // Show in-app notification banner
      showInAppBanner({
        title: notification.notification.title,
        body: notification.notification.body
      });
    });
    
    // Handle notification taps (navigate to relevant screen)
    onNotificationTap(notification => {
      const { type, member_id } = notification.data;
      
      if (type === 'missed_check_in' || type === 'check_in_success') {
        // Navigate to Member detail screen
        navigation.navigate('MemberDetail', { memberId: member_id });
      } else if (type === 'payment_failed') {
        navigation.navigate('PaymentSettings');
      }
      // ... other navigation logic
    });
    
    return () => {
      unsubscribeForeground();
    };
  }, []);
  
  return (
    <NavigationContainer>
      {/* App navigation */}
    </NavigationContainer>
=======

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
>>>>>>> Stashed changes
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
{ payment_method_id: "pm_stripe_xxxxx" }

// Backend Process
1. Check if user requires payment (not Member/grandfathered)
2. Create Stripe Customer if doesn't exist
3. Attach payment method
4. Create Subscription with $3.99/month (or $29/year) price
5. If in trial: Set trial_end to existing trial_end_date
6. Save stripe_customer_id, stripe_subscription_id
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
1. Set Stripe subscription cancel_at_period_end = true
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
  "@stripe/stripe-react-native": "0.35.x",
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
21. PaymentMethodScreen - Stripe card input
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

### 12.2 Stripe Integration

**Configuration:**
```typescript
// App.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

<StripeProvider publishableKey={process.env.STRIPE_PUBLISHABLE_KEY}>
  <App />
</StripeProvider>
```

**Payment Flow:**
```typescript
// src/screens/PaymentMethodScreen.tsx
import { CardField, useStripe } from '@stripe/stripe-react-native';

const { createPaymentMethod } = useStripe();

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
<<<<<<< Updated upstream
    ---
    ## 13. EDGE CASE HANDLING (75+ SCENARIOS)
    ### 13.1 Authentication Edge Cases
    **1. User enters invalid phone format**
- Validation: Reject any non-numeric characters except +
- Error: "Please enter a valid phone number"
- Solution: Auto-format as user types (555) 123-4567
    **2. Verification code never arrives**
- Timeout: 2 minutes
- Action: Show "Didn't receive code?" link after 30 seconds
- Resend: Allow resend with 30-second cooldown
- SMS provider issues: Log error, suggest trying again later
    **3. User enters code from old verification attempt**
- Check: Verify code isn't marked as `used = TRUE`
- Error: "This code was already used. Request a new one."
    **4. User's phone number changes**
- Solution: No phone update in MVP (require new account)
- Future: Add phone update flow with re-verification
    **5. User forgets PIN within minutes of creating it**
- Solution: "Forgot PIN" flow available immediately after creation
- Verification: Same SMS code process
- No lockout during initial setup
    **6. Multiple devices, same account**
- Behavior: Last login wins (other devices logged out)
- Session management: JWT invalidation on new login
- Notification: "Logged in on another device"
    **7. User's phone stolen, attacker tries to log in**
- Lockout: 5 failed attempts → 5-minute lockout
- Escalation: 10 failed attempts → 15-minute lockout
- Alert: Send SMS to phone "Failed login attempts detected"
    **8. User logs in on new device**
- Behavior: Full authentication required (phone + PIN)
- No automatic trust of new devices
- FCM token registered for new device
    ### 13.2
    Retry
    WW
    Continue
    13.3 Check-In Edge Cases
    18. Member taps "I'm OK" multiple times rapidly (accidental)
        • Prevention: Debounce button (ignore taps within 2 seconds)
        • Database: Update existing check-in timestamp (don't create duplicates)
        • SMS: Only send one confirmation to Contacts
    19. Member checks in at 9:59 AM, deadline is 10:00 AM
        • Behavior: Check-in counts (within deadline)
        • Status: "On time"
        • No alert sent
    20. Member checks in at 10:01 AM, deadline is 10:00 AM
        • Behavior: Check-in counts (late but valid)
        • Status: "Late check-in"
        • Alert: Contacts already received missed check-in SMS at 10:00 AM
        • Update: Send "Update: Mom checked in at 10:01 AM (1 min late)"
    21. Member checks in at 11:30 PM, deadline was 10:00 AM
        • Behavior: Check-in counts (same calendar day in Member's timezone)
        • Status: "Late check-in"
        • Update: Send update SMS to Contacts
        • Note: Prevents "double miss" (missed today, missed tomorrow)
    22. Member checks in at 12:01 AM (after midnight)
        • Behavior: Counts as tomorrow's check-in (new calendar day)
        • Edge case: If deadline is 10:00 AM, they're early for tomorrow
        • Previous day: Marked as missed (if no check-in yesterday)
    23. Member checks in while phone is in airplane mode
        • Detection: Network unavailable
        • Behavior: Queue check-in locally
        • UI: Show banner "Offline - will sync when connected"
        • Retry: Auto-retry when network restored
        • Expiry: Queue expires after 24 hours (stale check-in)
    24. Member's app crashes during check-in
        • Request: Check-in POST may or may not reach server
        • Recovery: On reopen, check if check-in exists for today
        • If yes: Show "You already checked in today"
        • If no: Prompt to check in again
    25. Multiple Contacts, one has frozen account (no payment)
        • Behavior: Active Contacts receive SMS/push alerts
        • Frozen Contact: No alerts sent (account_status check)
        • Database: Relationship still exists (not deleted)
        • Recovery: When Contact adds payment, alerts resume
    26. Member changes check-in time from 10 AM to 2 PM at 11 AM
        • Behavior: New deadline is 2 PM today
        • Cancellation: Cancel scheduled 10 AM deadline check
        • Notification: All Contacts receive SMS about time change
        • Risk: If Member checked in at 9:30 AM, it still counts for today
    27. Member changes timezone from PST to EST at 1 PM PST (4 PM EST)
        • Deadline: Was 2 PM PST (5 PM EST), now 2 PM EST (already passed)
        • Behavior: Treat as missed check-in for today (deadline passed)
        • Alert: Send missed check-in alerts immediately
        • Future: Tomorrow's deadline is 2 PM EST
    28. System clock is wrong (Member's phone time is off by hours)
        • Detection: Compare device time to server time
        • Warning: If >5 minutes difference, show banner "Your phone's clock may be wrong"
        • Impact: Check-in timestamp uses server time, not device time
        • Timezone: Use device timezone but validate against server
    29. Daylight Saving Time transition
        • Spring forward: 2 AM → 3 AM (lose 1 hour) 
            ○ If check-in time is 2:30 AM, skip that day (doesn't exist)
            ○ Solution: Adjust to 3:30 AM automatically
        • Fall back: 2 AM → 1 AM (gain 1 hour) 
            ○ If check-in time is 1:30 AM, occurs twice
            ○ Solution: Use first occurrence (earlier time)
        • Notification: Alert Member of timezone change week before
    30. Member travels across timezones mid-day
        • Example: Deadline 10 AM PST, flies to NYC, lands at 4 PM EST (1 PM PST)
        • Behavior: Deadline already passed in old timezone (missed)
        • Solution: Member should update check-in time before traveling
        • Alternative: Auto-detect timezone change, send prompt "Update check-in time?"
    13.4 Contact Edge Cases
    31. Contact's trial ends, no payment added
        • Day 31: Account status → frozen
        • Behavior: No new alerts sent (SMS or push)
        • Member impact: Member's check-ins still recorded (database)
        • Other Contacts: Still receive alerts (unaffected)
        • UI: Contact sees banner "Add payment to receive alerts"
    32. Contact has payment method, but card expires
        • Stripe: Sends invoice.payment_failed webhook
        • Behavior: Account status → past_due
        • Grace period: 3 days to update card
        • Notification: In-app + SMS "Payment failed. Update card."
        • After 3 days: Account frozen
    33. Contact monitors 5 Members, cancels subscription
        • Behavior: All 5 Members' relationships still exist (not deleted)
        • Alerts: None sent after period ends
        • Reactivation: Contact can resubscribe anytime, alerts resume
        • Members: No notification of cancellation (privacy)
    34. Contact removes Member, then immediately re-adds
        • First removal: Relationship status → removed
        • Re-invite: New relationship created (new invite code)
        • Member: Receives new SMS with new code
        • Member: Must accept new invite (re-connection)
    35. Contact deletes app without canceling subscription
        • Stripe: Subscription continues (no device requirement)
        • Billing: Contact continues to be charged
        • Alerts: SMS still sent (no app required)
        • Push: Fail silently (no token registered)
        • Solution: Contact must cancel in app or Stripe portal
    36. Contact's phone number changes
        • Problem: SMS alerts go to old number
        • Detection: SMS delivery failures (Twilio "undelivered")
        • Solution: Contact must update phone in settings
        • Verification: SMS code to new number required
    37. Contact and Member are same person (elderly person monitors themselves)
        • Prevention: None (allowed edge case)
        • Behavior: Functions normally
        • Reminder: Member receives "Check in" reminder
        • Alert: If missed, Member receives "You missed check-in" alert
        • Usefulness: Low (defeats purpose) but not blocked
    38. Contact receives missed alert, but Member is fine (false alarm)
        • Causes: App crashed, phone died, Member forgot
        • Contact action: Call/text Member
        • Member: Checks in late after Contact call
        • Update: Contact receives "Late check-in" SMS
        • Prevention: Member should enable reminders
    39. Contact monitors Member in different country (international)
        • SMS: Twilio supports international (additional cost)
        • Timezone: Member's timezone used for deadlines
        • Display: Contact sees Member's timezone clearly ("10 AM GMT+1")
        • Cost: International SMS ~$0.05 (vs. $0.008 US)
        • Limitation: MVP is US-only; international in future
    40. Two Contacts, both grandfathered free (were Members, now monitor each other)
        • Scenario: Mom monitors Aunt, Aunt monitors Mom
        • Both: account_status = active_free
        • Revenue: $0 (both grandfathered)
        • Allowed: Yes (by design, encourages reciprocal safety nets)
    13.5 Payment & Subscription Edge Cases
    41. Contact adds payment during trial, then immediately cancels
        • Behavior: Subscription created, then cancel_at_period_end = true
        • Access: Retains access until trial end date
        • Charge: No charge until trial ends (but won't renew)
        • Loophole: Contact gets free trial but no post-trial service
    42. Contact's bank declines payment 3 times
        • Stripe: Marks subscription as unpaid
        • Behavior: Account frozen immediately (no grace period after 3 failures)
        • Notification: "Payment failed 3 times. Contact your bank."
        • Solution: Update card or contact support
    43. Contact disputes charge with credit card company
        • Stripe: Webhook charge.dispute.created
        • Behavior: Account frozen immediately
        • Notification: "Payment disputed. Contact support."
        • Resolution: Manual intervention by support team
        • Prevent: Clear refund policy, good customer service
    44. Contact requests refund after 20 days of subscription
        • Policy: No refunds (stated in Terms of Service)
        • Exception: Case-by-case basis (support decision)
        • Stripe: Can issue refund via Stripe Dashboard
        • Account: Remains frozen after refund
    45. Member becomes Contact (adds Member to monitor), has active subscription
        • Check: User has stripe_subscription_id
        • Behavior: Subscription continues until end of period
        • End of period: Check if user.is_member or user.grandfathered_free
        • If true: Don't renew, set account_status = active_free
        • Notification: "You're now a Member! No more charges."
    46. Contact pays, then becomes Member, then all Contacts remove them
        • Timeline: 
            ○ Day 1: Contact pays $2.99/month
            ○ Day 15: Becomes Member (someone monitors them)
            ○ Day 16: subscription cancels at period end (grandfathered)
            ○ Day 30: Last Contact removes them (no longer a Member)
            ○ Day 31: Subscription doesn't renew (still grandfathered_free = true)
        • Result: Contact pays for 1 month, then free forever
        • Allowed: Yes (grandfathered benefit permanent)
    47. Stripe webhook fails to deliver (server down)
        • Stripe: Retries webhooks up to 3 days
        • Problem: Account status may be out of sync
        • Detection: Daily reconciliation job compares Stripe subscriptions to database
        • Fix: Update account_status based on Stripe source of truth
    48. Contact changes credit card mid-billing cycle
        • Behavior: Stripe updates default payment method
        • Billing: Next charge uses new card
        • No prorated charge or credit
    49. User creates multiple accounts to extend trial
        • Detection: Multiple accounts with same phone number
        • Prevention: One account per phone number (database constraint)
        • Workaround: Use different phone number (burner phone)
        • Acceptable: Edge case, low volume, not worth complex prevention
    50. Coupon/promo code application
        • Stripe: Supports promotion codes natively
        • Application: User enters code in payment screen
        • Validation: Stripe validates code
        • Discount: Applied to subscription (e.g., 50% off 3 months)
        • Display: Show discounted price before confirming
    13.6 SMS & Notification Edge Cases
    51. Contact's phone is off when alert sent
        • SMS: Twilio queues message, delivers when phone on (up to 7 days)
        • Push: FCM queues, delivers when phone on (up to 4 weeks)
        • Member: Checks in late, update SMS sent
        • Contact: Receives both messages when phone turns on (ordered correctly)
    52. Contact blocks Pruuf's Twilio number
        • Twilio: Returns "undelivered" status
        • Detection: Webhook sms_status = undelivered
        • Behavior: Log error, don't retry
        • Notification: In-app notification "SMS delivery failed. Check if you blocked our number."
        • Future: Attempt re-registration with new Twilio number
    53. SMS contains special characters (emoji, non-ASCII)
        • Twilio: Supports Unicode (emoji allowed)
        • Cost: Unicode SMS costs more (uses UCS-2 encoding, ~70 chars/message vs. 160)
        • Prevention: Avoid emoji in templates (keep ASCII only)
        • Exception: Checkmark ✓ in "checked in" messages (acceptable)
    54. Member's name contains apostrophe or quotes
        • Example: "O'Brien" or "Jean-Claude"
        • SMS: Escape quotes in template ("O'Brien")
        • Storage: Store as-is in database (UTF-8 safe)
        • Display: Render correctly in app
    55. SMS fails to send (Twilio API error)
        • Error codes: 21211 (invalid number), 21614 (cannot route), etc.
        • Behavior: Log error, don't retry
        • Notification: Contact receives in-app notification "SMS failed. Verify phone number."
        • Member invitation: Show error to Contact immediately
    56. Push notification permission denied
        • iOS: User taps "Don't Allow" on permission prompt
        • Behavior: No push notifications sent (silent failure)
        • Fallback: SMS still works
        • Banner: Show persistent banner "Enable notifications for instant alerts"
        • Re-prompt: Don't ask again (iOS restriction); link to Settings
    57. Push token becomes invalid (app reinstalled)
        • Detection: FCM returns "invalid token" error
        • Behavior: Delete token from database
        • Re-registration: User must open app, new token generated
        • Gap: No push notifications until app opened
    58. Member receives check-in reminder but already checked in
        • Timing: Reminder scheduled at 9 AM, Member checked in at 8:30 AM
        • Prevention: Cancel scheduled notification after check-in
        • Fallback: If notification still fires, show "You already checked in today"
    59. Contact receives duplicate alerts (bug)
        • Prevention: Database constraint on missed_check_in_alerts (one per Member per day)
        • Detection: Check EXISTS before inserting alert
        • Retry logic: Idempotent (same alert = same result)
    60. SMS character limit exceeded (very long Member name)
        • Twilio: Max 1600 characters per message
        • Member name: Max 255 characters (database constraint)
        • Template: Longest template ~300 characters
        • Safety: No risk of exceeding limit
    13.7 Data & Sync Edge Cases
    61. Database connection lost during API call
        • Supabase: Connection pooling, auto-reconnect
        • Error: 503 Service Unavailable
        • Client: Retry with exponential backoff (1s, 2s, 4s, 8s, max 5 retries)
        • User: Show error "Connection lost. Retrying..."
    62. User edits data on two devices simultaneously
        • Example: Change check-in time on phone and tablet at same time
        • Database: Last write wins (timestamp-based)
        • Conflict: Possible inconsistency (rare)
        • Solution: Soft real-time sync (polling every 60s) to refresh stale data
    63. Clock skew between client and server
        • Detection: Include timestamp in API requests
        • Validation: Reject requests with >5 minute skew
        • Error: "Your device's clock is incorrect. Please fix it."
    64. User's check-in history deleted (data loss)
        • Prevention: Database backups every 6 hours (Supabase)
        • Retention: 30-day backup retention
        • Recovery: Contact support to restore data
        • Future: Export check-in history feature
    65. Member deletes account, Contact still sees them
        • Behavior: Delete all member_contact_relationships on account deletion
        • Contact: Member disappears from list immediately
        • SMS: No deletion notification (privacy)
        • Cleanup: Soft delete (30 days), then hard delete
    66. Invite code collision (two invites generate same code)
        • Probability: 1 in 2.1 billion (32^6 combinations)
        • Prevention: Database UNIQUE constraint on invite_code
        • Retry: generate_invite_code() function recursively retries
        • Logging: Log collision if occurs (extremely rare)
    67. User's FCM token changes without app knowledge
        • iOS: Token can change on app update, iOS update, restore from backup
        • Detection: Token refresh callback in app
        • Behavior: Update token in database automatically
        • No user action required
    68. Multiple Members miss check-in at exact same time
        • Example: System clock hits 10:00 AM, 50 Members have 10 AM deadline
        • Cron job: Processes all Members (query returns 50 rows)
        • Loop: Send alerts in loop (async, parallel where possible)
        • Performance: Twilio API rate limit ~100 messages/second (adequate)
    13.8 Timezone & Time Edge Cases
    69. Member sets check-in time to 11:59 PM
        • Behavior: Works normally
        • Edge: 1-minute window to check in each day
        • Recommendation: Suggest earlier time ("This gives you very little time. Consider an earlier time.")
    70. Member sets check-in time to 12:00 AM (midnight)
        • Behavior: Deadline is midnight (start of day)
        • Edge: Member must check in within first minute of day
        • Alternative: Interpret as end of day (23:59)? No, use literal time.
    71. Member travels from US to Europe (major timezone change)
        • Example: 10 AM PST → travels to Paris (CET, +9 hours)
        • Device: Auto-detects new timezone
        • Check-in time: Still 10 AM, but now 10 AM CET (1 AM PST)
        • Contacts: Receive notification "Mom updated timezone to CET"
        • Member: Should update check-in time to appropriate local time
    72. Leap day (February 29)
        • Behavior: Works normally (date exists in leap years)
        • No special handling needed
    73. Member in Hawaii (HST), Contact in New York (EST, 5-hour difference)
        • Display: Member's card shows "Next check-in: 10 AM HST (3 PM your time)"
        • Clarity: Always show Member's timezone + Contact's local equivalent
        • No conversion errors (use moment-timezone library)
    74. Database stores timestamp in UTC, different from Member's timezone
        • Storage: All timestamps in UTC (Supabase default)
        • Conversion: Convert to Member's timezone for display
        • Comparison: Use AT TIME ZONE in SQL queries for correctness
    75. Member's device timezone is set to wrong city (same offset)
        • Example: Selects "Arizona" instead of "Los Angeles" (both UTC-7 in winter)
        • Impact: None if offset is same
        • DST: Problem arises if one observes DST and other doesn't
        • Solution: Detect timezone from device, allow manual override
    13.9 Accessibility Edge Cases
    76. VoiceOver user navigates Member Dashboard
        • Tab order: Logical (banner → button → contacts → tabs)
        • Labels: All elements have accessibilityLabel
        • Hints: Buttons have accessibilityHint ("Double tap to check in")
        • Announcements: Success actions trigger VoiceOver announcement
    77. Member with severe vision impairment can't read SMS code
        • Alternative: Contact can read code aloud to Member
        • Future: Voice input for code ("Say your code aloud")
        • Workaround: Contact helps Member enter code
    78. Member with tremor taps wrong button repeatedly
        • Prevention: Large touch targets (60pt minimum)
        • Confirmation: Destructive actions require confirmation
        • Undo: Check-in can be "undone" by checking in again (updates timestamp)
    79. User sets Extra Large font, UI breaks
        • Testing: Test all screens at 1.5x font size
        • Constraint: Text truncates with ellipsis if too long
        • Scrolling: Enable scrolling on all content areas
        • Minimum: Never shrink text below specified size
    80. Color blind user can't distinguish status colors
        • Prevention: Never use color alone (always icon + text)
        • Active: Green dot + "Active" text
        • Pending: Orange dot + "Pending" text
        • Error: Red X + "Error" text
    
    14. API ENDPOINT DEFINITIONS (COMPLETE)
    14.1 API Base URL
    Production: https://api.pruuf.app
    Staging: https://staging-api.pruuf.app
    Development: http://localhost:3000
    14.2 Authentication Headers
    All authenticated endpoints require:
    Authorization: Bearer {jwt_access_token}
Content-Type: application/json
    14.3 Rate Limiting
    Global rate limits (per IP):
        • Authentication endpoints: 10 requests/minute
        • Read endpoints (GET): 100 requests/minute
        • Write endpoints (POST/PATCH/DELETE): 30 requests/minute
        • SMS-sending endpoints: 5 requests/minute
    Response headers:
    X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
    Rate limit exceeded:
    json
    {
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Try again in 45 seconds.",
  "retry_after": 45
=======

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
>>>>>>> Stashed changes
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
- Stripe subscription canceled immediately

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
| Card declined | Show Stripe error message, allow retry |
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

    } else if (user.stripe_subscription_id) {
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

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

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
<<<<<<< Updated upstream
API_BASE_URL=https://api.pruuf.app
    # Supabase
=======
API_BASE_URL=https://api.pruuf.me

# Supabase
>>>>>>> Stashed changes
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_MONTHLY=price_xxxxx  # $3.99/month price ID
STRIPE_PRICE_ID_ANNUAL=price_xxxxx   # $29/year price ID

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
<<<<<<< Updated upstream
RATE_LIMIT_WINDOW=60000 # 1 minute
RATE_LIMIT_MAX=100
    Mobile App (.env):
    bash
    API_BASE_URL=https://api.pruuf.app
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
    18.2 Deployment Process
    Backend Deployment (Railway example):
        1. Connect GitHub repository
        2. Configure environment variables (from .env.example)
        3. Deploy command: npm run build && npm start
        4. Health check endpoint: GET /health
        5. Zero-downtime deployment (Railway handles)
    Mobile App Deployment:
    iOS (App Store):
        1. Update version in ios/Pruuf/Info.plist
        2. Build: cd ios && fastlane ios release
        3. Upload to App Store Connect
        4. Submit for review
        5. Release to production after approval
    Android (Google Play):
        1. Update version in android/app/build.gradle
        2. Build: cd android && fastlane android release
        3. Upload to Google Play Console
        4. Submit for review
        5. Staged rollout (10% → 50% → 100%)
    18.3 Database Migrations
    Supabase Migrations:
    sql
    -- migrations/001_initial_schema.sql
-- Run in Supabase SQL Editor
    CREATE TABLE users (...);
CREATE TABLE members (...);
-- etc.
    -- migrations/002_add_grandfathered_flag.sql
ALTER TABLE users ADD COLUMN grandfathered_free BOOLEAN DEFAULT FALSE;
    Migration strategy:
        • Version-controlled SQL files
        • Run manually in Supabase dashboard (MVP)
        • Future: Automated via Supabase CLI
    
    19. MONITORING & ANALYTICS
    19.1 Application Monitoring
    Sentry Configuration:
    javascript
    // Backend
import * as Sentry from '@sentry/node';
    Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1 // 10% of transactions
});
    // Mobile App
import * as Sentry from '@sentry/react-native';
    Sentry.init({
  dsn: 'https://xxxxx@sentry.io/xxxxx',
  environment: __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true
});
    Key metrics to track:
        • API response times (p50, p95, p99)
        • Error rate (errors per 1000 requests)
        • Crash rate (app crashes per session)
        • Database query performance
    19.2 Business Analytics
    Events to track:
    javascript
    // User events
analytics.track('user_signed_up', { user_type: 'contact' });
analytics.track('trial_started', { user_id });
analytics.track('subscription_created', { user_id, plan: 'monthly' });
analytics.track('subscription_canceled', { user_id, reason });
    // Core actions
analytics.track('member_invited', { contact_id, member_phone_masked });
analytics.track('invite_accepted', { member_id, contact_id });
analytics.track('check_in_completed', { member_id, on_time: true });
analytics.track('check_in_missed', { member_id });
analytics.track('alert_sent', { member_id, contact_count });
    // Conversion funnel
analytics.track('onboarding_step_completed', { step: 'phone_verification' });
analytics.track('payment_method_added', { user_id });
analytics.track('trial_converted', { user_id });
    Dashboard metrics:
        • Daily Active Users (DAU)
        • Weekly Active Users (WAU)
        • Trial → Paid conversion rate
        • Monthly Recurring Revenue (MRR)
        • Churn rate
        • Average check-ins per Member
        • Average Contacts per Member
    
    20. FUTURE ENHANCEMENTS (POST-MVP)
    These features are intentionally excluded from MVP but documented for future development:
    20.1 Planned Features (v1.1 - v2.0)
    1. Member Activity Feed
        • 30-day check-in history for Contacts
        • Streak tracking ("Mom checked in 47 days in a row!")
        • Patterns ("Usually checks in between 9-10 AM")
    2. Multiple Check-in Times
        • Morning + evening check-ins
        • Flexible schedules (MWF vs. daily)
        • Weekend vs. weekday times
    3. Two-Way Messaging
        • Simple in-app chat between Member and Contacts
        • Quick replies ("I'm running late, will check in soon")
        • Voice messages for low-literacy users
    4. Smart Watch App
        • Apple Watch: Tap wrist to check in
        • Complications: Show countdown to deadline
        • Fall detection integration
    5. Caregiver Features
        • Professional caregivers as Contact type
        • Shift handoff notifications
        • Multi-Member dashboard for care facilities
    6. International Support
        • Multi-currency (EUR, GBP, CAD)
        • Internationalized phone numbers
        • Multi-language UI
    7. API for Partners
        • Senior living facilities integration
        • Medical alert system integration
        • Insurance partnerships
    8. Advanced Analytics
        • Health insights from check-in patterns
        • Predictive alerts (missed 3 of last 7 days)
        • Family dashboard (siblings coordinate care)
    
    FINAL SPECIFICATION SUMMARY
    This document provides complete, implementation-ready specifications for Pruuf MVP including:
    ✅ Product Vision: Philosophy, personas, success metrics
    ✅ Business Logic: Pricing, trials, grandfathering, subscriptions
    ✅ User Flows: Contact & Member onboarding, check-ins, alerts
    ✅ Database Schema: Complete PostgreSQL schema with RLS policies
    ✅ Backend API: 30+ endpoints with request/response examples
    ✅ Stripe Integration: Subscription lifecycle, webhooks, edge cases
    ✅ Twilio SMS: Templates, delivery tracking, error handling
    ✅ Push Notifications: FCM setup, message types, priorities
    ✅ UI/UX Design: Component library, accessibility, screen specs
    ✅ Edge Cases: 80+ scenarios with solutions
    ✅ Testing: Unit, integration, E2E test strategies
    ✅ Technology Stack: Complete dependency list
    ✅ Deployment: Environment config, CI/CD, monitoring

---

# APPENDIX: BIG BUILD IMPLEMENTATION PLAN (November 2025)

## Overview

On November 26, 2025, a comprehensive implementation plan was created to address critical system updates. This appendix provides a high-level summary. **For complete details with all code snippets, see:** `/Users/wesquire/.claude/plans/enumerated-tinkering-steele.md`

## Critical Changes

### 1. Domain Migration
**Change:** Replace all `pruuf.app` → `pruuf.life` throughout codebase
**Files affected:** `.env.example`, SMS templates, `app.json`, deep links, documentation

### 2. Phone Verification System Overhaul
**Old System:** User receives 6-digit SMS code, enters in app  
**New System:** User receives "Reply YES" SMS, replies via text, Twilio webhook validates

**Key Components:**
- Inbound SMS webhook: `POST /webhooks/twilio/inbound-sms`
- Twilio signature validation (HMAC-SHA1 security)
- 24-hour reminder cron job (sends once if not verified)
- Blocking banner in UI for unverified users
- Unverified users cannot send invites

### 3. Database Schema Updates
```sql
ALTER TABLE users
ADD COLUMN email VARCHAR(255),
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_verification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- 10-Contact limit trigger
CREATE OR REPLACE FUNCTION check_member_contact_limit()
RETURNS TRIGGER AS $$ ... $$;
=======
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
>>>>>>> Stashed changes
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
   - Verify: Stripe subscription created, account_status = 'active'

7. **Subscription Cancellation**
   - Cancel subscription
   - Verify: cancel_at_period_end = true, access until period end, then frozen

8. **Grandfathering Flow**
   - Paying Contact becomes Member
   - Verify: grandfathered_free = true, subscription canceled at period end

### 19.2 Edge Case Tests

<<<<<<< Updated upstream
- [ ] Domain migration complete (grep for pruuf.app = 0 results)
- [ ] Database migration 002 executed
- [ ] Inbound SMS webhook deployed and tested
- [ ] Twilio console webhooks configured
- [ ] 24-hour reminder cron scheduled
- [ ] All tests passing (unit, integration, E2E)
- [ ] Frontend apps built and submitted (iOS + Android)
- [ ] Smoke tests passed in production
- [ ] Monitoring configured (Sentry, logs)
=======
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
>>>>>>> Stashed changes

### 19.3 Accessibility Tests

<<<<<<< Updated upstream
**Complete Implementation Plan (3,000+ lines with code snippets):**
`/Users/wesquire/.claude/plans/enumerated-tinkering-steele.md`

**Quick Reference:**
`/PLAN_BIG_BUILD.md` - Summary and quick start guide

**Twilio Configuration:**
`/PLAN_TWILIO.md` - Detailed Twilio console setup instructions

## Key Validation Points

✅ User receives "Reply YES" SMS when creating account  
✅ Replying "YES", "yes", or "Y" marks phone as verified  
✅ Unverified users see banner on dashboard  
✅ Unverified users blocked from sending invites (403 error)  
✅ 24-hour reminder sent once to unverified users  
✅ Email collection works during onboarding (can skip)  
✅ Member can invite Contact via "Add Contact" button  
✅ 11th Contact invitation blocked (10-Contact limit)  
✅ On-time check-in sends SMS only (no push notification)  
✅ Missed check-in sends SMS + push (normal priority)  
✅ All domain references use pruuf.life (not pruuf.app)
=======
- [ ] All buttons have 60pt+ touch targets
- [ ] All text passes color contrast ratios
- [ ] All interactive elements have VoiceOver labels
- [ ] Font scaling works at 1.5x multiplier
- [ ] Tab order is logical
- [ ] Error messages are descriptive
>>>>>>> Stashed changes

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
