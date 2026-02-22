// Vercel Serverless Function: /api/config.js
// Returns Mission Control configuration

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const config = {
    version: '1.0.0',
    environment: 'production',
    features: {
      realTimeUpdates: true,
      autoRefresh: true,
      notifications: true,
      darkMode: true
    },
    limits: {
      maxAgents: 50,
      maxTasks: 1000,
      tokenBudget: 5000000
    },
    regions: ['HK', 'SG', 'AU', 'BR', 'NG', 'TH'],
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    config
  });
};
