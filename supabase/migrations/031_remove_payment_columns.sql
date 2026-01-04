-- Migration: Remove payment-related columns from users table
-- Date: 2026-01-03
-- Reason: App is now free, no payment processing (Phase 1 of Expo migration)
-- Reversible: Yes (see rollback section at bottom)

-- =============================================
-- STEP 1: Drop payment-related indexes
-- =============================================
-- RevenueCat indexes (added in migration 021)
DROP INDEX IF EXISTS idx_users_revenuecat_customer;
DROP INDEX IF EXISTS idx_users_revenuecat_subscription;

-- Trial-related indexes (from migration 001 and 007)
DROP INDEX IF EXISTS idx_users_trial_end;
DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_users_stripe_subscription_id;

-- =============================================
-- STEP 2: Update account_status for all users
-- =============================================
-- Set payment-related statuses to 'active' since app is now free
UPDATE users
SET account_status = 'active'
WHERE account_status IN ('trial', 'frozen', 'past_due', 'canceled');

-- Keep 'active', 'active_free', 'deleted', 'pending_invitation' as valid statuses

-- =============================================
-- STEP 3: Drop payment columns from users table
-- =============================================
-- RevenueCat columns (added in migration 021)
ALTER TABLE users DROP COLUMN IF EXISTS revenuecat_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS revenuecat_subscription_id;

-- Trial columns (from migration 001)
ALTER TABLE users DROP COLUMN IF EXISTS trial_start_date;
ALTER TABLE users DROP COLUMN IF EXISTS trial_end_date;

-- Grandfathering column (no longer needed when everything is free)
ALTER TABLE users DROP COLUMN IF EXISTS grandfathered_free;

-- is_member column (payment-related distinction)
ALTER TABLE users DROP COLUMN IF EXISTS is_member;

-- =============================================
-- STEP 4: Update account_status constraint
-- =============================================
-- Remove old constraint and add simplified one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE users
ADD CONSTRAINT users_account_status_check
CHECK (account_status IN (
  'active',              -- Normal active user
  'active_free',         -- Active free user (backwards compatible)
  'deleted',             -- Soft-deleted account
  'pending_invitation'   -- Invited but hasn't accepted yet
));

-- =============================================
-- STEP 5: Drop functions that reference payment columns
-- =============================================
-- Drop requires_payment function (no longer needed)
DROP FUNCTION IF EXISTS requires_payment(UUID);

-- Drop update_is_member_status trigger and function
-- Note: Trigger name from migration 001 is "trigger_update_is_member"
DROP TRIGGER IF EXISTS trigger_update_is_member ON member_contact_relationships;
DROP TRIGGER IF EXISTS update_is_member_trigger ON member_contact_relationships;
DROP FUNCTION IF EXISTS update_is_member_status() CASCADE;

-- =============================================
-- STEP 6: Add comments for documentation
-- =============================================
COMMENT ON COLUMN users.account_status IS 'User account status: active, active_free, deleted, pending_invitation';

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration:

-- Add payment columns back
ALTER TABLE users ADD COLUMN revenuecat_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN revenuecat_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN grandfathered_free BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_member BOOLEAN DEFAULT FALSE;

-- Recreate indexes
CREATE INDEX idx_users_revenuecat_customer ON users(revenuecat_customer_id)
  WHERE revenuecat_customer_id IS NOT NULL;
CREATE INDEX idx_users_revenuecat_subscription ON users(revenuecat_subscription_id)
  WHERE revenuecat_subscription_id IS NOT NULL;
CREATE INDEX idx_users_trial_end ON users(trial_end_date) WHERE account_status = 'trial';

-- Update account_status constraint to include payment statuses
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
CHECK (account_status IN (
  'trial', 'active', 'active_free', 'frozen', 'past_due',
  'canceled', 'deleted', 'pending_invitation'
));

-- Recreate requires_payment function
CREATE OR REPLACE FUNCTION requires_payment(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  IF user_record.grandfathered_free = TRUE THEN
    RETURN FALSE;
  END IF;
  IF user_record.is_member = TRUE THEN
    RETURN FALSE;
  END IF;
  IF user_record.revenuecat_subscription_id IS NULL THEN
    RETURN TRUE;
  END IF;
  IF user_record.account_status IN ('active', 'active_free') THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Note: update_is_member_status function/trigger would need recreation from migration 001

-- Note: User data for trial dates cannot be recovered without a backup
*/
