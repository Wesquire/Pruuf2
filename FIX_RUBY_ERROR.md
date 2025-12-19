# Fix Ruby/CocoaPods Installation Error

## The Error You Saw

```
ERROR: Error installing cocoapods:
The last version of securerandom (>= 0.3) to support your Ruby & RubyGems was 0.3.2.
Try installing it with `gem install securerandom -v 0.3.2` and then running the current command again
securerandom requires Ruby version >= 3.1.0. The current ruby version is 2.6.10.210.
```

**Translation:** Your system Ruby (2.6.10) is too old for modern CocoaPods. You need Ruby 3.1 or newer.

---

## Quick Fix (Easiest Way)

```bash
./scripts/fix-ruby-cocoapods.sh
```

Then:
1. **Close your terminal completely** (Cmd+Q)
2. **Open a new terminal**
3. **Verify Ruby version**: `ruby -v` (should show 3.3.x)
4. **Verify CocoaPods**: `pod --version`
5. **Continue setup**: `./scripts/quick-start.sh`

---

## What This Script Does

✅ Installs Ruby 3.3 via Homebrew (doesn't touch system Ruby)
✅ Adds Ruby 3.3 to your PATH
✅ Installs CocoaPods using the new Ruby
✅ Configures everything in your shell (~/.zshrc)
✅ Leaves system Ruby untouched (safe!)

---

## Manual Fix (Alternative)

### Step 1: Install Ruby 3.3

```bash
brew install ruby@3.3
```

### Step 2: Add Ruby to PATH

**For Apple Silicon (M1/M2/M3):**
```bash
echo 'export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**For Intel Mac:**
```bash
echo 'export PATH="/usr/local/opt/ruby@3.3/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/usr/local/lib/ruby/gems/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Install CocoaPods

```bash
gem install cocoapods --user-install
```

### Step 4: Add Gem Bin to PATH

```bash
# Get gem bin directory
GEM_BIN=$(ruby -r rubygems -e 'puts Gem.user_dir')/bin

# Add to PATH
echo "export PATH=\"$GEM_BIN:\$PATH\"" >> ~/.zshrc
source ~/.zshrc
```

### Step 5: Verify

```bash
ruby -v          # Should show ruby 3.3.x
pod --version    # Should show CocoaPods version
```

### Step 6: Continue

```bash
./scripts/quick-start.sh
```

---

## Why This Happens

**macOS comes with old Ruby (2.6.x)** that's outdated and can't install modern CocoaPods.

**Why not update system Ruby?**
- System Ruby is protected and used by macOS
- Updating it can break system tools
- Better to install separate Ruby via Homebrew

**Solution:**
Install modern Ruby 3.3 alongside system Ruby, prioritize it in PATH.

---

## What's Updated

The `quick-start.sh` script now:
1. ✅ Checks Ruby version before installing CocoaPods
2. ✅ Auto-installs Ruby 3.3 if current version is too old
3. ✅ Configures PATH automatically
4. ✅ Installs CocoaPods with correct Ruby

**This error will never happen again!**

---

## Troubleshooting

### "pod: command not found" (after install)

Your terminal hasn't loaded the new PATH:

```bash
# Option 1: Source shell config
source ~/.zshrc

# Option 2: Restart shell
exec $SHELL

# Option 3: Close and reopen terminal (most reliable)
```

### "gem install failed"

Try without sudo (user install):
```bash
gem install cocoapods --user-install
```

Then add gem bin to PATH:
```bash
GEM_BIN=$(ruby -r rubygems -e 'puts Gem.user_dir')/bin
echo "export PATH=\"$GEM_BIN:\$PATH\"" >> ~/.zshrc
source ~/.zshrc
```

### Still using old Ruby after install

Check which Ruby is being used:
```bash
which ruby
ruby -v
```

If it shows old version, your PATH isn't updated:

**Apple Silicon:**
```bash
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
which ruby  # Should now show Homebrew Ruby
```

**Intel Mac:**
```bash
export PATH="/usr/local/opt/ruby@3.3/bin:$PATH"
which ruby  # Should now show Homebrew Ruby
```

Make it permanent by adding to ~/.zshrc

### CocoaPods installed but pod doesn't work

Find where pod was installed:
```bash
find ~ -name pod -type f 2>/dev/null | grep bin
```

Add that directory to PATH:
```bash
echo "export PATH=\"/path/to/bin:\$PATH\"" >> ~/.zshrc
source ~/.zshrc
```

---

## Alternative: Use Bundler (Advanced)

If you prefer managing Ruby dependencies with Bundler:

### Create Gemfile

```bash
cd ios
cat > Gemfile << 'EOF'
source 'https://rubygems.org'
gem 'cocoapods', '~> 1.14'
EOF
```

### Install with Bundler

```bash
gem install bundler
bundle install
```

### Use CocoaPods via Bundler

```bash
bundle exec pod install
```

This approach isolates CocoaPods to the project.

---

## Verification Checklist

After fixing, verify everything works:

```bash
# Check Ruby version
ruby -v
# Should show: ruby 3.3.x

# Check where Ruby is from
which ruby
# Should show: /opt/homebrew/opt/ruby@3.3/bin/ruby (Apple Silicon)
# Or: /usr/local/opt/ruby@3.3/bin/ruby (Intel)

# Check CocoaPods
pod --version
# Should show: 1.14.x or newer

# Check which pod is used
which pod
# Should show path in gem bin directory

# Try installing pods (in ios directory)
cd ios
pod install
# Should work without errors
```

---

## System Ruby vs Homebrew Ruby

**System Ruby (DO NOT USE):**
- Location: `/usr/bin/ruby`
- Version: 2.6.10 (old!)
- Protected by macOS
- Can't install modern gems

**Homebrew Ruby (USE THIS):**
- Location: `/opt/homebrew/opt/ruby@3.3/bin/ruby` (Apple Silicon)
- Or: `/usr/local/opt/ruby@3.3/bin/ruby` (Intel)
- Version: 3.3.x (modern!)
- Safe to use for development
- Can install all modern gems

**How to ensure Homebrew Ruby is used:**

Your PATH should have Homebrew paths **before** `/usr/bin`:
```bash
echo $PATH
# Should start with /opt/homebrew/opt/ruby@3.3/bin (or similar)
```

---

## Quick Reference Commands

```bash
# Fix Ruby and CocoaPods automatically
./scripts/fix-ruby-cocoapods.sh

# Verify after fix (close/reopen terminal first)
ruby -v
pod --version

# Continue setup
./scripts/quick-start.sh

# If PATH issues
source ~/.zshrc

# Check Ruby location
which ruby

# Check CocoaPods location
which pod
```

---

## Next Steps

1. ✅ Run `./scripts/fix-ruby-cocoapods.sh`
2. ✅ Close terminal (Cmd+Q)
3. ✅ Open new terminal
4. ✅ Verify: `ruby -v` shows 3.3.x
5. ✅ Verify: `pod --version` works
6. ✅ Run `./scripts/quick-start.sh`
7. 🚀 Start developing!

---

**After this fix, you'll never see Ruby version errors again!**
