// Vercel Serverless Function: /api/logs-chat.js
// FLAT STRUCTURE - Chat logs endpoint

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const limit = parseInt(req.query?.limit) || 100;

  const logs = [
    { timestamp: new Date().toISOString(), agent: 'Nexus', type: 'chat', message: 'Hello from /api/logs-chat!', sessionId: 'chat-test' }
  ];

  res.status(200).json({
    success: true,
    endpoint: '/api/logs-chat',
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
};
