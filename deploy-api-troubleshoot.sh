#!/bin/bash
# API Troubleshooting Deployment Script
# Attempts multiple approaches to fix /api/logs/activity 404 error

set -e

echo "========================================="
echo "API Troubleshooting - Deployment Script"
echo "Target: /api/logs/activity endpoint"
echo "========================================="
echo ""

DASHBOARD_DIR="/root/.openclaw/workspace/mission-control/dashboard"
VERCEL_URL="https://dashboard-ten-sand-20.vercel.app"

cd "$DASHBOARD_DIR"

echo "Current directory: $(pwd)"
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI available"
echo ""

# Show current vercel.json
echo "📋 Current vercel.json configuration:"
cat vercel.json
echo ""
echo ""

# List API files
echo "📁 API files in /api directory:"
ls -la api/*.js 2>/dev/null | grep -E "(logs|health|agents|tasks|stats)" || echo "No matching files found"
echo ""

# Verify logs API files exist
echo "🔍 Checking logs API files..."
if [ -f "api/logs-activity.js" ]; then
    echo "  ✅ api/logs-activity.js exists"
else
    echo "  ❌ api/logs-activity.js NOT FOUND"
fi

if [ -f "api/logs-chat.js" ]; then
    echo "  ✅ api/logs-chat.js exists"
else
    echo "  ❌ api/logs-chat.js NOT FOUND"
fi

if [ -f "api/logs-index.js" ]; then
    echo "  ✅ api/logs-index.js exists"
else
    echo "  ❌ api/logs-index.js NOT FOUND"
fi
echo ""

# Check folder structure approach
echo "🔍 Checking folder structure approach (/api/logs/):"
if [ -d "api/logs" ]; then
    echo "  ✅ api/logs/ directory exists"
    ls -la api/logs/
else
    echo "  ❌ api/logs/ directory NOT FOUND"
fi
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
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

# Wait a moment for deployment to propagate
echo "⏳ Waiting 10 seconds for deployment to propagate..."
sleep 10

# Test the endpoints
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
        echo "  Response preview: $(echo "$body" | head -c 100)..."
    elif [ "$http_code" = "404" ]; then
        echo "  ❌ FAILED (HTTP 404 - Not Found)"
    else
        echo "  ⚠️  HTTP $http_code"
        echo "  Response: $(echo "$body" | head -c 100)"
    fi
    echo ""
}

# Test all logs endpoints
test_endpoint "/api/logs/activity"
test_endpoint "/api/logs"
test_endpoint "/api/logs/chat"
test_endpoint "/api/health"
test_endpoint "/api/agents"

echo ""
echo "========================================="
echo "Deployment and testing complete!"
echo "========================================="
