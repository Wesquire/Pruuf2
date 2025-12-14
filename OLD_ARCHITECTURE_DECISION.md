# ARCHITECTURE DECISIONS - SMS TO PUSH/EMAIL MIGRATION

**Date**: 2025-12-07
**Status**: APPROVED - Proceeding with recommendations

---

## EXECUTIVE SUMMARY

**User Requirements:**
1. Remove ALL SMS functionality
2. Use push notifications only for in-app alerts
3. Email for verification only
4. Domain: pruuf.me (NOT pruuf.me)
5. Bundle ID: me.pruuf.app (NOT me.pruuf.app)

**Recommended Architecture**: **Option 1 - Push + Email Hybrid**

---

## DETAILED OPTIONS ANALYSIS

### QUESTION 1: Phone Verification Approach

**Background**: Without SMS, we need a new way to verify users or determine if verification is needed at all.

**Option A: No Verification (phone = login ID only)** ⭐ RECOMMENDED
- **How it works**: User enters phone number + creates 4-digit PIN. Phone is never verified, just serves as unique username.
- **Pros**:
  - Simplest implementation
  - No verification delay
  - Phone can't receive SMS anyway (no verification possible)
  - Matches user's statement: "phone number should be used when the member onboards into the app, but this is only to serve as the member login"
- **Cons**:
  - Users can enter fake phone numbers
  - Duplicate accounts possible with same phone number
  - No way to verify user owns the phone
- **Why recommended**: You explicitly stated phone is just for login. No verification needed.

**Option B: Email verifies identity, phone unverified**
- **How it works**: User enters email + phone + PIN. Email gets verification code. Phone is unverified but stored.
- **Pros**:
  - Verifies user has access to real email
  - Phone still available for display/reference
  - Industry standard (email verification common)
- **Cons**:
  - Extra step (email verification)
  - Elderly users may struggle with email codes
  - Phone serves no verification purpose
- **Why not recommended**: Adds complexity without benefit. If email is verified, why need phone?

**Option C: Two-step (email verification + manual phone call test)**
- **How it works**: Verify email, then Contact must manually call Member to confirm phone works.
- **Pros**:
  - Confirms phone number is real
  - Human verification (Contact talks to Member)
- **Cons**:
  - Manual process (not automated)
  - Contact may forget to call
  - Extra friction
- **Why not recommended**: Too manual, defeats purpose of automated check-ins.

**Option D: Phone optional (email-only login)**
- **How it works**: Remove phone number entirely. Email + PIN for login.
- **Pros**:
  - Simplest data model
  - Email handles everything
- **Cons**:
  - Breaks existing architecture (phone is deeply integrated)
  - May confuse elderly users who think of "phone" apps
  - Larger refactor needed
- **Why not recommended**: Phone number already integrated, no need to remove.

**MY RECOMMENDATION: Option A**
- Phone is login ID (unverified)
- No verification step needed
- Simplest, matches your stated requirements

---

### QUESTION 2: Member Invitation Method

**Background**: Contacts need to invite Members to join. Without SMS, we need email-based invitation.

**Option 1: Magic Link (URL deep link)**
- **How it works**:
  - Contact enters Member's email
  - Member receives email: "Jennifer invited you to Pruuf. Click here to get started: https://pruuf.me/invite/ABC123"
  - Clicking link opens App Store → after install, deep link auto-connects to Contact
- **Pros**:
  - One-click experience (modern, easy)
  - No code to type
  - Auto-connects after install
  - Industry standard (Uber, Airbnb use this)
- **Cons**:
  - Requires deep linking setup (iOS Universal Links, Android App Links)
  - May not work on all email clients
  - Elderly users may not understand "click this link"
- **Technical notes**: Requires `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` files on pruuf.me domain

**Option 2: Email Code (6-character code in email)**
- **How it works**:
  - Contact enters Member's email
  - Member receives email: "Your Pruuf invite code is: ABC123. Download the app and enter this code."
  - Member manually types ABC123 in app
- **Pros**:
  - Simple, no deep linking needed
  - Works on all email clients
  - Familiar pattern (like verification codes)
- **Cons**:
  - Extra step (manual code entry)
  - Elderly users may mistype code
  - No auto-connection
- **Technical notes**: Easier to implement, just email template + code validation

**Option 3: QR Code (visual code in email)**
- **How it works**:
  - Contact enters Member's email
  - Member receives email with QR code
  - Member scans QR code → App Store → auto-connects
- **Pros**:
  - No typing needed
  - Modern, works well on smartphones
- **Cons**:
  - Elderly users may not know how to scan QR codes
  - Requires camera permission
  - May not work if Member checks email on same phone (can't scan)
- **Technical notes**: QR code contains deep link URL

**Option 4: Hybrid (Magic Link + Manual Code Fallback)** ⭐ RECOMMENDED
- **How it works**:
  - Contact enters Member's email
  - Member receives email with:
    - Primary CTA: "Get Started" button (magic link)
    - Fallback: "Or enter code manually: ABC123"
  - Member can click button OR download app and type code
- **Pros**:
  - Best of both worlds
  - Tech-savvy users click link (easy)
  - Less tech-savvy users type code (familiar)
  - Guaranteed to work
- **Cons**:
  - More complex email template
  - Two code paths to maintain
- **Why recommended**: Accommodates both tech levels, ensures success

**MY RECOMMENDATION: Option 4 (Hybrid)**
- Magic link for easy path
- Manual code for reliability
- Elderly-friendly fallback

---

### QUESTION 3: Members Without Email

**Background**: Some elderly Members may not have email or check it rarely.

**Option A: Email required**
- **How it works**: Members must provide email during onboarding. No email = cannot join.
- **Pros**:
  - Clean data model
  - Ensures deliverability
- **Cons**:
  - Excludes elderly without email
  - May reduce adoption
- **Why**: Forces modern communication channel

**Option B: Contact can invite via phone number (send code themselves)** ⭐ RECOMMENDED
- **How it works**:
  - If Member has no email, Contact enters phone number instead
  - System generates code ABC123
  - Contact manually shares code with Member (via call, text from personal phone, in person)
  - Member downloads app, enters code
- **Pros**:
  - Flexible (Contact chooses how to share)
  - Supports email-less elderly
  - Contact can explain over phone
- **Cons**:
  - Manual step (Contact must remember to share code)
  - No automated delivery
- **Why recommended**: Maximizes accessibility, Contact can use their own communication method

**Option C: Alternative contact (Contact enters their own email for Member's invites)**
- **How it works**: Contact provides their email as Member's contact email. All Member invites go to Contact.
- **Pros**:
  - Workaround for email-less Members
  - Contact manages everything
- **Cons**:
  - Confusing (whose email is it?)
  - Contact gets Member's emails
  - Poor UX
- **Why not recommended**: Confusing ownership

**Option D: Multiple invitation methods (email OR phone OR in-person code)**
- **How it works**: Contact chooses invitation method: email, phone number (for manual sharing), or generate code for in-person setup.
- **Pros**:
  - Maximum flexibility
  - Handles all scenarios
- **Cons**:
  - Complex UI (Contact must choose method)
  - More code paths
- **Why not recommended**: Over-engineered

**MY RECOMMENDATION: Option B**
- Email preferred
- Phone number fallback (Contact manually shares code)
- Flexible for elderly population

---

### QUESTION 4: Missed Check-in Alert Delivery

**Background**: This is the CRITICAL alert. If Member misses check-in, Contact MUST be notified. Push notifications fail if app is force-quit.

**Option A: Push + Email (redundant delivery)** ⭐ RECOMMENDED
- **How it works**:
  - 10:00 AM: Member misses check-in
  - System sends:
    - Push notification (high priority)
    - Email alert: "🚨 Mom missed her 10 AM check-in. Last seen: Yesterday 9:30 AM. Call her: (555) 987-6543"
  - If app is running: Push notification appears immediately
  - If app is force-quit: Email ensures delivery
- **Pros**:
  - Redundant delivery (guaranteed Contact is notified)
  - Email works even if phone is off/force-quit
  - Industry standard for critical alerts (banking, security apps)
  - Email has call-to-action link
- **Cons**:
  - Requires email service integration (SendGrid, Postmark, etc.)
  - Contact may ignore email if expecting only push
  - Dual notification may feel redundant when app is running
- **Why recommended**: Critical alerts cannot be missed. Email is fail-safe.

**Option B: Push-only + Warning to Contact**
- **How it works**:
  - Only send push notification
  - During Contact onboarding, show warning: "Keep Pruuf app running in background to receive alerts"
  - Accept that force-quit = missed alert
- **Pros**:
  - Simpler (no email needed)
  - No email service cost
- **Cons**:
  - CRITICAL ALERTS MAY BE MISSED
  - Unacceptable for safety app
  - Liability issue (elderly person in danger, Contact never notified)
- **Why not recommended**: Defeats purpose of safety app

**Option C: Push + Background refresh + Foreground service**
- **How it works**:
  - Use iOS background app refresh + Android foreground service
  - Even if app not actively used, background process checks for missed check-ins
  - Send local notification from background
- **Pros**:
  - No email needed
  - Works even when app "closed"
- **Cons**:
  - Does NOT work if app is force-quit (iOS limitation)
  - Android foreground service shows persistent notification (annoying)
  - Battery drain concerns
  - Still unreliable
- **Why not recommended**: iOS force-quit kills background processes. Not reliable enough.

**Option D: Push + iOS Critical Alerts**
- **How it works**:
  - Apply for iOS Critical Alerts entitlement (Apple special permission)
  - Critical alerts bypass Do Not Disturb, silent mode, even force-quit (if approved)
  - Android: Use high-priority FCM
- **Pros**:
  - Highest priority possible
  - Bypasses all user settings
- **Cons**:
  - Apple rarely approves (only for health, safety, security apps - we may qualify)
  - Application process takes weeks
  - NOT guaranteed approval
  - Does NOT work if force-quit (common misconception)
  - Android equivalent is unreliable
- **Why not recommended**: Force-quit still blocks it. Not reliable.

**Option E: Push + Phone Call (automated voice call)**
- **How it works**:
  - Member misses check-in
  - Send push notification
  - If no response after 5 minutes, trigger automated phone call to Contact: "This is Pruuf. Your Member [Name] has missed their check-in. Please call them."
- **Pros**:
  - Guaranteed delivery (phone call always works)
  - Extremely attention-getting
  - Works if force-quit
- **Cons**:
  - Requires Twilio Voice API (different from SMS, allowed if just for calls)
  - Expensive (~$0.013/minute)
  - May startle Contact
  - Could be intrusive
- **Why not recommended**: You said no SMS; phone calls may fall under same restriction. Also expensive.

**MY RECOMMENDATION: Option A (Push + Email)**
- Push for immediate notification
- Email as fail-safe backup
- Only way to guarantee delivery
- Critical for safety app

---

### QUESTION 5: Check-in Confirmation Notifications

**Background**: When Member checks in successfully, Contact receives confirmation "Mom checked in at 9:45 AM."

**Option A: Push only** ⭐ RECOMMENDED
- **How it works**: Send push notification only.
- **Pros**:
  - Simpler (no email)
  - Immediate feedback
  - Lower cost
- **Cons**:
  - Contact may miss if app force-quit
- **Why recommended**: Confirmations are non-critical (good news, not emergency). Missing one confirmation won't cause harm. Contact will see it next time they open app.

**Option B: Push + Email**
- **How it works**: Send both push and email for every check-in.
- **Pros**:
  - Redundant delivery
- **Cons**:
  - Email overload (30 emails/month for daily check-ins)
  - Contact may mark as spam
  - Unnecessary for non-critical updates
- **Why not recommended**: Too many emails for good news.

**Option C: Push + Daily Email Digest**
- **How it works**: Send push immediately, send one daily email summary: "Today's check-ins: Mom ✓ 9:45 AM, Dad ✓ 10:15 AM"
- **Pros**:
  - Email backup without overload
  - Nice summary view
- **Cons**:
  - Delayed email (not immediate)
  - More complex
- **Why not recommended**: Over-engineered for confirmations.

**Option D: No notifications (Contact checks app manually)**
- **How it works**: Don't send any notifications for successful check-ins. Contact opens app to see status.
- **Pros**:
  - Minimal notifications
  - Reduces noise
- **Cons**:
  - Contact doesn't know if Member checked in
  - Defeats purpose of passive monitoring
- **Why not recommended**: Users want peace of mind without opening app.

**MY RECOMMENDATION: Option A (Push only)**
- Non-critical update
- Push sufficient
- Save email for critical alerts only

---

### QUESTION 6A: Android Persistent Notification

**Background**: Android can show persistent notification that keeps app "alive" in background.

**Option: Yes** ⭐ RECOMMENDED
- **How it works**: Show permanent notification: "Pruuf is monitoring your Members"
- **Pros**:
  - Prevents Android from killing app
  - Increases push notification reliability
  - Industry standard (Slack, WhatsApp do this)
- **Cons**:
  - Takes up notification space
  - Some users find annoying
  - Can be dismissed (defeats purpose)
- **Why recommended**: Significantly improves reliability on Android. Worth the UX trade-off for safety app.

**Option: No**
- **How it works**: Don't show persistent notification. Rely on Android's background limits.
- **Pros**:
  - Cleaner notification tray
- **Cons**:
  - App likely to be killed by Android
  - Missed push notifications
- **Why not recommended**: Android aggressively kills background apps. Unreliable.

**MY RECOMMENDATION: Yes**
- Use persistent notification on Android
- Critical for reliability

---

### QUESTION 6B: iOS Critical Alerts Entitlement

**Background**: Apple offers special entitlement for critical alerts (health, safety, security apps).

**Option: Apply** ⭐ RECOMMENDED
- **How it works**:
  - Apply to Apple explaining Pruuf is elderly safety app
  - If approved, critical alerts bypass Do Not Disturb, silent mode
  - NOT force-quit (common misconception)
- **Pros**:
  - Higher priority alerts
  - Better chance of delivery
  - Professional approach
  - We likely qualify (safety/health app)
- **Cons**:
  - Application process takes 2-4 weeks
  - Not guaranteed approval
  - Doesn't solve force-quit issue
- **Why recommended**: Worth applying. We qualify as safety app. Improves delivery even if not perfect.

**Option: Skip**
- **How it works**: Don't apply, use standard push notifications.
- **Pros**:
  - No application delay
  - Simpler
- **Cons**:
  - Lower priority alerts
  - Can be silenced by Do Not Disturb
- **Why not recommended**: We qualify, so why not apply? Improves UX.

**MY RECOMMENDATION: Apply**
- Safety app qualifies
- Improves alert delivery
- Worth 2-4 week wait

---

### QUESTION 7: Email Verification Purpose

**Background**: Determine what email verification actually validates.

**Option A: Verifies user owns email (identity verification)** ⭐ RECOMMENDED
- **How it works**:
  - User enters email
  - System sends code
  - User enters code
  - Email confirmed as valid and owned by user
- **Pros**:
  - Prevents fake emails
  - Confirms deliverability for critical alerts
  - Industry standard
- **Cons**:
  - Extra step during onboarding
- **Why recommended**: If we're using email for critical alerts, MUST verify it works.

**Option B: Just checks email format (no verification code)**
- **How it works**: User enters email, system validates format (has @ symbol, valid domain), no code sent.
- **Pros**:
  - Faster onboarding
  - No verification delay
- **Cons**:
  - User can enter fake email
  - Critical alerts may bounce
  - No confirmation email works
- **Why not recommended**: Unverified email = unreliable critical alerts. Unacceptable.

**MY RECOMMENDATION: Option A**
- Must verify email for critical alerts
- Can't risk bounced emergency emails

---

### QUESTION 8: Overall Architecture Choice

**Option 1: Push + Email Hybrid** ⭐ RECOMMENDED

**Architecture**:
```
MEMBER ONBOARDING:
1. Enter: email, phone (unverified), 4-digit PIN
2. Verify email (code sent)
3. Phone stored but unverified (just login ID)
4. Set check-in time

CONTACT ONBOARDING:
1. Enter: email, phone (unverified), 4-digit PIN
2. Verify email
3. Invite Members

MEMBER INVITATION:
1. Contact enters Member email
2. Member receives email:
   - Magic link: https://pruuf.me/invite/ABC123 (opens App Store → auto-connect)
   - Fallback: "Or download app and enter code: ABC123"
3. Member clicks link or enters code
4. Connected to Contact

MISSED CHECK-IN ALERT:
1. Push notification (high priority) to Contact
2. Email alert to Contact: "🚨 Mom missed check-in. Call her: (555) 987-6543"
3. Redundant delivery ensures notification

CHECK-IN CONFIRMATION:
1. Push notification only: "Mom checked in ✓"
2. No email (reduces noise)

DAILY REMINDER (Member):
1. Push notification: "Time for your check-in"
2. No email
```

**Pros**:
- Redundant critical alerts (guaranteed delivery)
- Email works even if app force-quit
- Push for immediate feedback
- Balances reliability and UX
- Industry standard for safety apps

**Cons**:
- Requires email service integration (cost: ~$10/month for 10,000 emails)
- Two notification channels to maintain
- Contacts may feel email is redundant (but it's the backup)

**Cost**:
- Email service (Postmark): $10/month for 10,000 emails
- Push notifications (Firebase): Free
- Total added cost: ~$10/month

**Why recommended**:
- Safety app cannot miss critical alerts
- Email is only reliable backup for force-quit scenario
- You said "do whatever is needed for the app to be able to run as designed"
- This is what's needed

---

**Option 2: Push-only (Accept Force-Quit Risk)**

**Architecture**:
```
EVERYTHING SAME AS OPTION 1 EXCEPT:
- No email alerts
- Only push notifications
- Warning to Contacts: "Keep app running for alerts"
```

**Pros**:
- Simpler (no email service)
- Lower cost
- Less code to maintain

**Cons**:
- CRITICAL ALERTS MISSED if force-quit
- Unacceptable for safety app
- Liability issue
- Defeats core product purpose

**Why not recommended**:
- You said "do whatever is needed for the app to be able to run as designed"
- App cannot function as designed without reliable critical alerts
- Email is the ONLY way to guarantee delivery

---

**Option 3: Push + Automated Phone Calls**

**Architecture**:
```
MISSED CHECK-IN:
1. Push notification
2. Wait 5 minutes
3. If no response, automated call to Contact: "This is Pruuf. Your Member has missed check-in."
```

**Pros**:
- Guaranteed delivery (phone calls always work)
- Extremely attention-getting

**Cons**:
- Requires Twilio Voice API
- You said no SMS (phone calls may fall under same restriction)
- Expensive (~$0.013/minute)
- May be too intrusive
- Complex to implement

**Why not recommended**: May violate "no Twilio" requirement. Expensive. Over-engineered.

---

### QUESTION 9: Email Service Provider

**Option 1: Postmark** ⭐ RECOMMENDED
- **Pricing**: $10/month for 10,000 emails (first 100 free)
- **Pros**:
  - Excellent deliverability (transactional email specialist)
  - Simple API
  - Great documentation
  - Beautiful default templates
  - Detailed analytics
  - Used by Basecamp, GitHub
- **Cons**:
  - More expensive than AWS SES
- **Why recommended**: Best deliverability for critical alerts. Worth extra cost.

**Option 2: SendGrid**
- **Pricing**: Free tier (100 emails/day), $15/month for 40,000 emails
- **Pros**:
  - Generous free tier
  - Good documentation
  - Popular (Uber, Airbnb use it)
- **Cons**:
  - Deliverability issues reported
  - Complex UI
  - Requires domain authentication setup
- **Why not recommended**: Deliverability less reliable than Postmark.

**Option 3: AWS SES**
- **Pricing**: $0.10 per 1,000 emails (cheapest)
- **Pros**:
  - Extremely cheap
  - Scales infinitely
  - Part of AWS ecosystem
- **Cons**:
  - Complex setup (IAM, domain verification)
  - Requires getting out of "sandbox" mode (manual approval)
  - Harder to debug
  - No templates (need to build your own)
- **Why not recommended**: Too complex for MVP. Save for scale.

**Option 4: Resend**
- **Pricing**: $20/month for 50,000 emails
- **Pros**:
  - Modern developer experience
  - React Email templates (beautiful)
  - Simple API
- **Cons**:
  - Newer service (less proven)
  - More expensive
- **Why not recommended**: Postmark is more proven for critical emails.

**MY RECOMMENDATION: Postmark**
- Best deliverability
- Simple setup
- Worth $10/month for safety app

---

### QUESTION 10: Contact Phone Number Requirement

**Option: Keep phone number** ⭐ RECOMMENDED
- **How it works**: Contacts enter phone + email during onboarding
- **Pros**:
  - Matches Member onboarding (consistency)
  - Available for future features (phone call escalation if needed)
  - Minimal change to existing architecture
- **Cons**:
  - Stores data not currently used
- **Why recommended**: Consistency with Members, future-proof, minimal change

**Option: Switch to email-only**
- **How it works**: Contacts only enter email, no phone
- **Pros**:
  - Less data collected
  - Simpler form
- **Cons**:
  - Inconsistent with Members
  - Larger refactor needed
  - Removes future phone call option
- **Why not recommended**: Unnecessary refactor, removes flexibility

**MY RECOMMENDATION: Keep phone**
- Consistency
- Future-proof
- Minimal change

---

### QUESTION 11: Support Email

**Option: support@pruuf.me** ⭐ RECOMMENDED
- **Why recommended**: Matches domain (pruuf.me), professional, consistent

**Alternative: hello@pruuf.me**
- **Why not recommended**: "support" is clearer for help emails

**MY RECOMMENDATION: support@pruuf.me**

---

### QUESTION 12: Email Template Format

**Option: Both (Plain text + HTML)** ⭐ RECOMMENDED
- **How it works**: Send multipart emails with both plain text and HTML versions
- **Pros**:
  - HTML version: Beautiful, branded, has buttons/links
  - Plain text fallback: Works on all email clients, accessibility
  - Industry standard
- **Cons**:
  - More complex templates
- **Why recommended**: Best compatibility, professional appearance

**Option: HTML only**
- **Pros**: Beautiful, easier to maintain (one template)
- **Cons**: Accessibility issues, some email clients block HTML
- **Why not recommended**: Critical alerts must work everywhere

**Option: Plain text only**
- **Pros**: Maximum compatibility, simple
- **Cons**: Ugly, no branding, no buttons
- **Why not recommended**: Looks unprofessional

**MY RECOMMENDATION: Both (multipart)**
- Professional + accessible
- Industry standard

---

## FINAL RECOMMENDATIONS SUMMARY

| Question | Recommendation | Why |
|----------|---------------|-----|
| 1. Phone verification | **A** - No verification (login ID only) | Phone is just username per your requirement |
| 2. Invitation method | **4** - Hybrid (magic link + code) | Best of both worlds, elderly-friendly |
| 3. Members without email | **B** - Manual code sharing | Flexible, accessible |
| 4. Missed check-in alerts | **A** - Push + Email | Only reliable option for critical alerts |
| 5. Check-in confirmations | **A** - Push only | Non-critical, push sufficient |
| 6A. Android persistent | **Yes** | Improves reliability significantly |
| 6B. iOS Critical Alerts | **Apply** | We qualify, improves delivery |
| 7. Email verification | **A** - Verify ownership | Must ensure emails work for critical alerts |
| 8. Architecture | **1** - Push + Email Hybrid | Only architecture that guarantees delivery |
| 9. Email service | **Postmark** | Best deliverability for critical emails |
| 10. Contact phone | **Keep** | Consistency, future-proof |
| 11. Support email | **support@pruuf.me** | Professional, clear |
| 12. Email format | **Both** (multipart) | Professional + accessible |

---

## APPROVED ARCHITECTURE (PROCEEDING WITH THIS)

**Push + Email Hybrid**

**User Flows**:

```
CONTACT ONBOARDING:
1. Enter email, phone, PIN
2. Email verification code sent
3. Enter code, verified
4. Select font size
5. Trial welcome
6. Invite first Member

MEMBER ONBOARDING:
1. Receive invite email (magic link + code)
2. Click link → App Store → install
3. Deep link auto-opens app with code pre-filled
4. OR: Download manually, enter code ABC123
5. Enter email, phone, PIN
6. Verify email
7. Set check-in time
8. Complete

DAILY CHECK-IN:
1. 9:00 AM: Member gets push reminder
2. Member taps "I'm OK"
3. Contacts receive push: "Mom checked in ✓"
4. No email (non-critical)

MISSED CHECK-IN:
1. 10:00 AM: Deadline passes
2. Contacts receive:
   - Push notification (high priority)
   - Email: "🚨 Mom missed check-in"
3. Redundant delivery guaranteed

LATE CHECK-IN:
1. 10:15 AM: Member checks in
2. Contacts receive:
   - Push: "Mom checked in (15 min late)"
   - Email: "Update: Mom checked in at 10:15 AM"
```

---

## IMPLEMENTATION CHECKLIST

This architecture requires:

### New Services:
- [ ] Email service integration (Postmark)
- [ ] Deep linking setup (iOS Universal Links, Android App Links)
- [ ] Email template design (HTML + plain text)

### Remove:
- [ ] All Twilio SMS code
- [ ] SMS verification flows
- [ ] SMS notification templates
- [ ] Twilio webhook handlers

### Update:
- [ ] Domain: pruuf.me → pruuf.me
- [ ] Bundle ID: me.pruuf.app → me.pruuf.app
- [ ] Authentication: Add email verification
- [ ] Invitations: Email-based with magic links
- [ ] Notifications: Push + Email for critical, Push-only for non-critical
- [ ] Database: Add email fields, remove SMS-related fields

### New Frontend:
- [ ] Email verification screen
- [ ] Magic link handling (deep link receiver)
- [ ] Email input fields in onboarding

### New Backend:
- [ ] Email sending service
- [ ] Email templates (invite, missed check-in, late check-in, verification)
- [ ] Deep link generation (invite codes)
- [ ] Email verification endpoint

---

## COST ANALYSIS

**Current (with SMS)**:
- Twilio SMS: ~$0.28/Contact/month (35 messages × $0.008)
- Push: Free
- **Total**: ~$0.28/Contact/month

**New (Push + Email)**:
- Push: Free
- Email (Postmark): $10/month base (covers 10,000 emails)
  - Per Contact: ~10 emails/month (invite, ~2 missed alerts, verification)
  - 100 Contacts = 1,000 emails/month
  - 1,000 Contacts = 10,000 emails/month
- **Total**: $10/month fixed (up to 1,000 Contacts)

**Savings at 100 Contacts**: $28/month - $10/month = **$18/month saved**
**Savings at 1,000 Contacts**: $280/month - $10/month = **$270/month saved**

Email is significantly cheaper at scale.

---

## PROCEEDING NOW

I am now proceeding to implement this architecture:
1. Redo Phase 1.1 (pruuf.me → pruuf.me, me.pruuf.app → me.pruuf.app)
2. Continue through all 16 subsections with SMS removal + email integration
3. Update all tracking documents

