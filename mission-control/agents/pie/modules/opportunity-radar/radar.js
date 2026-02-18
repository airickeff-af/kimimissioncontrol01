/**
 * Opportunity Radar Module
 * 
 * Monitors crypto/NFT/startup news for partnership opportunities
 * Tracks competitor partnerships and market signals
 * 
 * Data Sources:
 * - Crunchbase (funding rounds, company data)
 * - CoinDesk / The Block (crypto news)
 * - Twitter/X (social signals)
 * - Company blogs / press releases
 */

const EventEmitter = require('events');
const axios = require('axios');

class OpportunityRadar extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      crunchbaseApiKey: config.crunchbaseApiKey || process.env.CRUNCHBASE_API_KEY,
      newsApiKey: config.newsApiKey || process.env.NEWS_API_KEY,
      scanInterval: config.scanInterval || 3600000,
      sectors: config.sectors || ['crypto', 'nft', 'gaming', 'payments', 'defi'],
      competitors: config.competitors || ['binance', 'coinbase', 'kraken', 'okx', 'bybit'],
      ...config
    };
    
    this.state = {
      initialized: false,
      scanning: false,
      opportunities: [],
      competitorActivity: new Map(),
      lastScan: null
    };
    
    this.scanTimer = null;
  }
  
  async initialize() {
    console.log('📡 Opportunity Radar: Initializing...');
    this.state.initialized = true;
    return this;
  }
  
  /**
   * Start continuous monitoring
   */
  start(interval = this.config.scanInterval) {
    console.log(`📡 Opportunity Radar: Starting scans every ${interval}ms`);
    
    // Initial scan
    this.scan();
    
    // Schedule recurring scans
    this.scanTimer = setInterval(() => this.scan(), interval);
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    console.log('📡 Opportunity Radar: Stopped');
  }
  
  /**
   * Execute a scan for opportunities
   */
  async scan(options = {}) {
    if (this.state.scanning) {
      console.log('📡 Opportunity Radar: Scan already in progress');
      return;
    }
    
    this.state.scanning = true;
    console.log('📡 Opportunity Radar: Scanning for opportunities...');
    
    try {
      const results = await Promise.all([
        this._scanFundingRounds(options),
        this._scanPartnershipNews(options),
        this._scanProductLaunches(options),
        this._scanCompetitorActivity(options)
      ]);
      
      const allOpportunities = results.flat();
      
      // Filter and score opportunities
      const scoredOpportunities = allOpportunities
        .map(opp => this._scoreOpportunity(opp))
        .filter(opp => opp.score >= 60)
        .sort((a, b) => b.score - a.score);
      
      // Detect new opportunities
      const newOpportunities = scoredOpportunities.filter(opp => 
        !this.state.opportunities.find(existing => existing.id === opp.id)
      );
      
      // Emit events for new opportunities
      for (const opp of newOpportunities) {
        this.emit('opportunity', opp);
      }
      
      // Update state
      this.state.opportunities = scoredOpportunities;
      this.state.lastScan = new Date().toISOString();
      
      console.log(`📡 Opportunity Radar: Found ${newOpportunities.length} new opportunities (${scoredOpportunities.length} total)`);
      
      return scoredOpportunities;
    } catch (err) {
      console.error('📡 Opportunity Radar: Scan error:', err.message);
      throw err;
    } finally {
      this.state.scanning = false;
    }
  }
  
  /**
   * Scan for funding rounds
   */
  async _scanFundingRounds(options = {}) {
    const opportunities = [];
    
    // Target sectors for coins.ph/coins.xyz
    const targetSectors = [
      'cryptocurrency', 'blockchain', 'nft', 'gaming', 
      'payments', 'fintech', 'web3', 'defi'
    ];
    
    try {
      // Simulated funding data (replace with actual Crunchbase API)
      const fundingData = await this._fetchCrunchbaseFunding(targetSectors);
      
      for (const funding of fundingData) {
        opportunities.push({
          id: `funding-${funding.companyId}`,
          type: 'funding_round',
          title: `${funding.companyName} raised ${funding.amount}`,
          company: funding.companyName,
          amount: funding.amount,
          series: funding.series,
          date: funding.announcedDate,
          leadInvestors: funding.leadInvestors,
          description: funding.description,
          sectors: funding.sectors,
          relevance: this._calculateFundingRelevance(funding),
          signals: ['fresh_capital', 'growth_stage', 'investor_backing'],
          action: 'Reach out to explore partnership',
          urgency: funding.amount > '$10M' ? 'high' : 'medium'
        });
      }
    } catch (err) {
      console.error('Error scanning funding rounds:', err.message);
    }
    
    return opportunities;
  }
  
  /**
   * Scan for partnership announcements
   */
  async _scanPartnershipNews(options = {}) {
    const opportunities = [];
    
    try {
      // Search for partnership news
      const queries = [
        'crypto partnership',
        'blockchain collaboration',
        'nft marketplace partnership',
        'gaming crypto integration',
        'payment crypto partnership'
      ];
      
      for (const query of queries) {
        const news = await this._fetchNews(query);
        
        for (const article of news) {
          // Extract company names and partnership details
          const extracted = this._extractPartnershipInfo(article);
          
          if (extracted.companies.length > 0) {
            opportunities.push({
              id: `partnership-${article.hash}`,
              type: 'partnership_announcement',
              title: article.title,
              companies: extracted.companies,
              description: article.description,
              url: article.url,
              publishedAt: article.publishedAt,
              source: article.source,
              relevance: this._calculateNewsRelevance(article, extracted),
              signals: extracted.signals,
              action: 'Analyze partnership model for coins.ph application',
              urgency: 'medium'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error scanning partnership news:', err.message);
    }
    
    return opportunities;
  }
  
  /**
   * Scan for product launches
   */
  async _scanProductLaunches(options = {}) {
    const opportunities = [];
    
    try {
      const queries = [
        'crypto wallet launch',
        'nft platform launch',
        'defi protocol launch',
        'gaming token launch',
        'payment crypto integration'
      ];
      
      for (const query of queries) {
        const news = await this._fetchNews(query);
        
        for (const article of news) {
          const extracted = this._extractProductInfo(article);
          
          opportunities.push({
            id: `product-${article.hash}`,
            type: 'product_launch',
            title: article.title,
            company: extracted.company,
            product: extracted.product,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            relevance: this._calculateProductRelevance(extracted),
            signals: ['new_product', 'market_expansion'],
            action: 'Evaluate integration opportunity',
            urgency: 'medium'
          });
        }
      }
    } catch (err) {
      console.error('Error scanning product launches:', err.message);
    }
    
    return opportunities;
  }
  
  /**
   * Scan competitor activity
   */
  async _scanCompetitorActivity(options = {}) {
    const activity = [];
    
    for (const competitor of this.config.competitors) {
      try {
        const news = await this._fetchNews(`${competitor} partnership`);
        
        for (const article of news) {
          const move = {
            id: `comp-${competitor}-${article.hash}`,
            competitor: competitor,
            type: 'competitor_move',
            title: article.title,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            threat: this._assessThreatLevel(article, competitor)
          };
          
          activity.push(move);
          this.emit('competitor-move', move);
        }
        
        // Store competitor activity
        this.state.competitorActivity.set(competitor, activity.filter(a => a.competitor === competitor));
      } catch (err) {
        console.error(`Error scanning ${competitor}:`, err.message);
      }
    }
    
    return activity;
  }
  
  /**
   * Score an opportunity (0-100)
   */
  _scoreOpportunity(opp) {
    let score = opp.relevance || 50;
    
    // Boost score based on signals
    if (opp.signals?.includes('fresh_capital')) score += 10;
    if (opp.signals?.includes('market_expansion')) score += 8;
    if (opp.signals?.includes('sea_focus')) score += 15; // Southeast Asia focus
    if (opp.signals?.includes('philippines')) score += 20; // Philippines focus
    
    // Urgency bonus
    if (opp.urgency === 'high') score += 10;
    
    // Cap at 100
    score = Math.min(100, score);
    
    return { ...opp, score };
  }
  
  /**
   * Calculate relevance for funding rounds
   */
  _calculateFundingRelevance(funding) {
    let relevance = 50;
    
    // Higher relevance for larger rounds
    const amount = parseFloat(funding.amount?.replace(/[^0-9.]/g, '') || 0);
    if (amount > 50) relevance += 20;
    else if (amount > 10) relevance += 10;
    
    // SEA focus
    if (funding.sectors?.some(s => s.toLowerCase().includes('asia'))) relevance += 15;
    
    return relevance;
  }
  
  /**
   * Calculate relevance for news
   */
  _calculateNewsRelevance(article, extracted) {
    let relevance = 40;
    
    const text = (article.title + ' ' + article.description).toLowerCase();
    
    if (text.includes('philippines')) relevance += 25;
    if (text.includes('southeast asia') || text.includes('sea')) relevance += 15;
    if (text.includes('partnership')) relevance += 10;
    if (text.includes('exchange')) relevance += 8;
    if (text.includes('wallet')) relevance += 8;
    
    return relevance;
  }
  
  /**
   * Calculate relevance for product launches
   */
  _calculateProductRelevance(extracted) {
    let relevance = 45;
    
    if (extracted.category === 'wallet') relevance += 15;
    if (extracted.category === 'payment') relevance += 15;
    if (extracted.category === 'gaming') relevance += 10;
    
    return relevance;
  }
  
  /**
   * Assess threat level of competitor move
   */
  _assessThreatLevel(article, competitor) {
    const text = (article.title + ' ' + article.description).toLowerCase();
    
    if (text.includes('philippines')) return 'high';
    if (text.includes('southeast asia')) return 'medium';
    if (text.includes('partnership') && text.includes('exchange')) return 'medium';
    
    return 'low';
  }
  
  /**
   * Fetch funding data from Crunchbase
   */
  async _fetchCrunchbaseFunding(sectors) {
    // Placeholder - implement actual Crunchbase API integration
    // Returns mock data for demonstration
    return [
      {
        companyName: 'Immutable',
        companyId: 'immutable-x',
        amount: '$200M',
        series: 'Series C',
        announcedDate: '2026-02-15',
        leadInvestors: ['Temasek', 'Animoca Brands'],
        description: 'Gaming-focused blockchain platform',
        sectors: ['gaming', 'nft', 'blockchain']
      },
      {
        companyName: 'TON Foundation',
        companyId: 'ton-foundation',
        amount: '$50M',
        series: 'Grant',
        announcedDate: '2026-02-10',
        leadInvestors: ['Various'],
        description: 'Telegram-integrated blockchain',
        sectors: ['messaging', 'crypto', 'payments']
      }
    ];
  }
  
  /**
   * Fetch news articles
   */
  async _fetchNews(query) {
    // Placeholder - implement actual news API integration
    // Returns mock data for demonstration
    return [
      {
        hash: Buffer.from(query + Date.now()).toString('hex').slice(0, 16),
        title: `${query} announcement`,
        description: `Latest developments in ${query}`,
        url: 'https://example.com/news',
        publishedAt: new Date().toISOString(),
        source: 'CryptoNews'
      }
    ];
  }
  
  /**
   * Extract partnership info from article
   */
  _extractPartnershipInfo(article) {
    // Simple extraction - enhance with NLP
    const text = article.title + ' ' + article.description;
    const companies = [];
    const signals = [];
    
    // Look for company mentions
    const companyPatterns = [
      /(\w+)\s+(?:and|\\\u0026)\s+(\w+)\s+partner/i,
      /(\w+)\s+partners?\s+with\s+(\w+)/i,
      /(\w+)\s+collaborates?\s+with\s+(\w+)/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) {
        companies.push(match[1], match[2]);
      }
    }
    
    if (text.toLowerCase().includes('philippines')) signals.push('philippines');
    if (text.toLowerCase().includes('southeast asia')) signals.push('sea_focus');
    if (text.toLowerCase().includes('expansion')) signals.push('market_expansion');
    
    return { companies: [...new Set(companies)], signals };
  }
  
  /**
   * Extract product info from article
   */
  _extractProductInfo(article) {
    const text = article.title + ' ' + article.description;
    
    let category = 'other';
    if (text.toLowerCase().includes('wallet')) category = 'wallet';
    if (text.toLowerCase().includes('payment')) category = 'payment';
    if (text.toLowerCase().includes('gaming')) category = 'gaming';
    if (text.toLowerCase().includes('nft')) category = 'nft';
    
    // Extract company name (simplified)
    const companyMatch = text.match(/^(\w+)/);
    const company = companyMatch ? companyMatch[1] : 'Unknown';
    
    return { company, category, product: article.title };
  }
  
  /**
   * Get active opportunities
   */
  getActiveOpportunities() {
    return this.state.opportunities.filter(opp => {
      const age = Date.now() - new Date(opp.date || opp.publishedAt).getTime();
      return age < 30 * 24 * 60 * 60 * 1000; // 30 days
    });
  }
  
  /**
   * Get competitor activity
   */
  getCompetitorActivity(competitors = null) {
    if (competitors) {
      return competitors.flatMap(c => this.state.competitorActivity.get(c) || []);
    }
    return Array.from(this.state.competitorActivity.entries());
  }
  
  /**
   * Get module status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      scanning: this.state.scanning,
      opportunitiesCount: this.state.opportunities.length,
      lastScan: this.state.lastScan,
      competitorsTracked: this.config.competitors.length
    };
  }
}

module.exports = OpportunityRadar;
