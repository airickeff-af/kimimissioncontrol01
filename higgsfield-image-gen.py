#!/usr/bin/env python3
"""
Higgsfield Image Generator for Mission Control Agents
Generates Kairosoft-style pixel art for all agents
"""

import requests
import json
import os
from pathlib import Path

class HiggsfieldImageGen:
    def __init__(self, api_key_id, api_key_secret):
        self.api_key_id = api_key_id
        self.api_key_secret = api_key_secret
        self.base_url = "https://api.higgsfield.ai/v1"
        self.output_dir = Path("/root/.openclaw/workspace/mission-control/dashboard/agent-avatars")
        self.output_dir.mkdir(exist_ok=True)
    
    def generate_agent_avatar(self, agent_id, agent_name, role, colors):
        """Generate Kairosoft-style pixel art avatar for an agent"""
        
        # Kairosoft-style prompt
        prompt = f"""
        Kairosoft game style pixel art character.
        {agent_name} - {role}.
        Cute chibi proportions, big head small body.
        {colors} color scheme.
        Computer/tech themed accessories.
        Isometric view.
        32x32 pixel art style.
        Japanese simulation game aesthetic.
        Bright, cheerful colors.
        White background.
        """
        
        payload = {
            "prompt": prompt.strip(),
            "width": 512,
            "height": 512,
            "num_images": 1,
            "style": "pixel_art",
            "negative_prompt": "photorealistic, 3d render, blurry, low quality"
        }
        
        headers = {
            "X-API-Key-ID": self.api_key_id,
            "X-API-Key-Secret": self.api_key_secret,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/images/generations",
                json=payload,
                headers=headers,
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                image_url = data.get("data", [{}])[0].get("url")
                
                # Download image
                if image_url:
                    img_response = requests.get(image_url, timeout=60)
                    if img_response.status_code == 200:
                        output_file = self.output_dir / f"{agent_id}-avatar.png"
                        with open(output_file, 'wb') as f:
                            f.write(img_response.content)
                        return str(output_file)
                
                return image_url  # Return URL if download fails
            else:
                print(f"Error generating {agent_id}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Exception generating {agent_id}: {e}")
            return None
    
    def generate_all_agents(self):
        """Generate avatars for all 14 Mission Control agents"""
        
        agents = [
            {
                "id": "nexus",
                "name": "Nexus (Air1ck3ff)",
                "role": "Orchestrator - The Commander",
                "colors": "Red and black, glowing circuits"
            },
            {
                "id": "forge",
                "name": "Forge",
                "role": "UX Developer - The Builder",
                "colors": "Blue and silver, hammer and code"
            },
            {
                "id": "code",
                "name": "Code",
                "role": "Backend Developer - The Architect",
                "colors": "Green and dark gray, server racks"
            },
            {
                "id": "audit",
                "name": "Audit",
                "role": "Quality Assurance - The Inspector",
                "colors": "Gold and white, magnifying glass"
            },
            {
                "id": "glasses",
                "name": "Glasses",
                "role": "Researcher - The Intel Gatherer",
                "colors": "Light blue and navy, reading glasses"
            },
            {
                "id": "quill",
                "name": "Quill",
                "role": "Writer - The Scribe",
                "colors": "Orange and brown, feather pen"
            },
            {
                "id": "pixel",
                "name": "Pixel",
                "role": "Visual Designer - The Artist",
                "colors": "Purple and pink, paintbrush and pixels"
            },
            {
                "id": "gary",
                "name": "Gary",
                "role": "Marketing Lead - The Strategist",
                "colors": "Green and gold, megaphone and charts"
            },
            {
                "id": "larry",
                "name": "Larry",
                "role": "Social Media - The Connector",
                "colors": "Yellow and blue, phone and hashtags"
            },
            {
                "id": "sentry",
                "name": "Sentry",
                "role": "DevOps - The Guardian",
                "colors": "Cyan and dark blue, shield and monitors"
            },
            {
                "id": "cipher",
                "name": "Cipher",
                "role": "Security - The Protector",
                "colors": "Gray and black, lock and encryption"
            },
            {
                "id": "dealflow",
                "name": "DealFlow",
                "role": "BD Lead Generator - The Hunter",
                "colors": "Red and purple, handshake and targets"
            },
            {
                "id": "coldcall",
                "name": "ColdCall",
                "role": "Meeting Booker - The Closer",
                "colors": "Teal and white, phone and calendar"
            },
            {
                "id": "scout",
                "name": "Scout",
                "role": "Opportunity Hunter - The Explorer",
                "colors": "Yellow and red, compass and treasure"
            }
        ]
        
        results = {}
        
        print("🎨 Generating Kairosoft-style avatars for all agents...\n")
        
        for agent in agents:
            print(f"Generating {agent['id']}...", end=" ")
            
            result = self.generate_agent_avatar(
                agent["id"],
                agent["name"],
                agent["role"],
                agent["colors"]
            )
            
            if result:
                print(f"✅ {result}")
                results[agent["id"]] = result
            else:
                print("❌ Failed")
                results[agent["id"]] = None
        
        return results

if __name__ == "__main__":
    # API credentials
    API_KEY_ID = "69c30678-8aa2-4b13-ab58-170284c81cec"
    API_KEY_SECRET = "ac73702af32b4bb31064523a3200b74c302320bbc751dacea5b4a333326adefc"
    
    # Initialize generator
    gen = HiggsfieldImageGen(API_KEY_ID, API_KEY_SECRET)
    
    # Generate all avatars
    results = gen.generate_all_agents()
    
    # Save results
    results_file = gen.output_dir / "generation-results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📁 Results saved to: {results_file}")
    print(f"🖼️  Avatars saved to: {gen.output_dir}")
