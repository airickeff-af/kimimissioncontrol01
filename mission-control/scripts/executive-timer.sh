#!/bin/bash
# Executive Authority Timer
# Tracks time since last EricF contact

LAST_CONTACT_FILE="/root/.openclaw/workspace/mission-control/.last_contact"
EXECUTIVE_WINDOW_HOURS=3

# Update last contact time
update_contact() {
    date +%s > $LAST_CONTACT_FILE
    echo "Last contact updated: $(date)"
}

# Check if executive authority should activate
check_executive() {
    if [ ! -f $LAST_CONTACT_FILE ]; then
        echo "No last contact recorded"
        return 1
    fi
    
    LAST_CONTACT=$(cat $LAST_CONTACT_FILE)
    CURRENT=$(date +%s)
    DIFF=$((CURRENT - LAST_CONTACT))
    HOURS_SINCE=$((DIFF / 3600))
    
    echo "Hours since last contact: $HOURS_SINCE"
    
    if [ $HOURS_SINCE -ge $EXECUTIVE_WINDOW_HOURS ]; then
        echo "EXECUTIVE AUTHORITY ACTIVE"
        return 0
    else
        HOURS_REMAINING=$((EXECUTIVE_WINDOW_HOURS - HOURS_SINCE))
        echo "Executive window opens in: $HOURS_REMAINING hours"
        return 1
    fi
}

# Main
case "${1:-update}" in
    update)
        update_contact
        ;;
    check)
        check_executive
        ;;
    *)
        echo "Usage: $0 [update|check]"
        exit 1
        ;;
esac
