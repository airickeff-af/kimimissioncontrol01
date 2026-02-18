// Vercel Serverless Function: /api/metrics.js
// Returns system metrics and performance data

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get metric type from query params
    const { type } = req.query;

    // Default metrics response
    const metrics = {
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        uptime: '99.9%',
        status: 'healthy',
        version: '2026.2.18'
      },
      api: {
        requests: 15234,
        avgResponseTime: '45ms',
        errorRate: '0.1%'
      },
      agents: {
        total: 20,
        active: 11,
        busy: 4,
        idle: 5,
        avgSuccessRate: '91%'
      },
      tokens: {
        dailyUsage: 1545592,
        dailyCost: 0.43,
        trend: 'stable'
      }
    };

    // Return specific metric type if requested
    if (type && metrics[type]) {
      res.status(200).json({
        success: true,
        type,
        data: metrics[type],
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Return all metrics
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in metrics API:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
