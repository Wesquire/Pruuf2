# Fix: CocoaPods Not in PATH

## The Warning

```
WARNING: You don't have /Users/wesquire/.local/share/gem/ruby/3.3.0/bin in your PATH,
         gem executables (pod, sandbox-pod) will not run.
```

**What this means:** CocoaPods was installed successfully, but your terminal can't find the `pod` command because the gem bin directory isn't in your PATH.

---

## Quick Fix

**Option 1: Reload Shell (Easiest)**

The PATH has already been added to your ~/.zshrc. Just reload it:

```bash
# Option A: Source the config
source ~/.zshrc

# Option B: Restart shell
exec $SHELL

# Option C: Close and reopen terminal (most reliable)
```

Then verify:
```bash
pod --version    # Should show version now
which pod        # Should show path
```

**Option 2: Add PATH Manually**

If the above doesn't work, add it manually:

```bash
echo 'export PATH="/Users/wesquire/.local/share/gem/ruby/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Verify the Fix

```bash
# Check if pod is now accessible
pod --version
# Should output: 1.14.x or similar

# Check where pod is located
which pod
# Should output: /Users/wesquire/.local/share/gem/ruby/3.3.0/bin/pod

# Check your PATH includes the gem bin
echo $PATH | grep "3.3.0/bin"
# Should show the gem bin directory
```

---

## What Was Fixed

I've already:
1. ✅ Added the gem bin path to your ~/.zshrc
2. ✅ Updated quick-start.sh to automatically detect and add this path
3. ✅ Updated fix-ruby-cocoapods.sh to check multiple gem bin locations

**Now you just need to reload your shell to use the new PATH.**

---

## Why This Happens

When you install gems with `--user-install` (which avoids needing sudo), gems are installed to:
```
~/.local/share/gem/ruby/3.3.0/
```

The executables go in:
```
~/.local/share/gem/ruby/3.3.0/bin/
```

This directory must be in your PATH for the `pod` command to work.

---

## Troubleshooting

### "pod: command not found" after reload

Check if the directory exists:
```bash
ls -la ~/.local/share/gem/ruby/3.3.0/bin/pod
```

If it exists, manually add to PATH:
```bash
export PATH="/Users/wesquire/.local/share/gem/ruby/3.3.0/bin:$PATH"
pod --version  # Should work now
```

Make it permanent:
```bash
echo 'export PATH="$HOME/.local/share/gem/ruby/3.3.0/bin:$PATH"' >> ~/.zshrc
```

### Still not working?

Check which Ruby is being used:
```bash
which ruby
ruby -v
```

Should show Ruby 3.3 from Homebrew, not system Ruby (2.6).

If showing system Ruby, add Ruby 3.3 to PATH first:
```bash
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"  # Apple Silicon
# OR
export PATH="/usr/local/opt/ruby@3.3/bin:$PATH"  # Intel Mac
```

Then try finding gem bin again:
```bash
ruby -r rubygems -e 'puts Gem.user_dir'
```

Add the `/bin` to that path.

---

## Quick Commands

```bash
# Reload shell config
source ~/.zshrc

# Verify pod works
pod --version

# If not working, add manually
echo 'export PATH="$HOME/.local/share/gem/ruby/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Continue setup
./scripts/quick-start.sh
```

---

## What's in ~/.zshrc Now

Your ~/.zshrc should have these additions:

```bash
# Ruby 3.3 from Homebrew
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"

# Gem executables (CocoaPods)
export PATH="/Users/wesquire/.local/share/gem/ruby/3.3.0/bin:$PATH"
```

---

## Next Steps

1. ✅ Reload shell: `source ~/.zshrc`
2. ✅ Verify: `pod --version`
3. ✅ Continue: `./scripts/quick-start.sh`

---

**The PATH is now fixed and this warning won't appear again!**
