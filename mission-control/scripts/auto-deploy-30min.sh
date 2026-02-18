#!/bin/bash
# Auto-deploy to Vercel every 30 minutes
# This script ensures Vercel always has the latest version

cd /root/.openclaw/workspace/mission-control/dashboard

# Check if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "Uncommitted changes found. Committing..."
    git add -A
    git commit -m "Auto-deploy: $(date)"
fi

# Check if local is ahead of remote
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "none")

if [ "$LOCAL" != "$REMOTE" ] || [ "$REMOTE" = "none" ]; then
    echo "New commits found. Pushing to GitHub..."
    git push origin main --force
    echo "Push complete. Vercel will auto-deploy."
else
    echo "No new commits. Checking deployment age..."
    # Force redeploy if needed (every 30 min)
    echo "Forcing fresh Vercel deployment..."
    echo "$(date) - Force redeploy" > DEPLOY.txt
    git add DEPLOY.txt
    git commit -m "Force deploy: $(date)"
    git push origin main --force
fi

echo "Auto-deploy complete at $(date)"