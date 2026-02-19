#!/bin/bash
# Deploy and test API fix for Vercel

echo "🚀 Mission Control API Fix Deployment"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Run from mission-control directory."
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Show current vercel.json
echo "📋 Current vercel.json configuration:"
cat vercel.json
echo ""
echo ""

# List API files
echo "📂 API files structure:"
find api -name "*.js" | head -20
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "⏳ Waiting for deployment to propagate..."
sleep 10

echo ""
echo "🧪 Testing API endpoints..."
echo ""

# Get the deployment URL
DEPLOY_URL="https://dashboard-ten-sand-20.vercel.app"

echo "Testing: $DEPLOY_URL/api/logs/activity"
curl -s "$DEPLOY_URL/api/logs/activity" | head -200
echo ""
echo ""

echo "Testing: $DEPLOY_URL/api/logs"
curl -s "$DEPLOY_URL/api/logs"
echo ""
echo ""

echo "Testing: $DEPLOY_URL/api/logs/chat"
curl -s "$DEPLOY_URL/api/logs/chat"
echo ""
echo ""

echo "✅ Test complete!"
