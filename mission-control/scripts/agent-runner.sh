#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                    MISSION CONTROL - AGENT RUNNER                        ║
# ║              Execute agent tasks from cron or manual trigger             ║
# ╚══════════════════════════════════════════════════════════════════════════╝

AGENT_NAME="$1"
MC_DIR="/root/.openclaw/workspace/mission-control"
AGENT_DIR="$MC_DIR/agents/$AGENT_NAME"
LOG_FILE="$AGENT_DIR/logs/cron.log"

# Ensure log directory exists
mkdir -p "$AGENT_DIR/logs"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Validate agent exists
if [[ ! -d "$AGENT_DIR" ]]; then
    log "ERROR: Agent '$AGENT_NAME' not found"
    exit 1
fi

# Update last active timestamp
if command -v jq &> /dev/null; then
    jq '.metrics.last_active = "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"' \
       "$AGENT_DIR/agent.json" > "$AGENT_DIR/agent.json.tmp" && \
       mv "$AGENT_DIR/agent.json.tmp" "$AGENT_DIR/agent.json"
fi

log "INFO: Agent $AGENT_NAME execution started"

# Check for pending tasks
PENDING_TASKS=$(find "$AGENT_DIR/tasks" -name "*.json" -exec cat {} \; 2>/dev/null | \
    grep -c '"status": "pending"\|"status": "assigned"\|"status": "in_progress"' || echo "0")

log "INFO: Found $PENDING_TASKS pending tasks"

# Agent-specific logic would go here
# This is a template for future expansion

case "$AGENT_NAME" in
    scout)
        log "INFO: Running scout agent logic"
        # Scout-specific monitoring logic
        ;;
    sentry)
        log "INFO: Running sentry agent logic"
        # Sentry-specific alert logic
        ;;
    *)
        log "INFO: Running generic agent check"
        # Generic agent logic
        ;;
esac

log "INFO: Agent $AGENT_NAME execution completed"
