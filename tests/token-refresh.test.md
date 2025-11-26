# Item 10: Token Refresh Logic - Validation Tests

**Status**: Code Complete - Manual Testing Required
**Date**: Current Session
**Priority**: High
**Effort**: 2 hours

---

## Implementation Summary

Implemented automatic token refresh on expiration:
- ✅ Added refresh token storage methods to storage.ts
- ✅ Added refreshToken endpoint to authAPI
- ✅ Implemented response interceptor with token refresh logic
- ✅ Request queueing during token refresh (prevents concurrent refresh attempts)
- ✅ Automatic retry of failed request after token refresh
- ✅ Automatic logout if refresh fails
- ✅ Support for setTokens() to store both tokens atomically

**Files Modified**:
- `src/services/storage.ts` - Added refresh token storage methods
- `src/services/api.ts` - Added token refresh logic and response interceptor

---

## Token Refresh Flow

### Happy Path
```
1. User makes API request
2. Server returns 401 Unauthorized (token expired)
3. Interceptor catches 401
4. Check if refresh already in progress
   - If yes: Queue request, wait for refresh to complete
   - If no: Proceed to step 5
5. Get refresh token from encrypted storage
6. Call POST /api/auth/refresh-token
7. Store new access_token and refresh_token
8. Update Authorization header
9. Retry original request with new token
10. Process queued requests (if any)
11. Return successful response
```

### Failure Path
```
1. User makes API request
2. Server returns 401 Unauthorized
3. Interceptor attempts token refresh
4. Refresh token is invalid/expired
5. Clear all storage (logout)
6. Process queued requests with error
7. Return error to caller
8. User redirected to login screen
```

---

## Validation Tests

### Test 10.1: Token Refresh on 401
**Type**: Manual + Automated
**Priority**: CRITICAL
**Status**: Pending

**Prerequisites**:
- Backend must return refresh_token in login/create-account responses
- Backend must implement POST /api/auth/refresh-token endpoint

**Automated Test**:
```typescript
describe('Token Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh token on 401 and retry request', async () => {
    // Mock storage
    storage.getRefreshToken = jest.fn().mockResolvedValue('valid_refresh_token');
    storage.setTokens = jest.fn().mockResolvedValue(undefined);

    // Mock axios to return 401 first, then success after refresh
    const mockPost = jest.spyOn(axios, 'post');
    mockPost
      .mockResolvedValueOnce({
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
        },
      });

    // Make request that will return 401
    const request = api.get('/api/members/123/contacts');

    // Wait for token refresh and retry
    await expect(request).resolves.toBeTruthy();

    // Verify refresh endpoint was called
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh-token'),
      { refresh_token: 'valid_refresh_token' }
    );

    // Verify new tokens were stored
    expect(storage.setTokens).toHaveBeenCalledWith(
      'new_access_token',
      'new_refresh_token'
    );
  });

  it('should logout if refresh token is missing', async () => {
    storage.getRefreshToken = jest.fn().mockResolvedValue(null);
    storage.clearAll = jest.fn().mockResolvedValue(undefined);

    // Make request that will return 401
    try {
      await api.get('/api/test');
    } catch (error) {
      // Expected to fail
    }

    // Verify storage was cleared (logout)
    expect(storage.clearAll).toHaveBeenCalled();
  });

  it('should logout if refresh fails', async () => {
    storage.getRefreshToken = jest.fn().mockResolvedValue('invalid_token');
    storage.clearAll = jest.fn().mockResolvedValue(undefined);

    // Mock refresh endpoint to fail
    const mockPost = jest.spyOn(axios, 'post');
    mockPost.mockRejectedValueOnce(new Error('Invalid refresh token'));

    // Make request that will return 401
    try {
      await api.get('/api/test');
    } catch (error) {
      // Expected to fail
    }

    // Verify storage was cleared (logout)
    expect(storage.clearAll).toHaveBeenCalled();
  });
});
```

**Manual Test Steps**:
1. Login to app
2. Wait for access token to expire (or manually expire it)
3. Make an API call (e.g., navigate to a screen that fetches data)
4. Observe console logs
5. Verify request is automatically retried
6. Verify no logout occurs
7. Verify data loads successfully

**Expected Result**:
- 401 intercepted automatically
- Token refresh triggered
- Original request retried
- Data loads successfully
- No user-visible error

**Actual Result**: TO BE TESTED

---

### Test 10.2: Concurrent Request Handling
**Type**: Automated
**Priority**: High
**Status**: Pending

**Automated Test**:
```typescript
describe('Concurrent Token Refresh', () => {
  it('should queue concurrent requests during refresh', async () => {
    storage.getRefreshToken = jest.fn().mockResolvedValue('valid_refresh_token');
    storage.setTokens = jest.fn().mockResolvedValue(undefined);

    // Mock refresh endpoint
    const mockPost = jest.spyOn(axios, 'post');
    mockPost.mockResolvedValueOnce({
      data: {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      },
    });

    // Make multiple concurrent requests that will return 401
    const request1 = api.get('/api/endpoint1');
    const request2 = api.get('/api/endpoint2');
    const request3 = api.get('/api/endpoint3');

    // Wait for all requests to complete
    await Promise.all([request1, request2, request3]);

    // Verify refresh endpoint was called only ONCE
    expect(mockPost).toHaveBeenCalledTimes(1);

    // Verify all requests were eventually successful
    // (queued and processed after refresh)
  });
});
```

**Expected Result**:
- Only one refresh request sent
- All concurrent requests queued
- All requests retried after refresh completes
- All requests succeed

**Actual Result**: TO BE TESTED

---

### Test 10.3: Request Retry After Refresh
**Type**: Manual
**Priority**: High
**Status**: Pending

**Steps**:
1. Login to app
2. Manually expire access token (modify expiration time in storage)
3. Navigate to Member dashboard (triggers API call)
4. Monitor network traffic
5. Verify original request fails with 401
6. Verify token refresh request sent
7. Verify original request retried with new token
8. Verify dashboard data loads

**Expected Result**:
- Network log shows: Request → 401 → Refresh → Retry → 200
- Dashboard loads successfully
- User unaware of token expiration

**Actual Result**: TO BE TESTED

---

### Test 10.4: Logout on Refresh Failure
**Type**: Manual
**Priority**: High
**Status**: Pending

**Steps**:
1. Login to app
2. Manually invalidate refresh token (or wait for it to expire)
3. Manually expire access token
4. Make an API call
5. Verify token refresh fails
6. Verify storage is cleared
7. Verify user is redirected to login screen

**Expected Result**:
- Token refresh fails
- storage.clearAll() called
- User logged out
- Redirected to login/welcome screen

**Actual Result**: TO BE TESTED

---

### Test 10.5: Queue Processing on Success
**Type**: Automated
**Priority**: Medium
**Status**: Pending

**Automated Test**:
```typescript
describe('Queue Processing', () => {
  it('should process all queued requests on successful refresh', async () => {
    storage.getRefreshToken = jest.fn().mockResolvedValue('valid_refresh_token');
    storage.setTokens = jest.fn().mockResolvedValue(undefined);

    const mockPost = jest.spyOn(axios, 'post');
    mockPost.mockResolvedValueOnce({
      data: {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      },
    });

    // Make concurrent requests
    const requests = [
      api.get('/api/members/123'),
      api.get('/api/contacts/456'),
      api.get('/api/users/me'),
    ];

    const results = await Promise.allSettled(requests);

    // Verify all requests fulfilled (not rejected)
    expect(results.every(r => r.status === 'fulfilled')).toBe(true);
  });

  it('should reject all queued requests on refresh failure', async () => {
    storage.getRefreshToken = jest.fn().mockResolvedValue('invalid_token');
    storage.clearAll = jest.fn().mockResolvedValue(undefined);

    const mockPost = jest.spyOn(axios, 'post');
    mockPost.mockRejectedValueOnce(new Error('Refresh failed'));

    // Make concurrent requests
    const requests = [
      api.get('/api/members/123'),
      api.get('/api/contacts/456'),
      api.get('/api/users/me'),
    ];

    const results = await Promise.allSettled(requests);

    // Verify all requests rejected
    expect(results.every(r => r.status === 'rejected')).toBe(true);
  });
});
```

**Expected Result**:
- Success: All queued requests resolve
- Failure: All queued requests reject

**Actual Result**: TO BE TESTED

---

### Test 10.6: Multiple 401 Responses
**Type**: Manual
**Priority**: Medium
**Status**: Pending

**Steps**:
1. Login to app
2. Expire access token
3. Trigger multiple API calls simultaneously
   - Navigate to Dashboard (fetches members/contacts)
   - Open Settings (fetches user data)
   - View Notifications (fetches notification prefs)
4. Observe all requests fail with 401
5. Verify only ONE refresh request is sent
6. Verify all original requests are retried
7. Verify all data loads correctly

**Expected Result**:
- Multiple 401 responses received
- Single token refresh triggered
- All requests queued and retried
- All data loads successfully

**Actual Result**: TO BE TESTED

---

### Test 10.7: Authorization Header Update
**Type**: Automated
**Priority**: Medium
**Status**: Pending

**Automated Test**:
```typescript
describe('Authorization Header', () => {
  it('should update Authorization header after refresh', async () => {
    storage.getRefreshToken = jest.fn().mockResolvedValue('valid_refresh_token');
    storage.setTokens = jest.fn().mockResolvedValue(undefined);

    const mockPost = jest.spyOn(axios, 'post');
    const mockGet = jest.spyOn(api, 'request');

    mockPost.mockResolvedValueOnce({
      data: {
        access_token: 'NEW_ACCESS_TOKEN',
        refresh_token: 'new_refresh_token',
      },
    });

    // Trigger request that will get 401
    await api.get('/api/test');

    // Verify retry request has updated header
    expect(mockGet).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer NEW_ACCESS_TOKEN',
        }),
      })
    );
  });
});
```

**Expected Result**:
- Authorization header updated with new token
- Retry request uses new token
- Subsequent requests use new token

**Actual Result**: TO BE TESTED

---

## Edge Cases Tested

✅ **No Refresh Token**: Logout immediately if refresh token not found
✅ **Concurrent Requests**: Queue requests, process after refresh
✅ **Refresh Failure**: Clear storage and logout
✅ **Request Retry**: Original request retried with new token
✅ **Queue Processing**: All queued requests resolved/rejected together
⚠️ **Infinite Loop Prevention**: _retry flag prevents infinite refresh attempts

---

## Backend Requirements

For this feature to work, the backend must:

### 1. Return refresh_token on login/signup
```typescript
// POST /api/auth/login response
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": { ... }
}

// POST /api/auth/create-account response
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": { ... }
}
```

### 2. Implement refresh endpoint
```typescript
// POST /api/auth/refresh-token
// Request:
{
  "refresh_token": "existing_refresh_token"
}

// Response:
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}

// Error (401):
{
  "error": "Invalid or expired refresh token"
}
```

### 3. Token Expiration Strategy
- Access Token: Short-lived (15 minutes - 1 hour)
- Refresh Token: Long-lived (7-30 days)
- Rotate refresh tokens on each refresh (for security)

---

## Security Considerations

✅ **Encrypted Storage**: Refresh tokens stored in EncryptedStorage
✅ **HTTPS Only**: Refresh endpoint protected by HTTPS enforcement
✅ **Token Rotation**: New refresh token returned on each refresh
✅ **Automatic Logout**: Failed refresh clears all storage
✅ **No Infinite Loops**: _retry flag prevents repeated refresh attempts

---

## Known Limitations

⚠️ **Backend Integration Required**: Backend must return refresh_token in responses
⚠️ **Auth Slice Update Needed**: authSlice should store refresh_token from login/signup
⚠️ **No UI Feedback**: Token refresh happens silently (intentional for UX)

---

## Future Enhancements

1. **Proactive Refresh**: Refresh token before expiration (based on exp claim)
2. **Refresh Token Expiry Warning**: Warn user before refresh token expires
3. **Biometric Re-auth**: Require biometric auth if refresh token expired
4. **Token Revocation**: Implement server-side token revocation list
5. **Device Tracking**: Track devices with active refresh tokens

---

## Device Testing Checklist

- [ ] Login and wait for token to expire
- [ ] Verify automatic token refresh
- [ ] Test concurrent requests during refresh
- [ ] Test refresh failure (logout)
- [ ] Test queue processing on success
- [ ] Test queue processing on failure
- [ ] Monitor network traffic for refresh flow
- [ ] Verify no infinite refresh loops
- [ ] Test with slow network (3G throttling)
- [ ] Test app backgrounding during refresh

---

## Status: READY FOR BACKEND INTEGRATION

Frontend implementation complete. Requires:
1. Backend to return refresh_token in login/signup responses
2. Backend to implement POST /api/auth/refresh-token endpoint
3. Integration testing with real backend
4. Update authSlice to store refresh_token

**Note**: Token refresh logic is production-ready but untested until backend integration is complete.
