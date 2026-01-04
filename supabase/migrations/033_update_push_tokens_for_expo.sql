-- Migration: Update push_notification_tokens for Expo Push Tokens
-- Date: 2026-01-03
-- Reason: Migrating from FCM to Expo Push Service (Phase 3 of Expo migration)
-- Reversible: Yes (see rollback section at bottom)

-- =============================================
-- STEP 1: Clear existing FCM tokens
-- =============================================
-- FCM tokens won't work with Expo Push Service
-- Users will automatically re-register on next app launch
DELETE FROM push_notification_tokens;

-- =============================================
-- STEP 2: Update column comment
-- =============================================
COMMENT ON COLUMN push_notification_tokens.token IS 'Expo Push Token in format ExponentPushToken[xxx]';

-- =============================================
-- STEP 3: Add validation for Expo token format
-- =============================================
-- Expo Push Tokens have format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
-- This constraint ensures only valid Expo tokens are stored
ALTER TABLE push_notification_tokens
ADD CONSTRAINT check_expo_token_format
CHECK (token ~ '^ExponentPushToken\[.+\]$');

-- =============================================
-- STEP 4: Update table comment
-- =============================================
COMMENT ON TABLE push_notification_tokens IS 'Expo Push Tokens for sending notifications via Expo Push Service';

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- To rollback this migration:

-- Remove the Expo token format constraint
ALTER TABLE push_notification_tokens
DROP CONSTRAINT IF EXISTS check_expo_token_format;

-- Update comments back to FCM
COMMENT ON COLUMN push_notification_tokens.token IS 'FCM push notification token';
COMMENT ON TABLE push_notification_tokens IS 'FCM push notification tokens for iOS and Android';

-- Note: Token data cannot be recovered without a backup
-- Users will need to re-register their tokens on next app launch regardless
*/
