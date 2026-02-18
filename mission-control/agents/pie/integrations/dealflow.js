/**
 * DealFlow Integration Module
 * 
 * Bidirectional sync between PIE and DealFlow
 * - PIE enriches DealFlow leads with intelligence
 * - DealFlow provides lead data to PIE
 * - Opportunities flow both ways
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class DealFlowIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dataDir: config.dataDir || path.join(__dirname, '../../data'),
      dealflowPath: config.dealflowPath || path.join(__dirname, '../../dealflow'),
      syncInterval: config.syncInterval || 300000, // 5 minutes
      ...config
    };
    
    this.state = {
      initialized: false,
      lastSync: null,
      syncStatus: 'idle',
      leadsCache: new Map(),
      opportunitiesCache: new Map()
    };
    
    this.syncTimer = null;
  }
  
  async initialize() {
    console.log('🔗 DealFlow Integration: Initializing...');
    
    // Ensure data directory exists
    await fs.mkdir(path.join(this.config.dataDir, 'sync'), { recursive: true });
    
    // Load sync state
    await this._loadSyncState();
    
    this.state.initialized = true;
    console.log('🔗 DealFlow Integration: Ready');
    
    return this;
  }
  
  /**
   * Start continuous sync
   */
  start() {
    console.log('🔗 DealFlow Integration: Starting sync...');
    
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
      console.log('🔗 DealFlow Integration: Sync already in progress');
      return;
    }
    
    this.state.syncStatus = 'syncing';
    console.log('🔗 DealFlow Integration: Syncing...');
    
    try {
      // Pull leads from DealFlow
      const dealflowLeads = await this._pullLeads();
      
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
      
      console.log(`🔗 DealFlow Integration: Sync complete - ${dealflowLeads.length} leads`);
      
      this.emit('sync-complete', {
        leadsSynced: dealflowLeads.length,
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
    // Read from DealFlow data files
    try {
      // Check for leads.json in dealflow directory
      const leadsPath = path.join(this.config.dealflowPath, 'data', 'leads.json');
      
      try {
        const data = await fs.readFile(leadsPath, 'utf8');
        const leads = JSON.parse(data);
        return Array.isArray(leads) ? leads : [];
      } catch (err) {
        // Try alternative locations
        const altPath = path.join(process.cwd(), 'dealflow', 'leads.json');
        const data = await fs.readFile(altPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.log('🔗 DealFlow Integration: No leads file found, returning empty');
      return [];
    }
  }
  
  /**
   * Push PIE intelligence to DealFlow
   */
  async _pushIntelligence() {
    // Read PIE lead scores
    const scoresPath = path.join(this.config.dataDir, 'lead-scores.json');
    
    try {
      const data = await fs.readFile(scoresPath, 'utf8');
      const scores = JSON.parse(data);
      
      // Write to DealFlow enrichment directory
      const enrichmentPath = path.join(this.config.dealflowPath, 'data', 'pie-enrichment.json');
      await fs.writeFile(enrichmentPath, JSON.stringify(scores, null, 2));
      
      console.log(`🔗 DealFlow Integration: Pushed ${scores.length} lead scores`);
      
    } catch (err) {
      // No scores to push yet
    }
  }
  
  /**
   * Sync opportunities between systems
   */
  async _syncOpportunities() {
    // Read PIE opportunities
    const pieOppsPath = path.join(this.config.dataDir, 'opportunities.json');
    
    try {
      const data = await fs.readFile(pieOppsPath, 'utf8');
      const opportunities = JSON.parse(data);
      
      // Write to DealFlow
      const dealflowOppsPath = path.join(this.config.dealflowPath, 'data', 'pie-opportunities.json');
      await fs.writeFile(dealflowOppsPath, JSON.stringify(opportunities, null, 2));
      
    } catch (err) {
      // No opportunities yet
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
    const leadsPath = path.join(this.config.dealflowPath, 'data', 'leads.json');
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
    const oppsPath = path.join(this.config.dealflowPath, 'data', 'opportunities.json');
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
      console.log(`🔗 DealFlow Integration: Opportunity ${opportunity.id} already exists`);
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
    
    console.log(`🔗 DealFlow Integration: Created opportunity ${opportunity.id}`);
    
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
   * Get lead with PIE enrichment
   */
  async getEnrichedLead(leadId) {
    const lead = await this.getLead(leadId);
    
    if (!lead) return null;
    
    // Get PIE scores
    const scoresPath = path.join(this.config.dataDir, 'lead-scores.json');
    let scores = {};
    
    try {
      const data = await fs.readFile(scoresPath, 'utf8');
      scores = JSON.parse(data);
    } catch (err) {
      // No scores yet
    }
    
    // Get briefings
    const briefingsPath = path.join(this.config.dataDir, 'briefings');
    let briefings = [];
    
    try {
      const files = await fs.readdir(briefingsPath);
      const leadBriefings = files.filter(f => f.startsWith(leadId));
      
      for (const file of leadBriefings.slice(-3)) { // Last 3 briefings
        const data = await fs.readFile(path.join(briefingsPath, file), 'utf8');
        briefings.push(JSON.parse(data));
      }
    } catch (err) {
      // No briefings yet
    }
    
    return {
      ...lead,
      pieScores: scores[leadId] || null,
      pieBriefings: briefings,
      pieEnriched: !!lead.pieEnrichment
    };
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
      pieEnriched: leads.filter(l => l.pieEnrichment).length,
      avgScore: 0,
      highPriority: 0
    };
    
    for (const lead of leads) {
      // Count by status
      metrics.byStatus[lead.status] = (metrics.byStatus[lead.status] || 0) + 1;
      
      // Count by source
      metrics.bySource[lead.source] = (metrics.bySource[lead.source] || 0) + 1;
      
      // Track high priority
      if (lead.pieEnrichment?.score >= 70) {
        metrics.highPriority++;
      }
    }
    
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
    const leadsPath = path.join(this.config.dealflowPath, 'data', 'leads.json');
    await fs.writeFile(leadsPath, JSON.stringify(existing, null, 2));
    
    console.log(`🔗 DealFlow Integration: Imported ${imported.length} leads`);
    
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
      cachedOpportunities: this.state.opportunitiesCache.size
    };
  }
}

module.exports = DealFlowIntegration;
