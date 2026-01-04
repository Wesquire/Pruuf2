-- ============================================================================
-- QA Test Data Script
-- ============================================================================
-- Purpose: Generate test data for QA testing of Pruuf application
-- Created: 2026-01-03
--
-- This script is IDEMPOTENT - can be run multiple times safely.
-- Test data uses 'test+*@pruuf.me' email pattern for easy identification.
--
-- Usage:
--   supabase db reset && psql -f supabase/seed/qa_test_data.sql
--   OR
--   Run via Supabase SQL editor
--
-- Cleanup:
--   DELETE FROM users WHERE email LIKE 'test+%@pruuf.me';
-- ============================================================================

-- ============================================================================
-- CLEANUP: Remove existing test data first (makes script idempotent)
-- ============================================================================

-- Delete in order respecting foreign key constraints
DELETE FROM check_ins WHERE member_id IN (
  SELECT id FROM members WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
  )
);

DELETE FROM missed_check_in_alerts WHERE member_id IN (
  SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
);

DELETE FROM reminder_notifications WHERE member_id IN (
  SELECT id FROM members WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
  )
);

DELETE FROM member_contact_relationships WHERE
  member_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me')
  OR contact_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me');

DELETE FROM members WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
);

DELETE FROM push_notification_tokens WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
);

DELETE FROM app_notifications WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
);

DELETE FROM user_sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me'
);

DELETE FROM verification_codes WHERE id IN (
  SELECT id FROM verification_codes
  WHERE created_at > NOW() - INTERVAL '1 day'
);

DELETE FROM users WHERE email LIKE 'test+%@pruuf.me';

-- ============================================================================
-- TEST USERS
-- ============================================================================
-- PIN: 1234 for all test users
-- bcrypt hash generated with cost factor 10: $2b$10$abcdefghijklmnopqrstuuQZxT3RlGPi8UZn9f.u6kGYaP7J3nS
-- Note: In production, use proper bcrypt hashing. This is a placeholder hash.

-- Pre-generate UUIDs for referential integrity
DO $$
DECLARE
  -- User UUIDs
  member1_id UUID := 'a0000000-0000-0000-0000-000000000001';
  member2_id UUID := 'a0000000-0000-0000-0000-000000000002';
  member3_id UUID := 'a0000000-0000-0000-0000-000000000003';
  contact1_id UUID := 'b0000000-0000-0000-0000-000000000001';
  contact2_id UUID := 'b0000000-0000-0000-0000-000000000002';
  dual_role_id UUID := 'c0000000-0000-0000-0000-000000000001';
  pending_member_id UUID := 'd0000000-0000-0000-0000-000000000001';

  -- Member profile UUIDs
  member1_profile_id UUID := 'e0000000-0000-0000-0000-000000000001';
  member2_profile_id UUID := 'e0000000-0000-0000-0000-000000000002';
  member3_profile_id UUID := 'e0000000-0000-0000-0000-000000000003';
  dual_role_profile_id UUID := 'e0000000-0000-0000-0000-000000000004';

  -- PIN hash for "1234" (bcrypt cost 10)
  -- Generated using: await bcrypt.hash('1234', 10)
  test_pin_hash VARCHAR := '$2b$10$K4rR3fFxHrCVuYvGqI7Xp.DxVl5qVKYjT8N9Z0wXmYcP1QsRtUvWx';

BEGIN

  -- ============================================================================
  -- CREATE TEST USERS
  -- ============================================================================

  -- Member 1: Active elderly member with daily check-ins
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (member1_id, 'test+member1@pruuf.me', test_pin_hash, 'active', TRUE, NOW(), 'large', TRUE, TRUE, NOW() - INTERVAL '30 days');

  -- Member 2: Active member, reminders disabled
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (member2_id, 'test+member2@pruuf.me', test_pin_hash, 'active', TRUE, NOW(), 'extra_large', TRUE, FALSE, NOW() - INTERVAL '60 days');

  -- Member 3: Active member, has missed check-ins
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (member3_id, 'test+member3@pruuf.me', test_pin_hash, 'active', TRUE, NOW(), 'standard', TRUE, TRUE, NOW() - INTERVAL '90 days');

  -- Contact 1: Monitors Member 1 and Member 2
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (contact1_id, 'test+contact1@pruuf.me', test_pin_hash, 'active', TRUE, NOW(), 'standard', TRUE, TRUE, NOW() - INTERVAL '30 days');

  -- Contact 2: Monitors Member 3
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (contact2_id, 'test+contact2@pruuf.me', test_pin_hash, 'active', TRUE, NOW(), 'standard', TRUE, TRUE, NOW() - INTERVAL '45 days');

  -- Dual Role User: Both a Member (being monitored) and a Contact (monitoring others)
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (dual_role_id, 'test+dual@pruuf.me', test_pin_hash, 'active', TRUE, NOW(), 'large', TRUE, TRUE, NOW() - INTERVAL '15 days');

  -- Pending Member: Invited but hasn't completed onboarding
  INSERT INTO users (id, email, pin_hash, account_status, email_verified, email_verified_at, font_size_preference, push_notifications_enabled, email_notifications_enabled, created_at)
  VALUES (pending_member_id, 'test+pending@pruuf.me', test_pin_hash, 'pending_invitation', FALSE, NULL, 'standard', TRUE, TRUE, NOW() - INTERVAL '2 days');

  -- ============================================================================
  -- CREATE MEMBER PROFILES
  -- ============================================================================

  -- Member 1 profile: Check-in at 9:00 AM, reminders enabled
  INSERT INTO members (id, user_id, name, check_in_time, timezone, reminder_enabled, reminder_minutes_before, onboarding_completed, onboarding_completed_at, created_at)
  VALUES (member1_profile_id, member1_id, 'Grandma Rose', '09:00:00', 'America/New_York', TRUE, 15, TRUE, NOW() - INTERVAL '29 days', NOW() - INTERVAL '30 days');

  -- Member 2 profile: Check-in at 8:00 AM, reminders disabled
  INSERT INTO members (id, user_id, name, check_in_time, timezone, reminder_enabled, reminder_minutes_before, onboarding_completed, onboarding_completed_at, created_at)
  VALUES (member2_profile_id, member2_id, 'Grandpa Joe', '08:00:00', 'America/Chicago', FALSE, 30, TRUE, NOW() - INTERVAL '59 days', NOW() - INTERVAL '60 days');

  -- Member 3 profile: Check-in at 10:00 AM (has missed some)
  INSERT INTO members (id, user_id, name, check_in_time, timezone, reminder_enabled, reminder_minutes_before, onboarding_completed, onboarding_completed_at, created_at)
  VALUES (member3_profile_id, member3_id, 'Uncle Bob', '10:00:00', 'America/Los_Angeles', TRUE, 60, TRUE, NOW() - INTERVAL '89 days', NOW() - INTERVAL '90 days');

  -- Dual role user's member profile: Check-in at 7:00 AM
  INSERT INTO members (id, user_id, name, check_in_time, timezone, reminder_enabled, reminder_minutes_before, onboarding_completed, onboarding_completed_at, created_at)
  VALUES (dual_role_profile_id, dual_role_id, 'Dad Mike', '07:00:00', 'America/Denver', TRUE, 15, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '15 days');

  -- ============================================================================
  -- CREATE MEMBER-CONTACT RELATIONSHIPS
  -- ============================================================================

  -- Contact 1 monitors Member 1 (active relationship)
  INSERT INTO member_contact_relationships (member_id, contact_id, invite_code, status, invited_at, connected_at, created_at)
  VALUES (member1_id, contact1_id, 'ABC123', 'active', NOW() - INTERVAL '29 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '29 days');

  -- Contact 1 also monitors Member 2 (active relationship)
  INSERT INTO member_contact_relationships (member_id, contact_id, invite_code, status, invited_at, connected_at, created_at)
  VALUES (member2_id, contact1_id, 'DEF456', 'active', NOW() - INTERVAL '58 days', NOW() - INTERVAL '57 days', NOW() - INTERVAL '58 days');

  -- Contact 2 monitors Member 3 (active relationship)
  INSERT INTO member_contact_relationships (member_id, contact_id, invite_code, status, invited_at, connected_at, created_at)
  VALUES (member3_id, contact2_id, 'GHI789', 'active', NOW() - INTERVAL '88 days', NOW() - INTERVAL '87 days', NOW() - INTERVAL '88 days');

  -- Dual role: Being monitored by Contact 1
  INSERT INTO member_contact_relationships (member_id, contact_id, invite_code, status, invited_at, connected_at, created_at)
  VALUES (dual_role_id, contact1_id, 'JKL012', 'active', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '14 days');

  -- Dual role: Monitors Member 3
  INSERT INTO member_contact_relationships (member_id, contact_id, invite_code, status, invited_at, connected_at, created_at)
  VALUES (member3_id, dual_role_id, 'MNO345', 'active', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '10 days');

  -- Pending invitation: Contact 2 invited Pending Member (not yet accepted)
  INSERT INTO member_contact_relationships (member_id, contact_id, invite_code, status, invited_at, invite_expires_at, created_at)
  VALUES (pending_member_id, contact2_id, 'PQR678', 'pending', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', NOW() - INTERVAL '2 days');

  -- ============================================================================
  -- CREATE CHECK-INS (Last 7 days)
  -- ============================================================================
  -- Note: check_ins.member_id references users.id (the user who is a member)

  -- Member 1: Perfect check-in record (7/7 days)
  INSERT INTO check_ins (member_id, checked_in_at, timezone, created_at) VALUES
    (member1_id, NOW() - INTERVAL '6 days' + INTERVAL '9 hours', 'America/New_York', NOW() - INTERVAL '6 days'),
    (member1_id, NOW() - INTERVAL '5 days' + INTERVAL '9 hours', 'America/New_York', NOW() - INTERVAL '5 days'),
    (member1_id, NOW() - INTERVAL '4 days' + INTERVAL '9 hours', 'America/New_York', NOW() - INTERVAL '4 days'),
    (member1_id, NOW() - INTERVAL '3 days' + INTERVAL '9 hours', 'America/New_York', NOW() - INTERVAL '3 days'),
    (member1_id, NOW() - INTERVAL '2 days' + INTERVAL '9 hours', 'America/New_York', NOW() - INTERVAL '2 days'),
    (member1_id, NOW() - INTERVAL '1 day' + INTERVAL '9 hours', 'America/New_York', NOW() - INTERVAL '1 day'),
    (member1_id, NOW(), 'America/New_York', NOW());

  -- Member 2: Good check-in record (6/7 days, missed yesterday)
  INSERT INTO check_ins (member_id, checked_in_at, timezone, created_at) VALUES
    (member2_id, NOW() - INTERVAL '6 days' + INTERVAL '8 hours', 'America/Chicago', NOW() - INTERVAL '6 days'),
    (member2_id, NOW() - INTERVAL '5 days' + INTERVAL '8 hours', 'America/Chicago', NOW() - INTERVAL '5 days'),
    (member2_id, NOW() - INTERVAL '4 days' + INTERVAL '8 hours', 'America/Chicago', NOW() - INTERVAL '4 days'),
    (member2_id, NOW() - INTERVAL '3 days' + INTERVAL '8 hours', 'America/Chicago', NOW() - INTERVAL '3 days'),
    (member2_id, NOW() - INTERVAL '2 days' + INTERVAL '8 hours', 'America/Chicago', NOW() - INTERVAL '2 days'),
    -- Skipped yesterday
    (member2_id, NOW(), 'America/Chicago', NOW());

  -- Member 3: Poor check-in record (4/7 days, multiple misses)
  INSERT INTO check_ins (member_id, checked_in_at, timezone, created_at) VALUES
    (member3_id, NOW() - INTERVAL '6 days' + INTERVAL '10 hours', 'America/Los_Angeles', NOW() - INTERVAL '6 days'),
    -- Missed day 5
    (member3_id, NOW() - INTERVAL '4 days' + INTERVAL '10 hours', 'America/Los_Angeles', NOW() - INTERVAL '4 days'),
    -- Missed day 3
    (member3_id, NOW() - INTERVAL '2 days' + INTERVAL '10 hours', 'America/Los_Angeles', NOW() - INTERVAL '2 days'),
    -- Missed day 1
    (member3_id, NOW(), 'America/Los_Angeles', NOW());

  -- Dual role member: Perfect record (7/7 days)
  INSERT INTO check_ins (member_id, checked_in_at, timezone, created_at) VALUES
    (dual_role_id, NOW() - INTERVAL '6 days' + INTERVAL '7 hours', 'America/Denver', NOW() - INTERVAL '6 days'),
    (dual_role_id, NOW() - INTERVAL '5 days' + INTERVAL '7 hours', 'America/Denver', NOW() - INTERVAL '5 days'),
    (dual_role_id, NOW() - INTERVAL '4 days' + INTERVAL '7 hours', 'America/Denver', NOW() - INTERVAL '4 days'),
    (dual_role_id, NOW() - INTERVAL '3 days' + INTERVAL '7 hours', 'America/Denver', NOW() - INTERVAL '3 days'),
    (dual_role_id, NOW() - INTERVAL '2 days' + INTERVAL '7 hours', 'America/Denver', NOW() - INTERVAL '2 days'),
    (dual_role_id, NOW() - INTERVAL '1 day' + INTERVAL '7 hours', 'America/Denver', NOW() - INTERVAL '1 day'),
    (dual_role_id, NOW(), 'America/Denver', NOW());

  -- ============================================================================
  -- CREATE MISSED CHECK-IN ALERTS
  -- ============================================================================

  -- Member 2 missed yesterday
  INSERT INTO missed_check_in_alerts (member_id, alert_type, contacts_notified, sent_at, created_at)
  VALUES (member2_id, 'first_alert', 1, NOW() - INTERVAL '1 day' + INTERVAL '9 hours', NOW() - INTERVAL '1 day');

  -- Member 3 missed multiple days
  INSERT INTO missed_check_in_alerts (member_id, alert_type, contacts_notified, sent_at, created_at) VALUES
    (member3_id, 'first_alert', 2, NOW() - INTERVAL '5 days' + INTERVAL '11 hours', NOW() - INTERVAL '5 days'),
    (member3_id, 'first_alert', 2, NOW() - INTERVAL '3 days' + INTERVAL '11 hours', NOW() - INTERVAL '3 days'),
    (member3_id, 'first_alert', 2, NOW() - INTERVAL '1 day' + INTERVAL '11 hours', NOW() - INTERVAL '1 day');

  -- ============================================================================
  -- CREATE PUSH NOTIFICATION TOKENS (Expo format)
  -- ============================================================================

  INSERT INTO push_notification_tokens (user_id, token, platform, created_at) VALUES
    (member1_id, 'ExponentPushToken[test-member1-token-abc123]', 'ios', NOW() - INTERVAL '25 days'),
    (member2_id, 'ExponentPushToken[test-member2-token-def456]', 'android', NOW() - INTERVAL '55 days'),
    (member3_id, 'ExponentPushToken[test-member3-token-ghi789]', 'ios', NOW() - INTERVAL '85 days'),
    (contact1_id, 'ExponentPushToken[test-contact1-token-jkl012]', 'ios', NOW() - INTERVAL '28 days'),
    (contact2_id, 'ExponentPushToken[test-contact2-token-mno345]', 'android', NOW() - INTERVAL '43 days'),
    (dual_role_id, 'ExponentPushToken[test-dual-token-pqr678]', 'ios', NOW() - INTERVAL '12 days');

  -- ============================================================================
  -- CREATE APP NOTIFICATIONS
  -- ============================================================================

  -- Member 1: Some read notifications
  INSERT INTO app_notifications (user_id, title, body, type, read, read_at, created_at) VALUES
    (member1_id, 'Check-in Reminder', 'Don''t forget to check in today!', 'reminder', TRUE, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    (member1_id, 'Welcome!', 'Your account is now active.', 'system', TRUE, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days');

  -- Contact 1: Mix of read and unread
  INSERT INTO app_notifications (user_id, title, body, type, read, read_at, created_at) VALUES
    (contact1_id, 'Grandma Rose checked in', 'Grandma Rose is OK today.', 'checkin', TRUE, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 hours'),
    (contact1_id, 'Grandpa Joe missed check-in', 'Grandpa Joe has not checked in today.', 'missed_checkin', FALSE, NULL, NOW() - INTERVAL '1 day'),
    (contact1_id, 'Dad Mike checked in', 'Dad Mike is OK today.', 'checkin', FALSE, NULL, NOW() - INTERVAL '1 hour');

  -- ============================================================================
  -- CREATE USER SESSIONS
  -- ============================================================================

  INSERT INTO user_sessions (user_id, session_token, device_info, ip_address, last_active_at, expires_at, created_at) VALUES
    (member1_id, 'test-session-member1-active', '{"device": "iPhone 14", "os": "iOS 17"}', '192.168.1.100', NOW(), NOW() + INTERVAL '90 days', NOW() - INTERVAL '1 day'),
    (contact1_id, 'test-session-contact1-active', '{"device": "Pixel 8", "os": "Android 14"}', '192.168.1.101', NOW(), NOW() + INTERVAL '90 days', NOW() - INTERVAL '2 days'),
    (dual_role_id, 'test-session-dual-active', '{"device": "iPhone 15 Pro", "os": "iOS 17.2"}', '192.168.1.102', NOW(), NOW() + INTERVAL '90 days', NOW() - INTERVAL '1 hour');

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify test data was created
DO $$
DECLARE
  user_count INTEGER;
  member_count INTEGER;
  relationship_count INTEGER;
  checkin_count INTEGER;
  token_count INTEGER;
  notification_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users WHERE email LIKE 'test+%@pruuf.me';
  SELECT COUNT(*) INTO member_count FROM members WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me');
  SELECT COUNT(*) INTO relationship_count FROM member_contact_relationships WHERE member_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me') OR contact_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me');
  -- check_ins.member_id references users.id directly
  SELECT COUNT(*) INTO checkin_count FROM check_ins WHERE member_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me');
  SELECT COUNT(*) INTO token_count FROM push_notification_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me');
  SELECT COUNT(*) INTO notification_count FROM app_notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test+%@pruuf.me');

  RAISE NOTICE '=== QA Test Data Summary ===';
  RAISE NOTICE 'Test Users: %', user_count;
  RAISE NOTICE 'Member Profiles: %', member_count;
  RAISE NOTICE 'Relationships: %', relationship_count;
  RAISE NOTICE 'Check-ins: %', checkin_count;
  RAISE NOTICE 'Push Tokens: %', token_count;
  RAISE NOTICE 'App Notifications: %', notification_count;
  RAISE NOTICE '============================';

  -- Verify expected counts
  IF user_count != 7 THEN
    RAISE EXCEPTION 'Expected 7 test users, got %', user_count;
  END IF;

  IF member_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 member profiles, got %', member_count;
  END IF;

  IF relationship_count != 6 THEN
    RAISE EXCEPTION 'Expected 6 relationships, got %', relationship_count;
  END IF;

  IF checkin_count != 24 THEN
    RAISE EXCEPTION 'Expected 24 check-ins, got %', checkin_count;
  END IF;

  IF token_count != 6 THEN
    RAISE EXCEPTION 'Expected 6 push tokens, got %', token_count;
  END IF;

  RAISE NOTICE 'All verifications passed!';
END $$;

-- ============================================================================
-- TEST SCENARIOS COVERED
-- ============================================================================
/*
This test data covers the following scenarios:

USERS:
1. Member with perfect check-in record (test+member1@pruuf.me)
2. Member with occasional missed check-ins (test+member2@pruuf.me)
3. Member with frequent missed check-ins (test+member3@pruuf.me)
4. Contact monitoring multiple members (test+contact1@pruuf.me)
5. Contact monitoring single member (test+contact2@pruuf.me)
6. Dual-role user (both Member and Contact) (test+dual@pruuf.me)
7. Pending invitation user (test+pending@pruuf.me)

RELATIONSHIPS:
- Active member-contact relationships
- Pending invitation
- Multiple contacts for one member
- Member with multiple contacts monitoring them
- Dual-role user relationships

CHECK-INS:
- Perfect 7-day record
- 6/7 days (one miss)
- 4/7 days (multiple misses)
- Different timezones

NOTIFICATIONS:
- Push tokens in Expo format
- In-app notifications (read/unread)
- Missed check-in alerts

SESSIONS:
- Active sessions for testing authentication

FONT SIZES:
- standard, large, extra_large preferences

PIN: All test users use PIN "1234"
*/
