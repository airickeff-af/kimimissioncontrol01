#!/bin/bash

# Mission Control Deployment Audit Script
# URL: https://dashboard-ten-sand-20.vercel.app

URL="https://dashboard-ten-sand-20.vercel.app"
API_ENDPOINTS=(
  "/api/health"
  "/api/agents"
  "/api/logs/activity"
  "/api/tasks"
  "/api/deals"
  "/api/tokens"
  "/api/deployments"
  "/api/stats"
)

PAGE_ENDPOINTS=(
  "/"
  "/office.html"
  "/agents.html"
  "/dealflow-view.html"
  "/scout.html"
)

echo "=========================================="
echo "  MISSION CONTROL DEPLOYMENT AUDIT"
echo "  URL: $URL"
echo "  Date: $(date -Iseconds)"
echo "=========================================="
echo ""

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
FAILED_DETAILS=()

echo "🔍 PHASE 1: API ENDPOINT VERIFICATION"
echo "----------------------------------------"
for endpoint in "${API_ENDPOINTS[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  full_url="${URL}${endpoint}"
  echo -n "Testing $endpoint ... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 30 "$full_url" 2>&1)
  http_code=$(echo "$response" | cut -d'|' -f1)
  response_time=$(echo "$response" | cut -d'|' -f2)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "✅ HTTP $http_code (${response_time}s)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "❌ HTTP $http_code (${response_time}s)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    FAILED_DETAILS+=("API $endpoint: HTTP $http_code")
  fi
done

echo ""
echo "🔍 PHASE 2: PAGE LOAD VERIFICATION"
echo "----------------------------------------"
for endpoint in "${PAGE_ENDPOINTS[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  full_url="${URL}${endpoint}"
  echo -n "Testing $endpoint ... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{content_type}" --max-time 30 "$full_url" 2>&1)
  http_code=$(echo "$response" | cut -d'|' -f1)
  response_time=$(echo "$response" | cut -d'|' -f2)
  content_type=$(echo "$response" | cut -d'|' -f3)
  
  if [ "$http_code" = "200" ]; then
    echo "✅ HTTP $http_code (${response_time}s)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "❌ HTTP $http_code (${response_time}s)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    FAILED_DETAILS+=("PAGE $endpoint: HTTP $http_code")
  fi
done

echo ""
echo "🔍 PHASE 3: ROUTING VERIFICATION"
echo "----------------------------------------"
ROUTES=("/agents" "/tasks" "/office")
for route in "${ROUTES[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  full_url="${URL}${route}"
  echo -n "Testing route $route ... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}" --max-time 30 -L "$full_url" 2>&1)
  http_code=$(echo "$response" | cut -d'|' -f1)
  
  if [ "$http_code" = "200" ]; then
    echo "✅ HTTP $http_code (routed correctly)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "❌ HTTP $http_code"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    FAILED_DETAILS+=("ROUTE $route: HTTP $http_code")
  fi
done

echo ""
echo "🔍 PHASE 4: PERFORMANCE CHECK"
echo "----------------------------------------"
echo -n "Homepage load time ... "
load_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 30 "$URL" 2>&1)
echo "${load_time}s"

echo ""
echo "=========================================="
echo "  AUDIT SUMMARY"
echo "=========================================="
echo "Total Checks:    $TOTAL_CHECKS"
echo "Passed:          $PASSED_CHECKS"
echo "Failed:          $FAILED_CHECKS"

if [ $TOTAL_CHECKS -gt 0 ]; then
  SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
  echo "Quality Score:   $SCORE%"
  
  if [ $SCORE -ge 95 ]; then
    echo "Status:          ✅ PASSED (Score >= 95%)"
  elif [ $SCORE -ge 85 ]; then
    echo "Status:          ⚠️ WARNING (Score 85-94%)"
  else
    echo "Status:          ❌ FAILED (Score < 85%)"
  fi
fi

if [ ${#FAILED_DETAILS[@]} -gt 0 ]; then
  echo ""
  echo "FAILED DETAILS:"
  for detail in "${FAILED_DETAILS[@]}"; do
    echo "  - $detail"
  done
fi

echo ""
echo "=========================================="
echo "  AUDIT COMPLETE"
echo "=========================================="
