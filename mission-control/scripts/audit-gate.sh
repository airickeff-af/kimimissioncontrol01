#!/bin/bash
#
# Audit Bot - Deployment Gatekeeper
# Runs before any deployment to enforce quality standards
# Reads configuration from /mission-control/config/audit-config.json
#

REPO_DIR="/root/.openclaw/workspace"
CONFIG_FILE="$REPO_DIR/mission-control/config/audit-config.json"
LOG_FILE="/tmp/audit-gate.log"

# Load config if available
if [ -f "$CONFIG_FILE" ]; then
    MIN_SCORE=$(grep -o '"min_score": [0-9]*' "$CONFIG_FILE" | head -1 | grep -o '[0-9]*' || echo "93")
else
    MIN_SCORE=93
fi

echo "$(date): Audit Gate check started" >> $LOG_FILE

cd $REPO_DIR

# Check if there are changes to deploy
if [ -z "$(git status --porcelain)" ] && [ -z "$(git log origin/master..master 2>/dev/null)" ]; then
    echo "No changes to deploy"
    exit 0
fi

# Run pre-deploy audit
echo "Running quality audit..."
if [ -f "mission-control/scripts/pre-deploy-audit.sh" ]; then
    bash mission-control/scripts/pre-deploy-audit.sh 2>&1 | tee -a $LOG_FILE
    AUDIT_RESULT=${PIPESTATUS[0]}
    
    if [ $AUDIT_RESULT -ne 0 ]; then
        echo "$(date): DEPLOYMENT BLOCKED - Quality check failed" >> $LOG_FILE
        
        # Notify EricF
        echo "🔴 DEPLOYMENT BLOCKED"
        echo ""
        echo "Quality audit failed - Score below $MIN_SCORE/100"
        echo "Review issues in: $LOG_FILE"
        echo ""
        echo "To override (not recommended):"
        echo "  git push --no-verify"
        
        exit 1
    else
        echo "$(date): DEPLOYMENT APPROVED - Quality check passed" >> $LOG_FILE
        echo "✅ Quality audit passed - Ready for deployment"
    fi
else
    echo "Audit script not found - skipping check"
fi

exit 0
