# Category 2: Backend API Enhancements - Complete Implementation Plan

**Status**: Ready to Execute
**Total Items**: 15 (Items 11-25)
**Estimated Effort**: 32 hours
**Priority**: Backend infrastructure hardening

---

## Overview

Category 2 focuses on enhancing the backend API with production-grade features including timezone handling, payment security, rate limiting, data validation, and comprehensive error handling. These enhancements transform the MVP backend into a production-ready, secure, and scalable system.

---

## Item 11: Implement Timezone Library for DST ⭐ CRITICAL
**Priority**: Critical
**Effort**: 3 hours
**Dependencies**: None

### Problem Statement
Current manual timezone offset calculations fail during Daylight Saving Time transitions, causing incorrect check-in deadline calculations.

### Implementation Plan
1. **Install moment-timezone library**
   - Add to backend dependencies
   - Update all timezone-related calculations

2. **Update Database Schema**
   - Ensure all timezone columns store IANA timezone names
   - Add validation for valid timezone names

3. **Replace Manual Calculations**
   - File: `src/services/api.ts` - Check-in deadline calculations
   - File: `supabase/functions/check-missed-checkins/index.ts` - Cron job
   - File: `src/services/notificationService.ts` - Reminder scheduling

4. **Test DST Transitions**
   - Spring forward: 2 AM → 3 AM (skip hour)
   - Fall back: 2 AM → 1 AM (repeat hour)
   - Test check-in times during transition

### Validation Tests
- Test check-in at 2:30 AM on DST spring forward day
- Test check-in at 1:30 AM on DST fall back day
- Verify deadlines calculate correctly across DST boundaries
- Test timezone conversions (PST → EST, etc.)

### Files to Modify
- `package.json` - Add moment-timezone
- `supabase/functions/check-missed-checkins/index.ts`
- `src/utils/timezone.ts` (new file)
- All API endpoints dealing with check-in times

---

## Item 12: Add Idempotency Keys for Payment Operations ⭐ HIGH
**Priority**: High
**Effort**: 2 hours
**Dependencies**: None

### Problem Statement
Duplicate payment requests (network retry, user double-tap) could create multiple subscriptions or charges.

### Implementation Plan
1. **Create idempotency_keys table**
   ```sql
   CREATE TABLE idempotency_keys (
     key VARCHAR(255) PRIMARY KEY,
     request_hash TEXT,
     response JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Add Middleware**
   - Accept `Idempotency-Key` header
   - Generate hash of request body
   - Check if key exists with same hash
   - Return cached response if exists
   - Store new key+response if successful

3. **Update Payment Endpoints**
   - `/api/payments/create-subscription` - Require idempotency key
   - `/api/payments/update-payment-method` - Require idempotency key
   - Stripe API calls - Use Stripe's idempotency key support

4. **TTL Cleanup**
   - Delete keys older than 24 hours (scheduled job)

### Validation Tests
- Send duplicate payment request with same key → Returns cached response
- Send duplicate with different body → Returns error (key mismatch)
- Send request without key → Generates UUID automatically
- Verify Stripe idempotency works correctly

### Files to Create/Modify
- `supabase/migrations/002_idempotency_keys.sql`
- `src/middleware/idempotency.ts` (new)
- `src/services/api.ts` - Payment endpoints

---

## Item 13: Implement Rate Limiting Middleware ⭐ HIGH
**Priority**: High
**Effort**: 3 hours
**Dependencies**: None

### Problem Statement
No protection against API abuse, brute force attacks, or excessive SMS costs from spam.

### Implementation Plan
1. **Install express-rate-limit**
   - Per-IP rate limiting
   - Per-user rate limiting (authenticated endpoints)

2. **Define Rate Limit Tiers**
   - Auth endpoints (login, verify code): 10/minute per IP
   - SMS endpoints (send code, invite): 5/minute per IP, 20/hour per user
   - Read endpoints (GET): 100/minute per user
   - Write endpoints (POST/PATCH): 30/minute per user
   - Check-in endpoint: 10/minute per member (prevent spam)

3. **Implement Middleware**
   ```typescript
   const rateLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 100,
     message: { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
   });
   ```

4. **Add Rate Limit Headers**
   - `X-RateLimit-Limit: 100`
   - `X-RateLimit-Remaining: 95`
   - `X-RateLimit-Reset: 1700000000`

5. **Database-backed Rate Limiting** (for distributed systems)
   - Use Redis or PostgreSQL to track counts across multiple servers

### Validation Tests
- Exceed rate limit → 429 status code
- Wait for window reset → Limit resets
- Different IPs have independent limits
- Authenticated users have user-specific limits

### Files to Create/Modify
- `src/middleware/rateLimiter.ts` (new)
- `src/index.ts` - Apply to routes
- All API endpoint files

---

## Item 14: Add Phone Number Normalization (E.164)
**Priority**: High
**Effort**: 2 hours
**Dependencies**: None

### Implementation Plan
1. **Install libphonenumber-js**
   - Parse and validate phone numbers
   - Format to E.164 standard

2. **Create Utility Functions**
   ```typescript
   function normalizePhone(phone: string, country: string = 'US'): string
   function validatePhone(phone: string, country: string = 'US'): boolean
   function formatPhoneDisplay(phone: string): string
   function maskPhone(phone: string): string
   ```

3. **Apply to All Inputs**
   - Signup: Normalize before storing
   - Login: Normalize before lookup
   - Member invite: Normalize recipient phone
   - SMS sending: Validate E.164 before Twilio call

4. **Database Validation**
   - Add CHECK constraint on phone format
   - Migrate existing data to E.164

### Validation Tests
- Input: "(555) 123-4567" → Output: "+15551234567"
- Input: "555-123-4567" → Output: "+15551234567"
- Input: "5551234567" → Output: "+15551234567"
- Input: "invalid" → Validation error

### Files to Modify
- `src/utils/phone.ts` (new)
- All auth endpoints
- Member/Contact endpoints

---

## Item 15: Implement PIN Strength Validation
**Priority**: Medium
**Effort**: 1 hour
**Dependencies**: None

### Implementation Plan
1. **Define PIN Rules**
   - Exactly 4 digits (0000-9999)
   - No sequential patterns (1234, 4321)
   - No repeated digits (1111, 2222)
   - No common PINs (1234, 0000, 1111, birthdays)

2. **Create Validator**
   ```typescript
   function validatePIN(pin: string): { valid: boolean; error?: string }
   ```

3. **Apply to Endpoints**
   - `/api/auth/create-account` - Validate on signup
   - `/api/auth/reset-pin` - Validate on PIN reset
   - Return user-friendly error messages

4. **Store Blacklist**
   - Top 100 common PINs in config
   - Check against blacklist

### Validation Tests
- "1234" → Rejected (sequential)
- "1111" → Rejected (repeated)
- "5749" → Accepted (random)
- "0000" → Rejected (common)

### Files to Create/Modify
- `src/utils/pinValidator.ts` (new)
- `src/services/api.ts` - Auth endpoints

---

## Item 16: Add Audit Logging for Critical Actions
**Priority**: High
**Effort**: 2 hours
**Dependencies**: None

### Implementation Plan
1. **Enhance audit_logs Table**
   - Already exists, ensure comprehensive usage

2. **Log Critical Actions**
   - User signup/login/logout
   - PIN changes
   - Payment method added/updated
   - Subscription created/canceled
   - Member invited/connected/removed
   - Check-in completed
   - Account deleted

3. **Include Context**
   - IP address
   - User agent
   - Timestamp
   - Action details (JSONB)

4. **Create Audit Service**
   ```typescript
   async function logAudit(
     userId: string,
     action: string,
     details: object,
     request: Request
   )
   ```

### Validation Tests
- Create user → Audit log entry exists
- Check-in → Audit log entry exists
- Query audit logs by user → Returns all actions
- Query by date range → Filtered correctly

### Files to Create/Modify
- `src/services/auditService.ts` (new)
- All API endpoint handlers

---

## Item 17: Implement Account Deletion Endpoint
**Priority**: High
**Effort**: 1.5 hours
**Dependencies**: None

### Implementation Plan
1. **Create DELETE /api/users/me/account Endpoint**
   - Soft delete (set deleted_at timestamp)
   - Hard delete after 30 days (scheduled job)

2. **Cascading Delete Logic**
   - Cancel Stripe subscription immediately
   - Delete all member_contact_relationships
   - Delete all check-ins
   - Delete all notifications
   - Remove FCM tokens
   - Clear audit logs after 90 days

3. **Confirmation Required**
   - Require PIN verification before deletion
   - Send confirmation email/SMS
   - 24-hour grace period before soft delete activates

4. **GDPR Compliance**
   - Export all user data before deletion
   - Provide download link
   - Permanent deletion after 30 days

### Validation Tests
- Delete account → Status changes to deleted
- Try to login → Account not found
- Check Stripe → Subscription canceled
- Wait 30 days (simulate) → Hard delete executed

### Files to Create/Modify
- `src/services/api.ts` - Add DELETE endpoint
- `supabase/functions/cleanup-deleted-accounts/index.ts` (new cron)

---

## Item 18: Add Comprehensive Input Sanitization
**Priority**: High
**Effort**: 2 hours
**Dependencies**: None

### Implementation Plan
1. **Install validator.js**
   - String validation and sanitization

2. **Create Sanitization Middleware**
   - Trim whitespace
   - Escape HTML
   - Remove null bytes
   - Validate lengths

3. **Apply to All Inputs**
   - Name fields: Max 255 chars, trim, escape HTML
   - Phone: Already handled by phone normalization
   - PIN: Exactly 4 digits, no sanitization needed
   - Invite codes: Uppercase, alphanumeric only

4. **Prevent SQL Injection**
   - Use parameterized queries (already doing)
   - Validate all input types

5. **Prevent XSS**
   - Escape all user-generated content
   - Content Security Policy headers

### Validation Tests
- Input: "  Name  " → "Name"
- Input: "<script>alert('xss')</script>" → Escaped or rejected
- Input: "Name\x00" → Null byte removed
- SQL injection attempts → Safely handled

### Files to Create/Modify
- `src/middleware/sanitize.ts` (new)
- Apply to all endpoints

---

## Item 19: Standardize Error Response Format
**Priority**: Medium
**Effort**: 1.5 hours
**Dependencies**: None

### Implementation Plan
1. **Define Error Response Schema**
   ```typescript
   interface ErrorResponse {
     success: false;
     error: string; // ERROR_CODE
     message: string; // Human-readable
     details?: object; // Optional context
     timestamp: string;
     path: string;
   }
   ```

2. **Create Error Handler Middleware**
   - Catch all errors
   - Format consistently
   - Log to Sentry
   - Return appropriate status code

3. **Define Error Codes**
   - VALIDATION_ERROR (400)
   - UNAUTHORIZED (401)
   - FORBIDDEN (403)
   - NOT_FOUND (404)
   - RATE_LIMIT_EXCEEDED (429)
   - INTERNAL_ERROR (500)

4. **Custom Error Classes**
   ```typescript
   class ValidationError extends Error
   class UnauthorizedError extends Error
   class NotFoundError extends Error
   ```

### Validation Tests
- Trigger validation error → Consistent format returned
- Trigger 500 error → Logged to Sentry, generic message returned
- All endpoints return consistent error structure

### Files to Create/Modify
- `src/middleware/errorHandler.ts` (new)
- `src/utils/errors.ts` (new - custom error classes)
- Apply to all endpoints

---

## Item 20: Add Request Validation Middleware
**Priority**: High
**Effort**: 2 hours
**Dependencies**: None

### Implementation Plan
1. **Install Joi or Yup**
   - Schema-based validation

2. **Define Request Schemas**
   ```typescript
   const createAccountSchema = {
     phone: Joi.string().pattern(/^\+1\d{10}$/).required(),
     pin: Joi.string().length(4).pattern(/^\d{4}$/).required(),
     pin_confirmation: Joi.string().valid(Joi.ref('pin')).required()
   };
   ```

3. **Create Validation Middleware**
   ```typescript
   function validateRequest(schema: Schema) {
     return (req, res, next) => {
       const { error } = schema.validate(req.body);
       if (error) return res.status(400).json({...});
       next();
     };
   }
   ```

4. **Apply to All Endpoints**
   - Auth: Phone, PIN, codes
   - Members: Name, phone, check-in time
   - Payments: Payment method ID
   - Check-ins: Timezone

### Validation Tests
- Valid request → Passes validation
- Missing required field → 400 error with field name
- Invalid type → 400 error with type mismatch
- Extra fields → Stripped or rejected

### Files to Create/Modify
- `src/middleware/validation.ts` (new)
- `src/schemas/` (new directory for all schemas)
- Apply to all endpoints

---

## Item 21: Implement Health Check Endpoint
**Priority**: Medium
**Effort**: 1 hour
**Dependencies**: None

### Implementation Plan
1. **Create GET /health Endpoint**
   - Returns 200 OK if healthy
   - Checks database connection
   - Checks external services (Stripe, Twilio)
   - Returns status object

2. **Response Format**
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-11-20T10:00:00Z",
     "uptime": 86400,
     "checks": {
       "database": "healthy",
       "stripe": "healthy",
       "twilio": "healthy"
     }
   }
   ```

3. **Unhealthy States**
   - Database unreachable → 503 Service Unavailable
   - External service down → Warning in response, still 200

4. **Use for Monitoring**
   - Railway/Render health checks
   - Uptime monitoring services

### Validation Tests
- GET /health → 200 OK
- Database down (simulate) → 503 error
- Response includes all required fields

### Files to Create
- `src/routes/health.ts` (new)

---

## Item 22: Add Logging Infrastructure
**Priority**: Medium
**Effort**: 2 hours
**Dependencies**: None

### Implementation Plan
1. **Install Winston or Pino**
   - Structured logging
   - Multiple log levels
   - File rotation

2. **Configure Log Levels**
   - error: Errors that need attention
   - warn: Warnings
   - info: General info (startup, shutdown)
   - debug: Debugging info (dev only)

3. **Log Key Events**
   - API requests (method, path, status, duration)
   - Database queries (slow query log)
   - External API calls (Stripe, Twilio)
   - Errors and exceptions

4. **Sensitive Data Redaction**
   - Never log PINs
   - Mask phone numbers in logs
   - Redact payment info

5. **Log Storage**
   - Development: Console
   - Production: File + Sentry

### Validation Tests
- Log entry created for API request
- Sensitive data is masked
- Log files rotate properly
- Logs sent to Sentry on error

### Files to Create/Modify
- `src/utils/logger.ts` (new)
- Apply to all files

---

## Item 23: Database Connection Pooling
**Priority**: Medium
**Effort**: 1 hour
**Dependencies**: None

### Implementation Plan
1. **Configure Supabase Client**
   - Set max connections
   - Set connection timeout
   - Enable keepalive

2. **Connection Pool Settings**
   ```typescript
   const supabase = createClient(url, key, {
     db: {
       schema: 'public'
     },
     auth: {
       persistSession: false
     },
     global: {
       headers: { 'x-application-name': 'pruuf-api' }
     }
   });
   ```

3. **Handle Connection Errors**
   - Retry with exponential backoff
   - Log connection pool exhaustion
   - Monitor active connections

### Validation Tests
- Multiple concurrent requests → Pool handles correctly
- Connection timeout → Retries
- Pool exhaustion → Error logged

### Files to Modify
- `src/config/supabase.ts`

---

## Item 24: Implement Webhook Signature Verification
**Priority**: Critical
**Effort**: 1.5 hours
**Dependencies**: None

### Implementation Plan
1. **Stripe Webhook Verification**
   - Verify `Stripe-Signature` header
   - Use webhook secret
   - Reject invalid signatures

2. **Twilio Webhook Verification**
   - Verify `X-Twilio-Signature` header
   - Use auth token
   - Reject invalid signatures

3. **Middleware**
   ```typescript
   function verifyStripeSignature(req, res, next) {
     const sig = req.headers['stripe-signature'];
     try {
       stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
       next();
     } catch (err) {
       return res.status(400).send('Invalid signature');
     }
   }
   ```

4. **Apply to Webhook Endpoints**
   - `/api/stripe-webhooks/webhook`
   - `/api/twilio-webhooks/sms-status`

### Validation Tests
- Valid signature → Webhook processed
- Invalid signature → 400 error, webhook rejected
- Missing signature → 400 error
- Replay attack (old timestamp) → Rejected

### Files to Create/Modify
- `src/middleware/webhookVerification.ts` (new)
- Apply to webhook routes

---

## Item 25: Add Database Indexes for Performance
**Priority**: Medium
**Effort**: 1.5 hours
**Dependencies**: None

### Implementation Plan
1. **Identify Slow Queries**
   - Check-in lookups by member_id + date
   - User lookups by phone
   - Relationship lookups by invite_code
   - Missed check-in queries (cron job)

2. **Add Missing Indexes**
   ```sql
   CREATE INDEX idx_checkins_member_date ON check_ins(member_id, checked_in_at DESC);
   CREATE INDEX idx_users_phone ON users(phone);
   CREATE INDEX idx_relationships_invite ON member_contact_relationships(invite_code);
   CREATE INDEX idx_members_checkin_time ON members(check_in_time, timezone);
   ```

3. **Composite Indexes**
   - For queries with multiple WHERE conditions
   - For ORDER BY + WHERE combinations

4. **Monitor Query Performance**
   - Enable Supabase slow query log
   - Track query execution times
   - Identify missing indexes

### Validation Tests
- Run EXPLAIN on slow queries → Uses index
- Check query execution time before/after
- Verify index is used in production

### Files to Create
- `supabase/migrations/003_performance_indexes.sql`

---

## Implementation Order

### Week 1: Critical Infrastructure (Items 11, 12, 13, 24)
1. Item 11: Timezone library (CRITICAL for check-ins)
2. Item 24: Webhook verification (CRITICAL for security)
3. Item 12: Idempotency keys (HIGH - payment safety)
4. Item 13: Rate limiting (HIGH - API protection)

### Week 2: Data Validation & Security (Items 14, 15, 18, 20)
5. Item 14: Phone normalization
6. Item 15: PIN validation
7. Item 18: Input sanitization
8. Item 20: Request validation

### Week 3: Error Handling & Observability (Items 16, 19, 21, 22)
9. Item 16: Audit logging
10. Item 19: Error response standardization
11. Item 21: Health check endpoint
12. Item 22: Logging infrastructure

### Week 4: Performance & Features (Items 17, 23, 25)
13. Item 17: Account deletion
14. Item 23: Connection pooling
15. Item 25: Database indexes

---

## Success Criteria

**Functionality**:
- All 15 items implemented and tested
- All validation tests pass
- No errors in production environment

**Performance**:
- API p95 latency <500ms
- Database queries use indexes
- Connection pool handles 100+ concurrent requests

**Security**:
- All webhooks verified
- Rate limiting prevents abuse
- Input sanitized and validated
- Audit trail for critical actions

**Maintainability**:
- Consistent error responses
- Comprehensive logging
- Health checks for monitoring
- Documentation for all endpoints

---

## Testing Strategy

Each item includes:
1. **Unit tests**: Test individual functions
2. **Integration tests**: Test API endpoints end-to-end
3. **Edge case tests**: Test failure scenarios
4. **Performance tests**: Measure query times, throughput

---

**Total Estimated Effort**: 32 hours (2-3 weeks for 1 developer)

**Next Step**: Begin implementation with Item 11 (Timezone library)
