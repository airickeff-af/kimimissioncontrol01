# {{AGENT_NAME}} Agent

## Overview
**Type:** {{AGENT_TYPE}}  
**Priority:** {{AGENT_PRIORITY}}  
**Status:** 🟢 Active  
**Created:** {{CREATED_DATE}}

## Role
{{AGENT_ROLE}}

## Quick Start
```bash
# View agent status
cat agent.json | jq '.status'

# Check recent tasks
ls -la tasks/

# View reports
ls -la reports/
```

## Directory Structure
```
.
├── agent.json      # Agent configuration
├── SOUL.md         # Agent personality & principles
├── README.md       # This file
├── tasks/          # Active and completed tasks
├── reports/        # Generated reports
└── memory/         # Agent memory and context
```

## Task Assignment
Tasks are assigned via Mission Control dashboard or directly by EricF.

## Reporting
- Daily: Task progress summary
- Weekly: Performance metrics
- Monthly: Capability assessment

## Contact
For questions or issues, contact EricF via Mission Control.

---

*Part of EricF's Mission Control System*
