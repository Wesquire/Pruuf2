/**
 * RevenueCat Webhook Integration Tests
 *
 * Tests all webhook event handlers for:
 * - Correct database updates
 * - Event deduplication
 * - Error handling and retries
 * - Audit logging
 * - Edge cases
 *
 * Run with: deno test --allow-net --allow-env tests/integration/revenuecat-webhooks.test.ts
 */

import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Test configuration
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') || 'http://localhost:54321/functions/v1/webhooks/revenuecat';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!;

let supabase: SupabaseClient;
let testUserId: string;

/**
 * Generate HMAC SHA256 signature for webhook payload
 */
async function generateWebhookSignature(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(REVENUECAT_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Send webhook event to handler
 */
async function sendWebhookEvent(event: any): Promise<Response> {
  const payload = JSON.stringify(event);
  const signature = await generateWebhookSignature(payload);

  return fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RevenueCat-Signature': signature,
    },
    body: payload,
  });
}

/**
 * Create mock webhook event
 */
function createMockEvent(
  type: string,
  userId: string,
  eventId?: string,
  additionalData?: any
): any {
  return {
    id: eventId || `evt_${type.toLowerCase()}_${Date.now()}`,
    type,
    event: {
      type,
      app_user_id: userId,
      ...additionalData,
    },
    subscriber: {
      original_app_user_id: userId,
      subscriptions: [
        {
          id: `sub_${Date.now()}`,
          product_id: 'pruuf_monthly',
          expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ...additionalData?.subscription,
        },
      ],
    },
  };
}

/**
 * Setup: Create test user
 */
Deno.test({
  name: 'Setup: Create test user',
  async fn() {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create test user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: `test_webhook_${Date.now()}@example.com`,
        pin_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',  // Mock hash
        account_status: 'trial',
        email_verified: true,
      })
      .select()
      .single();

    assertExists(data);
    assertEquals(error, null);
    testUserId = data.id;
    console.log(`✓ Created test user: ${testUserId}`);
  },
});

/**
 * TEST 1: INITIAL_PURCHASE - First subscription
 */
Deno.test({
  name: 'Webhook: INITIAL_PURCHASE creates active subscription',
  async fn() {
    const event = createMockEvent('INITIAL_PURCHASE', testUserId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const body = await response.json();
    assertEquals(body.success, true);

    // Verify database updated
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'active');
    assertExists(user.revenuecat_subscription_id);
    assertExists(user.last_payment_date);

    // Verify audit log created
    const { data: auditLog } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('action', 'subscription_created')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    assertExists(auditLog);

    console.log('✓ INITIAL_PURCHASE processed correctly');
  },
});

/**
 * TEST 2: RENEWAL - Subscription renewed
 */
Deno.test({
  name: 'Webhook: RENEWAL updates last payment date',
  async fn() {
    const event = createMockEvent('RENEWAL', testUserId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    // Verify last_payment_date updated
    const { data: user } = await supabase
      .from('users')
      .select('last_payment_date')
      .eq('id', testUserId)
      .single();

    assertExists(user.last_payment_date);
    const paymentDate = new Date(user.last_payment_date);
    const now = new Date();
    const diffMs = now.getTime() - paymentDate.getTime();
    assert(diffMs < 5000, 'Payment date should be within last 5 seconds');

    console.log('✓ RENEWAL processed correctly');
  },
});

/**
 * TEST 3: CANCELLATION - User canceled subscription
 */
Deno.test({
  name: 'Webhook: CANCELLATION sets status to canceled',
  async fn() {
    const event = createMockEvent('CANCELLATION', testUserId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'canceled');

    console.log('✓ CANCELLATION processed correctly');
  },
});

/**
 * TEST 4: UNCANCELLATION - User reactivated subscription
 */
Deno.test({
  name: 'Webhook: UNCANCELLATION reactivates subscription',
  async fn() {
    const event = createMockEvent('UNCANCELLATION', testUserId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'active');

    console.log('✓ UNCANCELLATION processed correctly');
  },
});

/**
 * TEST 5: SUBSCRIPTION_PAUSED - Android subscription paused
 */
Deno.test({
  name: 'Webhook: SUBSCRIPTION_PAUSED sets status to paused',
  async fn() {
    const event = createMockEvent('SUBSCRIPTION_PAUSED', testUserId, undefined, {
      subscription: {
        auto_resume_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'paused');

    console.log('✓ SUBSCRIPTION_PAUSED processed correctly');
  },
});

/**
 * TEST 6: SUBSCRIPTION_EXTENDED - Developer extended subscription
 */
Deno.test({
  name: 'Webhook: SUBSCRIPTION_EXTENDED activates account',
  async fn() {
    const event = createMockEvent('SUBSCRIPTION_EXTENDED', testUserId, undefined, {
      subscription: {
        expires_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'active');

    console.log('✓ SUBSCRIPTION_EXTENDED processed correctly');
  },
});

/**
 * TEST 7: BILLING_ISSUE - Payment failed
 */
Deno.test({
  name: 'Webhook: BILLING_ISSUE sets status to past_due',
  async fn() {
    const event = createMockEvent('BILLING_ISSUE', testUserId, undefined, {
      subscription: {
        grace_period_expires_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'past_due');

    console.log('✓ BILLING_ISSUE processed correctly');
  },
});

/**
 * TEST 8: EXPIRATION - Subscription expired
 */
Deno.test({
  name: 'Webhook: EXPIRATION freezes account',
  async fn() {
    const event = createMockEvent('EXPIRATION', testUserId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', testUserId)
      .single();

    assertEquals(user.account_status, 'frozen');

    console.log('✓ EXPIRATION processed correctly');
  },
});

/**
 * TEST 9: TRANSFER - Subscription transferred to new user
 */
Deno.test({
  name: 'Webhook: TRANSFER moves subscription between users',
  async fn() {
    // Create second test user (transfer from user)
    const { data: fromUser } = await supabase
      .from('users')
      .insert({
        email: `test_transfer_from_${Date.now()}@example.com`,
        pin_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
        account_status: 'active',
        email_verified: true,
        revenuecat_subscription_id: 'sub_to_transfer',
      })
      .select()
      .single();

    assertExists(fromUser);

    // Create transfer event
    const event = createMockEvent('TRANSFER', testUserId);
    event.transferred_from = [fromUser.id];

    const response = await sendWebhookEvent(event);
    assertEquals(response.status, 200);

    // Verify old user subscription removed
    const { data: oldUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', fromUser.id)
      .single();

    assertEquals(oldUser.account_status, 'frozen');
    assertEquals(oldUser.revenuecat_subscription_id, null);

    // Verify new user has subscription
    const { data: newUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    assertEquals(newUser.account_status, 'active');
    assertExists(newUser.revenuecat_subscription_id);

    console.log('✓ TRANSFER processed correctly');
  },
});

/**
 * TEST 10: TEST event - No action required
 */
Deno.test({
  name: 'Webhook: TEST event is logged but takes no action',
  async fn() {
    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'TEST',
      event: {
        type: 'TEST',
      },
    };

    const response = await sendWebhookEvent(event);
    assertEquals(response.status, 200);

    // Verify audit log created
    const { data: auditLog } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'webhook_test_received')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    assertExists(auditLog);

    console.log('✓ TEST event processed correctly');
  },
});

/**
 * TEST 11: Event Deduplication - Same event sent twice
 */
Deno.test({
  name: 'Webhook: Duplicate events are ignored',
  async fn() {
    const eventId = `evt_duplicate_${Date.now()}`;
    const event = createMockEvent('RENEWAL', testUserId, eventId);

    // Send first time
    const response1 = await sendWebhookEvent(event);
    assertEquals(response1.status, 200);

    // Get last_payment_date after first event
    const { data: user1 } = await supabase
      .from('users')
      .select('last_payment_date')
      .eq('id', testUserId)
      .single();

    const firstPaymentDate = user1.last_payment_date;

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send same event again (should be ignored)
    const response2 = await sendWebhookEvent(event);
    assertEquals(response2.status, 200);

    // Verify last_payment_date not updated
    const { data: user2 } = await supabase
      .from('users')
      .select('last_payment_date')
      .eq('id', testUserId)
      .single();

    assertEquals(user2.last_payment_date, firstPaymentDate);

    console.log('✓ Event deduplication works correctly');
  },
});

/**
 * TEST 12: Invalid Signature - Rejected
 */
Deno.test({
  name: 'Webhook: Invalid signature is rejected',
  async fn() {
    const event = createMockEvent('RENEWAL', testUserId);
    const payload = JSON.stringify(event);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RevenueCat-Signature': 'invalid_signature_12345',
      },
      body: payload,
    });

    assertEquals(response.status, 401);

    const body = await response.json();
    assertEquals(body.error, 'Invalid signature');

    console.log('✓ Invalid signature rejected correctly');
  },
});

/**
 * TEST 13: Missing User ID - Fails gracefully
 */
Deno.test({
  name: 'Webhook: Missing user_id fails gracefully',
  async fn() {
    const event = createMockEvent('INITIAL_PURCHASE', '');  // Empty user_id
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 500);

    const body = await response.json();
    assert(body.error.includes('Missing user_id'));

    console.log('✓ Missing user_id handled correctly');
  },
});

/**
 * TEST 14: Unknown Event Type - Fails gracefully
 */
Deno.test({
  name: 'Webhook: Unknown event type fails gracefully',
  async fn() {
    const event = createMockEvent('UNKNOWN_EVENT_TYPE', testUserId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 500);

    const body = await response.json();
    assert(body.error.includes('Unknown event type'));

    console.log('✓ Unknown event type handled correctly');
  },
});

/**
 * TEST 15: Webhook Events Log - All events logged
 */
Deno.test({
  name: 'Webhook: All events logged to webhook_events_log',
  async fn() {
    const eventId = `evt_log_test_${Date.now()}`;
    const event = createMockEvent('RENEWAL', testUserId, eventId);
    const response = await sendWebhookEvent(event);

    assertEquals(response.status, 200);

    // Verify event logged
    const { data: logEntry } = await supabase
      .from('webhook_events_log')
      .select('*')
      .eq('event_id', eventId)
      .single();

    assertExists(logEntry);
    assertEquals(logEntry.event_type, 'RENEWAL');
    assertEquals(logEntry.user_id, testUserId);
    assertEquals(logEntry.success, true);
    assertExists(logEntry.payload);

    console.log('✓ Event logging works correctly');
  },
});

/**
 * TEST 16: GET request rejected
 */
Deno.test({
  name: 'Webhook: GET requests are rejected',
  async fn() {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET',
    });

    assertEquals(response.status, 405);

    const body = await response.json();
    assertEquals(body.error, 'Method not allowed');

    console.log('✓ GET request rejected correctly');
  },
});

/**
 * Cleanup: Delete test user
 */
Deno.test({
  name: 'Cleanup: Delete test users',
  async fn() {
    await supabase
      .from('users')
      .delete()
      .like('email', 'test_webhook_%@example.com');

    await supabase
      .from('users')
      .delete()
      .like('email', 'test_transfer_%@example.com');

    console.log('✓ Test users cleaned up');
  },
});
