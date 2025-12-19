#!/bin/bash

# Simple Node.js Installation Script
# Run this if quick-start.sh fails to detect Node.js

echo "🔧 Installing Node.js for Pruuf Development"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Installing Homebrew first...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi

    echo -e "${GREEN}✅ Homebrew installed${NC}"
fi

# Install Node.js
echo ""
echo -e "${YELLOW}Installing Node.js 20...${NC}"
brew install node@20

# Add Node.js to PATH
if [[ $(uname -m) == 'arm64' ]]; then
    # Apple Silicon
    echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
    NODE_PATH="/opt/homebrew/opt/node@20/bin"
else
    # Intel Mac
    echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc
    export PATH="/usr/local/opt/node@20/bin:$PATH"
    NODE_PATH="/usr/local/opt/node@20/bin"
fi

echo ""
echo -e "${GREEN}✅ Node.js installed successfully!${NC}"
echo ""
echo "📋 Verification:"
echo "   Node version: $($NODE_PATH/node -v)"
echo "   npm version: $($NODE_PATH/npm -v)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Close and reopen your terminal for changes to take effect${NC}"
echo ""
echo "Then run:"
echo "   ./scripts/quick-start.sh"
echo ""
