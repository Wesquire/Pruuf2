# Expo SDK 52 Migration - Manual Testing Checklist

**Migration Date:** December 2025
**Previous:** React Native CLI 0.74.0
**Current:** Expo SDK 52 with EAS Build

## Pre-Testing Setup

- [ ] Ensure development environment is set up
- [ ] Run `npm install` to install all dependencies
- [ ] Run `npx expo start` to start the development server
- [ ] Connect physical device or simulator

---

## 1. Core App Functionality

### 1.1 App Launch
- [ ] App launches without crashing
- [ ] Splash screen displays correctly
- [ ] Status bar styling is correct

### 1.2 Navigation
- [ ] All tab navigation works
- [ ] Stack navigation (push/pop) works
- [ ] Modal navigation works
- [ ] Deep links work (if configured)

---

## 2. Notification System (expo-notifications)

### 2.1 Permission Request
- [ ] Permission prompt appears on first launch (iOS)
- [ ] Permission prompt appears on first launch (Android)
- [ ] "Allow" grants notification permission
- [ ] "Don't Allow" is handled gracefully
- [ ] Permission status is persisted

### 2.2 Push Token Registration
- [ ] Expo push token is generated on physical device
- [ ] Token format: `ExponentPushToken[...]`
- [ ] Token is sent to backend API
- [ ] Token is stored in push_notification_tokens table

### 2.3 Notification Delivery
- [ ] Foreground notifications display correctly
- [ ] Background notifications are received
- [ ] Notification tapping opens correct screen
- [ ] Badge count updates correctly (iOS)
- [ ] Notification sound plays

### 2.4 Local Notifications
- [ ] Check-in reminders are scheduled
- [ ] Reminders fire at correct time
- [ ] Cancellation works when no longer needed

---

## 3. Secure Storage (expo-secure-store)

### 3.1 Token Storage
- [ ] JWT access token stored securely
- [ ] Token persists across app restarts
- [ ] Token retrieval works correctly
- [ ] Token deletion on logout works

### 3.2 Sensitive Data
- [ ] User preferences stored correctly
- [ ] No sensitive data in AsyncStorage (check)
- [ ] Storage works after app update

---

## 4. Authentication Flow

### 4.1 Registration
- [ ] Email entry screen works
- [ ] Email verification screen polls correctly
- [ ] PIN creation works
- [ ] PIN confirmation works
- [ ] Font size selection works
- [ ] Account creation API succeeds

### 4.2 Login
- [ ] Email entry works
- [ ] PIN entry works
- [ ] Successful login navigates to dashboard
- [ ] Failed login shows error message
- [ ] Account lockout after 5 failed attempts

### 4.3 Session Management
- [ ] Token refresh works automatically
- [ ] Expired token triggers re-login
- [ ] Logout clears all credentials

---

## 5. Member Flow

### 5.1 Dashboard
- [ ] Check-in button displays correctly
- [ ] Deadline banner shows correct time
- [ ] Contacts list displays

### 5.2 Check-in
- [ ] "I'm OK" button tap works
- [ ] Haptic feedback occurs
- [ ] Success animation plays
- [ ] Button state changes to "Checked In"
- [ ] Contacts receive notification

### 5.3 Settings
- [ ] Check-in time picker works
- [ ] Timezone detection works
- [ ] Reminder toggle works
- [ ] Font size change applies immediately

---

## 6. Contact Flow

### 6.1 Dashboard
- [ ] Member cards display correctly
- [ ] Status indicators (green/red) work
- [ ] "Last check-in" timestamp is accurate

### 6.2 Member Invitation
- [ ] Add Member form works
- [ ] Email validation works
- [ ] Invite code is generated
- [ ] Invitation email is sent

### 6.3 Payment
- [ ] Stripe CardField renders
- [ ] Card validation works
- [ ] Subscription creation works
- [ ] Payment method update works
- [ ] Subscription cancellation works

---

## 7. Platform-Specific Testing

### 7.1 iOS
- [ ] App works on iOS 14+
- [ ] Face ID / Touch ID integration (if implemented)
- [ ] App Store build compiles
- [ ] TestFlight installation works

### 7.2 Android
- [ ] App works on Android 10+
- [ ] Biometric authentication (if implemented)
- [ ] Google Play build compiles
- [ ] Internal testing installation works

---

## 8. Build & Deployment (EAS)

### 8.1 Development Build
- [ ] `eas build --profile development --platform ios` succeeds
- [ ] `eas build --profile development --platform android` succeeds
- [ ] Development client installs on device

### 8.2 Preview Build
- [ ] `eas build --profile preview --platform ios` succeeds
- [ ] `eas build --profile preview --platform android` succeeds
- [ ] Preview build installs correctly

### 8.3 Production Build
- [ ] `eas build --profile production --platform ios` succeeds
- [ ] `eas build --profile production --platform android` succeeds
- [ ] App size is acceptable

### 8.4 OTA Updates
- [ ] `eas update` succeeds
- [ ] Updates are received by app
- [ ] Updates apply on next launch

---

## 9. Accessibility

### 9.1 VoiceOver/TalkBack
- [ ] All buttons have accessibility labels
- [ ] Navigation is possible with screen reader
- [ ] "I'm OK" button is clearly announced

### 9.2 Font Scaling
- [ ] Standard (1.0x) displays correctly
- [ ] Large (1.25x) displays correctly
- [ ] Extra Large (1.5x) displays correctly

---

## 10. Error Handling

### 10.1 Network Errors
- [ ] Offline state is detected
- [ ] Offline banner displays
- [ ] Operations queue when offline
- [ ] Operations retry when online

### 10.2 API Errors
- [ ] 401 triggers token refresh
- [ ] 500 errors show friendly message
- [ ] Rate limiting is handled

---

## Test Environment Notes

**iOS Simulator:**
- Device:
- iOS Version:

**Android Emulator/Device:**
- Device:
- Android Version:

**Physical Devices Tested:**
- [ ] iPhone (model: ___)
- [ ] Android (model: ___)

---

## Known Issues

Document any issues discovered during testing:

1.
2.
3.

---

## Test Results Summary

| Category | Pass | Fail | Blocked |
|----------|------|------|---------|
| Core App | | | |
| Notifications | | | |
| Secure Storage | | | |
| Auth Flow | | | |
| Member Flow | | | |
| Contact Flow | | | |
| Platform iOS | | | |
| Platform Android | | | |
| Build/Deploy | | | |
| Accessibility | | | |
| Error Handling | | | |

**Overall Status:** [ ] PASS / [ ] FAIL

**Tested By:** ________________

**Date:** ________________
