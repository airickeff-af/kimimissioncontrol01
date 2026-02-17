#!/bin/bash
# =============================================================================
# Vercel Deployment Rollback Script
# Rolls back to the previous stable deployment when health checks fail
# =============================================================================

set -e

# Configuration
VERCEL_TOKEN="${1:-${VERCEL_TOKEN}}"
VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_rollback() {
    echo -e "${CYAN}[ROLLBACK]${NC} $1"
}

# =============================================================================
# VALIDATION
# =============================================================================

if [ -z "$VERCEL_TOKEN" ]; then
    log_error "VERCEL_TOKEN is required"
    log_info "Usage: $0 <vercel-token>"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI is not installed"
    log_info "Install with: npm install --global vercel"
    exit 1
fi

# =============================================================================
# ROLLBACK PROCESS
# =============================================================================

echo ""
log_rollback "=========================================="
log_rollback "  INITIATING ROLLBACK PROCEDURE"
log_rollback "=========================================="
echo ""

# Get project info
log_info "Fetching deployment history..."

# List recent deployments
DEPLOYMENTS=$(vercel list --token="$VERCEL_TOKEN" --yes 2>/dev/null || echo "")

if [ -z "$DEPLOYMENTS" ]; then
    log_warning "Could not fetch deployment list"
    log_info "Attempting rollback using git..."
    
    # Fallback: redeploy previous commit
    if [ -d ".git" ]; then
        PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
        log_info "Previous commit: $PREVIOUS_COMMIT"
        
        log_rollback "Redeploying previous commit: $PREVIOUS_COMMIT"
        git checkout "$PREVIOUS_COMMIT"
        
        if vercel --prod --token="$VERCEL_TOKEN" --yes; then
            log_success "Rollback to previous commit successful"
            # Return to original branch
            git checkout -
            exit 0
        else
            log_error "Rollback failed"
            git checkout -
            exit 1
        fi
    else
        log_error "Not a git repository and cannot fetch deployments"
        exit 1
    fi
fi

# Find the previous production deployment
log_info "Looking for previous stable deployment..."

# Get deployment list in JSON format if possible
DEPLOYMENT_JSON=$(vercel list --token="$VERCEL_TOKEN" --yes --json 2>/dev/null || echo "[]")

if command -v jq &> /dev/null; then
    # Parse with jq to find previous READY deployment
    PREVIOUS_DEPLOY=$(echo "$DEPLOYMENT_JSON" | jq -r '[.[] | select(.state == "READY")][1] | .url' 2>/dev/null || echo "null")
    
    if [ "$PREVIOUS_DEPLOY" != "null" ] && [ -n "$PREVIOUS_DEPLOY" ]; then
        log_info "Found previous stable deployment: $PREVIOUS_DEPLOY"
        
        # Promote previous deployment to production
        log_rollback "Promoting $PREVIOUS_DEPLOY to production..."
        
        if vercel promote "$PREVIOUS_DEPLOY" --token="$VERCEL_TOKEN" --yes; then
            log_success "Rollback successful!"
            log_success "Previous deployment is now live: https://$PREVIOUS_DEPLOY"
            
            # Verify rollback
            sleep 5
            ROLLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$PREVIOUS_DEPLOY/api/health" 2>/dev/null || echo "000")
            
            if [ "$ROLLBACK_STATUS" == "200" ]; then
                log_success "Rollback verified - health check passed"
            else
                log_warning "Rollback status check returned: $ROLLBACK_STATUS"
            fi
            
            exit 0
        else
            log_error "Failed to promote previous deployment"
            exit 1
        fi
    else
        log_warning "Could not find previous READY deployment"
    fi
else
    log_warning "jq not available, using fallback rollback method"
fi

# =============================================================================
# FALLBACK ROLLBACK: Git-based
# =============================================================================

log_rollback "Using git-based rollback..."

if [ -d ".git" ]; then
    # Get the commit before the current one
    CURRENT_COMMIT=$(git rev-parse HEAD)
    PREVIOUS_COMMIT=$(git rev-parse HEAD~1 2>/dev/null || echo "")
    
    if [ -z "$PREVIOUS_COMMIT" ]; then
        log_error "No previous commit found"
        exit 1
    fi
    
    log_info "Current commit: ${CURRENT_COMMIT:0:7}"
    log_info "Rolling back to: ${PREVIOUS_COMMIT:0:7}"
    
    # Create a temporary branch for rollback
    ROLLBACK_BRANCH="rollback-$(date +%s)"
    git checkout -b "$ROLLBACK_BRANCH" "$PREVIOUS_COMMIT"
    
    # Deploy the previous commit
    log_rollback "Deploying previous commit..."
    if vercel --prod --token="$VERCEL_TOKEN" --yes; then
        log_success "Rollback deployment successful!"
        
        # Return to original branch
        git checkout -
        
        # Optional: Tag the bad deployment
        git tag "failed-deploy-${CURRENT_COMMIT:0:7}" "$CURRENT_COMMIT" 2>/dev/null || true
        
        exit 0
    else
        log_error "Rollback deployment failed"
        git checkout -
        exit 1
    fi
else
    log_error "No git repository found for rollback"
    exit 1
fi
