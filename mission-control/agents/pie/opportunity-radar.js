/**
 * PIE - Opportunity Radar Module
 * 
 * A comprehensive intelligence engine for monitoring crypto/NFT/startup ecosystems,
 * tracking competitor activities, and identifying partnership opportunities.
 * 
 * Inspired by: Crunchbase, Google Alerts, Owler
 * 
 * @module opportunity-radar
 * @author Glasses (Researcher Agent)
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Monitoring intervals (in milliseconds)
  intervals: {
    news: 5 * 60 * 1000,      // 5 minutes
    funding: 10 * 60 * 1000,  // 10 minutes
    competitors: 15 * 60 * 1000, // 15 minutes
    opportunities: 30 * 60 * 1000 // 30 minutes
  },

  // Alert thresholds
  thresholds: {
    fundingMinAmount: 1000000, // $1M minimum for alerts
    hotKeywordCount: 3,        // Minimum keyword hits for "hot" alert
    sentimentThreshold: 0.7    // Positive sentiment threshold
  },

  // Data storage paths
  paths: {
    data: './data/opportunity-radar',
    alerts: './data/opportunity-radar/alerts',
    cache: './data/opportunity-radar/cache',
    reports: './data/opportunity-radar/reports'
  },

  // API endpoints and RSS feeds
  sources: {
    // Crypto/Blockchain News
    cryptoNews: [
      { name: 'CoinDesk', type: 'rss', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
      { name: 'CoinTelegraph', type: 'rss', url: 'https://cointelegraph.com/rss' },
      { name: 'Decrypt', type: 'rss', url: 'https://decrypt.co/feed' },
      { name: 'TheBlock', type: 'rss', url: 'https://www.theblock.co/rss.xml' }
    ],

    // Startup/Funding News
    startupNews: [
      { name: 'TechCrunch', type: 'rss', url: 'https://techcrunch.com/feed/' },
      { name: 'VentureBeat', type: 'rss', url: 'https://venturebeat.com/feed/' },
      { name: 'CrunchbaseNews', type: 'rss', url: 'https://news.crunchbase.com/feed/' }
    ],

    // NFT/Metaverse
    nftNews: [
      { name: 'NFTNow', type: 'rss', url: 'https://nftnow.com/feed/' },
      { name: 'DappRadar', type: 'api', url: 'https://dappradar.com/api' }
    ]
  },

  // Competitors to track
  competitors: {
    exchanges: ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit', 'KuCoin', 'Bitfinex', 'Huobi'],
    nftMarketplaces: ['OpenSea', 'Blur', 'Magic Eden', 'LooksRare', 'X2Y2'],
    defi: ['Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve', 'Lido'],
    infrastructure: ['Alchemy', 'Infura', 'QuickNode', 'Moralis'],
    wallets: ['MetaMask', 'Phantom', 'Rainbow', 'Coinbase Wallet', 'Trust Wallet']
  },

  // Partnership opportunity keywords
  opportunityKeywords: {
    partnership: ['partnership', 'collaboration', 'alliance', 'integration', 'joins forces'],
    funding: ['funding', 'raised', 'investment', 'series', 'valuation', 'backed by'],
    expansion: ['expansion', 'launches in', 'enters', 'new market', 'global'],
    product: ['product launch', 'new feature', 'platform', 'service', 'solution'],
    acquisition: ['acquisition', 'acquired', 'merger', 'buys', 'purchases'],
    ipo: ['ipo', 'public', 'listing', 'stock', 'shares']
  },

  // Hot sectors for 2024-2025
  hotSectors: [
    'AI', 'DePIN', 'RWA', 'Restaking', 'L2', 'ZK', 'Modular', 'Bitcoin L2',
    'Gaming', 'SocialFi', 'DeSci', 'Intent', 'Account Abstraction'
  ]
};

// ============================================================================
// DATA STORE
// ============================================================================

class DataStore {
  constructor(basePath) {
    this.basePath = basePath;
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.basePath,
      path.join(this.basePath, 'alerts'),
      path.join(this.basePath, 'cache'),
      path.join(this.basePath, 'reports'),
      path.join(this.basePath, 'competitors'),
      path.join(this.basePath, 'opportunities')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  save(key, data) {
    const filePath = path.join(this.basePath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  load(key) {
    const filePath = path.join(this.basePath, `${key}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }

  append(key, data) {
    const existing = this.load(key) || [];
    existing.push(data);
    this.save(key, existing);
  }

  saveAlert(alert) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.basePath, 'alerts', `${date}.json`);
    
    let alerts = [];
    if (fs.existsSync(filePath)) {
      alerts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    alerts.push({
      ...alert,
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
    return alert;
  }

  getAlerts(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filePath = path.join(this.basePath, 'alerts', `${targetDate}.json`);
    
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  }

  saveCompetitorSnapshot(competitor, data) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.basePath, 'competitors', `${competitor}`, `${date}.json`);
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  getCompetitorHistory(competitor, days = 7) {
    const dir = path.join(this.basePath, 'competitors', competitor);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .slice(-days);
    
    return files.map(f => {
      return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    });
  }
}

// ============================================================================
// HTTP UTILITIES
// ============================================================================

class HttpClient {
  static fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'OpportunityRadar/1.0 (Intelligence Engine)',
          'Accept': 'application/json, application/rss+xml, text/xml, */*',
          ...options.headers
        },
        timeout: options.timeout || 10000
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data
            });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  static async fetchJSON(url, options = {}) {
    const response = await this.fetch(url, options);
    return JSON.parse(response.body);
  }

  static async fetchXML(url, options = {}) {
    const response = await this.fetch(url, options);
    return response.body;
  }
}

// ============================================================================
// RSS PARSER
// ============================================================================

class RSSParser {
  static parse(xmlContent) {
    const items = [];
    
    // Simple regex-based RSS parsing (for production, use a proper XML parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const creatorRegex = /<dc:creator>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/i;

    let match;
    while ((match = itemRegex.exec(xmlContent)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(titleRegex);
      const linkMatch = itemContent.match(linkRegex);
      const descMatch = itemContent.match(descRegex);
      const pubDateMatch = itemContent.match(pubDateRegex);
      const creatorMatch = itemContent.match(creatorRegex);

      if (titleMatch && linkMatch) {
        items.push({
          title: this.cleanText(titleMatch[1]),
          link: this.cleanText(linkMatch[1]),
          description: descMatch ? this.cleanText(descMatch[1]) : '',
          published: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          author: creatorMatch ? this.cleanText(creatorMatch[1]) : null
        });
      }
    }

    return items;
  }

  static cleanText(text) {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
}

// ============================================================================
// INTELLIGENCE ANALYZER
// ============================================================================

class IntelligenceAnalyzer {
  constructor(config) {
    this.config = config;
    this.keywordPatterns = this.compilePatterns();
  }

  compilePatterns() {
    const patterns = {};
    
    for (const [category, keywords] of Object.entries(this.config.opportunityKeywords)) {
      patterns[category] = keywords.map(kw => ({
        keyword: kw,
        regex: new RegExp(`\\b${kw}\\b`, 'gi')
      }));
    }
    
    return patterns;
  }

  analyzeContent(content) {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const lowerText = text.toLowerCase();
    
    const analysis = {
      categories: {},
      competitors: [],
      sectors: [],
      sentiment: 0,
      opportunityScore: 0,
      fundingAmount: null,
      isHot: false
    };

    // Analyze keyword categories
    for (const [category, patterns] of Object.entries(this.keywordPatterns)) {
      const matches = [];
      for (const { keyword, regex } of patterns) {
        const found = text.match(regex);
        if (found) {
          matches.push({ keyword, count: found.length });
        }
      }
      if (matches.length > 0) {
        analysis.categories[category] = matches;
      }
    }

    // Detect competitors mentioned
    for (const [type, companies] of Object.entries(this.config.competitors)) {
      for (const company of companies) {
        if (lowerText.includes(company.toLowerCase())) {
          analysis.competitors.push({ name: company, type });
        }
      }
    }

    // Detect hot sectors
    for (const sector of this.config.hotSectors) {
      if (lowerText.includes(sector.toLowerCase())) {
        analysis.sectors.push(sector);
      }
    }

    // Extract funding amounts
    analysis.fundingAmount = this.extractFundingAmount(text);

    // Calculate opportunity score
    analysis.opportunityScore = this.calculateOpportunityScore(analysis);
    analysis.isHot = analysis.opportunityScore >= this.config.thresholds.hotKeywordCount;

    return analysis;
  }

  extractFundingAmount(text) {
    // Match patterns like "$10 million", "$50M", "raised $100M", etc.
    const patterns = [
      /\$([\d,.]+)\s*(million|M)\b/gi,
      /\$([\d,.]+)\s*(billion|B)\b/gi,
      /\$([\d,.]+)\s*(thousand|K)\b/gi,
      /raised\s*\$?([\d,.]+)\s*(million|billion|M|B)?/gi,
      /funding\s*\$?([\d,.]+)\s*(million|billion|M|B)?/gi
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = (match[2] || '').toLowerCase();
        
        if (unit === 'million' || unit === 'm') amount *= 1000000;
        if (unit === 'billion' || unit === 'b') amount *= 1000000000;
        if (unit === 'thousand' || unit === 'k') amount *= 1000;
        
        if (amount >= this.config.thresholds.fundingMinAmount) {
          return amount;
        }
      }
    }
    
    return null;
  }

  calculateOpportunityScore(analysis) {
    let score = 0;
    
    // Points for keyword categories
    score += Object.keys(analysis.categories).length;
    
    // Points for competitors mentioned
    score += analysis.competitors.length * 0.5;
    
    // Points for hot sectors
    score += analysis.sectors.length;
    
    // Bonus for funding
    if (analysis.fundingAmount) {
      score += Math.log10(analysis.fundingAmount / 1000000) + 2;
    }
    
    return Math.round(score * 10) / 10;
  }

  generateBriefing(analysis, source) {
    const timestamp = new Date().toISOString();
    
    return {
      timestamp,
      source: source.name,
      type: this.determineAlertType(analysis),
      priority: analysis.isHot ? 'HIGH' : 'MEDIUM',
      summary: this.generateSummary(analysis, source),
      details: analysis,
      actionItems: this.generateActionItems(analysis)
    };
  }

  determineAlertType(analysis) {
    if (analysis.categories.funding) return 'FUNDING_ALERT';
    if (analysis.categories.partnership) return 'PARTNERSHIP_OPPORTUNITY';
    if (analysis.categories.acquisition) return 'MA_ACTIVITY';
    if (analysis.categories.product) return 'PRODUCT_LAUNCH';
    if (analysis.categories.expansion) return 'MARKET_EXPANSION';
    return 'GENERAL_INTELLIGENCE';
  }

  generateSummary(analysis, source) {
    const parts = [];
    
    if (analysis.fundingAmount) {
      parts.push(`Funding: $${(analysis.fundingAmount / 1000000).toFixed(1)}M`);
    }
    
    if (analysis.competitors.length > 0) {
      const names = analysis.competitors.map(c => c.name).join(', ');
      parts.push(`Competitors: ${names}`);
    }
    
    if (analysis.sectors.length > 0) {
      parts.push(`Sectors: ${analysis.sectors.join(', ')}`);
    }
    
    const categoryNames = Object.keys(analysis.categories);
    if (categoryNames.length > 0) {
      parts.push(`Categories: ${categoryNames.join(', ')}`);
    }
    
    return parts.join(' | ');
  }

  generateActionItems(analysis) {
    const items = [];
    
    if (analysis.categories.partnership) {
      items.push('Evaluate partnership potential');
      items.push('Research company background');
    }
    
    if (analysis.fundingAmount && analysis.fundingAmount > 10000000) {
      items.push('Monitor for strategic moves');
      items.push('Assess competitive threat');
    }
    
    if (analysis.competitors.length > 0) {
      items.push('Update competitor intelligence file');
    }
    
    if (analysis.categories.acquisition) {
      items.push('Analyze M&A implications');
    }
    
    return items;
  }
}

// ============================================================================
// OPPORTUNITY RADAR - MAIN ENGINE
// ============================================================================

class OpportunityRadar {
  constructor(config = CONFIG) {
    this.config = config;
    this.store = new DataStore(config.paths.data);
    this.analyzer = new IntelligenceAnalyzer(config);
    this.monitors = new Map();
    this.isRunning = false;
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async initialize() {
    console.log('🎯 Opportunity Radar initializing...');
    
    // Ensure data directories exist
    this.store.ensureDirectories();
    
    // Load previous state if exists
    const state = this.store.load('state');
    if (state) {
      console.log('📂 Restored previous state');
    }
    
    console.log('✅ Opportunity Radar initialized');
    return this;
  }

  // ========================================================================
  // MONITORING METHODS
  // ========================================================================

  async monitorNewsSource(source) {
    try {
      console.log(`📡 Fetching from ${source.name}...`);
      
      let items = [];
      
      if (source.type === 'rss') {
        const xml = await HttpClient.fetchXML(source.url);
        items = RSSParser.parse(xml);
      } else if (source.type === 'api') {
        // API-specific handling would go here
        console.log(`  ⚠️ API source ${source.name} requires implementation`);
        return [];
      }

      console.log(`  📰 Found ${items.length} items`);
      
      const analyzedItems = [];
      
      for (const item of items.slice(0, 10)) { // Process top 10
        const content = `${item.title} ${item.description}`;
        const analysis = this.analyzer.analyzeContent(content);
        
        analyzedItems.push({
          ...item,
          analysis
        });

        // Generate alert if hot
        if (analysis.isHot || analysis.fundingAmount) {
          const briefing = this.analyzer.generateBriefing(analysis, source);
          this.store.saveAlert({
            ...briefing,
            item: {
              title: item.title,
              link: item.link,
              published: item.published
            }
          });
          
          console.log(`  🚨 ALERT: ${briefing.type} - ${item.title.substring(0, 60)}...`);
        }
      }

      // Cache results
      this.store.save(`cache/${source.name.toLowerCase()}`, {
        timestamp: new Date().toISOString(),
        items: analyzedItems
      });

      return analyzedItems;
      
    } catch (error) {
      console.error(`  ❌ Error monitoring ${source.name}:`, error.message);
      return [];
    }
  }

  async monitorAllNews() {
    console.log('\n📰 === NEWS MONITORING ===');
    
    const allSources = [
      ...this.config.sources.cryptoNews,
      ...this.config.sources.startupNews,
      ...this.config.sources.nftNews
    ];

    const results = [];
    for (const source of allSources) {
      const items = await this.monitorNewsSource(source);
      results.push({ source: source.name, items });
    }

    return results;
  }

  // ========================================================================
  // COMPETITOR TRACKING
  // ========================================================================

  async trackCompetitor(competitorName, type) {
    console.log(`🔍 Tracking ${competitorName}...`);
    
    // In production, this would search news, social media, etc.
    // For now, we'll create a snapshot structure
    const snapshot = {
      name: competitorName,
      type: type,
      timestamp: new Date().toISOString(),
      mentions: [],
      activities: [],
      partnerships: [],
      funding: null,
      products: []
    };

    // Search through recent news for mentions
    const cacheFiles = fs.readdirSync(path.join(this.config.paths.data, 'cache'))
      .filter(f => f.endsWith('.json'));

    for (const file of cacheFiles) {
      const data = this.store.load(`cache/${file.replace('.json', '')}`);
      if (data && data.items) {
        for (const item of data.items) {
          const content = `${item.title} ${item.description || ''}`;
          if (content.toLowerCase().includes(competitorName.toLowerCase())) {
            snapshot.mentions.push({
              title: item.title,
              link: item.link,
              published: item.published,
              analysis: item.analysis
            });
          }
        }
      }
    }

    this.store.saveCompetitorSnapshot(competitorName, snapshot);
    
    console.log(`  📊 Found ${snapshot.mentions.length} mentions`);
    
    return snapshot;
  }

  async trackAllCompetitors() {
    console.log('\n🏢 === COMPETITOR TRACKING ===');
    
    const results = [];
    
    for (const [type, companies] of Object.entries(this.config.competitors)) {
      for (const company of companies) {
        const snapshot = await this.trackCompetitor(company, type);
        results.push(snapshot);
      }
    }

    return results;
  }

  // ========================================================================
  // OPPORTUNITY DETECTION
  // ========================================================================

  async scanForOpportunities() {
    console.log('\n💎 === OPPORTUNITY SCAN ===');
    
    const opportunities = [];
    const alerts = this.store.getAlerts();
    
    // Analyze recent alerts for patterns
    const fundingAlerts = alerts.filter(a => a.type === 'FUNDING_ALERT');
    const partnershipAlerts = alerts.filter(a => a.type === 'PARTNERSHIP_OPPORTUNITY');
    
    console.log(`  💰 Funding alerts: ${fundingAlerts.length}`);
    console.log(`  🤝 Partnership alerts: ${partnershipAlerts.length}`);

    // Identify hot sectors with activity
    const sectorActivity = {};
    for (const alert of alerts) {
      if (alert.details && alert.details.sectors) {
        for (const sector of alert.details.sectors) {
          sectorActivity[sector] = (sectorActivity[sector] || 0) + 1;
        }
      }
    }

    const hotSectors = Object.entries(sectorActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log('  🔥 Hot sectors:', hotSectors.map(s => s[0]).join(', '));

    // Generate opportunity report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAlerts: alerts.length,
        fundingAlerts: fundingAlerts.length,
        partnershipAlerts: partnershipAlerts.length,
        hotSectors: hotSectors.map(([name, count]) => ({ name, count }))
      },
      topOpportunities: alerts
        .filter(a => a.priority === 'HIGH')
        .slice(0, 10),
      recommendations: this.generateRecommendations(alerts, hotSectors)
    };

    this.store.save(`reports/opportunity-${new Date().toISOString().split('T')[0]}`, report);
    
    return report;
  }

  generateRecommendations(alerts, hotSectors) {
    const recommendations = [];

    if (hotSectors.length > 0) {
      recommendations.push({
        type: 'SECTOR_FOCUS',
        message: `Consider focusing on ${hotSectors[0][0]} - showing ${hotSectors[0][1]} activities today`,
        priority: 'HIGH'
      });
    }

    const partnershipAlerts = alerts.filter(a => a.type === 'PARTNERSHIP_OPPORTUNITY');
    if (partnershipAlerts.length > 0) {
      recommendations.push({
        type: 'PARTNERSHIP_OUTREACH',
        message: `${partnershipAlerts.length} partnership opportunities detected - review for potential collaboration`,
        priority: 'MEDIUM'
      });
    }

    const fundingAlerts = alerts.filter(a => a.type === 'FUNDING_ALERT');
    if (fundingAlerts.length > 0) {
      recommendations.push({
        type: 'COMPETITIVE_MONITORING',
        message: `${fundingAlerts.length} funding rounds announced - monitor for strategic shifts`,
        priority: 'MEDIUM'
      });
    }

    return recommendations;
  }

  // ========================================================================
  // DASHBOARD & REPORTING
  // ========================================================================

  generateDashboard() {
    console.log('\n📊 === DASHBOARD ===');
    
    const alerts = this.store.getAlerts();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate stats
    const stats = {
      totalAlerts: alerts.length,
      byType: {},
      byPriority: {},
      hotAlerts: alerts.filter(a => a.priority === 'HIGH').length,
      fundingDetected: alerts.filter(a => a.type === 'FUNDING_ALERT').length
    };

    for (const alert of alerts) {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
    }

    // Recent activity
    const recentAlerts = alerts.slice(-5);

    const dashboard = {
      generatedAt: new Date().toISOString(),
      stats,
      recentAlerts,
      competitors: this.getCompetitorSummary(),
      hotOpportunities: alerts.filter(a => a.priority === 'HIGH').slice(0, 5)
    };

    console.log(`  📈 Total alerts today: ${stats.totalAlerts}`);
    console.log(`  🚨 High priority: ${stats.hotAlerts}`);
    console.log(`  💰 Funding alerts: ${stats.fundingDetected}`);
    
    return dashboard;
  }

  getCompetitorSummary() {
    const summary = {};
    
    for (const [type, companies] of Object.entries(this.config.competitors)) {
      summary[type] = companies.map(company => {
        const history = this.store.getCompetitorHistory(company, 1);
        return {
          name: company,
          mentions: history[0]?.mentions?.length || 0,
          lastActivity: history[0]?.timestamp || null
        };
      });
    }
    
    return summary;
  }

  // ========================================================================
  // SCHEDULING & CONTROL
  // ========================================================================

  start() {
    if (this.isRunning) {
      console.log('⚠️ Already running');
      return;
    }

    console.log('\n🚀 Starting Opportunity Radar...');
    this.isRunning = true;

    // Run initial scan
    this.runFullScan();

    // Schedule recurring tasks
    this.schedule('news', this.config.intervals.news, () => this.monitorAllNews());
    this.schedule('competitors', this.config.intervals.competitors, () => this.trackAllCompetitors());
    this.schedule('opportunities', this.config.intervals.opportunities, () => this.scanForOpportunities());
    this.schedule('dashboard', this.config.intervals.opportunities, () => this.generateDashboard());

    console.log('✅ Opportunity Radar is running');
  }

  schedule(name, interval, fn) {
    // Execute immediately
    fn();
    
    // Schedule repeats
    const timer = setInterval(fn, interval);
    this.monitors.set(name, timer);
  }

  stop() {
    console.log('\n🛑 Stopping Opportunity Radar...');
    
    for (const [name, timer] of this.monitors) {
      clearInterval(timer);
      console.log(`  ⏹️ Stopped ${name}`);
    }
    
    this.monitors.clear();
    this.isRunning = false;
    
    console.log('✅ Opportunity Radar stopped');
  }

  async runFullScan() {
    console.log('\n🔍 === FULL SCAN ===');
    
    await this.monitorAllNews();
    await this.trackAllCompetitors();
    await this.scanForOpportunities();
    this.generateDashboard();
    
    console.log('\n✅ Full scan complete');
  }

  // ========================================================================
  // QUERY METHODS
  // ========================================================================

  getAlerts(date = null, filter = {}) {
    let alerts = this.store.getAlerts(date);
    
    if (filter.type) {
      alerts = alerts.filter(a => a.type === filter.type);
    }
    
    if (filter.priority) {
      alerts = alerts.filter(a => a.priority === filter.priority);
    }
    
    if (filter.competitor) {
      alerts = alerts.filter(a => 
        a.details?.competitors?.some(c => 
          c.name.toLowerCase() === filter.competitor.toLowerCase()
        )
      );
    }
    
    return alerts;
  }

  getOpportunities(options = {}) {
    const alerts = this.store.getAlerts();
    
    return alerts
      .filter(a => a.priority === 'HIGH' || a.type === 'PARTNERSHIP_OPPORTUNITY')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, options.limit || 20);
  }

  search(query) {
    const alerts = this.store.getAlerts();
    const lowerQuery = query.toLowerCase();
    
    return alerts.filter(a => 
      a.summary?.toLowerCase().includes(lowerQuery) ||
      a.item?.title?.toLowerCase().includes(lowerQuery) ||
      a.item?.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

// ============================================================================
// EXPORT & CLI
// ============================================================================

module.exports = { OpportunityRadar, CONFIG, DataStore, IntelligenceAnalyzer };

// CLI execution
if (require.main === module) {
  const radar = new OpportunityRadar();
  
  const command = process.argv[2];
  
  (async () => {
    await radar.initialize();
    
    switch (command) {
      case 'start':
        radar.start();
        break;
        
      case 'stop':
        radar.stop();
        process.exit(0);
        break;
        
      case 'scan':
        await radar.runFullScan();
        process.exit(0);
        break;
        
      case 'dashboard':
        const dashboard = radar.generateDashboard();
        console.log('\n📊 Dashboard Data:');
        console.log(JSON.stringify(dashboard, null, 2));
        process.exit(0);
        break;
        
      case 'alerts':
        const alerts = radar.getAlerts();
        console.log('\n🚨 Recent Alerts:');
        console.log(JSON.stringify(alerts.slice(-10), null, 2));
        process.exit(0);
        break;
        
      case 'opportunities':
        const opportunities = radar.getOpportunities();
        console.log('\n💎 Hot Opportunities:');
        console.log(JSON.stringify(opportunities, null, 2));
        process.exit(0);
        break;
        
      case 'search':
        const query = process.argv[3];
        if (!query) {
          console.log('Usage: node opportunity-radar.js search <query>');
          process.exit(1);
        }
        const results = radar.search(query);
        console.log(`\n🔍 Search results for "${query}":`);
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
        break;
        
      default:
        console.log(`
🎯 Opportunity Radar - PIE Intelligence Module

Usage: node opportunity-radar.js <command>

Commands:
  start          Start continuous monitoring
  stop           Stop monitoring (not applicable in CLI mode)
  scan           Run one-time full scan
  dashboard      Generate dashboard report
  alerts         Show recent alerts
  opportunities  Show hot opportunities
  search <query> Search intelligence database

Examples:
  node opportunity-radar.js scan
  node opportunity-radar.js search "Binance partnership"
        `);
        process.exit(0);
    }
  })();
}
