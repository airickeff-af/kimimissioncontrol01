# CODE-2 TASK ASSIGNMENT - 24H SPRINT
**Role:** Backend Engineer  
**Start:** 2026-02-18 21:35 HKT  
**Deadline:** 2026-02-19 21:35 HKT  
**Quality Standard:** 95/100

## PRIMARY TASKS

### 1. Fix Token Tracker Data Loading (P0 CRITICAL)
**File:** `/root/.openclaw/workspace/api/tokens.js`

**Current Issue:** Token data exists but may not be loading properly in production.

**Requirements:**
- Verify tokens.js reads from ACTUAL_TOKEN_USAGE_REPORT.md
- Add fallback to AGENT_TASK_TRACKER.md if token report missing
- Ensure all 22 agents have token data
- Add per-agent daily/weekly breakdown

**Acceptance Criteria:**
- [ ] /api/tokens returns real data (not fallback)
- [ ] All 22 agents listed with token counts
- [ ] Daily and weekly breakdowns included
- [ ] Cost calculations accurate

---

### 2. Fix Logs View Data Population (P0 CRITICAL)
**File:** `/root/.openclaw/workspace/api/logs/activity.js`

**Current Issue:** Logs are generated, not read from actual system logs.

**Requirements:**
- Read from actual log files in `/root/.openclaw/workspace/mission-control/logs/` if exists
- Parse session activity from available files
- Support filtering by agent, type, date
- Add real-time log tail capability (last N entries)

**Acceptance Criteria:**
- [ ] Logs endpoint returns actual system logs
- [ ] Supports ?agent filter
- [ ] Supports ?type filter (system, task, error)
- [ ] Supports ?since timestamp filter

---

### 3. TASK-078: API Caching Implementation (P1 HIGH)
**Scope:** All API endpoints

**Cache Strategy:**
| Endpoint | TTL | Rationale |
|----------|-----|-----------|
| /api/agents | 5 min | Agent data changes infrequently |
| /api/tasks | 1 min | Task data changes regularly |
| /api/deals | 5 min | Deal data relatively stable |
| /api/tokens | 2 min | Token usage updates frequently |
| /api/metrics | 30 sec | Metrics should be near real-time |
| /api/stats | 1 min | Stats update regularly |

**Requirements:**
- Implement in-memory caching
- Add Cache-Control headers
- Implement ETag for conditional requests
- Add cache invalidation endpoint

**Acceptance Criteria:**
- [ ] All endpoints have appropriate caching
- [ ] Cache-Control headers present
- [ ] ETag support implemented
- [ ] Response times improved by 50%+

---

### 4. TASK-066: API Endpoints Support (P1 HIGH)
**Support Tasks:**

#### Assist Code-1 with:
- /api/metrics endpoint
- /api/config endpoint
- Response format standardization

#### Assist Code-3 with:
- /api/deals endpoint fixes
- Input validation middleware
- Rate limiting implementation

**Acceptance Criteria:**
- [ ] Support tasks completed
- [ ] Code review provided
- [ ] Integration tests pass

---

## AUDIT CHECKPOINTS

| Progress | Action | Report To |
|----------|--------|-----------|
| 25% | Token tracker fixed, logs endpoint improved | Audit-1 |
| 50% | Caching strategy implemented | Audit-1 |
| 75% | All endpoints have caching | Audit-2 |
| 100% | Performance verified, support tasks done | Audit-1 |

## VERIFICATION COMMANDS

Test each endpoint after implementation:
```bash
# Test tokens
curl https://dashboard-ten-sand-20.vercel.app/api/tokens

# Test logs with filters
curl "https://dashboard-ten-sand-20.vercel.app/api/logs/activity?agent=Nexus&limit=10"

# Test cache headers
curl -I https://dashboard-ten-sand-20.vercel.app/api/agents
```

## QUALITY STANDARD: 95/100

Before marking complete, verify:
- [ ] Token data loads from real files
- [ ] Logs populate from actual sources
- [ ] Caching improves performance
- [ ] Cache headers present on all responses
- [ ] No stale data issues
