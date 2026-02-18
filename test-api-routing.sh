#!/bin/bash
# API Routing Test Script for Vercel
# Tests all possible endpoint variations

echo "=========================================="
echo "Vercel API Routing Test Suite"
echo "=========================================="

# Replace with your actual Vercel domain
DOMAIN="${1:-your-vercel-domain.vercel.app}"

echo ""
echo "Testing Domain: $DOMAIN"
echo ""

# Test 1: Nested route /api/logs/activity
echo "Test 1: /api/logs/activity (nested route)"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/logs/activity"
echo ""

# Test 2: Flat route /api/logs-activity
echo "Test 2: /api/logs-activity (flat route)"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/logs-activity"
echo ""

# Test 3: Folder index /api/logs
echo "Test 3: /api/logs (folder index)"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/logs"
echo ""

# Test 4: Other API endpoints
echo "Test 4: /api/health"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health"
echo ""

echo "Test 5: /api/agents"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/agents"
echo ""

echo "Test 6: /api/tasks"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/tasks"
echo ""

echo "Test 7: /api/metrics"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/metrics"
echo ""

echo "Test 8: /api/tokens"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/tokens"
echo ""

echo ""
echo "=========================================="
echo "Full Response Test for /api/logs/activity"
echo "=========================================="
curl -s "https://$DOMAIN/api/logs/activity" | head -50

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
