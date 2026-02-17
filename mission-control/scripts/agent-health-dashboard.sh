#!/bin/bash
# Agent Health Dashboard for Mission Control
# Run this to get a quick status overview of all agents

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         MISSION CONTROL - AGENT HEALTH DASHBOARD         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Check cron job health
echo "📋 CRON JOB STATUS"
echo "─────────────────────────────────────────────────────────────"
openclaw cron list 2>/dev/null | grep -E "(name|enabled|consecutiveErrors|lastStatus)" | head -30 || echo "  (run 'openclaw cron list' manually)"
echo ""

# Check recent sessions
echo "🖥️  ACTIVE SESSIONS (Last 2 hours)"
echo "─────────────────────────────────────────────────────────────"
openclaw sessions list --active-minutes 120 2>/dev/null | grep -E "(displayName|abortedLastRun|totalTokens)" | head -20 || echo "  (run 'openclaw sessions list' manually)"
echo ""

# Check disk space
echo "💾 SYSTEM RESOURCES"
echo "─────────────────────────────────────────────────────────────"
df -h /root/.openclaw/workspace | tail -1 | awk '{print "  Disk Usage: "$5" ("$3" / "$2")"}'
echo ""

# Check for aborted sessions
ABORTED=$(openclaw sessions list --active-minutes 1440 2>/dev/null | grep "abortedLastRun.*true" | wc -l)
if [ "$ABORTED" -gt 0 ]; then
    echo "⚠️  ALERT: $ABORTED aborted session(s) detected in last 24h"
    echo ""
fi

# Task queue status
echo "📝 TASK QUEUE"
echo "─────────────────────────────────────────────────────────────"
if [ -f /root/.openclaw/workspace/mission-control/TASK_QUEUE.md ]; then
    PENDING=$(grep -c "🟡 PENDING" /root/.openclaw/workspace/mission-control/TASK_QUEUE.md 2>/dev/null || echo "0")
    IN_PROGRESS=$(grep -c "🔵 IN PROGRESS" /root/.openclaw/workspace/mission-control/TASK_QUEUE.md 2>/dev/null || echo "0")
    echo "  Pending: $PENDING | In Progress: $IN_PROGRESS"
else
    echo "  Task queue file not found"
fi
echo ""

echo "═════════════════════════════════════════════════════════════"
echo "Run 'openclaw sessions list' for detailed session info"
echo "═════════════════════════════════════════════════════════════"
