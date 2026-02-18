"""
Sprite Sheet Generator for Pixel Office
Creates 16x16 and 32x32 Minecraft-style sprite sheets for all 22 agents
"""
import pygame
import json
import os
from typing import Dict, List, Tuple
from enum import Enum

class AnimationType(Enum):
    IDLE = "idle"
    WALK_DOWN = "walk_down"
    WALK_UP = "walk_up"
    WALK_LEFT = "walk_left"
    WALK_RIGHT = "walk_right"
    TYPING = "typing"
    TALKING = "talking"
    AUDIT = "audit"

class AgentStyle:
    """Style definition for each agent"""
    def __init__(self, name: str, color: Tuple[int, int, int], 
                 accessory: str = None, skin: Tuple[int, int, int] = None,
                 hair: Tuple[int, int, int] = None):
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
    """Generates complete sprite sheets for agents"""
    
    def __init__(self, sprite_size: int = 32):
        self.sprite_size = sprite_size
        self.frame_size = sprite_size
        # 8 animations × 8 frames each = 64 sprites per row
        self.sheet_width = 64 * sprite_size
        self.sheet_height = len(AGENT_STYLES) * sprite_size
        
    def _create_surface(self, width: int, height: int) -> pygame.Surface:
        """Create transparent surface"""
        return pygame.Surface((width, height), pygame.SRCALPHA)
    
    def _draw_pixel(self, surf: pygame.Surface, x: int, y: int, 
                   color: Tuple[int, int, int, int]):
        """Draw a single pixel"""
        if 0 <= x < surf.get_width() and 0 <= y < surf.get_height():
            surf.set_at((x, y), color)
    
    def _draw_rect(self, surf: pygame.Surface, x: int, y: int, 
                  w: int, h: int, color: Tuple[int, int, int]):
        """Draw a rectangle of pixels"""
        for dy in range(h):
            for dx in range(w):
                self._draw_pixel(surf, x + dx, y + dy, (*color, 255))
    
    def generate_agent_sprite(self, style: AgentStyle, anim: AnimationType, 
                             frame: int) -> pygame.Surface:
        """Generate a single agent sprite"""
        size = self.sprite_size
        surf = self._create_surface(size, size)
        
        # Scale factor for different sizes
        scale = size // 16
        
        c = style.color
        skin = style.skin
        hair = style.hair or (101, 67, 33)
        pants = (45, 45, 60)
        shoes = (60, 40, 30)
        
        # Animation offsets
        bob = 0
        leg_offset = 0
        arm_offset = 0
        
        if anim == AnimationType.IDLE:
            # Breathing animation
            bob = [0, 0, -1, -1, 0, 0, 0, 0][frame % 8]
        elif anim == AnimationType.TYPING:
            # Typing animation - arms moving
            bob = [0, 0, -1, -1, 0, 0, 0, 0][frame % 8]
            arm_offset = [0, 1, 0, 1, 0, 1, 0, 1][frame % 8]
        elif 'walk' in anim.value:
            # Walking animation
            walk_cycle = [0, -1, -2, -1, 0, -1, -2, -1]
            bob = walk_cycle[frame % 8]
            leg_offset = [0, 1, 0, -1, 0, 1, 0, -1][frame % 8]
        
        base_y = 8 * scale + bob
        
        # Direction handling
        direction = 'down'
        if anim == AnimationType.WALK_UP:
            direction = 'up'
        elif anim == AnimationType.WALK_LEFT:
            direction = 'left'
        elif anim == AnimationType.WALK_RIGHT:
            direction = 'right'
        
        if direction == 'down':
            # Shoes
            self._draw_rect(surf, 4*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
            self._draw_rect(surf, 9*scale, 14*scale - leg_offset, 3*scale, 2*scale, shoes)
            
            # Legs
            self._draw_rect(surf, 4*scale, 11*scale, 3*scale, 4*scale, pants)
            self._draw_rect(surf, 9*scale, 11*scale, 3*scale, 4*scale, pants)
            
            # Body
            self._draw_rect(surf, 3*scale, 6*scale, 10*scale, 6*scale, c)
            
            # Arms
            arm_y = 7*scale + arm_offset
            self._draw_rect(surf, 1*scale, arm_y, 2*scale, 4*scale, skin)
            self._draw_rect(surf, 13*scale, arm_y, 2*scale, 4*scale, skin)
            
            # Head
            head_y = base_y - 6*scale
            self._draw_rect(surf, 4*scale, head_y, 8*scale, 7*scale, skin)
            
            # Hair
            self._draw_rect(surf, 4*scale, head_y, 8*scale, 2*scale, hair)
            
            # Eyes
            eye_y = head_y + 3*scale
            self._draw_rect(surf, 5*scale, eye_y, 2*scale, 2*scale, (0, 0, 0))
            self._draw_rect(surf, 9*scale, eye_y, 2*scale, 2*scale, (0, 0, 0))
            
        elif direction == 'up':
            # Shoes
            self._draw_rect(surf, 4*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
            self._draw_rect(surf, 9*scale, 14*scale - leg_offset, 3*scale, 2*scale, shoes)
            
            # Legs
            self._draw_rect(surf, 4*scale, 11*scale, 3*scale, 4*scale, pants)
            self._draw_rect(surf, 9*scale, 11*scale, 3*scale, 4*scale, pants)
            
            # Body
            self._draw_rect(surf, 3*scale, 6*scale, 10*scale, 6*scale, c)
            
            # Head (back view - hair only)
            head_y = base_y - 6*scale
            self._draw_rect(surf, 4*scale, head_y, 8*scale, 7*scale, hair)
            
        elif direction == 'left':
            # Shoes
            self._draw_rect(surf, 5*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
            self._draw_rect(surf, 8*scale, 14*scale - leg_offset, 2*scale, 2*scale, shoes)
            
            # Legs
            self._draw_rect(surf, 5*scale, 11*scale, 3*scale, 4*scale, pants)
            self._draw_rect(surf, 8*scale, 11*scale, 2*scale, 4*scale, pants)
            
            # Body
            self._draw_rect(surf, 5*scale, 6*scale, 5*scale, 6*scale, c)
            
            # Arm
            arm_y = 7*scale + arm_offset
            self._draw_rect(surf, 3*scale, arm_y, 2*scale, 4*scale, skin)
            
            # Head
            head_y = base_y - 6*scale
            self._draw_rect(surf, 5*scale, head_y, 5*scale, 7*scale, skin)
            self._draw_rect(surf, 5*scale, head_y, 5*scale, 2*scale, hair)
            
            # Eye
            self._draw_rect(surf, 6*scale, head_y + 3*scale, 2*scale, 2*scale, (0, 0, 0))
            
        elif direction == 'right':
            # Mirror of left
            # Shoes
            self._draw_rect(surf, 8*scale, 14*scale + leg_offset, 3*scale, 2*scale, shoes)
            self._draw_rect(surf, 6*scale, 14*scale - leg_offset, 2*scale, 2*scale, shoes)
            
            # Legs
            self._draw_rect(surf, 8*scale, 11*scale, 3*scale, 4*scale, pants)
            self._draw_rect(surf, 6*scale, 11*scale, 2*scale, 4*scale, pants)
            
            # Body
            self._draw_rect(surf, 6*scale, 6*scale, 5*scale, 6*scale, c)
            
            # Arm
            arm_y = 7*scale + arm_offset
            self._draw_rect(surf, 11*scale, arm_y, 2*scale, 4*scale, skin)
            
            # Head
            head_y = base_y - 6*scale
            self._draw_rect(surf, 6*scale, head_y, 5*scale, 7*scale, skin)
            self._draw_rect(surf, 6*scale, head_y, 5*scale, 2*scale, hair)
            
            # Eye
            self._draw_rect(surf, 8*scale, head_y + 3*scale, 2*scale, 2*scale, (0, 0, 0))
        
        # Add accessory
        self._draw_accessory(surf, style, direction, base_y, scale)
        
        # Add glow effect for special agents
        if style.name in ['Nexus', 'EricF']:
            self._add_glow(surf, style, scale)
        
        return surf
    
    def _draw_accessory(self, surf: pygame.Surface, style: AgentStyle, 
                       direction: str, base_y: int, scale: int):
        """Draw agent accessory"""
        if not style.accessory:
            return
        
        head_y = base_y - 6*scale
        acc = style.accessory
        
        if acc == 'crown' and direction == 'down':
            # Crown
            gold = (255, 215, 0)
            self._draw_rect(surf, 4*scale, head_y - 2*scale, 8*scale, 2*scale, gold)
            self._draw_rect(surf, 5*scale, head_y - 3*scale, 2*scale, 1*scale, gold)
            self._draw_rect(surf, 9*scale, head_y - 3*scale, 2*scale, 1*scale, gold)
            
        elif acc == 'robot' and direction == 'down':
            # Robot antenna
            cyan = (0, 212, 255)
            self._draw_rect(surf, 7*scale, head_y - 3*scale, 2*scale, 2*scale, cyan)
            self._draw_rect(surf, 7*scale, head_y - 4*scale, 2*scale, 1*scale, (200, 255, 255))
            
        elif acc == 'glasses' and direction == 'down':
            # Glasses
            self._draw_rect(surf, 4*scale, head_y + 3*scale, 8*scale, 1*scale, (50, 50, 50))
            
        elif acc == 'headphones' and direction == 'down':
            # Headphones
            self._draw_rect(surf, 3*scale, head_y + 1*scale, 1*scale, 4*scale, (80, 80, 80))
            self._draw_rect(surf, 12*scale, head_y + 1*scale, 1*scale, 4*scale, (80, 80, 80))
            self._draw_rect(surf, 3*scale, head_y, 10*scale, 1*scale, (80, 80, 80))
    
    def _add_glow(self, surf: pygame.Surface, style: AgentStyle, scale: int):
        """Add glow effect around sprite"""
        # Simple glow by adding light pixels at edges
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
    
    def generate_sprite_sheet(self, output_dir: str = "assets/sprites"):
        """Generate complete sprite sheet for all agents"""
        os.makedirs(output_dir, exist_ok=True)
        
        animations = [
            AnimationType.IDLE,
            AnimationType.WALK_DOWN,
            AnimationType.WALK_UP,
            AnimationType.WALK_LEFT,
            AnimationType.WALK_RIGHT,
            AnimationType.TYPING,
            AnimationType.TALKING,
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


def generate_furniture_sprites(output_dir: str = "assets/sprites"):
    """Generate furniture sprite sheets"""
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


def generate_effect_sprites(output_dir: str = "assets/sprites"):
    """Generate effect/particle sprites"""
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


if __name__ == "__main__":
    pygame.init()
    
    # Generate 32px sprites
    print("=== Generating 32px Sprite Sheets ===")
    gen32 = SpriteSheetGenerator(32)
    gen32.generate_sprite_sheet()
    
    # Generate 16px sprites
    print("\n=== Generating 16px Sprite Sheets ===")
    gen16 = SpriteSheetGenerator(16)
    gen16.generate_sprite_sheet()
    
    # Generate furniture
    print("\n=== Generating Furniture Sprites ===")
    generate_furniture_sprites()
    
    # Generate effects
    print("\n=== Generating Effect Sprites ===")
    generate_effect_sprites()
    
    print("\n=== All sprites generated successfully! ===")
    pygame.quit()
