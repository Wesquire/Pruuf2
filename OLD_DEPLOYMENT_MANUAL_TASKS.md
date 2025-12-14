# PRUUF - MANUAL SUPABASE TASKS CHECKLIST

**Created**: 2025-12-07
**Purpose**: Track all manual tasks that must be performed in Supabase Dashboard or via CLI
**Instructions**: Check off each task as you complete it

---

## OVERVIEW

This document contains all tasks that cannot be automated via code and require manual action in:
- Supabase Dashboard (https://supabase.com/dashboard)
- Supabase CLI commands
- Environment variable configuration
- Database migrations

Each task includes:
- ✅ Checkbox to mark complete
- 📋 Exact steps to perform
- 💻 Code/SQL to execute (if applicable)
- ⚠️ Important warnings or prerequisites

---

## DATABASE MIGRATIONS

### Migration Tasks
(No tasks yet - will be added as implementation progresses)

---

## EDGE FUNCTION DEPLOYMENTS

### Deployment Tasks
(No tasks yet - will be added as implementation progresses)

---

## CRON JOBS

### Scheduling Tasks
(No tasks yet - will be added as implementation progresses)

---

## ENVIRONMENT VARIABLES

### Environment Configuration Tasks
(No tasks yet - will be added as implementation progresses)

---

## VERIFICATION STEPS

### Post-Deployment Verification
(No tasks yet - will be added as implementation progresses)

---

## NOTES

- Tasks are added to this document as implementation progresses
- Each subsection of work may add new tasks here
- Complete tasks in the order they appear
- Some tasks depend on previous tasks being completed first

---


## PHASE 1.1 MANUAL TASKS - DOMAIN MIGRATION

### Task 1.1.1: Update Local Environment File
**When to do**: Before testing the app locally after this migration

**Steps**:
1. Open your local `.env` file (not `.env.example`, but the actual `.env` that's in your `.gitignore`)
2. Find the line that says `API_BASE_URL=https://api.pruuf.app`
3. Change it to: `API_BASE_URL=https://api.pruuf.me`
4. Save the file

**Why**: The `.env` file is not tracked in git (for security), so you need to manually update it on your local machine. This tells your local development environment to use the new domain.

---

### Task 1.1.2: Configure DNS for pruuf.me
**When to do**: Before deploying to production
**Where**: Your DNS provider (e.g., Cloudflare, Namecheap, Route53)

**Steps**:
1. Log into your DNS provider
2. Add these DNS records:

**For the main domain:**
- Type: `A` record
- Name: `@` (or `pruuf.me`)
- Value: Your server IP address (e.g., `123.45.67.89`)
- TTL: 3600

**For the API subdomain:**
- Type: `CNAME` or `A` record
- Name: `api`
- Value: Your API server domain or IP
- TTL: 3600

**For the staging API:**
- Type: `CNAME` or `A` record
- Name: `staging-api`
- Value: Your staging server domain or IP
- TTL: 3600

**Why**: DNS (Domain Name System) is like a phone book for the internet. You're telling the internet that when someone types "pruuf.me", they should be directed to your server's address.

---

### Task 1.1.3: Update SSL Certificates
**When to do**: After DNS is configured
**Where**: Your server or SSL provider (e.g., Let's Encrypt, Cloudflare)

**Steps**:
1. If using Let's Encrypt (via Certbot):
```bash
sudo certbot certonly --standalone -d pruuf.me -d api.pruuf.me -d staging-api.pruuf.me
```

2. If using Cloudflare:
   - SSL/TLS settings will auto-configure when DNS is set up
   - Make sure SSL/TLS mode is set to "Full (strict)"

3. Update your server configuration to use the new certificates:
   - Nginx: Update `server_name` to `api.pruuf.me`
   - Apache: Update `ServerName` to `api.pruuf.me`

**Why**: SSL certificates encrypt the connection between users and your server. They're tied to specific domain names, so you need new certificates for pruuf.me.

---

### Task 1.1.4: Update Supabase Project URL (if applicable)
**When to do**: If your Supabase project uses custom domains
**Where**: Supabase Dashboard → Project Settings → API

**Steps**:
1. Go to your Supabase project dashboard
2. Navigate to Project Settings → API
3. Check if any custom domains are configured
4. If yes, update them from `pruuf.app` to `pruuf.me`

**Why**: Supabase may have custom domain configurations that need updating.

---

### Task 1.1.5: Update Firebase Console
**When to do**: Before deploying mobile apps to stores
**Where**: Firebase Console (console.firebase.google.com)

**Steps**:

**For iOS app:**
1. Go to Project Settings → General → Your apps → iOS app
2. Verify Bundle ID is set to: `me.pruuf.app`
3. If not, you'll need to create a new iOS app with the correct bundle ID

**For Android app:**
1. Go to Project Settings → General → Your apps → Android app
2. Verify Package name is set to: `me.pruuf.app`
3. If not, you'll need to create a new Android app with the correct package name

**Download new config files:**
- Download new `GoogleService-Info.plist` for iOS
- Download new `google-services.json` for Android
- Replace the existing files in your project (they're currently .example files)

**Why**: Firebase needs to know your app's official identifiers to send push notifications and track analytics correctly.

---

### Task 1.1.6: Update Apple Developer Account
**When to do**: Before submitting iOS app to App Store
**Where**: developer.apple.com

**Steps**:
1. Log into Apple Developer account
2. Go to Certificates, Identifiers & Profiles → Identifiers
3. Create new App ID with:
   - Bundle ID: `me.pruuf.app`
   - Description: Pruuf Safety Check-In
   - Enable capabilities: Push Notifications, Sign in with Apple (if used)
4. Create/update provisioning profiles with new Bundle ID

**Why**: Apple needs to register your app's unique identifier before you can submit to the App Store.

---

### Task 1.1.7: Update Google Play Console
**When to do**: Before submitting Android app to Play Store
**Where**: play.google.com/console

**Steps**:
1. Log into Google Play Console
2. If creating new app:
   - Create new app
   - Package name: `me.pruuf.app`
3. If updating existing app:
   - You **cannot** change package name of existing app
   - You must create a new app listing

**Note**: If you have an existing app on Play Store with `com.pruuf.app`, you'll need to:
- Create a new app listing for `me.pruuf.app`
- Coordinate migration of users
- Or keep old package name (but this conflicts with domain migration)

**Why**: Google Play identifies apps by their package name, which cannot be changed once published.

---

### Task 1.1.8: Update Stripe Webhook URLs
**When to do**: Before testing payments in production
**Where**: Stripe Dashboard (dashboard.stripe.com)

**Steps**:
1. Log into Stripe Dashboard
2. Go to Developers → Webhooks
3. Find your existing webhook endpoint
4. Update the URL from:
   - Old: `https://api.pruuf.app/api/stripe-webhooks/webhook`
   - New: `https://api.pruuf.me/api/stripe-webhooks/webhook`
5. Keep the same webhook secret (don't regenerate unless necessary)
6. Test the webhook endpoint after DNS is live

**Why**: Stripe needs to send payment notifications to your new domain.

---

### VERIFICATION CHECKLIST FOR PHASE 1.1

After completing all manual tasks above, verify:

- [ ] Local `.env` file updated to `api.pruuf.me`
- [ ] DNS records created and propagated (test with `nslookup pruuf.me`)
- [ ] SSL certificates installed and working (test with `https://api.pruuf.me`)
- [ ] Firebase console updated with new bundle IDs
- [ ] Apple Developer account has new App ID registered
- [ ] Google Play Console has plan for new package name
- [ ] Stripe webhooks updated and tested
- [ ] All services responding correctly at new domain
- [ ] Old domain (pruuf.app) redirects to new domain (pruuf.me) [optional but recommended]

**Test Commands:**
```bash
# Test DNS resolution
nslookup api.pruuf.me

# Test SSL certificate
curl -I https://api.pruuf.me

# Test API endpoint
curl https://api.pruuf.me/health
```

---

