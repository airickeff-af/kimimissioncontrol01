# Audit Directory

**Purpose:** Store all audit-related files, progress reports, and review notes  
**Owner:** Audit-1, Audit-2  
**Created:** 2026-02-18

---

## Directory Structure

```
/mission-control/audit/
├── README.md                       # This file
├── progress-reports/               # Agent progress reports
│   ├── EXAMPLE-25.md              # Example 25% checkpoint report
│   └── TASK-XXX-[checkpoint]-[timestamp].md
├── audit-1-reviews/                # Audit-1 review notes
├── audit-2-reviews/                # Audit-2 review notes
└── DELEGATION_WORKFLOW.md          # Full workflow documentation (in /docs/)
```

---

## Progress Reports

**Location:** `/mission-control/audit/progress-reports/`

Agents submit progress reports at each checkpoint:
- 25% → Audit-1
- 50% → Audit-1
- 75% → Audit-2
- Final → Audit-1

**Filename format:** `TASK-XXX-[checkpoint]-[timestamp].md`

**Template:** `/mission-control/templates/PROGRESS_REPORT_TEMPLATE.md`

---

## Review Notes

### Audit-1 Reviews
**Location:** `/mission-control/audit/audit-1-reviews/`

Audit-1 documents:
- 25% checkpoint reviews
- 50% checkpoint reviews
- Final completion reviews
- Quality assessments
- Issue escalations

### Audit-2 Reviews
**Location:** `/mission-control/audit/audit-2-reviews/`

Audit-2 documents:
- 75% checkpoint reviews
- Pre-completion quality gates
- Risk assessments

---

## Quick Links

- [Full Delegation Workflow](/mission-control/docs/DELEGATION_WORKFLOW.md)
- [Agent Quick Reference](/mission-control/docs/AGENT_AUDIT_QUICKREF.md)
- [Progress Report Template](/mission-control/templates/PROGRESS_REPORT_TEMPLATE.md)
- [PENDING_TASKS.md](/root/.openclaw/workspace/PENDING_TASKS.md)

---

## Compliance Tracking

Weekly audit compliance reports are generated every Monday at 9:00 AM HKT.

**Report location:** `/mission-control/audit/audit-1-reviews/weekly-compliance-[date].md`

---

**Last Updated:** 2026-02-18
