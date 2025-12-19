# Installing Node.js for Pruuf Development

## Quick Fix

If you see **"Node.js not found"** when running `./scripts/quick-start.sh`, run this:

```bash
./scripts/install-node.sh
```

Then **close and reopen your terminal**, and try again:

```bash
./scripts/quick-start.sh
```

---

## What This Does

The install script will:
1. Install Homebrew (if not installed)
2. Install Node.js version 20
3. Add Node.js to your PATH
4. Update your shell configuration (~/.zshrc)

---

## Manual Installation (Alternative)

If the script doesn't work, install manually:

### Step 1: Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Add Homebrew to PATH

**For Apple Silicon Mac (M1/M2/M3):**
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**For Intel Mac:**
```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

### Step 3: Install Node.js

```bash
brew install node@20
```

### Step 4: Add Node.js to PATH

**For Apple Silicon Mac:**
```bash
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**For Intel Mac:**
```bash
echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 5: Verify Installation

```bash
node -v    # Should show v20.x.x
npm -v     # Should show 10.x.x
```

### Step 6: Continue Setup

```bash
./scripts/quick-start.sh
```

---

## Why This Happens

Node.js not being found usually means:

1. **Node.js not installed** - Most common reason
2. **Node.js not in PATH** - Installed but terminal can't find it
3. **Terminal needs restart** - PATH changes require new terminal session
4. **Using different shell** - PATH set in .zshrc but using bash

---

## Troubleshooting

### "brew: command not found"

Homebrew is not installed. Run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions shown to add Homebrew to your PATH.

### "node: command not found" (after installing)

Your terminal hasn't loaded the new PATH. Try:

1. **Close terminal and open new one**
2. OR run: `source ~/.zshrc`
3. OR run: `exec $SHELL`

Then check: `node -v`

### Node.js already installed but not detected

Find where Node.js is:

```bash
# Try these commands
/opt/homebrew/bin/node -v      # Apple Silicon
/usr/local/bin/node -v         # Intel Mac
~/.nvm/versions/node/*/bin/node -v  # If using NVM
```

If any work, add that directory to your PATH:

```bash
# Replace /path/to/node/bin with the path that worked
echo 'export PATH="/path/to/node/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Using NVM instead

If you prefer NVM (Node Version Manager):

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen terminal, then:
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node -v
```

---

## After Node.js is Installed

1. Close and reopen your terminal
2. Verify: `node -v` and `npm -v` both work
3. Run: `./scripts/quick-start.sh`
4. Continue with development!

---

## Alternative: Use System Node.js

If nothing works, you can download Node.js installer directly:

1. Visit: https://nodejs.org/
2. Download "LTS" version (20.x)
3. Run installer
4. Restart terminal
5. Verify: `node -v`

---

## Need More Help?

1. Check what shell you're using: `echo $SHELL`
2. Check your PATH: `echo $PATH`
3. Try finding Node: `which node`
4. List Homebrew packages: `brew list`
5. Check Homebrew doctor: `brew doctor`

---

## Quick Reference

```bash
# Install Node.js automatically
./scripts/install-node.sh

# Verify installation
node -v
npm -v

# Continue setup
./scripts/quick-start.sh

# If PATH issues
source ~/.zshrc

# Start fresh terminal
exec $SHELL
```
