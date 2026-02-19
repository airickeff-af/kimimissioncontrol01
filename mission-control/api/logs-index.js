// Vercel Serverless Function: /api/logs-index.js
// FLAT STRUCTURE approach - returns logs index
// Access at: /api/logs-index (NOT /api/logs)

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

  res.status(200).json({
    success: true,
    endpoint: '/api/logs-index (flat structure)',
    available: [
      '/api/logs-activity',
      '/api/logs-chat'
    ],
    timestamp: new Date().toISOString()
  });
};
