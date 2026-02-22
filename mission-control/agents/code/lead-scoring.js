/**
 * Lead Scoring Algorithm for DealFlow
 * Auto-scores leads by quality/priority on a 0-100 scale
 * 
 * Weighting:
 * - Industry (40%): DeFi/RWA/Payments priority
 * - Company Size (30%): Based on company type/presence
 * - Contact Seniority (20%): Decision-maker level
 * - Region (10%): Geographic priority
 * 
 * @module lead-scoring
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

const WEIGHTS = {
  industry: 0.40,
  companySize: 0.30,
  seniority: 0.20,
  region: 0.10
};

// Industry scoring (higher = more priority)
const INDUSTRY_SCORES = {
  // High priority (DeFi, RWA, Payments)
  'defi': 100,
  'decentralized finance': 100,
  'rwa': 95,
  'real world assets': 95,
  'payments': 90,
  'payment': 90,
  'remittance': 90,
  'crypto exchange': 85,
  'exchange': 80,
  'web3 infrastructure': 80,
  'web3': 75,
  'blockchain': 75,
  'cryptocurrency': 75,
  'fintech': 70,
  'financial services': 70,
  
  // Medium priority
  'wallet': 65,
  'custody': 65,
  'trading': 60,
  'lending': 60,
  'staking': 60,
  'yield': 55,
  'dao': 55,
  'nft': 50,
  'gaming': 50,
  'metaverse': 45,
  
  // Lower priority
  'consulting': 40,
  'media': 35,
  'education': 35,
  'other': 30
};

// Company size/type scoring
const COMPANY_SIZE_SCORES = {
  'enterprise': 100,      // Large established companies
  'large': 90,
  'exchange': 85,         // Crypto exchanges
  'scale-up': 80,         // Fast-growing startups
  'growth': 75,
  'mid-size': 70,
  'startup': 60,
  'small': 50,
  'unknown': 40
};

// Contact seniority scoring
const SENIORITY_SCORES = {
  'ceo': 100,
  'founder': 100,
  'co-founder': 95,
  'cfo': 90,
  'cto': 90,
  'coo': 90,
  'chief': 90,
  'president': 85,
  'managing director': 85,
  'vp': 80,
  'vice president': 80,
  'head of': 80,
  'director': 70,
  'manager': 60,
  'lead': 55,
  'senior': 50,
  'associate': 40,
  'analyst': 30,
  'unknown': 35
};

// Region scoring (priority markets)
const REGION_SCORES = {
  'philippines': 100,     // Primary market
  'ph': 100,
  'southeast asia': 90,
  'sea': 90,
  'singapore': 85,
  'sg': 85,
  'hong kong': 85,
  'hk': 85,
  'indonesia': 80,
  'id': 80,
  'thailand': 80,
  'vietnam': 75,
  'malaysia': 75,
  'asia': 70,
  'apac': 70,
  'united states': 70,
  'us': 70,
  'usa': 70,
  'europe': 65,
  'eu': 65,
  'uk': 65,
  'united kingdom': 65,
  'global': 60,
  'unknown': 50
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract industry score from lead data
 * @param {Object} lead - Lead object
 * @returns {number} Industry score (0-100)
 */
function scoreIndustry(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  
  // Check for industry keywords in notes and company
  let maxScore = 30; // Default "other" score
  
  for (const [keyword, score] of Object.entries(INDUSTRY_SCORES)) {
    if (notes.includes(keyword) || company.includes(keyword)) {
      maxScore = Math.max(maxScore, score);
    }
  }
  
  // Specific company pattern matching
  if (company.includes('exchange') || company.includes('binance') || 
      company.includes('coinbase') || company.includes('pdax')) {
    maxScore = Math.max(maxScore, 85);
  }
  
  if (notes.includes('remittance') || notes.includes('payment')) {
    maxScore = Math.max(maxScore, 90);
  }
  
  if (notes.includes('defi') || notes.includes('decentralized finance')) {
    maxScore = Math.max(maxScore, 100);
  }
  
  if (notes.includes('rwa') || notes.includes('real world assets')) {
    maxScore = Math.max(maxScore, 95);
  }
  
  return maxScore;
}

/**
 * Extract company size score from lead data
 * @param {Object} lead - Lead object
 * @returns {number} Company size score (0-100)
 */
function scoreCompanySize(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  
  // Major exchanges = enterprise
  const majorExchanges = ['binance', 'coinbase', 'kraken', 'okx', 'bybit', 'kucoin'];
  if (majorExchanges.some(ex => company.includes(ex))) {
    return 100;
  }
  
  // Regional exchanges = exchange tier
  const regionalExchanges = ['coins.ph', 'pdax', 'bloomx', 'rebit'];
  if (regionalExchanges.some(ex => company.includes(ex))) {
    return 85;
  }
  
  // Check notes for size indicators
  if (notes.includes('leading') || notes.includes('major') || 
      notes.includes('largest') || notes.includes('established')) {
    return 90;
  }
  
  if (notes.includes('scale-up') || notes.includes('fast-growing') || 
      notes.includes('growth')) {
    return 80;
  }
  
  if (notes.includes('startup') || notes.includes('early stage')) {
    return 60;
  }
  
  // Default based on company presence
  return 70; // Mid-size default
}

/**
 * Extract seniority score from lead data
 * @param {Object} lead - Lead object
 * @returns {number} Seniority score (0-100)
 */
function scoreSeniority(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const contactName = (lead.contact_name || '').toLowerCase();
  
  let maxScore = 35; // Default unknown
  
  // Check notes for title indicators
  for (const [keyword, score] of Object.entries(SENIORITY_SCORES)) {
    if (notes.includes(keyword)) {
      maxScore = Math.max(maxScore, score);
    }
  }
  
  // Specific title patterns
  if (notes.includes('ceo') || notes.includes('chief executive')) {
    maxScore = Math.max(maxScore, 100);
  } else if (notes.includes('founder') && !notes.includes('co-founder')) {
    maxScore = Math.max(maxScore, 100);
  } else if (notes.includes('co-founder')) {
    maxScore = Math.max(maxScore, 95);
  } else if (notes.includes('head of') || notes.includes('vp') || 
             notes.includes('vice president')) {
    maxScore = Math.max(maxScore, 80);
  }
  
  return maxScore;
}

/**
 * Extract region score from lead data
 * @param {Object} lead - Lead object
 * @returns {number} Region score (0-100)
 */
function scoreRegion(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  const email = (lead.email || '').toLowerCase();
  
  let maxScore = 50; // Default unknown
  
  // Check for region keywords
  for (const [keyword, score] of Object.entries(REGION_SCORES)) {
    if (notes.includes(keyword) || company.includes(keyword) || email.includes(keyword)) {
      maxScore = Math.max(maxScore, score);
    }
  }
  
  // Email domain patterns
  if (email.endsWith('.ph')) {
    maxScore = Math.max(maxScore, 100);
  } else if (email.endsWith('.sg')) {
    maxScore = Math.max(maxScore, 85);
  } else if (email.endsWith('.id')) {
    maxScore = Math.max(maxScore, 80);
  } else if (email.endsWith('.th')) {
    maxScore = Math.max(maxScore, 80);
  } else if (email.endsWith('.vn')) {
    maxScore = Math.max(maxScore, 75);
  } else if (email.endsWith('.my')) {
    maxScore = Math.max(maxScore, 75);
  }
  
  // Philippines-specific companies
  const phCompanies = ['coins.ph', 'pdax.ph', 'bloomx.ph', 'rebit.ph'];
  if (phCompanies.some(c => company.includes(c))) {
    maxScore = Math.max(maxScore, 100);
  }
  
  return maxScore;
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate overall lead score (0-100)
 * @param {Object} lead - Lead object
 * @returns {Object} Scoring result with breakdown
 */
function calculateLeadScore(lead) {
  // Calculate individual scores
  const industryScore = scoreIndustry(lead);
  const companySizeScore = scoreCompanySize(lead);
  const seniorityScore = scoreSeniority(lead);
  const regionScore = scoreRegion(lead);
  
  // Calculate weighted total
  const totalScore = Math.round(
    (industryScore * WEIGHTS.industry) +
    (companySizeScore * WEIGHTS.companySize) +
    (seniorityScore * WEIGHTS.seniority) +
    (regionScore * WEIGHTS.region)
  );
  
  // Determine priority tier
  let priorityTier;
  if (totalScore >= 80) {
    priorityTier = 'P0';
  } else if (totalScore >= 60) {
    priorityTier = 'P1';
  } else if (totalScore >= 40) {
    priorityTier = 'P2';
  } else {
    priorityTier = 'P3';
  }
  
  return {
    leadId: lead.id,
    company: lead.company,
    contactName: lead.contact_name,
    totalScore,
    priorityTier,
    breakdown: {
      industry: {
        score: industryScore,
        weight: WEIGHTS.industry,
        weighted: Math.round(industryScore * WEIGHTS.industry)
      },
      companySize: {
        score: companySizeScore,
        weight: WEIGHTS.companySize,
        weighted: Math.round(companySizeScore * WEIGHTS.companySize)
      },
      seniority: {
        score: seniorityScore,
        weight: WEIGHTS.seniority,
        weighted: Math.round(seniorityScore * WEIGHTS.seniority)
      },
      region: {
        score: regionScore,
        weight: WEIGHTS.region,
        weighted: Math.round(regionScore * WEIGHTS.region)
      }
    },
    scoredAt: new Date().toISOString()
  };
}

/**
 * Score multiple leads
 * @param {Array} leads - Array of lead objects
 * @returns {Array} Array of scoring results
 */
function scoreLeads(leads) {
  return leads.map(lead => calculateLeadScore(lead));
}

/**
 * Score leads from JSON file and save results
 * @param {string} inputPath - Path to leads JSON file
 * @param {string} outputPath - Path to save scored results
 * @returns {Object} Summary of scoring operation
 */
function scoreLeadsFromFile(inputPath, outputPath = null) {
  try {
    // Read leads file
    const leadsData = fs.readFileSync(inputPath, 'utf8');
    const leads = JSON.parse(leadsData);
    
    // Score all leads
    const scoredLeads = scoreLeads(leads);
    
    // Sort by score (descending)
    scoredLeads.sort((a, b) => b.totalScore - a.totalScore);
    
    // Generate summary
    const summary = {
      totalLeads: scoredLeads.length,
      averageScore: Math.round(
        scoredLeads.reduce((sum, l) => sum + l.totalScore, 0) / scoredLeads.length
      ),
      tierDistribution: {
        P0: scoredLeads.filter(l => l.priorityTier === 'P0').length,
        P1: scoredLeads.filter(l => l.priorityTier === 'P1').length,
        P2: scoredLeads.filter(l => l.priorityTier === 'P2').length,
        P3: scoredLeads.filter(l => l.priorityTier === 'P3').length
      },
      topLeads: scoredLeads.slice(0, 5).map(l => ({
        company: l.company,
        score: l.totalScore,
        tier: l.priorityTier
      })),
      scoredAt: new Date().toISOString()
    };
    
    // Save results if output path provided
    if (outputPath) {
      const output = {
        summary,
        scoredLeads
      };
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    }
    
    return {
      success: true,
      summary,
      scoredLeads
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// API ENDPOINT (Express.js compatible)
// ============================================================================

/**
 * Express.js route handler for scoring leads
 * POST /api/leads/score
 * 
 * Request body: { leads: [...] } or uses existing leads.json
 * Response: { success: true, summary: {...}, scoredLeads: [...] }
 */
function scoreLeadsEndpoint(req, res) {
  try {
    let leads;
    
    // If leads provided in request body, use those
    if (req.body && req.body.leads && Array.isArray(req.body.leads)) {
      leads = req.body.leads;
    } else {
      // Otherwise load from default leads.json
      const leadsPath = path.join(__dirname, '../../dealflow/leads.json');
      const leadsData = fs.readFileSync(leadsPath, 'utf8');
      leads = JSON.parse(leadsData);
    }
    
    const results = scoreLeads(leads);
    
    // Sort by score
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    // Calculate summary
    const summary = {
      totalLeads: results.length,
      averageScore: Math.round(
        results.reduce((sum, l) => sum + l.totalScore, 0) / results.length
      ),
      tierDistribution: {
        P0: results.filter(l => l.priorityTier === 'P0').length,
        P1: results.filter(l => l.priorityTier === 'P1').length,
        P2: results.filter(l => l.priorityTier === 'P2').length,
        P3: results.filter(l => l.priorityTier === 'P3').length
      }
    };
    
    res.json({
      success: true,
      summary,
      scoredLeads: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Express.js route handler for scoring a single lead
 * POST /api/leads/score-single
 * 
 * Request body: { lead: {...} }
 * Response: { success: true, result: {...} }
 */
function scoreSingleLeadEndpoint(req, res) {
  try {
    if (!req.body || !req.body.lead) {
      return res.status(400).json({
        success: false,
        error: 'Lead data required in request body'
      });
    }
    
    const result = calculateLeadScore(req.body.lead);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (require.main === module) {
  // Run scoring on default leads file
  const leadsPath = path.join(__dirname, '../dealflow/leads.json');
  const outputPath = path.join(__dirname, '../../data/scored-leads.json');
  
  
  const result = scoreLeadsFromFile(leadsPath, outputPath);
  
  if (result.success) {
    result.summary.topLeads.forEach((lead, i) => {
    });
  } else {
    console.error('❌ Scoring failed:', result.error);
    process.exit(1);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  calculateLeadScore,
  scoreLeads,
  scoreLeadsFromFile,
  scoreLeadsEndpoint,
  scoreSingleLeadEndpoint,
  WEIGHTS,
  INDUSTRY_SCORES,
  COMPANY_SIZE_SCORES,
  SENIORITY_SCORES,
  REGION_SCORES
};
