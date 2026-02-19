#!/bin/bash
# API 404 Diagnostic Script
# Tests multiple approaches to fix /api/logs/activity 404 on Vercel

set -e

MC_DIR="/root/.openclaw/workspace/mission-control"
VERCEL_URL="https://dashboard-ten-sand-20.vercel.app"

cd "$MC_DIR"

echo "========================================="
echo "API 404 Diagnostic Tool"
echo "========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local url="${VERCEL_URL}${endpoint}"
    
    echo "Testing: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ SUCCESS (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 100)..."
        return 0
    elif [ "$http_code" = "404" ]; then
        echo "  ❌ FAILED (HTTP 404 - Not Found)"
        return 1
    else
        echo "  ⚠️  HTTP $http_code"
        echo "  Response: $(echo "$body" | head -c 150)"
        return 1
    fi
}

# Check current structure
echo "📁 Current API Structure:"
find api -name "*.js" -type f 2>/dev/null | head -20 || echo "  No API files found"
echo ""

# Check vercel.json
echo "📋 Current vercel.json:"
cat vercel.json
echo ""
echo ""

# Test current deployment
echo "🧪 Testing Current Deployment..."
echo ""

failed=0
test_endpoint "/api/logs/activity" || failed=$((failed + 1))
echo ""
test_endpoint "/api/logs" || failed=$((failed + 1))
echo ""
test_endpoint "/api/logs/chat" || failed=$((failed + 1))
echo ""

if [ $failed -eq 0 ]; then
    echo "========================================="
    echo "✅ ALL ENDPOINTS WORKING!"
    echo "========================================="
    exit 0
else
    echo "========================================="
    echo "❌ $failed endpoint(s) returning 404"
    echo "========================================="
    echo ""
    echo "Recommended fixes:"
    echo ""
    echo "1. DEPLOY ZERO-CONFIG SOLUTION:"
    echo "   ./deploy-zero-config.sh"
    echo ""
    echo "2. TRY WITHOUT vercel.json:"
    echo "   mv vercel.json vercel.json.bak"
    echo "   vercel --prod"
    echo "   # Test endpoints"
    echo "   mv vercel.json.bak vercel.json"
    echo ""
    echo "3. CHECK VERCEL DASHBOARD:"
    echo "   - Go to https://vercel.com/dashboard"
    echo "   - Select 'dashboard' project"
    echo "   - Check Functions tab"
    echo "   - Verify Framework Preset is 'Other'"
    echo ""
    echo "4. REDEPLOY WITHOUT CACHE:"
    echo "   - In Vercel Dashboard, find latest deployment"
    echo "   - Click 'Redeploy' → 'Redeploy without cache'"
    echo ""
    exit 1
fi
