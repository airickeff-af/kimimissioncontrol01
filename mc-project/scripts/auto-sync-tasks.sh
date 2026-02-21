#!/bin/bash
# Auto-sync script for MC Project task tracking
# Runs every 15 minutes to update PENDING_TASKS.md

cd /root/.openclaw/workspace/mc-project

# Check for completed tasks by looking at git commits
COMMITS=$(git log --since="15 minutes ago" --pretty=format:"%s" | grep -E "P1-|P2-|P0-" | wc -l)

if [ "$COMMITS" -gt 0 ]; then
    echo "[$DATE] Found $COMMITS task-related commits, updating PENDING_TASKS.md"
    
    # Extract task IDs from commits
    TASKS=$(git log --since="15 minutes ago" --pretty=format:"%s" | grep -oE "P[0-9]-[0-9]+" | sort -u)
    
    for TASK in $TASKS; do
        # Mark task as completed in PENDING_TASKS.md
        sed -i "s/| $TASK |.*| ⏳ PENDING/| $TASK | | ✅ COMPLETED ($(date +%b\ %d,\ %H:%M))/" PENDING_TASKS.md
    done
    
    # Commit the update
    git add PENDING_TASKS.md
    git commit -m "Auto-sync: Mark $COMMITS tasks as completed"
    git push origin main
    
    echo "[$DATE] Auto-sync complete"
else
    echo "[$DATE] No task completions to sync"
fi
