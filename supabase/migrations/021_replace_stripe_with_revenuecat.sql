-- Migration: Replace Stripe with RevenueCat
-- Date: 2025-12-16
-- Description: Replaces stripe_customer_id and stripe_subscription_id with RevenueCat equivalents

-- Add new RevenueCat columns
ALTER TABLE users
  ADD COLUMN revenuecat_customer_id VARCHAR(255),
  ADD COLUMN revenuecat_subscription_id VARCHAR(255);

-- Add indexes for new columns
CREATE INDEX idx_users_revenuecat_customer ON users(revenuecat_customer_id)
  WHERE revenuecat_customer_id IS NOT NULL;

CREATE INDEX idx_users_revenuecat_subscription ON users(revenuecat_subscription_id)
  WHERE revenuecat_subscription_id IS NOT NULL;

-- Drop old Stripe indexes
DROP INDEX IF EXISTS idx_users_stripe_customer;
DROP INDEX IF EXISTS idx_users_stripe_subscription;

-- Drop views that depend on stripe columns
DROP VIEW IF EXISTS users_decrypted CASCADE;

-- Drop old Stripe columns
ALTER TABLE users
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id;

-- Add comments for documentation
COMMENT ON COLUMN users.revenuecat_customer_id IS 'RevenueCat customer identifier for subscription management';
COMMENT ON COLUMN users.revenuecat_subscription_id IS 'RevenueCat subscription identifier for active subscriptions';
