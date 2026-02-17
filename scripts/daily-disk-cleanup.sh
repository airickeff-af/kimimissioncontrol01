#!/bin/bash
# Daily Disk Space Optimization Script for Mission Control
# Run via cron at 2 AM daily

WORKSPACE="/root/.openclaw/workspace"
SESSIONS="/root/.openclaw/agents/main/sessions"
LOG_FILE="$WORKSPACE/logs/disk-cleanup-$(date +%Y%m%d).log"

mkdir -p "$WORKSPACE/logs"

echo "=== Disk Cleanup Started: $(date) ===" | tee -a "$LOG_FILE"

# 1. Archive old session transcripts (older than 7 days)
echo "Archiving old session transcripts..." | tee -a "$LOG_FILE"
find "$SESSIONS" -name "*.jsonl" -mtime +7 -type f | while read file; do
    gzip "$file"
    echo "Compressed: $file" | tee -a "$LOG_FILE"
done

# 2. Remove archived transcripts older than 30 days
echo "Removing old archived transcripts..." | tee -a "$LOG_FILE"
find "$SESSIONS" -name "*.jsonl.gz" -mtime +30 -type f -delete
DELETED=$(find "$SESSIONS" -name "*.jsonl.gz" -mtime +30 -type f | wc -l)
echo "Removed $DELETED old archives" | tee -a "$LOG_FILE"

# 3. Truncate main session if > 5MB (keep last 1000 lines)
MAIN_SESSION="$SESSIONS/13552970-3200-4905-bde1-2d3658f60354.jsonl"
if [ -f "$MAIN_SESSION" ]; then
    SIZE=$(stat -f%z "$MAIN_SESSION" 2>/dev/null || stat -c%s "$MAIN_SESSION" 2>/dev/null)
    if [ "$SIZE" -gt 5242880 ]; then  # 5MB
        echo "Main session is ${SIZE} bytes, truncating..." | tee -a "$LOG_FILE"
        tail -n 1000 "$MAIN_SESSION" > "$MAIN_SESSION.tmp"
        mv "$MAIN_SESSION.tmp" "$MAIN_SESSION"
        echo "Main session truncated to last 1000 lines" | tee -a "$LOG_FILE"
    fi
fi

# 4. Clean up old log files
echo "Cleaning old logs..." | tee -a "$LOG_FILE"
find "$WORKSPACE/logs" -name "*.log" -mtime +14 -type f -delete

# 5. Report disk usage
echo "" | tee -a "$LOG_FILE"
echo "=== Disk Usage After Cleanup ===" | tee -a "$LOG_FILE"
df -h / | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Session storage: $(du -sh $SESSIONS 2>/dev/null | cut -f1)" | tee -a "$LOG_FILE"
echo "Workspace: $(du -sh $WORKSPACE 2>/dev/null | cut -f1)" | tee -a "$LOG_FILE"

echo "=== Cleanup Complete: $(date) ===" | tee -a "$LOG_FILE"
