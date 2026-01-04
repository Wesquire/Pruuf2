-- Migration: Remove phone column from users table
-- Date: 2026-01-03
-- Reason: App now uses email-only authentication (Phase 2 of Expo migration)
-- Reversible: Yes (see rollback section at bottom)

-- =============================================
-- STEP 1: Drop dependent indexes
-- =============================================
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_verification_phone;

-- =============================================
-- STEP 2: Drop dependent RLS policies that reference phone
-- =============================================
-- Note: Check if any policies reference phone column
-- (Based on codebase review, no RLS policies directly reference phone)

-- =============================================
-- STEP 3: Update verification_codes table
-- =============================================
-- The verification_codes table has a phone column that needs to be removed
-- since we now use email-only verification

-- First, drop constraints that reference phone
ALTER TABLE verification_codes
  DROP CONSTRAINT IF EXISTS verification_codes_phone_check;

-- Drop the phone column from verification_codes
ALTER TABLE verification_codes
  DROP COLUMN IF EXISTS phone;

-- =============================================
-- STEP 4: Remove phone column from users table
-- =============================================
-- First, drop any constraints on the phone column
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_phone_key;

-- Drop the phone column
ALTER TABLE users
  DROP COLUMN IF EXISTS phone;

-- =============================================
-- STEP 5: Add comments for documentation
-- =============================================
COMMENT ON TABLE users IS 'User accounts - email-only authentication (phone removed in migration 029)';

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration:

-- Add phone column back to users
ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;

-- Add phone column back to verification_codes
ALTER TABLE verification_codes ADD COLUMN phone VARCHAR(20);

-- Recreate indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_verification_phone ON verification_codes(phone);

-- Note: Data cannot be recovered without a backup
*/
