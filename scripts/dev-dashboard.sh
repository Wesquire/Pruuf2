#!/bin/bash

# Pruuf Development Dashboard
# Displays real-time status of all development services

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         PRUUF DEVELOPMENT DASHBOARD                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Metro Bundler Status
echo -e "${BLUE}📦 Metro Bundler${NC}"
if lsof -i :8081 &> /dev/null; then
    echo -e "   ${GREEN}✅ Running on http://localhost:8081${NC}"
else
    echo -e "   ${RED}❌ Not running${NC} - Start with: npm start"
fi
echo ""

# Supabase Status
echo -e "${BLUE}🗄️  Supabase${NC}"
cd supabase 2>/dev/null
if supabase status &> /dev/null; then
    echo -e "   ${GREEN}✅ Running${NC}"
    API_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    STUDIO_URL=$(supabase status | grep "Studio URL" | awk '{print $3}')
    echo -e "   API: ${YELLOW}${API_URL}${NC}"
    echo -e "   Studio: ${YELLOW}${STUDIO_URL}${NC}"
else
    echo -e "   ${RED}❌ Not running${NC} - Start with: npm run supabase:start"
fi
cd .. 2>/dev/null
echo ""

# iOS Simulator Status
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}🍎 iOS Simulator${NC}"
    BOOTED_SIMS=$(xcrun simctl list devices | grep -i booted | wc -l | tr -d ' ')
    if [ "$BOOTED_SIMS" -gt 0 ]; then
        echo -e "   ${GREEN}✅ $BOOTED_SIMS simulator(s) running${NC}"
        xcrun simctl list devices | grep -i booted | sed 's/^/   /'
    else
        echo -e "   ${YELLOW}⚠️  No simulators running${NC}"
    fi
    echo ""
fi

# Android Emulator Status
echo -e "${BLUE}🤖 Android Emulator${NC}"
DEVICES=$(adb devices | grep -v "List" | grep device | wc -l | tr -d ' ')
if [ "$DEVICES" -gt 0 ]; then
    echo -e "   ${GREEN}✅ $DEVICES device(s) connected${NC}"
    adb devices | grep device | grep -v "List" | sed 's/^/   /'
else
    echo -e "   ${YELLOW}⚠️  No devices connected${NC}"
fi
echo ""

# Environment Status
echo -e "${BLUE}⚙️  Environment${NC}"
if [ -f .env ]; then
    echo -e "   ${GREEN}✅ .env file exists${NC}"
    if grep -q "localhost" .env; then
        echo -e "   ${YELLOW}⚠️  Using local environment${NC}"
    fi
else
    echo -e "   ${RED}❌ .env file missing${NC} - Run: cp .env.local .env"
fi
echo ""

# Node Modules
echo -e "${BLUE}📚 Dependencies${NC}"
if [ -d node_modules ]; then
    echo -e "   ${GREEN}✅ node_modules installed${NC}"
else
    echo -e "   ${RED}❌ node_modules missing${NC} - Run: npm install"
fi

if [[ "$OSTYPE" == "darwin"* ]] && [ -d ios/Pods ]; then
    echo -e "   ${GREEN}✅ iOS Pods installed${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "   ${RED}❌ iOS Pods missing${NC} - Run: cd ios && pod install"
fi
echo ""

# Quick Actions
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  QUICK ACTIONS                                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  npm start              - Start Metro bundler"
echo "  npm run ios            - Launch iOS app"
echo "  npm run android        - Launch Android app"
echo "  npm run supabase:start - Start Supabase"
echo "  npm run clean:all      - Clean all caches"
echo ""
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
echo ""

# Watch mode (update every 5 seconds)
if [ "$1" == "--watch" ]; then
    while true; do
        sleep 5
        exec $0
    done
fi
