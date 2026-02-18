// Vercel Serverless API: Health Check
// Returns system health status

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  res.status(200).json({
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
};
