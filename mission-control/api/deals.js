// Vercel Serverless Function: /api/deals.js
// Returns deal flow data

const fs = require('fs');
const path = require('path');

function loadDeals() {
  try {
    const dealsFile = path.join(process.cwd(), 'data/dealflow-unified-database.json');
    if (fs.existsSync(dealsFile)) {
      const data = JSON.parse(fs.readFileSync(dealsFile, 'utf8'));
      return data.leads || data.deals || [];
    }
  } catch (error) {
    console.error('Error loading deals:', error);
  }
  return getFallbackDeals();
}

function getFallbackDeals() {
  return [
    { id: 1, company: 'TechCorp', status: 'new', value: 50000, region: 'Singapore' },
    { id: 2, company: 'DataFlow Inc', status: 'qualified', value: 75000, region: 'Hong Kong' },
    { id: 3, company: 'CloudNine', status: 'contacted', value: 100000, region: 'Singapore' },
    { id: 4, company: 'AI Solutions', status: 'responded', value: 120000, region: 'Tokyo' },
    { id: 5, company: 'NextGen Labs', status: 'new', value: 45000, region: 'Singapore' }
  ];
}

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

  const deals = loadDeals();
  
  const stats = {
    total: deals.length,
    new: deals.filter(d => d.status === 'new').length,
    qualified: deals.filter(d => d.status === 'qualified').length,
    contacted: deals.filter(d => d.status === 'contacted').length,
    responded: deals.filter(d => d.status === 'responded').length
  };

  res.status(200).json({
    success: true,
    deals: deals.slice(0, 50),
    stats: stats,
    timestamp: new Date().toISOString()
  });
};
