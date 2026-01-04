# Pruuf App - Comprehensive AI Development Prompt

> Use this document as a reference when working with AI assistants to understand, modify, or rebuild the Pruuf application.

---

## 1. APP OVERVIEW

### What is Pruuf?
Pruuf is a **daily wellness check-in app** designed for elderly adults ("Members") and their family caregivers ("Contacts"). The core value proposition is radically simple:

- **Members** (elderly users) tap a single "I'm OK" button once per day
- **Contacts** (family caregivers) receive automatic confirmation when the Member checks in
- **Missed check-ins** trigger immediate alerts to all Contacts via push notification + email

### User Roles

| Role | Description | Key Actions |
|------|-------------|-------------|
| **Member** | Elderly person being monitored | Tap "I'm OK" button daily, set check-in deadline |
| **Contact** | Family caregiver doing the monitoring | Invite Members, view check-in status, receive alerts |

### Business Rules
- A user can be **both** a Member and a Contact simultaneously
- Contacts pay for subscription; Members never pay
- Each Member can have up to 10 Contacts
- Check-in deadlines are timezone-aware

---

## 2. TECHNOLOGY STACK

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.78.0 | Cross-platform mobile framework |
| Expo SDK | 54.0.30 | Managed workflow, OTA updates |
| TypeScript | 5.0.4 | Type safety |
| Redux Toolkit | 2.10.1 | Global state management |
| React Query | 5.90.10 | Server state & caching |
| React Navigation | 7.x | Navigation (native-stack, bottom-tabs) |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database + Auth + Edge Functions |
| Expo Notifications | Push notifications (Expo Push Token format) |
| Postmark | Transactional email |

### Key Expo Packages
```json
{
  "expo": "^54.0.30",
  "expo-notifications": "~0.32.15",
  "expo-secure-store": "~15.0.8",
  "expo-local-authentication": "~17.0.8",
  "expo-haptics": "~15.0.8",
  "expo-device": "~8.0.10"
}
```

---

## 3. PROJECT STRUCTURE

```
/src
├── components/              # Reusable UI components
│   ├── common/             # Button, TextInput, CodeInput, Card, TimePicker, ErrorBoundary
│   ├── auth/               # BiometricPrompt
│   ├── dialogs/            # ConfirmDialog
│   ├── empty-states/       # EmptyState displays
│   ├── notifications/      # NotificationPermissionPrompt
│   └── skeletons/          # Loading placeholders
├── screens/                 # Full-screen components
│   ├── auth/               # WelcomeScreen, EmailEntryScreen, VerificationCodeScreen,
│   │                       # CreatePinScreen, ConfirmPinScreen, EnterPinScreen, FontSizeScreen
│   ├── onboarding/         # AddMemberScreen, ReviewMemberScreen, InviteSentScreen,
│   │                       # MemberWelcomeScreen, EnterInviteCodeScreen, SetCheckInTimeScreen
│   ├── member/             # MemberDashboard, MemberContacts, MemberSettings
│   ├── contact/            # ContactDashboard, ContactSettings
│   └── settings/           # NotificationPreferencesScreen
├── navigation/              # RootNavigator, MainTabNavigator
├── store/                   # Redux store
│   └── slices/             # authSlice, memberSlice, settingsSlice, notificationSlice
├── services/                # API, Supabase, notifications, storage, analytics
├── hooks/                   # Custom React hooks
├── theme/                   # colors, typography, spacing
├── types/                   # TypeScript definitions (database.ts, api.ts, index.ts)
└── utils/                   # Utility functions (validation, biometrics, deepLinks)
```

---

## 4. DATABASE SCHEMA (Supabase PostgreSQL)

### Core Tables

```typescript
// Users table - authentication and profile
interface User {
  id: string;                    // UUID primary key
  email: string;                 // Unique, lowercase
  pin_hash: string;              // bcrypt hashed PIN
  account_status: 'active' | 'deleted';
  is_member: boolean;            // Has Member role
  font_size_preference: 'standard' | 'large' | 'extra_large';
  failed_login_attempts: number;
  locked_until: string | null;   // Account lockout timestamp
  created_at: string;
  updated_at: string;
  deleted_at: string | null;     // Soft delete
}

// Members table - Member profile data
interface Member {
  id: string;
  user_id: string;               // FK to users
  name: string;
  check_in_time: string | null;  // HH:MM format
  timezone: string | null;       // e.g., 'America/New_York'
  reminder_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Member-Contact relationships
interface MemberContactRelationship {
  id: string;
  member_id: string;             // FK to members
  contact_id: string;            // FK to users
  invite_code: string;           // 6-char unique code
  status: 'pending' | 'active' | 'removed';
  invited_at: string;
  connected_at: string | null;
  last_invite_sent_at: string;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Check-ins table
interface CheckIn {
  id: string;
  member_id: string;             // FK to members
  checked_in_at: string;         // ISO timestamp
  timezone: string | null;
  created_at: string;
}

// Push notification tokens
interface PushNotificationToken {
  id: string;
  user_id: string;
  token: string;                 // Expo Push Token format
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}
```

### Additional Tables
- `verification_codes` - Email verification codes (6-digit, 10-min expiry)
- `missed_check_in_alerts` - Alert tracking
- `email_logs` - Email audit trail
- `app_notifications` - In-app notifications
- `audit_logs` - Security audit trail

---

## 5. API ENDPOINTS

### Authentication API (`authAPI`)
```typescript
// Send 6-digit verification code to email
sendVerificationCode(email: string): Promise<VerificationCodeResponse>

// Verify the code, get session token
verifyCode(email: string, code: string): Promise<VerifyCodeResponse>

// Create new account with PIN
createAccount(email: string, pin: string, sessionToken: string): Promise<CreateAccountResponse>

// Login with email + PIN
login(email: string, pin: string): Promise<LoginResponse>

// Forgot PIN flow
forgotPin(email: string): Promise<APIResponse>
resetPin(email: string, code: string, newPin: string): Promise<APIResponse>

// Token refresh
refreshToken(refreshToken: string): Promise<{access_token, refresh_token}>

// Check if email is verified (for polling)
checkVerificationStatus(email: string): Promise<{verified, session_token}>
```

### Members API (`membersAPI`)
```typescript
// Invite a new Member (Contact action)
invite(name: string, email: string): Promise<InviteMemberResponse>

// Accept invite with code (Member action)
acceptInvite(inviteCode: string): Promise<APIResponse>

// Perform daily check-in
checkIn(memberId: string, timezone: string): Promise<CheckInResponse>

// Update check-in deadline time
updateCheckInTime(memberId: string, checkInTime: string, timezone: string): Promise<APIResponse>

// Get list of Contacts monitoring this Member
getContacts(memberId: string): Promise<GetContactsResponse>

// Complete Member onboarding
completeOnboarding(memberId: string, checkInTime: string, timezone: string, reminderEnabled: boolean): Promise<APIResponse>
```

### Contacts API (`contactsAPI`)
```typescript
// Get all Members this Contact is monitoring
getMembers(): Promise<GetMembersResponse>

// Resend invitation email
resendInvite(relationshipId: string): Promise<APIResponse>

// Remove Member-Contact relationship
removeRelationship(relationshipId: string): Promise<APIResponse>

// Get check-in history for a Member
getMemberCheckInHistory(memberId: string, filter: '7days' | '30days' | 'all'): Promise<GetCheckInHistoryResponse>
```

### Push Notifications API (`pushAPI`)
```typescript
// Register device token with backend
registerToken(token: string, platform: string): Promise<APIResponse>

// Get in-app notifications
getNotifications(): Promise<APIResponse>

// Mark notification as read
markAsRead(notificationId: string): Promise<APIResponse>
markAllAsRead(): Promise<APIResponse>

// Delete notification
deleteNotification(notificationId: string): Promise<APIResponse>
```

---

## 6. STATE MANAGEMENT (Redux Toolkit)

### Auth Slice
```typescript
interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Async Thunks:
// - initializeAuth() - Load from secure storage on app start
// - sendVerificationCode(email)
// - verifyCode({email, code})
// - createAccount({email, pin, sessionToken})
// - login({email, pin})
// - logout()
```

### Member Slice
```typescript
interface MemberState {
  members: MemberInfo[];           // For Contact role
  contacts: ContactInfo[];         // For Member role
  checkIns: CheckIn[];
  selectedMember: MemberInfo | null;
  selectedContact: ContactInfo | null;
  isLoading: boolean;
  error: string | null;
  checkInHistory: CheckIn[];
  checkInStats: CheckInStats | null;
  isLoadingHistory: boolean;
}

// Async Thunks:
// - fetchMembers() - Get Members for Contact
// - fetchContacts(memberId) - Get Contacts for Member
// - addMember({name, email})
// - updateCheckInTime({memberId, checkInTime, timezone})
// - performCheckIn({memberId, timezone})
// - fetchCheckInHistory({memberId, filter})
// - removeRelationship(relationshipId)
```

### Settings Slice
```typescript
interface SettingsState {
  fontSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
  remindersEnabled: boolean;
  biometricsEnabled: boolean;
  timezone: string;
  isLoading: boolean;
  error: string | null;
}

// Async Thunks:
// - loadSettings()
// - saveSettings(settings)
// - updateFontSize(fontSize)
// - toggleNotifications(enabled)
// - toggleReminders(enabled)
// - toggleBiometrics(enabled)
```

### Notification Slice
```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  pushToken: string | null;        // Expo Push Token
  permissionStatus: 'granted' | 'denied' | 'not_determined';
  isLoading: boolean;
  error: string | null;
}

// Async Thunks:
// - requestNotificationPermission()
// - registerPushToken()
// - fetchNotifications()
// - markAsRead(notificationId)
// - markAllAsRead()
// - deleteNotification(notificationId)
```

---

## 7. NAVIGATION STRUCTURE

### Root Navigator
```typescript
type RootStackParamList = {
  // Auth Stack (when !isLoggedIn)
  Welcome: {inviteCode?: string};
  EmailEntry: undefined;
  VerificationCode: {email: string};
  CreatePin: {email: string; sessionToken: string};
  ConfirmPin: {email: string; sessionToken: string; pin: string};
  EnterPin: {email: string};
  FontSize: {isOnboarding: boolean};

  // Main App Stack (when isLoggedIn)
  MainTabs: undefined;

  // Onboarding (Contact flow)
  AddMember: undefined;
  ReviewMember: {name: string; email: string};
  InviteSent: {name: string; email: string; inviteCode: string};

  // Onboarding (Member flow)
  MemberWelcome: {contactName: string};
  EnterInviteCode: undefined;
  SetCheckInTime: undefined;

  // Detail Screens
  MemberDetail: {memberId: string};
  ContactDetail: {contactId: string};
  CheckInHistory: {memberId?: string};
  Help: undefined;
  NotificationSettings: undefined;
};
```

### Tab Navigation
```typescript
// Member Tabs (when user is a Member)
type MemberTabParamList = {
  MemberDashboard: undefined;    // "I'm OK" button
  MemberContacts: undefined;     // List of Contacts
  MemberSettings: undefined;     // Settings
};

// Contact Tabs (when user is a Contact)
type ContactTabParamList = {
  ContactDashboard: undefined;   // List of Members being monitored
  ContactSettings: undefined;    // Settings
};
```

---

## 8. USER FLOWS (E2E)

### Flow 1: New Contact Registration
```
1. WelcomeScreen → Tap "Get Started"
2. EmailEntryScreen → Enter email
3. VerificationCodeScreen → Enter 6-digit code from email
4. CreatePinScreen → Create 4-digit PIN
5. ConfirmPinScreen → Confirm PIN
6. FontSizeScreen → Select accessibility preference
7. AddMemberScreen → Enter Member's name and email
8. ReviewMemberScreen → Confirm details
9. InviteSentScreen → Success, show invite code
10. → MainTabs (ContactDashboard)
```

### Flow 2: New Member Registration (via invite)
```
1. WelcomeScreen → Tap "I have an invite code"
2. EnterInviteCodeScreen → Enter 6-character code
3. EmailEntryScreen → Enter email
4. VerificationCodeScreen → Enter 6-digit code
5. CreatePinScreen → Create PIN
6. ConfirmPinScreen → Confirm PIN
7. FontSizeScreen → Select font size
8. SetCheckInTimeScreen → Set daily deadline time
9. → MainTabs (MemberDashboard)
```

### Flow 3: Returning User Login
```
1. WelcomeScreen → Tap "Log in"
2. EmailEntryScreen → Enter email
3. VerificationCodeScreen → Verify email
4. EnterPinScreen → Enter PIN (not create new)
5. → MainTabs
```

### Flow 4: Member Daily Check-in
```
1. MemberDashboard → Shows "I'm OK" button with breathing animation
2. Tap button → API call to /api/members/{id}/check-in
3. Success → Button changes to "Checked In!" state
4. Backend → Sends push + email to all Contacts
```

### Flow 5: Missed Check-in Alert
```
1. Cron job runs after check-in deadline
2. No check-in found for Member
3. Backend sends CRITICAL notifications to all Contacts
4. Push notification + email with "Missed Check-in" alert
```

---

## 9. NOTIFICATION SYSTEM

### Push Notifications (Expo)
```typescript
// Token format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

// Registration flow:
1. App.tsx calls initializeNotifications()
2. Sets up notification handler for foreground
3. Creates Android notification channel
4. Requests permissions
5. Gets Expo Push Token
6. Registers token with backend via pushAPI.registerToken()

// Notification types:
- CHECK_IN_CONFIRMATION (push + email)
- MISSED_CHECK_IN (CRITICAL - push + email)
- LATE_CHECK_IN (push + email)
- CHECK_IN_REMINDER (push only, local)
- MEMBER_CONNECTED (push + in-app)
```

### Local Notifications (Reminders)
```typescript
// notificationService.ts
scheduleCheckInReminder(checkInTime: string, reminderMinutesBefore: number, timezone: string)

// Features:
- Daily repeating notification
- Configurable reminder time (15, 30, 60 minutes before)
- Android notification channel: 'check-in-reminders'
- Uses Expo Notifications API
```

### Notification Handler
```typescript
// App.tsx sets up listeners:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: AndroidNotificationPriority.HIGH,
  }),
});
```

---

## 10. UX/UI DESIGN SYSTEM

### Color Palette (WCAG AAA Compliant)
```typescript
const colors = {
  // Primary (green - safety, reassurance)
  primary: '#4CAF50',
  primaryDark: '#388E3C',      // 4.7:1 contrast for buttons
  primaryLight: '#C8E6C9',

  // Accent (blue - trust)
  accent: '#2196F3',
  accentDark: '#1976D2',
  accentLight: '#BBDEFB',

  // Semantic
  success: '#4CAF50',
  warning: '#F57C00',
  error: '#D32F2F',            // 4.52:1 contrast ratio

  // Text
  textPrimary: '#212121',      // 16.1:1 contrast
  textSecondary: '#666666',    // 5.74:1 contrast
  textInverse: '#FFFFFF',

  // Backgrounds
  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  border: '#E0E0E0',
};
```

### Typography
```typescript
const typography = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '700' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
};
```

### Accessibility Requirements
- **Minimum touch target**: 60pt (vs Apple's 44pt standard)
- **"I'm OK" button**: 120pt height × 90% width
- **Font scaling**: 3 sizes (standard, large, extra_large)
- **Screen reader**: All interactive elements have accessibilityLabel
- **Breathing animation**: Subtle scale animation on check-in button (1.0 → 1.02)

### Key Component: Check-in Button
```typescript
// MemberDashboard.tsx
<TouchableOpacity
  style={styles.checkInButton}  // 120pt height, 90% width
  onPress={handleCheckIn}
  accessibilityRole="button"
  accessibilityLabel="I'm OK"
  accessibilityHint="Double tap to confirm you're okay today"
>
  <Text style={styles.buttonText}>I'm OK</Text>  // 32pt font
  <Text style={styles.buttonSubtext}>Tap to check in</Text>
</TouchableOpacity>

// Breathing animation
useEffect(() => {
  const breathe = Animated.loop(
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.02, duration: 1500 }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 1500 }),
    ])
  );
  breathe.start();
}, []);
```

---

## 11. TESTING INFRASTRUCTURE

### Test Configuration (Jest)
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src'],
  testTimeout: 30000,
  maxWorkers: 1,  // React 19 compatibility
};
```

### Test Categories
| Category | Location | Purpose |
|----------|----------|---------|
| Unit Tests | `src/__tests__/` | Component logic, hooks, utilities |
| Screen Tests | `src/screens/**/__tests__/` | Screen rendering, interactions |
| Integration Tests | `tests/integration/` | API flows (Deno runtime) |
| Security Tests | `tests/security/` | Security audit |
| E2E Tests | `tests/e2e/` | Critical user paths |
| Smoke Tests | `tests/smoke/` | Basic functionality |

### Test Files Overview
```
src/__tests__/
├── analytics.test.ts
├── biometrics.test.ts
├── deepLinking.test.ts
├── formValidation.test.ts
├── useAPI.test.ts
├── useNotificationPermission.test.ts
└── phase-*.test.ts

tests/
├── integration/
│   ├── auth-email.integration.test.ts
│   ├── checkin.integration.test.ts
│   └── notifications-dual.integration.test.ts
├── security/
│   └── security-audit.test.ts
└── e2e/
    └── critical-paths.e2e.test.ts
```

---

## 12. SECURITY IMPLEMENTATION

### Authentication
- **PIN Storage**: bcrypt hash, cost factor 10
- **JWT Tokens**: 90-day access, stored in expo-secure-store
- **Account Lockout**: 5 failed attempts → 30-minute lock
- **Verification Codes**: 6-digit, 10-minute expiry, max 5 attempts

### API Security
- **HTTPS-Only**: Enforced in axios interceptor
- **Token Refresh**: Automatic with queue for concurrent requests
- **Rate Limiting**: Implemented per-endpoint
- **Input Validation**: Schema-based with sanitization

### Storage
```typescript
// storage.ts uses expo-secure-store
await SecureStore.setItemAsync('access_token', token);
await SecureStore.setItemAsync('user', JSON.stringify(user));
```

---

## 13. ENVIRONMENT CONFIGURATION

### Environment Variables (Expo)
```bash
# .env (prefix with EXPO_PUBLIC_ for client access)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_API_BASE_URL=https://api.pruuf.me
EXPO_PUBLIC_EXPO_PROJECT_ID=your-expo-project-id
EXPO_PUBLIC_ENABLE_DEV_TOOLS=true
```

### app.config.js
```javascript
module.exports = {
  expo: {
    name: 'Pruuf',
    slug: 'pruuf',
    version: '1.0.0',
    scheme: 'pruuf',  // Deep linking
    ios: {
      bundleIdentifier: 'me.pruuf.pruuf',
      infoPlist: {
        NSFaceIDUsageDescription: 'Pruuf uses Face ID for secure authentication',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      package: 'com.pruuf',
      permissions: ['INTERNET', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED'],
    },
    plugins: [
      'expo-secure-store',
      ['expo-notifications', { color: '#4CAF50' }],
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: { projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID },
    },
  },
};
```

---

## 14. BUILD & DEPLOYMENT (EAS)

### Build Profiles (eas.json)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Scripts
```bash
npm run build:dev:ios       # Development build
npm run build:preview:ios   # Internal testing
npm run build:prod:ios      # App Store submission
npm run submit:ios          # Submit to App Store
```

---

## 15. COMMON DEVELOPMENT TASKS

### Adding a New Screen
1. Create screen in `src/screens/{category}/`
2. Add to navigation types in `src/types/index.ts`
3. Register in `src/navigation/RootNavigator.tsx`
4. Create test file in `__tests__/` subdirectory

### Adding a New API Endpoint
1. Add TypeScript types in `src/types/api.ts`
2. Add method to appropriate API object in `src/services/api.ts`
3. Add async thunk in relevant Redux slice
4. Create integration test in `tests/integration/`

### Modifying Redux State
1. Update interface in slice file
2. Add/modify reducers and extraReducers
3. Update selectors if needed
4. Add tests for new thunks

### Testing Commands
```bash
npm test                    # Run all unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

---

## 16. KNOWN CONSTRAINTS & CONSIDERATIONS

### Target Audience
- **Primary users**: Adults 65+ with varying tech literacy
- **Secondary users**: Adult children (40-60) as caregivers
- Larger touch targets, simpler flows, high contrast colors

### Platform Support
- iOS 13+ (iPhone only, no iPad optimization)
- Android 8+ (API level 26+)
- No web version

### Performance Targets
- App launch: < 3 seconds
- API response: < 2 seconds
- Button response: < 100ms haptic feedback

### Offline Behavior
- App requires network for check-in
- Displays offline indicator when disconnected
- Queued check-ins not supported (real-time critical)

---

## QUICK REFERENCE

### File Locations for Common Tasks
| Task | Files |
|------|-------|
| Modify "I'm OK" button | `src/screens/member/MemberDashboard.tsx` |
| Add API endpoint | `src/services/api.ts`, `src/types/api.ts` |
| Update colors | `src/theme/colors.ts` |
| Modify auth flow | `src/store/slices/authSlice.ts` |
| Add navigation screen | `src/navigation/RootNavigator.tsx`, `src/types/index.ts` |
| Update notifications | `src/services/notificationService.ts`, `src/services/notifications.ts` |
| Modify database types | `src/types/database.ts` |

### Critical Integration Points
- Supabase client: `src/services/supabase.ts`
- API layer: `src/services/api.ts`
- Secure storage: `src/services/storage.ts`
- Push notifications: `src/services/notifications.ts`
- Local notifications: `src/services/notificationService.ts`
