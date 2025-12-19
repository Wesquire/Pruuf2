# Development Scripts

## quick-start.sh

**Automated setup script - run once**

```bash
./scripts/quick-start.sh
```

**What it does:**
1. ✅ Checks prerequisites (Node.js, Watchman, CocoaPods, Supabase CLI)
2. ✅ Installs missing tools automatically
3. ✅ Runs `npm install`
4. ✅ Installs iOS pods (`pod install`)
5. ✅ Creates `.env` from `.env.local`
6. ✅ Starts Supabase
7. ✅ Displays connection credentials

**When to run:**
- First time setting up the project
- After cloning the repo
- When switching machines
- After major dependency updates

---

## dev-dashboard.sh

**Real-time development status monitor**

```bash
./scripts/dev-dashboard.sh
```

**What it shows:**
- 📦 Metro Bundler status (port 8081)
- 🗄️ Supabase status (API, Studio URLs)
- 🍎 iOS Simulators (running instances)
- 🤖 Android Emulators (connected devices)
- ⚙️ Environment file status
- 📚 Dependencies status (node_modules, Pods)

**Watch mode** (updates every 5 seconds):
```bash
./scripts/dev-dashboard.sh --watch
```

**When to run:**
- Before starting development
- When something isn't working
- To check which services are running
- When switching between projects

---

## Usage Examples

### Complete Setup Flow

```bash
# 1. Run automated setup (once)
./scripts/quick-start.sh

# 2. Check everything is ready
./scripts/dev-dashboard.sh

# 3. Start development
npm start  # Terminal 1
npm run ios  # Terminal 2
```

### Daily Development Flow

```bash
# Morning - check status
./scripts/dev-dashboard.sh

# If Supabase isn't running
npm run supabase:start

# Start Metro
npm start  # Terminal 1

# Launch app
npm run ios  # Terminal 2
```

### Troubleshooting Flow

```bash
# Check what's running
./scripts/dev-dashboard.sh

# If Metro is stuck
pkill -f metro
npm start -- --reset-cache

# If Supabase is stuck
npm run supabase:stop
npm run supabase:start

# Check status again
./scripts/dev-dashboard.sh
```

---

## Making Scripts Executable

If you get "permission denied":

```bash
chmod +x scripts/quick-start.sh
chmod +x scripts/dev-dashboard.sh
```

---

## Adding New Scripts

To add a new development script:

1. Create file in `scripts/` directory
2. Add shebang: `#!/bin/bash`
3. Make executable: `chmod +x scripts/your-script.sh`
4. Add npm script in `package.json`:
   ```json
   "scripts": {
     "your-command": "./scripts/your-script.sh"
   }
   ```

---

## Script Dependencies

Both scripts require:
- Bash shell
- Standard Unix tools (`lsof`, `grep`, `awk`)
- Development tools:
  - Node.js & npm
  - Watchman (for Metro)
  - CocoaPods (for iOS, macOS only)
  - Supabase CLI
  - Xcode (for iOS, macOS only)
  - Android Studio (for Android)

The `quick-start.sh` script will install missing dependencies automatically.
