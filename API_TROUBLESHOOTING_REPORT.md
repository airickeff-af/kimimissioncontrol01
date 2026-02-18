# API Troubleshooting Report - Vercel 404 Fix

**Date:** Wednesday, February 18, 2026 - 1:25 PM (Asia/Shanghai)  
**Agent:** API Troubleshooting Specialist  
**Issue:** `/api/logs/activity` returning 404 on Vercel deployment

---

## Summary of Actions Taken

### 1. Root Cause Identified
The issue was **rewrite order** in `vercel.json`. The catch-all rewrite `/(.*)` was positioned before API routes, causing ALL requests (including API) to be redirected to the dashboard.

### 2. Fixes Implemented

#### Fix A: Reordered Rewrites (CRITICAL)
**File:** `vercel.json`
- Moved API-specific rewrites to the TOP
- Moved catch-all rewrite to the BOTTOM
- API routes now processed before static/dashboard routes

**Before (BROKEN):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/mission-control/dashboard/$1" },
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

**After (FIXED):**
```json
{
  "rewrites": [
    { "source": "/api/logs/activity", "destination": "/api/logs/activity.js" },
    { "source": "/api/logs", "destination": "/api/logs/index.js" },
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/mission-control/dashboard/$1" }
  ]
}
```

#### Fix B: Removed Explicit Functions Config
- Removed `"functions": { "api/**/*.js": { "runtime": "nodejs20.x" } }`
- Letting Vercel auto-detect serverless functions
- Simpler config = less chance of conflicts

#### Fix C: Created Flat Alternative Endpoint
**Created:** `/api/logs-activity.js`
- Provides fallback if nested route fails
- Accessible at `/api/logs-activity`

### 3. File Structure
```
api/
├── agents.js
├── health.js
├── logs-activity.js      # NEW: Flat alternative
├── logs/
│   ├── activity.js       # Target: /api/logs/activity
│   └── index.js          # Target: /api/logs
├── metrics.js
├── tasks.js
└── tokens.js
```

### 4. Commits Pushed
1. `5a61fdc8` - Fix Vercel API routing: Reorder rewrites to prioritize API routes
2. `df6abe22` - Simplify vercel.json: Remove explicit functions config

---

## Testing Checklist

Once Vercel deployment completes (check https://vercel.com/dashboard):

```bash
# Test the main endpoint (should return 200 with JSON)
curl https://your-domain.vercel.app/api/logs/activity

# Test flat alternative (should return 200 with JSON)
curl https://your-domain.vercel.app/api/logs-activity

# Test folder index (should return 200 with JSON)
curl https://your-domain.vercel.app/api/logs

# Test other APIs still work
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/agents

# Or run the test script
./test-api-routing.sh your-domain.vercel.app
```

---

## Expected Results

| Endpoint | Expected Status | Expected Response |
|----------|----------------|-------------------|
| `/api/logs/activity` | 200 | JSON with logs array |
| `/api/logs-activity` | 200 | JSON with logs array |
| `/api/logs` | 200 | JSON with logs array |
| `/api/health` | 200 | Health check JSON |
| `/api/agents` | 200 | Agents JSON |

---

## If Issues Persist

### Next Steps:

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Look for build errors or runtime errors

2. **Try Zero-Config Approach**
   - Delete `vercel.json` entirely
   - Let Vercel auto-detect everything
   - Test if APIs work without any config

3. **Check Git Ignore**
   - Ensure `api/logs/` folder is not ignored
   - Current `.gitignore` has `!api/logs/` exception ✓

4. **Use Vercel CLI for Local Testing**
   ```bash
   npm i -g vercel
   vercel login
   vercel dev
   ```

---

## Key Learnings

1. **Rewrite Order is Critical**: Vercel processes rewrites top-to-bottom; first match wins
2. **Catch-All is Greedy**: `/(.*)` matches EVERYTHING if placed first
3. **Auto-Detection Works**: Vercel auto-detects `/api/**/*.js` as serverless functions
4. **Explicit Rewrites Override**: Can use explicit rewrites for special routing needs

---

## References

- Vercel Rewrites Docs: https://vercel.com/docs/configuration#project/rewrites
- Vercel Functions Docs: https://vercel.com/docs/serverless-functions/introduction
- Community Thread: https://community.vercel.com/t/debugging-404-errors/437

---

**Status:** ✅ Fixes deployed. Awaiting Vercel build completion.  
**Next Update:** After testing endpoints (ETA: 5 minutes)
