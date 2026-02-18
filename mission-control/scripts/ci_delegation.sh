#!/bin/bash
# Continuous Improvement Task Delegation Script
# Called by cron job to convert improvements into actual PENDING_TASKS.md entries

WORKSPACE="/root/.openclaw/workspace"
SCRIPT_DIR="$WORKSPACE/mission-control/scripts"
REPORT_FILE="$WORKSPACE/.last_ci_report.txt"
LOG_FILE="$WORKSPACE/logs/ci_delegation.log"

# Ensure log directory exists
mkdir -p "$WORKSPACE/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== CI Delegation Run Started ==="

# Check if there's a recent improvement report to process
# The cron message asks the agent to review and report improvements
# This script can be called by the agent to persist the tasks

# Method 1: Direct task creation via API (if API server is running)
create_task_via_api() {
    local title="$1"
    local assignee="${2:-Nexus}"
    local priority="${3:-P2}"
    
    # Check if API is running
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        curl -s -X POST http://localhost:8080/api/tasks/create \
            -H "Content-Type: application/json" \
            -d "{
                \"tasks\": [{
                    \"title\": \"$title\",
                    \"assignee\": \"$assignee\",
                    \"priority\": \"$priority\"
                }],
                \"source\": \"Continuous Improvement\"
            }" 2>&1 | tee -a "$LOG_FILE"
        return 0
    else
        log "API server not running, using direct file method"
        return 1
    fi
}

# Method 2: Direct file write (always works)
create_task_direct() {
    local title="$1"
    local assignee="${2:-Nexus}"
    local priority="${3:-P2}"
    
    python3 "$SCRIPT_DIR/ci_task_creator.py" <<EOF
{
    "improvements": [
        {
            "description": "$title",
            "assignee": "$assignee",
            "priority": "$priority"
        }
    ]
}
EOF
}

# If called with arguments, create specific task
if [ $# -ge 1 ]; then
    TITLE="$1"
    ASSIGNEE="${2:-Nexus}"
    PRIORITY="${3:-P2}"
    
    log "Creating task: $TITLE (Assigned: $ASSIGNEE, Priority: $PRIORITY)"
    
    if ! create_task_via_api "$TITLE" "$ASSIGNEE" "$PRIORITY"; then
        create_task_direct "$TITLE" "$ASSIGNEE" "$PRIORITY"
    fi
    exit 0
fi

# If no arguments, check for report file and process it
if [ -f "$REPORT_FILE" ]; then
    log "Processing report file: $REPORT_FILE"
    python3 "$SCRIPT_DIR/ci_task_creator.py" < "$REPORT_FILE" 2>&1 | tee -a "$LOG_FILE"
    # Archive the processed report
    mv "$REPORT_FILE" "$REPORT_FILE.processed.$(date +%s)"
else
    log "No report file found at $REPORT_FILE"
    log "Usage: $0 'Task Title' [Assignee] [Priority]"
fi

log "=== CI Delegation Run Complete ==="
