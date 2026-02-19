#!/bin/bash
# Minimal API Test - Isolates the 404 issue
# Creates simplest possible API endpoint to test Vercel detection

set -e

MC_DIR="/root/.openclaw/workspace/mission-control"
VERCEL_URL="https://dashboard-ten-sand-20.vercel.app"

cd "$MC_DIR"

echo "========================================="
echo "Minimal API Test"
echo "========================================="
echo ""

# Create minimal test endpoint if not exists
if [ ! -f "api/test.js" ]; then
cat > api/test.js << 'EOF'
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    success: true,
    message: "Minimal test endpoint working!",
    timestamp: new Date().toISOString()
  });
};
EOF
    echo "✅ Created api/test.js"
fi

# Create minimal vercel.json
cat > vercel.json.minimal << 'EOF'
{
  "version": 2,
  "name": "mission-control-dashboard",
  "outputDirectory": "dashboard"
}
EOF
echo "✅ Created vercel.json.minimal"
echo ""

# Backup current vercel.json
cp vercel.json vercel.json.backup
echo "✅ Backed up current vercel.json"
echo ""

# Option to use minimal config
echo "Choose configuration:"
echo "1. Minimal (no rewrites, no functions config)"
echo "2. Current (with rewrites and functions config)"
echo "3. Zero-config (no vercel.json at all)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        cp vercel.json.minimal vercel.json
        echo "Using MINIMAL configuration"
        ;;
    2)
        echo "Using CURRENT configuration"
        ;;
    3)
        rm vercel.json
        echo "Using ZERO-CONFIG (no vercel.json)"
        ;;
    *)
        echo "Invalid choice, using current config"
        ;;
esac

echo ""
echo "🚀 Deploying..."
vercel --prod --yes

echo ""
echo "⏳ Waiting 10 seconds for propagation..."
sleep 10

echo ""
echo "🧪 Testing endpoints..."
echo ""

test_endpoint() {
    local endpoint=$1
    local url="${VERCEL_URL}${endpoint}"
    echo "Testing: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ SUCCESS (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 100)..."
    elif [ "$http_code" = "404" ]; then
        echo "  ❌ FAILED (HTTP 404)"
    else
        echo "  ⚠️  HTTP $http_code"
    fi
    echo ""
}

test_endpoint "/api/test"
test_endpoint "/api/logs/activity"

echo ""
echo "========================================="
echo "Test complete!"
echo "========================================="
echo ""
echo "To restore original config:"
echo "  cp vercel.json.backup vercel.json"
echo ""
