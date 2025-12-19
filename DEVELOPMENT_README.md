# Pruuf Development Environment

**Get up and running in 5 minutes with hot reload enabled!**

## Quick Start (Fastest Way)

```bash
# One command setup
./scripts/quick-start.sh

# Then open 2 terminals:
# Terminal 1:
npm start

# Terminal 2:
npm run ios
```

**That's it!** Changes to your code will now appear instantly in the simulator.

---

## What You Get

✅ **Hot Reload** - Changes appear within 1 second
✅ **Local Supabase** - Full backend running locally
✅ **iOS Simulator** - Multiple device options
✅ **Android Emulator** - Ready to go
✅ **Test Accounts** - Pre-configured users
✅ **Development Dashboard** - Monitor all services
✅ **VS Code Integration** - Debug with breakpoints

---

## Development Workflow

### Step 1: Start Services

**Terminal 1 - Metro Bundler:**
```bash
npm start
```

You'll see:
```
             ######                ######
           ###     ####        ####     ###
         ##          ###    ###          ##

Metro waiting on http://localhost:8081
```

✅ Keep this running - it watches for file changes

### Step 2: Launch App

**Terminal 2 - iOS or Android:**
```bash
npm run ios
# OR
npm run android
```

App will build and launch in simulator/emulator.

### Step 3: Make Changes

Edit any file:

```tsx
// src/screens/auth/WelcomeScreen.tsx
<Text>Welcome to Pruuf! 🎉</Text>
```

**Save** → Screen updates automatically within 1 second! ⚡

---

## File Structure

```
Pruuf2/
├── src/
│   ├── screens/          # All app screens
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation setup
│   ├── store/            # Redux state management
│   ├── services/         # API & external services
│   ├── theme/            # Colors, fonts, spacing
│   └── utils/            # Helper functions
├── ios/                  # iOS native code
├── android/              # Android native code
├── supabase/             # Database & migrations
├── scripts/              # Development scripts
│   ├── quick-start.sh    # Automated setup
│   └── dev-dashboard.sh  # Status monitor
├── .env                  # Environment variables
└── DEV_SETUP_GUIDE.md    # Detailed documentation
```

---

## Hot Reload Explained

### What Updates Instantly?

- ✅ Component code (`.tsx` files)
- ✅ Styles (colors, layout, typography)
- ✅ Redux slices (state management)
- ✅ Navigation changes
- ✅ Utility functions
- ✅ Constants and configs

### What Needs Rebuild?

- ⚠️ New npm packages
- ⚠️ Native module changes
- ⚠️ iOS/Android configuration
- ⚠️ Environment variables (`.env`)

**To rebuild:** Stop app, run `npm run ios` or `npm run android` again

---

## Common Tasks

### View All Services Status

```bash
./scripts/dev-dashboard.sh
```

Shows:
- ✅ Metro Bundler (running/stopped)
- ✅ Supabase (API URL, Studio URL)
- ✅ iOS Simulators (which are running)
- ✅ Android Emulators (connected devices)
- ✅ Environment file status

### Force Refresh App

Sometimes hot reload misses changes:

**iOS:** `Cmd + R` in simulator
**Android:** Press `R` twice quickly in emulator

### Clear Caches

If things feel stuck:

```bash
npm run clean:all
npm start -- --reset-cache
npm run ios
```

### Switch Environment

Development → Staging:
```bash
cp .env.staging .env
npm start -- --reset-cache
npm run ios
```

---

## Test Accounts

### Quick Setup

Visit Supabase Studio: http://localhost:54323

1. Click **Authentication** → **Users**
2. Click **Add User**
3. Email: `test-contact@test.com`
4. Auto Confirm: ✅
5. Click **Create User**

Now you can log in with:
- Email: `test-contact@test.com`
- PIN: Set during first login

### Pre-made Test Accounts

If you ran migrations, these exist:
- **Contact:** `contact@test.com` (PIN: 1234)
- **Member:** `member@test.com` (PIN: 1234)

---

## Debugging

### Method 1: VS Code (Recommended)

1. Open VS Code
2. Press `F5`
3. Select "Debug iOS" or "Debug Android"
4. Set breakpoints by clicking line numbers
5. App launches with debugger attached

**Breakpoints work!** Code execution pauses at your breakpoints.

### Method 2: Chrome DevTools

1. Open dev menu in app:
   - iOS: `Cmd + D`
   - Android: `Cmd + M`
2. Select "Debug"
3. Chrome opens with DevTools
4. Use Console, Network, Sources tabs

### Method 3: React Native Debugger

```bash
brew install --cask react-native-debugger
open -a "React Native Debugger"
```

Then enable debugging in app dev menu.

---

## Troubleshooting

### Metro Won't Start

```bash
# Kill Metro
pkill -f metro

# Clear caches
npm run clean:metro

# Restart
npm start -- --reset-cache
```

### iOS Build Fails

```bash
npm run clean:ios
npm run clean:pods
npm run ios
```

### Android Build Fails

```bash
npm run clean:android
npm run android
```

### Changes Not Appearing

1. ✅ Check Fast Refresh is ON (dev menu)
2. ✅ Force reload: `Cmd + R` (iOS) or `RR` (Android)
3. ✅ Restart Metro with cache clear
4. ✅ Rebuild app completely

### Supabase Issues

```bash
# Check status
npm run supabase:status

# If stuck, restart
npm run supabase:stop
npm run supabase:start

# Nuclear option - reset database
npm run supabase:reset
```

---

## Key Commands Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run ios` | Launch iOS (default simulator) |
| `npm run ios:15pro` | Launch iPhone 15 Pro |
| `npm run android` | Launch Android |
| `npm run clean:all` | Clean all caches |
| `npm run supabase:start` | Start local Supabase |
| `npm run supabase:status` | Check Supabase |
| `./scripts/dev-dashboard.sh` | Status dashboard |
| `npm run type-check` | TypeScript validation |

---

## Development Tips

### 1. Keep Metro Running

Always have Metro running in Terminal 1. This enables hot reload.

### 2. Use Multiple Simulators

Test on different screen sizes:
```bash
npm run ios:15pro    # Large screen
npm run ios:15       # Medium screen
npm run ios:14pro    # Comparison
```

### 3. Monitor Logs

Open third terminal:
```bash
npm run log:ios
# OR
npm run log:android
```

See `console.log()` output in real-time.

### 4. Redux DevTools

Install Redux DevTools extension in Chrome, then:
1. Enable debugging in app
2. Redux tab shows all actions/state

### 5. Network Inspector

Use Flipper or Chrome DevTools to inspect:
- API calls
- Request/response data
- Network timing

---

## Project Structure Deep Dive

### Screens (`src/screens/`)

All app screens organized by feature:

```
screens/
├── auth/              # Welcome, Login, Signup
├── onboarding/        # First-time setup
├── member/            # Member (elderly) screens
├── contact/           # Contact (caregiver) screens
└── shared/            # Used by both roles
```

### Navigation (`src/navigation/`)

Controls app flow:

```typescript
// Root decides which stack to show
RootNavigator
├── AuthStack          // Not logged in
├── OnboardingStack    // First time
└── MainTabNavigator   // Main app
```

### Redux (`src/store/`)

State management:

```
store/slices/
├── authSlice.ts       # User authentication
├── memberSlice.ts     # Members & check-ins
├── settingsSlice.ts   # User preferences
├── paymentSlice.ts    # Subscription
└── notificationSlice.ts # Push notifications
```

### Theme (`src/theme/`)

Design system:

```typescript
// colors.ts
primary: '#4CAF50'    // Green - safety
accent: '#2196F3'     // Blue - trust

// typography.ts
fontSize: 16          // Base
fontSize: 20          // Large (1.25x)
fontSize: 24          // Extra Large (1.5x)

// spacing.ts
touchTargets.standard: 60  // 36% larger than Apple minimum
```

---

## Understanding Hot Reload

### How It Works

1. You save a file
2. Metro detects the change
3. Metro sends only the changed module to app
4. React Native reloads just that component
5. State is preserved (usually)

**Result:** Update appears in ~500ms without full rebuild!

### When State Resets

Hot reload usually preserves state, but resets if:
- Adding new component files
- Changing component export names
- Errors during reload

**Solution:** Use Redux or React Context for important state.

### Forcing Full Reload

Sometimes you want full reload:
- `Cmd + R` (iOS) or `RR` (Android) - Manual reload
- `npm start -- --reset-cache` - Clear Metro cache

---

## Environment Variables

### Development Setup

Your `.env` file should have:

```env
# Points to local Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<from-supabase-start>

# Local backend (if running)
API_BASE_URL=http://localhost:3000

# Test mode Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### After Changing `.env`

Environment variables are bundled at build time:

```bash
# 1. Stop Metro
Ctrl + C

# 2. Restart with cache clear
npm start -- --reset-cache

# 3. Rebuild app
npm run ios
```

**Tip:** Keep different files:
- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production (never committed)

Copy the one you need:
```bash
cp .env.staging .env
```

---

## Working with Supabase

### Studio Dashboard

Visit: http://localhost:54323

Features:
- **Table Editor** - View/edit database
- **SQL Editor** - Run queries
- **Authentication** - Manage users
- **Storage** - File uploads
- **Logs** - Debug issues

### Running Migrations

```bash
# Create new migration
supabase migration new add_feature

# Apply migrations
supabase db reset
```

### Querying from App

```typescript
// src/services/supabase.ts
import { supabase } from './supabase';

// Fetch data
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('user_id', userId);
```

---

## Testing User Flows

### Contact Flow

1. Sign up: `contact1@test.com`
2. Create PIN: `1234`
3. Invite Member: `member1@test.com`
4. Get invite code from email/logs
5. View dashboard with pending invite

### Member Flow

1. Sign up: `member1@test.com`
2. Create PIN: `1234`
3. Enter invite code from Contact
4. Set check-in time: 10:00 AM
5. Tap "I'm OK" button
6. See confirmation

### Check-in Flow

1. As Member: Tap "I'm OK"
2. Watch console logs
3. As Contact: Receive push notification
4. See Member card update to "Checked In"

---

## Performance Monitoring

### Metro Bundler

Watch Terminal 1 for:
```
 BUNDLE  ./index.js ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100.0% (1234/1234)
```

Slow bundles mean:
- Too many dependencies
- Large images
- Time to optimize!

### App Performance

Use Flipper:
```bash
open -a Flipper
```

Monitor:
- FPS (should be 60)
- Memory usage
- Render times

---

## Documentation

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command cheat sheet
- **[DEV_SETUP_GUIDE.md](./DEV_SETUP_GUIDE.md)** - Comprehensive setup guide
- **[GRAND_SUMMARY.md](./GRAND_SUMMARY.md)** - Full app specification
- **[CLAUDE.md](./CLAUDE.md)** - AI development guide

---

## Getting Help

1. ✅ Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for commands
2. ✅ Run `./scripts/dev-dashboard.sh` to check status
3. ✅ Try `npm run clean:all` if stuck
4. ✅ Check [React Native docs](https://reactnative.dev)
5. ✅ Check [Supabase docs](https://supabase.com/docs)

---

## Next Steps

1. ✅ Run `./scripts/quick-start.sh` (if not done)
2. ✅ Start Metro: `npm start`
3. ✅ Launch app: `npm run ios`
4. ✅ Make a change and see it appear instantly!
5. ✅ Create test accounts
6. ✅ Test user flows
7. 🚀 Start building features!

---

**You're all set!** Changes will now appear instantly in your simulator with hot reload enabled. Happy coding! 🎉
