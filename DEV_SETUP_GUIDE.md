# Pruuf Development Setup Guide

## Quick Start (TL;DR)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start Metro bundler (Terminal 1)
npm start

# 4. Run on iOS (Terminal 2)
npm run ios

# OR Run on Android (Terminal 2)
npm run android
```

---

## Complete Setup Guide

### Prerequisites

1. **Node.js** (v18+)
   ```bash
   node --version  # Should be >= 18
   ```

2. **Watchman** (for file watching)
   ```bash
   brew install watchman
   ```

3. **For iOS Development:**
   - macOS required
   - Xcode 14+ installed from App Store
   - Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```
   - CocoaPods:
     ```bash
     sudo gem install cocoapods
     ```

4. **For Android Development:**
   - Android Studio installed
   - Android SDK Platform 33 (Android 13)
   - Android SDK Build-Tools
   - Android Emulator configured

---

## Environment Setup

### 1. Create Local Environment File

```bash
cp .env.example .env
```

### 2. Configure Development Backend

For development, you have two options:

#### Option A: Use Local Supabase (Recommended for Full Control)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
cd supabase
supabase start

# This will output:
# - API URL: http://localhost:54321
# - Anon Key: eyJhbGc...
# - Service Role Key: eyJhbGc...
```

Update `.env`:
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
API_BASE_URL=http://localhost:3000
```

#### Option B: Use Supabase Cloud (Development Project)

Keep the existing values in `.env` but create a separate Supabase project for development:
- Go to https://supabase.com
- Create new project: "pruuf-dev"
- Copy the URL and anon key to `.env`

---

## Installation

### 1. Install JavaScript Dependencies

```bash
npm install
```

### 2. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Verify Installation

```bash
# Check React Native setup
npx react-native doctor

# Should show all green checkmarks
```

---

## Running the App

### Method 1: Metro Bundler + Separate Platform Command (Recommended)

**Terminal 1 - Start Metro:**
```bash
npm start
# OR for a clean start:
npm start -- --reset-cache
```

**Terminal 2 - Run iOS:**
```bash
npm run ios

# Specific simulator:
npm run ios -- --simulator="iPhone 15 Pro"

# List available simulators:
xcrun simctl list devices
```

**Terminal 2 - Run Android:**
```bash
npm run android

# Specific device:
npm run android -- --deviceId=<device-id>

# List devices:
adb devices
```

### Method 2: Single Command (Auto-starts Metro)

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## Hot Reload / Fast Refresh

React Native has **Fast Refresh** enabled by default. Changes to your code will automatically reload.

### How Hot Reload Works

1. **JavaScript Changes** → Instant reload (< 1 second)
   - Component code
   - Redux slices
   - Utilities
   - Styles

2. **Native Changes** → Requires rebuild
   - `package.json` (new native dependencies)
   - iOS: `ios/` directory
   - Android: `android/` directory
   - Native modules configuration

### Enable Fast Refresh

In the running app:
- **iOS**: Press `Cmd + D` → Enable Fast Refresh
- **Android**: Press `Cmd + M` (or shake device) → Enable Fast Refresh

### Force Refresh

- **iOS**: `Cmd + R`
- **Android**: `R` key (twice quickly)

### Clear Cache and Restart

```bash
# Stop Metro, then:
npm start -- --reset-cache
```

---

## Development Workflow

### Recommended Setup: 3 Terminals

**Terminal 1: Metro Bundler**
```bash
npm start
```
Leave this running. You'll see:
```
                ######                ######
              ###     ####        ####     ###
            ##          ###    ###          ##
            ##             ####             ##
            ##             ####             ##
            ##           ##    ##           ##
            ##         ###      ###         ##
              ###     ####        ####     ###
                ######                ######

 Metro waiting on http://localhost:8081
```

**Terminal 2: Run App**
```bash
npm run ios
# OR
npm run android
```

**Terminal 3: Logs & Commands**
```bash
# View iOS logs
npx react-native log-ios

# View Android logs
npx react-native log-android

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

---

## Viewing Changes in Real-Time

### 1. Edit a Component

```tsx
// src/screens/auth/WelcomeScreen.tsx
export const WelcomeScreen = () => {
  return (
    <View>
      <Text>Welcome to Pruuf! 🎉</Text>  {/* Change this text */}
    </View>
  );
};
```

**Result:** Screen updates within 1 second ✅

### 2. Edit Styles

```tsx
// src/theme/colors.ts
export const colors = {
  primary: '#4CAF50',  // Change to '#FF0000' (red)
  // ...
};
```

**Result:** All buttons turn red instantly ✅

### 3. Edit Redux State

```tsx
// src/store/slices/authSlice.ts
const initialState = {
  isLoggedIn: false,  // Change to true for testing
  // ...
};
```

**Result:** App shows logged-in state immediately ✅

### 4. Add New Dependencies

```bash
npm install react-native-some-package

# iOS: Install pods
cd ios && pod install && cd ..

# Restart Metro
npm start -- --reset-cache

# Rebuild app
npm run ios
```

**Result:** New package available after rebuild ⚠️

---

## Testing Accounts Setup

### Creating Test Accounts

The app uses **email verification** for signup. For development:

#### Option 1: Use Supabase Studio (Local)

```bash
supabase start
```

Visit: http://localhost:54323 (Supabase Studio)

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Email: `test-contact@pruuf.dev`
4. Password: `TestPass123!`
5. Auto Confirm User: ✅
6. Click **Create User**

Repeat for:
- `test-member@pruuf.dev`
- `test-contact2@pruuf.dev`

#### Option 2: Use Email Interception (Recommended)

For development, Supabase can intercept emails:

1. In Supabase Studio → **Project Settings** → **Auth**
2. Enable "Confirm email" (OFF for development)
3. All emails will be logged in **Logs** → **Auth Logs**

Now in the app:
1. Sign up with any email (e.g., `test@example.com`)
2. Check Supabase Studio → **Auth Logs** for verification link
3. Copy link and open in browser OR mark user as verified in Studio

#### Option 3: Use Mailtrap (Email Testing Service)

1. Sign up at https://mailtrap.io (free tier)
2. Get SMTP credentials
3. Configure in Supabase → **Project Settings** → **Auth** → **Email Templates**
4. All verification emails will appear in Mailtrap inbox

### Pre-configured Test Accounts

Add these to your local database:

```sql
-- Run in Supabase SQL Editor

-- Contact User (monitors Members)
INSERT INTO auth.users (email, email_confirmed_at, encrypted_password)
VALUES (
  'contact@test.com',
  NOW(),
  crypt('TestPass123!', gen_salt('bf'))
);

-- Member User (elderly user)
INSERT INTO auth.users (email, email_confirmed_at, encrypted_password)
VALUES (
  'member@test.com',
  NOW(),
  crypt('TestPass123!', gen_salt('bf'))
);
```

**Login Credentials:**
- Email: `contact@test.com` / `member@test.com`
- PIN: `1234` (set during first login)

---

## Debugging Tools

### 1. React Native Debugger

```bash
# Install
brew install --cask react-native-debugger

# Run (before starting app)
open -a "React Native Debugger"
```

In app, enable debugging:
- iOS: `Cmd + D` → Debug
- Android: `Cmd + M` → Debug

### 2. Flipper (Meta's Debugging Platform)

```bash
# Install
brew install --cask flipper

# Run
open -a Flipper
```

Features:
- Network inspector
- Redux DevTools
- Layout inspector
- Logs viewer

### 3. Chrome DevTools (Hermes)

React Native 0.74 uses Hermes engine.

In Chrome:
1. Navigate to `chrome://inspect`
2. Click "Configure" → Add `localhost:8081`
3. App will appear under "Remote Target"

### 4. VS Code Integration

Install extensions:
- React Native Tools (Microsoft)
- React-Native/React/Redux snippets

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run iOS",
      "cwd": "${workspaceFolder}",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios"
    },
    {
      "name": "Run Android",
      "cwd": "${workspaceFolder}",
      "type": "reactnative",
      "request": "launch",
      "platform": "android"
    }
  ]
}
```

Press `F5` to run with debugger attached.

---

## Common Issues & Solutions

### Metro Won't Start

```bash
# Kill existing Metro processes
pkill -f metro

# Clear watchman
watchman watch-del-all

# Clear Metro cache
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*

# Clear React Native cache
rm -rf $TMPDIR/react-*

# Restart
npm start -- --reset-cache
```

### iOS Build Fails

```bash
# Clean build folder
cd ios
rm -rf build
xcodebuild clean

# Reinstall pods
rm -rf Pods Podfile.lock
pod install
cd ..

# Rebuild
npm run ios
```

### Android Build Fails

```bash
# Clean Gradle
cd android
./gradlew clean

# Clear caches
./gradlew cleanBuildCache
cd ..

# Rebuild
npm run android
```

### Changes Not Reflecting

1. **Check Fast Refresh is enabled**
   - `Cmd + D` (iOS) or `Cmd + M` (Android)
   - Enable "Fast Refresh"

2. **Force reload**
   - `Cmd + R` (iOS) or `RR` (Android)

3. **Restart Metro**
   ```bash
   npm start -- --reset-cache
   ```

4. **Full rebuild**
   ```bash
   # iOS
   cd ios && rm -rf build && cd ..
   npm run ios

   # Android
   cd android && ./gradlew clean && cd ..
   npm run android
   ```

### Supabase Connection Issues

```bash
# Check Supabase is running (local)
supabase status

# Should show:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323

# Restart if needed
supabase stop
supabase start
```

### Port Already in Use

```bash
# Metro (8081)
lsof -ti:8081 | xargs kill -9

# Supabase API (54321)
lsof -ti:54321 | xargs kill -9

# Restart services
npm start
```

---

## Simulator / Emulator Setup

### iOS Simulator

**List Available Simulators:**
```bash
xcrun simctl list devices
```

**Create New Simulator:**
1. Open Xcode → Window → Devices and Simulators
2. Click "+" → Add Simulator
3. Choose "iPhone 15 Pro" (recommended)

**Run Specific Simulator:**
```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

**Simulator Shortcuts:**
- `Cmd + Shift + H` - Home button
- `Cmd + Shift + M` - Rotate
- `Cmd + K` - Toggle keyboard

### Android Emulator

**Create Emulator (Android Studio):**
1. Android Studio → Tools → AVD Manager
2. Create Virtual Device
3. Choose "Pixel 7 Pro" (recommended)
4. System Image: Android 13 (API 33)
5. Finish

**Start Emulator:**
```bash
# List emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_7_Pro_API_33

# OR use Android Studio AVD Manager
```

**Run on Emulator:**
```bash
npm run android
```

---

## Environment Variables Reference

```env
# .env file structure

# API Configuration
API_BASE_URL=http://localhost:3000          # Local backend
# API_BASE_URL=https://api.pruuf.app        # Production

# Supabase (Local Development)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-local-anon-key>

# Supabase (Cloud Development)
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=<your-cloud-anon-key>

# Stripe (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Firebase (Development Project)
FIREBASE_PROJECT_ID=pruuf-dev

# JWT (Local)
JWT_SECRET=local-dev-secret-key-change-in-production
JWT_EXPIRY=90d
```

---

## Production-like Testing

To test in a production-like environment:

### 1. Build Release Version

**iOS:**
```bash
# Build release scheme
npx react-native run-ios --configuration Release
```

**Android:**
```bash
# Build release APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

### 2. Use Staging Environment

Create `.env.staging`:
```env
API_BASE_URL=https://staging-api.pruuf.app
SUPABASE_URL=https://staging.pruuf.supabase.co
# ...
```

Load staging env:
```bash
cp .env.staging .env
npm start -- --reset-cache
```

---

## Keyboard Shortcuts Cheat Sheet

### Metro Bundler (in terminal)
- `r` - Reload app
- `d` - Open developer menu
- `i` - Run on iOS
- `a` - Run on Android

### iOS Simulator
- `Cmd + D` - Open developer menu
- `Cmd + R` - Reload
- `Cmd + Ctrl + Z` - Shake (for error dialog)

### Android Emulator
- `Cmd + M` - Open developer menu (macOS)
- `Ctrl + M` - Open developer menu (Windows/Linux)
- `R` (twice) - Reload

### VS Code
- `F5` - Start debugging
- `Shift + F5` - Stop debugging
- `Cmd + K, Cmd + R` - Reload window

---

## Next Steps

1. ✅ Environment configured
2. ✅ App running on simulator/emulator
3. ✅ Hot reload working
4. 📱 Create test accounts
5. 🧪 Test user flows
6. 🔧 Start development

### Recommended Test Flow

1. **Contact Onboarding:**
   - Sign up as Contact (`contact1@test.com`)
   - Invite a Member
   - View dashboard

2. **Member Onboarding:**
   - Sign up as Member (`member1@test.com`)
   - Accept invite code
   - Set check-in time
   - Perform check-in

3. **Test Features:**
   - Check-in flow (Member → Contact notification)
   - Missed check-in alert
   - Payment flow (test mode)

---

## Additional Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)

---

## Troubleshooting Checklist

Before asking for help, try:

- [ ] Metro bundler is running (`npm start`)
- [ ] No port conflicts (8081, 54321)
- [ ] `.env` file exists with correct values
- [ ] Dependencies installed (`npm install`, `pod install`)
- [ ] Cache cleared (`npm start -- --reset-cache`)
- [ ] Xcode/Android Studio updated to latest
- [ ] Simulator/emulator running
- [ ] No firewall blocking localhost connections

---

**Ready to start developing!** 🚀

Your changes will reflect instantly in the simulator/emulator with Fast Refresh enabled.
