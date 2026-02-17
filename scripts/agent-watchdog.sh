#!/bin/bash
#
# Agent Watchdog - Monitor Agent Health
# TASK-CI-008: Error Recovery System
#
# This script monitors agent processes and triggers recovery actions
# when agents become unresponsive or crash.
#
# Usage:
#   ./agent-watchdog.sh [start|stop|status|check]
#
# Installation:
#   Add to crontab for automatic monitoring:
#   */5 * * * * /path/to/agent-watchdog.sh check
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="${WORKSPACE_DIR}/data"
LOG_DIR="${WORKSPACE_DIR}/logs"
PID_DIR="${WORKSPACE_DIR}/.pids"

# Watchdog settings
HEARTBEAT_TIMEOUT=60      # Seconds before considering agent dead
CHECK_INTERVAL=30         # Seconds between checks
MAX_RESTARTS=3            # Max restarts within window
RESTART_WINDOW=300        # 5 minutes

# Alert settings
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
ADMIN_CONTACT="${ADMIN_CONTACT:-EricF}"

# Ensure directories exist
mkdir -p "$DATA_DIR" "$LOG_DIR" "$PID_DIR"

# Logging
LOG_FILE="${LOG_DIR}/watchdog.log"
PID_FILE="${PID_DIR}/watchdog.pid"

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date -Iseconds)
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() { log "INFO" "$1"; }
warn() { log "WARN" "$1"; }
error() { log "ERROR" "$1"; }
alert() {
    local level="$1"
    local message="$2"
    log "ALERT" "[$level] $message"
    
    # Send webhook alert if configured
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"level\":\"$level\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\",\"source\":\"agent-watchdog\"}" \
            "$ALERT_WEBHOOK" 2>/dev/null || true
    fi
    
    # Critical alerts go to stderr
    if [[ "$level" == "CRITICAL" ]]; then
        echo "🚨 CRITICAL: $message" >&2
    fi
}

# ============================================================================
# AGENT REGISTRY
# ============================================================================

AGENT_REGISTRY="${DATA_DIR}/agent-registry.json"

init_registry() {
    if [[ ! -f "$AGENT_REGISTRY" ]]; then
        echo '{}' > "$AGENT_REGISTRY"
        info "Initialized agent registry"
    fi
}

get_agent_info() {
    local agent_id="$1"
    cat "$AGENT_REGISTRY" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin).get('$agent_id', {})))" 2>/dev/null || echo '{}'
}

update_agent_info() {
    local agent_id="$1"
    local key="$2"
    local value="$3"
    
    python3 << EOF
import json
import sys

try:
    with open('$AGENT_REGISTRY', 'r') as f:
        registry = json.load(f)
except:
    registry = {}

if '$agent_id' not in registry:
    registry['$agent_id'] = {}

registry['$agent_id']['$key'] = $value

with open('$AGENT_REGISTRY', 'w') as f:
    json.dump(registry, f, indent=2)
EOF
}

register_agent() {
    local agent_id="$1"
    local command="$2"
    local pid="${3:-}"
    
    init_registry
    
    local timestamp
    timestamp=$(date +%s)
    
    python3 << EOF
import json
import sys

try:
    with open('$AGENT_REGISTRY', 'r') as f:
        registry = json.load(f)
except:
    registry = {}

registry['$agent_id'] = {
    'id': '$agent_id',
    'command': '$command',
    'pid': ${pid:-null},
    'registered_at': $timestamp,
    'last_heartbeat': $timestamp,
    'restart_count': 0,
    'last_restart': null,
    'status': 'registered'
}

with open('$AGENT_REGISTRY', 'w') as f:
    json.dump(registry, f, indent=2)
EOF
    
    info "Registered agent: $agent_id"
}

unregister_agent() {
    local agent_id="$1"
    
    python3 << EOF
import json

try:
    with open('$AGENT_REGISTRY', 'r') as f:
        registry = json.load(f)
    
    if '$agent_id' in registry:
        del registry['$agent_id']
        
        with open('$AGENT_REGISTRY', 'w') as f:
            json.dump(registry, f, indent=2)
        print('OK')
    else:
        print('NOT_FOUND')
except Exception as e:
    print(f'ERROR: {e}')
EOF
    
    info "Unregistered agent: $agent_id"
}

record_heartbeat() {
    local agent_id="$1"
    local timestamp
    timestamp=$(date +%s)
    
    update_agent_info "$agent_id" "last_heartbeat" "$timestamp"
    update_agent_info "$agent_id" "status" '"healthy"'
}

# ============================================================================
# HEALTH CHECKS
# ============================================================================

check_process_running() {
    local pid="$1"
    kill -0 "$pid" 2>/dev/null
}

check_agent_health() {
    local agent_id="$1"
    local agent_info
    agent_info=$(get_agent_info "$agent_id")
    
    local last_heartbeat pid status
    last_heartbeat=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('last_heartbeat', 0))")
    pid=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('pid', ''))")
    status=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))")
    
    local current_time
    current_time=$(date +%s)
    local time_since_heartbeat=$((current_time - last_heartbeat))
    
    # Check if process is still running
    if [[ -n "$pid" && "$pid" != "null" ]]; then
        if ! check_process_running "$pid"; then
            warn "Agent $agent_id process (PID: $pid) is not running"
            return 1
        fi
    fi
    
    # Check heartbeat timeout
    if [[ $time_since_heartbeat -gt $HEARTBEAT_TIMEOUT ]]; then
        warn "Agent $agent_id heartbeat timeout (${time_since_heartbeat}s > ${HEARTBEAT_TIMEOUT}s)"
        return 1
    fi
    
    return 0
}

# ============================================================================
# RECOVERY ACTIONS
# ============================================================================

restart_agent() {
    local agent_id="$1"
    local agent_info
    agent_info=$(get_agent_info "$agent_id")
    
    local command restart_count last_restart current_time
    command=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('command', ''))")
    restart_count=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('restart_count', 0))")
    last_restart=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('last_restart', 0) or 0)")
    current_time=$(date +%s)
    
    # Check restart limit
    if [[ $((current_time - last_restart)) -lt $RESTART_WINDOW ]]; then
        restart_count=$((restart_count + 1))
    else
        restart_count=1
    fi
    
    if [[ $restart_count -gt $MAX_RESTARTS ]]; then
        alert "CRITICAL" "Agent $agent_id exceeded max restarts ($MAX_RESTARTS in ${RESTART_WINDOW}s)"
        update_agent_info "$agent_id" "status" '"failed"'
        
        # Create escalation file
        local escalation_file="${LOG_DIR}/escalation-$(date +%s).json"
        cat > "$escalation_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "agent_id": "$agent_id",
  "issue": "max_restarts_exceeded",
  "restart_count": $restart_count,
  "admin_contact": "$ADMIN_CONTACT",
  "requires_action": true
}
EOF
        return 1
    fi
    
    info "Restarting agent $agent_id (attempt $restart_count/$MAX_RESTARTS)"
    
    # Save context before restart
    local context_file="${DATA_DIR}/.agent-${agent_id}-context.json"
    echo "$agent_info" > "$context_file"
    
    # Kill existing process if any
    local old_pid
    old_pid=$(echo "$agent_info" | python3 -c "import sys, json; print(json.load(sys.stdin).get('pid', ''))")
    if [[ -n "$old_pid" && "$old_pid" != "null" ]]; then
        kill "$old_pid" 2>/dev/null || true
        sleep 2
        kill -9 "$old_pid" 2>/dev/null || true
    fi
    
    # Start new process
    if [[ -n "$command" ]]; then
        # Start in background with nohup
        local agent_log="${LOG_DIR}/agent-${agent_id}.log"
        nohup bash -c "$command" >> "$agent_log" 2>&1 &
        local new_pid=$!
        
        # Update registry
        update_agent_info "$agent_id" "pid" "$new_pid"
        update_agent_info "$agent_id" "restart_count" "$restart_count"
        update_agent_info "$agent_id" "last_restart" "$current_time"
        update_agent_info "$agent_id" "status" '"restarting"'
        
        info "Agent $agent_id restarted with PID $new_pid"
        
        # Wait a moment and verify
        sleep 2
        if check_process_running "$new_pid"; then
            update_agent_info "$agent_id" "status" '"healthy"'
            record_heartbeat "$agent_id"
            return 0
        else
            warn "Agent $agent_id failed to start"
            return 1
        fi
    else
        error "No command configured for agent $agent_id"
        return 1
    fi
}

# ============================================================================
# WATCHDOG LOOP
# ============================================================================

watchdog_loop() {
    info "Starting watchdog loop (interval: ${CHECK_INTERVAL}s)"
    
    while true; do
        if [[ -f "$AGENT_REGISTRY" ]]; then
            local agents
            agents=$(cat "$AGENT_REGISTRY" | python3 -c "import sys, json; print(' '.join(json.load(sys.stdin).keys()))" 2>/dev/null || echo '')
            
            for agent_id in $agents; do
                local status
                status=$(get_agent_info "$agent_id" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))")
                
                # Skip stopped or failed agents
                if [[ "$status" == "stopped" || "$status" == "failed" ]]; then
                    continue
                fi
                
                if ! check_agent_health "$agent_id"; then
                    restart_agent "$agent_id" || true
                fi
            done
        fi
        
        sleep "$CHECK_INTERVAL"
    done
}

# ============================================================================
# COMMANDS
# ============================================================================

cmd_start() {
    if [[ -f "$PID_FILE" ]]; then
        local old_pid
        old_pid=$(cat "$PID_FILE")
        if check_process_running "$old_pid" 2>/dev/null; then
            info "Watchdog already running (PID: $old_pid)"
            return 0
        fi
    fi
    
    info "Starting watchdog daemon"
    
    # Start in background
    (
        exec &>> "$LOG_FILE"
        watchdog_loop
    ) &
    
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    info "Watchdog started (PID: $pid)"
}

cmd_stop() {
    if [[ -f "$PID_FILE" ]]; then
        local pid
        pid=$(cat "$PID_FILE")
        if check_process_running "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            sleep 1
            kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
        info "Watchdog stopped"
    else
        info "Watchdog not running"
    fi
}

cmd_status() {
    if [[ -f "$PID_FILE" ]]; then
        local pid
        pid=$(cat "$PID_FILE")
        if check_process_running "$pid" 2>/dev/null; then
            info "Watchdog is running (PID: $pid)"
            
            # Show registered agents
            if [[ -f "$AGENT_REGISTRY" ]]; then
                echo ""
                echo "Registered Agents:"
                cat "$AGENT_REGISTRY" | python3 -m json.tool 2>/dev/null || cat "$AGENT_REGISTRY"
            fi
        else
            warn "Watchdog PID file exists but process not running"
            rm -f "$PID_FILE"
        fi
    else
        info "Watchdog is not running"
    fi
}

cmd_check() {
    # One-time check of all agents
    init_registry
    
    local agents
    agents=$(cat "$AGENT_REGISTRY" 2>/dev/null | python3 -c "import sys, json; print(' '.join(json.load(sys.stdin).keys()))" 2>/dev/null || echo '')
    
    local issues=0
    for agent_id in $agents; do
        local status
        status=$(get_agent_info "$agent_id" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))")
        
        if [[ "$status" == "stopped" || "$status" == "failed" ]]; then
            continue
        fi
        
        if ! check_agent_health "$agent_id"; then
            restart_agent "$agent_id" || ((issues++))
        fi
    done
    
    if [[ $issues -gt 0 ]]; then
        exit 1
    fi
}

cmd_register() {
    local agent_id="$1"
    local command="$2"
    
    if [[ -z "$agent_id" || -z "$command" ]]; then
        echo "Usage: $0 register <agent-id> <command>"
        exit 1
    fi
    
    init_registry
    register_agent "$agent_id" "$command"
}

cmd_unregister() {
    local agent_id="$1"
    
    if [[ -z "$agent_id" ]]; then
        echo "Usage: $0 unregister <agent-id>"
        exit 1
    fi
    
    unregister_agent "$agent_id"
}

cmd_heartbeat() {
    local agent_id="$1"
    
    if [[ -z "$agent_id" ]]; then
        echo "Usage: $0 heartbeat <agent-id>"
        exit 1
    fi
    
    record_heartbeat "$agent_id"
    info "Heartbeat recorded for $agent_id"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    local cmd="${1:-help}"
    
    case "$cmd" in
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_stop
            sleep 1
            cmd_start
            ;;
        status)
            cmd_status
            ;;
        check)
            cmd_check
            ;;
        register)
            cmd_register "$2" "$3"
            ;;
        unregister)
            cmd_unregister "$2"
            ;;
        heartbeat)
            cmd_heartbeat "$2"
            ;;
        help|--help|-h)
            cat << 'EOF'
Agent Watchdog - Monitor Agent Health
TASK-CI-008: Error Recovery System

Usage: ./agent-watchdog.sh <command> [options]

Commands:
  start              Start the watchdog daemon
  stop               Stop the watchdog daemon
  restart            Restart the watchdog daemon
  status             Show watchdog and agent status
  check              One-time health check of all agents
  register <id> <cmd>  Register an agent for monitoring
  unregister <id>    Unregister an agent
  heartbeat <id>     Record heartbeat for an agent
  help               Show this help message

Environment Variables:
  ALERT_WEBHOOK      Webhook URL for alerts
  ADMIN_CONTACT      Admin contact for escalations (default: EricF)

Examples:
  ./agent-watchdog.sh start
  ./agent-watchdog.sh register worker-1 "node worker.js"
  ./agent-watchdog.sh heartbeat worker-1
  ./agent-watchdog.sh status

Cron Setup:
  */5 * * * * /path/to/agent-watchdog.sh check
EOF
            ;;
        *)
            error "Unknown command: $cmd"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"
