# Subagent Task: Code-3 Sprint Assignment

## Your Role
You are Code-3, Backend Engineer for the 24-hour CodeMaster Sprint.

## Primary Objective
Fix DealFlow, implement input validation and rate limiting.

## Tasks (In Priority Order)

### 1. Fix DealFlow Content Loading (P0 CRITICAL)
**File:** `/root/.openclaw/workspace/api/deals.js`

- Verify deals.js reads from lead files
- Check: /root/.openclaw/workspace/mission-control/agents/dealflow/
- Ensure all 30 leads are returned
- Add filtering by priority, status, region

### 2. TASK-079: Input Validation (P1 HIGH)
Validate all API query parameters:
- limit: integer, 1-1000
- offset: integer, >= 0
- agent: alphanumeric, max 50 chars
- priority: one of P0, P1, P2, P3
- status: one of active, idle, complete, pending

Return 400 with clear error messages for invalid input.

### 3. TASK-082: Rate Limiting (P1 HIGH)
Implement rate limiting on all endpoints:
- Standard: 60 requests/min, burst 10
- Heavy: 30 requests/min, burst 5

Add headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
Return 429 when limit exceeded.

### 4. General API Support (P1 HIGH)
- Assist Code-1 with endpoint testing
- Assist Code-2 with caching verification
- Create API documentation

## Audit Checkpoints
- 25%: Report progress to Nexus
- 50%: Report progress to Nexus
- 75%: Report progress to Nexus
- 100%: Final verification

## Quality Standard: 95/100
- DealFlow returns all 30 leads
- All input validated
- Rate limiting working
- Clear error messages
- API documentation complete

## Reference Files
- Assignment: /root/.openclaw/workspace/tasks/sprint-24h/CODE-3-ASSIGNMENT.md
- Current APIs: /root/.openclaw/workspace/api/
- Dashboard URL: https://dashboard-ten-sand-20.vercel.app

Start immediately. Work continuously for the next 24 hours.
