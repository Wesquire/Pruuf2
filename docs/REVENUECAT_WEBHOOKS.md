# RevenueCat Webhook Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Supported Events](#supported-events)
4. [Event Handlers](#event-handlers)
5. [Security](#security)
6. [Event Deduplication](#event-deduplication)
7. [Error Handling & Retries](#error-handling--retries)
8. [Testing](#testing)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)
11. [RevenueCat Configuration](#revenuecat-configuration)

---

## Overview

The RevenueCat webhook integration handles all subscription lifecycle events for Pruuf's payment system. When subscription events occur (purchase, renewal, cancellation, etc.), RevenueCat sends webhook events to our backend, which processes them and updates user account status accordingly.

**Key Features:**
- ✅ Complete coverage of 12 RevenueCat event types
- ✅ HMAC SHA256 signature verification for security
- ✅ Event deduplication (prevents processing same event multiple times)
- ✅ Exponential backoff retry logic (3 attempts)
- ✅ Comprehensive audit logging
- ✅ 16+ integration tests

**Endpoint:**
```
POST https://api.pruuf.me/functions/v1/webhooks/revenuecat
```

---

## Architecture

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────┐
│  RevenueCat  │────────▶│  Webhook        │────────▶│  Supabase    │
│   Platform   │  HTTPS  │  Handler        │  Query  │  PostgreSQL  │
└──────────────┘         └─────────────────┘         └──────────────┘
      │                         │                          │
      │                         ├─ Verify Signature        │
      │                         ├─ Check Deduplication     │
      │                         ├─ Route to Handler   ────▶│
      │                         ├─ Retry on Failure        │
      │                         └─ Log Event          ────▶│
      │                                                     │
      └─────────────────────────────────────────────────────┘
       Event: RENEWAL, CANCELLATION, BILLING_ISSUE, etc.
```

**Flow:**
1. RevenueCat sends webhook POST request with HMAC signature
2. Handler verifies signature using `revenuecatWebhookVerifier`
3. Handler checks if event already processed (deduplication)
4. Handler routes event to appropriate handler function
5. Handler updates database (users table, audit_logs)
6. Handler logs event to `webhook_events_log` table
7. If error occurs, retry with exponential backoff (3 attempts max)

---

## Supported Events

| Event Type | Description | Handler Function | Database Update |
|------------|-------------|------------------|-----------------|
| **INITIAL_PURCHASE** | User's first subscription purchase | `handleInitialPurchase` | Set `account_status = 'active'`, store subscription ID |
| **RENEWAL** | Subscription renewed successfully | `handleRenewal` | Update `last_payment_date`, ensure `account_status = 'active'` |
| **CANCELLATION** | User canceled subscription | `handleCancellation` | Set `account_status = 'canceled'` (access until period end) |
| **UNCANCELLATION** | User reactivated canceled subscription | `handleUncancellation` | Set `account_status = 'active'` |
| **SUBSCRIPTION_PAUSED** | Subscription paused (Android only) | `handleSubscriptionPaused` | Set `account_status = 'paused'` |
| **SUBSCRIPTION_EXTENDED** | Developer extended subscription | `handleSubscriptionExtended` | Set `account_status = 'active'`, log extension |
| **BILLING_ISSUE** | Payment failed (grace period) | `handleBillingIssue` | Set `account_status = 'past_due'`, send alert |
| **PRODUCT_CHANGE** | User switched subscription tier | `handleProductChange` | Log change (no action for Pruuf - single tier) |
| **TRANSFER** | Subscription moved between users | `handleTransfer` | Remove from old user, add to new user |
| **EXPIRATION** | Subscription expired without renewal | `handleExpiration` | Set `account_status = 'frozen'` |
| **TEST** | Test webhook from RevenueCat | `handleTest` | Log only, no action |
| **NON_RENEWING_PURCHASE** | One-time purchase (not used) | N/A | Log warning, no action |

---

## Event Handlers

### INITIAL_PURCHASE

**When:** User makes their first subscription purchase (after trial or immediately)

**Actions:**
1. Update `users.account_status = 'active'`
2. Store `revenuecat_customer_id` and `revenuecat_subscription_id`
3. Update `last_payment_date = NOW()`
4. Create audit log with `action = 'subscription_created'`

**Example Event:**
```json
{
  "id": "evt_abc123",
  "type": "INITIAL_PURCHASE",
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "user-uuid-here"
  },
  "subscriber": {
    "original_app_user_id": "user-uuid-here",
    "subscriptions": [
      {
        "id": "sub_xyz789",
        "product_id": "pruuf_monthly",
        "expires_date": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

**Edge Cases:**
- User already has active subscription → Update subscription ID (handle upgrade/downgrade)
- User is Member (grandfathered) → Log but don't charge (should not happen)

---

### RENEWAL

**When:** Subscription automatically renews (monthly or annually)

**Actions:**
1. Update `users.account_status = 'active'` (in case it was 'past_due')
2. Update `last_payment_date = NOW()`
3. Create audit log with `action = 'subscription_renewed'`

**Edge Cases:**
- User was `past_due` → Renewal brings them back to `active`
- User canceled → RevenueCat shouldn't send RENEWAL (should send EXPIRATION instead)

---

### CANCELLATION

**When:** User cancels subscription (keeps access until period end)

**Actions:**
1. Set `users.account_status = 'canceled'`
2. Log cancellation with `access_until = expires_date`
3. **DO NOT freeze account yet** (access retained until `expires_date`)

**Important:** Account freezing happens via EXPIRATION event when period ends.

**Edge Cases:**
- User cancels and immediately re-subscribes → UNCANCELLATION event will follow

---

### SUBSCRIPTION_PAUSED (Android Only)

**When:** User pauses subscription (Android feature)

**Actions:**
1. Set `users.account_status = 'paused'`
2. Log `auto_resume_date` from event
3. Send notification explaining pause

**Edge Cases:**
- iOS users will never receive this event (iOS doesn't support pause)
- Auto-resume will trigger RENEWAL or UNCANCELLATION event

---

### SUBSCRIPTION_EXTENDED

**When:** Developer manually extends subscription (compensation, goodwill)

**Actions:**
1. Set `users.account_status = 'active'`
2. Log new `expires_date` and reason
3. Send notification to user about free extension

**Use Cases:**
- Compensate for service outage
- Reward loyal users
- Resolve billing dispute

---

### BILLING_ISSUE

**When:** Payment fails (card declined, insufficient funds, expired card)

**Actions:**
1. Set `users.account_status = 'past_due'`
2. Log `grace_period_expires_date`
3. **Send CRITICAL notification** to user to update payment method
4. User has 3-day grace period before account frozen

**Edge Cases:**
- If payment succeeds during grace period → RENEWAL event will reactivate
- If grace period expires → EXPIRATION event will freeze account

---

### TRANSFER

**When:** Subscription transfers from one user to another (device change, account merge)

**Actions:**
1. Find `transferred_from` user ID from event
2. Update old user: Set `account_status = 'frozen'`, clear subscription IDs
3. Update new user: Set `account_status = 'active'`, store subscription IDs
4. Log transfer with both user IDs
5. Send notifications to both users

**Edge Cases:**
- Old user has multiple subscriptions → Only transfer the one in event
- New user already has subscription → Update to new subscription ID

---

### EXPIRATION

**When:** Subscription expires without renewal (after grace period or cancellation)

**Actions:**
1. Set `users.account_status = 'frozen'`
2. User loses access to Contact features (can no longer receive missed check-in alerts)
3. Send notification with resubscribe link

**Edge Cases:**
- User is Member or grandfathered → Should NOT receive EXPIRATION (they're free)
- User resubscribes after expiration → INITIAL_PURCHASE or RENEWAL will reactivate

---

### TEST

**When:** RevenueCat sends test webhook (via dashboard or API)

**Actions:**
1. Log audit entry with `action = 'webhook_test_received'`
2. Return 200 OK (no database changes)

**Use Cases:**
- Verify webhook endpoint is reachable
- Test signature verification
- Validate firewall/routing configuration

---

## Security

### HMAC SHA256 Signature Verification

Every webhook request from RevenueCat includes `X-RevenueCat-Signature` header containing HMAC SHA256 signature of the request body.

**Verification Process:**
1. Extract raw request body (string)
2. Compute HMAC SHA256 using `REVENUECAT_WEBHOOK_SECRET`
3. Compare computed signature with header value (constant-time comparison)
4. Reject request if signatures don't match (401 response)

**Implementation:**
```typescript
import { verifyRevenueCatWebhook } from '../../_shared/revenuecatWebhookVerifier.ts';

const signature = request.headers.get('X-RevenueCat-Signature');
const rawBody = await request.text();

const isValid = await verifyRevenueCatWebhook(rawBody, signature);

if (!isValid) {
  return new Response(
    JSON.stringify({ error: 'Invalid signature' }),
    { status: 401 }
  );
}
```

**Security Best Practices:**
- ✅ Webhook secret stored in environment variable (never hardcoded)
- ✅ Constant-time comparison prevents timing attacks
- ✅ Signature verified BEFORE any processing
- ✅ Invalid signatures logged for monitoring

---

## Event Deduplication

RevenueCat may send the same webhook event multiple times due to retries, network issues, or manual resends. Deduplication prevents processing the same event twice.

**Deduplication Strategy:**
1. Extract `event.id` from webhook payload (unique per event)
2. Check `webhook_events_log` table for existing event with same ID and type
3. Only check events within last 24 hours (deduplication window)
4. If duplicate found, return 200 OK without processing
5. If not found, process event and log to `webhook_events_log`

**Database Query:**
```sql
SELECT id FROM webhook_events_log
WHERE event_id = 'evt_abc123'
  AND event_type = 'RENEWAL'
  AND created_at >= NOW() - INTERVAL '24 hours'
LIMIT 1;
```

**Edge Cases:**
- Same event after 24-hour window → Processed as new (rare, acceptable)
- Different event types with same ID → Processed separately (RevenueCat uses unique IDs)

---

## Error Handling & Retries

### Exponential Backoff

If event processing fails (database error, network issue), handler retries up to 3 times with exponential backoff:

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1st     | 0s    | 0s         |
| 2nd     | 1s    | 1s         |
| 3rd     | 2s    | 3s         |
| 4th     | 4s    | 7s         |

**Implementation:**
```typescript
const maxRetries = 3;
let attempt = 0;
let lastError: Error | null = null;

while (attempt < maxRetries) {
  try {
    await handleRenewal(event, userId);
    await logWebhookEvent(eventId, eventType, userId, event, true);
    return;
  } catch (err) {
    lastError = err;
    attempt++;

    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt - 1) * 1000;  // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// All retries failed
await logWebhookEvent(eventId, eventType, userId, event, false, lastError.message);
throw lastError;
```

### Error Logging

All webhook processing results (success or failure) are logged to `webhook_events_log`:

```sql
INSERT INTO webhook_events_log (
  event_id,
  event_type,
  user_id,
  payload,
  success,
  error_message
) VALUES (
  'evt_abc123',
  'RENEWAL',
  'user-uuid',
  '{"event": {...}}',
  false,
  'Failed to update user: network timeout'
);
```

---

## Testing

### Local Testing

**1. Start Supabase locally:**
```bash
supabase start
```

**2. Expose webhook endpoint via ngrok:**
```bash
ngrok http 54321
```

**3. Configure RevenueCat webhook URL:**
```
https://your-ngrok-url.ngrok.io/functions/v1/webhooks/revenuecat
```

**4. Send test webhook from RevenueCat dashboard:**
- Go to Project Settings → Integrations → Webhooks
- Click "Send Test Event"
- Select event type (e.g., RENEWAL)
- Verify 200 OK response

### Integration Tests

Run comprehensive test suite:

```bash
cd tests/integration
deno test --allow-net --allow-env revenuecat-webhooks.test.ts
```

**Test Coverage:**
- ✅ All 12 event types
- ✅ Event deduplication
- ✅ Invalid signature rejection
- ✅ Missing user_id handling
- ✅ Unknown event type handling
- ✅ Database updates verification
- ✅ Audit log creation
- ✅ GET request rejection

**Expected Output:**
```
test Setup: Create test user ... ok (245ms)
test Webhook: INITIAL_PURCHASE creates active subscription ... ok (123ms)
test Webhook: RENEWAL updates last payment date ... ok (89ms)
test Webhook: CANCELLATION sets status to canceled ... ok (76ms)
...
test Cleanup: Delete test users ... ok (45ms)

ok | 16 passed | 0 failed (2.3s)
```

---

## Monitoring

### Real-Time Monitoring Queries

**1. Check webhook health (last hour):**
```sql
SELECT * FROM get_webhook_event_stats(1);
```

**2. Recent failed events:**
```sql
SELECT * FROM get_failed_webhook_events(20);
```

**3. Success rate by event type (last 24 hours):**
```sql
SELECT
  event_type,
  COUNT(*) AS total,
  ROUND(
    COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / COUNT(*) * 100,
    2
  ) AS success_rate
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY success_rate ASC;
```

### Alerting Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Success Rate (1 hour) | < 95% | **CRITICAL** - Investigate immediately |
| No events (24 hours) | 0 events | **WARNING** - Check RevenueCat configuration |
| Failed events (same user) | ≥ 3 failures | **WARNING** - Check user account status |
| Event processing delay | > 10 seconds | **WARNING** - Check database performance |

### Monitoring Dashboard Queries

See `docs/webhook-monitoring-queries.sql` for comprehensive monitoring queries including:
- Event statistics
- Failed event debugging
- User subscription status
- Performance monitoring
- Deduplication analysis
- Audit trail queries

---

## Troubleshooting

### Common Issues

#### 1. Webhook returning 401 (Invalid Signature)

**Symptoms:**
- RevenueCat shows "401 Unauthorized" in webhook logs
- No events appear in `webhook_events_log`

**Diagnosis:**
```sql
SELECT * FROM audit_logs
WHERE action = 'webhook_signature_mismatch'
ORDER BY created_at DESC
LIMIT 5;
```

**Causes:**
- Wrong `REVENUECAT_WEBHOOK_SECRET` environment variable
- Webhook secret rotated in RevenueCat but not updated in Supabase
- Request body modified by proxy/middleware

**Fix:**
1. Verify webhook secret in RevenueCat dashboard matches env var
2. Regenerate webhook secret if compromised
3. Update `REVENUECAT_WEBHOOK_SECRET` in Supabase

#### 2. Events Processed Multiple Times

**Symptoms:**
- User's `last_payment_date` updated multiple times for same event
- Duplicate entries in `audit_logs`

**Diagnosis:**
```sql
SELECT
  event_id,
  COUNT(*) AS occurrences
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY event_id
HAVING COUNT(*) > 1;
```

**Causes:**
- Deduplication logic not working (missing `webhook_events_log` table)
- Event ID not extracted correctly from payload

**Fix:**
1. Verify `webhook_events_log` table exists: `SELECT * FROM webhook_events_log LIMIT 1;`
2. Check event ID extraction: Look at `payload` column to verify `event.id` exists
3. Apply migration if table missing: `supabase migration up`

#### 3. Events Failing with Database Errors

**Symptoms:**
- Webhook returns 500 error
- Events logged with `success = false`

**Diagnosis:**
```sql
SELECT
  error_message,
  COUNT(*) AS occurrence_count
FROM webhook_events_log
WHERE success = FALSE
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_message;
```

**Common Errors:**
- `"Failed to update user: row not found"` → User ID in webhook doesn't match any user
- `"Failed to update user: permission denied"` → RLS policy blocking service role
- `"connection timeout"` → Database overloaded or network issue

**Fix:**
1. Verify user exists: `SELECT * FROM users WHERE id = 'user-id-from-webhook';`
2. Check RLS policies allow service role: `ALTER TABLE users FORCE ROW LEVEL SECURITY OFF;` (temporarily)
3. Scale database if performance issue

#### 4. No Webhooks Received

**Symptoms:**
- No events in `webhook_events_log` for 24+ hours
- RevenueCat shows "Webhook endpoint unreachable"

**Diagnosis:**
```sql
SELECT
  COUNT(*) AS events_last_24h,
  MAX(created_at) AS last_event
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

**Causes:**
- Webhook URL not configured in RevenueCat
- Firewall blocking RevenueCat IP addresses
- Supabase function not deployed

**Fix:**
1. Verify webhook URL in RevenueCat: Settings → Integrations → Webhooks
2. Test endpoint manually: `curl -X POST https://api.pruuf.me/functions/v1/webhooks/revenuecat`
3. Check Supabase function logs: `supabase functions logs webhooks/revenuecat`
4. Redeploy function: `supabase functions deploy webhooks/revenuecat`

---

## RevenueCat Configuration

### Webhook Setup

**1. Navigate to RevenueCat Dashboard:**
- Project Settings → Integrations → Webhooks

**2. Add Webhook:**
- URL: `https://api.pruuf.me/functions/v1/webhooks/revenuecat`
- Authorization Header: (leave empty - we use signature verification)
- Events: Select all events

**3. Generate Webhook Secret:**
- RevenueCat will display webhook secret (only shown once)
- Copy secret and store in Supabase environment variables

**4. Configure Supabase Environment:**
```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

**5. Test Webhook:**
- Click "Send Test Event" in RevenueCat dashboard
- Verify 200 OK response
- Check `webhook_events_log` table for TEST event

### Event Delivery Settings

**Retry Policy:**
- RevenueCat retries failed webhooks with exponential backoff
- Maximum 10 retry attempts over 3 days
- After 10 failures, webhook is disabled (requires manual re-enable)

**Timeout:**
- RevenueCat expects response within 10 seconds
- Our handler typically responds in < 1 second

**Deduplication:**
- RevenueCat includes unique `event.id` in each webhook
- We check for duplicate IDs within 24-hour window

### IP Whitelisting (Optional)

If firewall requires IP whitelisting, allow these RevenueCat IPs:
```
18.211.135.69
34.195.169.42
52.72.18.28
```

*(Verify current IPs in RevenueCat documentation)*

---

## Environment Variables

Required environment variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RevenueCat
REVENUECAT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Additional Resources

- [RevenueCat Webhook Documentation](https://docs.revenuecat.com/docs/webhooks)
- [RevenueCat Event Types](https://docs.revenuecat.com/docs/webhooks#event-types)
- [Webhook Authentication](https://docs.revenuecat.com/docs/webhooks#webhook-authentication)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section above
2. Run monitoring queries in `docs/webhook-monitoring-queries.sql`
3. Check Supabase function logs: `supabase functions logs webhooks/revenuecat`
4. Contact RevenueCat support if webhook delivery issue
5. Open GitHub issue for code bugs

---

**Document Version:** 1.0
**Last Updated:** December 16, 2025
**Maintainer:** Pruuf Engineering Team
