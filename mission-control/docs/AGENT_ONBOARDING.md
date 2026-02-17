# Agent Onboarding Flow - Documentation

## Overview

The Agent Onboarding Flow provides a streamlined, one-command process for creating new agents in EricF's Mission Control system.

## Quick Start

### Create a New Agent

```bash
# Basic usage
cd /root/.openclaw/workspace/mission-control/scripts
./create-agent.sh scout

# With options
./create-agent.sh analyst \
  --type specialist \
  --role "Market Research Analyst" \
  --priority P1 \
  --dashboard \
  --cron "0 9 * * *"
```

## Features

### 1. One-Command Creation
Single command creates complete agent structure with all necessary files.

### 2. Auto-Generated Files
- `agent.json` - Configuration and metadata
- `SOUL.md` - Personality and operating principles
- `README.md` - Documentation and quick start
- `WELCOME.txt` - Personalized welcome message
- `tasks/` - Task directory with initial onboarding task
- `reports/` - Report directory
- `memory/` - Memory and context storage
- `training/` - Training materials

### 3. Dashboard Integration
Optional automatic addition to Mission Control dashboard with:
- Agent card creation
- Metrics tracking
- Quick action buttons

### 4. Cron Job Setup
Optional scheduled task execution with configurable intervals.

### 5. Registry Management
Automatic updates to agent registry for system-wide tracking.

## Command Reference

### Syntax
```
./create-agent.sh <agent-name> [options]
```

### Options
| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| --type | -t | Agent type | `-t specialist` |
| --role | -r | Role description | `-r "Data Analyst"` |
| --priority | -p | Priority level | `-p P1` |
| --dashboard | -d | Add to dashboard | `-d` |
| --cron | -c | Cron schedule | `-c "0 9 * * *"` |
| --help | -h | Show help | `-h` |

### Agent Types
- **worker**: General-purpose task executor
- **specialist**: Domain-specific expert
- **manager**: Coordinates other agents
- **scout**: Proactive research and monitoring
- **sentry**: Alert and monitoring systems

### Priority Levels
- **P0-Critical**: Immediate attention
- **P1-High**: Within 24 hours
- **P2-Medium**: Within 3-5 days (default)
- **P3-Low**: When possible

## Directory Structure

```
mission-control/
├── scripts/
│   └── create-agent.sh          # Main creation script
├── templates/
│   └── agent-template/
│       ├── agent.json           # Config template
│       ├── SOUL.md              # Personality template
│       └── README.md            # Documentation template
├── agents/
│   └── {agent-name}/
│       ├── agent.json           # Agent configuration
│       ├── SOUL.md              # Agent personality
│       ├── README.md            # Agent documentation
│       ├── WELCOME.txt          # Welcome message
│       ├── cron.conf            # Cron configuration (if enabled)
│       ├── tasks/               # Task files
│       ├── reports/             # Generated reports
│       ├── memory/              # Agent memory
│       └── training/            # Training materials
└── dashboard/
    ├── agents.json              # Dashboard registry
    └── agent-cards/
        └── {agent-name}.json    # Agent dashboard card
```

## Onboarding Process

### Phase 1: Creation (Automated)
1. Script validates agent name
2. Creates directory structure
3. Generates configuration files
4. Creates initial onboarding task
5. Sets up cron jobs (if requested)
6. Adds to dashboard (if requested)
7. Updates registry

### Phase 2: Agent Setup (Manual)
1. Agent reads WELCOME.txt
2. Reviews SOUL.md for personality
3. Checks agent.json configuration
4. Completes onboarding task checklist
5. Tests communication channels

### Phase 3: Integration (Collaborative)
1. EricF assigns first real task
2. Agent establishes workflow
3. Regular reporting begins
4. Performance tracking starts

## Integration Points

### Mission Control Dashboard
Agents are automatically integrated with:
- Status monitoring
- Task tracking
- Performance metrics
- Quick actions

### Task System
- Tasks stored in `tasks/` directory
- JSON format for structured data
- Checklist support for complex tasks
- Priority and deadline tracking

### Cron System
- Optional automated execution
- Configurable schedules
- Logging to `logs/cron.log`
- Easy modification via `crontab -e`

### Registry
- System-wide agent tracking
- Creation history
- Path references
- Last updated timestamps

## Best Practices

### Naming Conventions
- Use lowercase letters
- Separate words with hyphens
- Be descriptive but concise
- Examples: `market-scout`, `data-analyst`, `alert-sentry`

### Role Definitions
- Clear and specific
- Action-oriented
- Measurable outcomes
- Aligned with capabilities

### Priority Assignment
- P0: System-critical functions only
- P1: High-value, time-sensitive tasks
- P2: Standard operational tasks
- P3: Nice-to-have improvements

## Troubleshooting

### Agent Already Exists
```bash
# Remove existing agent (caution!)
rm -rf /mission-control/agents/{agent-name}

# Or choose a different name
./create-agent.sh {agent-name}-v2
```

### Permission Issues
```bash
# Ensure script is executable
chmod +x /mission-control/scripts/create-agent.sh
```

### Dashboard Not Updating
```bash
# Install jq for JSON manipulation
apt-get install jq  # Ubuntu/Debian
brew install jq     # macOS
```

## Examples

### Create a Scout Agent
```bash
./create-agent.sh market-scout \
  --type scout \
  --role "Monitor crypto and NFT markets for opportunities" \
  --priority P1 \
  --dashboard \
  --cron "0 */6 * * *"
```

### Create a Sentry Agent
```bash
./create-agent.sh system-sentry \
  --type sentry \
  --role "Monitor system health and alert on issues" \
  --priority P0 \
  --dashboard \
  --cron "*/15 * * * *"
```

### Create a Specialist Agent
```bash
./create-agent.sh content-specialist \
  --type specialist \
  --role "Create and optimize social media content" \
  --priority P2 \
  --dashboard
```

## Maintenance

### Updating Agent Configuration
Edit `agent.json` directly or use Mission Control dashboard.

### Modifying Cron Jobs
```bash
# Edit crontab
crontab -e

# Or update cron.conf and reapply
crontab /mission-control/agents/{agent-name}/cron.conf
```

### Removing an Agent
```bash
# Remove agent directory
rm -rf /mission-control/agents/{agent-name}

# Remove from crontab
crontab -l | grep -v {agent-name} | crontab -

# Update dashboard registry
# (Manual edit of dashboard/agents.json)
```

## Support

For issues or questions:
1. Check this documentation
2. Review example agents in `/mission-control/agents/`
3. Consult the onboarding checklist
4. Contact EricF via Mission Control

---

*Part of EricF's Mission Control System*
