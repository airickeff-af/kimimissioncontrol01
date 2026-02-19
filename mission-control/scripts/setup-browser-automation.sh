#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# QUALITY GATE - BROWSER AUTOMATION SETUP
# Author: SubAgent (Browser Automation Setup)
# Date: 2026-02-19
# 
# This script sets up Chrome/Chromium for quality gate browser automation.
# Run this script to enable full browser testing capabilities.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "     QUALITY GATE - BROWSER AUTOMATION SETUP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Note: Some operations may require sudo privileges${NC}"
fi

echo "📦 Step 1: Checking for existing Chrome/Chromium..."

# Check for Chrome
if command -v google-chrome &> /dev/null; then
    echo -e "${GREEN}✅ Google Chrome found: $(google-chrome --version)${NC}"
    CHROME_PATH=$(which google-chrome)
elif command -v chromium-browser &> /dev/null; then
    echo -e "${GREEN}✅ Chromium found: $(chromium-browser --version)${NC}"
    CHROME_PATH=$(which chromium-browser)
elif command -v chromium &> /dev/null; then
    echo -e "${GREEN}✅ Chromium found: $(chromium --version)${NC}"
    CHROME_PATH=$(which chromium)
else
    echo -e "${YELLOW}⚠️  No Chrome/Chromium found. Installing...${NC}"
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            echo "🐧 Detected Debian/Ubuntu system"
            echo "📦 Installing Chromium..."
            
            export PATH="/usr/local/sbin:/usr/sbin:/sbin:$PATH"
            apt-get update
            apt-get install -y chromium-browser chromium-chromedriver
            
            if command -v chromium-browser &> /dev/null; then
                CHROME_PATH=$(which chromium-browser)
            elif command -v chromium &> /dev/null; then
                CHROME_PATH=$(which chromium)
            fi
        elif command -v yum &> /dev/null; then
            echo "🐧 Detected RHEL/CentOS system"
            echo "📦 Installing Chromium..."
            yum install -y chromium
            CHROME_PATH=$(which chromium)
        else
            echo -e "${RED}❌ Unsupported package manager. Please install Chrome manually.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "🍎 Detected macOS with Homebrew"
            echo "📦 Installing Chrome..."
            brew install --cask google-chrome
            CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        else
            echo -e "${RED}❌ Homebrew not found. Please install Chrome manually from https://google.com/chrome${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
        exit 1
    fi
fi

echo ""
echo "📦 Step 2: Verifying browser installation..."

if [ -z "$CHROME_PATH" ] || [ ! -f "$CHROME_PATH" ]; then
    echo -e "${RED}❌ Chrome/Chromium not found after installation${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Chrome/Chromium path: $CHROME_PATH${NC}"

# Test Chrome launch
if ! "$CHROME_PATH" --version &> /dev/null; then
    echo -e "${RED}❌ Chrome/Chromium cannot be launched${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Chrome/Chromium is working${NC}"

echo ""
echo "📦 Step 3: Installing Node.js dependencies..."

cd "$(dirname "$0")/.."

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Are you in the right directory?${NC}"
    exit 1
fi

npm install

echo ""
echo "📦 Step 4: Testing browser automation..."

# Create a test script
cat > /tmp/test-browser.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('https://example.com');
        const title = await page.title();
        
        console.log('✅ Browser automation test passed!');
        console.log(`   Page title: ${title}`);
        
        await browser.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Browser automation test failed:', error.message);
        process.exit(1);
    }
})();
EOF

if node /tmp/test-browser.js; then
    echo -e "${GREEN}✅ Browser automation is working!${NC}"
else
    echo -e "${YELLOW}⚠️  Browser automation test failed. Quality gate will use fetch-only mode.${NC}"
    echo "   This limits functionality but still provides basic testing."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "You can now run the quality gate with:"
echo ""
echo "  npm run quality-gate          # Run integrated quality gate"
echo "  npm run quality-gate:full     # Run full test suite"
echo ""
echo "Environment variables:"
echo "  QUALITY_GATE_URL=https://your-url.com  # Set target URL"
echo ""
echo "═══════════════════════════════════════════════════════════════"
