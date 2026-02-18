# API Troubleshooting Summary - /api/logs/activity 404 Fix

**Date:** Wednesday, February 18, 2026 - 7:55 PM (Asia/Shanghai)  
**Issue:** `/api/logs/activity` returns 404 on Vercel deployment  
**Status:** Fixes prepared, ready for deployment

---

## Root Cause Analysis

Based on research from Vercel documentation and community forums:

1. **Legacy `functions` property in vercel.json** - The `functions` config with runtime specification is legacy and can interfere with automatic serverless function detection
2. **Rewrite ordering** - The catch-all `/(.*)` rewrite was before API routes, potentially intercepting them
3. **Multiple conflicting patterns** - Too many explicit rewrites for API routes that should be auto-detected

---

## Changes Made

### 1. Simplified vercel.json
**Before:** Complex config with legacy `functions` property and many explicit rewrites
**After:** Clean config with only necessary rewrites

```json
{
  "version": 2,
  "name": "mission-control",
  "rewrites": [
    { "source": "/api/logs/activity", "destination": "/api/logs/activity.js" },
    { "source": "/api/logs", "destination": "/api/logs/index.js" },
    { "source": "/css/(.*)", "destination": "/mission-control/dashboard/css/$1" },
    { "source": "/js/(.*)", "destination": "/mission-control/dashboard/js/$1" },
    { "source": "/assets/(.*)", "destination": "/assets/$1" },
    { "source": "/(.+\\.(html|css|js|png|jpg|jpeg|gif|svg|ico))", "destination": "/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Key changes:
- Removed legacy `functions` property
- Removed explicit rewrites for all API routes (let Vercel auto-detect)
- Kept only `/api/logs/activity` and `/api/logs` explicit rewrites as fallback
- Moved API rewrites BEFORE the catch-all `/(.*)` rewrite

### 2. Created Flat Fallback File
Created `/api/logs-activity.js` as an alternative flat structure endpoint

### 3. Verified File Structure
Current API file locations:
```
/api/
├── logs/
│   ├── activity.js     # Target: /api/logs/activity
│   ├── index.js        # Target: /api/logs
│   └── activity.mjs    # ES module variant
├── logs-activity.js    # Flat fallback: /api/logs-activity
├── logs.js             # Alternative: /api/logs
└── [other endpoints]
```

---

## Deployment Instructions

Since Vercel CLI requires authentication, deploy via Git push:

```bash
# The changes are committed on branch: test-deployment-fix
git push origin test-deployment-fix

# Or merge to main and push:
git checkout main
git merge test-deployment-fix
git push origin main
```

Vercel will auto-deploy from the git push.

---

## Testing After Deployment

Test these endpoints:

```bash
# Primary target endpoint
curl https://your-app.vercel.app/api/logs/activity?limit=5

# Alternative endpoints (if primary fails)
curl https://your-app.vercel.app/api/logs-activity?limit=5
curl https://your-app.vercel.app/api/logs?limit=5

# Check function detection
curl https://your-app.vercel.app/api/health
```

---

## If Still 404 - Additional Troubleshooting Steps

### Option A: Use Next.js API Routes Pattern
Rename files to follow Next.js convention:
```
api/logs/activity.js → api/logs/activity/route.js
```

### Option B: Vercel Config Override
Add explicit function configuration:
```json
{
  "functions": {
    "api/logs/activity.js": {
      "maxDuration": 10
    }
  }
}
```

### Option C: Check Build Output
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → Functions tab
3. Verify `/api/logs/activity` appears in the functions list

### Option D: Runtime Logs
Check Vercel runtime logs for any errors during function invocation.

---

## Dashboard Fallback Behavior

The logs-view.html dashboard has built-in fallback:
- If API returns 404 or error, it displays mock data
- Users see: "⚠️ Failed to load logs: [error]. Using fallback data."
- This ensures the UI always works even if API fails

---

## References

1. [Vercel KB: Why is my deployed project giving 404](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404)
2. [Vercel Community: Fixing serverless functions 404 errors](https://community.vercel.com/t/fixing-serverless-functions-404-errors-in-vercel-monorepo-deployments/31936)
3. [Medium: Why Vercel Shows 404 on Direct Routes](https://medium.com/@nishantsinha_42481/why-vercel-shows-404-on-direct-routes-how-to-fix-it-with-real-examples-7e1ebb796cac)

---

## Next Steps

1. Deploy the changes via git push
2. Test the endpoint with curl
3. If still failing, try Option A (Next.js pattern) or Option B (explicit config)
4. Report results back for further troubleshooting

**Prepared by:** API Troubleshooting Specialist (Nexus sub-agent)  
**Task ID:** api-troubleshooting-heartbeat
