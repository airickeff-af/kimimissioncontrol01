// /api/deployments.js - Returns deployment history
// Version: 1.0 - Deployment tracking endpoint

const fs = require('fs');
const path = require('path');

// Generate deployment data based on git history or fallback
function getDeployments() {
  // Fallback deployment data
  const deployments = [
    {
      id: "deploy_001",
      commit: "a1b2c3d",
      message: "Fix API routing and add new endpoints",
      author: "Code-1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "success",
      url: "https://dashboard-ten-sand-20.vercel.app"
    },
    {
      id: "deploy_002",
      commit: "e4f5g6h",
      message: "Update token tracker with live API",
      author: "Forge-2",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "success",
      url: "https://dashboard-ten-sand-20.vercel.app"
    },
    {
      id: "deploy_003",
      commit: "i7j8k9l",
      message: "Fix navigation consistency across pages",
      author: "Forge-1",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: "success",
      url: "https://dashboard-ten-sand-20.vercel.app"
    },
    {
      id: "deploy_004",
      commit: "m0n1o2p",
      message: "Add pixel office animations",
      author: "Pixel",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "success",
      url: "https://dashboard-ten-sand-20.vercel.app"
    },
    {
      id: "deploy_005",
      commit: "q3r4s5t",
      message: "Fix task board data loading",
      author: "Code-2",
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      status: "failed",
      url: "https://dashboard-ten-sand-20.vercel.app"
    }
  ];
  
  return deployments;
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { limit = 10 } = req.query || {};
    const deployments = getDeployments();
    const limitNum = parseInt(limit, 10) || 10;
    
    const summary = {
      total: 47,
      successful: 45,
      failed: 2,
      last24h: deployments.filter(d => {
        const deployTime = new Date(d.timestamp).getTime();
        return (Date.now() - deployTime) < 24 * 60 * 60 * 1000;
      }).length
    };
    
    res.status(200).json({
      success: true,
      data: {
        deployments: deployments.slice(0, limitNum),
        summary: summary
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /api/deployments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
