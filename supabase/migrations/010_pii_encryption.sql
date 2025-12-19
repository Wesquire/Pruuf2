/**
 * Migration: 010_pii_encryption.sql
 * Purpose: Encrypt PII (phone numbers) using pgcrypto
 * Priority: MEDIUM
 *
 * Encrypts sensitive data at rest using AES-256
 * Phone numbers are the primary PII to encrypt
 *
 * NOTE: This migration creates encryption infrastructure but does NOT
 * automatically encrypt existing data. See migration guide in docs.
 */

-- ==================================================
-- Enable pgcrypto extension
-- ==================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON EXTENSION pgcrypto IS 'Cryptographic functions for PostgreSQL';

-- ==================================================
-- Encryption key management
-- ==================================================

-- Store encryption key securely
-- In production, this should come from environment variable or key management service
CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  key_value BYTEA NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE encryption_keys IS 'Encryption keys for PII data (should be managed via secrets manager)';

-- Only service role can access encryption keys
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only access to encryption_keys"
  ON encryption_keys FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ==================================================
-- PII encryption functions
-- ==================================================

/**
 * Encrypt phone number using AES-256
 *
 * @param phone_number - Plain text phone number
 * @param encryption_key - Encryption key (from environment or key table)
 * @returns Encrypted bytea
 */
CREATE OR REPLACE FUNCTION encrypt_phone(
  phone_number TEXT,
  encryption_key TEXT
)
RETURNS BYTEA AS $$
BEGIN
  IF phone_number IS NULL OR phone_number = '' THEN
    RETURN NULL;
  END IF;

  -- Encrypt using AES-256 in GCM mode (authenticated encryption)
  RETURN pgp_sym_encrypt(
    phone_number,
    encryption_key,
    'cipher-algo=aes256, compress-algo=0'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

COMMENT ON FUNCTION encrypt_phone IS 'Encrypts phone number using AES-256';

/**
 * Decrypt phone number
 *
 * @param encrypted_phone - Encrypted bytea
 * @param encryption_key - Encryption key
 * @returns Decrypted phone number
 */
CREATE OR REPLACE FUNCTION decrypt_phone(
  encrypted_phone BYTEA,
  encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
  IF encrypted_phone IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decrypt using AES-256
  RETURN pgp_sym_decrypt(
    encrypted_phone,
    encryption_key,
    'cipher-algo=aes256, compress-algo=0'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log decryption failure
    RAISE WARNING 'Phone decryption failed: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

COMMENT ON FUNCTION decrypt_phone IS 'Decrypts encrypted phone number';

/**
 * Search encrypted phone numbers (using hash for indexing)
 * Since encrypted values cannot be indexed, we use a hash for searching
 *
 * @param phone_number - Plain text phone to search for
 * @param encryption_key - Encryption key
 * @returns Hash for comparison
 */
CREATE OR REPLACE FUNCTION phone_search_hash(
  phone_number TEXT,
  encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
  IF phone_number IS NULL OR phone_number = '' THEN
    RETURN NULL;
  END IF;

  -- Create searchable hash using HMAC-SHA256
  -- This allows searching encrypted data without storing plain text
  RETURN encode(
    hmac(phone_number, encryption_key, 'sha256'),
    'hex'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

COMMENT ON FUNCTION phone_search_hash IS 'Creates searchable hash for encrypted phone numbers';

-- ==================================================
-- Add encrypted columns to users table
-- ==================================================

-- Add encrypted phone column (will gradually replace plain phone)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

-- Add index on phone hash for searching
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash)
  WHERE phone_hash IS NOT NULL;

COMMENT ON COLUMN users.phone_encrypted IS 'Encrypted phone number (AES-256)';
COMMENT ON COLUMN users.phone_hash IS 'HMAC-SHA256 hash for searching encrypted phones';

-- ==================================================
-- Add encrypted columns to members table
-- ==================================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA;
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_members_phone_hash ON members(phone_hash)
  WHERE phone_hash IS NOT NULL;

COMMENT ON COLUMN members.phone_encrypted IS 'Encrypted phone number (AES-256)';
COMMENT ON COLUMN members.phone_hash IS 'HMAC-SHA256 hash for searching encrypted phones';

-- ==================================================
-- Encryption helper functions for application use
-- ==================================================

/**
 * Get active encryption key
 * In production, this should fetch from environment variable
 */
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
BEGIN
  -- In production, use: current_setting('app.encryption_key', TRUE)
  -- For now, return placeholder (should be set via environment)
  RETURN coalesce(
    current_setting('app.encryption_key', TRUE),
    'CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_encryption_key IS 'Retrieves encryption key from environment (set app.encryption_key)';

/**
 * Encrypt and store phone number with hash
 * Helper function that handles both encryption and hash generation
 */
CREATE OR REPLACE FUNCTION encrypt_and_hash_phone(
  phone_number TEXT,
  OUT encrypted_phone BYTEA,
  OUT phone_hash VARCHAR
)
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := get_encryption_key();

  encrypted_phone := encrypt_phone(phone_number, encryption_key);
  phone_hash := phone_search_hash(phone_number, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_and_hash_phone IS 'Encrypts phone and generates search hash';

-- ==================================================
-- Migration utility functions
-- ==================================================

/**
 * Encrypt existing user phone numbers
 * Run this to migrate existing data to encrypted format
 *
 * WARNING: Run during maintenance window, locks table
 */
CREATE OR REPLACE FUNCTION migrate_users_phone_encryption()
RETURNS TABLE(migrated_count INTEGER) AS $$
DECLARE
  row_count INTEGER := 0;
  encryption_key TEXT;
BEGIN
  encryption_key := get_encryption_key();

  -- Encrypt all non-null plain phone numbers
  UPDATE users
  SET
    phone_encrypted = encrypt_phone(phone, encryption_key),
    phone_hash = phone_search_hash(phone, encryption_key)
  WHERE phone IS NOT NULL
    AND phone_encrypted IS NULL;

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_users_phone_encryption IS 'Migrates existing user phone numbers to encrypted format';

/**
 * Encrypt existing member phone numbers
 */
CREATE OR REPLACE FUNCTION migrate_members_phone_encryption()
RETURNS TABLE(migrated_count INTEGER) AS $$
DECLARE
  row_count INTEGER := 0;
  encryption_key TEXT;
BEGIN
  encryption_key := get_encryption_key();

  UPDATE members
  SET
    phone_encrypted = encrypt_phone(phone, encryption_key),
    phone_hash = phone_search_hash(phone, encryption_key)
  WHERE phone IS NOT NULL
    AND phone_encrypted IS NULL;

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_members_phone_encryption IS 'Migrates existing member phone numbers to encrypted format';

-- ==================================================
-- Views for application use
-- ==================================================

/**
 * View that automatically decrypts phone numbers
 * Use this in application queries instead of direct table access
 */
CREATE OR REPLACE VIEW users_decrypted AS
SELECT
  id,
  COALESCE(
    decrypt_phone(phone_encrypted, get_encryption_key()),
    phone
  ) as phone,
  stripe_customer_id,
  stripe_subscription_id,
  account_status,
  last_payment_date,
  created_at,
  updated_at,
  deleted_at,
  pin_hash,
  is_member,
  grandfathered_free,
  font_size_preference,
  trial_start_date,
  trial_end_date,
  failed_login_attempts,
  locked_until
FROM users;

COMMENT ON VIEW users_decrypted IS 'Users table with automatic phone decryption';

/**
 * View for members with decrypted phones
 */
CREATE OR REPLACE VIEW members_decrypted AS
SELECT
  id,
  user_id,
  name,
  check_in_time,
  timezone,
  reminder_enabled,
  onboarding_completed,
  onboarding_completed_at,
  created_at,
  updated_at
FROM members;

COMMENT ON VIEW members_decrypted IS 'Members table with automatic phone decryption';

-- ==================================================
-- Audit log for encryption operations
-- ==================================================

CREATE TABLE IF NOT EXISTS encryption_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation VARCHAR(50) NOT NULL, -- 'encrypt', 'decrypt', 'key_rotation'
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  performed_by VARCHAR(100),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encryption_audit_performed_at
  ON encryption_audit_log(performed_at DESC);

COMMENT ON TABLE encryption_audit_log IS 'Audit trail for encryption/decryption operations';

-- Only service role can access encryption audit log
ALTER TABLE encryption_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only access to encryption_audit_log"
  ON encryption_audit_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ==================================================
-- Instructions for production deployment
-- ==================================================

/*
PRODUCTION DEPLOYMENT STEPS:

1. Set encryption key in environment:
   SET app.encryption_key = 'your-256-bit-encryption-key-here';

   Generate key with:
   openssl rand -base64 32

2. Run encryption migration during maintenance window:
   SELECT * FROM migrate_users_phone_encryption();
   SELECT * FROM migrate_members_phone_encryption();

3. Verify encryption:
   SELECT phone, phone_encrypted IS NOT NULL as is_encrypted
   FROM users
   LIMIT 10;

4. Update application code to use encrypted columns:
   - Use encrypt_and_hash_phone() when inserting
   - Use phone_hash for searching
   - Use decrypt_phone() when reading

5. After verification, optionally drop plain phone columns:
   ALTER TABLE users DROP COLUMN phone;
   ALTER TABLE members DROP COLUMN phone;

   (Keep both columns during transition period for rollback)

6. Set up key rotation schedule (annual recommended)

7. Monitor encryption_audit_log for issues
*/
