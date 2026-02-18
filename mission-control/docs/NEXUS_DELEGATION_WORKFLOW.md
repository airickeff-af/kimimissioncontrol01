# Nexus Task Delegation with Audit Integration

## Overview
Updated task delegation workflow that includes audit checkpoints throughout task execution.

## Delegation Template

When Nexus assigns a task, use this format:

```
🎯 TASK ASSIGNED: [TASK-XXX]

📋 TASK DETAILS:
- Title: [Task Title]
- Priority: P0/P1/P2
- Due: [Date/Time]
- Assigned to: [Agent Name]

🔔 AUDIT CHECKPOINTS (REQUIRED):
✓ Report to Audit-1 at 25% progress
✓ Report to Audit-1 at 50% progress
✓ Report to Audit-2 at 75% progress
✓ Final review by Audit-2 at 100% completion

📊 REPORTING INSTRUCTIONS:
Use: require('./mission-control/lib/report-to-audit')
Save to: /mission-control/audit/progress-reports/
Format: JSON with agent, task, progress, status, details

🎯 ACCEPTANCE CRITERIA:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

⚠️ QUALITY STANDARD: 95/100 minimum

🚀 BEGIN WORK - Report "started" to audit now!
```

## Progress Report Format

Agents must create JSON files at each checkpoint:

```json
{
  "agent": "Forge-1",
  "task": "TASK-067",
  "timestamp": "2026-02-18T20:00:00+08:00",
  "progress": 50,
  "status": "in_progress",
  "details": "Theme applied to 4 of 7 pages",
  "issues": ["CORS error on /api/tasks"],
  "next_steps": "Fix CORS and continue with remaining pages",
  "estimated_completion": "2 hours"
}
```

## Quick Report Functions

```javascript
const { quickReports } = require('./mission-control/lib/report-to-audit');

// At task start
await quickReports.started('Forge-1', 'TASK-067', 'Starting theme unification');

// At 50%
await quickReports.half('Forge-1', 'TASK-067', '4 pages done, 3 remaining');

// At completion
await quickReports.completed('Forge-1', 'TASK-067', 'All 7 pages themed!');

// If blocked
await quickReports.blocked('Forge-1', 'TASK-067', 'Waiting for API fix', ['API 404 error']);
```

## Audit Agent Responsibilities

### Audit-1 (Primary Reviewer)
- Reviews 25% checkpoint - validates direction
- Reviews 50% checkpoint - checks progress vs plan
- Provides feedback and guidance
- Flags issues early

### Audit-2 (Final Reviewer)
- Reviews 75% checkpoint - quality check
- Reviews 100% completion - final verification
- Assigns quality score (0-100)
- Approves or requests fixes

## Benefits

1. **Early Issue Detection** - Problems caught at 25%, not 100%
2. **Better Guidance** - Audit can steer agents mid-task
3. **Higher Quality** - Multiple review points catch more issues
4. **Accurate ETAs** - Progress tracking improves estimates
5. **Transparency** - Real-time visibility into all work

## Integration with PENDING_TASKS.md

Add audit tracking to each task:

```markdown
### TASK-067: Unified Theme All Pages
- **Priority:** P1
- **Assigned:** Forge-1, Forge-2, Forge-3
- **Due:** Feb 19, 12:00 PM

**Audit Checkpoints:**
- [ ] 25% - Review by Audit-1
- [ ] 50% - Review by Audit-1
- [ ] 75% - Review by Audit-2
- [ ] 100% - Final review by Audit-2

**Quality Score Target:** 95/100
```

## Monitoring

View real-time progress at:
**https://dashboard-ten-sand-20.vercel.app/audit-monitor.html**

## Example Workflow

1. **Nexus assigns TASK-067 to Forge-1**
2. **Forge-1 reports "started"** → Audit-1 notified
3. **At 25%, Forge-1 reports progress** → Audit-1 reviews, gives feedback
4. **At 50%, Forge-1 reports progress** → Audit-1 reviews, validates direction
5. **At 75%, Forge-1 reports progress** → Audit-2 reviews, quality check
6. **At 100%, Forge-1 reports completion** → Audit-2 final review, assigns score
7. **Task complete with quality score 96/100**

---
*Updated: 2026-02-18*
*Version: 2.0 (with Audit Integration)*
