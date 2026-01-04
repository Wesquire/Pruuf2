-- Migration: Remove sms_logs table
-- Date: 2026-01-03
-- Reason: App no longer uses SMS (Phase 2 of Expo migration)
-- Reversible: Yes (see rollback section at bottom)
-- Note: This table was already dropped in migration 025_email_logs_table.sql
--       This migration exists for completeness of the Expo migration plan

-- =============================================
-- STEP 1: Drop dependent indexes (if they still exist)
-- =============================================
DROP INDEX IF EXISTS idx_sms_to_phone;
DROP INDEX IF EXISTS idx_sms_type;
DROP INDEX IF EXISTS idx_sms_status;
DROP INDEX IF EXISTS idx_sms_sent_at;

-- =============================================
-- STEP 2: Drop the table (policies are dropped automatically with CASCADE)
-- =============================================
-- Note: Cannot use DROP POLICY IF EXISTS on a table that may not exist
-- The table was already dropped in migration 025, but we use IF EXISTS for safety
DROP TABLE IF EXISTS sms_logs CASCADE;

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration, recreate the original table from migration 001:

CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  twilio_sid VARCHAR(50),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sms_to_phone ON sms_logs(to_phone);
CREATE INDEX idx_sms_type ON sms_logs(type);
CREATE INDEX idx_sms_status ON sms_logs(status);
CREATE INDEX idx_sms_sent_at ON sms_logs(sent_at DESC);

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to sms_logs"
  ON sms_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: Data cannot be recovered without a backup
*/
