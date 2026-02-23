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
    
    // Try multiple possible paths for leads data
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'leads'),
      path.join(process.cwd(), 'mission-control', 'data', 'leads'),
      path.join(__dirname, '..', 'data', 'leads'),
      '/var/task/data/leads'
    ];
    
    let leadsDir = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        leadsDir = p;
        break;
      }
    }
    
    let response = {
      success: true,
      timestamp: new Date().toISOString(),
      debug: { cwd: process.cwd(), foundPath: leadsDir }
    };

    // Load Hong Kong leads
    if (!region || region === 'hongkong' || region === 'hk') {
      const hkFile = leadsDir ? path.join(leadsDir, 'hongkong-leads.json') : null;
      if (hkFile && fs.existsSync(hkFile)) {
        const hkData = JSON.parse(fs.readFileSync(hkFile, 'utf8'));
        response.hongkong = {
          metadata: hkData.metadata,
          count: hkData.leads?.length || 0,
          leads: hkData.leads || []
        };
      } else {
        response.hongkong = { 
          error: 'File not found', 
          searchedPaths: possiblePaths.map(p => path.join(p, 'hongkong-leads.json')),
          count: 0, 
          leads: [] 
        };
      }
    }

    // Load Singapore leads
    if (!region || region === 'singapore' || region === 'sg') {
      const sgFile = leadsDir ? path.join(leadsDir, 'singapore-leads.json') : null;
      if (sgFile && fs.existsSync(sgFile)) {
        const sgData = JSON.parse(fs.readFileSync(sgFile, 'utf8'));
        response.singapore = {
          metadata: sgData.metadata,
          count: sgData.leads?.length || 0,
          leads: sgData.leads || []
        };
      } else {
        response.singapore = { 
          error: 'File not found', 
          count: 0, 
          leads: [] 
        };
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
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
