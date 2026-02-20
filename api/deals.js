// API Endpoint: /api/deals
// Returns deal flow data

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const deals = [
      { id: 1, company: 'OSL Digital Securities', contact: 'Wayne Huang', region: 'Hong Kong', priority: 'P0', status: 'qualified', score: 98 },
      { id: 2, company: 'HashKey Exchange', contact: 'Michel Lee', region: 'Hong Kong', priority: 'P0', status: 'contacted', score: 98 },
      { id: 3, company: 'Amber Group', contact: 'Michael Wu', region: 'Hong Kong', priority: 'P0', status: 'new', score: 98 },
      { id: 4, company: 'FalconX', contact: 'Raghu Yarlagadda', region: 'USA', priority: 'P0', status: 'qualified', score: 98 },
      { id: 5, company: 'Circle HK', contact: 'Jeremy Allaire', region: 'Hong Kong', priority: 'P0', status: 'contacted', score: 96 },
      { id: 6, company: 'PDAX', contact: 'Nichel Gaba', region: 'Philippines', priority: 'P1', status: 'qualified', score: 94 },
      { id: 7, company: 'Coins.ph', contact: 'Wei Zhou', region: 'Philippines', priority: 'P1', status: 'new', score: 92 },
      { id: 8, company: 'Crypto.com', contact: 'Kris Marszalek', region: 'Singapore', priority: 'P1', status: 'contacted', score: 90 },
      { id: 9, company: 'Bybit', contact: 'Ben Zhou', region: 'Singapore', priority: 'P1', status: 'new', score: 88 },
      { id: 10, company: '2C2P', contact: 'Aung Kyaw Moe', region: 'Singapore', priority: 'P2', status: 'new', score: 85 }
    ];
    
    res.status(200).json({
      success: true,
      deals,
      total: deals.length,
      new: deals.filter(d => d.status === 'new').length,
      contacted: deals.filter(d => d.status === 'contacted').length,
      qualified: deals.filter(d => d.status === 'qualified').length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
