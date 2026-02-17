#!/bin/bash
#
# Mission Control Backend Startup Script
# Starts all backend services: WebSocket, Data Pipeline, Backup System, API
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$HOME/.openclaw/workspace"
BACKEND_DIR="$WORKSPACE_DIR/mission-control/backend"
LOGS_DIR="$WORKSPACE_DIR/mission-control/logs"
PID_DIR="$WORKSPACE_DIR/mission-control/backend/pids"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$LOGS_DIR"
mkdir -p "$PID_DIR"
mkdir -p "$BACKEND_DIR/data"
mkdir -p "$WORKSPACE_DIR/mission-control/backups"

# Function to print status
print_status() {
    echo -e "${BLUE}[MC-Backend]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check Python version
check_python() {
    print_status "Checking Python version..."
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    print_success "Python version: $PYTHON_VERSION"
}

# Check/install dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    cd "$BACKEND_DIR"
    
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    if [ -f "requirements.txt" ]; then
        print_status "Installing dependencies..."
        pip install -q -r requirements.txt
        print_success "Dependencies installed"
    fi
}

# Start services
start_services() {
    print_status "Starting Mission Control Backend Services..."
    print_status "=============================================="
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Start main orchestrator (includes WebSocket, Pipeline, Backup)
    print_status "Starting Orchestrator..."
    nohup python3 orchestrator.py > "$LOGS_DIR/orchestrator.log" 2>&1 &
    ORCH_PID=$!
    echo $ORCH_PID > "$PID_DIR/orchestrator.pid"
    print_success "Orchestrator started (PID: $ORCH_PID)"
    
    # Wait a moment for orchestrator to initialize
    sleep 2
    
    # Start API server
    print_status "Starting API Server..."
    nohup python3 api_server.py > "$LOGS_DIR/api_server.log" 2>&1 &
    API_PID=$!
    echo $API_PID > "$PID_DIR/api_server.pid"
    print_success "API Server started (PID: $API_PID)"
    
    print_status "=============================================="
    print_success "All services started!"
    echo ""
    echo -e "  ${BLUE}WebSocket:${NC}  ws://localhost:8765"
    echo -e "  ${BLUE}API:${NC}        http://localhost:8080"
    echo -e "  ${BLUE}Logs:${NC}       $LOGS_DIR"
    echo ""
    echo "Use './start-backend.sh status' to check status"
    echo "Use './start-backend.sh stop' to stop services"
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    
    # Stop orchestrator
    if [ -f "$PID_DIR/orchestrator.pid" ]; then
        PID=$(cat "$PID_DIR/orchestrator.pid")
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            print_success "Orchestrator stopped"
        fi
        rm -f "$PID_DIR/orchestrator.pid"
    fi
    
    # Stop API server
    if [ -f "$PID_DIR/api_server.pid" ]; then
        PID=$(cat "$PID_DIR/api_server.pid")
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            print_success "API Server stopped"
        fi
        rm -f "$PID_DIR/api_server.pid"
    fi
    
    print_success "All services stopped"
}

# Check status
check_status() {
    print_status "Service Status"
    print_status "=============="
    
    # Check orchestrator
    if [ -f "$PID_DIR/orchestrator.pid" ]; then
        PID=$(cat "$PID_DIR/orchestrator.pid")
        if kill -0 $PID 2>/dev/null; then
            print_success "Orchestrator: Running (PID: $PID)"
        else
            print_error "Orchestrator: Not running (stale PID file)"
            rm -f "$PID_DIR/orchestrator.pid"
        fi
    else
        print_error "Orchestrator: Not running"
    fi
    
    # Check API server
    if [ -f "$PID_DIR/api_server.pid" ]; then
        PID=$(cat "$PID_DIR/api_server.pid")
        if kill -0 $PID 2>/dev/null; then
            print_success "API Server: Running (PID: $PID)"
        else
            print_error "API Server: Not running (stale PID file)"
            rm -f "$PID_DIR/api_server.pid"
        fi
    else
        print_error "API Server: Not running"
    fi
    
    # Check ports
    print_status ""
    print_status "Port Status"
    print_status "==========="
    
    if lsof -Pi :8765 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "WebSocket (8765): Listening"
    else
        print_error "WebSocket (8765): Not listening"
    fi
    
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "API (8080): Listening"
    else
        print_error "API (8080): Not listening"
    fi
}

# View logs
view_logs() {
    if [ -f "$LOGS_DIR/orchestrator.log" ]; then
        print_status "Recent logs from orchestrator.log:"
        tail -n 20 "$LOGS_DIR/orchestrator.log"
    fi
    
    if [ -f "$LOGS_DIR/api_server.log" ]; then
        print_status "Recent logs from api_server.log:"
        tail -n 20 "$LOGS_DIR/api_server.log"
    fi
}

# Create initial backup
create_backup() {
    print_status "Creating initial backup..."
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python3 -c "
import asyncio
from backup_system import init_backup_system
import os

async def main():
    workspace = os.path.expanduser('~/.openclaw/workspace')
    backup = init_backup_system(workspace)
    info = await backup.create_full_backup()
    print(f'Backup created: {info.id}')
    print(f'Size: {info.size_human}')
    print(f'Files: {info.file_count}')

asyncio.run(main())
"
    print_success "Backup created"
}

# Main command handler
case "${1:-start}" in
    start)
        check_python
        check_dependencies
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        check_python
        check_dependencies
        start_services
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    backup)
        create_backup
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|backup}"
        exit 1
        ;;
esac
