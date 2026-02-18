#!/bin/bash
#
# Post-Deploy Quality Gate
# Tests the LIVE deployment and enforces 95/100 minimum score
#

DEPLOYMENT_URL="https://dashboard-ten-sand-20.vercel.app"
MIN_SCORE=95
LOG_FILE="/tmp/quality-gate.log"

echo "$(date '+%Y-%m-%d %H:%M:%S'): Quality Gate check started" >> $LOG_FILE
echo "Testing: $DEPLOYMENT_URL" >> $LOG_FILE

PASS=0
FAIL=0
TOTAL=0

# Test endpoints
test_endpoint() {
    local path=$1
    local expected=$2
    TOTAL=$((TOTAL + 1))
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOYMENT_URL}${path}" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        echo "✅ $path - $HTTP_CODE" >> $LOG_FILE
        PASS=$((PASS + 1))
    else
        echo "❌ $path - Got $HTTP_CODE, expected $expected" >> $LOG_FILE
        FAIL=$((FAIL + 1))
    fi
}

# Run tests
echo "Testing API endpoints..." >> $LOG_FILE
test_endpoint "/api/health" "200"
test_endpoint "/api/agents" "200"
test_endpoint "/api/logs/activity" "200"
test_endpoint "/api/tasks" "200"
test_endpoint "/api/deals" "200"

echo "Testing pages..." >> $LOG_FILE
test_endpoint "/" "200"
test_endpoint "/office.html" "200"
test_endpoint "/agents.html" "200"
test_endpoint "/dealflow-view.html" "200"
test_endpoint "/scout.html" "200"

# Calculate score
SCORE=$((PASS * 100 / TOTAL))

echo "" >> $LOG_FILE
echo "Results: $PASS/$TOTAL passed" >> $LOG_FILE
echo "Score: $SCORE/100" >> $LOG_FILE

if [ $SCORE -ge $MIN_SCORE ]; then
    echo "✅ QUALITY GATE PASSED - $SCORE/100" >> $LOG_FILE
    echo "✅ QUALITY GATE PASSED - $SCORE/100 (minimum: $MIN_SCORE)"
    exit 0
else
    echo "🔴 QUALITY GATE FAILED - $SCORE/100" >> $LOG_FILE
    echo "🔴 QUALITY GATE FAILED - $SCORE/100 (minimum: $MIN_SCORE)"
    echo "Check $LOG_FILE for details"
    exit 1
fi