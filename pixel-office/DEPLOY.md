# Isometric Pixel Office - Deployment Guide

## Quick Start

### 1. Install Dependencies

```bash
cd pixel-office
pip install -r requirements.txt
```

### 2. Run Standalone (Desktop)

```bash
# With mock data
python main.py --mock

# Connect to real API (configure URL in api/client.py)
python main.py
```

**Controls:**
- `WASD` / Arrow Keys: Pan camera
- `Mouse Wheel`: Zoom in/out
- `Click`: Select agent
- `Space`: Toggle standup meeting
- `D`: Toggle debug info
- `R`: Reset camera
- `ESC`: Quit

### 3. Run WebSocket Server (Web)

```bash
# With mock data
python -m web.server --mock

# Or using main.py
python main.py --web --mock
```

Then open: `http://localhost:8765`

## Deployment Options

### Option 1: Local Development

```bash
# Terminal 1 - Run the server
python main.py --web --mock

# Browser - Open the web interface
open http://localhost:8765
```

### Option 2: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libsdl2-dev \
    libsdl2-image-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8765

CMD ["python", "main.py", "--web", "--mock"]
```

Build and run:

```bash
docker build -t pixel-office .
docker run -p 8765:8765 pixel-office
```

### Option 3: Production with Real API

1. Configure API URL in `api/client.py`:

```python
self.base_url = "https://your-api-server.com"
```

2. Run without mock flag:

```bash
python main.py --web
```

### Option 4: Brython (Pure Browser - Experimental)

To run entirely in browser without WebSocket server:

1. Install Brython:

```bash
pip install brython
```

2. Create `web/brython_index.html` that loads Python directly in browser.

Note: This requires rewriting the rendering to use HTML5 Canvas API instead of Pygame.

## API Integration

### Expected Endpoints

The visualization expects these endpoints:

```
GET /api/agents     - List of agents with status
GET /api/tasks      - List of active tasks  
GET /api/audits     - List of active audits
```

### Agent Data Format

```json
{
  "id": "agent_1",
  "name": "Agent 1",
  "role": "developer",
  "status": "working",
  "current_task": "Coding feature",
  "progress": 0.75,
  "delegated_from": null
}
```

### Task Data Format

```json
{
  "id": "task_1",
  "title": "Implement feature",
  "status": "active",
  "priority": "high",
  "assignee": "agent_1",
  "progress": 0.5
}
```

### Audit Data Format

```json
{
  "target_id": "agent_1",
  "auditor_id": "audit_0",
  "type": "code_review"
}
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│ WebSocket Server│────▶│   API Server    │
│  (HTML5/Canvas) │◀────│   (Python/ws)   │◀────│  (Your Backend) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Game World    │
                        │  (Pygame/Iso)   │
                        └─────────────────┘
```

## Customization

### Adding New Sprite Types

Edit `sprites/generator.py`:

```python
def generate_new_sprite(self) -> pygame.Surface:
    surf = self._create_surface(32, 32)
    # Draw your pixel art
    return surf
```

### Changing Office Layout

Edit `game/world.py` in `_generate_world()`:

```python
# Add new furniture
self.furniture.append(Furniture(x, y, 'new_type'))
```

### Adding New Agent Behaviors

Edit `game/world.py` in `_update_agent_behaviors()`:

```python
elif agent.activity == ActivityType.IDLE and random.random() < 0.01:
    agent.set_activity(ActivityType.NEW_ACTIVITY)
```

## Performance Tips

1. **Reduce agent count** for better FPS
2. **Lower update rate** in WebSocket server (change `dt`)
3. **Use smaller canvas** for web clients
4. **Enable sprite caching** (already implemented)

## Troubleshooting

### Pygame won't initialize

```bash
# Ubuntu/Debian
sudo apt-get install libsdl2-dev libsdl2-image-dev

# macOS
brew install sdl2 sdl2_image
```

### WebSocket connection failed

- Check firewall settings
- Verify port 8765 is open
- Check browser console for errors

### Low FPS

- Reduce number of agents
- Lower camera zoom level
- Disable speech bubbles

## License

MIT - Feel free to use and modify!
