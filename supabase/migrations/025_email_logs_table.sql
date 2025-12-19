-- Migration: Email Logs Table
-- Date: 2025-12-07
-- Purpose: Replace sms_logs table with email_logs for tracking email delivery
-- Related: ARCHITECTURE_DECISION.md - Push + Email Hybrid

-- ============================================================================
-- PART 1: DROP OLD SMS_LOGS TABLE (if exists)
-- ============================================================================

DROP TABLE IF EXISTS sms_logs CASCADE;

-- ============================================================================
-- PART 2: CREATE EMAIL_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
    -- Values: 'verification_code', 'member_invitation', 'check_in_confirmation',
    --         'missed_check_in', 'late_check_in', 'check_in_time_changed',
    --         'payment_failure', 'trial_expiration', 'account_frozen'
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
    -- Values: 'sent', 'delivered', 'bounced', 'failed'
  postmark_message_id VARCHAR(255),
    -- Postmark's MessageID for tracking
  error_message TEXT,
    -- Error details if failed
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
    -- When Postmark confirmed delivery
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on recipient email for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email
ON email_logs(to_email);

-- Index on email type for analytics
CREATE INDEX IF NOT EXISTS idx_email_logs_type
ON email_logs(type);

-- Index on status for monitoring delivery rates
CREATE INDEX IF NOT EXISTS idx_email_logs_status
ON email_logs(status);

-- Index on sent date for cleanup and analytics
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
ON email_logs(sent_at DESC);

-- Index on Postmark message ID for webhook lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_postmark_id
ON email_logs(postmark_message_id)
WHERE postmark_message_id IS NOT NULL;

-- ============================================================================
-- PART 4: ADD CONSTRAINTS
-- ============================================================================

-- Email format validation
ALTER TABLE email_logs
ADD CONSTRAINT check_to_email_format
CHECK (to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE email_logs
ADD CONSTRAINT check_from_email_format
CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Status must be valid
ALTER TABLE email_logs
ADD CONSTRAINT check_email_status
CHECK (status IN ('sent', 'delivered', 'bounced', 'failed'));

-- ============================================================================
-- PART 5: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE email_logs IS 'Complete log of all emails sent via Postmark. Replaces sms_logs table.';

COMMENT ON COLUMN email_logs.to_email IS 'Recipient email address';
COMMENT ON COLUMN email_logs.from_email IS 'Sender email address (typically noreply@pruuf.me)';
COMMENT ON COLUMN email_logs.subject IS 'Email subject line';
COMMENT ON COLUMN email_logs.body IS 'Email HTML body content';
COMMENT ON COLUMN email_logs.type IS 'Email type for categorization (verification_code, member_invitation, etc.)';
COMMENT ON COLUMN email_logs.status IS 'Delivery status (sent, delivered, bounced, failed)';
COMMENT ON COLUMN email_logs.postmark_message_id IS 'Postmark MessageID for tracking webhooks';
COMMENT ON COLUMN email_logs.error_message IS 'Error details if email failed to send or bounced';
COMMENT ON COLUMN email_logs.sent_at IS 'When email was sent via Postmark API';
COMMENT ON COLUMN email_logs.delivered_at IS 'When Postmark confirmed delivery via webhook';

-- ============================================================================
-- PART 6: CREATE HELPER FUNCTION TO LOG EMAILS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_email(
  p_to_email VARCHAR(255),
  p_from_email VARCHAR(255),
  p_subject VARCHAR(500),
  p_body TEXT,
  p_type VARCHAR(50),
  p_status VARCHAR(20),
  p_postmark_message_id VARCHAR(255) DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO email_logs (
    to_email,
    from_email,
    subject,
    body,
    type,
    status,
    postmark_message_id,
    error_message,
    sent_at
  ) VALUES (
    p_to_email,
    p_from_email,
    p_subject,
    p_body,
    p_type,
    p_status,
    p_postmark_message_id,
    p_error_message,
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_email IS 'Helper function to log email sends. Called from Supabase Edge Functions.';

-- ============================================================================
-- PART 7: LOG MIGRATION IN AUDIT TABLE
-- ============================================================================

INSERT INTO audit_logs (
  user_id,
  event_type,
  event_category,
  event_status,
  event_data,
  created_at
) VALUES (
  NULL,
  'database_migration',
  'admin',
  'success',
  jsonb_build_object(
    'migration', 'email_logs_table',
    'date', '2025-12-07',
    'description', 'Replaced sms_logs with email_logs table for Postmark email tracking',
    'table_dropped', 'sms_logs',
    'table_created', 'email_logs'
  ),
  NOW()
);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify table was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'email_logs'
  ) THEN
    RAISE EXCEPTION 'Migration failed: email_logs table not created';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'sms_logs'
  ) THEN
    RAISE WARNING 'sms_logs table still exists (expected if migration run before)';
  END IF;

  RAISE NOTICE 'Migration validation passed: email_logs table created successfully';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
To rollback this migration:

DROP TABLE IF EXISTS email_logs CASCADE;
DROP FUNCTION IF EXISTS log_email;

-- Recreate sms_logs if needed (see previous migration for schema)
*/
