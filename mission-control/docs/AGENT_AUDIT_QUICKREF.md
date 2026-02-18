# Quick Reference: Audit Checkpoint Workflow

**For:** All Mission Control Agents  
**Reference:** Full docs at `/mission-control/docs/DELEGATION_WORKFLOW.md`

---

## When You Receive a Task

1. **Acknowledge receipt** in your assigned channel
2. **Review audit checkpoints** in the assignment message
3. **Confirm understanding** of acceptance criteria
4. **Begin work** 🎯

---

## Checkpoint Schedule

```
[Task Start]
    ↓ ~25% of estimated time
[25% Checkpoint] → Report to Audit-1
    ↓ ~50% of estimated time
[50% Checkpoint] → Report to Audit-1
    ↓ ~75% of estimated time
[75% Checkpoint] → Report to Audit-2
    ↓ ~100% of estimated time
[Final Review] → Review by Audit-1
```

---

## How to Submit a Progress Report

### 1. Create the Report File

**Location:** `/mission-control/audit/progress-reports/`

**Filename format:** `TASK-XXX-[checkpoint]-[timestamp].md`

Example: `TASK-075-25-2026-02-18T210000.md`

### 2. Use the Template

Copy from: `/mission-control/templates/PROGRESS_REPORT_TEMPLATE.md`

```markdown
## Progress Report: TASK-075

**Agent:** Forge-1
**Timestamp:** 2026-02-18T21:00:00+08:00
**Progress:** 25%
**Status:** in_progress

### Work Completed:
- Analyzed index.html structure
- Identified optimization opportunities
- Created minification plan

### Issues Encountered:
- None

### Next Steps:
- Apply CSS minification (30 min)
- Apply JavaScript minification (30 min)

### Estimated Completion:
On track for deadline

---
**Reported to:** Audit-1
**Next Checkpoint:** 50%
```

### 3. Update PENDING_TASKS.md

Find your task and update the audit checkpoint:

```markdown
- **Audit Checkpoints:**
  - [x] 25% - Forge-1 reported to Audit-1 on 2026-02-18T21:00:00+08:00
  - [ ] 50% - pending
  - [ ] 75% - pending
  - [ ] Final - pending
```

### 4. Notify Your Auditor

- **25% & 50%:** Message Audit-1
- **75%:** Message Audit-2
- **Final:** Message Audit-1 for review

---

## Status Definitions

| Status | Use When | Action Required |
|--------|----------|-----------------|
| `started` | Initial setup complete | None |
| `in_progress` | Active work ongoing | None |
| `blocked` | Cannot proceed | **Escalate immediately** |
| `completed` | All criteria met | Schedule final review |

---

## If You Get Blocked

1. **Submit progress report** immediately with `blocked` status
2. **Describe the blocker** with impact assessment
3. **Tag Audit-1** in your channel
4. **Wait for resolution** or further instructions

---

## Quick Checklist

- [ ] I understand the acceptance criteria
- [ ] I know my checkpoint schedule
- [ ] I know where to save progress reports
- [ ] I know who to report to at each checkpoint
- [ ] I will report blockers immediately

---

## Need Help?

- **Template issues:** Check `/mission-control/templates/PROGRESS_REPORT_TEMPLATE.md`
- **Workflow questions:** Read `/mission-control/docs/DELEGATION_WORKFLOW.md`
- **Escalation:** Contact Nexus directly
