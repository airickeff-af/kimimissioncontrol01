# AUDIT TASK: Refresh Buttons + Real Data Verification
**Assigned:** Audit-1 + Audit-2  
**Due:** Feb 19, 9:00 AM (with TASK-092)  
**Priority:** P0

---

## 🎯 OBJECTIVE

Verify every Mission Control page has:
1. ✅ Working refresh buttons
2. ✅ Real data (not dummy/hardcoded)

---

## 📋 PAGES TO AUDIT (10 total)

### **1. index.html (HQ)**
- [ ] Refresh button works
- [ ] Uses /api/agents (real agent data)
- [ ] Uses /api/stats (real system stats)
- [ ] Auto-refresh enabled

### **2. office.html**
- [ ] Refresh button works
- [ ] Uses /api/tasks (real task data)
- [ ] Uses /api/agents (real agent status)
- [ ] Auto-refresh enabled

### **3. pixel-office.html**
- [ ] Refresh button works
- [ ] Uses /api/logs/activity (real activity)
- [ ] Uses /api/agents (real positions)
- [ ] Real-time updates

### **4. agents.html**
- [ ] Refresh button works
- [ ] Uses /api/agents (real agent data)
- [ ] No hardcoded agent lists
- [ ] Auto-refresh enabled

### **5. projects.html**
- [ ] Refresh button works
- [ ] Uses /api/projects (real project data)
- [ ] Stats from real sources
- [ ] Auto-refresh enabled

### **6. dealflow-view.html**
- [ ] Refresh button works
- [ ] Uses /api/deals (real contact data)
- [ ] Uses /api/leads (real leads)
- [ ] Auto-refresh enabled

### **7. token-tracker.html**
- [ ] Refresh button works
- [ ] Uses /api/tokens (real token data)
- [ ] Charts use real data (not estimates)
- [ ] Auto-refresh enabled

### **8. task-board.html**
- [ ] Refresh button works
- [ ] Uses /api/tasks (real task data)
- [ ] Counts from API (not static)
- [ ] Auto-refresh enabled

### **9. data-viewer.html**
- [ ] Refresh button works
- [ ] Reads real files (not dummy data)
- [ ] Live file sync
- [ ] Auto-refresh enabled

### **10. scout.html**
- [ ] Refresh button works
- [ ] Uses /api/scout (real opportunities)
- [ ] Data from real sources
- [ ] Auto-refresh enabled

---

## 🚫 DUMMY DATA RED FLAGS

Check for:
- ❌ `tokens * 7` (fake weekly estimates)
- ❌ Hardcoded arrays in JavaScript
- ❌ `// DONE: replace with real API`
- ❌ Static HTML tables
- ❌ `setTimeout` fake loading

---

## 📊 SCORING

| Criteria | Points |
|----------|--------|
| Refresh works | 5 |
| Real API used | 10 |
| Auto-refresh | 5 |
| No dummy data | 10 |
| **Total per page** | **30** |

**Pass:** 25/30 minimum
**Target:** 27/30 average

---

## 📝 DELIVERABLE

**Report with:**
1. Score per page (table)
2. Pages with dummy data (flagged)
3. Fix tasks created
4. Priority order for fixes

**Fix Tasks to Create:**
- For each page with dummy data
- For each broken refresh button
- For missing auto-refresh

---

**Audit both teams (Audit-1 + Audit-2) for cross-verification**
