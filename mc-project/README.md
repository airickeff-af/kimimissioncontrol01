# MC Project

3D Character Health & Wealth Tracker - A gamified life management system.

## Overview

MC Project combines health tracking, wealth management, and 3D character visualization to create an engaging life improvement platform.

## Features

- 🎮 **3D Character Viewer** - Interactive GLB model with real-time stat visualization
- 💪 **Health Tracking** - Exercise, sleep, and nutrition monitoring
- 💰 **Wealth Management** - Savings, investments, and gig work tracking
- 🔄 **Real-time Sync** - WebSocket updates for live character changes
- 📱 **Responsive Design** - Works on desktop and mobile

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

## API Endpoints

### Health
- `GET /api/health` - Get health stats
- `POST /api/health/exercise` - Log exercise
- `POST /api/health/sleep` - Log sleep
- `POST /api/health/nutrition` - Log nutrition

### Wealth
- `GET /api/wealth` - Get wealth stats
- `POST /api/wealth/savings` - Update savings
- `POST /api/wealth/investment` - Log investment
- `POST /api/wealth/gig` - Log gig work

### Character
- `GET /api/character/glb` - Get GLB model info
- `GET /api/character/stats` - Get character stats mapping

## Deployment

- **GitHub Pages**: https://airickeff-af.github.io/mc-project
- **Vercel**: Auto-deploy on push to main

## License

MIT
