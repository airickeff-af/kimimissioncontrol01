#!/bin/bash
# Scout Daily Competitor Check Script
# Run this daily to check for competitor updates
# 
# Add to crontab for daily 8 AM execution:
# 0 8 * * * /root/.openclaw/workspace/mission-control/agents/scout/daily-check.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/root/.openclaw/workspace/mission-control/data/competitor-checks.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting daily competitor check..." >> "$LOG_FILE"

# Run the monitor check
cd "$SCRIPT_DIR"
node competitor-monitor.js --check >> "$LOG_FILE" 2>&1

# Generate report
node competitor-monitor.js --report >> "$LOG_FILE" 2>&1

# Export dashboard data
node competitor-monitor.js --export > "$SCRIPT_DIR/../../data/competitor-dashboard.json" 2>/dev/null

DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$DATE] Daily check completed." >> "$LOG_FILE"

# Optional: Send notification if significant alerts found
# (Integrate with your notification system here)
