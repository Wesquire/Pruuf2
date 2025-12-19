/**
 * Migration: 009_session_management.sql
 * Purpose: Session tracking and management
 * Priority: MEDIUM
 *
 * Enables users to:
 * - View active sessions
 * - See device information
 * - Remotely logout from devices
 * - Track session activity
 */

-- ==================================================
-- Sessions table
-- ==================================================
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
  revoked_by VARCHAR(50), -- 'user', 'admin', 'system', 'timeout'
  revoked_reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON user_sessions(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON user_sessions(revoked_at) WHERE revoked_at IS NOT NULL;

-- Partial index for active sessions (only check revoked_at, not expires_at due to immutability requirement)
CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON user_sessions(user_id, last_active_at DESC)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE user_sessions IS 'Tracks user login sessions across devices';
COMMENT ON COLUMN user_sessions.device_info IS 'JSON with device type, OS, app version';
COMMENT ON COLUMN user_sessions.revoked_at IS 'When session was manually revoked (logout)';
COMMENT ON COLUMN user_sessions.revoked_by IS 'Who/what revoked the session';

-- ==================================================
-- Enable RLS on sessions table
-- ==================================================
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can revoke (logout) their own sessions
CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role full access (for backend session creation)
CREATE POLICY "Service role full access to sessions"
  ON user_sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ==================================================
-- Function: Create new session
-- ==================================================
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token VARCHAR,
  p_device_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_expires_in_seconds INTEGER DEFAULT 2592000 -- 30 days default
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  expires_time TIMESTAMP WITH TIME ZONE;
BEGIN
  expires_time := NOW() + (p_expires_in_seconds || ' seconds')::INTERVAL;

  INSERT INTO user_sessions (
    user_id,
    session_token,
    device_info,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_user_id,
    p_session_token,
    p_device_info,
    p_ip_address,
    p_user_agent,
    expires_time
  )
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_user_session IS 'Creates a new user session record';

-- ==================================================
-- Function: Update session activity
-- ==================================================
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_token VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE user_sessions
  SET last_active_at = NOW()
  WHERE session_token = p_session_token
    AND revoked_at IS NULL
    AND expires_at > NOW();

  GET DIAGNOSTICS updated = ROW_COUNT;

  RETURN updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_session_activity IS 'Updates last_active_at for a session';

-- ==================================================
-- Function: Revoke session (logout)
-- ==================================================
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
  UPDATE user_sessions
  SET
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoked_reason = p_reason
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND revoked_at IS NULL;

  GET DIAGNOSTICS revoked = ROW_COUNT;

  RETURN revoked > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_session IS 'Revokes (logs out) a specific session';

-- ==================================================
-- Function: Revoke all sessions for user
-- ==================================================
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
  UPDATE user_sessions
  SET
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoked_reason = p_reason
  WHERE user_id = p_user_id
    AND revoked_at IS NULL
    AND (p_except_session_id IS NULL OR id != p_except_session_id);

  GET DIAGNOSTICS revoked_count = ROW_COUNT;

  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_all_user_sessions IS 'Revokes all sessions for a user, optionally keeping current session';

-- ==================================================
-- Function: Get active sessions for user
-- ==================================================
CREATE OR REPLACE FUNCTION get_active_sessions(
  p_user_id UUID
)
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
  SELECT
    s.id,
    s.device_info,
    s.ip_address,
    s.user_agent,
    s.last_active_at,
    s.created_at,
    (s.session_token = current_setting('request.jwt.claim.session_token', TRUE))::BOOLEAN as is_current
  FROM user_sessions s
  WHERE s.user_id = p_user_id
    AND s.revoked_at IS NULL
    AND s.expires_at > NOW()
  ORDER BY s.last_active_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_sessions IS 'Gets all active sessions for a user';

-- ==================================================
-- Function: Cleanup expired sessions
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE(cleaned_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Mark expired sessions as revoked
  UPDATE user_sessions
  SET
    revoked_at = NOW(),
    revoked_by = 'system',
    revoked_reason = 'Session expired'
  WHERE revoked_at IS NULL
    AND expires_at <= NOW();

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Marks expired sessions as revoked (run via cron)';

-- ==================================================
-- Function: Cleanup old revoked sessions
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Delete revoked sessions older than 90 days
  DELETE FROM user_sessions
  WHERE revoked_at IS NOT NULL
    AND revoked_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_sessions IS 'Deletes old revoked sessions (run via cron)';
