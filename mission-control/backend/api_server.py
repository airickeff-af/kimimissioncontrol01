"""
Mission Control Backend API
REST API endpoints for dashboard integration

Run: python api_server.py
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Optional
from pathlib import Path

import aiohttp
from aiohttp import web
import aiohttp_cors

# Import our backend modules
from data_pipeline import get_pipeline
from backup_system import get_backup_system

logger = logging.getLogger('mc-api')


class MCBackendAPI:
    """REST API for Mission Control backend"""
    
    def __init__(self, workspace_path: Optional[str] = None, port: int = 8080):
        self.workspace_path = workspace_path or os.path.expanduser("~/.openclaw/workspace")
        self.port = port
        self.app = web.Application()
        
        # Setup CORS
        cors = aiohttp_cors.setup(self.app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        # Setup routes
        self._setup_routes()
        
        # Apply CORS to all routes
        for route in list(self.app.router.routes()):
            cors.add(route)
    
    def _setup_routes(self):
        """Setup API routes"""
        
        # Health check
        self.app.router.add_get('/api/health', self.health_check)
        
        # Agents
        self.app.router.add_get('/api/agents', self.get_agents)
        self.app.router.add_get('/api/agents/{agent_id}', self.get_agent)
        self.app.router.add_get('/api/agents/{agent_id}/metrics', self.get_agent_metrics)
        self.app.router.add_get('/api/agents/{agent_id}/history', self.get_agent_history)
        
        # System
        self.app.router.add_get('/api/system/status', self.get_system_status)
        self.app.router.add_get('/api/system/metrics', self.get_system_metrics)
        self.app.router.add_get('/api/system/events', self.get_system_events)
        
        # Tasks
        self.app.router.add_get('/api/tasks', self.get_tasks)
        self.app.router.add_get('/api/tasks/active', self.get_active_tasks)
        
        # Backups
        self.app.router.add_get('/api/backups', self.get_backups)
        self.app.router.add_post('/api/backups', self.create_backup)
        self.app.router.add_post('/api/backups/{backup_id}/restore', self.restore_backup)
        self.app.router.add_get('/api/backups/procedures', self.get_recovery_procedures)
        
        # Files
        self.app.router.add_get('/api/files/browse', self.browse_files)
        self.app.router.add_get('/api/files/read', self.read_file)
        
        # WebSocket status
        self.app.router.add_get('/api/websocket/status', self.get_websocket_status)
    
    # === Health ===
    
    async def health_check(self, request):
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "api": "running",
                "websocket": "available" if get_backup_system() else "unknown",
                "pipeline": "available" if get_pipeline() else "unknown"
            }
        })
    
    # === Agents ===
    
    async def get_agents(self, request):
        """Get all agents"""
        agents_path = os.path.join(self.workspace_path, "mission-control/agents")
        agents = []
        
        if os.path.exists(agents_path):
            for agent_dir in os.listdir(agents_path):
                agent_info = await self._get_agent_info(agent_dir)
                if agent_info:
                    agents.append(agent_info)
        
        return web.json_response({"agents": agents})
    
    async def get_agent(self, request):
        """Get specific agent details"""
        agent_id = request.match_info['agent_id']
        agent_info = await self._get_agent_info(agent_id)
        
        if not agent_info:
            return web.json_response({"error": "Agent not found"}, status=404)
        
        return web.json_response(agent_info)
    
    async def _get_agent_info(self, agent_id: str) -> Optional[dict]:
        """Get agent information from files"""
        agent_path = os.path.join(self.workspace_path, "mission-control/agents", agent_id)
        
        if not os.path.exists(agent_path):
            return None
        
        info = {
            "id": agent_id,
            "name": agent_id,
            "status": "unknown",
            "current_tasks": [],
            "metrics": {}
        }
        
        # Read state.json
        state_path = os.path.join(agent_path, "state.json")
        if os.path.exists(state_path):
            try:
                with open(state_path, 'r') as f:
                    state = json.load(f)
                    info["status"] = state.get("status", "unknown")
                    info["current_tasks"] = state.get("current_tasks", [])
                    info["tasks_completed"] = state.get("tasks_completed", 0)
                    info["tasks_failed"] = state.get("tasks_failed", 0)
            except:
                pass
        
        # Read SOUL.md for name
        soul_path = os.path.join(agent_path, "SOUL.md")
        if os.path.exists(soul_path):
            try:
                with open(soul_path, 'r') as f:
                    content = f.read()
                    # Extract name from first header
                    for line in content.split('\n'):
                        if line.startswith('# '):
                            info["name"] = line[2:].strip()
                            break
            except:
                pass
        
        # Get metrics from pipeline
        pipeline = get_pipeline()
        if pipeline and agent_id in pipeline.agent_data:
            info["metrics"] = pipeline.agent_data[agent_id]
        
        return info
    
    async def get_agent_metrics(self, request):
        """Get agent metrics"""
        agent_id = request.match_info['agent_id']
        pipeline = get_pipeline()
        
        if not pipeline:
            return web.json_response({"error": "Pipeline not available"}, status=503)
        
        summary = pipeline.get_agent_performance_summary(agent_id)
        return web.json_response(summary)
    
    async def get_agent_history(self, request):
        """Get agent metrics history"""
        agent_id = request.match_info['agent_id']
        hours = int(request.query.get('hours', 24))
        
        pipeline = get_pipeline()
        if not pipeline:
            return web.json_response({"error": "Pipeline not available"}, status=503)
        
        history = pipeline.db.get_agent_metrics_history(agent_id, hours)
        return web.json_response({"agent_id": agent_id, "history": history})
    
    # === System ===
    
    async def get_system_status(self, request):
        """Get overall system status"""
        # Load current office state
        office_state_path = os.path.join(self.workspace_path, "mission-control/current_office_state.json")
        office_state = {}
        if os.path.exists(office_state_path):
            try:
                with open(office_state_path, 'r') as f:
                    office_state = json.load(f)
            except:
                pass
        
        # Get pipeline metrics
        pipeline = get_pipeline()
        metrics = pipeline.get_current_metrics() if pipeline else {}
        
        return web.json_response({
            "office_state": office_state,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        })
    
    async def get_system_metrics(self, request):
        """Get system metrics history"""
        hours = int(request.query.get('hours', 24))
        
        pipeline = get_pipeline()
        if not pipeline:
            return web.json_response({"error": "Pipeline not available"}, status=503)
        
        history = pipeline.db.get_system_metrics_history(hours)
        return web.json_response({"history": history})
    
    async def get_system_events(self, request):
        """Get system events"""
        event_type = request.query.get('type')
        limit = int(request.query.get('limit', 100))
        
        pipeline = get_pipeline()
        if not pipeline:
            return web.json_response({"error": "Pipeline not available"}, status=503)
        
        events = pipeline.db.get_recent_events(event_type, limit)
        return web.json_response({"events": events})
    
    # === Tasks ===
    
    async def get_tasks(self, request):
        """Get task queue"""
        task_queue_path = os.path.join(self.workspace_path, "mission-control/TASK_QUEUE.md")
        
        if not os.path.exists(task_queue_path):
            return web.json_response({"tasks": []})
        
        try:
            with open(task_queue_path, 'r') as f:
                content = f.read()
            
            # Parse markdown task list
            tasks = []
            for line in content.split('\n'):
                if line.strip().startswith('- ['):
                    status = 'completed' if '[x]' in line else 'pending'
                    task_text = line.split(']', 1)[1].strip() if ']' in line else line
                    tasks.append({
                        "text": task_text,
                        "status": status
                    })
            
            return web.json_response({"tasks": tasks})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    async def get_active_tasks(self, request):
        """Get currently active tasks"""
        agents_path = os.path.join(self.workspace_path, "mission-control/agents")
        active_tasks = []
        
        if os.path.exists(agents_path):
            for agent_dir in os.listdir(agents_path):
                state_path = os.path.join(agents_path, agent_dir, "state.json")
                if os.path.exists(state_path):
                    try:
                        with open(state_path, 'r') as f:
                            state = json.load(f)
                            for task in state.get("current_tasks", []):
                                active_tasks.append({
                                    "agent": agent_dir,
                                    "task": task
                                })
                    except:
                        pass
        
        return web.json_response({"active_tasks": active_tasks})
    
    # === Backups ===
    
    async def get_backups(self, request):
        """List available backups"""
        backup_system = get_backup_system()
        
        if not backup_system:
            return web.json_response({"error": "Backup system not available"}, status=503)
        
        backup_type = request.query.get('type')
        backups = backup_system.list_backups(backup_type)
        
        return web.json_response({"backups": backups})
    
    async def create_backup(self, request):
        """Create a new backup"""
        backup_system = get_backup_system()
        
        if not backup_system:
            return web.json_response({"error": "Backup system not available"}, status=503)
        
        try:
            data = await request.json()
            backup_type = data.get('type', 'full')
            
            if backup_type == 'full':
                info = await backup_system.create_full_backup()
            else:
                return web.json_response({"error": "Invalid backup type"}, status=400)
            
            return web.json_response(info.to_dict())
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    async def restore_backup(self, request):
        """Restore from backup"""
        backup_system = get_backup_system()
        
        if not backup_system:
            return web.json_response({"error": "Backup system not available"}, status=503)
        
        backup_id = request.match_info['backup_id']
        
        try:
            success = await backup_system.restore_backup(backup_id)
            if success:
                return web.json_response({"success": True, "message": f"Backup {backup_id} restored"})
            else:
                return web.json_response({"success": False, "error": "Restore failed"}, status=500)
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    async def get_recovery_procedures(self, request):
        """Get recovery procedures"""
        backup_system = get_backup_system()
        
        if not backup_system:
            return web.json_response({"error": "Backup system not available"}, status=503)
        
        procedures = backup_system.get_recovery_procedures()
        return web.json_response(procedures)
    
    # === Files ===
    
    async def browse_files(self, request):
        """Browse file tree"""
        path = request.query.get('path', '')
        # Normalize path to prevent traversal attacks
        safe_path = os.path.normpath(path).lstrip('/')
        if '..' in safe_path:
            return web.json_response({"error": "Invalid path"}, status=403)
            
        base_path = os.path.join(self.workspace_path, safe_path)
        
        # Security: prevent directory traversal
        if not base_path.startswith(self.workspace_path):
            return web.json_response({"error": "Invalid path"}, status=403)
        
        if not os.path.exists(base_path):
            return web.json_response({"error": "Path not found", "path": safe_path}, status=404)
        
        items = []
        try:
            for item in os.listdir(base_path):
                if item.startswith('.'):
                    continue
                item_path = os.path.join(base_path, item)
                items.append({
                    "name": item,
                    "type": "directory" if os.path.isdir(item_path) else "file",
                    "size": os.path.getsize(item_path) if os.path.isfile(item_path) else None,
                    "modified": datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat()
                })
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
        
        return web.json_response({"path": safe_path, "items": items})
    
    async def read_file(self, request):
        """Read file contents"""
        path = request.query.get('path', '')
        # Normalize path to prevent traversal attacks
        safe_path = os.path.normpath(path).lstrip('/')
        if '..' in safe_path:
            return web.json_response({"error": "Invalid path"}, status=403)
            
        file_path = os.path.join(self.workspace_path, safe_path)
        
        # Security: prevent directory traversal
        if not file_path.startswith(self.workspace_path):
            return web.json_response({"error": "Invalid path"}, status=403)
        
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            return web.json_response({"error": "File not found"}, status=404)
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            return web.json_response({
                "path": safe_path,
                "content": content,
                "size": len(content)
            })
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    # === WebSocket ===
    
    async def get_websocket_status(self, request):
        """Get WebSocket server status"""
        from websocket_server import get_broadcaster
        
        broadcaster = get_broadcaster()
        if broadcaster:
            return web.json_response({
                "status": "running",
                "connected_clients": len(broadcaster.connected_clients)
            })
        else:
            return web.json_response({
                "status": "not_initialized"
            })
    
    # === Server ===
    
    async def start(self):
        """Start the API server"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        
        logger.info(f"API server started on http://0.0.0.0:{self.port}")
        
        # Keep running
        while True:
            await asyncio.sleep(3600)


async def main():
    """Main entry point"""
    logging.basicConfig(level=logging.INFO)
    
    api = MCBackendAPI(port=8080)
    await api.start()


if __name__ == "__main__":
    asyncio.run(main())
