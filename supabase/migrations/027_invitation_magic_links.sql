/**
 * Migration: Add Magic Link Support for Invitations
 * Date: 2025-12-07
 *
 * Purpose: Add invitation expiration and enhance member_contact_relationships
 * for email-based invitations with magic links
 */

-- Add invitation expiration to member_contact_relationships
ALTER TABLE member_contact_relationships
ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for expiration checks (performance optimization)
CREATE INDEX IF NOT EXISTS idx_relationships_expires
ON member_contact_relationships(invite_expires_at)
WHERE status = 'pending' AND invite_expires_at IS NOT NULL;

-- Add account_status value for pending invitations
-- (Users who have been invited but haven't accepted yet)
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE users
ADD CONSTRAINT users_account_status_check
CHECK (account_status IN (
  'trial',
  'active',
  'active_free',
  'frozen',
  'past_due',
  'canceled',
  'deleted',
  'pending_invitation'  -- NEW: User invited but hasn't accepted
));

-- Function to clean up expired invitations
-- Runs periodically (via cron job or manual trigger)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Update expired invitations to 'expired' status
  UPDATE member_contact_relationships
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND invite_expires_at IS NOT NULL
    AND invite_expires_at < NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Log cleanup action
  IF affected_rows > 0 THEN
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
      'expired_invitations_cleaned',
      'admin',
      'success',
      jsonb_build_object(
        'count', affected_rows,
        'cleaned_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to check if invitation is valid
-- Used by accept-invitation endpoint
CREATE OR REPLACE FUNCTION is_invitation_valid(
  p_invite_code VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_relationship RECORD;
BEGIN
  -- Get relationship by invite code
  SELECT *
  INTO v_relationship
  FROM member_contact_relationships
  WHERE invite_code = p_invite_code;

  -- Check if exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if pending
  IF v_relationship.status != 'pending' THEN
    RETURN FALSE;
  END IF;

  -- Check if expired
  IF v_relationship.invite_expires_at IS NOT NULL
     AND v_relationship.invite_expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get invitation details (for magic link deep linking)
-- Returns relationship + contact info for display in app
CREATE OR REPLACE FUNCTION get_invitation_details(
  p_invite_code VARCHAR(10)
)
RETURNS TABLE (
  relationship_id UUID,
  member_id UUID,
  member_email VARCHAR(255),
  contact_id UUID,
  contact_email VARCHAR(255),
  invited_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN,
  status VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcr.id AS relationship_id,
    mcr.member_id,
    m.email AS member_email,
    mcr.contact_id,
    c.email AS contact_email,
    mcr.invited_at,
    mcr.invite_expires_at AS expires_at,
    is_invitation_valid(p_invite_code) AS is_valid,
    mcr.status
  FROM member_contact_relationships mcr
  JOIN users m ON mcr.member_id = m.id
  JOIN users c ON mcr.contact_id = c.id
  WHERE mcr.invite_code = p_invite_code;
END;
$$ LANGUAGE plpgsql;

-- Add comment to invite_code column for documentation
COMMENT ON COLUMN member_contact_relationships.invite_code IS
'6-character alphanumeric invitation code (no confusing O,0,I,1). Used for both manual entry and magic link generation.';

COMMENT ON COLUMN member_contact_relationships.invite_expires_at IS
'Invitation expiration timestamp. Typically set to 7 days from invited_at. NULL means no expiration.';

-- Add audit logging for invitation lifecycle
-- (Relationships already have created_at, updated_at)
-- Add specific event types:
INSERT INTO audit_logs (user_id, event_type, event_category, event_status, event_data, created_at)
VALUES (
  NULL,
  'migration_completed',
  'admin',
  'success',
  jsonb_build_object(
    'migration', '20251207_invitation_magic_links',
    'changes', ARRAY[
      'Added invite_expires_at to member_contact_relationships',
      'Added pending_invitation account status',
      'Created cleanup_expired_invitations function',
      'Created is_invitation_valid function',
      'Created get_invitation_details function'
    ]
  ),
  NOW()
);
