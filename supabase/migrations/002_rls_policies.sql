-- Pruuf Row Level Security Policies
-- Ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_check_in_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Members table policies
CREATE POLICY members_select_own ON members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY members_select_contacts ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = members.user_id
      AND contact_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY members_update_own ON members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY members_insert_own ON members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Member-Contact relationships policies
CREATE POLICY relationships_select ON member_contact_relationships
  FOR SELECT USING (
    auth.uid() = member_id OR auth.uid() = contact_id
  );

CREATE POLICY relationships_insert_contact ON member_contact_relationships
  FOR INSERT WITH CHECK (auth.uid() = contact_id);

CREATE POLICY relationships_update_own ON member_contact_relationships
  FOR UPDATE USING (
    auth.uid() = member_id OR auth.uid() = contact_id
  );

CREATE POLICY relationships_delete_own ON member_contact_relationships
  FOR DELETE USING (
    auth.uid() = member_id OR auth.uid() = contact_id
  );

-- Check-ins policies
CREATE POLICY checkins_select_own ON check_ins
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY checkins_select_contacts ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = check_ins.member_id
      AND contact_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY checkins_insert_own ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Missed check-in alerts policies
CREATE POLICY alerts_select_contacts ON missed_check_in_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = missed_check_in_alerts.member_id
      AND contact_id = auth.uid()
      AND status = 'active'
    )
  );

-- Push notification tokens policies
CREATE POLICY push_tokens_select_own ON push_notification_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_tokens_insert_own ON push_notification_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_update_own ON push_notification_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY push_tokens_delete_own ON push_notification_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- App notifications policies
CREATE POLICY app_notif_select_own ON app_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY app_notif_update_own ON app_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Note: SMS logs, verification codes, and audit logs are backend-only
-- No RLS policies needed as they're accessed via service role key
