#!/bin/bash
# Vercel API Deployment Test Script
# Tests all API endpoints after deployment

echo "=========================================="
echo "Vercel API Deployment Test"
echo "=========================================="
echo ""

# Configuration
DEPLOYMENT_URL="${1:-https://dashboard-ten-sand-20.vercel.app}"

echo "Testing deployment: $DEPLOYMENT_URL"
echo ""

# Test endpoints
endpoints=(
  "/api/health"
  "/api/logs/activity"
  "/api/logs-activity"
  "/api/logs-activity-flat"
  "/api/agents"
  "/api/stats"
  "/api/tasks"
)

echo "Testing API Endpoints:"
echo "----------------------"

for endpoint in "${endpoints[@]}"; do
  url="${DEPLOYMENT_URL}${endpoint}"
  echo -n "Testing $endpoint ... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    echo "✅ OK (200)"
  elif [ "$response" = "404" ]; then
    echo "❌ NOT FOUND (404)"
  elif [ "$response" = "500" ]; then
    echo "⚠️  SERVER ERROR (500)"
  else
    echo "⚠️  STATUS: $response"
  fi
done

echo ""
echo "=========================================="
echo "Detailed Response Test"
echo "=========================================="
echo ""

# Test the main endpoint with full response
echo "Testing /api/logs/activity:"
echo "---------------------------"
curl -s "${DEPLOYMENT_URL}/api/logs/activity" | head -20

echo ""
echo ""
echo "Testing /api/logs-activity (flat):"
echo "-----------------------------------"
curl -s "${DEPLOYMENT_URL}/api/logs-activity" | head -20

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
