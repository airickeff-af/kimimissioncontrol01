/**
 * Predictive Intelligence Engine (PIE) - Core System
 * 
 * Orchestrates four intelligence modules:
 * - Opportunity Radar: Market intelligence monitoring
 * - Friction Predictor: Lead scoring & bottleneck detection  
 * - Pre-fetcher: Auto-research & briefing generation
 * - Micro-Actions: Autonomous low-risk actions
 * 
 * @author Nexus + Glasses (Mission Control)
 * @date 2026-02-18
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

// Module imports
const OpportunityRadar = require('./modules/opportunity-radar/radar');
const FrictionPredictor = require('./modules/friction-predictor/predictor');
const Prefetcher = require('./modules/prefetcher/prefetcher');
const MicroActions = require('./modules/micro-actions/micro-actions');
const DealFlowIntegration = require('./integrations/dealflow');

class PredictiveIntelligenceEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dataDir: config.dataDir || path.join(__dirname, 'data'),
      dealflowIntegration: config.dealflowIntegration !== false,
      autoEnrich: config.autoEnrich !== false,
      microActions: config.microActions !== false,
      scanInterval: config.scanInterval || 3600000, // 1 hour
      ...config
    };
    
    this.state = {
      initialized: false,
      lastScan: null,
      activeOpportunities: [],
      leadScores: new Map(),
      pendingActions: []
    };
    
    // Initialize modules
    this.radar = new OpportunityRadar(this.config);
    this.predictor = new FrictionPredictor(this.config);
    this.prefetcher = new Prefetcher(this.config);
    this.microActions = new MicroActions(this.config);
    
    // DealFlow integration
    if (this.config.dealflowIntegration) {
      this.dealflow = new DealFlowIntegration(this.config);
    }
    
    this._setupEventHandlers();
  }
  
  _setupEventHandlers() {
    // Opportunity Radar events
    this.radar.on('opportunity', (opp) => {
      this.emit('opportunity', opp);
      this._handleNewOpportunity(opp);
    });
    
    this.radar.on('competitor-move', (move) => {
      this.emit('competitor-move', move);
    });
    
    // Friction Predictor events
    this.predictor.on('lead-scored', (result) => {
      this.state.leadScores.set(result.leadId, result);
      this.emit('lead-scored', result);
    });
    
    this.predictor.on('bottleneck-detected', (bottleneck) => {
      this.emit('bottleneck-detected', bottleneck);
    });
    
    // Pre-fetcher events
    this.prefetcher.on('briefing-ready', (briefing) => {
      this.emit('briefing-ready', briefing);
    });
    
    // Micro-actions events
    this.microActions.on('action-executed', (action) => {
      this.emit('action-executed', action);
    });
    
    this.microActions.on('action-suggested', (action) => {
      this.emit('action-suggested', action);
    });
  }
  
  /**
   * Initialize PIE and load persisted state
   */
  async initialize() {
    
    // Ensure data directory exists
    await fs.mkdir(this.config.dataDir, { recursive: true });
    await fs.mkdir(path.join(this.config.dataDir, 'briefings'), { recursive: true });
    
    // Initialize modules
    await this.radar.initialize();
    await this.predictor.initialize();
    await this.prefetcher.initialize();
    await this.microActions.initialize();
    
    if (this.dealflow) {
      await this.dealflow.initialize();
    }
    
    // Load persisted state
    await this._loadState();
    
    this.state.initialized = true;
    
    this.emit('initialized');
    return this;
  }
  
  /**
   * Start continuous monitoring
   */
  async start() {
    if (!this.state.initialized) {
      await this.initialize();
    }
    
    
    // Start radar scanning
    this.radar.start(this.config.scanInterval);
    
    // Start micro-actions processor
    this.microActions.start();
    
    // Schedule periodic lead scoring
    this._scheduleLeadScoring();
    
    this.emit('started');
    return this;
  }
  
  /**
   * Stop all monitoring
   */
  async stop() {
    
    this.radar.stop();
    this.microActions.stop();
    
    await this._saveState();
    
    this.emit('stopped');
    return this;
  }
  
  /**
   * Get comprehensive intelligence report
   */
  async getIntelligenceReport(options = {}) {
    const report = {
      timestamp: new Date().toISOString(),
      opportunities: await this.radar.getActiveOpportunities(),
      leadScores: Array.from(this.state.leadScores.entries()),
      bottlenecks: await this.predictor.getBottlenecks(),
      recentActions: await this.microActions.getRecentActions(10),
      metrics: await this._getMetrics()
    };
    
    if (options.includeBriefings) {
      report.briefings = await this.prefetcher.getRecentBriefings(5);
    }
    
    return report;
  }
  
  /**
   * Score a lead or array of leads
   */
  async scoreLeads(leads) {
    const leadArray = Array.isArray(leads) ? leads : [leads];
    const results = [];
    
    for (const lead of leadArray) {
      const score = await this.predictor.scoreLead(lead);
      results.push(score);
      
      // Auto-enrich if enabled
      if (this.config.autoEnrich && score.confidence < 0.7) {
        this.prefetcher.enrichLead(lead).catch(console.error);
      }
    }
    
    return Array.isArray(leads) ? results : results[0];
  }
  
  /**
   * Generate briefing for a meeting
   */
  async generateBriefing(leadId, options = {}) {
    return this.prefetcher.generateBriefing(leadId, options);
  }
  
  /**
   * Get optimal outreach timing for a lead
   */
  async getOptimalTiming(leadId) {
    return this.predictor.getOptimalTiming(leadId);
  }
  
  /**
   * Execute a manual scan for opportunities
   */
  async scanOpportunities(options = {}) {
    return this.radar.scan(options);
  }
  
  /**
   * Get competitor activity
   */
  async getCompetitorActivity(competitors = null) {
    return this.radar.getCompetitorActivity(competitors);
  }
  
  /**
   * Handle new opportunity detection
   */
  async _handleNewOpportunity(opportunity) {
    // Add to active opportunities
    this.state.activeOpportunities.push(opportunity);
    
    // Sync with DealFlow if enabled
    if (this.dealflow) {
      await this.dealflow.createOpportunity(opportunity);
    }
    
    // Persist state
    await this._saveState();
  }
  
  /**
   * Schedule periodic lead scoring
   */
  _scheduleLeadScoring() {
    // Score leads every 6 hours
    setInterval(async () => {
      if (this.dealflow) {
        const leads = await this.dealflow.getActiveLeads();
        await this.scoreLeads(leads);
      }
    }, 6 * 60 * 60 * 1000);
  }
  
  /**
   * Get system metrics
   */
  async _getMetrics() {
    return {
      totalOpportunities: this.state.activeOpportunities.length,
      leadsScored: this.state.leadScores.size,
      lastScan: this.state.lastScan,
      radarStatus: this.radar.getStatus(),
      predictorStatus: this.predictor.getStatus(),
      microActionsStatus: this.microActions.getStatus()
    };
  }
  
  /**
   * Load persisted state
   */
  async _loadState() {
    try {
      const statePath = path.join(this.config.dataDir, 'state.json');
      const data = await fs.readFile(statePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.state.lastScan = parsed.lastScan;
      this.state.activeOpportunities = parsed.activeOpportunities || [];
      this.state.leadScores = new Map(parsed.leadScores || []);
    } catch (err) {
      // State doesn't exist yet, start fresh
    }
  }
  
  /**
   * Save state to disk
   */
  async _saveState() {
    const statePath = path.join(this.config.dataDir, 'state.json');
    const data = {
      lastScan: this.state.lastScan,
      activeOpportunities: this.state.activeOpportunities,
      leadScores: Array.from(this.state.leadScores.entries())
    };
    
    await fs.writeFile(statePath, JSON.stringify(data, null, 2));
  }
}

module.exports = PredictiveIntelligenceEngine;

// CLI usage
if (require.main === module) {
  (async () => {
    const pie = new PredictiveIntelligenceEngine();
    await pie.initialize();
    await pie.start();
    
    // Generate initial report
    const report = await pie.getIntelligenceReport({ includeBriefings: true });
  })();
}
