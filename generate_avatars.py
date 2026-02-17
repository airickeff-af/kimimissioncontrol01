#!/usr/bin/env python3
"""
Pixel-2: Higgsfield AI Image Generation Script
Generates Kairosoft-style avatars for Marketing Team Agents (5 agents)
"""

import requests
import json
import time
import os
from pathlib import Path

# Higgsfield API Configuration
API_KEY_ID = "69c30678-8aa2-4b13-ab58-170284c81cec"
API_KEY_SECRET = "ac73702af32b4bb31064523a3200b74c302320bbc751dacea5b4a333326adefc"
API_BASE = "https://api.higgsfield.ai/v1"
OUTPUT_DIR = Path("/dashboard/agent-avatars")

# Marketing Team Agents to generate
AGENTS = [
    {
        "id": "gary",
        "name": "Gary",
        "role": "Marketing Lead",
        "colors": "Green and gold, megaphone and charts",
        "prompt_extra": "wearing a business suit, holding charts and graphs, confident smile, marketing leader"
    },
    {
        "id": "larry",
        "name": "Larry",
        "role": "Social Media",
        "colors": "Yellow and blue, phone and hashtags",
        "prompt_extra": "holding multiple phones, wearing trendy casual clothes, energetic pose, social media manager"
    },
    {
        "id": "scout",
        "name": "Scout",
        "role": "Opportunity Hunter",
        "colors": "Yellow and red, compass and treasure",
        "prompt_extra": "wearing an explorer hat with a compass, adventurous stance, map in hand, opportunity seeker"
    },
    {
        "id": "dealflow",
        "name": "DealFlow",
        "role": "BD Lead Gen",
        "colors": "Red and purple, handshake and targets",
        "prompt_extra": "holding a briefcase and business cards, networking pose, business development professional"
    },
    {
        "id": "coldcall",
        "name": "ColdCall",
        "role": "Meeting Booker",
        "colors": "Teal and white, phone and calendar",
        "prompt_extra": "holding a phone headset, friendly smile, professional attire, sales caller"
    }
]

def generate_kairosoft_prompt(agent: dict) -> str:
    """Generate a Kairosoft-style pixel art prompt for an agent"""
    prompt = f"""Kairosoft game style pixel art character portrait, chibi style, 
{agent['name']} - {agent['role']}, 
{agent['colors']} color scheme, {agent['prompt_extra']}, 
big expressive eyes, small cute body, 16-bit pixel art aesthetic, 
white background, character sprite, Japanese simulation game style, 
clean pixel edges, vibrant colors, computer and tech theme"""
    return prompt.replace('\n', ' ').strip()

def generate_avatar(agent: dict) -> bool:
    """Generate avatar for a single agent using Higgsfield API"""
    agent_id = agent["id"]
    name = agent["name"]
    
    print(f"\n🎨 Generating avatar for {name} ({agent['role']})...")
    
    prompt = generate_kairosoft_prompt(agent)
    print(f"   Prompt: {prompt[:100]}...")
    
    payload = {
        "prompt": prompt,
        "width": 512,
        "height": 512,
        "num_images": 1,
        "style": "pixel_art",
        "negative_prompt": "photorealistic, 3d render, blurry, low quality, dark background"
    }
    
    headers = {
        "X-API-Key-ID": API_KEY_ID,
        "X-API-Key-Secret": API_KEY_SECRET,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/images/generations",
            json=payload,
            headers=headers,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            image_url = data.get("data", [{}])[0].get("url")
            
            if image_url:
                # Download image
                img_response = requests.get(image_url, timeout=60)
                if img_response.status_code == 200:
                    output_file = OUTPUT_DIR / f"{agent_id}_avatar.png"
                    with open(output_file, 'wb') as f:
                        f.write(img_response.content)
                    print(f"   ✅ Saved to {output_file}")
                    return True
                else:
                    print(f"   ❌ Failed to download image: {img_response.status_code}")
                    return False
            else:
                print(f"   ❌ No image URL in response")
                return False
        else:
            print(f"   ❌ API Error: {response.status_code} - {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def main():
    print("=" * 60)
    print("🎮 Pixel-2: Kairosoft Avatar Generation for Marketing Team")
    print("   Using Higgsfield AI API")
    print("=" * 60)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    results = []
    for agent in AGENTS:
        success = generate_avatar(agent)
        results.append({
            "name": agent["name"],
            "role": agent["role"],
            "success": success
        })
        # Small delay between requests
        time.sleep(2)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 GENERATION SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for r in results if r["success"])
    failed = len(results) - successful
    
    for r in results:
        status = "✅" if r["success"] else "❌"
        print(f"{status} {r['name']} ({r['role']})")
    
    print(f"\nTotal: {successful}/{len(results)} successful")
    
    if failed > 0:
        print(f"\n⚠️ {failed} generation(s) failed. Check logs above.")
        return 1
    
    print("\n🎉 All avatars generated successfully!")
    print(f"📁 Saved to: {OUTPUT_DIR}")
    
    # List generated files
    print("\n📂 Generated files:")
    for f in sorted(OUTPUT_DIR.glob("*.png")):
        size = f.stat().st_size / 1024  # KB
        print(f"   - {f.name} ({size:.1f} KB)")
    
    return 0

if __name__ == "__main__":
    exit(main())
