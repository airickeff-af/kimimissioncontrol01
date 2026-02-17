#!/bin/bash
# update-memory-bank.sh
# Updates memory bank every 30 minutes
# Never forget anything

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
HKT_TIME=$(TZ=Asia/Hong_Kong date +"%Y-%m-%d %H:%M")

MEMORY_BANK="/root/.openclaw/workspace/MEMORY_BANK.md"
PENDING_TASKS="/root/.openclaw/workspace/PENDING_TASKS.md"
DAILY_MEMORY="/root/.openclaw/workspace/memory/$DATE.md"

echo "🧠 Updating Memory Bank..."
echo "Time (HKT): $HKT_TIME"

# Create daily memory if not exists
mkdir -p /root/.openclaw/workspace/memory
touch "$DAILY_MEMORY"

# Update last updated timestamp in memory bank
sed -i "s/Last Updated:.*/Last Updated: $HKT_TIME HKT/" "$MEMORY_BANK"

# Update last updated in pending tasks
sed -i "s/Last Updated:.*/Last Updated: $HKT_TIME HKT/" "$PENDING_TASKS"

# Count current tasks
P0_COUNT=$(grep -c "^### \*\*TASK-" "$PENDING_TASKS" | head -1 || echo "0")
COMPLETED_COUNT=$(grep -c "✅ COMPLETED" "$PENDING_TASKS" || echo "0")
IN_PROGRESS_COUNT=$(grep -c "🔴 IN PROGRESS\|🟡 IN PROGRESS" "$PENDING_TASKS" || echo "0")

echo "📊 Task Status:"
echo "  - Total: $P0_COUNT"
echo "  - Completed: $COMPLETED_COUNT"
echo "  - In Progress: $IN_PROGRESS_COUNT"

# Log to daily memory
echo "" >> "$DAILY_MEMORY"
echo "## $TIME - Memory Bank Update" >> "$DAILY_MEMORY"
echo "- Tasks: $COMPLETED_COUNT completed, $IN_PROGRESS_COUNT in progress" >> "$DAILY_MEMORY"

# Check for stale tasks (overdue)
echo "🔍 Checking for overdue tasks..."

# Remind about critical tasks
echo "🚨 Critical Reminders:"
echo "  - Code API fix needed"
echo "  - 30 leads/day quota"
echo "  - EricF in Hong Kong (GMT+8)"

echo "✅ Memory bank updated!"
