"""
Mission Control Backend Orchestrator
Coordinates WebSocket server, data pipeline, and backup system

This is the main entry point for the Mission Control backend infrastructure.
"""

import asyncio
import logging
import os
import signal
import sys
from typing import Optional
import json

# Import our backend modules
from websocket_server import WebSocketServer, start_server as start_websocket
from data_pipeline import DataPipeline, init_pipeline
from backup_system import BackupSystem, init_backup_system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.expanduser('~/.openclaw/workspace/mission-control/logs/backend.log'))
    ]
)
logger = logging.getLogger('mc-backend')


class BackendOrchestrator:
    """
    Main orchestrator for Mission Control backend services.
    
    Manages:
    - WebSocket Server (real-time updates)
    - Data Pipeline (metrics collection)
    - Backup System (automated backups)
    """
    
    def __init__(self, workspace_path: Optional[str] = None):
        self.workspace_path = workspace_path or os.path.expanduser("~/.openclaw/workspace")
        
        # Ensure logs directory exists
        os.makedirs(os.path.join(self.workspace_path, "mission-control/logs"), exist_ok=True)
        os.makedirs(os.path.join(self.workspace_path, "mission-control/backend/data"), exist_ok=True)
        
        # Service instances
        self.websocket_server: Optional[WebSocketServer] = None
        self.data_pipeline: Optional[DataPipeline] = None
        self.backup_system: Optional[BackupSystem] = None
        
        self._running = False
        self._tasks = []
        
    async def start(self):
        """Start all backend services"""
        logger.info("=" * 60)
        logger.info("Starting Mission Control Backend Services")
        logger.info("=" * 60)
        
        self._running = True
        
        # Initialize services
        logger.info("Initializing services...")
        
        # 1. Initialize Data Pipeline
        self.data_pipeline = init_pipeline(self.workspace_path)
        logger.info("✓ Data Pipeline initialized")
        
        # 2. Initialize Backup System
        self.backup_system = init_backup_system(self.workspace_path)
        logger.info("✓ Backup System initialized")
        
        # 3. Initialize WebSocket Server
        self.websocket_server = WebSocketServer(host="0.0.0.0", port=8765)
        logger.info("✓ WebSocket Server initialized")
        
        # Start services
        logger.info("Starting services...")
        
        # Start all services concurrently
        self._tasks = [
            asyncio.create_task(self._run_websocket()),
            asyncio.create_task(self._run_pipeline()),
            asyncio.create_task(self._run_backup()),
            asyncio.create_task(self._status_reporter()),
        ]
        
        logger.info("=" * 60)
        logger.info("All services started successfully!")
        logger.info("WebSocket: ws://0.0.0.0:8765")
        logger.info("=" * 60)
        
        # Wait for all tasks
        try:
            await asyncio.gather(*self._tasks)
        except asyncio.CancelledError:
            logger.info("Services cancelled")
        except Exception as e:
            logger.error(f"Service error: {e}")
    
    async def _run_websocket(self):
        """Run WebSocket server"""
        try:
            await self.websocket_server.start()
        except Exception as e:
            logger.error(f"WebSocket server error: {e}")
    
    async def _run_pipeline(self):
        """Run data pipeline"""
        try:
            await self.data_pipeline.start()
        except Exception as e:
            logger.error(f"Data pipeline error: {e}")
    
    async def _run_backup(self):
        """Run backup system"""
        try:
            await self.backup_system.start()
        except Exception as e:
            logger.error(f"Backup system error: {e}")
    
    async def _status_reporter(self):
        """Periodically report system status"""
        while self._running:
            try:
                await asyncio.sleep(300)  # Report every 5 minutes
                
                status = {
                    "timestamp": asyncio.get_event_loop().time(),
                    "websocket_clients": len(self.websocket_server.broadcaster.connected_clients) if self.websocket_server else 0,
                    "agents_tracked": len(self.data_pipeline.agent_data) if self.data_pipeline else 0,
                    "backups_available": len(self.backup_system.backups) if self.backup_system else 0
                }
                
                logger.info(f"System Status: {status}")
                
                # Save status to file for external monitoring
                status_path = os.path.join(self.workspace_path, "mission-control/backend/status.json")
                with open(status_path, 'w') as f:
                    json.dump(status, f, indent=2)
                    
            except Exception as e:
                logger.error(f"Status reporter error: {e}")
    
    async def stop(self):
        """Stop all services gracefully"""
        logger.info("Stopping all services...")
        self._running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Stop services
        if self.websocket_server:
            await self.websocket_server.stop()
        
        if self.data_pipeline:
            self.data_pipeline.stop()
        
        if self.backup_system:
            self.backup_system.stop()
        
        logger.info("All services stopped")
    
    def get_status(self) -> dict:
        """Get current system status"""
        return {
            "running": self._running,
            "websocket": {
                "enabled": self.websocket_server is not None,
                "clients": len(self.websocket_server.broadcaster.connected_clients) if self.websocket_server else 0
            },
            "data_pipeline": {
                "enabled": self.data_pipeline is not None,
                "agents_tracked": len(self.data_pipeline.agent_data) if self.data_pipeline else 0
            },
            "backup_system": {
                "enabled": self.backup_system is not None,
                "backups_count": len(self.backup_system.backups) if self.backup_system else 0
            }
        }


# Global orchestrator instance
_orchestrator: Optional[BackendOrchestrator] = None

def get_orchestrator() -> Optional[BackendOrchestrator]:
    """Get the orchestrator instance"""
    return _orchestrator


async def main():
    """Main entry point"""
    global _orchestrator
    
    _orchestrator = BackendOrchestrator()
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}, shutting down...")
        asyncio.create_task(_orchestrator.stop())
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await _orchestrator.start()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        await _orchestrator.stop()


if __name__ == "__main__":
    asyncio.run(main())
