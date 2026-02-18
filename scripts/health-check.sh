#!/bin/bash
# =============================================================================
# Post-Deployment Health Check Script
# Verifies that the deployed application is healthy and responding
# =============================================================================

set -e

# Configuration
DEPLOY_URL="${1:-https://dashboard-ten-sand-20.vercel.app}"
HEALTH_ENDPOINT="/api/health"
MAX_RETRIES=5
RETRY_DELAY=5
TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# MAIN HEALTH CHECK
# =============================================================================

log_info "Starting health check for: $DEPLOY_URL"
log_info "Health endpoint: $HEALTH_ENDPOINT"
echo ""

# Build full URL
FULL_URL="${DEPLOY_URL}${HEALTH_ENDPOINT}"

# Wait a moment for deployment to be ready
log_info "Waiting for deployment to stabilize..."
sleep 3

# Attempt health check with retries
ATTEMPT=1
HEALTHY=false

while [ $ATTEMPT -le $MAX_RETRIES ]; do
    log_info "Health check attempt $ATTEMPT/$MAX_RETRIES..."
    
    # Perform health check
    HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" \
        --max-time $TIMEOUT \
        -H "Cache-Control: no-cache" \
        "$FULL_URL" 2>/dev/null || echo "\n000")
    
    HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
    HTTP_STATUS=$(echo "$HTTP_RESPONSE" | tail -n1)
    
    log_info "HTTP Status: $HTTP_STATUS"
    
    if [ "$HTTP_STATUS" == "200" ]; then
        log_success "Health endpoint returned 200 OK"
        
        # Parse JSON response if possible
        if command -v jq &> /dev/null; then
            STATUS=$(echo "$HTTP_BODY" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
            log_info "API Status: $STATUS"
            
            # Check individual health checks
            if echo "$HTTP_BODY" | jq -e '.checks' &> /dev/null; then
                echo "$HTTP_BODY" | jq -r '.checks | to_entries[] | "  - \(.key): \(.value)"' | while read line; do
                    log_info "$line"
                done
            fi
        else
            log_info "Response: $HTTP_BODY"
        fi
        
        HEALTHY=true
        break
    elif [ "$HTTP_STATUS" == "000" ]; then
        log_warning "Connection failed (attempt $ATTEMPT)"
    else
        log_warning "Unexpected status code: $HTTP_STATUS (attempt $ATTEMPT)"
        if [ -n "$HTTP_BODY" ]; then
            log_info "Response: $HTTP_BODY"
        fi
    fi
    
    if [ $ATTEMPT -lt $MAX_RETRIES ]; then
        log_info "Waiting ${RETRY_DELAY}s before retry..."
        sleep $RETRY_DELAY
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

# =============================================================================
# ADDITIONAL CHECKS
# =============================================================================

echo ""
log_info "Running additional endpoint checks..."

# Check main page
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$DEPLOY_URL" 2>/dev/null || echo "000")
if [ "$MAIN_STATUS" == "200" ]; then
    log_success "Main page (/) - OK (200)"
else
    log_warning "Main page (/) - Status: $MAIN_STATUS"
fi

# Check API endpoints
API_ENDPOINTS=("/api/tokens" "/api/agents" "/api/tasks")
for endpoint in "${API_ENDPOINTS[@]}"; do
    API_URL="${DEPLOY_URL}${endpoint}"
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$API_URL" 2>/dev/null || echo "000")
    
    if [ "$API_STATUS" == "200" ]; then
        log_success "API $endpoint - OK (200)"
    elif [ "$API_STATUS" == "401" ] || [ "$API_STATUS" == "403" ]; then
        log_info "API $endpoint - Protected ($API_STATUS)"
    elif [ "$API_STATUS" == "404" ]; then
        log_warning "API $endpoint - Not Found (404)"
    else
        log_warning "API $endpoint - Status: $API_STATUS"
    fi
done

# =============================================================================
# FINAL RESULT
# =============================================================================

echo ""
if [ "$HEALTHY" == "true" ]; then
    log_success "=========================================="
    log_success "  HEALTH CHECK PASSED"
    log_success "=========================================="
    log_success "Deployment is healthy and ready!"
    log_success "URL: $DEPLOY_URL"
    exit 0
else
    log_error "=========================================="
    log_error "  HEALTH CHECK FAILED"
    log_error "=========================================="
    log_error "Deployment did not pass health checks"
    log_error "URL: $DEPLOY_URL"
    exit 1
fi
