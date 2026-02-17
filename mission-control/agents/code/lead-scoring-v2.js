/**
 * Enhanced Lead Scoring Algorithm v2.0
 * AI-powered lead quality scoring system (0-100 scale)
 * 
 * Scoring Criteria:
 * - Company Size/Funding (25%): Revenue, funding raised, employee count, market presence
 * - Partnership Potential (30%): Strategic fit, collaboration opportunities, deal size potential
 * - Contact Accessibility (25%): Email availability, LinkedIn, Twitter, phone, verification status
 * - Market Relevance (20%): Industry alignment, geographic fit, timing/opportunity window
 * 
 * @module lead-scoring-v2
 * @version 2.0.0
 * @author Nexus (Air1ck3ff)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SCORING CONFIGURATION v2.0
// ============================================================================

const WEIGHTS = {
  companySizeFunding: 0.25,    // 25% - Company scale and financial backing
  partnershipPotential: 0.30,  // 30% - Strategic partnership opportunity
  contactAccessibility: 0.25,  // 25% - How reachable the contact is
  marketRelevance: 0.20        // 20% - Industry and geographic fit
};

// ============================================================================
// 1. COMPANY SIZE/FUNDING SCORING (25%)
// ============================================================================

const FUNDING_SCORES = {
  // Funding raised (in millions USD)
  '100m+': 100,      // $100M+ raised
  '50m-100m': 90,    // $50M-$100M
  '20m-50m': 80,     // $20M-$50M
  '10m-20m': 70,     // $10M-$20M
  '5m-10m': 60,      // $5M-$10M
  '1m-5m': 50,       // $1M-$5M
  'seed': 40,        // Seed/pre-seed
  'bootstrapped': 30, // Self-funded
  'unknown': 35
};

const COMPANY_SIZE_SCORES = {
  // Employee count / market presence
  'enterprise': 100,      // 1000+ employees or major market leader
  'large': 85,            // 500-1000 employees
  'scale-up': 75,         // 100-500 employees, rapid growth
  'growth': 65,           // 50-100 employees
  'mid-size': 55,         // 20-50 employees
  'startup': 45,          // 5-20 employees
  'small': 35,            // <5 employees
  'unknown': 40
};

const MARKET_PRESENCE_SCORES = {
  // Market dominance indicators
  'dominant': 100,        // Market leader in region/segment
  'major': 85,            // Top 3 in market
  'established': 70,      // Well-known brand
  'growing': 60,          // Gaining traction
  'emerging': 45,         // New but promising
  'unknown': 40
};

// ============================================================================
// 2. PARTNERSHIP POTENTIAL SCORING (30%)
// ============================================================================

const PARTNERSHIP_TYPE_SCORES = {
  // Strategic partnership types (higher = better fit)
  'integration': 100,     // Technical integration partner
  'distribution': 95,     // Distribution/channel partner
  'strategic': 90,        // Strategic alliance
  'investment': 85,       // Investment/acquisition target
  'co-marketing': 70,     // Joint marketing
  'vendor': 60,           // Vendor relationship
  'referral': 50,         // Referral partner
  'unknown': 40
};

const DEAL_SIZE_POTENTIAL = {
  // Estimated deal size potential
  'enterprise': 100,      // $1M+ potential
  'large': 85,            // $500K-$1M
  'medium': 70,           // $100K-$500K
  'small': 55,            // $25K-$100K
  'pilot': 40,            // <$25K pilot
  'unknown': 45
};

const STRATEGIC_FIT_INDICATORS = {
  // Keywords indicating strong partnership fit
  high: [
    'integration', 'api', 'partnership', 'collaboration',
    'enterprise', 'b2b', 'infrastructure', 'platform',
    'ecosystem', 'developer', 'enterprise sales'
  ],
  medium: [
    'growth', 'expansion', 'new market', 'launch',
    'scale', 'series', 'funding', 'hiring'
  ],
  low: [
    'consumer', 'b2c', 'retail', 'small business',
    'local', 'niche', 'consulting'
  ]
};

// ============================================================================
// 3. CONTACT ACCESSIBILITY SCORING (25%)
// ============================================================================

const CONTACT_CHANNEL_SCORES = {
  // Points per contact channel available
  email_verified: 25,     // Verified email
  email_unverified: 15,   // Unverified email
  linkedin_personal: 20,  // Personal LinkedIn profile
  linkedin_company: 10,   // Company LinkedIn only
  twitter_active: 15,     // Active Twitter/X
  phone: 15,              // Phone number available
  telegram: 10,           // Telegram handle
  website_contact: 5      // Contact form on website
};

const SENIORITY_ACCESSIBILITY_MULTIPLIER = {
  // Higher seniority = harder to reach but more valuable
  'ceo': 1.0,             // Full points
  'founder': 1.0,
  'c-level': 0.95,        // 95% of points
  'vp': 0.90,             // 90% of points
  'director': 0.85,       // 85% of points
  'manager': 0.80,        // 80% of points
  'other': 0.75           // 75% of points
};

// ============================================================================
// 4. MARKET RELEVANCE SCORING (20%)
// ============================================================================

const INDUSTRY_RELEVANCE_SCORES = {
  // Industry alignment (crypto/blockchain focus)
  'crypto_exchange': 100,
  'defi': 100,
  'decentralized_finance': 100,
  'rwa': 95,
  'real_world_assets': 95,
  'payments': 90,
  'remittance': 90,
  'web3_infrastructure': 90,
  'blockchain': 85,
  'crypto_wallet': 85,
  'custody': 80,
  'fintech': 75,
  'financial_services': 70,
  'trading': 70,
  'nft': 60,
  'gaming': 55,
  'other': 40
};

const GEOGRAPHIC_RELEVANCE_SCORES = {
  // Priority markets for EricF
  'philippines': 100,     // Primary market
  'southeast_asia': 90,   // Regional priority
  'singapore': 85,
  'hong_kong': 85,
  'indonesia': 80,
  'thailand': 80,
  'vietnam': 75,
  'malaysia': 75,
  'asia_pacific': 70,
  'united_states': 70,
  'europe': 65,
  'global': 60,
  'other': 50
};

const TIMING_OPPORTUNITY_SCORES = {
  // Current opportunity indicators
  'active_fundraising': 95,    // Currently raising
  'recent_funding': 90,        // Funded in last 6 months
  'expansion': 85,             // Expanding to new markets
  'hiring_spree': 80,          // Aggressive hiring
  'product_launch': 80,        // New product launch
  'partnership_seeking': 85,   // Actively seeking partners
  'stable': 60,                // Business as usual
  'declining': 30,             // Downsizing/challenges
  'unknown': 50
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Score Company Size and Funding (25%)
 * @param {Object} lead - Lead object
 * @returns {Object} Score details
 */
function scoreCompanySizeFunding(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  
  // Extract funding information
  let fundingScore = FUNDING_SCORES.unknown;
  const fundingMatch = notes.match(/\$?(\d+(?:\.\d+)?)\s*(M|million)/i);
  if (fundingMatch) {
    const amount = parseFloat(fundingMatch[1]);
    if (amount >= 100) fundingScore = FUNDING_SCORES['100m+'];
    else if (amount >= 50) fundingScore = FUNDING_SCORES['50m-100m'];
    else if (amount >= 20) fundingScore = FUNDING_SCORES['20m-50m'];
    else if (amount >= 10) fundingScore = FUNDING_SCORES['10m-20m'];
    else if (amount >= 5) fundingScore = FUNDING_SCORES['5m-10m'];
    else if (amount >= 1) fundingScore = FUNDING_SCORES['1m-5m'];
  }
  
  // Check for funding keywords
  if (notes.includes('series') || notes.includes('raised') || notes.includes('funding')) {
    if (fundingScore < 50) fundingScore = 50; // At least seed if mentioned
  }
  if (notes.includes('bootstrapped') || notes.includes('self-funded')) {
    fundingScore = FUNDING_SCORES.bootstrapped;
  }
  
  // Company size indicators
  let sizeScore = COMPANY_SIZE_SCORES.unknown;
  if (notes.includes('enterprise') || notes.includes('leading') || notes.includes('dominant')) {
    sizeScore = COMPANY_SIZE_SCORES.enterprise;
  } else if (notes.includes('scale-up') || notes.includes('fast-growing')) {
    sizeScore = COMPANY_SIZE_SCORES['scale-up'];
  } else if (notes.includes('startup') || notes.includes('early stage')) {
    sizeScore = COMPANY_SIZE_SCORES.startup;
  }
  
  // Major exchange detection
  const majorExchanges = ['binance', 'coinbase', 'kraken', 'okx', 'bybit', 'kucoin'];
  if (majorExchanges.some(ex => company.includes(ex))) {
    sizeScore = Math.max(sizeScore, COMPANY_SIZE_SCORES.enterprise);
    fundingScore = Math.max(fundingScore, FUNDING_SCORES['100m+']);
  }
  
  // Regional exchange detection
  const regionalExchanges = ['coins.ph', 'pdax', 'bloomx', 'rebit', 'sci'];
  if (regionalExchanges.some(ex => company.includes(ex))) {
    sizeScore = Math.max(sizeScore, COMPANY_SIZE_SCORES['scale-up']);
  }
  
  // Market presence
  let presenceScore = MARKET_PRESENCE_SCORES.unknown;
  if (notes.includes('market leader') || notes.includes('dominant') || notes.includes('largest')) {
    presenceScore = MARKET_PRESENCE_SCORES.dominant;
  } else if (notes.includes('top') || notes.includes('major player')) {
    presenceScore = MARKET_PRESENCE_SCORES.major;
  } else if (notes.includes('established') || notes.includes('well-known')) {
    presenceScore = MARKET_PRESENCE_SCORES.established;
  }
  
  // Calculate weighted score
  const fundingWeight = 0.4;
  const sizeWeight = 0.35;
  const presenceWeight = 0.25;
  
  const totalScore = Math.round(
    (fundingScore * fundingWeight) +
    (sizeScore * sizeWeight) +
    (presenceScore * presenceWeight)
  );
  
  return {
    score: totalScore,
    breakdown: {
      funding: { score: fundingScore, weight: fundingWeight },
      companySize: { score: sizeScore, weight: sizeWeight },
      marketPresence: { score: presenceScore, weight: presenceWeight }
    }
  };
}

/**
 * Score Partnership Potential (30%)
 * @param {Object} lead - Lead object
 * @returns {Object} Score details
 */
function scorePartnershipPotential(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  
  // Determine partnership type
  let partnershipType = 'unknown';
  let typeScore = PARTNERSHIP_TYPE_SCORES.unknown;
  
  if (notes.includes('integration') || notes.includes('api')) {
    partnershipType = 'integration';
    typeScore = PARTNERSHIP_TYPE_SCORES.integration;
  } else if (notes.includes('distribution') || notes.includes('channel')) {
    partnershipType = 'distribution';
    typeScore = PARTNERSHIP_TYPE_SCORES.distribution;
  } else if (notes.includes('strategic') || notes.includes('partnership')) {
    partnershipType = 'strategic';
    typeScore = PARTNERSHIP_TYPE_SCORES.strategic;
  } else if (notes.includes('investment') || notes.includes('acquisition')) {
    partnershipType = 'investment';
    typeScore = PARTNERSHIP_TYPE_SCORES.investment;
  } else if (company.includes('exchange') || notes.includes('exchange')) {
    partnershipType = 'integration';
    typeScore = PARTNERSHIP_TYPE_SCORES.integration;
  }
  
  // Deal size potential
  let dealSize = 'unknown';
  let dealScore = DEAL_SIZE_POTENTIAL.unknown;
  
  if (notes.includes('enterprise') || notes.includes('b2b') || notes.includes('institutional')) {
    dealSize = 'enterprise';
    dealScore = DEAL_SIZE_POTENTIAL.enterprise;
  } else if (notes.includes('scale') || notes.includes('growth') || notes.includes('expansion')) {
    dealSize = 'large';
    dealScore = DEAL_SIZE_POTENTIAL.large;
  } else if (notes.includes('pilot') || notes.includes('trial')) {
    dealSize = 'pilot';
    dealScore = DEAL_SIZE_POTENTIAL.pilot;
  }
  
  // Strategic fit analysis
  let strategicFitScore = 50; // Default
  const highFitCount = STRATEGIC_FIT_INDICATORS.high.filter(kw => notes.includes(kw)).length;
  const mediumFitCount = STRATEGIC_FIT_INDICATORS.medium.filter(kw => notes.includes(kw)).length;
  const lowFitCount = STRATEGIC_FIT_INDICATORS.low.filter(kw => notes.includes(kw)).length;
  
  strategicFitScore = 50 + (highFitCount * 10) + (mediumFitCount * 5) - (lowFitCount * 5);
  strategicFitScore = Math.min(100, Math.max(0, strategicFitScore));
  
  // Calculate weighted score
  const typeWeight = 0.4;
  const dealWeight = 0.35;
  const fitWeight = 0.25;
  
  const totalScore = Math.round(
    (typeScore * typeWeight) +
    (dealScore * dealWeight) +
    (strategicFitScore * fitWeight)
  );
  
  return {
    score: totalScore,
    breakdown: {
      partnershipType: { score: typeScore, weight: typeWeight, type: partnershipType },
      dealSizePotential: { score: dealScore, weight: dealWeight, size: dealSize },
      strategicFit: { score: strategicFitScore, weight: fitWeight }
    }
  };
}

/**
 * Score Contact Accessibility (25%)
 * @param {Object} lead - Lead object
 * @returns {Object} Score details
 */
function scoreContactAccessibility(lead) {
  let totalPoints = 0;
  const maxPoints = 100;
  const channels = [];
  
  // Email scoring
  if (lead.email) {
    if (lead.email_verified) {
      totalPoints += CONTACT_CHANNEL_SCORES.email_verified;
      channels.push('email_verified');
    } else {
      totalPoints += CONTACT_CHANNEL_SCORES.email_unverified;
      channels.push('email_unverified');
    }
  }
  
  // LinkedIn scoring
  if (lead.linkedin_personal) {
    totalPoints += CONTACT_CHANNEL_SCORES.linkedin_personal;
    channels.push('linkedin_personal');
  } else if (lead.linkedin) {
    totalPoints += CONTACT_CHANNEL_SCORES.linkedin_company;
    channels.push('linkedin_company');
  }
  
  // Twitter scoring
  if (lead.twitter) {
    totalPoints += CONTACT_CHANNEL_SCORES.twitter_active;
    channels.push('twitter');
  }
  
  // Phone scoring
  if (lead.phone) {
    totalPoints += CONTACT_CHANNEL_SCORES.phone;
    channels.push('phone');
  }
  
  // Telegram scoring
  if (lead.telegram) {
    totalPoints += CONTACT_CHANNEL_SCORES.telegram;
    channels.push('telegram');
  }
  
  // Cap at max points
  totalPoints = Math.min(totalPoints, maxPoints);
  
  // Seniority multiplier (higher = harder to reach but worth more)
  const title = (lead.title || '').toLowerCase();
  let seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER.other;
  
  if (title.includes('ceo') || title.includes('chief executive')) {
    seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER.ceo;
  } else if (title.includes('founder') || title.includes('co-founder')) {
    seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER.founder;
  } else if (title.includes('cto') || title.includes('cfo') || title.includes('coo') || title.includes('chief')) {
    seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER['c-level'];
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('head of')) {
    seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER.vp;
  } else if (title.includes('director')) {
    seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER.director;
  } else if (title.includes('manager')) {
    seniorityMultiplier = SENIORITY_ACCESSIBILITY_MULTIPLIER.manager;
  }
  
  // Apply seniority multiplier
  const finalScore = Math.round(totalPoints * seniorityMultiplier);
  
  return {
    score: finalScore,
    breakdown: {
      totalPoints,
      seniorityMultiplier,
      channelsAvailable: channels.length,
      channels: channels
    }
  };
}

/**
 * Score Market Relevance (20%)
 * @param {Object} lead - Lead object
 * @returns {Object} Score details
 */
function scoreMarketRelevance(lead) {
  const notes = (lead.notes || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  
  // Industry relevance
  let industryScore = INDUSTRY_RELEVANCE_SCORES.other;
  let industryType = 'other';
  
  if (notes.includes('exchange') || company.includes('exchange')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.crypto_exchange;
    industryType = 'crypto_exchange';
  } else if (notes.includes('defi') || notes.includes('decentralized finance')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.defi;
    industryType = 'defi';
  } else if (notes.includes('rwa') || notes.includes('real world assets')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.rwa;
    industryType = 'rwa';
  } else if (notes.includes('payment') || notes.includes('remittance')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.payments;
    industryType = 'payments';
  } else if (notes.includes('infrastructure') || notes.includes('infrastructure')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.web3_infrastructure;
    industryType = 'web3_infrastructure';
  } else if (notes.includes('wallet') || notes.includes('custody')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.crypto_wallet;
    industryType = 'crypto_wallet';
  } else if (notes.includes('fintech') || notes.includes('financial')) {
    industryScore = INDUSTRY_RELEVANCE_SCORES.fintech;
    industryType = 'fintech';
  }
  
  // Geographic relevance
  let geoScore = GEOGRAPHIC_RELEVANCE_SCORES.other;
  let region = 'other';
  
  if (notes.includes('philippines') || company.includes('.ph') || notes.includes('filipino')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.philippines;
    region = 'philippines';
  } else if (notes.includes('singapore') || company.includes('.sg')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.singapore;
    region = 'singapore';
  } else if (notes.includes('hong kong') || company.includes('.hk')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.hong_kong;
    region = 'hong_kong';
  } else if (notes.includes('indonesia') || notes.includes('.id')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.indonesia;
    region = 'indonesia';
  } else if (notes.includes('thailand') || notes.includes('.th')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.thailand;
    region = 'thailand';
  } else if (notes.includes('southeast asia') || notes.includes('sea')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.southeast_asia;
    region = 'southeast_asia';
  } else if (notes.includes('asia') || notes.includes('apac')) {
    geoScore = GEOGRAPHIC_RELEVANCE_SCORES.asia_pacific;
    region = 'asia_pacific';
  }
  
  // Timing/opportunity
  let timingScore = TIMING_OPPORTUNITY_SCORES.unknown;
  let timingType = 'unknown';
  
  if (notes.includes('raising') || notes.includes('series') || notes.includes('funding round')) {
    timingScore = TIMING_OPPORTUNITY_SCORES.active_fundraising;
    timingType = 'active_fundraising';
  } else if (notes.includes('recently raised') || notes.includes('just raised')) {
    timingScore = TIMING_OPPORTUNITY_SCORES.recent_funding;
    timingType = 'recent_funding';
  } else if (notes.includes('expanding') || notes.includes('expansion') || notes.includes('new market')) {
    timingScore = TIMING_OPPORTUNITY_SCORES.expansion;
    timingType = 'expansion';
  } else if (notes.includes('hiring') || notes.includes('growing team')) {
    timingScore = TIMING_OPPORTUNITY_SCORES.hiring_spree;
    timingType = 'hiring_spree';
  } else if (notes.includes('launch') || notes.includes('new product')) {
    timingScore = TIMING_OPPORTUNITY_SCORES.product_launch;
    timingType = 'product_launch';
  }
  
  // Calculate weighted score
  const industryWeight = 0.5;
  const geoWeight = 0.3;
  const timingWeight = 0.2;
  
  const totalScore = Math.round(
    (industryScore * industryWeight) +
    (geoScore * geoWeight) +
    (timingScore * timingWeight)
  );
  
  return {
    score: totalScore,
    breakdown: {
      industry: { score: industryScore, weight: industryWeight, type: industryType },
      geography: { score: geoScore, weight: geoWeight, region: region },
      timing: { score: timingScore, weight: timingWeight, type: timingType }
    }
  };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate comprehensive lead score (0-100)
 * @param {Object} lead - Lead object
 * @returns {Object} Complete scoring result
 */
function calculateLeadScore(lead) {
  // Calculate individual category scores
  const companySizeFunding = scoreCompanySizeFunding(lead);
  const partnershipPotential = scorePartnershipPotential(lead);
  const contactAccessibility = scoreContactAccessibility(lead);
  const marketRelevance = scoreMarketRelevance(lead);
  
  // Calculate weighted total
  const totalScore = Math.round(
    (companySizeFunding.score * WEIGHTS.companySizeFunding) +
    (partnershipPotential.score * WEIGHTS.partnershipPotential) +
    (contactAccessibility.score * WEIGHTS.contactAccessibility) +
    (marketRelevance.score * WEIGHTS.marketRelevance)
  );
  
  // Determine priority tier
  let priorityTier;
  let actionRequired;
  if (totalScore >= 80) {
    priorityTier = 'P0';
    actionRequired = 'Contact within 24 hours';
  } else if (totalScore >= 65) {
    priorityTier = 'P1';
    actionRequired = 'Contact within 3 days';
  } else if (totalScore >= 50) {
    priorityTier = 'P2';
    actionRequired = 'Contact within 1 week';
  } else if (totalScore >= 35) {
    priorityTier = 'P3';
    actionRequired = 'Contact within 2 weeks';
  } else {
    priorityTier = 'Cold';
    actionRequired = 'Nurture or archive';
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    companySizeFunding,
    partnershipPotential,
    contactAccessibility,
    marketRelevance
  );
  
  return {
    leadId: lead.id,
    company: lead.company,
    contactName: lead.contact_name,
    title: lead.title,
    totalScore,
    priorityTier,
    actionRequired,
    scoredAt: new Date().toISOString(),
    algorithmVersion: '2.0.0',
    breakdown: {
      companySizeFunding: {
        score: companySizeFunding.score,
        weight: WEIGHTS.companySizeFunding,
        weighted: Math.round(companySizeFunding.score * WEIGHTS.companySizeFunding),
        details: companySizeFunding.breakdown
      },
      partnershipPotential: {
        score: partnershipPotential.score,
        weight: WEIGHTS.partnershipPotential,
        weighted: Math.round(partnershipPotential.score * WEIGHTS.partnershipPotential),
        details: partnershipPotential.breakdown
      },
      contactAccessibility: {
        score: contactAccessibility.score,
        weight: WEIGHTS.contactAccessibility,
        weighted: Math.round(contactAccessibility.score * WEIGHTS.contactAccessibility),
        details: contactAccessibility.breakdown
      },
      marketRelevance: {
        score: marketRelevance.score,
        weight: WEIGHTS.marketRelevance,
        weighted: Math.round(marketRelevance.score * WEIGHTS.marketRelevance),
        details: marketRelevance.breakdown
      }
    },
    recommendations
  };
}

/**
 * Generate actionable recommendations based on scores
 * @param {Object} csf - Company Size/Funding score
 * @param {Object} pp - Partnership Potential score
 * @param {Object} ca - Contact Accessibility score
 * @param {Object} mr - Market Relevance score
 * @returns {Array} Recommendations
 */
function generateRecommendations(csf, pp, ca, mr) {
  const recommendations = [];
  
  // Company Size/Funding recommendations
  if (csf.score < 50) {
    recommendations.push('Research company funding history and growth trajectory');
  }
  if (csf.breakdown.funding.score < 50) {
    recommendations.push('Look for recent funding announcements or Crunchbase data');
  }
  
  // Partnership recommendations
  if (pp.score >= 80) {
    recommendations.push('High partnership potential - prioritize for strategic discussion');
  }
  if (pp.breakdown.strategicFit.score < 60) {
    recommendations.push('Research company partnerships and integration opportunities');
  }
  
  // Contact recommendations
  if (ca.score < 50) {
    recommendations.push('Find alternative contact channels - limited accessibility');
  }
  if (!ca.breakdown.channels.includes('email_verified') && !ca.breakdown.channels.includes('email_unverified')) {
    recommendations.push('Priority: Find verified email address');
  }
  if (!ca.breakdown.channels.includes('linkedin_personal')) {
    recommendations.push('Connect via LinkedIn for warm introduction');
  }
  
  // Market recommendations
  if (mr.score >= 80) {
    recommendations.push('Strong market fit - emphasize regional expertise in outreach');
  }
  if (mr.breakdown.timing.score >= 80) {
    recommendations.push('Timing is optimal - company in active growth/expansion mode');
  }
  
  return recommendations;
}

// ============================================================================
// BATCH SCORING FUNCTIONS
// ============================================================================

/**
 * Score multiple leads
 * @param {Array} leads - Array of lead objects
 * @returns {Array} Array of scoring results
 */
function scoreLeads(leads) {
  return leads.map(lead => calculateLeadScore(lead));
}

/**
 * Score leads from JSON file
 * @param {string} inputPath - Path to leads JSON file
 * @param {string} outputPath - Path to save scored results
 * @returns {Object} Summary of scoring operation
 */
function scoreLeadsFromFile(inputPath, outputPath = null) {
  try {
    const leadsData = fs.readFileSync(inputPath, 'utf8');
    const leads = JSON.parse(leadsData);
    
    const scoredLeads = scoreLeads(leads);
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
        P3: scoredLeads.filter(l => l.priorityTier === 'P3').length,
        Cold: scoredLeads.filter(l => l.priorityTier === 'Cold').length
      },
      categoryAverages: {
        companySizeFunding: Math.round(
          scoredLeads.reduce((sum, l) => sum + l.breakdown.companySizeFunding.score, 0) / scoredLeads.length
        ),
        partnershipPotential: Math.round(
          scoredLeads.reduce((sum, l) => sum + l.breakdown.partnershipPotential.score, 0) / scoredLeads.length
        ),
        contactAccessibility: Math.round(
          scoredLeads.reduce((sum, l) => sum + l.breakdown.contactAccessibility.score, 0) / scoredLeads.length
        ),
        marketRelevance: Math.round(
          scoredLeads.reduce((sum, l) => sum + l.breakdown.marketRelevance.score, 0) / scoredLeads.length
        )
      },
      topLeads: scoredLeads.slice(0, 5).map(l => ({
        company: l.company,
        contact: l.contactName,
        score: l.totalScore,
        tier: l.priorityTier,
        action: l.actionRequired
      })),
      scoredAt: new Date().toISOString(),
      algorithmVersion: '2.0.0'
    };
    
    if (outputPath) {
      const output = { summary, scoredLeads };
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    }
    
    return { success: true, summary, scoredLeads };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  calculateLeadScore,
  scoreLeads,
  scoreLeadsFromFile,
  scoreCompanySizeFunding,
  scorePartnershipPotential,
  scoreContactAccessibility,
  scoreMarketRelevance,
  WEIGHTS,
  FUNDING_SCORES,
  PARTNERSHIP_TYPE_SCORES,
  INDUSTRY_RELEVANCE_SCORES,
  GEOGRAPHIC_RELEVANCE_SCORES
};

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (require.main === module) {
  const leadsPath = process.argv[2] || path.join(__dirname, '../dealflow/leads_complete_26.json');
  const outputPath = path.join(__dirname, '../../data/scored-leads-v2.json');
  
  console.log('🔍 DealFlow Lead Scoring Algorithm v2.0');
  console.log('========================================\n');
  console.log('Scoring Criteria:');
  console.log('  • Company Size/Funding (25%)');
  console.log('  • Partnership Potential (30%)');
  console.log('  • Contact Accessibility (25%)');
  console.log('  • Market Relevance (20%)\n');
  
  const result = scoreLeadsFromFile(leadsPath, outputPath);
  
  if (result.success) {
    console.log('✅ Scoring completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total Leads: ${result.summary.totalLeads}`);
    console.log(`   Average Score: ${result.summary.averageScore}/100`);
    console.log(`   Algorithm Version: ${result.summary.algorithmVersion}\n`);
    
    console.log('📈 Tier Distribution:');
    console.log(`   P0 (Immediate Action): ${result.summary.tierDistribution.P0}`);
    console.log(`   P1 (High Priority): ${result.summary.tierDistribution.P1}`);
    console.log(`   P2 (Medium Priority): ${result.summary.tierDistribution.P2}`);
    console.log(`   P3 (Low Priority): ${result.summary.tierDistribution.P3}`);
    console.log(`   Cold (Nurture/Archive): ${result.summary.tierDistribution.Cold}\n`);
    
    console.log('📊 Category Averages:');
    console.log(`   Company Size/Funding: ${result.summary.categoryAverages.companySizeFunding}/100`);
    console.log(`   Partnership Potential: ${result.summary.categoryAverages.partnershipPotential}/100`);
    console.log(`   Contact Accessibility: ${result.summary.categoryAverages.contactAccessibility}/100`);
    console.log(`   Market Relevance: ${result.summary.categoryAverages.marketRelevance}/100\n`);
    
    console.log('🏆 Top 5 Leads:');
    result.summary.topLeads.forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.company} (${lead.contact})`);
      console.log(`      Score: ${lead.score}/100 | Tier: ${lead.tier}`);
      console.log(`      Action: ${lead.action}\n`);
    });
    
    console.log(`💾 Results saved to: ${outputPath}`);
  } else {
    console.error('❌ Scoring failed:', result.error);
    process.exit(1);
  }
}
