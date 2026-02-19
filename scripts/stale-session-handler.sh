#!/bin/bash
# Stale Session Handler
# TASK-104: Automated cleanup of stale agent sessions
# Runs every 6 hours via cron

set -euo pipefail

# Configuration
SESSIONS_DIR="/root/.openclaw/agents/main/sessions"
STATE_FILE="/root/.openclaw/workspace/memory/heartbeat-state.json"
REPORT_FILE="/root/.openclaw/workspace/reports/stale-session-report.md"
LOG_FILE="/root/.openclaw/workspace/logs/stale-session-handler.log"
STALE_THRESHOLD_HOURS=24

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$REPORT_FILE")"

log "═══════════════════════════════════════════════"
log "  Stale Session Handler - TASK-104"
log "  Started: $(date)"
log "═══════════════════════════════════════════════"

# Counters
ARCHIVED_COUNT=0
STALE_FOUND=0
ERRORS=0

# Function to check if session file exists and is not deleted
check_session_file() {
    local session_id="$1"
    
    # Check for active session file
    if [ -f "$SESSIONS_DIR/$session_id.jsonl" ]; then
        # Check if it's stale (older than threshold)
        local file_age_hours=$(( ($(date +%s) - $(stat -c %Y "$SESSIONS_DIR/$session_id.jsonl" 2>/dev/null || echo 0)) / 3600 ))
        if [ "$file_age_hours" -gt "$STALE_THRESHOLD_HOURS" ]; then
            echo "stale:$file_age_hours"
            return
        fi
        echo "active"
        return
    fi
    
    # Check if already archived
    if ls "$SESSIONS_DIR/$session_id.jsonl.deleted."* 2>/dev/null | grep -q .; then
        echo "archived"
        return
    fi
    
    echo "missing"
}

# Function to archive a stale session
archive_session() {
    local session_id="$1"
    local label="$2"
    local reason="$3"
    
    local timestamp=$(date -Iseconds)
    local archive_name="$session_id.jsonl.deleted.$(date +%Y-%m-%dT%H-%M-%S)Z"
    
    if [ -f "$SESSIONS_DIR/$session_id.jsonl" ]; then
        # Add archival header to session file
        {
            echo "{\"type\":\"archival\",\"timestamp\":\"$timestamp\",\"reason\":\"$reason\",\"handler\":\"stale-session-handler.sh\"}"
            cat "$SESSIONS_DIR/$session_id.jsonl"
        } > "$SESSIONS_DIR/$archive_name"
        
        rm "$SESSIONS_DIR/$session_id.jsonl"
        log "  ✓ Archived: $label ($session_id)"
        ((ARCHIVED_COUNT++)) || true
    fi
}

# Read current state and process aborted sessions
if [ -f "$STATE_FILE" ]; then
    log "📋 Checking heartbeat-state.json for stale sessions..."
    
    # Use Node.js to safely parse and update JSON
    node -e "
        const fs = require('fs');
        const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf8'));
        
        const abortedSessions = state.agentHealth?.abortedSessions || [];
        const archivedSessions = state.agentHealth?.archivedSessions || [];
        const now = Math.floor(Date.now() / 1000);
        const staleThreshold = $STALE_THRESHOLD_HOURS * 3600;
        
        const remainingSessions = [];
        const newlyArchived = [];
        
        for (const session of abortedSessions) {
            const age = now - session.detectedAt;
            const sessionFile = '$SESSIONS_DIR/' + session.sessionId + '.jsonl';
            const deletedFiles = require('child_process').execSync('ls ' + sessionFile + '.deleted.* 2>/dev/null || echo ""').toString().trim();
            
            // Check if already archived by system
            if (deletedFiles) {
                newlyArchived.push({
                    ...session,
                    archivedAt: now,
                    reason: 'Session file already archived by system',
                    archiveFile: deletedFiles.split('\\n')[0].split('/').pop()
                });
                console.log('ARCHIVED:' + session.label + ':' + session.sessionId);
            } else if (age > staleThreshold) {
                // Session is stale, mark for archival
                newlyArchived.push({
                    ...session,
                    archivedAt: now,
                    reason: 'Stale (>24h pending)',
                    archiveFile: null
                });
                console.log('STALE:' + session.label + ':' + session.sessionId);
            } else {
                remainingSessions.push(session);
            }
        }
        
        // Update state
        state.agentHealth.abortedSessions = remainingSessions;
        state.agentHealth.archivedSessions = [...archivedSessions, ...newlyArchived];
        state.agentHealth.lastFullCheck = now;
        
        fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
        
        console.log('SUMMARY:Found=' + abortedSessions.length + ',Archived=' + newlyArchived.length + ',Remaining=' + remainingSessions.length);
    " 2>/dev/null | while read line; do
        case "$line" in
            ARCHIVED:*)
                IFS=':' read -r _ label session_id <<< "$line"
                log "  📦 Already archived: $label"
                ((STALE_FOUND++)) || true
                ;;
            STALE:*)
                IFS=':' read -r _ label session_id <<< "$line"
                log "  ⚠️  Stale session found: $label"
                archive_session "$session_id" "$label" "Stale (>24h pending)"
                ((STALE_FOUND++)) || true
                ;;
            SUMMARY:*)
                log "  $line"
                ;;
        esac
    done
else
    log "  ⚠️  State file not found: $STATE_FILE"
    ((ERRORS++)) || true
fi

# Generate report
cat > "$REPORT_FILE" << EOF
# Stale Session Handler Report

**Generated:** $(date -Iseconds)  
**Handler:** stale-session-handler.sh  

## Summary

| Metric | Value |
|--------|-------|
| Stale Sessions Found | $STALE_FOUND |
| Sessions Archived | $ARCHIVED_COUNT |
| Errors | $ERRORS |

## Details

- Stale threshold: ${STALE_THRESHOLD_HOURS} hours
- Sessions directory: \`$SESSIONS_DIR\`
- State file: \`$STATE_FILE\`

## Next Run

Scheduled: $(date -d '+6 hours' -Iseconds 2>/dev/null || echo "6 hours from now")

---

*Auto-generated by stale-session-handler.sh*
EOF

log "═══════════════════════════════════════════════"
log "  Complete"
log "  Stale sessions found: $STALE_FOUND"
log "  Sessions archived: $ARCHIVED_COUNT"
log "  Errors: $ERRORS"
log "  Report: $REPORT_FILE"
log "═══════════════════════════════════════════════"

exit 0
