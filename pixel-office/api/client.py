"""
API Client for fetching real agent data
"""
import aiohttp
import asyncio
from typing import Optional, Dict, Any

class APIClient:
    """Client for fetching agent data from API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_agents(self) -> Optional[list]:
        """Fetch agents from API"""
        if not self.session:
            return None
        
        try:
            async with self.session.get(f"{self.base_url}/api/agents") as resp:
                if resp.status == 200:
                    return await resp.json()
                return None
        except Exception as e:
            print(f"API Error (agents): {e}")
            return None
    
    async def get_tasks(self) -> Optional[list]:
        """Fetch tasks from API"""
        if not self.session:
            return None
        
        try:
            async with self.session.get(f"{self.base_url}/api/tasks") as resp:
                if resp.status == 200:
                    return await resp.json()
                return None
        except Exception as e:
            print(f"API Error (tasks): {e}")
            return None
    
    async def get_audits(self) -> Optional[list]:
        """Fetch audits from API"""
        if not self.session:
            return None
        
        try:
            async with self.session.get(f"{self.base_url}/api/audits") as resp:
                if resp.status == 200:
                    return await resp.json()
                return None
        except Exception as e:
            print(f"API Error (audits): {e}")
            return None
    
    async def get_all_data(self) -> Dict[str, Any]:
        """Fetch all data in parallel"""
        agents, tasks, audits = await asyncio.gather(
            self.get_agents(),
            self.get_tasks(),
            self.get_audits(),
            return_exceptions=True
        )
        
        return {
            'agents': agents if isinstance(agents, list) else [],
            'tasks': tasks if isinstance(tasks, list) else [],
            'audits': audits if isinstance(audits, list) else [],
        }
