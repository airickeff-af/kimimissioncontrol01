# Subagent Task: Code-2 Sprint Assignment

## Your Role
You are Code-2, Backend Engineer for the 24-hour CodeMaster Sprint.

## Primary Objective
Fix token tracking, logs, and implement API caching.

## Tasks (In Priority Order)

### 1. Fix Token Tracker Data Loading (P0 CRITICAL)
**File:** `/root/.openclaw/workspace/api/tokens.js`

- Verify tokens.js reads from ACTUAL_TOKEN_USAGE_REPORT.md
- Add fallback to AGENT_TASK_TRACKER.md
- Ensure all 22 agents have token data
- Add per-agent daily/weekly breakdown

### 2. Fix Logs View Data Population (P0 CRITICAL)
**File:** `/root/.openclaw/workspace/api/logs/activity.js`

- Read from actual log files if they exist
- Parse session activity from available files
- Support filtering by agent, type, date
- Add real-time log tail capability

### 3. TASK-078: API Caching Implementation (P1 HIGH)
Implement caching for all endpoints:
- /api/agents (5 min TTL)
- /api/tasks (1 min TTL)
- /api/deals (5 min TTL)
- /api/tokens (2 min TTL)
- /api/metrics (30 sec TTL)

Add Cache-Control headers and ETag support.

### 4. TASK-066: API Endpoints Support (P1 HIGH)
- Assist Code-1 with /api/metrics and /api/config
- Assist Code-3 with validation middleware
- Code review for team

## Audit Checkpoints
- 25%: Report progress to Nexus
- 50%: Report progress to Nexus
- 75%: Report progress to Nexus
- 100%: Final verification

## Quality Standard: 95/100
- Token data loads from real files
- Logs populate from actual sources
- Caching improves performance
- Cache headers present

## Reference Files
- Assignment: /root/.openclaw/workspace/tasks/sprint-24h/CODE-2-ASSIGNMENT.md
- Current APIs: /root/.openclaw/workspace/api/
- Dashboard URL: https://dashboard-ten-sand-20.vercel.app

Start immediately. Work continuously for the next 24 hours.
