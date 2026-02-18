// Vercel Serverless Function: /api/logs-chat.js
// FLAT STRUCTURE - Alternative to nested /api/logs/chat.js
// Access via: /api/logs-chat

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

  // Get limit from query params (default 100)
  const limit = parseInt(req.query?.limit) || 100;

  // Generate chat logs
  const now = Date.now();
  const logs = [
    { timestamp: new Date(now).toISOString(), agent: 'Nexus', type: 'chat', message: 'Chat API endpoint working!', sessionId: 'chat-test' },
    { timestamp: new Date(now - 60000).toISOString(), agent: 'Glasses', type: 'chat', message: 'Daily briefing ready', sessionId: 'briefing-001' },
    { timestamp: new Date(now - 120000).toISOString(), agent: 'Quill', type: 'chat', message: 'Content draft completed', sessionId: 'content-001' }
  ];

  // Return logs
  res.status(200).json({
    success: true,
    endpoint: '/api/logs-chat (flat structure)',
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
};
