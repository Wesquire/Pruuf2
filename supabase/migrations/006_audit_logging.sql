/**
 * Migration: 006_audit_logging.sql
 * Purpose: Create audit logging table for tracking security-critical events
 * Priority: HIGH
 *
 * Tracks:
 * - Authentication events (login, logout, failed attempts)
 * - Account changes (PIN change, profile update, deletion)
 * - Payment operations (subscription create/update/cancel)
 * - Security events (rate limit violations, suspicious activity)
 */

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous/deleted user
  event_type VARCHAR(100) NOT NULL, -- e.g., 'login', 'pin_change', 'subscription_create'
  event_category VARCHAR(50) NOT NULL, -- 'auth', 'account', 'payment', 'security'
  event_status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'warning'
  event_data JSONB, -- Additional event-specific data
  ip_address INET, -- Client IP address
  user_agent TEXT, -- Browser/device information
  request_id VARCHAR(100), -- For request tracing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT valid_event_category CHECK (event_category IN ('auth', 'account', 'payment', 'security', 'admin')),
  CONSTRAINT valid_event_status CHECK (event_status IN ('success', 'failure', 'warning', 'info'))
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- Index for security monitoring (find patterns)
CREATE INDEX idx_audit_logs_ip_created ON audit_logs(ip_address, created_at DESC);

-- Composite index for common query patterns
CREATE INDEX idx_audit_logs_category_status_created
  ON audit_logs(event_category, event_status, created_at DESC);

-- Comment on table
COMMENT ON TABLE audit_logs IS 'Audit trail for security-critical events and user actions';

-- Comment on columns
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL if anonymous or deleted)';
COMMENT ON COLUMN audit_logs.event_type IS 'Specific event type (e.g., login, pin_change)';
COMMENT ON COLUMN audit_logs.event_category IS 'High-level category: auth, account, payment, security, admin';
COMMENT ON COLUMN audit_logs.event_status IS 'Event outcome: success, failure, warning, info';
COMMENT ON COLUMN audit_logs.event_data IS 'Additional event-specific data (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/device user agent string';
COMMENT ON COLUMN audit_logs.request_id IS 'Request ID for distributed tracing';

-- Function to cleanup old audit logs (keep last 90 days)
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

COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Delete audit logs older than 90 days (call via cron)';

-- Function to get audit summary for a user
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

COMMENT ON FUNCTION get_user_audit_summary(UUID, INTEGER) IS 'Get audit event summary for a user';

-- Function to detect suspicious activity
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

COMMENT ON FUNCTION detect_suspicious_activity(INET, INTEGER) IS 'Detect IPs with multiple failures in time window';
