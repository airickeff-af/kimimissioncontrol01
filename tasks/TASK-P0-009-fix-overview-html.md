# TASK-P0-009: Fix overview.html to Use Live API Data

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Code-2, Forge-2  
**Status:** 🔴 NOT STARTED

---

## Problem
The overview.html page is **identical to index.html** with the same hardcoded data issues:

1. **Static agent array** with 23 hardcoded agents
2. **Hardcoded stats** in header
3. **Static activities** array
4. **No API integration**

## Decision Needed

**Option A: Fix overview.html separately**
- Duplicate the fixes from TASK-P0-001
- Maintain two separate pages

**Option B: Redirect overview.html to index.html**
- Add meta refresh redirect
- Maintain only one HQ page
- Simpler maintenance

## Recommendation: Option B (Redirect)

Since both pages serve the same purpose (HQ dashboard), the simplest solution is to redirect overview.html to index.html.

### Solution

Replace the entire content of overview.html with a redirect:

```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/index.html">
  <title>Redirecting to HQ...</title>
  <style>
    body {
      background: #0a0a0f;
      color: #00d4ff;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .message { text-align: center; }
    a { color: #00d4ff; }
  </style>
</head>
<body>
  <div class="message">
    <p>Redirecting to Mission Control HQ...</p>
    <p><a href="/index.html">Click here if not redirected</a></p>
  </div>
</body>
</html>
```

### Alternative: Option A (Fix Separately)

If maintaining separate pages is required, apply the same fixes as TASK-P0-001:

1. Add API configuration
2. Create fetch functions for `/api/agents`, `/api/stats`, `/api/logs/activity`
3. Add loading states
4. Add error handling
5. Replace static arrays with dynamic data

## Files to Modify
- `/root/.openclaw/workspace/overview.html`

## Acceptance Criteria (Option B - Redirect)
- [ ] overview.html redirects to index.html
- [ ] Redirect happens automatically (0 second delay)
- [ ] Manual link provided as fallback
- [ ] Navigation links to overview.html still work (redirect handles it)

## Acceptance Criteria (Option A - Fix Separately)
- [ ] Agents load from `/api/agents`
- [ ] Stats load from `/api/stats`
- [ ] Activity feed loads from `/api/logs/activity`
- [ ] Loading states shown during fetch
- [ ] Error states shown on API failure
- [ ] No hardcoded data remains

## Testing
1. Navigate to overview.html
2. Verify redirect to index.html
3. Verify index.html loads with live data
