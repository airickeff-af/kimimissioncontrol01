// /api/deals.js - Returns DealFlow leads data
// Version: 1.0 - Real leads data from DealFlow system

const fs = require('fs');
const path = require('path');

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let dealsCache = {
  data: null,
  timestamp: 0
};

/**
 * Find leads data file in various locations
 */
function findLeadsFile() {
  const possiblePaths = [
    path.join(process.cwd(), 'mission-control', 'data', 'leads', 'leads.json'),
    path.join(process.cwd(), 'mission-control', 'agents', 'dealflow', 'leads_complete_26.json'),
    path.join(process.cwd(), 'data', 'leads', 'leads.json'),
    path.join(process.cwd(), 'leads.json'),
    '/root/.openclaw/workspace/mission-control/data/leads/leads.json',
    '/root/.openclaw/workspace/mission-control/agents/dealflow/leads_complete_26.json'
  ];
  
  for (const tryPath of possiblePaths) {
    try {
      if (fs.existsSync(tryPath)) {
        return tryPath;
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Get fallback leads data
 */
function getFallbackLeads() {
  return [
    {
      id: "lead_001",
      company: "OSL Digital Securities",
      contact: "Wayne Huang",
      title: "CEO",
      email: "wayne@osl.com",
      region: "Hong Kong",
      priority: "P0",
      status: "new",
      score: 98,
      focus: "Digital Asset Exchange"
    },
    {
      id: "lead_002",
      company: "HashKey Exchange",
      contact: "Michel Lee",
      title: "CEO",
      email: "michel@hashkey.com",
      region: "Hong Kong",
      priority: "P0",
      status: "contacted",
      score: 98,
      focus: "Crypto Exchange"
    },
    {
      id: "lead_003",
      company: "Amber Group",
      contact: "Michael Wu",
      title: "CEO",
      email: "michael@ambergroup.io",
      region: "Hong Kong",
      priority: "P0",
      status: "new",
      score: 98,
      focus: "Crypto Trading"
    }
  ];
}

/**
 * Load leads data
 */
function loadLeadsData() {
  const now = Date.now();
  
  // Check cache
  if (dealsCache.data && (now - dealsCache.timestamp) < CACHE_TTL) {
    return { leads: dealsCache.data, cached: true };
  }
  
  const filePath = findLeadsFile();
  
  if (!filePath) {
    const fallback = getFallbackLeads();
    dealsCache = { data: fallback, timestamp: now };
    return { leads: fallback, source: 'fallback', cached: false };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const leads = Array.isArray(data) ? data : (data.leads || []);
    
    dealsCache = { data: leads, timestamp: now };
    return { leads, source: filePath, cached: false };
  } catch (error) {
    console.error('Error loading leads:', error);
    const fallback = getFallbackLeads();
    dealsCache = { data: fallback, timestamp: now };
    return { leads: fallback, source: 'fallback', cached: false };
  }
}

/**
 * Calculate summary statistics
 */
function calculateSummary(leads) {
  return {
    total: leads.length,
    byPriority: {
      P0: leads.filter(l => l.priority === 'P0').length,
      P1: leads.filter(l => l.priority === 'P1').length,
      P2: leads.filter(l => l.priority === 'P2').length
    },
    byStatus: {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      meeting: leads.filter(l => l.status === 'meeting').length
    },
    byRegion: leads.reduce((acc, l) => {
      acc[l.region] = (acc[l.region] || 0) + 1;
      return acc;
    }, {}),
    avgScore: leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
      : 0
  };
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
    const { priority, status, region, limit = 100, bust } = req.query || {};
    
    // Force cache bust if requested
    if (bust) {
      dealsCache.timestamp = 0;
    }
    
    const { leads, source, cached } = loadLeadsData();
    
    // Apply filters
    let filtered = [...leads];
    
    if (priority) {
      filtered = filtered.filter(l => l.priority === priority.toUpperCase());
    }
    
    if (status) {
      filtered = filtered.filter(l => l.status === status.toLowerCase());
    }
    
    if (region) {
      filtered = filtered.filter(l => 
        l.region && l.region.toLowerCase().includes(region.toLowerCase())
      );
    }
    
    // Apply limit
    const limitNum = parseInt(limit, 10) || 100;
    const paginated = filtered.slice(0, limitNum);
    
    const summary = calculateSummary(leads);
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    res.status(200).json({
      success: true,
      data: {
        leads: paginated,
        summary: summary
      },
      meta: {
        source: source,
        cached: cached,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /api/deals:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
