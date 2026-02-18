// API endpoint for system statistics

const { sendCachedResponse, setCacheBustingHeaders } = require('./lib/cache');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle cache-busting requests
  const cacheBust = req.query.bust || req.headers['x-cache-bust'];

  try {
    const stats = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      agents: {
        total: 23,
        active: 18,
        idle: 5
      },
      sessions: {
        total: 269,
        active: 18,
        today: 42
      },
      messages: {
        total: 1522,
        today: 186
      },
      tokens: {
        total: 442000,
        today: 58000,
        daily_limit: 1000000,
        percent_used: 42
      },
      cost: {
        total: 0.52,
        today: 0.08
      },
      uptime: {
        percentage: 99,
        duration: '14h'
      },
      deployments: {
        total: 47,
        latest: '2026-02-18T13:00:00Z'
      }
    };

    // If cache-busting is requested, disable caching
    if (cacheBust) {
      setCacheBustingHeaders(res);
      return res.status(200).json(stats);
    }

    // Send response with caching headers (60 second TTL)
    return sendCachedResponse(req, res, 'stats', stats);
  } catch (error) {
    // Return error without caching
    setCacheBustingHeaders(res);
    return res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
};
