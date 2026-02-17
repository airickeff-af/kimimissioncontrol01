"""
Mission Control Backup System
Automated data backups and recovery procedures

Reference: Kairosoft-style save/load game system
"""

import asyncio
import json
import logging
import os
import shutil
import tarfile
import gzip
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from pathlib import Path
import aiofiles
import hashlib

logger = logging.getLogger('mc-backup')


@dataclass
class BackupInfo:
    """Information about a backup"""
    id: str
    timestamp: datetime
    path: str
    size_bytes: int
    file_count: int
    checksum: str
    backup_type: str  # 'full', 'incremental', 'agent_state'
    compressed: bool
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "path": self.path,
            "size_bytes": self.size_bytes,
            "size_human": self._human_readable_size(self.size_bytes),
            "file_count": self.file_count,
            "checksum": self.checksum,
            "backup_type": self.backup_type,
            "compressed": self.compressed
        }
    
    @staticmethod
    def _human_readable_size(size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} TB"


class BackupSystem:
    """Automated backup system for Mission Control"""
    
    # Directories to backup
    BACKUP_SOURCES = [
        "mission-control/agents",
        "mission-control/dashboard",
        "mission-control/logs",
        "mission-control/workflows",
        "mission-control/TASK_QUEUE.md",
        "mission-control/current_office_state.json",
    ]
    
    def __init__(self, workspace_path: str, backup_dir: Optional[str] = None):
        self.workspace_path = workspace_path
        self.backup_dir = backup_dir or os.path.join(workspace_path, "mission-control/backups")
        self.metadata_file = os.path.join(self.backup_dir, "backup_metadata.json")
        
        # Ensure backup directory exists
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Load existing metadata
        self.backups: List[BackupInfo] = []
        self._load_metadata()
        
        self._running = False
        self._backup_interval_hours = 6  # Backup every 6 hours
        self._retention_days = 7  # Keep backups for 7 days
    
    def _load_metadata(self):
        """Load backup metadata from file"""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r') as f:
                    data = json.load(f)
                    for item in data.get("backups", []):
                        self.backups.append(BackupInfo(
                            id=item["id"],
                            timestamp=datetime.fromisoformat(item["timestamp"]),
                            path=item["path"],
                            size_bytes=item["size_bytes"],
                            file_count=item["file_count"],
                            checksum=item["checksum"],
                            backup_type=item["backup_type"],
                            compressed=item["compressed"]
                        ))
            except Exception as e:
                logger.error(f"Error loading backup metadata: {e}")
    
    def _save_metadata(self):
        """Save backup metadata to file"""
        try:
            data = {
                "last_updated": datetime.now().isoformat(),
                "backups": [b.to_dict() for b in self.backups]
            }
            with open(self.metadata_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving backup metadata: {e}")
    
    async def start(self):
        """Start automated backup service"""
        logger.info("Starting backup system...")
        self._running = True
        
        while self._running:
            try:
                # Perform backup
                await self.create_full_backup()
                
                # Clean old backups
                await self.clean_old_backups()
                
                # Wait for next interval
                await asyncio.sleep(self._backup_interval_hours * 3600)
                
            except Exception as e:
                logger.error(f"Error in backup service: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    def stop(self):
        """Stop the backup service"""
        logger.info("Stopping backup system...")
        self._running = False
    
    async def create_full_backup(self) -> BackupInfo:
        """Create a full backup of all mission control data"""
        backup_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(self.backup_dir, f"backup_{backup_id}.tar.gz")
        
        logger.info(f"Creating full backup: {backup_id}")
        
        # Collect files to backup
        files_to_backup = []
        for source in self.BACKUP_SOURCES:
            source_path = os.path.join(self.workspace_path, source)
            if os.path.exists(source_path):
                if os.path.isfile(source_path):
                    files_to_backup.append(source_path)
                else:
                    for root, dirs, files in os.walk(source_path):
                        for file in files:
                            files_to_backup.append(os.path.join(root, file))
        
        # Create tar.gz archive
        file_count = 0
        with tarfile.open(backup_path, "w:gz") as tar:
            for file_path in files_to_backup:
                try:
                    arcname = os.path.relpath(file_path, self.workspace_path)
                    tar.add(file_path, arcname=arcname)
                    file_count += 1
                except Exception as e:
                    logger.warning(f"Could not backup {file_path}: {e}")
        
        # Calculate checksum
        checksum = await self._calculate_checksum(backup_path)
        
        # Get file size
        size_bytes = os.path.getsize(backup_path)
        
        # Create backup info
        backup_info = BackupInfo(
            id=backup_id,
            timestamp=datetime.now(),
            path=backup_path,
            size_bytes=size_bytes,
            file_count=file_count,
            checksum=checksum,
            backup_type="full",
            compressed=True
        )
        
        self.backups.append(backup_info)
        self._save_metadata()
        
        logger.info(f"Backup complete: {backup_id} ({backup_info.size_human}, {file_count} files)")
        
        # Also create agent state snapshot
        await self._create_agent_state_snapshot()
        
        return backup_info
    
    async def create_agent_state_backup(self, agent_id: str) -> Optional[BackupInfo]:
        """Create a backup of specific agent state"""
        agent_path = os.path.join(self.workspace_path, "mission-control/agents", agent_id)
        
        if not os.path.exists(agent_path):
            logger.warning(f"Agent {agent_id} not found")
            return None
        
        backup_id = f"{agent_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backup_path = os.path.join(self.backup_dir, f"agent_{backup_id}.tar.gz")
        
        logger.info(f"Creating agent backup: {agent_id}")
        
        file_count = 0
        with tarfile.open(backup_path, "w:gz") as tar:
            for root, dirs, files in os.walk(agent_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        arcname = os.path.relpath(file_path, self.workspace_path)
                        tar.add(file_path, arcname=arcname)
                        file_count += 1
                    except Exception as e:
                        logger.warning(f"Could not backup {file_path}: {e}")
        
        checksum = await self._calculate_checksum(backup_path)
        size_bytes = os.path.getsize(backup_path)
        
        backup_info = BackupInfo(
            id=backup_id,
            timestamp=datetime.now(),
            path=backup_path,
            size_bytes=size_bytes,
            file_count=file_count,
            checksum=checksum,
            backup_type="agent_state",
            compressed=True
        )
        
        self.backups.append(backup_info)
        self._save_metadata()
        
        logger.info(f"Agent backup complete: {backup_id}")
        return backup_info
    
    async def _create_agent_state_snapshot(self):
        """Create a quick JSON snapshot of all agent states"""
        snapshot = {
            "timestamp": datetime.now().isoformat(),
            "agents": {}
        }
        
        agents_path = os.path.join(self.workspace_path, "mission-control/agents")
        if os.path.exists(agents_path):
            for agent_dir in os.listdir(agents_path):
                state_path = os.path.join(agents_path, agent_dir, "state.json")
                if os.path.exists(state_path):
                    async with aiofiles.open(state_path, 'r') as f:
                        try:
                            content = await f.read()
                            snapshot["agents"][agent_dir] = json.loads(content)
                        except:
                            pass
        
        # Add office state
        office_state_path = os.path.join(self.workspace_path, "mission-control/current_office_state.json")
        if os.path.exists(office_state_path):
            async with aiofiles.open(office_state_path, 'r') as f:
                try:
                    snapshot["office_state"] = json.loads(await f.read())
                except:
                    pass
        
        # Save snapshot
        snapshot_path = os.path.join(self.backup_dir, f"snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        async with aiofiles.open(snapshot_path, 'w') as f:
            await f.write(json.dumps(snapshot, indent=2))
    
    async def _calculate_checksum(self, file_path: str) -> str:
        """Calculate SHA256 checksum of a file"""
        sha256_hash = hashlib.sha256()
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    async def restore_backup(self, backup_id: str, target_path: Optional[str] = None) -> bool:
        """Restore from a backup"""
        backup_info = None
        for b in self.backups:
            if b.id == backup_id:
                backup_info = b
                break
        
        if not backup_info:
            logger.error(f"Backup {backup_id} not found")
            return False
        
        if not os.path.exists(backup_info.path):
            logger.error(f"Backup file not found: {backup_info.path}")
            return False
        
        target = target_path or self.workspace_path
        logger.info(f"Restoring backup {backup_id} to {target}")
        
        try:
            # Extract backup
            with tarfile.open(backup_info.path, "r:gz") as tar:
                tar.extractall(target)
            
            logger.info(f"Backup {backup_id} restored successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error restoring backup: {e}")
            return False
    
    async def restore_agent_state(self, backup_id: str, agent_id: str) -> bool:
        """Restore a specific agent's state"""
        backup_info = None
        for b in self.backups:
            if b.id == backup_id and b.backup_type == "agent_state":
                backup_info = b
                break
        
        if not backup_info:
            logger.error(f"Agent backup {backup_id} not found")
            return False
        
        logger.info(f"Restoring agent {agent_id} from backup {backup_id}")
        
        try:
            # Create temporary extraction directory
            temp_dir = os.path.join(self.backup_dir, f"temp_restore_{backup_id}")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Extract backup
            with tarfile.open(backup_info.path, "r:gz") as tar:
                tar.extractall(temp_dir)
            
            # Move to agent directory
            agent_backup_path = os.path.join(temp_dir, "mission-control/agents", agent_id)
            agent_target_path = os.path.join(self.workspace_path, "mission-control/agents", agent_id)
            
            if os.path.exists(agent_backup_path):
                # Backup current state first
                await self.create_agent_state_backup(agent_id)
                
                # Remove current state
                if os.path.exists(agent_target_path):
                    shutil.rmtree(agent_target_path)
                
                # Move restored state
                shutil.move(agent_backup_path, agent_target_path)
                
                # Clean up temp directory
                shutil.rmtree(temp_dir)
                
                logger.info(f"Agent {agent_id} restored successfully")
                return True
            else:
                logger.error(f"Agent data not found in backup")
                return False
                
        except Exception as e:
            logger.error(f"Error restoring agent state: {e}")
            return False
    
    async def clean_old_backups(self):
        """Remove backups older than retention period"""
        cutoff_date = datetime.now() - timedelta(days=self._retention_days)
        
        to_remove = []
        for backup in self.backups:
            if backup.timestamp < cutoff_date:
                to_remove.append(backup)
        
        for backup in to_remove:
            try:
                if os.path.exists(backup.path):
                    os.remove(backup.path)
                    logger.info(f"Removed old backup: {backup.id}")
                self.backups.remove(backup)
            except Exception as e:
                logger.error(f"Error removing backup {backup.id}: {e}")
        
        self._save_metadata()
    
    def list_backups(self, backup_type: Optional[str] = None) -> List[dict]:
        """List available backups"""
        if backup_type:
            return [b.to_dict() for b in self.backups if b.backup_type == backup_type]
        return [b.to_dict() for b in self.backups]
    
    def get_backup_info(self, backup_id: str) -> Optional[dict]:
        """Get information about a specific backup"""
        for backup in self.backups:
            if backup.id == backup_id:
                return backup.to_dict()
        return None
    
    def verify_backup(self, backup_id: str) -> bool:
        """Verify backup integrity"""
        backup_info = None
        for b in self.backups:
            if b.id == backup_id:
                backup_info = b
                break
        
        if not backup_info or not os.path.exists(backup_info.path):
            return False
        
        current_checksum = asyncio.run(self._calculate_checksum(backup_info.path))
        return current_checksum == backup_info.checksum
    
    async def export_backup(self, backup_id: str, export_path: str) -> bool:
        """Export a backup to external location"""
        backup_info = None
        for b in self.backups:
            if b.id == backup_id:
                backup_info = b
                break
        
        if not backup_info or not os.path.exists(backup_info.path):
            return False
        
        try:
            shutil.copy2(backup_info.path, export_path)
            logger.info(f"Backup exported to {export_path}")
            return True
        except Exception as e:
            logger.error(f"Error exporting backup: {e}")
            return False
    
    def get_recovery_procedures(self) -> dict:
        """Get recovery procedures documentation"""
        return {
            "full_system_restore": {
                "description": "Restore entire Mission Control system from backup",
                "steps": [
                    "Stop all running services",
                    "Identify backup to restore from (use list_backups())",
                    "Run restore_backup(backup_id)",
                    "Verify restoration",
                    "Restart services"
                ],
                "risks": ["Will overwrite current data", "Downtime during restore"],
                "estimated_time": "5-10 minutes"
            },
            "agent_state_restore": {
                "description": "Restore a single agent's state",
                "steps": [
                    "Identify agent backup (use list_backups(backup_type='agent_state'))",
                    "Run restore_agent_state(backup_id, agent_id)",
                    "Verify agent state"
                ],
                "risks": ["Agent will lose progress since backup"],
                "estimated_time": "1-2 minutes"
            },
            "selective_file_restore": {
                "description": "Restore specific files from backup",
                "steps": [
                    "Extract backup to temporary location",
                    "Copy specific files to target location",
                    "Verify file integrity"
                ],
                "risks": ["Manual process, prone to errors"],
                "estimated_time": "Varies"
            }
        }


# Global backup system instance
_backup_system: Optional[BackupSystem] = None

def init_backup_system(workspace_path: Optional[str] = None) -> BackupSystem:
    """Initialize the backup system"""
    global _backup_system
    if workspace_path is None:
        workspace_path = os.path.expanduser("~/.openclaw/workspace")
    _backup_system = BackupSystem(workspace_path)
    return _backup_system

def get_backup_system() -> Optional[BackupSystem]:
    """Get the backup system instance"""
    return _backup_system


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    async def main():
        backup = init_backup_system()
        
        # Create a test backup
        info = await backup.create_full_backup()
        print(f"Created backup: {info.to_dict()}")
        
        # List backups
        print("\nAvailable backups:")
        for b in backup.list_backups():
            print(f"  - {b['id']}: {b['size_human']}")
    
    asyncio.run(main())
