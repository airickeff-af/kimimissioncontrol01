"""
Mission Control WebSocket Server
Real-time updates for agent status, notifications, and live data

Reference: Kairosoft-style game interface with live updates
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, Set, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import websockets
import aiofiles
import watchfiles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('mc-websocket')


class EventType(Enum):
    """Types of real-time events"""
    AGENT_STATUS = "agent_status"
    AGENT_ACTIVITY = "agent_activity"
    TASK_UPDATE = "task_update"
    SYSTEM_METRIC = "system_metric"
    NOTIFICATION = "notification"
    HEARTBEAT = "heartbeat"
    AGENT_POSITION = "agent_position"
    FILE_CHANGE = "file_change"


@dataclass
class WebSocketMessage:
    """Standard message format for WebSocket communication"""
    type: str
    timestamp: str
    data: dict
    source: str = "mission-control"
    
    def to_json(self) -> str:
        return json.dumps({
            "type": self.type,
            "timestamp": self.timestamp,
            "data": self.data,
            "source": self.source
        })
    
    @classmethod
    def create(cls, event_type: EventType, data: dict, source: str = "mission-control"):
        return cls(
            type=event_type.value,
            timestamp=datetime.now().isoformat(),
            data=data,
            source=source
        )


class AgentStatusBroadcaster:
    """Broadcasts agent status changes to all connected clients"""
    
    def __init__(self, workspace_path: str):
        self.workspace_path = workspace_path
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.agent_states: Dict[str, dict] = {}
        self._running = False
        self._watch_task = None
        
    async def register_client(self, websocket):
        """Register a new WebSocket client"""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected. Total: {len(self.connected_clients)}")
        
        # Send current state to new client
        await self.send_initial_state(websocket)
        
    async def unregister_client(self, websocket):
        """Unregister a WebSocket client"""
        self.connected_clients.discard(websocket)
        logger.info(f"Client disconnected. Total: {len(self.connected_clients)}")
        
    async def send_initial_state(self, websocket):
        """Send current system state to newly connected client"""
        try:
            # Load current office state
            office_state_path = os.path.join(self.workspace_path, "mission-control/current_office_state.json")
            if os.path.exists(office_state_path):
                async with aiofiles.open(office_state_path, 'r') as f:
                    content = await f.read()
                    office_state = json.loads(content)
                    
                message = WebSocketMessage.create(
                    EventType.AGENT_POSITION,
                    office_state
                )
                await websocket.send(message.to_json())
            
            # Load all agent states
            agents_path = os.path.join(self.workspace_path, "mission-control/agents")
            if os.path.exists(agents_path):
                for agent_dir in os.listdir(agents_path):
                    state_path = os.path.join(agents_path, agent_dir, "state.json")
                    if os.path.exists(state_path):
                        async with aiofiles.open(state_path, 'r') as f:
                            content = await f.read()
                            agent_state = json.loads(content)
                            self.agent_states[agent_dir] = agent_state
                            
                        message = WebSocketMessage.create(
                            EventType.AGENT_STATUS,
                            {"agent": agent_dir, "state": agent_state}
                        )
                        await websocket.send(message.to_json())
                        
        except Exception as e:
            logger.error(f"Error sending initial state: {e}")
    
    async def broadcast(self, message: WebSocketMessage):
        """Broadcast message to all connected clients"""
        if not self.connected_clients:
            return
            
        json_msg = message.to_json()
        disconnected = set()
        
        for client in self.connected_clients:
            try:
                await client.send(json_msg)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(client)
        
        # Clean up disconnected clients
        for client in disconnected:
            self.connected_clients.discard(client)
    
    async def broadcast_agent_status(self, agent_id: str, status: dict):
        """Broadcast agent status update"""
        self.agent_states[agent_id] = status
        message = WebSocketMessage.create(
            EventType.AGENT_STATUS,
            {"agent": agent_id, "state": status}
        )
        await self.broadcast(message)
    
    async def broadcast_agent_activity(self, agent_id: str, activity: dict):
        """Broadcast agent activity update"""
        message = WebSocketMessage.create(
            EventType.AGENT_ACTIVITY,
            {"agent": agent_id, "activity": activity}
        )
        await self.broadcast(message)
    
    async def broadcast_notification(self, title: str, message: str, level: str = "info", data: dict = None):
        """Broadcast notification to all clients"""
        notification = WebSocketMessage.create(
            EventType.NOTIFICATION,
            {
                "title": title,
                "message": message,
                "level": level,
                "data": data or {}
            }
        )
        await self.broadcast(notification)
    
    async def broadcast_system_metric(self, metric_name: str, value: float, unit: str = ""):
        """Broadcast system metric update"""
        message = WebSocketMessage.create(
            EventType.SYSTEM_METRIC,
            {
                "metric": metric_name,
                "value": value,
                "unit": unit,
                "timestamp": datetime.now().isoformat()
            }
        )
        await self.broadcast(message)
    
    async def start_file_watching(self):
        """Watch for file changes and broadcast updates"""
        logger.info("Starting file watcher...")
        
        watch_paths = [
            os.path.join(self.workspace_path, "mission-control/agents"),
            os.path.join(self.workspace_path, "mission-control/current_office_state.json"),
            os.path.join(self.workspace_path, "mission-control/TASK_QUEUE.md"),
        ]
        
        async for changes in watchfiles.awatch(*watch_paths):
            for change_type, path in changes:
                await self.handle_file_change(change_type, path)
    
    async def handle_file_change(self, change_type, path: str):
        """Handle detected file changes"""
        try:
            if "state.json" in path:
                # Agent state changed
                agent_dir = os.path.basename(os.path.dirname(path))
                async with aiofiles.open(path, 'r') as f:
                    content = await f.read()
                    state = json.loads(content)
                    await self.broadcast_agent_status(agent_dir, state)
                    
            elif "current_office_state.json" in path:
                # Office state changed
                async with aiofiles.open(path, 'r') as f:
                    content = await f.read()
                    office_state = json.loads(content)
                    message = WebSocketMessage.create(
                        EventType.AGENT_POSITION,
                        office_state
                    )
                    await self.broadcast(message)
                    
            elif "TASK_QUEUE.md" in path:
                # Task queue changed
                message = WebSocketMessage.create(
                    EventType.TASK_UPDATE,
                    {"type": "task_queue_changed", "path": path}
                )
                await self.broadcast(message)
                
        except Exception as e:
            logger.error(f"Error handling file change {path}: {e}")
    
    async def send_heartbeat(self):
        """Send periodic heartbeat to all clients"""
        while self._running:
            message = WebSocketMessage.create(
                EventType.HEARTBEAT,
                {"clients": len(self.connected_clients)}
            )
            await self.broadcast(message)
            await asyncio.sleep(30)  # Heartbeat every 30 seconds


class WebSocketServer:
    """Main WebSocket server for Mission Control"""
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.workspace_path = os.path.expanduser("~/.openclaw/workspace")
        self.broadcaster = AgentStatusBroadcaster(self.workspace_path)
        self.server = None
        
    async def handle_client(self, websocket):
        """Handle individual WebSocket connections"""
        await self.broadcaster.register_client(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.broadcaster.unregister_client(websocket)
    
    async def handle_message(self, websocket, message: str):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "ping":
                await websocket.send(json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}))
                
            elif msg_type == "subscribe":
                channel = data.get("channel")
                logger.info(f"Client subscribed to channel: {channel}")
                await websocket.send(json.dumps({"type": "subscribed", "channel": channel}))
                
            elif msg_type == "request_agent_status":
                agent_id = data.get("agent_id")
                if agent_id in self.broadcaster.agent_states:
                    message = WebSocketMessage.create(
                        EventType.AGENT_STATUS,
                        {"agent": agent_id, "state": self.broadcaster.agent_states[agent_id]}
                    )
                    await websocket.send(message.to_json())
                    
        except json.JSONDecodeError:
            logger.warning(f"Received invalid JSON: {message}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def start(self):
        """Start the WebSocket server"""
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        
        self.broadcaster._running = True
        
        # Start background tasks
        heartbeat_task = asyncio.create_task(self.broadcaster.send_heartbeat())
        file_watch_task = asyncio.create_task(self.broadcaster.start_file_watching())
        
        # Start WebSocket server
        self.server = await websockets.serve(
            self.handle_client,
            self.host,
            self.port,
            ping_interval=20,
            ping_timeout=10
        )
        
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
        
        # Keep running
        await asyncio.gather(
            self.server.wait_closed(),
            heartbeat_task,
            file_watch_task,
            return_exceptions=True
        )
    
    async def stop(self):
        """Stop the WebSocket server"""
        logger.info("Stopping WebSocket server...")
        self.broadcaster._running = False
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        logger.info("WebSocket server stopped")


# Global server instance for programmatic access
_server_instance: Optional[WebSocketServer] = None

async def start_server(host: str = "0.0.0.0", port: int = 8765):
    """Start the WebSocket server"""
    global _server_instance
    _server_instance = WebSocketServer(host, port)
    await _server_instance.start()

def get_broadcaster() -> Optional[AgentStatusBroadcaster]:
    """Get the broadcaster instance for sending messages from other code"""
    if _server_instance:
        return _server_instance.broadcaster
    return None

async def broadcast_agent_status(agent_id: str, status: dict):
    """Convenience function to broadcast agent status"""
    broadcaster = get_broadcaster()
    if broadcaster:
        await broadcaster.broadcast_agent_status(agent_id, status)

async def broadcast_notification(title: str, message: str, level: str = "info"):
    """Convenience function to broadcast notification"""
    broadcaster = get_broadcaster()
    if broadcaster:
        await broadcaster.broadcast_notification(title, message, level)


if __name__ == "__main__":
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
