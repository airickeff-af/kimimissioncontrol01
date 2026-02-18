#!/bin/bash
# API Endpoint Test Script for Vercel Deployment
# Tests all /api/logs/* endpoints

echo "=========================================="
echo "API Endpoint Test - Vercel Deployment"
echo "Time: $(date)"
echo "=========================================="

BASE_URL="https://dashboard-ten-sand-20.vercel.app"
FAILED=0
PASSED=0

# Test function
test_endpoint() {
    local endpoint=$1
    local expected_code=${2:-200}
    local url="${BASE_URL}${endpoint}"
    
    echo -e "\n--- Testing: $endpoint ---"
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo "✅ PASS - HTTP $http_code"
        PASSED=$((PASSED + 1))
        
        # Validate JSON if 200
        if [ "$http_code" = "200" ]; then
            if echo "$body" | python3 -m json.tool >/dev/null 2>&1; then
                echo "✅ Valid JSON response"
            else
                echo "❌ Invalid JSON response"
                FAILED=$((FAILED + 1))
            fi
        fi
    else
        echo "❌ FAIL - Expected HTTP $expected_code, got $http_code"
        FAILED=$((FAILED + 1))
    fi
}

# Test main logs endpoints
echo -e "\n### Testing /api/logs/* endpoints ###"
test_endpoint "/api/logs/activity"
test_endpoint "/api/logs"
test_endpoint "/api/logs/index.js"
test_endpoint "/api/logs-activity.js"

# Test other API endpoints
echo -e "\n### Testing other API endpoints ###"
test_endpoint "/api/health"
test_endpoint "/api/agents"
test_endpoint "/api/tasks"

# Summary
echo -e "\n=========================================="
echo "Test Summary"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n✅ ALL TESTS PASSED!"
    exit 0
else
    echo -e "\n❌ SOME TESTS FAILED"
    exit 1
fi
