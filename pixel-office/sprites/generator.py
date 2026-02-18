"""
Procedural sprite generation for pixel art assets
"""
import pygame
import random
from typing import Tuple, Optional, List
from enum import Enum

class SpriteType(Enum):
    AGENT = "agent"
    TILE_FLOOR = "floor"
    TILE_WALL = "wall"
    DESK = "desk"
    CHAIR = "chair"
    COMPUTER = "computer"
    PLANT = "plant"
    NEXUS = "nexus"
    AUDIT = "audit"

class SpriteGenerator:
    """Generates procedural pixel art sprites"""
    
    # Minecraft-style palette
    COLORS = {
        'skin_light': (255, 224, 189),
        'skin_medium': (240, 194, 123),
        'skin_dark': (141, 85, 36),
        'shirt_blue': (66, 135, 245),
        'shirt_red': (245, 66, 66),
        'shirt_green': (66, 245, 111),
        'shirt_purple': (147, 66, 245),
        'shirt_orange': (245, 147, 66),
        'pants_dark': (45, 45, 60),
        'pants_jeans': (66, 88, 122),
        'hair_black': (30, 30, 30),
        'hair_brown': (101, 67, 33),
        'hair_blonde': (240, 200, 100),
        'shoes': (60, 40, 30),
        'wood_dark': (101, 67, 33),
        'wood_light': (160, 120, 80),
        'metal': (140, 140, 150),
        'screen_blue': (100, 150, 255),
        'screen_glow': (150, 200, 255),
        'plant_green': (50, 150, 50),
        'plant_dark': (30, 100, 30),
        'pot': (180, 120, 80),
        'floor_1': (200, 190, 170),
        'floor_2': (180, 170, 150),
        'wall': (220, 210, 200),
        'nexus_glow': (100, 255, 200),
        'audit_gold': (255, 215, 0),
        'white': (255, 255, 255),
        'black': (0, 0, 0),
        'shadow': (0, 0, 0, 80),
    }
    
    def __init__(self, tile_size: int = 32):
        self.tile_size = tile_size
        self.cache = {}
    
    def _create_surface(self, width: int, height: int, alpha: bool = True) -> pygame.Surface:
        """Create a surface with optional alpha channel"""
        if alpha:
            return pygame.Surface((width, height), pygame.SRCALPHA)
        return pygame.Surface((width, height))
    
    def generate_agent(self, color_key: str = 'shirt_blue', 
                       skin_key: str = 'skin_medium',
                       hair_key: str = 'hair_brown',
                       direction: str = 'down') -> pygame.Surface:
        """Generate a 32x48 agent sprite"""
        cache_key = f"agent_{color_key}_{skin_key}_{hair_key}_{direction}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(32, 48)
        c = self.COLORS
        
        # Body colors
        shirt = c[color_key]
        skin = c[skin_key]
        hair = c[hair_key]
        pants = c['pants_dark']
        shoes = c['shoes']
        
        # Draw based on direction
        if direction == 'down':
            # Head (8x8)
            pygame.draw.rect(surf, skin, (12, 4, 8, 8))
            # Hair
            pygame.draw.rect(surf, hair, (12, 2, 8, 4))
            # Eyes
            pygame.draw.rect(surf, c['black'], (13, 7, 2, 2))
            pygame.draw.rect(surf, c['black'], (17, 7, 2, 2))
            # Body
            pygame.draw.rect(surf, shirt, (10, 12, 12, 14))
            # Arms
            pygame.draw.rect(surf, skin, (8, 14, 2, 8))
            pygame.draw.rect(surf, skin, (22, 14, 2, 8))
            # Legs
            pygame.draw.rect(surf, pants, (11, 26, 4, 14))
            pygame.draw.rect(surf, pants, (17, 26, 4, 14))
            # Shoes
            pygame.draw.rect(surf, shoes, (10, 38, 6, 4))
            pygame.draw.rect(surf, shoes, (16, 38, 6, 4))
            
        elif direction == 'up':
            # Head (back)
            pygame.draw.rect(surf, hair, (12, 2, 8, 10))
            # Body
            pygame.draw.rect(surf, shirt, (10, 12, 12, 14))
            # Arms
            pygame.draw.rect(surf, shirt, (8, 14, 2, 8))
            pygame.draw.rect(surf, shirt, (22, 14, 2, 8))
            # Legs
            pygame.draw.rect(surf, pants, (11, 26, 4, 14))
            pygame.draw.rect(surf, pants, (17, 26, 4, 14))
            # Shoes
            pygame.draw.rect(surf, shoes, (10, 38, 6, 4))
            pygame.draw.rect(surf, shoes, (16, 38, 6, 4))
            
        elif direction == 'left':
            # Head (side)
            pygame.draw.rect(surf, skin, (12, 4, 6, 8))
            pygame.draw.rect(surf, hair, (12, 2, 6, 4))
            # Eye
            pygame.draw.rect(surf, c['black'], (13, 7, 2, 2))
            # Body
            pygame.draw.rect(surf, shirt, (10, 12, 8, 14))
            # Arm
            pygame.draw.rect(surf, skin, (8, 14, 2, 8))
            # Legs
            pygame.draw.rect(surf, pants, (10, 26, 3, 14))
            pygame.draw.rect(surf, pants, (15, 26, 3, 14))
            # Shoes
            pygame.draw.rect(surf, shoes, (9, 38, 4, 4))
            pygame.draw.rect(surf, shoes, (15, 38, 4, 4))
            
        elif direction == 'right':
            # Head (side, mirrored)
            pygame.draw.rect(surf, skin, (14, 4, 6, 8))
            pygame.draw.rect(surf, hair, (14, 2, 6, 4))
            # Eye
            pygame.draw.rect(surf, c['black'], (17, 7, 2, 2))
            # Body
            pygame.draw.rect(surf, shirt, (14, 12, 8, 14))
            # Arm
            pygame.draw.rect(surf, skin, (22, 14, 2, 8))
            # Legs
            pygame.draw.rect(surf, pants, (14, 26, 3, 14))
            pygame.draw.rect(surf, pants, (19, 26, 3, 14))
            # Shoes
            pygame.draw.rect(surf, shoes, (13, 38, 4, 4))
            pygame.draw.rect(surf, shoes, (19, 38, 4, 4))
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_walk_frame(self, base_sprite: pygame.Surface, 
                           frame: int, direction: str) -> pygame.Surface:
        """Generate a walking animation frame by offsetting legs"""
        # Simple bobbing animation
        offset = [0, -1, 0, -1][frame % 4]
        surf = self._create_surface(32, 48)
        surf.blit(base_sprite, (0, offset))
        return surf
    
    def generate_floor_tile(self, variant: int = 0) -> pygame.Surface:
        """Generate an isometric floor tile (64x32)"""
        cache_key = f"floor_{variant}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(64, 32)
        c = self.COLORS
        
        # Diamond shape for isometric tile
        color = c['floor_1'] if variant % 2 == 0 else c['floor_2']
        
        # Draw diamond
        points = [(32, 0), (64, 16), (32, 32), (0, 16)]
        pygame.draw.polygon(surf, color, points)
        
        # Add subtle border
        pygame.draw.polygon(surf, (color[0]-20, color[1]-20, color[2]-20), points, 1)
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_wall_tile(self, height: int = 64) -> pygame.Surface:
        """Generate a wall tile"""
        cache_key = f"wall_{height}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(64, height)
        c = self.COLORS
        
        # Wall face (right side visible)
        color = c['wall']
        shadow = (color[0]-30, color[1]-30, color[2]-30)
        
        # Front face
        pygame.draw.polygon(surf, color, [
            (0, height-32), (32, height-16), (32, 16), (0, 0)
        ])
        # Side face
        pygame.draw.polygon(surf, shadow, [
            (32, height-16), (64, height-32), (64, 0), (32, 16)
        ])
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_desk(self) -> pygame.Surface:
        """Generate a desk sprite"""
        cache_key = "desk"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(48, 40)
        c = self.COLORS
        
        # Desk top (isometric rectangle)
        pygame.draw.polygon(surf, c['wood_light'], [
            (24, 8), (44, 18), (24, 28), (4, 18)
        ])
        # Legs
        pygame.draw.rect(surf, c['wood_dark'], (8, 20, 4, 16))
        pygame.draw.rect(surf, c['wood_dark'], (36, 20, 4, 16))
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_chair(self) -> pygame.Surface:
        """Generate a chair sprite"""
        cache_key = "chair"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(32, 32)
        c = self.COLORS
        
        # Seat
        pygame.draw.polygon(surf, c['wood_dark'], [
            (16, 12), (26, 17), (16, 22), (6, 17)
        ])
        # Back
        pygame.draw.polygon(surf, c['wood_light'], [
            (6, 17), (16, 12), (16, 4), (6, 9)
        ])
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_computer(self) -> pygame.Surface:
        """Generate a computer/monitor sprite"""
        cache_key = "computer"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(24, 24)
        c = self.COLORS
        
        # Monitor base
        pygame.draw.rect(surf, c['metal'], (8, 16, 8, 4))
        # Screen bezel
        pygame.draw.rect(surf, c['metal'], (4, 4, 16, 12))
        # Screen
        pygame.draw.rect(surf, c['screen_blue'], (6, 6, 12, 8))
        # Glow effect
        pygame.draw.rect(surf, c['screen_glow'], (8, 8, 2, 2))
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_plant(self) -> pygame.Surface:
        """Generate a potted plant"""
        cache_key = "plant"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(24, 32)
        c = self.COLORS
        
        # Pot
        pygame.draw.polygon(surf, c['pot'], [
            (8, 20), (16, 20), (18, 28), (6, 28)
        ])
        # Plant leaves
        pygame.draw.circle(surf, c['plant_green'], (12, 14), 6)
        pygame.draw.circle(surf, c['plant_dark'], (10, 12), 4)
        pygame.draw.circle(surf, c['plant_green'], (14, 10), 4)
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_nexus(self) -> pygame.Surface:
        """Generate Nexus delegation visual"""
        cache_key = "nexus"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(48, 48)
        c = self.COLORS
        
        # Base platform
        pygame.draw.ellipse(surf, (50, 50, 70), (4, 32, 40, 12))
        # Glowing core
        pygame.draw.circle(surf, c['nexus_glow'], (24, 20), 12)
        pygame.draw.circle(surf, (150, 255, 220), (24, 20), 8)
        # Rings
        pygame.draw.ellipse(surf, c['nexus_glow'], (8, 28, 32, 8), 2)
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_audit_agent(self) -> pygame.Surface:
        """Generate an audit agent (gold variant)"""
        cache_key = "audit_agent"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        surf = self._create_surface(32, 48)
        c = self.COLORS
        
        # Gold-colored agent
        gold = c['audit_gold']
        skin = c['skin_light']
        
        # Head
        pygame.draw.rect(surf, skin, (12, 4, 8, 8))
        # Gold helmet/halo
        pygame.draw.rect(surf, gold, (10, 0, 12, 4))
        pygame.draw.rect(surf, gold, (8, 2, 16, 2))
        # Eyes
        pygame.draw.rect(surf, c['black'], (13, 7, 2, 2))
        pygame.draw.rect(surf, c['black'], (17, 7, 2, 2))
        # Gold body (robe)
        pygame.draw.rect(surf, gold, (10, 12, 12, 16))
        pygame.draw.rect(surf, (200, 170, 0), (10, 12, 12, 16), 1)
        # Legs
        pygame.draw.rect(surf, (180, 150, 0), (11, 28, 4, 14))
        pygame.draw.rect(surf, (180, 150, 0), (17, 28, 4, 14))
        
        self.cache[cache_key] = surf
        return surf
    
    def generate_speech_bubble(self, width: int = 64, height: int = 32) -> pygame.Surface:
        """Generate a speech bubble"""
        surf = self._create_surface(width, height)
        
        # Bubble body
        pygame.draw.ellipse(surf, (255, 255, 255, 230), (0, 0, width, height-8))
        pygame.draw.ellipse(surf, (0, 0, 0), (0, 0, width, height-8), 2)
        
        # Tail
        pygame.draw.polygon(surf, (255, 255, 255, 230), [
            (width//2-4, height-10), (width//2+4, height-10), (width//2, height)
        ])
        pygame.draw.polygon(surf, (0, 0, 0), [
            (width//2-4, height-10), (width//2+4, height-10), (width//2, height)
        ], 2)
        
        return surf
    
    def generate_progress_bar(self, width: int = 40, height: int = 6, 
                             progress: float = 0.5) -> pygame.Surface:
        """Generate a progress bar"""
        surf = self._create_surface(width, height)
        
        # Background
        pygame.draw.rect(surf, (60, 60, 60), (0, 0, width, height))
        # Fill
        fill_width = int(width * max(0, min(1, progress)))
        if fill_width > 0:
            pygame.draw.rect(surf, (100, 200, 100), (0, 0, fill_width, height))
        # Border
        pygame.draw.rect(surf, (200, 200, 200), (0, 0, width, height), 1)
        
        return surf
    
    def generate_status_icon(self, status: str) -> pygame.Surface:
        """Generate a status icon"""
        surf = self._create_surface(12, 12)
        
        colors = {
            'idle': (150, 150, 150),
            'working': (100, 200, 100),
            'busy': (200, 150, 100),
            'error': (200, 100, 100),
            'audit': (255, 215, 0),
        }
        
        color = colors.get(status, colors['idle'])
        pygame.draw.circle(surf, color, (6, 6), 5)
        pygame.draw.circle(surf, (255, 255, 255), (6, 6), 5, 1)
        
        return surf
