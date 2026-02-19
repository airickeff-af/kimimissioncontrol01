# Token Tracker Audit Report
**Date:** 2026-02-19  
**Auditor:** Subagent  
**URL:** https://dashboard-ten-sand-20.vercel.app/token-tracker.html  
**Priority:** P0 - Revenue/cost tracking critical

---

## 🚨 EXECUTIVE SUMMARY

**Status:** ⚠️ **CRITICAL ISSUES FOUND**

The Token Tracker has **significant data integrity issues** that make it unsuitable for revenue/cost tracking. The dashboard is currently showing fallback data instead of live API data, and there are major discrepancies between the two API endpoints.

---

## 1. LIVE DATA VERIFICATION

### ❌ FAILED: `/api/tokens` Returns Real Data

**Finding:** The API returns data from `ACTUAL_TOKEN_USAGE_REPORT.md`, but the data is **stale** (from 2026-02-17, 2 days old).

**Evidence:**
```json
{
  "success": true,
  "source": "ACTUAL_TOKEN_USAGE_REPORT.md",
  "timestamp": "2026-02-19T01:49:07.246Z",
  "today": {
    "tokensIn": 442000,
    "tokensOut": 28000,
    "cost": 0.52,
    "sessions": 269,
    "messages": 1522
  }
}
```

**Issues:**
- Report is from Feb 17, not updated since
- "Today" stats appear inflated compared to report
- No evidence of automatic updates

### ❌ FAILED: Token Usage Numbers Match Session Data

**Finding:** Token numbers do NOT match actual session transcript data.

**Evidence:**
- `/api/tokens` shows: 714,300 total tokens
- `/api/tokens-live` shows: 341,600 total tokens  
- Session transcripts exist but are not being parsed correctly
- `tokens-live` endpoint shows `dataSource: "report_fallback"` and `sessionsAnalyzed: 0`

### ❌ FAILED: Costs Calculated from Real Token Consumption

**Finding:** Cost calculations are inconsistent between endpoints.

| Endpoint | Total Cost | Token Cost Rate |
|----------|-----------|-----------------|
| `/api/tokens` | $1.43 | ~$0.000002/token |
| `/api/tokens-live` | $5.14 | ~$0.015/1K tokens |

**Discrepancy:** 3.6x difference in cost calculations!

### ❌ FAILED: Data Updates Automatically

**Finding:** Data is **static/cached**, not live.

**Evidence:**
- Report file hasn't been updated since Feb 17
- No cron job appears to be updating the report
- API returns `cached: false` but data is clearly stale

---

## 2. CHART ANALYSIS

### ❌ FAILED: Usage Trend Chart Shows Real Historical Data

**Finding:** Chart data is **simulated/generated**, not real.

**Evidence from JavaScript:**
```javascript
// From token-tracker.html renderCharts() function:
chartData = [
    Math.round(total24h * 0.1),  // 10%
    Math.round(total24h * 0.15), // 15%
    Math.round(total24h * 0.25), // 25%
    Math.round(total24h * 0.2),  // 20%
    Math.round(total24h * 0.18), // 18%
    Math.round(total24h * 0.08), // 8%
    Math.round(total24h * 0.04)  // 4%
];
```

The chart uses **hardcoded percentages** to simulate hourly distribution, not actual hourly data.

### ❌ FAILED: Cost Distribution Pie Chart Accurate

**Finding:** Pie chart uses fallback data, not live API data.

**Evidence:**
- When API fails, `useFallbackData()` is called with hardcoded values
- Fallback data doesn't match `/api/tokens` response
- No verification that chart updates when API succeeds

### ❌ FAILED: 7-Day Trend Verification

**Finding:** Historical data is **randomly generated** on each request.

**Evidence from `/api/tokens-live`:**
```javascript
// Generate 7-day historical data
function generateHistoricalData(agentData) {
  return rotatedDays.map((day, index) => {
    const variation = 0.8 + (Math.random() * 0.4); // Random 80-120%
    const dayTokens = Math.round(baseDaily * variation);
    ...
  });
}
```

**The 7-day trend is completely fabricated with `Math.random()`!**

### ⚠️ WARNING: Data Gap Claim (3 Days Ago)

The audit mentions "3 days ago no activity claim" - this cannot be verified as the historical data is randomly generated and doesn't persist.

---

## 3. HISTORICAL DATA COMPARISON

### ❌ FAILED: Chart Data from 3 Days Ago vs Now

**Finding:** Cannot compare because historical data is not persisted.

**Issues:**
- `generateHistoricalData()` creates new random data on every API call
- No database or file storage for historical trends
- The dates in the response change but values are random

### ❌ FAILED: Token Burn Rate Consistency

**Finding:** Burn rate calculation is flawed.

**Evidence:**
```javascript
// From tokens-live.js
todayTokens: 0,  // Always 0 because sessionData.filter(s => s.isRecent) returns empty
todayCost: 0,
burnRate: 0,
```

The live endpoint shows **zero tokens today** despite sessions running.

### ❌ FAILED: Agent Activity Matches Chart Trends

**Finding:** No correlation between actual agent activity and charts.

**Evidence:**
- Session transcripts exist in `/root/.openclaw/cron/runs/`
- Files show recent activity (Feb 19, 09:48)
- But API returns `todayTokens: 0` and `activeSessions: 0`

---

## 4. REFRESH BUTTON FUNCTIONALITY

### ⚠️ PARTIAL: Manual Refresh Button

**Finding:** Button exists and calls `fetchTokens()`, but...

**Issues:**
- No visual confirmation of successful refresh
- Error state shows "Failed to load token data" but falls back to static data
- User cannot tell if data is fresh or cached

### ❌ FAILED: Auto-Refresh Interval

**Finding:** Auto-refresh is set to **5 minutes**, not 30 seconds as specified.

**Evidence from JavaScript:**
```javascript
// Auto-refresh every 5 minutes
setInterval(() => {
    fetchTokens();
}, 5 * 60 * 1000);
```

**Requirement was 30 seconds - actual is 300 seconds (10x slower)!**

### ⚠️ WARNING: Loading States

**Finding:** Loading overlay exists but may not display correctly.

**Evidence:**
- `loadingOverlay.classList.add('hidden')` is called in `finally` block
- But overlay might not be visible during initial load
- No loading indicator for chart updates

### ❌ FAILED: Data Updates After Refresh

**Finding:** Even after refresh, data may not update.

**Evidence:**
- API reads from static file `ACTUAL_TOKEN_USAGE_REPORT.md`
- File hasn't been updated since Feb 17
- Refreshing won't get new data until the file is updated

---

## 5. MISSION CONTROL TAB SPECIFIC CHECKS

### ❌ FAILED: Real-Time Token Burn Rate Accuracy

**Finding:** Burn rate is always 0.

**Evidence from `/api/tokens-live`:**
```json
{
  "live": {
    "burnRate": 0,
    "activeSessions": 0,
    "todayTokens": 0,
    "todayCost": 0
  }
}
```

**Root Cause:** The `getCronSessionData()` function looks in `/root/.openclaw/cron/runs/` but the session parsing doesn't extract token metadata correctly.

### ❌ FAILED: Today's Actual Cost vs Estimated

**Finding:** Both actual and estimated are 0 or inconsistent.

| Metric | `/api/tokens` | `/api/tokens-live` |
|--------|---------------|-------------------|
| Today Tokens | 442,000 | 0 |
| Today Cost | $0.52 | $0 |

### ❌ FAILED: Agent Efficiency Rankings (tasks/$)

**Finding:** All agents show 0 efficiency.

**Evidence:**
```json
{
  "agents": [
    {
      "name": "DealFlow",
      "efficiency": 0,
      "costPerTask": 1.73,
      "tasksCompleted": 0,
      "sessionsCount": 0
    }
  ]
}
```

**Root Cause:** `calculateEfficiencyRankings()` can't match sessions to agents because session parsing fails.

### ⚠️ WARNING: Budget vs Actual Spend Progress Bar

**Finding:** Budget calculations exist but use inconsistent data.

**Evidence:**
```json
{
  "live": {
    "budgetUsed": 68.3,
    "budgetRemaining": 158400
  }
}
```

The budget used percentage (68.3%) doesn't match the token counts shown.

### ⚠️ WARNING: Potential Savings Calculations

**Finding:** Savings data is **hardcoded estimates**, not calculated from actual usage.

**Evidence:**
```javascript
// Hardcoded savings values
const cronSavings = {
  oldCost: 3.20,
  newCost: 1.00,
  savings: 2.20,
  percentage: 68,
  description: 'Cron consolidation (432→48 runs/day)'
};
```

These are **projected/estimated savings**, not actual measured savings.

---

## 6. DATA INTEGRITY

### ❌ FAILED: Cross-Reference with `/api/tokens-live`

**Finding:** Major discrepancies between endpoints.

| Metric | `/api/tokens` | `/api/tokens-live` | Match? |
|--------|---------------|-------------------|--------|
| Total Tokens | 714,300 | 341,600 | ❌ No |
| Total Cost | $1.43 | $5.14 | ❌ No |
| DealFlow Tokens | 115,300 | 115,300 | ✅ Yes |
| Nexus Tokens | 141,000 | 75,300 | ❌ No |
| Today Tokens | 442,000 | 0 | ❌ No |

### ❌ FAILED: Verify Against Session Transcript Data

**Finding:** Session transcripts exist but are not properly parsed.

**Evidence:**
- Files exist: `/root/.openclaw/cron/runs/*.jsonl`
- Recent files: Feb 19, 09:48 (167KB file)
- But API returns `sessionsAnalyzed: 0`

**Root Cause:** The `parseSessionTranscript()` function expects `metadata.tokensIn/tokensOut` which may not exist in the actual transcript format.

### ⚠️ WARNING: localStorage Cached Data Issues

**Finding:** No evidence of localStorage caching in the code.

**Assessment:** The dashboard doesn't cache data in localStorage, which means it relies entirely on API calls. This is actually good for data freshness, but bad for offline functionality.

### ❌ FAILED: Confirm No Hardcoded Values

**Finding:** **Many hardcoded values exist.**

**Evidence:**
1. Fallback data in `useFallbackData()`:
```javascript
agentData = [
  { name: 'DealFlow', tokens: 115300, cost: 1.73, ... },
  { name: 'Nexus', tokens: 75300, cost: 1.13, ... },
  // ... all hardcoded
];
```

2. Chart data percentages are hardcoded (10%, 15%, 25%, etc.)

3. Savings calculations use hardcoded estimates

4. Agent emojis and colors are hardcoded mappings

---

## 📊 SUMMARY OF FINDINGS

### Critical Issues (P0)

| # | Issue | Impact |
|---|-------|--------|
| 1 | Data is 2+ days stale | Revenue tracking inaccurate |
| 2 | Two APIs return different values | Cannot trust any numbers |
| 3 | Historical data is randomly generated | Trends are meaningless |
| 4 | Today's usage shows 0 | Real-time monitoring broken |
| 5 | Session transcripts not parsed | Missing actual usage data |

### High Priority Issues (P1)

| # | Issue | Impact |
|-------|-------|--------|
| 6 | Auto-refresh is 5 min not 30 sec | Delayed alerting |
| 7 | Hardcoded fallback data | Misleading when API fails |
| 8 | Cost calculations inconsistent | 3.6x variance between APIs |
| 9 | Efficiency rankings all zero | Performance metrics useless |

### Medium Priority Issues (P2)

| # | Issue | Impact |
|-------|-------|--------|
| 10 | Chart data simulated not real | Visualizations misleading |
| 11 | Savings are estimates not actual | ROI calculations inaccurate |
| 12 | No localStorage caching | Unnecessary API load |

---

## 🛠️ RECOMMENDATIONS

### Immediate Actions (Fix Today)

1. **Fix Session Parsing**
   ```javascript
   // Update parseSessionTranscript() to handle actual transcript format
   // Current: entry.metadata.tokensIn
   // Actual: Need to parse from content or add metadata to transcripts
   ```

2. **Unify API Endpoints**
   - Merge `/api/tokens` and `/api/tokens-live`
   - Use single source of truth
   - Document which endpoint is authoritative

3. **Fix Auto-Refresh Interval**
   ```javascript
   // Change from 5 minutes to 30 seconds
   setInterval(() => {
       fetchTokens();
   }, 30 * 1000); // 30 seconds
   ```

### Short-Term Fixes (This Week)

4. **Implement Real Historical Data Storage**
   - Store daily summaries in a JSON file or database
   - Stop using `Math.random()` for historical data

5. **Update ACTUAL_TOKEN_USAGE_REPORT.md**
   - Create a cron job to update this file daily
   - Or switch to reading from session transcripts exclusively

6. **Add Data Freshness Indicator**
   - Show "Last updated: X minutes ago"
   - Highlight stale data with warning colors

### Long-Term Improvements (This Month)

7. **Implement Proper Token Tracking**
   - Hook into OpenClaw API to get real-time token usage
   - Store per-session, per-agent, per-day metrics

8. **Add Data Validation**
   - Alert when APIs return inconsistent data
   - Log discrepancies for debugging

9. **Create Admin Dashboard**
   - Allow manual refresh of report data
   - Show raw session data for verification

---

## ✅ VERIFICATION CHECKLIST

- [ ] `/api/tokens` returns data from last 24 hours
- [ ] `/api/tokens-live` returns data from last 24 hours
- [ ] Both APIs return consistent values
- [ ] Today tokens > 0 when sessions are active
- [ ] Historical data persists across requests
- [ ] Charts show actual data points, not simulations
- [ ] Auto-refresh is 30 seconds
- [ ] Efficiency rankings calculate correctly
- [ ] Session transcripts are parsed successfully
- [ ] No hardcoded values in production

---

## 📎 APPENDIX

### API Response Samples

**`/api/tokens` (2026-02-19T01:49:07.246Z):**
```json
{
  "success": true,
  "total": {
    "tokensIn": 714300,
    "tokensOut": 38285,
    "cost": 1.43,
    "tasks": 422
  },
  "today": {
    "tokensIn": 442000,
    "tokensOut": 28000,
    "cost": 0.52,
    "sessions": 269,
    "messages": 1522
  },
  "source": "ACTUAL_TOKEN_USAGE_REPORT.md"
}
```

**`/api/tokens-live` (2026-02-19T01:49:21.205Z):**
```json
{
  "success": true,
  "live": {
    "burnRate": 0,
    "activeSessions": 0,
    "todayTokens": 0,
    "todayCost": 0,
    "budgetUsed": 68.3
  },
  "summary": {
    "totalTokens": 341600,
    "totalCost": 5.14
  },
  "meta": {
    "dataSource": "report_fallback",
    "sessionsAnalyzed": 0
  }
}
```

### Session Transcript Evidence

```
-rw-r--r-- 1 root root 167990 Feb 19 09:48 07bb128c-ded3-40ef-872b-4326994192bd.jsonl
-rw-r--r-- 1 root root 278950 Feb 19 07:46 2e0c2d16-f557-489c-9d07-0bf01590b643.jsonl
```

Sessions ARE running but NOT being counted.

---

**END OF AUDIT REPORT**
