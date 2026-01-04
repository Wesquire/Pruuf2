-- ============================================================================
-- PRUUF DATABASE COMPLETE RESET AND MIGRATION
-- ============================================================================
-- Generated: 2025-12-22
-- Purpose: Drop all existing tables and apply fresh schema from migrations
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ivnstzpolgjzfqduhlvw
-- 2. Navigate to SQL Editor
-- 3. Paste this entire file and click "Run"
-- 4. Verify no errors
-- ============================================================================

-- ============================================================================
-- PART 0: DROP ALL EXISTING TABLES AND OBJECTS
-- ============================================================================

-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop all existing tables (CASCADE to handle dependencies)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS member_contacts CASCADE;
DROP TABLE IF EXISTS ops_log CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS member_reminders CASCADE;
DROP TABLE IF EXISTS contact_invites CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Drop any functions that may exist from old schema
DROP FUNCTION IF EXISTS cleanup_old_ops_logs() CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ============================================================================
-- MIGRATION 001: INITIAL SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (both Members and Contacts)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  account_status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (
    account_status IN ('trial', 'active', 'active_free', 'frozen', 'past_due', 'canceled', 'deleted', 'pending_invitation')
  ),
  is_member BOOLEAN DEFAULT FALSE,
  grandfathered_free BOOLEAN DEFAULT FALSE,
  font_size_preference VARCHAR(20) DEFAULT 'standard' CHECK (
    font_size_preference IN ('standard', 'large', 'extra_large')
  ),
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  -- RevenueCat fields (replacing Stripe)
  revenuecat_customer_id VARCHAR(255),
  revenuecat_subscription_id VARCHAR(255),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Members table (elderly users being monitored)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  check_in_time TIME,
  timezone VARCHAR(50),
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_minutes_before INT DEFAULT 15 CHECK (
    reminder_minutes_before IN (15, 30, 60)
  ),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member-Contact relationships
CREATE TABLE member_contact_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'removed', 'expired')
  ),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  last_invite_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,
  invite_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, contact_id)
);

-- Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timezone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missed check-in alerts
CREATE TABLE missed_check_in_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacts_notified INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification codes
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push notification tokens
CREATE TABLE push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(10) CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- In-app notifications
CREATE TABLE app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_revenuecat_customer ON users(revenuecat_customer_id) WHERE revenuecat_customer_id IS NOT NULL;
CREATE INDEX idx_users_revenuecat_subscription ON users(revenuecat_subscription_id) WHERE revenuecat_subscription_id IS NOT NULL;
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_trial_end ON users(trial_end_date) WHERE account_status = 'trial';
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create indexes for members
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_check_in_time ON members(check_in_time);
CREATE INDEX idx_members_created_at ON members(created_at DESC);

-- Create indexes for relationships
CREATE INDEX idx_relationships_member ON member_contact_relationships(member_id);
CREATE INDEX idx_relationships_contact ON member_contact_relationships(contact_id);
CREATE INDEX idx_relationships_status ON member_contact_relationships(status);
CREATE INDEX idx_relationships_invite_code ON member_contact_relationships(invite_code);
CREATE INDEX idx_relationships_expires ON member_contact_relationships(invite_expires_at) WHERE status = 'pending' AND invite_expires_at IS NOT NULL;

-- Create indexes for check_ins
CREATE INDEX idx_checkins_member ON check_ins(member_id);
CREATE INDEX idx_checkins_date ON check_ins(checked_in_at);
CREATE INDEX idx_checkins_member_date ON check_ins(member_id, checked_in_at DESC);

-- Create indexes for alerts
CREATE INDEX idx_alerts_member ON missed_check_in_alerts(member_id);
CREATE INDEX idx_alerts_sent_at ON missed_check_in_alerts(sent_at);

-- Create indexes for verification codes
CREATE INDEX idx_verification_phone ON verification_codes(phone);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);
CREATE INDEX idx_verification_codes_phone_expires ON verification_codes(phone, expires_at DESC);

-- Create indexes for push tokens
CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);

-- Create indexes for app notifications
CREATE INDEX idx_app_notif_user ON app_notifications(user_id);
CREATE INDEX idx_app_notif_unread ON app_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_app_notif_created ON app_notifications(created_at DESC);

-- Function: Generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS VARCHAR AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Check if code exists (very unlikely)
  IF EXISTS (SELECT 1 FROM member_contact_relationships WHERE invite_code = code) THEN
    RETURN generate_invite_code(); -- Recursive retry
  END IF;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Update is_member status when relationship changes
CREATE OR REPLACE FUNCTION update_is_member_status() RETURNS TRIGGER AS $$
BEGIN
  -- When relationship becomes active, set user as Member
  IF NEW.status = 'active' THEN
    UPDATE users SET
      is_member = TRUE,
      grandfathered_free = TRUE
    WHERE id = NEW.member_id;
  END IF;

  -- When last active relationship removed, unset is_member (but keep grandfathered)
  IF NEW.status = 'removed' OR TG_OP = 'DELETE' THEN
    UPDATE users SET is_member = FALSE
    WHERE id = COALESCE(NEW.member_id, OLD.member_id)
    AND NOT EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = COALESCE(NEW.member_id, OLD.member_id)
      AND status = 'active'
      AND id != COALESCE(NEW.id, OLD.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_is_member
AFTER INSERT OR UPDATE OR DELETE ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION update_is_member_status();

-- Function: Check if user requires payment
CREATE OR REPLACE FUNCTION requires_payment(user_uuid UUID) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  is_member_flag BOOLEAN;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;

  -- Never require payment if grandfathered
  IF user_record.grandfathered_free = TRUE THEN
    RETURN FALSE;
  END IF;

  -- Check if currently a Member
  SELECT EXISTS(
    SELECT 1 FROM member_contact_relationships
    WHERE member_id = user_uuid AND status = 'active'
  ) INTO is_member_flag;

  IF is_member_flag = TRUE THEN
    RETURN FALSE;
  END IF;

  -- User is Contact-only, check subscription
  IF user_record.revenuecat_subscription_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Has subscription, check status
  IF user_record.account_status IN ('active', 'active_free') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_notification_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 002: CRON JOB TRACKING TABLES
-- ============================================================================

-- Trial expiration warnings tracking
CREATE TABLE trial_expiration_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  days_before_expiration INT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trial_warnings_user ON trial_expiration_warnings(user_id);
CREATE INDEX idx_trial_warnings_sent_at ON trial_expiration_warnings(sent_at);
CREATE INDEX idx_trial_warnings_user_trial ON trial_expiration_warnings(user_id, trial_end_date);

-- Trial expirations tracking
CREATE TABLE trial_expirations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resulted_in_freeze BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trial_exp_user ON trial_expirations(user_id);
CREATE INDEX idx_trial_exp_processed ON trial_expirations(processed_at);

-- Grace period expirations tracking
CREATE TABLE grace_period_expirations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grace_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  grace_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  days_in_grace_period INT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grace_exp_user ON grace_period_expirations(user_id);
CREATE INDEX idx_grace_exp_processed ON grace_period_expirations(processed_at);

-- Reminder notifications tracking
CREATE TABLE reminder_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reminder_minutes_before INT NOT NULL,
  check_in_time TIME NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminder_notif_member ON reminder_notifications(member_id);
CREATE INDEX idx_reminder_notif_sent_at ON reminder_notifications(sent_at);
CREATE INDEX idx_reminder_notif_member_sent ON reminder_notifications(member_id, sent_at DESC);

COMMENT ON TABLE trial_expiration_warnings IS 'Tracks trial expiration warnings sent to users (3 days before expiration)';
COMMENT ON TABLE trial_expirations IS 'Tracks trial expirations processed by cron job';
COMMENT ON TABLE grace_period_expirations IS 'Tracks grace period expirations for past_due accounts (7 days)';
COMMENT ON TABLE reminder_notifications IS 'Tracks check-in reminder notifications sent to members';

-- ============================================================================
-- MIGRATION 004: IDEMPOTENCY KEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request_hash TEXT NOT NULL,
  response_data JSONB NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

COMMENT ON TABLE idempotency_keys IS 'Stores idempotency keys to prevent duplicate payment operations';

CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 005: RATE LIMITING
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id VARCHAR(255) PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_buckets_window_end ON rate_limit_buckets(window_end);

COMMENT ON TABLE rate_limit_buckets IS 'Stores rate limit buckets using sliding window algorithm';

CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_buckets
  WHERE window_end < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 006: AUDIT LOGGING
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  event_status VARCHAR(20) NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_event_category CHECK (event_category IN ('auth', 'account', 'payment', 'security', 'admin')),
  CONSTRAINT valid_event_status CHECK (event_status IN ('success', 'failure', 'warning', 'info'))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_ip_created ON audit_logs(ip_address, created_at DESC);
CREATE INDEX idx_audit_logs_category_status_created ON audit_logs(event_category, event_status, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Audit trail for security-critical events and user actions';

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_audit_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  event_category VARCHAR(50),
  event_status VARCHAR(20),
  event_count BIGINT,
  last_event TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.event_category,
    al.event_status,
    COUNT(*) as event_count,
    MAX(al.created_at) as last_event
  FROM audit_logs al
  WHERE al.user_id = p_user_id
    AND al.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY al.event_category, al.event_status
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION detect_suspicious_activity(p_ip_address INET, p_minutes INTEGER DEFAULT 60)
RETURNS TABLE (
  event_type VARCHAR(100),
  failure_count BIGINT,
  first_failure TIMESTAMP WITH TIME ZONE,
  last_failure TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.event_type,
    COUNT(*) as failure_count,
    MIN(al.created_at) as first_failure,
    MAX(al.created_at) as last_failure
  FROM audit_logs al
  WHERE al.ip_address = p_ip_address
    AND al.event_status = 'failure'
    AND al.created_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
  GROUP BY al.event_type
  HAVING COUNT(*) >= 3
  ORDER BY failure_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 008: DATA RETENTION CLEANUP
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_deleted_users()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION archive_old_check_ins()
RETURNS TABLE(archived_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM check_ins
  WHERE checked_in_at < NOW() - INTERVAL '2 years';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_verification_codes()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM idempotency_keys
  WHERE created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM rate_limit_buckets
  WHERE window_end < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION run_data_retention_cleanup()
RETURNS TABLE(
  task VARCHAR,
  records_processed INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY SELECT 'deleted_users'::VARCHAR, deleted_count, NOW() AS executed_at FROM cleanup_deleted_users();
  RETURN QUERY SELECT 'old_check_ins'::VARCHAR, archived_count, NOW() AS executed_at FROM archive_old_check_ins();
  RETURN QUERY SELECT 'verification_codes'::VARCHAR, deleted_count, NOW() AS executed_at FROM cleanup_verification_codes();
  RETURN QUERY SELECT 'idempotency_keys'::VARCHAR, deleted_count, NOW() AS executed_at FROM cleanup_idempotency_keys();
  RETURN QUERY SELECT 'rate_limit_buckets'::VARCHAR, deleted_count, NOW() AS executed_at FROM cleanup_rate_limit_buckets();
  RETURN QUERY SELECT 'audit_logs'::VARCHAR, deleted_count, NOW() AS executed_at FROM cleanup_audit_logs();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS cleanup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task VARCHAR(100) NOT NULL,
  records_processed INTEGER NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleanup_logs_executed_at ON cleanup_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_task ON cleanup_logs(task);

CREATE OR REPLACE FUNCTION log_cleanup_execution(
  p_task VARCHAR,
  p_records_processed INTEGER,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO cleanup_logs (task, records_processed, executed_at, execution_time_ms, success, error_message)
  VALUES (p_task, p_records_processed, NOW(), p_execution_time_ms, p_success, p_error_message)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION 009: SESSION MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by VARCHAR(50),
  revoked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON user_sessions(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON user_sessions(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(user_id, last_active_at DESC) WHERE revoked_at IS NULL;

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can revoke own sessions" ON user_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to sessions" ON user_sessions FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token VARCHAR,
  p_device_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_expires_in_seconds INTEGER DEFAULT 2592000
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  expires_time TIMESTAMP WITH TIME ZONE;
BEGIN
  expires_time := NOW() + (p_expires_in_seconds || ' seconds')::INTERVAL;
  INSERT INTO user_sessions (user_id, session_token, device_info, ip_address, user_agent, expires_at)
  VALUES (p_user_id, p_session_token, p_device_info, p_ip_address, p_user_agent, expires_time)
  RETURNING id INTO session_id;
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_session_activity(p_session_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE user_sessions SET last_active_at = NOW()
  WHERE session_token = p_session_token AND revoked_at IS NULL AND expires_at > NOW();
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_session(
  p_session_id UUID,
  p_user_id UUID,
  p_revoked_by VARCHAR DEFAULT 'user',
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  revoked BOOLEAN;
BEGIN
  UPDATE user_sessions SET revoked_at = NOW(), revoked_by = p_revoked_by, revoked_reason = p_reason
  WHERE id = p_session_id AND user_id = p_user_id AND revoked_at IS NULL;
  GET DIAGNOSTICS revoked = ROW_COUNT;
  RETURN revoked > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_all_user_sessions(
  p_user_id UUID,
  p_except_session_id UUID DEFAULT NULL,
  p_revoked_by VARCHAR DEFAULT 'user',
  p_reason TEXT DEFAULT 'Logout from all devices'
)
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE user_sessions SET revoked_at = NOW(), revoked_by = p_revoked_by, revoked_reason = p_reason
  WHERE user_id = p_user_id AND revoked_at IS NULL AND (p_except_session_id IS NULL OR id != p_except_session_id);
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.device_info, s.ip_address, s.user_agent, s.last_active_at, s.created_at,
    (s.session_token = current_setting('request.jwt.claim.session_token', TRUE))::BOOLEAN as is_current
  FROM user_sessions s
  WHERE s.user_id = p_user_id AND s.revoked_at IS NULL AND s.expires_at > NOW()
  ORDER BY s.last_active_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE(cleaned_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  UPDATE user_sessions SET revoked_at = NOW(), revoked_by = 'system', revoked_reason = 'Session expired'
  WHERE revoked_at IS NULL AND expires_at <= NOW();
  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION 010: PII ENCRYPTION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  key_value BYTEA NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only access to encryption_keys" ON encryption_keys FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE OR REPLACE FUNCTION encrypt_phone(phone_number TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  IF phone_number IS NULL OR phone_number = '' THEN RETURN NULL; END IF;
  RETURN pgp_sym_encrypt(phone_number, encryption_key, 'cipher-algo=aes256, compress-algo=0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

CREATE OR REPLACE FUNCTION decrypt_phone(encrypted_phone BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF encrypted_phone IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(encrypted_phone, encryption_key, 'cipher-algo=aes256, compress-algo=0');
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Phone decryption failed: %', SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

CREATE OR REPLACE FUNCTION phone_search_hash(phone_number TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone_number IS NULL OR phone_number = '' THEN RETURN NULL; END IF;
  RETURN encode(hmac(phone_number, encryption_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash) WHERE phone_hash IS NOT NULL;

ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA;
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_members_phone_hash ON members(phone_hash) WHERE phone_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(current_setting('app.encryption_key', TRUE), 'CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION encrypt_and_hash_phone(
  phone_number TEXT,
  OUT encrypted_phone BYTEA,
  OUT phone_hash VARCHAR
) AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := get_encryption_key();
  encrypted_phone := encrypt_phone(phone_number, encryption_key);
  phone_hash := phone_search_hash(phone_number, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS encryption_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  performed_by VARCHAR(100),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encryption_audit_performed_at ON encryption_audit_log(performed_at DESC);

ALTER TABLE encryption_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only access to encryption_audit_log" ON encryption_audit_log FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- MIGRATION 003 + 011: ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_check_in_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own record" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role full access to users" ON users FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Members table policies
CREATE POLICY "Users can view own member profile" ON members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own member profile" ON members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Contacts can view their members" ON members FOR SELECT USING (
  EXISTS (SELECT 1 FROM member_contact_relationships WHERE member_contact_relationships.member_id = members.user_id AND member_contact_relationships.contact_id = auth.uid() AND member_contact_relationships.status = 'active')
);
CREATE POLICY "Service role full access to members" ON members FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "members_insert_own" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Member-Contact Relationships table policies
CREATE POLICY "Users can view own relationships" ON member_contact_relationships FOR SELECT USING (auth.uid() = member_id OR auth.uid() = contact_id);
CREATE POLICY "Contacts can create invitations" ON member_contact_relationships FOR INSERT WITH CHECK (auth.uid() = contact_id);
CREATE POLICY "Users can update own relationships" ON member_contact_relationships FOR UPDATE USING (auth.uid() = member_id OR auth.uid() = contact_id) WITH CHECK (auth.uid() = member_id OR auth.uid() = contact_id);
CREATE POLICY "Service role full access to relationships" ON member_contact_relationships FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "relationships_delete_own" ON member_contact_relationships FOR DELETE USING (auth.uid() = member_id OR auth.uid() = contact_id);

-- Check-ins table policies
CREATE POLICY "Members can create own check-ins" ON check_ins FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "Members can view own check-ins" ON check_ins FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Contacts can view members check-ins" ON check_ins FOR SELECT USING (
  EXISTS (SELECT 1 FROM member_contact_relationships mcr WHERE mcr.contact_id = auth.uid() AND mcr.member_id = check_ins.member_id AND mcr.status = 'active')
);
CREATE POLICY "Service role full access to check_ins" ON check_ins FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Missed check-in alerts table policies
CREATE POLICY "Service role full access to alerts" ON missed_check_in_alerts FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "alerts_select_contacts" ON missed_check_in_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM member_contact_relationships WHERE member_id = missed_check_in_alerts.member_id AND contact_id = auth.uid() AND status = 'active')
);

-- Verification codes table policies
CREATE POLICY "Service role full access to verification_codes" ON verification_codes FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Push notification tokens table policies
CREATE POLICY "Users can view own push tokens" ON push_notification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push tokens" ON push_notification_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own push tokens" ON push_notification_tokens FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "push_tokens_update_own" ON push_notification_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to push_tokens" ON push_notification_tokens FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- App notifications table policies
CREATE POLICY "Users can view own notifications" ON app_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON app_notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to app_notifications" ON app_notifications FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Audit logs table policies
CREATE POLICY "Service role full access to audit_logs" ON audit_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- MIGRATION 022: WEBHOOK EVENTS LOG
-- ============================================================================

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
    event_type IN ('INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_PAUSED', 'SUBSCRIPTION_EXTENDED', 'BILLING_ISSUE', 'PRODUCT_CHANGE', 'TRANSFER', 'EXPIRATION', 'TEST')
  )
);

CREATE INDEX idx_webhook_events_dedup ON webhook_events_log(event_id, event_type, created_at DESC);
CREATE INDEX idx_webhook_events_type_success ON webhook_events_log(event_type, success, created_at DESC);
CREATE INDEX idx_webhook_events_user ON webhook_events_log(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_webhook_events_failed ON webhook_events_log(created_at DESC) WHERE success = FALSE;
CREATE INDEX idx_webhook_events_window ON webhook_events_log(event_type, created_at DESC);

ALTER TABLE webhook_events_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_events_service_role ON webhook_events_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE OR REPLACE FUNCTION cleanup_webhook_events_log()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events_log WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  INSERT INTO audit_logs (user_id, event_type, event_category, event_status, event_data)
  VALUES (NULL, 'webhook_events_cleanup', 'admin', 'success', jsonb_build_object('deleted_count', deleted_count, 'retention_days', 90));
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_webhook_event_stats(since_hours INTEGER DEFAULT 24)
RETURNS TABLE (event_type TEXT, total_events BIGINT, successful_events BIGINT, failed_events BIGINT, success_rate NUMERIC, last_event_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT wel.event_type, COUNT(*) AS total_events, COUNT(*) FILTER (WHERE wel.success = TRUE) AS successful_events,
    COUNT(*) FILTER (WHERE wel.success = FALSE) AS failed_events,
    ROUND(COUNT(*) FILTER (WHERE wel.success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) AS success_rate,
    MAX(wel.created_at) AS last_event_at
  FROM webhook_events_log wel
  WHERE wel.created_at >= NOW() - MAKE_INTERVAL(hours => since_hours)
  GROUP BY wel.event_type ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_failed_webhook_events(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (id UUID, event_id TEXT, event_type TEXT, user_id UUID, error_message TEXT, created_at TIMESTAMPTZ, payload JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT wel.id, wel.event_id, wel.event_type, wel.user_id, wel.error_message, wel.created_at, wel.payload
  FROM webhook_events_log wel WHERE wel.success = FALSE ORDER BY wel.created_at DESC LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_duplicate_webhook_event(p_event_id TEXT, p_event_type TEXT, window_hours INTEGER DEFAULT 24)
RETURNS BOOLEAN AS $$
DECLARE
  event_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM webhook_events_log WHERE event_id = p_event_id AND event_type = p_event_type AND created_at >= NOW() - MAKE_INTERVAL(hours => window_hours)) INTO event_exists;
  RETURN event_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION 023: QA TEST HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = table_name;
  RETURN COALESCE(rls_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_index_exists(index_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  index_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name) INTO index_exists;
  RETURN index_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_indexes_exist(index_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  idx TEXT;
  all_exist BOOLEAN := TRUE;
BEGIN
  FOREACH idx IN ARRAY index_names LOOP
    IF NOT check_index_exists(idx) THEN all_exist := FALSE; EXIT; END IF;
  END LOOP;
  RETURN all_exist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_trigger_exists(trigger_name TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE t.tgname = trigger_name AND c.relname = table_name) INTO trigger_exists;
  RETURN trigger_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_constraint_exists(constraint_name TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = constraint_name AND table_name = table_name) INTO constraint_exists;
  IF NOT constraint_exists THEN
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = constraint_name AND tablename = table_name) INTO constraint_exists;
  END IF;
  RETURN constraint_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = function_name) INTO function_exists;
  RETURN function_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_index_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_indexes_exist(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_trigger_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_constraint_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_function_exists(TEXT) TO authenticated;

-- ============================================================================
-- MIGRATION 024: CONTACT LIMIT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_contact_count INT;
BEGIN
  SELECT COUNT(*) INTO active_contact_count FROM member_contact_relationships WHERE member_id = NEW.member_id AND status = 'active';
  IF NEW.status = 'active' THEN
    IF active_contact_count >= 10 THEN
      RAISE EXCEPTION 'Contact limit exceeded: Member already has 10 active Contacts (maximum allowed). Remove a Contact before adding another.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_contact_limit ON member_contact_relationships;
CREATE TRIGGER trigger_enforce_contact_limit BEFORE INSERT OR UPDATE ON member_contact_relationships FOR EACH ROW EXECUTE FUNCTION enforce_contact_limit();

CREATE OR REPLACE FUNCTION get_remaining_contact_slots(p_member_id UUID)
RETURNS INT AS $$
DECLARE
  active_count INT;
  remaining INT;
BEGIN
  SELECT COUNT(*) INTO active_count FROM member_contact_relationships WHERE member_id = p_member_id AND status = 'active';
  remaining := 10 - active_count;
  RETURN GREATEST(remaining, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_member_contacts_with_limit(p_member_id UUID)
RETURNS TABLE (contact_id UUID, contact_phone VARCHAR(20), relationship_status VARCHAR(20), connected_at TIMESTAMP WITH TIME ZONE, active_count INT, remaining_slots INT, at_limit BOOLEAN) AS $$
DECLARE
  v_active_count INT;
  v_remaining INT;
BEGIN
  SELECT COUNT(*) INTO v_active_count FROM member_contact_relationships WHERE member_id = p_member_id AND status = 'active';
  v_remaining := 10 - v_active_count;
  RETURN QUERY
  SELECT u.id AS contact_id, u.phone AS contact_phone, mcr.status AS relationship_status, mcr.connected_at, v_active_count AS active_count, v_remaining AS remaining_slots, (v_active_count >= 10) AS at_limit
  FROM member_contact_relationships mcr JOIN users u ON mcr.contact_id = u.id WHERE mcr.member_id = p_member_id ORDER BY mcr.connected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 025: EMAIL LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  postmark_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_postmark_id ON email_logs(postmark_message_id) WHERE postmark_message_id IS NOT NULL;

ALTER TABLE email_logs ADD CONSTRAINT check_to_email_format CHECK (to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE email_logs ADD CONSTRAINT check_from_email_format CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE email_logs ADD CONSTRAINT check_email_status CHECK (status IN ('sent', 'delivered', 'bounced', 'failed'));

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
  INSERT INTO email_logs (to_email, from_email, subject, body, type, status, postmark_message_id, error_message, sent_at)
  VALUES (p_to_email, p_from_email, p_subject, p_body, p_type, p_status, p_postmark_message_id, p_error_message, NOW())
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 026: EMAIL MIGRATION (ADD EMAIL FIELDS TO USERS)
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_email_verification_code ON users(email_verification_code) WHERE email_verification_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(LOWER(email)) WHERE email IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
    ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_verification_code_format') THEN
    ALTER TABLE users ADD CONSTRAINT check_email_verification_code_format CHECK (email_verification_code IS NULL OR email_verification_code ~* '^[A-Z0-9]{6}$');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_verified_requires_email') THEN
    ALTER TABLE users ADD CONSTRAINT check_email_verified_requires_email CHECK (email_verified = FALSE OR (email_verified = TRUE AND email IS NOT NULL));
  END IF;
END $$;

UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;
UPDATE users SET email_verification_code = NULL, email_verification_expires_at = NULL WHERE email_verification_code IS NOT NULL;

CREATE OR REPLACE FUNCTION generate_email_verification_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  WHILE EXISTS (SELECT 1 FROM users WHERE email_verification_code = code AND email_verification_expires_at > NOW()) LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_email_verification_code_valid(p_email VARCHAR(255), p_code VARCHAR(6))
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users
  WHERE LOWER(email) = LOWER(p_email) AND email_verification_code = UPPER(p_code) AND email_verification_expires_at > NOW() AND email_verified = FALSE;
  RETURN v_user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_email(p_email VARCHAR(255), p_code VARCHAR(6))
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), email_verification_code = NULL, email_verification_expires_at = NULL, updated_at = NOW()
  WHERE LOWER(email) = LOWER(p_email) AND email_verification_code = UPPER(p_code) AND email_verification_expires_at > NOW() AND email_verified = FALSE;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 027: INVITATION MAGIC LINKS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE member_contact_relationships SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND invite_expires_at IS NOT NULL AND invite_expires_at < NOW();
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows > 0 THEN
    INSERT INTO audit_logs (user_id, event_type, event_category, event_status, event_data, created_at)
    VALUES (NULL, 'expired_invitations_cleaned', 'admin', 'success', jsonb_build_object('count', affected_rows, 'cleaned_at', NOW()), NOW());
  END IF;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_invitation_valid(p_invite_code VARCHAR(10))
RETURNS BOOLEAN AS $$
DECLARE
  v_relationship RECORD;
BEGIN
  SELECT * INTO v_relationship FROM member_contact_relationships WHERE invite_code = p_invite_code;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_relationship.status != 'pending' THEN RETURN FALSE; END IF;
  IF v_relationship.invite_expires_at IS NOT NULL AND v_relationship.invite_expires_at < NOW() THEN RETURN FALSE; END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_invitation_details(p_invite_code VARCHAR(10))
RETURNS TABLE (relationship_id UUID, member_id UUID, member_email VARCHAR(255), contact_id UUID, contact_email VARCHAR(255), invited_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE, is_valid BOOLEAN, status VARCHAR(20)) AS $$
BEGIN
  RETURN QUERY
  SELECT mcr.id AS relationship_id, mcr.member_id, m.email AS member_email, mcr.contact_id, c.email AS contact_email,
    mcr.invited_at, mcr.invite_expires_at AS expires_at, is_invitation_valid(p_invite_code) AS is_valid, mcr.status
  FROM member_contact_relationships mcr JOIN users m ON mcr.member_id = m.id JOIN users c ON mcr.contact_id = c.id WHERE mcr.invite_code = p_invite_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 028: NOTIFICATION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  priority VARCHAR(20) DEFAULT 'normal',
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  failed_tokens TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_push_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_sent_at ON push_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_logs_priority ON push_notification_logs(priority);
CREATE INDEX IF NOT EXISTS idx_email_notif_logs_email ON email_notification_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_email_notif_logs_sent_at ON email_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notif_logs_type ON email_notification_logs(type);

ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;

CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID, p_days_back INT DEFAULT 30)
RETURNS TABLE (total_push_notifications INT, total_email_notifications INT, push_success_rate DECIMAL, critical_notifications INT, last_notification_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT pn.id)::INT AS total_push_notifications, COUNT(DISTINCT en.id)::INT AS total_email_notifications,
    CASE WHEN COUNT(DISTINCT pn.id) > 0 THEN (SUM(pn.sent_count)::DECIMAL / NULLIF(SUM(pn.sent_count + pn.failed_count), 0)) * 100 ELSE 0 END AS push_success_rate,
    COUNT(DISTINCT CASE WHEN pn.priority = 'critical' THEN pn.id END)::INT AS critical_notifications,
    GREATEST(MAX(pn.sent_at), MAX(en.sent_at)) AS last_notification_at
  FROM push_notification_logs pn
  LEFT JOIN email_notification_logs en ON en.user_email = (SELECT email FROM users WHERE id = p_user_id)
  WHERE pn.user_id = p_user_id AND pn.sent_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND (en.sent_at IS NULL OR en.sent_at >= NOW() - INTERVAL '1 day' * p_days_back);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS TABLE (push_logs_deleted INT, email_logs_deleted INT) AS $$
DECLARE
  push_deleted INT;
  email_deleted INT;
BEGIN
  DELETE FROM push_notification_logs WHERE sent_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS push_deleted = ROW_COUNT;
  DELETE FROM email_notification_logs WHERE sent_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS email_deleted = ROW_COUNT;
  IF push_deleted > 0 OR email_deleted > 0 THEN
    INSERT INTO audit_logs (user_id, event_type, event_category, event_status, event_data, created_at)
    VALUES (NULL, 'notification_logs_cleaned', 'admin', 'success', jsonb_build_object('push_logs_deleted', push_deleted, 'email_logs_deleted', email_deleted, 'cleaned_at', NOW()), NOW());
  END IF;
  RETURN QUERY SELECT push_deleted, email_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LOG MIGRATION COMPLETION
-- ============================================================================

INSERT INTO audit_logs (user_id, event_type, event_category, event_status, event_data, created_at)
VALUES (NULL, 'database_migration', 'admin', 'success', jsonb_build_object(
  'migration', 'complete_database_reset',
  'date', '2025-12-22',
  'description', 'Full database reset and migration from old schema',
  'tables_created', ARRAY[
    'users', 'members', 'member_contact_relationships', 'check_ins', 'missed_check_in_alerts',
    'verification_codes', 'push_notification_tokens', 'app_notifications', 'audit_logs',
    'trial_expiration_warnings', 'trial_expirations', 'grace_period_expirations', 'reminder_notifications',
    'idempotency_keys', 'rate_limit_buckets', 'cleanup_logs', 'user_sessions', 'encryption_keys',
    'encryption_audit_log', 'webhook_events_log', 'email_logs', 'push_notification_logs', 'email_notification_logs'
  ]
), NOW());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'Migration failed: users table not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
    RAISE EXCEPTION 'Migration failed: members table not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'check_ins') THEN
    RAISE EXCEPTION 'Migration failed: check_ins table not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    RAISE EXCEPTION 'Migration failed: email_logs table not created';
  END IF;
  RAISE NOTICE 'Migration completed successfully! All tables created.';
END $$;
