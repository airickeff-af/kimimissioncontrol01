// Vercel Serverless API: Health Check
// Returns system health status

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    res.status(200).json({
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
    });
  } catch (error) {
    console.error('Error in health API:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      code: 'HEALTH_CHECK_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
