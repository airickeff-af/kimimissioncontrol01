#!/bin/bash
# Comprehensive deployment test for TASK-070

echo "=== TASK-070 Deployment Verification ==="
echo "Testing all endpoints at https://dashboard-ten-sand-20.vercel.app"
echo ""

BASE_URL="https://dashboard-ten-sand-20.vercel.app"
PASSED=0
FAILED=0

# Test HTML Pages
echo "--- Testing HTML Pages ---"
pages=("index.html" "office.html" "agents.html" "logs-view.html" "pixel-office.html" "task-board.html")
for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$page")
    if [ "$status" = "200" ]; then
        echo "✅ $page - 200 OK"
        ((PASSED++))
    else
        echo "❌ $page - $status"
        ((FAILED++))
    fi
done

echo ""
echo "--- Testing API Endpoints ---"
endpoints=("api/health" "api/agents" "api/tasks" "api/stats" "api/metrics" "api/deployments" "api/logs/activity" "api/logs/chat")
for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$endpoint")
    if [ "$status" = "200" ]; then
        echo "✅ $endpoint - 200 OK"
        ((PASSED++))
    else
        echo "❌ $endpoint - $status"
        ((FAILED++))
    fi
done

echo ""
echo "--- Testing API Response Validity ---"
# Test JSON validity
for endpoint in "${endpoints[@]}"; do
    response=$(curl -s "$BASE_URL/$endpoint")
    if echo "$response" | jq -e . >/dev/null 2>&1; then
        echo "✅ $endpoint - Valid JSON"
        ((PASSED++))
    else
        echo "❌ $endpoint - Invalid JSON"
        ((FAILED++))
    fi
done

echo ""
echo "=== TEST SUMMARY ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED - Quality Gate: 100/100"
    exit 0
else
    quality=$((PASSED * 100 / (PASSED + FAILED)))
    echo ""
    echo "⚠️  SOME TESTS FAILED - Quality Gate: $quality/100"
    exit 1
fi
