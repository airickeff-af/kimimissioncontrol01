# Audit Report Template

**Report ID:** AUDIT-YYYY-MM-DD-XXX  
**Date:** [Day, Month DD, YYYY — HH:MM AM/PM (Timezone)]  
**Auditor:** [Audit-1 / Audit-2 / Audit Coordinator]  
**Standard:** ERICF Quality Gate (95/100 minimum)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Tasks Audited | X |
| PASS (≥95) | X |
| FAIL (<95) | X |
| Fix Tasks Created | X |
| Critical Issues | X |

**Overall Status:** [ ] EXCELLENT / [ ] GOOD / [ ] NEEDS ATTENTION / [ ] CRITICAL

---

## Detailed Results

### ✅ TASK-XXX: [Task Name] — XX/100 — PASS

**Agent:** [Agent Name]  
**Deliverable:** `[File Path]`

**Scores:**
| Category | Score | Max |
|----------|-------|-----|
| Functionality | XX | 40 |
| Code Quality | XX | 25 |
| Testing | XX | 15 |
| Documentation | XX | 10 |
| Deployment | XX | 10 |
| **TOTAL** | **XX** | **100** |

**Notes:**
- 
- 
- 

**Strengths:**
- 
- 

**Minor Issues (No fix required):**
- 
- 

---

### ❌ TASK-XXX: [Task Name] — XX/100 — FAIL

**Agent:** [Agent Name]  
**Deliverable:** `[File Path]`

**Scores:**
| Category | Score | Max |
|----------|-------|-----|
| Functionality | XX | 40 |
| Code Quality | XX | 25 |
| Testing | XX | 15 |
| Documentation | XX | 10 |
| Deployment | XX | 10 |
| **TOTAL** | **XX** | **100** |

**Issues Found:**

| # | Issue | Category | Severity |
|---|-------|----------|----------|
| 1 | | | P0/P1/P2 |
| 2 | | | P0/P1/P2 |
| 3 | | | P0/P1/P2 |

**Fix Task Created:** TASK-XXX-FIX
- **Assigned to:** [Agent Name]
- **Priority:** P0/P1/P2
- **Due:** YYYY-MM-DD
- **Requirements:**
  - [ ] Fix issue #1
  - [ ] Fix issue #2
  - [ ] Fix issue #3

---

## Agent Performance Summary

| Agent | Tasks Audited | Avg Score | Pass Rate | Trend |
|-------|--------------|-----------|-----------|-------|
| | | | | |
| | | | | |

### Agent: [Name]

**Metrics:**
- Tasks Completed: X
- Tasks Audited: X
- Average Score: XX.X
- Pass Rate: XX% (X/X)
- Fix Tasks Required: X
- Fix Tasks Completed: X

**Strengths:**
- 
- 

**Improvement Areas:**
- 
- 

**Training Recommendations:**
- 
- 

---

## Fix Tasks Summary

### Pending

| Fix Task | Original | Agent | Priority | Due Date | Status |
|----------|----------|-------|----------|----------|--------|
| | | | | | |
| | | | | | |

### Completed

| Fix Task | Original | Agent | Completed | Final Score |
|----------|----------|-------|-----------|-------------|
| | | | | |

### Overdue

| Fix Task | Original | Agent | Due Date | Days Overdue |
|----------|----------|-------|----------|--------------|
| | | | | |

---

## Quality Trends

### 7-Day Rolling Metrics
- Average Score: XX.X
- Pass Rate: XX%
- Trend Direction: ↑ Improving / → Stable / ↓ Declining

### Quality Gate Status
- **Target:** 95/100 minimum
- **Current:** XX.X/100
- **Gap:** ±X.X points
- **Status:** [ ] Met / [ ] Not Met

### Score Distribution (Last 7 Days)

```
100:     ████████ (X)
95-99:   ██████ (X)
90-94:   ████ (X)
85-89:   ██ (X)
<85:     █ (X)
```

---

## Critical Issues

### 🚨 [Issue Title]

**Severity:** P0 - Critical  
**Task:** TASK-XXX  
**Agent:** [Name]

**Problem:**

**Impact:**

**Root Cause:**

**Resolution:**
- [ ] Action item 1
- [ ] Action item 2

---

## Patterns Identified

### Pattern 1: [Name]
- **Occurrences:** X times
- **Issue:** 
- **Recommendation:** 

### Pattern 2: [Name]
- **Occurrences:** X times
- **Issue:** 
- **Recommendation:** 

---

## Recommendations

### Immediate (Today)
1. 
2. 

### This Week
1. 
2. 

### Process Improvements
1. 
2. 

---

## Appendix

### Audit Configuration
- **Deployment URL:** `https://dashboard-ten-sand-20.vercel.app`
- **Quality Gate:** 95/100 minimum
- **Strict Mode:** Enabled
- **Auditors:** Audit-1, Audit-2

### Reference Documents
- Quality Standards: `/audit/standards/ERICF_QUALITY_STANDARDS.md`
- Checklist Template: `/audit/standards/AUDIT_CHECKLIST_TEMPLATE.md`
- Agent Scores: `/audit/tracking/agent-scores.json`
- Dashboard: `/audit/quality-dashboard.html`

---

*Reported by: [Auditor Name]*  
*Next audit: [Timeframe]*  
*Report Location: `/audit/reports/YYYY-MM-DD-daily.md`*
