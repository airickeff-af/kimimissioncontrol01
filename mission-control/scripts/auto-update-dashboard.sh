#!/bin/bash
#
# Auto-Update Dashboard Hook
# Automatically updates relevant dashboard when features are built
#

REPO_DIR="/root/.openclaw/workspace"
DASHBOARD_DIR="$REPO_DIR/mission-control/dashboard"

echo "🔄 Auto-Update Dashboard Hook"
echo "=============================="

# Detect which agent made changes
AGENT=$(git diff --name-only HEAD | grep -oE 'agents/([a-z-]+)' | head -1 | cut -d'/' -f2)

if [ -z "$AGENT" ]; then
    echo "No agent changes detected"
    exit 0
fi

echo "Detected changes from: $AGENT"

# Update appropriate dashboard based on agent
case "$AGENT" in
    scout)
        echo "Updating Scout dashboard..."
        node $REPO_DIR/mission-control/scripts/update-scout-dashboard.js
        ;;
    dealflow|coldcall)
        echo "Updating Lead dashboard..."
        node $REPO_DIR/mission-control/scripts/update-lead-dashboard.js
        ;;
    forge|code)
        echo "Updating Agent Performance dashboard..."
        node $REPO_DIR/mission-control/scripts/update-agent-dashboard.js
        ;;
    nexus)
        echo "Updating main dashboard..."
        node $REPO_DIR/mission-control/scripts/update-main-dashboard.js
        ;;
    *)
        echo "No automatic dashboard update for $AGENT"
        ;;
esac

# Auto-commit dashboard updates
if [ -n "$(git status --porcelain $DASHBOARD_DIR)" ]; then
    git add $DASHBOARD_DIR
    git commit -m "auto: Update $AGENT dashboard after feature deployment"
    echo "✅ Dashboard updated and committed"
fi

echo "Done"
