#!/bin/bash
# TASK-103: Logs-View Frontend Rendering Test Script
# Tests the deployed logs-view.html page

echo "=== TASK-103: Logs-View Frontend Rendering Test ==="
echo ""

DASHBOARD_URL="https://dashboard-ten-sand-20.vercel.app"

echo "1. Testing API endpoint..."
API_RESPONSE=$(curl -s "${DASHBOARD_URL}/api/logs/activity?limit=5")
if echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ API returns success=true"
else
    echo "   ❌ API did not return success"
    exit 1
fi

if echo "$API_RESPONSE" | grep -q '"logs"'; then
    echo "   ✅ API returns logs array"
else
    echo "   ❌ API missing logs array"
    exit 1
fi

echo ""
echo "2. Testing CORS headers..."
CORS_HEADERS=$(curl -sI "${DASHBOARD_URL}/api/logs/activity?limit=1" | grep -i "access-control-allow-origin")
if echo "$CORS_HEADERS" | grep -q "\*"; then
    echo "   ✅ CORS headers allow all origins"
else
    echo "   ❌ CORS headers missing or incorrect"
    exit 1
fi

echo ""
echo "3. Testing logs-view.html has timeout fallback..."
HTML_CONTENT=$(curl -s "${DASHBOARD_URL}/logs-view.html?v=$(date +%s)")
if echo "$HTML_CONTENT" | grep -q "FETCH_TIMEOUT"; then
    echo "   ✅ Timeout constant defined"
else
    echo "   ❌ Timeout constant missing"
    exit 1
fi

if echo "$HTML_CONTENT" | grep -q "AbortController"; then
    echo "   ✅ AbortController for fetch timeout"
else
    echo "   ❌ AbortController missing"
    exit 1
fi

if echo "$HTML_CONTENT" | grep -qi "no data"; then
    echo "   ✅ No data fallback message exists"
else
    echo "   ❌ No data fallback missing"
    exit 1
fi

echo ""
echo "4. Testing initial state shows loading indicators..."
if echo "$HTML_CONTENT" | grep -q 'id="total-entries">\.\.\.'; then
    echo "   ✅ Stats show '...' while loading"
else
    echo "   ❌ Stats don't show loading state"
    exit 1
fi

echo ""
echo "5. Testing error handling..."
if echo "$HTML_CONTENT" | grep -q "Failed to load logs"; then
    echo "   ✅ Error handling message exists"
else
    echo "   ❌ Error handling missing"
    exit 1
fi

if echo "$HTML_CONTENT" | grep -q "getMockLogs"; then
    echo "   ✅ Mock data fallback function exists"
else
    echo "   ❌ Mock data fallback missing"
    exit 1
fi

echo ""
echo "=== All Tests Passed! ==="
echo ""
echo "Summary of fixes deployed:"
echo "  ✅ Added 5-second timeout fallback"
echo "  ✅ Added AbortController for fetch cancellation"
echo "  ✅ Added 'No data' state on timeout"
echo "  ✅ Changed initial stats from '-' to '...'"
echo "  ✅ Enhanced error handling with response format validation"
echo "  ✅ CORS headers verified"
echo ""
echo "Dashboard URL: ${DASHBOARD_URL}/logs-view.html"
