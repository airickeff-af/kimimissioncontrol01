# Quality Gate Preparation

**Target Agents:** All agents  
**Purpose:** Pre-submission checklist to ensure 95+ scores  
**When to Use:** Before marking any task as complete

---

## The Quality Gate

### What is it?
A mandatory checkpoint before work is considered complete. No task passes without going through the Quality Gate.

### Why it matters?
- Catches issues before audit
- Saves time on rework
- Maintains 95+ standard
- Builds quality habits

### When to run?
- At 25% checkpoint
- At 50% checkpoint
- At 75% checkpoint
- Before final submission

---

## Pre-Submission Checklist

### Functionality (40 points)

```
□ All pages load with 200 OK
□ All API endpoints return 200
□ No 404 errors on any route
□ Data loads correctly
□ Forms submit properly
□ Buttons are clickable
□ Links work correctly
□ Navigation functions
□ Search works (if applicable)
□ Filters work (if applicable)
□ Sorting works (if applicable)
□ Pagination works (if applicable)
```

### Code Quality (25 points)

```
□ All functions have JSDoc comments
□ Variable names are descriptive
□ No magic numbers (use constants)
□ No console.log statements (or removed)
□ No unused variables/imports
□ Code is properly indented
□ No deeply nested code (>4 levels)
□ Error handling implemented
□ Input validation present
□ Consistent code style
```

### Testing (15 points)

```
□ Happy path tested manually
□ Error paths tested
□ Empty/null inputs handled
□ Large data sets tested
□ Mobile viewport tested
□ Cross-browser tested (Chrome, Firefox, Safari)
□ Edge cases considered
□ Console has no errors during testing
```

### Documentation (10 points)

```
□ README.md updated
□ JSDoc comments complete
□ API endpoints documented
□ Example usage provided
□ Changelog updated (if versioned)
□ Setup instructions clear
□ Environment variables documented
```

### Deployment (10 points)

```
□ Build succeeds with no errors
□ Build succeeds with no warnings
□ Environment variables set
□ Health check endpoint works
□ /api/health returns 200
□ No secrets in code
□ .env.example updated
□ Rollback plan documented
```

---

## Quick Verification Commands

### API Testing

```bash
# Test all API endpoints
curl -s https://dashboard-ten-sand-20.vercel.app/api/health | jq .
curl -s https://dashboard-ten-sand-20.vercel.app/api/agents | jq .
curl -s https://dashboard-ten-sand-20.vercel.app/api/tasks | jq .

# Test with parameters
curl -s "https://dashboard-ten-sand-20.vercel.app/api/agents?status=active" | jq .
```

### Page Load Testing

```bash
# Check all pages return 200
curl -s -o /dev/null -w "%{http_code}" https://dashboard-ten-sand-20.vercel.app/
curl -s -o /dev/null -w "%{http_code}" https://dashboard-ten-sand-20.vercel.app/office.html
curl -s -o /dev/null -w "%{http_code}" https://dashboard-ten-sand-20.vercel.app/agents.html
```

### Console Error Check

```javascript
// Run in browser console
// Should return empty array
console.log('Errors:', window.consoleErrors || []);

// Check for 404s
performance.getEntriesByType('resource')
  .filter(r => r.responseStatus === 404)
  .map(r => r.name);
```

---

## Agent-Specific Checklists

### Pixel (Design)

```
□ All sprites have 8-frame animations
□ Mobile responsive layouts
□ Consistent color palette
□ Assets optimized (file size < 500KB each)
□ No broken image links
□ Retina display support (@2x)
□ Dark mode considered (if applicable)
```

### Forge (Frontend)

```
□ No console errors
□ Mobile-first CSS
□ Accessibility: ARIA labels present
□ Keyboard navigation works
□ Screen reader compatible
□ Cross-browser compatible
□ CSS minified for production
□ No inline styles (use classes)
```

### CodeMaster (Backend)

```
□ All APIs return consistent format
□ Input validation on all endpoints
□ Error responses include helpful messages
□ Rate limiting implemented
□ CORS configured
□ Authentication working
□ Database connections closed properly
□ No SQL injection vulnerabilities
```

### Quill (Documentation)

```
□ 100% endpoint coverage
□ All examples tested and working
□ Consistent formatting
□ Version controlled
□ No broken links
□ Search functionality works
□ PDF export works (if applicable)
```

---

## Common Failure Patterns

### Pattern 1: "It Works on My Machine"

**Symptom:** Works locally, fails in production

**Causes:**
- Hardcoded localhost URLs
- Missing environment variables
- Different Node.js versions
- Case-sensitive path issues

**Fix:**
```javascript
// ❌ BAD
const API_URL = 'http://localhost:3001';

// ✅ GOOD
const API_URL = process.env.API_URL || 'http://localhost:3001';
```

### Pattern 2: The Silent Failure

**Symptom:** No errors, but data doesn't load

**Causes:**
- Missing error handling
- Async/await without try-catch
- Empty catch blocks

**Fix:**
```javascript
// ❌ BAD
async function loadData() {
  const data = await fetch('/api/data');
  return data.json();
}

// ✅ GOOD
async function loadData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}
```

### Pattern 3: The Missing JSDoc

**Symptom:** Code quality deductions

**Fix:**
```javascript
// ❌ BAD
function process(data) {
  return data.map(x => x * 2);
}

// ✅ GOOD
/**
 * Doubles each number in the array
 * @param {number[]} data - Array of numbers
 * @returns {number[]} Array with doubled values
 * @example
 * process([1, 2, 3]); // [2, 4, 6]
 */
function process(data) {
  return data.map(x => x * 2);
}
```

### Pattern 4: The API Mismatch

**Symptom:** Frontend expects one format, backend returns another

**Fix:** Document and agree on contract first (see API Integration Checklist)

---

## Score Estimation

Before submitting, estimate your score:

```
Functionality:
  □ All works (40/40)
  □ 1 minor issue (35/40)
  □ 2+ issues (25/40 or less)
  □ API 404 (max 20/40)

Code Quality:
  □ Excellent (25/25)
  □ Good, minor issues (22/25)
  □ Missing docs (20/25)
  □ Needs cleanup (15/25)

Testing:
  □ Comprehensive (15/15)
  □ Basic testing (12/15)
  □ Minimal testing (8/15)
  □ No testing (0/15)

Documentation:
  □ Complete (10/10)
  □ Good (8/10)
  □ Minimal (5/10)
  □ Missing (0/10)

Deployment:
  □ Production ready (10/10)
  □ Minor issues (8/10)
  □ Needs work (5/10)

ESTIMATED TOTAL: ___/100
```

**If estimated score < 95, fix issues before submitting.**

---

## Submission Template

When marking a task complete, include:

```markdown
## Quality Gate Verification

### Functionality
- [x] All pages load (200 OK)
- [x] All APIs work
- [x] No console errors

### Code Quality
- [x] JSDoc comments added
- [x] No unused code
- [x] Consistent style

### Testing
- [x] Manual testing complete
- [x] Mobile tested
- [x] Cross-browser tested

### Documentation
- [x] README updated
- [x] API docs complete

### Deployment
- [x] Build successful
- [x] Health check passes

### Estimated Score: 96/100

### Notes:
[Any known issues or context]
```

---

## Emergency Fixes

### If You Find an Issue After Submission

1. **Don't panic** - Issues happen
2. **Assess severity** - Is it critical?
3. **Communicate** - Tell Nexus immediately
4. **Fix quickly** - P0 issues within 1 hour
5. **Retest** - Run quality gate again
6. **Document** - Note what went wrong

### Quick Fixes for Common Issues

| Issue | Quick Fix |
|-------|-----------|
| API 404 | Check endpoint URL, verify deployed |
| CORS error | Add origin to CORS config |
| Console error | Check for undefined variables |
| Mobile broken | Add viewport meta tag |
| JSDoc missing | Use IDE snippets |
| Build fail | Check for syntax errors |

---

## Remember

> "The quality gate is not a hurdle to overcome, but a safety net to catch you."

**Better to delay submission than submit broken work.**

---

**Questions?** Contact Training Agent  
**Related:** `/training/ERICF_QUALITY_STANDARDS.md`
