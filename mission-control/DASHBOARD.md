# Mission Control Dashboard

## 🎯 System Status

### Chain of Command
```
┌─────────────────────────────────────────┐
│ 👤 EricF                                │
│ Commander-in-Chief                      │
│ Telegram: @EricclFung                   │
│ ID: 1508346957                          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ 🤖 Air1ck3ff (Nexus)                    │
│ Orchestrator / Second-in-Command        │
│ Status: ✅ ONLINE                       │
│ Role: Task routing & coordination       │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ↓              ↓              ↓
┌────────┐   ┌────────┐   ┌────────┐
│ Forge  │   │ Scout  │   │  Buzz  │
│ Coder  │   │Research│   │ Social │
│✅ONLINE│   │✅ONLINE│   │✅ONLINE│
└────────┘   └────────┘   └────────┘
```

## 🤖 Agent Registry

| Agent | Role | Session Key | Status | Specialization |
|-------|------|-------------|--------|----------------|
| **Air1ck3ff** | Nexus/Orchestrator | main | 🟢 Active | Coordination, routing |
| **Forge** | Coder | `agent:main:subagent:e92eaad9-e026-4807-b853-0f3ee11fe1d9` | 🟢 Active | Software development |
| **Scout** | Researcher | `agent:main:subagent:6a0dddcd-ea6a-41ab-a74e-27085482c97f` | 🟢 Active | Information gathering |
| **Buzz** | Social | `agent:main:subagent:bfa7d15c-1474-409a-afca-e20c56d1b6b7` | 🟢 Active | Content creation |
| **Audit** | QA | `agent:main:subagent:755eeee1-204d-44c1-b211-fe6c70df475e` | 🟢 Active | Quality assurance |

## 📡 Communication Protocols

### 1. Commander → Nexus
**Channel:** Telegram DM to @Air1ck3ff
**Format:** Natural language requests
**Examples:**
- "Build a crypto tracker"
- "Research AI trends and create a thread"
- "Debug this Python error"

### 2. Nexus → Agents
**Method:** Direct session routing
**Format:** Task assignments with context
**Process:**
1. Nexus analyzes request
2. Determines required agents
3. Spawns/routes to appropriate agents
4. Collects results
5. Synthesizes final output

### 3. Agents → Nexus
**Method:** Session completion reports
**Format:** Structured output with findings/code/content

### 4. Nexus → Commander
**Channel:** Telegram DM from @Air1ck3ff
**Format:** Final synthesized results

## 🔄 Active Workflows

| Workflow ID | Status | Agents Involved | Started |
|-------------|--------|-----------------|---------|
| (None active) | - | - | - |

## 📊 Agent Capabilities Quick Reference

### Forge (Coder)
```
Best for:
✓ Writing code (any language)
✓ Debugging and troubleshooting
✓ API integrations
✓ Database design
✓ Technical architecture
✓ Code review

Contact: Session agent:main:subagent:e92eaad9-e026-4807-b853-0f3ee11fe1d9
```

### Scout (Researcher)
```
Best for:
✓ Web searches
✓ Data gathering
✓ Fact checking
✓ Competitive analysis
✓ Documentation lookup
✓ Trend monitoring

Contact: Session agent:main:subagent:6a0dddcd-ea6a-41ab-a74e-27085482c97f
```

### Buzz (Social)
```
Best for:
✓ Social media posts
✓ Content calendars
✓ Platform optimization
✓ Hashtag strategy
✓ Engagement copy
✓ Content series

Contact: Session agent:main:subagent:bfa7d15c-1474-409a-afca-e20c56d1b6b7
```

## 🖥️ Mission Control Dashboard (Web UI)

A real-time web dashboard for monitoring all agents and system activity.

### Features
- **Live Agent Status** - See all agents at a glance
- **Activity Feed** - Real-time updates from all agents
- **Task Queue** - View pending and completed tasks
- **System Logs** - Live terminal output
- **Statistics** - Track performance metrics

### Access the Dashboard

**Option 1: Local Access**
```bash
cd /root/.openclaw/workspace/mission-control/dashboard
./start-dashboard.sh
```
Then open: http://localhost:8080

**Option 2: Via OpenClaw Gateway**
The dashboard is also accessible through the OpenClaw web interface at:
http://127.0.0.1:18789/dashboard/

### Dashboard Preview
```
┌─────────────────────────────────────────────────────────────┐
│  Mission Control Dashboard                    [System Online]│
├─────────────────────────────────────────────────────────────┤
│  📊 Overview                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │Agents  │ │Tasks   │ │Pending │ │Uptime  │               │
│  │   4    │ │   3    │ │   0    │ │ 00:15  │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
├─────────────────────────────────────────────────────────────┤
│  🤖 Agent Status                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ ◈ Nexus      │ │ ⚒️ Forge      │ │ 🔍 Scout      │        │
│  │ ● Online     │ │ ● Online     │ │ ● Online     │        │
│  │ 12 tasks     │ │ 0 tasks      │ │ 0 searches   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐                                            │
│  │ 📢 Buzz       │                                            │
│  │ ● Online     │                                            │
│  │ 0 posts      │                                            │
│  └──────────────┘                                            │
├─────────────────────────────────────────────────────────────┤
│  📋 Recent Activity                                          │
│  [10 min ago] Mission Control system deployed               │
│  [12 min ago] Buzz agent initialized                        │
│  [13 min ago] Forge agent initialized                       │
├─────────────────────────────────────────────────────────────┤
│  📝 Live Logs                                                │
│  [06:45:00] [Nexus] INFO Mission Control dashboard init...  │
│  [06:44:00] [Buzz]  INFO Agent initialized and ready       │
└─────────────────────────────────────────────────────────────┘
```

### Option 1: Message Nexus (Air1ck3ff)
Just tell me what you want, and I'll coordinate the agents:
- "Build a stock tracker with Twitter integration"
- "Research competitors and create content about them"
- "Write a Python script and document it"

### Option 2: Message Agents Directly
For focused tasks, message specific agents:
- Message Forge: "Write a script to parse JSON"
- Message Scout: "Find the best APIs for weather data"
- Message Buzz: "Create a LinkedIn post about AI"

### Audit (QA)
```
Best for:
✓ Output quality verification
✓ Factual accuracy checks
✓ Consistency reviews
✓ Error detection
✓ Cross-division auditing
✓ Quality standards enforcement

Contact: Session agent:main:subagent:755eeee1-204d-44c1-b211-fe6c70df475e
```

### Option 3: Predefined Workflows
Ask Nexus to run a workflow:
- "Run workflow:research-and-create on [topic]"
- "Execute workflow:full-project for [idea]"

## 📁 File Structure

```
/root/.openclaw/workspace/mission-control/
├── DASHBOARD.md          ← This file
├── README.md             # System overview
├── QUICKSTART.md         # Quick reference
├── agents/
│   ├── orchestrator/     # Nexus (Air1ck3ff) config
│   ├── coder/            # Forge config
│   ├── researcher/       # Scout config
│   ├── social/           # Buzz config
│   └── audit/            # Audit (QA) config
└── workflows/            # Predefined workflows
```

## 📝 Recent Activity Log

| Time | Event | Details |
|------|-------|---------|
| 2026-02-17 07:08 | Audit (QA) deployed | Quality assurance agent initialized and baseline audit completed |
| 2026-02-17 06:45 | System initialized | All agents spawned and online |
| 2026-02-17 06:45 | Dashboard created | Mission Control dashboard established |

---
*Last updated: 2026-02-17 07:08 GMT+8*
*System: Mission Control v1.0*
*Commander: EricF*
