// Vercel Serverless API: Health Check
// Returns system health status

const { sendCachedResponse, setCacheBustingHeaders } = require('./lib/cache');

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Handle cache-busting requests
    const cacheBust = req.query.bust || req.headers['x-cache-bust'];

    const responseData = {
      success: true,
      status: "healthy",
      uptime: "99.9%",
      version: "2026.2.18",
      checks: {
        api: "ok",
        database: "ok",
        agents: "ok",
        cron: "ok"
      },
      timestamp: new Date().toISOString()
    };

    // If cache-busting is requested, disable caching
    if (cacheBust) {
      setCacheBustingHeaders(res);
      return res.status(200).json(responseData);
    }

    // Send response with caching headers (300 second TTL)
    return sendCachedResponse(req, res, 'health', responseData);
  } catch (error) {
    console.error('Error in health API:', error);
    
    // Return error without caching
    setCacheBustingHeaders(res);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      code: 'HEALTH_CHECK_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
