# Pruuf Notification Strategy

**Version**: 1.0
**Last Updated**: 2025-12-07
**Owner**: Engineering Team

---

## Overview

Pruuf implements a **dual notification strategy** that combines Push Notifications (via Firebase Cloud Messaging) and Email Notifications (via Postmark) to ensure critical alerts are always delivered, even if one channel fails.

## Notification Priorities

### Priority Levels

| Priority | Delivery Strategy | Use Case |
|----------|------------------|----------|
| **CRITICAL** | Push + Email (always both) | Missed check-ins, payment failures, account frozen |
| **HIGH** | Push first, Email fallback if push fails | Check-in confirmations, late check-ins, member connected |
| **NORMAL** | Push only | Check-in reminders, trial reminders, invitations |
| **LOW** | Push only (batchable) | Weekly summaries, feature announcements |

### Notification Types

#### Critical (Always Push + Email)

- `MISSED_CHECK_IN` - Member missed their check-in deadline
- `PAYMENT_FAILED` - Contact's payment method failed
- `ACCOUNT_FROZEN` - Contact's account frozen due to non-payment

**Why Critical**: These notifications require immediate action and cannot be missed. Dual delivery ensures redundancy.

#### High Priority (Push + Email Fallback)

- `CHECK_IN_CONFIRMATION` - Member checked in successfully
- `LATE_CHECK_IN` - Member checked in after deadline
- `MEMBER_CONNECTED` - New Member accepted invitation

**Why High**: Important confirmations that users expect immediately. Email fallback if push fails.

#### Normal Priority (Push Only)

- `CHECK_IN_REMINDER` - Daily reminder to check in
- `TRIAL_REMINDER` - Trial ending soon
- `INVITATION_SENT` - Invitation sent to new Member

**Why Normal**: Routine notifications that don't require email redundancy.

#### Low Priority (Push Only, Batchable)

- `WEEKLY_SUMMARY` - Weekly check-in summary
- `FEATURE_ANNOUNCEMENT` - New feature announcement

**Why Low**: Non-time-sensitive, can be batched or delayed.

---

## Architecture

### Frontend (React Native)

**File**: `src/services/dualNotificationService.ts`

**Key Functions**:
- `sendNotification(payload, accessToken)` - Main entry point, routes to appropriate strategy
- `getNotificationPriority(type)` - Maps notification type to priority level
- `sendPushNotification(payload, accessToken)` - Sends push via FCM
- `sendEmailNotification(payload, accessToken)` - Sends email via Postmark

**Usage Example**:
```typescript
import { sendNotification, NotificationType } from '../services/dualNotificationService';

// Send critical notification (push + email)
const result = await sendNotification({
  type: NotificationType.MISSED_CHECK_IN,
  title: 'Mom missed check-in',
  body: 'No check-in by 10 AM PST',
  userId: 'contact-uuid',
  userEmail: 'contact@example.com',
  data: { memberId: 'member-uuid' }
}, accessToken);

console.log(`Push sent: ${result.pushSent}, Email sent: ${result.emailSent}`);
```

### Backend (Supabase Edge Functions)

**Push Notification Endpoint**: `supabase/functions/send-push-notification/index.ts`
- Sends push notification via Firebase Cloud Messaging (FCM)
- Handles multiple FCM tokens per user (multi-device support)
- Automatically removes invalid/expired tokens
- Logs all push attempts to `push_notification_logs` table

**Email Notification Endpoint**: `supabase/functions/send-email-notification/index.ts`
- Sends email notification via Postmark
- Uses HTML + plain text dual-format emails
- Logs all email attempts to `email_notification_logs` table
- Handles email delivery failures gracefully

---

## Database Schema

### Push Notification Logs

**Table**: `push_notification_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who received notification |
| title | VARCHAR(255) | Notification title |
| body | TEXT | Notification body |
| data | JSONB | Additional data payload |
| priority | VARCHAR(20) | critical, high, normal, or low |
| sent_count | INT | Number of successful sends |
| failed_count | INT | Number of failed sends |
| failed_tokens | TEXT[] | Array of failed FCM tokens |
| sent_at | TIMESTAMP | When notification was sent |

**Indexes**:
- `user_id` - for user-specific queries
- `sent_at DESC` - for recent notifications
- `priority` - for priority-based filtering

### Email Notification Logs

**Table**: `email_notification_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_email | VARCHAR(255) | Recipient email address |
| title | VARCHAR(255) | Email subject |
| body | TEXT | Email body (plain text) |
| type | VARCHAR(50) | Notification type |
| data | JSONB | Additional data payload |
| postmark_message_id | VARCHAR(255) | Postmark message ID |
| error_message | TEXT | Error if delivery failed |
| sent_at | TIMESTAMP | When email was sent |

**Indexes**:
- `user_email` - for user-specific queries
- `sent_at DESC` - for recent emails
- `type` - for type-based filtering

### User Notification Preferences

**Table**: `users` (additional columns)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| push_notifications_enabled | BOOLEAN | TRUE | User preference for push |
| email_notifications_enabled | BOOLEAN | TRUE | User preference for email |

**Note**: Critical notifications override user preferences (always sent for safety).

---

## Notification Delivery Flow

### Critical Notification (e.g., Missed Check-In)

```
1. Backend detects missed check-in
2. Backend calls send-push-notification AND send-email-notification
3. Frontend receives push notification (if app installed & permissions granted)
4. User receives email (if email address on file)
5. Both logged in respective tables
```

### High Priority Notification (e.g., Check-in Confirmation)

```
1. Member checks in
2. Backend calls send-push-notification
3. If push succeeds → Done
4. If push fails → Backend calls send-email-notification
5. All logged in respective tables
```

### Normal/Low Priority Notification (e.g., Reminder)

```
1. Backend calls send-push-notification
2. If push fails → Silent failure (no email fallback)
3. Logged in push_notification_logs table
```

---

## User Preferences

### Preference Overrides

| Notification Type | Push Pref = FALSE | Email Pref = FALSE |
|-------------------|-------------------|-------------------|
| CRITICAL | Send email only | Send push only |
| HIGH | Send email fallback | Send push only |
| NORMAL | Skip notification | Send push only |
| LOW | Skip notification | Send push only |

**Critical Notifications**: Always sent via at least one channel (safety override).

### Preference Management UI

Users can manage preferences in Settings:
- "Push Notifications" toggle
- "Email Notifications" toggle
- Warning text: "Critical safety alerts will always be sent via at least one method"

---

## Error Handling

### Push Notification Failures

**Invalid Token**: Remove from `push_notification_tokens` table
**NotRegistered**: Remove from table
**Network Error**: Retry once, then fail gracefully
**All Tokens Failed**: Log failure, trigger email fallback (if HIGH/CRITICAL)

### Email Notification Failures

**Invalid Email**: Log error, don't retry
**Postmark API Error**: Log error, retry once
**Rate Limit**: Queue for later delivery

---

## Performance Considerations

### Batching (Low Priority)

Low-priority notifications can be batched to reduce API calls:
```typescript
const payloads = [
  { type: NotificationType.WEEKLY_SUMMARY, ... },
  { type: NotificationType.FEATURE_ANNOUNCEMENT, ... },
];

await sendBatchNotifications(payloads, accessToken);
```

### Token Management

- FCM tokens refreshed automatically by Firebase SDK
- Invalid tokens removed on first send failure
- Multi-device support: One user can have multiple tokens
- Token limit: 10 tokens per user (oldest auto-removed)

### Log Retention

- Push logs: 90 days (auto-cleanup via cron)
- Email logs: 90 days (auto-cleanup via cron)
- Cron job: Run `cleanup_old_notification_logs()` daily at midnight

---

## Monitoring & Analytics

### Key Metrics

**Push Notification Success Rate**:
```sql
SELECT
  AVG(sent_count::DECIMAL / NULLIF(sent_count + failed_count, 0)) * 100 AS success_rate
FROM push_notification_logs
WHERE sent_at >= NOW() - INTERVAL '7 days';
```

**Email Notification Success Rate**:
```sql
SELECT
  COUNT(*) FILTER (WHERE error_message IS NULL)::DECIMAL / COUNT(*) * 100 AS success_rate
FROM email_notification_logs
WHERE sent_at >= NOW() - INTERVAL '7 days';
```

**Critical Notification Delivery**:
```sql
SELECT COUNT(*) AS critical_notifications
FROM push_notification_logs
WHERE priority = 'critical'
  AND sent_at >= NOW() - INTERVAL '7 days';
```

### User Notification Stats

Use built-in function:
```sql
SELECT * FROM get_notification_stats('user-uuid', 30);
```

Returns:
- Total push notifications (30 days)
- Total email notifications (30 days)
- Push success rate
- Critical notification count
- Last notification timestamp

---

## Testing

### Unit Tests

**Frontend**:
- `dualNotificationService.test.ts` - Test all notification functions
- Mock FCM and Postmark API calls
- Test priority routing logic
- Test fallback mechanism

**Backend**:
- `send-push-notification.test.ts` - Test FCM integration
- `send-email-notification.test.ts` - Test Postmark integration
- Test token management (invalid token removal)
- Test logging

### Integration Tests

1. **Send Critical Notification**:
   - Verify push sent to all user's FCM tokens
   - Verify email sent to user's email address
   - Verify logs created in both tables

2. **Send High Priority with Push Failure**:
   - Mock FCM failure
   - Verify email fallback triggered
   - Verify correct logs

3. **Send Normal Priority**:
   - Verify only push sent
   - Verify no email sent
   - Verify single log entry

### Manual Testing Checklist

- [ ] Send critical notification to user with push enabled
- [ ] Send critical notification to user with push disabled
- [ ] Send high-priority notification with all FCM tokens invalid
- [ ] Send notification to user with no email address
- [ ] Send batch notifications (low priority)
- [ ] Verify user preferences honored (except critical)
- [ ] Verify logs created for all scenarios

---

## Deployment Checklist

### Environment Variables

- [ ] `FIREBASE_SERVER_KEY` - FCM Server Key
- [ ] `POSTMARK_SERVER_TOKEN` - Postmark API token
- [ ] `POSTMARK_FROM_EMAIL` - Sender email address

### Database Migrations

- [ ] Run `20251207_notification_logs.sql` migration
- [ ] Verify `push_notification_logs` table created
- [ ] Verify `email_notification_logs` table created
- [ ] Verify `get_notification_stats()` function works

### Frontend Dependencies

- [ ] `@react-native-firebase/messaging` installed
- [ ] Firebase configuration complete (google-services.json, GoogleService-Info.plist)
- [ ] FCM permissions requested on app launch

### Backend Endpoints

- [ ] Deploy `send-push-notification` Edge Function
- [ ] Deploy `send-email-notification` Edge Function
- [ ] Test both endpoints with Postman/curl

### Monitoring

- [ ] Set up alerts for push notification failure rate > 10%
- [ ] Set up alerts for email notification failure rate > 5%
- [ ] Set up alerts for critical notifications not delivered

---

## Troubleshooting

### Push Notifications Not Received

**Check**:
1. User has granted push permissions
2. User has valid FCM token in database
3. Token hasn't expired (refresh tokens regularly)
4. Firebase project configured correctly
5. `FIREBASE_SERVER_KEY` environment variable set

**Debug**:
```sql
SELECT * FROM push_notification_logs
WHERE user_id = 'user-uuid'
ORDER BY sent_at DESC
LIMIT 10;
```

### Email Notifications Not Received

**Check**:
1. User has valid email address in database
2. Email not in spam folder
3. Postmark sender verified
4. `POSTMARK_SERVER_TOKEN` valid

**Debug**:
```sql
SELECT * FROM email_notification_logs
WHERE user_email = 'user@example.com'
ORDER BY sent_at DESC
LIMIT 10;
```

### Critical Notifications Not Delivered

**Escalation**:
1. Check both push_notification_logs and email_notification_logs
2. If both failed, manual outreach required
3. Review error messages in logs
4. Update user's contact information if invalid

---

## Future Enhancements

- [ ] SMS fallback for critical notifications (third channel)
- [ ] In-app notification center (persistent notification history)
- [ ] Notification delivery SLA tracking
- [ ] A/B testing notification copy
- [ ] Machine learning for optimal delivery time
- [ ] Rich push notifications (images, actions)
- [ ] Notification grouping/threading
- [ ] User-defined custom notification times
