// Simple test API endpoint
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    success: true, 
    message: 'API is working',
    path: req.url,
    timestamp: new Date().toISOString()
  });
};
