#!/bin/bash
# Final comprehensive deployment test for TASK-070
# Tests all pages and APIs to verify 200 OK responses

echo "=========================================="
echo "TASK-070: DEPLOYMENT VERIFICATION REPORT"
echo "=========================================="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Target URL: https://dashboard-ten-sand-20.vercel.app"
echo ""

BASE_URL="https://dashboard-ten-sand-20.vercel.app"
PASSED=0
FAILED=0
TOTAL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
    local path=$1
    local type=$2
    local full_url="$BASE_URL/$path"
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")
    ((TOTAL++))
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅${NC} $type: $path - 200 OK"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $type: $path - $status"
        ((FAILED++))
        return 1
    fi
}

echo "--- HTML PAGES ---"
pages=(
    "index.html"
    "office.html"
    "agents.html"
    "logs-view.html"
    "pixel-office.html"
    "task-board.html"
    "dealflow-view.html"
    "token-tracker.html"
    "data-viewer.html"
)
for page in "${pages[@]}"; do
    test_endpoint "$page" "PAGE"
done

echo ""
echo "--- API ENDPOINTS ---"
apis=(
    "api/health"
    "api/agents"
    "api/tasks"
    "api/stats"
    "api/metrics"
    "api/deployments"
    "api/logs/activity"
    "api/logs/chat"
    "api/tokens"
    "api/tokens-live"
)
for api in "${apis[@]}"; do
    test_endpoint "$api" "API"
done

echo ""
echo "--- JSON VALIDATION ---"
for api in "${apis[@]}"; do
    response=$(curl -s "$BASE_URL/$api")
    if echo "$response" | jq -e . >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} JSON: $api - Valid"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} JSON: $api - Invalid"
        ((FAILED++))
    fi
    ((TOTAL++))
done

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
    QUALITY=$((PASSED * 100 / TOTAL))
    echo ""
    echo "Quality Gate: $QUALITY/100"
    echo "Target: 95/100"
    
    if [ $QUALITY -ge 95 ]; then
        echo -e "${GREEN}✅ QUALITY GATE PASSED${NC}"
        echo ""
        echo "🎉 TASK-070 DEPLOYMENT VERIFIED SUCCESSFULLY"
        exit 0
    else
        echo -e "${RED}❌ QUALITY GATE FAILED${NC}"
        exit 1
    fi
else
    echo "No tests run"
    exit 1
fi
