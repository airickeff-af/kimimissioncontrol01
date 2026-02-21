#!/bin/bash
# MISSION CONTROL — LOCAL DEPLOYMENT SCRIPT
# Run this to start Mission Control on localhost

echo "🚀 Starting Mission Control on localhost..."
echo ""

# Navigate to mission-control directory
cd /root/.openclaw/workspace/mission-control

# Check if python3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found"
    PYTHON="python3"
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    PYTHON="python"
else
    echo "❌ Python not found. Please install Python 3"
    exit 1
fi

# Start HTTP server
echo ""
echo "🌐 Starting HTTP server on port 8080..."
echo "📁 Serving from: $(pwd)"
echo ""
echo "🔗 Open your browser and go to:"
echo "   http://localhost:8080/dashboard/"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

$PYTHON -m http.server 8080
