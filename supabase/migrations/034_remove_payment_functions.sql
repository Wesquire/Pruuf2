-- Migration: Remove payment-related database functions and trial tracking tables
-- Date: 2026-01-03
-- Reason: App is now free, no payment or trial processing (Phase 1 of Expo migration)
-- Reversible: Yes (see rollback section at bottom)

-- =============================================
-- STEP 1: Drop payment-related functions
-- =============================================
-- Note: requires_payment and update_is_member_status were already dropped in migration 031
-- This ensures they're removed if migration 031 wasn't run

DROP FUNCTION IF EXISTS requires_payment(UUID);
DROP FUNCTION IF EXISTS check_subscription_status(UUID);
DROP FUNCTION IF EXISTS update_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS is_trial_expired(UUID);
DROP FUNCTION IF EXISTS get_trial_days_remaining(UUID);

-- =============================================
-- STEP 2: Drop update_is_member_status trigger and function
-- =============================================
-- This function/trigger managed the is_member column which is now removed
DROP TRIGGER IF EXISTS update_is_member_trigger ON member_contact_relationships;
DROP FUNCTION IF EXISTS update_is_member_status();

-- =============================================
-- STEP 3: Drop trial tracking tables
-- =============================================
-- These tables tracked trial expiration warnings and processing
-- No longer needed since there are no trials

-- Drop indexes first
DROP INDEX IF EXISTS idx_trial_warnings_user;
DROP INDEX IF EXISTS idx_trial_warnings_sent_at;
DROP INDEX IF EXISTS idx_trial_warnings_user_trial;
DROP INDEX IF EXISTS idx_trial_exp_user;
DROP INDEX IF EXISTS idx_trial_exp_processed;

-- Drop trial tables
DROP TABLE IF EXISTS trial_expiration_warnings;
DROP TABLE IF EXISTS trial_expirations;

-- =============================================
-- STEP 4: Drop grace period tracking table
-- =============================================
-- Grace periods were for payment failures - no longer needed

DROP INDEX IF EXISTS idx_grace_exp_user;
DROP INDEX IF EXISTS idx_grace_exp_processed;
DROP TABLE IF EXISTS grace_period_expirations;

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration:

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

-- Recreate update_is_member_status function and trigger
CREATE OR REPLACE FUNCTION update_is_member_status() RETURNS TRIGGER AS $$
BEGIN
  -- When relationship becomes active, set is_member for the member
  IF NEW.status = 'active' THEN
    UPDATE users SET
      is_member = TRUE,
      grandfathered_free = TRUE
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_is_member_trigger
AFTER INSERT OR UPDATE ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION update_is_member_status();

-- Recreate trial tracking tables
CREATE TABLE trial_expiration_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  days_before_expiration INT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trial_warnings_user ON trial_expiration_warnings(user_id);
CREATE INDEX idx_trial_warnings_sent_at ON trial_expiration_warnings(sent_at);
CREATE INDEX idx_trial_warnings_user_trial ON trial_expiration_warnings(user_id, trial_end_date);

CREATE TABLE trial_expirations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resulted_in_freeze BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trial_exp_user ON trial_expirations(user_id);
CREATE INDEX idx_trial_exp_processed ON trial_expirations(processed_at);

-- Recreate grace period table
CREATE TABLE grace_period_expirations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grace_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  grace_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  days_in_grace_period INT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grace_exp_user ON grace_period_expirations(user_id);
CREATE INDEX idx_grace_exp_processed ON grace_period_expirations(processed_at);

-- Note: Data cannot be recovered without a backup
*/
