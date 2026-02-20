// API Endpoint: /api/health
// Health check endpoint

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime ? process.uptime() : 0,
    timestamp: new Date().toISOString(),
    version: '1.2.0'
  });
};
