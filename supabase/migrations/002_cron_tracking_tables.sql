-- Migration 002: Cron Job Tracking Tables
-- Tables for tracking cron job executions and preventing duplicate notifications

-- Trial expiration warnings tracking
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

-- Trial expirations tracking
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

-- Grace period expirations tracking
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

-- Reminder notifications tracking
CREATE TABLE reminder_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reminder_minutes_before INT NOT NULL,
  check_in_time TIME NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminder_notif_member ON reminder_notifications(member_id);
CREATE INDEX idx_reminder_notif_sent_at ON reminder_notifications(sent_at);
CREATE INDEX idx_reminder_notif_member_sent ON reminder_notifications(member_id, sent_at DESC);

-- Add missing columns to missed_check_in_alerts
ALTER TABLE missed_check_in_alerts
ADD COLUMN IF NOT EXISTS contacts_notified INT DEFAULT 0;

-- Add missing column to members table for reminder settings
ALTER TABLE members
ADD COLUMN IF NOT EXISTS reminder_minutes_before INT DEFAULT 15 CHECK (
  reminder_minutes_before IN (15, 30, 60)
);

-- Comments for documentation
COMMENT ON TABLE trial_expiration_warnings IS 'Tracks trial expiration warnings sent to users (3 days before expiration)';
COMMENT ON TABLE trial_expirations IS 'Tracks trial expirations processed by cron job';
COMMENT ON TABLE grace_period_expirations IS 'Tracks grace period expirations for past_due accounts (7 days)';
COMMENT ON TABLE reminder_notifications IS 'Tracks check-in reminder notifications sent to members';
