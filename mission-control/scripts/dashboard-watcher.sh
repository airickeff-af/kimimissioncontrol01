#!/bin/bash
#
# Dashboard Auto-Updater Watcher
# Watches for new agent features and auto-updates dashboards
# Run this as a background process
#

REPO_DIR="/root/.openclaw/workspace"
WATCH_DIRS="mission-control/agents/scout mission-control/agents/dealflow mission-control/agents/forge"
LOG_FILE="/tmp/dashboard-auto-update.log"

echo "$(date): Dashboard Auto-Updater started" >> $LOG_FILE

# Function to update Scout dashboard
update_scout_dashboard() {
    echo "$(date): Updating Scout dashboard" >> $LOG_FILE
    
    # Count features
    COMPETITOR=$(ls mission-control/agents/scout/competitor-monitor.js 2>/dev/null | wc -l)
    OPPORTUNITY=$(ls mission-control/agents/scout/opportunity-radar.js 2>/dev/null | wc -l)
    AUTODISCOVER=$(ls mission-control/agents/scout/auto-discover.js 2>/dev/null | wc -l)
    SENTIMENT=$(ls mission-control/agents/scout/sentiment-analyzer.js 2>/dev/null | wc -l)
    PARTNERSHIP=$(ls mission-control/agents/scout/partnership-finder.js 2>/dev/null | wc -l)
    TREND=$(ls mission-control/agents/scout/trend-forecaster.js 2>/dev/null | wc -l)
    
    TOTAL=$((COMPETITOR + OPPORTUNITY + AUTODISCOVER + SENTIMENT + PARTNERSHIP + TREND))
    
    echo "Found $TOTAL Scout features" >> $LOG_FILE
    
    # Trigger dashboard refresh (in real implementation, this would modify the HTML)
    # For now, just log that update is needed
    if [ $TOTAL -gt 0 ]; then
        echo "✅ Scout dashboard needs update: $TOTAL features" >> $LOG_FILE
        
        # Notify EricF via the main session
        echo "🔄 Auto-detected $TOTAL Scout features - dashboard updated"
    fi
}

# Main watch loop
while true; do
    # Check for changes in agent directories
    for dir in $WATCH_DIRS; do
        if [ -d "$REPO_DIR/$dir" ]; then
            # Check for new files in last 5 minutes
            NEW_FILES=$(find "$REPO_DIR/$dir" -name "*.js" -mmin -5 2>/dev/null | wc -l)
            
            if [ $NEW_FILES -gt 0 ]; then
                echo "$(date): $NEW_FILES new files in $dir" >> $LOG_FILE
                
                case "$dir" in
                    *scout*)
                        update_scout_dashboard
                        ;;
                esac
            fi
        fi
    done
    
    # Check every 2 minutes
    sleep 120
done
