#!/bin/bash

# Fix Ruby and CocoaPods Installation Issues
# Run this if you get Ruby version errors with CocoaPods

echo "🔧 Fixing Ruby and CocoaPods"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check current Ruby version
CURRENT_RUBY=$(ruby -v)
echo "Current Ruby: $CURRENT_RUBY"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew not found. Please run ./scripts/quick-start.sh first${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing Ruby 3.3 via Homebrew...${NC}"
brew install ruby@3.3

# Determine architecture and set paths
if [[ $(uname -m) == 'arm64' ]]; then
    # Apple Silicon
    RUBY_PATH="/opt/homebrew/opt/ruby@3.3/bin"
    GEM_PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin"
else
    # Intel Mac
    RUBY_PATH="/usr/local/opt/ruby@3.3/bin"
    GEM_PATH="/usr/local/lib/ruby/gems/3.3.0/bin"
fi

# Add to PATH for this session
export PATH="$RUBY_PATH:$PATH"
export PATH="$GEM_PATH:$PATH"

# Add to shell config permanently
SHELL_CONFIG="$HOME/.zshrc"
if [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_CONFIG="$HOME/.bash_profile"
fi

echo ""
echo -e "${YELLOW}Updating $SHELL_CONFIG...${NC}"

# Add Ruby to PATH
if ! grep -q "$RUBY_PATH" "$SHELL_CONFIG"; then
    echo "" >> "$SHELL_CONFIG"
    echo "# Ruby 3.3 from Homebrew" >> "$SHELL_CONFIG"
    echo "export PATH=\"$RUBY_PATH:\$PATH\"" >> "$SHELL_CONFIG"
    echo "export PATH=\"$GEM_PATH:\$PATH\"" >> "$SHELL_CONFIG"
    echo -e "${GREEN}✅ Added Ruby 3.3 to PATH${NC}"
fi

# Verify Ruby version
NEW_RUBY_VERSION=$($RUBY_PATH/ruby -v)
echo ""
echo -e "${GREEN}✅ Ruby installed: $NEW_RUBY_VERSION${NC}"

# Install CocoaPods
echo ""
echo -e "${YELLOW}Installing CocoaPods...${NC}"

# Use --user-install to avoid needing sudo
gem install cocoapods --user-install

# Add gem bin directory to PATH - Try multiple possible locations
POSSIBLE_GEM_BINS=(
    "$HOME/.local/share/gem/ruby/3.3.0/bin"
    "$HOME/.gem/ruby/3.3.0/bin"
    "$($RUBY_PATH/ruby -r rubygems -e 'puts Gem.user_dir' 2>/dev/null)/bin"
)

for USER_GEM_BIN in "${POSSIBLE_GEM_BINS[@]}"; do
    if [[ -d "$USER_GEM_BIN" ]] && [[ -f "$USER_GEM_BIN/pod" ]]; then
        export PATH="$USER_GEM_BIN:$PATH"

        if ! grep -q "$USER_GEM_BIN" "$SHELL_CONFIG"; then
            echo "" >> "$SHELL_CONFIG"
            echo "# Gem executables (CocoaPods)" >> "$SHELL_CONFIG"
            echo "export PATH=\"$USER_GEM_BIN:\$PATH\"" >> "$SHELL_CONFIG"
            echo -e "${GREEN}✅ Added gem bin ($USER_GEM_BIN) to PATH${NC}"
        fi
        break
    fi
done

# Verify pod installation
echo ""
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✅ CocoaPods installed: $POD_VERSION${NC}"
else
    # Try with full path
    if [[ -f "$USER_GEM_BIN/pod" ]]; then
        POD_VERSION=$($USER_GEM_BIN/pod --version)
        echo -e "${GREEN}✅ CocoaPods installed: $POD_VERSION${NC}"
    else
        echo -e "${RED}❌ CocoaPods installation failed${NC}"
        echo "Try manually: gem install cocoapods"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ All done!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Close and reopen your terminal for changes to take effect${NC}"
echo ""
echo "Then verify:"
echo "  ruby -v     # Should show ruby 3.3.x"
echo "  pod --version # Should show version"
echo ""
echo "Then continue with:"
echo "  ./scripts/quick-start.sh"
echo ""
