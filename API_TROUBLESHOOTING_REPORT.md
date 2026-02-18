# API Troubleshooting Report - Vercel Logs API 404 Fix

**Date:** Thursday, February 19, 2026 - 5:21 AM (Asia/Shanghai)  
**Agent:** API Troubleshooting Specialist  
**Status:** ✅ RESOLVED

---

## Problem Statement

The logs API at `/api/logs/activity` was returning 404 on Vercel deployment despite multiple attempts:
- Serverless functions approach - failed
- Static JSON with routing - failed
- Multiple deployments - all returned 404

---

## Root Cause Analysis

After researching Vercel documentation and community posts, identified the following issues:

### 1. **Nested Folder Structure Problem**
Vercel's auto-detection of serverless functions in nested folders (`/api/logs/activity.js`) can be unreliable. The filesystem routing convention expects:
- `/api/logs.js` → maps to `/api/logs`
- `/api/logs/index.js` → maps to `/api/logs`
- `/api/logs/activity.js` → SHOULD map to `/api/logs/activity` but often fails

### 2. **Rewrite Conflicts**
The root `vercel.json` had catch-all rewrites that were interfering with API routes:
```json
{ "source": "/(.*)", "destination": "/mission-control/dashboard/index.html" }
```

### 3. **Multiple vercel.json Files**
There were conflicting configurations in:
- `/root/.openclaw/workspace/vercel.json` (root)
- `/root/.openclaw/workspace/mission-control/dashboard/vercel.json` (dashboard)

---

## Solution Implemented

### Approach: Flat Structure + Explicit Rewrites

**1. Created flat-structure API files:**
- `/api/logs-activity.js` → serves `/api/logs-activity`
- `/api/logs-chat.js` → serves `/api/logs-chat`
- `/api/logs-index.js` → serves `/api/logs`

**2. Updated root `vercel.json` with explicit rewrites:**
```json
{
  "rewrites": [
    { "source": "/api/logs/activity", "destination": "/api/logs-activity.js" },
    { "source": "/api/logs/chat", "destination": "/api/logs-chat.js" },
    { "source": "/api/logs", "destination": "/api/logs-index.js" },
    { "source": "/(.+\\.(html|css|js|png|jpg|jpeg|gif|svg|ico))", "destination": "/mission-control/dashboard/$1" },
    { "source": "/(.*)", "destination": "/mission-control/dashboard/index.html" }
  ]
}
```

**Key insight:** The order of rewrites matters! API routes must be listed BEFORE the catch-all SPA rewrite.

---

## Verification Results

### ✅ All Endpoints Working

| Endpoint | Status | Response |
|----------|--------|----------|
| `/api/logs/activity` | ✅ 200 OK | Returns activity logs |
| `/api/logs-activity` | ✅ 200 OK | Returns activity logs (direct) |
| `/api/logs/chat` | ✅ 200 OK | Returns chat logs |
| `/api/logs` | ✅ 200 OK | Returns available endpoints |
| `/api/health` | ✅ 200 OK | System health check |
| `/api/stats` | ✅ 200 OK | Dashboard stats |
| `/api/agents` | ✅ 200 OK | Agent list (22 agents) |

### Test Commands:
```bash
curl https://dashboard-ten-sand-20.vercel.app/api/logs/activity
curl https://dashboard-ten-sand-20.vercel.app/api/logs-activity
curl https://dashboard-ten-sand-20.vercel.app/api/health
curl https://dashboard-ten-sand-20.vercel.app/api/stats
curl https://dashboard-ten-sand-20.vercel.app/api/agents
```

---

## Research Sources Consulted

1. **Vercel Community:** "Fixing serverless functions 404 errors in Vercel monorepo deployments"
2. **Vercel KB:** "Why is my deployed project giving 404"
3. **Stack Overflow:** "404 error when calling api routes after deployment"
4. **GitHub Discussions:** Next.js API routes deployment issues
5. **Dev.to:** "How to Deploy a Node.js App on Vercel with API Routes"

---

## Lessons Learned

1. **Vercel prefers flat API structure** over nested folders for reliable routing
2. **Rewrite order is critical** - specific routes must come before catch-all
3. **Test both URL formats** - with and without the rewrite
4. **Avoid conflicting vercel.json files** - consolidate to root

---

## Files Modified

- `/api/logs-activity.js` - Updated flat structure endpoint
- `/api/logs-chat.js` - New flat structure endpoint
- `/api/logs-index.js` - New flat structure endpoint
- `/vercel.json` - Updated with explicit rewrites

---

## Next Steps

1. ✅ Commit changes to git
2. ✅ Verify all dashboard features work with new API
3. 🔄 Monitor for any 404 errors in production
4. 🔄 Document this pattern for future API additions

---

**Resolution Time:** ~15 minutes  
**Fix Complexity:** Medium (required structural changes)  
**Impact:** All logs API endpoints now functional
