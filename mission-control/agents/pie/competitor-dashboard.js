/**
 * PIE - Competitor Tracking Dashboard
 * 
 * Real-time competitor intelligence dashboard
 * Tracks: Partnerships, Funding, Product Launches, Market Expansion
 * 
 * @module competitor-dashboard
 * @author Glasses (Researcher Agent)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// COMPETITOR TRACKER
// ============================================================================

class CompetitorTracker {
  constructor(config = {}) {
    this.dataDir = config.dataDir || './data/competitors';
    this.competitors = new Map();
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  addCompetitor(config) {
    const competitor = {
      id: config.id || config.name.toLowerCase().replace(/\s+/g, '-'),
      name: config.name,
      type: config.type || 'unknown',
      website: config.website || null,
      twitter: config.twitter || null,
      tags: config.tags || [],
      description: config.description || '',
      createdAt: new Date().toISOString(),
      ...config
    };

    this.competitors.set(competitor.id, competitor);
    this.saveCompetitor(competitor);
    
    return competitor;
  }

  removeCompetitor(id) {
    this.competitors.delete(id);
    
    const filePath = path.join(this.dataDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getCompetitor(id) {
    return this.competitors.get(id) || this.loadCompetitor(id);
  }

  getAllCompetitors() {
    return Array.from(this.competitors.values());
  }

  getByType(type) {
    return this.getAllCompetitors().filter(c => c.type === type);
  }

  saveCompetitor(competitor) {
    const filePath = path.join(this.dataDir, `${competitor.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(competitor, null, 2));
  }

  loadCompetitor(id) {
    const filePath = path.join(this.dataDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.competitors.set(id, data);
      return data;
    }
    return null;
  }

  loadAll() {
    if (!fs.existsSync(this.dataDir)) return;
    
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const id = file.replace('.json', '');
      this.loadCompetitor(id);
    }
  }

  // ========================================================================
  // ACTIVITY TRACKING
  // ========================================================================

  addActivity(competitorId, activity) {
    const competitor = this.getCompetitor(competitorId);
    if (!competitor) return null;

    if (!competitor.activities) {
      competitor.activities = [];
    }

    const activityRecord = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: activity.type, // partnership, funding, product, expansion, acquisition, etc.
      title: activity.title,
      description: activity.description,
      source: activity.source || null,
      url: activity.url || null,
      impact: activity.impact || 'medium', // low, medium, high, critical
      tags: activity.tags || [],
      metadata: activity.metadata || {}
    };

    competitor.activities.unshift(activityRecord);
    
    // Keep last 100 activities
    if (competitor.activities.length > 100) {
      competitor.activities = competitor.activities.slice(0, 100);
    }

    // Update lastActivity
    competitor.lastActivity = activityRecord.timestamp;

    this.saveCompetitor(competitor);
    return activityRecord;
  }

  getActivities(competitorId, options = {}) {
    const competitor = this.getCompetitor(competitorId);
    if (!competitor || !competitor.activities) return [];

    let activities = [...competitor.activities];

    if (options.type) {
      activities = activities.filter(a => a.type === options.type);
    }

    if (options.impact) {
      activities = activities.filter(a => a.impact === options.impact);
    }

    if (options.since) {
      const sinceDate = new Date(options.since);
      activities = activities.filter(a => new Date(a.timestamp) >= sinceDate);
    }

    if (options.limit) {
      activities = activities.slice(0, options.limit);
    }

    return activities;
  }

  // ========================================================================
  // METRICS TRACKING
  // ========================================================================

  updateMetrics(competitorId, metrics) {
    const competitor = this.getCompetitor(competitorId);
    if (!competitor) return null;

    if (!competitor.metrics) {
      competitor.metrics = [];
    }

    const metricRecord = {
      timestamp: new Date().toISOString(),
      ...metrics
    };

    competitor.metrics.unshift(metricRecord);
    
    // Keep last 30 metric snapshots
    if (competitor.metrics.length > 30) {
      competitor.metrics = competitor.metrics.slice(0, 30);
    }

    this.saveCompetitor(competitor);
    return metricRecord;
  }

  getMetricsHistory(competitorId, metricName, days = 30) {
    const competitor = this.getCompetitor(competitorId);
    if (!competitor || !competitor.metrics) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return competitor.metrics
      .filter(m => new Date(m.timestamp) >= cutoff)
      .map(m => ({
        timestamp: m.timestamp,
        value: m[metricName]
      }))
      .filter(m => m.value !== undefined);
  }
}

// ============================================================================
// DASHBOARD GENERATOR
// ============================================================================

class Dashboard {
  constructor(tracker) {
    this.tracker = tracker;
  }

  generate(options = {}) {
    const competitors = this.tracker.getAllCompetitors();
    
    return {
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(competitors),
      byType: this.generateByType(competitors),
      recentActivity: this.generateRecentActivity(competitors, options.activityLimit || 20),
      hotCompetitors: this.generateHotCompetitors(competitors),
      activityTimeline: this.generateTimeline(competitors, options.days || 30),
      fundingTracker: this.generateFundingTracker(competitors),
      partnershipMap: this.generatePartnershipMap(competitors)
    };
  }

  generateSummary(competitors) {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    let activities24h = 0;
    let activities7d = 0;
    let totalFunding = 0;
    let partnerships = 0;
    let products = 0;
    let expansions = 0;

    for (const c of competitors) {
      if (c.activities) {
        for (const a of c.activities) {
          const date = new Date(a.timestamp);
          
          if (date >= last24h) activities24h++;
          if (date >= last7d) activities7d++;
          
          if (a.type === 'partnership') partnerships++;
          if (a.type === 'funding' && a.metadata?.amount) {
            totalFunding += a.metadata.amount;
          }
          if (a.type === 'product') products++;
          if (a.type === 'expansion') expansions++;
        }
      }
    }

    return {
      totalCompetitors: competitors.length,
      activities24h,
      activities7d,
      totalFunding,
      partnerships,
      products,
      expansions
    };
  }

  generateByType(competitors) {
    const byType = {};

    for (const c of competitors) {
      if (!byType[c.type]) {
        byType[c.type] = [];
      }
      
      byType[c.type].push({
        id: c.id,
        name: c.name,
        website: c.website,
        lastActivity: c.lastActivity,
        activityCount: c.activities?.length || 0
      });
    }

    return byType;
  }

  generateRecentActivity(competitors, limit) {
    const allActivities = [];

    for (const c of competitors) {
      if (c.activities) {
        for (const a of c.activities) {
          allActivities.push({
            ...a,
            competitorId: c.id,
            competitorName: c.name
          });
        }
      }
    }

    return allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  generateHotCompetitors(competitors) {
    const scored = competitors.map(c => {
      let score = 0;
      let recentFunding = 0;
      let recentPartnerships = 0;
      let recentProducts = 0;

      if (c.activities) {
        const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        for (const a of c.activities) {
          if (new Date(a.timestamp) >= last30d) {
            score += 1;
            
            if (a.impact === 'high') score += 2;
            if (a.impact === 'critical') score += 5;
            
            if (a.type === 'funding') {
              recentFunding++;
              if (a.metadata?.amount) {
                score += Math.log10(a.metadata.amount / 1000000);
              }
            }
            if (a.type === 'partnership') recentPartnerships++;
            if (a.type === 'product') recentProducts++;
          }
        }
      }

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        score: Math.round(score * 10) / 10,
        recentFunding,
        recentPartnerships,
        recentProducts,
        lastActivity: c.lastActivity
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  generateTimeline(competitors, days) {
    const timeline = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayActivities = [];

      for (const c of competitors) {
        if (c.activities) {
          for (const a of c.activities) {
            const aDate = new Date(a.timestamp);
            if (aDate >= dayStart && aDate < dayEnd) {
              dayActivities.push({
                competitor: c.name,
                type: a.type,
                title: a.title
              });
            }
          }
        }
      }

      timeline.push({
        date: dateStr,
        count: dayActivities.length,
        activities: dayActivities
      });
    }

    return timeline;
  }

  generateFundingTracker(competitors) {
    const fundingRounds = [];

    for (const c of competitors) {
      if (c.activities) {
        for (const a of c.activities) {
          if (a.type === 'funding' && a.metadata?.amount) {
            fundingRounds.push({
              competitorId: c.id,
              competitorName: c.name,
              date: a.timestamp,
              amount: a.metadata.amount,
              round: a.metadata.round || 'Unknown',
              valuation: a.metadata.valuation || null,
              investors: a.metadata.investors || []
            });
          }
        }
      }
    }

    return fundingRounds.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generatePartnershipMap(competitors) {
    const partnerships = [];
    const partners = new Set();

    for (const c of competitors) {
      if (c.activities) {
        for (const a of c.activities) {
          if (a.type === 'partnership' && a.metadata?.partner) {
            partnerships.push({
              competitorId: c.id,
              competitorName: c.name,
              partner: a.metadata.partner,
              date: a.timestamp,
              description: a.description
            });
            partners.add(a.metadata.partner);
          }
        }
      }
    }

    return {
      totalPartnerships: partnerships.length,
      uniquePartners: partners.size,
      partnerships: partnerships.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }

  // ========================================================================
  // FORMATTED OUTPUT
  // ========================================================================

  toConsole(dashboard) {

    // Summary

    // Hot Competitors
    dashboard.hotCompetitors.slice(0, 5).forEach((c, i) => {
    });

    // Recent Activity
    dashboard.recentActivity.slice(0, 10).forEach((a, i) => {
      const time = new Date(a.timestamp).toLocaleTimeString();
      const icon = this.getActivityIcon(a.type);
    });

    // By Type
    for (const [type, list] of Object.entries(dashboard.byType)) {
      list.slice(0, 3).forEach(c => {
      });
      if (list.length > 3) {
      }
    }

  }

  getActivityIcon(type) {
    const icons = {
      partnership: '🤝',
      funding: '💰',
      product: '🚀',
      expansion: '🌍',
      acquisition: '🏢',
      default: '📌'
    };
    return icons[type] || icons.default;
  }

  toHTML(dashboard) {
    // Generate a simple HTML dashboard
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Competitor Intelligence Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h2 { margin-top: 0; color: #555; font-size: 18px; }
    .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .stat:last-child { border-bottom: none; }
    .stat-value { font-weight: bold; color: #333; }
    .activity { padding: 10px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; }
    .activity-time { font-size: 12px; color: #999; }
    .hot-competitor { display: flex; align-items: center; padding: 10px; margin: 5px 0; background: #fff3cd; border-radius: 4px; }
    .score { margin-left: auto; font-weight: bold; color: #856404; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; }
    .badge-funding { background: #d4edda; color: #155724; }
    .badge-partnership { background: #cce5ff; color: #004085; }
    .badge-product { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏢 Competitor Intelligence Dashboard</h1>
    <p>Generated: ${new Date(dashboard.generatedAt).toLocaleString()}</p>
    
    <div class="grid">
      <div class="card">
        <h2>📊 Summary</h2>
        <div class="stat"><span>Total Competitors</span><span class="stat-value">${dashboard.summary.totalCompetitors}</span></div>
        <div class="stat"><span>Activities (24h)</span><span class="stat-value">${dashboard.summary.activities24h}</span></div>
        <div class="stat"><span>Activities (7d)</span><span class="stat-value">${dashboard.summary.activities7d}</span></div>
        <div class="stat"><span>Total Funding</span><span class="stat-value">$${(dashboard.summary.totalFunding / 1000000).toFixed(2)}M</span></div>
      </div>
      
      <div class="card">
        <h2>🔥 Hot Competitors</h2>
        ${dashboard.hotCompetitors.slice(0, 5).map(c => `
          <div class="hot-competitor">
            <span>${c.name}</span>
            ${c.recentFunding > 0 ? '<span class="badge badge-funding">💰 ' + c.recentFunding + '</span>' : ''}
            ${c.recentPartnerships > 0 ? '<span class="badge badge-partnership">🤝 ' + c.recentPartnerships + '</span>' : ''}
            ${c.recentProducts > 0 ? '<span class="badge badge-product">🚀 ' + c.recentProducts + '</span>' : ''}
            <span class="score">${c.score}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <h2>📰 Recent Activity</h2>
        ${dashboard.recentActivity.slice(0, 5).map(a => `
          <div class="activity">
            <div><strong>${a.competitorName}</strong> - ${a.title}</div>
            <div class="activity-time">${new Date(a.timestamp).toLocaleString()}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

// ============================================================================
// DEFAULT COMPETITORS
// ============================================================================

const DEFAULT_COMPETITORS = [
  // Exchanges
  { name: 'Binance', type: 'exchange', website: 'https://binance.com', twitter: '@binance', tags: ['cex', 'global', 'defi'] },
  { name: 'Coinbase', type: 'exchange', website: 'https://coinbase.com', twitter: '@coinbase', tags: ['cex', 'us', 'public'] },
  { name: 'Kraken', type: 'exchange', website: 'https://kraken.com', twitter: '@krakenfx', tags: ['cex', 'us', 'europe'] },
  { name: 'OKX', type: 'exchange', website: 'https://okx.com', twitter: '@okx', tags: ['cex', 'global', 'derivatives'] },
  { name: 'Bybit', type: 'exchange', website: 'https://bybit.com', twitter: '@bybit_official', tags: ['cex', 'derivatives', 'asia'] },
  
  // NFT Marketplaces
  { name: 'OpenSea', type: 'nft_marketplace', website: 'https://opensea.io', twitter: '@opensea', tags: ['nft', 'ethereum', 'polygon'] },
  { name: 'Blur', type: 'nft_marketplace', website: 'https://blur.io', twitter: '@blur_io', tags: ['nft', 'ethereum', 'pro'] },
  { name: 'Magic Eden', type: 'nft_marketplace', website: 'https://magiceden.io', twitter: '@magiceden', tags: ['nft', 'solana', 'bitcoin'] },
  
  // DeFi
  { name: 'Uniswap', type: 'defi', website: 'https://uniswap.org', twitter: '@uniswap', tags: ['dex', 'amm', 'ethereum'] },
  { name: 'Aave', type: 'defi', website: 'https://aave.com', twitter: '@aave', tags: ['lending', 'ethereum', 'multichain'] },
  { name: 'Lido', type: 'defi', website: 'https://lido.fi', twitter: '@lidofinance', tags: ['staking', 'ethereum', 'liquid'] },
  
  // Infrastructure
  { name: 'Alchemy', type: 'infrastructure', website: 'https://alchemy.com', twitter: '@alchemyplatform', tags: ['rpc', 'api', 'developer'] },
  { name: 'Infura', type: 'infrastructure', website: 'https://infura.io', twitter: '@infura_io', tags: ['rpc', 'ethereum', 'consensys'] },
  
  // Wallets
  { name: 'MetaMask', type: 'wallet', website: 'https://metamask.io', twitter: '@metamask', tags: ['wallet', 'ethereum', 'consensys'] },
  { name: 'Phantom', type: 'wallet', website: 'https://phantom.app', twitter: '@phantom', tags: ['wallet', 'solana', 'multichain'] }
];

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  CompetitorTracker,
  Dashboard,
  DEFAULT_COMPETITORS
};

// CLI
if (require.main === module) {
  const tracker = new CompetitorTracker();
  
  // Load default competitors
  for (const config of DEFAULT_COMPETITORS) {
    if (!tracker.getCompetitor(config.name.toLowerCase().replace(/\s+/g, '-'))) {
      tracker.addCompetitor(config);
    }
  }
  
  const command = process.argv[2];
  
  switch (command) {
    case 'dashboard':
      const dashboard = new Dashboard(tracker);
      const data = dashboard.generate();
      dashboard.toConsole(data);
      break;
      
    case 'list':
      for (const c of tracker.getAllCompetitors()) {
      }
      break;
      
    case 'add':
      const name = process.argv[3];
      const type = process.argv[4];
      if (!name || !type) {
        process.exit(1);
      }
      tracker.addCompetitor({ name, type });
      break;
      
    case 'activity':
      const compId = process.argv[3];
      if (!compId) {
        process.exit(1);
      }
      const activities = tracker.getActivities(compId);
      activities.slice(0, 10).forEach(a => {
      });
      break;
      
    default:
🏢 Competitor Dashboard - PIE Intelligence Module

Usage: node competitor-dashboard.js <command>

Commands:
  dashboard     Generate dashboard
  list          List all competitors
  add <name> <type>  Add competitor
  activity <id>     Show competitor activity
      `);
  }
}
