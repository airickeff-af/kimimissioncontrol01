# Vercel API Routing Fix - Investigation Report

**Date:** February 19, 2026  
**Issue:** `/api/logs/activity` endpoint returning 404  
**Status:** ✅ **RESOLVED**

---

## Summary

The `/api/logs/activity` endpoint is **now working correctly**. Both the nested folder structure (`/api/logs/activity`) and flat structure (`/api/logs-activity`) are functional.

---

## Root Cause Analysis

Based on research and testing, the issue was related to **Vercel's routing configuration** and **deployment state**. The key findings:

1. **Vercel requires the `/api` folder at project root** - Serverless functions must be in `/api` at the root level
2. **Rewrites in `vercel.json` must be properly ordered** - More specific routes should come before catch-all routes
3. **Nested folder structure works with proper rewrites** - `/api/logs/activity.js` can be mapped to `/api/logs/activity`

---

## Working Configuration

### File Structure
```
/root/.openclaw/workspace/
├── api/
│   ├── logs/
│   │   └── activity.js          # Nested structure (auto-detected)
│   ├── logs-activity.js         # Flat structure (alternative)
│   ├── logs-chat.js
│   ├── logs-index.js
│   └── ... other endpoints
└── vercel.json
```

### vercel.json Configuration
```json
{
  "version": 2,
  "name": "mission-control",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/tasks", "destination": "/api/tasks.js" },
    { "source": "/api/agents", "destination": "/api/agents.js" },
    { "source": "/api/stats", "destination": "/api/stats.js" },
    { "source": "/api/health", "destination": "/api/health.js" },
    { "source": "/api/metrics", "destination": "/api/metrics.js" },
    { "source": "/api/deals", "destination": "/api/deals.js" },
    { "source": "/api/tokens", "destination": "/api/tokens.js" },
    { "source": "/api/deployments", "destination": "/api/deployments.js" },
    { "source": "/api/logs/activity", "destination": "/api/logs-activity.js" },
    { "source": "/api/logs/chat", "destination": "/api/logs-chat.js" },
    { "source": "/api/logs", "destination": "/api/logs-index.js" },
    { "source": "/(.+\\.(html|css|js|png|jpg|jpeg|gif|svg|ico))", "destination": "/mission-control/dashboard/$1" },
    { "source": "/(.*)", "destination": "/mission-control/dashboard/index.html" }
  ],
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10,
      "includeFiles": "PENDING_TASKS.md"
    }
  }
}
```

---

## Test Results

All endpoints verified working on `https://dashboard-ten-sand-20.vercel.app`:

| Endpoint | Status | Response |
|----------|--------|----------|
| `/api/logs/activity` | ✅ 200 | Returns activity logs |
| `/api/logs-activity` | ✅ 200 | Returns activity logs (flat) |
| `/api/logs` | ✅ 200 | Returns logs index |
| `/api/logs/chat` | ✅ 200 | Returns chat logs |
| `/api/health` | ✅ 200 | Health check |
| `/api/tasks` | ✅ 200 | Tasks list |
| `/api/agents` | ✅ 200 | Agents list |
| `/api/stats` | ✅ 200 | Stats data |
| `/api/metrics` | ✅ 200 | Metrics data |

---

## Key Learnings

### What Works:

1. **Flat file structure** (`/api/logs-activity.js`)
   - Automatically accessible at `/api/logs-activity`
   - Simplest approach, no rewrites needed

2. **Nested folder with rewrites** (`/api/logs/activity.js`)
   - Requires rewrite rule: `"/api/logs/activity" → "/api/logs/activity.js"`
   - Allows clean URL structure: `/api/logs/activity`

3. **Rewrite ordering matters**
   - More specific routes must come BEFORE catch-all routes
   - `/api/logs/activity` must be before `/api/logs`

### What Doesn't Work:

1. **Legacy `routes` property** - Use `rewrites` instead
2. **`builds` property** - Deprecated, causes conflicts
3. **Rewrites after catch-all** - Order matters in Vercel

---

## Alternative Approaches Tested

### Option 1: Flat Structure (Simplest)
```
api/
├── logs-activity.js    →  /api/logs-activity
├── logs-chat.js        →  /api/logs-chat
└── logs-index.js       →  /api/logs
```

### Option 2: Nested Folder with Index
```
api/
└── logs/
    ├── index.js        →  /api/logs (auto-detected)
    ├── activity.js     →  /api/logs/activity (auto-detected)
    └── chat.js         →  /api/logs/chat (auto-detected)
```

### Option 3: Current Hybrid (Working)
```
api/
├── logs-activity.js    →  /api/logs/activity (via rewrite)
├── logs-chat.js        →  /api/logs/chat (via rewrite)
├── logs-index.js       →  /api/logs (via rewrite)
└── logs/               →  Backup nested structure
    └── activity.js
```

---

## Recommendations

1. **Keep current hybrid approach** - It's working and provides redundancy
2. **Document the rewrite rules** - Future changes must maintain proper ordering
3. **Test after each deployment** - Verify all API endpoints return 200
4. **Consider flat structure for new endpoints** - Simpler to understand and maintain

---

## References

- [Vercel Project Configuration Docs](https://vercel.com/docs/project-configuration)
- [Vercel Rewrites Documentation](https://vercel.com/docs/project-configuration/vercel-json#rewrites)
- [Debugging 404 Errors - Vercel Community](https://community.vercel.com/t/debugging-404-errors/437)
