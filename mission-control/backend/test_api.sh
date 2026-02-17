#!/bin/bash
#
# Backend API Test Suite
# Tests all endpoints for the Mission Control Backend API
#

API_BASE="http://localhost:8080"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    printf "Testing %s... " "$name"
    
    HTTP_STATUS=$(curl -s -o /tmp/response.json -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_STATUS" = "$expected_status" ]; then
        printf "${GREEN}PASS${NC} (%s)\n" "$HTTP_STATUS"
        PASS=$((PASS + 1))
        return 0
    else
        printf "${RED}FAIL${NC} (expected %s, got %s)\n" "$expected_status" "$HTTP_STATUS"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

test_json_response() {
    local name="$1"
    local url="$2"
    local jq_filter="$3"
    
    printf "Testing %s (JSON validation)... " "$name"
    
    RESPONSE=$(curl -s "$url" 2>/dev/null)
    if echo "$RESPONSE" | jq -e "$jq_filter" >/dev/null 2>&1; then
        printf "${GREEN}PASS${NC}\n"
        PASS=$((PASS + 1))
        return 0
    else
        printf "${RED}FAIL${NC}\n"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

test_cors() {
    local name="$1"
    local url="$2"
    local origin="$3"
    
    printf "Testing CORS for %s... " "$name"
    
    if curl -s -I -X GET -H "Origin: $origin" "$url" 2>/dev/null | grep -qi "access-control-allow-origin"; then
        printf "${GREEN}PASS${NC}\n"
        PASS=$((PASS + 1))
        return 0
    else
        printf "${RED}FAIL${NC}\n"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

echo "======================================"
echo "Mission Control Backend API Test Suite"
echo "======================================"
echo ""

# Check if API is running
printf "Checking API server... "
if curl -s "$API_BASE/api/health" >/dev/null 2>&1; then
    printf "${GREEN}RUNNING${NC}\n"
else
    printf "${RED}NOT RUNNING${NC}\n"
    echo "Please start the API server first: python3 api_server.py"
    exit 1
fi
echo ""

# Test Health Endpoint
test_endpoint "GET /api/health" "$API_BASE/api/health"
test_json_response "GET /api/health (JSON)" "$API_BASE/api/health" ".status"

# Test Agents Endpoints
test_endpoint "GET /api/agents" "$API_BASE/api/agents"
test_json_response "GET /api/agents (JSON)" "$API_BASE/api/agents" ".agents"

# Test specific agent (using 'coder' which exists)
test_endpoint "GET /api/agents/coder" "$API_BASE/api/agents/coder"
test_json_response "GET /api/agents/coder (JSON)" "$API_BASE/api/agents/coder" ".id"

# Test non-existent agent (should return 404)
test_endpoint "GET /api/agents/nonexistent (404)" "$API_BASE/api/agents/nonexistent" "404"

# Test System Endpoints
test_endpoint "GET /api/system/status" "$API_BASE/api/system/status"
test_json_response "GET /api/system/status (JSON)" "$API_BASE/api/system/status" ".timestamp"

# Test Tasks Endpoints
test_endpoint "GET /api/tasks" "$API_BASE/api/tasks"
test_json_response "GET /api/tasks (JSON)" "$API_BASE/api/tasks" ".tasks"

test_endpoint "GET /api/tasks/active" "$API_BASE/api/tasks/active"
test_json_response "GET /api/tasks/active (JSON)" "$API_BASE/api/tasks/active" ".active_tasks"

# Test CORS
test_cors "CORS localhost:3000" "$API_BASE/api/health" "http://localhost:3000"
test_cors "CORS localhost:5173" "$API_BASE/api/health" "http://localhost:5173"
test_cors "CORS 127.0.0.1:3000" "$API_BASE/api/health" "http://127.0.0.1:3000"

# Test Error Handling
test_endpoint "Path traversal protection (403)" "$API_BASE/api/files/browse?path=../../../etc" "403"
test_endpoint "Non-existent file (404)" "$API_BASE/api/files/read?path=nonexistent/file.txt" "404"

echo ""
echo "======================================"
echo "Test Results: $PASS passed, $FAIL failed"
echo "======================================"

if [ "$FAIL" -eq 0 ]; then
    printf "${GREEN}All tests passed!${NC}\n"
    exit 0
else
    printf "${RED}Some tests failed!${NC}\n"
    exit 1
fi
