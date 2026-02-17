#!/bin/bash
# Mission Control - Kimi Code Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENV=${1:-production}
DASHBOARD_DIR="/root/.openclaw/workspace/mission-control/dashboard"
PUBLIC_URL="https://honest-olives-lick.loca.lt"

echo "🚀 Mission Control Deployment"
echo "=============================="
echo "Environment: $ENV"
echo "Dashboard: $DASHBOARD_DIR"
echo "Public URL: $PUBLIC_URL"
echo ""

# Check if localtunnel is running
if ! pgrep -f "lt --port" > /dev/null; then
    echo "🔌 Starting localtunnel..."
    cd "$DASHBOARD_DIR"
    nohup npx lt --port 8080 > /tmp/localtunnel.log 2>&1 &
    sleep 3
    echo "✅ Localtunnel started"
else
    echo "✅ Localtunnel already running"
fi

# Start HTTP server if not running
if ! pgrep -f "python.*http.server.*8080" > /dev/null; then
    echo "🌐 Starting HTTP server on port 8080..."
    cd "$DASHBOARD_DIR"
    nohup python3 -m http.server 8080 > /tmp/http-server.log 2>&1 &
    sleep 2
    echo "✅ HTTP server started"
else
    echo "✅ HTTP server already running"
fi

# Verify deployment
echo ""
echo "🔍 Verifying deployment..."
if curl -s "$PUBLIC_URL" | grep -q "Mission Control"; then
    echo "✅ Dashboard accessible at $PUBLIC_URL"
else
    echo "⚠️  Dashboard may not be accessible yet"
fi

echo ""
echo "📊 Deployment Status:"
echo "  • Main Dashboard: $PUBLIC_URL/index.html"
echo "  • HQ (Unified): $PUBLIC_URL/hq.html"
echo "  • Pixel Office: $PUBLIC_URL/kairosoft-style.html"
echo "  • Work Cards: $PUBLIC_URL/work-cards.html"
echo "  • Mission Board: $PUBLIC_URL/mission-board.html"
echo ""
echo "✅ Deployment complete!"
