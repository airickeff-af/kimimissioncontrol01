#!/bin/bash

URL="https://dashboard-ten-sand-20.vercel.app"

echo "🔍 DETAILED ROUTING ANALYSIS"
echo "================================"

# Check if routes work with .html extension
echo ""
echo "Checking .html variants:"
for route in "/agents" "/tasks" "/office"; do
  html_route="${route}.html"
  echo -n "  $html_route ... "
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${URL}${html_route}" 2>&1)
  echo "HTTP $code"
done

# Check redirects
echo ""
echo "Checking redirect behavior:"
for route in "/agents" "/tasks" "/office"; do
  echo -n "  $route redirect ... "
  redirect=$(curl -s -o /dev/null -w "%{redirect_url}" --max-time 10 "${URL}${route}" 2>&1)
  if [ -z "$redirect" ]; then
    echo "No redirect"
  else
    echo "→ $redirect"
  fi
done

# Check for common routing patterns
echo ""
echo "Checking common SPA routes:"
ROUTES=(
  "/index.html"
  "/tasks.html"
  "/deals.html"
  "/logs.html"
  "/tokens.html"
  "/deploy.html"
)
for route in "${ROUTES[@]}"; do
  echo -n "  $route ... "
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${URL}${route}" 2>&1)
  echo "HTTP $code"
done
