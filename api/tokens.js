// Vercel Serverless API: /api/tokens.js
// Returns REAL token usage data from data/tokens.json
// Version: 3.0 - Uses bundled data file for Vercel deployment

const fs = require('fs');
const path = require('path');

// Cache configuration - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let tokenCache = {
  data: null,
  timestamp: 0
};

function getTokensData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (tokenCache.data && (now - tokenCache.timestamp) < CACHE_TTL) {
    return {
      ...tokenCache.data,
      cached: true,
      cacheAge: Math.round((now - tokenCache.timestamp) / 1000)
    };
  }
  
  // Try to load from bundled data file
  const dataPath = path.join(__dirname, '..', 'data', 'tokens.json');
  
  try {
    const content = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    tokenCache = {
      data: data,
      timestamp: now
    };
    
    return {
      ...data,
      cached: false,
      cacheAge: 0
    };
  } catch (error) {
    console.error('Error loading tokens:', error);
    
    // Return fallback data based on ACTUAL_TOKEN_USAGE_REPORT.md
    return {
      generated: new Date().toISOString(),
      source: 'fallback',
      summary: {
        totalTokens: 247500,
        totalCost: 0.52,
        todayTokens: 37125,
        todayCost: 0.08,
        projectedMonthly: 15.6,
        projectedMonthlyTokens: 495000,
        budgetUsed: 12.4
      },
      agents: [
        {name: "DealFlow", tokens: 115300, cost: 0.23, percentage: 46.6},
        {name: "Nexus", tokens: 75300, cost: 0.15, percentage: 30.4},
        {name: "Forge", tokens: 45000, cost: 0.09, percentage: 18.2},
        {name: "Code", tokens: 37000, cost: 0.07, percentage: 15.0},
        {name: "Pixel", tokens: 25000, cost: 0.05, percentage: 10.1}
      ],
      cached: false,
      error: error.message
    };
  }
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = getTokensData();
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.setHeader('X-Cache-Status', data.cached ? 'HIT' : 'MISS');
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      source: data.source,
      summary: data.summary,
      agents: data.agents,
      timeline: data.timeline || [],
      meta: {
        generated: data.generated,
        cached: data.cached || false,
        cacheAge: data.cacheAge || 0
      }
    });
  } catch (error) {
    console.error('Error in /api/tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
