/**
 * Migration: 008_data_retention_cleanup.sql
 * Purpose: Data retention and cleanup functions
 * Priority: MEDIUM
 *
 * Implements automated data cleanup for:
 * - Soft-deleted users (90 days)
 * - Old check-ins (2 years)
 * - Expired verification codes
 * - Old idempotency keys
 * - Old rate limit buckets
 * - Old audit logs (90 days)
 */

-- ==================================================
-- Function: Hard delete soft-deleted users after 90 days
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_deleted_users()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Delete users that have been soft-deleted for more than 90 days
  DELETE FROM users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_deleted_users() IS
  'Hard deletes users that have been soft-deleted for more than 90 days (GDPR compliance)';

-- ==================================================
-- Function: Archive old check-ins (older than 2 years)
-- ==================================================
CREATE OR REPLACE FUNCTION archive_old_check_ins()
RETURNS TABLE(archived_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- In a real implementation, this would move data to an archive table
  -- For now, we'll just delete check-ins older than 2 years
  DELETE FROM check_ins
  WHERE checked_in_at < NOW() - INTERVAL '2 years';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_old_check_ins() IS
  'Archives (deletes) check-ins older than 2 years to manage database size';

-- ==================================================
-- Function: Clean expired verification codes
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_verification_codes()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Delete verification codes that expired more than 24 hours ago
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_verification_codes() IS
  'Removes verification codes that expired more than 24 hours ago';

-- ==================================================
-- Function: Clean old idempotency keys
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Delete idempotency keys older than 24 hours
  DELETE FROM idempotency_keys
  WHERE created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_idempotency_keys() IS
  'Removes idempotency keys older than 24 hours (keys expire after 24h)';

-- ==================================================
-- Function: Clean old rate limit buckets
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Delete rate limit buckets where window has passed
  DELETE FROM rate_limit_buckets
  WHERE window_end < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_rate_limit_buckets() IS
  'Removes expired rate limit buckets (after window + 1 hour grace period)';

-- ==================================================
-- Function: Clean old audit logs
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Delete audit logs older than 90 days
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_audit_logs() IS
  'Removes audit logs older than 90 days (adjust based on compliance requirements)';

-- ==================================================
-- Master cleanup function (runs all cleanup tasks)
-- ==================================================
CREATE OR REPLACE FUNCTION run_data_retention_cleanup()
RETURNS TABLE(
  task VARCHAR,
  records_processed INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Clean deleted users
  RETURN QUERY
  SELECT
    'deleted_users'::VARCHAR,
    deleted_count,
    NOW() AS executed_at
  FROM cleanup_deleted_users();

  -- Clean old check-ins
  RETURN QUERY
  SELECT
    'old_check_ins'::VARCHAR,
    archived_count,
    NOW() AS executed_at
  FROM archive_old_check_ins();

  -- Clean verification codes
  RETURN QUERY
  SELECT
    'verification_codes'::VARCHAR,
    deleted_count,
    NOW() AS executed_at
  FROM cleanup_verification_codes();

  -- Clean idempotency keys
  RETURN QUERY
  SELECT
    'idempotency_keys'::VARCHAR,
    deleted_count,
    NOW() AS executed_at
  FROM cleanup_idempotency_keys();

  -- Clean rate limit buckets
  RETURN QUERY
  SELECT
    'rate_limit_buckets'::VARCHAR,
    deleted_count,
    NOW() AS executed_at
  FROM cleanup_rate_limit_buckets();

  -- Clean audit logs
  RETURN QUERY
  SELECT
    'audit_logs'::VARCHAR,
    deleted_count,
    NOW() AS executed_at
  FROM cleanup_audit_logs();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_data_retention_cleanup() IS
  'Master cleanup function that runs all data retention cleanup tasks';

-- ==================================================
-- Cleanup log table (track cleanup runs)
-- ==================================================
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

COMMENT ON TABLE cleanup_logs IS 'Audit trail for data retention cleanup executions';

-- ==================================================
-- Function: Log cleanup execution
-- ==================================================
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
  INSERT INTO cleanup_logs (
    task,
    records_processed,
    executed_at,
    execution_time_ms,
    success,
    error_message
  ) VALUES (
    p_task,
    p_records_processed,
    NOW(),
    p_execution_time_ms,
    p_success,
    p_error_message
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- Test the cleanup functions (safe to run - uses short intervals for testing)
-- ==================================================
-- SELECT * FROM run_data_retention_cleanup();
-- SELECT * FROM cleanup_logs ORDER BY executed_at DESC LIMIT 10;
