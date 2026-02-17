#!/bin/bash
# Task Queue Manager for Mission Control
# Usage: ./task-queue.sh [add|list|complete|status]

QUEUE_FILE="/root/.openclaw/workspace/mission-control/TASK_QUEUE.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function show_help() {
    echo "Mission Control Task Queue Manager"
    echo ""
    echo "Usage:"
    echo "  ./task-queue.sh add \"Task description\" [P0|P1|P2|P3] [agent]"
    echo "  ./task-queue.sh list"
    echo "  ./task-queue.sh complete [task_id]"
    echo "  ./task-queue.sh status"
    echo ""
    echo "Priority Levels:"
    echo "  P0 - Critical (immediate)"
    echo "  P1 - High (within 24h)"
    echo "  P2 - Medium (within 3 days)"
    echo "  P3 - Low (when possible)"
}

function add_task() {
    local description="$1"
    local priority="${2:-P2}"
    local agent="${3:-Nexus}"
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    local id=$(date '+%s')
    
    echo -e "${YELLOW}Adding task to queue...${NC}"
    
    # Create task entry
    cat >> "$QUEUE_FILE" << EOF

| $id | $description | 🟡 PENDING | $agent | $priority | $timestamp | - |
EOF
    
    echo -e "${GREEN}✅ Task added with ID: $id${NC}"
    echo "Description: $description"
    echo "Priority: $priority"
    echo "Assigned to: $agent"
}

function list_tasks() {
    echo -e "${BLUE}📋 MISSION CONTROL TASK QUEUE${NC}"
    echo ""
    
    # Show pending tasks
    echo -e "${YELLOW}🟡 PENDING TASKS:${NC}"
    grep "🟡 PENDING" "$QUEUE_FILE" | tail -20 || echo "No pending tasks"
    
    echo ""
    echo -e "${GREEN}✅ RECENTLY COMPLETED:${NC}"
    grep "🟢 COMPLETED" "$QUEUE_FILE" | tail -5 || echo "No completed tasks"
}

function complete_task() {
    local task_id="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    
    if [ -z "$task_id" ]; then
        echo -e "${RED}Error: Please provide task ID${NC}"
        exit 1
    fi
    
    # Update task status
    sed -i "s/| $task_id |/| $task_id |/" "$QUEUE_FILE"
    sed -i "s/🟡 PENDING/🟢 COMPLETED/" "$QUEUE_FILE"
    
    echo -e "${GREEN}✅ Task $task_id marked as completed${NC}"
}

function show_status() {
    local pending=$(grep -c "🟡 PENDING" "$QUEUE_FILE" 2>/dev/null || echo "0")
    local in_progress=$(grep -c "🔵 IN PROGRESS" "$QUEUE_FILE" 2>/dev/null || echo "0")
    local completed=$(grep -c "🟢 COMPLETED" "$QUEUE_FILE" 2>/dev/null || echo "0")
    
    echo -e "${BLUE}📊 TASK QUEUE STATUS${NC}"
    echo ""
    echo -e "${YELLOW}🟡 Pending: $pending${NC}"
    echo -e "${BLUE}🔵 In Progress: $in_progress${NC}"
    echo -e "${GREEN}✅ Completed: $completed${NC}"
    echo ""
    
    if [ "$pending" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  You have $pending pending tasks${NC}"
        list_tasks
    else
        echo -e "${GREEN}✨ All tasks completed!${NC}"
    fi
}

# Main
case "${1:-status}" in
    add)
        add_task "$2" "$3" "$4"
        ;;
    list)
        list_tasks
        ;;
    complete)
        complete_task "$2"
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
