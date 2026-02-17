# Mission Control Backend Infrastructure

Advanced backend systems for real-time monitoring, data aggregation, and automated backups.

## Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference with examples
- **[Final Delivery Report](FINAL_DELIVERY_REPORT.md)** - Project completion summary

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mission Control Backend                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   WebSocket  │  │   Data       │  │   Backup     │      │
│  │   Server     │  │   Pipeline   │  │   System     │      │
│  │              │  │              │  │              │      │
│  │ • Real-time  │  │ • Metrics    │  │ • Automated  │      │
│  │   updates    │  │   collection │  │   backups    │      │
│  │ • Agent      │  │ • Agent      │  │ • Recovery   │      │
│  │   status     │  │   analytics  │  │   procedures │      │
│  │ • Live       │  │ • Event      │  │ • Export/    │      │
│  │   notifs     │  │   logging    │  │   import     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────┴──────┐                         │
│                    │ Orchestrator │                         │
│                    │   (main.py)  │                         │
│                    └──────┬──────┘                         │
│                           │                                 │
│                    ┌──────┴──────┐                         │
│                    │  REST API    │                         │
│                    │   (8080)     │                         │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Dashboard      │
                    │   (Frontend)     │
                    └──────────────────┘
```

## Quick Start

```bash
# Start all backend services
./start-backend.sh start

# Check status
./start-backend.sh status

# View logs
./start-backend.sh logs

# Stop services
./start-backend.sh stop

# Create manual backup
./start-backend.sh backup
```

## Services

### 1. WebSocket Server (Port 8765)

Real-time communication for live dashboard updates.

**Features:**
- Agent status broadcasting
- Position updates on office map
- Live notifications
- Task queue changes
- System metrics streaming

**Client Usage:**
```javascript
const ws = new MCWebSocketClient('ws://localhost:8765');
ws.connect();

ws.on('agent_status', (data) => {
    console.log(`Agent ${data.agent} is now ${data.state.status}`);
});

ws.on('notification', (data) => {
    showToast(data.title, data.message, data.level);
});
```

### 2. Data Pipeline

Automated metrics collection and performance tracking.

**Features:**
- Agent activity tracking
- Task completion metrics
- System health monitoring
- SQLite database storage
- Historical analytics

**Metrics Collected:**
- Tasks completed/failed/in-progress
- Work time and idle time
- Message counts
- Error/success rates
- System health score

**API:**
```python
from data_pipeline import get_pipeline, log_event

# Log custom event
log_event('task_started', agent_id='coder', data={'task': 'build_api'})

# Get current metrics
pipeline = get_pipeline()
metrics = pipeline.get_current_metrics()
```

### 3. Backup System

Automated backups with recovery procedures.

**Features:**
- Full system backups every 6 hours
- Agent state snapshots
- 7-day retention policy
- Integrity verification (SHA256)
- Selective restore options

**Backup Types:**
- `full` - Complete Mission Control data
- `agent_state` - Individual agent data
- `snapshot` - Quick JSON state capture

**Recovery:**
```python
from backup_system import get_backup_system

backup = get_backup_system()

# List backups
backups = backup.list_backups()

# Restore full system
backup.restore_backup('20240217_120000')

# Restore single agent
backup.restore_agent_state('agent_backup_id', 'coder')
```

### 4. REST API (Port 8080)

HTTP API for dashboard integration.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/{id}` | Get agent details |
| GET | `/api/agents/{id}/metrics` | Agent performance |
| GET | `/api/system/status` | System status |
| GET | `/api/system/metrics` | System metrics history |
| GET | `/api/tasks` | Task queue |
| GET | `/api/backups` | List backups |
| POST | `/api/backups` | Create backup |
| POST | `/api/backups/{id}/restore` | Restore backup |

## File Structure

```
backend/
├── orchestrator.py          # Main service coordinator
├── websocket_server.py      # WebSocket server
├── data_pipeline.py         # Metrics collection
├── backup_system.py         # Backup/recovery
├── api_server.py            # REST API
├── websocket-client.js      # Frontend client
├── requirements.txt         # Python dependencies
├── start-backend.sh         # Startup script
└── data/                    # Runtime data
    ├── metrics.db           # SQLite database
    └── status.json          # Service status
```

## Configuration

Environment variables:

```bash
# WebSocket port (default: 8765)
export MC_WS_PORT=8765

# API port (default: 8080)
export MC_API_PORT=8080

# Backup interval in hours (default: 6)
export MC_BACKUP_INTERVAL=6

# Backup retention in days (default: 7)
export MC_BACKUP_RETENTION=7

# Workspace path (default: ~/.openclaw/workspace)
export MC_WORKSPACE=/path/to/workspace
```

## Database Schema

### agent_metrics
```sql
CREATE TABLE agent_metrics (
    id INTEGER PRIMARY KEY,
    agent_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    tasks_completed INTEGER,
    tasks_failed INTEGER,
    tasks_in_progress INTEGER,
    avg_task_duration REAL,
    total_work_time REAL,
    idle_time REAL,
    messages_sent INTEGER,
    messages_received INTEGER,
    error_rate REAL,
    success_rate REAL
);
```

### system_metrics
```sql
CREATE TABLE system_metrics (
    id INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    total_agents INTEGER,
    active_agents INTEGER,
    idle_agents INTEGER,
    offline_agents INTEGER,
    total_tasks_completed INTEGER,
    total_tasks_pending INTEGER,
    total_tasks_failed INTEGER,
    system_health_score REAL,
    avg_response_time REAL,
    events_per_minute REAL
);
```

### events
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    agent_id TEXT,
    data TEXT
);
```

## Recovery Procedures

### Full System Restore

1. Stop all services: `./start-backend.sh stop`
2. Identify backup: Check `/api/backups` or `backup.list_backups()`
3. Restore: `backup.restore_backup('backup_id')`
4. Verify: Check agent states and task queue
5. Restart: `./start-backend.sh start`

### Single Agent Restore

1. Backup current state: `backup.create_agent_state_backup('agent_id')`
2. Restore: `backup.restore_agent_state('backup_id', 'agent_id')`
3. Verify: Check agent state.json

### Manual File Recovery

```bash
# Extract backup
tar -xzf backups/backup_20240217_120000.tar.gz -C /tmp/restore/

# Copy specific files
cp /tmp/restore/mission-control/agents/coder/state.json \
   ~/.openclaw/workspace/mission-control/agents/coder/
```

## Monitoring

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Metrics Query
```bash
# System metrics (last 24h)
curl "http://localhost:8080/api/system/metrics?hours=24"

# Agent history
curl "http://localhost:8080/api/agents/coder/history?hours=48"

# Recent events
curl "http://localhost:8080/api/system/events?limit=50"
```

## Troubleshooting

### WebSocket Connection Issues
- Check port 8765 is not in use: `lsof -i :8765`
- Verify firewall settings
- Check logs: `tail -f logs/orchestrator.log`

### Database Errors
- Check disk space: `df -h`
- Verify permissions: `ls -la backend/data/`
- Reset database: `rm backend/data/metrics.db` (loses history)

### Backup Failures
- Check disk space
- Verify backup directory permissions
- Check logs for specific errors

## Integration with Dashboard

Include in dashboard HTML:
```html
<script src="backend/websocket-client.js"></script>
<script>
    const ws = new MCWebSocketClient('ws://localhost:8765');
    const dashboard = new MCDashboardIntegration(ws);
    
    ws.connect();
    dashboard.init();
</script>
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run individual services
python3 websocket_server.py
python3 data_pipeline.py
python3 backup_system.py
python3 api_server.py

# Run full orchestrator
python3 orchestrator.py
```

## License

Part of Mission Control system for EricF.
