#!/bin/bash
# Local API Test Script for /api/logs/activity
# Run this to verify the API handler works before deployment

echo "=== API Local Test ==="
echo ""

# Check if files exist
echo "Checking API files..."
if [ -f "api/logs/activity.js" ]; then
    echo "✓ api/logs/activity.js exists"
else
    echo "✗ api/logs/activity.js NOT FOUND"
fi

if [ -f "api/logs-activity.js" ]; then
    echo "✓ api/logs-activity.js exists (fallback)"
else
    echo "✗ api/logs-activity.js NOT FOUND"
fi

if [ -f "vercel.json" ]; then
    echo "✓ vercel.json exists"
else
    echo "✗ vercel.json NOT FOUND"
fi

echo ""
echo "=== Syntax Check ==="
node --check api/logs/activity.js 2>&1 && echo "✓ api/logs/activity.js syntax OK" || echo "✗ api/logs/activity.js has syntax errors"
node --check api/logs-activity.js 2>&1 && echo "✓ api/logs-activity.js syntax OK" || echo "✗ api/logs-activity.js has syntax errors"

echo ""
echo "=== Vercel Config Validation ==="
node -e "JSON.parse(require('fs').readFileSync('vercel.json')); console.log('✓ vercel.json is valid JSON')" 2>&1 || echo "✗ vercel.json has JSON errors"

echo ""
echo "=== Deployment Instructions ==="
echo "1. Commit changes: git add . && git commit -m 'Fix API routing'"
echo "2. Push to deploy: git push origin main"
echo "3. Or deploy manually: vercel --prod"
echo ""
echo "=== Test URLs After Deployment ==="
echo "https://dashboard-ten-sand-20.vercel.app/api/logs/activity"
echo "https://dashboard-ten-sand-20.vercel.app/api/logs-activity (fallback)"
