// API Endpoint: /api/stats
// Returns system statistics

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    res.status(200).json({
      success: true,
      agents: {
        total: 23,
        active: 18,
        idle: 5
      },
      tasks: {
        total: 47,
        pending: 12,
        inProgress: 8,
        completed: 27
      },
      tokens: {
        total: 442000,
        today: 45000,
        cost: 0.52
      },
      deals: {
        total: 30,
        new: 5,
        contacted: 12,
        qualified: 8
      },
      system: {
        uptime: '99.9%',
        lastDeploy: new Date().toISOString(),
        version: '1.2.0'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
