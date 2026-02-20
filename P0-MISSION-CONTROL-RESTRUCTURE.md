# P0 TASKS — MISSION CONTROL RESTRUCTURE
**Deadline: 6 AM, Feb 21, 2026**

---

## 🎯 MISSION CONTROL STRUCTURE (Separate from MC Project)

**Mission Control URL:** https://dashboard-ten-sand-20.vercel.app
**MC Project URL:** https://mc-project-tawny.vercel.app (separate)

---

## 🔴 NEW P0 TASKS (6 AM Deadline)

### **P0-001: Create "Projects" Tab in Mission Control**
- **Description:** Add new navigation tab "Projects" to Mission Control header
- **Location:** Between "Tasks" and "Tokens" in nav
- **Content:** Cards for:
  - MC Project (links to mc-project-tawny.vercel.app)
  - PIE (internal dashboard)
  - Scout (internal dashboard)
  - DealFlow (internal dashboard)
- **Assignee:** Agent-Alpha
- **Time:** 1 hour

### **P0-002: HQ Overview Page (Live Data)**
- **Description:** Main dashboard with all agents overview
- **Features:**
  - Total agents count (22)
  - Active/Busy/Idle breakdown
  - Recent activity feed
  - Quick stats (tasks completed, tokens used)
  - Live data from `/api/agents`
- **Assignee:** Agent-Alpha
- **Time:** 2 hours

### **P0-003: Pixel Office (Live Data)**
- **Description:** Interactive office with agent positions
- **Features:**
  - 22 agent sprites in office layout
  - Click agent for details
  - Live status updates
  - Standup button
- **Assignee:** Agent-Alpha
- **Time:** 2 hours

### **P0-004: Token Tracker (Live Data)**
- **Description:** Monitor API token usage across all agents
- **Features:**
  - Total tokens used
  - Per-agent breakdown
  - Cost calculator
  - Daily/weekly charts
  - Live from `/api/tokens`
- **Assignee:** Agent-Alpha
- **Time:** 2 hours

### **P0-005: Logs Tracker (Live Data)**
- **Description:** Centralized logging dashboard
- **Features:**
  - Recent agent activities
  - Error logs
  - Deployment logs
  - Filter by agent/date
  - Live from `/api/logs`
- **Assignee:** Agent-Alpha
- **Time:** 2 hours

### **P0-006: Tasks Board (Live Data)**
- **Description:** All tasks with filtering
- **Features:**
  - P0/P1/P2/P3 filter
  - Status filter (todo/in-progress/done)
  - Agent assignment
  - Due dates
  - Live from `/api/tasks`
- **Assignee:** Agent-Alpha
- **Time:** 2 hours

---

## 📊 MISSION CONTROL NAV STRUCTURE

```
[🏠 HQ] [🏢 Office] [👥 Agents] [📋 Tasks] [📁 Projects] [🪙 Tokens] [📊 Logs] [⚙️ Settings]
```

**Projects Tab Contains:**
- MC Project (external link)
- PIE Dashboard
- Scout Intel
- DealFlow
- (More projects as added)

---

## ✅ COMPLETED P0 (Agent-Alpha)

| Task | Status |
|------|--------|
| Refresh buttons | ✅ Done |
| API integration | ✅ Done |
| Pixel headers | ✅ Done |
| 404 fixes | ✅ Done |
| Deployment | ✅ Done |

---

## 🎯 REMAINING P0 (Due 6 AM)

| Task | Time | Status |
|------|------|--------|
| Projects tab | 1h | 🟡 In Progress |
| HQ Overview | 2h | 🟡 Not Started |
| Pixel Office | 2h | 🟡 Not Started |
| Token Tracker | 2h | 🟡 Not Started |
| Logs Tracker | 2h | 🟡 Not Started |
| Tasks Board | 2h | 🟡 Not Started |

**Total:** 11 hours → 6 hours with parallel work

---

**Created:** Feb 20, 2026 11:51 PM  
**Deadline:** Feb 21, 2026 6:00 AM  
**Assigned:** Agent-Alpha + Support
