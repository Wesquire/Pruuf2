/**
 * Migration: Idempotency Keys for Payment Operations
 * Prevents duplicate payment operations from network retries or user double-taps
 *
 * Date: 2025-11-20
 * Item: 12 - Backend API Enhancements
 */

-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request_hash TEXT NOT NULL,
  response_data JSONB NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add index on expires_at for efficient cleanup
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- Add comment explaining the table
COMMENT ON TABLE idempotency_keys IS 'Stores idempotency keys to prevent duplicate payment operations';

-- Add comments on columns
COMMENT ON COLUMN idempotency_keys.key IS 'Client-provided idempotency key (UUID recommended)';
COMMENT ON COLUMN idempotency_keys.request_hash IS 'SHA-256 hash of request body to detect changed requests with same key';
COMMENT ON COLUMN idempotency_keys.response_data IS 'Cached response to return for duplicate requests';
COMMENT ON COLUMN idempotency_keys.status_code IS 'HTTP status code of the cached response';
COMMENT ON COLUMN idempotency_keys.expires_at IS 'Keys expire after 24 hours';

-- Create function to clean up expired idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comment on the cleanup function
COMMENT ON FUNCTION cleanup_expired_idempotency_keys IS 'Removes expired idempotency keys older than 24 hours';
