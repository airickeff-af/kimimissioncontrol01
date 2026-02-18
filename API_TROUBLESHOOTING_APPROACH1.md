# API Troubleshooting - Approach 1: Flat Structure

## Changes Made

### 1. Created Flat Structure Endpoint
- **File:** `/api/logs-activity.js` (flat, no subfolder)
- **Endpoint:** `/api/logs-activity` 
- **Purpose:** Test if Vercel handles flat file structure better than nested folders

### 2. Updated vercel.json
- Added `functions` configuration to explicitly define serverless functions
- Added rewrite for both `/api/logs/activity` → `/api/logs-activity.js` (backward compat)
- Added rewrite for `/api/logs-activity` → `/api/logs-activity.js` (new endpoint)
- Added `buildCommand: null` and `outputDirectory: "."` for clarity

## Why This Might Work

Based on research, Vercel sometimes has issues with:
1. Nested folder structures in `/api` (e.g., `/api/logs/activity.js`)
2. Missing explicit `functions` configuration in vercel.json
3. Conflicts between folder-based and file-based routing

## Testing Steps

1. Deploy to Vercel
2. Test new endpoint: `curl https://dashboard-ten-sand-20.vercel.app/api/logs-activity`
3. Test old endpoint: `curl https://dashboard-ten-sand-20.vercel.app/api/logs/activity`
4. Check Vercel Functions tab to see if functions are detected

## Next Approaches if This Fails

1. **Rename to index.js at root:** Move function to `/api/logs-activity/index.js`
2. **Use Vercel CLI to inspect:** Run `vercel --version` and check function detection
3. **Try Next.js API pattern:** Create `/pages/api/logs/activity.js` structure
4. **Check for build output:** Inspect `.vercel/output/functions` after build

## Deployment Commands

```bash
cd /root/.openclaw/workspace/mission-control/dashboard
vercel --prod
```

## Research Sources
- Vercel Build Output API docs
- Community posts about 404 errors with nested API routes
- Stack Overflow: Serverless function routing issues
