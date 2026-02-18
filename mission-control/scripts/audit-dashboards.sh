#!/bin/bash
#
# Audit Script: Verify Dashboard Refresh Functionality
# Run this to check all dashboards have working refresh buttons and auto-refresh
#

DASHBOARD_DIR="/root/.openclaw/workspace/mission-control/dashboard"
API_URL="https://dashboard-ten-sand-20.vercel.app/api"

echo "=== DASHBOARD REFRESH AUDIT ==="
echo "Date: $(date)"
echo ""

# Check if dashboard-utils.js exists
echo "1. Checking dashboard utilities..."
if [ -f "$DASHBOARD_DIR/js/dashboard-utils.js" ]; then
    echo "   ✅ dashboard-utils.js found"
    
    # Check for auto-refresh code
    if grep -q "30 \* 60 \* 1000" "$DASHBOARD_DIR/js/dashboard-utils.js"; then
        echo "   ✅ Auto-refresh (30 min) configured"
    else
        echo "   ❌ Auto-refresh not found"
    fi
    
    # Check for refresh button fix
    if grep -q "fixRefreshButtons" "$DASHBOARD_DIR/js/dashboard-utils.js"; then
        echo "   ✅ Refresh button fix present"
    else
        echo "   ❌ Refresh button fix missing"
    fi
else
    echo "   ❌ dashboard-utils.js NOT FOUND"
fi

echo ""
echo "2. Checking API endpoints..."

# Test API endpoints
endpoints=("health" "tokens" "agents" "tasks")
for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/$endpoint" 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo "   ✅ /api/$endpoint - OK"
    else
        echo "   ❌ /api/$endpoint - Failed ($response)"
    fi
done

echo ""
echo "3. Checking dashboard files..."

dashboards=("index-v4.html" "task-board.html" "agent-performance.html" "token-tracker.html" "lead-scoring.html" "scout.html")
for dashboard in "${dashboards[@]}"; do
    if [ -f "$DASHBOARD_DIR/$dashboard" ]; then
        # Check if refresh button exists
        if grep -q "refresh" "$DASHBOARD_DIR/$dashboard" || grep -q "reload" "$DASHBOARD_DIR/$dashboard"; then
            echo "   ✅ $dashboard - Refresh button found"
        else
            echo "   ⚠️  $dashboard - No refresh button"
        fi
    else
        echo "   ❌ $dashboard - NOT FOUND"
    fi
done

echo ""
echo "4. Checking Vercel configuration..."

if [ -f "/root/.openclaw/workspace/vercel.json" ]; then
    echo "   ✅ vercel.json found"
    
    # Check for API routes
    if grep -q '"src": "/api/' "/root/.openclaw/workspace/vercel.json"; then
        echo "   ✅ API routes configured"
    else
        echo "   ❌ API routes missing"
    fi
else
    echo "   ❌ vercel.json NOT FOUND"
fi

echo ""
echo "=== AUDIT SUMMARY ==="
echo "Run 'vercel --prod' to deploy updates"
echo "Dashboard URL: https://dashboard-ten-sand-20.vercel.app"
echo ""
