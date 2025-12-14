# PRUUF SMS → PUSH-ONLY MIGRATION ANALYSIS

**Created**: 2025-12-07
**Status**: ANALYSIS PHASE - AWAITING APPROVAL
**Critical**: Do NOT code until all conflicts resolved

---

## CONFIRMED DECISIONS

1. ✅ Push notifications only (no SMS for notifications)
2. ✅ Email for verification only
3. ✅ Domain: `pruuf.me` (final and permanent)
4. ✅ Bundle ID: `me.pruuf.app` (Android + iOS)
5. ✅ No published apps exist (clean slate)
6. ✅ Redo Phase 1.1 with `pruuf.me`
7. ✅ Accept risk of missed alerts if app force-quit
8. ✅ Member invites via email
9. ✅ Phone number = login identifier only (not for notifications)

---

## OPEN CONFLICTS REQUIRING DECISIONS

### CONFLICT 1: PHONE NUMBER VERIFICATION

**Your statement:** "It seems like verifying the phone number at all is no longer needed."

**Current flow:**
- Member enters phone number
- Member receives SMS code
- Member enters code → phone verified
- Phone becomes login identifier

**Problem:** Without SMS, how do we verify phone ownership?

**Why verification matters:**
1. Prevents fake accounts (spam, abuse)
2. Ensures Contact can actually reach Member by phone
3. Validates phone is real and reachable
4. Security: proves user owns the phone number they claim

**Counter-argument for NO verification:**
- Phone is just a login ID (like username)
- Contacts can call/text Member directly if needed
- If phone is wrong, Contact will discover it naturally
- Simpler onboarding flow

**YOUR DECISION NEEDED:**

**Option A: No phone verification at all**
- Member enters phone + PIN
- We trust the phone number is correct
- No verification step
- Pros: Simplest flow, fastest onboarding
- Cons: Fake numbers possible, no guarantee Contact can reach Member

**Option B: Email verification proves identity (phone unverified)**
- Member enters email + phone + PIN
- We verify email (send code)
- Phone is unverified but stored
- Pros: Proves real person, simple
- Cons: Phone could be wrong/fake

**Option C: Two-step verification (email + phone call)**
- Member enters email + phone + PIN
- We verify email
- Contact must call phone to verify it works (manual verification)
- Pros: Both verified
- Cons: Requires Contact to test-call Member

**Option D: Phone number optional (email-only login)**
- Member login = email + PIN (no phone at all)
- Contact invites Member via email
- Contacts get Member's phone from Member profile (Member enters it later)
- Pros: No phone verification needed
- Cons: Major architecture change

**MY RECOMMENDATION: Option A** - Phone is unverified login ID. If Contact needs to reach Member and phone is wrong, they'll discover it organically. The friction of verification doesn't match the actual risk.

**QUESTION 1: Which option for phone verification?**

---

### CONFLICT 2: MEMBER INVITATION METHODS

**Your statement:** "I want the invites to members to be by email."

**Current SMS flow:**
1. Contact enters Member name + phone
2. Member receives SMS: "Download Pruuf, enter code ABC123"
3. Member downloads app, enters code
4. Connected

**New email flow needs design:**

**OPTION 1: Email with Magic Link**
- Contact enters Member name + email
- Member receives email: "Jennifer invited you to Pruuf"
- Email contains magic link: `https://pruuf.me/invite/ABC123`
- Member clicks link → redirects to App Store/Play Store
- Member downloads app
- Member opens app → auto-connects (deep link with code)
- Pros: One-click, no code entry, modern UX
- Cons: Requires deep linking setup, Member must click from email

**OPTION 2: Email with Invite Code**
- Contact enters Member name + email
- Member receives email: "Download Pruuf and enter code ABC123"
- Member downloads app manually
- Member opens app, enters code ABC123
- Connected
- Pros: Simple, works even if link breaks
- Cons: Member must type code, extra step

**OPTION 3: QR Code via Email**
- Contact enters Member name + email
- Member receives email with QR code
- Member downloads app
- Member scans QR code in app
- Connected
- Pros: No typing, visual
- Cons: Requires camera access, elderly users may struggle

**MY RECOMMENDATION: Option 1 (Magic Link) with Option 2 as fallback**

**Implementation:**
- Email contains both magic link AND code
- Template:
  ```
  Jennifer invited you to Pruuf!

  Tap this button to get started:
  [Download Pruuf] → https://pruuf.me/invite/ABC123

  Or download manually and enter code: ABC123
  ```
- If Member clicks link → App Store → installs → opens → auto-connects (deep link)
- If Member doesn't click link → manual download → enter code ABC123

**QUESTION 2: Which invitation method? (I recommend Option 1 + Option 2 hybrid)**

---

### CONFLICT 3: EMAIL REQUIREMENT FOR MEMBERS

**New requirement:** Email is required for invites and verification

**Problem:** Your spec says Members are elderly (65-90+) with "low to moderate" tech comfort

**From CLAUDE.md:**
> "Technology comfort: Low to moderate; may own smartphone but uses limited features"
> "Cognitive considerations: Generally sharp but may struggle with multi-step processes"

**Email usage by age:**
- 65-74: ~75% use email regularly
- 75+: ~50% use email regularly
- Many elderly users check email infrequently (once a week)

**Conflict scenarios:**

**Scenario A: Member doesn't have email**
- Contact wants to invite 85-year-old mother who doesn't use email
- Current solution: ??? Can't invite them
- This breaks a core user persona

**Scenario B: Member rarely checks email**
- Contact sends invite
- Member doesn't see email for 3 days
- Contact calls: "Did you get my email?" "What email?"
- Friction

**SOLUTION OPTIONS:**

**Option A: Email required (strict)**
- All Members must have email
- Contact must get Member's email before inviting
- May exclude some elderly users
- Pros: Clean, consistent flow
- Cons: Excludes email-less elderly users

**Option B: Email OR phone (flexible)**
- Contact can invite via email OR phone
- If phone: Contact enters phone → Member receives push notification (requires app installed first - circular problem)
- Doesn't work
- Rejected

**Option C: Contact sets up Member's account in-person**
- Contact physically takes Member's phone
- Contact installs Pruuf on Member's phone
- Contact sets up account (email, PIN, etc.)
- Contact connects their own account
- No invite needed
- Pros: Works for non-tech-savvy elderly
- Cons: Requires physical access, defeats "remote monitoring" purpose

**Option D: Invite code sharing via any method (open-ended)**
- System generates invite code: ABC123
- Contact shares code with Member however they want (call, text, in-person, etc.)
- Member downloads app, enters code
- Connected
- Pros: Flexible, works for all situations
- Cons: Relies on Contact to communicate code, no email verification

**MY RECOMMENDATION: Option D** - Generate invite code, Contact shares it however they want. If Contact wants to email it, they can. If they want to tell Member over the phone, they can. If they want to set up in-person, they can.

**This solves:**
- Email-less Members (Contact tells them code verbally)
- Remote invites (Contact emails/texts code)
- In-person setup (Contact enters code themselves)

**QUESTION 3: How to handle Members without email? (I recommend Option D - flexible code sharing)**

---

### CONFLICT 4: MISSED CHECK-IN ALERTS WITHOUT SMS

**Critical safety issue:** Contact MUST receive alerts when Member misses check-in.

**Current flow:**
1. Member misses 10 AM deadline
2. Backend cron job detects miss at 10:01 AM
3. Backend sends SMS to all Contacts
4. Backend sends push notification to all Contacts
5. Contacts receive alert even if app is closed/deleted

**New push-only flow:**

**Problem:** Push notifications don't work if:
- App is force-quit
- App is uninstalled
- Phone is off
- Do Not Disturb is on
- Push token expired/invalid
- iOS background restrictions kill app

**Your acceptance:** "I am ok for them to receive critical updates if the app is force-quit. Do whatever is needed for the app to be able to run as designed."

**But push notifications CANNOT be delivered to force-quit apps. This is an iOS/Android OS limitation, not a coding issue.**

**SOLUTION OPTIONS:**

**Option A: Push + Email for critical alerts**
- Missed check-in → Send push notification + email
- Email subject: "🚨 Mom missed her 10 AM check-in"
- Pros: Redundant delivery, email works when app is off
- Cons: Relies on Contact checking email

**Option B: Push + Critical Alert sound (iOS only)**
- Use iOS Critical Alerts (bypasses Do Not Disturb)
- Requires special Apple entitlement
- Only works on iOS, not Android
- Pros: Alerts even in DND mode
- Cons: Doesn't work if app is force-quit, Android unsupported

**Option C: Push only + background app refresh**
- Enable background app refresh
- App runs in background every 15 minutes
- Checks for missed check-ins, shows local notification
- Pros: Works even if app not actively open
- Cons: Still fails if force-quit, battery drain

**Option D: Push + SMS for missed check-ins ONLY**
- All routine notifications = push only
- Missed check-ins = push + SMS (safety fallback)
- Pros: Guaranteed delivery for critical alerts
- Cons: Still uses SMS (you said no SMS)

**Option E: Push + Phone call (automated)**
- Missed check-in → Push notification
- If no acknowledgment within 5 min → Automated phone call to Contact
- "This is Pruuf. [Member name] has not checked in. Press 1 to acknowledge."
- Pros: Impossible to miss, works without app
- Cons: Intrusive, requires phone service integration (Twilio)

**MY RECOMMENDATION: Option A (Push + Email)** - Most practical without SMS. Email is asynchronous but reliable.

**Backup recommendation if Option A fails:** Option D (Push + SMS for missed check-ins only). You said no SMS, but safety trumps cost.

**QUESTION 4: How to ensure Contact receives missed check-in alerts? (I recommend Option A: Push + Email)**

---

### CONFLICT 5: CHECK-IN CONFIRMATIONS (POSITIVE NOTIFICATIONS)

**Current flow:**
- Member checks in at 9:45 AM
- Contact receives SMS: "Mom checked in at 9:45 AM. All is well!"
- Contact receives push: "Mom checked in ✓"

**Your Phase 6.1 requirement:** "SMS-only for on-time/late"

**But you also said:** "No SMS for anything"

**These conflict.**

**Proposed new flow:**
- Member checks in at 9:45 AM
- Contact receives push: "Mom checked in at 9:45 AM ✓"
- No SMS

**Problem:** If Contact's app is force-quit, they don't get confirmation.

**SOLUTION OPTIONS:**

**Option A: Push only (accept risk)**
- On-time check-in → push only
- If Contact misses it, they miss it
- Pros: No SMS cost
- Cons: Contact may not see confirmation

**Option B: Push + Email for all check-ins**
- Every check-in → push + email
- Pros: Redundant delivery
- Cons: Email spam (30+ emails/month if monitoring multiple Members)

**Option C: Push + daily email digest**
- Real-time push for check-ins
- End of day email: "Today's check-in summary: Mom ✓ 9:45 AM, Dad ✓ 10:30 AM"
- Pros: One email/day, complete record
- Cons: Not real-time

**Option D: No confirmation notifications at all**
- Member checks in → data recorded
- Contact opens app to see status
- No proactive notifications for on-time check-ins
- Pros: Clean, no spam
- Cons: Contact must remember to check app

**MY RECOMMENDATION: Option A (Push only)** - On-time check-ins are positive signals, less critical than missed check-ins. If Contact wants to verify, they can open app.

**Alternative for anxious Contacts: Option C (Daily digest email)**

**QUESTION 5: How to handle check-in confirmations? (I recommend Option A: Push only, skip if app offline)**

---

### CONFLICT 6: BACKGROUND APP EXECUTION FOR RELIABILITY

**You said:** "Do whatever is needed for the app to be able to run as designed."

**Problem:** iOS and Android aggressively kill background apps to save battery.

**To make push-only work, we need:**

1. **Background App Refresh (iOS)**
   - Allows app to wake up periodically
   - Unreliable (OS decides when to wake app)
   - User can disable in Settings

2. **Background Fetch (Android)**
   - Similar to iOS
   - WorkManager for scheduled tasks
   - Still gets killed if user force-quits

3. **Foreground Service (Android)**
   - Persistent notification: "Pruuf is running"
   - App stays alive
   - Pros: Reliable
   - Cons: Annoying persistent notification, battery drain

4. **Critical Alerts Entitlement (iOS)**
   - Requires Apple approval
   - Used for emergency apps (medical, safety)
   - Bypasses Do Not Disturb
   - Pros: Alerts even in DND
   - Cons: Doesn't work if force-quit, requires justification to Apple

**REQUIRED IMPLEMENTATIONS:**

**For Member app:**
- Background app refresh: Check for reminder time, show local notification
- If disabled/killed: Member won't get reminder (acceptable, their responsibility)

**For Contact app:**
- Background app refresh: Listen for push notifications
- Critical Alerts (iOS): Request entitlement for missed check-in alerts
- Foreground service (Android): Show persistent notification "Monitoring X members"

**QUESTION 6A: Are you OK with persistent notification on Android ("Pruuf is monitoring Mom") to ensure alerts work?**

**QUESTION 6B: Should we apply for iOS Critical Alerts entitlement? (Requires explaining to Apple why Pruuf is safety-critical)**

---

### CONFLICT 7: EMAIL VERIFICATION FLOW

**You said:** "Email for verification only"

**Unclear:** Verification of what?

**Interpretation A: Email verifies user identity (not phone)**
- User enters: email, phone, PIN
- We send verification code to email
- User enters code
- Email verified ✓
- Phone unverified (just stored)

**Interpretation B: Email verifies Member invitation**
- Contact invites Member via email
- Member clicks link in email
- Email verified ✓ (proves they own the email)
- Phone entered later, unverified

**QUESTION 7: What exactly does email verify? (I assume Interpretation A: user identity)**

---

## PROPOSED NEW ARCHITECTURE

Based on answers above, here are 3 complete workflow designs:

### ARCHITECTURE OPTION 1: PUSH + EMAIL HYBRID (RECOMMENDED)

**Member Onboarding:**
1. Member downloads app
2. Member enters: email, phone number, 4-digit PIN
3. App sends verification code to email
4. Member enters code → email verified ✓
5. Member sets check-in time (e.g., 10 AM)
6. Done (phone unverified, just login ID)

**Contact Onboarding:**
1. Contact downloads app
2. Contact enters: email, phone number, 4-digit PIN
3. App sends verification code to email
4. Contact enters code → email verified ✓
5. Contact can now invite Members

**Member Invitation:**
1. Contact taps "Invite Member"
2. Contact enters: Member name, Member email
3. Backend generates invite code: ABC123
4. Backend sends email to Member:
   ```
   Subject: Jennifer invited you to Pruuf Safety Check-In

   Hi there,

   Jennifer invited you to Pruuf, a daily check-in app.

   Download Pruuf and connect:
   [Download Pruuf] → https://pruuf.me/invite/ABC123

   Or download manually:
   - iOS: https://apps.apple.com/app/pruuf
   - Android: https://play.google.com/store/apps/details?id=me.pruuf.app

   Then enter this code: ABC123

   Questions? Contact Jennifer at (555) 123-4567
   ```
5. Member receives email
6. Member clicks link → App Store → installs → opens
7. App deep link auto-fills invite code
8. Member completes onboarding (email, phone, PIN)
9. Member connected to Contact ✓

**Daily Check-In Flow:**
1. 9:00 AM: Member receives local push notification "Time to check in"
2. Member taps notification → app opens → "I'm OK" button
3. Member taps "I'm OK"
4. Backend records check-in
5. Backend sends push notification to Contact: "Mom checked in at 9:05 AM ✓"
6. If Contact's app is offline: Push fails silently (acceptable for positive confirmation)

**Missed Check-In Flow:**
1. 10:00 AM: Deadline passes, no check-in
2. Backend cron job detects miss
3. Backend sends:
   - Push notification to Contact (high priority)
   - Email to Contact:
     ```
     Subject: 🚨 Mom missed her 10 AM check-in

     Mom has not checked in by her 10:00 AM deadline.
     Last check-in: Yesterday at 9:45 AM

     You may want to call her: (555) 987-6543

     [Open Pruuf App]
     ```
4. Contact receives alert (push if app open, email if not)
5. Contact calls Member to check on them

**Late Check-In:**
1. 10:15 AM: Member checks in late
2. Backend records check-in
3. Backend sends update:
   - Push to Contact: "Mom checked in at 10:15 AM (15 min late) ✓"
   - Email to Contact:
     ```
     Subject: ✅ Update: Mom checked in (late)

     Good news! Mom checked in at 10:15 AM (15 minutes late).
     All is well.
     ```

**Pros:**
- No SMS costs
- Redundant delivery (push + email)
- Email works when app offline
- Simple, proven tech stack

**Cons:**
- Email slower than SMS (30s-2min delay)
- Spam filters may block emails
- Contact must check email
- Not as immediate as SMS

---

### ARCHITECTURE OPTION 2: PUSH-ONLY (AGGRESSIVE)

**Everything same as Option 1, but:**
- No email for alerts
- Only push notifications
- If Contact's app is offline → they miss the alert
- Rely on Contact opening app regularly

**Member Invitation:**
- Same email invite as Option 1 (need initial contact method)

**Missed Check-In:**
- Push notification only
- If push fails (app offline) → Contact doesn't know
- RISKY for safety product

**Pros:**
- Simplest implementation
- No email complexity

**Cons:**
- UNSAFE - Contact may miss critical alerts
- Defeats purpose of safety app
- Not recommended

**REJECTED** - Too risky for safety-critical product.

---

### ARCHITECTURE OPTION 3: PUSH + PHONE CALL FALLBACK

**Everything same as Option 1, but:**

**Missed Check-In Flow:**
1. 10:00 AM: Miss detected
2. Backend sends push notification
3. Backend waits 5 minutes
4. If Contact hasn't acknowledged push (hasn't opened app):
5. Backend makes automated phone call to Contact via Twilio Voice API:
   ```
   "This is Pruuf. [Member name] has not checked in today.
   Press 1 to acknowledge this alert.
   Press 2 to repeat this message."
   ```
6. Contact presses 1 → Backend records acknowledgment
7. Contact calls Member to check on them

**Pros:**
- Impossible to miss alert (phone call is intrusive)
- Works even without app installed
- Redundant safety (push → email → phone call)

**Cons:**
- Uses Twilio (voice calls, different from SMS but still costs money)
- Intrusive (phone call may scare Contact)
- Complex implementation

---

## MY FINAL RECOMMENDATION

**Architecture Option 1: Push + Email Hybrid**

**Why:**
1. No SMS (meets your requirement)
2. Redundant delivery (push + email ensures Contact gets alert)
3. Email is slower than SMS but acceptable for safety-critical (30s-2min delay)
4. Proven, simple tech stack
5. Works when app is offline

**Acceptable trade-offs:**
- Email delay (30s-2min) vs SMS (instant)
- Contact must check email if app offline
- Spam filter risk (mitigated with transactional email service like SendGrid/Postmark)

**Implementation requirements:**
- Transactional email service (SendGrid, Postmark, or AWS SES)
- Push notification service (Firebase Cloud Messaging - already planned)
- Deep linking (for magic link invites)
- Background app refresh (for reminders)

---

## IMPLEMENTATION CHECKLIST (WHAT CHANGES)

### Phase 1.1 (Domain Migration)
- ✅ Redo with `pruuf.me` instead of `pruuf.me`
- ✅ Bundle ID: `me.pruuf.app`

### Phase 2 (Backend - Phone Verification REMOVED)
- ❌ DELETE: Twilio SMS service entirely
- ❌ DELETE: Phone verification endpoints
- ✅ ADD: Email verification service (SendGrid/Postmark)
- ✅ ADD: Email verification endpoints
- ✅ KEEP: Inbound webhook endpoint (NOT for SMS, repurpose for email webhooks)

### Phase 3 (Backend - Invitations)
- ❌ DELETE: Member invite SMS
- ✅ ADD: Member invite email with magic link
- ✅ ADD: Deep link handler

### Phase 4 (Backend - Notifications)
- ❌ DELETE: All SMS notification code
- ✅ KEEP: Push notification code
- ✅ ADD: Email notification service
- ✅ ADD: Missed check-in email alerts
- ✅ ADD: Late check-in email updates

### Phase 5 (Frontend)
- ❌ DELETE: Phone verification screen (SMS code entry)
- ✅ ADD: Email verification screen (email code entry)
- ❌ DELETE: SMS-based invite code entry
- ✅ ADD: Email-based invite with magic link + manual code
- ✅ UPDATE: Onboarding flow (email instead of SMS)

### Phase 6 (Notification Strategy)
- ❌ DELETE: "SMS-only for on-time/late"
- ✅ UPDATE: "Push for on-time, Push + Email for missed check-ins"

### Phase 7 (Testing)
- ❌ DELETE: SMS delivery tests
- ✅ ADD: Email delivery tests
- ✅ ADD: Push notification tests

---

## QUESTIONS REQUIRING YOUR DECISION

**Answer each with A, B, C, D, or your own Option E:**

1. **Phone verification:** A) None, B) Email verifies identity/phone unverified, C) Two-step, D) Phone optional
   - **MY RECOMMENDATION: A**

2. **Invitation method:** 1) Magic link, 2) Email code, 3) QR code, 4) Hybrid (link + code)
   - **MY RECOMMENDATION: 4 (Hybrid)**

3. **Members without email:** A) Email required, B) Email OR phone, C) In-person setup, D) Flexible code sharing
   - **MY RECOMMENDATION: D**

4. **Missed check-in alerts:** A) Push + Email, B) Push + Critical Alert, C) Push + Background, D) Push + SMS, E) Push + Phone call
   - **MY RECOMMENDATION: A**

5. **Check-in confirmations:** A) Push only, B) Push + Email, C) Daily digest, D) No notifications
   - **MY RECOMMENDATION: A**

6A. **Android persistent notification:** Yes / No
   - **MY RECOMMENDATION: Yes** (required for reliability)

6B. **iOS Critical Alerts entitlement:** Apply / Skip
   - **MY RECOMMENDATION: Apply** (safety product justification)

7. **Email verifies:** A) User identity, B) Invitation acceptance
   - **MY RECOMMENDATION: A**

8. **Overall architecture:** 1) Push + Email Hybrid, 2) Push-only, 3) Push + Phone call
   - **MY RECOMMENDATION: 1**

**Answer all 8 questions before I proceed.**

---

## ADDITIONAL QUESTIONS

9. **Email service provider:** Which? (SendGrid, Postmark, AWS SES, Resend, other)
   - **MY RECOMMENDATION: Resend** (modern, developer-friendly, good deliverability)

10. **Contact's phone number:** Still required as login ID? Or switch to email-only login?
    - **MY RECOMMENDATION: Keep phone as login ID** (consistency with Member flow)

11. **Support email:** Keep `support@pruuf.me`? Or different?
    - **MY RECOMMENDATION: Keep `support@pruuf.me`**

12. **Email templates:** Plain text, HTML, or both?
    - **MY RECOMMENDATION: Both** (HTML primary, plain text fallback)

---

