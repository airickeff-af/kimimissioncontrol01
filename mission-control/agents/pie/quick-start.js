#!/usr/bin/env node
/**
 * PIE Quick Start Script
 * 
 * One-command setup and demo of PIE capabilities
 */

const PIE = require('./pie-core');
const fs = require('fs').promises;
const path = require('path');

async function main() {
╔═══════════════════════════════════════════════════════════╗
║  🔮 PIE - Predictive Intelligence Engine                   ║
║  Sales Intelligence for coins.ph / coins.xyz              ║
╚════════════════════════════════════════════════════════════╝
`);

  // Initialize PIE
  
  const pie = new PIE({
    dealflowIntegration: true,
    autoEnrich: true,
    microActions: true
  });
  
  await pie.initialize();
  
  // Load sample leads
  const leadsData = await fs.readFile(path.join(__dirname, 'data', 'leads.json'), 'utf8');
  const leads = JSON.parse(leadsData);
  
  // Score leads
  const scored = await pie.scoreLeads(leads);
  
  scored.forEach(s => {
    const indicator = s.score >= 80 ? '🔥' : s.score >= 60 ? '📈' : '⏳';
  });
  
  // Show bottlenecks
  scored.filter(s => s.bottlenecks.length > 0).forEach(s => {
    s.bottlenecks.forEach(b => {
    });
  });
  
  // Scan for opportunities
  const opportunities = await pie.scanOpportunities({
    sectors: ['crypto', 'gaming', 'payments'],
    competitors: ['binance', 'coinbase']
  });
  
  
  // Show top opportunities
  if (opportunities.length > 0) {
    opportunities.slice(0, 3).forEach((opp, i) => {
    });
  }
  
  // Generate sample briefing
  const topLead = scored[0];
  
  try {
    const briefing = await pie.generateBriefing(topLead.leadId, { save: false });
    
    briefing.talkingPoints.opening.slice(0, 2).forEach((tp, i) => {
    });
  } catch (err) {
  }
  
  // Queue micro-actions
  
  for (const lead of scored.filter(s => s.score >= 70)) {
    const actions = await pie.microActions.autoDetectActions({
      id: lead.leadId,
      company: lead.lead,
      status: 'new',
      ...lead
    });
    
    if (actions.length > 0) {
    }
  }
  
  // Get intelligence report
  const report = await pie.getIntelligenceReport();
  
   ═══════════════════════════════════════
   PIE Status Report
   ═══════════════════════════════════════
   
   📡 Radar:       ${report.metrics.radarStatus.initialized ? '✅ Online' : '❌ Offline'}
   🔍 Predictor:   ${report.metrics.predictorStatus.initialized ? '✅ Online' : '❌ Offline'}
   ⚡ Micro-Actions: ${report.metrics.microActionsStatus.initialized ? '✅ Online' : '❌ Offline'}
   
   📈 Metrics:
   • Active Opportunities: ${report.metrics.totalOpportunities}
   • Leads Scored: ${report.metrics.leadsScored}
   • Last Scan: ${report.metrics.lastScan || 'Never'}
   
   ═══════════════════════════════════════
`);
  
  // Cleanup
  await pie.stop();
  
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
