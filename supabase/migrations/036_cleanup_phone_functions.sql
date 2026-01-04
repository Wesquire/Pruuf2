-- Migration: Cleanup phone-related functions
-- Date: 2026-01-03
-- Reason: Remove functions that reference removed phone columns (Phase 8 cleanup)
-- Reversible: Yes (see rollback section at bottom)

-- =============================================
-- STEP 1: Drop views that use phone columns/functions first
-- =============================================
-- These views reference phone columns and encryption functions
DROP VIEW IF EXISTS users_decrypted;
DROP VIEW IF EXISTS members_decrypted;

-- =============================================
-- STEP 2: Drop phone encryption/decryption functions
-- =============================================
-- These functions were used for PII encryption of phone numbers
-- No longer needed since phone columns have been removed
-- Note: Using correct function signatures from migration 010_pii_encryption.sql

DROP FUNCTION IF EXISTS encrypt_phone(TEXT, TEXT);
DROP FUNCTION IF EXISTS decrypt_phone(BYTEA, TEXT);
DROP FUNCTION IF EXISTS phone_search_hash(TEXT, TEXT);
DROP FUNCTION IF EXISTS encrypt_and_hash_phone(TEXT);
DROP FUNCTION IF EXISTS get_encryption_key();

-- =============================================
-- STEP 3: Drop phone migration functions
-- =============================================
-- These functions were used for migrating phone data to encrypted format
-- No longer needed since phone data has been removed

DROP FUNCTION IF EXISTS migrate_users_phone_encryption();
DROP FUNCTION IF EXISTS migrate_members_phone_encryption();

-- =============================================
-- STEP 4: Drop/update functions that reference phone column
-- =============================================
-- get_member_contacts_with_limit references u.phone which no longer exists
-- Drop and recreate without phone reference

DROP FUNCTION IF EXISTS get_member_contacts_with_limit(UUID);

CREATE OR REPLACE FUNCTION get_member_contacts_with_limit(p_member_id UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_email VARCHAR,
  relationship_status VARCHAR,
  connected_at TIMESTAMPTZ,
  active_count BIGINT,
  remaining_slots BIGINT,
  at_limit BOOLEAN
) AS $$
DECLARE
  v_active_count BIGINT;
  v_remaining BIGINT;
BEGIN
  -- Count active contacts for this member
  SELECT COUNT(*) INTO v_active_count
  FROM member_contact_relationships
  WHERE member_id = p_member_id AND status = 'active';

  -- Calculate remaining slots (max 10)
  v_remaining := GREATEST(0, 10 - v_active_count);

  -- Return contacts with limit info
  RETURN QUERY
  SELECT
    u.id AS contact_id,
    u.email AS contact_email,
    mcr.status AS relationship_status,
    mcr.connected_at,
    v_active_count AS active_count,
    v_remaining AS remaining_slots,
    (v_active_count >= 10) AS at_limit
  FROM member_contact_relationships mcr
  JOIN users u ON mcr.contact_id = u.id
  WHERE mcr.member_id = p_member_id
  ORDER BY mcr.connected_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_contacts_with_limit IS 'Get contacts for a member with contact limit information (max 10 contacts)';

-- =============================================
-- STEP 5: Drop encryption infrastructure tables
-- =============================================
-- These tables were for phone encryption - no longer needed

DROP INDEX IF EXISTS idx_encryption_audit_performed_at;
DROP TABLE IF EXISTS encryption_audit_log;
DROP TABLE IF EXISTS encryption_keys;

-- =============================================
-- STEP 6: Drop phone-related columns and indexes from users/members
-- =============================================
-- These columns were added for phone encryption

DROP INDEX IF EXISTS idx_users_phone_hash;
DROP INDEX IF EXISTS idx_members_phone_hash;

ALTER TABLE users DROP COLUMN IF EXISTS phone_encrypted;
ALTER TABLE users DROP COLUMN IF EXISTS phone_hash;
ALTER TABLE members DROP COLUMN IF EXISTS phone_encrypted;
ALTER TABLE members DROP COLUMN IF EXISTS phone_hash;

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration, recreate all items from migration 010_pii_encryption.sql
-- Note: These functions would be non-functional without the phone columns

-- 1. Recreate encryption tables
CREATE TABLE encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  key_value BYTEA NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE encryption_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  performed_by VARCHAR(100),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encryption_audit_performed_at ON encryption_audit_log(performed_at DESC);

-- 2. Add phone columns back
ALTER TABLE users ADD COLUMN phone_encrypted BYTEA;
ALTER TABLE users ADD COLUMN phone_hash VARCHAR(64);
ALTER TABLE members ADD COLUMN phone_encrypted BYTEA;
ALTER TABLE members ADD COLUMN phone_hash VARCHAR(64);

CREATE INDEX idx_users_phone_hash ON users(phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX idx_members_phone_hash ON members(phone_hash) WHERE phone_hash IS NOT NULL;

-- 3. Recreate phone encryption functions (from migration 010)
-- See migration 010_pii_encryption.sql for full function definitions

-- 4. Recreate views
-- See migration 010_pii_encryption.sql for view definitions
*/
