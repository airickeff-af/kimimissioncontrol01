# demo-agent Agent

## Overview
**Type:** worker  
**Priority:** P2  
**Status:** 🟢 Active  
**Created:** 2026-02-18

## Role
Demonstration agent for onboarding flow

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
