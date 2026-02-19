// Minimal test API endpoint
// Place at /api/test.js for debugging

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    success: true,
    message: "Minimal test endpoint working!",
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};
