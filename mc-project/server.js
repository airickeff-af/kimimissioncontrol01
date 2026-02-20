const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const { setupWebSocket } = require('./websocket');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health System API
app.get('/api/health/stats', (req, res) => {
  res.json({
    exercise: { minutes: 0, calories: 0, streak: 0 },
    sleep: { hours: 0, quality: 0, streak: 0 },
    nutrition: { calories: 0, protein: 0, water: 0 }
  });
});

app.post('/api/health/exercise', (req, res) => {
  const { minutes, type, calories } = req.body;
  res.json({
    success: true,
    message: 'Exercise logged',
    data: { minutes, type, calories, timestamp: new Date().toISOString() }
  });
});

app.post('/api/health/sleep', (req, res) => {
  const { hours, quality } = req.body;
  res.json({
    success: true,
    message: 'Sleep logged',
    data: { hours, quality, timestamp: new Date().toISOString() }
  });
});

app.post('/api/health/nutrition', (req, res) => {
  const { calories, protein, water } = req.body;
  res.json({
    success: true,
    message: 'Nutrition logged',
    data: { calories, protein, water, timestamp: new Date().toISOString() }
  });
});

// Wealth System API
app.get('/api/wealth/stats', (req, res) => {
  res.json({
    savings: { total: 0, monthly: 0, goal: 0 },
    investments: { total: 0, returns: 0 },
    gigWork: { earnings: 0, hours: 0 }
  });
});

app.post('/api/wealth/savings', (req, res) => {
  const { amount } = req.body;
  res.json({
    success: true,
    message: 'Savings updated',
    data: { amount, timestamp: new Date().toISOString() }
  });
});

app.post('/api/wealth/investment', (req, res) => {
  const { amount, type } = req.body;
  res.json({
    success: true,
    message: 'Investment logged',
    data: { amount, type, timestamp: new Date().toISOString() }
  });
});

app.post('/api/wealth/gig', (req, res) => {
  const { earnings, hours, type } = req.body;
  res.json({
    success: true,
    message: 'Gig work logged',
    data: { earnings, hours, type, timestamp: new Date().toISOString() }
  });
});

// Character GLB API
app.get('/api/character/glb', (req, res) => {
  res.json({
    model: {
      url: '/assets/character.glb',
      version: '1.0.0',
      rigged: true,
      bones: ['root', 'spine', 'head', 'arms', 'legs'],
      morphTargets: ['health', 'wealth', 'energy', 'mood']
    },
    status: 'ready_for_upload'
  });
});

app.get('/api/character/stats', (req, res) => {
  res.json({
    health: {
      value: 50,
      max: 100,
      affects: ['posture', 'skin_tone', 'energy_level']
    },
    wealth: {
      value: 50,
      max: 100,
      affects: ['outfit_quality', 'accessories', 'confidence']
    },
    energy: {
      value: 50,
      max: 100,
      affects: ['animation_speed', 'brightness']
    }
  });
});

// Dual-Metric Mapping
app.get('/api/metrics/mapping', (req, res) => {
  res.json({
    health_wealth_interconnection: {
      description: 'Health and wealth stats affect 3D character appearance',
      mappings: {
        'health.exercise': ['character.muscle_tone', 'character.posture'],
        'health.sleep': ['character.eye_brightness', 'character.skin_quality'],
        'health.nutrition': ['character.energy_glow', 'character.vitality'],
        'wealth.savings': ['character.outfit_quality', 'character.accessories'],
        'wealth.investments': ['character.confidence_scale', 'character.glow_intensity'],
        'wealth.gigWork': ['character.hustle_animation', 'character.determination']
      }
    }
  });
});

// Viewer page
app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 MC Project server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
  console.log(`🎮 Viewer: http://localhost:${PORT}/viewer`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
