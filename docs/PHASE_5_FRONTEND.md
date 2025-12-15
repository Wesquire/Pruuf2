# Phase 5: Frontend Implementation - Email Verification & Deep Linking

**Status**: ✅ COMPLETE
**Date**: 2025-12-07
**Components**: Email verification screens, Deep link handlers, Navigation updates

---

## Overview

Phase 5 replaces SMS-based phone verification with email-based verification for Contact onboarding and implements comprehensive deep link handling for magic link flows (invitations, email verification).

---

## Components Created

### 1. Email Verification Screen

**File**: `src/screens/auth/EmailVerificationScreen.tsx` (461 lines)

**Purpose**: Contact onboarding screen that collects email address and sends verification link.

**Key Features**:
- Email validation (regex-based)
- Real-time verification status polling (checks every 3 seconds)
- Resend cooldown (60 seconds)
- Visual feedback for verification status
- Accessibility support (VoiceOver labels)
- Error handling with user-friendly messages

**Flow**:
1. User enters email address
2. App validates format
3. User taps "Continue"
4. Backend sends verification email via Postmark
5. Screen shows "Check your email" state
6. App polls `/api/auth/check-email-verification-status` every 3 seconds
7. When backend confirms verification, auto-navigate to CreatePin

**UI States**:
- **Entry State**: Email input, validation, continue button
- **Waiting State**: "Check your email" message, instructions, status checking indicator
- **Error State**: Shows error message with retry options

**API Integration**:
```typescript
// Send verification email
dispatch(sendEmailVerification(email))

// Poll for verification status
const pollInterval = setInterval(async () => {
  const result = await dispatch(checkEmailVerificationStatus(email));
  if (result.payload.verified) {
    navigation.navigate('CreatePin', {
      email,
      sessionToken: result.payload.session_token,
    });
  }
}, 3000);
```

**Accessibility**:
- All inputs have `accessibilityLabel` and `accessibilityHint`
- Loading states announced via VoiceOver
- Error messages use both icon + text (not color alone)
- Touch targets meet 44pt minimum

---

### 2. Deep Link Handler Component

**File**: `src/components/DeepLinkHandler.tsx` (273 lines)

**Purpose**: Centralized deep link processing for all magic link flows.

**Supported Deep Link Patterns**:
- `pruuf://invite?code=ABC123` - Member invitation acceptance
- `pruuf://verify-email?token=xyz...` - Email verification completion
- `pruuf://members` - Navigate to members list
- `pruuf://settings/payment` - Navigate to payment settings

**Key Features**:
- Prevents duplicate link processing (using `processingLink` ref)
- Handles initial URL (app opened via deep link)
- Handles URL events (app already open, deep link tapped)
- Handles app state changes (foreground/background transitions)
- Authentication-aware routing (some links require login)
- Comprehensive error handling with user alerts

**Architecture**:
```typescript
const processDeepLink = async (url: string) => {
  // 1. Parse deep link
  const { route, params } = parseDeepLink(url);

  // 2. Handle different routes
  switch (route) {
    case 'invite':
      // Accept Member invitation
      await dispatch(acceptInvitation(params.code));
      break;

    case 'verify-email':
      // Complete email verification
      await dispatch(verifyEmailWithToken(params.token));
      break;

    case 'members':
      // Navigate to members list
      navigation.navigate('ContactDashboard');
      break;

    case 'settings':
      // Navigate to settings (with optional sub-path)
      if (params.path === 'payment') {
        navigation.navigate('PaymentSettings');
      }
      break;
  }
};
```

**Event Listeners**:
```typescript
// Initial URL (app closed → opened via deep link)
useEffect(() => {
  Linking.getInitialURL().then(url => {
    if (url) processDeepLink(url);
  });
}, []);

// URL events (app in background/foreground → deep link tapped)
useEffect(() => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    processDeepLink(url);
  });
  return () => subscription.remove();
}, []);

// App state changes (background → foreground)
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // Check for pending deep links
      Linking.getInitialURL().then(url => {
        if (url) processDeepLink(url);
      });
    }
  });
  return () => subscription.remove();
}, []);
```

**Error Handling**:
- Invalid deep link format → Log warning, silent failure
- Invalid invitation code → Alert with error message
- Invalid verification token → Alert "link invalid or expired"
- Network errors → Alert "Failed to process link. Please try again."
- Unauthenticated access → Alert "Please log in to continue"

---

### 3. Redux Auth Slice Updates

**File**: `src/store/slices/authSlice.ts`

**New Actions Added**:

#### `sendEmailVerification`
```typescript
export const sendEmailVerification = createAsyncThunk(
  'auth/sendEmailVerification',
  async (email: string, { rejectWithValue }) => {
    const response = await authAPI.sendEmailVerification(email);
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    return response;
  }
);
```

#### `checkEmailVerificationStatus`
```typescript
export const checkEmailVerificationStatus = createAsyncThunk(
  'auth/checkEmailVerificationStatus',
  async (email: string, { rejectWithValue }) => {
    const response = await authAPI.checkEmailVerificationStatus(email);
    return response;
  }
);
```

#### `verifyEmailWithToken`
```typescript
export const verifyEmailWithToken = createAsyncThunk(
  'auth/verifyEmailWithToken',
  async (token: string, { rejectWithValue }) => {
    const response = await authAPI.verifyEmailWithToken(token);
    return response;
  }
);
```

#### `acceptInvitation`
```typescript
export const acceptInvitation = createAsyncThunk(
  'auth/acceptInvitation',
  async (inviteCode: string, { rejectWithValue }) => {
    const response = await authAPI.acceptInvitation(inviteCode);
    return response;
  }
);
```

**Reducer Cases**:
All actions have standard `pending`, `fulfilled`, `rejected` cases that manage:
- `state.isLoading` (loading spinners)
- `state.error` (error messages)
- State transitions based on success/failure

---

### 4. API Service Updates

**File**: `src/services/api.ts`

**New API Methods**:

#### `sendEmailVerification`
```typescript
async sendEmailVerification(email: string): Promise<APIResponse> {
  const response = await api.post('/api/auth/send-email-verification', {
    email,
  });
  return response.data;
}
```

**Backend Endpoint**: `POST /api/auth/send-email-verification`
**Purpose**: Send verification email with magic link
**Response**: `{ success: boolean, error?: string }`

---

#### `checkEmailVerificationStatus`
```typescript
async checkEmailVerificationStatus(email: string): Promise<{
  success: boolean;
  verified: boolean;
  session_token?: string;
  error?: string;
}> {
  const response = await api.post('/api/auth/check-email-verification-status', {
    email,
  });
  return response.data;
}
```

**Backend Endpoint**: `POST /api/auth/check-email-verification-status`
**Purpose**: Poll to check if email has been verified
**Response**: `{ success: true, verified: true, session_token: "..." }`

---

#### `verifyEmailWithToken`
```typescript
async verifyEmailWithToken(token: string): Promise<{
  success: boolean;
  session_token: string;
  email: string;
  error?: string;
}> {
  const response = await api.post('/api/auth/verify-email-token', {
    token,
  });
  return response.data;
}
```

**Backend Endpoint**: `POST /api/auth/verify-email-token`
**Purpose**: Complete email verification via magic link token
**Response**: `{ success: true, session_token: "...", email: "..." }`

---

#### `acceptInvitation`
```typescript
async acceptInvitation(inviteCode: string): Promise<APIResponse> {
  const response = await api.post('/api/accept-invitation', {
    invite_code: inviteCode.toUpperCase(),
  });
  return response.data;
}
```

**Backend Endpoint**: `POST /api/accept-invitation`
**Purpose**: Accept Member invitation via deep link
**Response**: `{ success: true, ... }`

---

### 5. Navigation Updates

**File**: `src/navigation/RootNavigator.tsx`

**New Screen Added**:
```tsx
<Stack.Screen
  name="EmailVerification"
  component={EmailVerificationScreen}
/>
```

**Position**: In auth stack, between `VerificationCode` and `CreatePin`

---

**File**: `src/types/index.ts`

**Type Updates**:
```typescript
export type RootStackParamList = {
  // Updated types
  Welcome: { inviteCode?: string };  // Added optional inviteCode param
  EmailVerification: undefined;       // NEW
  CreatePin: {                        // Updated to support email OR phone
    email?: string;
    phone?: string;
    sessionToken: string;
  };
  ConfirmPin: {                       // Updated to support email OR phone
    email?: string;
    phone?: string;
    sessionToken: string;
    pin: string;
  };
  // ... rest unchanged
};
```

**Reason for Updates**:
- `Welcome` can now receive `inviteCode` from deep link handler
- `EmailVerification` is new screen for email-based verification
- `CreatePin`/`ConfirmPin` now support both email and phone flows

---

### 6. App Integration

**File**: `App.tsx`

**Changes**:
```typescript
// Added import
import DeepLinkHandler from './src/components/DeepLinkHandler';

// Removed old deep linking service
// import { initializeDeepLinking } from './src/services/deepLinkService';

// Updated AppContent component
const AppContent: React.FC = () => {
  // ... existing code ...

  return (
    <>
      <StatusBar ... />
      <RootNavigator ref={navigationRef} />
      <DeepLinkHandler />  {/* NEW: Deep link handler component */}
    </>
  );
};
```

**Why**:
- `DeepLinkHandler` is now a React component with hooks (cleaner than service)
- Automatically handles all deep link events
- No manual cleanup needed (hooks handle it)

---

## Deep Link Flow Examples

### Example 1: Member Invitation via Deep Link

**Scenario**: Contact invites Member via email, Member taps magic link

**Flow**:
1. Member receives email: "Jennifer invited you to Pruuf"
2. Email contains link: `https://pruuf.me/invite/ABC123`
3. Link redirects to: `pruuf://invite?code=ABC123`
4. Member taps link
5. If app not installed:
   - iOS: App Store opens
   - Android: Google Play opens
   - After install: Deep link queued
6. If app installed:
   - `DeepLinkHandler` receives URL
   - Parses: `{ route: 'invite', params: { code: 'ABC123' } }`
   - Checks if user authenticated
   - If not: Navigates to `Welcome` with `inviteCode` param
   - If yes: Calls `dispatch(acceptInvitation('ABC123'))`
   - On success: Navigates to `MemberDashboard`
   - On failure: Shows error alert

**Backend Processing**:
- `POST /api/accept-invitation` with `{ invite_code: 'ABC123' }`
- Backend validates code exists and is pending
- Backend updates relationship status to 'active'
- Backend sends notification to Contact (Member connected)

---

### Example 2: Email Verification via Deep Link

**Scenario**: Contact enters email, receives verification link, taps link

**Flow**:
1. Contact enters email on `EmailVerificationScreen`
2. Backend sends email via Postmark
3. Email contains link: `https://pruuf.me/verify-email/TOKEN_HERE`
4. Link redirects to: `pruuf://verify-email?token=TOKEN_HERE`
5. Contact taps link (app already open, showing "Check your email" screen)
6. `DeepLinkHandler` receives URL
7. Parses: `{ route: 'verify-email', params: { token: 'TOKEN_HERE' } }`
8. Calls `dispatch(verifyEmailWithToken('TOKEN_HERE'))`
9. On success:
   - Shows alert "Email Verified"
   - Navigates to `CreatePin` with `email` and `sessionToken`
10. On failure:
    - Shows alert "Verification link invalid or expired"

**Backend Processing**:
- `POST /api/auth/verify-email-token` with `{ token: 'TOKEN_HERE' }`
- Backend validates token exists and hasn't expired
- Backend marks email as verified
- Backend generates session token
- Returns `{ success: true, session_token: "...", email: "..." }`

---

## Testing Checklist

### Email Verification Flow

- [ ] Enter valid email → Sends verification email successfully
- [ ] Enter invalid email (bad format) → Shows validation error
- [ ] Enter invalid email (doesn't exist) → Backend returns error
- [ ] Tap "Resend" before cooldown → Button disabled
- [ ] Tap "Resend" after cooldown → Sends new email, resets timer
- [ ] Tap verification link in email → App opens, navigates to CreatePin
- [ ] Tap expired verification link → Shows error alert
- [ ] Tap already-used verification link → Shows error alert
- [ ] Close app during verification wait → Reopens, continues polling
- [ ] Background app during verification wait → Returns to foreground, continues polling
- [ ] Verification status polling continues until success
- [ ] Network error during polling → Gracefully handles, continues polling
- [ ] VoiceOver reads all labels correctly
- [ ] Dynamic Type scales text appropriately

### Deep Link Handling

- [ ] App closed → Tap deep link → App opens, processes link
- [ ] App in background → Tap deep link → App foregrounds, processes link
- [ ] App already open → Tap deep link → Processes link in current session
- [ ] Invalid deep link format → Logs warning, no crash
- [ ] Deep link requires auth, user not logged in → Shows "Please log in" alert
- [ ] Deep link requires auth, user logged in → Processes successfully
- [ ] Duplicate deep link processing prevented (tap same link multiple times rapidly)
- [ ] Deep link with missing parameters → Shows appropriate error
- [ ] Deep link to unknown route → Logs warning, no crash

### Invitation Acceptance Flow

- [ ] Unauthenticated user taps invitation link → Navigates to Welcome with code
- [ ] Authenticated user taps invitation link → Accepts invitation, navigates to MemberDashboard
- [ ] Invalid invitation code → Shows error alert
- [ ] Expired invitation code → Shows error alert
- [ ] Already accepted invitation code → Shows error alert
- [ ] Network error during acceptance → Shows retry alert
- [ ] Success → Shows success alert, sends notification to Contact

---

## Environment Variables

No new environment variables required for Phase 5 (frontend only).

Backend variables from Phase 2/3 still required:
- `POSTMARK_SERVER_TOKEN` (email sending)
- `WEB_BASE_URL` (magic link generation)
- `APP_SCHEME` (deep link scheme)

---

## Dependencies

No new dependencies added. Existing dependencies used:
- `@react-navigation/native` (navigation)
- `@reduxjs/toolkit` (state management)
- `react-native` (Linking API for deep links)

---

## Known Issues & Future Enhancements

### Known Issues
None at this time.

### Future Enhancements
1. **Email Change Flow**: Allow users to update email address (requires re-verification)
2. **Deep Link Analytics**: Track deep link conversion rates
3. **Universal Links**: Implement iOS Universal Links for better UX (bypass browser redirect)
4. **App Links**: Implement Android App Links for better UX
5. **Deep Link Queueing**: Queue multiple deep links if received while processing
6. **Verification Timeout**: Add timeout to polling (stop after 5 minutes, suggest resend)
7. **Email Resend Limit**: Limit resends per day (prevent abuse)

---

## Migration Notes

### From Phone Verification to Email Verification

**Old Flow** (Phase 1-2):
1. Welcome → PhoneEntry → VerificationCode (SMS) → CreatePin

**New Flow** (Phase 5):
1. Welcome → EmailVerification → CreatePin

**Coexistence**:
Both flows coexist. Navigation router decides based on user type:
- **Contact onboarding**: Uses EmailVerification
- **Member onboarding**: Uses existing flow (may still use phone verification or invitation links)

**Database**:
- Users table has both `phone` and `email` columns
- Verification can be done via either method
- Backend determines which to use based on request endpoint

---

## Files Modified Summary

### New Files (3)
1. `src/screens/auth/EmailVerificationScreen.tsx` (461 lines)
2. `src/components/DeepLinkHandler.tsx` (273 lines)
3. `docs/PHASE_5_FRONTEND.md` (this file)

### Modified Files (4)
1. `src/store/slices/authSlice.ts` (+118 lines)
   - Added 4 new async thunks
   - Added reducer cases for email verification and invitation acceptance

2. `src/services/api.ts` (+38 lines)
   - Added 4 new API methods to `authAPI` object

3. `src/navigation/RootNavigator.tsx` (+2 lines)
   - Added EmailVerification screen to auth stack
   - Added import for EmailVerificationScreen

4. `src/types/index.ts` (+7 lines)
   - Updated RootStackParamList navigation types
   - Added EmailVerification screen type
   - Updated CreatePin/ConfirmPin to support email OR phone

5. `App.tsx` (+1 line, -7 lines)
   - Added DeepLinkHandler component
   - Removed old initializeDeepLinking service call

**Total Lines Added**: ~900 lines
**Total Lines Modified**: ~165 lines

---

## Phase 5 Completion Criteria

- [x] Email verification screen created with polling logic
- [x] Deep link handler component created with all routes
- [x] Redux actions for email verification added
- [x] API service methods for email verification added
- [x] Navigation updated with new screen
- [x] Types updated for navigation params
- [x] App integration with DeepLinkHandler component
- [x] Documentation completed

**Status**: ✅ **PHASE 5 COMPLETE**

**Next Phase**: Phase 6 - Push + Email notification implementation (frontend integration with backend dual notification system)
