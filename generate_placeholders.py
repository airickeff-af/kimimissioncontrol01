#!/usr/bin/env python3
"""
Pixel-2: Placeholder Avatar Generator
Creates pixel-art style placeholder avatars for Marketing Team Agents
Uses PIL/Pillow to generate Kairosoft-inspired avatars
"""

from PIL import Image, ImageDraw, ImageFont
import random
from pathlib import Path

OUTPUT_DIR = Path("/dashboard/agent-avatars")

# Agent definitions with color schemes
AGENTS = [
    {
        "id": "gary",
        "name": "Gary",
        "role": "Marketing Lead",
        "primary": "#4CAF50",    # Green
        "secondary": "#FFC107",  # Gold
        "symbol": "📊"
    },
    {
        "id": "larry",
        "name": "Larry",
        "role": "Social Media",
        "primary": "#FFEB3B",    # Yellow
        "secondary": "#2196F3",  # Blue
        "symbol": "📱"
    },
    {
        "id": "scout",
        "name": "Scout",
        "role": "Opportunity Hunter",
        "primary": "#FFEB3B",    # Yellow
        "secondary": "#F44336",  # Red
        "symbol": "🧭"
    },
    {
        "id": "dealflow",
        "name": "DealFlow",
        "role": "BD Lead Gen",
        "primary": "#F44336",    # Red
        "secondary": "#9C27B0",  # Purple
        "symbol": "💼"
    },
    {
        "id": "coldcall",
        "name": "ColdCall",
        "role": "Meeting Booker",
        "primary": "#009688",    # Teal
        "secondary": "#FFFFFF",  # White
        "symbol": "📞"
    }
]

def create_pixel_avatar(agent: dict, size: int = 512) -> Image.Image:
    """Create a pixel-art style avatar for an agent"""
    
    # Create base image with white background
    img = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(img)
    
    primary = agent["primary"]
    secondary = agent["secondary"]
    
    # Pixel size for retro effect
    pixel_size = size // 32  # 32x32 pixel grid
    
    # Draw pixelated body (chibi style - big head, small body)
    
    # Head (large, round)
    head_size = int(size * 0.5)
    head_x = (size - head_size) // 2
    head_y = int(size * 0.15)
    
    # Draw pixelated head
    for y in range(head_y, head_y + head_size, pixel_size):
        for x in range(head_x, head_x + head_size, pixel_size):
            # Create rounded head effect
            dx = x - (head_x + head_size // 2)
            dy = y - (head_y + head_size // 2)
            distance = (dx**2 + dy**2) ** 0.5
            
            if distance < head_size // 2:
                draw.rectangle([x, y, x + pixel_size, y + pixel_size], fill=primary)
    
    # Eyes (large, expressive - Kairosoft style)
    eye_size = head_size // 5
    eye_y = head_y + head_size // 3
    left_eye_x = head_x + head_size // 4
    right_eye_x = head_x + head_size * 3 // 4 - eye_size
    
    # White of eyes
    for eye_x in [left_eye_x, right_eye_x]:
        for y in range(eye_y, eye_y + eye_size, pixel_size):
            for x in range(eye_x, eye_x + eye_size, pixel_size):
                draw.rectangle([x, y, x + pixel_size, y + pixel_size], fill='white')
    
    # Pupils (black dots)
    pupil_size = eye_size // 2
    pupil_y = eye_y + eye_size // 4
    left_pupil_x = left_eye_x + eye_size // 4
    right_pupil_x = right_eye_x + eye_size // 4
    
    for pupil_x in [left_pupil_x, right_pupil_x]:
        for y in range(pupil_y, pupil_y + pupil_size, pixel_size):
            for x in range(pupil_x, pupil_x + pupil_size, pixel_size):
                draw.rectangle([x, y, x + pixel_size, y + pixel_size], fill='black')
    
    # Smile (simple curved line)
    smile_y = head_y + head_size * 2 // 3
    smile_width = head_size // 3
    smile_x = head_x + (head_size - smile_width) // 2
    
    for i in range(0, smile_width, pixel_size):
        x = smile_x + i
        # Simple curve
        y_offset = abs(i - smile_width // 2) // 4
        y = smile_y + y_offset
        draw.rectangle([x, y, x + pixel_size, y + pixel_size], fill='black')
    
    # Body (small, below head)
    body_width = int(head_size * 0.7)
    body_height = int(size * 0.35)
    body_x = (size - body_width) // 2
    body_y = head_y + head_size - pixel_size * 2
    
    for y in range(body_y, body_y + body_height, pixel_size):
        for x in range(body_x, body_x + body_width, pixel_size):
            draw.rectangle([x, y, x + pixel_size, y + pixel_size], fill=secondary)
    
    # Add role text at bottom
    try:
        # Try to use a default font
        font_size = size // 20
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw agent name
    name = agent["name"]
    bbox = draw.textbbox((0, 0), name, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (size - text_width) // 2
    text_y = size - font_size * 3
    
    draw.text((text_x, text_y), name, fill='black', font=font)
    
    # Draw role
    role = agent["role"]
    bbox = draw.textbbox((0, 0), role, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (size - text_width) // 2
    text_y = size - font_size * 1.5
    
    draw.text((text_x, text_y), role, fill='gray', font=font)
    
    return img

def main():
    print("=" * 60)
    print("🎮 Pixel-2: Placeholder Avatar Generation")
    print("   Creating Kairosoft-style pixel art avatars")
    print("=" * 60)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    results = []
    
    for agent in AGENTS:
        print(f"\n🎨 Creating avatar for {agent['name']} ({agent['role']})...")
        
        try:
            img = create_pixel_avatar(agent)
            output_path = OUTPUT_DIR / f"{agent['id']}_avatar.png"
            img.save(output_path, 'PNG')
            
            size = output_path.stat().st_size / 1024
            print(f"   ✅ Saved to {output_path} ({size:.1f} KB)")
            results.append({"name": agent["name"], "success": True})
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            results.append({"name": agent["name"], "success": False})
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 GENERATION SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for r in results if r["success"])
    
    for r in results:
        status = "✅" if r["success"] else "❌"
        print(f"{status} {r['name']}")
    
    print(f"\nTotal: {successful}/{len(results)} successful")
    print(f"📁 Saved to: {OUTPUT_DIR}")
    
    # List files
    print("\n📂 Generated files:")
    for f in sorted(OUTPUT_DIR.glob("*.png")):
        size = f.stat().st_size / 1024
        print(f"   - {f.name} ({size:.1f} KB)")
    
    print("\n⚠️ NOTE: These are placeholder avatars.")
    print("   Replace with AI-generated versions when API is available.")
    
    return 0 if successful == len(results) else 1

if __name__ == "__main__":
    exit(main())
