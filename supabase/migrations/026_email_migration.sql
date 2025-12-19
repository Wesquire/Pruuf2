-- Migration: Add Email Fields, Remove SMS Fields
-- Date: 2025-12-07
-- Purpose: Transition from SMS-based verification to email-based verification
-- Architecture: Push + Email Hybrid (see ARCHITECTURE_DECISION.md)

-- ============================================================================
-- PART 1: ADD EMAIL FIELDS
-- ============================================================================

-- Add email column (required for verification and critical alerts)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add email verification status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add email verification code (6 characters)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(10);

-- Add email verification code expiration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Add email verification timestamp (when user verified their email)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- PART 2: REMOVE SMS-RELATED FIELDS (if they exist)
-- ============================================================================

-- Remove phone verification status (phone is now just login ID, unverified)
ALTER TABLE users
DROP COLUMN IF EXISTS phone_verified;

-- Remove SMS verification code storage
ALTER TABLE users
DROP COLUMN IF EXISTS phone_verification_code;

-- Remove SMS verification expiration
ALTER TABLE users
DROP COLUMN IF EXISTS phone_verification_expires_at;

-- Remove phone verified timestamp
ALTER TABLE users
DROP COLUMN IF EXISTS phone_verified_at;

-- ============================================================================
-- PART 3: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on email for fast lookups during verification and login
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email)
WHERE email IS NOT NULL;

-- Index on email verification status for querying unverified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified
ON users(email_verified)
WHERE email_verified = FALSE;

-- Index on email verification code for fast code validation
CREATE INDEX IF NOT EXISTS idx_users_email_verification_code
ON users(email_verification_code)
WHERE email_verification_code IS NOT NULL;

-- ============================================================================
-- PART 4: ADD CONSTRAINTS
-- ============================================================================

-- Email must be unique (if provided)
-- Note: Allow NULL emails for members without email (Contact shares code manually)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users(LOWER(email))
WHERE email IS NOT NULL;

-- Email format validation (basic regex check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_email_format
    CHECK (
      email IS NULL
      OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );
  END IF;
END $$;

-- Verification code must be uppercase alphanumeric (if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_email_verification_code_format'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_email_verification_code_format
    CHECK (
      email_verification_code IS NULL
      OR email_verification_code ~* '^[A-Z0-9]{6}$'
    );
  END IF;
END $$;

-- If email_verified is TRUE, email must exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_email_verified_requires_email'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_email_verified_requires_email
    CHECK (
      email_verified = FALSE
      OR (email_verified = TRUE AND email IS NOT NULL)
    );
  END IF;
END $$;

-- ============================================================================
-- PART 5: UPDATE EXISTING DATA
-- ============================================================================

-- Set email_verified to FALSE for all existing users
UPDATE users
SET email_verified = FALSE
WHERE email_verified IS NULL;

-- Clear any old verification codes (fresh start)
UPDATE users
SET
  email_verification_code = NULL,
  email_verification_expires_at = NULL
WHERE email_verification_code IS NOT NULL;

-- ============================================================================
-- PART 6: ADD HELPER FUNCTIONS
-- ============================================================================

-- Function: Generate random 6-character email verification code
CREATE OR REPLACE FUNCTION generate_email_verification_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No confusing chars: O,0,I,1
  code VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Ensure uniqueness (very unlikely to collide with 32^6 = 1B+ combinations)
  WHILE EXISTS (
    SELECT 1 FROM users
    WHERE email_verification_code = code
    AND email_verification_expires_at > NOW()
  ) LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if email verification code is valid
CREATE OR REPLACE FUNCTION is_email_verification_code_valid(
  p_email VARCHAR(255),
  p_code VARCHAR(6)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user with matching email and code
  SELECT id INTO v_user_id
  FROM users
  WHERE LOWER(email) = LOWER(p_email)
    AND email_verification_code = UPPER(p_code)
    AND email_verification_expires_at > NOW()
    AND email_verified = FALSE;

  RETURN v_user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark email as verified
CREATE OR REPLACE FUNCTION verify_email(
  p_email VARCHAR(255),
  p_code VARCHAR(6)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INT;
BEGIN
  -- Update user if code is valid
  UPDATE users
  SET
    email_verified = TRUE,
    email_verified_at = NOW(),
    email_verification_code = NULL,
    email_verification_expires_at = NULL,
    updated_at = NOW()
  WHERE LOWER(email) = LOWER(p_email)
    AND email_verification_code = UPPER(p_code)
    AND email_verification_expires_at > NOW()
    AND email_verified = FALSE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: ADD AUDIT LOG ENTRIES
-- ============================================================================

-- Log this migration in audit_logs table
INSERT INTO audit_logs (
  user_id,
  event_type,
  event_category,
  event_status,
  event_data,
  created_at
) VALUES (
  NULL, -- System action, no specific user
  'database_migration',
  'admin',
  'success',
  jsonb_build_object(
    'migration', 'email_migration',
    'date', '2025-12-07',
    'description', 'Added email fields, removed SMS fields',
    'fields_added', jsonb_build_array('email', 'email_verified', 'email_verification_code', 'email_verification_expires_at', 'email_verified_at'),
    'fields_removed', jsonb_build_array('phone_verified', 'phone_verification_code', 'phone_verification_expires_at', 'phone_verified_at'),
    'architecture', 'Push + Email Hybrid'
  ),
  NOW()
);

-- ============================================================================
-- PART 8: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN users.email IS 'User email address for verification and critical alerts. Optional (NULL allowed for members without email).';
COMMENT ON COLUMN users.email_verified IS 'Whether user has verified ownership of email address. Must be TRUE before sending critical alerts.';
COMMENT ON COLUMN users.email_verification_code IS 'Temporary 6-character code sent via email for verification. Expires after 10 minutes.';
COMMENT ON COLUMN users.email_verification_expires_at IS 'Expiration timestamp for email verification code. Code invalid after this time.';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when user verified their email address. NULL if not yet verified.';

-- ============================================================================
-- VALIDATION QUERIES (for testing)
-- ============================================================================

-- Check that email fields were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'Migration failed: email column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    RAISE EXCEPTION 'Migration failed: email_verified column not added';
  END IF;

  RAISE NOTICE 'Migration validation passed: All email fields added successfully';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
To rollback this migration:

-- Remove email fields
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_code;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified_at;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_email_verified;
DROP INDEX IF EXISTS idx_users_email_verification_code;
DROP INDEX IF EXISTS idx_users_email_unique;

-- Drop functions
DROP FUNCTION IF EXISTS generate_email_verification_code();
DROP FUNCTION IF EXISTS is_email_verification_code_valid(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS verify_email(VARCHAR, VARCHAR);

-- Re-add SMS fields (if needed)
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN phone_verification_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
*/

