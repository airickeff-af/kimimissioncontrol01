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
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🔮 PIE - Predictive Intelligence Engine                   ║
║  Sales Intelligence for coins.ph / coins.xyz              ║
╚════════════════════════════════════════════════════════════╝
`);

  // Initialize PIE
  console.log('📦 Initializing PIE...\n');
  
  const pie = new PIE({
    dealflowIntegration: true,
    autoEnrich: true,
    microActions: true
  });
  
  await pie.initialize();
  
  // Load sample leads
  console.log('📋 Loading sample leads...');
  const leadsData = await fs.readFile(path.join(__dirname, 'data', 'leads.json'), 'utf8');
  const leads = JSON.parse(leadsData);
  console.log(`   ✓ Loaded ${leads.length} leads\n`);
  
  // Score leads
  console.log('🎯 Scoring leads (Friction Predictor)...');
  const scored = await pie.scoreLeads(leads);
  
  console.log('\n   📊 Lead Scores:');
  console.log('   ' + '─'.repeat(50));
  scored.forEach(s => {
    const indicator = s.score >= 80 ? '🔥' : s.score >= 60 ? '📈' : '⏳';
    console.log(`   ${indicator} ${s.lead.padEnd(20)} Score: ${s.score}/100 (${s.likelihood})`);
  });
  
  // Show bottlenecks
  console.log('\n   🚧 Bottlenecks Detected:');
  scored.filter(s => s.bottlenecks.length > 0).forEach(s => {
    console.log(`   • ${s.lead}:`);
    s.bottlenecks.forEach(b => {
      console.log(`     - ${b.type}: ${b.description}`);
    });
  });
  
  // Scan for opportunities
  console.log('\n📡 Scanning for opportunities (Opportunity Radar)...');
  const opportunities = await pie.scanOpportunities({
    sectors: ['crypto', 'gaming', 'payments'],
    competitors: ['binance', 'coinbase']
  });
  
  console.log(`   ✓ Found ${opportunities.length} opportunities\n`);
  
  // Show top opportunities
  if (opportunities.length > 0) {
    console.log('   🔥 Top Opportunities:');
    opportunities.slice(0, 3).forEach((opp, i) => {
      console.log(`   ${i + 1}. ${opp.title} (Score: ${opp.score})`);
      console.log(`      Action: ${opp.action}`);
    });
  }
  
  // Generate sample briefing
  console.log('\n📚 Generating sample briefing...');
  const topLead = scored[0];
  
  try {
    const briefing = await pie.generateBriefing(topLead.leadId, { save: false });
    
    console.log(`\n   🎯 Briefing for ${briefing.executiveSummary.company}:`);
    console.log(`   Key Insight: ${briefing.executiveSummary.keyInsight}`);
    console.log(`   Recommended Approach: ${briefing.executiveSummary.recommendedApproach}`);
    console.log(`   \n   💬 Sample Talking Points:`);
    briefing.talkingPoints.opening.slice(0, 2).forEach((tp, i) => {
      console.log(`   ${i + 1}. "${tp}"`);
    });
  } catch (err) {
    console.log(`   ⚠️ Briefing generation skipped (demo mode)`);
  }
  
  // Queue micro-actions
  console.log('\n⚡ Queueing micro-actions...');
  
  for (const lead of scored.filter(s => s.score >= 70)) {
    const actions = await pie.microActions.autoDetectActions({
      id: lead.leadId,
      company: lead.lead,
      status: 'new',
      ...lead
    });
    
    if (actions.length > 0) {
      console.log(`   • ${lead.lead}: ${actions.length} actions queued`);
    }
  }
  
  // Get intelligence report
  console.log('\n📊 Generating Intelligence Report...');
  const report = await pie.getIntelligenceReport();
  
  console.log(`
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
  
  console.log('✅ PIE Demo Complete!\n');
  console.log('Next steps:');
  console.log('  1. Set API keys in environment for live data');
  console.log('  2. Run: node pie-core.js (start monitoring)');
  console.log('  3. Run: node briefing-generator.js <lead-id>');
  console.log('\nFor help: cat README.md\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
