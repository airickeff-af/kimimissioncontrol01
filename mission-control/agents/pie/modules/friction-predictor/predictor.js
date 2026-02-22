/**
 * Friction Predictor Module
 * 
 * Identifies bottlenecks in outreach workflow
 * Predicts which leads are most likely to respond
 * Flags leads that need more research before contact
 * 
 * ML Model Features:
 * - Lead firmographic data (company size, funding, industry)
 * - Engagement history (opens, clicks, replies)
 * - Communication patterns (timing, channel, content)
 * - Market signals (recent news, hiring, expansion)
 */

const EventEmitter = require('events');

class FrictionPredictor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      minConfidence: config.minConfidence || 0.6,
      responseThreshold: config.responseThreshold || 0.5,
      ...config
    };
    
    this.state = {
      initialized: false,
      leadScores: new Map(),
      bottlenecks: [],
      patterns: {
        timing: new Map(),
        channel: new Map(),
        content: new Map()
      }
    };
    
    // Weight factors for scoring
    this.weights = {
      firmographic: 0.25,
      engagement: 0.30,
      timing: 0.20,
      signals: 0.15,
      history: 0.10
    };
  }
  
  async initialize() {
    
    // Load historical patterns
    await this._loadPatterns();
    
    this.state.initialized = true;
    return this;
  }
  
  /**
   * Score a single lead
   */
  async scoreLead(lead) {
    const features = await this._extractFeatures(lead);
    const prediction = this._predictResponse(features);
    const bottlenecks = this._identifyBottlenecks(lead, features);
    const timing = this._predictOptimalTiming(lead, features);
    
    const result = {
      leadId: lead.id || lead.email || lead.name,
      lead: lead.name || lead.company,
      score: Math.round(prediction.score * 100),
      confidence: prediction.confidence,
      likelihood: this._getLikelihoodLabel(prediction.score),
      factors: prediction.factors,
      bottlenecks: bottlenecks,
      optimalTiming: timing,
      researchNeeded: bottlenecks.length > 0,
      recommendedAction: this._getRecommendedAction(prediction, bottlenecks),
      timestamp: new Date().toISOString()
    };
    
    // Store score
    this.state.leadScores.set(result.leadId, result);
    
    this.emit('lead-scored', result);
    
    return result;
  }
  
  /**
   * Score multiple leads
   */
  async scoreLeads(leads) {
    const results = [];
    
    for (const lead of leads) {
      try {
        const score = await this.scoreLead(lead);
        results.push(score);
      } catch (err) {
        console.error(`Error scoring lead ${lead.id}:`, err.message);
      }
    }
    
    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Extract features from lead data
   */
  async _extractFeatures(lead) {
    const features = {
      firmographic: {},
      engagement: {},
      timing: {},
      signals: {},
      history: {}
    };
    
    // Firmographic features
    features.firmographic = {
      companySize: this._categorizeCompanySize(lead.employees),
      fundingStage: lead.fundingStage || 'unknown',
      industry: lead.industry || 'unknown',
      hasDecisionMaker: !!lead.decisionMaker,
      isCryptoNative: this._isCryptoNative(lead),
      isSEAFocused: this._isSEAFocused(lead),
      isCompetitorPartner: lead.competitorPartnerships?.length > 0
    };
    
    // Engagement features
    features.engagement = {
      emailsSent: lead.emailsSent || 0,
      emailsOpened: lead.emailsOpened || 0,
      emailsReplied: lead.emailsReplied || 0,
      openRate: lead.emailsSent > 0 ? lead.emailsOpened / lead.emailsSent : 0,
      replyRate: lead.emailsSent > 0 ? lead.emailsReplied / lead.emailsSent : 0,
      lastActivity: lead.lastActivity,
      daysSinceContact: lead.lastActivity 
        ? Math.floor((Date.now() - new Date(lead.lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : null
    };
    
    // Timing features
    features.timing = {
      bestDay: this._predictBestDay(lead),
      bestTime: this._predictBestTime(lead),
      timezone: lead.timezone || 'UTC',
      localBusinessHours: this._isLocalBusinessHours(lead.timezone)
    };
    
    // Market signals
    features.signals = {
      recentFunding: lead.recentFunding ? this._daysSince(lead.recentFunding.date) : null,
      recentNews: lead.recentNews ? this._daysSince(lead.recentNews.date) : null,
      hiring: lead.hiringActivity || false,
      expansion: lead.expansionActivity || false,
      newProduct: lead.newProductLaunch || false
    };
    
    // Historical patterns
    features.history = {
      previousOutreach: lead.previousOutreach || [],
      similarCompanies: await this._findSimilarCompanies(lead),
      industryBenchmark: this._getIndustryBenchmark(lead.industry)
    };
    
    return features;
  }
  
  /**
   * Predict response likelihood
   */
  _predictResponse(features) {
    let score = 0.5; // Base probability
    const factors = [];
    
    // Firmographic score
    const firmScore = this._scoreFirmographic(features.firmographic);
    score += firmScore * this.weights.firmographic;
    if (firmScore > 0.3) factors.push('strong_company_profile');
    if (firmScore < 0) factors.push('weak_company_fit');
    
    // Engagement score
    const engScore = this._scoreEngagement(features.engagement);
    score += engScore * this.weights.engagement;
    if (engScore > 0.3) factors.push('high_engagement');
    if (features.engagement.replyRate > 0.2) factors.push('historically_responsive');
    
    // Timing score
    const timeScore = this._scoreTiming(features.timing);
    score += timeScore * this.weights.timing;
    
    // Signals score
    const sigScore = this._scoreSignals(features.signals);
    score += sigScore * this.weights.signals;
    if (sigScore > 0.3) factors.push('positive_market_signals');
    
    // History score
    const histScore = this._scoreHistory(features.history);
    score += histScore * this.weights.history;
    
    // Clamp score
    score = Math.max(0, Math.min(1, score));
    
    // Calculate confidence based on data quality
    const confidence = this._calculateConfidence(features);
    
    return { score, confidence, factors };
  }
  
  /**
   * Score firmographic features
   */
  _scoreFirmographic(firm) {
    let score = 0;
    
    // Company size preference (mid to large)
    if (firm.companySize === 'large') score += 0.3;
    else if (firm.companySize === 'medium') score += 0.2;
    else if (firm.companySize === 'small') score += 0.1;
    
    // Funding stage (growth stages preferred)
    if (['series_b', 'series_c', 'growth'].includes(firm.fundingStage)) score += 0.2;
    else if (['series_a', 'seed'].includes(firm.fundingStage)) score += 0.1;
    
    // Has decision maker identified
    if (firm.hasDecisionMaker) score += 0.2;
    
    // Crypto native bonus
    if (firm.isCryptoNative) score += 0.15;
    
    // SEA focus bonus (high priority market)
    if (firm.isSEAFocused) score += 0.25;
    
    // Competitor partnership (warm signal)
    if (firm.isCompetitorPartner) score += 0.1;
    
    return score;
  }
  
  /**
   * Score engagement features
   */
  _scoreEngagement(eng) {
    let score = 0;
    
    // Open rate
    if (eng.openRate > 0.5) score += 0.2;
    else if (eng.openRate > 0.3) score += 0.1;
    
    // Reply rate (strong signal)
    if (eng.replyRate > 0.3) score += 0.4;
    else if (eng.replyRate > 0.1) score += 0.2;
    
    // Recency (recent activity is good)
    if (eng.daysSinceContact !== null) {
      if (eng.daysSinceContact < 7) score += 0.1;
      else if (eng.daysSinceContact > 30) score -= 0.1;
    }
    
    return score;
  }
  
  /**
   * Score timing features
   */
  _scoreTiming(timing) {
    let score = 0;
    
    // Business hours bonus
    if (timing.localBusinessHours) score += 0.15;
    
    // Tuesday-Thursday preference
    if (['tuesday', 'wednesday', 'thursday'].includes(timing.bestDay)) {
      score += 0.1;
    }
    
    return score;
  }
  
  /**
   * Score market signals
   */
  _scoreSignals(signals) {
    let score = 0;
    
    // Recent funding (within 90 days is hot)
    if (signals.recentFunding !== null && signals.recentFunding < 90) {
      score += 0.3 * (1 - signals.recentFunding / 90);
    }
    
    // Recent news
    if (signals.recentNews !== null && signals.recentNews < 30) {
      score += 0.15;
    }
    
    // Hiring activity (growth signal)
    if (signals.hiring) score += 0.1;
    
    // Expansion
    if (signals.expansion) score += 0.15;
    
    // New product launch
    if (signals.newProduct) score += 0.1;
    
    return score;
  }
  
  /**
   * Score historical patterns
   */
  _scoreHistory(history) {
    let score = 0;
    
    // Similar companies performance
    if (history.similarCompanies.length > 0) {
      const avgResponse = history.similarCompanies.reduce((a, b) => a + b.responseRate, 0) 
        / history.similarCompanies.length;
      score += avgResponse * 0.2;
    }
    
    // Industry benchmark
    if (history.industryBenchmark) {
      score += (history.industryBenchmark - 0.5) * 0.1;
    }
    
    return score;
  }
  
  /**
   * Identify bottlenecks in outreach
   */
  _identifyBottlenecks(lead, features) {
    const bottlenecks = [];
    
    // Missing decision maker
    if (!features.firmographic.hasDecisionMaker) {
      bottlenecks.push({
        type: 'missing_decision_maker',
        severity: 'high',
        description: 'No decision maker identified',
        action: 'Research LinkedIn for VP+ level contacts'
      });
    }
    
    // No recent activity
    if (features.engagement.daysSinceContact === null) {
      bottlenecks.push({
        type: 'no_prior_contact',
        severity: 'medium',
        description: 'No prior outreach recorded',
        action: 'Start with warm introduction or LinkedIn connect'
      });
    }
    
    // Low engagement
    if (features.engagement.openRate < 0.2 && features.engagement.emailsSent > 3) {
      bottlenecks.push({
        type: 'low_engagement',
        severity: 'high',
        description: 'Emails not being opened',
        action: 'Try different subject lines or channel (LinkedIn vs email)'
      });
    }
    
    // No recent signals
    if (!features.signals.recentFunding && !features.signals.recentNews) {
      bottlenecks.push({
        type: 'cold_outreach',
        severity: 'low',
        description: 'No recent news or funding to reference',
        action: 'Research for recent company updates or industry trends'
      });
    }
    
    // Too many attempts
    if (features.engagement.emailsSent > 5 && features.engagement.emailsReplied === 0) {
      bottlenecks.push({
        type: 'over_contact',
        severity: 'high',
        description: 'Multiple emails with no response',
        action: 'Pause outreach for 30 days, try different angle or contact'
      });
    }
    
    // Missing company info
    if (!lead.company || !lead.industry) {
      bottlenecks.push({
        type: 'incomplete_data',
        severity: 'medium',
        description: 'Incomplete company information',
        action: 'Enrich lead data from Crunchbase/LinkedIn'
      });
    }
    
    return bottlenecks;
  }
  
  /**
   * Predict optimal outreach timing
   */
  _predictOptimalTiming(lead, features) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Best days: Tuesday-Thursday
    const bestDays = ['tuesday', 'wednesday', 'thursday'];
    
    // Best times: 10-11am, 2-4pm local time
    const bestTimes = ['10:00', '14:00', '15:00'];
    
    // Adjust for timezone
    const timezone = lead.timezone || 'Asia/Manila'; // Default to Philippines
    
    return {
      bestDays,
      bestTimes,
      timezone,
      nextOptimal: this._calculateNextOptimal(bestDays, bestTimes, timezone),
      avoid: ['monday_morning', 'friday_afternoon', 'weekend']
    };
  }
  
  /**
   * Calculate next optimal outreach time
   */
  _calculateNextOptimal(days, times, timezone) {
    const now = new Date();
    const next = new Date(now);
    
    // Simple logic: next Tuesday-Thursday at 10am
    let dayOffset = 0;
    const currentDay = now.getDay();
    
    // Map days to numbers
    const dayMap = { tuesday: 2, wednesday: 3, thursday: 4 };
    const targetDays = [2, 3, 4]; // Tue, Wed, Thu
    
    // Find next target day
    for (let i = 1; i <= 7; i++) {
      if (targetDays.includes((currentDay + i) % 7)) {
        dayOffset = i;
        break;
      }
    }
    
    next.setDate(now.getDate() + dayOffset);
    next.setHours(10, 0, 0, 0);
    
    return next.toISOString();
  }
  
  /**
   * Get likelihood label
   */
  _getLikelihoodLabel(score) {
    if (score >= 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }
  
  /**
   * Get recommended action based on prediction
   */
  _getRecommendedAction(prediction, bottlenecks) {
    if (bottlenecks.some(b => b.severity === 'high')) {
      return 'research_before_contact';
    }
    
    if (prediction.score >= 0.7) {
      return 'contact_immediately';
    }
    
    if (prediction.score >= 0.5) {
      return 'contact_with_personalization';
    }
    
    return 'nurture_before_contact';
  }
  
  /**
   * Calculate confidence based on data quality
   */
  _calculateConfidence(features) {
    let confidence = 0.5;
    
    // More data = higher confidence
    if (features.firmographic.hasDecisionMaker) confidence += 0.1;
    if (features.engagement.emailsSent > 0) confidence += 0.1;
    if (features.signals.recentFunding !== null) confidence += 0.1;
    if (features.history.similarCompanies.length > 0) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }
  
  /**
   * Helper: Categorize company size
   */
  _categorizeCompanySize(employees) {
    if (!employees) return 'unknown';
    if (employees < 50) return 'small';
    if (employees < 500) return 'medium';
    return 'large';
  }
  
  /**
   * Helper: Check if crypto native
   */
  _isCryptoNative(lead) {
    const cryptoKeywords = ['crypto', 'blockchain', 'web3', 'nft', 'defi', 'bitcoin', 'ethereum'];
    const text = `${lead.industry || ''} ${lead.description || ''}`.toLowerCase();
    return cryptoKeywords.some(kw => text.includes(kw));
  }
  
  /**
   * Helper: Check if SEA focused
   */
  _isSEAFocused(lead) {
    const seaKeywords = ['philippines', 'singapore', 'thailand', 'vietnam', 'indonesia', 
                         'malaysia', 'southeast asia', 'sea', 'asean'];
    const text = `${lead.description || ''} ${lead.location || ''}`.toLowerCase();
    return seaKeywords.some(kw => text.includes(kw));
  }
  
  /**
   * Helper: Predict best day
   */
  _predictBestDay(lead) {
    // Based on historical patterns
    return 'tuesday'; // Default, would use ML model
  }
  
  /**
   * Helper: Predict best time
   */
  _predictBestTime(lead) {
    return '10:00'; // Default
  }
  
  /**
   * Helper: Check if local business hours
   */
  _isLocalBusinessHours(timezone) {
    // Simplified check
    return true;
  }
  
  /**
   * Helper: Calculate days since date
   */
  _daysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Helper: Find similar companies
   */
  async _findSimilarCompanies(lead) {
    // Would query database for similar companies
    return [];
  }
  
  /**
   * Helper: Get industry benchmark
   */
  _getIndustryBenchmark(industry) {
    const benchmarks = {
      'crypto': 0.35,
      'fintech': 0.28,
      'gaming': 0.25,
      'payments': 0.30,
      'default': 0.20
    };
    return benchmarks[industry?.toLowerCase()] || benchmarks.default;
  }
  
  /**
   * Load historical patterns
   */
  async _loadPatterns() {
    // Load from disk or database
  }
  
  /**
   * Get all bottlenecks
   */
  getBottlenecks() {
    return this.state.bottlenecks;
  }
  
  /**
   * Get lead score
   */
  getLeadScore(leadId) {
    return this.state.leadScores.get(leadId);
  }
  
  /**
   * Get all lead scores
   */
  getAllLeadScores() {
    return Array.from(this.state.leadScores.entries());
  }
  
  /**
   * Get module status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      leadsScored: this.state.leadScores.size,
      bottlenecksDetected: this.state.bottlenecks.length
    };
  }
}

module.exports = FrictionPredictor;
