#!/bin/bash
# Test script for API routing fix
# Run this after deployment to verify /api/logs/activity works

echo "Testing API endpoints..."
echo ""

BASE_URL="https://kimimissioncontrol01.vercel.app"

# Test 1: Health endpoint
echo "1. Testing /api/health..."
curl -s "$BASE_URL/api/health" | head -1
echo ""

# Test 2: Logs activity endpoint (the fix)
echo "2. Testing /api/logs/activity..."
curl -s "$BASE_URL/api/logs/activity?limit=3" | head -1
echo ""

# Test 3: Logs index endpoint
echo "3. Testing /api/logs..."
curl -s "$BASE_URL/api/logs?limit=3" | head -1
echo ""

# Test 4: Logs view page
echo "4. Testing /logs-view.html..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/logs-view.html"
echo " (should be 200)"
echo ""

echo "All tests complete!"
