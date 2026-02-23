// Vercel Serverless Function: /api/leads.js
// Returns leads data for Hong Kong and Singapore regions

const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { region } = req.query;
    
    // Define paths to lead files
    const leadsDir = path.join(process.cwd(), 'mission-control', 'data', 'leads');
    const hkFile = path.join(leadsDir, 'hongkong-leads.json');
    const sgFile = path.join(leadsDir, 'singapore-leads.json');
    
    let response = {
      success: true,
      timestamp: new Date().toISOString()
    };

    // Load Hong Kong leads
    if (!region || region === 'hongkong' || region === 'hk') {
      if (fs.existsSync(hkFile)) {
        const hkData = JSON.parse(fs.readFileSync(hkFile, 'utf8'));
        response.hongkong = {
          metadata: hkData.metadata,
          count: hkData.leads?.length || 0,
          leads: hkData.leads || []
        };
      } else {
        response.hongkong = { error: 'File not found', count: 0, leads: [] };
      }
    }

    // Load Singapore leads
    if (!region || region === 'singapore' || region === 'sg') {
      if (fs.existsSync(sgFile)) {
        const sgData = JSON.parse(fs.readFileSync(sgFile, 'utf8'));
        response.singapore = {
          metadata: sgData.metadata,
          count: sgData.leads?.length || 0,
          leads: sgData.leads || []
        };
      } else {
        response.singapore = { error: 'File not found', count: 0, leads: [] };
      }
    }

    // Calculate totals
    const hkCount = response.hongkong?.count || 0;
    const sgCount = response.singapore?.count || 0;
    response.total = hkCount + sgCount;
    response.summary = {
      hongkong: hkCount,
      singapore: sgCount,
      total: hkCount + sgCount
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Leads API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
