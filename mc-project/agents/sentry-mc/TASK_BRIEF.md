# SENTRY-MC — TASK BRIEF
**Agent:** Sentry-MC (DevOps / QA)  
**Assigned by:** Meemo (PM)  
**Date:** February 20, 2026 23:48 GMT+8

---

## 🎯 YOUR MISSION
Ensure MC Project is reliable, secure, and ready to scale. No bugs make it to production.

---

## 📋 ACTIVE TASKS

### 🔴 HIGH PRIORITY

#### TASK: SENTRY-001 — P1 Testing Environment
- **Description:** Set up staging environment for P1 features
- **Requirements:**
  - Staging branch in GitHub
  - Staging deployment on Vercel
  - Separate database (or schema)
  - Environment variables configured
  - Webhook for auto-deploy
- **ETA:** 1 hour
- **Deliverable:** Staging environment live at `staging.mc-project.vercel.app`

#### TASK: SENTRY-002 — Confession System Tests
- **Description:** Unit and integration tests for confession API
- **Test cases:**
  ```javascript
  // Unit tests
  - Create confession with valid data
  - Reject confession over 500 chars
  - Reject empty confession
  - Filter confessions by category
  - Sort confessions by likes
  
  // Integration tests
  - Like confession increments counter
  - Unlike confession decrements counter
  - Prevent duplicate likes
  - Delete own confession
  - Cannot delete others' confessions
  ```
- **ETA:** 2 hours
- **Deliverable:** `/tests/confessions.test.js` (80%+ coverage)

### 🟡 MEDIUM PRIORITY

#### TASK: SENTRY-003 — Load Testing Plan
- **Description:** Performance testing strategy
- **Requirements:**
  - Define load scenarios (normal, peak, stress)
  - Set up k6 or Artillery scripts
  - Test confession feed under load
  - Test like system concurrency
  - Document performance baselines
- **ETA:** 1 hour
- **Deliverable:** `/tests/load-testing-plan.md` + scripts

#### TASK: SENTRY-004 — Seasonal Event Framework
- **Description:** Architecture for limited-time events
- **Requirements:**
  - Event configuration system
  - Start/end date handling
  - Event-specific challenges
  - Leaderboard system
  - Reward distribution
- **ETA:** 3 hours
- **Deliverable:** `/api/events/framework.md`

---

## 📁 WORKSPACE
```
/mc-project/agents/sentry-mc/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
├── ci/               # CI/CD configurations
├── monitoring/       # Alerts, dashboards
└── docs/             # Testing documentation
```

---

## 🧪 TESTING STANDARDS

### Coverage Requirements
- Unit tests: 80%+ coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows
- Load tests: 1000 concurrent users

### Test Categories
1. **Functional** — Does it work correctly?
2. **Performance** — Is it fast enough?
3. **Security** — Is it safe?
4. **Usability** — Is it user-friendly?

### CI/CD Pipeline
```
Push to staging branch
    ↓
Run unit tests
    ↓
Run integration tests
    ↓
Deploy to staging
    ↓
Run E2E tests
    ↓
Manual QA approval
    ↓
Merge to main
    ↓
Deploy to production
```

---

## 🔒 SECURITY CHECKLIST

### For Each Feature
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] Data sanitization

### Confession-Specific
- [ ] Content moderation pipeline
- [ ] Profanity filtering
- [ ] PII detection
- [ ] Report system functional

---

## ✅ COMPLETION CHECKLIST

- [ ] SENTRY-001: Staging environment live
- [ ] SENTRY-002: Confession tests (80%+ coverage)
- [ ] SENTRY-003: Load testing plan documented
- [ ] SENTRY-004: Event framework designed
- [ ] All P0 regression tests pass
- [ ] Security review complete

---

## 📊 QUALITY TARGET
**Score:** 95/100

| Criteria | Weight |
|----------|--------|
| Test coverage | 35% |
| Bug detection | 30% |
| Documentation | 20% |
| Performance | 15% |

---

## 🚀 NEXT STEPS
1. Start with SENTRY-001 (staging) — blocks all P1 testing
2. SENTRY-002 (confession tests) — ensure feature quality
3. SENTRY-003 (load testing) — prepare for viral growth
4. SENTRY-004 (event framework) — future-proofing

**Questions?** Ping Meemo immediately.

---

*Sentry-MC — Quality is not an act, it's a habit* 🛡️
