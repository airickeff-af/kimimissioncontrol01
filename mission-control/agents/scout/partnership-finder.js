#!/usr/bin/env node
/**
 * Scout Partnership Opportunity Finder
 * Identifies companies actively seeking partnerships in crypto/fintech/DeFi
 * 
 * Usage: node partnership-finder.js [--scan|--report|--score]
 * 
 * @author Scout (Research Agent)
 * @task TASK-SI-009
 * @reference Inspired by a16z partnership sourcing + KAIROSOFT visual style
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  dataPath: path.join(__dirname, '../../data/partnership-opportunities.json'),
  historyPath: path.join(__dirname, '../../data/partnership-history.json'),
  reportPath: path.join(__dirname, '../../reports'),
  userTimezone: 'Asia/Shanghai',
  telegramChatId: '1508346957', // EricF's Telegram ID
  maxHistoryWeeks: 12,
  scoringWeights: {
    strategicFit: 0.30,      // Alignment with coins.ph/coins.xyz strategy
    partnershipUrgency: 0.25, // How actively they're seeking partners
    marketPresence: 0.20,    // Market position and reach
    accessibility: 0.15,     // Ease of reaching decision makers
    timing: 0.10             // Current market timing
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

// Partnership signal types
const SIGNAL_TYPES = {
  JOB_POSTING: 'job_posting',
  LINKEDIN_POST: 'linkedin_post',
  PRESS_RELEASE: 'press_release',
  CONFERENCE: 'conference',
  WEBSITE_CHANGE: 'website_change',
  INTEGRATION_MARKETPLACE: 'integration_marketplace',
  PARTNERSHIP_PAGE: 'partnership_page',
  FUNDING_ANNOUNCEMENT: 'funding_announcement'
};

// Partnership urgency indicators
const URGENCY_SIGNALS = {
  HIGH: ['actively seeking', 'urgently hiring', 'immediate need', 'expanding rapidly'],
  MEDIUM: ['hiring', 'looking for partners', 'open to collaboration', 'new initiative'],
  LOW: ['considering', 'exploring options', 'future plans']
};

/**
 * Partnership Scoring Algorithm
 * Returns score 0-100 with component breakdown
 */
function calculatePartnershipScore(opportunity) {
  const weights = CONFIG.scoringWeights;
  
  // Strategic Fit with coins.ph/coins.xyz (0-100)
  const strategicFitScore = opportunity.strategicFit || 50;
  
  // Partnership Urgency (0-100)
  const urgencyScore = calculateUrgencyScore(opportunity);
  
  // Market Presence (0-100)
  const marketPresenceScore = opportunity.marketPresence || 50;
  
  // Accessibility - ease of reaching decision makers (0-100)
  const accessibilityScore = opportunity.accessibility || 50;
  
  // Timing - market conditions (0-100)
  const timingScore = opportunity.timing || 50;
  
  // Weighted total
  const totalScore = Math.round(
    strategicFitScore * weights.strategicFit +
    urgencyScore * weights.partnershipUrgency +
    marketPresenceScore * weights.marketPresence +
    accessibilityScore * weights.accessibility +
    timingScore * weights.timing
  );
  
  return {
    total: totalScore,
    breakdown: {
      strategicFit: Math.round(strategicFitScore),
      urgency: Math.round(urgencyScore),
      marketPresence: Math.round(marketPresenceScore),
      accessibility: Math.round(accessibilityScore),
      timing: Math.round(timingScore)
    }
  };
}

/**
 * Calculate urgency score based on signals
 */
function calculateUrgencyScore(opportunity) {
  let score = 50; // Base score
  
  const signals = opportunity.signals || [];
  const description = (opportunity.description || '').toLowerCase();
  
  // Check for high urgency signals
  URGENCY_SIGNALS.HIGH.forEach(signal => {
    if (description.includes(signal) || signals.some(s => s.toLowerCase().includes(signal))) {
      score += 20;
    }
  });
  
  // Check for medium urgency signals
  URGENCY_SIGNALS.MEDIUM.forEach(signal => {
    if (description.includes(signal) || signals.some(s => s.toLowerCase().includes(signal))) {
      score += 10;
    }
  });
  
  // Job postings indicate active hiring
  if (opportunity.signalType === SIGNAL_TYPES.JOB_POSTING) {
    score += 15;
  }
  
  // Recent funding increases urgency
  if (opportunity.signalType === SIGNAL_TYPES.FUNDING_ANNOUNCEMENT) {
    score += 20;
  }
  
  // Conference appearances indicate active outreach
  if (opportunity.signalType === SIGNAL_TYPES.CONFERENCE) {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate strategic fit for coins.ph/coins.xyz
 */
function calculateStrategicFit(opportunity) {
  let score = 50;
  
  const industry = (opportunity.industry || '').toLowerCase();
  const region = (opportunity.region || '').toLowerCase();
  const description = (opportunity.description || '').toLowerCase();
  
  // Industry alignment
  if (industry.includes('crypto') || industry.includes('blockchain')) score += 15;
  if (industry.includes('fintech')) score += 10;
  if (industry.includes('payment') || industry.includes('remittance')) score += 20;
  if (industry.includes('defi')) score += 10;
  
  // Regional alignment (SEA focus)
  if (region.includes('philippines')) score += 25;
  if (region.includes('singapore')) score += 20;
  if (region.includes('hong kong')) score += 15;
  if (region.includes('southeast asia') || region.includes('sea')) score += 20;
  if (region.includes('indonesia')) score += 10;
  if (region.includes('thailand')) score += 10;
  
  // Use case alignment
  if (description.includes('remittance')) score += 15;
  if (description.includes('payment')) score += 10;
  if (description.includes('integration')) score += 10;
  if (description.includes('api')) score += 10;
  if (description.includes('stablecoin')) score += 10;
  
  return Math.min(100, score);
}

/**
 * Partnership opportunity database
 * Pre-populated with known opportunities
 */
function getPartnershipDatabase() {
  return [
    {
      id: 'bybit-p2p-bd-sea',
      company: 'Bybit',
      signalType: SIGNAL_TYPES.JOB_POSTING,
      title: 'P2P Business Development - SEA',
      description: 'Responsible for exploring, acquiring, and maintaining local resources while driving strategic partnerships that enhance payment ecosystem.',
      industry: 'Crypto Exchange',
      region: 'Singapore / Southeast Asia',
      signals: ['Hiring BD for SEA expansion', 'P2P payment focus', 'Strategic partnerships'],
      sourceUrl: 'https://sg.linkedin.com/jobs/view/p2p-business-development-sea-at-bybit-4184585942',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        linkedin: 'https://www.linkedin.com/company/bybit',
        careers: 'https://www.bybit.com/en-US/careers'
      },
      strategicFit: 85,
      marketPresence: 90,
      accessibility: 70,
      timing: 85
    },
    {
      id: 'solana-foundation-growth-sea',
      company: 'Solana Foundation',
      signalType: SIGNAL_TYPES.JOB_POSTING,
      title: 'Growth Lead - Southeast Asia',
      description: '7-12 years experience in business development, partnerships, or strategy within payments, fintech, blockchain, and/or financial services.',
      industry: 'Blockchain',
      region: 'Southeast Asia',
      signals: ['Hiring growth lead for SEA', 'Payments focus', 'Partnership strategy'],
      sourceUrl: 'https://jobs.solana.com/companies/solana-foundation-2/jobs/57307900-growth-lead-southeast-asia',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        linkedin: 'https://www.linkedin.com/company/solana-foundation',
        careers: 'https://jobs.solana.com'
      },
      strategicFit: 80,
      marketPresence: 85,
      accessibility: 75,
      timing: 80
    },
    {
      id: 'matrixport-custody-sea',
      company: 'Matrixport',
      signalType: SIGNAL_TYPES.JOB_POSTING,
      title: 'Business Development Manager, Custody (SEA)',
      description: 'Support growth of custody business across Southeast Asia. Mid-level role focused on institutional partnerships.',
      industry: 'Crypto Financial Services',
      region: 'Southeast Asia',
      signals: ['Custody business expansion', 'Institutional focus', 'SEA hiring'],
      sourceUrl: 'https://app.icebreaker.xyz/jobs/66449748',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        linkedin: 'https://www.linkedin.com/company/matrixport',
        website: 'https://www.matrixport.com'
      },
      strategicFit: 75,
      marketPresence: 70,
      accessibility: 65,
      timing: 75
    },
    {
      id: 'starpago-coins-partnership',
      company: 'Starpago',
      signalType: SIGNAL_TYPES.PARTNERSHIP_PAGE,
      title: 'Digital Payments Partnership with Coins.ph',
      description: 'Streamlined way for companies to collect payments through Philippines QR Ph standard. Recently partnered with Coins.ph.',
      industry: 'Fintech / Payments',
      region: 'Philippines',
      signals: ['Active partnership with Coins.ph', 'QR Ph integration', 'B2B payments'],
      sourceUrl: 'https://www.mexc.co/en-PH/news/472046',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://starpago.com',
        linkedin: 'https://www.linkedin.com/company/starpago'
      },
      strategicFit: 90,
      marketPresence: 60,
      accessibility: 80,
      timing: 85
    },
    {
      id: 'remitly-coins-stablecoin',
      company: 'Remitly',
      signalType: SIGNAL_TYPES.PRESS_RELEASE,
      title: 'Stablecoin Remittance Partnership with Coins.ph',
      description: 'Collaborating to launch stablecoin-powered remittance service targeting OFWs in US and Canada.',
      industry: 'Remittance / Fintech',
      region: 'Philippines / US / Canada',
      signals: ['Active Coins.ph partnership', 'Stablecoin focus', 'OFW market'],
      sourceUrl: 'https://fintechnews.ph/69577/remittance/coins-ph-remitly-stablecoin-remittance-partnership-philippines/',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://www.remitly.com',
        linkedin: 'https://www.linkedin.com/company/remitly',
        partnerships: 'partnerships@remitly.com'
      },
      strategicFit: 95,
      marketPresence: 85,
      accessibility: 75,
      timing: 90
    },
    {
      id: 'veem-coins-partnership',
      company: 'Veem',
      signalType: SIGNAL_TYPES.PRESS_RELEASE,
      title: 'Cross-border Payments Partnership with Coins.ph',
      description: 'Partnered to improve payments from US and Canada to Philippines, addressing inefficiencies in international payouts.',
      industry: 'B2B Payments',
      region: 'Philippines / US / Canada',
      signals: ['Active Coins.ph partnership', 'B2B focus', 'Cross-border payments'],
      sourceUrl: 'https://thepaypers.com/crypto-web3-and-cbdc/news/veem-partners-with-coinsph-for-better-cross-border-payments',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://www.veem.com',
        linkedin: 'https://www.linkedin.com/company/veem',
        partnerships: 'partners@veem.com'
      },
      strategicFit: 90,
      marketPresence: 70,
      accessibility: 70,
      timing: 85
    },
    {
      id: 'paymongo-philippines',
      company: 'PayMongo',
      signalType: SIGNAL_TYPES.WEBSITE_CHANGE,
      title: 'Philippines Payment Gateway - Integration Focus',
      description: 'Leading payment gateway in Philippines with strong API integration capabilities. Expanding partner ecosystem.',
      industry: 'Fintech / Payments',
      region: 'Philippines',
      signals: ['API-first platform', 'Integration marketplace', 'PH market leader'],
      sourceUrl: 'https://www.paymongo.com',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://www.paymongo.com',
        linkedin: 'https://www.linkedin.com/company/paymongo',
        partnerships: 'partnerships@paymongo.com'
      },
      strategicFit: 85,
      marketPresence: 75,
      accessibility: 80,
      timing: 80
    },
    {
      id: 'xendit-sea-expansion',
      company: 'Xendit',
      signalType: SIGNAL_TYPES.WEBSITE_CHANGE,
      title: 'SEA Payment Gateway - Partner Program',
      description: 'Leading payment gateway across SEA (Indonesia, Philippines). Active partner program for integrations.',
      industry: 'Fintech / Payments',
      region: 'Southeast Asia',
      signals: ['Partner program active', 'Multi-country presence', 'API integrations'],
      sourceUrl: 'https://www.xendit.co',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://www.xendit.co',
        linkedin: 'https://www.linkedin.com/company/xendit',
        partners: 'https://www.xendit.co/en/partners'
      },
      strategicFit: 80,
      marketPresence: 85,
      accessibility: 75,
      timing: 75
    },
    {
      id: 'crypto-com-singapore',
      company: 'Crypto.com',
      signalType: SIGNAL_TYPES.CONFERENCE,
      title: 'Active at Consensus Hong Kong 2025',
      description: 'Singapore-based exchange actively seeking institutional partnerships and integrations. Speaking at major conferences.',
      industry: 'Crypto Exchange',
      region: 'Singapore / Hong Kong',
      signals: ['Conference presence', 'Institutional focus', 'Partnership outreach'],
      sourceUrl: 'https://www.instagram.com/coinsph/p/DUnJ-OpDHqN/',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://crypto.com',
        linkedin: 'https://www.linkedin.com/company/cryptocom',
        partnerships: 'institutional@crypto.com'
      },
      strategicFit: 75,
      marketPresence: 95,
      accessibility: 60,
      timing: 80
    },
    {
      id: 'kast-crypto-partnerships',
      company: 'Kast',
      signalType: SIGNAL_TYPES.JOB_POSTING,
      title: 'Crypto Partnership Manager',
      description: 'Hiring partnership manager for crypto initiatives. $84K-$90K salary range. Hong Kong based.',
      industry: 'Crypto / Fintech',
      region: 'Hong Kong',
      signals: ['Active hiring', 'Partnership focus', 'HK market'],
      sourceUrl: 'https://beincrypto.com/jobs/salary/partnership+hong+kong',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        linkedin: 'https://www.linkedin.com/company/kast',
        careers: 'https://beincrypto.com/jobs'
      },
      strategicFit: 70,
      marketPresence: 50,
      accessibility: 75,
      timing: 70
    },
    {
      id: 'safe-fins-seafarers',
      company: 'SAFE (Seafarers Finance)',
      signalType: SIGNAL_TYPES.WEBSITE_CHANGE,
      title: 'Looking for Partners - Seafarers Market',
      description: 'Actively seeking partners for underserved seafarers market. 10,000+ users. Regulatory clarity in Philippines.',
      industry: 'Fintech / Niche Banking',
      region: 'Philippines',
      signals: ['Actively seeking partners', 'Niche market', 'Regulatory clarity'],
      sourceUrl: 'https://safe-fins.com/',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://safe-fins.com',
        email: 'partners@safe-fins.com'
      },
      strategicFit: 75,
      marketPresence: 40,
      accessibility: 85,
      timing: 80
    },
    {
      id: 'nuvei-payments-partnerships',
      company: 'Nuvei',
      signalType: SIGNAL_TYPES.PRESS_RELEASE,
      title: 'Payments Partnership Expansion',
      description: 'Global payment processor with dedicated partnerships team. Expanding crypto payment solutions.',
      industry: 'Payment Processing',
      region: 'Global / SEA',
      signals: ['Partnership team', 'Crypto expansion', 'Global reach'],
      sourceUrl: 'https://www.nuvei.com/posts/meet-stefan-bursuc',
      dateDiscovered: '2025-02-18',
      contactInfo: {
        website: 'https://www.nuvei.com',
        linkedin: 'https://www.linkedin.com/company/nuvei',
        partnerships: 'partners@nuvei.com'
      },
      strategicFit: 80,
      marketPresence: 90,
      accessibility: 65,
      timing: 75
    }
  ];
}

/**
 * Load existing opportunities from file
 */
function loadOpportunities() {
  try {
    if (fs.existsSync(CONFIG.dataPath)) {
      const data = fs.readFileSync(CONFIG.dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`${colors.red}Error loading opportunities:${colors.reset}`, error.message);
  }
  return { opportunities: [], lastUpdated: null };
}

/**
 * Save opportunities to file
 */
function saveOpportunities(data) {
  try {
    const dir = path.dirname(CONFIG.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONFIG.dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`${colors.red}Error saving opportunities:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Generate outreach recommendations
 */
function generateOutreachRecommendations(opportunity) {
  const recommendations = [];
  
  // Based on signal type
  switch (opportunity.signalType) {
    case SIGNAL_TYPES.JOB_POSTING:
      recommendations.push('💼 **Job Posting Strategy**: Reach out to the hiring manager directly on LinkedIn');
      recommendations.push('   - Mention you saw the BD/Partnerships role and have relevant connections');
      recommendations.push('   - Offer to make warm introductions to potential partners');
      break;
    case SIGNAL_TYPES.PRESS_RELEASE:
      recommendations.push('📰 **Press Release Strategy**: Reference their recent announcement');
      recommendations.push('   - Congratulate on the partnership/news');
      recommendations.push('   - Propose complementary integration or follow-up partnership');
      break;
    case SIGNAL_TYPES.CONFERENCE:
      recommendations.push('🎤 **Conference Strategy**: Schedule meeting at upcoming event');
      recommendations.push('   - Request 15-min coffee chat during the conference');
      recommendations.push('   - Prepare specific integration/use case proposal');
      break;
    case SIGNAL_TYPES.WEBSITE_CHANGE:
      recommendations.push('🌐 **Website Strategy**: Reference specific partner page/initiative');
      recommendations.push('   - Mention you noticed their new partner program');
      recommendations.push('   - Propose pilot integration or co-marketing');
      break;
  }
  
  // Based on industry
  if (opportunity.industry.toLowerCase().includes('payment')) {
    recommendations.push('💳 **Payment Angle**: Emphasize QR Ph integration and remittance volume');
  }
  if (opportunity.industry.toLowerCase().includes('crypto')) {
    recommendations.push('₿ **Crypto Angle**: Highlight Coins.ph 18M+ user base and regulatory licenses');
  }
  if (opportunity.region.toLowerCase().includes('philippines')) {
    recommendations.push('🇵🇭 **PH Market Angle**: Offer local market expertise and distribution');
  }
  
  // Contact strategy
  if (opportunity.contactInfo.partnerships) {
    recommendations.push(`📧 **Direct Contact**: ${opportunity.contactInfo.partnerships}`);
  } else if (opportunity.contactInfo.linkedin) {
    recommendations.push(`💼 **LinkedIn Outreach**: Connect via company page ${opportunity.contactInfo.linkedin}`);
  }
  
  return recommendations;
}

/**
 * Generate weekly partnership report
 */
function generateWeeklyReport() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║     🤝 SCOUT PARTNERSHIP OPPORTUNITY FINDER 🤝                ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║     Weekly Report - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).padEnd(34)}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Load and score opportunities
  const database = getPartnershipDatabase();
  const scoredOpportunities = database.map(opp => {
    const scores = calculatePartnershipScore(opp);
    const strategicFit = calculateStrategicFit(opp);
    return {
      ...opp,
      scores,
      strategicFit
    };
  });
  
  // Sort by total score
  scoredOpportunities.sort((a, b) => b.scores.total - a.scores.total);
  
  // Display top 10
  console.log(`${colors.bright}${colors.yellow}📊 TOP 10 PARTNERSHIP TARGETS${colors.reset}\n`);
  
  scoredOpportunities.slice(0, 10).forEach((opp, index) => {
    const rank = index + 1;
    const scoreColor = opp.scores.total >= 80 ? colors.green : opp.scores.total >= 60 ? colors.yellow : colors.red;
    const signalEmoji = {
      [SIGNAL_TYPES.JOB_POSTING]: '💼',
      [SIGNAL_TYPES.PRESS_RELEASE]: '📰',
      [SIGNAL_TYPES.CONFERENCE]: '🎤',
      [SIGNAL_TYPES.WEBSITE_CHANGE]: '🌐',
      [SIGNAL_TYPES.PARTNERSHIP_PAGE]: '🤝',
      [SIGNAL_TYPES.FUNDING_ANNOUNCEMENT]: '💰',
      [SIGNAL_TYPES.LINKEDIN_POST]: '💬',
      [SIGNAL_TYPES.INTEGRATION_MARKETPLACE]: '🔌'
    }[opp.signalType] || '📌';
    
    console.log(`${colors.bright}${scoreColor}#${rank} ${opp.company}${colors.reset} ${signalEmoji} ${colors.dim}(${opp.signalType.replace(/_/g, ' ')})${colors.reset}`);
    console.log(`   ${colors.cyan}Score:${colors.reset} ${opp.scores.total}/100 ${colors.dim}|${colors.reset} ${colors.cyan}Region:${colors.reset} ${opp.region}`);
    console.log(`   ${colors.white}${opp.title}${colors.reset}`);
    console.log(`   ${colors.dim}${opp.description.substring(0, 100)}...${colors.reset}`);
    
    // Why they're seeking partners
    console.log(`   ${colors.yellow}Why seeking partners:${colors.reset}`);
    opp.signals.forEach(signal => {
      console.log(`      • ${signal}`);
    });
    
    // Score breakdown
    console.log(`   ${colors.dim}Fit: ${opp.scores.breakdown.strategicFit} | Urgency: ${opp.scores.breakdown.urgency} | Presence: ${opp.scores.breakdown.marketPresence} | Access: ${opp.scores.breakdown.accessibility}${colors.reset}`);
    
    // Contact info
    console.log(`   ${colors.green}Contact:${colors.reset}`);
    if (opp.contactInfo.partnerships) console.log(`      📧 ${opp.contactInfo.partnerships}`);
    if (opp.contactInfo.linkedin) console.log(`      💼 ${opp.contactInfo.linkedin}`);
    if (opp.contactInfo.website) console.log(`      🌐 ${opp.contactInfo.website}`);
    
    console.log();
  });
  
  // Generate summary
  const highPriority = scoredOpportunities.filter(o => o.scores.total >= 80);
  const mediumPriority = scoredOpportunities.filter(o => o.scores.total >= 60 && o.scores.total < 80);
  
  console.log(`${colors.bright}${colors.cyan}📈 SUMMARY${colors.reset}\n`);
  console.log(`   High Priority (80+): ${highPriority.length} targets`);
  console.log(`   Medium Priority (60-79): ${mediumPriority.length} targets`);
  console.log(`   Total Scanned: ${scoredOpportunities.length} companies`);
  console.log(`   Report Generated: ${new Date().toLocaleString('en-US', { timeZone: CONFIG.userTimezone })}`);
  
  // Save report to file
  const reportData = {
    generatedAt: new Date().toISOString(),
    topTargets: scoredOpportunities.slice(0, 10).map(o => ({
      rank: scoredOpportunities.indexOf(o) + 1,
      company: o.company,
      score: o.scores.total,
      signalType: o.signalType,
      region: o.region,
      whySeeking: o.signals,
      contactInfo: o.contactInfo,
      outreachRecommendations: generateOutreachRecommendations(o)
    })),
    summary: {
      highPriority: highPriority.length,
      mediumPriority: mediumPriority.length,
      total: scoredOpportunities.length
    }
  };
  
  const reportFileName = `partnership-report-${new Date().toISOString().split('T')[0]}.json`;
  const reportPath = path.join(CONFIG.reportPath, reportFileName);
  
  try {
    if (!fs.existsSync(CONFIG.reportPath)) {
      fs.mkdirSync(CONFIG.reportPath, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n   ${colors.green}✓ Report saved to:${colors.reset} ${reportPath}`);
  } catch (error) {
    console.error(`\n   ${colors.red}✗ Error saving report:${colors.reset}`, error.message);
  }
  
  return reportData;
}

/**
 * Generate HTML dashboard
 */
function generateDashboard() {
  const database = getPartnershipDatabase();
  const scoredOpportunities = database.map(opp => {
    const scores = calculatePartnershipScore(opp);
    const strategicFit = calculateStrategicFit(opp);
    return {
      ...opp,
      scores,
      strategicFit
    };
  }).sort((a, b) => b.scores.total - a.scores.total);
  
  const signalTypeColors = {
    [SIGNAL_TYPES.JOB_POSTING]: '#3498db',
    [SIGNAL_TYPES.PRESS_RELEASE]: '#e74c3c',
    [SIGNAL_TYPES.CONFERENCE]: '#9b59b6',
    [SIGNAL_TYPES.WEBSITE_CHANGE]: '#2ecc71',
    [SIGNAL_TYPES.PARTNERSHIP_PAGE]: '#f39c12',
    [SIGNAL_TYPES.FUNDING_ANNOUNCEMENT]: '#1abc9c',
    [SIGNAL_TYPES.LINKEDIN_POST]: '#e67e22',
    [SIGNAL_TYPES.INTEGRATION_MARKETPLACE]: '#34495e'
  };
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤝 Partnership Opportunity Finder Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 30px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .header .subtitle {
            color: #888;
            font-size: 1.1em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
            transition: transform 0.3s;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-card .label {
            color: #888;
            margin-top: 5px;
        }
        .opportunities-list {
            display: grid;
            gap: 20px;
        }
        .opportunity-card {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s;
        }
        .opportunity-card:hover {
            background: rgba(255,255,255,0.08);
            transform: translateX(5px);
        }
        .opportunity-card.high-priority { border-left: 4px solid #2ecc71; }
        .opportunity-card.medium-priority { border-left: 4px solid #f39c12; }
        .opportunity-card.low-priority { border-left: 4px solid #e74c3c; }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 1.5em;
            font-weight: bold;
            color: #fff;
        }
        .score-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
        }
        .signal-type {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            margin-right: 10px;
            color: #fff;
        }
        .meta-info {
            display: flex;
            gap: 20px;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        .meta-item {
            color: #888;
            font-size: 0.9em;
        }
        .meta-item strong {
            color: #fff;
        }
        .description {
            color: #bbb;
            line-height: 1.6;
            margin: 15px 0;
        }
        .signals {
            margin: 15px 0;
        }
        .signals h4 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .signal-tag {
            display: inline-block;
            background: rgba(102, 126, 234, 0.2);
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            margin: 5px 5px 0 0;
            color: #a8b5ff;
        }
        .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .contact-info h4 {
            color: #2ecc71;
            margin-bottom: 10px;
        }
        .contact-link {
            display: inline-block;
            color: #667eea;
            text-decoration: none;
            margin-right: 15px;
            font-size: 0.9em;
        }
        .contact-link:hover {
            text-decoration: underline;
        }
        .score-breakdown {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .score-item {
            text-align: center;
        }
        .score-item .value {
            font-size: 1.3em;
            font-weight: bold;
            color: #667eea;
        }
        .score-item .label {
            font-size: 0.75em;
            color: #888;
        }
        .footer {
            text-align: center;
            padding: 30px;
            color: #666;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤝 Partnership Opportunity Finder</h1>
        <p class="subtitle">Weekly Report - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="number">${scoredOpportunities.filter(o => o.scores.total >= 80).length}</div>
            <div class="label">High Priority</div>
        </div>
        <div class="stat-card">
            <div class="number">${scoredOpportunities.filter(o => o.scores.total >= 60 && o.scores.total < 80).length}</div>
            <div class="label">Medium Priority</div>
        </div>
        <div class="stat-card">
            <div class="number">${scoredOpportunities.length}</div>
            <div class="label">Total Targets</div>
        </div>
        <div class="stat-card">
            <div class="number">${new Set(scoredOpportunities.map(o => o.region)).size}</div>
            <div class="label">Regions</div>
        </div>
    </div>
    
    <div class="opportunities-list">
        ${scoredOpportunities.slice(0, 10).map((opp, index) => {
          const priorityClass = opp.scores.total >= 80 ? 'high-priority' : opp.scores.total >= 60 ? 'medium-priority' : 'low-priority';
          return `
        <div class="opportunity-card ${priorityClass}">
            <div class="card-header">
                <div>
                    <div class="company-name">#${index + 1} ${opp.company}</div>
                    <div style="margin-top: 10px;">
                        <span class="signal-type" style="background: ${signalTypeColors[opp.signalType] || '#667eea'};">${opp.signalType.replace(/_/g, ' ').toUpperCase()}</span>
                        <span style="color: #888;">${opp.industry}</span>
                    </div>
                </div>
                <div class="score-badge">${opp.scores.total}/100</div>
            </div>
            
            <div class="meta-info">
                <div class="meta-item"><strong>📍</strong> ${opp.region}</div>
                <div class="meta-item"><strong>📅</strong> Discovered: ${opp.dateDiscovered}</div>
            </div>
            
            <div class="description">${opp.title} - ${opp.description}</div>
            
            <div class="signals">
                <h4>🎯 Why They're Seeking Partners</h4>
                ${opp.signals.map(s => `<span class="signal-tag">${s}</span>`).join('')}
            </div>
            
            <div class="score-breakdown">
                <div class="score-item">
                    <div class="value">${opp.scores.breakdown.strategicFit}</div>
                    <div class="label">Strategic Fit</div>
                </div>
                <div class="score-item">
                    <div class="value">${opp.scores.breakdown.urgency}</div>
                    <div class="label">Urgency</div>
                </div>
                <div class="score-item">
                    <div class="value">${opp.scores.breakdown.marketPresence}</div>
                    <div class="label">Market</div>
                </div>
                <div class="score-item">
                    <div class="value">${opp.scores.breakdown.accessibility}</div>
                    <div class="label">Access</div>
                </div>
                <div class="score-item">
                    <div class="value">${opp.scores.breakdown.timing}</div>
                    <div class="label">Timing</div>
                </div>
            </div>
            
            <div class="contact-info">
                <h4>📞 Contact Information</h4>
                ${opp.contactInfo.website ? `<a href="${opp.contactInfo.website}" class="contact-link" target="_blank">🌐 Website</a>` : ''}
                ${opp.contactInfo.linkedin ? `<a href="${opp.contactInfo.linkedin}" class="contact-link" target="_blank">💼 LinkedIn</a>` : ''}
                ${opp.contactInfo.partnerships ? `<a href="mailto:${opp.contactInfo.partnerships}" class="contact-link">📧 ${opp.contactInfo.partnerships}</a>` : ''}
                ${opp.contactInfo.careers ? `<a href="${opp.contactInfo.careers}" class="contact-link" target="_blank">💼 Careers</a>` : ''}
            </div>
        </div>
          `;
        }).join('')}
    </div>
    
    <div class="footer">
        <p>Generated by Scout Partnership Opportunity Finder | coins.ph/coins.xyz Strategic Partnership Intelligence</p>
        <p style="margin-top: 10px; font-size: 0.9em;">${new Date().toLocaleString('en-US', { timeZone: CONFIG.userTimezone })}</p>
    </div>
</body>
</html>`;
  
  const dashboardPath = path.join(CONFIG.reportPath, `partnership-dashboard-${new Date().toISOString().split('T')[0]}.html`);
  fs.writeFileSync(dashboardPath, html);
  console.log(`   ${colors.green}✓ Dashboard saved to:${colors.reset} ${dashboardPath}`);
  
  return dashboardPath;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--report';
  
  switch (command) {
    case '--scan':
      console.log(`${colors.cyan}🔍 Scanning for new partnership opportunities...${colors.reset}`);
      // In a full implementation, this would search APIs, job boards, etc.
      console.log(`${colors.yellow}⚠️  Live scanning not yet implemented. Using curated database.${colors.reset}`);
      generateWeeklyReport();
      break;
      
    case '--report':
      generateWeeklyReport();
      break;
      
    case '--dashboard':
      generateDashboard();
      break;
      
    case '--score':
      console.log(`${colors.cyan}📊 Scoring opportunities...${colors.reset}`);
      const database = getPartnershipDatabase();
      database.forEach(opp => {
        const scores = calculatePartnershipScore(opp);
        console.log(`${opp.company}: ${scores.total}/100`);
      });
      break;
      
    case '--help':
    default:
      console.log(`
${colors.bright}Scout Partnership Opportunity Finder${colors.reset}

Usage: node partnership-finder.js [command]

Commands:
  --scan       Scan for new partnership opportunities
  --report     Generate weekly partnership report
  --dashboard  Generate HTML dashboard
  --score      Score all opportunities
  --help       Show this help message

Signals tracked:
  💼 Job Postings (BD, Partnerships Manager roles)
  📰 Press Releases (partnership announcements)
  🎤 Conference Appearances (speaking, sponsoring)
  🌐 Website Changes (new partner pages, marketplaces)
  🤝 Partnership Pages (integration directories)
  💰 Funding Announcements (growth = partnership needs)
  💬 LinkedIn Posts (actively seeking partners)
  🔌 Integration Marketplaces (API ecosystems)

Scoring factors:
  • Strategic Fit (30%) - Alignment with coins.ph/coins.xyz
  • Partnership Urgency (25%) - How actively seeking
  • Market Presence (20%) - Company size/reach
  • Accessibility (15%) - Ease of contact
  • Timing (10%) - Market conditions
      `);
  }
}

// Run main function
main();
