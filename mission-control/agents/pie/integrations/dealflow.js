/**
 * DealFlow Integration Module - Enhanced for PIE Sprint
 * 
 * Bidirectional sync between PIE and DealFlow
 * - PIE enriches DealFlow leads with intelligence
 * - DealFlow provides lead data to PIE
 * - Opportunities flow both ways
 * - Real-time enrichment with lead scores, timing, and briefings
 * 
 * @version 2.0.0 - PIE Sprint Enhancement
 * @date 2026-02-20
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class DealFlowIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dataDir: config.dataDir || path.join(__dirname, '..', 'data'),
      dealflowPath: config.dealflowPath || path.join(__dirname, '../../dealflow'),
      syncInterval: config.syncInterval || 300000, // 5 minutes
      ...config
    };
    
    this.state = {
      initialized: false,
      lastSync: null,
      syncStatus: 'idle',
      leadsCache: new Map(),
      opportunitiesCache: new Map(),
      enrichedLeads: new Map()
    };
    
    this.syncTimer = null;
  }
  
  async initialize() {
    
    // Ensure data directory exists
    await fs.mkdir(path.join(this.config.dataDir, 'sync'), { recursive: true });
    
    // Load sync state
    await this._loadSyncState();
    
    this.state.initialized = true;
    
    return this;
  }
  
  /**
   * Start continuous sync
   */
  start() {
    
    // Initial sync
    this.sync();
    
    // Schedule recurring sync
    this.syncTimer = setInterval(() => this.sync(), this.config.syncInterval);
  }
  
  /**
   * Stop sync
   */
  stop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Perform bidirectional sync
   */
  async sync() {
    if (this.state.syncStatus === 'syncing') {
      return;
    }
    
    this.state.syncStatus = 'syncing';
    
    try {
      // Pull leads from DealFlow
      const dealflowLeads = await this._pullLeads();
      
      // Enrich leads with PIE intelligence
      await this._enrichLeads(dealflowLeads);
      
      // Push PIE intelligence to DealFlow
      await this._pushIntelligence();
      
      // Sync opportunities
      await this._syncOpportunities();
      
      // Update cache
      for (const lead of dealflowLeads) {
        this.state.leadsCache.set(lead.id, lead);
      }
      
      this.state.lastSync = new Date().toISOString();
      this.state.syncStatus = 'idle';
      
      
      this.emit('sync-complete', {
        leadsSynced: dealflowLeads.length,
        enrichedCount: this.state.enrichedLeads.size,
        timestamp: this.state.lastSync
      });
      
    } catch (err) {
      this.state.syncStatus = 'error';
      console.error('🔗 DealFlow Integration: Sync error:', err.message);
      this.emit('sync-error', err);
    }
  }
  
  /**
   * Pull leads from DealFlow
   */
  async _pullLeads() {
    // Read from PIE leads data (which serves as DealFlow source)
    try {
      const leadsPath = path.join(this.config.dataDir, 'leads.json');
      const data = await fs.readFile(leadsPath, 'utf8');
      const leads = JSON.parse(data);
      return Array.isArray(leads) ? leads : [];
    } catch (err) {
      return [];
    }
  }
  
  /**
   * Enrich leads with PIE intelligence
   */
  async _enrichLeads(leads) {
    // Load friction analysis
    let frictionData = null;
    try {
      const frictionPath = path.join(this.config.dataDir, 'friction-analysis.json');
      const data = await fs.readFile(frictionPath, 'utf8');
      frictionData = JSON.parse(data);
    } catch (err) {
    }
    
    // Load opportunities
    let opportunities = [];
    try {
      const oppPath = path.join(this.config.dataDir, 'opportunities-live.json');
      const data = await fs.readFile(oppPath, 'utf8');
      opportunities = JSON.parse(data);
    } catch (err) {
    }
    
    // Enrich each lead
    for (const lead of leads) {
      const enrichment = {
        leadId: lead.id,
        enrichedAt: new Date().toISOString(),
        scores: null,
        optimalTiming: null,
        frictionAlerts: [],
        relatedOpportunities: [],
        marketSentiment: null,
        recommendedAction: null,
        outreachTiming: null,
        industryTrends: [],
        competitorMentions: []
      };
      
      // Add PIE scores
      if (frictionData?.leadScores) {
        const scoreData = frictionData.leadScores.find(s => s.leadId === lead.id);
        if (scoreData) {
          enrichment.scores = {
            overall: scoreData.score,
            confidence: scoreData.confidence,
            likelihood: scoreData.likelihood,
            factors: scoreData.factors
          };
          enrichment.optimalTiming = scoreData.optimalTiming;
          enrichment.recommendedAction = scoreData.recommendedAction;
        }
      }
      
      // Add friction alerts for this lead
      if (frictionData?.frictionAlerts) {
        enrichment.frictionAlerts = frictionData.frictionAlerts.filter(
          a => a.leadId === lead.id
        );
      }
      
      // Find related opportunities
      enrichment.relatedOpportunities = opportunities.filter(opp => {
        const oppText = `${opp.title} ${opp.description}`.toLowerCase();
        const companyName = lead.company?.toLowerCase() || '';
        const industry = lead.industry?.toLowerCase() || '';
        return oppText.includes(companyName) || 
               oppText.includes(industry) ||
               opp.signals?.some(s => lead.signals?.includes(s));
      }).slice(0, 3);
      
      // Add market sentiment
      enrichment.marketSentiment = this._calculateMarketSentiment(lead, opportunities);
      
      // Add industry trends
      enrichment.industryTrends = this._getIndustryTrends(lead.industry);
      
      // Add competitor mentions
      enrichment.competitorMentions = opportunities
        .filter(opp => opp.type === 'competitor_move')
        .filter(opp => {
          const text = `${opp.title} ${opp.description}`.toLowerCase();
          return text.includes(lead.industry?.toLowerCase() || '');
        })
        .slice(0, 2);
      
      // Calculate outreach timing
      enrichment.outreachTiming = this._calculateOutreachTiming(enrichment);
      
      this.state.enrichedLeads.set(lead.id, enrichment);
    }
    
    // Save enriched leads
    const enrichedPath = path.join(this.config.dataDir, 'enriched-leads.json');
    await fs.writeFile(
      enrichedPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        leads: Array.from(this.state.enrichedLeads.entries()).map(([id, data]) => ({
          leadId: id,
          ...data
        }))
      }, null, 2)
    );
    
  }
  
  /**
   * Calculate market sentiment for a lead
   */
  _calculateMarketSentiment(lead, opportunities) {
    const relevantOpps = opportunities.filter(opp => {
      const text = `${opp.title} ${opp.description}`.toLowerCase();
      return text.includes(lead.industry?.toLowerCase() || '');
    });
    
    if (relevantOpps.length === 0) return 'neutral';
    
    const avgScore = relevantOpps.reduce((sum, o) => sum + (o.score || 50), 0) / relevantOpps.length;
    
    if (avgScore >= 80) return 'very_positive';
    if (avgScore >= 60) return 'positive';
    if (avgScore >= 40) return 'neutral';
    return 'cautious';
  }
  
  /**
   * Get industry trends
   */
  _getIndustryTrends(industry) {
    const trends = {
      'Cryptocurrency Exchange': [
        'Increasing regulatory clarity in SEA',
        'Institutional adoption accelerating',
        'Payment integration becoming standard'
      ],
      'Gaming Blockchain': [
        'Mobile gaming dominance in Philippines',
        'Play-to-earn models evolving',
        'Major studios entering Web3'
      ],
      'Web3 Gaming Investment': [
        'Portfolio diversification trend',
        'Focus on sustainable tokenomics',
        'Asia-Pacific market growth'
      ],
      'Layer 1 Blockchain': [
        'Telegram ecosystem expansion',
        'Mobile-first adoption',
        'Mini-app economy growth'
      ],
      'Decentralized Gaming': [
        'GalaChain migration ongoing',
        'Node operator programs popular',
        'Cross-chain interoperability focus'
      ],
      'Fiat-Crypto Payment Gateway': [
        'PHP on-ramp demand increasing',
        'Banking partnerships critical',
        'Remittance use cases growing'
      ]
    };
    
    return trends[industry] || ['Market expansion opportunities', 'Partnership potential high'];
  }
  
  /**
   * Calculate optimal outreach timing
   */
  _calculateOutreachTiming(enrichment) {
    const now = new Date();
    const optimal = enrichment.optimalTiming;
    
    if (!optimal) return null;
    
    // Find next optimal time
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    let nextOptimal = null;
    let daysUntil = 0;
    
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayName = days[checkDay];
      
      if (optimal.bestDays.includes(dayName)) {
        if (i === 0 && currentHour < 10) {
          // Today, but before optimal time
          nextOptimal = new Date(now);
          nextOptimal.setHours(10, 0, 0, 0);
        } else if (i > 0) {
          // Future day
          nextOptimal = new Date(now);
          nextOptimal.setDate(now.getDate() + i);
          nextOptimal.setHours(10, 0, 0, 0);
        }
        daysUntil = i;
        break;
      }
    }
    
    return {
      nextOptimal: nextOptimal?.toISOString(),
      daysUntil,
      bestDays: optimal.bestDays,
      bestTimes: optimal.bestTimes,
      timezone: optimal.timezone,
      urgency: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'low'
    };
  }
  
  /**
   * Push PIE intelligence to DealFlow
   */
  async _pushIntelligence() {
    // Create DealFlow-compatible export
    const dealflowData = {
      timestamp: new Date().toISOString(),
      leads: []
    };
    
    for (const [leadId, enrichment] of this.state.enrichedLeads) {
      dealflowData.leads.push({
        leadId,
        pieScore: enrichment.scores?.overall || 0,
        pieConfidence: enrichment.scores?.confidence || 0,
        pieLikelihood: enrichment.scores?.likelihood || 'unknown',
        marketSentiment: enrichment.marketSentiment,
        recommendedAction: enrichment.recommendedAction,
        outreachTiming: enrichment.outreachTiming,
        frictionCount: enrichment.frictionAlerts.length,
        relatedOpportunities: enrichment.relatedOpportunities.length,
        enrichedAt: enrichment.enrichedAt
      });
    }
    
    // Save to DealFlow directory
    const dealflowPath = path.join(this.config.dataDir, 'dealflow-export.json');
    await fs.writeFile(dealflowPath, JSON.stringify(dealflowData, null, 2));
    
  }
  
  /**
   * Sync opportunities between systems
   */
  async _syncOpportunities() {
    // Read PIE opportunities
    const pieOppsPath = path.join(this.config.dataDir, 'opportunities-live.json');
    
    try {
      const data = await fs.readFile(pieOppsPath, 'utf8');
      const opportunities = JSON.parse(data);
      
      // Create DealFlow-compatible opportunities
      const dealflowOpps = opportunities.map(opp => ({
        id: opp.id,
        title: opp.title,
        type: opp.type,
        company: opp.company || opp.coin,
        score: opp.score,
        urgency: opp.urgency,
        description: opp.description,
        action: opp.action,
        signals: opp.signals,
        source: 'pie_opportunity_radar',
        createdAt: opp.timestamp || new Date().toISOString(),
        status: 'new'
      }));
      
      // Write to DealFlow export
      const dealflowPath = path.join(this.config.dataDir, 'dealflow-opportunities.json');
      await fs.writeFile(dealflowPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        opportunities: dealflowOpps
      }, null, 2));
      
      
    } catch (err) {
    }
  }
  
  /**
   * Get active leads from DealFlow
   */
  async getActiveLeads() {
    const leads = await this._pullLeads();
    return leads.filter(lead => 
      ['new', 'contacted', 'qualified', 'proposal'].includes(lead.status)
    );
  }
  
  /**
   * Get a specific lead
   */
  async getLead(leadId) {
    // Check cache first
    if (this.state.leadsCache.has(leadId)) {
      return this.state.leadsCache.get(leadId);
    }
    
    // Fetch from DealFlow
    const leads = await this._pullLeads();
    const lead = leads.find(l => l.id === leadId);
    
    if (lead) {
      this.state.leadsCache.set(leadId, lead);
    }
    
    return lead;
  }
  
  /**
   * Update a lead in DealFlow
   */
  async updateLead(leadId, updates) {
    const leads = await this._pullLeads();
    const index = leads.findIndex(l => l.id === leadId);
    
    if (index === -1) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    // Merge updates
    leads[index] = { ...leads[index], ...updates, updatedAt: new Date().toISOString() };
    
    // Write back
    const leadsPath = path.join(this.config.dataDir, 'leads.json');
    await fs.writeFile(leadsPath, JSON.stringify(leads, null, 2));
    
    // Update cache
    this.state.leadsCache.set(leadId, leads[index]);
    
    this.emit('lead-updated', { leadId, updates });
    
    return leads[index];
  }
  
  /**
   * Create opportunity in DealFlow
   */
  async createOpportunity(opportunity) {
    // Read existing opportunities
    const oppsPath = path.join(this.config.dataDir, 'opportunities-live.json');
    let opportunities = [];
    
    try {
      const data = await fs.readFile(oppsPath, 'utf8');
      opportunities = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet
    }
    
    // Check for duplicates
    const exists = opportunities.some(o => o.id === opportunity.id);
    if (exists) {
      return opportunity;
    }
    
    // Add new opportunity
    const enrichedOpportunity = {
      ...opportunity,
      source: 'pie_opportunity_radar',
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    
    opportunities.push(enrichedOpportunity);
    
    // Write back
    await fs.writeFile(oppsPath, JSON.stringify(opportunities, null, 2));
    
    this.emit('opportunity-created', enrichedOpportunity);
    
    
    return enrichedOpportunity;
  }
  
  /**
   * Enrich a lead with PIE data
   */
  async enrichLead(leadId, enrichment) {
    const lead = await this.getLead(leadId);
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    const enriched = {
      ...lead,
      pieEnrichment: {
        ...enrichment,
        enrichedAt: new Date().toISOString()
      }
    };
    
    await this.updateLead(leadId, enriched);
    
    return enriched;
  }
  
  /**
   * Get lead with full PIE enrichment
   */
  async getEnrichedLead(leadId) {
    const lead = await this.getLead(leadId);
    
    if (!lead) return null;
    
    const enrichment = this.state.enrichedLeads.get(leadId);
    
    return {
      ...lead,
      pieEnrichment: enrichment,
      pieEnriched: !!enrichment
    };
  }
  
  /**
   * Get all enriched leads
   */
  async getAllEnrichedLeads() {
    const leads = await this._pullLeads();
    
    return leads.map(lead => ({
      ...lead,
      pieEnrichment: this.state.enrichedLeads.get(lead.id),
      pieEnriched: this.state.enrichedLeads.has(lead.id)
    }));
  }
  
  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics() {
    const leads = await this._pullLeads();
    
    const metrics = {
      total: leads.length,
      byStatus: {},
      bySource: {},
      pieEnriched: 0,
      avgScore: 0,
      highPriority: 0,
      frictionAlerts: 0
    };
    
    let totalScore = 0;
    let scoredCount = 0;
    
    for (const lead of leads) {
      // Count by status
      metrics.byStatus[lead.status] = (metrics.byStatus[lead.status] || 0) + 1;
      
      // Count by source
      metrics.bySource[lead.source] = (metrics.bySource[lead.source] || 0) + 1;
      
      // Track PIE enrichment
      const enrichment = this.state.enrichedLeads.get(lead.id);
      if (enrichment) {
        metrics.pieEnriched++;
        
        if (enrichment.scores?.overall) {
          totalScore += enrichment.scores.overall;
          scoredCount++;
        }
        
        if (enrichment.scores?.overall >= 80) {
          metrics.highPriority++;
        }
        
        metrics.frictionAlerts += enrichment.frictionAlerts?.length || 0;
      }
    }
    
    metrics.avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
    
    return metrics;
  }
  
  /**
   * Import leads from external source
   */
  async importLeads(leads, source = 'import') {
    const existing = await this._pullLeads();
    const imported = [];
    
    for (const lead of leads) {
      // Check for duplicates
      const exists = existing.some(e => 
        e.email === lead.email || 
        (e.company === lead.company && e.decisionMaker?.name === lead.decisionMaker?.name)
      );
      
      if (!exists) {
        const newLead = {
          id: `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ...lead,
          source,
          status: 'new',
          createdAt: new Date().toISOString()
        };
        
        existing.push(newLead);
        imported.push(newLead);
      }
    }
    
    // Write back
    const leadsPath = path.join(this.config.dataDir, 'leads.json');
    await fs.writeFile(leadsPath, JSON.stringify(existing, null, 2));
    
    
    this.emit('leads-imported', { count: imported.length, source });
    
    return imported;
  }
  
  /**
   * Load sync state
   */
  async _loadSyncState() {
    try {
      const filepath = path.join(this.config.dataDir, 'sync', 'state.json');
      const data = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.state.lastSync = parsed.lastSync;
    } catch (err) {
      // No state yet
    }
  }
  
  /**
   * Save sync state
   */
  async _saveSyncState() {
    const filepath = path.join(this.config.dataDir, 'sync', 'state.json');
    const data = {
      lastSync: this.state.lastSync,
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      lastSync: this.state.lastSync,
      syncStatus: this.state.syncStatus,
      cachedLeads: this.state.leadsCache.size,
      enrichedLeads: this.state.enrichedLeads.size,
      cachedOpportunities: this.state.opportunitiesCache.size
    };
  }
}

module.exports = DealFlowIntegration;

// CLI execution
if (require.main === module) {
  const integration = new DealFlowIntegration();
  
  async function run() {
    await integration.initialize();
    await integration.sync();
    
    // Get metrics
    const metrics = await integration.getPipelineMetrics();
    
    // Get enriched leads
    const enriched = await integration.getAllEnrichedLeads();
    
    // Save final state
    await integration._saveSyncState();
  }
  
  run().catch(console.error);
}
