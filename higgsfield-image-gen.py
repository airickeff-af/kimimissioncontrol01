#!/usr/bin/env python3
"""
Higgsfield Image Generation Script
Generates Kairosoft-style pixel art avatars for Mission Control agents
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from typing import Optional

# Higgsfield API Configuration
HIGGSFIELD_API_URL = "https://api.higgsfield.ai/v1/images/generate"
API_KEY_ID = "69c30678-8aa2-4b13-ab58-170284c81cec"

# Get API secret from environment or secure storage
def get_api_secret() -> str:
    """Retrieve API secret from environment or file"""
    # Try environment variable first
    secret = os.environ.get("HIGGSFIELD_API_SECRET")
    if secret:
        return secret
    
    # Try reading from secure storage file
    secret_file = Path.home() / ".higgsfield_secret"
    if secret_file.exists():
        return secret_file.read_text().strip()
    
    raise ValueError("Higgsfield API secret not found. Set HIGGSFIELD_API_SECRET environment variable.")

# Agent definitions with their characteristics
AGENTS = {
    "Air1ck3ff": {
        "role": "Nexus - Chief of Staff",
        "color": "electric blue",
        "personality": "professional, organized, commanding",
        "symbol": "⚡",
        "prompt_extra": "wearing a formal uniform with command insignia, confident stance"
    },
    "Quill": {
        "role": "The Writer",
        "color": "warm amber",
        "personality": "creative, articulate, thoughtful",
        "symbol": "✍️",
        "prompt_extra": "holding a quill pen, surrounded by floating papers, artistic vibe"
    },
    "Pixel": {
        "role": "The Designer",
        "color": "vibrant purple",
        "personality": "visual, creative, detail-oriented",
        "symbol": "🎨",
        "prompt_extra": "holding a paintbrush and tablet, wearing an artist's beret"
    },
    "Glasses": {
        "role": "The Researcher",
        "color": "scholarly green",
        "personality": "curious, analytical, knowledgeable",
        "symbol": "🔍",
        "prompt_extra": "wearing large round glasses, holding a magnifying glass and books"
    },
    "Gary": {
        "role": "Marketing Lead",
        "color": "confident red",
        "personality": "strategic, persuasive, energetic",
        "symbol": "📈",
        "prompt_extra": "wearing a business suit, holding charts and graphs, confident smile"
    },
    "Larry": {
        "role": "Social Media Agent",
        "color": "social blue",
        "personality": "trendy, engaging, fast-paced",
        "symbol": "📱",
        "prompt_extra": "holding multiple phones, wearing trendy casual clothes, energetic pose"
    },
    "Sentry": {
        "role": "DevOps",
        "color": "alert orange",
        "personality": "vigilant, technical, reliable",
        "symbol": "🛡️",
        "prompt_extra": "wearing tech gear with monitors, alert stance, holding tools"
    },
    "Cipher": {
        "role": "Security Agent",
        "color": "stealth black",
        "personality": "mysterious, protective, sharp",
        "symbol": "🔒",
        "prompt_extra": "wearing a hooded cloak, mysterious aura, holding a lock and key"
    },
    "Audit": {
        "role": "Quality Assurance",
        "color": "precise silver",
        "personality": "meticulous, fair, thorough",
        "symbol": "✓",
        "prompt_extra": "holding a clipboard and checklist, precise posture, examining eye"
    },
    "ColdCall": {
        "role": "Outreach Specialist",
        "color": "outgoing yellow",
        "personality": "persistent, charming, goal-oriented",
        "symbol": "📞",
        "prompt_extra": "holding a phone headset, friendly smile, professional attire"
    },
    "DealFlow": {
        "role": "Lead Generator",
        "color": "opportunity gold",
        "personality": "opportunistic, networker, sharp",
        "symbol": "💼",
        "prompt_extra": "holding a briefcase and business cards, networking pose"
    },
    "Forge": {
        "role": "Code Specialist",
        "color": "forge red-orange",
        "personality": "craftsman, builder, focused",
        "symbol": "🔨",
        "prompt_extra": "wearing a blacksmith apron, holding a glowing hammer, sparks flying"
    },
    "Scout": {
        "role": "Research Scout",
        "color": "explorer brown",
        "personality": "adventurous, curious, resourceful",
        "symbol": "🧭",
        "prompt_extra": "wearing an explorer hat with a compass, adventurous stance, map in hand"
    },
    "Buzz": {
        "role": "Trend Monitor",
        "color": "buzzing neon",
        "personality": "fast, alert, trend-savvy",
        "symbol": "⚡",
        "prompt_extra": "surrounded by lightning bolts and notifications, fast-moving blur effect"
    }
}

def generate_kairosoft_prompt(agent_name: str, agent_info: dict) -> str:
    """Generate a Kairosoft-style pixel art prompt for an agent"""
    base_prompt = f"""Kairosoft game style pixel art character portrait, chibi style, 
{agent_info['color']} color scheme, {agent_info['prompt_extra']}, 
big expressive eyes, small cute body, 16-bit pixel art aesthetic, 
white background, character sprite, Japanese simulation game style, 
clean pixel edges, vibrant colors, {agent_info['personality']} expression,
{agent_info['symbol']} symbol somewhere on outfit"""
    return base_prompt.replace('\n', ' ').strip()

def generate_image(prompt: str, output_path: str, agent_name: str) -> bool:
    """Generate an image using Higgsfield API"""
    try:
        api_secret = get_api_secret()
        
        headers = {
            "Authorization": f"Bearer {API_KEY_ID}:{api_secret}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "prompt": prompt,
            "negative_prompt": "blurry, low quality, realistic, 3d render, photograph, messy, dark background",
            "width": 512,
            "height": 512,
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
            "seed": -1  # Random seed
        }
        
        print(f"Generating image for {agent_name}...")
        response = requests.post(
            HIGGSFIELD_API_URL,
            headers=headers,
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            # Save the image
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Saved: {output_path}")
            return True
        else:
            print(f"❌ Failed for {agent_name}: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error generating {agent_name}: {e}")
        return False

def generate_all_agents(output_dir: str = "./assets/agents") -> dict:
    """Generate avatars for all agents"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    results = {
        "success": [],
        "failed": [],
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    print("=" * 60)
    print("HIGGSFIELD IMAGE GENERATION - KAIROSOFT STYLE AGENTS")
    print("=" * 60)
    print(f"Total agents to generate: {len(AGENTS)}")
    print(f"Output directory: {output_path.absolute()}")
    print("=" * 60)
    
    for i, (agent_name, agent_info) in enumerate(AGENTS.items(), 1):
        print(f"\n[{i}/{len(AGENTS)}] Processing: {agent_name}")
        print(f"Role: {agent_info['role']}")
        
        prompt = generate_kairosoft_prompt(agent_name, agent_info)
        print(f"Prompt: {prompt[:100]}...")
        
        image_path = output_path / f"{agent_name.lower()}_avatar.png"
        
        if generate_image(prompt, str(image_path), agent_name):
            results["success"].append(agent_name)
        else:
            results["failed"].append(agent_name)
        
        # Small delay to avoid rate limiting
        time.sleep(1)
    
    # Save results report
    report_path = output_path / "generation_report.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"✅ Success: {len(results['success'])}/{len(AGENTS)}")
    print(f"❌ Failed: {len(results['failed'])}/{len(AGENTS)}")
    if results['failed']:
        print(f"Failed agents: {', '.join(results['failed'])}")
    print(f"Report saved to: {report_path}")
    
    return results

def generate_single_agent(agent_name: str, output_dir: str = "./assets/agents") -> bool:
    """Generate avatar for a single agent"""
    if agent_name not in AGENTS:
        print(f"Unknown agent: {agent_name}")
        print(f"Available agents: {', '.join(AGENTS.keys())}")
        return False
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    agent_info = AGENTS[agent_name]
    prompt = generate_kairosoft_prompt(agent_name, agent_info)
    image_path = output_path / f"{agent_name.lower()}_avatar.png"
    
    print(f"Generating avatar for {agent_name}...")
    print(f"Role: {agent_info['role']}")
    
    return generate_image(prompt, str(image_path), agent_name)

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate Kairosoft-style agent avatars")
    parser.add_argument("--agent", "-a", help="Generate specific agent only")
    parser.add_argument("--output", "-o", default="./assets/agents", help="Output directory")
    parser.add_argument("--list", "-l", action="store_true", help="List all available agents")
    
    args = parser.parse_args()
    
    if args.list:
        print("Available agents:")
        for name, info in AGENTS.items():
            print(f"  - {name}: {info['role']}")
        return
    
    if args.agent:
        success = generate_single_agent(args.agent, args.output)
        sys.exit(0 if success else 1)
    else:
        results = generate_all_agents(args.output)
        sys.exit(0 if len(results['failed']) == 0 else 1)

if __name__ == "__main__":
    main()
