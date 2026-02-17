#!/bin/bash
#
# Scout Opportunity Radar - Weekly Report Delivery
# Runs every Monday at 10:00 AM Asia/Shanghai
# 
# @author Scout (Research Agent)
# @task TASK-SI-007

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RADAR_SCRIPT="$SCRIPT_DIR/opportunity-radar.js"
LOG_FILE="$SCRIPT_DIR/../../logs/opportunity-radar.log"
REPORT_DIR="$SCRIPT_DIR/../../reports"

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting Opportunity Radar Weekly Report ==="

# Generate report
log "Generating opportunity report..."
REPORT_OUTPUT=$(node "$RADAR_SCRIPT" --report 2>&1)
echo "$REPORT_OUTPUT" >> "$LOG_FILE"

# Generate Telegram message
log "Generating Telegram message..."
TELEGRAM_MSG=$(node "$RADAR_SCRIPT" --telegram 2>&1)

# Save Telegram message to file for manual sending or API integration
TELEGRAM_FILE="$REPORT_DIR/telegram-msg-$(date +%Y-%m-%d).txt"
echo "$TELEGRAM_MSG" > "$TELEGRAM_MSG_FILE"
log "Telegram message saved to: $TELEGRAM_MSG_FILE"

# Note: Actual Telegram delivery requires TELEGRAM_BOT_TOKEN environment variable
# and the message tool. This script prepares the message for delivery.

log "=== Report Generation Complete ==="
log "Next report: Next Monday at 10:00 AM"

# Output the Telegram message for capture
echo "$TELEGRAM_MSG"
