#!/bin/bash
# Scout Weekly Auto-Discovery Cron Script
# Run this every Monday at 9:00 AM for regional lead discovery
# 
# CRON SETUP:
# 0 9 * * 1 /root/.openclaw/workspace/mission-control/agents/scout/weekly-discover.sh
# (Runs at 9:00 AM every Monday)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/root/.openclaw/workspace/mission-control/data/auto-discover.log"
REPORT_DIR="/root/.openclaw/workspace/mission-control/data/auto-discover-reports"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

echo "[$DATE] =========================================" >> "$LOG_FILE"
echo "[$DATE] Starting weekly auto-discovery scan..." >> "$LOG_FILE"
echo "[$DATE] =========================================" >> "$LOG_FILE"

# Run the discovery scan
cd "$SCRIPT_DIR"
node auto-discover.js --scan >> "$LOG_FILE" 2>&1

# Check if scan succeeded
if [ $? -eq 0 ]; then
    echo "[$DATE] ✓ Scan completed successfully" >> "$LOG_FILE"
    
    # Generate weekly report
    node auto-discover.js --report >> "$LOG_FILE" 2>&1
    
    # Get count of new leads discovered this week
    WEEK_START=$(date -d "last monday" '+%Y-%m-%d' 2>/dev/null || date -v-mon '+%Y-%m-%d')
    REPORT_FILE="$REPORT_DIR/report-$(date '+%Y-%m-%d').json"
    
    if [ -f "$REPORT_FILE" ]; then
        DISCOVERIES=$(grep -o '"newDiscoveries":[0-9]*' "$REPORT_FILE" | grep -o '[0-9]*' || echo "0")
        echo "[$DATE] 📊 New leads discovered this week: $DISCOVERIES" >> "$LOG_FILE"
    fi
else
    echo "[$DATE] ✗ Scan failed with error code $?" >> "$LOG_FILE"
fi

DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$DATE] Weekly discovery completed." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Optional: Send notification if new P0 leads found
# (Integrate with your notification system here)
# Example: notify-send "Scout Discovery" "$DISCOVERIES new leads discovered"
