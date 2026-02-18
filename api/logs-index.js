// Vercel Serverless Function: /api/logs-index.js
// FLAT STRUCTURE - Main logs endpoint

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    endpoint: '/api/logs',
    message: 'Logs API is working!',
    availableEndpoints: [
      '/api/logs-activity',
      '/api/logs-chat',
      '/api/logs-index',
      '/api/health',
      '/api/stats',
      '/api/tasks',
      '/api/agents',
      '/api/metrics',
      '/api/deployments'
    ],
    timestamp: new Date().toISOString()
  });
};
