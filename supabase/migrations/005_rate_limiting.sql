/**
 * Migration: Rate Limiting Tables
 * Tracks API request counts to prevent abuse and control costs
 *
 * Date: 2025-11-20
 * Item: 13 - Backend API Enhancements
 */

-- Create rate_limit_buckets table to track request counts
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id VARCHAR(255) PRIMARY KEY,              -- Format: {identifier}:{endpoint}:{window}
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on window_end for efficient cleanup
CREATE INDEX idx_rate_limit_buckets_window_end ON rate_limit_buckets(window_end);

-- Add comment explaining the table
COMMENT ON TABLE rate_limit_buckets IS 'Stores rate limit buckets using sliding window algorithm';

-- Add comments on columns
COMMENT ON COLUMN rate_limit_buckets.id IS 'Composite key: {ip/user_id}:{endpoint_type}:{timestamp}';
COMMENT ON COLUMN rate_limit_buckets.request_count IS 'Number of requests in this time window';
COMMENT ON COLUMN rate_limit_buckets.window_start IS 'Start of the rate limit window';
COMMENT ON COLUMN rate_limit_buckets.window_end IS 'End of the rate limit window';

-- Create function to clean up expired rate limit buckets
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

-- Add comment on the cleanup function
COMMENT ON FUNCTION cleanup_expired_rate_limits IS 'Removes expired rate limit buckets older than 1 hour past their window';
