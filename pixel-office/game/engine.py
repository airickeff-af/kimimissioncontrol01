"""
Main game engine using Pygame
"""
import pygame
import sys
import asyncio
from typing import Optional, Dict, Any
from game.isometric import IsometricMath, Camera
from game.world import OfficeWorld

class GameEngine:
    """Main game engine"""
    
    def __init__(self, width: int = 1280, height: int = 720, mock: bool = False):
        pygame.init()
        pygame.display.set_caption("Pixel Office - Isometric Agent Visualization")
        
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)
        self.clock = pygame.time.Clock()
        self.running = False
        self.mock = mock
        
        # Isometric setup
        self.iso_math = IsometricMath(tile_width=64, tile_height=32)
        self.camera = Camera(width, height)
        
        # World
        self.world = OfficeWorld(width=20, height=20)
        
        # Center camera
        center_x, center_y = self.iso_math.tile_to_screen(10, 10)
        self.camera.target_x = center_x
        self.camera.target_y = center_y
        self.camera.x = center_x
        self.camera.y = center_y
        
        # UI
        self.font = pygame.font.Font(None, 24)
        self.show_debug = False
        self.selected_agent = None
        
        # API client (mock for now)
        self.api_data: Optional[Dict] = None
        self.api_update_timer = 0
        
        # Colors
        self.bg_color = (40, 44, 52)
    
    def handle_events(self):
        """Handle input events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                elif event.key == pygame.K_SPACE:
                    self.world.toggle_standup()
                elif event.key == pygame.K_d:
                    self.show_debug = not self.show_debug
                elif event.key == pygame.K_r:
                    # Reset camera
                    center_x, center_y = self.iso_math.tile_to_screen(10, 10)
                    self.camera.target_x = center_x
                    self.camera.target_y = center_y
            
            elif event.type == pygame.MOUSEWHEEL:
                # Zoom at mouse position
                mx, my = pygame.mouse.get_pos()
                factor = 1.1 if event.y > 0 else 0.9
                self.camera.zoom_at(factor, mx, my)
            
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # Left click
                    self._handle_click(event.pos)
            
            elif event.type == pygame.VIDEORESIZE:
                self.width, self.height = event.size
                self.screen = pygame.display.set_mode((self.width, self.height), pygame.RESIZABLE)
                self.camera.width = self.width
                self.camera.height = self.height
        
        # Handle continuous key presses
        keys = pygame.key.get_pressed()
        pan_speed = 10 / self.camera.zoom
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.camera.pan(-pan_speed, 0)
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.camera.pan(pan_speed, 0)
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.camera.pan(0, -pan_speed)
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.camera.pan(0, pan_speed)
    
    def _handle_click(self, pos):
        """Handle mouse click"""
        # Convert screen to world to tile
        wx, wy = self.camera.screen_to_world(pos[0], pos[1])
        tx, ty = self.iso_math.screen_to_tile(wx, wy, 0, 0)
        
        # Check for agent click
        entity = self.world.get_entity_at(tx, ty)
        if entity:
            self.selected_agent = entity
            entity.say("Hello!")
        else:
            self.selected_agent = None
    
    def update(self, dt: float):
        """Update game state"""
        # Update camera
        self.camera.update()
        
        # Fetch API data periodically
        self.api_update_timer += dt
        if self.api_update_timer >= 2.0:  # Every 2 seconds
            self.api_update_timer = 0
            self._fetch_api_data()
        
        # Update world
        self.world.update(dt, self.api_data)
    
    def _fetch_api_data(self):
        """Fetch data from API (mock for now)"""
        if self.mock:
            # Generate mock data
            self.api_data = {
                'agents': [
                    {'id': f'agent_{i}', 'status': random.choice(['idle', 'working']),
                     'current_task': random.choice(['Coding', 'Review', 'Test']),
                     'progress': random.random()}
                    for i in range(len(self.world.agents))
                ],
                'tasks': [
                    {'id': f'task_{i}', 'status': 'active'}
                    for i in range(5)
                ],
                'audits': [
                    {'target_id': f'agent_{i}'}
                    for i in range(random.randint(0, 2))
                ]
            }
        else:
            # TODO: Implement real API client
            self.api_data = None
    
    def render(self):
        """Render the game"""
        # Clear screen
        self.screen.fill(self.bg_color)
        
        # Calculate render offset (center of screen in world coords)
        offset_x = 0
        offset_y = 0
        
        # Get sorted entities
        entities = self.world.get_entities_for_render()
        
        # Render entities
        for entity in entities:
            entity.render(self.screen, self.iso_math, self.camera, offset_x, offset_y)
        
        # Render UI
        self._render_ui()
        
        # Flip display
        pygame.display.flip()
    
    def _render_ui(self):
        """Render UI overlay"""
        # Title
        title = self.font.render("Pixel Office - Press SPACE for Standup", True, (255, 255, 255))
        self.screen.blit(title, (10, 10))
        
        # Controls
        controls = [
            "Controls: Arrows/WASD=Pan, Mouse Wheel=Zoom, Click=Select, D=Debug",
            f"Agents: {len(self.world.agents)} | Standup: {'ON' if self.world.standup_active else 'OFF'}",
            f"Zoom: {self.camera.zoom:.1f}x"
        ]
        for i, text in enumerate(controls):
            surf = self.font.render(text, True, (200, 200, 200))
            self.screen.blit(surf, (10, 40 + i * 25))
        
        # Debug info
        if self.show_debug:
            debug_texts = [
                f"Camera: ({self.camera.x:.1f}, {self.camera.y:.1f})",
                f"FPS: {self.clock.get_fps():.1f}",
            ]
            if self.selected_agent:
                debug_texts.extend([
                    f"Selected: {self.selected_agent.name}",
                    f"  Pos: ({self.selected_agent.x:.1f}, {self.selected_agent.y:.1f})",
                    f"  Activity: {self.selected_agent.activity.value}",
                    f"  Status: {self.selected_agent.status_text}",
                ])
            
            for i, text in enumerate(debug_texts):
                surf = self.font.render(text, True, (255, 255, 0))
                self.screen.blit(surf, (10, self.height - 150 + i * 25))
        
        # Selected agent info panel
        if self.selected_agent:
            self._render_agent_panel(self.selected_agent)
    
    def _render_agent_panel(self, agent):
        """Render info panel for selected agent"""
        panel_w = 250
        panel_h = 120
        panel_x = self.width - panel_w - 10
        panel_y = 10
        
        # Background
        pygame.draw.rect(self.screen, (30, 35, 45, 230), 
                        (panel_x, panel_y, panel_w, panel_h))
        pygame.draw.rect(self.screen, (100, 150, 200), 
                        (panel_x, panel_y, panel_w, panel_h), 2)
        
        # Agent info
        name_surf = self.font.render(agent.name, True, (255, 255, 255))
        self.screen.blit(name_surf, (panel_x + 10, panel_y + 10))
        
        role_surf = self.font.render(f"Role: {agent.role}", True, (200, 200, 200))
        self.screen.blit(role_surf, (panel_x + 10, panel_y + 35))
        
        status_surf = self.font.render(f"Status: {agent.status_text}", True, (150, 255, 150))
        self.screen.blit(status_surf, (panel_x + 10, panel_y + 60))
        
        # Progress bar if working
        if agent.activity.value == 'working':
            bar_w = panel_w - 20
            bar_h = 10
            filled = int(bar_w * agent.progress)
            pygame.draw.rect(self.screen, (60, 60, 60), 
                           (panel_x + 10, panel_y + 90, bar_w, bar_h))
            pygame.draw.rect(self.screen, (100, 200, 100), 
                           (panel_x + 10, panel_y + 90, filled, bar_h))
            pygame.draw.rect(self.screen, (200, 200, 200), 
                           (panel_x + 10, panel_y + 90, bar_w, bar_h), 1)
    
    def run(self):
        """Main game loop"""
        self.running = True
        
        while self.running:
            dt = self.clock.tick(60) / 1000.0  # Delta time in seconds
            
            self.handle_events()
            self.update(dt)
            self.render()
        
        pygame.quit()

# Import random for mock data
import random
