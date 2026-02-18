"""
WebSocket server for web-based visualization
"""
import asyncio
import json
import websockets
import pygame
import io
import base64
from typing import Set, Dict, Any, Optional
from game.isometric import IsometricMath, Camera
from game.world import OfficeWorld
from api.mock import MockAPI
from api.client import APIClient

class WebSocketServer:
    """WebSocket server that streams game state to web clients"""
    
    def __init__(self, mock: bool = False, api_url: str = "http://localhost:8000"):
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.mock = mock
        self.api_url = api_url
        
        # Initialize pygame for surface rendering
        pygame.init()
        pygame.display.set_mode((1, 1), pygame.HIDDEN)
        
        # Game state
        self.iso_math = IsometricMath(tile_width=64, tile_height=32)
        self.world = OfficeWorld(width=20, height=20)
        self.mock_api = MockAPI() if mock else None
        self.api_client: Optional[APIClient] = None
        
        # Render surface
        self.surface = pygame.Surface((800, 600))
        self.camera = Camera(800, 600)
        
        # Center camera
        center_x, center_y = self.iso_math.tile_to_screen(10, 10)
        self.camera.target_x = center_x
        self.camera.target_y = center_y
        self.camera.x = center_x
        self.camera.y = center_y
    
    async def register(self, websocket: websockets.WebSocketServerProtocol):
        """Register a new client"""
        self.clients.add(websocket)
        print(f"Client connected. Total: {len(self.clients)}")
    
    async def unregister(self, websocket: websockets.WebSocketServerProtocol):
        """Unregister a client"""
        self.clients.discard(websocket)
        print(f"Client disconnected. Total: {len(self.clients)}")
    
    async def handle_client(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Handle client connection"""
        await self.register(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        finally:
            await self.unregister(websocket)
    
    async def handle_message(self, websocket: websockets.WebSocketServerProtocol, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            action = data.get('action')
            
            if action == 'pan':
                dx = data.get('dx', 0)
                dy = data.get('dy', 0)
                self.camera.pan(dx, dy)
            
            elif action == 'zoom':
                factor = data.get('factor', 1.0)
                self.camera.zoom = max(0.5, min(3.0, self.camera.zoom * factor))
            
            elif action == 'click':
                x = data.get('x', 0)
                y = data.get('y', 0)
                self._handle_click(x, y)
            
            elif action == 'toggle_standup':
                self.world.toggle_standup()
            
            elif action == 'get_state':
                state = self._get_state()
                await websocket.send(json.dumps({'type': 'state', 'data': state}))
        
        except json.JSONDecodeError:
            pass
    
    def _handle_click(self, x: float, y: float):
        """Handle click in world coordinates"""
        wx, wy = self.camera.screen_to_world(x, y)
        tx, ty = self.iso_math.screen_to_tile(wx, wy, 0, 0)
        entity = self.world.get_entity_at(tx, ty)
        if entity:
            entity.say("Hello from web!")
    
    def _get_state(self) -> Dict[str, Any]:
        """Get current game state as JSON"""
        return {
            'agents': [
                {
                    'id': a.id,
                    'name': a.name,
                    'x': a.x,
                    'y': a.y,
                    'role': a.role,
                    'activity': a.activity.value,
                    'status_text': a.status_text,
                    'progress': a.progress,
                    'speech': a.speech_bubble,
                    'direction': a.direction,
                }
                for a in self.world.agents
            ],
            'furniture': [
                {
                    'type': f.type,
                    'x': f.x,
                    'y': f.y,
                }
                for f in self.world.furniture
            ],
            'nexus': {
                'x': self.world.nexus.x,
                'y': self.world.nexus.y,
                'tasks': len(self.world.nexus.active_tasks),
            } if self.world.nexus else None,
            'standup_active': self.world.standup_active,
            'camera': {
                'x': self.camera.x,
                'y': self.camera.y,
                'zoom': self.camera.zoom,
            }
        }
    
    def _render_frame(self) -> str:
        """Render a frame and return as base64 PNG"""
        # Clear
        self.surface.fill((40, 44, 52))
        
        # Update camera
        self.camera.update()
        
        # Render entities
        entities = self.world.get_entities_for_render()
        for entity in entities:
            entity.render(self.surface, self.iso_math, self.camera, 0, 0)
        
        # Convert to PNG
        buffer = io.BytesIO()
        pygame.image.save(self.surface, buffer, 'PNG')
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')
    
    async def game_loop(self):
        """Main game loop"""
        last_api_update = 0
        
        while True:
            dt = 1/30  # 30 FPS for web
            
            # Update API data
            last_api_update += dt
            api_data = None
            
            if last_api_update >= 2.0:
                last_api_update = 0
                if self.mock_api:
                    api_data = self.mock_api.get_data()
                elif self.api_client:
                    api_data = await self.api_client.get_all_data()
            
            # Update world
            self.world.update(dt, api_data)
            
            # Broadcast to clients
            if self.clients:
                state = self._get_state()
                # frame = self._render_frame()
                message = json.dumps({
                    'type': 'update',
                    'state': state,
                    # 'frame': frame,
                })
                
                # Send to all clients
                disconnected = set()
                for client in self.clients:
                    try:
                        await client.send(message)
                    except websockets.exceptions.ConnectionClosed:
                        disconnected.add(client)
                
                # Clean up disconnected clients
                self.clients -= disconnected
            
            await asyncio.sleep(dt)
    
    async def run(self, host: str = '0.0.0.0', port: int = 8765):
        """Run the server"""
        print(f"Starting WebSocket server on ws://{host}:{port}")
        print(f"Open http://{host}:{port} in browser")
        
        # Start API client if not using mock
        if not self.mock:
            self.api_client = APIClient(self.api_url)
            await self.api_client.__aenter__()
        
        # Start WebSocket server
        server = await websockets.serve(
            self.handle_client, host, port
        )
        
        # Run game loop
        try:
            await self.game_loop()
        finally:
            server.close()
            await server.wait_closed()
            if self.api_client:
                await self.api_client.__aexit__(None, None, None)

async def run_server(mock: bool = False, api_url: str = "http://localhost:8000"):
    """Run the WebSocket server"""
    server = WebSocketServer(mock=mock, api_url=api_url)
    await server.run()
