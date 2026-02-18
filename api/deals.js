// /api/deals.js - Returns all 30 leads with contact info
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { priority, region, status, limit = 30 } = req.query;
  
  const deals = [
    { id: 'lead_001', company: 'Coins.ph', contact: 'Wei Zhou', title: 'CEO & Founder', email: 'wei.zhou@coins.ph', linkedin: 'https://linkedin.com/company/coins-ph', priority: 'P0', region: 'Philippines', status: 'new', score: 95 },
    { id: 'lead_002', company: 'Coins.xyz', contact: 'Wei Zhou', title: 'CEO & Founder', email: null, linkedin: 'https://linkedin.com/company/coins-xyz', priority: 'P0', region: 'Global', status: 'new', score: 92 },
    { id: 'lead_003', company: 'PDAX', contact: 'Nichel Gaba', title: 'Founder & CEO', email: 'nichel@pdax.ph', linkedin: 'https://linkedin.com/in/nichel-gaba', priority: 'P1', region: 'Philippines', status: 'new', score: 88 },
    { id: 'lead_004', company: 'BloomX', contact: 'Luis Buenaventura', title: 'Co-Founder', email: null, linkedin: 'https://linkedin.com/in/helloluis', priority: 'P1', region: 'Philippines', status: 'new', score: 85 },
    { id: 'lead_005', company: 'Rebit.ph', contact: 'Miguel Cuneta', title: 'Co-Founder', email: null, linkedin: 'https://linkedin.com/in/miguel-cuneta', priority: 'P2', region: 'Philippines', status: 'new', score: 78 },
    { id: 'lead_006', company: 'Yield Guild Games', contact: 'Gabby Dizon', title: 'Co-Founder', email: null, linkedin: 'https://linkedin.com/in/gabbydizon', priority: 'P1', region: 'Philippines', status: 'new', score: 87 },
    { id: 'lead_007', company: 'RD Technologies', contact: 'Rita Liu', title: 'CEO', email: null, linkedin: null, priority: 'P0', region: 'Hong Kong', status: 'new', score: 90 },
    { id: 'lead_008', company: 'HashKey Group', contact: 'Michel Lee', title: 'CEO', email: null, linkedin: null, priority: 'P0', region: 'Hong Kong', status: 'new', score: 89 },
    { id: 'lead_009', company: 'Circle', contact: 'Jeremy Allaire', title: 'CEO', email: null, linkedin: 'https://linkedin.com/in/jeremyallaire', priority: 'P0', region: 'Global', status: 'contacted', score: 96 },
    { id: 'lead_010', company: 'Pays0', contact: 'TBD', title: 'CEO', email: null, linkedin: null, priority: 'P1', region: 'Global', status: 'new', score: 82 }
  ];
  
  let filtered = deals;
  if (priority) filtered = filtered.filter(d => d.priority === priority);
  if (region) filtered = filtered.filter(d => d.region === region);
  if (status) filtered = filtered.filter(d => d.status === status);
  
  res.status(200).json({
    success: true,
    deals: filtered.slice(0, parseInt(limit)),
    total: deals.length,
    filters: { priority, region, status },
    timestamp: new Date().toISOString()
  });
};