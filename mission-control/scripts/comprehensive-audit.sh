#!/bin/bash
#
# COMPREHENSIVE AUDIT - Checks Everything
# EricF requirement: Audit looks at everything
# Reads configuration from /mission-control/config/audit-config.json
#

REPO_DIR="/root/.openclaw/workspace"
CONFIG_FILE="$REPO_DIR/mission-control/config/audit-config.json"
DASHBOARD_DIR="$REPO_DIR/mission-control/dashboard"
API_DIR="$REPO_DIR/api"
LOG_FILE="/tmp/comprehensive-audit.log"

# Load config if available
if [ -f "$CONFIG_FILE" ]; then
    MIN_SCORE=$(grep -o '"min_score": [0-9]*' "$CONFIG_FILE" | head -1 | grep -o '[0-9]*' || echo "93")
    DEPLOYMENT_URL=$(grep -o '"url": "[^"]*"' "$CONFIG_FILE" | head -1 | cut -d'"' -f4 || echo "https://dashboard-ten-sand-20.vercel.app")
else
    MIN_SCORE=93
    DEPLOYMENT_URL="https://dashboard-ten-sand-20.vercel.app"
fi

SCORE=100
ERRORS=0
WARNINGS=0

echo "🔍 COMPREHENSIVE AUDIT - Everything Checked"
echo "============================================"
echo "Date: $(date)"
echo "Deployment: $DEPLOYMENT_URL"
echo "Min Score: $MIN_SCORE/100"
echo ""

# 1. CODE QUALITY CHECKS
echo "1️⃣ CODE QUALITY"
echo "----------------"

# Check for placeholders
PLACEHOLDERS=$(grep -r "TODO\|FIXME\|PLACEHOLDER\|XXX\|HACK" --include="*.js" --include="*.html" $REPO_DIR/mission-control/ 2>/dev/null | wc -l)
if [ "$PLACEHOLDERS" -gt 0 ]; then
    echo "   ❌ Placeholders found: $PLACEHOLDERS"
    SCORE=$((SCORE - PLACEHOLDERS * 5))
    ERRORS=$((ERRORS + PLACEHOLDERS))
else
    echo "   ✅ No placeholders"
fi

# Check for console.logs in production
CONSOLE_LOGS=$(grep -r "console.log\|console.debug" --include="*.js" $REPO_DIR/mission-control/agents/ $REPO_DIR/mission-control/dashboard/ 2>/dev/null | grep -v "// " | wc -l)
if [ "$CONSOLE_LOGS" -gt 10 ]; then
    echo "   ⚠️  Console logs: $CONSOLE_LOGS (should be < 10)"
    SCORE=$((SCORE - 5))
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ Console logs acceptable: $CONSOLE_LOGS"
fi

# Check JavaScript syntax
JS_ERRORS=0
for file in $REPO_DIR/mission-control/agents/*/*.js $REPO_DIR/modules/*.js $REPO_DIR/api/*.js 2>/dev/null; do
    if [ -f "$file" ]; then
        if ! node --check "$file" 2>/dev/null; then
            echo "   ❌ Syntax error: $(basename $file)"
            JS_ERRORS=$((JS_ERRORS + 1))
        fi
    fi
done
if [ "$JS_ERRORS" -eq 0 ]; then
    echo "   ✅ JavaScript syntax valid"
else
    SCORE=$((SCORE - JS_ERRORS * 15))
    ERRORS=$((ERRORS + JS_ERRORS))
fi

# 2. DASHBOARD CHECKS
echo ""
echo "2️⃣ DASHBOARDS"
echo "--------------"

DASHBOARDS=("index-v4.html" "task-board.html" "agent-performance.html" "token-tracker.html" "lead-scoring.html" "scout.html" "competitors.html")
MISSING_REFRESH=0

for dashboard in "${DASHBOARDS[@]}"; do
    if [ -f "$DASHBOARD_DIR/$dashboard" ]; then
        if grep -q "reload\|refresh" "$DASHBOARD_DIR/$dashboard"; then
            echo "   ✅ $dashboard - Refresh OK"
        else
            echo "   ❌ $dashboard - No refresh button"
            MISSING_REFRESH=$((MISSING_REFRESH + 1))
        fi
    else
        echo "   ❌ $dashboard - File missing"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$MISSING_REFRESH" -gt 0 ]; then
    SCORE=$((SCORE - MISSING_REFRESH * 10))
    ERRORS=$((ERRORS + MISSING_REFRESH))
fi

# 3. API CHECKS
echo ""
echo "3️⃣ API ENDPOINTS"
echo "-----------------"

API_FILES=("tokens.js" "agents.js" "tasks.js" "health.js")
MISSING_API=0

for api in "${API_FILES[@]}"; do
    if [ -f "$API_DIR/$api" ]; then
        echo "   ✅ $api - Exists"
    else
        echo "   ❌ $api - Missing"
        MISSING_API=$((MISSING_API + 1))
    fi
done

if [ "$MISSING_API" -gt 0 ]; then
    SCORE=$((SCORE - MISSING_API * 10))
    ERRORS=$((ERRORS + MISSING_API))
fi

# Test local API
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "   ✅ Local API responding"
else
    echo "   ⚠️  Local API not running"
    WARNINGS=$((WARNINGS + 1))
fi

# 4. DATA SYNC CHECKS
echo ""
echo "4️⃣ DATA SYNC"
echo "-------------"

# Check if data files exist and are recent
DATA_FILES=("scored-leads-v2.json" "competitors.json" "token-cache.json")
STALE_DATA=0

for file in "${DATA_FILES[@]}"; do
    if [ -f "$REPO_DIR/mission-control/data/$file" ]; then
        # Check if modified in last 24 hours
        if find "$REPO_DIR/mission-control/data/$file" -mtime -1 >/dev/null 2>&1; then
            echo "   ✅ $file - Recent"
        else
            echo "   ⚠️  $file - Stale (>24h)"
            STALE_DATA=$((STALE_DATA + 1))
        fi
    else
        echo "   ❌ $file - Missing"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$STALE_DATA" -gt 0 ]; then
    SCORE=$((SCORE - STALE_DATA * 5))
    WARNINGS=$((WARNINGS + STALE_DATA))
fi

# 5. DOCUMENTATION CHECKS
echo ""
echo "5️⃣ DOCUMENTATION"
echo "-----------------"

DOC_FILES=("mission-control/docs/README.md" "README.md" "PENDING_TASKS.md" "MEMORY.md")
MISSING_DOCS=0

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$REPO_DIR/$doc" ]; then
        echo "   ✅ $(basename $doc) - Exists"
    else
        echo "   ❌ $(basename $doc) - Missing"
        MISSING_DOCS=$((MISSING_DOCS + 1))
    fi
done

if [ "$MISSING_DOCS" -gt 0 ]; then
    SCORE=$((SCORE - MISSING_DOCS * 5))
    ERRORS=$((ERRORS + MISSING_DOCS))
fi

# 6. VERCEL CONFIG
echo ""
echo "6️⃣ DEPLOYMENT CONFIG"
echo "---------------------"

if [ -f "$REPO_DIR/vercel.json" ]; then
    echo "   ✅ vercel.json - Exists"
    
    if grep -q "api" "$REPO_DIR/vercel.json"; then
        echo "   ✅ API routes configured"
    else
        echo "   ❌ API routes missing"
        SCORE=$((SCORE - 10))
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ vercel.json - Missing"
    SCORE=$((SCORE - 15))
    ERRORS=$((ERRORS + 1))
fi

# Check audit config
if [ -f "$CONFIG_FILE" ]; then
    echo "   ✅ audit-config.json - Exists"
else
    echo "   ❌ audit-config.json - Missing"
    SCORE=$((SCORE - 5))
    ERRORS=$((ERRORS + 1))
fi

# 7. SECURITY CHECKS
echo ""
echo "7️⃣ SECURITY"
echo "------------"

# Check for exposed secrets
SECRETS=$(grep -r "api_key\|apikey\|password\|secret" --include="*.js" --include="*.json" $REPO_DIR/mission-control/ 2>/dev/null | grep -v "// " | grep -v "API_KEY\|process.env" | wc -l)
if [ "$SECRETS" -gt 0 ]; then
    echo "   ⚠️  Potential secrets exposed: $SECRETS"
    SCORE=$((SCORE - 10))
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ No exposed secrets"
fi

# 8. PERFORMANCE CHECKS
echo ""
echo "8️⃣ PERFORMANCE"
echo "---------------"

# Check file sizes
LARGE_FILES=$(find $DASHBOARD_DIR -name "*.html" -size +100k 2>/dev/null | wc -l)
if [ "$LARGE_FILES" -gt 3 ]; then
    echo "   ⚠️  Large HTML files: $LARGE_FILES (should optimize)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ File sizes acceptable"
fi

# FINAL SCORE
echo ""
echo "============================================"
echo "📊 FINAL SCORE: $SCORE/100"
echo "============================================"
echo "Errors: $ERRORS | Warnings: $WARNINGS"
echo ""

if [ $SCORE -ge $MIN_SCORE ]; then
    echo "✅ PASSED - Meets EricF's standard ($MIN_SCORE/100+)"
    echo "Ready for deployment"
    exit 0
elif [ $SCORE -ge 85 ]; then
    echo "⚠️  WARNING - Below standard (need $MIN_SCORE/100)"
    echo "Fix errors before deployment"
    exit 1
else
    echo "❌ FAILED - Significant issues found"
    echo "Major rework required"
    exit 1
fi
