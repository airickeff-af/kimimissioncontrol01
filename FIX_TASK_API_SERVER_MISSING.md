# FIX TASK: API Server Files Missing

**Task ID:** FIX-001  
**Priority:** CRITICAL 🔴  
**Created By:** Audit-2  
**Created At:** 2026-02-18 12:57 GMT+8  
**Assign To:** Code (Backend Lead) / Nexus

---

## Problem

The `mission-control/dashboard/api/` directory containing the local API server files has been deleted:
- ❌ `server.js` - MISSING
- ❌ `server-v2.js` - MISSING  
- ❌ `fileWatcher.js` - MISSING
- ❌ `taskQueue.js` - MISSING
- ❌ `client.js` - MISSING

## Impact

- Local development API server cannot start (port 3001)
- logs-view.html cannot fetch logs in local development mode
- All dashboard API dependencies broken for local development

## Root Cause

Git commit `936a988f` deleted files but only intended to delete conflicting flat files in `/api/` root, not the entire `dashboard/api/` directory.

## Required Fix

1. **Restore the following files from git history:**
   - `mission-control/dashboard/api/server.js`
   - `mission-control/dashboard/api/server-v2.js`
   - `mission-control/dashboard/api/fileWatcher.js`
   - `mission-control/dashboard/api/taskQueue.js`
   - `mission-control/dashboard/api/client.js`
   - `mission-control/dashboard/api/client-v2.js`
   - `mission-control/dashboard/api/test-api.js`

2. **Verify the fix:**
   ```bash
   cd /root/.openclaw/workspace/mission-control/dashboard/api
   node server-v2.js
   curl http://localhost:3001/api/logs/activity
   ```

3. **Update vercel.json if needed** to ensure no conflicts

## Acceptance Criteria

- [ ] API server starts on port 3001 without errors
- [ ] `/api/logs/activity` returns 200 with real data
- [ ] logs-view.html loads logs correctly in local dev mode
- [ ] No regression in Vercel deployment

## Related

- Original Task: TASK-054 (Logs endpoint 404 error)
- Audit Report: AUDIT_REPORT_logs-view.md
