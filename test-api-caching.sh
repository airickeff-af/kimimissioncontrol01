#!/bin/bash
# Test API Caching Implementation
# Tests Cache-Control headers and ETag support

set -e

BASE_URL="https://dashboard-ten-sand-20.vercel.app"
ENDPOINTS=(
  "/api/logs/activity"
  "/api/agents"
  "/api/tasks"
  "/api/health"
  "/api/stats"
  "/api/deployments"
)

echo "==================================="
echo "API Caching Test Suite"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test each endpoint
for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing: $endpoint"
  echo "-----------------------------------"
  
  # Test 1: Check Cache-Control header
  echo -n "  Cache-Control header... "
  cache_control=$(curl -s -I "$BASE_URL$endpoint" 2>/dev/null | grep -i "cache-control" | head -1 | tr -d '\r')
  if [ -n "$cache_control" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "    $cache_control"
  else
    echo -e "${RED}✗ Missing${NC}"
  fi
  
  # Test 2: Check ETag header
  echo -n "  ETag header... "
  etag=$(curl -s -I "$BASE_URL$endpoint" 2>/dev/null | grep -i "etag" | head -1 | tr -d '\r')
  if [ -n "$etag" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "    $etag"
  else
    echo -e "${RED}✗ Missing${NC}"
  fi
  
  # Test 3: Check Vary header
  echo -n "  Vary header... "
  vary=$(curl -s -I "$BASE_URL$endpoint" 2>/dev/null | grep -i "vary" | head -1 | tr -d '\r')
  if [ -n "$vary" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "    $vary"
  else
    echo -e "${RED}✗ Missing${NC}"
  fi
  
  # Test 4: Test conditional request (If-None-Match)
  if [ -n "$etag" ]; then
    echo -n "  Conditional request (304)... "
    etag_value=$(echo "$etag" | sed 's/ETag: //i')
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "If-None-Match: $etag_value" "$BASE_URL$endpoint" 2>/dev/null)
    if [ "$status" = "304" ]; then
      echo -e "${GREEN}✓ Returns 304${NC}"
    elif [ "$status" = "200" ]; then
      echo -e "${YELLOW}⚠ Returns 200 (data may have changed)${NC}"
    else
      echo -e "${RED}✗ Unexpected status: $status${NC}"
    fi
  fi
  
  # Test 5: Test cache-busting
  echo -n "  Cache-busting (bust param)... "
  cache_bust=$(curl -s -I "$BASE_URL$endpoint?bust=1" 2>/dev/null | grep -i "cache-control" | head -1 | tr -d '\r')
  if echo "$cache_bust" | grep -q "no-cache\|no-store"; then
    echo -e "${GREEN}✓ Disabled caching${NC}"
  else
    echo -e "${YELLOW}⚠ May still be cached${NC}"
  fi
  
  echo ""
done

echo "==================================="
echo "Test Complete"
echo "==================================="
