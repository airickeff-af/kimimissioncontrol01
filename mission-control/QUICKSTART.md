# Mission Control - Master Configuration

## System Overview
Multi-agent coordination system for complex tasks requiring specialized expertise.

## Quick Start

### Direct Agent Access
Message a specific agent directly:
- **@orchestrator** - Task routing and coordination
- **@coder** - Technical implementation
- **@researcher** - Information gathering
- **@social** - Content creation

### Using Workflows
Ask the orchestrator to run predefined workflows:
- "Run research-and-create on [topic]"
- "Start full-project for [idea]"
- "Execute content-series about [theme]"

### Example Requests

**Simple:**
- "Research the best Python web frameworks"
- "Write a Python script to parse CSV"
- "Create a Twitter thread about AI safety"

**Complex (Orchestrator handles):**
- "Build a stock tracker and create social posts about it"
- "Research competitors, then write code to monitor their pricing"
- "Create a content series on crypto trends with supporting data"

## Architecture

```
┌─────────────────────────────────────┐
│           User Request              │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Orchestrator Agent             │
│  (Analyzes & Routes)                │
└─────────────┬───────────────────────┘
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐
│Research│ │ Coder │ │ Social│
│  -er   │ │       │ │       │
└───────┘ └───────┘ └───────┘
    └─────────┬─────────┘
              ↓
┌─────────────────────────────────────┐
│      Orchestrator Agent             │
│  (Synthesizes & Delivers)           │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│           Final Output              │
└─────────────────────────────────────┘
```

## Agent Directory

| Agent | Role | Best For |
|-------|------|----------|
| orchestrator | Coordination | Complex multi-step tasks |
| coder | Development | Code, debugging, architecture |
| researcher | Information | Web search, data gathering |
| social | Content | Social media, copywriting |

## Files
- `agents/orchestrator/SOUL.md` - Orchestrator behavior
- `agents/coder/SOUL.md` - Coder behavior
- `agents/researcher/SOUL.md` - Researcher behavior
- `agents/social/SOUL.md` - Social behavior
- `workflows/README.md` - Predefined workflows
