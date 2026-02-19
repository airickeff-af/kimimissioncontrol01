# Audit Checklist Template

**Task ID:** TASK-XXX  
**Agent:** [Agent Name]  
**Auditor:** Audit-1 / Audit-2  
**Date:** YYYY-MM-DD  
**Deliverable:** [File Path]

---

## Pre-Audit Setup

- [ ] Verify correct deployment URL: `https://dashboard-ten-sand-20.vercel.app`
- [ ] Confirm agent assignment matches task
- [ ] Review task requirements and acceptance criteria
- [ ] Check for any special instructions or constraints

---

## Functionality Checks (40 points)

### Core Features
- [ ] All required features implemented
- [ ] Features work as specified in requirements
- [ ] No broken functionality
- [ ] Edge cases handled appropriately

### API Endpoints (if applicable)
- [ ] All endpoints return 200 OK
- [ ] Response data is correct format
- [ ] Error responses are appropriate
- [ ] Rate limiting documented (if applicable)

### Pages & Navigation
- [ ] All pages load without 404 errors
- [ ] Navigation between pages works
- [ ] Browser back/forward works correctly
- [ ] Deep linking works (if applicable)

### Data Loading
- [ ] Data loads correctly
- [ ] Loading states shown appropriately
- [ ] Empty states handled
- [ ] Error states handled

### Mobile Responsiveness
- [ ] Layout works on mobile devices
- [ ] Touch interactions work
- [ ] No horizontal scrolling issues
- [ ] Font sizes readable on mobile

---

## Code Quality Checks (25 points)

### Clean Code
- [ ] Code is readable and maintainable
- [ ] DRY principles followed
- [ ] No code smells or anti-patterns
- [ ] Consistent naming conventions
- [ ] Proper indentation and formatting

### Error Handling
- [ ] Try/catch blocks where needed
- [ ] Graceful failure modes
- [ ] User-friendly error messages
- [ ] No unhandled promise rejections

### Performance
- [ ] Efficient algorithms used
- [ ] No unnecessary API calls
- [ ] Proper caching (if applicable)
- [ ] No memory leaks

### Security
- [ ] No hardcoded secrets
- [ ] No exposed credentials
- [ ] Input validation implemented
- [ ] XSS prevention measures

---

## Testing Checks (15 points)

### Manual Testing
- [ ] Tested in target browser
- [ ] Tested all user flows
- [ ] Tested error scenarios
- [ ] Tested on different screen sizes

### Automated Tests (if applicable)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Test coverage adequate
- [ ] No failing tests

---

## Documentation Checks (10 points)

### Code Documentation
- [ ] JSDoc comments for public APIs (JavaScript)
- [ ] Docstrings for functions (Python)
- [ ] Complex logic explained
- [ ] TODOs marked with context

### Usage Documentation
- [ ] README provided (if applicable)
- [ ] Setup instructions clear
- [ ] Usage examples provided
- [ ] Configuration documented

---

## Deployment Checks (10 points)

### Build & Deploy
- [ ] Builds successfully
- [ ] No build warnings (or justified)
- [ ] Deploys to correct URL
- [ ] Correct environment used

### Health Checks
- [ ] `/api/health` returns 200 OK
- [ ] All monitored endpoints healthy
- [ ] No 500 errors in logs
- [ ] Response times acceptable

### Environment
- [ ] Environment variables configured
- [ ] No missing config values
- [ ] Feature flags set correctly

---

## Content Checks

### Placeholders
- [ ] No "Lorem Ipsum" text
- [ ] No placeholder images (unless specified)
- [ ] No "TODO" or "FIXME" in content
- [ ] No dummy data in production

### Console
- [ ] No console.error messages
- [ ] No console.warn messages (or justified)
- [ ] No debug console.log left in code
- [ ] No sensitive data in logs

---

## Scoring

| Category | Max | Score | Notes |
|----------|-----|-------|-------|
| Functionality | 40 | | |
| Code Quality | 25 | | |
| Testing | 15 | | |
| Documentation | 10 | | |
| Deployment | 10 | | |
| **TOTAL** | **100** | | |

---

## Result

**Status:** [ ] PASS (≥95) / [ ] CONDITIONAL (90-94) / [ ] FAIL (<90)

### Issues Found

| # | Issue | Severity | Fix Required |
|---|-------|----------|--------------|
| 1 | | P0/P1/P2 | Yes/No |
| 2 | | P0/P1/P2 | Yes/No |
| 3 | | P0/P1/P2 | Yes/No |

### Fix Task Created

- [ ] Fix task created: TASK-XXX-FIX
- [ ] Assigned to: [Agent Name]
- [ ] Priority: P0/P1/P2
- [ ] Due date: YYYY-MM-DD

### Recommendations

1. 
2. 
3. 

---

**Auditor Signature:** _______________  
**Date:** _______________
