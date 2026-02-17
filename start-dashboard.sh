#!/bin/bash

# Mission Control Dashboard Startup Script
# Starts both the API server and serves the dashboard

echo "🚀 Starting Mission Control Dashboard..."

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "$DIR/api/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$DIR/api"
    npm install 2>/dev/null || echo "No package.json found, using built-in modules"
    cd "$DIR"
fi

# Start API server in background
echo "🔌 Starting API server on port 3001..."
node "$DIR/api/server.js" &
echo $! > /tmp/mc-api.pid

# Wait for API to be ready
sleep 2

# Check if API is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ API server is running"
else
    echo "⚠️  API server may still be starting..."
fi

# Open dashboard
echo ""
echo "═══════════════════════════════════════════"
echo "  Mission Control Dashboard is ready!"
echo "═══════════════════════════════════════════"
echo ""
echo "📊 Dashboard: file://$DIR/index.html"
echo "🔌 API:       http://localhost:3001"
echo ""
echo "Endpoints:"
echo "  • /api/agents       - List all agents"
echo "  • /api/system/status - System health"
echo "  • /api/tasks        - Task queue"
echo "  • /api/system/logs  - System logs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep script running
trap "echo 'Stopping API server...'; kill $(cat /tmp/mc-api.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/mc-api.pid; exit" INT

# Wait
wait
