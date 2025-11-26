-- Pruuf Database Schema
-- Initial migration: Create all tables, indexes, and functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (both Members and Contacts)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  account_status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (
    account_status IN ('trial', 'active', 'active_free', 'frozen', 'past_due', 'canceled', 'deleted')
  ),
  is_member BOOLEAN DEFAULT FALSE,
  grandfathered_free BOOLEAN DEFAULT FALSE,
  font_size_preference VARCHAR(20) DEFAULT 'standard' CHECK (
    font_size_preference IN ('standard', 'large', 'extra_large')
  ),
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Members table (elderly users being monitored)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  check_in_time TIME,
  timezone VARCHAR(50),
  reminder_enabled BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member-Contact relationships
CREATE TABLE member_contact_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'removed')
  ),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  last_invite_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, contact_id)
);

-- Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timezone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missed check-in alerts
CREATE TABLE missed_check_in_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification codes
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS logs
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_phone VARCHAR(20) NOT NULL,
  from_phone VARCHAR(20) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50),
  status VARCHAR(20),
  twilio_sid VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push notification tokens
CREATE TABLE push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(10) CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- In-app notifications
CREATE TABLE app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_trial_end ON users(trial_end_date) WHERE account_status = 'trial';

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_check_in_time ON members(check_in_time);

CREATE INDEX idx_relationships_member ON member_contact_relationships(member_id);
CREATE INDEX idx_relationships_contact ON member_contact_relationships(contact_id);
CREATE INDEX idx_relationships_status ON member_contact_relationships(status);
CREATE INDEX idx_relationships_invite_code ON member_contact_relationships(invite_code);

CREATE INDEX idx_checkins_member ON check_ins(member_id);
CREATE INDEX idx_checkins_date ON check_ins(checked_in_at);
CREATE INDEX idx_checkins_member_date ON check_ins(member_id, checked_in_at DESC);

CREATE INDEX idx_alerts_member ON missed_check_in_alerts(member_id);
CREATE INDEX idx_alerts_sent_at ON missed_check_in_alerts(sent_at);

CREATE INDEX idx_verification_phone ON verification_codes(phone);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);

CREATE INDEX idx_sms_to_phone ON sms_logs(to_phone);
CREATE INDEX idx_sms_type ON sms_logs(type);
CREATE INDEX idx_sms_status ON sms_logs(status);
CREATE INDEX idx_sms_sent_at ON sms_logs(sent_at DESC);

CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);

CREATE INDEX idx_app_notif_user ON app_notifications(user_id);
CREATE INDEX idx_app_notif_unread ON app_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_app_notif_created ON app_notifications(created_at DESC);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Function: Generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS VARCHAR AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Check if code exists (very unlikely)
  IF EXISTS (SELECT 1 FROM member_contact_relationships WHERE invite_code = code) THEN
    RETURN generate_invite_code(); -- Recursive retry
  END IF;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Update is_member status when relationship changes
CREATE OR REPLACE FUNCTION update_is_member_status() RETURNS TRIGGER AS $$
BEGIN
  -- When relationship becomes active, set user as Member
  IF NEW.status = 'active' THEN
    UPDATE users SET
      is_member = TRUE,
      grandfathered_free = TRUE
    WHERE id = NEW.member_id;
  END IF;

  -- When last active relationship removed, unset is_member (but keep grandfathered)
  IF NEW.status = 'removed' OR TG_OP = 'DELETE' THEN
    UPDATE users SET is_member = FALSE
    WHERE id = COALESCE(NEW.member_id, OLD.member_id)
    AND NOT EXISTS (
      SELECT 1 FROM member_contact_relationships
      WHERE member_id = COALESCE(NEW.member_id, OLD.member_id)
      AND status = 'active'
      AND id != COALESCE(NEW.id, OLD.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_is_member
AFTER INSERT OR UPDATE OR DELETE ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION update_is_member_status();

-- Function: Check if user requires payment
CREATE OR REPLACE FUNCTION requires_payment(user_uuid UUID) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  is_member_flag BOOLEAN;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;

  -- Never require payment if grandfathered
  IF user_record.grandfathered_free = TRUE THEN
    RETURN FALSE;
  END IF;

  -- Check if currently a Member
  SELECT EXISTS(
    SELECT 1 FROM member_contact_relationships
    WHERE member_id = user_uuid AND status = 'active'
  ) INTO is_member_flag;

  IF is_member_flag = TRUE THEN
    RETURN FALSE;
  END IF;

  -- User is Contact-only, check subscription
  IF user_record.stripe_subscription_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Has subscription, check status
  IF user_record.account_status IN ('active', 'active_free') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON member_contact_relationships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_notification_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
