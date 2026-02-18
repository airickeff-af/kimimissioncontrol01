"""
Isometric math utilities for tile-to-screen and screen-to-tile conversions
"""
import math
from typing import Tuple, NamedTuple

class Point(NamedTuple):
    x: float
    y: float

class IsoPoint(NamedTuple):
    x: int
    y: int
    z: int = 0

class IsometricMath:
    """Handles all isometric coordinate transformations"""
    
    def __init__(self, tile_width: int = 64, tile_height: int = 32):
        self.tile_width = tile_width
        self.tile_height = tile_height
        self.tile_half_w = tile_width // 2
        self.tile_half_h = tile_height // 2
    
    def cart_to_iso(self, x: float, y: float) -> Tuple[float, float]:
        """Convert cartesian to isometric coordinates"""
        iso_x = (x - y) * self.tile_half_w
        iso_y = (x + y) * self.tile_half_h
        return (iso_x, iso_y)
    
    def iso_to_cart(self, iso_x: float, iso_y: float) -> Tuple[float, float]:
        """Convert isometric to cartesian coordinates"""
        x = (iso_x / self.tile_half_w + iso_y / self.tile_half_h) / 2
        y = (iso_y / self.tile_half_h - iso_x / self.tile_half_w) / 2
        return (x, y)
    
    def tile_to_screen(self, tx: int, ty: int, tz: int = 0, 
                       offset_x: float = 0, offset_y: float = 0) -> Tuple[float, float]:
        """Convert tile coordinates to screen coordinates"""
        iso_x, iso_y = self.cart_to_iso(tx, ty)
        # Apply z-height offset
        iso_y -= tz * self.tile_half_h
        return (iso_x + offset_x, iso_y + offset_y)
    
    def screen_to_tile(self, screen_x: float, screen_y: float,
                       offset_x: float = 0, offset_y: float = 0) -> Tuple[int, int]:
        """Convert screen coordinates to tile coordinates"""
        adj_x = screen_x - offset_x
        adj_y = screen_y - offset_y
        x, y = self.iso_to_cart(adj_x, adj_y)
        return (int(x), int(y))
    
    def get_tile_bounds(self, tx: int, ty: int, tz: int = 0) -> Tuple[float, float, float, float]:
        """Get bounding box for a tile (left, top, right, bottom)"""
        center_x, center_y = self.tile_to_screen(tx, ty, tz)
        left = center_x - self.tile_half_w
        right = center_x + self.tile_half_w
        top = center_y - self.tile_height + self.tile_half_h
        bottom = center_y + self.tile_half_h
        return (left, top, right, bottom)
    
    def sort_depth(self, items: list) -> list:
        """Sort items by depth (y + x for isometric)"""
        return sorted(items, key=lambda item: (item.y + item.x, item.y))

class Camera:
    """Camera for panning and zooming the isometric view"""
    
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.x = 0
        self.y = 0
        self.zoom = 1.0
        self.target_x = 0
        self.target_y = 0
        self.smoothness = 0.1
    
    def world_to_screen(self, wx: float, wy: float) -> Tuple[float, float]:
        """Convert world coordinates to screen coordinates"""
        sx = (wx - self.x) * self.zoom + self.width / 2
        sy = (wy - self.y) * self.zoom + self.height / 2
        return (sx, sy)
    
    def screen_to_world(self, sx: float, sy: float) -> Tuple[float, float]:
        """Convert screen coordinates to world coordinates"""
        wx = (sx - self.width / 2) / self.zoom + self.x
        wy = (sy - self.height / 2) / self.zoom + self.y
        return (wx, wy)
    
    def pan(self, dx: float, dy: float):
        """Pan the camera"""
        self.target_x += dx / self.zoom
        self.target_y += dy / self.zoom
    
    def zoom_at(self, factor: float, sx: float, sy: float):
        """Zoom at a specific screen point"""
        # Get world point before zoom
        wx, wy = self.screen_to_world(sx, sy)
        
        # Apply zoom
        new_zoom = max(0.5, min(3.0, self.zoom * factor))
        self.zoom = new_zoom
        
        # Adjust position to keep world point at same screen position
        self.target_x = wx - (sx - self.width / 2) / self.zoom
        self.target_y = wy - (sy - self.height / 2) / self.zoom
    
    def update(self):
        """Update camera position with smoothing"""
        self.x += (self.target_x - self.x) * self.smoothness
        self.y += (self.target_y - self.y) * self.smoothness
