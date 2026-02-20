// Vercel Serverless Function: /api/stats.js
// Returns dashboard stats

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

  // Return dashboard stats
  res.status(200).json({
    success: true,
    agents: {
      total: 23,
      active: 18,
      busy: 3,
      idle: 2
    },
    tasks: {
      total: 47,
      completed: 28,
      pending: 12,
      inProgress: 7
    },
    tokens: {
      total: 442000,
      input: 280000,
      output: 162000,
      cost: 0.52
    },
    deals: {
      total: 30,
      new: 5,
      qualified: 12,
      contacted: 8,
      responded: 5
    },
    timestamp: new Date().toISOString()
  });
};
