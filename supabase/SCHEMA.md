# Pruuf Database Schema

**Last Updated**: 2026-01-03
**Migration Version**: 036
**Database**: PostgreSQL 17 (Supabase)

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Notification Tables](#notification-tables)
4. [Infrastructure Tables](#infrastructure-tables)
5. [Relationships (ERD)](#relationships-erd)
6. [RLS Policies Summary](#rls-policies-summary)
7. [Removed Tables & Columns](#removed-tables--columns)

---

## Overview

The Pruuf database supports a wellness check-in application with the following core entities:
- **Users**: Account holders (both Members and Contacts)
- **Members**: Users who perform daily check-ins (elderly adults)
- **Contacts**: Users who monitor Members (family caregivers)
- **Check-ins**: Daily wellness confirmations

### Key Concepts

| Role | Description |
|------|-------------|
| Member | Elderly user who taps "I'm OK" daily |
| Contact | Family member who monitors one or more Members |
| User | Any authenticated account (can be Member, Contact, or both) |

---

## Core Tables

### users

Primary user accounts table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `email` | VARCHAR | YES | - | User's email address |
| `pin_hash` | VARCHAR | NO | - | bcrypt-hashed 4-digit PIN |
| `account_status` | VARCHAR | NO | `'trial'` | active, active_free, deleted, pending_invitation |
| `email_verified` | BOOLEAN | YES | `false` | Email verification status |
| `email_verification_code` | VARCHAR | YES | - | 6-digit verification code |
| `email_verification_expires_at` | TIMESTAMPTZ | YES | - | Code expiration |
| `email_verified_at` | TIMESTAMPTZ | YES | - | When email was verified |
| `font_size_preference` | VARCHAR | YES | `'standard'` | standard, large, extra_large |
| `push_notifications_enabled` | BOOLEAN | YES | `true` | Push notification preference |
| `email_notifications_enabled` | BOOLEAN | YES | `true` | Email notification preference |
| `failed_login_attempts` | INTEGER | YES | `0` | Failed PIN attempts |
| `locked_until` | TIMESTAMPTZ | YES | - | Account lockout expiry |
| `last_payment_date` | TIMESTAMPTZ | YES | - | Legacy field (app is free) |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Account creation |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Last update |
| `deleted_at` | TIMESTAMPTZ | YES | - | Soft delete timestamp |

**Indexes**: `email` (unique)

---

### members

Member profile for users who perform check-ins.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | UUID | YES | - | FK to users.id |
| `name` | VARCHAR | NO | - | Display name |
| `check_in_time` | TIME | YES | - | Daily check-in deadline |
| `timezone` | VARCHAR | YES | - | IANA timezone (e.g., America/New_York) |
| `reminder_enabled` | BOOLEAN | YES | `true` | Enable reminder notifications |
| `reminder_minutes_before` | INTEGER | YES | `15` | Minutes before check-in to remind |
| `onboarding_completed` | BOOLEAN | YES | `false` | Onboarding status |
| `onboarding_completed_at` | TIMESTAMPTZ | YES | - | When onboarding finished |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Last update |

**Indexes**: `user_id`

---

### member_contact_relationships

Links Members with their Contacts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `member_id` | UUID | NO | - | FK to users.id (Member) |
| `contact_id` | UUID | NO | - | FK to users.id (Contact) |
| `invite_code` | VARCHAR | NO | - | 6-character invite code |
| `status` | VARCHAR | YES | `'pending'` | pending, active, removed |
| `invited_at` | TIMESTAMPTZ | YES | `now()` | Invitation sent |
| `connected_at` | TIMESTAMPTZ | YES | - | When accepted |
| `last_invite_sent_at` | TIMESTAMPTZ | YES | `now()` | Last resend |
| `invite_expires_at` | TIMESTAMPTZ | YES | - | Invitation expiry |
| `removed_at` | TIMESTAMPTZ | YES | - | When relationship ended |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Last update |

**Indexes**: `member_id`, `contact_id`, `invite_code` (unique)
**Constraints**: Maximum 10 active contacts per member (trigger-enforced)

---

### check_ins

Daily check-in records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `member_id` | UUID | NO | - | FK to users.id |
| `checked_in_at` | TIMESTAMPTZ | YES | `now()` | Check-in timestamp |
| `timezone` | VARCHAR | YES | - | Member's timezone at check-in |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |

**Indexes**: `member_id`, `checked_in_at DESC`

---

### verification_codes

Email verification codes for authentication.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `code` | VARCHAR | NO | - | 6-digit verification code |
| `expires_at` | TIMESTAMPTZ | NO | - | Code expiration (10 min) |
| `used` | BOOLEAN | YES | `false` | Whether code was used |
| `attempts` | INTEGER | YES | `0` | Failed verification attempts |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Creation timestamp |

**Constraints**: Max 5 attempts per code

---

## Notification Tables

### push_notification_tokens

Expo Push Token storage.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | UUID | NO | - | FK to users.id |
| `token` | TEXT | NO | - | Expo Push Token |
| `platform` | VARCHAR | YES | - | ios, android |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Registration time |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Last update |

**Constraints**: Token must match `^ExponentPushToken\[.+\]$`
**Indexes**: `user_id`, `token` (unique)

---

### app_notifications

In-app notification feed.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | UUID | NO | - | FK to users.id |
| `title` | VARCHAR | NO | - | Notification title |
| `body` | TEXT | NO | - | Notification message |
| `type` | VARCHAR | YES | - | Notification type |
| `read` | BOOLEAN | YES | `false` | Read status |
| `action_url` | VARCHAR | YES | - | Deep link URL |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Creation timestamp |
| `read_at` | TIMESTAMPTZ | YES | - | When marked read |

**Indexes**: `user_id`, `created_at DESC`

---

### push_notification_logs

Push notification delivery tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | UUID | NO | - | FK to users.id |
| `title` | VARCHAR | NO | - | Notification title |
| `body` | TEXT | NO | - | Notification body |
| `data` | JSONB | YES | `'{}'` | Notification payload |
| `priority` | VARCHAR | YES | `'normal'` | normal, high, critical |
| `sent_count` | INTEGER | YES | `0` | Successful deliveries |
| `failed_count` | INTEGER | YES | `0` | Failed deliveries |
| `failed_tokens` | TEXT[] | YES | - | Failed token list |
| `sent_at` | TIMESTAMPTZ | YES | `now()` | Send timestamp |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |

---

### email_notification_logs

Email notification delivery tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_email` | VARCHAR | NO | - | Recipient email |
| `title` | VARCHAR | NO | - | Email subject |
| `body` | TEXT | NO | - | Email body |
| `type` | VARCHAR | NO | - | Notification type |
| `data` | JSONB | YES | `'{}'` | Additional data |
| `postmark_message_id` | VARCHAR | YES | - | Postmark tracking ID |
| `error_message` | TEXT | YES | - | Error if failed |
| `sent_at` | TIMESTAMPTZ | YES | `now()` | Send timestamp |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |

---

### email_logs

General email delivery logs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `to_email` | VARCHAR | NO | - | Recipient |
| `from_email` | VARCHAR | NO | - | Sender |
| `subject` | VARCHAR | NO | - | Subject line |
| `body` | TEXT | NO | - | Email body |
| `type` | VARCHAR | NO | - | Email type |
| `status` | VARCHAR | NO | `'sent'` | sent, delivered, failed |
| `postmark_message_id` | VARCHAR | YES | - | Postmark ID |
| `error_message` | TEXT | YES | - | Error details |
| `sent_at` | TIMESTAMPTZ | YES | `now()` | Send time |
| `delivered_at` | TIMESTAMPTZ | YES | - | Delivery confirmation |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |

---

### missed_check_in_alerts

Tracking for missed check-in notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `member_id` | UUID | NO | - | FK to users.id |
| `alert_type` | VARCHAR | YES | - | Alert severity |
| `contacts_notified` | INTEGER | YES | `0` | Number of contacts alerted |
| `sent_at` | TIMESTAMPTZ | YES | `now()` | Alert sent time |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |

---

### reminder_notifications

Check-in reminder tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `member_id` | UUID | NO | - | FK to members.id |
| `reminder_minutes_before` | INTEGER | NO | - | Minutes before check-in |
| `check_in_time` | TIME | NO | - | Scheduled check-in time |
| `sent_at` | TIMESTAMPTZ | YES | `now()` | When reminder sent |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |

---

## Infrastructure Tables

### user_sessions

Multi-device session management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | UUID | NO | - | FK to users.id |
| `session_token` | VARCHAR | NO | - | Unique session token |
| `device_info` | JSONB | YES | - | Device metadata |
| `ip_address` | INET | YES | - | Client IP |
| `user_agent` | TEXT | YES | - | Browser/app user agent |
| `last_active_at` | TIMESTAMPTZ | NO | `now()` | Last activity |
| `expires_at` | TIMESTAMPTZ | NO | - | Session expiry |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Session start |
| `revoked_at` | TIMESTAMPTZ | YES | - | When revoked |
| `revoked_by` | VARCHAR | YES | - | Who revoked |
| `revoked_reason` | TEXT | YES | - | Revocation reason |

**Indexes**: `user_id`, `session_token` (unique)

---

### audit_logs

Security audit trail.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | YES | - | FK to users.id |
| `event_type` | VARCHAR | NO | - | Event name |
| `event_category` | VARCHAR | NO | - | auth, data, admin |
| `event_status` | VARCHAR | NO | - | success, failure |
| `event_data` | JSONB | YES | - | Event details |
| `ip_address` | INET | YES | - | Client IP |
| `user_agent` | TEXT | YES | - | Browser/app info |
| `request_id` | VARCHAR | YES | - | Request correlation ID |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Event timestamp |

**Indexes**: `user_id`, `event_type`, `created_at DESC`

---

### rate_limit_buckets

API rate limiting.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR | NO | - | Bucket identifier |
| `request_count` | INTEGER | NO | `0` | Requests in window |
| `window_start` | TIMESTAMPTZ | NO | - | Window start time |
| `window_end` | TIMESTAMPTZ | NO | - | Window end time |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Record creation |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Last update |

**Indexes**: `window_end`

---

### idempotency_keys

Duplicate request prevention.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `key` | VARCHAR | NO | - | Primary key (idempotency key) |
| `request_hash` | TEXT | NO | - | Request body hash |
| `response_data` | JSONB | NO | - | Cached response |
| `status_code` | INTEGER | NO | - | HTTP status code |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Creation time |
| `expires_at` | TIMESTAMPTZ | YES | `now() + 24h` | Expiry time |

---

### cleanup_logs

Data retention job tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `task` | VARCHAR | NO | - | Cleanup task name |
| `records_processed` | INTEGER | NO | - | Records cleaned |
| `executed_at` | TIMESTAMPTZ | NO | `now()` | Execution time |
| `execution_time_ms` | INTEGER | YES | - | Duration in ms |
| `success` | BOOLEAN | NO | `true` | Success status |
| `error_message` | TEXT | YES | - | Error if failed |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Record creation |

---

## Relationships (ERD)

```
                    ┌──────────────────┐
                    │      users       │
                    │    (accounts)    │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    members      │ │  user_sessions  │ │   audit_logs    │
│  (profiles)     │ │  (multi-device) │ │  (security)     │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         │ member_contact_relationships
         │ (links members ←→ contacts)
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   check_ins     │ │ missed_alerts   │ │reminder_notifs  │
│ (daily records) │ │   (alerts)      │ │  (reminders)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘

Push/Email Notifications:
┌────────────────────┐     ┌────────────────────┐
│ push_notif_tokens  │     │ push_notif_logs    │
│ (Expo tokens)      │     │ (delivery tracking)│
└────────────────────┘     └────────────────────┘
┌────────────────────┐     ┌────────────────────┐
│ app_notifications  │     │ email_notif_logs   │
│ (in-app feed)      │     │ (email tracking)   │
└────────────────────┘     └────────────────────┘
```

---

## RLS Policies Summary

All tables have Row Level Security (RLS) enabled. Here's the access pattern:

### User-Owned Data

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | Own record | - | Own record | - |
| `members` | Own + Contacts' | Own | Own | - |
| `check_ins` | Own + Contacts' | Own | - | - |
| `member_contact_relationships` | Own (either side) | As Contact | Own (either side) | Own (either side) |
| `push_notification_tokens` | Own | Own | Own | Own |
| `app_notifications` | Own | - | Own (mark read) | - |
| `user_sessions` | Own | - | Own (revoke) | - |

### Service Role Only

These tables are accessible only via service role (backend Edge Functions):

- `verification_codes`
- `missed_check_in_alerts`
- `audit_logs`
- `email_logs`
- `push_notification_logs`
- `email_notification_logs`
- `rate_limit_buckets`
- `idempotency_keys`
- `cleanup_logs`
- `reminder_notifications`

---

## Removed Tables & Columns

The following were removed during the Expo migration (Phase 8):

### Removed Tables

| Table | Removed In | Reason |
|-------|------------|--------|
| `sms_logs` | Migration 025/030 | App no longer uses SMS |
| `webhook_events_log` | Migration 032 | RevenueCat removed |
| `trial_expiration_warnings` | Migration 034 | App is now free |
| `trial_expirations` | Migration 034 | App is now free |
| `grace_period_expirations` | Migration 034 | App is now free |
| `encryption_keys` | Migration 036 | Phone encryption removed |
| `encryption_audit_log` | Migration 036 | Phone encryption removed |

### Removed Columns from `users`

| Column | Removed In | Reason |
|--------|------------|--------|
| `phone` | Migration 029 | Email-only authentication |
| `phone_encrypted` | Migration 036 | Phone removed |
| `phone_hash` | Migration 036 | Phone removed |
| `revenuecat_customer_id` | Migration 031 | Payment removed |
| `revenuecat_subscription_id` | Migration 031 | Payment removed |
| `trial_start_date` | Migration 031 | App is now free |
| `trial_end_date` | Migration 031 | App is now free |
| `grandfathered_free` | Migration 031 | All users free |
| `is_member` | Migration 031 | No payment distinction |

### Removed Columns from `verification_codes`

| Column | Removed In | Reason |
|--------|------------|--------|
| `phone` | Migration 029 | Email-only verification |

### Removed Columns from `members`

| Column | Removed In | Reason |
|--------|------------|--------|
| `phone_encrypted` | Migration 036 | Phone removed |
| `phone_hash` | Migration 036 | Phone removed |

### Removed Functions

| Function | Removed In | Reason |
|----------|------------|--------|
| `requires_payment()` | Migration 031/034 | App is free |
| `update_is_member_status()` | Migration 031/034 | No payment distinction |
| `check_subscription_status()` | Migration 034 | Payment removed |
| `update_subscription_status()` | Migration 034 | Payment removed |
| `is_trial_expired()` | Migration 034 | No trials |
| `get_trial_days_remaining()` | Migration 034 | No trials |
| `encrypt_phone()` | Migration 036 | Phone removed |
| `decrypt_phone()` | Migration 036 | Phone removed |
| `phone_search_hash()` | Migration 036 | Phone removed |
| `encrypt_and_hash_phone()` | Migration 036 | Phone removed |
| `get_encryption_key()` | Migration 036 | Phone removed |
| `migrate_users_phone_encryption()` | Migration 036 | Phone removed |
| `migrate_members_phone_encryption()` | Migration 036 | Phone removed |
| `is_duplicate_webhook_event()` | Migration 032 | Webhooks removed |
| `get_failed_webhook_events()` | Migration 032 | Webhooks removed |
| `get_webhook_event_stats()` | Migration 032 | Webhooks removed |
| `cleanup_webhook_events_log()` | Migration 032 | Webhooks removed |

### Removed Views

| View | Removed In | Reason |
|------|------------|--------|
| `users_decrypted` | Migration 036 | Phone removed |
| `members_decrypted` | Migration 036 | Phone removed |

---

## Migration History

| Migration | Description |
|-----------|-------------|
| 001 | Initial schema |
| 002 | Cron tracking tables |
| 003 | Row Level Security |
| 004 | Idempotency keys |
| 005 | Rate limiting |
| 006 | Audit logging |
| 007 | Performance indexes |
| 008 | Data retention cleanup |
| 009 | Session management |
| 010 | PII encryption (phone) |
| 011 | Additional RLS policies |
| 021 | Replace Stripe with RevenueCat |
| 022 | Webhook events log |
| 023 | QA test helper functions |
| 024 | Contact limit trigger |
| 025 | Email logs table |
| 026 | Email migration |
| 027 | Invitation magic links |
| 028 | Notification logs |
| 029 | Remove phone column |
| 030 | Remove SMS logs |
| 031 | Remove payment columns |
| 032 | Remove webhook events |
| 033 | Update push tokens for Expo |
| 034 | Remove payment functions |
| 035 | Update RLS policies |
| 036 | Cleanup phone functions |

---

*Generated as part of Phase 8: Database Migrations & Cleanup*
