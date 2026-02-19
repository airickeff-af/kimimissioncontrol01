# ERICF Quality Standards

**Version:** 2.0  
**Effective Date:** 2026-02-19  
**Minimum Acceptable Score:** 95/100  
**Target Score:** 98/100

---

## The ERICF Standard

Every deliverable must meet the ERICF quality threshold. This document defines the complete quality framework used by all Mission Control agents.

---

## Scoring System

### Critical Rule: Functionality Ceiling
**If ANY core functionality is broken, maximum score is 90/100.**

This means:
- Page loads but API returns 404 → Max 90/100
- Feature exists but doesn't work → Max 90/100
- Data doesn't load → Max 90/100
- Navigation broken → Max 90/100

### Category Weights

| Category | Weight | Max Score | Critical? |
|----------|--------|-----------|-----------|
| **Functionality** | 40% | 40 points | Yes |
| **Code Quality** | 25% | 25 points | No |
| **Testing** | 15% | 15 points | No |
| **Documentation** | 10% | 10 points | No |
| **Deployment** | 10% | 10 points | No |
| **TOTAL** | 100% | **100 points** | - |

---

## FUNCTIONALITY SCORING (40 points)

### Automatic Deductions for Broken Features

| Issue | Deduction | Impact |
|-------|-----------|--------|
| API endpoint 404 | -20 points | Critical |
| Page 404 | -20 points | Critical |
| Feature non-functional | -15 points | Major |
| Data not loading | -10 points | Major |
| Navigation broken | -10 points | Major |
| Mobile responsive issues | -5 points | Minor |
| Console errors | -3 points each | Minor |
| Broken links | -2 points each | Minor |

### Examples

**Example 1: One API 404**
- /api/stats returns 404 (-20)
- Everything else works
- **Functionality: 20/40**
- **Total: 90/100 max** ⚠️

**Example 2: Multiple Issues**
- /api/stats: 404 (-20)
- /api/tasks: Empty (-10)
- Mobile issues (-5)
- **Functionality: 5/40**
- **Total: 65/100** ❌

---

## CODE QUALITY SCORING (25 points)

### Scoring Criteria

| Aspect | Max Points | Criteria |
|--------|------------|----------|
| **Readability** | 8 | Clear naming, logical structure, no magic numbers |
| **Maintainability** | 7 | Modular design, DRY principle, proper abstraction |
| **Error Handling** | 5 | Try-catch blocks, input validation, graceful failures |
| **Performance** | 5 | Efficient algorithms, no unnecessary re-renders |

### Common Deductions

| Issue | Deduction |
|-------|-----------|
| Missing JSDoc comments | -3 points |
| No input validation | -5 points |
| Hardcoded values | -2 points |
| Deeply nested code (>4 levels) | -2 points |
| Unused variables/imports | -1 point each |
| Inconsistent naming | -2 points |

---

## TESTING SCORING (15 points)

### Requirements

| Test Type | Required | Points |
|-----------|----------|--------|
| **Unit Tests** | For complex logic | 5 points |
| **Integration Tests** | API endpoints | 5 points |
| **Manual Testing** | Documented | 3 points |
| **Edge Cases** | Handled | 2 points |

### Testing Checklist

- [ ] Happy path works
- [ ] Error paths handled
- [ ] Empty/null inputs tested
- [ ] Large data sets handled
- [ ] Mobile viewport tested
- [ ] Cross-browser verified (Chrome, Firefox, Safari)

---

## DOCUMENTATION SCORING (10 points)

### Required Documentation

| Document | Points | Description |
|----------|--------|-------------|
| **README.md** | 3 | Setup, usage, examples |
| **JSDoc Comments** | 3 | All functions documented |
| **API Documentation** | 2 | Endpoints, params, responses |
| **Changelog** | 1 | Version history |
| **Inline Comments** | 1 | Complex logic explained |

### JSDoc Requirements

```javascript
/**
 * Brief description of what the function does
 * @param {string} paramName - Description of parameter
 * @param {number} [optionalParam] - Optional parameter
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} When validation fails
 * @example
 * const result = await myFunction('input', 42);
 * console.log(result.data);
 */
async function myFunction(paramName, optionalParam = 0) {
  // Implementation
}
```

---

## DEPLOYMENT SCORING (10 points)

### Deployment Checklist

| Check | Points | Description |
|-------|--------|-------------|
| **Environment Variables** | 2 | All secrets in .env, never committed |
| **Build Success** | 2 | No build errors or warnings |
| **Health Check** | 2 | /api/health returns 200 |
| **Rollback Plan** | 2 | Documented rollback procedure |
| **Monitoring** | 2 | Errors logged, alerts configured |

---

## ACCEPTANCE CRITERIA

### 96-100: EXCELLENT ✅
- All functionality works perfectly
- All API endpoints return 200
- Mobile responsive
- Well documented
- Properly tested
- **Action:** Deploy immediately

### 90-95: CONDITIONAL PASS ⚠️
- Minor issues only
- Core functionality intact
- May have 1-2 small bugs
- Documentation mostly complete
- **Action:** Deploy with fix list

### 80-89: NEEDS WORK 🔧
- Multiple issues found
- Some functionality broken
- Missing documentation
- **Action:** Fixes required before deployment

### Below 80: FAIL ❌
- Critical functionality broken
- Major API failures
- Unusable in production
- **Action:** Significant rework required

---

## MANDATORY CHECKS (Must ALL Pass for 96+)

Before submitting any work, verify:

1. ✅ All pages load (200 OK)
2. ✅ All API endpoints work (200 OK)
3. ✅ No console errors
4. ✅ Mobile responsive
5. ✅ Data loads correctly
6. ✅ Navigation works
7. ✅ Forms submit properly
8. ✅ No broken links
9. ✅ JSDoc comments present
10. ✅ Error handling implemented

---

## AUDIT PROCESS

### 1. Automated Testing
- HTTP status checks
- API response validation
- Mobile viewport test
- Console error detection

### 2. Manual Review
- Code quality assessment
- Documentation review
- User experience check

### 3. Scoring
- Apply functionality ceiling first
- Calculate category scores
- Sum for final score

### 4. Decision
- ≥96: Pass, deploy
- 90-95: Conditional pass, fix minor issues
- <90: Fail, rework required

---

## AGENT-SPECIFIC STANDARDS

### Pixel (Designer)
- All sprites have 8-frame animations
- Mobile responsive layouts
- Consistent color palette (Kairosoft theme)
- Asset optimization (file size)

### Forge (Frontend)
- No console errors
- Mobile-first CSS
- Accessibility (ARIA labels)
- Cross-browser compatibility

### CodeMaster (Backend)
- All APIs return consistent format
- Input validation on all endpoints
- Error responses include helpful messages
- Rate limiting implemented

### Quill (Documentation)
- 100% endpoint coverage
- All examples tested and working
- Consistent formatting
- Version controlled

### Scout (Research)
- Sources cited
- Data freshness verified
- Bias awareness
- Actionable insights

---

## CONTINUOUS IMPROVEMENT

### Weekly Review
Every Monday at 9:00 AM:
1. Review last week's audit scores
2. Identify recurring issues
3. Update training materials
4. Set improvement targets

### Monthly Calibration
Last Friday of each month:
1. Review scoring rubric
2. Adjust weights if needed
3. Celebrate improvements
4. Recognize top performers

---

## QUICK REFERENCE

### Before Submitting Work

```
□ All pages load (200 OK)
□ All APIs return 200
□ No console errors
□ Mobile responsive
□ JSDoc comments added
□ Error handling implemented
□ README updated
□ Manual testing complete
```

### Score Calculation

```
Functionality:  ___/40
Code Quality:   ___/25
Testing:        ___/15
Documentation:  ___/10
Deployment:     ___/10
------------------------
TOTAL:          ___/100
```

---

**Enforced by:** Audit-1, Audit-2, Training Agent  
**Questions:** Contact Training Agent or Nexus  
**Last Updated:** 2026-02-19
