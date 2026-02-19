// Vercel Serverless Function: /api/test-simple.js
// Simple test endpoint to verify API is working

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    message: 'API is working!',
    endpoint: '/api/test-simple',
    timestamp: new Date().toISOString()
  });
};
