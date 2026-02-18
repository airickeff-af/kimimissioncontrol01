/**
 * PIE - Opportunity Radar Integration
 * 
 * Main entry point that wires together all modules:
 * - opportunity-radar.js (Core engine)
 * - news-integrations.js (RSS/API/Web scraping)
 * - alert-system.js (Multi-channel alerts)
 * - competitor-dashboard.js (Competitor tracking)
 * 
 * @module pie-opportunity-radar
 * @author Glasses (Researcher Agent)
 */

const { OpportunityRadar, CONFIG } = require('./opportunity-radar');
const { SourceManager, RSSSource, CryptoPanicSource, NewsAPISource } = require('./news-integrations');
const { AlertManager, ConsoleChannel, FileChannel, SlackChannel, DiscordChannel } = require('./alert-system');
const { CompetitorTracker, Dashboard, DEFAULT_COMPETITORS } = require('./competitor-dashboard');

// ============================================================================
// PIE OPPORTUNITY RADAR - INTEGRATED SYSTEM
// ============================================================================

class PIEOpportunityRadar {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || './data/opportunity-radar',
      alertChannels: config.alertChannels || ['console', 'file'],
      ...config
    };

    // Initialize core components
    this.radar = new OpportunityRadar({
      ...CONFIG,
      paths: {
        data: this.config.dataDir,
        alerts: `${this.config.dataDir}/alerts`,
        cache: `${this.config.dataDir}/cache`,
        reports: `${this.config.dataDir}/reports`
      }
    });

    this.sourceManager = new SourceManager();
    this.alertManager = new AlertManager();
    this.competitorTracker = new CompetitorTracker({
      dataDir: `${this.config.dataDir}/competitors`
    });
    this.dashboard = new Dashboard(this.competitorTracker);

    this.isRunning = false;
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async initialize() {
    console.log('🚀 PIE Opportunity Radar - Initializing...');
    console.log('');

    // Initialize core radar
    await this.radar.initialize();

    // Setup alert channels
    this.setupAlertChannels();

    // Load default competitors
    this.loadDefaultCompetitors();

    // Connect radar to alert manager
    this.connectRadarToAlerts();

    console.log('');
    console.log('✅ PIE Opportunity Radar initialized successfully');
    console.log('');

    return this;
  }

  setupAlertChannels() {
    for (const channel of this.config.alertChannels) {
      switch (channel) {
        case 'console':
          this.alertManager.addChannel(new ConsoleChannel({
            filter: { minPriority: 'MEDIUM' }
          }));
          console.log('  ✓ Console alerts enabled');
          break;
          
        case 'file':
          this.alertManager.addChannel(new FileChannel({
            outputDir: `${this.config.dataDir}/alerts`,
            format: 'json'
          }));
          console.log('  ✓ File alerts enabled');
          break;
          
        case 'slack':
          if (process.env.SLACK_WEBHOOK_URL) {
            this.alertManager.addChannel(new SlackChannel({
              webhookUrl: process.env.SLACK_WEBHOOK_URL,
              channel: process.env.SLACK_CHANNEL,
              filter: { minPriority: 'HIGH' }
            }));
            console.log('  ✓ Slack alerts enabled');
          }
          break;
          
        case 'discord':
          if (process.env.DISCORD_WEBHOOK_URL) {
            this.alertManager.addChannel(new DiscordChannel({
              webhookUrl: process.env.DISCORD_WEBHOOK_URL,
              filter: { minPriority: 'HIGH' }
            }));
            console.log('  ✓ Discord alerts enabled');
          }
          break;
      }
    }
  }

  loadDefaultCompetitors() {
    let loaded = 0;
    for (const config of DEFAULT_COMPETITORS) {
      const id = config.name.toLowerCase().replace(/\s+/g, '-');
      if (!this.competitorTracker.getCompetitor(id)) {
        this.competitorTracker.addCompetitor(config);
        loaded++;
      }
    }
    console.log(`  ✓ Loaded ${loaded} default competitors`);
  }

  connectRadarToAlerts() {
    // Override radar's saveAlert to also broadcast via alert manager
    const originalSaveAlert = this.radar.store.saveAlert.bind(this.radar.store);
    
    this.radar.store.saveAlert = (alert) => {
      const result = originalSaveAlert(alert);
      
      // Broadcast to alert channels
      this.alertManager.broadcast(alert).catch(err => {
        console.error('Alert broadcast error:', err.message);
      });
      
      // Track as competitor activity if applicable
      if (alert.details?.competitors?.length > 0) {
        for (const comp of alert.details.competitors) {
          this.competitorTracker.addActivity(comp.name.toLowerCase().replace(/\s+/g, '-'), {
            type: this.mapAlertTypeToActivity(alert.type),
            title: alert.item?.title || 'Activity detected',
            description: alert.summary,
            source: alert.source,
            url: alert.item?.link,
            impact: alert.priority === 'HIGH' ? 'high' : 'medium',
            metadata: {
              fundingAmount: alert.details?.fundingAmount,
              sectors: alert.details?.sectors
            }
          });
        }
      }
      
      return result;
    };
  }

  mapAlertTypeToActivity(alertType) {
    const mapping = {
      'FUNDING_ALERT': 'funding',
      'PARTNERSHIP_OPPORTUNITY': 'partnership',
      'MA_ACTIVITY': 'acquisition',
      'PRODUCT_LAUNCH': 'product',
      'MARKET_EXPANSION': 'expansion'
    };
    return mapping[alertType] || 'general';
  }

  // ========================================================================
  // MONITORING OPERATIONS
  // ========================================================================

  async runNewsScan() {
    console.log('\n📰 Running news scan...');
    
    const results = await this.sourceManager.fetchAll();
    
    let totalItems = 0;
    for (const result of results) {
      if (result.items) {
        totalItems += result.items.length;
        
        // Analyze each item
        for (const item of result.items) {
          const content = `${item.title} ${item.description}`;
          const analysis = this.radar.analyzer.analyzeContent(content);
          
          if (analysis.isHot || analysis.fundingAmount) {
            const briefing = this.radar.analyzer.generateBriefing(analysis, { name: result.source });
            this.radar.store.saveAlert({
              ...briefing,
              item: {
                title: item.title,
                link: item.link,
                published: item.published
              }
            });
          }
        }
      }
    }
    
    console.log(`  ✓ Scanned ${results.length} sources, ${totalItems} items`);
    return results;
  }

  async runCompetitorScan() {
    console.log('\n🏢 Running competitor scan...');
    
    const competitors = this.competitorTracker.getAllCompetitors();
    const results = [];
    
    for (const competitor of competitors) {
      // In production, this would search news, social media, etc.
      // For now, we just update the last checked timestamp
      this.competitorTracker.updateMetrics(competitor.id, {
        lastChecked: new Date().toISOString()
      });
      
      results.push({
        competitor: competitor.name,
        status: 'checked'
      });
    }
    
    console.log(`  ✓ Scanned ${results.length} competitors`);
    return results;
  }

  async generateDashboard() {
    console.log('\n📊 Generating dashboard...');
    
    const dashboard = this.dashboard.generate();
    
    // Save HTML version
    const html = this.dashboard.toHTML(dashboard);
    const htmlPath = `${this.config.dataDir}/dashboard.html`;
    require('fs').writeFileSync(htmlPath, html);
    
    console.log(`  ✓ Dashboard saved to ${htmlPath}`);
    
    return dashboard;
  }

  async generateIntelligenceBriefing() {
    console.log('\n📋 Generating intelligence briefing...');
    
    const alerts = this.radar.store.getAlerts();
    const dashboard = this.dashboard.generate();
    
    const briefing = {
      generatedAt: new Date().toISOString(),
      period: 'Last 24 hours',
      executiveSummary: {
        totalAlerts: alerts.length,
        highPriorityAlerts: alerts.filter(a => a.priority === 'HIGH').length,
        fundingEvents: dashboard.fundingTracker.length,
        partnershipOpportunities: dashboard.partnershipMap.totalPartnerships,
        hotSectors: dashboard.summary.hotSectors || []
      },
      keyInsights: this.generateInsights(alerts, dashboard),
      recommendedActions: this.generateRecommendations(alerts, dashboard),
      alertDetails: alerts.slice(0, 10),
      competitorActivity: dashboard.recentActivity.slice(0, 10)
    };
    
    // Save briefing
    const date = new Date().toISOString().split('T')[0];
    const briefingPath = `${this.config.dataDir}/reports/briefing-${date}.json`;
    require('fs').mkdirSync(`${this.config.dataDir}/reports`, { recursive: true });
    require('fs').writeFileSync(briefingPath, JSON.stringify(briefing, null, 2));
    
    console.log(`  ✓ Briefing saved to ${briefingPath}`);
    
    return briefing;
  }

  generateInsights(alerts, dashboard) {
    const insights = [];
    
    // Analyze alert patterns
    const fundingAlerts = alerts.filter(a => a.type === 'FUNDING_ALERT');
    if (fundingAlerts.length > 0) {
      insights.push(`${fundingAlerts.length} funding rounds detected - market remains active`);
    }
    
    // Check for hot sectors
    const sectorCounts = {};
    for (const alert of alerts) {
      if (alert.details?.sectors) {
        for (const sector of alert.details.sectors) {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        }
      }
    }
    
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
    if (topSector) {
      insights.push(`${topSector[0]} is the most active sector with ${topSector[1]} mentions`);
    }
    
    // Competitor insights
    const hotCompetitors = dashboard.hotCompetitors.slice(0, 3);
    if (hotCompetitors.length > 0) {
      insights.push(`Top active competitors: ${hotCompetitors.map(c => c.name).join(', ')}`);
    }
    
    return insights;
  }

  generateRecommendations(alerts, dashboard) {
    const recommendations = [];
    
    const partnershipAlerts = alerts.filter(a => a.type === 'PARTNERSHIP_OPPORTUNITY');
    if (partnershipAlerts.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Review partnership opportunities',
        details: `${partnershipAlerts.length} potential partnerships identified`
      });
    }
    
    const highFunding = dashboard.fundingTracker.filter(f => f.amount >= 10000000);
    if (highFunding.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Monitor well-funded competitors',
        details: `${highFunding.length} competitors raised $10M+ recently`
      });
    }
    
    return recommendations;
  }

  // ========================================================================
  // CONTROL METHODS
  // ========================================================================

  async runFullScan() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 PIE OPPORTUNITY RADAR - FULL SCAN');
    console.log('='.repeat(60));
    
    await this.runNewsScan();
    await this.runCompetitorScan();
    await this.generateDashboard();
    const briefing = await this.generateIntelligenceBriefing();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FULL SCAN COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Summary:');
    console.log(`  • Total alerts: ${briefing.executiveSummary.totalAlerts}`);
    console.log(`  • High priority: ${briefing.executiveSummary.highPriorityAlerts}`);
    console.log(`  • Funding events: ${briefing.executiveSummary.fundingEvents}`);
    console.log(`  • Partnership opportunities: ${briefing.executiveSummary.partnershipOpportunities}`);
    console.log('');
    
    return briefing;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Already running');
      return;
    }

    console.log('\n🚀 Starting PIE Opportunity Radar...');
    this.isRunning = true;

    // Run initial scan
    this.runFullScan();

    // Schedule recurring tasks
    this.schedule('news', 5 * 60 * 1000, () => this.runNewsScan());
    this.schedule('competitors', 15 * 60 * 1000, () => this.runCompetitorScan());
    this.schedule('dashboard', 30 * 60 * 1000, () => this.generateDashboard());
    this.schedule('briefing', 60 * 60 * 1000, () => this.generateIntelligenceBriefing());

    console.log('✅ PIE Opportunity Radar is running');
    console.log('   News scan: every 5 minutes');
    console.log('   Competitor scan: every 15 minutes');
    console.log('   Dashboard update: every 30 minutes');
    console.log('   Intelligence briefing: every hour');
  }

  schedule(name, interval, fn) {
    fn(); // Execute immediately
    const timer = setInterval(fn, interval);
    this.timers = this.timers || {};
    this.timers[name] = timer;
  }

  stop() {
    console.log('\n🛑 Stopping PIE Opportunity Radar...');
    
    if (this.timers) {
      for (const [name, timer] of Object.entries(this.timers)) {
        clearInterval(timer);
        console.log(`  ⏹️ Stopped ${name}`);
      }
    }
    
    this.isRunning = false;
    console.log('✅ PIE Opportunity Radar stopped');
  }

  // ========================================================================
  // QUERY METHODS
  // ========================================================================

  getAlerts(filter = {}) {
    return this.radar.getAlerts(null, filter);
  }

  getOpportunities(options = {}) {
    return this.radar.getOpportunities(options);
  }

  search(query) {
    return this.radar.search(query);
  }

  getCompetitorActivity(competitorId) {
    return this.competitorTracker.getActivities(competitorId);
  }

  getDashboard() {
    return this.dashboard.generate();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  PIEOpportunityRadar,
  OpportunityRadar,
  SourceManager,
  AlertManager,
  CompetitorTracker,
  Dashboard,
  DEFAULT_COMPETITORS
};

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const pie = new PIEOpportunityRadar({
    alertChannels: ['console', 'file']
  });

  const command = process.argv[2];

  (async () => {
    await pie.initialize();

    switch (command) {
      case 'start':
        pie.start();
        break;

      case 'scan':
        await pie.runFullScan();
        process.exit(0);
        break;

      case 'dashboard':
        const dashboard = pie.getDashboard();
        console.log('\n📊 Dashboard Data:');
        console.log(JSON.stringify(dashboard, null, 2));
        process.exit(0);
        break;

      case 'alerts':
        const alerts = pie.getAlerts();
        console.log('\n🚨 Recent Alerts:');
        console.log(JSON.stringify(alerts.slice(-10), null, 2));
        process.exit(0);
        break;

      case 'opportunities':
        const opportunities = pie.getOpportunities();
        console.log('\n💎 Hot Opportunities:');
        console.log(JSON.stringify(opportunities, null, 2));
        process.exit(0);
        break;

      case 'search':
        const query = process.argv[3];
        if (!query) {
          console.log('Usage: node index.js search <query>');
          process.exit(1);
        }
        const results = pie.search(query);
        console.log(`\n🔍 Search results for "${query}":`);
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
        break;

      case 'briefing':
        const briefing = await pie.generateIntelligenceBriefing();
        console.log('\n📋 Intelligence Briefing:');
        console.log(JSON.stringify(briefing, null, 2));
        process.exit(0);
        break;

      default:
        console.log(`
🎯 PIE - Opportunity Radar
   Predictive Intelligence Engine Module

Usage: node index.js <command>

Commands:
  start          Start continuous monitoring
  scan           Run one-time full scan
  dashboard      Generate dashboard report
  alerts         Show recent alerts
  opportunities  Show hot opportunities
  search <query> Search intelligence database
  briefing       Generate intelligence briefing

Environment Variables:
  SLACK_WEBHOOK_URL    Enable Slack notifications
  DISCORD_WEBHOOK_URL  Enable Discord notifications

Examples:
  node index.js scan
  node index.js search "Binance partnership"
  node index.js briefing
        `);
        process.exit(0);
    }
  })();
}
