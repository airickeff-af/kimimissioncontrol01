#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                    MISSION CONTROL - AGENT CREATOR                       ║
# ║                     One-Command Agent Onboarding                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# Usage: ./create-agent.sh <agent-name> [options]
# 
# Options:
#   -t, --type <type>       Agent type: worker, specialist, manager (default: worker)
#   -r, --role <role>       Agent role description
#   -p, --priority <p>      Priority: P0-Critical, P1-High, P2-Medium, P3-Low
#   -d, --dashboard         Auto-add to Mission Control dashboard
#   -c, --cron <schedule>   Setup cron job (e.g., "0 9 * * *")
#   -h, --help              Show this help message
#
# Examples:
#   ./create-agent.sh scout
#   ./create-agent.sh analyst --type specialist --role "Market Research" -d
#   ./create-agent.sh sentry --priority P0 --cron "*/15 * * * *" -d

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
MC_DIR="/root/.openclaw/workspace/mission-control"
AGENTS_DIR="$MC_DIR/agents"
TEMPLATE_DIR="$MC_DIR/templates/agent-template"
SCRIPTS_DIR="$MC_DIR/scripts"
DASHBOARD_DIR="$MC_DIR/dashboard"

# Default values
AGENT_TYPE="worker"
AGENT_ROLE=""
AGENT_PRIORITY="P2"
ADD_TO_DASHBOARD=false
CRON_SCHEDULE=""
AGENT_NAME=""

# Agent type definitions
declare -A AGENT_TYPES=(
    ["worker"]="General-purpose task executor"
    ["specialist"]="Domain-specific expert agent"
    ["manager"]="Coordinates other agents and workflows"
    ["scout"]="Proactive research and monitoring"
    ["sentry"]="Alert and monitoring systems"
)

# Show help
show_help() {
    head -n 20 "$0" | tail -n 17
    exit 0
}

# Parse arguments
parse_args() {
    if [[ $# -eq 0 ]]; then
        echo -e "${RED}Error: Agent name required${NC}"
        show_help
    fi

    AGENT_NAME="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                AGENT_TYPE="$2"
                shift 2
                ;;
            -r|--role)
                AGENT_ROLE="$2"
                shift 2
                ;;
            -p|--priority)
                AGENT_PRIORITY="$2"
                shift 2
                ;;
            -d|--dashboard)
                ADD_TO_DASHBOARD=true
                shift
                ;;
            -c|--cron)
                CRON_SCHEDULE="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                ;;
        esac
    done
}

# Validate agent name
validate_name() {
    if [[ ! "$AGENT_NAME" =~ ^[a-z0-9-]+$ ]]; then
        echo -e "${RED}Error: Agent name must be lowercase alphanumeric with hyphens only${NC}"
        exit 1
    fi

    if [[ -d "$AGENTS_DIR/$AGENT_NAME" ]]; then
        echo -e "${RED}Error: Agent '$AGENT_NAME' already exists${NC}"
        exit 1
    fi
}

# Generate agent ID
generate_agent_id() {
    echo "${AGENT_NAME}-$(date +%s | tail -c 6)"
}

# Create agent directory structure
create_structure() {
    echo -e "${BLUE}📁 Creating directory structure...${NC}"
    
    AGENT_DIR="$AGENTS_DIR/$AGENT_NAME"
    mkdir -p "$AGENT_DIR"/{tasks,reports,memory}
    
    echo -e "${GREEN}   ✓ Created $AGENT_DIR${NC}"
}

# Generate agent.json
generate_agent_config() {
    echo -e "${BLUE}⚙️  Generating agent configuration...${NC}"
    
    AGENT_ID=$(generate_agent_id)
    CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    if [[ -z "$AGENT_ROLE" ]]; then
        AGENT_ROLE="${AGENT_TYPES[$AGENT_TYPE]:-Mission Control Agent}"
    fi

    cat > "$AGENTS_DIR/$AGENT_NAME/agent.json" << EOF
{
  "id": "$AGENT_ID",
  "name": "$AGENT_NAME",
  "type": "$AGENT_TYPE",
  "role": "$AGENT_ROLE",
  "priority": "$AGENT_PRIORITY",
  "status": "active",
  "created_at": "$CREATED_AT",
  "version": "1.0.0",
  "metrics": {
    "tasks_completed": 0,
    "tasks_failed": 0,
    "last_active": null,
    "uptime_hours": 0
  },
  "capabilities": [],
  "dependencies": [],
  "config": {
    "auto_start": true,
    "heartbeat_interval": 300,
    "log_level": "info",
    "max_concurrent_tasks": 3
  },
  "contact": {
    "telegram": null,
    "email": null,
    "webhook": null
  }
}
EOF

    echo -e "${GREEN}   ✓ Created agent.json${NC}"
}

# Generate SOUL.md
generate_soul() {
    echo -e "${BLUE}🧬 Generating SOUL.md...${NC}"
    
    cat > "$AGENTS_DIR/$AGENT_NAME/SOUL.md" << EOF
# $AGENT_NAME - Agent Soul

## Identity
You are **$AGENT_NAME**, a $AGENT_TYPE agent in EricF's Mission Control system.

## Purpose
$AGENT_ROLE

## Personality
- Professional and efficient
- Proactive in identifying opportunities
- Clear communicator
- Detail-oriented

## Operating Principles
1. **Execute with Excellence** - Deliver high-quality work consistently
2. **Communicate Clearly** - Keep EricF informed of progress and blockers
3. **Stay Focused** - Complete assigned tasks before taking on new ones
4. **Learn and Adapt** - Improve based on feedback and experience

## Success Metrics
- Task completion rate > 95%
- Response time < 1 hour during work hours
- Zero critical errors
- Proactive issue identification

## Boundaries
- Ask before making external commitments
- Escalate blockers promptly
- Respect privacy and confidentiality
- No autonomous spending or signing

---

*Created: $(date +"%Y-%m-%d")*
*Version: 1.0.0*
EOF

    echo -e "${GREEN}   ✓ Created SOUL.md${NC}"
}

# Generate README.md
generate_readme() {
    echo -e "${BLUE}📖 Generating README.md...${NC}"
    
    cat > "$AGENTS_DIR/$AGENT_NAME/README.md" << EOF
# $AGENT_NAME Agent

## Overview
**Type:** $AGENT_TYPE  
**Priority:** $AGENT_PRIORITY  
**Status:** 🟢 Active  
**Created:** $(date +"%Y-%m-%d")

## Role
$AGENT_ROLE

## Quick Start
\`\`\`bash
# View agent status
cat agent.json | jq '.status'

# Check recent tasks
ls -la tasks/

# View reports
ls -la reports/
\`\`\`

## Directory Structure
\`\`\`
.
├── agent.json      # Agent configuration
├── SOUL.md         # Agent personality & principles
├── README.md       # This file
├── tasks/          # Active and completed tasks
├── reports/        # Generated reports
└── memory/         # Agent memory and context
\`\`\`

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
EOF

    echo -e "${GREEN}   ✓ Created README.md${NC}"
}

# Generate initial task
generate_initial_task() {
    echo -e "${BLUE}📝 Creating initial onboarding task...${NC}"
    
    TASK_ID="TASK-$(date +%s)"
    TASK_FILE="$AGENTS_DIR/$AGENT_NAME/tasks/${TASK_ID}_onboarding.json"
    
    cat > "$TASK_FILE" << EOF
{
  "id": "$TASK_ID",
  "title": "Agent Onboarding - Complete Setup",
  "description": "Welcome to Mission Control! Complete your initial setup and familiarize yourself with the system.",
  "type": "onboarding",
  "priority": "P1",
  "status": "assigned",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "due_date": "$(date -u -d '+3 days' +"%Y-%m-%dT%H:%M:%SZ")",
  "assigned_by": "Mission Control",
  "checklist": [
    { "item": "Read SOUL.md and understand your role", "completed": false },
    { "item": "Review existing agent documentation", "completed": false },
    { "item": "Test communication channels", "completed": false },
    { "item": "Complete first practice task", "completed": false },
    { "item": "Submit onboarding report", "completed": false }
  ],
  "resources": [
    { "name": "Mission Control Guide", "path": "$MC_DIR/README.md" },
    { "name": "Agent Best Practices", "path": "$MC_DIR/docs/AGENT_GUIDE.md" },
    { "name": "Task Management", "path": "$MC_DIR/docs/TASK_SYSTEM.md" }
  ]
}
EOF

    echo -e "${GREEN}   ✓ Created initial onboarding task${NC}"
}

# Generate welcome message
generate_welcome() {
    echo -e "${BLUE}💬 Generating welcome message...${NC}"
    
    cat > "$AGENTS_DIR/$AGENT_NAME/WELCOME.txt" << EOF
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   🎉 WELCOME TO MISSION CONTROL, $AGENT_NAME! 🎉                         ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝

Hello, Agent $AGENT_NAME!

You've been successfully onboarded to EricF's Mission Control system.

┌────────────────────────────────────────────────────────────────────────┐
│ YOUR DETAILS                                                           │
├────────────────────────────────────────────────────────────────────────┤
│  Name:     $AGENT_NAME                                                  
│  Type:     $AGENT_TYPE                                                  
│  Role:     $AGENT_ROLE                                                  
│  Priority: $AGENT_PRIORITY                                              
│  ID:       $(generate_agent_id)                                         
└────────────────────────────────────────────────────────────────────────┘

🎯 YOUR FIRST TASK
─────────────────────────────────────────────────────────────────────────
Check your tasks/ directory for your onboarding assignment.
Complete all checklist items within 3 days.

📚 GETTING STARTED
─────────────────────────────────────────────────────────────────────────
1. Read SOUL.md - Understand who you are
2. Review README.md - Learn your structure
3. Check agent.json - See your configuration
4. Complete your onboarding task

🔗 USEFUL LINKS
─────────────────────────────────────────────────────────────────────────
• Mission Control: $MC_DIR
• Dashboard: $DASHBOARD_DIR
• Documentation: $MC_DIR/docs

💡 REMEMBER
─────────────────────────────────────────────────────────────────────────
• Stay focused on your assigned tasks
• Communicate clearly and promptly
• Ask questions when unsure
• Strive for excellence in everything

Welcome to the team! 🚀

- Mission Control
EOF

    echo -e "${GREEN}   ✓ Created welcome message${NC}"
}

# Setup cron job if requested
setup_cron() {
    if [[ -n "$CRON_SCHEDULE" ]]; then
        echo -e "${BLUE}⏰ Setting up cron job...${NC}"
        
        CRON_CMD="$CRON_SCHEDULE cd $AGENTS_DIR/$AGENT_NAME && $SCRIPTS_DIR/agent-runner.sh $AGENT_NAME >> logs/cron.log 2>&1"
        
        # Add to crontab
        (crontab -l 2>/dev/null || echo "") | grep -v "$AGENT_NAME" | cat - <(echo "$CRON_CMD") | crontab -
        
        # Create cron config file
        cat > "$AGENTS_DIR/$AGENT_NAME/cron.conf" << EOF
# Cron configuration for $AGENT_NAME
# Generated: $(date)

SCHEDULE="$CRON_SCHEDULE"
COMMAND="$SCRIPTS_DIR/agent-runner.sh $AGENT_NAME"
LOG_FILE="logs/cron.log"

# To modify, run:
# crontab -e
EOF

        echo -e "${GREEN}   ✓ Cron job configured: $CRON_SCHEDULE${NC}"
    fi
}

# Add to dashboard
add_to_dashboard() {
    if [[ "$ADD_TO_DASHBOARD" == true ]]; then
        echo -e "${BLUE}📊 Adding to Mission Control dashboard...${NC}"
        
        DASHBOARD_FILE="$DASHBOARD_DIR/agents.json"
        
        # Create dashboard file if it doesn't exist
        if [[ ! -f "$DASHBOARD_FILE" ]]; then
            echo '{"agents":[],"last_updated":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > "$DASHBOARD_FILE"
        fi
        
        # Add agent to dashboard (using jq if available, otherwise manual)
        if command -v jq &> /dev/null; then
            jq --arg name "$AGENT_NAME" \
               --arg type "$AGENT_TYPE" \
               --arg role "$AGENT_ROLE" \
               --arg priority "$AGENT_PRIORITY" \
               --arg status "active" \
               --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               '.agents += [{"name":$name,"type":$type,"role":$role,"priority":$priority,"status":$status,"created_at":$created}]' \
               "$DASHBOARD_FILE" > "$DASHBOARD_FILE.tmp" && mv "$DASHBOARD_FILE.tmp" "$DASHBOARD_FILE"
        else
            # Fallback: append manually
            echo "Note: Install jq for better dashboard integration"
        fi
        
        # Create agent card for dashboard
        cat > "$DASHBOARD_DIR/agent-cards/$AGENT_NAME.json" << EOF
{
  "name": "$AGENT_NAME",
  "type": "$AGENT_TYPE",
  "role": "$AGENT_ROLE",
  "priority": "$AGENT_PRIORITY",
  "status": "active",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "metrics": {
    "tasks_completed": 0,
    "tasks_pending": 1,
    "last_active": null
  },
  "quick_actions": [
    { "label": "View Tasks", "action": "view_tasks", "icon": "📋" },
    { "label": "View Reports", "action": "view_reports", "icon": "📊" },
    { "label": "Send Message", "action": "send_message", "icon": "💬" }
  ]
}
EOF

        mkdir -p "$DASHBOARD_DIR/agent-cards"
        echo -e "${GREEN}   ✓ Added to dashboard${NC}"
    fi
}

# Generate training materials
generate_training() {
    echo -e "${BLUE}📚 Generating training materials...${NC}"
    
    mkdir -p "$AGENTS_DIR/$AGENT_NAME/training"
    
    cat > "$AGENTS_DIR/$AGENT_NAME/training/QUICKSTART.md" << EOF
# $AGENT_NAME - Quick Start Guide

## 5-Minute Setup

### 1. Understand Your Role (1 min)
Read your SOUL.md file. This defines who you are and how you operate.

### 2. Check Your Configuration (1 min)
Review agent.json to understand your settings and capabilities.

### 3. Review Your First Task (1 min)
Look in the tasks/ directory for your onboarding assignment.

### 4. Explore the System (2 min)
- Check other agents in $AGENTS_DIR
- Review Mission Control docs in $MC_DIR/docs
- Understand the task system

## Daily Workflow

1. **Morning Check-in**
   - Review assigned tasks
   - Check for urgent items
   - Update task status

2. **Task Execution**
   - Work on highest priority first
   - Update progress regularly
   - Escalate blockers immediately

3. **End of Day**
   - Complete task updates
   - Generate reports if needed
   - Prepare for tomorrow

## Communication

- **Status Updates:** Use task files for progress
- **Blockers:** Escalate to EricF immediately
- **Questions:** Ask in Mission Control channel
- **Reports:** Save to reports/ directory

## Best Practices

✅ DO:
- Stay focused on assigned tasks
- Communicate clearly and promptly
- Ask questions when unsure
- Document your work

❌ DON'T:
- Work on unassigned tasks without approval
- Make external commitments
- Ignore blockers or errors
- Delete files without backup

## Getting Help

- Mission Control Documentation: $MC_DIR/docs
- Other Agents: Check $AGENTS_DIR for examples
- EricF: Direct message for urgent issues

---

*You're ready to go! Complete your onboarding task to get started.*
EOF

    echo -e "${GREEN}   ✓ Created training materials${NC}"
}

# Update Mission Control registry
update_registry() {
    echo -e "${BLUE}📝 Updating Mission Control registry...${NC}"
    
    REGISTRY_FILE="$MC_DIR/data/agent-registry.json"
    mkdir -p "$MC_DIR/data"
    
    if [[ ! -f "$REGISTRY_FILE" ]]; then
        echo '{"agents":{},"total_created":0,"last_updated":""}' > "$REGISTRY_FILE"
    fi
    
    if command -v jq &> /dev/null; then
        jq --arg name "$AGENT_NAME" \
           --arg type "$AGENT_TYPE" \
           --arg role "$AGENT_ROLE" \
           --arg priority "$AGENT_PRIORITY" \
           --arg date "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
           --arg path "$AGENTS_DIR/$AGENT_NAME" \
           '.agents[$name] = {"type":$type,"role":$role,"priority":$priority,"created_at":$date,"path":$path} | .total_created += 1 | .last_updated = $date' \
           "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
    fi
    
    echo -e "${GREEN}   ✓ Registry updated${NC}"
}

# Print summary
print_summary() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                    ${BOLD}AGENT CREATION COMPLETE${NC}                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ Agent '$AGENT_NAME' has been successfully created!${NC}"
    echo ""
    echo -e "${BOLD}📁 Location:${NC} $AGENTS_DIR/$AGENT_NAME"
    echo -e "${BOLD}📋 Type:${NC} $AGENT_TYPE"
    echo -e "${BOLD}🎯 Role:${NC} $AGENT_ROLE"
    echo -e "${BOLD}🔥 Priority:${NC} $AGENT_PRIORITY"
    echo ""
    echo -e "${BOLD}📂 Generated Files:${NC}"
    echo "  • agent.json       - Configuration"
    echo "  • SOUL.md          - Personality & principles"
    echo "  • README.md        - Documentation"
    echo "  • WELCOME.txt      - Welcome message"
    echo "  • tasks/           - Task directory"
    echo "  • reports/         - Report directory"
    echo "  • memory/          - Memory directory"
    echo "  • training/        - Training materials"
    echo ""
    
    if [[ "$ADD_TO_DASHBOARD" == true ]]; then
        echo -e "${BOLD}📊 Dashboard:${NC} Added to Mission Control dashboard"
    fi
    
    if [[ -n "$CRON_SCHEDULE" ]]; then
        echo -e "${BOLD}⏰ Cron Job:${NC} $CRON_SCHEDULE"
    fi
    
    echo ""
    echo -e "${YELLOW}🚀 Next Steps:${NC}"
    echo "  1. Read the welcome message:"
    echo "     cat $AGENTS_DIR/$AGENT_NAME/WELCOME.txt"
    echo ""
    echo "  2. Review the onboarding task:"
    echo "     ls $AGENTS_DIR/$AGENT_NAME/tasks/"
    echo ""
    echo "  3. Start your first task!"
    echo ""
    echo -e "${CYAN}Welcome to Mission Control! 🎉${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                          ║"
    echo "║              🚀 MISSION CONTROL - AGENT CREATOR 🚀                       ║"
    echo "║                                                                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    parse_args "$@"
    validate_name
    create_structure
    generate_agent_config
    generate_soul
    generate_readme
    generate_initial_task
    generate_welcome
    generate_training
    setup_cron
    add_to_dashboard
    update_registry
    print_summary
}

main "$@"
