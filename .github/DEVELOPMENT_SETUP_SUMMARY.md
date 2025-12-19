# Pruuf Development Setup - Complete Summary

## What Has Been Created

Your project now has a **complete development environment** with:

### 📄 Documentation Files

1. **[START_HERE.md](../../START_HERE.md)** - Begin here! 5-minute quickstart
2. **[QUICK_REFERENCE.md](../../QUICK_REFERENCE.md)** - Command cheat sheet
3. **[DEVELOPMENT_README.md](../../DEVELOPMENT_README.md)** - Complete development guide
4. **[DEV_SETUP_GUIDE.md](../../DEV_SETUP_GUIDE.md)** - Comprehensive setup instructions

### 🛠️ Scripts

1. **[quick-start.sh](../../scripts/quick-start.sh)** - Automated one-command setup
2. **[dev-dashboard.sh](../../scripts/dev-dashboard.sh)** - Real-time status monitor

### ⚙️ Configuration

1. **[.env.local](../../.env.local)** - Local development environment template
2. **[.vscode/launch.json](../../.vscode/launch.json)** - VS Code debugging
3. **[.vscode/settings.json](../../.vscode/settings.json)** - Editor settings
4. **[.vscode/extensions.json](../../.vscode/extensions.json)** - Recommended extensions
5. **[package.json](../../package.json)** - Enhanced with 30+ npm scripts

---

## Quick Start Guide

### Option 1: Automated (Recommended)

```bash
./scripts/quick-start.sh
```

Then open 2 terminals:

**Terminal 1:**
```bash
npm start
```

**Terminal 2:**
```bash
npm run ios
```

### Option 2: Manual

```bash
# 1. Environment
cp .env.local .env

# 2. Dependencies
npm install
cd ios && pod install && cd ..

# 3. Supabase
npm run supabase:start

# 4. Run
npm start          # Terminal 1
npm run ios        # Terminal 2
```

---

## Hot Reload is Enabled

**All changes appear instantly!**

- ✅ Component files (`.tsx`)
- ✅ Styles (`StyleSheet`)
- ✅ Redux state
- ✅ Navigation
- ✅ Utilities
- ✅ Theme/colors

**Save file → See change in ~1 second**

---

## Available Commands

### Essential

```bash
npm start                  # Start Metro bundler
npm run ios                # Launch iOS
npm run ios:15pro          # iPhone 15 Pro
npm run android            # Launch Android
```

### Monitoring

```bash
./scripts/dev-dashboard.sh # Status dashboard
npm run log:ios            # iOS logs
npm run log:android        # Android logs
npm run supabase:status    # Supabase status
```

### Cleaning

```bash
npm run clean:metro        # Clear Metro cache
npm run clean:ios          # Clean iOS build
npm run clean:android      # Clean Android build
npm run clean:pods         # Reinstall iOS pods
npm run clean:all          # Everything
```

### Supabase

```bash
npm run supabase:start     # Start local Supabase
npm run supabase:stop      # Stop Supabase
npm run supabase:status    # Check status
npm run supabase:reset     # Reset database
```

### Development

```bash
npm run type-check         # TypeScript validation
npm run lint               # Lint code
npm run lint:fix           # Auto-fix lint issues
npm test                   # Run tests
npm run test:watch         # Tests in watch mode
```

---

## Key URLs

| Service | URL | Description |
|---------|-----|-------------|
| Metro | http://localhost:8081 | React Native bundler |
| Supabase API | http://localhost:54321 | Local backend API |
| Supabase Studio | http://localhost:54323 | Database admin UI |
| Supabase DB | postgresql://localhost:54322 | PostgreSQL direct |

---

## Test Accounts Setup

### Quick Method

1. Visit: http://localhost:54323
2. Authentication → Users → Add User
3. Email: `test-contact@test.com`
4. Auto Confirm: ✅
5. Create User

### SQL Method

In Supabase Studio SQL Editor:

```sql
INSERT INTO auth.users (email, email_confirmed_at, encrypted_password)
VALUES (
  'test@example.com',
  NOW(),
  crypt('password123', gen_salt('bf'))
);
```

---

## VS Code Integration

### Debug with Breakpoints

1. Press `F5`
2. Select "Debug iOS" or "Debug Android"
3. Set breakpoints by clicking line numbers
4. App launches with debugger attached

### Recommended Extensions

Install all at once:
- Open Command Palette: `Cmd + Shift + P`
- Type: "Extensions: Show Recommended Extensions"
- Click "Install All"

Includes:
- React Native Tools
- ESLint
- Prettier
- React snippets
- Supabase extension

---

## Hot Reload Demo

### Test 1: Text Change

**File:** `src/screens/auth/WelcomeScreen.tsx`

```tsx
// Before
<Text>Welcome to Pruuf</Text>

// After
<Text>Welcome to Pruuf! 🎉</Text>
```

**Save** → ✅ Updates in <1 second

### Test 2: Color Change

**File:** `src/theme/colors.ts`

```typescript
// Before
primary: '#4CAF50',  // Green

// After
primary: '#FF0000',  // Red
```

**Save** → ✅ All primary colors turn red instantly

### Test 3: Layout Change

**File:** Any screen component

```tsx
// Before
<View style={styles.container}>

// After
<View style={[styles.container, { marginTop: 50 }]}>
```

**Save** → ✅ Layout adjusts immediately

---

## Troubleshooting Quick Fixes

### Issue: Metro Won't Start

```bash
pkill -f metro
npm run clean:metro
npm start -- --reset-cache
```

### Issue: iOS Build Fails

```bash
npm run clean:ios
npm run clean:pods
npm run ios
```

### Issue: Android Build Fails

```bash
npm run clean:android
npm run android
```

### Issue: Changes Not Appearing

1. Enable Fast Refresh in dev menu (`Cmd + D`)
2. Force reload: `Cmd + R` (iOS) or `RR` (Android)
3. Restart Metro: `npm start -- --reset-cache`

### Issue: Supabase Not Running

```bash
npm run supabase:stop
npm run supabase:start
npm run supabase:status
```

### Issue: Port Already in Use

```bash
# Metro (8081)
lsof -ti:8081 | xargs kill -9

# Supabase (54321, 54322, 54323)
lsof -ti:54321 | xargs kill -9
lsof -ti:54322 | xargs kill -9
lsof -ti:54323 | xargs kill -9
```

---

## Development Workflow

### Daily Routine

```bash
# Morning - start services
npm run supabase:start
npm start  # Keep running in Terminal 1

# Open new terminal
npm run ios  # OR npm run android

# Make changes - they appear instantly!

# Check status anytime
./scripts/dev-dashboard.sh

# End of day - optional cleanup
npm run supabase:stop
```

### Making Changes

1. **Edit any file** in `src/`
2. **Save** (`Cmd + S`)
3. **Watch** simulator update (~1 second)
4. **Repeat** - no rebuild needed!

### When to Rebuild

Only rebuild when you:
- Install new npm packages
- Change native code (iOS/Android)
- Modify `.env` file
- Update `package.json`

**To rebuild:**
```bash
# Stop Metro (Ctrl + C)
npm start -- --reset-cache
npm run ios
```

---

## Project Structure

```
Pruuf2/
├── 📄 START_HERE.md              ⭐ Start here!
├── 📄 QUICK_REFERENCE.md         Quick commands
├── 📄 DEVELOPMENT_README.md      Complete guide
├── 📄 DEV_SETUP_GUIDE.md         Detailed docs
│
├── 📁 src/                       Source code
│   ├── screens/                  App screens
│   ├── components/               UI components
│   ├── navigation/               Navigation config
│   ├── store/                    Redux state
│   ├── services/                 APIs & external
│   ├── theme/                    Design system
│   └── utils/                    Helpers
│
├── 📁 scripts/
│   ├── quick-start.sh            Automated setup
│   └── dev-dashboard.sh          Status monitor
│
├── 📁 .vscode/                   VS Code config
│   ├── launch.json               Debugging
│   ├── settings.json             Editor settings
│   └── extensions.json           Recommended extensions
│
├── 📁 supabase/                  Database
│   ├── migrations/               Database migrations
│   └── config.toml               Supabase config
│
├── 📁 ios/                       iOS native
├── 📁 android/                   Android native
└── 📄 .env                       Environment variables
```

---

## Next Steps

1. ✅ Run automated setup: `./scripts/quick-start.sh`
2. ✅ Start Metro: `npm start`
3. ✅ Launch app: `npm run ios`
4. ✅ Verify hot reload: Change text in any screen
5. ✅ Create test accounts: Visit http://localhost:54323
6. ✅ Test user flows: Signup → Login → Check-in
7. 🚀 Start developing features!

---

## Documentation Map

**Getting Started:**
- 📄 [START_HERE.md](../../START_HERE.md) - Begin here (5 min)

**Reference:**
- 📄 [QUICK_REFERENCE.md](../../QUICK_REFERENCE.md) - Commands cheat sheet
- 📄 [DEVELOPMENT_README.md](../../DEVELOPMENT_README.md) - Full dev guide

**Deep Dive:**
- 📄 [DEV_SETUP_GUIDE.md](../../DEV_SETUP_GUIDE.md) - Comprehensive setup
- 📄 [GRAND_SUMMARY.md](../../GRAND_SUMMARY.md) - Complete app spec
- 📄 [CLAUDE.md](../../CLAUDE.md) - AI development context

**Scripts:**
- 🛠️ [quick-start.sh](../../scripts/quick-start.sh) - Automated setup
- 🛠️ [dev-dashboard.sh](../../scripts/dev-dashboard.sh) - Status monitor

---

## Support

### Common Issues

All documented in:
- [QUICK_REFERENCE.md - Troubleshooting](../../QUICK_REFERENCE.md#troubleshooting)
- [DEV_SETUP_GUIDE.md - Common Issues](../../DEV_SETUP_GUIDE.md#common-issues--solutions)

### External Resources

- [React Native Docs](https://reactnative.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org)
- [Redux Toolkit](https://redux-toolkit.js.org)

---

**You're all set!** 🎉

Your development environment is fully configured with:
- ⚡ Hot reload (changes appear in ~1 second)
- 🗄️ Local Supabase (full backend)
- 📱 Simulators ready (iOS & Android)
- 🧪 Test accounts configurable
- 🐛 VS Code debugging
- 📊 Status dashboard
- 🛠️ Automated scripts

**Start coding and see changes instantly!**
