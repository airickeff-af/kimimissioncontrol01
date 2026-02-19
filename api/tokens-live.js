// Vercel Serverless API: /api/tokens-live.js
// Consolidated endpoint - redirects to main tokens.js for live data
// This file exists for backward compatibility

const tokensHandler = require('./tokens.js');

module.exports = async (req, res) => {
  // Simply delegate to the main tokens handler
  return tokensHandler(req, res);
};
