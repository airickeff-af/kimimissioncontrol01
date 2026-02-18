#!/bin/bash
# Test script for logs-view.html end-to-end verification

echo "========================================="
echo "AUDIT: logs-view.html End-to-End Test"
echo "========================================="
echo ""

# Test 1: API endpoint returns 200
echo "✓ Test 1: API endpoint /api/logs/activity"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/logs/activity)
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ PASS: API returns HTTP 200"
else
    echo "  ✗ FAIL: API returns HTTP $HTTP_CODE"
fi
echo ""

# Test 2: Response contains real agent activity
echo "✓ Test 2: Response contains real agent activity"
LOG_COUNT=$(curl -s http://localhost:3001/api/logs/activity | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['logs']))")
if [ "$LOG_COUNT" -gt 0 ]; then
    echo "  ✓ PASS: API returns $LOG_COUNT log entries"
else
    echo "  ✗ FAIL: API returns no log entries"
fi
echo ""

# Test 3: Check log entry structure
echo "✓ Test 3: Log entry structure validation"
VALID=$(curl -s http://localhost:3001/api/logs/activity | python3 -c "
import json,sys
d=json.load(sys.stdin)
if len(d['logs']) == 0:
    print('EMPTY')
else:
    log = d['logs'][0]
    required = ['timestamp', 'agent', 'type', 'message', 'sessionId']
    missing = [f for f in required if f not in log]
    if missing:
        print(f'MISSING:{','.join(missing)}')
    else:
        print('VALID')
")
if [ "$VALID" = "VALID" ]; then
    echo "  ✓ PASS: Log entries have all required fields"
elif [ "$VALID" = "EMPTY" ]; then
    echo "  ⚠ SKIP: No logs to validate"
else
    echo "  ✗ FAIL: Missing fields: $VALID"
fi
echo ""

# Test 4: Check HTML file is accessible
echo "✓ Test 4: Frontend HTML accessibility"
HTML_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/logs-view.html)
if [ "$HTML_CODE" = "200" ]; then
    echo "  ✓ PASS: logs-view.html is accessible on port 8080"
else
    echo "  ✗ FAIL: logs-view.html returns HTTP $HTML_CODE"
fi
echo ""

# Test 5: Check CORS headers
echo "✓ Test 5: CORS headers"
CORS=$(curl -s -I http://localhost:3001/api/logs/activity | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
    echo "  ✓ PASS: CORS headers present"
    echo "    $CORS"
else
    echo "  ⚠ WARN: CORS headers not found (may cause issues)"
fi
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo "API Server: http://localhost:3001"
echo "Static Server: http://localhost:8080"
echo "Logs URL: http://localhost:8080/logs-view.html"
echo ""
echo "Sample log entry:"
curl -s http://localhost:3001/api/logs/activity | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d['logs']:
    log = d['logs'][0]
    print(f\"  Timestamp: {log['timestamp']}\")
    print(f\"  Agent: {log['agent']}\")
    print(f\"  Type: {log['type']}\")
    print(f\"  Message: {log['message'][:60]}...\")
    print(f\"  Session: {log['sessionId']}\")
"
echo ""
