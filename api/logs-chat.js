// Vercel Serverless Function: /api/logs-index.js
// FLAT STRUCTURE - Alternative to nested /api/logs/index.js
// Access via: /api/logs-index

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

  // Return available log endpoints
  res.status(200).json({
    success: true,
    endpoint: '/api/logs-index (flat structure)',
    availableEndpoints: [
      { path: '/api/logs-activity', description: 'Activity logs' },
      { path: '/api/logs-chat', description: 'Chat logs' },
      { path: '/api/logs-index', description: 'This endpoint - list of available log endpoints' }
    ],
    timestamp: new Date().toISOString()
  });
};
