#!/bin/bash
# Weekly Report Generator Script
# Run every Sunday at 9:00 PM HKT
# Location: /root/.openclaw/workspace/mission-control/agents/glasses/scripts/generate-weekly-report.sh

set -e

# Configuration
REPORTS_DIR="/root/.openclaw/workspace/reports/weekly"
TEMPLATE="/root/.openclaw/workspace/mission-control/agents/glasses/templates/weekly-report-template.md"
MEMORY_BANK="/root/.openclaw/workspace/MEMORY_BANK.md"
PENDING_TASKS="/root/.openclaw/workspace/PENDING_TASKS.md"
AGENT_TRACKER="/root/.openclaw/workspace/mission-control/AGENT_TASK_TRACKER.md"
ACTIVE_TASKS="/root/.openclaw/workspace/mission-control/ACTIVE_TASKS.md"
LEAD_SYSTEM="/root/.openclaw/workspace/mission-control/LEAD_MANAGEMENT_SYSTEM_v2.md"

# Get week info
WEEK_START=$(date -d "last monday" +%Y-%m-%d 2>/dev/null || date -v-monday +%Y-%m-%d)
WEEK_END=$(date -d "next sunday" +%Y-%m-%d 2>/dev/null || date -v+sunday +%Y-%m-%d)
WEEK_NUM=$(date +%V)
YEAR=$(date +%Y)
FILENAME="${YEAR}-W${WEEK_NUM}-report.md"
OUTPUT_FILE="${REPORTS_DIR}/${FILENAME}"

echo "========================================"
echo "  WEEKLY REPORT GENERATOR"
echo "========================================"
echo "Week: ${WEEK_START} to ${WEEK_END}"
echo "Report #: ${YEAR}-W${WEEK_NUM}"
echo "Output: ${OUTPUT_FILE}"
echo "========================================"

# Create reports directory if needed
mkdir -p "$REPORTS_DIR"

# Check if source files exist
check_file() {
    if [ ! -f "$1" ]; then
        echo "⚠️  Warning: $1 not found"
        return 1
    fi
    return 0
}

echo ""
echo "📁 Checking data sources..."
check_file "$MEMORY_BANK" && echo "  ✅ MEMORY_BANK.md"
check_file "$PENDING_TASKS" && echo "  ✅ PENDING_TASKS.md"
check_file "$AGENT_TRACKER" && echo "  ✅ AGENT_TASK_TRACKER.md"
check_file "$ACTIVE_TASKS" && echo "  ✅ ACTIVE_TASKS.md"
check_file "$LEAD_SYSTEM" && echo "  ✅ LEAD_MANAGEMENT_SYSTEM_v2.md"

# Copy template
echo ""
echo "📝 Generating report from template..."
cp "$TEMPLATE" "$OUTPUT_FILE"

# Basic placeholder replacement
# Note: Full implementation would parse and calculate from source files

# Date placeholders
sed -i "s/{{WEEK_START}}/${WEEK_START}/g" "$OUTPUT_FILE"
sed -i "s/{{WEEK_END}}/${WEEK_END}/g" "$OUTPUT_FILE"
sed -i "s/{{GENERATED_AT}}/$(date '+%Y-%m-%d %I:%M %p HKT')/g" "$OUTPUT_FILE"
sed -i "s/{{REPORT_NUMBER}}/#${WEEK_NUM}/g" "$OUTPUT_FILE"
sed -i "s/{{FILENAME}}/${FILENAME%.md}/g" "$OUTPUT_FILE"

# Calculate next Sunday
NEXT_SUNDAY=$(date -d "next sunday + 7 days" +%Y-%m-%d 2>/dev/null || date -v+1w -v+sunday +%Y-%m-%d)
sed -i "s/{{NEXT_REPORT_DATE}}/${NEXT_SUNDAY}/g" "$OUTPUT_FILE"

# TODO: Implement data extraction and calculation from source files
# This would involve:
# 1. Parsing task completion counts from PENDING_TASKS.md
# 2. Extracting agent statuses from MEMORY_BANK.md
# 3. Calculating lead metrics from AGENT_TASK_TRACKER.md
# 4. Summarizing blockers from MEMORY_BANK.md
# 5. Computing token usage totals
# 6. Generating trend comparisons

echo ""
echo "✅ Report template generated!"
echo "📄 Location: ${OUTPUT_FILE}"
echo ""
echo "⚠️  NOTE: This is a template with basic date placeholders filled."
echo "   Full data extraction requires manual processing or enhanced parsing."
echo ""
echo "📊 Next steps:"
echo "   1. Review and fill in calculated metrics"
echo "   2. Add executive summary"
echo "   3. Send to EricF via Telegram"
echo ""

# Optional: Send notification (requires OpenClaw message tool)
# message send --target EricF --message "Weekly report ${YEAR}-W${WEEK_NUM} is ready for review."

echo "========================================"
echo "  GENERATION COMPLETE"
echo "========================================"
