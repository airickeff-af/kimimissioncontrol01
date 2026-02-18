#!/bin/bash
#
# Pre-Deployment Audit Gate
# Blocks deployment if quality score < 93/100
# Run this before any git push or vercel deploy
# Reads configuration from /mission-control/config/audit-config.json
#

set -e

echo "🔍 PRE-DEPLOYMENT AUDIT GATE"
echo "=============================="
echo "Date: $(date)"
echo ""

# Load configuration
CONFIG_FILE="mission-control/config/audit-config.json"
if [ -f "$CONFIG_FILE" ]; then
    MIN_SCORE=$(grep -o '"min_score": [0-9]*' "$CONFIG_FILE" | head -1 | grep -o '[0-9]*' || echo "93")
    echo "📋 Config loaded: min_score=$MIN_SCORE"
else
    MIN_SCORE=93
    echo "⚠️  Config not found, using default: min_score=$MIN_SCORE"
fi

AUDIT_LOG="/tmp/pre-deploy-audit.log"
FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1️⃣  Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes found${NC}"
    git status --short
    echo ""
    read -p "Commit changes before audit? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "pre-deploy: Stage changes for audit"
    fi
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi

echo ""
echo "2️⃣  Running quality checks..."

# Check 1: No placeholder text
echo "   Checking for placeholder text..."
PLACEHOLDER_COUNT=$(grep -r "TODO\|FIXME\|PLACEHOLDER\|XXX\|lorem ipsum" --include="*.js" --include="*.html" --include="*.md" mission-control/ 2>/dev/null | wc -l)
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo -e "${RED}   ❌ Found $PLACEHOLDER_COUNT placeholder items${NC}"
    grep -r "TODO\|FIXME\|PLACEHOLDER\|XXX\|lorem ipsum" --include="*.js" --include="*.html" --include="*.md" mission-control/ 2>/dev/null | head -5
    FAILED=1
else
    echo -e "${GREEN}   ✅ No placeholder text found${NC}"
fi

# Check 2: No console.log in production code
echo "   Checking for debug console.logs..."
DEBUG_COUNT=$(grep -r "console.log\|console.debug" --include="*.js" mission-control/agents/ mission-control/dashboard/ 2>/dev/null | grep -v "// " | wc -l)
if [ "$DEBUG_COUNT" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️  Found $DEBUG_COUNT console.log statements${NC}"
else
    echo -e "${GREEN}   ✅ Debug statements acceptable${NC}"
fi

# Check 3: All HTML files have proper structure
echo "   Checking HTML file structure..."
HTML_ERRORS=0
for file in mission-control/dashboard/*.html; do
    if [ -f "$file" ]; then
        if ! grep -q "</html>" "$file"; then
            echo -e "${RED}   ❌ $file missing closing html tag${NC}"
            HTML_ERRORS=$((HTML_ERRORS + 1))
        fi
        if ! grep -q "<title>" "$file"; then
            echo -e "${RED}   ❌ $file missing title${NC}"
            HTML_ERRORS=$((HTML_ERRORS + 1))
        fi
    fi
done
if [ "$HTML_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}   ✅ All HTML files properly structured${NC}"
else
    FAILED=1
fi

# Check 4: JavaScript syntax validation
echo "   Validating JavaScript syntax..."
JS_ERRORS=0
for file in mission-control/agents/*/*.js modules/*.js api/*.js 2>/dev/null; do
    if [ -f "$file" ]; then
        if ! node --check "$file" 2>/dev/null; then
            echo -e "${RED}   ❌ Syntax error in $file${NC}"
            JS_ERRORS=$((JS_ERRORS + 1))
        fi
    fi
done
if [ "$JS_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}   ✅ JavaScript syntax valid${NC}"
else
    FAILED=1
fi

# Check 5: Documentation exists for new features
echo "   Checking documentation..."
if [ ! -f "mission-control/docs/README.md" ]; then
    echo -e "${RED}   ❌ Main documentation missing${NC}"
    FAILED=1
else
    echo -e "${GREEN}   ✅ Documentation exists${NC}"
fi

# Check 6: No sensitive data in code
echo "   Checking for exposed secrets..."
SECRET_COUNT=$(grep -r "api_key\|apikey\|password\|secret" --include="*.js" --include="*.json" mission-control/ 2>/dev/null | grep -v "// " | grep -v "API_KEY" | wc -l)
if [ "$SECRET_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Found $SECRET_COUNT potential secrets${NC}"
    echo "   Review: grep -r 'api_key\|apikey\|password\|secret' mission-control/"
else
    echo -e "${GREEN}   ✅ No exposed secrets detected${NC}"
fi

echo ""
echo "3️⃣  Calculating quality score..."

# Calculate score based on checks
SCORE=100

if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    SCORE=$((SCORE - PLACEHOLDER_COUNT * 5))
fi
if [ "$HTML_ERRORS" -gt 0 ]; then
    SCORE=$((SCORE - HTML_ERRORS * 10))
fi
if [ "$JS_ERRORS" -gt 0 ]; then
    SCORE=$((SCORE - JS_ERRORS * 15))
fi
if [ ! -f "mission-control/docs/README.md" ]; then
    SCORE=$((SCORE - 10))
fi

# Cap at 100, floor at 0
if [ "$SCORE" -gt 100 ]; then SCORE=100; fi
if [ "$SCORE" -lt 0 ]; then SCORE=0; fi

echo ""
echo "=============================="
echo "📊 QUALITY SCORE: $SCORE/100"
echo "=============================="

if [ "$SCORE" -ge $MIN_SCORE ]; then
    echo -e "${GREEN}✅ PASSED - Meets EricF's minimum standard ($MIN_SCORE/100)${NC}"
    echo ""
    echo "🚀 Ready for deployment!"
    echo "   Run: vercel --prod"
    echo "   Or: git push origin master"
    exit 0
else
    echo -e "${RED}❌ FAILED - Below minimum standard ($MIN_SCORE/100)${NC}"
    echo ""
    echo "🔧 Required actions:"
    if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
        echo "   - Remove $PLACEHOLDER_COUNT placeholder items"
    fi
    if [ "$HTML_ERRORS" -gt 0 ]; then
        echo "   - Fix $HTML_ERRORS HTML structure errors"
    fi
    if [ "$JS_ERRORS" -gt 0 ]; then
        echo "   - Fix $JS_ERRORS JavaScript syntax errors"
    fi
    if [ ! -f "mission-control/docs/README.md" ]; then
        echo "   - Add documentation"
    fi
    echo ""
    echo "⛔ DEPLOYMENT BLOCKED"
    echo "Fix issues and re-run audit."
    exit 1
fi
