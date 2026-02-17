#!/bin/bash
# Archive Old Sessions Script
# TASK-CI-006: Daily archival of old session transcripts
#
# This script archives session transcripts older than a specified threshold
# to reduce token usage in the main context window.

set -euo pipefail

# Configuration
MEMORY_DIR="/root/.openclaw/workspace/memory"
ARCHIVE_DIR="/root/.openclaw/workspace/memory/archive"
ARCHIVE_AGE_DAYS=2
COMPRESS_AGE_DAYS=7
LOG_FILE="/root/.openclaw/workspace/memory/archive/archive.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Ensure directories exist
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "═══════════════════════════════════════════════"
log "  Daily Session Archival - TASK-CI-006"
log "  Started: $(date)"
log "═══════════════════════════════════════════════"

# Counters
ARCHIVED_COUNT=0
COMPRESSED_COUNT=0
TOKENS_FREED=0
ERRORS=0

# Function to estimate tokens (rough approximation)
estimate_tokens() {
    local file="$1"
    local chars=$(wc -c < "$file")
    echo $((chars / 4))
}

# Step 1: Archive old session files
log "📁 Step 1: Archiving sessions older than ${ARCHIVE_AGE_DAYS} days..."

find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f -mtime +$ARCHIVE_AGE_DAYS | while read -r file; do
    filename=$(basename "$file")
    
    # Skip already archived or special files
    if [[ "$filename" == ARCHIVED* ]] || [[ "$filename" == EVICTED* ]]; then
        continue
    fi
    
    # Skip essential files
    if [[ "$filename" == "HEARTBEAT.md" ]] || [[ "$filename" == "MEMORY.md" ]]; then
        continue
    fi
    
    # Check if file contains completed tasks or is a session transcript
    if grep -q "Status: Completed\|✅ Complete\|session\|transcript" "$file" 2>/dev/null; then
        archive_name="ARCHIVED-$(date +%Y%m%d)-${filename}"
        
        # Add archival header
        tokens=$(estimate_tokens "$file")
        {
            echo "---"
            echo "ARCHIVED: $(date -Iseconds)"
            echo "ORIGINAL: $filename"
            echo "TOKENS_EST: $tokens"
            echo "ARCHIVED_BY: archive-old-sessions.sh"
            echo "---"
            echo ""
            cat "$file"
        } > "$ARCHIVE_DIR/$archive_name"
        
        rm "$file"
        ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
        TOKENS_FREED=$((TOKENS_FREED + tokens))
        log "  ✓ Archived: $filename (~${tokens} tokens)"
    fi
done

# Step 2: Compress old archives
log "📦 Step 2: Compressing archives older than ${COMPRESS_AGE_DAYS} days..."

find "$ARCHIVE_DIR" -maxdepth 1 -name "ARCHIVED-*.md" -type f -mtime +$COMPRESS_AGE_DAYS | while read -r file; do
    filename=$(basename "$file")
    gzip -9 "$file"
    COMPRESSED_COUNT=$((COMPRESSED_COUNT + 1))
    log "  ✓ Compressed: ${filename}.gz"
done

# Step 3: Clean up very old compressed archives (older than 30 days)
log "🗑️  Step 3: Cleaning up archives older than 30 days..."

find "$ARCHIVE_DIR" -maxdepth 1 -name "ARCHIVED-*.md.gz" -type f -mtime +30 -delete

# Step 4: Update statistics
log "📊 Step 4: Updating statistics..."

TOTAL_ARCHIVED=$(find "$ARCHIVE_DIR" -type f | wc -l)
ARCHIVE_SIZE=$(du -sh "$ARCHIVE_DIR" 2>/dev/null | cut -f1)

# Update heartbeat state
STATE_FILE="$MEMORY_DIR/heartbeat-state.json"
if [ -f "$STATE_FILE" ]; then
    # Use Node.js to update JSON (more reliable than sed for JSON)
    node -e "
        const fs = require('fs');
        const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf8'));
        state.dailyArchival = {
            lastRun: Math.floor(Date.now() / 1000),
            filesArchived: $ARCHIVED_COUNT,
            filesCompressed: $COMPRESSED_COUNT,
            tokensFreed: $TOKENS_FREED,
            totalArchived: $TOTAL_ARCHIVED,
            archiveSize: '$ARCHIVE_SIZE'
        };
        fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
    " 2>/dev/null || log "  Note: Could not update heartbeat state"
fi

# Summary
log "═══════════════════════════════════════════════"
log "  Archival Complete"
log "  Files archived: $ARCHIVED_COUNT"
log "  Files compressed: $COMPRESSED_COUNT"
log "  Estimated tokens freed: $TOKENS_FREED"
log "  Total archived files: $TOTAL_ARCHIVED"
log "  Archive directory size: $ARCHIVE_SIZE"
log "  Errors: $ERRORS"
log "═══════════════════════════════════════════════"

# Alert if token usage is still high
if [ -f "$STATE_FILE" ]; then
    TOKEN_USAGE=$(node -e "
        const fs = require('fs');
        const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf8'));
        console.log(state.tokenUsage?.mainSession || 0);
    " 2>/dev/null || echo "0")
    
    if [ "$TOKEN_USAGE" -gt 150000 ] 2>/dev/null; then
        log "⚠️  WARNING: Token usage still high ($TOKEN_USAGE) - consider running memory-optimizer.js"
    fi
fi

exit 0
