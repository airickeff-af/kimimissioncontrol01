"""
Entity classes for agents, tiles, and objects
"""
import pygame
import random
import math
from typing import Optional, Tuple, List, Dict, Any
from enum import Enum
from sprites.generator import SpriteGenerator, SpriteType

class ActivityType(Enum):
    IDLE = "idle"
    WALKING = "walking"
    WORKING = "working"
    TALKING = "talking"
    AUDITING = "auditing"
    STANDUP = "standup"
    DELEGATED = "delegated"

class Agent:
    """An agent entity that can move and perform activities"""
    
    def __init__(self, agent_id: str, name: str, x: float = 0, y: float = 0,
                 color: str = 'shirt_blue', role: str = 'developer'):
        self.id = agent_id
        self.name = name
        self.x = x
        self.y = y
        self.z = 0
        self.role = role
        
        # Visual
        self.color = color
        self.direction = 'down'
        self.animation_frame = 0
        self.animation_timer = 0
        
        # Activity
        self.activity = ActivityType.IDLE
        self.activity_data: Dict[str, Any] = {}
        self.target_x = x
        self.target_y = y
        self.speed = 2.0
        
        # UI
        self.speech_bubble = None
        self.speech_timer = 0
        self.progress = 0.0
        self.status_text = "Idle"
        
        # Sprite
        self._generator = SpriteGenerator()
        self._sprite = None
        self._update_sprite()
    
    def _update_sprite(self):
        """Update the current sprite based on state"""
        if self.activity == ActivityType.AUDITING:
            self._sprite = self._generator.generate_audit_agent()
        else:
            base = self._generator.generate_agent(
                color_key=self.color,
                direction=self.direction
            )
            if self.activity == ActivityType.WALKING:
                self._sprite = self._generator.generate_walk_frame(
                    base, self.animation_frame, self.direction
                )
            else:
                self._sprite = base
    
    def move_to(self, x: float, y: float):
        """Set movement target"""
        self.target_x = x
        self.target_y = y
        self.activity = ActivityType.WALKING
        
        # Determine direction
        dx = x - self.x
        dy = y - self.y
        if abs(dx) > abs(dy):
            self.direction = 'right' if dx > 0 else 'left'
        else:
            self.direction = 'down' if dy > 0 else 'up'
    
    def say(self, text: str, duration: float = 3.0):
        """Show speech bubble"""
        self.speech_bubble = text
        self.speech_timer = duration
    
    def set_activity(self, activity: ActivityType, data: Dict[str, Any] = None):
        """Set current activity"""
        self.activity = activity
        self.activity_data = data or {}
        
        # Update status text
        status_map = {
            ActivityType.IDLE: "Idle",
            ActivityType.WALKING: "Walking",
            ActivityType.WORKING: f"Working: {data.get('task', 'Unknown')}" if data else "Working",
            ActivityType.TALKING: f"Talking to {data.get('target', 'someone')}" if data else "Talking",
            ActivityType.AUDITING: f"Auditing: {data.get('target', 'Unknown')}" if data else "Auditing",
            ActivityType.STANDUP: "In Standup",
            ActivityType.DELEGATED: f"Delegated: {data.get('from', 'Unknown')}" if data else "Delegated",
        }
        self.status_text = status_map.get(activity, "Unknown")
    
    def update(self, dt: float):
        """Update agent state"""
        # Animation
        self.animation_timer += dt
        if self.animation_timer >= 0.15:
            self.animation_timer = 0
            self.animation_frame = (self.animation_frame + 1) % 4
            self._update_sprite()
        
        # Movement
        if self.activity == ActivityType.WALKING:
            dx = self.target_x - self.x
            dy = self.target_y - self.y
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist < 0.1:
                self.x = self.target_x
                self.y = self.target_y
                self.activity = ActivityType.IDLE
            else:
                move_dist = min(self.speed * dt * 10, dist)
                self.x += (dx / dist) * move_dist
                self.y += (dy / dist) * move_dist
        
        # Speech bubble timer
        if self.speech_timer > 0:
            self.speech_timer -= dt
            if self.speech_timer <= 0:
                self.speech_bubble = None
        
        # Progress animation
        if self.activity == ActivityType.WORKING:
            self.progress = (self.progress + dt * 0.2) % 1.0
    
    def render(self, screen: pygame.Surface, iso_math, camera,
               offset_x: float = 0, offset_y: float = 0):
        """Render the agent"""
        # Calculate screen position
        screen_x, screen_y = iso_math.tile_to_screen(
            self.x, self.y, self.z, offset_x, offset_y
        )
        
        # Apply camera
        final_x, final_y = camera.world_to_screen(screen_x, screen_y)
        
        # Scale sprite
        if camera.zoom != 1.0:
            w = int(32 * camera.zoom)
            h = int(48 * camera.zoom)
            sprite = pygame.transform.scale(self._sprite, (w, h))
        else:
            sprite = self._sprite
            w, h = 32, 48
        
        # Draw shadow
        shadow_surf = pygame.Surface((w, h//4), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surf, (0, 0, 0, 60), (0, 0, w, h//4))
        screen.blit(shadow_surf, (final_x - w//2, final_y - h//8))
        
        # Draw agent
        screen.blit(sprite, (final_x - w//2, final_y - h + h//4))
        
        # Draw speech bubble
        if self.speech_bubble:
            self._render_speech_bubble(screen, final_x, final_y - h, camera.zoom)
        
        # Draw activity bar
        self._render_activity_bar(screen, final_x, final_y, camera.zoom)
    
    def _render_speech_bubble(self, screen: pygame.Surface, x: float, y: float, zoom: float):
        """Render speech bubble above agent"""
        text = self.speech_bubble[:20] + "..." if len(self.speech_bubble) > 20 else self.speech_bubble
        
        # Create bubble surface
        font = pygame.font.Font(None, int(16 * zoom))
        text_surf = font.render(text, True, (0, 0, 0))
        
        bubble_w = max(text_surf.get_width() + 10, 40)
        bubble_h = text_surf.get_height() + 10
        
        bubble = self._generator.generate_speech_bubble(int(bubble_w), bubble_h + 8)
        if zoom != 1.0:
            bubble = pygame.transform.scale(bubble, (int(bubble_w * zoom), int((bubble_h + 8) * zoom)))
            text_surf = pygame.transform.scale(text_surf, 
                (int(text_surf.get_width() * zoom), int(text_surf.get_height() * zoom)))
        
        screen.blit(bubble, (x - bubble.get_width()//2, y - bubble.get_height() - 10))
        screen.blit(text_surf, (x - text_surf.get_width()//2, y - bubble.get_height() - 5))
    
    def _render_activity_bar(self, screen: pygame.Surface, x: float, y: float, zoom: float):
        """Render activity bar below agent"""
        bar_w = int(50 * zoom)
        bar_h = int(16 * zoom)
        
        # Background
        pygame.draw.rect(screen, (30, 30, 30, 200), 
                        (x - bar_w//2, y + 5, bar_w, bar_h))
        
        # Status icon
        status = 'working' if self.activity == ActivityType.WORKING else 'idle'
        if self.activity == ActivityType.AUDITING:
            status = 'audit'
        icon = self._generator.generate_status_icon(status)
        if zoom != 1.0:
            icon = pygame.transform.scale(icon, (int(10*zoom), int(10*zoom)))
        screen.blit(icon, (x - bar_w//2 + 2, y + 8))
        
        # Status text
        font = pygame.font.Font(None, int(10 * zoom))
        text = font.render(self.status_text[:15], True, (255, 255, 255))
        screen.blit(text, (x - bar_w//2 + 15, y + 8))
        
        # Progress bar if working
        if self.activity == ActivityType.WORKING:
            prog_bar = self._generator.generate_progress_bar(int(bar_w - 4), int(4 * zoom), self.progress)
            screen.blit(prog_bar, (x - bar_w//2 + 2, y + bar_h - 6))

class Tile:
    """An isometric tile"""
    
    def __init__(self, x: int, y: int, z: int = 0, tile_type: str = 'floor'):
        self.x = x
        self.y = y
        self.z = z
        self.type = tile_type
        self._generator = SpriteGenerator()
        self._sprite = None
        self._update_sprite()
    
    def _update_sprite(self):
        """Update tile sprite"""
        if self.type == 'floor':
            self._sprite = self._generator.generate_floor_tile((self.x + self.y) % 2)
        elif self.type == 'wall':
            self._sprite = self._generator.generate_wall_tile()
    
    def render(self, screen: pygame.Surface, iso_math, camera,
               offset_x: float = 0, offset_y: float = 0):
        """Render the tile"""
        screen_x, screen_y = iso_math.tile_to_screen(
            self.x, self.y, self.z, offset_x, offset_y
        )
        final_x, final_y = camera.world_to_screen(screen_x, screen_y)
        
        # Scale if needed
        if camera.zoom != 1.0:
            w = int(64 * camera.zoom)
            h = int(32 * camera.zoom)
            sprite = pygame.transform.scale(self._sprite, (w, h))
        else:
            sprite = self._sprite
            w, h = 64, 32
        
        screen.blit(sprite, (final_x - w//2, final_y - h//2))

class Furniture:
    """Office furniture"""
    
    def __init__(self, x: float, y: float, furniture_type: str):
        self.x = x
        self.y = y
        self.z = 0
        self.type = furniture_type
        self._generator = SpriteGenerator()
        self._sprite = None
        self._update_sprite()
    
    def _update_sprite(self):
        """Update furniture sprite"""
        generators = {
            'desk': self._generator.generate_desk,
            'chair': self._generator.generate_chair,
            'computer': self._generator.generate_computer,
            'plant': self._generator.generate_plant,
            'nexus': self._generator.generate_nexus,
        }
        gen = generators.get(self.type, self._generator.generate_desk)
        self._sprite = gen()
    
    def render(self, screen: pygame.Surface, iso_math, camera,
               offset_x: float = 0, offset_y: float = 0):
        """Render the furniture"""
        screen_x, screen_y = iso_math.tile_to_screen(
            self.x, self.y, self.z, offset_x, offset_y
        )
        final_x, final_y = camera.world_to_screen(screen_x, screen_y)
        
        # Scale
        if camera.zoom != 1.0:
            w = int(self._sprite.get_width() * camera.zoom)
            h = int(self._sprite.get_height() * camera.zoom)
            sprite = pygame.transform.scale(self._sprite, (w, h))
        else:
            sprite = self._sprite
            w, h = sprite.get_size()
        
        screen.blit(sprite, (final_x - w//2, final_y - h//2))

class Nexus:
    """Nexus delegation center"""
    
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.z = 0
        self.active_tasks: List[Dict] = []
        self.pulse = 0.0
        self._generator = SpriteGenerator()
        self._sprite = self._generator.generate_nexus()
    
    def update(self, dt: float):
        """Update nexus animation"""
        self.pulse = (self.pulse + dt * 2) % (math.pi * 2)
    
    def render(self, screen: pygame.Surface, iso_math, camera,
               offset_x: float = 0, offset_y: float = 0):
        """Render the nexus"""
        screen_x, screen_y = iso_math.tile_to_screen(
            self.x, self.y, self.z, offset_x, offset_y
        )
        final_x, final_y = camera.world_to_screen(screen_x, screen_y)
        
        # Add floating animation
        float_offset = math.sin(self.pulse) * 3 * camera.zoom
        
        # Scale
        if camera.zoom != 1.0:
            w = int(self._sprite.get_width() * camera.zoom)
            h = int(self._sprite.get_height() * camera.zoom)
            sprite = pygame.transform.scale(self._sprite, (w, h))
        else:
            sprite = self._sprite
            w, h = sprite.get_size()
        
        # Glow effect
        glow_alpha = int(100 + 50 * math.sin(self.pulse * 2))
        glow_surf = pygame.Surface((w + 20, h + 20), pygame.SRCALPHA)
        pygame.draw.ellipse(glow_surf, (100, 255, 200, glow_alpha//4), 
                           (0, 0, w + 20, h + 20))
        screen.blit(glow_surf, (final_x - (w+20)//2, final_y - (h+20)//2 + float_offset))
        
        # Main sprite
        screen.blit(sprite, (final_x - w//2, final_y - h//2 + float_offset))
        
        # Task count badge
        if self.active_tasks:
            badge_text = str(len(self.active_tasks))
            font = pygame.font.Font(None, int(16 * camera.zoom))
            text = font.render(badge_text, True, (255, 255, 255))
            badge_r = int(10 * camera.zoom)
            pygame.draw.circle(screen, (255, 100, 100), 
                             (int(final_x + w//3), int(final_y - h//2 + float_offset)), 
                             badge_r)
            screen.blit(text, (final_x + w//3 - text.get_width()//2, 
                              final_y - h//2 + float_offset - text.get_height()//2))
