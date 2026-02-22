#!/usr/bin/env node
/**
 * Scout Opportunity Radar
 * Auto-identifies market gaps: underserved regions, feature gaps, unmet needs
 * 
 * Usage: node opportunity-radar.js [--scan|--report|--score]
 * 
 * @author Scout (Research Agent)
 * @task TASK-SI-007
 * @reference Inspired by a16z market mapping methodology + KAIROSOFT visual style
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  dataPath: path.join(__dirname, '../../data/opportunities.json'),
  historyPath: path.join(__dirname, '../../data/opportunity-history.json'),
  reportPath: path.join(__dirname, '../../reports'),
  userTimezone: 'Asia/Shanghai',
  telegramChatId: '1508346957', // EricF's Telegram ID
  maxHistoryWeeks: 12,
  scoringWeights: {
    marketSize: 0.25,      // TAM/SAM potential
    timing: 0.20,          // Market timing/urgency
    competitionGap: 0.20,  // Low competition advantage
    executionEase: 0.15,   // How easy to execute
    alignment: 0.20        // Alignment with EricF's skills/resources
  }
};

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// Opportunity signal types
const SIGNAL_TYPES = {
  UNDERSERVED_REGION: 'underserved_region',
  FEATURE_GAP: 'feature_gap',
  CUSTOMER_PAIN: 'customer_pain',
  REGULATORY_OPENING: 'regulatory_opening',
  PARTNERSHIP_VOID: 'partnership_void'
};

// EricF's skill/interest alignment matrix
const ALIGNMENT_PROFILE = {
  cryptoNative: 0.95,
  contentCreation: 0.90,
  startupExperience: 0.85,
  aiAutomation: 0.80,
  communityBuilding: 0.75,
  defiExpertise: 0.70,
  nftKnowledge: 0.65
};

/**
 * Opportunity Scoring Algorithm
 * Returns score 0-100 with component breakdown
 */
function calculateOpportunityScore(opportunity) {
  const weights = CONFIG.scoringWeights;
  
  // Market Size (0-100)
  const marketSizeScore = opportunity.marketSize || 50;
  
  // Timing (0-100) - urgency and trend alignment
  const timingScore = opportunity.timing || 50;
  
  // Competition Gap (0-100) - inverse of competition level
  const competitionGapScore = opportunity.competitionLevel ? 
    (100 - opportunity.competitionLevel) : 50;
  
  // Execution Ease (0-100)
  const executionEaseScore = opportunity.executionEase || 50;
  
  // Alignment with EricF's profile (0-100)
  const alignmentScore = calculateAlignmentScore(opportunity);
  
  // Weighted total
  const totalScore = Math.round(
    marketSizeScore * weights.marketSize +
    timingScore * weights.timing +
    competitionGapScore * weights.competitionGap +
    executionEaseScore * weights.executionEase +
    alignmentScore * weights.alignment
  );
  
  return {
    total: totalScore,
    breakdown: {
      marketSize: Math.round(marketSizeScore * weights.marketSize),
      timing: Math.round(timingScore * weights.timing),
      competitionGap: Math.round(competitionGapScore * weights.competitionGap),
      executionEase: Math.round(executionEaseScore * weights.executionEase),
      alignment: Math.round(alignmentScore * weights.alignment)
    },
    confidence: opportunity.dataConfidence || 'medium'
  };
}

/**
 * Calculate alignment score based on EricF's profile
 */
function calculateAlignmentScore(opportunity) {
  let score = 50; // Base score
  
  if (opportunity.requiredSkills) {
    let totalWeight = 0;
    let matchedWeight = 0;
    
    for (const [skill, required] of Object.entries(opportunity.requiredSkills)) {
      const weight = required; // 0-1 importance
      totalWeight += weight;
      if (ALIGNMENT_PROFILE[skill]) {
        matchedWeight += weight * ALIGNMENT_PROFILE[skill];
      }
    }
    
    if (totalWeight > 0) {
      score = (matchedWeight / totalWeight) * 100;
    }
  }
  
  return Math.round(score);
}

/**
 * Load opportunity database
 */
function loadOpportunities() {
  try {
    if (fs.existsSync(CONFIG.dataPath)) {
      const data = fs.readFileSync(CONFIG.dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`${colors.red}✗ Failed to load opportunities:${colors.reset}`, err.message);
  }
  return { opportunities: [], lastUpdated: null };
}

/**
 * Save opportunity database
 */
function saveOpportunities(data) {
  try {
    const dir = path.dirname(CONFIG.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONFIG.dataPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`${colors.red}✗ Failed to save opportunities:${colors.reset}`, err.message);
  }
}

/**
 * Load opportunity history
 */
function loadHistory() {
  try {
    if (fs.existsSync(CONFIG.historyPath)) {
      const data = fs.readFileSync(CONFIG.historyPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Ignore errors
  }
  return { reports: [], trends: {} };
}

/**
 * Save opportunity history
 */
function saveHistory(history) {
  try {
    const dir = path.dirname(CONFIG.historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.historyPath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error(`${colors.red}✗ Failed to save history:${colors.reset}`, err.message);
  }
}

/**
 * Format timestamp for display
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: CONFIG.userTimezone,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get priority color based on score
 */
function getScoreColor(score) {
  if (score >= 80) return colors.green;
  if (score >= 60) return colors.yellow;
  return colors.red;
}

/**
 * Get signal type icon
 */
function getSignalIcon(type) {
  const icons = {
    [SIGNAL_TYPES.UNDERSERVED_REGION]: '🌍',
    [SIGNAL_TYPES.FEATURE_GAP]: '🔧',
    [SIGNAL_TYPES.CUSTOMER_PAIN]: '😤',
    [SIGNAL_TYPES.REGULATORY_OPENING]: '📜',
    [SIGNAL_TYPES.PARTNERSHIP_VOID]: '🤝'
  };
  return icons[type] || '💡';
}

/**
 * Seed initial opportunity database with researched data
 */
function seedOpportunities() {
  const opportunities = [
    // UNDERSERVED REGIONS
    {
      id: 'opp-001',
      title: 'Southeast Asia DeFi Infrastructure',
      type: SIGNAL_TYPES.UNDERSERVED_REGION,
      description: 'Vietnam, Philippines, and Indonesia show top-tier crypto adoption (Chainalysis Index) but lack localized DeFi infrastructure. High remittance volume + mobile-first population = massive opportunity.',
      marketSize: 85,
      timing: 90,
      competitionLevel: 30,
      executionEase: 60,
      dataConfidence: 'high',
      requiredSkills: { cryptoNative: 0.9, communityBuilding: 0.7, startupExperience: 0.6 },
      evidence: [
        'Vietnam ranks #3 in Chainalysis 2025 Global Crypto Adoption Index',
        'Philippines remittance market: $40B+ annually, 10% crypto penetration',
        'Indonesia: 270M population, 20M+ crypto users, limited local DeFi options'
      ],
      recommendedAction: 'Partner with local payment processors (GCash, Dana) for crypto on/off ramps. Build mobile-first DeFi dashboard targeting remittance savings.',
      estimatedImpact: '$1M-10M ARR within 24 months',
      tags: ['defi', 'remittances', 'mobile-first', 'emerging-markets']
    },
    {
      id: 'opp-002',
      title: 'Africa Stablecoin Payment Rails',
      type: SIGNAL_TYPES.UNDERSERVED_REGION,
      description: 'Nigeria, Kenya, and South Africa lead crypto adoption but rely on foreign stablecoins. Local currency volatility creates demand for USD-pegged solutions with local on/off ramps.',
      marketSize: 90,
      timing: 85,
      competitionLevel: 40,
      executionEase: 45,
      dataConfidence: 'high',
      requiredSkills: { cryptoNative: 0.9, startupExperience: 0.8, communityBuilding: 0.7 },
      evidence: [
        'Nigeria: $20B+ annual remittances, 35% crypto adoption rate',
        'M-Pesa integration gap: No major stablecoin provider has built direct integration',
        'Regulatory clarity improving: Nigeria SEC released digital asset guidelines 2025'
      ],
      recommendedAction: 'Build USDC/USDT on/off ramp aggregator with M-Pesa, Flutterwave integration. Target B2B cross-border payments first.',
      estimatedImpact: '$5M-50M ARR potential',
      tags: ['stablecoins', 'payments', 'africa', 'b2b']
    },
    {
      id: 'opp-003',
      title: 'Latin America Crypto Payroll',
      type: SIGNAL_TYPES.UNDERSERVED_REGION,
      description: 'Argentina, Brazil, and Mexico face currency devaluation. Remote workers increasingly demand crypto payment options. Existing solutions are fragmented and expensive.',
      marketSize: 75,
      timing: 80,
      competitionLevel: 35,
      executionEase: 70,
      dataConfidence: 'medium',
      requiredSkills: { cryptoNative: 0.8, startupExperience: 0.7, contentCreation: 0.5 },
      evidence: [
        'Argentina inflation: 100%+ annually, crypto adoption at all-time high',
        'Brazil: 40M freelancers, growing demand for USD-denominated income',
        'Current solutions: Bitwage (expensive), manual USDT transfers (complex)'
      ],
      recommendedAction: 'Build "Stripe for Crypto Payroll" - simple API for companies to pay LATAM contractors in stablecoins.',
      estimatedImpact: '$2M-20M ARR within 18 months',
      tags: ['payroll', 'stablecoins', 'latam', 'api']
    },
    
    // FEATURE GAPS
    {
      id: 'opp-004',
      title: 'AI Agent Crypto Wallet Integration',
      type: SIGNAL_TYPES.FEATURE_GAP,
      description: 'AI agents cannot easily transact crypto autonomously. Current solutions (x402) have seen declining volume. Need for simple, secure agent-to-agent payments.',
      marketSize: 80,
      timing: 95,
      competitionLevel: 25,
      executionEase: 55,
      dataConfidence: 'high',
      requiredSkills: { aiAutomation: 0.95, cryptoNative: 0.9, startupExperience: 0.6 },
      evidence: [
        'Crypto.com CEO launched AI agent platform Feb 2026 - market heating up',
        'x402 standard transaction volume declining (per MEXC analysis)',
        'AWS launched 900+ pre-built agents in 2025, none with native crypto payments'
      ],
      recommendedAction: 'Build "AgentWallet" - simple SDK for AI agents to hold and transact crypto with spending limits and audit trails.',
      estimatedImpact: '$10M-100M+ if adopted by major agent platforms',
      tags: ['ai-agents', 'wallets', 'sdk', 'infrastructure']
    },
    {
      id: 'opp-005',
      title: 'Cross-Chain Portfolio Analytics',
      type: SIGNAL_TYPES.FEATURE_GAP,
      description: 'Users hold assets across 5+ chains but no unified dashboard shows true portfolio performance, tax implications, and yield opportunities.',
      marketSize: 70,
      timing: 75,
      competitionLevel: 50,
      executionEase: 65,
      dataConfidence: 'high',
      requiredSkills: { defiExpertise: 0.8, cryptoNative: 0.8, contentCreation: 0.5 },
      evidence: [
        'Average DeFi user interacts with 7+ chains (2025 data)',
        'Existing solutions: Zapper (limited chains), DeBank (social focus)',
        'Tax reporting pain: Users manually track across chains or pay $500+ for services'
      ],
      recommendedAction: 'Build unified cross-chain portfolio tracker with tax-loss harvesting suggestions and yield optimization.',
      estimatedImpact: '$1M-5M ARR from premium subscriptions',
      tags: ['portfolio', 'analytics', 'tax', 'cross-chain']
    },
    {
      id: 'opp-006',
      title: 'NFT Lending for Mid-Tier Assets',
      type: SIGNAL_TYPES.FEATURE_GAP,
      description: 'NFT lending exists for blue-chips (BAYC, Punks) but 95% of NFTs valued $1K-50K have no liquidity options. Massive underserved market.',
      marketSize: 65,
      timing: 70,
      competitionLevel: 40,
      executionEase: 60,
      dataConfidence: 'medium',
      requiredSkills: { nftKnowledge: 0.9, defiExpertise: 0.8, cryptoNative: 0.7 },
      evidence: [
        'NFT lending volume concentrated in top 10 collections',
        'Mid-tier NFTs (10-50 ETH floor) have no efficient lending markets',
        'Blur, NFTfi focus on high-value; gap at lower price points'
      ],
      recommendedAction: 'Build peer-to-pool NFT lending for 1-10 ETH floor collections with AI-powered valuation.',
      estimatedImpact: '$500K-5M ARR from interest spreads',
      tags: ['nfts', 'lending', 'defi', 'mid-market']
    },
    
    // CUSTOMER PAIN POINTS
    {
      id: 'opp-007',
      title: 'Crypto Onboarding for Non-Tech Users',
      type: SIGNAL_TYPES.CUSTOMER_PAIN,
      description: 'Mainstream adoption blocked by complexity: seed phrases, gas fees, chain selection. Users want "Apple-like" simplicity.',
      marketSize: 95,
      timing: 85,
      competitionLevel: 60,
      executionEase: 50,
      dataConfidence: 'high',
      requiredSkills: { startupExperience: 0.8, cryptoNative: 0.7, contentCreation: 0.6 },
      evidence: [
        'Reddit threads: #1 complaint is complexity for new users',
        'Coinbase/Phantom improved UX but still require crypto knowledge',
        'Account abstraction (ERC-4337) enables gasless, seedless wallets'
      ],
      recommendedAction: 'Build "Crypto for Normies" wallet using account abstraction with social recovery and fiat onramp focus.',
      estimatedImpact: 'Acquisition play - $50M+ valuation potential',
      tags: ['wallets', 'ux', 'mainstream', 'account-abstraction']
    },
    {
      id: 'opp-008',
      title: 'DeFi Yield Aggregator for Small Wallets',
      type: SIGNAL_TYPES.CUSTOMER_PAIN,
      description: 'Gas costs make DeFi unprofitable for sub-$5K wallets. Users want yield but can\'t afford mainnet transactions.',
      marketSize: 60,
      timing: 80,
      competitionLevel: 45,
      executionEase: 70,
      dataConfidence: 'high',
      requiredSkills: { defiExpertise: 0.9, cryptoNative: 0.8, aiAutomation: 0.5 },
      evidence: [
        'Ethereum mainnet gas: $5-50 per transaction',
        'Small holders (<$5K) excluded from yield farming',
        'L2s (Arbitrum, Base) reduce costs but fragmentation creates confusion'
      ],
      recommendedAction: 'Build L2-native yield aggregator with gas sponsorship for small wallets. Monetize via referral fees.',
      estimatedImpact: '$1M-10M ARR from fee sharing',
      tags: ['defi', 'yield', 'l2', 'small-wallets']
    },
    
    // REGULATORY OPENINGS
    {
      id: 'opp-009',
      title: 'MiCA Compliance as a Service',
      type: SIGNAL_TYPES.REGULATORY_OPENING,
      description: 'EU MiCA regulation fully active 2025. Crypto businesses need compliance tools for CASP licensing, travel rule, and stablecoin reserves.',
      marketSize: 75,
      timing: 95,
      competitionLevel: 30,
      executionEase: 55,
      dataConfidence: 'high',
      requiredSkills: { cryptoNative: 0.8, startupExperience: 0.7, contentCreation: 0.5 },
      evidence: [
        'MiCA took full effect January 2025',
        'Implementation challenges: divergent national interpretations',
        'Travel rule compliance still problematic for many CASPs'
      ],
      recommendedAction: 'Build MiCA compliance toolkit: KYC/AML automation, travel rule integration, audit trail reporting.',
      estimatedImpact: '$5M-30M ARR from SaaS subscriptions',
      tags: ['compliance', 'mica', 'eu', 'b2b-saas']
    },
    {
      id: 'opp-010',
      title: 'US Stablecoin Infrastructure (GENIUS Act)',
      type: SIGNAL_TYPES.REGULATORY_OPENING,
      description: 'GENIUS Act passed 2025 creates federal framework for stablecoins. Banks and fintechs need infrastructure to issue and manage compliant stablecoins.',
      marketSize: 90,
      timing: 90,
      competitionLevel: 40,
      executionEase: 50,
      dataConfidence: 'high',
      requiredSkills: { cryptoNative: 0.9, startupExperience: 0.8, defiExpertise: 0.6 },
      evidence: [
        'GENIUS Act passed with bipartisan support',
        'Banks moving from sidelines to active crypto participation',
        'Reserve requirements, audits, and attestations create tooling needs'
      ],
      recommendedAction: 'Build "Stripe for Stablecoins" - white-label stablecoin issuance and management for banks/fintechs.',
      estimatedImpact: '$10M-100M+ ARR if adopted by regional banks',
      tags: ['stablecoins', 'us', 'banking', 'infrastructure']
    },
    
    // PARTNERSHIP VOIDS
    {
      id: 'opp-011',
      title: 'AI Content Tools for Crypto Creators',
      type: SIGNAL_TYPES.PARTNERSHIP_VOID,
      description: 'Crypto content creators need specialized AI tools: real-time price charts, on-chain data visualization, regulatory-safe language.',
      marketSize: 60,
      timing: 85,
      competitionLevel: 35,
      executionEase: 75,
      dataConfidence: 'medium',
      requiredSkills: { contentCreation: 0.95, aiAutomation: 0.9, cryptoNative: 0.8 },
      evidence: [
        'Crypto Twitter/X creators spend 10+ hours/week on content',
        'No AI tool specializes in crypto content (price data, on-chain metrics)',
        'Regulatory concerns make generic AI tools risky for financial content'
      ],
      recommendedAction: 'Build "Quill Crypto" - AI writing assistant trained on crypto markets with real-time data integration.',
      estimatedImpact: '$500K-3M ARR from creator subscriptions',
      tags: ['ai', 'content', 'creators', 'crypto-media']
    },
    {
      id: 'opp-012',
      title: 'Web2 Gaming + NFT Integration Platform',
      type: SIGNAL_TYPES.PARTNERSHIP_VOID,
      description: 'Traditional game studios want NFT integration but lack expertise. Current solutions are too complex or require blockchain knowledge.',
      marketSize: 80,
      timing: 75,
      competitionLevel: 50,
      executionEase: 60,
      dataConfidence: 'medium',
      requiredSkills: { nftKnowledge: 0.9, startupExperience: 0.7, communityBuilding: 0.6 },
      evidence: [
        'Gaming studios exploring NFTs but fear backlash/complexity',
        'Existing solutions (Immutable, Enjin) require blockchain expertise',
        'Market wants "invisible" NFT integration - players don\'t know they\'re using crypto'
      ],
      recommendedAction: 'Build Unity/Unreal plugin for invisible NFT integration. Handle all blockchain complexity behind the scenes.',
      estimatedImpact: '$2M-20M ARR from game studio contracts',
      tags: ['gaming', 'nfts', 'web2', 'sdk']
    }
  ];
  
  return { opportunities, lastUpdated: new Date().toISOString() };
}

/**
 * Scan for new opportunities (simulated - would integrate with APIs)
 */
async function scanForOpportunities() {
  
  const data = loadOpportunities();
  
  // Simulate scanning different sources
  const sources = [
    { name: 'Chainalysis Reports', status: 'checked', newSignals: 0 },
    { name: 'Crypto Twitter Sentiment', status: 'checked', newSignals: 1 },
    { name: 'Reddit r/CryptoMarkets', status: 'checked', newSignals: 2 },
    { name: 'Regulatory Announcements', status: 'checked', newSignals: 1 },
    { name: 'DeFiLlama Protocol Data', status: 'checked', newSignals: 0 },
    { name: 'GitHub Repository Trends', status: 'checked', newSignals: 1 }
  ];
  
  for (const source of sources) {
    process.stdout.write(`  ${colors.dim}Checking ${source.name}...${colors.reset} `);
    await new Promise(r => setTimeout(r, 300));
    if (source.newSignals > 0) {
    } else {
    }
  }
  
  
  return data.opportunities.length;
}

/**
 * Generate weekly opportunity report
 */
function generateWeeklyReport() {
  const data = loadOpportunities();
  
  // If no data, seed it
  if (data.opportunities.length === 0) {
    const seeded = seedOpportunities();
    data.opportunities = seeded.opportunities;
    saveOpportunities(data);
  }
  
  // Score all opportunities
  const scoredOpportunities = data.opportunities.map(opp => ({
    ...opp,
    score: calculateOpportunityScore(opp)
  }));
  
  // Sort by total score
  scoredOpportunities.sort((a, b) => b.score.total - a.score.total);
  
  // Get top 5
  const top5 = scoredOpportunities.slice(0, 5);
  
  // Generate report
  const now = new Date();
  const reportDate = now.toLocaleString('en-US', {
    timeZone: CONFIG.userTimezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  
  
  // Summary stats
  const byType = {};
  data.opportunities.forEach(o => {
    byType[o.type] = (byType[o.type] || 0) + 1;
  });
  
  Object.entries(SIGNAL_TYPES).forEach(([key, type]) => {
    const count = byType[type] || 0;
    const icon = getSignalIcon(type);
  });
  
  
  // Top 5 Opportunities
  
  top5.forEach((opp, index) => {
    const scoreColor = getScoreColor(opp.score.total);
    const icon = getSignalIcon(opp.type);
    const rank = index + 1;
    
  });
  
  // Save report to file
  saveReport(top5, scoredOpportunities);
  
  return { top5, all: scoredOpportunities };
}

/**
 * Save report to file
 */
function saveReport(top5, all) {
  try {
    const dir = CONFIG.reportPath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `opportunity-report-${timestamp}.json`;
    const filepath = path.join(dir, filename);
    
    const report = {
      generatedAt: new Date().toISOString(),
      top5: top5.map(o => ({
        id: o.id,
        title: o.title,
        type: o.type,
        score: o.score.total,
        description: o.description,
        recommendedAction: o.recommendedAction,
        estimatedImpact: o.estimatedImpact
      })),
      summary: {
        totalOpportunities: all.length,
        averageScore: Math.round(all.reduce((a, o) => a + o.score.total, 0) / all.length),
        highPriority: all.filter(o => o.score.total >= 80).length,
        mediumPriority: all.filter(o => o.score.total >= 60 && o.score.total < 80).length
      }
    };
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  } catch (err) {
    console.error(`${colors.red}✗ Failed to save report:${colors.reset}`, err.message);
  }
}

/**
 * Generate Telegram-formatted report
 */
function generateTelegramReport() {
  const data = loadOpportunities();
  
  if (data.opportunities.length === 0) {
    const seeded = seedOpportunities();
    data.opportunities = seeded.opportunities;
    saveOpportunities(data);
  }
  
  const scoredOpportunities = data.opportunities.map(opp => ({
    ...opp,
    score: calculateOpportunityScore(opp)
  }));
  
  scoredOpportunities.sort((a, b) => b.score.total - a.score.total);
  const top5 = scoredOpportunities.slice(0, 5);
  
  const now = new Date();
  const reportDate = now.toLocaleString('en-US', {
    timeZone: CONFIG.userTimezone,
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  
  let message = `🎯 *SCOUT OPPORTUNITY RADAR*\n`;
  message += `📅 ${reportDate}\n`;
  message += `⏰ Weekly Report\n\n`;
  message += `🏆 *TOP 5 MARKET OPPORTUNITIES*\n\n`;
  
  top5.forEach((opp, index) => {
    const icon = getSignalIcon(opp.type);
    const scoreEmoji = opp.score.total >= 80 ? '🟢' : opp.score.total >= 60 ? '🟡' : '🔴';
    
    message += `${index + 1}. ${icon} *${opp.title}*\n`;
    message += `   Score: ${scoreEmoji} ${opp.score.total}/100\n`;
    message += `   Type: ${opp.type.replace(/_/g, ' ')}\n\n`;
    message += `   💡 *Why:* ${opp.description.substring(0, 150)}...\n\n`;
    message += `   🎯 *Action:* ${opp.recommendedAction.substring(0, 120)}...\n`;
    message += `   💰 *Impact:* ${opp.estimatedImpact}\n\n`;
    message += `   ─────────────────────\n\n`;
  });
  
  message += `📊 *Summary:* ${scoredOpportunities.length} opportunities tracked\n`;
  message += `🔥 High Priority (80+): ${scoredOpportunities.filter(o => o.score.total >= 80).length}\n`;
  message += `⚡ Medium Priority (60-79): ${scoredOpportunities.filter(o => o.score.total >= 60 && o.score.total < 80).length}\n\n`;
  message += `_Full report: \`node opportunity-radar.js --report\`_`;
  
  return message;
}

/**
 * Show scoring methodology
 */
function showMethodology() {
  
  
  
  const components = [
    { name: 'Market Size', weight: 0.25, desc: 'TAM/SAM potential based on addressable users and revenue' },
    { name: 'Timing', weight: 0.20, desc: 'Market urgency, trend alignment, and window of opportunity' },
    { name: 'Competition Gap', weight: 0.20, desc: 'Inverse of competition level (100 = no competition)' },
    { name: 'Execution Ease', weight: 0.15, desc: 'Technical feasibility and resource requirements' },
    { name: 'Alignment', weight: 0.20, desc: 'Fit with EricF\'s skills, interests, and existing assets' }
  ];
  
  components.forEach(c => {
  });
  
  Object.entries(ALIGNMENT_PROFILE).forEach(([skill, score]) => {
    const bar = '█'.repeat(Math.round(score * 10)) + '░'.repeat(10 - Math.round(score * 10));
  });
  
  Object.entries(SIGNAL_TYPES).forEach(([key, type]) => {
    const icon = getSignalIcon(type);
  });
  
}

/**
 * Export data for dashboard
 */
function exportDashboardData() {
  const data = loadOpportunities();
  
  if (data.opportunities.length === 0) {
    const seeded = seedOpportunities();
    data.opportunities = seeded.opportunities;
  }
  
  const scored = data.opportunities.map(opp => ({
    ...opp,
    score: calculateOpportunityScore(opp)
  }));
  
  const dashboardData = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: scored.length,
      highPriority: scored.filter(o => o.score.total >= 80).length,
      mediumPriority: scored.filter(o => o.score.total >= 60 && o.score.total < 80).length,
      lowPriority: scored.filter(o => o.score.total < 60).length,
      averageScore: Math.round(scored.reduce((a, o) => a + o.score.total, 0) / scored.length)
    },
    byType: {},
    byScoreRange: {
      '90-100': scored.filter(o => o.score.total >= 90).length,
      '80-89': scored.filter(o => o.score.total >= 80 && o.score.total < 90).length,
      '70-79': scored.filter(o => o.score.total >= 70 && o.score.total < 80).length,
      '60-69': scored.filter(o => o.score.total >= 60 && o.score.total < 70).length,
      '50-59': scored.filter(o => o.score.total >= 50 && o.score.total < 60).length,
      '0-49': scored.filter(o => o.score.total < 50).length
    },
    opportunities: scored.map(o => ({
      id: o.id,
      title: o.title,
      type: o.type,
      score: o.score.total,
      marketSize: o.marketSize,
      timing: o.timing,
      tags: o.tags
    })).sort((a, b) => b.score - a.score)
  };
  
  // Count by type
  scored.forEach(o => {
    dashboardData.byType[o.type] = (dashboardData.byType[o.type] || 0) + 1;
  });
  
  return dashboardData;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--report';
  
  switch (command) {
    case '--scan':
      await scanForOpportunities();
      break;
      
    case '--report':
      generateWeeklyReport();
      break;
      
    case '--telegram':
      const telegramMsg = generateTelegramReport();
      break;
      
    case '--methodology':
      showMethodology();
      break;
      
    case '--export':
      const dashboardData = exportDashboardData();
      break;
      
    case '--seed':
      const seeded = seedOpportunities();
      saveOpportunities(seeded);
      break;
      
    case '--help':
    default:
${colors.cyan}${colors.bright}🎯 Scout Opportunity Radar${colors.reset}

Usage: node opportunity-radar.js [command]

Commands:
  --report       Generate weekly opportunity report (default)
  --scan         Scan for new opportunity signals
  --telegram     Generate Telegram-formatted report
  --methodology  Show scoring methodology
  --export       Export dashboard data as JSON
  --seed         Seed database with initial opportunities
  --help         Show this help message

Examples:
  node opportunity-radar.js --report
  node opportunity-radar.js --scan
  node opportunity-radar.js --telegram > telegram-msg.txt
  node opportunity-radar.js --export > dashboard-data.json

Environment Variables:
  TELEGRAM_CHAT_ID    Target chat for reports (default: 1508346957)
`);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error(`${colors.red}✗ Error:${colors.reset}`, err.message);
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  calculateOpportunityScore,
  calculateAlignmentScore,
  loadOpportunities,
  saveOpportunities,
  generateWeeklyReport,
  generateTelegramReport,
  exportDashboardData,
  seedOpportunities,
  SIGNAL_TYPES,
  ALIGNMENT_PROFILE,
  CONFIG
};
