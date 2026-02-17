"""
Mission Control Data Pipeline
Agent data aggregation, metrics collection, and performance tracking

Reference: Kairosoft-style resource bars and stat tracking
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import sqlite3
import aiofiles
from pathlib import Path

logger = logging.getLogger('mc-pipeline')


@dataclass
class AgentMetrics:
    """Metrics for a single agent"""
    agent_id: str
    timestamp: datetime
    
    # Activity metrics
    tasks_completed: int = 0
    tasks_failed: int = 0
    tasks_in_progress: int = 0
    
    # Performance metrics
    avg_task_duration: float = 0.0  # seconds
    total_work_time: float = 0.0  # seconds
    idle_time: float = 0.0  # seconds
    
    # Communication metrics
    messages_sent: int = 0
    messages_received: int = 0
    
    # Quality metrics
    error_rate: float = 0.0
    success_rate: float = 1.0
    
    # Resource usage (if available)
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    
    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "timestamp": self.timestamp.isoformat(),
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed,
            "tasks_in_progress": self.tasks_in_progress,
            "avg_task_duration": self.avg_task_duration,
            "total_work_time": self.total_work_time,
            "idle_time": self.idle_time,
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "error_rate": self.error_rate,
            "success_rate": self.success_rate,
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage
        }


@dataclass
class SystemMetrics:
    """Overall system metrics"""
    timestamp: datetime
    
    # Agent counts
    total_agents: int = 0
    active_agents: int = 0
    idle_agents: int = 0
    offline_agents: int = 0
    
    # Task metrics
    total_tasks_completed: int = 0
    total_tasks_pending: int = 0
    total_tasks_failed: int = 0
    
    # System health
    system_health_score: float = 1.0  # 0-1
    avg_response_time: float = 0.0  # seconds
    
    # Activity rate
    events_per_minute: float = 0.0
    
    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp.isoformat(),
            "total_agents": self.total_agents,
            "active_agents": self.active_agents,
            "idle_agents": self.idle_agents,
            "offline_agents": self.offline_agents,
            "total_tasks_completed": self.total_tasks_completed,
            "total_tasks_pending": self.total_tasks_pending,
            "total_tasks_failed": self.total_tasks_failed,
            "system_health_score": self.system_health_score,
            "avg_response_time": self.avg_response_time,
            "events_per_minute": self.events_per_minute
        }


class MetricsDatabase:
    """SQLite database for storing metrics history"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize database tables"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Agent metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agent_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    agent_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    tasks_completed INTEGER DEFAULT 0,
                    tasks_failed INTEGER DEFAULT 0,
                    tasks_in_progress INTEGER DEFAULT 0,
                    avg_task_duration REAL DEFAULT 0,
                    total_work_time REAL DEFAULT 0,
                    idle_time REAL DEFAULT 0,
                    messages_sent INTEGER DEFAULT 0,
                    messages_received INTEGER DEFAULT 0,
                    error_rate REAL DEFAULT 0,
                    success_rate REAL DEFAULT 1
                )
            ''')
            
            # System metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    total_agents INTEGER DEFAULT 0,
                    active_agents INTEGER DEFAULT 0,
                    idle_agents INTEGER DEFAULT 0,
                    offline_agents INTEGER DEFAULT 0,
                    total_tasks_completed INTEGER DEFAULT 0,
                    total_tasks_pending INTEGER DEFAULT 0,
                    total_tasks_failed INTEGER DEFAULT 0,
                    system_health_score REAL DEFAULT 1,
                    avg_response_time REAL DEFAULT 0,
                    events_per_minute REAL DEFAULT 0
                )
            ''')
            
            # Events log table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    agent_id TEXT,
                    data TEXT
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent ON agent_metrics(agent_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_agent_metrics_time ON agent_metrics(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_system_metrics_time ON system_metrics(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_time ON events(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)')
            
            conn.commit()
    
    def store_agent_metrics(self, metrics: AgentMetrics):
        """Store agent metrics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO agent_metrics 
                (agent_id, timestamp, tasks_completed, tasks_failed, tasks_in_progress,
                 avg_task_duration, total_work_time, idle_time, messages_sent, messages_received,
                 error_rate, success_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                metrics.agent_id,
                metrics.timestamp.isoformat(),
                metrics.tasks_completed,
                metrics.tasks_failed,
                metrics.tasks_in_progress,
                metrics.avg_task_duration,
                metrics.total_work_time,
                metrics.idle_time,
                metrics.messages_sent,
                metrics.messages_received,
                metrics.error_rate,
                metrics.success_rate
            ))
            conn.commit()
    
    def store_system_metrics(self, metrics: SystemMetrics):
        """Store system metrics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO system_metrics 
                (timestamp, total_agents, active_agents, idle_agents, offline_agents,
                 total_tasks_completed, total_tasks_pending, total_tasks_failed,
                 system_health_score, avg_response_time, events_per_minute)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                metrics.timestamp.isoformat(),
                metrics.total_agents,
                metrics.active_agents,
                metrics.idle_agents,
                metrics.offline_agents,
                metrics.total_tasks_completed,
                metrics.total_tasks_pending,
                metrics.total_tasks_failed,
                metrics.system_health_score,
                metrics.avg_response_time,
                metrics.events_per_minute
            ))
            conn.commit()
    
    def log_event(self, event_type: str, agent_id: Optional[str] = None, data: Optional[dict] = None):
        """Log an event"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO events (timestamp, event_type, agent_id, data)
                VALUES (?, ?, ?, ?)
            ''', (
                datetime.now().isoformat(),
                event_type,
                agent_id,
                json.dumps(data) if data else None
            ))
            conn.commit()
    
    def get_agent_metrics_history(self, agent_id: str, hours: int = 24) -> List[dict]:
        """Get agent metrics history"""
        since = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM agent_metrics 
                WHERE agent_id = ? AND timestamp > ?
                ORDER BY timestamp DESC
            ''', (agent_id, since))
            
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_system_metrics_history(self, hours: int = 24) -> List[dict]:
        """Get system metrics history"""
        since = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM system_metrics 
                WHERE timestamp > ?
                ORDER BY timestamp DESC
            ''', (since,))
            
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_recent_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[dict]:
        """Get recent events"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if event_type:
                cursor.execute('''
                    SELECT * FROM events 
                    WHERE event_type = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (event_type, limit))
            else:
                cursor.execute('''
                    SELECT * FROM events 
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (limit,))
            
            columns = [description[0] for description in cursor.description]
            results = []
            for row in cursor.fetchall():
                d = dict(zip(columns, row))
                if d.get('data'):
                    try:
                        d['data'] = json.loads(d['data'])
                    except:
                        pass
                results.append(d)
            return results


class DataPipeline:
    """Main data pipeline for collecting and aggregating agent data"""
    
    def __init__(self, workspace_path: str, db_path: Optional[str] = None):
        self.workspace_path = workspace_path
        self.db_path = db_path or os.path.join(workspace_path, "mission-control/backend/data/metrics.db")
        self.db = MetricsDatabase(self.db_path)
        
        self.agent_data: Dict[str, dict] = {}
        self.task_data: Dict[str, dict] = {}
        self.event_buffer: List[dict] = []
        
        self._running = False
        self._collection_interval = 60  # Collect metrics every 60 seconds
        
    async def start(self):
        """Start the data pipeline"""
        logger.info("Starting data pipeline...")
        self._running = True
        
        while self._running:
            try:
                await self.collect_metrics()
                await asyncio.sleep(self._collection_interval)
            except Exception as e:
                logger.error(f"Error in data pipeline: {e}")
                await asyncio.sleep(5)
    
    def stop(self):
        """Stop the data pipeline"""
        logger.info("Stopping data pipeline...")
        self._running = False
    
    async def collect_metrics(self):
        """Collect metrics from all data sources"""
        logger.debug("Collecting metrics...")
        timestamp = datetime.now()
        
        # Collect agent metrics
        await self._collect_agent_metrics(timestamp)
        
        # Collect system metrics
        await self._collect_system_metrics(timestamp)
        
        # Flush event buffer
        await self._flush_event_buffer()
    
    async def _collect_agent_metrics(self, timestamp: datetime):
        """Collect metrics for each agent"""
        agents_path = os.path.join(self.workspace_path, "mission-control/agents")
        
        if not os.path.exists(agents_path):
            return
        
        for agent_dir in os.listdir(agents_path):
            agent_path = os.path.join(agents_path, agent_dir)
            if not os.path.isdir(agent_path):
                continue
            
            try:
                metrics = await self._parse_agent_data(agent_dir, agent_path, timestamp)
                self.db.store_agent_metrics(metrics)
                self.agent_data[agent_dir] = metrics.to_dict()
                
            except Exception as e:
                logger.error(f"Error collecting metrics for {agent_dir}: {e}")
    
    async def _parse_agent_data(self, agent_id: str, agent_path: str, timestamp: datetime) -> AgentMetrics:
        """Parse agent data from files"""
        metrics = AgentMetrics(agent_id=agent_id, timestamp=timestamp)
        
        # Read state.json
        state_path = os.path.join(agent_path, "state.json")
        if os.path.exists(state_path):
            async with aiofiles.open(state_path, 'r') as f:
                try:
                    state = json.loads(await f.read())
                    
                    # Extract task info
                    metrics.tasks_in_progress = len(state.get("current_tasks", []))
                    metrics.tasks_completed = state.get("tasks_completed", 0)
                    metrics.tasks_failed = state.get("tasks_failed", 0)
                    
                    # Calculate success rate
                    total = metrics.tasks_completed + metrics.tasks_failed
                    if total > 0:
                        metrics.success_rate = metrics.tasks_completed / total
                        metrics.error_rate = metrics.tasks_failed / total
                    
                    # Get work time if available
                    metrics.total_work_time = state.get("total_work_time", 0)
                    
                except json.JSONDecodeError:
                    pass
        
        # Check for memory files
        memory_path = os.path.join(agent_path, "memory")
        if os.path.exists(memory_path):
            metrics.messages_sent = len(os.listdir(memory_path))
        
        return metrics
    
    async def _collect_system_metrics(self, timestamp: datetime):
        """Collect overall system metrics"""
        metrics = SystemMetrics(timestamp=timestamp)
        
        # Count agents by status
        agents_path = os.path.join(self.workspace_path, "mission-control/agents")
        if os.path.exists(agents_path):
            for agent_dir in os.listdir(agents_path):
                agent_path = os.path.join(agents_path, agent_dir)
                if not os.path.isdir(agent_path):
                    continue
                
                metrics.total_agents += 1
                
                state_path = os.path.join(agent_path, "state.json")
                if os.path.exists(state_path):
                    async with aiofiles.open(state_path, 'r') as f:
                        try:
                            state = json.loads(await f.read())
                            status = state.get("status", "unknown")
                            
                            if status == "active":
                                metrics.active_agents += 1
                            elif status == "idle":
                                metrics.idle_agents += 1
                            else:
                                metrics.offline_agents += 1
                                
                            metrics.total_tasks_completed += state.get("tasks_completed", 0)
                            metrics.total_tasks_failed += state.get("tasks_failed", 0)
                            
                        except json.JSONDecodeError:
                            metrics.offline_agents += 1
                else:
                    metrics.offline_agents += 1
        
        # Parse task queue
        task_queue_path = os.path.join(self.workspace_path, "mission-control/TASK_QUEUE.md")
        if os.path.exists(task_queue_path):
            async with aiofiles.open(task_queue_path, 'r') as f:
                content = await f.read()
                # Count pending tasks (simple heuristic)
                metrics.total_tasks_pending = content.count("- [ ]")
        
        # Calculate health score
        if metrics.total_agents > 0:
            active_ratio = metrics.active_agents / metrics.total_agents
            success_ratio = 1.0
            if (metrics.total_tasks_completed + metrics.total_tasks_failed) > 0:
                success_ratio = metrics.total_tasks_completed / (metrics.total_tasks_completed + metrics.total_tasks_failed)
            metrics.system_health_score = (active_ratio * 0.5 + success_ratio * 0.5)
        
        self.db.store_system_metrics(metrics)
        
        # Store in memory for quick access
        self._latest_system_metrics = metrics.to_dict()
    
    async def _flush_event_buffer(self):
        """Flush buffered events to database"""
        for event in self.event_buffer:
            self.db.log_event(
                event_type=event["type"],
                agent_id=event.get("agent_id"),
                data=event.get("data")
            )
        self.event_buffer = []
    
    def log_event(self, event_type: str, agent_id: Optional[str] = None, data: Optional[dict] = None):
        """Log an event to the buffer"""
        self.event_buffer.append({
            "type": event_type,
            "agent_id": agent_id,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
    
    def get_current_metrics(self) -> dict:
        """Get current metrics snapshot"""
        return {
            "agents": self.agent_data,
            "system": getattr(self, '_latest_system_metrics', {}),
            "timestamp": datetime.now().isoformat()
        }
    
    def get_agent_performance_summary(self, agent_id: str) -> dict:
        """Get performance summary for an agent"""
        history = self.db.get_agent_metrics_history(agent_id, hours=24)
        
        if not history:
            return {"error": "No data available"}
        
        # Calculate averages
        avg_success_rate = sum(h.get("success_rate", 0) for h in history) / len(history)
        avg_error_rate = sum(h.get("error_rate", 0) for h in history) / len(history)
        total_tasks = sum(h.get("tasks_completed", 0) for h in history)
        
        return {
            "agent_id": agent_id,
            "period_hours": 24,
            "avg_success_rate": avg_success_rate,
            "avg_error_rate": avg_error_rate,
            "total_tasks_completed": total_tasks,
            "data_points": len(history)
        }


# Global pipeline instance
_pipeline_instance: Optional[DataPipeline] = None

def init_pipeline(workspace_path: Optional[str] = None) -> DataPipeline:
    """Initialize the data pipeline"""
    global _pipeline_instance
    if workspace_path is None:
        workspace_path = os.path.expanduser("~/.openclaw/workspace")
    _pipeline_instance = DataPipeline(workspace_path)
    return _pipeline_instance

def get_pipeline() -> Optional[DataPipeline]:
    """Get the pipeline instance"""
    return _pipeline_instance

def log_event(event_type: str, agent_id: Optional[str] = None, data: Optional[dict] = None):
    """Convenience function to log an event"""
    if _pipeline_instance:
        _pipeline_instance.log_event(event_type, agent_id, data)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    async def main():
        pipeline = init_pipeline()
        await pipeline.start()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        if _pipeline_instance:
            _pipeline_instance.stop()
        logger.info("Pipeline stopped")
