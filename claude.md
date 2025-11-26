    SPECIFICATION FOR MOBILE APPLICATION DEVELOPMENT
    Version: 1.0
    Date: November 18, 2025
    Platform: iOS (App Store) & Android (Google Play Store)
    Backend: Supabase
   
    
    EXECUTIVE SUMMARY
    Pruuf is a compassionate daily check-in safety application designed for elderly adults (Members, typically 65-90+ years old) and their family members or friends (Contacts) who monitor their wellbeing. The application operates on a simple premise: Members must check in once perr day by a predetermined time, and if they fail to do so, all their Contacts receive immediate SMS alerts. The product prioritizes radical simplicity, accessibility, and emotional reassurance while maintaining sophisticated backend logic for subscription management, role-based permissions, and cross-platform notification delivery.
    This specification provides exhaustive detail for every component, screen, interaction, database table, API endpoint, notification template, edge case, and user flow necessary to build a production-ready application. The document is structured to serve as a complete prompt for AI-assisted development, requiring no additional clarification or external documentation.
    
    TABLE OF CONTENTS
        1. Product Philosophy & Core Principles
        2. User Personas & Roles
        3. Pricing Model & Business Logic
        4. Complete User Flows
        5. Database Schema & Relationships
        6. Authentication & Security
        7. Supabase Backend Architecture
        8. Stripe Payment Integration
        9. SMS Notification System
        10. Push Notification System
        11. UI/UX Specifications
        12. Screen-by-Screen Detailed Design
        13. API Endpoint Definitions
        14. Edge Case Handling
        15. Accessibility Requirements
        16. Testing & QA Criteria
        17. Technology Stack & Dependencies
        18. Deployment & Environment Configuration
    
    1. PRODUCT PHILOSOPHY & CORE PRINCIPLES
    1.1 Design Philosophy
    Pruuf must embody these non-negotiable principles in every interaction:
    Simplicity Above All: The application must be usable by someone with limited technology experience, poor eyesight, and reduced dexterity. Every screen should have a clear primary action. No screen should present more than three choices simultaneously.
    Emotional Reassurance: Every confirmation message, every notification, every success state must convey warmth and safety. The language should be personal ("Great job! You checked in for today.") rather than clinical ("Check-in recorded.").
    Accessibility First: All interactive elements must meet or exceed 60pt touch targets. Typography must scale from standard to extra-large. Color contrast must be AAA-compliant. VoiceOver and TalkBack must narrate every action in plain language.
    Zero Ambiguity: Users should never wonder "Did that work?" or "What happens next?" Every action must have immediate, obvious feedback. Loading states must be clear. Error messages must explain exactly what went wrong and how to fix it.
    Respectful Technology: The app never nags, never guilt-trips, never creates artificial urgency beyond the core safety promise. Contacts receive alerts only when necessary. Members receive reminders only if explicitly enabled.
    1.2 Core Value Proposition
    For Members: Peace of mind knowing loved ones will be alerted if something is wrong, without the burden of daily phone calls or the stigma of "being checked on."
    For Contacts: Confidence that their elderly loved one is safe each day, with immediate notification if intervention is needed, without the awkwardness of daily check-in calls that feel intrusive.
    1.3 Success Metrics
    The application succeeds when:
        • Members check in >90% of days within their deadline
        • Missed check-ins result in Contact outreach within 30 minutes
        • Member retention exceeds 80% after 90 days
        • Contact conversion from trial to paid exceeds 65%
        • Support tickets represent <2% of monthly active users
    
    2. USER PERSONAS & ROLES
    2.1 Member (Primary Elderly User)
    Demographics:
        • Age: 65-90+
        • Living situation: Independent living, assisted living, or aging at home
        • Technology comfort: Low to moderate; may own smartphone but uses limited features
        • Physical considerations: Reduced vision, potential tremor, limited fine motor control
        • Cognitive considerations: Generally sharp but may struggle with multi-step processes
    Needs:
        • Dead-simple daily check-in process (one tap)
        • Large, readable text and buttons
        • Ability to adjust check-in time if routine changes
        • Visibility into who is monitoring them (for transparency and consent)
        • Zero payment friction (never asks for credit card)
    Fears:
        • Technology failure leaving them stranded
        • Burdening their children with constant worry
        • Losing independence or autonomy
        • Complicated interfaces that make them feel inadequate
    2.2 Contact (Family/Friend Monitor)
    Demographics:
        • Age: 35-70 (typically adult children, sometimes siblings or friends)
        • Relationship: Children, siblings, neighbors, close friends
        • Technology comfort: Moderate to high; daily smartphone users
        • Primary motivation: Ensure elderly loved one's safety without daily intrusive calls
    Needs:
        • Immediate alerts when Member misses check-in
        • Positive confirmation when Member checks in on time
        • Ability to monitor multiple elderly relatives (parents, aunts, grandparents)
        • Simple onboarding to add new Members
        • Clear pricing and no surprise charges
    Fears:
        • Missing a critical alert when parent needs help
        • Paying for service that doesn't deliver on promise
        • Complicated setup preventing less tech-savvy family members from participating
        • Alert fatigue from false alarms
    2.3 Member-as-Contact (Dual Role User)
    Special Considerations: A Member who also monitors other Members (e.g., elderly mother who checks on her even-older sister) occupies both roles simultaneously. This user:
        • Must complete Member onboarding (set check-in time)
        • Also completes Contact onboarding (invite other Members)
        • Never pays (grandfathered free access as Contact forever because they are a Member)
        • Receives both types of notifications (reminder for their own check-in, alerts for Members they monitor)
    Critical Rule: The database must check user.is_member before requiring payment. If true, all Contact features are permanently free.
    
    3. PRICING MODEL & BUSINESS LOGIC
    3.1 Single Tier Structure
    Plan Name: Pruuf
    Price: $2.99/month
    Trial Period: 30 days (no credit card required)
    What's Included:
        • Monitor unlimited Members
        • Receive SMS and push notifications for all alerts
        • Invite unlimited Members to join Pruuf
        • Access to all features (no premium tier)
    3.2 Payment Rules
    Who Pays:
        • Contacts pay $2.99/month after 30-day trial
        • Payment is per Contact, not per Member (one Contact monitoring 5 Members pays $2.99 total)
    Who Never Pays:
        • Members (the elderly being monitored) never pay, never see pricing, never enter payment info
        • Members who also act as Contacts (dual role) never pay, even for Contact features
        • Members who stop being monitored (no active Contacts) but continue monitoring others remain free forever (grandfathered)
    Trial Behavior:
        • No credit card required during 30-day trial
        • Contacts can use all features during trial
        • On day 31, if no payment method added, account freezes (no new alerts sent, cannot add new Members)
        • Account reactivates immediately upon adding payment method
    3.3 Subscription Lifecycle
    Trial Start (Day 1):
        • User creates Contact account
        • System records trial_start_date: now()
        • User has full access to all features
        • In-app notifications on days 15, 7, and 1 before trial ends
    Trial End (Day 31):
        • If user.stripe_subscription_id exists and status is active → continue service
        • If no payment method → set account_status: 'frozen'
        • Frozen accounts cannot receive new alerts, cannot invite Members, but can add payment to reactivate
    Payment Failure:
        • Stripe webhook invoice.payment_failed triggers
        • Send in-app notification + SMS: "Payment failed. Update card to continue receiving alerts."
        • Grace period: 3 days
        • After 3 days: Account freezes (same as trial end without payment)
    Cancellation:
        • Contact can cancel anytime in Settings
        • Cancellation takes effect at end of current billing period
        • Contact retains access until billing period ends
        • After cancellation, account status becomes cancelled, no alerts sent
        • Contact can resubscribe anytime (no new trial, immediately charged)
    3.4 Member-as-Contact Special Logic
    Scenario: Contact is paying $2.99/month. Someone invites them to be a Member (they accept invite, now dual role).
    Behavior:
        1. User accepts Member invite → member_contact_relationships table gains entry where member_id = user.id
        2. System detects user.is_member = true (via query: does user have any active Contacts monitoring them?)
        3. End of current billing cycle → Subscription does NOT renew
        4. Stripe subscription status becomes canceled
        5. User receives in-app notification: "Great news! Since you're now a Pruuf Member, you'll never pay again. You can continue monitoring others for free, forever."
        6. Database records grandfathered_free: true on user record
        7. Even if all Contacts stop monitoring this user (they're no longer a Member), grandfathered_free remains true → they stay free
    Database Check:
    sql
    -- Function to determine if user requires payment
CREATE OR REPLACE FUNCTION requires_payment(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
  is_grandfathered BOOLEAN;
BEGIN
  -- Check if user is currently a Member (someone monitors them)
  SELECT EXISTS(
    SELECT 1 FROM member_contact_relationships
    WHERE member_id = user_id AND status = 'active'
  ) INTO is_member;
  
  -- Check if user was ever a Member (grandfathered)
  SELECT grandfathered_free FROM users WHERE id = user_id INTO is_grandfathered;
  
  -- User never pays if they're a Member OR were grandfathered
  RETURN NOT (is_member OR is_grandfathered);
END;
$$ LANGUAGE plpgsql;
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
} else {
  // Create new check-in
  INSERT INTO check_ins (member_id, checked_in_at, timezone)
  VALUES (member_id, NOW(), timezone);
}
    // Send confirmation SMS to all Contacts
const contacts = await getContactsForMember(member_id);
const memberName = await getMemberName(member_id);
    for (contact of contacts) {
  twilio.messages.create({
    body: `${memberName} checked in at ${formatTime(NOW(), timezone)}. All is well!`,
    from: TWILIO_NUMBER,
    to: contact.phone
  });
}
    // Send push notification to Contacts
for (contact of contacts) {
  sendPushNotification({
    user_id: contact.id,
    title: `${memberName} checked in`,
    body: `Checked in at ${formatTime(NOW(), timezone)}`,
    data: { type: 'check_in_success', member_id }
  });
}
    // Cancel today's scheduled missed check-in alert
cancelScheduledAlert(member_id, TODAY);
    SCREEN M12: Check-in Success Modal
    Visual Layout:
        • Full-screen overlay (semi-transparent dark background)
        • Center card (white, rounded, shadow): 
            ○ Animated checkmark (green, scales in, 80pt)
            ○ Headline: "Great job!"
            ○ Body: "You checked in at 9:45 AM (15 minutes early)"
            ○ Subtext: "Jennifer has been notified."
        • Auto-dismiss after 3 seconds OR tap anywhere to dismiss
        • Haptic: Success feedback (notification type)
    SCREEN M13: Member Contacts List
    Visual Layout:
        • Navigation: "Your Contacts" title, back button
        • Section header: "People who receive alerts about you"
        • Contact cards (list, stacked): 
            ○ Card 1: 
                § Name: "Jennifer" (20pt, bold)
                § Relationship: "Daughter" (optional, if provided)
                § Phone: "(555) 123-4567" (16pt, gray)
                § Status: "Active" (green dot + text)
                § Call/Text buttons (same as dashboard)
                § Remove button (red text, right side): "Remove"
            ○ Card 2: 
                § Name: "Michael" (Pending)
                § Status: "Pending - hasn't joined yet"
                § Resend button
        • Bottom button: "+ Invite Another Contact"
    Interactions:
        • Tap "Remove": 
            ○ Show confirmation dialog: "Remove Jennifer? She'll no longer receive alerts about you."
            ○ Buttons: "Cancel" / "Remove" (red, destructive)
            ○ On confirm: 
                § DELETE member_contact_relationship
                § Send SMS to Contact: "Mom removed you from their Pruuf safety contacts. If you have questions, contact them directly."
                § Show toast: "Jennifer removed"
        • Tap "+ Invite Another Contact": 
            ○ Navigate to Invite Contact flow (similar to Contact inviting Member, but reversed)
    SCREEN M14: Member Settings
    Visual Layout:
        • Scrollable list of settings options:
        1. Check-in Time (tappable row) 
            ○ Left: Clock icon
            ○ Text: "Check-in Time"
            ○ Right: "10:00 AM PST" (gray, shows current value)
            ○ Chevron >
        2. Reminder (toggle row) 
            ○ Left: Bell icon
            ○ Text: "Daily Reminder"
            ○ Subtext: "1 hour before check-in"
            ○ Right: Toggle switch (ON)
        3. Font Size (tappable row) 
            ○ Left: Text size icon
            ○ Text: "Text Size"
            ○ Right: "Large" (shows current)
            ○ Chevron >
        4. Your Contacts (tappable row) 
            ○ Left: Person icon
            ○ Text: "Your Contacts"
            ○ Right: "2 active" (count)
            ○ Chevron >
        5. Account (tappable row) 
            ○ Left: User icon
            ○ Text: "Phone Number"
            ○ Right: "(555) 987-6543"
            ○ Chevron >
        6. Help & Support (tappable row) 
            ○ Left: Question mark icon
            ○ Text: "Help & Support"
            ○ Chevron >
        7. Delete Account (tappable row, red text) 
            ○ Left: Trash icon (red)
            ○ Text: "Delete Account"
            ○ Chevron >
    Interactions:
        • Tap "Check-in Time": Navigate to time picker, save updates, send SMS to Contacts notifying of change
        • Toggle "Reminder": Immediately enable/disable local notification
        • Tap "Font Size": Navigate to font size selector (same as onboarding)
        • Other rows: Navigate to respective screens
    
    4.3 Daily Check-in Flow (Member Perspective)
    9:00 AM: Reminder Notification (if enabled)
    Push notification appears:
        • Title: "Time for your Pruuf check-in"
        • Body: "Tap to let Jennifer know you're okay"
        • Sound: Default notification sound
        • Badge: App icon shows "1"
    Member taps notification:
        • App opens directly to Dashboard (Screen M11)
        • "I'm OK" button is prominent and pulsing
        • Member taps button → Check-in succeeds (Screen M12)
    10:00 AM: Deadline Passes (if Member didn't check in)
    Backend job runs at exactly 10:00 AM PST (Member's check-in time):
    javascript
    // Scheduled job (cron: every minute, checks all Members)
async function checkMissedCheckIns() {
  const now = moment();
  
  // Find all Members whose check-in time just passed
  const members = await db.query(`
    SELECT m.*, 
           m.check_in_time AT TIME ZONE m.timezone AS local_check_in_time,
           m.timezone
    FROM members m
    WHERE m.check_in_time AT TIME ZONE m.timezone <= $1
    AND NOT EXISTS (
      SELECT 1 FROM check_ins c
      WHERE c.member_id = m.id
      AND DATE(c.checked_in_at AT TIME ZONE m.timezone) = CURRENT_DATE
    )
    AND NOT EXISTS (
      SELECT 1 FROM missed_check_in_alerts a
      WHERE a.member_id = m.id
      AND DATE(a.sent_at) = CURRENT_DATE
    )
  `, [now]);
  
  for (member of members) {
    await sendMissedCheckInAlerts(member);
  }
}
    async function sendMissedCheckInAlerts(member) {
  const contacts = await getActiveContactsForMember(member.id);
  const memberName = member.name;
  const lastCheckIn = await getLastCheckIn(member.id);
  
  const smsBody = `${memberName} hasn't checked in by their ${member.check_in_time} ${member.timezone} deadline.
    Last check-in: ${lastCheckIn ? formatDate(lastCheckIn.checked_in_at) : 'Never'}
    You may want to call them to make sure they're okay.
    Call ${memberName}: ${formatPhone(member.phone)}`;
      for (contact of contacts) {
    // Only send if Contact account is active (not frozen/canceled)
    if (contact.account_status !== 'active' && contact.account_status !== 'active_free') {
      continue; // Skip frozen accounts
    }
    
    // Send SMS
    await twilio.messages.create({
      body: smsBody,
      from: TWILIO_NUMBER,
      to: contact.phone
    });
    
    // Send push notification
    await sendPushNotification({
      user_id: contact.id,
      title: `${memberName} missed check-in`,
      body: `No check-in by ${member.check_in_time} ${member.timezone}`,
      sound: 'critical', // High-priority sound
      data: { type: 'missed_check_in', member_id: member.id }
    });
  }
  
  // Log alert
  INSERT INTO missed_check_in_alerts (member_id, sent_at, alert_type)
  VALUES (member.id, NOW(), 'missed_deadline');
}
```
    **10:05 AM: Member Checks In Late**
    Member opens app, taps "I'm OK":
- Check-in recorded as normal
- Success modal shows: "You checked in at 10:05 AM (5 minutes late)"
- System sends UPDATE SMS to Contacts:
```
Update: Mom checked in at 10:05 AM PST (5 min late). All is well!
```
    This closes the loop for Contacts who received the missed check-in alert.
    ---
    ### 4.3 Daily Check-in Flow (Contact Perspective)
    **Scenario 1: Member Checks In On Time**
    9:45 AM PST: Mom taps "I'm OK"
    Jennifer receives:
- SMS: "Mom checked in at 9:45 AM PST. All is well!"
- Push notification: "Mom checked in ✓"
- Opens Pruuf app: Member card shows "Last check-in: Today, 9:45 AM PST" (green dot)
    **Scenario 2: Member Misses Check-in**
    10:00 AM PST: Deadline passes, Mom hasn't checked in
    Jennifer receives:
- SMS (immediately): 
```
Mom hasn't checked in by their 10:00 AM PST deadline.
    Last check-in: Yesterday, 9:30 AM PST
    You may want to call them to make sure they're okay.
    Call Mom: (555) 987-6543
        • Push notification (high-priority, overrides Do Not Disturb): 
            ○ Title: "Mom missed check-in"
            ○ Body: "No check-in by 10:00 AM PST"
            ○ Sound: Critical alert sound
            ○ Opens app to Member detail screen
    Jennifer's actions:
        • Option 1: Tap "Call Mom" in SMS → Opens phone dialer
        • Option 2: Open Pruuf app → Tap "Call" button on Mom's card
        • Option 3: Wait (Mom may check in late, Jennifer will receive update SMS)
    10:15 AM PST: Mom checks in late
    Jennifer receives:
        • SMS: "Update: Mom checked in at 10:15 AM PST (15 min late). All is well!"
        • Push notification: "Mom checked in ✓"
        • App updates: "Last check-in: Today, 10:15 AM PST"
    
    5. DATABASE SCHEMA & DATA MODELS
    5.1 Supabase PostgreSQL Schema
    Table: users Primary table for all users (Members and Contacts both stored here)
    sql
    CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL, -- E.164 format: +15551234567
  pin_hash VARCHAR(255) NOT NULL, -- Bcrypt hash, never store raw PIN
  account_status VARCHAR(20) NOT NULL DEFAULT 'trial',
    -- Values: 'trial', 'active', 'active_free', 'frozen', 'past_due', 'canceled', 'deleted'
  is_member BOOLEAN DEFAULT FALSE, -- TRUE if anyone monitors this user
  grandfathered_free BOOLEAN DEFAULT FALSE, -- TRUE if was Member, always free as Contact
  font_size_preference VARCHAR(20) DEFAULT 'standard',
    -- Values: 'standard', 'large', 'extra_large'
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255), -- Stripe Customer ID
  stripe_subscription_id VARCHAR(255), -- Stripe Subscription ID
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp
);
    -- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_trial_end ON users(trial_end_date) WHERE account_status = 'trial';
    Table: members Stores Member-specific data (check-in times, timezone, etc.)
    sql
    CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- Links to users table (Member is also a user)
  name VARCHAR(255) NOT NULL, -- Display name: "Mom", "Grandma", "Aunt Sarah"
  check_in_time TIME, -- Local time: 10:00:00 (not timezone-aware yet)
  timezone VARCHAR(50), -- IANA timezone: "America/Los_Angeles"
  reminder_enabled BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_check_in_time ON members(check_in_time);
    -- Unique constraint: one Member record per user
CREATE UNIQUE INDEX idx_members_user_id_unique ON members(user_id) WHERE deleted_at IS NULL;
    Table: member_contact_relationships Many-to-many relationship between Members and Contacts
    sql
    CREATE TABLE member_contact_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- The Member being monitored
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- The Contact doing the monitoring
  invite_code VARCHAR(10) UNIQUE NOT NULL, -- 6-character code: "AB3X7M"
  status VARCHAR(20) DEFAULT 'pending',
    -- Values: 'pending' (invited, not accepted), 'active' (connected), 'removed' (deleted)
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE, -- When Member accepted invite
  last_invite_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_relationships_member ON member_contact_relationships(member_id);
CREATE INDEX idx_relationships_contact ON member_contact_relationships(contact_id);
CREATE INDEX idx_relationships_status ON member_contact_relationships(status);
CREATE INDEX idx_relationships_invite_code ON member_contact_relationships(invite_code);
    -- Unique constraint: one relationship per Member-Contact pair
CREATE UNIQUE INDEX idx_relationships_unique 
ON member_contact_relationships(member_id, contact_id) 
WHERE status != 'removed';
    Table: check_ins Records every check-in by Members
    sql
    CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timezone VARCHAR(50), -- Timezone at time of check-in
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_checkins_member ON check_ins(member_id);
CREATE INDEX idx_checkins_date ON check_ins(checked_in_at);
CREATE INDEX idx_checkins_member_date ON check_ins(member_id, checked_in_at DESC);
    -- Prevent duplicate check-ins same day
CREATE UNIQUE INDEX idx_checkins_member_day 
ON check_ins(member_id, DATE(checked_in_at AT TIME ZONE timezone));
    Table: missed_check_in_alerts Logs every missed check-in alert sent
    sql
    CREATE TABLE missed_check_in_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50), -- 'missed_deadline', 'late_checkin_update'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_alerts_member ON missed_check_in_alerts(member_id);
CREATE INDEX idx_alerts_sent_at ON missed_check_in_alerts(sent_at);
    -- Prevent duplicate alerts same day
CREATE UNIQUE INDEX idx_alerts_member_day
ON missed_check_in_alerts(member_id, DATE(sent_at));
    Table: verification_codes SMS verification codes for phone number verification
    sql
    CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL, -- 6-digit code: "582614"
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0, -- Failed verification attempts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_verification_phone ON verification_codes(phone);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);
    -- Auto-delete expired codes after 1 day
CREATE INDEX idx_verification_cleanup ON verification_codes(created_at) 
WHERE used = TRUE OR expires_at < NOW();
    Table: sms_logs Complete log of all SMS messages sent via Twilio
    sql
    CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_phone VARCHAR(20) NOT NULL,
  from_phone VARCHAR(20) NOT NULL, -- Twilio number
  body TEXT NOT NULL,
  type VARCHAR(50), 
    -- Values: 'verification', 'member_invite', 'check_in_confirmation', 
    --         'missed_check_in', 'late_check_in_update', 'check_in_time_changed'
  status VARCHAR(20), -- 'sent', 'delivered', 'failed', 'undelivered'
  twilio_sid VARCHAR(255), -- Twilio message SID for tracking
  error_message TEXT, -- If failed, Twilio error
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_sms_to_phone ON sms_logs(to_phone);
CREATE INDEX idx_sms_type ON sms_logs(type);
CREATE INDEX idx_sms_status ON sms_logs(status);
CREATE INDEX idx_sms_sent_at ON sms_logs(sent_at DESC);
    Table: push_notification_tokens Stores device push notification tokens (FCM for Android, APNs for iOS)
    sql
    CREATE TABLE push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL, -- FCM or APNs token
  platform VARCHAR(10), -- 'ios' or 'android'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);
CREATE UNIQUE INDEX idx_push_tokens_unique ON push_notification_tokens(user_id, token);
    Table: app_notifications In-app notifications (trial reminders, grandfathered messages, etc.)
    sql
    CREATE TABLE app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50), 
    -- Values: 'trial_reminder', 'payment_failed', 'grandfathered_free', 
    --         'member_connected', 'invite_monthly_nudge'
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255), -- Deep link within app
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
    -- Indexes
CREATE INDEX idx_app_notif_user ON app_notifications(user_id);
CREATE INDEX idx_app_notif_unread ON app_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_app_notif_created ON app_notifications(created_at DESC);
    Table: audit_logs Complete audit trail for security and debugging
    sql
    CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
    -- Values: 'user_created', 'pin_changed', 'check_in', 'invite_sent', 
    --         'payment_added', 'subscription_canceled', 'account_deleted'
  details JSONB, -- Flexible JSON for action-specific data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    -- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
    5.2 Supabase Row Level Security (RLS) Policies
    Enable RLS on all tables:
    sql
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables
    RLS Policy Examples:
    sql
    -- Users can only see/update their own user record
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);
    CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);
    -- Members can see their own Member data
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
    5.3 Database Functions & Triggers
    Function: Update is_member flag when relationship changes
    sql
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
  
  -- When last active relationship removed, unset is_member (but keep grandfathered)
  IF NEW.status = 'removed' OR TG_OP = 'DELETE' THEN
    UPDATE users SET is_member = FALSE
    WHERE id = NEW.member_id
    AND NOT EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = NEW.member_id
      AND status = 'active'
      AND id != NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    CREATE TRIGGER trigger_update_is_member
AFTER INSERT OR UPDATE OR DELETE ON member_contact_relationships
FOR EACH ROW
EXECUTE FUNCTION update_is_member_status();
    Function: Generate unique invite code
    sql
    CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No confusing chars: O,0,I,1
  code VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Check if code exists (very unlikely with 6 chars)
  IF EXISTS (SELECT 1 FROM member_contact_relationships WHERE invite_code = code) THEN
    RETURN generate_invite_code(); -- Recursive retry
  END IF;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;
    Function: Check if user requires payment
    sql
    CREATE OR REPLACE FUNCTION requires_payment(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  is_member_flag BOOLEAN;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  -- Never require payment if grandfathered
  IF user_record.grandfathered_free = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- Check if currently a Member
  SELECT EXISTS(
    SELECT 1 FROM member_contact_relationships
    WHERE member_id = user_uuid AND status = 'active'
  ) INTO is_member_flag;
  
  IF is_member_flag = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- User is Contact-only, check subscription
  IF user_record.stripe_subscription_id IS NULL THEN
    RETURN TRUE; -- No subscription, needs payment
  END IF;
  
  -- Has subscription, check status
  IF user_record.account_status IN ('active', 'active_free') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
    
    6. AUTHENTICATION & SECURITY INFRASTRUCTURE
    6.1 Supabase Auth Configuration
    Pruuf uses Supabase Auth with custom phone+PIN authentication (not standard email/password).
    Custom Auth Flow:
        1. User enters phone number
        2. Backend generates 6-digit verification code
        3. Twilio sends SMS with code
        4. User enters code in app
        5. Backend verifies code
        6. Backend creates Supabase user via Admin API
        7. Backend generates JWT token
        8. App stores JWT in secure storage
    Supabase User Creation:
    javascript
    // POST /api/auth/create-user (backend endpoint)
const { data: user, error } = await supabase.auth.admin.createUser({
  phone: '+15551234567',
  phone_confirm: true, // Skip Supabase's own phone verification (we did it via Twilio)
  user_metadata: {
    pin_hash: hashedPin, // Bcrypt hash
    phone_verified: true,
    verified_at: new Date().toISOString()
  }
});
    // Insert into our users table
await supabase.from('users').insert({
  id: user.id, // Use Supabase auth.users ID
  phone: '+15551234567',
  pin_hash: hashedPin,
  account_status: 'trial',
  trial_start_date: new Date(),
  trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
});
    // Generate session token
const { data: session } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: `${user.id}@pruuf.internal`, // Fake email (Supabase requires email or phone)
  options: {
    data: { phone: '+15551234567' }
  }
});
    return { user, session_token: session.properties.access_token };
    Login Flow:
    javascript
    // POST /api/auth/login
const { phone, pin } = req.body;
    // Get user record
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('phone', phone)
  .single();
    if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
    // Verify PIN
const pinMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!pinMatch) {
  // Increment failed attempts
  await incrementFailedAttempts(user.id);
  
  // Check lockout
  if (await isLockedOut(user.id)) {
    return res.status(429).json({ 
      error: 'Too many failed attempts. Try again in 5 minutes.' 
    });
  }
  
  return res.status(401).json({ error: 'Incorrect PIN' });
}
    // Reset failed attempts
await resetFailedAttempts(user.id);
    // Generate Supabase session
const { data: session } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: `${user.id}@pruuf.internal`
});
    return res.json({ 
  access_token: session.properties.access_token,
  user: { id: user.id, phone: user.phone, account_status: user.account_status }
});
    6.2 PIN Security
    Requirements:
        • 4 digits (0000-9999, 10,000 combinations)
        • Hashed with bcrypt (cost factor 10)
        • Never logged in plain text
        • Never transmitted to backend (only hash sent)
    Failed Attempt Lockout:
    sql
    -- Add to users table
ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
    -- Function to check lockout
CREATE OR REPLACE FUNCTION is_locked_out(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF user_record.locked_until IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF user_record.locked_until > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Lockout expired, reset
  UPDATE users SET locked_until = NULL, failed_login_attempts = 0
  WHERE id = user_uuid;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
    -- Increment failed attempts
CREATE OR REPLACE FUNCTION increment_failed_attempts(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE id = user_uuid;
  
  -- After 5 attempts, lock for 5 minutes
  UPDATE users
  SET locked_until = NOW() + INTERVAL '5 minutes'
  WHERE id = user_uuid
  AND failed_login_attempts >= 5;
  
  -- After 10 attempts, lock for 15 minutes
  UPDATE users
  SET locked_until = NOW() + INTERVAL '15 minutes'
  WHERE id = user_uuid
  AND failed_login_attempts >= 10;
END;
$$ LANGUAGE plpgsql;
    6.3 JWT Token Management
    Token Structure:
    json
    {
  "sub": "user-uuid",
  "phone": "+15551234567",
  "account_status": "active",
  "is_member": true,
  "iat": 1700000000,
  "exp": 1707776000
}
    Token Expiration:
        • Access token: 90 days (long-lived for mobile)
        • Refresh token: 1 year (Supabase default)
    Token Storage:
        • iOS: Keychain (high security)
        • Android: EncryptedSharedPreferences
    Token Refresh:
    javascript
    // When access token expires (detected via 401 response)
const { data: newSession } = await supabase.auth.refreshSession();
// Store new access token
await SecureStore.setItemAsync('access_token', newSession.access_token);
    6.4 Data Encryption
    At Rest:
        • Supabase PostgreSQL: AES-256 encryption (built-in)
        • Sensitive fields additionally encrypted: None needed for MVP (PII is phone numbers, already masked in UI)
    In Transit:
        • All API calls: HTTPS/TLS 1.3
        • Twilio SMS: Encrypted in transit
    Client-Side:
        • PIN entry: Obscured immediately on keypress
        • Phone numbers: Masked in UI ((555) 123-4567 shown as (555) ...4567)
    6.5 GDPR & Privacy Compliance
    Data Retention:
        • Active users: Indefinite
        • Deleted accounts: 30-day soft delete, then permanent deletion
        • Logs: 90 days retention, then auto-delete
    User Rights:
        • Right to access: GET /api/users/me/data-export (returns JSON of all user data)
        • Right to deletion: DELETE /api/users/me/account (soft delete, then hard delete after 30 days)
        • Right to portability: Same as data export
    Privacy Policy Requirements:
        • Must disclose: SMS notifications sent, phone numbers stored, Stripe payment processing
        • Must obtain consent: Push notifications (iOS/Android permission), Contacts access (optional)
    
    7. SUPABASE BACKEND CONFIGURATION
    7.1 Supabase Project Setup
    Environment:
        • Production: Dedicated Supabase project
        • Staging: Separate Supabase project (for testing)
    Connection:
        • Anon key: Used by mobile app for public operations
        • Service role key: Used by backend for admin operations (never exposed to app)
    Supabase Services Used:
        1. Database: PostgreSQL (schema defined in section 5)
        2. Auth: Custom phone+PIN authentication
        3. Storage: Not used in MVP (no file uploads)
        4. Realtime: Not used in MVP (polling instead)
        5. Edge Functions: Not used in MVP (traditional backend API)
    7.2 Backend API Architecture
    Technology: Node.js + Express.js (or Next.js API routes)
    API Structure:
    /api
  /auth
    POST /send-verification-code
    POST /verify-code
    POST /create-account
    POST /login
    POST /forgot-pin
    POST /reset-pin
  /users
    GET /me
    PATCH /me
    DELETE /me/account
    GET /me/data-export
  /members
    POST /invite
    POST /accept-invite
    PATCH /:memberId/check-in-time
    POST /:memberId/check-in
    GET /:memberId/contacts
  /contacts
    GET /me/members
    POST /resend-invite
    DELETE /relationship/:relationshipId
  /payments
    POST /create-subscription
    POST /update-payment-method
    POST /cancel-subscription
    POST /reactivate-subscription
  /stripe-webhooks
    POST /webhook
  /twilio-webhooks
    POST /sms-status
    Retry
    WW
    Continue
    
### 7.3 API Endpoint Specifications (Detailed)
    **AUTHENTICATION ENDPOINTS**
    ---
    **POST /api/auth/send-verification-code**
    Purpose: Send SMS verification code to phone number
    Request:
```json
{
  "phone": "+15551234567",
  "country_code": "US"
}
```
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
  );
}
```
    ### 10.4 Backend Push Notification Service
```javascript
// services/pushNotificationService.js (backend)
const admin = require('firebase-admin');
    // Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
    /**
 * Send push notification to user
 */
async function sendPushNotification(userId, notification) {
  try {
    // Get user's FCM tokens
    const { data: tokens } = await supabase
      .from('push_notification_tokens')
      .select('*')
      .eq('user_id', userId);
    
    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens for user ${userId}`);
      return { success: false, reason: 'no_tokens' };
    }
    
    // Build FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens: tokens.map(t => t.token)
    };
    
    // Optional: Set priority for critical alerts
    if (notification.priority === 'high') {
      message.android = {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high'
        }
      };
      message.apns = {
        payload: {
          aps: {
            sound: 'default',
            'interruption-level': 'time-sensitive'
          }
        }
      };
    }
    
    // Send via FCM
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`Push sent to user ${userId}: ${response.successCount}/${tokens.length} successful`);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx].token);
        }
      });
      
      if (failedTokens.length > 0) {
        await supabase
          .from('push_notification_tokens')
          .delete()
          .in('token', failedTokens);
      }
    }
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
    
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}
    /**
 * Send missed check-in alert (high priority)
 */
async function sendMissedCheckInPush(contactId, memberName, memberId) {
  return sendPushNotification(contactId, {
    title: `${memberName} missed check-in`,
    body: `No check-in received. Tap to call or text them.`,
    data: {
      type: 'missed_check_in',
      member_id: memberId
    },
    priority: 'high'
  });
}
    /**
 * Send check-in confirmation (normal priority)
 */
async function sendCheckInConfirmationPush(contactId, memberName, time, memberId) {
  return sendPushNotification(contactId, {
    title: `${memberName} checked in`,
    body: `Checked in at ${time}. All is well!`,
    data: {
      type: 'check_in_success',
      member_id: memberId
    },
    priority: 'normal'
  });
}
    /**
 * Send reminder to Member (normal priority)
 */
async function sendCheckInReminderPush(memberId) {
  return sendPushNotification(memberId, {
    title: 'Time for your Pruuf check-in',
    body: 'Tap to let your family know you're okay',
    data: {
      type: 'check_in_reminder'
    },
    priority: 'normal'
  });
}
    /**
 * Send trial reminder (normal priority)
 */
async function sendTrialReminderPush(userId, daysLeft) {
  let body;
  if (daysLeft === 15) {
    body = '15 days left in your free trial';
  } else if (daysLeft === 7) {
    body = '7 days left. Add payment to avoid interruption.';
  } else if (daysLeft === 1) {
    body = 'Your trial ends tomorrow. Add payment to continue.';
  }
  
  return sendPushNotification(userId, {
    title: 'Pruuf trial update',
    body: body,
    data: {
      type: 'trial_reminder',
      days_left: daysLeft.toString()
    },
    priority: 'normal'
  });
}
    module.exports = {
  sendPushNotification,
  sendMissedCheckInPush,
  sendCheckInConfirmationPush,
  sendCheckInReminderPush,
  sendTrialReminderPush
};
```
    ---
    ## 11. DESIGN SYSTEM & COMPONENT LIBRARY
    ### 11.1 Color Palette
    **Primary Colors:**
```javascript
const colors = {
  // Brand primary (green - reassurance, safety)
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',
  
  // Accent (blue - trust, reliability)
  accent: '#2196F3',
  accentDark: '#1976D2',
  accentLight: '#BBDEFB',
  
  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutrals
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  
  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  
  // Status indicators
  statusActive: '#4CAF50',
  statusPending: '#FF9800',
  statusInactive: '#9E9E9E'
};
```
    **Accessibility:**
- All text/background combinations meet WCAG AAA (7:1 for normal text, 4.5:1 for large)
- Error states use both color AND icon (not color alone)
- Focus states have visible outlines (2px solid accent color)
    ### 11.2 Typography Scale
```javascript
const typography = {
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: 0
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0
  },
  
  // Body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.15
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.15
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.15
  },
  
  // UI elements
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'none' // Don't uppercase buttons
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4
  },
  
  // Font size multipliers for accessibility settings
  multipliers: {
    standard: 1.0,
    large: 1.25,
    extraLarge: 1.5
  }
};
```
    **Font Family:**
- iOS: System font (San Francisco)
- Android: Roboto
- No custom fonts (accessibility, performance, licensing)
    ### 11.3 Spacing System
```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```
    **Usage:**
- Padding: `md` (16px) default for containers
- Margin between elements: `md` (16px) default
- Card padding: `lg` (24px)
- Screen margins: `md` (16px) on mobile, `lg` (24px) on tablet
    ### 11.4 Component Library
    **Button Component:**
```javascript
// components/Button.js
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
    export default function Button({
  onPress,
  title,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
  size = 'large', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon = null,
  style,
  testID
}) {
  const styles = getStyles(variant, size, disabled);
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, style]}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={styles.text.color} />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
    function getStyles(variant, size, disabled) {
  // Height based on size
  const heights = {
    small: 40,
    medium: 50,
    large: 60
  };
  
  // Base styles
  let baseStyles = {
    button: {
      height: heights[size],
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      minWidth: size === 'large' ? 200 : 120
    },
    text: {
      ...typography.button,
      textAlign: 'center'
    },
    icon: {
      marginRight: 8
    }
  };
  
  // Variant-specific styles
  if (variant === 'primary') {
    baseStyles.button.backgroundColor = disabled ? colors.textDisabled : colors.primary;
    baseStyles.text.color = '#FFFFFF';
  } else if (variant === 'secondary') {
    baseStyles.button.backgroundColor = disabled ? colors.backgroundGray : colors.accentLight;
    baseStyles.text.color = disabled ? colors.textDisabled : colors.accent;
  } else if (variant === 'outline') {
    baseStyles.button.backgroundColor = 'transparent';
    baseStyles.button.borderWidth = 2;
    baseStyles.button.borderColor = disabled ? colors.border : colors.primary;
    baseStyles.text.color = disabled ? colors.textDisabled : colors.primary;
  } else if (variant === 'danger') {
    baseStyles.button.backgroundColor = disabled ? colors.textDisabled : colors.error;
    baseStyles.text.color = '#FFFFFF';
  }
  
  return StyleSheet.create(baseStyles);
}
```
    **Usage:**
```jsx
<Button 
  title="I'm OK" 
  variant="primary" 
  size="large"
  onPress={handleCheckIn}
/>
    <Button 
  title="Cancel" 
  variant="outline" 
  size="medium"
  onPress={handleCancel}
/>
```
    **Card Component:**
```javascript
// components/Card.js
export default function Card({ children, style, onPress, testID }) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      onPress={onPress}
      style={[styles.card, style]}
      activeOpacity={onPress ? 0.9 : 1}
      testID={testID}
    >
      {children}
    </Component>
  );
}
    const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3 // Android shadow
  }
});
```
    **Input Component:**
```javascript
// components/TextInput.js
export default function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  style,
  testID
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInputNative
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textSecondary}
        accessible={true}
        accessibilityLabel={label || placeholder}
        testID={testID}
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}
    const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background
  },
  inputError: {
    borderColor: colors.error
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.xs
  }
});
```
    ---
    ## WORD COUNT CHECKPOINT
    This document has now exceeded 8,000 words. I will continue with the remaining sections to provide the complete, comprehensive specification.
    ---
    ## 12. SCREEN-BY-SCREEN SPECIFICATIONS (CONTINUED)
    **MEMBER DASHBOARD (DETAILED BREAKDOWN)**
    **Screen: MemberDashboard.js**
    Visual Layout (Top to Bottom):
    1. **Top Safe Area** (iOS notch avoidance)
   - Padding: `spacing.md` (16px)
    2. **Deadline Banner**
   - Background: Linear gradient (light blue to white)
   - Padding: `spacing.lg` (24px)
   - Border radius: 12px bottom only
   - Content:
     - Icon: Clock (24pt, blue)
     - Primary text: "Next check-in: Today at 10:00 AM PST"
       - Font: `typography.h3` (20pt bold)
       - Color: `colors.textPrimary`
     - Secondary text: "in 2 hours 34 minutes"
       - Font: `typography.body` (16pt regular)
       - Color: `colors.textSecondary`
       - Updates every 60 seconds
     - Timezone badge: "PST"
       - Background: `colors.accentLight`
       - Padding: 4px 8px
       - Border radius: 4px
       - Font: `typography.caption` (12pt)
   - VoiceOver: "Next check-in today at ten A M pacific time, in two hours and thirty-four minutes"
    3. **Main Content Area** (ScrollView)
   - Padding: `spacing.md` (16px horizontal)
   - Spacing between elements: `spacing.lg` (24px)
    4. **"I'm OK" Button** (Hero Element)
   - Width: 90% of screen width (centered)
   - Height: 120pt (extra large for accessibility)
   - Background: `colors.primary` (#4CAF50 green)
   - Border radius: 16px
   - Shadow: Large, soft shadow (elevation 8)
   - Content:
     - Text: "I'm OK" (32pt, bold, white)
     - Subtext: "Tap to check in" (14pt, regular, white 80% opacity)
   - Animation: Breathing effect (scale 1.0 → 1.02 → 1.0, 3s loop, ease-in-out)
   - Haptic: Medium impact on tap
   - State changes:
     - Default: Green background, breathing animation
     - Pressed: Scale to 0.98, darker green
     - Loading: Show spinner, "Checking in..."
     - Success: Checkmark animation, hold 2s, then reset
   - VoiceOver: "I'm OK button. Double tap to confirm you're okay today."
    5. **Last Check-in Status** (if checked in today)
   - Card layout
   - Background: Light green (`colors.primaryLight`)
   - Padding: `spacing.md` (16px)
   - Border radius: 8px
   - Content:
     - Checkmark icon (green, 24pt)
     - Text: "You checked in today at 9:45 AM"
     - Subtext: "15 minutes early"
   - Only visible if check-in exists today
    6. **Section: Your Contacts**
   - Header:
     - Text: "Your Contacts" (18pt, semibold)
     - Count badge: "2 active" (gray background pill)
     - "Manage" link (right-aligned, blue text)
   - Contact Cards (FlatList, scrollable if >3):
     - Each card:
       - Layout: Horizontal
       - Left side:
         - Avatar placeholder (initials, colored background)
         - Name: "Jennifer" (18pt, bold)
         - Status: "Active" (green dot + text, 14pt)
         - Phone: "(555) ...4567" (14pt, gray, masked)
       - Right side:
         - Call button (phone icon, blue, 44pt touch target)
         - Text button (message icon, blue, 44pt touch target)
       - On tap: Opens Contact detail
       - Separator line between cards
    7. **Bottom Safe Area** (iOS home indicator avoidance)
   - Padding: `spacing.md` (16px)
    **Tab Bar (Bottom Navigation)**
- Height: 60pt + safe area
- Background: White with top border
- Three tabs:
  1. Dashboard (active: blue, inactive: gray)
     - Icon: Home
     - Label: "Dashboard"
  2. Contacts
     - Icon: Person
     - Label: "Contacts"
  3. Settings
     - Icon: Gear
     - Label: "Settings"
- Active indicator: Blue underline (4pt thick)
- Touch targets: 60pt height
    **State Management:**
```javascript
const [checkInTime, setCheckInTime] = useState('10:00');
const [timezone, setTimezone] = useState('America/Los_Angeles');
const [countdown, setCountdown] = useState('');
const [lastCheckIn, setLastCheckIn] = useState(null);
const [contacts, setContacts] = useState([]);
const [loading, setLoading] = useState(false);
    // Update countdown every minute
useEffect(() => {
  const interval = setInterval(() => {
    setCountdown(calculateCountdown(checkInTime, timezone));
  }, 60000);
  return () => clearInterval(interval);
}, [checkInTime, timezone]);
    // Fetch data on mount
useEffect(() => {
  fetchMemberData();
}, []);
```
    **API Calls:**
```javascript
async function fetchMemberData() {
  const response = await fetch(`${API_URL}/api/members/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  
  setCheckInTime(data.check_in_time);
  setTimezone(data.timezone);
  setLastCheckIn(data.last_check_in);
  setContacts(data.contacts);
}
    async function handleCheckIn() {
  setLoading(true);
  
  try {
    const response = await fetch(`${API_URL}/api/members/${memberId}/check-in`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timezone: timezone
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success modal
      showSuccessModal(data.check_in.local_time, data.status);
      
      // Update last check-in
      setLastCheckIn(data.check_in);
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', data.message);
    }
    
  } catch (error) {
    Alert.alert('Error', 'Could not check in. Please try again.');
  } finally {
    setLoading(false);
  }
}
```
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
}
    14.4 Error Response Format
    All errors follow this structure:
    json
    {
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "specific_field",
    "reason": "Additional context"
  }
}
    HTTP Status Codes:
        • 200: Success
        • 400: Bad Request (validation error)
        • 401: Unauthorized (invalid/missing token)
        • 403: Forbidden (insufficient permissions)
        • 404: Not Found
        • 429: Too Many Requests
        • 500: Internal Server Error
    
    15. ACCESSIBILITY IMPLEMENTATION (WCAG 2.1 AAA)
    15.1 Screen Reader Support
    VoiceOver (iOS) Configuration:
    Every interactive element must have:
    javascript
    <TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="I'm OK"
  accessibilityHint="Double tap to confirm you're okay today"
  accessibilityState={{ disabled: false }}
>
    Roles:
        • button: Tappable buttons
        • link: Navigation links
        • text: Static text
        • image: Images (with alt text)
        • header: Section headers
    Labels:
        • Descriptive: "Check in button" not "Button"
        • Contextual: "Edit check-in time" not "Edit"
        • No redundancy: Don't include role in label ("Edit button" ❌, "Edit" ✓)
    Hints:
        • Action result: "Opens payment settings"
        • Gesture: "Double tap to activate"
        • Current state: "Currently 10 AM"
    TalkBack (Android) Configuration:
    Same as VoiceOver:
    javascript
    accessibilityLabel="I'm OK"
accessibilityHint="Double tap to confirm you're okay today"
accessibilityRole="button"
    15.2 Dynamic Type / Font Scaling
    Implementation:
    javascript
    import { useWindowDimensions, PixelRatio } from 'react-native';
import { useSelector } from 'react-redux';
    function useScaledFontSize(baseSize) {
  const fontSizePreference = useSelector(state => state.user.fontSizePreference);
  
  const multipliers = {
    standard: 1.0,
    large: 1.25,
    extraLarge: 1.5
  };
  
  return baseSize * multipliers[fontSizePreference];
}
    // Usage
const styles = StyleSheet.create({
  title: {
    fontSize: useScaledFontSize(24),
    lineHeight: useScaledFontSize(30)
  }
});
    System font scaling:
    javascript
    // Also respect iOS/Android system text size
import { Text as RNText, Platform } from 'react-native';
    const Text = ({ style, ...props }) => {
  return (
    <RNText
      {...props}
      style={style}
      allowFontScaling={true} // Respect system settings
      maxFontSizeMultiplier={2} // Cap at 2x (prevent extreme sizes)
    />
  );
};
    15.3 Color Contrast
    All color combinations tested with WebAIM Contrast Checker:
    AAA Compliant Combinations:
        • Primary text (#212121) on White (#FFFFFF): 16.1:1 ✓
        • Secondary text (#757575) on White: 4.6:1 ✓ (large text only)
        • White text on Primary green (#4CAF50): 4.6:1 ✓ (large text)
        • White text on Error red (#F44336): 5.5:1 ✓
    Buttons:
        • Primary button text (white) on green background: 4.6:1 (passes for 18pt+ text)
        • Solution: Buttons always use 16pt+ bold text (counts as "large")
    Status indicators:
        • Never rely on color alone
        • Active: Green dot + "Active" text
        • Pending: Orange dot + "Pending" text
        • Error: Red icon + "Error" text
    15.4 Touch Target Sizes
    Minimum sizes:
        • All interactive elements: 60pt × 60pt (exceeds Apple's 44pt guideline)
        • Text links: 44pt height minimum
        • Icons: 24pt × 24pt visible, 60pt touch target (padding)
    Implementation:
    javascript
    const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    minWidth: 60,
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  iconButton: {
    // Visible icon: 24pt
    // Touch target: 60pt
    padding: 18 // (60 - 24) / 2 = 18pt padding
  }
});
    15.5 Focus Indicators
    Keyboard navigation (Android):
    javascript
    <TouchableOpacity
  style={[styles.button, isFocused && styles.buttonFocused]}
>
    const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderColor: 'transparent'
  },
  buttonFocused: {
    borderColor: colors.accent,
    borderWidth: 3
  }
});
    Visible focus:
        • 3pt solid border
        • Accent color (#2196F3)
        • Sufficient contrast with background
    
    16. TESTING & QUALITY ASSURANCE
    16.1 Unit Tests (Jest)
    Test coverage targets:
        • Business logic: 90%
        • API endpoints: 85%
        • Components: 75%
    Example tests:
    javascript
    // __tests__/services/smsService.test.js
describe('SMS Service', () => {
  it('should send verification code', async () => {
    const result = await sendVerificationCode('+15551234567', '123456');
    expect(result.success).toBe(true);
    expect(result.sid).toBeDefined();
  });
  
  it('should handle Twilio API error', async () => {
    // Mock Twilio error
    twilioMock.messages.create.mockRejectedValue(new Error('Invalid number'));
    
    const result = await sendVerificationCode('+1invalid', '123456');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
    // __tests__/utils/timezone.test.js
describe('Timezone utilities', () => {
  it('should calculate countdown correctly', () => {
    const countdown = calculateCountdown('14:00', 'America/New_York');
    expect(countdown).toMatch(/\d+ hours \d+ minutes/);
  });
  
  it('should handle timezone changes', () => {
    const oldTime = '10:00 AM PST';
    const newTime = '10:00 AM EST';
    const message = formatTimezoneChangeMessage(oldTime, newTime);
    expect(message).toContain('updated their check-in time');
  });
});
    16.2 Integration Tests
    API integration tests:
    javascript
    describe('Member check-in flow', () => {
  let accessToken;
  let memberId;
  
  beforeAll(async () => {
    // Create test user
    const user = await createTestUser();
    accessToken = user.accessToken;
    memberId = user.memberId;
  });
  
  it('should check in successfully', async () => {
    const response = await request(app)
      .post(`/api/members/${memberId}/check-in`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ timezone: 'America/Los_Angeles' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.check_in).toBeDefined();
  });
  
  it('should send SMS to Contacts', async () => {
    // Check SMS log
    const smsLogs = await db.query('SELECT * FROM sms_logs WHERE type = $1', ['check_in_confirmation']);
    expect(smsLogs.rows.length).toBeGreaterThan(0);
  });
});
    16.3 End-to-End Tests (Detox)
    E2E test scenarios:
    javascript
    describe('Contact onboarding flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });
  
  it('should complete full onboarding', async () => {
    // Welcome screen
    await expect(element(by.text('Get Started'))).toBeVisible();
    await element(by.text('Get Started')).tap();
    
    // Phone number
    await element(by.id('phone-input')).typeText('5551234567');
    await element(by.text('Continue')).tap();
    
    // Verification code
    await waitFor(element(by.text('Enter the code'))).toBeVisible().withTimeout(5000);
    await element(by.id('code-input')).typeText('123456');
    
    // PIN creation
    await waitFor(element(by.text('Create a 4-digit PIN'))).toBeVisible();
    await element(by.id('pin-input')).typeText('1234');
    await element(by.id('pin-confirm-input')).typeText('1234');
    
    // Font size
    await waitFor(element(by.text('Choose your text size'))).toBeVisible();
    await element(by.text('Continue')).tap();
    
    // Trial welcome
    await expect(element(by.text('Add Your First Member'))).toBeVisible();
    await element(by.text('Add Your First Member')).tap();
    
    // Success: reached Member invite screen
    await expect(element(by.text('Who would you like to check on daily?'))).toBeVisible();
  });
});
    16.4 QA Test Cases (100+ Scenarios)
    Critical path testing:
        1. Contact Onboarding 
            ○ Enter valid phone number
            ○ Receive SMS verification code
            ○ Enter correct code
            ○ Create PIN successfully
            ○ Select font size
            ○ See trial welcome modal
            ○ Reach dashboard
        2. Member Onboarding 
            ○ Receive invite SMS
            ○ Download app from link
            ○ Create account with phone verification
            ○ Enter invite code
            ○ Connect to Contact
            ○ Set check-in time
            ○ See Member dashboard
        3. Daily Check-in 
            ○ Member taps "I'm OK" button
            ○ Success modal appears
            ○ Contacts receive SMS confirmation
            ○ Contacts receive push notification
            ○ Dashboard updates "Last check-in" timestamp
        4. Missed Check-in 
            ○ Deadline passes without check-in
            ○ Contacts receive SMS alert within 1 minute
            ○ Contacts receive push notification
            ○ Alert includes Member's phone number
            ○ Only one alert sent per day
        5. Late Check-in 
            ○ Member checks in after deadline
            ○ Contacts receive update SMS
            ○ Update mentions "X minutes late"
        6. Payment 
            ○ Add credit card via Stripe Elements
            ○ Subscription created successfully
            ○ Account status changes to 'active'
            ○ First charge processes correctly
            ○ Recurring charges work monthly
        7. Subscription Cancellation 
            ○ User cancels subscription
            ○ Access retained until period end
            ○ Account freezes after period end
            ○ No alerts sent when frozen
        8. Grandfathered Free 
            ○ Contact becomes Member
            ○ Subscription doesn't renew
            ○ Account status = active_free
            ○ Can still monitor others for free
            ○ Notification explains free benefit
    Negative testing:
        • Invalid phone number format
        • Expired verification code
        • Wrong PIN (5 failed attempts → lockout)
        • Duplicate phone number registration
        • Invalid invite code
        • Stripe payment failure
        • Network timeout during API call
        • App killed during onboarding
        • Device storage full
        • Push notification permission denied
    
    17. TECHNOLOGY STACK & DEPENDENCIES
    17.1 Mobile App (React Native)
    Framework:
        • React Native: 0.72.6
        • React: 18.2.0
        • React Navigation: 6.x (navigation)
    State Management:
        • Redux Toolkit: 1.9.x (global state)
        • React Query: 4.x (API caching)
        • AsyncStorage: Encrypted local storage
    UI Components:
        • React Native Elements: 3.x (base components)
        • React Native Vector Icons: 10.x (icons)
        • React Native Reanimated: 3.x (animations)
    Forms & Validation:
        • React Hook Form: 7.x
        • Yup: 1.x (schema validation)
    Date & Time:
        • moment-timezone: 0.5.x (timezone handling)
        • date-fns: 2.x (date utilities)
    Payment:
        • @stripe/stripe-react-native: 0.35.x
    Push Notifications:
        • @react-native-firebase/app: 18.x
        • @react-native-firebase/messaging: 18.x
    Development:
        • TypeScript: 5.x (optional, recommended)
        • ESLint: 8.x (linting)
        • Prettier: 3.x (formatting)
        • Jest: 29.x (testing)
        • Detox: 20.x (E2E testing)
    17.2 Backend (Node.js)
    Framework:
        • Node.js: 18.x LTS
        • Express.js: 4.x
        • TypeScript: 5.x
    Database:
        • Supabase Client: 2.x
        • PostgreSQL: 15.x (via Supabase)
    Authentication:
        • jsonwebtoken: 9.x (JWT)
        • bcrypt: 5.x (PIN hashing)
    External Services:
        • Stripe Node SDK: 13.x
        • Twilio Node SDK: 4.x
        • Firebase Admin SDK: 11.x (push notifications)
    Utilities:
        • moment-timezone: 0.5.x
        • dotenv: 16.x (environment variables)
        • helmet: 7.x (security headers)
        • cors: 2.x
        • express-rate-limit: 6.x
    Development:
        • nodemon: 3.x (hot reload)
        • ts-node: 10.x (TypeScript execution)
        • Jest: 29.x (testing)
        • Supertest: 6.x (API testing)
    17.3 Infrastructure
    Hosting:
        • Backend API: Railway / Render (Node.js hosting)
        • Mobile App: App Store (iOS) + Google Play (Android)
    Database:
        • Supabase (managed PostgreSQL)
        • Location: US-West (primary)
        • Backups: Every 6 hours, 30-day retention
    CDN & Static Assets:
        • Cloudflare (DNS, CDN)
        • S3-compatible storage (if needed for future file uploads)
    Monitoring:
        • Sentry: Error tracking (frontend + backend)
        • LogRocket: Session replay (optional)
        • Supabase Dashboard: Database metrics
    CI/CD:
        • GitHub Actions: Automated testing + deployment
        • Fastlane: iOS/Android build automation
    
    18. ENVIRONMENT CONFIGURATION & DEPLOYMENT
    18.1 Environment Variables
    Backend (.env):
    bash
    # Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.pruuf.app
    # Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Secret, never expose
    # Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx # For frontend
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx # $2.99/month price
    # Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+15555551234
    # Firebase (Push Notifications)
FIREBASE_PROJECT_ID=pruuf-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@pruuf-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    # JWT
JWT_SECRET=random_256_bit_secret_here
JWT_EXPIRY=90d
    # Security
BCRYPT_ROUNDS=10
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
