/**
 * Migration: 007_performance_indexes.sql
 * Purpose: Add database indexes for query optimization
 * Priority: MEDIUM
 *
 * Improves performance for common queries:
 * - User lookups by phone
 * - Member queries by user_id
 * - Verification code lookups
 * - Check-in queries
 * - Audit log queries (already done in 006)
 */

-- Users table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Members table indexes
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);

-- Verification codes table indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_expires
  ON verification_codes(phone, expires_at DESC);

-- Check-ins table indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_checked_in_at ON check_ins(checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_date
  ON check_ins(member_id, checked_in_at DESC);

-- Idempotency keys indexes (already exists from 004, but verify)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Rate limit buckets indexes (already exists from 005, but verify)
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window_end ON rate_limit_buckets(window_end);

-- Comments on indexes
COMMENT ON INDEX idx_users_phone IS 'Optimize user lookup by phone number (login, verification)';
COMMENT ON INDEX idx_users_stripe_customer_id IS 'Optimize Stripe customer lookups';
COMMENT ON INDEX idx_users_deleted_at IS 'Partial index for soft-deleted users';
COMMENT ON INDEX idx_verification_codes_phone_expires IS 'Composite index for verification lookup and cleanup';
COMMENT ON INDEX idx_check_ins_member_date IS 'Optimize check-in history queries';

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE members;
ANALYZE verification_codes;
ANALYZE check_ins;
ANALYZE idempotency_keys;
ANALYZE rate_limit_buckets;
ANALYZE audit_logs;
