# TWILIO CONFIGURATION GUIDE FOR PRUUF

**Document Version:** 1.0
**Created:** 2025-11-26
**Purpose:** Step-by-step instructions for configuring Twilio for the Pruuf phone verification and SMS system
**Audience:** Developers setting up Twilio for the first time

---

## TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Twilio Account Setup](#twilio-account-setup)
3. [Phone Number Configuration](#phone-number-configuration)
4. [Inbound SMS Webhook Setup](#inbound-sms-webhook-setup)
5. [Messaging Service Configuration](#messaging-service-configuration)
6. [Delivery Status Callbacks](#delivery-status-callbacks)
7. [Testing the Webhook](#testing-the-webhook)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Twilio account (free trial or paid)
- [ ] Your Pruuf backend deployed and accessible via HTTPS
- [ ] The inbound SMS webhook endpoint deployed: `/webhooks/twilio/inbound-sms`
- [ ] Your Twilio credentials saved:
  - Account SID
  - Auth Token
  - Phone Number

**Environment Variables Required:**
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

---

## Twilio Account Setup

### Step 1: Create or Log Into Twilio Account

1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a new account or log in
3. Complete phone verification if required

### Step 2: Locate Your Credentials

1. Navigate to the Twilio Console Dashboard
2. Find your **Account SID** and **Auth Token** in the "Account Info" section
3. **IMPORTANT:** Keep your Auth Token secret - never commit it to version control
4. Copy these values to your `.env` file

**Screenshot Location:** Top-right of Dashboard → "Account Info" panel

---

## Phone Number Configuration

### Step 3: Purchase or Verify Phone Number

**If you already have a number:**
1. Go to: **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. Proceed to Step 4

**If you need to purchase a number:**
1. Go to: **Phone Numbers** → **Buy a Number**
2. Select your country (US for MVP)
3. **IMPORTANT:** Check "SMS" capability (not just "Voice")
4. Search for available numbers
5. Purchase a number (free trial accounts get one free number)
6. Copy the phone number in E.164 format: `+15551234567`

### Step 4: Verify SMS Capability

1. In **Active Numbers**, click your phone number
2. Scroll to **Capabilities** section
3. Verify:
   - ✅ SMS: Enabled
   - ✅ MMS: Enabled (optional but recommended)
   - Voice: Enabled (not required for Pruuf)

**Important for Trial Accounts:**
- Trial accounts can only send SMS to verified phone numbers
- To test with real numbers, verify them at: **Phone Numbers** → **Verified Caller IDs**
- To verify a number: Click "+" → Enter phone → Receive code → Confirm

---

## Inbound SMS Webhook Setup

### Step 5: Configure Inbound SMS Webhook URL

This is the MOST IMPORTANT step for phone verification to work.

1. Go to: **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your Pruuf phone number
3. Scroll to **Messaging Configuration** section
4. Find "A MESSAGE COMES IN" section
5. Configure as follows:

**Webhook Settings:**
- **URL:** `https://api.pruuf.life/webhooks/twilio/inbound-sms`
  - Replace `api.pruuf.life` with your actual API domain
  - Must be HTTPS (not HTTP)
  - Must be publicly accessible (not localhost)
- **Method:** HTTP POST
- **Content Type:** application/x-www-form-urlencoded

**Screenshot of correct settings:**
```
A MESSAGE COMES IN
Webhook: https://api.pruuf.life/webhooks/twilio/inbound-sms
HTTP POST
```

6. Click **Save** at the bottom of the page

### Step 6: Verify Webhook URL is Accessible

Test that your webhook is deployed and accessible:

```bash
curl -X POST https://api.pruuf.life/webhooks/twilio/inbound-sms \
  -d "From=+15551234567" \
  -d "Body=YES" \
  -d "MessageSid=SM_test_123"
```

**Expected Response:**
- HTTP 200 status code
- TwiML XML response (even if content is empty `<Response></Response>`)

**If you get an error:**
- 404: Webhook endpoint not deployed
- 500: Backend error (check logs)
- Connection timeout: URL not publicly accessible

---

## Messaging Service Configuration

### Step 7: Create Messaging Service (Optional but Recommended)

Messaging Services provide better deliverability and easier management.

1. Go to: **Messaging** → **Services**
2. Click **Create Messaging Service**
3. Enter details:
   - **Friendly Name:** "Pruuf SMS Service"
   - **Use Case:** Select "Notifications, Outbound"
4. Click **Create**

### Step 8: Add Phone Number to Messaging Service

1. In your Messaging Service, go to **Sender Pool** tab
2. Click **Add Senders**
3. Select your Pruuf phone number
4. Click **Add Phone Numbers**

### Step 9: Configure Messaging Service Webhook (Optional)

If using Messaging Service:

1. Go to **Integration** tab
2. Under "Incoming Messages", configure:
   - **Request URL:** `https://api.pruuf.life/webhooks/twilio/inbound-sms`
   - **HTTP Method:** POST
3. Click **Save**

**Note:** You can configure webhooks at either the phone number level OR messaging service level (not both).

---

## Delivery Status Callbacks

### Step 10: Enable Delivery Status Callbacks

Track when SMS messages are delivered or fail.

1. Go to: **Phone Numbers** → **Manage** → **Active Numbers**
2. Click your Pruuf phone number
3. Scroll to **Messaging Configuration**
4. Find "STATUS CALLBACK URL" section
5. Configure:
   - **URL:** `https://api.pruuf.life/webhooks/twilio/sms-status`
   - **Method:** HTTP POST

**Status Callback Events:**
- `queued` - Message queued for sending
- `sent` - Message sent from Twilio
- `delivered` - Message delivered to recipient
- `undelivered` - Delivery failed
- `failed` - Message failed to send

6. Click **Save**

---

## Testing the Webhook

### Step 11: Test Phone Verification End-to-End

**Test Flow:**
1. Create a new Pruuf account with a phone number
2. Check that you receive an SMS: "Pruuf Safety Check-In: Reply YES to this message to verify your phone..."
3. Reply "YES" to that message
4. Check Supabase database: `users.phone_verified` should be `TRUE`
5. Check backend logs for webhook activity

**Test with Twilio Test Phone Number:**

For development/testing without sending real SMS:

1. Use Twilio's magic test number: `+15005550006`
2. This number triggers SMS sending without actual delivery
3. Simulate inbound SMS manually:

```bash
curl -X POST https://api.pruuf.life/webhooks/twilio/inbound-sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+15551234567" \
  -d "Body=YES" \
  -d "MessageSid=SM_test_123" \
  -d "To=+15005550006"
```

### Step 12: Verify Webhook Security

Test that invalid signatures are rejected:

```bash
# This should be rejected (missing Twilio signature)
curl -X POST https://api.pruuf.life/webhooks/twilio/inbound-sms \
  -d "From=+15551234567" \
  -d "Body=YES"
```

**Expected:** 401 Unauthorized response

---

## Security Considerations

### Webhook Signature Validation

Your backend **MUST** validate the `X-Twilio-Signature` header on every inbound request.

**Why?** Without validation, attackers can spoof webhook requests and fake phone verifications.

**Validation Logic (implemented in your backend):**
```typescript
// This is already in your code at:
// supabase/functions/_shared/twilio-security.ts

import { createHmac } from 'crypto';

function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Build validation string
  let validationString = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    validationString += key + params[key];
  }

  // Compute HMAC-SHA1
  const hmac = createHmac('sha1', authToken);
  hmac.update(validationString);
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}
```

**Never disable signature validation in production!**

### Rate Limiting

Configure rate limits in Twilio Console to prevent abuse:

1. Go to: **Programmable Messaging** → **Settings** → **Rate Limits**
2. Set limits:
   - **Max messages per second:** 10
   - **Max messages per phone per hour:** 5
3. Click **Save**

### IP Whitelisting (Optional)

For additional security, whitelist Twilio's IP ranges:

1. Go to: **Account** → **Security**
2. Under "Allowed IP Addresses", add Twilio's webhook IPs
3. See: [Twilio's IP Ranges](https://www.twilio.com/docs/lookup/v1/ips)

---

## Troubleshooting

### Problem: User Not Receiving SMS

**Diagnosis:**
1. Check Twilio Console → **Monitor** → **Logs** → **Messaging**
2. Look for recent outbound messages
3. Check delivery status

**Common Causes:**
- **Trial Account Restriction:** Recipient phone not verified
  - Solution: Verify phone at **Phone Numbers** → **Verified Caller IDs**
- **Invalid Phone Number:** Not in E.164 format
  - Solution: Ensure phone is `+1XXXXXXXXXX` (with country code)
- **SMS Capability Disabled:** Phone number doesn't support SMS
  - Solution: Purchase new number with SMS enabled
- **Rate Limit Exceeded:** Too many messages sent
  - Solution: Wait or upgrade account

### Problem: Webhook Not Receiving User Replies

**Diagnosis:**
1. Send a test reply to your Twilio number
2. Check Twilio Console → **Monitor** → **Logs** → **Messaging**
3. Look for inbound messages
4. Check webhook delivery attempts and errors

**Common Causes:**
- **Webhook URL Not Configured:** Missing in phone number settings
  - Solution: Follow Step 5 above
- **Webhook Returns Error:** Backend returning 500 error
  - Solution: Check backend logs, fix error
- **URL Not Accessible:** Firewall or DNS issue
  - Solution: Test with `curl` from external server
- **Invalid TwiML Response:** Backend not returning valid XML
  - Solution: Always return `<?xml version="1.0"?><Response></Response>`

### Problem: Signature Validation Failing

**Diagnosis:**
Check backend logs for:
- "Invalid Twilio signature" errors
- Mismatched signature values

**Common Causes:**
- **Wrong Auth Token:** Environment variable doesn't match Twilio console
  - Solution: Verify `TWILIO_AUTH_TOKEN` matches console
- **URL Mismatch:** Webhook URL in code doesn't match configured URL
  - Solution: Ensure exact match (including trailing slash)
- **Proxy/Load Balancer:** Modifying request URL
  - Solution: Use original URL for validation

### Problem: Users Reply but Not Marked as Verified

**Diagnosis:**
1. Check Twilio webhook logs: Does webhook receive "YES" reply?
2. Check backend logs: Does webhook handler execute?
3. Check database: Is `phone_verified` still FALSE?

**Common Causes:**
- **Case Sensitivity:** Code only checks uppercase "YES"
  - Solution: Already handled (normalizes to uppercase)
- **Whitespace:** User types " YES " with spaces
  - Solution: Already handled (trims input)
- **Database Update Failing:** SQL error
  - Solution: Check logs, verify database permissions

### Getting Help

**Twilio Support:**
- Console: **Help** → **Support**
- Docs: [twilio.com/docs](https://www.twilio.com/docs)
- Status: [status.twilio.com](https://status.twilio.com)

**Pruuf Backend Logs:**
```bash
# View Supabase Edge Function logs
supabase functions logs webhooks-twilio-inbound-sms --tail
```

---

## Verification Checklist

Before marking Twilio configuration as complete:

- [ ] Twilio credentials saved to `.env` file
- [ ] Phone number purchased with SMS capability enabled
- [ ] Inbound SMS webhook URL configured on phone number
- [ ] Delivery status callback URL configured
- [ ] Webhook security (signature validation) implemented
- [ ] Test: Send SMS to Twilio number → Received successfully
- [ ] Test: Reply to SMS → Webhook receives reply
- [ ] Test: Reply "YES" → User marked as verified in database
- [ ] Test: Reply with lowercase "yes" → Also works
- [ ] Test: Invalid signature → Webhook rejects (401)
- [ ] Rate limits configured
- [ ] Trial account phone numbers verified (if using trial)
- [ ] Messaging service created (optional)
- [ ] Production domain configured (https://api.pruuf.life)

---

## Quick Reference

**Twilio Console Sections:**
- **Phone Numbers:** `https://console.twilio.com/us1/develop/phone-numbers/manage/`
- **Messaging Logs:** `https://console.twilio.com/us1/monitor/logs/sms`
- **Messaging Services:** `https://console.twilio.com/us1/develop/sms/services`
- **Account Settings:** `https://console.twilio.com/settings`

**Important URLs:**
- Inbound SMS Webhook: `https://api.pruuf.life/webhooks/twilio/inbound-sms`
- SMS Status Callback: `https://api.pruuf.life/webhooks/twilio/sms-status`

**Test Commands:**
```bash
# Test webhook is accessible
curl -X POST https://api.pruuf.life/webhooks/twilio/inbound-sms \
  -d "From=+15551234567" -d "Body=YES" -d "MessageSid=SM_test"

# View webhook logs (Supabase)
supabase functions logs webhooks-twilio-inbound-sms --tail

# Check database for verified user
psql -h <host> -U postgres -d postgres \
  -c "SELECT phone, phone_verified FROM users WHERE phone='+15551234567';"
```

---

## Next Steps

After Twilio is fully configured:

1. ✅ Test end-to-end phone verification flow with real phone numbers
2. ✅ Deploy 24-hour reminder cron job (Section 3.3 of main plan)
3. ✅ Implement frontend blocking banner for unverified users (Section 7.2)
4. ✅ Update all invite endpoints to check `phone_verified` (Section 3.4)
5. ✅ Run integration tests (Section 9.2)
6. ✅ Configure monitoring and alerts for webhook failures
7. ✅ Document any custom configuration for your team

**See main implementation plan for complete details:** `/Users/wesquire/.claude/plans/enumerated-tinkering-steele.md`

---

**END OF TWILIO CONFIGURATION GUIDE**
