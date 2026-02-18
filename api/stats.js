// API endpoint for system statistics
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    stats: {
      agents: { total: 22, active: 18, idle: 4 },
      tasks: { total: 60, completed: 31, inProgress: 2, blocked: 27 },
      tokens: { total: 2475000, cost: 0.76, sessions: 269 },
      deployments: { total: 47, today: 12 },
      uptime: '99.9%'
    },
    timestamp: new Date().toISOString()
  });
};
