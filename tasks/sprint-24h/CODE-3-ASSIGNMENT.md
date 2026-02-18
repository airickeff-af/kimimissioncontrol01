# CODE-3 TASK ASSIGNMENT - 24H SPRINT
**Role:** Backend Engineer  
**Start:** 2026-02-18 21:35 HKT  
**Deadline:** 2026-02-19 21:35 HKT  
**Quality Standard:** 95/100

## PRIMARY TASKS

### 1. Fix DealFlow Content Loading (P0 CRITICAL)
**File:** `/root/.openclaw/workspace/api/deals.js`

**Current Issue:** DealFlow page may not be loading deal data properly.

**Requirements:**
- Verify deals.js reads from lead files
- Check lead data location: `/root/.openclaw/workspace/mission-control/agents/dealflow/`
- Ensure all 30 leads are returned
- Add filtering by priority, status, region

**Acceptance Criteria:**
- [ ] /api/deals returns all 30 leads
- [ ] Supports ?priority=P0 filter
- [ ] Supports ?status filter
- [ ] Supports ?region filter
- [ ] Response includes full contact info

---

### 2. TASK-079: Input Validation (P1 HIGH)
**Scope:** All API endpoints

**Validation Requirements:**

#### Query Parameter Validation:
- `limit`: Must be integer, 1-1000, default 100
- `offset`: Must be integer, >= 0, default 0
- `agent`: Must be alphanumeric, max 50 chars
- `priority`: Must be one of: P0, P1, P2, P3
- `status`: Must be one of: active, idle, complete, pending

#### Response for Invalid Input:
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid parameter: limit must be between 1 and 1000",
  "timestamp": "2026-02-18T21:35:00Z"
}
```

**Endpoints to Validate:**
- /api/agents
- /api/tasks
- /api/deals
- /api/logs/activity
- /api/tokens

**Acceptance Criteria:**
- [ ] All query params validated
- [ ] Clear error messages for invalid input
- [ ] 400 status for validation errors
- [ ] No crashes from malformed input

---

### 3. TASK-082: Rate Limiting (P1 HIGH)
**Scope:** All API endpoints

**Rate Limit Strategy:**
| Tier | Requests/Min | Burst | Applies To |
|------|--------------|-------|------------|
| Standard | 60 | 10 | General endpoints |
| Heavy | 30 | 5 | Data-intensive endpoints |

**Implementation:**
- Use simple in-memory rate limiting
- Track by IP address
- Return 429 status when limit exceeded
- Include rate limit headers:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Try again in 60 seconds.",
  "retryAfter": 60,
  "timestamp": "2026-02-18T21:35:00Z"
}
```

**Acceptance Criteria:**
- [ ] Rate limiting implemented on all endpoints
- [ ] Appropriate limits per endpoint type
- [ ] Rate limit headers included
- [ ] 429 response when limit exceeded

---

### 4. General API Support (P1 HIGH)
**Support Tasks:**

#### Assist Code-1 with:
- Testing /api/stats endpoint
- Testing /api/logs/chat endpoint
- Data synchronization testing

#### Assist Code-2 with:
- Token endpoint verification
- Logs endpoint testing
- Caching verification

#### Create API Documentation:
- Document all endpoints
- Include request/response examples
- Document error codes

**Acceptance Criteria:**
- [ ] Support tasks completed
- [ ] API documentation created
- [ ] All endpoints tested

---

## AUDIT CHECKPOINTS

| Progress | Action | Report To |
|----------|--------|-----------|
| 25% | DealFlow endpoint fixed | Audit-1 |
| 50% | Input validation implemented | Audit-1 |
| 75% | Rate limiting implemented | Audit-2 |
| 100% | Documentation complete, support done | Audit-1 |

## VERIFICATION COMMANDS

Test each endpoint after implementation:
```bash
# Test deals with filters
curl "https://dashboard-ten-sand-20.vercel.app/api/deals?priority=P0&region=HK"

# Test validation (should return 400)
curl "https://dashboard-ten-sand-20.vercel.app/api/agents?limit=9999"

# Test rate limit headers
curl -I https://dashboard-ten-sand-20.vercel.app/api/deals
```

## QUALITY STANDARD: 95/100

Before marking complete, verify:
- [ ] DealFlow returns all 30 leads
- [ ] All input validated
- [ ] Rate limiting working
- [ ] Clear error messages
- [ ] API documentation complete
