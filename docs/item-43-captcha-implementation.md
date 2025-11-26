# Item 43: CAPTCHA on Auth Endpoints - COMPLETE

**Priority**: LOW
**Status**: ✅ COMPLETE
**Completion Date**: 2025-11-20

---

## Summary

Implemented Google reCAPTCHA v3 integration on authentication endpoints to protect against bot attacks, automated abuse, and spam account creation. CAPTCHA verification is now required for sending verification codes and logging in, with score-based bot detection and configurable thresholds.

---

## Implementation

### 1. CAPTCHA Verification Module

**File**: `/supabase/functions/_shared/captcha.ts`

**Features**:
- Google reCAPTCHA v3 integration
- Score-based verification (0.0 = bot, 1.0 = human)
- Action verification (optional)
- IP address extraction
- Environment-based configuration
- Graceful degradation (can be disabled for development)

**Functions**:

```typescript
// Verify CAPTCHA token (returns boolean)
export async function verifyCaptcha(
  token: string | null | undefined,
  req: Request,
  expectedAction?: string
): Promise<boolean>

// Verify CAPTCHA and throw if invalid (convenience wrapper)
export async function requireCaptcha(
  token: string | null | undefined,
  req: Request,
  action?: string
): Promise<void>

// Check if CAPTCHA is enabled
export function isCaptchaEnabled(): boolean

// Get CAPTCHA config for client
export function getCaptchaConfig(): {
  enabled: boolean;
  siteKey: string | null;
}
```

### 2. Environment Variables

**Required**:
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA secret key (server-side)
- `RECAPTCHA_SITE_KEY` - Google reCAPTCHA site key (client-side)

**Optional**:
- `RECAPTCHA_MIN_SCORE` - Minimum score threshold (default: 0.5)
- `CAPTCHA_ENABLED` - Enable/disable CAPTCHA (default: true)

**Generate Keys**:
1. Go to https://www.google.com/recaptcha/admin
2. Register a new site with reCAPTCHA v3
3. Get site key and secret key
4. Add to environment variables

### 3. Integration Points

#### Send Verification Code Endpoint

**File**: `/supabase/functions/auth/send-verification-code/index.ts`

**Integration**:
```typescript
import { requireCaptcha } from '../../_shared/captcha.ts';

// After parsing body
const { phone, country_code, recaptcha_token } = body;

// Verify CAPTCHA (protects against bot attacks)
await requireCaptcha(recaptcha_token, req, 'send_verification_code');
```

**Why**: Prevents bots from spamming SMS verification codes, which costs money and can be used for abuse.

#### Login Endpoint

**File**: `/supabase/functions/auth/login/index.ts`

**Integration**:
```typescript
import { requireCaptcha } from '../../_shared/captcha.ts';

// After parsing body
const { phone, pin, recaptcha_token } = body;

// Verify CAPTCHA (optional layer - protects against brute-force bot attacks)
await requireCaptcha(recaptcha_token, req, 'login');
```

**Why**: Additional layer of protection against automated brute-force PIN attacks. Works alongside rate limiting and account locking.

---

## How It Works

### 1. Client-Side Flow

```
User initiates action (send code / login)
↓
Client loads reCAPTCHA v3 JavaScript
↓
reCAPTCHA observes user behavior (mouse movements, clicks, etc.)
↓
Client executes reCAPTCHA action:
  grecaptcha.execute('SITE_KEY', { action: 'send_verification_code' })
↓
reCAPTCHA returns token
↓
Client sends request with token:
  POST /api/auth/send-verification-code
  {
    phone: '+1234567890',
    recaptcha_token: 'token-from-google'
  }
```

### 2. Server-Side Verification

```
Backend receives request
↓
Extract recaptcha_token from body
↓
Call requireCaptcha(recaptcha_token, req, action)
↓
verifyCaptcha() calls Google API:
  POST https://www.google.com/recaptcha/api/siteverify
  {
    secret: RECAPTCHA_SECRET,
    response: recaptcha_token,
    remoteip: client_ip
  }
↓
Google returns:
  {
    success: true/false,
    score: 0.0-1.0,  // v3 only
    action: 'send_verification_code',
    challenge_ts: '2025-11-20T10:00:00Z',
    hostname: 'yourdomain.com'
  }
↓
Verify:
  ✓ success === true
  ✓ score >= 0.5 (configurable)
  ✓ action matches expected action
↓
If valid: continue with request
If invalid: throw ApiError (400)
```

---

## Score Interpretation

reCAPTCHA v3 returns a score from 0.0 to 1.0:

| Score Range | Interpretation | Action |
|-------------|---------------|--------|
| 0.9 - 1.0 | Very likely human | ✅ Allow |
| 0.7 - 0.9 | Likely human | ✅ Allow |
| 0.5 - 0.7 | Neutral | ✅ Allow (default threshold) |
| 0.3 - 0.5 | Suspicious | ❌ Block |
| 0.0 - 0.3 | Very likely bot | ❌ Block |

**Default Threshold**: 0.5 (configurable via `RECAPTCHA_MIN_SCORE`)

**Recommendations**:
- **Strict** (0.7+): Fewer bots, but may block some humans
- **Balanced** (0.5): Good trade-off (default)
- **Lenient** (0.3): More humans pass, but more bots too

---

## Configuration

### Development Mode

```bash
# Disable CAPTCHA for local development
CAPTCHA_ENABLED=false
```

When disabled:
- `verifyCaptcha()` always returns `true`
- No API calls to Google
- Useful for testing without CAPTCHA tokens

### Production Mode

```bash
# Enable CAPTCHA
CAPTCHA_ENABLED=true

# Google reCAPTCHA keys
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# Minimum score (0.0-1.0)
RECAPTCHA_MIN_SCORE=0.5
```

---

## Client Integration

### React Native

```typescript
import { WebView } from 'react-native-webview';

// 1. Load reCAPTCHA in WebView
const webViewHtml = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}"></script>
</head>
<body>
  <script>
    grecaptcha.ready(function() {
      grecaptcha.execute('${RECAPTCHA_SITE_KEY}', { action: 'send_verification_code' })
        .then(function(token) {
          window.ReactNativeWebView.postMessage(token);
        });
    });
  </script>
</body>
</html>
`;

// 2. Handle token in React Native
const handleMessage = (event) => {
  const recaptchaToken = event.nativeEvent.data;

  // 3. Send request with token
  fetch('/api/auth/send-verification-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+1234567890',
      recaptcha_token: recaptchaToken
    })
  });
};

<WebView
  source={{ html: webViewHtml }}
  onMessage={handleMessage}
/>
```

### Web (Next.js / React)

```typescript
import { useEffect, useState } from 'react';

// 1. Load reCAPTCHA script
useEffect(() => {
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  document.head.appendChild(script);
}, []);

// 2. Execute CAPTCHA on form submit
const handleSendCode = async (phone: string) => {
  // Get reCAPTCHA token
  const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {
    action: 'send_verification_code'
  });

  // Send request with token
  const response = await fetch('/api/auth/send-verification-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      recaptcha_token: token
    })
  });
};
```

---

## Error Handling

### CAPTCHA Verification Failed

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "CAPTCHA verification failed. Please try again.",
    "code": "VALIDATION_ERROR",
    "status": 400
  }
}
```

**Causes**:
1. No token provided
2. Invalid token
3. Token expired (tokens are single-use)
4. Score below threshold (likely bot)
5. Action mismatch
6. Network error calling Google API

**Client Handling**:
```typescript
try {
  await sendVerificationCode(phone, recaptchaToken);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR' && error.message.includes('CAPTCHA')) {
    // Regenerate CAPTCHA token and retry
    const newToken = await grecaptcha.execute(SITE_KEY, { action: 'send_verification_code' });
    await sendVerificationCode(phone, newToken);
  }
}
```

### CAPTCHA Not Configured

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "CAPTCHA verification not configured",
    "code": "INTERNAL_ERROR",
    "status": 500
  }
}
```

**Cause**: `RECAPTCHA_SECRET_KEY` not set in environment

**Fix**: Add secret key to environment variables

---

## Security Features

### 1. Token Single-Use

reCAPTCHA tokens are single-use and expire after verification. This prevents replay attacks.

### 2. Timestamp Validation

Google includes `challenge_ts` in response to prevent token reuse over time.

### 3. IP Address Verification

Server sends client IP to Google for additional verification and fraud detection.

```typescript
const remoteIp = req.headers.get('X-Forwarded-For')?.split(',')[0].trim()
  || req.headers.get('X-Real-IP')
  || 'unknown';
```

### 4. Action Verification

Ensures token was generated for the specific action (e.g., 'login' vs 'send_verification_code'):

```typescript
if (expectedAction && data.action !== expectedAction) {
  console.warn(`[CAPTCHA] Action mismatch: ${data.action} !== ${expectedAction}`);
  return false;
}
```

Prevents token reuse across different endpoints.

### 5. Domain Verification

Google verifies the token was generated for your registered domain, preventing cross-site token theft.

---

## Testing

### Unit Tests

**File**: `/tests/item-43-captcha-verification.test.ts`

**Coverage**: 37 tests covering:
- ✅ CAPTCHA disabled mode
- ✅ Token validation (null, undefined, empty)
- ✅ Secret key validation
- ✅ Google API parameter construction
- ✅ IP address extraction (X-Forwarded-For, X-Real-IP)
- ✅ Verification success/failure
- ✅ Score threshold validation
- ✅ Action matching
- ✅ API error handling
- ✅ Network error handling
- ✅ reCAPTCHA v2 compatibility (no score)
- ✅ requireCaptcha() wrapper
- ✅ Configuration functions
- ✅ Integration scenarios

**Run Tests**:
```bash
npm test -- tests/item-43-captcha-verification.test.ts
```

**Result**: ✅ 37/37 tests passing

### Manual Testing

#### 1. Test with Valid Token

```bash
# 1. Get reCAPTCHA token from client
TOKEN="03AGdBq24..." # From grecaptcha.execute()

# 2. Send request with token
curl -X POST http://localhost:54321/functions/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "recaptcha_token": "'$TOKEN'"
  }'

# Expected: 200 OK
```

#### 2. Test with No Token

```bash
curl -X POST http://localhost:54321/functions/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890"
  }'

# Expected: 400 Bad Request - "CAPTCHA verification failed"
```

#### 3. Test with CAPTCHA Disabled

```bash
# Set environment
CAPTCHA_ENABLED=false

# Send request without token
curl -X POST http://localhost:54321/functions/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890"
  }'

# Expected: 200 OK (CAPTCHA bypassed)
```

---

## Performance Impact

### Latency Added

- **Google API call**: ~100-300ms
- **Token verification**: Minimal (<10ms)
- **Total overhead**: ~110-310ms per request

**Mitigation**: This is acceptable for authentication endpoints, as security is prioritized over speed.

### Request Volume

- Each protected endpoint makes 1 API call to Google per request
- Google reCAPTCHA v3: **1 million assessments/month free**, then $1 per 1,000 assessments

**Cost Estimation**:
- 10,000 users × 2 requests/day = 20,000 requests/day = 600,000/month
- Free tier covers up to ~33,000 requests/day
- Beyond that: ~$0.60 per 1,000 requests

---

## Monitoring and Analytics

### Google reCAPTCHA Admin Console

Dashboard: https://www.google.com/recaptcha/admin

**Metrics Available**:
- Requests per day
- Score distribution
- Top actions
- Suspicious activity detection
- Domain verification issues

### Application Logs

CAPTCHA operations are logged:

```
[CAPTCHA] Verification disabled in environment
[CAPTCHA] No token provided
[CAPTCHA] RECAPTCHA_SECRET_KEY not configured
[CAPTCHA] Verification API error: 500
[CAPTCHA] Verification failed: ['invalid-input-response']
[CAPTCHA] Score too low: 0.3 < 0.5
[CAPTCHA] Action mismatch: signup !== login
[CAPTCHA] Verification successful (score: 0.9, action: login)
```

**Monitoring Queries**:

```sql
-- Check CAPTCHA failure rate
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE metadata->>'captcha_failed' = 'true') as captcha_failures,
  COUNT(*) as total_attempts,
  ROUND(
    COUNT(*) FILTER (WHERE metadata->>'captcha_failed' = 'true')::NUMERIC /
    COUNT(*)::NUMERIC * 100,
    2
  ) as failure_rate_percent
FROM audit_logs
WHERE action IN ('send_verification_code', 'login')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Troubleshooting

### Issue: "CAPTCHA verification not configured"

**Cause**: `RECAPTCHA_SECRET_KEY` environment variable not set

**Fix**:
```bash
# Add to .env or Supabase secrets
RECAPTCHA_SECRET_KEY=6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

### Issue: All requests failing with low scores

**Cause**: Using test keys in production, or bot traffic

**Fix**:
1. Verify you're using production keys (not test keys)
2. Check Google reCAPTCHA console for suspicious activity
3. Adjust `RECAPTCHA_MIN_SCORE` threshold if needed

### Issue: Legitimate users being blocked

**Cause**: Score threshold too strict

**Fix**:
```bash
# Lower the threshold (e.g., from 0.5 to 0.3)
RECAPTCHA_MIN_SCORE=0.3
```

### Issue: CAPTCHA working in browser but not mobile app

**Cause**: Mobile app not properly loading reCAPTCHA JavaScript

**Fix**: Use WebView or native reCAPTCHA SDK for mobile:
- iOS: ReCaptcha SDK for iOS
- Android: SafetyNet reCAPTCHA API
- React Native: WebView with reCAPTCHA embed (as shown above)

---

## Best Practices

### 1. Don't Require CAPTCHA on Every Action

**Do**:
- ✅ Require on send verification code (prevents SMS spam)
- ✅ Require on login (prevents brute-force)
- ✅ Require on account creation

**Don't**:
- ❌ Require on profile updates (authenticated users)
- ❌ Require on viewing data (read-only)
- ❌ Require on every API call (poor UX)

### 2. Use Appropriate Actions

```typescript
// Good - specific actions
await requireCaptcha(token, req, 'send_verification_code');
await requireCaptcha(token, req, 'login');
await requireCaptcha(token, req, 'create_account');

// Bad - generic action
await requireCaptcha(token, req, 'submit'); // Not descriptive
```

### 3. Handle Errors Gracefully

```typescript
try {
  await requireCaptcha(recaptcha_token, req, 'login');
} catch (error) {
  // Log for monitoring
  console.error('[AUTH] CAPTCHA verification failed:', error);

  // Return user-friendly error
  throw new ApiError(
    'Verification failed. Please refresh and try again.',
    400,
    ErrorCodes.VALIDATION_ERROR
  );
}
```

### 4. Monitor Score Distribution

Regularly check score distribution in Google Console:
- If most scores are < 0.3: High bot traffic → investigate
- If most scores are > 0.9: Mostly human → good
- If scores cluster around threshold: Adjust threshold

---

## Future Enhancements

### 1. Adaptive Thresholds

Dynamically adjust score threshold based on risk:

```typescript
let minScore = 0.5;

// Stricter threshold for high-risk actions
if (user.failed_login_attempts > 3) {
  minScore = 0.7; // Require higher confidence
}

// Stricter for suspicious IPs
if (isIpBlacklisted(remoteIp)) {
  minScore = 0.8;
}

if (data.score < minScore) {
  return false;
}
```

### 2. Invisible CAPTCHA Challenges

For borderline scores (0.4-0.6), show interactive CAPTCHA:

```typescript
if (data.score >= 0.3 && data.score < 0.6) {
  // Trigger interactive CAPTCHA (checkbox or image selection)
  return { requireInteractiveCaptcha: true };
}
```

### 3. CAPTCHA Analytics

Track and analyze CAPTCHA metrics:

```sql
CREATE TABLE captcha_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  score DECIMAL(3, 2),
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyze score distribution
SELECT
  action,
  AVG(score) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score,
  COUNT(*) as total_verifications,
  COUNT(*) FILTER (WHERE success = false) as failures
FROM captcha_verifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action;
```

### 4. Fallback Mechanisms

If Google reCAPTCHA is unavailable:

```typescript
try {
  const response = await fetch(RECAPTCHA_VERIFY_URL, { ... });
  // ...
} catch (error) {
  console.error('[CAPTCHA] Google API unavailable:', error);

  // Fallback: Use rate limiting only
  return checkRateLimit(req);

  // Or: Allow with warning
  console.warn('[CAPTCHA] Allowing request due to API failure');
  return true;
}
```

---

## Related Items

- **Item 15**: Rate Limiting (complements CAPTCHA)
- **Item 16**: Audit Logging (logs CAPTCHA failures)
- **Item 42**: Security Headers (defense in depth)
- **Item 50**: Input Sanitization (protects against XSS)

---

## Conclusion

**Item 43: COMPLETE** ✅

### Achievements

✅ Google reCAPTCHA v3 integration
✅ Score-based bot detection
✅ Integrated into send-verification-code endpoint
✅ Integrated into login endpoint
✅ Environment-based configuration
✅ Comprehensive error handling
✅ 37/37 unit tests passing
✅ IP address extraction and verification
✅ Action verification
✅ Development mode (CAPTCHA bypass)
✅ Documentation complete

### Security Posture

**Protection Against**:
- ✅ Bot attacks on SMS endpoints (prevents cost abuse)
- ✅ Automated account creation
- ✅ Brute-force login attempts
- ✅ Credential stuffing
- ✅ Spam and abuse

**Layered Security**:
1. CAPTCHA (bot detection)
2. Rate limiting (request throttling)
3. Account locking (failed attempts)
4. Audit logging (monitoring)

### Production Readiness

- ✅ Environment variable configuration
- ✅ Graceful degradation (can be disabled)
- ✅ Error handling and logging
- ✅ Client integration examples
- ✅ Monitoring and analytics guidance
- ✅ Performance impact documented
- ✅ Cost estimation provided

**Status**: Production-ready with comprehensive bot protection.

---

**Next**: Item 45 - Implement Certificate Pinning (LOW)
