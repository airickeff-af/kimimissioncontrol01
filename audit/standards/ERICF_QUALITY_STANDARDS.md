# ERICF Quality Standards v1.0

## Quality Gate System

### Minimum Quality Score: 95/100

All deliverables must achieve a minimum score of **95/100** to pass the quality gate. Scores below 95 require fixes before deployment.

---

## Scoring Categories

### 1. Functionality (40 points)
**Weight: 40%**

| Criteria | Points | Description |
|----------|--------|-------------|
| Core Features Working | 15 | All required features implemented and functional |
| API Endpoints | 10 | All endpoints return correct data/status |
| Data Loading | 10 | Data loads correctly, no empty states |
| Navigation | 5 | All navigation works, no broken links |

**Critical Deductions:**
- API 404: -20 points per endpoint
- Page 404: -20 points per page
- Broken feature: -15 points per feature
- Data not loading: -10 points
- Navigation broken: -10 points
- Mobile issues: -5 points

**Functionality Ceiling:** If critical functionality issues exist, maximum score is capped at **90/100**.

---

### 2. Code Quality (25 points)
**Weight: 25%**

| Criteria | Points | Description |
|----------|--------|-------------|
| Clean Code | 10 | Readable, maintainable, DRY principles |
| Error Handling | 8 | Proper try/catch, graceful failures |
| Performance | 7 | Efficient algorithms, no unnecessary operations |

**Deductions:**
- Missing error handling: -5 points
- Code smells/duplication: -3 points per instance
- Performance issues: -2 points per issue

---

### 3. Testing (15 points)
**Weight: 15%**

| Criteria | Points | Description |
|----------|--------|-------------|
| Unit Tests | 8 | Core logic has test coverage |
| Integration Tests | 5 | API/endpoints tested |
| Manual Testing | 2 | Verified working in browser/environment |

**Deductions:**
- No unit tests: -8 points
- No integration tests: -5 points
- Not manually tested: -2 points

---

### 4. Documentation (10 points)
**Weight: 10%**

| Criteria | Points | Description |
|----------|--------|-------------|
| Code Comments | 4 | JSDoc/docstrings for public APIs |
| README/Usage | 4 | Clear setup and usage instructions |
| Examples | 2 | Working examples provided |

**Deductions:**
- Missing JSDoc/comments: -4 points
- No README: -4 points
- No examples: -2 points

---

### 5. Deployment (10 points)
**Weight: 10%**

| Criteria | Points | Description |
|----------|--------|-------------|
| Deploys Successfully | 5 | No build errors, correct output |
| Environment Config | 3 | Environment variables properly configured |
| Health Checks | 2 | /api/health returns 200 OK |

**Deductions:**
- Build failure: -10 points (automatic fail)
- Wrong deployment: -10 points (automatic fail)
- Missing env config: -3 points
- Health check fails: -2 points

---

## Score Interpretation

| Score | Status | Emoji | Action |
|-------|--------|-------|--------|
| 96-100 | EXCELLENT | ✅ | Ready for deployment |
| 95 | PASS | ✅ | Meets minimum standard |
| 90-94 | CONDITIONAL PASS | ⚠️ | Deploy with caution, fixes recommended |
| 80-89 | NEEDS WORK | 🔧 | Requires fixes before deployment |
| <80 | FAIL | ❌ | Cannot deploy, significant rework needed |

---

## Audit Checklist Template

### Pre-Audit Setup
- [ ] Verify correct deployment URL: `https://dashboard-ten-sand-20.vercel.app`
- [ ] Confirm agent assignment is correct
- [ ] Review task requirements and acceptance criteria

### Functionality Checks
- [ ] All required features implemented
- [ ] API endpoints return 200 OK with correct data
- [ ] Pages load without 404 errors
- [ ] Data loads correctly
- [ ] Navigation works between pages
- [ ] Mobile responsive design works

### Code Quality Checks
- [ ] Code follows style guide
- [ ] No console errors or warnings
- [ ] Error handling implemented
- [ ] No hardcoded secrets or credentials
- [ ] No placeholder text or Lorem Ipsum

### Testing Checks
- [ ] Manual testing completed
- [ ] Unit tests pass (if applicable)
- [ ] Integration tests pass (if applicable)

### Documentation Checks
- [ ] README/usage guide provided
- [ ] Code comments for complex logic
- [ ] API documentation complete
- [ ] Examples provided

### Deployment Checks
- [ ] Builds successfully
- [ ] Deploys to correct URL
- [ ] Health check endpoint returns 200
- [ ] Environment variables configured

---

## Agent-Specific Standards

### Builder Agents
- Focus: Code quality, functionality, testing
- Minimum: 95/100 with strong functionality score

### Writer Agents
- Focus: Completeness, documentation, value
- Minimum: 95/100 with strong completeness score

### Research Agents
- Focus: Accuracy, sources, analysis depth
- Minimum: 95/100 with accurate data

### Pixel Agents
- Focus: Visual execution, code quality, documentation
- Minimum: 95/100 with strong visual execution

---

## Fix Task Protocol

When a task scores below 95:

1. **Create Fix Task:** `TASK-XXX-FIX`
2. **Assign to Original Agent:** Same agent that created original
3. **Priority:** Match original task priority
4. **Due Date:** Within 24 hours for P0/P1, 48 hours for P2
5. **Requirements:** Address all issues from audit
6. **Re-audit:** Required after fixes complete

---

## Quality Tracking

All audits are tracked in:
- `/audit/tracking/agent-scores.json` - Per-agent metrics
- `/audit/reports/YYYY-MM-DD-daily.md` - Daily summary
- `/audit/quality-dashboard.html` - Live dashboard

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-19 | Initial quality standards |

---

*Document Owner: Audit Coordinator*
*Review Cycle: Monthly*
