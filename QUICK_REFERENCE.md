# Pruuf Development Quick Reference

## One-Time Setup

```bash
# Run automated setup script
./scripts/quick-start.sh
```

**OR Manual Setup:**

```bash
# 1. Copy environment file
cp .env.local .env

# 2. Install dependencies
npm install

# 3. Install iOS pods (macOS only)
cd ios && pod install && cd ..

# 4. Start Supabase
npm run supabase:start
```

---

## Daily Development Workflow

### Terminal 1: Start Metro Bundler

```bash
npm start
```

Keep this running. Metro will watch for file changes and hot reload.

### Terminal 2: Run App

**iOS:**
```bash
npm run ios                # Default simulator
npm run ios:15pro          # iPhone 15 Pro
npm run ios:15             # iPhone 15
npm run ios:14pro          # iPhone 14 Pro
```

**Android:**
```bash
npm run android            # Default emulator
npm run android:pixel7     # Pixel 7 Pro
```

### Terminal 3: Monitor Status

```bash
# Quick status check
./scripts/dev-dashboard.sh

# Watch mode (updates every 5 seconds)
./scripts/dev-dashboard.sh --watch
```

---

## Hot Reload / Fast Refresh

**Changes reflect instantly for:**
- Component code (.tsx files)
- Styles (StyleSheet changes)
- Redux slices
- Utility functions
- Constants

**Requires app rebuild for:**
- New npm packages
- Native module changes
- iOS/Android configuration
- Environment variables

**Manual Refresh:**
- iOS: `Cmd + R`
- Android: `R` (press twice quickly)

**Enable Fast Refresh:**
- iOS: `Cmd + D` → Enable Fast Refresh
- Android: `Cmd + M` → Enable Fast Refresh

---

## Common Commands

### Development

```bash
npm start                  # Start Metro bundler
npm start -- --reset-cache # Start with clean cache
npm run ios                # Run on iOS simulator
npm run android            # Run on Android emulator
```

### Cleaning

```bash
npm run clean:metro        # Clear Metro cache
npm run clean:ios          # Clean iOS build
npm run clean:android      # Clean Android build
npm run clean:pods         # Reinstall iOS pods
npm run clean:all          # Clean everything
```

### Supabase

```bash
npm run supabase:start     # Start local Supabase
npm run supabase:stop      # Stop local Supabase
npm run supabase:status    # Check status
npm run supabase:reset     # Reset database
```

### Debugging

```bash
npm run log:ios            # View iOS logs
npm run log:android        # View Android logs
npm run type-check         # TypeScript check
npm run lint               # Lint code
npm run lint:fix           # Fix lint errors
```

### Testing

```bash
npm test                   # Run tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

---

## Keyboard Shortcuts

### In Metro Bundler Terminal

- `r` - Reload app
- `d` - Open developer menu
- `i` - Run on iOS
- `a` - Run on Android

### iOS Simulator

- `Cmd + D` - Developer menu
- `Cmd + R` - Reload
- `Cmd + Shift + H` - Home button
- `Cmd + Shift + M` - Rotate device
- `Cmd + K` - Toggle keyboard

### Android Emulator

- `Cmd + M` - Developer menu (macOS)
- `R` (twice) - Reload
- `Ctrl + M` - Developer menu (Windows/Linux)

---

## Troubleshooting

### Metro Won't Start

```bash
# Kill existing processes
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

### Changes Not Showing

1. Check Fast Refresh is enabled (Dev Menu)
2. Force reload: `Cmd + R` (iOS) or `RR` (Android)
3. Restart Metro: `npm start -- --reset-cache`
4. Clean build: `npm run clean:all`
5. Full rebuild: Kill app, run `npm run ios` again

### Supabase Not Running

```bash
npm run supabase:status    # Check status
npm run supabase:stop      # Stop if stuck
npm run supabase:start     # Start fresh
```

### Port Conflicts

```bash
# Metro (8081)
lsof -ti:8081 | xargs kill -9

# Supabase (54321, 54322, 54323)
lsof -ti:54321 | xargs kill -9
lsof -ti:54322 | xargs kill -9
lsof -ti:54323 | xargs kill -9
```

---

## Test Accounts

### Creating Test Users

**Option 1: Supabase Studio**

1. Visit: http://localhost:54323
2. Auth → Users → Add User
3. Email: `test-contact@test.com`
4. Auto confirm: ✅
5. Create User

**Option 2: SQL Editor**

```sql
-- In Supabase Studio → SQL Editor
INSERT INTO auth.users (email, email_confirmed_at, encrypted_password)
VALUES (
  'test@example.com',
  NOW(),
  crypt('password123', gen_salt('bf'))
);
```

### Pre-configured Accounts

If you ran database migrations:

- **Contact:** `contact@test.com` (PIN: 1234)
- **Member:** `member@test.com` (PIN: 1234)

---

## File Locations

```
📁 Project Root
├── src/                   # Source code
│   ├── components/        # Reusable components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation config
│   ├── store/             # Redux store
│   ├── services/          # API & external services
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Helper functions
│   ├── theme/             # Design system
│   └── types/             # TypeScript types
├── ios/                   # iOS native code
├── android/               # Android native code
├── supabase/              # Database migrations
├── .env                   # Environment variables
└── package.json           # Dependencies & scripts
```

---

## Environment Variables

```env
# Local Development (.env)
API_BASE_URL=http://localhost:3000
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<from-supabase-start>

# Production/Staging
API_BASE_URL=https://api.pruuf.app
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=<production-key>
```

After changing `.env`:
1. Stop Metro (`Ctrl + C`)
2. Restart: `npm start -- --reset-cache`
3. Rebuild app: `npm run ios` or `npm run android`

---

## URLs & Ports

| Service | URL | Description |
|---------|-----|-------------|
| Metro Bundler | http://localhost:8081 | React Native bundler |
| Supabase API | http://localhost:54321 | Local Supabase API |
| Supabase DB | postgresql://localhost:54322 | PostgreSQL database |
| Supabase Studio | http://localhost:54323 | Admin dashboard |

---

## VS Code Integration

### Run with Debugger

1. Press `F5`
2. Select "Debug iOS" or "Debug Android"
3. App launches with debugger attached
4. Set breakpoints in code

### Recommended Extensions

- React Native Tools
- ESLint
- Prettier
- ES7+ React/Redux snippets
- Auto Rename Tag
- Supabase VS Code

Install all: `Cmd + Shift + P` → "Extensions: Show Recommended Extensions"

---

## Pro Tips

1. **Always keep Metro running** in a dedicated terminal
2. **Use hot reload** - most changes show instantly
3. **Check dev dashboard** before starting work
4. **Clear caches** if something feels wrong
5. **Use VS Code debugger** for complex debugging
6. **Commit often** - easier to rollback if needed
7. **Run type-check** before committing: `npm run type-check`
8. **Test on both platforms** before pushing

---

## Getting Help

1. Check this file for common issues
2. Read [DEV_SETUP_GUIDE.md](./DEV_SETUP_GUIDE.md) for detailed docs
3. Run dev dashboard: `./scripts/dev-dashboard.sh`
4. Check React Native docs: https://reactnative.dev
5. Check Supabase docs: https://supabase.com/docs

---

**Happy Coding!** 🚀
