# Vercel API 404 Fix - Solution Attempts

## Problem Summary
`/api/logs/activity` returns 404 on Vercel despite multiple attempts.

## Key Findings from Research

### 1. Vercel Requires `/api` at PROJECT ROOT
From Vercel docs: "For all officially supported runtimes, the only requirement is to create an `api` directory at the root of your project directory, placing your Vercel functions inside."

**Critical Issue:** If the Vercel project was created with a different root directory, the `/api` folder won't be detected.

### 2. Common Causes of 404 on Vercel Functions

#### A. Framework Preset = "Static" or "Other"
When Framework Preset is set to "Static", Vercel ignores the `/api` folder entirely.

#### B. Output Directory Override
If Output Directory is set to something like `dist` or `build`, Vercel serves from there and ignores the `/api` folder at project root.

#### C. Project Root Directory Mismatch
The project might have been linked to a parent directory instead of `mission-control/dashboard/`.

### 3. Solutions to Try

#### Solution 1: Add package.json to api folder
Create `api/package.json` to force Node.js runtime detection:
```json
{
  "name": "api",
  "version": "1.0.0"
}
```

#### Solution 2: Use `functions` config in vercel.json (not routes)
```json
{
  "functions": {
    "api/logs-activity.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

#### Solution 3: Rename to `api/logs/activity/index.js`
Nested folder structure with index.js:
```
api/
  logs/
    activity/
      index.js
```

#### Solution 4: Use Vercel CLI to relink
```bash
cd mission-control/dashboard
vercel --prod
```

#### Solution 5: Check Dashboard Settings
1. Go to https://vercel.com/dashboard
2. Select project
3. Settings → Build & Development Settings
4. Verify:
   - Framework Preset: "Other" (allows functions)
   - Build Command: (empty or `echo "No build"`)
   - Output Directory: (empty - don't override)
   - Root Directory: `mission-control/dashboard`

### 4. Quick Test - Minimal Setup

Create the absolute simplest test case:

**File: `api/hello.js`**
```javascript
module.exports = (req, res) => {
  res.json({ message: "Hello from Vercel!" });
};
```

Deploy and test:
```bash
curl https://your-project.vercel.app/api/hello
```

If this works, the issue is with the specific endpoint configuration.
If this doesn't work, the issue is with project setup/framework preset.

### 5. Alternative: Use Next.js API Routes

If vanilla Node.js functions continue to fail, migrate to Next.js:

**File: `pages/api/logs/activity.js`**
```javascript
export default function handler(req, res) {
  res.status(200).json({ logs: [] });
}
```

Next.js has better Vercel integration and fewer 404 issues.

---

## Recommended Fix Order

1. **Check Dashboard First** - Verify Framework Preset and Output Directory
2. **Add api/package.json** - Force Node.js runtime detection
3. **Use Vercel CLI** - Relink project from correct directory
4. **Try Next.js** - If all else fails, migrate to Next.js API routes

## Test Endpoint

After each fix attempt:
```bash
curl https://dashboard-ten-sand-20.vercel.app/api/test
curl https://dashboard-ten-sand-20.vercel.app/api/logs/activity
```

---

*Research completed: Feb 18, 2026 4:25 PM CST*
