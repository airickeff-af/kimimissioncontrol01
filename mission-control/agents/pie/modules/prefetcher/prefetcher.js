/**
 * Context-Aware Pre-fetcher Module
 * 
 * Auto-researches leads before meetings
 * Prepares briefing docs with company info, recent news, decision-maker background
 * Suggests talking points based on lead's interests
 * 
 * Data Sources:
 * - Crunchbase (company data, funding, key people)
 * - LinkedIn (decision-maker profiles)
 * - Company websites (about pages, press releases)
 * - News APIs (recent coverage)
 * - Twitter/X (social signals)
 */

const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class Prefetcher extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dataDir: config.dataDir || path.join(__dirname, '../../data'),
      crunchbaseApiKey: config.crunchbaseApiKey || process.env.CRUNCHBASE_API_KEY,
      linkedinToken: config.linkedinToken || process.env.LINKEDIN_TOKEN,
      newsApiKey: config.newsApiKey || process.env.NEWS_API_KEY,
      briefingTemplate: config.briefingTemplate || 'default',
      ...config
    };
    
    this.state = {
      initialized: false,
      cache: new Map(),
      briefings: new Map()
    };
    
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  async initialize() {
    console.log('📚 Pre-fetcher: Initializing...');
    
    // Ensure briefing directory exists
    await fs.mkdir(path.join(this.config.dataDir, 'briefings'), { recursive: true });
    
    this.state.initialized = true;
    return this;
  }
  
  /**
   * Generate comprehensive briefing for a lead
   */
  async generateBriefing(leadId, options = {}) {
    console.log(`📚 Pre-fetcher: Generating briefing for ${leadId}...`);
    
    // Get lead data
    const lead = await this._getLeadData(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    // Gather intelligence
    const [companyIntel, newsIntel, peopleIntel, competitorIntel] = await Promise.all([
      this._researchCompany(lead),
      this._researchNews(lead),
      this._researchPeople(lead),
      this._researchCompetitors(lead)
    ]);
    
    // Generate talking points
    const talkingPoints = this._generateTalkingPoints(lead, companyIntel, newsIntel);
    
    // Build briefing document
    const briefing = {
      id: `briefing-${leadId}-${Date.now()}`,
      leadId: leadId,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.cacheTTL).toISOString(),
      
      // Executive Summary
      executiveSummary: {
        company: lead.company,
        decisionMaker: lead.decisionMaker,
        relevanceScore: lead.relevanceScore || 'N/A',
        keyInsight: this._extractKeyInsight(companyIntel, newsIntel),
        recommendedApproach: this._getRecommendedApproach(lead, companyIntel)
      },
      
      // Company Intelligence
      company: {
        name: companyIntel.name || lead.company,
        description: companyIntel.description,
        founded: companyIntel.founded,
        employees: companyIntel.employees,
        headquarters: companyIntel.headquarters,
        website: companyIntel.website,
        industry: companyIntel.industry,
        stage: companyIntel.fundingStage,
        totalFunding: companyIntel.totalFunding,
        valuation: companyIntel.valuation,
        investors: companyIntel.investors,
        competitors: companyIntel.competitors,
        recentMilestones: companyIntel.milestones
      },
      
      // Recent News
      news: {
        latest: newsIntel.latest,
        funding: newsIntel.funding,
        partnerships: newsIntel.partnerships,
        productLaunches: newsIntel.products,
        hiring: newsIntel.hiring,
        sentiment: newsIntel.sentiment
      },
      
      // Decision Maker Profile
      decisionMaker: peopleIntel.decisionMaker ? {
        name: peopleIntel.decisionMaker.name,
        title: peopleIntel.decisionMaker.title,
        background: peopleIntel.decisionMaker.background,
        previousCompanies: peopleIntel.decisionMaker.previousCompanies,
        education: peopleIntel.decisionMaker.education,
        interests: peopleIntel.decisionMaker.interests,
        recentActivity: peopleIntel.decisionMaker.recentActivity,
        mutualConnections: peopleIntel.decisionMaker.mutualConnections,
        personalityInsights: peopleIntel.decisionMaker.insights
      } : null,
      
      // Talking Points
      talkingPoints: {
        opening: talkingPoints.opening,
        valueProposition: talkingPoints.valueProposition,
        partnershipAngles: talkingPoints.angles,
        objectionHandlers: talkingPoints.objections,
        nextSteps: talkingPoints.nextSteps,
        questionsToAsk: talkingPoints.questions
      },
      
      // Competitor Context
      competitors: competitorIntel,
      
      // coins.ph/coins.xyz Context
      ourPosition: {
        relevantPartnerships: this._getRelevantPartnerships(lead),
        marketAdvantages: this._getMarketAdvantages(lead),
        caseStudies: this._getRelevantCaseStudies(lead)
      }
    };
    
    // Save briefing
    await this._saveBriefing(briefing);
    
    this.state.briefings.set(briefing.id, briefing);
    this.emit('briefing-ready', briefing);
    
    console.log(`📚 Pre-fetcher: Briefing generated - ${briefing.id}`);
    
    return briefing;
  }
  
  /**
   * Enrich lead data from external sources
   */
  async enrichLead(lead) {
    console.log(`📚 Pre-fetcher: Enriching lead ${lead.id || lead.email}...`);
    
    const enriched = { ...lead };
    
    // Company enrichment
    if (lead.company) {
      const companyData = await this._fetchCrunchbaseCompany(lead.company);
      if (companyData) {
        enriched.companyData = companyData;
        enriched.industry = enriched.industry || companyData.industry;
        enriched.employees = enriched.employees || companyData.employees;
        enriched.fundingStage = enriched.fundingStage || companyData.stage;
        enriched.location = enriched.location || companyData.location;
      }
    }
    
    // Person enrichment
    if (lead.decisionMaker?.linkedin) {
      const personData = await this._fetchLinkedInProfile(lead.decisionMaker.linkedin);
      if (personData) {
        enriched.decisionMaker = { ...enriched.decisionMaker, ...personData };
      }
    }
    
    // Recent signals
    enriched.signals = await this._detectSignals(lead);
    
    return enriched;
  }
  
  /**
   * Research company data
   */
  async _researchCompany(lead) {
    const cacheKey = `company-${lead.company}`;
    
    // Check cache
    if (this.state.cache.has(cacheKey)) {
      const cached = this.state.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }
    
    // Fetch from Crunchbase
    const data = await this._fetchCrunchbaseCompany(lead.company);
    
    // Cache result
    this.state.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data || this._getDefaultCompanyData(lead);
  }
  
  /**
   * Research recent news
   */
  async _researchNews(lead) {
    const queries = [
      lead.company,
      `${lead.company} funding`,
      `${lead.company} partnership`,
      `${lead.company} crypto blockchain`
    ];
    
    const allNews = [];
    
    for (const query of queries) {
      try {
        const news = await this._fetchNews(query);
        allNews.push(...news);
      } catch (err) {
        console.error(`Error fetching news for ${query}:`, err.message);
      }
    }
    
    // Deduplicate and categorize
    const unique = [...new Map(allNews.map(n => [n.url, n])).values()];
    
    return {
      latest: unique.slice(0, 5),
      funding: unique.filter(n => n.category === 'funding'),
      partnerships: unique.filter(n => n.category === 'partnership'),
      products: unique.filter(n => n.category === 'product'),
      hiring: unique.filter(n => n.category === 'hiring'),
      sentiment: this._analyzeSentiment(unique)
    };
  }
  
  /**
   * Research key people
   */
  async _researchPeople(lead) {
    const result = { decisionMaker: null, team: [] };
    
    if (lead.decisionMaker) {
      result.decisionMaker = await this._researchPerson(lead.decisionMaker);
    }
    
    return result;
  }
  
  /**
   * Research a specific person
   */
  async _researchPerson(person) {
    // Try LinkedIn first
    if (person.linkedin) {
      const linkedinData = await this._fetchLinkedInProfile(person.linkedin);
      if (linkedinData) return linkedinData;
    }
    
    // Fallback to general web search
    const searchData = await this._searchPerson(person.name, person.company);
    
    return {
      name: person.name,
      title: person.title,
      ...searchData
    };
  }
  
  /**
   * Research competitor landscape
   */
  async _researchCompetitors(lead) {
    if (!lead.company) return [];
    
    // Get competitors from company data
    const company = await this._fetchCrunchbaseCompany(lead.company);
    const competitors = company?.competitors || [];
    
    // Enhance with recent activity
    const enhanced = [];
    for (const competitor of competitors.slice(0, 5)) {
      const activity = await this._fetchNews(competitor.name);
      enhanced.push({
        name: competitor.name,
        recentActivity: activity.slice(0, 3),
        threat: this._assessCompetitorThreat(competitor, activity)
      });
    }
    
    return enhanced;
  }
  
  /**
   * Generate talking points
   */
  _generateTalkingPoints(lead, companyIntel, newsIntel) {
    const points = {
      opening: [],
      valueProposition: [],
      angles: [],
      objections: [],
      nextSteps: [],
      questions: []
    };
    
    // Opening hooks based on recent news
    if (newsIntel.funding.length > 0) {
      const funding = newsIntel.funding[0];
      points.opening.push(
        `Congratulations on the ${funding.amount} ${funding.round} - exciting times for ${lead.company}!`
      );
    }
    
    if (newsIntel.partnerships.length > 0) {
      const partnership = newsIntel.partnerships[0];
      points.opening.push(
        `I saw the recent partnership with ${partnership.partner} - great strategic move!`
      );
    }
    
    // Value propositions
    points.valueProposition = [
      `Access to 18.6M registered users in the Philippines - ${this._getMarketContext(lead)}`,
      `75-80% market share in PHP-to-stablecoin liquidity`,
      `BSP-licensed platform with strong regulatory standing`,
      `Proven track record with partners like Circle, Veem, and Ronin`
    ];
    
    // Partnership angles
    points.angles = this._getPartnershipAngles(lead, companyIntel);
    
    // Objection handlers
    points.objections = [
      {
        objection: 'We\'re already working with another exchange',
        response: 'Many of our partners work with multiple exchanges. Our 75% market share in PHP liquidity and BSP license offers unique advantages for Philippines-focused strategies.'
      },
      {
        objection: 'The Philippines market is too small',
        response: 'With 18.6M users and ₱6 trillion market cap, the Philippines ranks 9th globally in crypto adoption. It\'s a high-growth, mobile-first market.'
      },
      {
        objection: 'We need more time to evaluate',
        response: 'I understand. Would it help if I connected you with ${this._getReferencePartner()} to hear about their experience?'
      }
    ];
    
    // Next steps
    points.nextSteps = [
      'Schedule technical integration call with our dev team',
      'Introduce to our Philippines market lead',
      'Share case study from similar partnership',
      'Invite to upcoming Web3 Philippines event'
    ];
    
    // Questions to ask
    points.questions = [
      `What\'s your current strategy for Southeast Asia expansion?`,
      `Are you exploring stablecoin integration for payments?`,
      `What\'s your timeline for Philippines market entry?`,
      `Who else are you considering for this partnership?`
    ];
    
    return points;
  }
  
  /**
   * Get partnership angles based on lead type
   */
  _getPartnershipAngles(lead, companyIntel) {
    const angles = [];
    
    // Gaming/GameFi angle
    if (companyIntel.industry?.toLowerCase().includes('gaming')) {
      angles.push({
        title: 'GameFi Payments',
        description: 'Enable PHPC payments for in-game assets and NFTs',
        relevance: 'Philippines has strong GameFi history (Axie Infinity)',
        example: 'Ronin Network partnership - 600K+ QRPH merchants'
      });
    }
    
    // Exchange angle
    if (companyIntel.category === 'exchange') {
      angles.push({
        title: 'Cross-Liquidity',
        description: 'Shared liquidity pools for PHP trading pairs',
        relevance: 'Access to 75-80% of PHP stablecoin market',
        example: 'HashKey partnership with INDODAX'
      });
    }
    
    // Payment processor angle
    if (companyIntel.category === 'payments') {
      angles.push({
        title: 'Crypto-Fiat Bridge',
        description: 'PHP on-ramp/off-ramp integration',
        relevance: '$38B remittance market, 3% YoY growth',
        example: 'Veem partnership for North America→Philippines'
      });
    }
    
    // NFT/Metaverse angle
    if (companyIntel.category === 'nft' || companyIntel.category === 'metaverse') {
      angles.push({
        title: 'NFT Marketplace Integration',
        description: 'PHPC for NFT purchases and creator payments',
        relevance: 'Growing creator economy in Philippines',
        example: 'The Sandbox, Animoca Brands partnerships'
      });
    }
    
    // Infrastructure angle
    if (companyIntel.category === 'infrastructure') {
      angles.push({
        title: 'Technical Integration',
        description: 'Wallet integration, API access, developer tools',
        relevance: '18.6M users need seamless infrastructure',
        example: 'MetaMask, WalletConnect integrations'
      });
    }
    
    return angles;
  }
  
  /**
   * Extract key insight from research
   */
  _extractKeyInsight(companyIntel, newsIntel) {
    if (newsIntel.funding.length > 0) {
      return `Recently raised ${newsIntel.funding[0].amount} - likely in expansion mode`;
    }
    
    if (newsIntel.partnerships.length > 0) {
      return `Active partnership strategy - ${newsIntel.partnerships.length} recent deals`;
    }
    
    if (companyIntel.milestones?.length > 0) {
      return companyIntel.milestones[0].description;
    }
    
    return 'Standard outreach approach recommended';
  }
  
  /**
   * Get recommended approach
   */
  _getRecommendedApproach(lead, companyIntel) {
    if (companyIntel.fundingStage === 'series_a' || companyIntel.fundingStage === 'seed') {
      return 'Emphasize growth support and market access';
    }
    
    if (companyIntel.employees > 500) {
      return 'Focus on enterprise solutions and compliance';
    }
    
    if (lead.competitorPartnerships?.length > 0) {
      return 'Reference competitor partnerships, differentiate on Philippines focus';
    }
    
    return 'Standard value proposition with personalization';
  }
  
  /**
   * Get relevant partnerships for context
   */
  _getRelevantPartnerships(lead) {
    // Return partnerships relevant to this lead's industry
    const allPartnerships = [
      { partner: 'Circle', type: 'Stablecoin', date: '2026-02' },
      { partner: 'Veem', type: 'Remittance', date: '2026-01' },
      { partner: 'Ronin Network', type: 'Gaming', date: '2025-12' },
      { partner: 'HashKey', type: 'Exchange', date: '2025-11' },
      { partner: 'Immutable X', type: 'Gaming', date: '2025-10' }
    ];
    
    // Filter by relevance
    return allPartnerships.slice(0, 3);
  }
  
  /**
   * Get market advantages
   */
  _getMarketAdvantages(lead) {
    return [
      '18.6M registered users (Philippines #1 crypto wallet)',
      '75-80% market share in PHP-to-stablecoin',
      'BSP Virtual Currency Exchange license',
      '600K+ QRPH merchant network',
      '$38B remittance market access'
    ];
  }
  
  /**
   * Get relevant case studies
   */
  _getRelevantCaseStudies(lead) {
    return [
      {
        partner: 'Circle',
        result: 'PHPC stablecoin launch with enterprise payments integration',
        relevance: 'Stablecoin partnerships'
      },
      {
        partner: 'Veem',
        result: 'Expanded to North America→Philippines corridor',
        relevance: 'Cross-border payments'
      },
      {
        partner: 'Ronin',
        result: 'Connecting gaming wallet to 600K+ merchants',
        relevance: 'GameFi integration'
      }
    ];
  }
  
  /**
   * Get market context string
   */
  _getMarketContext(lead) {
    if (this._isGamingCompany(lead)) {
      return 'the Philippines is the birthplace of Axie Infinity and GameFi adoption';
    }
    if (this._isPaymentCompany(lead)) {
      return 'the Philippines has a $38B remittance market with 3% YoY growth';
    }
    return 'the Philippines ranks 9th globally in crypto adoption';
  }
  
  /**
   * Get reference partner for social proof
   */
  _getReferencePartner() {
    const partners = ['Circle', 'Veem', 'HashKey', 'Ronin Network'];
    return partners[Math.floor(Math.random() * partners.length)];
  }
  
  /**
   * Detect market signals
   */
  async _detectSignals(lead) {
    const signals = [];
    
    const news = await this._fetchNews(lead.company);
    
    if (news.some(n => n.category === 'funding')) {
      signals.push('recent_funding');
    }
    
    if (news.some(n => n.category === 'expansion')) {
      signals.push('expansion');
    }
    
    if (news.some(n => n.category === 'hiring')) {
      signals.push('hiring');
    }
    
    return signals;
  }
  
  /**
   * Analyze sentiment of news
   */
  _analyzeSentiment(news) {
    // Simplified sentiment analysis
    const positive = news.filter(n => 
      /raise|launch|partner|growth|expand/i.test(n.title)
    ).length;
    
    const negative = news.filter(n => 
      /layoff|shutdown|hack|loss/i.test(n.title)
    ).length;
    
    if (positive > negative * 2) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }
  
  /**
   * Assess competitor threat level
   */
  _assessCompetitorThreat(competitor, activity) {
    const hasPhilippinesActivity = activity.some(a => 
      /philippines|sea|southeast asia/i.test(a.title)
    );
    
    if (hasPhilippinesActivity) return 'high';
    if (activity.length > 5) return 'medium';
    return 'low';
  }
  
  /**
   * Check if gaming company
   */
  _isGamingCompany(lead) {
    const gamingKeywords = ['game', 'gaming', 'play', 'nft', 'metaverse'];
    const text = `${lead.industry || ''} ${lead.description || ''}`.toLowerCase();
    return gamingKeywords.some(k => text.includes(k));
  }
  
  /**
   * Check if payment company
   */
  _isPaymentCompany(lead) {
    const paymentKeywords = ['payment', 'remittance', 'transfer', 'pay'];
    const text = `${lead.industry || ''} ${lead.description || ''}`.toLowerCase();
    return paymentKeywords.some(k => text.includes(k));
  }
  
  /**
   * Fetch from Crunchbase
   */
  async _fetchCrunchbaseCompany(companyName) {
    // Placeholder - implement actual API call
    return null;
  }
  
  /**
   * Fetch from LinkedIn
   */
  async _fetchLinkedInProfile(url) {
    // Placeholder - implement actual API call
    return null;
  }
  
  /**
   * Fetch news
   */
  async _fetchNews(query) {
    // Placeholder - implement actual API call
    return [];
  }
  
  /**
   * Search for person
   */
  async _searchPerson(name, company) {
    // Placeholder
    return {};
  }
  
  /**
   * Get lead data
   */
  async _getLeadData(leadId) {
    // Would fetch from DealFlow or database
    return { id: leadId, company: leadId };
  }
  
  /**
   * Save briefing to disk
   */
  async _saveBriefing(briefing) {
    const filepath = path.join(
      this.config.dataDir, 
      'briefings', 
      `${briefing.leadId}-${Date.now()}.json`
    );
    await fs.writeFile(filepath, JSON.stringify(briefing, null, 2));
  }
  
  /**
   * Get default company data
   */
  _getDefaultCompanyData(lead) {
    return {
      name: lead.company,
      description: 'Company information pending',
      industry: lead.industry || 'Unknown'
    };
  }
  
  /**
   * Get recent briefings
   */
  async getRecentBriefings(limit = 5) {
    return Array.from(this.state.briefings.values())
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(0, limit);
  }
  
  /**
   * Get module status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      cacheSize: this.state.cache.size,
      briefingsGenerated: this.state.briefings.size
    };
  }
}

module.exports = Prefetcher;
