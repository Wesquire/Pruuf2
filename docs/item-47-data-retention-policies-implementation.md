# Item 47: Data Retention Policies - COMPLETE

**Priority**: MEDIUM
**Status**: ✅ COMPLETE
**Completion Date**: 2025-11-20

---

## Summary

Implemented comprehensive data retention policies with automated cleanup functions to manage database size, ensure GDPR compliance, and maintain data hygiene. Created 6 cleanup tasks with database functions, admin endpoint, and audit logging.

---

## Data Retention Policies

### 1. Soft-Deleted Users: 90 Days

**Rationale**: GDPR "right to be forgotten" + restoration grace period

**Policy**:
- Users soft-deleted via `/api/auth/delete-account`
- Retained for 90 days (allows restoration/compliance investigation)
- Hard deleted after 90 days (permanent removal)

**Implementation**: `cleanup_deleted_users()` function

**Data Deleted**:
- User account record
- Associated members (soft-deleted with user)
- Relationships
- Payment metadata (Stripe customer/subscription references)

**NOT Deleted**:
- Audit logs (separate retention)
- Aggregated analytics (anonymized)

### 2. Old Check-Ins: 2 Years

**Rationale**: Historical data for analytics, but limit database growth

**Policy**:
- Check-ins retained for 2 years
- Archived/deleted after 2 years
- Active users unlikely to need check-ins > 2 years old

**Implementation**: `archive_old_check_ins()` function

**Future Enhancement**:
- Move to archive table instead of deletion
- Create archive analytics dashboard
- Export to data warehouse for long-term analysis

### 3. Expired Verification Codes: 24 Hours

**Rationale**: Codes expire in 10 minutes, keep 24h for debugging

**Policy**:
- Verification codes expire in 10 minutes (functional)
- Retained for 24 hours (debugging/audit)
- Deleted after 24 hours (no longer needed)

**Implementation**: `cleanup_verification_codes()` function

**Benefits**:
- Reduces table size (codes created frequently)
- Improves query performance
- Prevents brute force enumeration attacks

### 4. Idempotency Keys: 24 Hours

**Rationale**: Keys expire after 24 hours per design

**Policy**:
- Idempotency keys valid for 24 hours (Item 12)
- Deleted after 24 hours (no longer valid)

**Implementation**: `cleanup_idempotency_keys()` function

**Benefits**:
- Automatic cleanup of expired keys
- Prevents unbounded table growth
- Maintains idempotency guarantee within validity window

### 5. Rate Limit Buckets: 1 Hour After Window

**Rationale**: Sliding windows expire, keep 1h for debugging

**Policy**:
- Rate limit windows vary by endpoint (1 min - 1 hour)
- Retained for 1 hour after window ends
- Deleted after grace period

**Implementation**: `cleanup_rate_limit_buckets()` function

**Benefits**:
- Prevents table bloat (buckets created frequently)
- Improves rate limit check performance
- Grace period allows debugging recent rate limit triggers

### 6. Audit Logs: 90 Days

**Rationale**: Security monitoring + compliance requirements

**Policy**:
- All audit logs retained for 90 days
- Deleted after 90 days (adjust based on compliance needs)
- Consider longer retention for specific event types

**Implementation**: `cleanup_audit_logs()` function

**Compliance Notes**:
- **GDPR**: 90 days typical for security logs
- **PCI DSS**: Requires 1 year (extend if processing cards directly)
- **SOC 2**: Typically 1 year
- **Adjust as needed for your compliance requirements**

---

## Implementation

### Database Functions

**File**: `/supabase/migrations/008_data_retention_cleanup.sql`

#### Individual Cleanup Functions

1. **`cleanup_deleted_users()`**
   ```sql
   SELECT * FROM cleanup_deleted_users();
   -- Returns: { deleted_count: 5 }
   ```

2. **`archive_old_check_ins()`**
   ```sql
   SELECT * FROM archive_old_check_ins();
   -- Returns: { archived_count: 1250 }
   ```

3. **`cleanup_verification_codes()`**
   ```sql
   SELECT * FROM cleanup_verification_codes();
   -- Returns: { deleted_count: 47 }
   ```

4. **`cleanup_idempotency_keys()`**
   ```sql
   SELECT * FROM cleanup_idempotency_keys();
   -- Returns: { deleted_count: 23 }
   ```

5. **`cleanup_rate_limit_buckets()`**
   ```sql
   SELECT * FROM cleanup_rate_limit_buckets();
   -- Returns: { deleted_count: 156 }
   ```

6. **`cleanup_audit_logs()`**
   ```sql
   SELECT * FROM cleanup_audit_logs();
   -- Returns: { deleted_count: 8942 }
   ```

#### Master Cleanup Function

**`run_data_retention_cleanup()`**

Runs all cleanup tasks in sequence and returns results:

```sql
SELECT * FROM run_data_retention_cleanup();
```

**Returns**:
```sql
| task                  | records_processed | executed_at              |
|-----------------------|-------------------|--------------------------|
| deleted_users         | 5                 | 2025-11-20 02:00:00+00   |
| old_check_ins         | 1250              | 2025-11-20 02:00:01+00   |
| verification_codes    | 47                | 2025-11-20 02:00:01+00   |
| idempotency_keys      | 23                | 2025-11-20 02:00:01+00   |
| rate_limit_buckets    | 156               | 2025-11-20 02:00:01+00   |
| audit_logs            | 8942              | 2025-11-20 02:00:02+00   |
```

### Cleanup Logs Table

**Purpose**: Audit trail for cleanup executions

**Schema**:
```sql
CREATE TABLE cleanup_logs (
  id UUID PRIMARY KEY,
  task VARCHAR(100) NOT NULL,
  records_processed INTEGER NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Queries**:
```sql
-- View recent cleanup runs
SELECT * FROM cleanup_logs ORDER BY executed_at DESC LIMIT 20;

-- Total records processed by task
SELECT
  task,
  SUM(records_processed) as total_records,
  COUNT(*) as executions,
  AVG(execution_time_ms) as avg_time_ms
FROM cleanup_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY task
ORDER BY total_records DESC;

-- Failed cleanup runs
SELECT * FROM cleanup_logs
WHERE success = FALSE
ORDER BY executed_at DESC;
```

### Admin API Endpoint

**File**: `/supabase/functions/admin/data-retention-cleanup/index.ts`

**Endpoint**: `POST /api/admin/data-retention-cleanup`

**Authentication**: X-Admin-Secret header

**Request**:
```bash
curl -X POST https://api.pruuf.com/api/admin/data-retention-cleanup \
  -H "X-Admin-Secret: your-admin-secret-here"
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "message": "Data retention cleanup completed successfully",
    "execution_time_ms": 3421,
    "total_records_processed": 10423,
    "tasks": [
      {
        "task": "deleted_users",
        "records_processed": 5,
        "executed_at": "2025-11-20T02:00:00.000Z"
      },
      {
        "task": "old_check_ins",
        "records_processed": 1250,
        "executed_at": "2025-11-20T02:00:01.000Z"
      },
      // ... more tasks
    ]
  }
}
```

**Response** (Unauthorized):
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

## Scheduling

### Option 1: Supabase Cron (Recommended)

**Using Supabase Cron Extension**:

1. Enable pg_cron extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. Schedule daily cleanup at 2 AM UTC:
   ```sql
   SELECT cron.schedule(
     'data-retention-cleanup',  -- Job name
     '0 2 * * *',               -- Cron expression (2 AM daily)
     $$ SELECT run_data_retention_cleanup(); $$
   );
   ```

3. View scheduled jobs:
   ```sql
   SELECT * FROM cron.job;
   ```

4. View job run history:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (
     SELECT jobid FROM cron.job
     WHERE jobname = 'data-retention-cleanup'
   )
   ORDER BY start_time DESC
   LIMIT 10;
   ```

5. Unschedule job (if needed):
   ```sql
   SELECT cron.unschedule('data-retention-cleanup');
   ```

### Option 2: External Cron Job

**Using cron on a server**:

1. Create script `/usr/local/bin/pruuf-cleanup.sh`:
   ```bash
   #!/bin/bash
   curl -X POST https://api.pruuf.com/api/admin/data-retention-cleanup \
     -H "X-Admin-Secret: ${ADMIN_SECRET}" \
     -H "Content-Type: application/json" \
     >> /var/log/pruuf-cleanup.log 2>&1
   ```

2. Make executable:
   ```bash
   chmod +x /usr/local/bin/pruuf-cleanup.sh
   ```

3. Add to crontab:
   ```bash
   crontab -e
   # Add line:
   0 2 * * * /usr/local/bin/pruuf-cleanup.sh
   ```

### Option 3: GitHub Actions

**Using GitHub Actions for scheduled cleanup**:

Create `.github/workflows/data-cleanup.yml`:
```yaml
name: Data Retention Cleanup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run data cleanup
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/admin/data-retention-cleanup \
            -H "X-Admin-Secret: ${{ secrets.ADMIN_SECRET }}" \
            -H "Content-Type: application/json"
```

**Secrets to configure**:
- `API_URL`: https://api.pruuf.com
- `ADMIN_SECRET`: Your admin secret

### Option 4: Cloud Functions / Lambda

**Using AWS Lambda with EventBridge**:

1. Create Lambda function that calls cleanup endpoint
2. Schedule with EventBridge (cron: 0 2 * * ? *)
3. Store ADMIN_SECRET in AWS Secrets Manager

---

## Security Considerations

### Admin Secret

**Environment Variable**: `ADMIN_SECRET`

**Requirements**:
- **Minimum length**: 32 characters
- **Entropy**: Use random string (not guessable)
- **Rotation**: Rotate periodically (quarterly recommended)

**Generate secure secret**:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Storage**:
- Store in Supabase environment variables
- Do NOT commit to git
- Do NOT log or expose in responses
- Rotate if compromised

### Access Control

**Who should have access**:
- ✅ Automated cron jobs (via ADMIN_SECRET)
- ✅ DevOps/platform engineers (for manual runs)
- ❌ Application code (endpoints should NOT call this)
- ❌ Frontend code (never expose secret to client)

**Audit**:
- All cleanup executions logged in `cleanup_logs` table
- Unauthorized attempts logged with IP and user agent
- Monitor logs for suspicious access patterns

### Rate Limiting

**Protection**:
- Cleanup endpoint not subject to standard rate limiting
- ADMIN_SECRET provides authorization
- Consider adding IP whitelist for extra security

---

## Monitoring and Alerts

### Metrics to Monitor

1. **Execution Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE success = TRUE) * 100.0 / COUNT(*) as success_rate
   FROM cleanup_logs
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

2. **Records Processed Over Time**
   ```sql
   SELECT
     DATE(executed_at) as date,
     task,
     SUM(records_processed) as total_records
   FROM cleanup_logs
   WHERE executed_at > NOW() - INTERVAL '30 days'
   GROUP BY DATE(executed_at), task
   ORDER BY date DESC, task;
   ```

3. **Execution Time Trend**
   ```sql
   SELECT
     DATE(executed_at) as date,
     AVG(execution_time_ms) as avg_time_ms,
     MAX(execution_time_ms) as max_time_ms
   FROM cleanup_logs
   WHERE executed_at > NOW() - INTERVAL '30 days'
   GROUP BY DATE(executed_at)
   ORDER BY date DESC;
   ```

### Alerts to Configure

1. **Cleanup Failures**
   - Alert if any cleanup fails
   - Check error_message in cleanup_logs

2. **Execution Time Anomalies**
   - Alert if execution time > 10 seconds (unusually high)
   - May indicate performance issues or large backlog

3. **Large Deletion Volumes**
   - Alert if deleted_users > 100 (unusual spike)
   - May indicate mass account deletion (investigate)

4. **Missed Executions**
   - Alert if no cleanup in last 25 hours
   - Cron job may have failed

---

## Testing

### Manual Test (Safe)

Test cleanup functions individually:

```sql
-- Test on recent data (won't delete anything in typical case)
SELECT * FROM cleanup_deleted_users();
-- Expected: 0 (no users deleted > 90 days ago)

SELECT * FROM cleanup_verification_codes();
-- Expected: ~few dozen (expired codes from yesterday)

SELECT * FROM cleanup_idempotency_keys();
-- Expected: ~few dozen (old keys from yesterday)

SELECT * FROM cleanup_rate_limit_buckets();
-- Expected: ~100+ (expired buckets)
```

### Integration Test

1. **Create test data**:
   ```sql
   -- Insert old soft-deleted user (backdated)
   INSERT INTO users (phone, deleted_at)
   VALUES ('+15555550000', NOW() - INTERVAL '91 days');

   -- Insert old check-in (backdated)
   INSERT INTO check_ins (member_id, checked_in_at)
   VALUES ('test-member-id', NOW() - INTERVAL '2 years 1 day');
   ```

2. **Run cleanup**:
   ```sql
   SELECT * FROM run_data_retention_cleanup();
   ```

3. **Verify deletion**:
   ```sql
   -- Check if test user was deleted
   SELECT * FROM users WHERE phone = '+15555550000';
   -- Expected: 0 rows

   -- Check if old check-in was deleted
   SELECT COUNT(*) FROM check_ins
   WHERE checked_in_at < NOW() - INTERVAL '2 years';
   -- Expected: 0
   ```

### API Endpoint Test

```bash
# Test successful cleanup
curl -X POST http://localhost:54321/functions/v1/admin/data-retention-cleanup \
  -H "X-Admin-Secret: test-secret" \
  -v

# Test unauthorized (wrong secret)
curl -X POST http://localhost:54321/functions/v1/admin/data-retention-cleanup \
  -H "X-Admin-Secret: wrong-secret" \
  -v
# Expected: 401 Unauthorized
```

---

## Compliance Benefits

### GDPR Compliance

✅ **Right to be Forgotten** (Article 17)
- Users can request account deletion via `/api/auth/delete-account`
- Account soft-deleted immediately (access revoked)
- Hard deleted after 90 days (permanent removal)
- Audit trail maintained (legitimate interest)

✅ **Data Minimization** (Article 5)
- Automated cleanup of unnecessary data
- Check-ins archived after 2 years
- Expired codes/keys deleted promptly

✅ **Storage Limitation** (Article 5)
- Clear retention periods defined
- Automated enforcement
- Regular cleanup execution

### Other Compliance

**PCI DSS** (if applicable):
- Audit logs retained (extend to 1 year if needed)
- Payment metadata deleted with user account
- Idempotency prevents duplicate charges

**SOC 2**:
- Audit logging demonstrates control
- Data retention policies documented
- Automated cleanup reduces human error

**HIPAA** (if applicable):
- Extend audit log retention to 6 years
- Document retention policies
- Audit cleanup executions

---

## Performance Impact

### Database Impact

**Positive Effects**:
- Reduced table sizes (faster queries)
- Improved index performance
- Lower storage costs
- Better query planner statistics

**Execution Cost**:
- Cleanup runs daily at 2 AM (low traffic)
- Takes 2-5 seconds typically
- Deletes operate in transaction (safe)
- Minimal impact on concurrent queries

### Recommendations

1. **Run during low traffic hours** (2-4 AM)
2. **Monitor execution time** (alert if > 10s)
3. **Use VACUUM ANALYZE** after cleanup (monthly):
   ```sql
   VACUUM ANALYZE users;
   VACUUM ANALYZE check_ins;
   VACUUM ANALYZE audit_logs;
   ```

---

## Future Enhancements

### Archive Tables

Instead of deleting old check-ins, move to archive:

```sql
CREATE TABLE check_ins_archive (
  LIKE check_ins INCLUDING ALL
);

-- Move instead of delete
INSERT INTO check_ins_archive
SELECT * FROM check_ins
WHERE checked_in_at < NOW() - INTERVAL '2 years';

DELETE FROM check_ins
WHERE checked_in_at < NOW() - INTERVAL '2 years';
```

### Selective Audit Log Retention

Keep different retention for event types:

```sql
-- Keep security events for 1 year
DELETE FROM audit_logs
WHERE event_category != 'security'
  AND created_at < NOW() - INTERVAL '90 days';

-- Security events kept for 1 year
DELETE FROM audit_logs
WHERE event_category = 'security'
  AND created_at < NOW() - INTERVAL '1 year';
```

### Data Export Before Deletion

Export deleted user data to S3 before hard delete:

1. Generate JSON export
2. Upload to S3
3. Hard delete from database
4. Retain export for 7 years (compliance)

---

## Related Items

- **Item 17**: Account Deletion Endpoint (Category 2) - Initiates soft delete
- **Item 16**: Audit Logging (Category 2) - Cleanup logs audit trail
- **Item 12**: Idempotency Keys (Category 2) - Cleanup after 24h
- **Item 13**: Rate Limiting (Category 2) - Cleanup expired buckets

---

## Conclusion

**Item 47: COMPLETE** ✅

### Achievements

✅ Implemented 6 data retention cleanup tasks
✅ Created master cleanup function
✅ Built admin API endpoint with authentication
✅ Created cleanup audit logging
✅ Documented scheduling options (4 methods)
✅ GDPR compliant data retention

### Data Retention Policies

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| Soft-deleted users | 90 days | GDPR compliance + restoration window |
| Old check-ins | 2 years | Historical data balance |
| Verification codes | 24 hours | Debugging window |
| Idempotency keys | 24 hours | Key validity period |
| Rate limit buckets | 1 hour | Window + grace period |
| Audit logs | 90 days | Security + compliance |

### Production Deployment

**Setup Steps**:
1. Deploy migration 008 (database functions)
2. Deploy admin endpoint
3. Configure ADMIN_SECRET environment variable
4. Schedule cron job (recommended: Supabase pg_cron)
5. Monitor cleanup_logs table
6. Set up alerts for failures

**Security Status**: Production-ready with comprehensive audit trail.

---

**Next**: Item 49 - Implement Session Management (MEDIUM)
