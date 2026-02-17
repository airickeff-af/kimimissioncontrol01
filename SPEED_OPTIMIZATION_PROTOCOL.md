# SPEED & MEMORY OPTIMIZATION PROTOCOL
**Created:** 2026-02-17 9:54 PM HKT  
**Purpose:** Prevent memory bloat, optimize speeds

---

## ⚡ SPEED OPTIMIZATIONS

### **1. Context Management (Critical)**

**Rule:** Keep context < 200k tokens

**Actions:**
- [ ] Check context every 30 minutes
- [ ] Compress at 180k tokens
- [ ] Archive at 200k tokens
- [ ] Restart fresh at 220k tokens

**Current Status:** 0/262k ✅ Fresh

---

### **2. Session Management**

**Active Sessions Limit:** Max 5 concurrent

**Current:** 5 sessions ✅
- Main (Nexus)
- Cron: Self-Improvement
- Cron: Progress Report
- Cron: Task Queue
- Cron: Heartbeat

**Optimization:**
- Consolidate cron jobs where possible
- Use isolated sessions for heavy tasks
- Kill stalled sessions immediately

---

### **3. Memory File Strategy**

**Daily Files (Small):**
- `memory/2026-02-17.md` - Today's events
- `memory/2026-02-16.md` - Yesterday
- Archive after 30 days

**Long-term (Curated):**
- `MEMORY.md` - Important decisions only
- `NEXUS_PERMANENT_MEMORY.md` - Never forget
- Update weekly, not daily

**Never Do:**
- ❌ One giant memory file
- ❌ Store raw transcripts
- ❌ Duplicate information

---

### **4. Agent Communication**

**Reduce Token Usage:**
- Batch agent updates (not individual)
- Use status codes, not full sentences
- Cache agent states
- Limit heartbeat frequency

**Current:** Every 30 min ✅

---

### **5. Task Queue Optimization**

**Batch Similar Tasks:**
- Research tasks → DealFlow batch
- UI tasks → Forge batch
- Content tasks → Quill batch

**Parallel Execution:**
- Spawn multiple agents simultaneously
- Max 3 concurrent sub-agents
- Timeout: P0=180s, P1=120s, P2=60s

---

## 🧠 MEMORY BLOAT PREVENTION

### **1. Transcript Lifecycle**

**Auto-Archive After:**
- 24 hours for cron jobs
- 7 days for agent sessions
- 30 days for main sessions

**Keep Forever:**
- Decision records
- Error logs
- Performance metrics

---

### **2. File Size Limits**

| File Type | Max Size | Action |
|-----------|----------|--------|
| MEMORY.md | 50KB | Archive old entries |
| Daily memory | 10KB | Compress if larger |
| Agent configs | 5KB | Split if larger |
| Transcripts | N/A | Auto-archive |

---

### **3. Compression Triggers**

**Compress When:**
- Main session > 200k tokens
- MEMORY.md > 50KB
- Any file > 100KB
- Disk usage > 80%

**Compression Method:**
- Summarize long texts
- Remove duplicates
- Archive old data
- Keep only decisions

---

## 📊 MONITORING DASHBOARD

### **Track These Metrics:**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Context Usage | <200k | 0/262k | ✅ |
| Active Sessions | <5 | 5 | ⚠️ |
| Memory File Size | <50KB | ~30KB | ✅ |
| Token Usage/Day | <500k | ~425k | ✅ |
| Disk Usage | <80% | 19% | ✅ |
| Response Time | <5s | ~2s | ✅ |

---

## 🔄 DAILY OPTIMIZATION ROUTINE

### **9:00 AM HKT - Morning Check:**
- [ ] Check context usage
- [ ] Review overnight token usage
- [ ] Archive old transcripts
- [ ] Compress if needed

### **3:00 PM HKT - Midday Check:**
- [ ] Check active sessions
- [ ] Kill any stalled sessions
- [ ] Review memory file sizes
- [ ] Optimize if needed

### **9:00 PM HKT - Evening Check:**
- [ ] Full system health check
- [ ] Archive day's transcripts
- [ ] Update MEMORY.md
- [ ] Report to EricF

---

## 🚨 EMERGENCY PROCEDURES

### **If Context > 250k:**
1. Immediately compress
2. Archive non-critical info
3. Restart fresh session
4. Log the incident

### **If Disk > 90%:**
1. Archive all old transcripts
2. Compress memory files
3. Delete temp files
4. Report to EricF

### **If Sessions > 10:**
1. Kill oldest sessions
2. Check for runaway agents
3. Consolidate cron jobs
4. Review timeout settings

---

## ✅ CURRENT STATUS

| Check | Status | Notes |
|-------|--------|-------|
| Context | ✅ Good | 0/262k (fresh) |
| Sessions | ⚠️ Watch | 5 active |
| Memory | ✅ Good | ~30KB |
| Disk | ✅ Good | 19% |
| Speed | ✅ Good | ~2s response |

**Overall Health:** 🟢 EXCELLENT

---

*Protocol by: Nexus (Air1ck3ff)*  
*Review: Daily at 9:00 PM HKT*  
*Update: As needed*
