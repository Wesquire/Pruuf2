# 🚀 START HERE - Pruuf Development

**Get the app running with hot reload in 5 minutes!**

---

## ⚡ Fastest Setup

```bash
./scripts/quick-start.sh
```

This single command:
- ✅ Installs all dependencies (including Node.js if missing)
- ✅ Sets up iOS pods
- ✅ Starts Supabase
- ✅ Configures environment

**If you get "Node.js not found":**
```bash
./scripts/install-node.sh
# Then close and reopen terminal, and run quick-start.sh again
```

**If you get Ruby/CocoaPods error:**
```bash
./scripts/fix-ruby-cocoapods.sh
# Then close and reopen terminal, and run quick-start.sh again
```

**Then:**

```bash
# Terminal 1
npm start

# Terminal 2
npm run ios
```

**Done!** App is running with hot reload enabled.

---

## 📱 Verify Hot Reload Works

### Test 1: Change Text

1. Open: `src/screens/auth/WelcomeScreen.tsx`
2. Change any text
3. Save file
4. ✅ Screen updates within 1 second!

### Test 2: Change Color

1. Open: `src/theme/colors.ts`
2. Change `primary: '#4CAF50'` to `primary: '#FF0000'`
3. Save file
4. ✅ All primary-colored elements turn red!

### Test 3: Change Layout

1. Open any screen component
2. Add spacing: `marginTop: 20`
3. Save file
4. ✅ Layout updates instantly!

---

## 📊 Monitor Everything

```bash
./scripts/dev-dashboard.sh
```

Shows status of:
- Metro Bundler (http://localhost:8081)
- Supabase (http://localhost:54323)
- iOS Simulator
- Android Emulator
- Environment setup

---

## 🧪 Create Test Accounts

Visit: **http://localhost:54323** (Supabase Studio)

1. Go to: **Authentication** → **Users**
2. Click: **Add User**
3. Email: `test-contact@test.com`
4. Auto Confirm: ✅
5. Click: **Create User**

Repeat for `test-member@test.com`

Now you can test the full user flow!

---

## 🎯 Quick Commands

| Command | What It Does |
|---------|--------------|
| `npm start` | Start Metro (keep running) |
| `npm run ios` | Launch iOS app |
| `npm run android` | Launch Android app |
| `npm run ios:15pro` | Launch iPhone 15 Pro |
| `npm run clean:all` | Fix most issues |
| `npm run supabase:status` | Check Supabase |
| `./scripts/dev-dashboard.sh` | Show status |

---

## 🐛 Something Wrong?

### App Won't Start

```bash
npm run clean:all
npm start -- --reset-cache
npm run ios
```

### Changes Not Showing

1. In app, press `Cmd + D` (iOS) or `Cmd + M` (Android)
2. Enable "Fast Refresh"
3. Force reload: `Cmd + R` (iOS) or `RR` (Android)

### Supabase Issues

```bash
npm run supabase:stop
npm run supabase:start
```

---

## 📚 Documentation

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command cheat sheet
- **[DEVELOPMENT_README.md](./DEVELOPMENT_README.md)** - Full dev guide
- **[DEV_SETUP_GUIDE.md](./DEV_SETUP_GUIDE.md)** - Detailed setup instructions

---

## ✅ Checklist

- [ ] Run `./scripts/quick-start.sh`
- [ ] Start Metro: `npm start`
- [ ] Launch app: `npm run ios`
- [ ] Verify hot reload works (change text in a screen)
- [ ] Check status: `./scripts/dev-dashboard.sh`
- [ ] Create test accounts in Supabase Studio
- [ ] Test a user flow (signup → login → check-in)

**All checked?** You're ready to develop! 🎉

---

## 🚀 Start Developing

Your development environment is now:
- ⚡ **Hot reload enabled** - Changes appear instantly
- 🗄️ **Supabase running locally** - Full backend
- 📱 **Simulator ready** - iOS and/or Android
- 🧪 **Test accounts created** - Ready to test flows
- 🐛 **Debugger available** - Press F5 in VS Code

Make changes to any file and watch them appear in the app within 1 second!

**Happy coding!** 🚀
