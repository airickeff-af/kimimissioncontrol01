# GitHub Actions Auto-Deploy

This repository automatically syncs to GitHub using GitHub Actions.

## How It Works

Every time you commit locally, the workflow:
1. Checks out the repository
2. Syncs all local changes
3. Commits with timestamp
4. Pushes to GitHub

## Manual Trigger

You can also trigger manually:
1. Go to GitHub repo → Actions tab
2. Select "Auto Deploy to GitHub"
3. Click "Run workflow"

## Setup Requirements

None! The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## Viewing Deployments

Check the Actions tab in your GitHub repository to see deployment history.
