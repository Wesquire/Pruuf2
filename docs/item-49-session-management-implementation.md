# Item 49: Session Management - COMPLETE

**Priority**: MEDIUM
**Status**: ✅ COMPLETE
**Completion Date**: 2025-11-20

---

## Summary

Implemented comprehensive session management system allowing users to view active sessions across devices, see device information and activity, and remotely logout from specific devices. Includes session tracking, automatic expiration, and audit logging.

---

## Features Implemented

### 1. Session Tracking

**What's Tracked**:
- Session ID (UUID)
- User ID
- Session token (JWT token reference)
- Device information (type, OS, version, name)
- IP address
- User agent
- Last activity timestamp
- Creation timestamp
- Expiration timestamp
- Revocation status and reason

### 2. Active Session Viewing

**Endpoint**: `GET /api/sessions/list`

**Returns**:
- List of all active sessions for authenticated user
- Device type, OS, and version
- Last active timestamp
- Masked IP address (privacy)
- User agent string

**Use Case**: User sees "Your account is logged in on iPhone 14, MacBook Pro, iPad"

### 3. Remote Logout

**Endpoint**: `DELETE /api/sessions/revoke`

**Actions**:
- Revoke specific session by ID
- Revoke all sessions except current (logout from all devices)
- Audit log all session revocations

**Use Cases**:
- Lost device: remotely logout from that session
- Security concern: logout from all devices
- Device no longer used: remove old sessions

### 4. Automatic Session Management

**Functions**:
- `create_user_session()` - Create session on login
- `update_session_activity()` - Update last active time
- `revoke_session()` - Logout from specific session
- `revoke_all_user_sessions()` - Logout from all devices
- `cleanup_expired_sessions()` - Mark expired sessions as revoked
- `cleanup_old_sessions()` - Delete old revoked sessions (90 days)

---

## Implementation

### Database Schema

**Table**: `user_sessions`

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by VARCHAR(50),  -- 'user', 'admin', 'system', 'timeout'
  revoked_reason TEXT
);
```

**Indexes**:
- `idx_sessions_user_id` - User lookup
- `idx_sessions_token` - Token validation
- `idx_sessions_expires_at` - Expiration cleanup
- `idx_sessions_last_active` - Activity sorting
- `idx_sessions_active` - Active sessions (partial index)

### RLS Policies

**Users can view own sessions**:
```sql
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);
```

**Users can revoke own sessions**:
```sql
CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Service role full access**:
```sql
CREATE POLICY "Service role full access to sessions"
  ON user_sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## API Endpoints

### 1. List Active Sessions

**GET** `/api/sessions/list`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-uuid-1",
        "device": {
          "type": "mobile",
          "os": "iOS",
          "osVersion": "17.1",
          "appVersion": "1.2.0",
          "deviceName": "iPhone 14 Pro"
        },
        "location": {
          "ipAddress": "192.168.x.x"
        },
        "userAgent": "Pruuf/1.2.0 (iOS 17.1)",
        "lastActiveAt": "2025-11-20T10:30:00Z",
        "createdAt": "2025-11-15T08:00:00Z"
      },
      {
        "id": "session-uuid-2",
        "device": {
          "type": "desktop",
          "os": "macOS",
          "osVersion": "14.1",
          "appVersion": "1.2.0",
          "deviceName": "MacBook Pro"
        },
        "location": {
          "ipAddress": "192.168.x.x"
        },
        "userAgent": "Mozilla/5.0 (Macintosh...)",
        "lastActiveAt": "2025-11-20T09:15:00Z",
        "createdAt": "2025-11-10T14:30:00Z"
      }
    ],
    "total": 2
  }
}
```

### 2. Revoke Specific Session

**DELETE** `/api/sessions/revoke`

**Authentication**: Required

**Request Body**:
```json
{
  "session_id": "session-uuid-1"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Session revoked successfully"
  }
}
```

### 3. Revoke All Sessions

**DELETE** `/api/sessions/revoke`

**Authentication**: Required

**Request Body**:
```json
{
  "revoke_all": true,
  "except_current": true,
  "current_session_id": "session-uuid-2"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "All sessions revoked successfully",
    "sessions_revoked": 5
  }
}
```

---

## Device Information Format

**Device Info JSON Structure**:
```json
{
  "deviceType": "mobile",
  "os": "iOS",
  "osVersion": "17.1",
  "appVersion": "1.2.0",
  "deviceName": "iPhone 14 Pro",
  "deviceId": "uuid-optional",
  "brand": "Apple",
  "model": "iPhone 14,3"
}
```

**Supported Device Types**:
- `mobile` - Smartphones
- `tablet` - Tablets/iPads
- `desktop` - Desktop/laptop computers
- `web` - Web browsers
- `other` - Unknown devices

---

## Session Lifecycle

### 1. Session Creation (Login)

```
User logs in → Backend creates session record
↓
Session includes:
- Unique session token
- Device info from request
- IP address
- User agent
- Expiration (30 days default)
```

### 2. Session Activity Tracking

```
User makes API request → Backend validates session
↓
If valid:
- Update last_active_at timestamp
- Extend session if needed
↓
If invalid/expired:
- Reject request (401)
- Client should re-authenticate
```

### 3. Session Expiration

```
Session expires (30 days no activity)
↓
Cleanup cron job runs (daily)
↓
Mark session as revoked
- revoked_by = 'system'
- revoked_reason = 'Session expired'
```

### 4. Manual Revocation (Logout)

```
User logs out (local or remote)
↓
Backend marks session as revoked
- revoked_at = NOW()
- revoked_by = 'user'
- revoked_reason = 'User initiated logout'
↓
Session token becomes invalid
Client must re-authenticate
```

---

## Security Features

### 1. IP Address Masking

**Purpose**: Privacy protection

**Implementation**:
```typescript
function maskIpAddress(ip: string): string {
  // IPv4: 192.168.x.x (hide last 2 octets)
  // IPv6: 2001:db8:abcd:0012:x:x:x:x (hide last 4 groups)
  return maskedIp;
}
```

**Why**: Prevents exposing exact user location while still showing general region

### 2. Session Token Uniqueness

**Enforcement**: Database UNIQUE constraint on `session_token`

**Purpose**: Prevents session token reuse/collision

### 3. Automatic Expiration

**Default**: 30 days from last activity

**Purpose**: Limits exposure window if device is lost/stolen

**Configuration**: Adjustable via `create_user_session()` parameter

### 4. Revocation Audit Trail

**Logged Information**:
- Who revoked (user, admin, system)
- When revoked (timestamp)
- Why revoked (reason text)

**Purpose**: Security monitoring and forensics

### 5. RLS Protection

**Enforcement**: Users can only view/revoke own sessions

**Protection**: Prevents session enumeration/hijacking

---

## Integration with Authentication

### Login Flow

```typescript
// In /api/auth/login endpoint
const sessionToken = createSessionToken(user.phone, 2592000); // 30 days

// Create session record
await supabase.rpc('create_user_session', {
  p_user_id: user.id,
  p_session_token: sessionToken,
  p_device_info: {
    deviceType: req.headers.get('X-Device-Type'),
    os: req.headers.get('X-Device-OS'),
    osVersion: req.headers.get('X-Device-OS-Version'),
    appVersion: req.headers.get('X-App-Version'),
    deviceName: req.headers.get('X-Device-Name'),
  },
  p_ip_address: req.headers.get('X-Forwarded-For'),
  p_user_agent: req.headers.get('User-Agent'),
  p_expires_in_seconds: 2592000, // 30 days
});

return { session_token: sessionToken };
```

### Logout Flow

```typescript
// In /api/auth/logout endpoint
await supabase.rpc('revoke_session', {
  p_session_id: sessionId,
  p_user_id: user.id,
  p_revoked_by: 'user',
  p_reason: 'User logout',
});
```

---

## Cleanup and Maintenance

### Automated Cleanup Tasks

**1. Expire Old Sessions** (Daily at 2 AM)

```sql
SELECT * FROM cleanup_expired_sessions();
-- Marks sessions past expires_at as revoked
```

**2. Delete Old Revoked Sessions** (Daily at 2 AM)

```sql
SELECT * FROM cleanup_old_sessions();
-- Deletes sessions revoked > 90 days ago
```

**Integration**: Add to data retention cleanup cron (Item 47)

```sql
-- Add to run_data_retention_cleanup() function
RETURN QUERY
SELECT
  'expired_sessions'::VARCHAR,
  cleaned_count,
  NOW() AS executed_at
FROM cleanup_expired_sessions();

RETURN QUERY
SELECT
  'old_sessions'::VARCHAR,
  deleted_count,
  NOW() AS executed_at
FROM cleanup_old_sessions();
```

---

## User Experience

### Mobile App UI

**Sessions Screen**:
```
Your Active Sessions

✓ This Device (Current)
iPhone 14 Pro • iOS 17.1
Active now
192.168.x.x

MacBook Pro • macOS 14.1
Active 2 hours ago
192.168.x.x
[Logout] button

iPad Air • iPadOS 17.1
Active 3 days ago
10.0.x.x
[Logout] button

[Logout from All Other Devices]
```

**Actions**:
- Tap device → Show details
- Tap [Logout] → Confirm → Revoke that session
- Tap [Logout from All] → Confirm → Revoke all except current

### Security Benefits for Users

1. **Lost Device Protection**
   - User loses phone
   - Logs in from new device
   - Remotely logs out lost phone
   - Data no longer accessible on lost phone

2. **Account Security Monitoring**
   - User sees unexpected session (e.g., unknown location)
   - Logs out that session immediately
   - Changes PIN/password
   - Checks audit logs

3. **Device Management**
   - User upgrades phone
   - Sees old phone still logged in
   - Logs out old device
   - Keeps sessions clean

---

## Analytics and Monitoring

### Metrics to Track

1. **Active Sessions per User**
   ```sql
   SELECT
     user_id,
     COUNT(*) as active_sessions
   FROM user_sessions
   WHERE revoked_at IS NULL
     AND expires_at > NOW()
   GROUP BY user_id
   ORDER BY active_sessions DESC;
   ```

2. **Session Duration Distribution**
   ```sql
   SELECT
     AGE(revoked_at, created_at) as session_duration,
     COUNT(*) as sessions
   FROM user_sessions
   WHERE revoked_at IS NOT NULL
   GROUP BY session_duration
   ORDER BY session_duration;
   ```

3. **Device Type Breakdown**
   ```sql
   SELECT
     device_info->>'deviceType' as device_type,
     COUNT(*) as sessions
   FROM user_sessions
   WHERE revoked_at IS NULL
   GROUP BY device_type;
   ```

4. **Remote Logout Frequency**
   ```sql
   SELECT
     DATE(revoked_at) as date,
     COUNT(*) FILTER (WHERE revoked_by = 'user') as user_logouts,
     COUNT(*) FILTER (WHERE revoked_by = 'system') as system_logouts
   FROM user_sessions
   WHERE revoked_at > NOW() - INTERVAL '30 days'
   GROUP BY DATE(revoked_at);
   ```

---

## Future Enhancements

### 1. Geolocation

Add IP-to-location lookup:
```json
{
  "location": {
    "city": "San Francisco",
    "region": "California",
    "country": "United States",
    "ipAddress": "192.168.x.x"
  }
}
```

**Service**: MaxMind GeoIP2, IP2Location, or ipapi.co

### 2. Trusted Devices

Mark frequently used devices as trusted:
```sql
ALTER TABLE user_sessions ADD COLUMN is_trusted BOOLEAN DEFAULT FALSE;
```

**Use Case**: Skip 2FA on trusted devices

### 3. Session Notifications

Notify users of new sessions:
- Push notification: "New login from MacBook Pro"
- Email: "New login detected from California"
- SMS: "Alert: New device logged in"

### 4. Concurrent Session Limits

Limit number of active sessions:
```sql
-- Before creating new session
SELECT COUNT(*) FROM user_sessions
WHERE user_id = p_user_id
  AND revoked_at IS NULL;

-- If count >= max_sessions, revoke oldest
```

### 5. Session Transfer

Transfer session between devices:
```sql
-- Update device_info for existing session
-- Useful for app reinstalls
```

---

## Related Items

- **Item 41**: RLS Policies (protects session data)
- **Item 16**: Audit Logging (logs session events)
- **Item 47**: Data Retention (cleanup old sessions)
- **Item 17**: Account Deletion (cascade delete sessions)

---

## Conclusion

**Item 49: COMPLETE** ✅

### Achievements

✅ Session tracking system implemented
✅ Active session viewing API created
✅ Remote logout functionality added
✅ Automatic expiration and cleanup
✅ RLS policies protect session data
✅ Audit logging for security events
✅ IP address masking for privacy
✅ Device information tracking
✅ Database functions for session management

### Security Features

- Session token uniqueness enforced
- Automatic expiration (30 days)
- Manual revocation (remote logout)
- RLS prevents session hijacking
- Audit trail for all revocations
- IP address privacy masking

### User Benefits

- View all logged-in devices
- Remote logout from lost devices
- Security monitoring
- Clean session management
- Peace of mind

**Security Status**: Production-ready with comprehensive session management.

---

**Next**: Item 44 - Add PII Encryption (MEDIUM)
