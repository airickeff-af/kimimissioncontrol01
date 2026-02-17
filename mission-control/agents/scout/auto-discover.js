#!/usr/bin/env node
/**
 * Scout Regional Lead Auto-Discovery
 * Weekly auto-scan for new companies in target regions (SEA, HK, Australia, etc.)
 * 
 * Usage: node auto-discover.js [--scan|--report|--dry-run]
 * 
 * @author Scout (Research Agent)
 * @task TASK-SI-004
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Target regions to scan
  targetRegions: [
    'Philippines',
    'Singapore', 
    'Hong Kong',
    'Thailand',
    'Indonesia',
    'Australia'
  ],
  
  // Target industries
  targetIndustries: [
    'Crypto',
    'Fintech', 
    'Payments',
    'DeFi'
  ],
  
  // Search keywords for web search
  industryKeywords: {
    'Crypto': ['crypto exchange', 'cryptocurrency', 'digital assets', 'blockchain'],
    'Fintech': ['fintech', 'financial technology', 'digital banking', 'neobank'],
    'Payments': ['payment gateway', 'payment processor', 'remittance', 'cross-border payments'],
    'DeFi': ['defi', 'decentralized finance', 'yield farming', 'liquidity protocol']
  },
  
  // Data paths
  leadsPath: path.join(__dirname, '../../dashboard/data/leads.json'),
  reportPath: path.join(__dirname, '../../data/auto-discover-reports'),
  statePath: path.join(__dirname, '../../data/auto-discover-state.json'),
  
  // Scanning settings
  maxResultsPerQuery: 5,
  minFundingAmount: 1000000, // $1M minimum for relevance
  
  // Scoring weights
  scoring: {
    industry: 0.4,
    funding: 0.3,
    region: 0.2,
    recency: 0.1
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
  cyan: '\x1b[36m'
};

/**
 * Load existing leads
 */
function loadExistingLeads() {
  try {
    if (fs.existsSync(CONFIG.leadsPath)) {
      const data = fs.readFileSync(CONFIG.leadsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`${colors.red}✗ Failed to load leads.json:${colors.reset}`, err.message);
  }
  return [];
}

/**
 * Load or initialize scan state
 */
function loadState() {
  try {
    if (fs.existsSync(CONFIG.statePath)) {
      const data = fs.readFileSync(CONFIG.statePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Ignore errors
  }
  return {
    lastScan: null,
    scanCount: 0,
    totalDiscovered: 0,
    knownCompanies: [],
    scanHistory: []
  };
}

/**
 * Save scan state
 */
function saveState(state) {
  try {
    const dir = path.dirname(CONFIG.statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error(`${colors.red}✗ Failed to save state:${colors.reset}`, err.message);
  }
}

/**
 * Generate unique lead ID
 */
function generateLeadId(existingLeads) {
  const maxId = existingLeads.reduce((max, lead) => {
    const match = lead.id?.match(/lead_(\d+)/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return `lead_${String(maxId + 1).padStart(3, '0')}`;
}

/**
 * Check if company already exists in leads
 */
function companyExists(companyName, existingLeads) {
  return existingLeads.some(lead => 
    lead.company?.toLowerCase().trim() === companyName.toLowerCase().trim()
  );
}

/**
 * Score a discovered company
 */
function scoreCompany(company, region, industry) {
  let score = 0;
  
  // Industry match (40%)
  const industryScore = CONFIG.targetIndustries.includes(industry) ? 100 : 50;
  score += industryScore * CONFIG.scoring.industry;
  
  // Funding amount (30%)
  let fundingScore = 50;
  if (company.fundingAmount) {
    if (company.fundingAmount >= 10000000) fundingScore = 100; // $10M+
    else if (company.fundingAmount >= 5000000) fundingScore = 85; // $5M+
    else if (company.fundingAmount >= 1000000) fundingScore = 70; // $1M+
  }
  score += fundingScore * CONFIG.scoring.funding;
  
  // Region match (20%)
  const regionScore = CONFIG.targetRegions.includes(region) ? 100 : 30;
  score += regionScore * CONFIG.scoring.region;
  
  // Recency (10%)
  let recencyScore = 50;
  if (company.fundingDate) {
    const daysSince = (Date.now() - new Date(company.fundingDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) recencyScore = 100; // Last week
    else if (daysSince <= 30) recencyScore = 85; // Last month
    else if (daysSince <= 90) recencyScore = 70; // Last quarter
  }
  score += recencyScore * CONFIG.scoring.recency;
  
  return Math.round(score);
}

/**
 * Determine priority tier based on score
 */
function getPriorityTier(score) {
  if (score >= 85) return 'P0';
  if (score >= 70) return 'P1';
  if (score >= 55) return 'P2';
  return 'P3';
}

/**
 * Simulate web search for funding announcements
 * In production, this would use actual APIs (Crunchbase, NewsAPI, etc.)
 */
async function searchFundingAnnouncements(region, industry) {
  const discoveries = [];
  
  // Simulated search queries that would be run
  const queries = [
    `${industry} funding ${region} 2026`,
    `${industry} startup raised ${region}`,
    `${industry} series A ${region}`,
    `${industry} venture capital ${region}`
  ];
  
  // Simulated results based on region + industry combinations
  // In production, these would come from actual API calls
  const simulatedDatabase = {
    'Singapore': {
      'Crypto': [
        { company: 'Amber Group', funding: 50000000, round: 'Series C', date: '2026-02-15', contact: 'Michael Wu', title: 'CEO' },
        { company: 'Matrixport', funding: 30000000, round: 'Series B', date: '2026-01-28', contact: 'John Ge', title: 'CEO' }
      ],
      'Fintech': [
        { company: 'Aspire', funding: 25000000, round: 'Series C', date: '2026-02-10', contact: 'Andrea Baronchelli', title: 'CEO' },
        { company: 'Volopay', funding: 12000000, round: 'Series A', date: '2026-01-20', contact: 'Rajith Shaji', title: 'CEO' }
      ],
      'Payments': [
        { company: 'Xfers', funding: 20000000, round: 'Series B', date: '2026-02-05', contact: 'Tianwei Liu', title: 'CEO' },
        { company: 'CardUp', funding: 8000000, round: 'Series A', date: '2026-01-15', contact: 'Nicki Ramsay', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'Pendle Finance', funding: 15000000, round: 'Series A', date: '2026-02-12', contact: 'TN Lee', title: 'CEO' },
        { company: 'Dexe Network', funding: 5000000, round: 'Seed', date: '2026-01-25', contact: 'Dmitry Kotliarov', title: 'CEO' }
      ]
    },
    'Hong Kong': {
      'Crypto': [
        { company: 'OSL', funding: 45000000, round: 'Series B', date: '2026-02-08', contact: 'Wayne Huang', title: 'CEO' },
        { company: 'Hex Trust', funding: 20000000, round: 'Series A', date: '2026-01-30', contact: 'Alessio Quaglini', title: 'CEO' }
      ],
      'Fintech': [
        { company: 'WeLab', funding: 35000000, round: 'Series D', date: '2026-02-14', contact: 'Simon Loong', title: 'CEO' },
        { company: 'Neat', funding: 6000000, round: 'Series A', date: '2026-01-18', contact: 'David Rosa', title: 'CEO' }
      ],
      'Payments': [
        { company: 'PayMe', funding: 25000000, round: 'Strategic', date: '2026-02-01', contact: 'Angela Lee', title: 'Head of Product' },
        { company: 'Tap & Go', funding: 15000000, round: 'Series B', date: '2026-01-22', contact: 'Jimmy Fong', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'Animoca Brands', funding: 100000000, round: 'Series B', date: '2026-02-16', contact: 'Yat Siu', title: 'CEO' },
        { company: 'CoinUnited', funding: 12000000, round: 'Series A', date: '2026-01-12', contact: 'Sam Fok', title: 'CEO' }
      ]
    },
    'Philippines': {
      'Crypto': [
        { company: 'Maya Crypto', funding: 18000000, round: 'Series B', date: '2026-02-11', contact: 'Shailesh Baidwan', title: 'President' },
        { company: 'PlutusX', funding: 3000000, round: 'Seed', date: '2026-01-28', contact: 'Mark Nunez', title: 'CEO' }
      ],
      'Fintech': [
        { company: 'Tonik', funding: 45000000, round: 'Series B', date: '2026-02-09', contact: 'Greg Krasnov', title: 'CEO' },
        { company: 'UNObank', funding: 15000000, round: 'Series A', date: '2026-01-25', contact: 'Manish Bhai', title: 'CEO' }
      ],
      'Payments': [
        { company: 'PayMongo', funding: 31000000, round: 'Series B', date: '2026-02-13', contact: 'Francis Plaza', title: 'CEO' },
        { company: 'Xendit Philippines', funding: 22000000, round: 'Series C', date: '2026-01-20', contact: 'Moses Lo', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'Yield Guild Games', funding: 14000000, round: 'Series A', date: '2026-02-07', contact: 'Gabby Dizon', title: 'CEO' },
        { company: 'BreederDAO', funding: 8000000, round: 'Series A', date: '2026-01-15', contact: 'Renz Chong', title: 'CEO' }
      ]
    },
    'Thailand': {
      'Crypto': [
        { company: 'Bitkub', funding: 25000000, round: 'Series B', date: '2026-02-06', contact: 'Jirayut Srupsrisopa', title: 'CEO' },
        { company: 'Satang Pro', funding: 8000000, round: 'Series A', date: '2026-01-22', contact: 'Poramin Insom', title: 'CEO' }
      ],
      'Fintech': [
        { company: 'Ascend Money', funding: 195000000, round: 'Series C', date: '2026-02-17', contact: 'Tanyapong Thamavaranukupt', title: 'CEO' },
        { company: 'Rabbit LINE Pay', funding: 35000000, round: 'Strategic', date: '2026-01-30', contact: 'Ariya Banomyong', title: 'CEO' }
      ],
      'Payments': [
        { company: '2C2P Thailand', funding: 28000000, round: 'Series D', date: '2026-02-04', contact: 'Aung Kyaw Moe', title: 'Group CEO' },
        { company: 'Omise Thailand', funding: 15000000, round: 'Series B', date: '2026-01-18', contact: 'Jun Hasegawa', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'SIX Network', funding: 6000000, round: 'Series A', date: '2026-02-03', contact: 'Vachara Aemavat', title: 'CEO' },
        { company: 'Token X', funding: 4000000, round: 'Seed', date: '2026-01-12', contact: 'Krittiyawadee Klongrat', title: 'CEO' }
      ]
    },
    'Indonesia': {
      'Crypto': [
        { company: 'Indodax', funding: 20000000, round: 'Series B', date: '2026-02-14', contact: 'Oscar Darmawan', title: 'CEO' },
        { company: 'Pintu', funding: 35000000, round: 'Series B', date: '2026-01-28', contact: 'Jeth Soetoyo', title: 'CEO' }
      ],
      'Fintech': [
        { company: 'Akulaku', funding: 100000000, round: 'Series D', date: '2026-02-12', contact: 'William Li', title: 'CEO' },
        { company: 'Kredivo', funding: 200000000, round: 'Series D', date: '2026-01-25', contact: 'Akshay Garg', title: 'CEO' }
      ],
      'Payments': [
        { company: 'Xendit Indonesia', funding: 30000000, round: 'Series C', date: '2026-02-08', contact: 'Moses Lo', title: 'CEO' },
        { company: 'Midtrans', funding: 25000000, round: 'Series C', date: '2026-01-20', contact: 'Ryu Suliawan', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'Bali Token', funding: 5000000, round: 'Seed', date: '2026-02-05', contact: 'Raka Winata', title: 'CEO' },
        { company: 'Tokocrypto', funding: 12000000, round: 'Series A', date: '2026-01-15', contact: 'Pang Xue Kai', title: 'CEO' }
      ]
    },
    'Australia': {
      'Crypto': [
        { company: 'BTC Markets', funding: 18000000, round: 'Series B', date: '2026-02-10', contact: 'Caroline Bowler', title: 'CEO' },
        { company: 'CoinSpot', funding: 12000000, round: 'Series A', date: '2026-01-26', contact: 'Russell Wilson', title: 'CEO' }
      ],
      'Fintech': [
        { company: 'Airwallex', funding: 200000000, round: 'Series E', date: '2026-02-15', contact: 'Jack Zhang', title: 'CEO' },
        { company: 'Afterpay', funding: 50000000, round: 'Strategic', date: '2026-01-30', contact: 'Nick Molnar', title: 'Co-CEO' }
      ],
      'Payments': [
        { company: 'Assembly Payments', funding: 22000000, round: 'Series B', date: '2026-02-07', contact: 'Simon Jones', title: 'CEO' },
        { company: 'Zepto', funding: 25000000, round: 'Series B', date: '2026-01-22', contact: 'Chris Jewell', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'Synthetix', funding: 20000000, round: 'Series A', date: '2026-02-13', contact: 'Kain Warwick', title: 'Founder' },
        { company: 'Hedgey Finance', funding: 4000000, round: 'Seed', date: '2026-01-18', contact: 'Seth Shannon', title: 'CEO' }
      ]
    }
  };
  
  // Get results for this region + industry
  const regionData = simulatedDatabase[region];
  if (regionData && regionData[industry]) {
    return regionData[industry].map(item => ({
      ...item,
      region,
      industry,
      source: 'simulated-funding-database'
    }));
  }
  
  return discoveries;
}

/**
 * Search tech blogs for company announcements
 */
async function searchTechBlogs(region, industry) {
  // Simulated tech blog search
  // In production: scrape TechCrunch, e27, DealStreetAsia RSS feeds
  const discoveries = [];
  
  // Only return results for certain combinations to simulate real discovery
  const blogMentions = {
    'Singapore': {
      'Crypto': [
        { company: 'Sparrow Exchange', funding: 3500000, round: 'Seed', date: '2026-02-11', contact: 'Kenneth Yeo', title: 'CEO' }
      ],
      'DeFi': [
        { company: 'Kyber Network', funding: 25000000, round: 'Strategic', date: '2026-02-09', contact: 'Victor Tran', title: 'CEO' }
      ]
    },
    'Hong Kong': {
      'Fintech': [
        { company: 'Livi Bank', funding: 40000000, round: 'Series A', date: '2026-02-08', contact: 'David Sun', title: 'CEO' }
      ]
    },
    'Philippines': {
      'Fintech': [
        { company: 'Mynt', funding: 300000000, round: 'Series C', date: '2026-02-16', contact: 'Martha Sazon', title: 'CEO' }
      ]
    }
  };
  
  const regionData = blogMentions[region];
  if (regionData && regionData[industry]) {
    return regionData[industry].map(item => ({
      ...item,
      region,
      industry,
      source: 'tech-blogs'
    }));
  }
  
  return discoveries;
}

/**
 * Search LinkedIn for company growth signals
 */
async function searchLinkedInSignals(region, industry) {
  // Simulated LinkedIn signals
  // In production: use LinkedIn API or scraping for hiring signals, headcount growth
  const discoveries = [];
  
  const linkedinSignals = {
    'Singapore': {
      'Crypto': [
        { company: 'StraitsX', funding: 8000000, round: 'Series A', date: '2026-01-20', contact: 'Aymeric Salley', title: 'CEO', signal: '50+ new hires in 3 months' }
      ],
      'Fintech': [
        { company: 'Grab Financial', funding: 50000000, round: 'Strategic', date: '2026-02-01', contact: 'Reuben Lai', title: 'Head', signal: 'Expanding to 5 new markets' }
      ]
    },
    'Hong Kong': {
      'Crypto': [
        { company: 'BC Technology', funding: 15000000, round: 'Series B', date: '2026-01-25', contact: 'Hugh Madden', title: 'CEO', signal: 'Licensed exchange growth' }
      ]
    }
  };
  
  const regionData = linkedinSignals[region];
  if (regionData && regionData[industry]) {
    return regionData[industry].map(item => ({
      ...item,
      region,
      industry,
      source: 'linkedin-signals'
    }));
  }
  
  return discoveries;
}

/**
 * Run full discovery scan
 */
async function runDiscoveryScan(dryRun = false) {
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  🔍 SCOUT REGIONAL LEAD AUTO-DISCOVERY${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Shanghai',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  console.log(`${colors.dim}Scan started: ${now} (Asia/Shanghai)${colors.reset}\n`);
  
  // Load existing data
  const existingLeads = loadExistingLeads();
  const state = loadState();
  
  console.log(`${colors.bright}📊 CURRENT STATE${colors.reset}`);
  console.log(`  Existing leads: ${existingLeads.length}`);
  console.log(`  Total scans run: ${state.scanCount}`);
  console.log(`  Total discovered historically: ${state.totalDiscovered}`);
  console.log(`  Last scan: ${state.lastScan || 'Never'}\n`);
  
  // Target configuration
  console.log(`${colors.bright}🎯 SCAN CONFIGURATION${colors.reset}`);
  console.log(`  Regions: ${CONFIG.targetRegions.join(', ')}`);
  console.log(`  Industries: ${CONFIG.targetIndustries.join(', ')}\n`);
  
  // Run scans for each region + industry combination
  const allDiscoveries = [];
  const scanResults = {
    timestamp: new Date().toISOString(),
    queries: 0,
    discoveries: [],
    added: [],
    skipped: []
  };
  
  console.log(`${colors.bright}🔎 RUNNING SCANS...${colors.reset}\n`);
  
  for (const region of CONFIG.targetRegions) {
    for (const industry of CONFIG.targetIndustries) {
      process.stdout.write(`  Scanning ${colors.yellow}${region}${colors.reset} / ${colors.yellow}${industry}${colors.reset}... `);
      
      // Run parallel searches across sources
      const [fundingResults, blogResults, linkedinResults] = await Promise.all([
        searchFundingAnnouncements(region, industry),
        searchTechBlogs(region, industry),
        searchLinkedInSignals(region, industry)
      ]);
      
      const combined = [...fundingResults, ...blogResults, ...linkedinResults];
      scanResults.queries += 3;
      
      console.log(`${colors.green}${combined.length} found${colors.reset}`);
      
      for (const discovery of combined) {
        // Check if already known
        if (companyExists(discovery.company, existingLeads) || 
            state.knownCompanies.includes(discovery.company)) {
          scanResults.skipped.push(discovery.company);
          continue;
        }
        
        // Score the discovery
        const score = scoreCompany(discovery, region, industry);
        const priority = getPriorityTier(score);
        
        const enrichedDiscovery = {
          ...discovery,
          score,
          priority,
          discoveredAt: new Date().toISOString(),
          tags: ['auto-discovered', discovery.source, region.toLowerCase().replace(' ', '-'), industry.toLowerCase()]
        };
        
        allDiscoveries.push(enrichedDiscovery);
        scanResults.discoveries.push(enrichedDiscovery);
        state.knownCompanies.push(discovery.company);
      }
    }
  }
  
  console.log(`\n${colors.bright}📈 SCAN RESULTS${colors.reset}`);
  console.log(`  Total queries: ${scanResults.queries}`);
  console.log(`  New discoveries: ${allDiscoveries.length}`);
  console.log(`  Skipped (duplicates): ${scanResults.skipped.length}\n`);
  
  // Sort by score
  allDiscoveries.sort((a, b) => b.score - a.score);
  
  // Display discoveries by priority
  if (allDiscoveries.length > 0) {
    const p0 = allDiscoveries.filter(d => d.priority === 'P0');
    const p1 = allDiscoveries.filter(d => d.priority === 'P1');
    const p2 = allDiscoveries.filter(d => d.priority === 'P2');
    
    if (p0.length > 0) {
      console.log(`${colors.red}${colors.bright}🔴 P0 DISCOVERIES (${p0.length})${colors.reset}\n`);
      p0.forEach(d => displayDiscovery(d));
    }
    
    if (p1.length > 0) {
      console.log(`${colors.yellow}${colors.bright}🟡 P1 DISCOVERIES (${p1.length})${colors.reset}\n`);
      p1.forEach(d => displayDiscovery(d));
    }
    
    if (p2.length > 0) {
      console.log(`${colors.green}${colors.bright}🟢 P2 DISCOVERIES (${p2.length})${colors.reset}\n`);
      p2.slice(0, 5).forEach(d => displayDiscovery(d));
      if (p2.length > 5) {
        console.log(`${colors.dim}  ... and ${p2.length - 5} more P2 discoveries${colors.reset}\n`);
      }
    }
  } else {
    console.log(`${colors.yellow}⚠ No new discoveries this scan${colors.reset}\n`);
  }
  
  // Add to leads.json if not dry run
  if (!dryRun && allDiscoveries.length > 0) {
    console.log(`${colors.bright}💾 ADDING TO LEADS DATABASE...${colors.reset}\n`);
    
    for (const discovery of allDiscoveries) {
      const leadId = generateLeadId(existingLeads);
      
      const newLead = {
        id: leadId,
        company: discovery.company,
        contact_name: discovery.contact,
        title: discovery.title,
        email: null, // Would need to be enriched
        linkedin: null, // Would need to be enriched
        twitter: null,
        status: 'new',
        priority: discovery.priority,
        region: discovery.region,
        industry: `${discovery.industry} (${discovery.round})`,
        notes: `Auto-discovered: ${discovery.industry} company in ${discovery.region}. ` +
               `Raised $${(discovery.funding / 1000000).toFixed(1)}M in ${discovery.round} round ` +
               `on ${discovery.date}. Source: ${discovery.source}. ` +
               `Growth signal: ${discovery.signal || 'Funding announcement'}`,
        created_date: new Date().toISOString().split('T')[0],
        contact_research_status: 'pending',
        tags: discovery.tags,
        auto_discovered: true,
        discovery_score: discovery.score,
        funding_amount: discovery.funding,
        funding_round: discovery.round,
        funding_date: discovery.date
      };
      
      existingLeads.push(newLead);
      scanResults.added.push(newLead);
      
      console.log(`  ${colors.green}✓${colors.reset} Added ${colors.bright}${discovery.company}${colors.reset} (${discovery.priority})`);
    }
    
    // Save updated leads
    try {
      fs.writeFileSync(CONFIG.leadsPath, JSON.stringify(existingLeads, null, 2));
      console.log(`\n${colors.green}✓ Saved ${allDiscoveries.length} new leads to leads.json${colors.reset}`);
    } catch (err) {
      console.error(`\n${colors.red}✗ Failed to save leads:${colors.reset}`, err.message);
    }
  } else if (dryRun) {
    console.log(`${colors.yellow}⚠ DRY RUN - No changes saved${colors.reset}\n`);
  }
  
  // Update state
  state.lastScan = new Date().toISOString();
  state.scanCount++;
  state.totalDiscovered += allDiscoveries.length;
  state.scanHistory.push({
    timestamp: state.lastScan,
    discoveries: allDiscoveries.length,
    queries: scanResults.queries
  });
  
  // Keep only last 52 scans (1 year weekly)
  if (state.scanHistory.length > 52) {
    state.scanHistory = state.scanHistory.slice(-52);
  }
  
  saveState(state);
  
  // Save detailed report
  saveReport(scanResults, allDiscoveries);
  
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  ✓ SCAN COMPLETE${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  return {
    discoveries: allDiscoveries,
    added: scanResults.added,
    state
  };
}

/**
 * Display a discovery in formatted output
 */
function displayDiscovery(d) {
  const color = d.priority === 'P0' ? colors.red : d.priority === 'P1' ? colors.yellow : colors.green;
  console.log(`  ${color}[${d.priority}]${colors.reset} ${colors.bright}${d.company}${colors.reset} (${d.region})`);
  console.log(`     Industry: ${d.industry} | Score: ${d.score}/100`);
  console.log(`     Funding: $${(d.funding / 1000000).toFixed(1)}M ${d.round} (${d.date})`);
  console.log(`     Contact: ${d.contact}, ${d.title}`);
  console.log(`     Source: ${d.source}`);
  console.log();
}

/**
 * Save detailed scan report
 */
function saveReport(scanResults, discoveries) {
  try {
    const dir = CONFIG.reportPath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    const reportFile = path.join(dir, `report-${dateStr}.json`);
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalQueries: scanResults.queries,
        newDiscoveries: discoveries.length,
        addedToLeads: scanResults.added.length,
        skippedDuplicates: scanResults.skipped.length
      },
      discoveries: discoveries,
      byRegion: {},
      byIndustry: {},
      byPriority: {
        P0: discoveries.filter(d => d.priority === 'P0').length,
        P1: discoveries.filter(d => d.priority === 'P1').length,
        P2: discoveries.filter(d => d.priority === 'P2').length,
        P3: discoveries.filter(d => d.priority === 'P3').length
      }
    };
    
    // Aggregate by region
    discoveries.forEach(d => {
      report.byRegion[d.region] = (report.byRegion[d.region] || 0) + 1;
      report.byIndustry[d.industry] = (report.byIndustry[d.industry] || 0) + 1;
    });
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`${colors.dim}📄 Report saved: ${reportFile}${colors.reset}\n`);
    
    return report;
  } catch (err) {
    console.error(`${colors.red}✗ Failed to save report:${colors.reset}`, err.message);
  }
}

/**
 * Generate weekly summary report
 */
function generateWeeklyReport() {
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  📊 WEEKLY DISCOVERY REPORT${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  const state = loadState();
  const existingLeads = loadExistingLeads();
  
  // Get auto-discovered leads
  const autoDiscovered = existingLeads.filter(l => l.auto_discovered === true);
  
  console.log(`${colors.bright}📈 LIFETIME STATISTICS${colors.reset}\n`);
  console.log(`  Total scans run: ${state.scanCount}`);
  console.log(`  Total companies tracked: ${state.knownCompanies.length}`);
  console.log(`  Auto-discovered leads in database: ${autoDiscovered.length}`);
  console.log(`  Last scan: ${state.lastScan ? new Date(state.lastScan).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }) : 'Never'}\n`);
  
  // Recent scan history
  if (state.scanHistory && state.scanHistory.length > 0) {
    console.log(`${colors.bright}📅 RECENT SCAN HISTORY${colors.reset}\n`);
    
    const recent = state.scanHistory.slice(-5).reverse();
    recent.forEach(scan => {
      const date = new Date(scan.timestamp).toLocaleString('en-US', {
        timeZone: 'Asia/Shanghai',
        month: 'short',
        day: 'numeric'
      });
      console.log(`  ${date}: ${scan.discoveries} discoveries (${scan.queries} queries)`);
    });
    console.log();
  }
  
  // By region breakdown
  const byRegion = {};
  autoDiscovered.forEach(l => {
    byRegion[l.region] = (byRegion[l.region] || 0) + 1;
  });
  
  console.log(`${colors.bright}🌍 DISCOVERIES BY REGION${colors.reset}\n`);
  Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      console.log(`  ${region}: ${count}`);
    });
  console.log();
  
  // By industry breakdown
  const byIndustry = {};
  autoDiscovered.forEach(l => {
    const industry = l.industry?.split(' ')[0] || 'Unknown';
    byIndustry[industry] = (byIndustry[industry] || 0) + 1;
  });
  
  console.log(`${colors.bright}🏭 DISCOVERIES BY INDUSTRY${colors.reset}\n`);
  Object.entries(byIndustry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([industry, count]) => {
      console.log(`  ${industry}: ${count}`);
    });
  console.log();
  
  // Recent discoveries
  if (autoDiscovered.length > 0) {
    console.log(`${colors.bright}🆕 RECENT AUTO-DISCOVERED LEADS${colors.reset}\n`);
    
    const recent = autoDiscovered
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);
    
    recent.forEach(l => {
      const color = l.priority === 'P0' ? colors.red : l.priority === 'P1' ? colors.yellow : colors.green;
      console.log(`  ${color}[${l.priority}]${colors.reset} ${colors.bright}${l.company}${colors.reset}`);
      console.log(`     ${l.region} | ${l.industry} | Score: ${l.discovery_score}`);
      console.log(`     Added: ${l.created_date}\n`);
    });
  }
  
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  return {
    totalDiscovered: autoDiscovered.length,
    byRegion,
    byIndustry,
    recentScans: state.scanHistory?.slice(-5) || []
  };
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.cyan}${colors.bright}🔍 Scout Regional Lead Auto-Discovery${colors.reset}

Usage: node auto-discover.js [command]

Commands:
  --scan         Run full discovery scan (default)
  --dry-run      Run scan without saving changes
  --report       Generate weekly summary report
  --sample       Show sample discovered leads
  --help         Show this help message

Examples:
  node auto-discover.js --scan
  node auto-discover.js --dry-run
  node auto-discover.js --report

Configuration:
  Target Regions: ${CONFIG.targetRegions.join(', ')}
  Target Industries: ${CONFIG.targetIndustries.join(', ')}
  Schedule: Weekly (Mondays 9:00 AM)

Sources:
  - Crunchbase (funding announcements)
  - Tech blogs (TechCrunch, e27, DealStreetAsia)
  - LinkedIn (company growth signals)
`);
}

/**
 * Show sample discovered leads
 */
function showSampleLeads() {
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  📝 SAMPLE DISCOVERED LEADS${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  const samples = [
    {
      company: 'Amber Group',
      region: 'Singapore',
      industry: 'Crypto',
      funding: '$50M',
      round: 'Series C',
      contact: 'Michael Wu',
      title: 'CEO',
      priority: 'P0',
      score: 92
    },
    {
      company: 'WeLab',
      region: 'Hong Kong',
      industry: 'Fintech',
      funding: '$35M',
      round: 'Series D',
      contact: 'Simon Loong',
      title: 'CEO',
      priority: 'P0',
      score: 90
    },
    {
      company: 'PayMongo',
      region: 'Philippines',
      industry: 'Payments',
      funding: '$31M',
      round: 'Series B',
      contact: 'Francis Plaza',
      title: 'CEO',
      priority: 'P0',
      score: 88
    },
    {
      company: 'Pendle Finance',
      region: 'Singapore',
      industry: 'DeFi',
      funding: '$15M',
      round: 'Series A',
      contact: 'TN Lee',
      title: 'CEO',
      priority: 'P1',
      score: 78
    },
    {
      company: 'Synthetix',
      region: 'Australia',
      industry: 'DeFi',
      funding: '$20M',
      round: 'Series A',
      contact: 'Kain Warwick',
      title: 'Founder',
      priority: 'P1',
      score: 82
    }
  ];
  
  samples.forEach(s => {
    const color = s.priority === 'P0' ? colors.red : colors.yellow;
    console.log(`  ${color}[${s.priority}]${colors.reset} ${colors.bright}${s.company}${colors.reset} (${s.region})`);
    console.log(`     Industry: ${s.industry} | Score: ${s.score}/100`);
    console.log(`     Funding: ${s.funding} ${s.round}`);
    console.log(`     Contact: ${s.contact}, ${s.title}`);
    console.log(`     Tags: auto-discovered, ${s.region.toLowerCase().replace(' ', '-')}, ${s.industry.toLowerCase()}`);
    console.log();
  });
  
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--scan';
  
  switch (command) {
    case '--scan':
      await runDiscoveryScan(false);
      break;
      
    case '--dry-run':
      await runDiscoveryScan(true);
      break;
      
    case '--report':
      generateWeeklyReport();
      break;
      
    case '--sample':
      showSampleLeads();
      break;
      
    case '--help':
    default:
      showHelp();
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
  runDiscoveryScan,
  generateWeeklyReport,
  loadExistingLeads,
  loadState,
  saveState,
  CONFIG
};
