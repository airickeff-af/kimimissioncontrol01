#!/bin/bash
# Test script for Vercel API endpoints

echo "=== Vercel API Test Script ==="
echo "Testing endpoints on kimimissioncontrol01.vercel.app"
echo ""

BASE_URL="https://kimimissioncontrol01.vercel.app"

# Test endpoints
endpoints=(
  "/api/test"
  "/api/health"
  "/api/logs/activity"
  "/api/logs"
)

for endpoint in "${endpoints[@]}"; do
  echo "Testing: $BASE_URL$endpoint"
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  if [ "$response" = "200" ]; then
    echo "  ✓ SUCCESS (200)"
  elif [ "$response" = "404" ]; then
    echo "  ✗ FAILED (404)"
  else
    echo "  ? Response: $response"
  fi
  echo ""
done

echo "=== Test Complete ==="
