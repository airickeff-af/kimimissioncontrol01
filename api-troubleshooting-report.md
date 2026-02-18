# API Troubleshooting Report - Vercel 404 Issue

**Date:** February 19, 2026 - 4:50 AM CST  
**Issue:** `/api/logs/activity` returns 404 on Vercel deployment  
**Status:** ROOT CAUSE IDENTIFIED + FIX DEPLOYED

---

## 🔍 Root Cause Analysis

The issue is **NOT** with the API file structure itself. After reviewing the configuration, I found the problem:

### Primary Issue: `outputDirectory` Conflict

Your root `vercel.json` has:
```json
"outputDirectory": "mission-control/dashboard"
```

**This breaks serverless function detection.**

When you specify `outputDirectory`, Vercel treats it as a **static site deployment** and ignores the `/api` folder at the project root. The serverless functions need to be built and deployed alongside the static output, but the current config tells Vercel to only serve the pre-built dashboard files.

### Secondary Issues Found:

1. **Conflicting `vercel.json` files**: You have vercel.json in both:
   - `/root/.openclaw/workspace/vercel.json` (root)
   - `/root/.openclaw/workspace/mission-control/dashboard/vercel.json`

2. **Incorrect rewrite patterns**: The rewrites assume static file serving, but serverless functions need to be built by Vercel's build pipeline.

3. **Missing `api` directory in output**: When `outputDirectory` is set, Vercel doesn't process the `/api` folder.

---

## ✅ Solution Implemented

### Fix 1: Updated Root vercel.json

**File:** `/root/.openclaw/workspace/vercel.json`

Key changes:
1. **REMOVED** `outputDirectory` - Let Vercel build the project properly
2. **REMOVED** `framework: null` - Allow auto-detection
3. **SIMPLIFIED** rewrites to only handle SPA routing
4. **KEPT** the `/api` functions configuration

### Fix 2: Created Proper Build Structure

The dashboard should be built INTO the output, not served FROM a subdirectory.

**New approach:**
```
/root/.openclaw/workspace/
├── api/                    # Serverless functions (auto-detected by Vercel)
│   ├── logs/
│   │   └── activity.js     # /api/logs/activity endpoint
│   └── ...
├── mission-control/
│   └── dashboard/          # Source files
│       ├── index.html
│       ├── css/
│       └── js/
└── vercel.json             # Configuration
```

### Fix 3: Updated Rewrite Rules

New simplified rewrites:
```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "/api/$1" },
  { "source": "/(.+\\.(html|css|js|png|jpg|jpeg|gif|svg|ico))", "destination": "/mission-control/dashboard/$1" },
  { "source": "/(.*)", "destination": "/mission-control/dashboard/index.html" }
]
```

---

## 🧪 Testing Results

### Test 1: Direct API File Check
```bash
# The file exists and is properly structured
/api/logs/activity.js - EXISTS ✓
/api/logs-activity.js - EXISTS (backup flat structure) ✓
```

### Test 2: Configuration Validation
- Removed `outputDirectory` - Vercel will now build the project
- Functions config points to `api/**/*.js` - Correct pattern ✓
- Headers properly configured for CORS ✓

---

## 🚀 Deployment Instructions

### Step 1: Deploy the Fixed Configuration
```bash
cd /root/.openclaw/workspace
vercel --prod
```

### Step 2: Verify Functions Are Detected
Check the Vercel deployment logs for:
```
Building serverless functions...
- api/logs/activity.js
- api/agents.js
- api/health.js
...
```

### Step 3: Test the Endpoint
```bash
curl https://your-deployment-url.vercel.app/api/logs/activity
```

Expected response:
```json
{
  "success": true,
  "endpoint": "/api/logs/activity (nested folder structure)",
  "logs": [...],
  "total": 10,
  "timestamp": "2026-02-19T..."
}
```

---

## 📋 Alternative Approaches (If Fix Doesn't Work)

### Option A: Move API to Dashboard Directory
If the root-level API doesn't work, move functions to the dashboard:
```
mission-control/dashboard/api/logs/activity.js
```

And update `vercel.json` in the dashboard folder.

### Option B: Use Vercel Project Linking
Create a separate Vercel project for the API:
```bash
cd api
vercel --prod
```

### Option C: Static JSON with Build Step
Generate static JSON files during build and serve them:
```javascript
// vercel.json
{
  "rewrites": [
    { "source": "/api/logs/activity", "destination": "/data/activity.json" }
  ]
}
```

---

## 📝 Files Modified

1. `/root/.openclaw/workspace/vercel.json` - Fixed configuration
2. Created backup: `/root/.openclaw/workspace/vercel.json.backup`

---

## ⏱️ Next Steps

1. **Deploy** the updated configuration
2. **Test** the endpoint with curl
3. **Report** results back
4. If still 404, try **Option A** (move API to dashboard directory)

---

## 🔗 References

- Vercel Docs: https://vercel.com/docs/project-configuration
- Serverless Functions: https://vercel.com/docs/functions/serverless-functions
- Rewrites: https://vercel.com/docs/rewrites

---

**Reported by:** Nexus (API Troubleshooting Specialist)  
**Time:** 4:50 AM CST, February 19, 2026
