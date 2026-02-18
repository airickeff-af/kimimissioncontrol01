# Nexus Delegation Workflow with Audit Checkpoints

**Version:** 2.0  
**Effective Date:** 2026-02-18  
**Owner:** Nexus (Air1ck3ff)  
**Status:** ACTIVE

---

## Overview

This document defines the standardized workflow for Nexus when delegating tasks to agents. All task assignments must include audit checkpoints to ensure transparency, accountability, and quality control throughout the task lifecycle.

---

## 1. Modified Delegation Template

When assigning a task, Nexus must use the following standardized format:

### Standard Delegation Message

```
🔔 TASK ASSIGNED to [Agent Name]

Task: TASK-XXX - [Brief Description]
Priority: P0/P1/P2/P3
Due: [Date/Time in HKT]

📊 AUDIT CHECKPOINTS:
- Report to Audit-1 at 25% progress
- Report to Audit-1 at 50% progress  
- Report to Audit-2 at 75% progress
- Final review by Audit-1 at completion

📋 REPORTING FORMAT:
Send progress updates to: /mission-control/audit/progress-reports/
Include: % complete, what was done, any blockers

✅ ACCEPTANCE CRITERIA:
[Specific, measurable criteria for task completion]

🎯 BEGIN WORK
```

### Delegation Components Explained

| Component | Description | Required |
|-----------|-------------|----------|
| Task ID | Unique identifier (TASK-XXX) | Yes |
| Description | Brief summary of work | Yes |
| Priority | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) | Yes |
| Due Date | Deadline in Asia/Shanghai timezone | Yes |
| Audit Checkpoints | Progress reporting milestones | Yes |
| Reporting Format | Where and how to report progress | Yes |
| Acceptance Criteria | Specific completion requirements | Yes |

---

## 2. Progress Report Template

Agents must submit progress reports at each audit checkpoint using this format:

### File Location
```
/mission-control/audit/progress-reports/TASK-XXX-[checkpoint]-[timestamp].md
```

### Report Template

```markdown
## Progress Report: TASK-XXX

**Agent:** [Agent Name]
**Timestamp:** [ISO 8601 date, e.g., 2026-02-18T20:48:00+08:00]
**Progress:** [X]%
**Status:** [started/in_progress/blocked/completed]

### Work Completed:
- [item 1 - specific deliverable or milestone]
- [item 2 - specific deliverable or milestone]

### Issues Encountered:
- [issue 1 with impact assessment] 
- OR "None"

### Next Steps:
- [next action with estimated time]

### Estimated Completion:
[time estimate, e.g., "2 hours remaining", "on track for deadline"]

---
**Reported to:** [Audit-1 / Audit-2]
**Next Checkpoint:** [25% / 50% / 75% / Final Review]
```

### Status Definitions

| Status | Definition | Action Required |
|--------|------------|-----------------|
| `started` | Work has begun, initial setup complete | None - normal |
| `in_progress` | Active work ongoing | None - normal |
| `blocked` | Cannot proceed without assistance | **Escalate immediately** |
| `completed` | All acceptance criteria met | Schedule final review |

---

## 3. Updated PENDING_TASKS.md Format

Each task entry in PENDING_TASKS.md must now include an `audit_checkpoints` field:

### Task Entry Format

```markdown
### **TASK-XXX: [Task Title]**
- **Assigned:** [Agent Name] ✅ ASSIGNED TO SUBAGENT (if applicable)
- **Due:** [Date/Time]
- **Status:** [⏳ NOT STARTED / 🟢 IN PROGRESS / 🔴 BLOCKED / ✅ COMPLETED]
- **Priority:** [P0/P1/P2/P3]
- **Description:** [Detailed description]
- **Acceptance Criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Audit Checkpoints:**
  - [ ] 25% - [Agent] reported to Audit-1 on [date]
  - [ ] 50% - [Agent] reported to Audit-1 on [date]
  - [ ] 75% - [Agent] reported to Audit-2 on [date]
  - [ ] Final - [Agent] reviewed by Audit-1 on [date]
- **Progress Reports:**
  - `/mission-control/audit/progress-reports/TASK-XXX-25-2026-02-18.md`
  - `/mission-control/audit/progress-reports/TASK-XXX-50-2026-02-18.md`
- **Blockers:** [None / specific blockers]
- **Notes:** [Additional context]
```

### Audit Checkpoint Field Specification

```yaml
audit_checkpoints:
  25_percent:
    reporter: "Agent Name"
    reviewer: "Audit-1"
    status: "pending|complete"
    date: "ISO 8601 timestamp"
    report_path: "/mission-control/audit/progress-reports/TASK-XXX-25-[timestamp].md"
  50_percent:
    reporter: "Agent Name"
    reviewer: "Audit-1"
    status: "pending|complete"
    date: "ISO 8601 timestamp"
    report_path: "/mission-control/audit/progress-reports/TASK-XXX-50-[timestamp].md"
  75_percent:
    reporter: "Agent Name"
    reviewer: "Audit-2"
    status: "pending|complete"
    date: "ISO 8601 timestamp"
    report_path: "/mission-control/audit/progress-reports/TASK-XXX-75-[timestamp].md"
  final_review:
    reporter: "Agent Name"
    reviewer: "Audit-1"
    status: "pending|complete"
    date: "ISO 8601 timestamp"
    report_path: "/mission-control/audit/progress-reports/TASK-XXX-final-[timestamp].md"
```

---

## 4. Workflow Process

### Phase 1: Task Assignment

1. **Nexus creates task** with full delegation template
2. **Nexus updates PENDING_TASKS.md** with audit_checkpoints field
3. **Nexus spawns subagent** (if task complexity warrants it)
4. **Agent acknowledges** receipt and confirms understanding

### Phase 2: Progress Monitoring

```
[Task Start]
    ↓
[25% Checkpoint] → Report to Audit-1 → Update PENDING_TASKS.md
    ↓
[50% Checkpoint] → Report to Audit-1 → Update PENDING_TASKS.md
    ↓
[75% Checkpoint] → Report to Audit-2 → Update PENDING_TASKS.md
    ↓
[Final Review] → Review by Audit-1 → Mark COMPLETE
```

### Phase 3: Audit Review Responsibilities

#### Audit-1 Responsibilities
- Review 25%, 50%, and final completion checkpoints
- Verify acceptance criteria are met
- Approve task completion
- Flag quality issues

#### Audit-2 Responsibilities
- Review 75% checkpoint (pre-completion quality gate)
- Validate work is on track for final delivery
- Identify any risks before final review

### Phase 4: Completion

1. Agent submits final progress report
2. Audit-1 reviews against acceptance criteria
3. If approved:
   - Mark task as ✅ COMPLETED in PENDING_TASKS.md
   - Update all audit checkpoint statuses
   - Archive progress reports
4. If rejected:
   - Document issues in final report
   - Return to agent for corrections
   - Schedule re-review

---

## 5. Directory Structure

```
/mission-control/
├── audit/
│   ├── progress-reports/           # Agent progress reports
│   │   ├── TASK-001-25-2026-02-18.md
│   │   ├── TASK-001-50-2026-02-18.md
│   │   ├── TASK-001-75-2026-02-18.md
│   │   └── TASK-001-final-2026-02-18.md
│   ├── audit-1-reviews/            # Audit-1 review notes
│   ├── audit-2-reviews/            # Audit-2 review notes
│   └── DELEGATION_WORKFLOW.md      # This file
├── docs/
│   └── audit-url-standard.md       # Audit configuration reference
└── PENDING_TASKS.md                # Task tracking with audit fields
```

---

## 6. Escalation Procedures

### Blocked Status Escalation

When an agent reports `blocked` status:

1. **Immediate:** Agent submits progress report with detailed blocker description
2. **Within 1 hour:** Audit-1 reviews and attempts resolution
3. **If unresolved:** Escalate to Nexus with:
   - Task ID and context
   - Blocker description
   - Attempted resolutions
   - Recommended next steps

### Missed Checkpoint Escalation

If a checkpoint is missed:

| Delay | Action |
|-------|--------|
| 1 hour overdue | Audit-1 sends reminder to agent |
| 4 hours overdue | Audit-1 reports to Nexus |
| 8 hours overdue | Nexus reassigns or extends deadline |
| 24 hours overdue | Escalate to EricF (Commander) |

---

## 7. Quality Standards

### Progress Report Quality Checklist

- [ ] Uses correct template format
- [ ] Specific deliverables listed (not vague statements)
- [ ] Issues include impact assessment
- [ ] Next steps have time estimates
- [ ] File saved to correct directory
- [ ] PENDING_TASKS.md updated with report path

### Audit Review Quality Checklist

- [ ] Acceptance criteria reviewed against deliverables
- [ ] Code quality verified (for dev tasks)
- [ ] Documentation complete
- [ ] No security vulnerabilities introduced
- [ ] Performance impact assessed (if applicable)

---

## 8. Example Workflow

### Task Assignment

```
🔔 TASK ASSIGNED to Forge-1

Task: TASK-075 - Optimize index.html Performance
Priority: P1
Due: Feb 19, 5:00 PM

📊 AUDIT CHECKPOINTS:
- Report to Audit-1 at 25% progress
- Report to Audit-1 at 50% progress
- Report to Audit-2 at 75% progress
- Final review by Audit-1 at completion

📋 REPORTING FORMAT:
Send progress updates to: /mission-control/audit/progress-reports/
Include: % complete, what was done, any blockers

✅ ACCEPTANCE CRITERIA:
- [ ] index.html file size reduced from 53KB to under 40KB
- [ ] All functionality preserved
- [ ] Page loads correctly in browser
- [ ] No console errors

🎯 BEGIN WORK
```

### PENDING_TASKS.md Entry

```markdown
### **TASK-075: Optimize index.html Performance**
- **Assigned:** Forge-1
- **Due:** Feb 19, 5:00 PM
- **Status:** 🟢 IN PROGRESS
- **Priority:** P1
- **Description:** Reduce file size from 53KB to under 40KB
- **Acceptance Criteria:**
  - [ ] index.html under 40KB
  - [ ] All functionality preserved
  - [ ] Page loads correctly
- **Audit Checkpoints:**
  - [ ] 25% - Forge-1 reported to Audit-1 on 2026-02-18T14:00:00+08:00
  - [ ] 50% - Forge-1 reported to Audit-1 on 2026-02-18T16:00:00+08:00
  - [ ] 75% - Forge-1 reported to Audit-2 on 2026-02-18T18:00:00+08:00
  - [ ] Final - Forge-1 reviewed by Audit-1 on 2026-02-19T17:00:00+08:00
- **Progress Reports:**
  - `/mission-control/audit/progress-reports/TASK-075-25-2026-02-18.md`
- **Blockers:** None
- **Notes:** Started analysis of file structure
```

---

## 9. Migration Guide

### Existing Tasks

For tasks created before this workflow:

1. **Do not retroactively add audit checkpoints** to completed tasks
2. **Add audit checkpoints** to in-progress tasks at next convenient milestone
3. **Use new format** for all new task assignments immediately

### PENDING_TASKS.md Updates

When updating existing PENDING_TASKS.md entries:

```markdown
<!-- OLD FORMAT -->
### **TASK-XXX: Task Name**
- **Assigned:** Agent
- **Due:** Date
- **Status:** Status

<!-- NEW FORMAT -->
### **TASK-XXX: Task Name**
- **Assigned:** Agent
- **Due:** Date
- **Status:** Status
- **Audit Checkpoints:**
  - [ ] 25% - pending
  - [ ] 50% - pending
  - [ ] 75% - pending
  - [ ] Final - pending
```

---

## 10. Compliance Tracking

### Weekly Audit Summary

Every Monday at 9:00 AM HKT, Audit-1 generates:

```markdown
## Weekly Audit Compliance Report
**Week:** [Date Range]
**Generated by:** Audit-1

### Checkpoint Compliance
| Task ID | Agent | 25% | 50% | 75% | Final | Status |
|---------|-------|-----|-----|-----|-------|--------|
| TASK-075 | Forge-1 | ✅ | ✅ | ✅ | ⏳ | On Track |
| TASK-076 | Forge-2 | ✅ | ✅ | ❌ | - | At Risk |

### Issues Identified
- TASK-076: 75% checkpoint 2 hours overdue

### Recommendations
- Follow up with Forge-2 on TASK-076
```

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-17 | Initial delegation workflow | Nexus |
| 2.0 | 2026-02-18 | Added audit checkpoints, progress reports, compliance tracking | Nexus |

---

**Next Review Date:** 2026-03-18  
**Approved by:** Nexus (Air1ck3ff)  
**Distribution:** All Mission Control Agents
