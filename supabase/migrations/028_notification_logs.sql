/**
 * Migration: Notification Logging Tables
 * Date: 2025-12-07
 *
 * Purpose: Add logging tables for dual notification strategy
 * Tracks push notifications and email notifications separately
 */

-- Table for push notification logs
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  priority VARCHAR(20) DEFAULT 'normal',  -- 'critical', 'high', 'normal', 'low'
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  failed_tokens TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for email notification logs (different from email_logs which is for transactional emails)
CREATE TABLE IF NOT EXISTS email_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  postmark_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for push notification logs
CREATE INDEX IF NOT EXISTS idx_push_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_sent_at ON push_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_logs_priority ON push_notification_logs(priority);

-- Indexes for email notification logs
CREATE INDEX IF NOT EXISTS idx_email_notif_logs_email ON email_notification_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_email_notif_logs_sent_at ON email_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notif_logs_type ON email_notification_logs(type);

-- Comments for documentation
COMMENT ON TABLE push_notification_logs IS
'Logs all push notifications sent via FCM. Includes success/failure counts per user.';

COMMENT ON TABLE email_notification_logs IS
'Logs all email notifications sent as part of dual notification strategy. Separate from transactional email_logs table.';

COMMENT ON COLUMN push_notification_logs.priority IS
'Notification priority: critical (push+email), high (push+email fallback), normal (push only), low (push only batched)';

COMMENT ON COLUMN push_notification_logs.failed_tokens IS
'Array of FCM tokens that failed to receive the notification. Used for token cleanup.';

-- Function to get notification delivery statistics for a user
CREATE OR REPLACE FUNCTION get_notification_stats(
  p_user_id UUID,
  p_days_back INT DEFAULT 30
)
RETURNS TABLE (
  total_push_notifications INT,
  total_email_notifications INT,
  push_success_rate DECIMAL,
  critical_notifications INT,
  last_notification_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT pn.id)::INT AS total_push_notifications,
    COUNT(DISTINCT en.id)::INT AS total_email_notifications,
    CASE
      WHEN COUNT(DISTINCT pn.id) > 0 THEN
        (SUM(pn.sent_count)::DECIMAL / NULLIF(SUM(pn.sent_count + pn.failed_count), 0)) * 100
      ELSE 0
    END AS push_success_rate,
    COUNT(DISTINCT CASE WHEN pn.priority = 'critical' THEN pn.id END)::INT AS critical_notifications,
    GREATEST(MAX(pn.sent_at), MAX(en.sent_at)) AS last_notification_at
  FROM push_notification_logs pn
  LEFT JOIN email_notification_logs en ON en.user_email = (
    SELECT email FROM users WHERE id = p_user_id
  )
  WHERE pn.user_id = p_user_id
    AND pn.sent_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND (en.sent_at IS NULL OR en.sent_at >= NOW() - INTERVAL '1 day' * p_days_back);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notification logs (run via cron)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS TABLE (
  push_logs_deleted INT,
  email_logs_deleted INT
) AS $$
DECLARE
  push_deleted INT;
  email_deleted INT;
BEGIN
  -- Delete push logs older than 90 days
  DELETE FROM push_notification_logs
  WHERE sent_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS push_deleted = ROW_COUNT;

  -- Delete email notification logs older than 90 days
  DELETE FROM email_notification_logs
  WHERE sent_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS email_deleted = ROW_COUNT;

  -- Log cleanup action
  IF push_deleted > 0 OR email_deleted > 0 THEN
    INSERT INTO audit_logs (
      user_id,
      event_type,
      event_category,
      event_status,
      event_data,
      created_at
    )
    VALUES (
      NULL,
      'notification_logs_cleaned',
      'admin',
      'success',
      jsonb_build_object(
        'push_logs_deleted', push_deleted,
        'email_logs_deleted', email_deleted,
        'cleaned_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN QUERY SELECT push_deleted, email_deleted;
END;
$$ LANGUAGE plpgsql;

-- Add notification preference columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN users.push_notifications_enabled IS
'User preference for push notifications. If false, no push notifications sent (email fallback used for critical alerts).';

COMMENT ON COLUMN users.email_notifications_enabled IS
'User preference for email notifications. If false, no email notifications sent (push only, unless critical alert requires email).';

-- Audit log entry
INSERT INTO audit_logs (user_id, event_type, event_category, event_status, event_data, created_at)
VALUES (
  NULL,
  'migration_completed',
  'admin',
  'success',
  jsonb_build_object(
    'migration', '20251207_notification_logs',
    'changes', ARRAY[
      'Created push_notification_logs table',
      'Created email_notification_logs table',
      'Created get_notification_stats function',
      'Created cleanup_old_notification_logs function',
      'Added notification preference columns to users table'
    ]
  ),
  NOW()
);
