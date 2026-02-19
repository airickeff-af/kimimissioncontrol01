// Vercel Serverless Function: /api/logs-chat.js
// FLAT STRUCTURE approach - returns chat logs
// Access at: /api/logs-chat (NOT /api/logs/chat)

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

  const limit = parseInt(req.query?.limit) || 50;
  const now = Date.now();
  
  const logs = [
    { timestamp: new Date(now).toISOString(), agent: 'Nexus', channel: 'telegram', message: 'FLAT API endpoint /api/logs-chat is working!' },
    { timestamp: new Date(now - 300000).toISOString(), agent: 'Glasses', channel: 'internal', message: 'Daily crypto briefing completed' },
    { timestamp: new Date(now - 600000).toISOString(), agent: 'DealFlow', channel: 'slack', message: 'New lead qualified: TechCorp Inc' },
    { timestamp: new Date(now - 900000).toISOString(), agent: 'Audit', channel: 'internal', message: 'Quality check passed for 5 tasks' }
  ];

  res.status(200).json({
    success: true,
    endpoint: '/api/logs-chat (flat structure)',
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
};
