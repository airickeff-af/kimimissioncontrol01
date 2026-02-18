# Vercel API Troubleshooting Report
**Date:** 2026-02-18 2:50 PM CST  
**Issue:** `/api/logs/activity` returns 404 on Vercel deployment  
**Status:** Fix deployed, awaiting verification

---

## Root Cause Analysis

After extensive research, the issue is that **Vercel's serverless function routing for nested paths** (`/api/logs/activity`) requires explicit configuration when using the `builds` + `routes`/`rewrites` approach in `vercel.json`.

Key findings from research:
1. The pattern `api/**/*.js` in builds should match nested files, but routing needs explicit rewrites
2. Vercel has deprecated `routes` in favor of `rewrites` (cleaner, more predictable)
3. Nested API paths need explicit destination mapping

---

## Attempted Fixes (in order)

### Fix 1: Explicit Route Mapping (DEPLOYED)
**File:** `vercel.json`
```json
{
  "version": 2,
  "builds": [
    { "src": "**/*.html", "use": "@vercel/static" },
    { "src": "api/**/*.js", "use": "@vercel/node" }
  ],
  "rewrites": [
    { "source": "/api/logs/activity", "destination": "/api/logs/activity.js" },
    { "source": "/api/logs", "destination": "/api/logs/index.js" },
    { "source": "/api/(.*)", "destination": "/api/$1.js" },
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
```

**Changes made:**
- Switched from `routes` to `rewrites` (recommended by Vercel)
- Added explicit rewrite for `/api/logs/activity` → `/api/logs/activity.js`
- Added fallback rewrite pattern for all API endpoints

**Status:** Pushed to GitHub, Vercel auto-deploy triggered

---

## Alternative Approaches (if Fix 1 fails)

### Approach 2: Flat File Structure
Move nested files to flat structure:
```
api/
  logs-activity.js    # instead of api/logs/activity.js
  logs-index.js       # instead of api/logs/index.js
```

Update `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/logs/activity", "destination": "/api/logs-activity.js" },
    { "source": "/api/logs", "destination": "/api/logs-index.js" }
  ]
}
```

### Approach 3: Dynamic Route Handler
Create a single `api/logs.js` that handles all sub-routes:
```javascript
// api/logs.js
module.exports = (req, res) => {
  const { url } = req;
  if (url.includes('/activity')) {
    // Handle activity endpoint
  } else {
    // Handle default logs endpoint
  }
};
```

### Approach 4: Vercel Functions v2 (Web Standard API)
Convert to new Vercel Functions format:
```javascript
// api/logs/activity.js
export default {
  fetch(request) {
    const url = new URL(request.url);
    // Handle request
    return Response.json({ success: true, logs: [] });
  }
};
```

---

## Testing Checklist

After deployment completes (~2-3 minutes):

```bash
# Test the endpoint
curl https://dashboard-xyz.vercel.app/api/logs/activity

# Expected response:
{
  "success": true,
  "logs": [...],
  "total": 13,
  "timestamp": "2026-02-18T..."
}
```

---

## References

1. [Vercel Project Configuration](https://vercel.com/docs/project-configuration)
2. [Vercel Functions Documentation](https://vercel.com/docs/functions)
3. [Vercel Rewrites vs Routes](https://vercel.com/docs/projects/project-configuration#rewrites)
4. [GitHub Discussion: Nested Serverless Functions](https://github.com/vercel/vercel/discussions/8343)

---

## Next Steps

1. Wait for Vercel deployment to complete (check dashboard)
2. Test endpoint with curl or browser
3. If 404 persists, try Approach 2 (flat structure)
4. Monitor Vercel Function logs for errors

**Deploy URL:** Check Vercel dashboard for latest deployment
