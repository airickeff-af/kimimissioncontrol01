# MISSION CONTROL — NETLIFY DEPLOYMENT GUIDE
**For: EricF**  
**Date:** Feb 21, 2026 4:49 AM  
**Purpose:** Fix 404 routing issues by switching from Vercel to Netlify

---

## 🚀 QUICK DEPLOY (5 MINUTES)

### Step 1: Create Netlify Account
1. Go to https://app.netlify.com
2. Sign up with GitHub
3. Authorize Netlify to access your repos

### Step 2: Connect Repository
1. Click "Add new site" → "Import an existing project"
2. Select GitHub provider
3. Find and select `mission-control` repository
4. Click "Install"

### Step 3: Configure Build Settings
```
Build command: (leave empty - static site)
Publish directory: dashboard/
```

### Step 4: Add Redirects File
Create `dashboard/_redirects`:
```
# SPA routing - all routes to index.html
/*    /index.html   200

# API routes (if using Netlify Functions)
/api/*  /.netlify/functions/:splat  200
```

### Step 5: Deploy
1. Click "Deploy site"
2. Wait 2-3 minutes for build
3. Get your URL: `https://mission-control-xxx.netlify.app`

---

## 📁 FILES TO CREATE

### 1. `dashboard/_redirects`
```
# SPA fallback for all routes
/*    /index.html   200

# Optional: custom short URLs
/agents    /agents.html    200
/tasks     /task-board.html 200
/office    /office.html    200
```

### 2. `dashboard/netlify.toml` (Alternative to _redirects)
```toml
[build]
  publish = "dashboard/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/agents"
  to = "/agents.html"
  status = 200

[[redirects]]
  from = "/tasks"
  to = "/task-board.html"
  status = 200

[[redirects]]
  from = "/office"
  to = "/office.html"
  status = 200
```

---

## 🔧 ADVANCED CONFIGURATION

### Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter: `mission-control.yourdomain.com`
4. Follow DNS instructions

### Environment Variables
If needed for API keys:
1. Site settings → Environment variables
2. Add variables:
   - `API_BASE_URL`
   - `DATABASE_URL`
   - etc.

### Branch Deploys
- Production: `master` branch
- Staging: `staging` branch (optional)

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:
- [ ] https://your-site.netlify.app loads
- [ ] https://your-site.netlify.app/agents works (no 404)
- [ ] https://your-site.netlify.app/tasks works
- [ ] https://your-site.netlify.app/office works
- [ ] API endpoints respond correctly
- [ ] All navigation links work

---

## 🔄 MIGRATION FROM VERCEL

### Option A: Keep Both (Recommended)
- Vercel: `dashboard-ten-sand-20.vercel.app` (backup)
- Netlify: `mission-control-xxx.netlify.app` (primary)

### Option B: Redirect Vercel to Netlify
Add to Vercel `vercel.json`:
```json
{
  "redirects": [
    { "source": "/(.*)", "destination": "https://mission-control-xxx.netlify.app/$1" }
  ]
}
```

---

## 📞 TROUBLESHOOTING

### Build Fails
- Check that `dashboard/` folder exists
- Ensure `index.html` is at `dashboard/index.html`
- Verify no syntax errors in HTML

### 404 Errors Persist
- Check `_redirects` file is in `dashboard/` folder
- Verify redirects format (no extra spaces)
- Try `netlify.toml` method instead

### API Not Working
- Use Netlify Functions for APIs
- Or keep API on Vercel, frontend on Netlify

---

## 🎯 EXPECTED RESULT

| URL | Result |
|-----|--------|
| `/` | ✅ Loads dashboard |
| `/agents` | ✅ Loads agents page (no 404) |
| `/tasks` | ✅ Loads tasks page (no 404) |
| `/office` | ✅ Loads office page (no 404) |

**Quality Gate:** 95/100+ (all routes working)

---

## ⏱️ TIMELINE

| Step | Time |
|------|------|
| Create account | 1 min |
| Connect repo | 1 min |
| Configure build | 1 min |
| Add redirects | 1 min |
| Deploy | 2 min |
| **Total** | **6 minutes** |

---

**Ready? Start at https://app.netlify.com**

Questions? Ask Nexus.

---

*Created: Feb 21, 2026 4:49 AM*  
*Priority: CRITICAL — Fixes 404 routing*
