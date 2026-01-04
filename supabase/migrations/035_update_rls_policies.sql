-- Migration: Audit and Update RLS Policies after Schema Cleanup
-- Date: 2026-01-03
-- Reason: Verify RLS policies don't reference removed columns (Phase 8 of Expo migration)
-- Reversible: Yes (no destructive changes)

-- =============================================
-- AUDIT RESULTS
-- =============================================
-- Searched for RLS policies referencing:
--   - phone column: NONE FOUND
--   - stripe_* columns: NONE FOUND
--   - trial_* columns: NONE FOUND
--   - account_status payment values: NONE FOUND
--   - is_member column: NONE FOUND
--   - grandfathered_free column: NONE FOUND
--
-- All existing RLS policies use only:
--   - auth.uid() for user identification
--   - auth.jwt()->>'role' for service role checks
--   - Foreign key relationships (member_id, contact_id, user_id)
--   - Status fields ('active' status for relationships)
--
-- CONCLUSION: No RLS policy changes required

-- =============================================
-- RLS POLICIES DROPPED BY PREVIOUS MIGRATIONS
-- =============================================
-- Migration 030: "Service role full access to sms_logs" (table dropped)
-- Migration 032: "webhook_events_service_role" (table dropped)
-- These policies are automatically dropped when tables are dropped

-- =============================================
-- VERIFICATION: Confirm RLS is enabled on remaining tables
-- =============================================
-- These statements are idempotent (safe to run multiple times)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_check_in_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DOCUMENTATION: Current RLS Policy Summary
-- =============================================
COMMENT ON TABLE users IS 'User accounts with RLS: users can view/update own record, service role has full access';
COMMENT ON TABLE members IS 'Member profiles with RLS: users can view/update own, contacts can view their members';
COMMENT ON TABLE member_contact_relationships IS 'Relationships with RLS: users can view/update where they are member or contact';
COMMENT ON TABLE check_ins IS 'Check-ins with RLS: members can create/view own, contacts can view their members';
COMMENT ON TABLE push_notification_tokens IS 'Push tokens with RLS: users can manage own tokens';
COMMENT ON TABLE app_notifications IS 'Notifications with RLS: users can view/update own notifications';

-- =============================================
-- ROLLBACK SQL (run manually if needed)
-- =============================================
/*
-- No changes to rollback - this migration only verifies existing state
-- and adds documentation comments
*/
