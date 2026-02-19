#!/bin/bash
# Zero-Config API Deployment Script
# Uses Vercel's native /api folder structure

set -e

echo "========================================="
echo "Zero-Config API Deployment"
echo "Target: /api/logs/activity endpoint"
echo "========================================="
echo ""

MC_DIR="/root/.openclaw/workspace/mission-control"
VERCEL_URL="https://dashboard-ten-sand-20.vercel.app"

cd "$MC_DIR"

echo "📁 Current directory: $(pwd)"
echo ""

# Show structure
echo "📂 API folder structure:"
find api -name "*.js" 2>/dev/null | head -20 || echo "No API files found"
echo ""

# Show vercel.json
echo "📋 vercel.json configuration:"
cat vercel.json
echo ""
echo ""

# Check if vercel CLI is available
if ! command -v vercel > /dev/null 2>&1; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI available"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel (zero-config approach)..."
echo "   This may take a moment..."
echo ""

# Deploy with production flag
vercel --prod --yes 2>&1 | tee /tmp/vercel-deploy.log || {
    echo "❌ Deployment failed. Check /tmp/vercel-deploy.log for details"
    exit 1
}

echo ""
echo "✅ Deployment completed!"
echo ""

# Wait for propagation
echo "⏳ Waiting 15 seconds for deployment to propagate..."
sleep 15

# Test endpoints
echo ""
echo "🧪 Testing API endpoints..."
echo ""

test_endpoint() {
    local endpoint=$1
    local url="${VERCEL_URL}${endpoint}"
    echo "Testing: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ SUCCESS (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 150)..."
    elif [ "$http_code" = "404" ]; then
        echo "  ❌ FAILED (HTTP 404 - Not Found)"
    else
        echo "  ⚠️  HTTP $http_code"
        echo "  Response: $(echo "$body" | head -c 200)"
    fi
    echo ""
}

# Test endpoints
test_endpoint "/api/logs/activity"
test_endpoint "/api/logs"
test_endpoint "/api/logs/chat"

echo ""
echo "========================================="
echo "Deployment and testing complete!"
echo "========================================="
echo ""
echo "If endpoints still return 404:"
echo "1. Check Vercel Dashboard > Functions tab"
echo "2. Verify files are in /api folder at project root"
echo "3. Try removing vercel.json for pure zero-config"
