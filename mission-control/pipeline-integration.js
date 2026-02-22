/**
 * Full Pipeline Integration
 * PIE → Scout → DealFlow → ColdCall
 * 
 * 24-Hour Sprint Integration
 * End-to-end automation with <5 minute processing time
 * 
 * @module pipeline-integration
 * @version 1.0.0
 * @author Nexus (Air1ck3ff)
 */

const { PIEWebSocketServer, ScoutIntegration } = require('../agents/pie/pie-websocket-feed');
const { DealFlowPipeline } = require('../agents/dealflow/hunter-integration');
const { ColdCallAutomation } = require('../agents/coldcall/coldcall-automation');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Pipeline Settings
  AUTO_ENRICH: true,
  AUTO_VERIFY: true,
  REQUIRE_APPROVAL: true,
  
  // Timing
  MAX_PROCESSING_TIME: 5 * 60 * 1000, // 5 minutes max
  ENRICHMENT_BATCH_SIZE: 10,
  
  // Data Paths
  DATA_DIR: path.join(__dirname, '..', 'data'),
  PIPELINE_STATE_FILE: path.join(__dirname, '..', 'data', 'pipeline-state.json'),
  PIPELINE_LOG_FILE: path.join(__dirname, '..', 'data', 'pipeline-log.json'),
  
  // Quality Gates
  QUALITY: {
    minEmailCoverage: 95,
    minVerificationRate: 80,
    minPIEScore: 0.7
  }
};

// ============================================
// PIPELINE ORCHESTRATOR
// ============================================

class PipelineOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    // Initialize components
    this.pie = null;
    this.scout = null;
    this.dealflow = null;
    this.coldcall = null;
    
    // State
    this.state = {
      status: 'idle', // idle, running, paused, error
      stage: null,    // pie, scout, dealflow, coldcall
      lastRun: null,
      metrics: {
        totalProcessed: 0,
        avgProcessingTime: 0,
        successRate: 0
      }
    };
    
    this.log = [];
  }

  /**
   * Initialize all pipeline components
   */
  async initialize() {

    this.logEvent('pipeline', 'initialization_started');

    // Initialize PIE WebSocket Server
    this.pie = new PIEWebSocketServer();
    await this.pie.start();
    this.logEvent('pie', 'websocket_started', { port: 3003 });

    // Initialize Scout Integration
    this.scout = new ScoutIntegration(this.pie);
    await this.scout.connect();
    this.logEvent('scout', 'connected_to_pie');

    // Initialize DealFlow
    this.dealflow = new DealFlowPipeline();
    this.logEvent('dealflow', 'initialized');

    // Initialize ColdCall
    this.coldcall = new ColdCallAutomation();
    this.logEvent('coldcall', 'initialized');

    // Setup event handlers
    this.setupEventHandlers();

    this.state.status = 'ready';
    this.logEvent('pipeline', 'initialization_complete');

    
    return this;
  }

  /**
   * Setup cross-component event handlers
   */
  setupEventHandlers() {
    // PIE → Scout: New opportunity detected
    this.pie.marketData.on('opportunities', (opportunities) => {
      this.logEvent('pie', 'opportunities_detected', { count: opportunities.length });
      
      // Auto-trigger enrichment for high-confidence opportunities
      for (const opp of opportunities) {
        if (opp.confidence >= CONFIG.QUALITY.minPIEScore) {
          this.handleHighValueOpportunity(opp);
        }
      }
    });

    // Scout → DealFlow: Validated opportunity
    this.scout.on('opportunity', (opportunity) => {
      this.logEvent('scout', 'opportunity_validated', { 
        coin: opportunity.coin,
        roi: opportunity.roi_estimate 
      });
    });

    // DealFlow enrichment complete
    this.dealflow.verifier.on('verified', ({ email, result }) => {
      this.logEvent('dealflow', 'email_verified', { email, status: result.status });
    });

    // ColdCall sequence created
    this.coldcall.sequences.on('sequenceCreated', ({ sequenceId, lead }) => {
      this.logEvent('coldcall', 'sequence_created', { sequenceId, lead });
    });
  }

  /**
   * Handle high-value opportunity from PIE
   */
  async handleHighValueOpportunity(opportunity) {

    // Create lead from opportunity
    const lead = {
      id: `opp_${opportunity.coin.toLowerCase()}_${Date.now()}`,
      name: 'BD Team', // Will be enriched
      company: opportunity.coin,
      title: 'Business Development',
      domain: `${opportunity.coin.toLowerCase()}.com`,
      source: 'PIE_AUTO_DISCOVER',
      priority: opportunity.confidence >= 0.9 ? 'P0' : 'P1',
      pie_intel: {
        signal_type: opportunity.type,
        signal_strength: opportunity.confidence,
        detected_at: opportunity.timestamp
      }
    };

    // Queue for immediate processing
    await this.processSingleLead(lead);
  }

  /**
   * Process a single lead end-to-end
   */
  async processSingleLead(lead) {
    const startTime = Date.now();
    
    this.logEvent('pipeline', 'lead_processing_started', { lead: lead.id });

    try {
      // Stage 1: DealFlow Enrichment (Email verification)
      this.state.stage = 'dealflow';
      
      const enrichment = await this.dealflow.verifier.verifyLead(lead);
      
      if (!enrichment.email) {
        this.logEvent('pipeline', 'lead_skipped', { reason: 'no_email' });
        return { success: false, reason: 'no_email' };
      }


      // Stage 2: ColdCall Sequence Creation
      this.state.stage = 'coldcall';
      
      const sequence = this.coldcall.sequences.createSequence(enrichment);
      
      if (CONFIG.REQUIRE_APPROVAL) {
      } else {
        this.coldcall.sequences.activate(sequence.id);
      }

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      this.logEvent('pipeline', 'lead_processing_complete', {
        lead: lead.id,
        processingTime,
        sequenceId: sequence.id
      });


      // Update metrics
      this.updateMetrics(processingTime, true);

      return {
        success: true,
        lead: enrichment,
        sequence,
        processingTime
      };

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      this.logEvent('pipeline', 'lead_processing_error', { error: error.message });
      this.updateMetrics(Date.now() - startTime, false);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run full pipeline on all leads
   */
  async runFullPipeline() {
    this.logEvent('pipeline', 'full_run_started');
    
    this.state.status = 'running';
    const startTime = Date.now();

    try {
      // Stage 1: PIE Market Data (already running via WebSocket)

      // Stage 2: Scout Validation (already connected)

      // Stage 3: DealFlow Enrichment
      const enrichmentResults = await this.dealflow.runPipeline();
      
      // Check quality gate
      if (enrichmentResults.coverage.coveragePercent < CONFIG.QUALITY.minEmailCoverage) {
        console.warn(`\n⚠️  Quality Gate Warning: Email coverage ${enrichmentResults.coverage.coveragePercent}% < ${CONFIG.QUALITY.minEmailCoverage}%`);
      }

      // Stage 4: ColdCall Activation
      const init = await this.coldcall.initializeFromLeads();
      

      // Calculate total time
      const totalTime = Date.now() - startTime;
      
      this.state.status = 'ready';
      this.state.lastRun = new Date().toISOString();
      
      this.logEvent('pipeline', 'full_run_complete', { totalTime });

      // Save state
      await this.saveState();


      return {
        success: true,
        totalTime,
        enrichment: enrichmentResults,
        coldcall: init,
        quality: this.checkQualityGates(enrichmentResults)
      };

    } catch (error) {
      this.state.status = 'error';
      this.logEvent('pipeline', 'full_run_error', { error: error.message });
      console.error('\n❌ Pipeline Error:', error.message);
      throw error;
    }
  }

  /**
   * Check quality gates
   */
  checkQualityGates(enrichment) {
    const gates = {
      emailCoverage: {
        target: CONFIG.QUALITY.minEmailCoverage,
        actual: enrichment.coverage.coveragePercent,
        passed: enrichment.coverage.coveragePercent >= CONFIG.QUALITY.minEmailCoverage
      },
      verificationRate: {
        target: CONFIG.QUALITY.minVerificationRate,
        actual: enrichment.coverage.verifiedPercent,
        passed: enrichment.coverage.verifiedPercent >= CONFIG.QUALITY.minVerificationRate
      }
    };

    gates.allPassed = Object.values(gates).every(g => g.passed);
    
    return gates;
  }

  /**
   * Update metrics
   */
  updateMetrics(processingTime, success) {
    const m = this.state.metrics;
    m.totalProcessed++;
    m.avgProcessingTime = (m.avgProcessingTime * (m.totalProcessed - 1) + processingTime) / m.totalProcessed;
    
    const successCount = Math.round(m.successRate * (m.totalProcessed - 1) / 100) + (success ? 1 : 0);
    m.successRate = Math.round((successCount / m.totalProcessed) * 100);
  }

  /**
   * Log event
   */
  logEvent(component, event, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      component,
      event,
      data
    };
    
    this.log.push(entry);
    this.emit('log', entry);
  }

  /**
   * Save pipeline state
   */
  async saveState() {
    const state = {
      savedAt: new Date().toISOString(),
      state: this.state,
      log: this.log.slice(-1000) // Keep last 1000 events
    };

    await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
    await fs.writeFile(CONFIG.PIPELINE_STATE_FILE, JSON.stringify(state, null, 2));
  }

  /**
   * Load pipeline state
   */
  async loadState() {
    try {
      const data = await fs.readFile(CONFIG.PIPELINE_STATE_FILE, 'utf8');
      const saved = JSON.parse(data);
      this.state = saved.state;
      this.log = saved.log || [];
    } catch (error) {
      // No saved state
    }
  }

  /**
   * Get status report
   */
  getStatus() {
    return {
      status: this.state.status,
      stage: this.state.stage,
      lastRun: this.state.lastRun,
      metrics: this.state.metrics,
      components: {
        pie: this.pie ? 'running' : 'stopped',
        scout: this.scout ? 'connected' : 'disconnected',
        dealflow: this.dealflow ? 'ready' : 'stopped',
        coldcall: this.coldcall ? 'ready' : 'stopped'
      },
      recentLogs: this.log.slice(-10)
    };
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    
    if (this.pie) {
      await this.pie.stop();
    }
    
    await this.saveState();
    
  }
}

// ============================================
// PIPELINE TESTER
// ============================================

class PipelineTester {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Run end-to-end test
   */
  async runE2ETest() {

    const testLead = {
      id: 'test_lead_001',
      name: 'Test User',
      company: 'TestCorp',
      title: 'CEO',
      domain: 'testcorp.com',
      email: 'test@testcorp.com',
      priority: 'P0',
      region: 'Singapore',
      industry: 'Fintech'
    };

    
    const startTime = Date.now();
    const result = await this.orchestrator.processSingleLead(testLead);
    const processingTime = Date.now() - startTime;


    if (result.sequence) {
    }

    return {
      success: result.success && processingTime < CONFIG.MAX_PROCESSING_TIME,
      processingTime,
      result
    };
  }

  /**
   * Validate all components
   */
  async validateComponents() {

    const checks = {
      pie: !!this.orchestrator.pie?.isRunning,
      scout: !!this.orchestrator.scout,
      dealflow: !!this.orchestrator.dealflow,
      coldcall: !!this.orchestrator.coldcall
    };

    for (const [component, status] of Object.entries(checks)) {
    }

    const allReady = Object.values(checks).every(v => v);

    return allReady;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  PipelineOrchestrator,
  PipelineTester,
  CONFIG
};

// ============================================
// CLI EXECUTION
// ============================================

async function main() {
  const orchestrator = new PipelineOrchestrator();
  const tester = new PipelineTester(orchestrator);

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    await orchestrator.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await orchestrator.shutdown();
    process.exit(0);
  });

  // Initialize
  await orchestrator.initialize();

  // Validate components
  const ready = await tester.validateComponents();
  
  if (!ready) {
    console.error('❌ Pipeline not ready. Exiting.');
    process.exit(1);
  }

  // Run E2E test
  const testResult = await tester.runE2ETest();

  if (!testResult.success) {
    console.error('❌ E2E test failed. Check configuration.');
  }

  // Run full pipeline if --full flag
  if (process.argv.includes('--full')) {
    await orchestrator.runFullPipeline();
  }

  // Keep running for WebSocket
  
  // Status updates every 30 seconds
  setInterval(() => {
    const status = orchestrator.getStatus();
  }, 30000);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
