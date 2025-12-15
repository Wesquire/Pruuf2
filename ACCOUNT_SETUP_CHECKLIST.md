# PRUUF: ACCOUNT SETUP CHECKLIST

**Document Version:** 1.0
**Created:** December 15, 2025
**Purpose:** Complete all required account setup before beginning React Native CLI migration
**Estimated Time:** 2-4 hours (spread across multiple days for approval processes)

---

## OVERVIEW

Before you can complete the React Native CLI migration (especially the payment system migration from Stripe to RevenueCat), you must have the following accounts set up and configured:

| Account | Required For | Priority | Approval Time |
|---------|--------------|----------|---------------|
| RevenueCat | In-app purchases | CRITICAL | Instant |
| Apple Developer Program | iOS App Store + IAP | CRITICAL | 24-48 hours |
| Google Play Console | Android Play Store + Billing | CRITICAL | 24-48 hours |
| Postmark | Transactional emails | HIGH | Instant |
| Firebase | Push notifications (FCM) | Already configured | N/A |

---

## 1. REVENUECAT ACCOUNT SETUP

### 1.1 Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Click "Get Started Free"
3. Sign up with your email or GitHub
4. Verify your email address

### 1.2 Create RevenueCat Project

1. Click "Create New Project"
2. **Project Name:** `Pruuf`
3. Click "Create Project"

### 1.3 Add iOS App to RevenueCat

1. In your RevenueCat project, click "Apps" in sidebar
2. Click "+ New" to add an app
3. Select "App Store" as the platform
4. **App Name:** `Pruuf iOS`
5. **Bundle ID:** `me.pruuf.app`
6. Click "Save"

### 1.4 Add Android App to RevenueCat

1. Click "+ New" again
2. Select "Play Store" as the platform
3. **App Name:** `Pruuf Android`
4. **Package Name:** `me.pruuf.app`
5. Click "Save"

### 1.5 Get RevenueCat API Keys

1. In your project, go to "API Keys" in sidebar
2. Copy the **Public iOS API Key** (starts with `appl_`)
3. Copy the **Public Android API Key** (starts with `goog_`)
4. Save these securely - you'll need them for the migration

### 1.6 Configure Entitlement

1. Go to "Entitlements" in sidebar
2. Click "+ New"
3. **Identifier:** `premium`
4. **Description:** `Full access to Pruuf features`
5. Click "Add"

### 1.7 Configure Products (After App Store/Play Store setup)

Products will be added after you create them in App Store Connect and Google Play Console (see sections below).

**RevenueCat Checklist:**
- [ ] Account created
- [ ] Project created with name "Pruuf"
- [ ] iOS app added with bundle ID `me.pruuf.app`
- [ ] Android app added with package name `me.pruuf.app`
- [ ] iOS API key saved: `appl_________________`
- [ ] Android API key saved: `goog_________________`
- [ ] Entitlement "premium" created

---

## 2. APPLE DEVELOPER PROGRAM

### 2.1 Enroll in Apple Developer Program

**If you don't have an Apple Developer account:**

1. Go to https://developer.apple.com/programs/enroll/
2. Click "Start Your Enrollment"
3. Sign in with your Apple ID (or create one)
4. Choose enrollment type:
   - **Individual:** $99/year (for individual developers)
   - **Organization:** $99/year (requires D-U-N-S number)
5. Complete payment
6. **Wait for approval (24-48 hours)**

### 2.2 Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click "My Apps" → "+" → "New App"
3. **Platforms:** iOS
4. **Name:** `Pruuf`
5. **Primary Language:** English (U.S.)
6. **Bundle ID:** Select or create `me.pruuf.app`
7. **SKU:** `pruuf-ios-001`
8. Click "Create"

### 2.3 Configure In-App Purchases

1. In your app, go to "Features" → "In-App Purchases"
2. Click "+" to create first product

#### Monthly Subscription
- **Type:** Auto-Renewable Subscription
- **Reference Name:** `Monthly Subscription`
- **Product ID:** `me.pruuf.app.monthly`
- **Subscription Group:** Create new → `Pruuf Premium`
- **Subscription Duration:** 1 Month
- **Price:** $3.99 USD

3. Click "Create"
4. Add localization:
   - **Display Name:** `Monthly`
   - **Description:** `Unlimited check-in monitoring - billed monthly`

#### Annual Subscription
5. Click "+" again
- **Type:** Auto-Renewable Subscription
- **Reference Name:** `Annual Subscription`
- **Product ID:** `me.pruuf.app.annual`
- **Subscription Group:** Select `Pruuf Premium`
- **Subscription Duration:** 1 Year
- **Price:** $29.00 USD

6. Add localization:
   - **Display Name:** `Annual`
   - **Description:** `Unlimited check-in monitoring - billed annually (save 39%)`

### 2.4 Configure Free Trial

1. Go to "Features" → "Subscriptions"
2. Click on "Pruuf Premium" subscription group
3. Click "Subscription Prices" → "Introductory Offers"
4. Add offer:
   - **Type:** Free Trial
   - **Duration:** 1 Month (30 days)
   - **Eligibility:** New subscribers only

### 2.5 Connect to RevenueCat

1. In App Store Connect, go to "Users and Access"
2. Click "Keys" tab → "In-App Purchase" sub-tab
3. Click "+" to generate a new key
4. **Name:** `RevenueCat`
5. Download the `.p8` file
6. Note the **Key ID** and **Issuer ID**

7. In RevenueCat dashboard:
   - Go to your iOS app
   - Click "App Store Connect API" section
   - Upload the `.p8` file
   - Enter Key ID and Issuer ID
   - Click "Save"

### 2.6 Configure App-Specific Shared Secret

1. In App Store Connect, go to your app
2. Go to "App Information"
3. Scroll to "App-Specific Shared Secret"
4. Click "Manage" → "Generate"
5. Copy the secret

6. In RevenueCat:
   - Go to your iOS app settings
   - Paste the shared secret in "App Store Connect Shared Secret"
   - Click "Save"

**Apple Developer Checklist:**
- [ ] Enrolled in Apple Developer Program ($99 paid)
- [ ] App created in App Store Connect
- [ ] Monthly subscription created (`me.pruuf.app.monthly` - $3.99)
- [ ] Annual subscription created (`me.pruuf.app.annual` - $29.00)
- [ ] 30-day free trial configured
- [ ] App Store Connect API key created and uploaded to RevenueCat
- [ ] Shared secret configured in RevenueCat

---

## 3. GOOGLE PLAY CONSOLE

### 3.1 Create Google Play Developer Account

**If you don't have a Google Play Console account:**

1. Go to https://play.google.com/console/
2. Sign in with your Google account
3. Click "Create account"
4. **Account type:** Individual or Organization
5. Pay one-time $25 registration fee
6. Complete identity verification
7. **Wait for approval (can be instant to 48 hours)**

### 3.2 Create App in Google Play Console

1. Go to https://play.google.com/console/
2. Click "Create app"
3. **App name:** `Pruuf`
4. **Default language:** English (United States)
5. **App or game:** App
6. **Free or paid:** Free (with in-app purchases)
7. Accept declarations
8. Click "Create app"

### 3.3 Configure App Details

1. Complete "Set up your app" checklist:
   - App access
   - Ads declaration
   - Content rating
   - Target audience
   - News app status
   - COVID-19 contact tracing
   - Data safety

### 3.4 Configure In-App Products

1. Go to "Monetize" → "Products" → "Subscriptions"
2. Click "Create subscription"

#### Monthly Subscription
- **Product ID:** `me.pruuf.app.monthly`
- **Name:** `Monthly Subscription`
- **Description:** `Unlimited check-in monitoring - billed monthly`
- **Default price:** $3.99 USD
- Click "Save"

3. Configure base plan:
   - **Base plan ID:** `monthly-plan`
   - **Renewal type:** Auto-renewing
   - **Billing period:** 1 month
   - **Grace period:** 3 days
   - **Resubscribe:** Enabled

#### Annual Subscription
4. Click "Create subscription" again
- **Product ID:** `me.pruuf.app.annual`
- **Name:** `Annual Subscription`
- **Description:** `Unlimited check-in monitoring - billed annually (save 39%)`
- **Default price:** $29.00 USD

5. Configure base plan:
   - **Base plan ID:** `annual-plan`
   - **Renewal type:** Auto-renewing
   - **Billing period:** 1 year
   - **Grace period:** 3 days
   - **Resubscribe:** Enabled

### 3.5 Configure Free Trial Offer

1. For each subscription, add an offer:
   - Click "Add offer" under the base plan
   - **Offer ID:** `free-trial`
   - **Eligibility:** Developer determined
   - **Phases:** Add phase
     - **Type:** Free
     - **Duration:** 1 month

### 3.6 Connect to RevenueCat

1. In Google Play Console, go to "Setup" → "API access"
2. Click "Link a project" to link to Google Cloud Console
3. Create or link a Google Cloud project
4. Click "Create new service account"
5. In Google Cloud Console:
   - Name: `RevenueCat Integration`
   - Role: "Pub/Sub Editor" + "Monitoring Viewer"
6. Create JSON key for the service account
7. Download the JSON key file

8. In RevenueCat:
   - Go to your Android app
   - Click "Google Play Store credentials"
   - Upload the JSON key file
   - Click "Save"

### 3.7 Enable Real-time Developer Notifications

1. In Google Play Console, go to "Monetize" → "Monetization setup"
2. Under "Google Play Billing", click "Edit"
3. Enter a topic name for real-time notifications
4. In RevenueCat, configure the pub/sub topic URL

**Google Play Console Checklist:**
- [ ] Google Play Developer account created ($25 paid)
- [ ] App created in Google Play Console
- [ ] Monthly subscription created (`me.pruuf.app.monthly` - $3.99)
- [ ] Annual subscription created (`me.pruuf.app.annual` - $29.00)
- [ ] 30-day free trial offers configured
- [ ] Service account created with JSON key
- [ ] JSON key uploaded to RevenueCat
- [ ] Real-time notifications configured

---

## 4. POSTMARK EMAIL SETUP

### 4.1 Create Postmark Account

1. Go to https://postmarkapp.com/
2. Click "Try It Free"
3. Sign up with your email
4. Verify your email address

### 4.2 Create Server

1. In Postmark dashboard, click "Servers"
2. Click "Create Server"
3. **Name:** `Pruuf Production`
4. **Color:** Green (or your preference)
5. Click "Create Server"

### 4.3 Verify Sending Domain

1. Click "Sender Signatures"
2. Click "Add Domain"
3. Enter domain: `pruuf.me`
4. Add DNS records to your domain registrar:
   - DKIM record (TXT)
   - Return-Path record (CNAME)
5. Click "Verify" once DNS propagates

### 4.4 Get Server API Token

1. Go to your server settings
2. Click "API Tokens" tab
3. Copy the **Server API Token**
4. Save securely - this goes in your backend environment

### 4.5 Create Email Templates

Create these templates in Postmark:

| Template Alias | Purpose | Subject |
|----------------|---------|---------|
| `email-verification` | Account verification | Verify your Pruuf account |
| `member-invitation` | Member invite | {contact_name} invited you to Pruuf |
| `missed-checkin-alert` | Critical alert | {member_name} missed their check-in |
| `late-checkin-update` | Status update | Update: {member_name} checked in |
| `payment-failed` | Payment issue | Action required: Update your payment |
| `trial-ending` | Trial reminder | Your Pruuf trial ends in {days} days |
| `password-reset` | PIN reset | Reset your Pruuf PIN |

**Postmark Checklist:**
- [ ] Postmark account created
- [ ] Server "Pruuf Production" created
- [ ] Domain `pruuf.me` verified
- [ ] Server API token saved: `_____________________`
- [ ] Email templates created (7 templates)

---

## 5. DOMAIN CONFIGURATION (pruuf.me)

### 5.1 Universal Links (iOS) - Apple App Site Association

Create file at `https://pruuf.me/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.me.pruuf.app",
        "paths": [
          "/invite/*",
          "/verify-email",
          "/accept-invite"
        ]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

### 5.2 App Links (Android) - Digital Asset Links

Create file at `https://pruuf.me/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "me.pruuf.app",
      "sha256_cert_fingerprints": [
        "YOUR_APP_SIGNING_CERTIFICATE_SHA256"
      ]
    }
  }
]
```

Get your SHA256 fingerprint from Google Play Console → Setup → App signing.

### 5.3 DNS Records for Email (if not already configured)

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| MX | @ | (varies by email provider) | Email receiving |
| TXT | @ | v=spf1 include:spf.mtasv.net ~all | Postmark SPF |
| TXT | (dkim selector) | (from Postmark) | DKIM signing |
| CNAME | pm-bounces | pm.mtasv.net | Return-Path |

**Domain Configuration Checklist:**
- [ ] `apple-app-site-association` file hosted at pruuf.me
- [ ] `assetlinks.json` file hosted at pruuf.me
- [ ] DNS records configured for Postmark
- [ ] SSL certificate valid for pruuf.me

---

## 6. FIREBASE CONFIGURATION (VERIFICATION)

Firebase should already be configured for FCM. Verify these settings:

### 6.1 iOS Configuration

1. In Firebase Console, go to Project Settings → General
2. Verify iOS app is registered with bundle ID `me.pruuf.app`
3. Download fresh `GoogleService-Info.plist` if needed
4. Ensure APNs key is uploaded (for push notifications)

### 6.2 Android Configuration

1. Verify Android app is registered with package name `me.pruuf.app`
2. Download fresh `google-services.json` if needed
3. Ensure SHA-1 and SHA-256 fingerprints are added

**Firebase Verification Checklist:**
- [ ] iOS app registered with `me.pruuf.app`
- [ ] `GoogleService-Info.plist` up to date
- [ ] APNs authentication key uploaded
- [ ] Android app registered with `me.pruuf.app`
- [ ] `google-services.json` up to date
- [ ] SHA fingerprints configured

---

## 7. FINAL INTEGRATION CHECKLIST

Before starting the code migration, verify ALL items are complete:

### RevenueCat
- [ ] Project created
- [ ] iOS app configured
- [ ] Android app configured
- [ ] Entitlement "premium" created
- [ ] iOS API key obtained
- [ ] Android API key obtained

### Apple Developer
- [ ] Developer Program enrollment complete
- [ ] App created in App Store Connect
- [ ] Products created and approved
- [ ] API credentials connected to RevenueCat

### Google Play
- [ ] Developer account active
- [ ] App created in Play Console
- [ ] Products created and active
- [ ] Service account connected to RevenueCat

### Postmark
- [ ] Account created
- [ ] Domain verified
- [ ] Templates created
- [ ] API token obtained

### Domain
- [ ] Universal links configured
- [ ] App links configured
- [ ] DNS records set

### Firebase
- [ ] iOS configuration verified
- [ ] Android configuration verified

---

## 8. ENVIRONMENT VARIABLES TO COLLECT

After completing all setup, collect these values for your codebase:

```bash
# RevenueCat
REVENUECAT_API_KEY_IOS=appl_xxxxxxxxxxxxx
REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxxxxxxx

# Postmark
POSTMARK_SERVER_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Firebase (should already be in google-services.json / GoogleService-Info.plist)
# No additional env vars needed

# Domain
APP_DOMAIN=pruuf.me
API_BASE_URL=https://api.pruuf.me
```

---

## ESTIMATED TIMELINE

| Task | Duration | Notes |
|------|----------|-------|
| RevenueCat setup | 30 minutes | Instant approval |
| Apple Developer enrollment | 24-48 hours | Requires approval |
| Apple products setup | 1-2 hours | After enrollment approved |
| Google Play enrollment | Instant-48 hours | May require verification |
| Google Play products setup | 1-2 hours | After account approved |
| Postmark setup | 30 minutes | Instant, DNS may take 24h |
| Domain configuration | 30 minutes | DNS propagation 1-24h |

**Total estimated time:** 2-4 hours of work, spread over 2-3 days waiting for approvals

---

## NEXT STEPS

Once all items in this checklist are complete:

1. Update `src/services/revenuecat.ts` with your API keys
2. Update backend environment with Postmark token
3. Deploy domain configuration files
4. Proceed with `react_native_migration_master_plan.md`

---

**END OF ACCOUNT SETUP CHECKLIST**
