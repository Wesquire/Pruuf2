-- ============================================================================
-- REVENUECAT WEBHOOK MONITORING QUERIES
-- ============================================================================
--
-- Purpose: SQL queries for monitoring RevenueCat webhook health and debugging issues
-- Usage: Run these queries in Supabase SQL Editor or via psql
--
-- Table of Contents:
-- 1. Event Statistics
-- 2. Failed Events Debugging
-- 3. User Subscription Status
-- 4. Performance Monitoring
-- 5. Deduplication Analysis
-- 6. Audit Trail Queries
--
-- ============================================================================

-- ============================================================================
-- 1. EVENT STATISTICS
-- ============================================================================

-- 1.1: Overall webhook event statistics (last 24 hours)
-- Shows total events, success rate, and last event time by type
SELECT * FROM get_webhook_event_stats(24);

-- 1.2: Overall webhook event statistics (last 7 days)
SELECT * FROM get_webhook_event_stats(168);

-- 1.3: Event volume by hour (last 24 hours)
-- Useful for identifying traffic patterns
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE success = TRUE) AS successful,
  COUNT(*) FILTER (WHERE success = FALSE) AS failed,
  ROUND(
    COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS success_rate
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 1.4: Event type distribution (all time)
SELECT
  event_type,
  COUNT(*) AS total_count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) AS percentage
FROM webhook_events_log
GROUP BY event_type
ORDER BY total_count DESC;

-- 1.5: Success rate by event type (last 30 days)
SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE success = TRUE) AS successful,
  COUNT(*) FILTER (WHERE success = FALSE) AS failed,
  ROUND(
    COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS success_rate
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY success_rate ASC, total_events DESC;

-- ============================================================================
-- 2. FAILED EVENTS DEBUGGING
-- ============================================================================

-- 2.1: Recent failed webhook events (last 50)
SELECT * FROM get_failed_webhook_events(50);

-- 2.2: Failed events by error message
-- Groups failures by error type to identify systemic issues
SELECT
  error_message,
  COUNT(*) AS occurrence_count,
  MIN(created_at) AS first_occurrence,
  MAX(created_at) AS last_occurrence,
  ARRAY_AGG(DISTINCT event_type) AS affected_event_types
FROM webhook_events_log
WHERE success = FALSE
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY occurrence_count DESC;

-- 2.3: Failed events for specific user
-- Replace 'USER_ID_HERE' with actual user ID
SELECT
  id,
  event_id,
  event_type,
  error_message,
  created_at,
  payload
FROM webhook_events_log
WHERE user_id = 'USER_ID_HERE'
  AND success = FALSE
ORDER BY created_at DESC;

-- 2.4: Events that failed after retries
-- Shows events where all 3 retry attempts failed
SELECT
  event_id,
  event_type,
  user_id,
  error_message,
  created_at
FROM webhook_events_log
WHERE success = FALSE
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 3. USER SUBSCRIPTION STATUS
-- ============================================================================

-- 3.1: Recent subscription lifecycle for specific user
-- Shows all webhook events for a user (chronological order)
-- Replace 'USER_ID_HERE' with actual user ID
SELECT
  wel.event_type,
  wel.success,
  wel.error_message,
  wel.created_at,
  wel.payload->'subscriber'->'subscriptions'->0->>'expires_date' AS expires_date
FROM webhook_events_log wel
WHERE wel.user_id = 'USER_ID_HERE'
ORDER BY wel.created_at DESC
LIMIT 50;

-- 3.2: Users with recent payment failures
-- Identify users who had BILLING_ISSUE events in last 7 days
SELECT DISTINCT
  wel.user_id,
  u.email,
  u.account_status,
  wel.created_at AS billing_issue_date,
  wel.payload->'subscriber'->'subscriptions'->0->>'grace_period_expires_date' AS grace_period_expires
FROM webhook_events_log wel
JOIN users u ON u.id = wel.user_id
WHERE wel.event_type = 'BILLING_ISSUE'
  AND wel.created_at >= NOW() - INTERVAL '7 days'
ORDER BY wel.created_at DESC;

-- 3.3: Users who canceled subscriptions today
SELECT
  wel.user_id,
  u.email,
  wel.created_at AS canceled_at,
  wel.payload->'subscriber'->'subscriptions'->0->>'expires_date' AS access_until
FROM webhook_events_log wel
JOIN users u ON u.id = wel.user_id
WHERE wel.event_type = 'CANCELLATION'
  AND wel.created_at >= CURRENT_DATE
ORDER BY wel.created_at DESC;

-- 3.4: Active subscriptions created in last 30 days
SELECT
  wel.user_id,
  u.email,
  u.account_status,
  wel.created_at AS subscription_started,
  wel.payload->'subscriber'->'subscriptions'->0->>'product_id' AS product_id
FROM webhook_events_log wel
JOIN users u ON u.id = wel.user_id
WHERE wel.event_type = 'INITIAL_PURCHASE'
  AND wel.created_at >= NOW() - INTERVAL '30 days'
  AND wel.success = TRUE
ORDER BY wel.created_at DESC;

-- ============================================================================
-- 4. PERFORMANCE MONITORING
-- ============================================================================

-- 4.1: Webhook processing performance
-- Average time between event creation and processing (if RevenueCat includes timestamp)
SELECT
  event_type,
  COUNT(*) AS total_events,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (created_at - (payload->>'event_timestamp_ms')::BIGINT / 1000 * INTERVAL '1 second'))
  ), 2) AS avg_processing_delay_seconds
FROM webhook_events_log
WHERE payload->>'event_timestamp_ms' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY avg_processing_delay_seconds DESC;

-- 4.2: Webhook events per day (trend analysis)
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE success = TRUE) AS successful,
  COUNT(*) FILTER (WHERE success = FALSE) AS failed,
  ROUND(
    COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS success_rate
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- 4.3: Current webhook processing health
-- Red flag if success rate < 95% in last hour
SELECT
  CASE
    WHEN success_rate >= 99 THEN '✓ EXCELLENT'
    WHEN success_rate >= 95 THEN '⚠ GOOD'
    WHEN success_rate >= 90 THEN '⚠ WARNING'
    ELSE '✗ CRITICAL'
  END AS health_status,
  total_events,
  successful_events,
  failed_events,
  success_rate || '%' AS success_rate
FROM (
  SELECT
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE success = TRUE) AS successful_events,
    COUNT(*) FILTER (WHERE success = FALSE) AS failed_events,
    ROUND(
      COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
      2
    ) AS success_rate
  FROM webhook_events_log
  WHERE created_at >= NOW() - INTERVAL '1 hour'
) stats;

-- ============================================================================
-- 5. DEDUPLICATION ANALYSIS
-- ============================================================================

-- 5.1: Duplicate event attempts (events with same event_id)
-- Identifies how often RevenueCat retries webhooks
SELECT
  event_id,
  event_type,
  COUNT(*) AS attempt_count,
  MIN(created_at) AS first_attempt,
  MAX(created_at) AS last_attempt,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS retry_duration_seconds
FROM webhook_events_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_id, event_type
HAVING COUNT(*) > 1
ORDER BY attempt_count DESC, last_attempt DESC
LIMIT 50;

-- 5.2: Deduplication effectiveness
-- Shows how many duplicate events were prevented
WITH dedup_stats AS (
  SELECT
    event_id,
    COUNT(*) AS total_attempts,
    COUNT(*) - 1 AS duplicates_prevented
  FROM webhook_events_log
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY event_id
)
SELECT
  SUM(total_attempts) AS total_webhook_calls,
  SUM(CASE WHEN total_attempts > 1 THEN 1 ELSE 0 END) AS events_with_duplicates,
  SUM(duplicates_prevented) AS total_duplicates_prevented,
  ROUND(
    SUM(duplicates_prevented)::NUMERIC / NULLIF(SUM(total_attempts), 0) * 100,
    2
  ) AS deduplication_rate
FROM dedup_stats;

-- ============================================================================
-- 6. AUDIT TRAIL QUERIES
-- ============================================================================

-- 6.1: Complete subscription lifecycle for user
-- Combines webhook events + audit logs for full picture
-- Replace 'USER_ID_HERE' with actual user ID
SELECT
  'webhook' AS source,
  wel.event_type AS action,
  wel.created_at,
  wel.success,
  wel.payload->'subscriber'->'subscriptions'->0->>'expires_date' AS expires_date
FROM webhook_events_log wel
WHERE wel.user_id = 'USER_ID_HERE'

UNION ALL

SELECT
  'audit' AS source,
  al.action,
  al.created_at,
  TRUE AS success,
  al.details->>'expires_date' AS expires_date
FROM audit_logs al
WHERE al.user_id = 'USER_ID_HERE'
  AND al.resource_type = 'subscription'

ORDER BY created_at DESC
LIMIT 100;

-- 6.2: TEST webhook events
-- Verify test webhooks are being received
SELECT
  event_id,
  created_at,
  success,
  payload
FROM webhook_events_log
WHERE event_type = 'TEST'
ORDER BY created_at DESC
LIMIT 10;

-- 6.3: Subscription transfers
-- Track when subscriptions move between users
SELECT
  wel.event_id,
  wel.user_id AS new_user_id,
  wel.payload->>'transferred_from' AS old_user_id,
  wel.created_at,
  wel.payload->'subscriber'->'subscriptions'->0->>'id' AS subscription_id
FROM webhook_events_log wel
WHERE wel.event_type = 'TRANSFER'
ORDER BY wel.created_at DESC
LIMIT 50;

-- ============================================================================
-- 7. CLEANUP & MAINTENANCE QUERIES
-- ============================================================================

-- 7.1: Check webhook_events_log table size
SELECT
  pg_size_pretty(pg_total_relation_size('webhook_events_log')) AS total_size,
  pg_size_pretty(pg_relation_size('webhook_events_log')) AS table_size,
  pg_size_pretty(pg_indexes_size('webhook_events_log')) AS indexes_size,
  COUNT(*) AS total_rows
FROM webhook_events_log;

-- 7.2: Old events eligible for cleanup (90+ days)
SELECT
  COUNT(*) AS events_to_cleanup,
  MIN(created_at) AS oldest_event,
  MAX(created_at) AS newest_old_event,
  pg_size_pretty(SUM(pg_column_size(payload))) AS approximate_size_to_free
FROM webhook_events_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- 7.3: Manually trigger cleanup (if cron job not running)
-- CAUTION: This will delete events older than 90 days
-- Uncomment to execute:
-- SELECT cleanup_webhook_events_log();

-- ============================================================================
-- 8. ALERTING QUERIES (for automated monitoring)
-- ============================================================================

-- 8.1: Alert if webhook success rate drops below 95% in last hour
DO $$
DECLARE
  success_rate NUMERIC;
BEGIN
  SELECT
    ROUND(
      COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
      2
    )
  INTO success_rate
  FROM webhook_events_log
  WHERE created_at >= NOW() - INTERVAL '1 hour';

  IF success_rate < 95 THEN
    RAISE WARNING 'ALERT: Webhook success rate is %% (below 95%% threshold)', success_rate;
  END IF;
END $$;

-- 8.2: Alert if no webhooks received in last 24 hours
DO $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO event_count
  FROM webhook_events_log
  WHERE created_at >= NOW() - INTERVAL '24 hours';

  IF event_count = 0 THEN
    RAISE WARNING 'ALERT: No webhook events received in last 24 hours';
  END IF;
END $$;

-- 8.3: Alert if multiple failed events for same user
SELECT
  user_id,
  u.email,
  COUNT(*) AS failed_event_count,
  ARRAY_AGG(DISTINCT event_type) AS failed_event_types,
  ARRAY_AGG(DISTINCT error_message) AS error_messages
FROM webhook_events_log wel
JOIN users u ON u.id = wel.user_id
WHERE wel.success = FALSE
  AND wel.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id, u.email
HAVING COUNT(*) >= 3
ORDER BY failed_event_count DESC;

-- ============================================================================
-- END OF MONITORING QUERIES
-- ============================================================================
