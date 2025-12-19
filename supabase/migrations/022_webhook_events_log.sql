-- Migration: Webhook Events Log Table
-- Purpose: Event deduplication and audit trail for RevenueCat webhooks
-- Created: 2025-12-16

/**
 * WEBHOOK_EVENTS_LOG TABLE
 *
 * Stores all incoming webhook events from RevenueCat for:
 * 1. Event deduplication (prevent processing same event multiple times)
 * 2. Audit trail (what events were received and how they were processed)
 * 3. Error debugging (track which events failed and why)
 * 4. Monitoring (query event statistics and success rates)
 *
 * Retention: 90 days (cleaned up by data-retention-cleanup cron job)
 */

CREATE TABLE IF NOT EXISTS webhook_events_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_id TEXT NOT NULL,              -- RevenueCat event ID (for deduplication)
  event_type TEXT NOT NULL,            -- INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.

  -- User association
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL for TEST events

  -- Event data
  payload JSONB NOT NULL,              -- Full webhook payload for debugging

  -- Processing result
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,                  -- NULL if success = TRUE

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT webhook_event_type_check CHECK (
    event_type IN (
      'INITIAL_PURCHASE',
      'RENEWAL',
      'CANCELLATION',
      'UNCANCELLATION',
      'NON_RENEWING_PURCHASE',
      'SUBSCRIPTION_PAUSED',
      'SUBSCRIPTION_EXTENDED',
      'BILLING_ISSUE',
      'PRODUCT_CHANGE',
      'TRANSFER',
      'EXPIRATION',
      'TEST'
    )
  )
);

-- Indexes for fast lookups

-- Deduplication query: Check if event already processed (within 24-hour window)
CREATE INDEX idx_webhook_events_dedup ON webhook_events_log(event_id, event_type, created_at DESC);

-- Monitoring query: Count events by type and success
CREATE INDEX idx_webhook_events_type_success ON webhook_events_log(event_type, success, created_at DESC);

-- User audit trail: All webhook events for a user
CREATE INDEX idx_webhook_events_user ON webhook_events_log(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Failed events query: Find all failed events for debugging
CREATE INDEX idx_webhook_events_failed ON webhook_events_log(created_at DESC)
  WHERE success = FALSE;

-- Composite index for deduplication window queries (removed NOW() predicate - not immutable)
CREATE INDEX idx_webhook_events_window ON webhook_events_log(event_type, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE webhook_events_log IS 'Audit log of all RevenueCat webhook events for deduplication and monitoring';
COMMENT ON COLUMN webhook_events_log.event_id IS 'Unique identifier from RevenueCat (used for deduplication)';
COMMENT ON COLUMN webhook_events_log.event_type IS 'Type of webhook event (INITIAL_PURCHASE, RENEWAL, etc.)';
COMMENT ON COLUMN webhook_events_log.user_id IS 'Pruuf user associated with event (NULL for TEST events)';
COMMENT ON COLUMN webhook_events_log.payload IS 'Full JSON payload from RevenueCat for debugging';
COMMENT ON COLUMN webhook_events_log.success IS 'Whether event was processed successfully';
COMMENT ON COLUMN webhook_events_log.error_message IS 'Error message if processing failed';

/**
 * Enable Row Level Security
 *
 * Only allow service role to read/write (webhook handler uses service key)
 * Regular users should never access this table directly
 */
ALTER TABLE webhook_events_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by webhook handler)
CREATE POLICY webhook_events_service_role
  ON webhook_events_log
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admin policy removed - Pruuf doesn't have admin users
-- Service role policy above provides full access for webhook handling

/**
 * DATA RETENTION FUNCTION
 *
 * Delete webhook events older than 90 days
 * Called by data-retention-cleanup cron job
 */
CREATE OR REPLACE FUNCTION cleanup_webhook_events_log()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log cleanup action
  INSERT INTO audit_logs (
    user_id,
    event_type,
    event_category,
    event_status,
    event_data
  ) VALUES (
    NULL,
    'webhook_events_cleanup',
    'admin',
    'success',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', 90
    )
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_webhook_events_log IS 'Delete webhook events older than 90 days (called by cron job)';

/**
 * HELPER FUNCTION: Get Event Statistics
 *
 * Returns webhook event statistics for monitoring dashboard
 */
CREATE OR REPLACE FUNCTION get_webhook_event_stats(
  since_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  event_type TEXT,
  total_events BIGINT,
  successful_events BIGINT,
  failed_events BIGINT,
  success_rate NUMERIC,
  last_event_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wel.event_type,
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE wel.success = TRUE) AS successful_events,
    COUNT(*) FILTER (WHERE wel.success = FALSE) AS failed_events,
    ROUND(
      COUNT(*) FILTER (WHERE wel.success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
      2
    ) AS success_rate,
    MAX(wel.created_at) AS last_event_at
  FROM webhook_events_log wel
  WHERE wel.created_at >= NOW() - MAKE_INTERVAL(hours => since_hours)
  GROUP BY wel.event_type
  ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_webhook_event_stats IS 'Get webhook event statistics for monitoring (default: last 24 hours)';

/**
 * HELPER FUNCTION: Get Failed Events
 *
 * Returns details of failed webhook events for debugging
 */
CREATE OR REPLACE FUNCTION get_failed_webhook_events(
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  event_type TEXT,
  user_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  payload JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wel.id,
    wel.event_id,
    wel.event_type,
    wel.user_id,
    wel.error_message,
    wel.created_at,
    wel.payload
  FROM webhook_events_log wel
  WHERE wel.success = FALSE
  ORDER BY wel.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_failed_webhook_events IS 'Get recent failed webhook events for debugging';

/**
 * HELPER FUNCTION: Check Event Deduplication
 *
 * Check if event has already been processed (used by webhook handler)
 * Returns TRUE if duplicate found within last 24 hours
 */
CREATE OR REPLACE FUNCTION is_duplicate_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT,
  window_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  event_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM webhook_events_log
    WHERE event_id = p_event_id
    AND event_type = p_event_type
    AND created_at >= NOW() - MAKE_INTERVAL(hours => window_hours)
  ) INTO event_exists;

  RETURN event_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_duplicate_webhook_event IS 'Check if webhook event already processed (deduplication)';
