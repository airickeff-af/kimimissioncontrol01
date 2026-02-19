"""
Sprite Sheet Generator for Pixel Office
Creates 16x16 and 32x32 Minecraft-style sprite sheets for all 22 agents
"""
import pygame
import json
import os
import sys
from typing import Dict, List, Tuple, Optional
from enum import Enum


class PygameInitError(Exception):
    """Raised when pygame initialization fails."""
    pass


class AnimationType(Enum):
    """Animation types supported by the sprite system."""
    IDLE = "idle"
    WALK_DOWN = "walk_down"
    WALK_UP = "walk_up"
    WALK_LEFT = "walk_left"
    WALK_RIGHT = "walk_right"
    TYPING = "typing"
    TALKING = "talking"
    AUDIT = "audit"


class AgentStyle:
    """Style definition for each agent."""
    
    def __init__(self, name: str, color: Tuple[int, int, int], 
                 accessory: Optional[str] = None, 
                 skin: Optional[Tuple[int, int, int]] = None,
                 hair: Optional[Tuple[int, int, int]] = None):
        """
        Initialize agent style.
        
        Args:
            name: Display name of the agent
            color: Primary color (shirt/uniform) as RGB tuple
            accessory: Optional accessory type (e.g., 'crown', 'glasses')
            skin: Optional skin color as RGB tuple (defaults to peach)
            hair: Optional hair color as RGB tuple (defaults to brown)
        """
        self.name = name
        self.color = color
        self.accessory = accessory
        self.skin = skin or (255, 224, 189)
        self.hair = hair or (101, 67, 33)


# Define all 22 agents with their unique styles
AGENT_STYLES = {
    'ericf': AgentStyle('EricF', (255, 215, 0), 'crown', (240, 194, 123), (30, 30, 30)),
    'nexus': AgentStyle('Nexus', (0, 212, 255), 'robot', (200, 200, 220), None),
    'codemaster': AgentStyle('CodeMaster', (34, 197, 94), 'glasses', (240, 194, 123), (30, 30, 30)),
    'code-1': AgentStyle('Code-1', (34, 197, 94), 'headphones', (255, 224, 189), (101, 67, 33)),
    'code-2': AgentStyle('Code-2', (34, 197, 94), 'cap', (141, 85, 36), (30, 30, 30)),
    'code-3': AgentStyle('Code-3', (34, 197, 94), 'beard', (240, 194, 123), (60, 40, 30)),
    'forge': AgentStyle('Forge', (249, 115, 22), 'hammer', (255, 224, 189), (180, 120, 80)),
    'forge-2': AgentStyle('Forge-2', (249, 115, 22), 'brush', (255, 224, 189), (240, 200, 100)),
    'forge-3': AgentStyle('Forge-3', (249, 115, 22), 'palette', (240, 194, 123), (101, 67, 33)),
    'pixel': AgentStyle('Pixel', (168, 85, 247), 'pixel', (255, 224, 189), (240, 200, 100)),
    'glasses': AgentStyle('Glasses', (59, 130, 246), 'magnifier', (255, 224, 189), (30, 30, 30)),
    'quill': AgentStyle('Quill', (236, 72, 153), 'quill', (255, 224, 189), (240, 200, 100)),
    'gary': AgentStyle('Gary', (245, 158, 11), 'megaphone', (240, 194, 123), (60, 40, 30)),
    'larry': AgentStyle('Larry', (6, 182, 212), 'phone', (255, 224, 189), (30, 30, 30)),
    'buzz': AgentStyle('Buzz', (251, 191, 36), 'bee', (255, 224, 189), (240, 200, 100)),
    'sentry': AgentStyle('Sentry', (239, 68, 68), 'shield', (240, 194, 123), (30, 30, 30)),
    'audit': AgentStyle('Audit', (139, 92, 246), 'magnifier_gold', (255, 224, 189), (255, 215, 0)),
    'cipher': AgentStyle('Cipher', (99, 102, 241), 'lock', (240, 194, 123), (30, 30, 30)),
    'dealflow': AgentStyle('DealFlow', (16, 185, 129), 'briefcase', (240, 194, 123), (60, 40, 30)),
    'coldcall': AgentStyle('ColdCall', (249, 115, 22), 'phone', (255, 224, 189), (101, 67, 33)),
    'scout': AgentStyle('Scout', (0, 212, 255), 'telescope', (255, 224, 189), (240, 200, 100)),
    'pie': AgentStyle('PIE', (139, 92, 246), 'brain', (240, 194, 123), (30, 30, 30)),
}


class SpriteSheetGenerator:
    """Generates complete sprite sheets for agents."""
    
    def __init__(self, sprite_size: int = 32, output_dir: Optional[str] = None):
        """
        Initialize the sprite sheet generator.
        
        Args:
            sprite_size: Size of each sprite in pixels (16 or 32)
            output_dir: Output directory for generated sprites (defaults to "assets/sprites")
        """
        self.sprite_size = sprite_size
        self.frame_size = sprite_size
        self.output_dir = output_dir or "assets/sprites"
        # 8 animations × 8 frames each = 64 sprites per row
        self.sheet_width = 64 * sprite_size
        self.sheet_height = len(AGENT_STYLES) * sprite_size
        
    def _create_surface(self, width: int, height: int) -> pygame.Surface:
        """Create a transparent surface for drawing."""
        return pygame.Surface((width, height), pygame.SRCALPHA)
    
    def _draw_pixel(self, surf: pygame.Surface, x: int, y: int, 
                   color: Tuple[int, int, int, int]) -> None:
        """Draw a single pixel on the surface if within bounds."""
        if 0 <= x < surf.get_width() and 0 <= y < surf.get_height():
            surf.set_at((x, y), color)
    
    def _draw_rect(self, surf: pygame.Surface, x: int, y: int, 
                  w: int, h: int, color: Tuple[int, int, int]) -> None:
        """Draw a rectangle of pixels on the surface."""
        for dy in range(h):
            for dx in range(w):
                self._draw_pixel(surf, x + dx, y + dy, (*color, 255))
    
    def _get_animation_offset(self, anim: AnimationType, frame: int) -> Tuple[int, int, int]:
        """
        Calculate animation offsets for bobbing, legs, and arms.
        
        Args:
            anim: The animation type
            frame: Current frame number (0-7)
            
        Returns:
            Tuple of (bob, leg_offset, arm_offset)
        """
        bob = 0
        leg_offset = 0
        arm_offset = 0
        
        if anim == AnimationType.IDLE:
            # Breathing animation - subtle bob
            bob = [0, 0, -1, -1, 0, 0, 0, 0][frame % 8]
        elif anim == AnimationType.TYPING:
            # Typing animation - arms moving rapidly
            bob = [0, 0, -1, -1, 0, 0, 0, 0][frame % 8]
            arm_offset = [0, 1, 0, 1, 0, 1, 0, 1][frame % 8]
        elif anim == AnimationType.TALKING:
            # Talking animation - head bobs more
            bob = [0, -1, 0, -1, 0, -1, 0, 0][frame % 8]
        elif anim == AnimationType.AUDIT:
            # Audit animation - scanning motion
            bob = [0, 0, -1, -1, 0, 0, 0, 0][frame % 8]
            arm_offset = [0, 0, 1, 1, 0, 0, 0, 0][frame % 8]
        elif 'walk' in anim.value:
            # Walking animation - full body motion
            walk_cycle = [0, -1, -2, -1, 0, -1, -2, -1]
            bob = walk_cycle[frame % 8]
            leg_offset = [0, 1, 0, -1, 0, 1, 0, -1][frame % 8]
            
        return bob, leg_offset, arm_offset
    
    def generate_agent_sprite(self, style: AgentStyle, anim: AnimationType, 
                             frame: int) -> pygame.Surface:
        """
        Generate a single agent sprite.
        
        Args:
            style: The agent's style definition
            anim: Animation type to render
            frame: Frame number (0-7)
            
        Returns:
            Pygame surface containing the rendered sprite
        """
        size = self.sprite_size
        surf = self._create_surface(size, size)
        
        # Scale factor for different sizes (16px vs 32px)
        scale = size // 16
        
        c = style.color
        skin = style.skin
        hair = style.hair or (101, 67, 33)
        pants = (45, 45, 60)
        shoes = (60, 40, 30)
        
        # Get animation offsets
        bob, leg_offset, arm_offset = self._get_animation_offset(anim, frame)
        
        base_y = 8 * scale + bob
        
        # Determine direction from animation type
        direction = 'down'
        if anim == AnimationType.WALK_UP:
            direction = 'up'
        elif anim == AnimationType.WALK_LEFT:
            direction = 'left'
        elif anim == AnimationType.WALK_RIGHT:
            direction = 'right'
        
        # Draw the base character body based on direction
        self._draw_character_body(surf, direction, base_y, scale, c, skin, hair, pants, shoes, leg_offset, arm_offset)
        
        # Add accessory for the current direction
        self._draw_accessory(surf, style, direction, base_y, scale)
        
        # Add glow effect for special agents
        if style.name in ['Nexus', 'EricF']:
            self._add_glow(surf, style, scale)
        
        return surf
    
    def _draw_character_body(self, surf: pygame.Surface, direction: str, base_y: int, 
                             scale: int, color: Tuple[int, int, int], 
                             skin: Tuple[int, int, int], hair: Tuple[int, int, int],
                             pants: Tuple[int, int, int], shoes: Tuple[int, int, int],
                             leg_offset: int, arm_offset: int) -> None:
        """Draw the character body based on facing direction."""
        head_y = base_y - 6 * scale
        
        if direction == 'down':
            self._draw_body_down(surf, base_y, head_y, scale, color, skin, hair, pants, shoes, leg_offset, arm_offset)
        elif direction == 'up':
            self._draw_body_up(surf, base_y, head_y, scale, color, skin, hair, pants, shoes, leg_offset, arm_offset)
        elif direction == 'left':
            self._draw_body_left(surf, base_y, head_y, scale, color, skin, hair, pants, shoes, leg_offset, arm_offset)
        elif direction == 'right':
            self._draw_body_right(surf, base_y, head_y, scale, color, skin, hair, pants, shoes, leg_offset, arm_offset)
    
    def _draw_body_down(self, surf: pygame.Surface, base_y: int, head_y: int, 
                        scale: int, color: Tuple[int, int, int], 
                        skin: Tuple[int, int, int], hair: Tuple[int, int, int],
                        pants: Tuple[int, int, int], shoes: Tuple[int, int, int],
                        leg_offset: int, arm_offset: int) -> None:
        """Draw character facing down (front view)."""
        # Shoes
        self._draw_rect(surf, 4*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
        self._draw_rect(surf, 9*scale, 14*scale - leg_offset, 3*scale, 2*scale, shoes)
        
        # Legs
        self._draw_rect(surf, 4*scale, 11*scale, 3*scale, 4*scale, pants)
        self._draw_rect(surf, 9*scale, 11*scale, 3*scale, 4*scale, pants)
        
        # Body
        self._draw_rect(surf, 3*scale, 6*scale, 10*scale, 6*scale, color)
        
        # Arms
        arm_y = 7*scale + arm_offset
        self._draw_rect(surf, 1*scale, arm_y, 2*scale, 4*scale, skin)
        self._draw_rect(surf, 13*scale, arm_y, 2*scale, 4*scale, skin)
        
        # Head
        self._draw_rect(surf, 4*scale, head_y, 8*scale, 7*scale, skin)
        
        # Hair
        self._draw_rect(surf, 4*scale, head_y, 8*scale, 2*scale, hair)
        
        # Eyes
        eye_y = head_y + 3*scale
        self._draw_rect(surf, 5*scale, eye_y, 2*scale, 2*scale, (0, 0, 0))
        self._draw_rect(surf, 9*scale, eye_y, 2*scale, 2*scale, (0, 0, 0))
    
    def _draw_body_up(self, surf: pygame.Surface, base_y: int, head_y: int, 
                      scale: int, color: Tuple[int, int, int], 
                      skin: Tuple[int, int, int], hair: Tuple[int, int, int],
                      pants: Tuple[int, int, int], shoes: Tuple[int, int, int],
                      leg_offset: int, arm_offset: int) -> None:
        """Draw character facing up (back view)."""
        # Shoes
        self._draw_rect(surf, 4*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
        self._draw_rect(surf, 9*scale, 14*scale - leg_offset, 3*scale, 2*scale, shoes)
        
        # Legs
        self._draw_rect(surf, 4*scale, 11*scale, 3*scale, 4*scale, pants)
        self._draw_rect(surf, 9*scale, 11*scale, 3*scale, 4*scale, pants)
        
        # Body
        self._draw_rect(surf, 3*scale, 6*scale, 10*scale, 6*scale, color)
        
        # Head (back view - hair only, no face)
        self._draw_rect(surf, 4*scale, head_y, 8*scale, 7*scale, hair)
    
    def _draw_body_left(self, surf: pygame.Surface, base_y: int, head_y: int, 
                        scale: int, color: Tuple[int, int, int], 
                        skin: Tuple[int, int, int], hair: Tuple[int, int, int],
                        pants: Tuple[int, int, int], shoes: Tuple[int, int, int],
                        leg_offset: int, arm_offset: int) -> None:
        """Draw character facing left (side view)."""
        # Shoes
        self._draw_rect(surf, 5*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
        self._draw_rect(surf, 8*scale, 14*scale - leg_offset, 2*scale, 2*scale, shoes)
        
        # Legs
        self._draw_rect(surf, 5*scale, 11*scale, 3*scale, 4*scale, pants)
        self._draw_rect(surf, 8*scale, 11*scale, 2*scale, 4*scale, pants)
        
        # Body
        self._draw_rect(surf, 5*scale, 6*scale, 5*scale, 6*scale, color)
        
        # Arm (left side - visible from left view)
        arm_y = 7*scale + arm_offset
        self._draw_rect(surf, 3*scale, arm_y, 2*scale, 4*scale, skin)
        
        # Head
        self._draw_rect(surf, 5*scale, head_y, 5*scale, 7*scale, skin)
        self._draw_rect(surf, 5*scale, head_y, 5*scale, 2*scale, hair)
        
        # Eye (single eye visible from side)
        self._draw_rect(surf, 6*scale, head_y + 3*scale, 2*scale, 2*scale, (0, 0, 0))
    
    def _draw_body_right(self, surf: pygame.Surface, base_y: int, head_y: int, 
                         scale: int, color: Tuple[int, int, int], 
                         skin: Tuple[int, int, int], hair: Tuple[int, int, int],
                         pants: Tuple[int, int, int], shoes: Tuple[int, int, int],
                         leg_offset: int, arm_offset: int) -> None:
        """Draw character facing right (side view, mirrored)."""
        # Shoes
        self._draw_rect(surf, 8*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
        self._draw_rect(surf, 6*scale, 14*scale - leg_offset, 2*scale, 2*scale, shoes)
        
        # Legs
        self._draw_rect(surf, 8*scale, 11*scale, 3*scale, 4*scale, pants)
        self._draw_rect(surf, 6*scale, 11*scale, 2*scale, 4*scale, pants)
        
        # Body
        self._draw_rect(surf, 6*scale, 6*scale, 5*scale, 6*scale, color)
        
        # Arm (right side - visible from right view)
        arm_y = 7*scale + arm_offset
        self._draw_rect(surf, 11*scale, arm_y, 2*scale, 4*scale, skin)
        
        # Head
        self._draw_rect(surf, 6*scale, head_y, 5*scale, 7*scale, skin)
        self._draw_rect(surf, 6*scale, head_y, 5*scale, 2*scale, hair)
        
        # Eye (single eye visible from side)
        self._draw_rect(surf, 8*scale, head_y + 3*scale, 2*scale, 2*scale, (0, 0, 0))
    
    def _draw_accessory(self, surf: pygame.Surface, style: AgentStyle, 
                       direction: str, base_y: int, scale: int) -> None:
        """
        Draw agent accessory based on direction.
        
        Supports accessories for all directions: down, up, left, right.
        """
        if not style.accessory:
            return
        
        head_y = base_y - 6*scale
        acc = style.accessory
        
        # Crown accessory - visible from all directions
        if acc == 'crown':
            gold = (255, 215, 0)
            if direction == 'down':
                self._draw_rect(surf, 4*scale, head_y - 2*scale, 8*scale, 2*scale, gold)
                self._draw_rect(surf, 5*scale, head_y - 3*scale, 2*scale, 1*scale, gold)
                self._draw_rect(surf, 9*scale, head_y - 3*scale, 2*scale, 1*scale, gold)
            elif direction == 'up':
                # Crown visible from back
                self._draw_rect(surf, 4*scale, head_y - 2*scale, 8*scale, 2*scale, gold)
                self._draw_rect(surf, 7*scale, head_y - 3*scale, 2*scale, 1*scale, gold)
            elif direction in ('left', 'right'):
                # Crown from side
                offset = 0 if direction == 'left' else 1
                self._draw_rect(surf, (4+offset)*scale, head_y - 2*scale, 5*scale, 2*scale, gold)
                self._draw_rect(surf, (5+offset)*scale, head_y - 3*scale, 2*scale, 1*scale, gold)
                
        # Robot antenna - visible from all directions
        elif acc == 'robot':
            cyan = (0, 212, 255)
            if direction == 'down':
                self._draw_rect(surf, 7*scale, head_y - 3*scale, 2*scale, 2*scale, cyan)
                self._draw_rect(surf, 7*scale, head_y - 4*scale, 2*scale, 1*scale, (200, 255, 255))
            elif direction == 'up':
                self._draw_rect(surf, 7*scale, head_y - 3*scale, 2*scale, 2*scale, cyan)
                self._draw_rect(surf, 7*scale, head_y - 4*scale, 2*scale, 1*scale, (200, 255, 255))
            elif direction in ('left', 'right'):
                offset = 0 if direction == 'left' else 3
                self._draw_rect(surf, (5+offset)*scale, head_y - 3*scale, 2*scale, 2*scale, cyan)
                self._draw_rect(surf, (5+offset)*scale, head_y - 4*scale, 2*scale, 1*scale, (200, 255, 255))
                
        # Glasses - visible from front and sides
        elif acc == 'glasses':
            if direction == 'down':
                self._draw_rect(surf, 4*scale, head_y + 3*scale, 8*scale, 1*scale, (50, 50, 50))
            elif direction == 'left':
                self._draw_rect(surf, 5*scale, head_y + 3*scale, 4*scale, 1*scale, (50, 50, 50))
            elif direction == 'right':
                self._draw_rect(surf, 7*scale, head_y + 3*scale, 4*scale, 1*scale, (50, 50, 50))
                
        # Headphones - visible from all directions
        elif acc == 'headphones':
            if direction == 'down':
                self._draw_rect(surf, 3*scale, head_y + 1*scale, 1*scale, 4*scale, (80, 80, 80))
                self._draw_rect(surf, 12*scale, head_y + 1*scale, 1*scale, 4*scale, (80, 80, 80))
                self._draw_rect(surf, 3*scale, head_y, 10*scale, 1*scale, (80, 80, 80))
            elif direction == 'up':
                self._draw_rect(surf, 3*scale, head_y, 10*scale, 1*scale, (80, 80, 80))
            elif direction == 'left':
                self._draw_rect(surf, 3*scale, head_y + 1*scale, 1*scale, 4*scale, (80, 80, 80))
                self._draw_rect(surf, 3*scale, head_y, 6*scale, 1*scale, (80, 80, 80))
            elif direction == 'right':
                self._draw_rect(surf, 12*scale, head_y + 1*scale, 1*scale, 4*scale, (80, 80, 80))
                self._draw_rect(surf, 7*scale, head_y, 6*scale, 1*scale, (80, 80, 80))
                
        # Cap - visible from all directions
        elif acc == 'cap':
            if direction == 'down':
                self._draw_rect(surf, 4*scale, head_y - 1*scale, 8*scale, 3*scale, (50, 100, 200))
                self._draw_rect(surf, 4*scale, head_y + 2*scale, 8*scale, 1*scale, (30, 70, 150))
            elif direction == 'up':
                self._draw_rect(surf, 4*scale, head_y, 8*scale, 2*scale, (50, 100, 200))
            elif direction == 'left':
                self._draw_rect(surf, 5*scale, head_y - 1*scale, 5*scale, 3*scale, (50, 100, 200))
                self._draw_rect(surf, 5*scale, head_y + 2*scale, 5*scale, 1*scale, (30, 70, 150))
            elif direction == 'right':
                self._draw_rect(surf, 6*scale, head_y - 1*scale, 5*scale, 3*scale, (50, 100, 200))
                self._draw_rect(surf, 6*scale, head_y + 2*scale, 5*scale, 1*scale, (30, 70, 150))
                
        # Beard - only visible from front
        elif acc == 'beard':
            if direction == 'down':
                self._draw_rect(surf, 5*scale, head_y + 5*scale, 6*scale, 2*scale, (60, 40, 30))
                
        # Hammer - tool visible from all directions
        elif acc == 'hammer':
            if direction == 'down':
                self._draw_rect(surf, 13*scale, 5*scale, 2*scale, 6*scale, (150, 150, 150))
                self._draw_rect(surf, 12*scale, 4*scale, 4*scale, 2*scale, (100, 100, 100))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 5*scale, 2*scale, 6*scale, (150, 150, 150))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 6*scale, 2*scale, 6*scale, (150, 150, 150))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 6*scale, 2*scale, 6*scale, (150, 150, 150))
                
        # Brush - tool visible from all directions
        elif acc == 'brush':
            if direction == 'down':
                self._draw_rect(surf, 13*scale, 5*scale, 2*scale, 6*scale, (139, 69, 19))
                self._draw_rect(surf, 12*scale, 4*scale, 4*scale, 2*scale, (200, 100, 100))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 5*scale, 2*scale, 6*scale, (139, 69, 19))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 6*scale, 2*scale, 6*scale, (139, 69, 19))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 6*scale, 2*scale, 6*scale, (139, 69, 19))
                
        # Palette - tool visible from all directions
        elif acc == 'palette':
            if direction == 'down':
                self._draw_rect(surf, 1*scale, 6*scale, 3*scale, 4*scale, (200, 150, 100))
                self._draw_pixel(surf, 2*scale, 7*scale, (255, 0, 0, 255))
                self._draw_pixel(surf, 3*scale, 8*scale, (0, 255, 0, 255))
                self._draw_pixel(surf, 2*scale, 9*scale, (0, 0, 255, 255))
            elif direction == 'up':
                self._draw_rect(surf, 13*scale, 6*scale, 3*scale, 4*scale, (200, 150, 100))
            elif direction == 'left':
                self._draw_rect(surf, 13*scale, 7*scale, 3*scale, 4*scale, (200, 150, 100))
            elif direction == 'right':
                self._draw_rect(surf, 1*scale, 7*scale, 3*scale, 4*scale, (200, 150, 100))
                
        # Pixel accessory
        elif acc == 'pixel':
            if direction == 'down':
                self._draw_rect(surf, 12*scale, 4*scale, 3*scale, 3*scale, (168, 85, 247))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 4*scale, 3*scale, 3*scale, (168, 85, 247))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 5*scale, 3*scale, 3*scale, (168, 85, 247))
            elif direction == 'right':
                self._draw_rect(surf, 12*scale, 5*scale, 3*scale, 3*scale, (168, 85, 247))
                
        # Magnifier - visible from all directions
        elif acc == 'magnifier':
            if direction == 'down':
                self._draw_rect(surf, 13*scale, 6*scale, 2*scale, 5*scale, (150, 150, 150))
                self._draw_rect(surf, 12*scale, 4*scale, 4*scale, 3*scale, (200, 200, 255))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 6*scale, 2*scale, 5*scale, (150, 150, 150))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 7*scale, 2*scale, 5*scale, (150, 150, 150))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 7*scale, 2*scale, 5*scale, (150, 150, 150))
                
        # Quill - visible from all directions
        elif acc == 'quill':
            if direction == 'down':
                self._draw_rect(surf, 13*scale, 4*scale, 2*scale, 6*scale, (255, 255, 255))
                self._draw_rect(surf, 13*scale, 3*scale, 2*scale, 2*scale, (236, 72, 153))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 4*scale, 2*scale, 6*scale, (255, 255, 255))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 5*scale, 2*scale, 6*scale, (255, 255, 255))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 5*scale, 2*scale, 6*scale, (255, 255, 255))
                
        # Megaphone - visible from all directions
        elif acc == 'megaphone':
            if direction == 'down':
                self._draw_rect(surf, 1*scale, 6*scale, 2*scale, 4*scale, (200, 100, 0))
                self._draw_rect(surf, 0*scale, 4*scale, 2*scale, 4*scale, (245, 158, 11))
            elif direction == 'up':
                self._draw_rect(surf, 13*scale, 6*scale, 2*scale, 4*scale, (200, 100, 0))
            elif direction == 'left':
                self._draw_rect(surf, 0*scale, 7*scale, 3*scale, 4*scale, (245, 158, 11))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 7*scale, 3*scale, 4*scale, (245, 158, 11))
                
        # Phone - visible from all directions
        elif acc == 'phone':
            if direction == 'down':
                self._draw_rect(surf, 1*scale, 6*scale, 2*scale, 4*scale, (50, 50, 50))
                self._draw_rect(surf, 1*scale, 7*scale, 2*scale, 2*scale, (100, 200, 100))
            elif direction == 'up':
                self._draw_rect(surf, 13*scale, 6*scale, 2*scale, 4*scale, (50, 50, 50))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 7*scale, 2*scale, 4*scale, (50, 50, 50))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 7*scale, 2*scale, 4*scale, (50, 50, 50))
                
        # Bee - visible from all directions
        elif acc == 'bee':
            if direction == 'down':
                self._draw_rect(surf, 12*scale, 3*scale, 3*scale, 3*scale, (251, 191, 36))
                self._draw_rect(surf, 13*scale, 3*scale, 1*scale, 3*scale, (0, 0, 0))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 3*scale, 3*scale, 3*scale, (251, 191, 36))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 4*scale, 3*scale, 3*scale, (251, 191, 36))
            elif direction == 'right':
                self._draw_rect(surf, 12*scale, 4*scale, 3*scale, 3*scale, (251, 191, 36))
                
        # Shield - visible from all directions
        elif acc == 'shield':
            if direction == 'down':
                self._draw_rect(surf, 1*scale, 5*scale, 3*scale, 5*scale, (100, 100, 150))
                self._draw_rect(surf, 2*scale, 6*scale, 1*scale, 3*scale, (150, 150, 200))
            elif direction == 'up':
                self._draw_rect(surf, 13*scale, 5*scale, 3*scale, 5*scale, (100, 100, 150))
            elif direction == 'left':
                self._draw_rect(surf, 13*scale, 6*scale, 3*scale, 5*scale, (100, 100, 150))
            elif direction == 'right':
                self._draw_rect(surf, 1*scale, 6*scale, 3*scale, 5*scale, (100, 100, 150))
                
        # Magnifier gold - Audit's special accessory
        elif acc == 'magnifier_gold':
            gold = (255, 215, 0)
            if direction == 'down':
                self._draw_rect(surf, 13*scale, 6*scale, 2*scale, 5*scale, (150, 150, 150))
                self._draw_rect(surf, 12*scale, 4*scale, 4*scale, 3*scale, gold)
                self._draw_rect(surf, 13*scale, 5*scale, 2*scale, 1*scale, (255, 255, 200))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 6*scale, 2*scale, 5*scale, (150, 150, 150))
                self._draw_rect(surf, 1*scale, 4*scale, 3*scale, 2*scale, gold)
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 7*scale, 2*scale, 5*scale, (150, 150, 150))
                self._draw_rect(surf, 0*scale, 6*scale, 3*scale, 3*scale, gold)
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 7*scale, 2*scale, 5*scale, (150, 150, 150))
                self._draw_rect(surf, 13*scale, 6*scale, 3*scale, 3*scale, gold)
                
        # Lock - visible from all directions
        elif acc == 'lock':
            if direction == 'down':
                self._draw_rect(surf, 1*scale, 6*scale, 3*scale, 4*scale, (150, 150, 150))
                self._draw_rect(surf, 2*scale, 7*scale, 1*scale, 2*scale, (100, 100, 100))
            elif direction == 'up':
                self._draw_rect(surf, 13*scale, 6*scale, 3*scale, 4*scale, (150, 150, 150))
            elif direction == 'left':
                self._draw_rect(surf, 13*scale, 7*scale, 3*scale, 4*scale, (150, 150, 150))
            elif direction == 'right':
                self._draw_rect(surf, 1*scale, 7*scale, 3*scale, 4*scale, (150, 150, 150))
                
        # Briefcase - visible from all directions
        elif acc == 'briefcase':
            if direction == 'down':
                self._draw_rect(surf, 1*scale, 6*scale, 3*scale, 4*scale, (100, 70, 40))
                self._draw_rect(surf, 2*scale, 6*scale, 1*scale, 1*scale, (150, 120, 80))
            elif direction == 'up':
                self._draw_rect(surf, 13*scale, 6*scale, 3*scale, 4*scale, (100, 70, 40))
            elif direction == 'left':
                self._draw_rect(surf, 13*scale, 7*scale, 3*scale, 4*scale, (100, 70, 40))
            elif direction == 'right':
                self._draw_rect(surf, 1*scale, 7*scale, 3*scale, 4*scale, (100, 70, 40))
                
        # Telescope - visible from all directions
        elif acc == 'telescope':
            if direction == 'down':
                self._draw_rect(surf, 13*scale, 4*scale, 2*scale, 6*scale, (100, 100, 100))
                self._draw_rect(surf, 12*scale, 4*scale, 2*scale, 2*scale, (150, 150, 150))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 4*scale, 2*scale, 6*scale, (100, 100, 100))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 5*scale, 2*scale, 6*scale, (100, 100, 100))
            elif direction == 'right':
                self._draw_rect(surf, 13*scale, 5*scale, 2*scale, 6*scale, (100, 100, 100))
                
        # Brain - visible from all directions
        elif acc == 'brain':
            if direction == 'down':
                self._draw_rect(surf, 12*scale, 3*scale, 3*scale, 3*scale, (200, 150, 200))
                self._draw_rect(surf, 13*scale, 4*scale, 1*scale, 1*scale, (150, 100, 150))
            elif direction == 'up':
                self._draw_rect(surf, 1*scale, 3*scale, 3*scale, 3*scale, (200, 150, 200))
            elif direction == 'left':
                self._draw_rect(surf, 1*scale, 4*scale, 3*scale, 3*scale, (200, 150, 200))
            elif direction == 'right':
                self._draw_rect(surf, 12*scale, 4*scale, 3*scale, 3*scale, (200, 150, 200))
    
    def _add_glow(self, surf: pygame.Surface, style: AgentStyle, scale: int) -> None:
        """Add glow effect around sprite for special agents."""
        glow_color = style.color
        width, height = surf.get_size()
        
        for y in range(height):
            for x in range(width):
                pixel = surf.get_at((x, y))
                if pixel[3] > 0:  # If pixel is not transparent
                    # Add subtle glow to adjacent transparent pixels
                    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            neighbor = surf.get_at((nx, ny))
                            if neighbor[3] == 0:  # If neighbor is transparent
                                glow = (*glow_color[:3], 50)
                                surf.set_at((nx, ny), glow)
    
    def generate_sprite_sheet(self, output_dir: Optional[str] = None) -> str:
        """
        Generate complete sprite sheet for all agents.
        
        Args:
            output_dir: Output directory (defaults to self.output_dir)
            
        Returns:
            Path to the generated master sprite sheet
        """
        output_dir = output_dir or self.output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Include all animation types including AUDIT
        animations = [
            AnimationType.IDLE,
            AnimationType.WALK_DOWN,
            AnimationType.WALK_UP,
            AnimationType.WALK_LEFT,
            AnimationType.WALK_RIGHT,
            AnimationType.TYPING,
            AnimationType.TALKING,
            AnimationType.AUDIT,
        ]
        
        frames_per_anim = 8
        
        # Generate individual agent sheets
        for agent_id, style in AGENT_STYLES.items():
            sheet_width = len(animations) * frames_per_anim * self.sprite_size
            sheet_height = self.sprite_size
            
            sheet = self._create_surface(sheet_width, sheet_height)
            
            for anim_idx, anim in enumerate(animations):
                for frame in range(frames_per_anim):
                    sprite = self.generate_agent_sprite(style, anim, frame)
                    x = (anim_idx * frames_per_anim + frame) * self.sprite_size
                    sheet.blit(sprite, (x, 0))
            
            # Save sheet
            filename = f"{output_dir}/{agent_id}_sheet.png"
            pygame.image.save(sheet, filename)
            print(f"Generated: {filename}")
        
        # Generate master sprite sheet (all agents)
        master_width = len(animations) * frames_per_anim * self.sprite_size
        master_height = len(AGENT_STYLES) * self.sprite_size
        
        master = self._create_surface(master_width, master_height)
        
        for agent_idx, (agent_id, style) in enumerate(AGENT_STYLES.items()):
            for anim_idx, anim in enumerate(animations):
                for frame in range(frames_per_anim):
                    sprite = self.generate_agent_sprite(style, anim, frame)
                    x = (anim_idx * frames_per_anim + frame) * self.sprite_size
                    y = agent_idx * self.sprite_size
                    master.blit(sprite, (x, y))
        
        # Save master sheet
        master_file = f"{output_dir}/master_sheet_{self.sprite_size}px.png"
        pygame.image.save(master, master_file)
        print(f"Generated master sheet: {master_file}")
        
        # Generate metadata
        metadata = {
            "sprite_size": self.sprite_size,
            "frames_per_animation": frames_per_anim,
            "animations": {anim.value: i for i, anim in enumerate(animations)},
            "agents": {id: {"name": s.name, "row": i} for i, (id, s) in enumerate(AGENT_STYLES.items())}
        }
        
        with open(f"{output_dir}/sprite_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Generated metadata: {output_dir}/sprite_metadata.json")
        return master_file


def generate_furniture_sprites(output_dir: Optional[str] = None) -> None:
    """
    Generate furniture sprite sheets.
    
    Args:
        output_dir: Output directory (defaults to "assets/sprites")
    """
    output_dir = output_dir or "assets/sprites"
    os.makedirs(output_dir, exist_ok=True)
    
    size = 32
    
    # Desk
    desk = pygame.Surface((size, size), pygame.SRCALPHA)
    wood_dark = (101, 67, 33)
    wood_light = (160, 120, 80)
    # Desk top
    pygame.draw.rect(desk, wood_light, (4, 12, 24, 12))
    # Legs
    pygame.draw.rect(desk, wood_dark, (6, 20, 4, 10))
    pygame.draw.rect(desk, wood_dark, (22, 20, 4, 10))
    pygame.image.save(desk, f"{output_dir}/furniture_desk.png")
    
    # Chair
    chair = pygame.Surface((size, size), pygame.SRCALPHA)
    # Seat
    pygame.draw.rect(chair, wood_dark, (10, 18, 12, 6))
    # Back
    pygame.draw.rect(chair, wood_light, (10, 8, 12, 10))
    pygame.image.save(chair, f"{output_dir}/furniture_chair.png")
    
    # Computer
    computer = pygame.Surface((size, size), pygame.SRCALPHA)
    # Monitor
    pygame.draw.rect(computer, (60, 60, 70), (8, 6, 16, 14))
    # Screen
    pygame.draw.rect(computer, (100, 150, 255), (10, 8, 12, 10))
    # Stand
    pygame.draw.rect(computer, (80, 80, 90), (14, 20, 4, 6))
    pygame.image.save(computer, f"{output_dir}/furniture_computer.png")
    
    # Plant
    plant = pygame.Surface((size, size), pygame.SRCALPHA)
    # Pot
    pygame.draw.rect(plant, (180, 120, 80), (10, 20, 12, 10))
    # Leaves
    pygame.draw.circle(plant, (50, 150, 50), (16, 14), 8)
    pygame.draw.circle(plant, (30, 100, 30), (12, 12), 5)
    pygame.draw.circle(plant, (50, 150, 50), (20, 10), 5)
    pygame.image.save(plant, f"{output_dir}/furniture_plant.png")
    
    # Commander Desk (EricF)
    cmd_desk = pygame.Surface((size*2, size), pygame.SRCALPHA)
    gold = (255, 215, 0)
    dark_gold = (180, 150, 0)
    # Desk
    pygame.draw.rect(cmd_desk, gold, (8, 10, 48, 16))
    pygame.draw.rect(cmd_desk, dark_gold, (8, 10, 48, 16), 2)
    # Crown symbol
    pygame.draw.rect(cmd_desk, (255, 255, 255), (28, 14, 8, 6))
    pygame.image.save(cmd_desk, f"{output_dir}/furniture_commander_desk.png")
    
    # Nexus Pod
    nexus = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
    # Base
    pygame.draw.ellipse(nexus, (50, 50, 70), (8, 40, 48, 20))
    # Core
    pygame.draw.circle(nexus, (0, 212, 255), (32, 30), 15)
    pygame.draw.circle(nexus, (150, 255, 220), (32, 30), 10)
    # Glow ring
    pygame.draw.ellipse(nexus, (0, 212, 255), (16, 45, 32, 10), 2)
    pygame.image.save(nexus, f"{output_dir}/furniture_nexus.png")
    
    print(f"Generated furniture sprites in {output_dir}")


def generate_effect_sprites(output_dir: Optional[str] = None) -> None:
    """
    Generate effect/particle sprites.
    
    Args:
        output_dir: Output directory (defaults to "assets/sprites")
    """
    output_dir = output_dir or "assets/sprites"
    os.makedirs(output_dir, exist_ok=True)
    
    size = 32
    
    # Shadow
    shadow = pygame.Surface((size, size//2), pygame.SRCALPHA)
    pygame.draw.ellipse(shadow, (0, 0, 0, 80), (0, 0, size, size//2))
    pygame.image.save(shadow, f"{output_dir}/effect_shadow.png")
    
    # Speech bubble
    bubble = pygame.Surface((64, 32), pygame.SRCALPHA)
    pygame.draw.ellipse(bubble, (255, 255, 255, 230), (0, 0, 64, 24))
    pygame.draw.ellipse(bubble, (0, 0, 0), (0, 0, 64, 24), 2)
    # Tail
    pygame.draw.polygon(bubble, (255, 255, 255, 230), [(28, 22), (36, 22), (32, 30)])
    pygame.draw.polygon(bubble, (0, 0, 0), [(28, 22), (36, 22), (32, 30)], 2)
    pygame.image.save(bubble, f"{output_dir}/effect_speech.png")
    
    # Selection ring
    ring = pygame.Surface((size, size), pygame.SRCALPHA)
    pygame.draw.ellipse(ring, (0, 212, 255, 180), (2, 2, size-4, size-4), 3)
    pygame.image.save(ring, f"{output_dir}/effect_selection.png")
    
    # Status indicators
    for status, color in [
        ('idle', (150, 150, 150)),
        ('working', (100, 200, 100)),
        ('busy', (200, 150, 100)),
        ('error', (200, 100, 100)),
    ]:
        indicator = pygame.Surface((16, 16), pygame.SRCALPHA)
        pygame.draw.circle(indicator, color, (8, 8), 6)
        pygame.draw.circle(indicator, (255, 255, 255), (8, 8), 6, 2)
        pygame.image.save(indicator, f"{output_dir}/status_{status}.png")
    
    print(f"Generated effect sprites in {output_dir}")


def init_pygame() -> None:
    """
    Initialize pygame with error handling.
    
    Raises:
        PygameInitError: If pygame initialization fails
    """
    try:
        success = pygame.init()
        if success[0] > 0:  # Number of modules that failed to initialize
            failed_modules = []
            # Check common modules
            if not pygame.get_init():
                failed_modules.append("base")
            if failed_modules:
                raise PygameInitError(f"Failed to initialize pygame modules: {', '.join(failed_modules)}")
    except Exception as e:
        raise PygameInitError(f"Pygame initialization failed: {str(e)}")


def main() -> int:
    """
    Main entry point for sprite generation.
    
    Returns:
        Exit code (0 for success, 1 for failure)
    """
    # Get output directory from environment or use default
    output_dir = os.environ.get('SPRITE_OUTPUT_DIR', 'assets/sprites')
    
    try:
        # Initialize pygame with error handling
        init_pygame()
        print(f"Pygame initialized successfully. Output directory: {output_dir}")
        
        # Generate 32px sprites
        print("=== Generating 32px Sprite Sheets ===")
        gen32 = SpriteSheetGenerator(32, output_dir)
        gen32.generate_sprite_sheet()
        
        # Generate 16px sprites
        print("\n=== Generating 16px Sprite Sheets ===")
        gen16 = SpriteSheetGenerator(16, output_dir)
        gen16.generate_sprite_sheet()
        
        # Generate furniture
        print("\n=== Generating Furniture Sprites ===")
        generate_furniture_sprites(output_dir)
        
        # Generate effects
        print("\n=== Generating Effect Sprites ===")
        generate_effect_sprites(output_dir)
        
        print("\n=== All sprites generated successfully! ===")
        pygame.quit()
        return 0
        
    except PygameInitError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        print("Sprite generation requires pygame. Install with: pip install pygame", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"ERROR: Unexpected error during sprite generation: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
