# API Troubleshooting - Heartbeat Report
**Date:** February 19, 2026  
**Time:** 10:51 AM (Asia/Shanghai)  
**Agent:** API Troubleshooting Specialist  
**Issue:** `/api/logs/activity` returning 404 on Vercel

---

## Executive Summary

After extensive research across Vercel documentation, community forums, Stack Overflow, and Reddit, I've identified **multiple root causes** for the persistent 404 errors. The solution has been prepared but **requires deployment testing**.

### Key Finding
The most likely cause is a **conflict between `outputDirectory` and API routes** in Vercel's static site deployment model.

---

## Root Cause Analysis

### 1. Output Directory Conflict (Primary Suspect)
```json
{
  "outputDirectory": "dashboard"
}
```
When `outputDirectory` is set, Vercel treats the deployment as a **static site**. API routes may not be properly detected in this mode.

**Evidence from Research:**
- Vercel Community: "Framework preset 'Other' with outputDirectory can cause API routes to be ignored"
- Stack Overflow: Multiple reports of API 404s when using custom output directories

### 2. File Location Issues
Current structure has `/api/` at project root, which is correct. However:
- The `vercel.json` has rewrites that may conflict with zero-config detection
- Multiple API file approaches (flat + folder) may cause confusion

### 3. Framework Preset Mismatch
If Vercel auto-detects the framework incorrectly, API routes may not work.

---

## Solutions Implemented (Ready for Testing)

### Solution A: Zero-Config Folder Structure (RECOMMENDED)

**Files Created:**
```
/api/logs/activity.js    - Main endpoint
/api/logs/index.js       - Root endpoint  
/api/logs/chat.js        - Chat endpoint
```

**Configuration:**
```json
{
  "version": 2,
  "name": "mission-control-dashboard",
  "outputDirectory": "dashboard",
  "headers": [...],
  "functions": {
    "api/**/*.js": { "maxDuration": 10 }
  }
}
```

**Status:** ✅ Ready to deploy

---

## Alternative Approaches (If Solution A Fails)

### Approach 1: Remove vercel.json (Pure Zero-Config)
Delete `vercel.json` entirely and let Vercel auto-detect:
- Move dashboard files to `public/` folder
- Keep `/api/` at root
- Vercel will serve static files from `public/` and API from `/api/`

### Approach 2: Next.js Migration
Convert to Next.js for native API route support:
```
pages/api/logs/activity.js
pages/index.js (dashboard)
```

### Approach 3: Edge Functions
Use Vercel Edge Functions (lighter weight):
```javascript
// api/logs/activity.js
export const config = { runtime: 'edge' };
export default async function handler(request) {
  return new Response(JSON.stringify({ success: true }));
}
```

### Approach 4: Static JSON Workaround
If serverless functions can't work, generate static JSON at build time:
```
public/api/logs/activity.json
```

---

## Deployment Testing Plan

### Step 1: Deploy Current Solution
```bash
cd /root/.openclaw/workspace/mission-control
./deploy-zero-config.sh
```

### Step 2: Test Endpoints
```bash
# Test main endpoint
curl https://dashboard-ten-sand-20.vercel.app/api/logs/activity

# Test with params
curl "https://dashboard-ten-sand-20.vercel.app/api/logs/activity?limit=10"

# Test other endpoints
curl https://dashboard-ten-sand-20.vercel.app/api/logs
curl https://dashboard-ten-sand-20.vercel.app/api/logs/chat
```

### Step 3: Check Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select `dashboard` project
3. Check **Functions** tab - functions should be listed
4. Check **Runtime Logs** for errors

---

## If Issues Persist - Diagnostic Checklist

### Check 1: Verify File Locations
```bash
ls -la /root/.openclaw/workspace/mission-control/api/
# Should show: logs/, agents.js, tokens.js, etc.
```

### Check 2: Check Vercel Project Settings
1. Framework Preset should be "Other" (not Next.js)
2. Root Directory should be empty (or `mission-control`)
3. Build Command should be empty or `null`

### Check 3: Clear Build Cache
In Vercel Dashboard:
1. Go to Deployments
2. Find latest deployment
3. Click "Redeploy" → "Redeploy without cache"

### Check 4: Test Without vercel.json
```bash
mv vercel.json vercel.json.bak
vercel --prod
# Test endpoints
mv vercel.json.bak vercel.json
```

---

## Research Sources Consulted

1. **Vercel Official Docs:**
   - Project Configuration (vercel.json)
   - Rewrites documentation
   - Serverless Functions

2. **Vercel Community:**
   - "Fixing serverless functions 404 errors in monorepo deployments"
   - "API Routes Not Working, Persistent Config Warning"
   - "Deployment succeeds but all routes return 404"

3. **Stack Overflow:**
   - "Client side 404 error while fetching Vercel serverless function"
   - "How do i configure the vercel.json app to allow routes"
   - "Dynamic API Routes Returning HTML 404 Pages"

4. **GitHub Discussions:**
   - vercel/vercel #6598 - Change /api directory
   - vercel/vercel #5081 - Change output directory
   - vercel/community #40 - Functions not showing up

5. **Reddit:**
   - r/vercel - Multiple API routing threads
   - r/nextjs - Dynamic routes 404 issues

---

## Next Steps

### Immediate Actions Required:
1. **Deploy the prepared solution** using `deploy-zero-config.sh`
2. **Test all endpoints** with curl commands
3. **Check Vercel Dashboard** Functions tab
4. **Report results** - success or failure with error details

### If 404 Persists:
1. Try **Approach 1** (remove vercel.json)
2. Try **Approach 3** (Edge Functions)
3. Consider **Approach 2** (Next.js migration)
4. Fallback to **Approach 4** (static JSON)

---

## Time Estimate

- Deployment: 2-3 minutes
- Testing: 2 minutes
- Dashboard verification: 2 minutes
- **Total per iteration:** ~7 minutes

With 5 different approaches to try, expect **30-45 minutes** to fully resolve.

---

## Contact for Help

If all approaches fail:
- Vercel Community: https://community.vercel.com
- Vercel Support: https://vercel.com/help
- GitHub Discussions: https://github.com/vercel/vercel/discussions

---

**Report Generated:** 2026-02-19 10:51 AM CST  
**Next Update:** After deployment testing (ETA 11:00 AM)
