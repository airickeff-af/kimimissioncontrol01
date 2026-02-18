// Vercel Serverless Function: /api/logs/chat.js
// Returns chat/conversation logs

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const logs = [
    { timestamp: new Date().toISOString(), agent: 'Nexus', message: 'Chat endpoint working (nested)', type: 'info' }
  ];

  res.status(200).json({
    success: true,
    endpoint: '/api/logs/chat',
    logs,
    timestamp: new Date().toISOString()
  });
};
