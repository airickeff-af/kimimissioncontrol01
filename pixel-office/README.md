# Isometric Pixel Office

A Python-based isometric pixel art office visualization with animated agents, real-time activity tracking, and interactive features.

## Features

- **Isometric Pixel Art**: Minecraft-style 32x32 sprites
- **Animated Agents**: Walking animations, idle states
- **Real-time Activity**: Connects to API for live agent status
- **Activity Bars**: Shows current tasks, progress, status
- **Agent Interactions**: Agents talk and collaborate
- **Audit Visualization**: Shows audit agents reviewing work
- **Nexus Delegation**: Visual task assignment representation
- **Standup Meetings**: Agents gather for standup data

## Architecture

```
pixel-office/
├── main.py              # Entry point
├── game/
│   ├── __init__.py
│   ├── engine.py        # Pygame engine wrapper
│   ├── isometric.py     # Isometric math utilities
│   ├── world.py         # World/scene management
│   └── renderer.py      # Rendering pipeline
├── entities/
│   ├── __init__.py
│   ├── agent.py         # Agent entity
│   ├── tile.py          # Isometric tiles
│   ├── furniture.py     # Office furniture
│   └── effects.py       # Particle effects
├── sprites/
│   ├── __init__.py
│   ├── generator.py     # Procedural sprite generation
│   └── cache.py         # Sprite caching
├── api/
│   ├── __init__.py
│   ├── client.py        # API client
│   └── mock.py          # Mock data for testing
├── web/
│   ├── __init__.py
│   ├── server.py        # WebSocket server
│   └── static/
│       └── index.html   # Web client
└── assets/              # Generated sprites
```

## Running

### Standalone
```bash
pip install -r requirements.txt
python main.py
```

### Web (WebSocket)
```bash
python -m web.server
# Open http://localhost:8765
```

## Controls

- **Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Click**: Select agent
- **Space**: Toggle standup meeting
