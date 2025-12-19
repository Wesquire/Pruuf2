#!/bin/bash

# Pruuf Quick Start Script
# This script sets up your development environment in one command

set -e  # Exit on error

echo "🚀 Pruuf Development Environment Setup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to add path to shell config
add_to_path() {
    local path_to_add=$1
    local shell_config=""

    # Detect shell and config file
    if [[ -n "$ZSH_VERSION" ]]; then
        shell_config="$HOME/.zshrc"
    elif [[ -n "$BASH_VERSION" ]]; then
        shell_config="$HOME/.bash_profile"
    fi

    if [[ -n "$shell_config" ]] && [[ -f "$shell_config" ]]; then
        if ! grep -q "$path_to_add" "$shell_config"; then
            echo "export PATH=\"$path_to_add:\$PATH\"" >> "$shell_config"
            echo -e "${YELLOW}Added $path_to_add to $shell_config${NC}"
        fi
    fi
}

# Function to check for Homebrew and install if missing
ensure_homebrew() {
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}⚠️  Homebrew not found. Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH for Apple Silicon
        if [[ $(uname -m) == 'arm64' ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
            add_to_path "/opt/homebrew/bin"
        else
            eval "$(/usr/local/bin/brew shellenv)"
            add_to_path "/usr/local/bin"
        fi

        echo -e "${GREEN}✅ Homebrew installed${NC}"
    fi
}

# Check prerequisites
echo "📋 Checking prerequisites..."

# Ensure Homebrew is installed first
ensure_homebrew

# Node.js - Try multiple methods to find it
NODE_CMD=""

# Method 1: Check if node is in PATH
if command -v node &> /dev/null; then
    NODE_CMD="node"
# Method 2: Check Homebrew locations
elif [[ -f "/opt/homebrew/bin/node" ]]; then
    NODE_CMD="/opt/homebrew/bin/node"
    export PATH="/opt/homebrew/bin:$PATH"
    add_to_path "/opt/homebrew/bin"
elif [[ -f "/usr/local/bin/node" ]]; then
    NODE_CMD="/usr/local/bin/node"
    export PATH="/usr/local/bin:$PATH"
    add_to_path "/usr/local/bin"
# Method 3: Check NVM
elif [[ -f "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
    if command -v node &> /dev/null; then
        NODE_CMD="node"
    fi
fi

# If still not found, install it
if [[ -z "$NODE_CMD" ]]; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing via Homebrew...${NC}"
    brew install node@20

    # Add to PATH
    if [[ $(uname -m) == 'arm64' ]]; then
        export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
        add_to_path "/opt/homebrew/opt/node@20/bin"
        NODE_CMD="/opt/homebrew/opt/node@20/bin/node"
    else
        export PATH="/usr/local/opt/node@20/bin:$PATH"
        add_to_path "/usr/local/opt/node@20/bin"
        NODE_CMD="/usr/local/opt/node@20/bin/node"
    fi

    echo -e "${GREEN}✅ Node.js installed${NC}"
fi

# Verify Node.js version
NODE_VERSION=$($NODE_CMD -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version is $($NODE_CMD -v), but 18+ is recommended${NC}"
    echo -e "${YELLOW}⚠️  Upgrading Node.js...${NC}"
    brew upgrade node
fi
echo -e "${GREEN}✅ Node.js $($NODE_CMD -v)${NC}"

# Make sure npm is available too
if ! command -v npm &> /dev/null; then
    export PATH="$(dirname $NODE_CMD):$PATH"
fi

# Watchman
if ! command -v watchman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Watchman not found. Installing...${NC}"
    brew install watchman
fi
echo -e "${GREEN}✅ Watchman installed${NC}"

# CocoaPods (for iOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v pod &> /dev/null; then
        echo -e "${YELLOW}⚠️  CocoaPods not found. Installing...${NC}"

        # Check Ruby version
        RUBY_VERSION=$(ruby -v | grep -oE '[0-9]+\.[0-9]+' | head -1)
        RUBY_MAJOR=$(echo $RUBY_VERSION | cut -d'.' -f1)
        RUBY_MINOR=$(echo $RUBY_VERSION | cut -d'.' -f2)

        # Ruby 3.1+ is required for modern CocoaPods
        if [[ $RUBY_MAJOR -lt 3 ]] || [[ $RUBY_MAJOR -eq 3 && $RUBY_MINOR -lt 1 ]]; then
            echo -e "${YELLOW}⚠️  System Ruby $RUBY_VERSION is too old. Installing Ruby 3.3 via Homebrew...${NC}"
            brew install ruby@3.3

            # Add Ruby to PATH
            if [[ $(uname -m) == 'arm64' ]]; then
                export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
                export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"
                add_to_path "/opt/homebrew/opt/ruby@3.3/bin"
                add_to_path "/opt/homebrew/lib/ruby/gems/3.3.0/bin"
            else
                export PATH="/usr/local/opt/ruby@3.3/bin:$PATH"
                export PATH="/usr/local/lib/ruby/gems/3.3.0/bin:$PATH"
                add_to_path "/usr/local/opt/ruby@3.3/bin"
                add_to_path "/usr/local/lib/ruby/gems/3.3.0/bin"
            fi

            echo -e "${GREEN}✅ Ruby 3.3 installed${NC}"
        fi

        # Now install CocoaPods
        echo -e "${YELLOW}Installing CocoaPods...${NC}"
        gem install cocoapods --user-install

        # Add gem bin to PATH - Try multiple possible locations
        POSSIBLE_GEM_BINS=(
            "$HOME/.local/share/gem/ruby/3.3.0/bin"
            "$HOME/.gem/ruby/3.3.0/bin"
            "$(ruby -r rubygems -e 'puts Gem.user_dir' 2>/dev/null)/bin"
        )

        for GEM_BIN_DIR in "${POSSIBLE_GEM_BINS[@]}"; do
            if [[ -d "$GEM_BIN_DIR" ]] && [[ -f "$GEM_BIN_DIR/pod" ]]; then
                export PATH="$GEM_BIN_DIR:$PATH"
                add_to_path "$GEM_BIN_DIR"
                echo -e "${GREEN}✅ Added gem bin ($GEM_BIN_DIR) to PATH${NC}"
                break
            fi
        done
    fi
    echo -e "${GREEN}✅ CocoaPods installed${NC}"
fi

# Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    brew install supabase/tap/supabase
fi
echo -e "${GREEN}✅ Supabase CLI installed${NC}"

echo ""
echo "📦 Installing dependencies..."

# Install npm packages
npm install

# Install iOS pods (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 Installing iOS dependencies..."
    cd ios
    pod install
    cd ..
    echo -e "${GREEN}✅ iOS pods installed${NC}"
fi

echo ""
echo "⚙️  Setting up environment..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.local .env
    echo -e "${GREEN}✅ Created .env file from .env.local${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your Supabase credentials${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo "🗄️  Starting Supabase..."

# Start Supabase
cd supabase
if supabase status &> /dev/null; then
    echo -e "${GREEN}✅ Supabase already running${NC}"
else
    supabase start
    echo -e "${GREEN}✅ Supabase started${NC}"
fi
cd ..

# Display Supabase credentials
echo ""
echo "📋 Supabase Credentials:"
echo "========================"
cd supabase
supabase status | grep -E "(API URL|anon key|service_role key|Studio URL)"
cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env with Supabase credentials (shown above)"
echo "2. Open two terminals:"
echo "   Terminal 1: npm start"
echo "   Terminal 2: npm run ios (or npm run android)"
echo ""
echo "📖 See DEV_SETUP_GUIDE.md for detailed instructions"
echo ""
echo "🚀 Quick commands:"
echo "   npm start              - Start Metro bundler"
echo "   npm run ios            - Run on iOS"
echo "   npm run ios:15pro      - Run on iPhone 15 Pro"
echo "   npm run android        - Run on Android"
echo "   npm run supabase:status - Check Supabase status"
echo "   npm run clean:all      - Clean all caches"
echo ""
