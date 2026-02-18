# AUDIT QUALITY STANDARDS v2.0
**Effective:** 2026-02-18 10:07 PM HKT  
**Minimum Acceptable Score:** 96/100

## SCORING SYSTEM

### Critical Rule: Functionality Ceiling
**If ANY core functionality is broken, maximum score is 90/100.**

This means:
- Page loads but API returns 404 → Max 90/100
- Feature exists but doesn't work → Max 90/100  
- Data doesn't load → Max 90/100
- Navigation broken → Max 90/100

### Category Weights

| Category | Weight | Max Score |
|----------|--------|-----------|
| **Functionality** | 40% | 40 points |
| **Code Quality** | 25% | 25 points |
| **Testing** | 15% | 15 points |
| **Documentation** | 10% | 10 points |
| **Deployment** | 10% | 10 points |
| **TOTAL** | 100% | **100 points** |

## FUNCTIONALITY SCORING (40 points)

**Automatic deductions for broken features:**
- API endpoint 404: -20 points
- Page 404: -20 points
- Feature non-functional: -15 points
- Data not loading: -10 points
- Navigation broken: -10 points
- Mobile responsive issues: -5 points

**Example:**
- /api/stats returns 404 → Functionality score = 20/40 (max total 90/100)
- Two API endpoints 404 → Functionality score = 0/40 (max total 60/100)

## ACCEPTANCE CRITERIA

### 96-100: EXCELLENT ✅
- All functionality works perfectly
- All API endpoints return 200
- Mobile responsive
- Well documented
- Properly tested

### 90-95: CONDITIONAL PASS ⚠️
- Minor issues only
- Core functionality intact
- May have 1-2 small bugs
- Documentation mostly complete

### 80-89: NEEDS WORK 🔧
- Multiple issues found
- Some functionality broken
- Missing documentation
- Requires fixes before deployment

### Below 80: FAIL ❌
- Critical functionality broken
- Major API failures
- Unusable in production
- Requires significant rework

## MANDATORY CHECKS (Must ALL Pass for 96+)

1. ✅ All pages load (200 OK)
2. ✅ All API endpoints work (200 OK)
3. ✅ No console errors
4. ✅ Mobile responsive
5. ✅ Data loads correctly
6. ✅ Navigation works
7. ✅ Forms submit properly
8. ✅ No broken links

## AUDIT PROCESS

1. **Automated Testing**
   - HTTP status checks
   - API response validation
   - Mobile viewport test
   - Console error detection

2. **Manual Review**
   - Code quality assessment
   - Documentation review
   - User experience check

3. **Scoring**
   - Apply functionality ceiling first
   - Calculate category scores
   - Sum for final score

4. **Decision**
   - ≥96: Pass, deploy
   - 90-95: Conditional pass, fix minor issues
   - <90: Fail, rework required

## EXAMPLES

### Example 1: Perfect Deployment
- All pages: 200 OK
- All APIs: 200 OK  
- No errors
- Well documented
- **Score: 98/100** ✅

### Example 2: One API 404
- /api/stats: 404
- Everything else works
- **Functionality: 20/40**
- **Total: 90/100 max** ⚠️

### Example 3: Multiple Issues
- /api/stats: 404 (-20)
- /api/tasks: Empty (-10)
- Mobile issues (-5)
- **Functionality: 5/40**
- **Total: 65/100** ❌

---
**Enforced by:** Audit-1, Audit-2  
**Last Updated:** 2026-02-18
