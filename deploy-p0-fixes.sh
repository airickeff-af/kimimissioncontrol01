#!/bin/bash
# P0 CRITICAL FIXES DEPLOYMENT SCRIPT
# Deploys API fixes for TASK-066 and TASK-070

echo "=========================================="
echo "P0 CRITICAL FIXES DEPLOYMENT"
echo "Time: $(date)"
echo "=========================================="

cd /root/.openclaw/workspace

echo ""
echo "1. Checking data files..."
ls -la data/

echo ""
echo "2. Checking API files..."
ls -la api/*.js

echo ""
echo "3. Checking vercel.json..."
cat vercel.json | head -30

echo ""
echo "4. Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod --yes
    echo "✅ Deployment triggered"
else
    echo "⚠️ Vercel CLI not available - manual deployment required"
    echo "Run: vercel --prod"
fi

echo ""
echo "5. Testing deployed APIs..."
sleep 5

BASE_URL="https://dashboard-ten-sand-20.vercel.app"

echo "Testing /api/health..."
curl -s "$BASE_URL/api/health" | head -c 200

echo ""
echo "Testing /api/agents..."
curl -s "$BASE_URL/api/agents" | head -c 200

echo ""
echo "Testing /api/tasks..."
curl -s "$BASE_URL/api/tasks" | head -c 200

echo ""
echo "Testing /api/tokens..."
curl -s "$BASE_URL/api/tokens" | head -c 200

echo ""
echo "Testing /api/metrics..."
curl -s "$BASE_URL/api/metrics" | head -c 200

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE"
echo "=========================================="
