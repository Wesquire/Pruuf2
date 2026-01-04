-- Migration: Remove webhook_events_log table
-- Date: 2026-01-03
-- Reason: No longer using RevenueCat webhooks (Phase 1 of Expo migration - payment removal)
-- Reversible: Yes (see rollback section at bottom)

-- =============================================
-- STEP 1: Drop helper functions
-- =============================================
-- These functions reference the webhook_events_log table
DROP FUNCTION IF EXISTS is_duplicate_webhook_event(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_failed_webhook_events(INTEGER);
DROP FUNCTION IF EXISTS get_webhook_event_stats(INTEGER);
DROP FUNCTION IF EXISTS cleanup_webhook_events_log();

-- =============================================
-- STEP 2: Drop RLS policies
-- =============================================
DROP POLICY IF EXISTS webhook_events_service_role ON webhook_events_log;

-- =============================================
-- STEP 3: Drop indexes
-- =============================================
DROP INDEX IF EXISTS idx_webhook_events_dedup;
DROP INDEX IF EXISTS idx_webhook_events_type_success;
DROP INDEX IF EXISTS idx_webhook_events_user;
DROP INDEX IF EXISTS idx_webhook_events_failed;
DROP INDEX IF EXISTS idx_webhook_events_window;

-- =============================================
-- STEP 4: Drop the table
-- =============================================
DROP TABLE IF EXISTS webhook_events_log;

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration, recreate from migration 022:

CREATE TABLE IF NOT EXISTS webhook_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT webhook_event_type_check CHECK (
    event_type IN (
      'INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'UNCANCELLATION',
      'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_PAUSED', 'SUBSCRIPTION_EXTENDED',
      'BILLING_ISSUE', 'PRODUCT_CHANGE', 'TRANSFER', 'EXPIRATION', 'TEST'
    )
  )
);

-- Recreate indexes
CREATE INDEX idx_webhook_events_dedup ON webhook_events_log(event_id, event_type, created_at DESC);
CREATE INDEX idx_webhook_events_type_success ON webhook_events_log(event_type, success, created_at DESC);
CREATE INDEX idx_webhook_events_user ON webhook_events_log(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_webhook_events_failed ON webhook_events_log(created_at DESC) WHERE success = FALSE;
CREATE INDEX idx_webhook_events_window ON webhook_events_log(event_type, created_at DESC);

-- Enable RLS
ALTER TABLE webhook_events_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_service_role ON webhook_events_log
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Recreate helper functions (see migration 022 for full implementations)
-- cleanup_webhook_events_log()
-- get_webhook_event_stats(INTEGER)
-- get_failed_webhook_events(INTEGER)
-- is_duplicate_webhook_event(TEXT, TEXT, INTEGER)

-- Note: Event data cannot be recovered without a backup
*/
