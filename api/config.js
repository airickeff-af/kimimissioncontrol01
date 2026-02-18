// Vercel Serverless Function: /api/config.js
// Returns API configuration and available endpoints

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // API configuration
  const config = {
    success: true,
    version: '2026.2.18',
    environment: 'production',
    features: [
      'real-tasks',
      'live-agents',
      'token-tracking',
      'input-validation',
      'caching',
      'cors'
    ],
    endpoints: [
      {
        path: '/api/health',
        description: 'Health check endpoint',
        methods: ['GET'],
        cacheTTL: 300
      },
      {
        path: '/api/agents',
        description: 'List all agents with status, tasks, and token usage',
        methods: ['GET'],
        cacheTTL: 60,
        parameters: ['bust']
      },
      {
        path: '/api/tasks',
        description: 'List all tasks with filtering and pagination',
        methods: ['GET'],
        cacheTTL: 60,
        parameters: ['status', 'priority', 'agent', 'search', 'limit', 'page', 'bust']
      },
      {
        path: '/api/logs/activity',
        description: 'Activity logs from all agents',
        methods: ['GET'],
        cacheTTL: 30,
        parameters: ['limit', 'agent', 'type']
      },
      {
        path: '/api/metrics',
        description: 'System performance metrics',
        methods: ['GET'],
        cacheTTL: 60,
        parameters: ['type']
      },
      {
        path: '/api/config',
        description: 'API configuration and endpoint documentation',
        methods: ['GET'],
        cacheTTL: 300
      }
    ],
    caching: {
      strategy: 'HTTP Cache-Control with ETag',
      defaultTTL: 60,
      healthTTL: 300,
      logsTTL: 30,
      agentsTTL: 60,
      tasksTTL: 60,
      metricsTTL: 60
    },
    validation: {
      enabled: true,
      rules: {
        limit: { type: 'integer', min: 1, max: 1000, default: 50 },
        page: { type: 'integer', min: 1, max: 10000, default: 1 },
        status: { type: 'enum', allowed: ['pending', 'in_progress', 'completed', 'blocked', 'planned', 'active', 'idle', 'busy'] },
        priority: { type: 'enum', allowed: ['P0', 'P1', 'P2', 'P3'] },
        agent: { type: 'string', maxLength: 100, pattern: '^[a-zA-Z0-9_-]+$' }
      }
    },
    documentation: {
      url: '/docs/API_DOCUMENTATION.md',
      format: 'Markdown',
      lastUpdated: '2026-02-19'
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(config);
};
