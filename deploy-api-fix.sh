#!/bin/bash
# Deploy and test the fixed API endpoint

echo "=== API Troubleshooting Deployment ==="
echo "Time: $(date)"
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

echo "1. Checking vercel.json configuration..."
cat vercel.json
echo ""

echo "2. Checking API files exist..."
ls -la api/logs/
echo ""

echo "3. Deploying to Vercel..."
vercel --prod

echo ""
echo "4. Testing endpoints..."
DEPLOYMENT_URL="https://dashboard-ten-sand-20.vercel.app"

echo "Testing /api/logs/activity..."
curl -s "$DEPLOYMENT_URL/api/logs/activity" | head -50

echo ""
echo "Testing /api/logs..."
curl -s "$DEPLOYMENT_URL/api/logs" | head -50

echo ""
echo "Testing /api/health..."
curl -s "$DEPLOYMENT_URL/api/health"

echo ""
echo "=== Deployment Complete ==="
