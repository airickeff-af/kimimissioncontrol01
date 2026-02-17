#!/usr/bin/env node
/**
 * DealFlow Lead Enrichment Automation
 * Auto-enriches new leads with email + social contacts
 * 
 * Usage:
 *   node auto-enrich.js                    # Watch mode (continuous)
 *   node auto-enrich.js --once             # Single run
 *   node auto-enrich.js --lead-id=<id>     # Enrich specific lead
 *   node auto-enrich.js --dry-run          # Preview without saving
 */

const fs = require('fs').promises;
const path = require('path');
const { enrichLead, enrichLeadsBatch, getEnrichmentSummary } = require('../../../modules/lead-enricher');

// ============ CONFIGURATION ============

const CONFIG = {
  leadsFile: '/root/.openclaw/workspace/mission-control/data/leads.json',
  enrichedLeadsFile: '/root/.openclaw/workspace/mission-control/data/enriched-leads.json',
  logFile: '/root/.openclaw/workspace/mission-control/logs/enrichment.log',
  pendingTasksFile: '/root/.openclaw/workspace/PENDING_TASKS.md',
  watchIntervalMs: 30000, // 30 seconds
  maxConcurrent: 3,
  delayBetweenBatches: 1000,
  retryAttempts: 2,
  retryDelayMs: 5000
};

// ============ STATE MANAGEMENT ============

class EnrichmentState {
  constructor() {
    this.processedIds = new Set();
    this.lastRun = null;
    this.stats = {
      totalProcessed: 0,
      totalEnriched: 0,
      totalFailed: 0,
      byQuality: { high: 0, medium: 0, low: 0, insufficient: 0 }
    };
  }

  async load() {
    try {
      const data = await fs.readFile(CONFIG.enrichedLeadsFile, 'utf8');
      const enriched = JSON.parse(data);
      
      if (Array.isArray(enriched.leads)) {
        enriched.leads.forEach(lead => {
          if (lead.original?.id) {
            this.processedIds.add(lead.original.id);
          }
        });
        this.stats.totalProcessed = enriched.leads.length;
        this.stats.totalEnriched = enriched.leads.filter(l => l.quality !== 'insufficient').length;
      }
      
      if (enriched.stats) {
        this.stats = { ...this.stats, ...enriched.stats };
      }
      
      console.log(`📊 Loaded ${this.processedIds.size} previously enriched leads`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn('⚠️  Could not load previous state:', err.message);
      }
    }
  }

  async save(enrichedLeads) {
    const data = {
      lastUpdated: new Date().toISOString(),
      stats: this.stats,
      leads: enrichedLeads
    };
    
    await fs.mkdir(path.dirname(CONFIG.enrichedLeadsFile), { recursive: true });
    await fs.writeFile(CONFIG.enrichedLeadsFile, JSON.stringify(data, null, 2));
  }
}

// ============ LOGGING ============

class Logger {
  constructor() {
    this.logs = [];
  }

  async log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    this.logs.push(entry);
    
    // Console output
    const prefix = {
      info: 'ℹ️ ',
      success: '✅',
      warn: '⚠️ ',
      error: '❌',
      enrich: '🎯',
      watch: '👁️ '
    }[level] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
    
    // File logging
    try {
      await fs.mkdir(path.dirname(CONFIG.logFile), { recursive: true });
      const logLine = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
      await fs.appendFile(CONFIG.logFile, logLine);
    } catch (err) {
      // Silent fail for logging errors
    }
  }

  info(msg, data) { return this.log('info', msg, data); }
  success(msg, data) { return this.log('success', msg, data); }
  warn(msg, data) { return this.log('warn', msg, data); }
  error(msg, data) { return this.log('error', msg, data); }
  enrich(msg, data) { return this.log('enrich', msg, data); }
  watch(msg, data) { return this.log('watch', msg, data); }
}

// ============ LEAD LOADING ============

async function loadLeads() {
  try {
    const data = await fs.readFile(CONFIG.leadsFile, 'utf8');
    const parsed = JSON.parse(data);
    
    // Handle different lead file formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.leads && Array.isArray(parsed.leads)) {
      return parsed.leads;
    } else if (parsed.scoredLeads && Array.isArray(parsed.scoredLeads)) {
      // Convert scored leads format
      return parsed.scoredLeads.map(sl => ({
        id: sl.leadId,
        name: sl.contactName,
        company: sl.company,
        title: sl.title,
        domain: sl.domain || extractDomain(sl.company),
        score: sl.totalScore,
        priority: sl.priorityTier,
        region: sl.region,
        industry: sl.industry
      }));
    }
    
    return [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

function extractDomain(companyName) {
  if (!companyName) return null;
  // Simple domain extraction - in production, use company database
  const normalized = companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(inc|corp|ltd|llc|limited)$/i, '');
  return `${normalized}.com`;
}

// ============ ENRICHMENT ENGINE ============

async function enrichLeadWithRetry(lead, logger, attempt = 1) {
  try {
    const result = await enrichLead({
      name: lead.name,
      company: lead.company,
      domain: lead.domain || extractDomain(lead.company),
      title: lead.title
    }, {
      findEmail: true,
      findSocial: true,
      verifyData: true,
      timeoutMs: 30000
    });
    
    // Add original lead data
    result.original = lead;
    result.enrichedAt = new Date().toISOString();
    
    return result;
  } catch (err) {
    if (attempt < CONFIG.retryAttempts) {
      logger.warn(`Retry ${attempt}/${CONFIG.retryAttempts} for ${lead.name} after error: ${err.message}`);
      await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
      return enrichLeadWithRetry(lead, logger, attempt + 1);
    }
    throw err;
  }
}

async function processNewLeads(leads, state, logger, dryRun = false) {
  // Filter out already processed leads
  const newLeads = leads.filter(lead => !state.processedIds.has(lead.id));
  
  if (newLeads.length === 0) {
    logger.info('No new leads to enrich');
    return [];
  }
  
  logger.info(`Found ${newLeads.length} new lead(s) to enrich`);
  
  const enrichedResults = [];
  const errors = [];
  
  // Process in batches
  for (let i = 0; i < newLeads.length; i += CONFIG.maxConcurrent) {
    const batch = newLeads.slice(i, i + CONFIG.maxConcurrent);
    
    logger.enrich(`Processing batch ${Math.floor(i / CONFIG.maxConcurrent) + 1}/${Math.ceil(newLeads.length / CONFIG.maxConcurrent)}`);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (lead) => {
        logger.enrich(`Enriching: ${lead.name} @ ${lead.company}`);
        
        const result = await enrichLeadWithRetry(lead, logger);
        
        // Update stats
        state.stats.totalProcessed++;
        state.processedIds.add(lead.id);
        
        if (result.quality !== 'insufficient') {
          state.stats.totalEnriched++;
        }
        state.stats.byQuality[result.quality]++;
        
        logger.success(`Enriched ${lead.name}: ${result.quality.toUpperCase()} (${result.confidence}% confidence)`);
        
        if (result.email?.verified?.email) {
          logger.info(`  📧 Email: ${result.email.verified.email}`);
        }
        if (result.social?.profiles?.linkedin) {
          logger.info(`  💼 LinkedIn: ${result.social.profiles.linkedin.handle || 'found'}`);
        }
        if (result.social?.profiles?.twitter) {
          logger.info(`  🐦 Twitter: ${result.social.profiles.twitter.handle || 'found'}`);
        }
        
        return result;
      })
    );
    
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        enrichedResults.push(result.value);
      } else {
        const lead = batch[idx];
        logger.error(`Failed to enrich ${lead.name}: ${result.reason.message}`);
        errors.push({ lead, error: result.reason.message });
        state.stats.totalFailed++;
      }
    });
    
    // Delay between batches
    if (i + CONFIG.maxConcurrent < newLeads.length) {
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenBatches));
    }
  }
  
  // Log summary
  const summary = getEnrichmentSummary(enrichedResults);
  logger.success(`Enrichment complete: ${summary.withEmail} emails, ${summary.withLinkedIn} LinkedIn, ${summary.withTwitter} Twitter`);
  
  if (errors.length > 0) {
    logger.warn(`${errors.length} lead(s) failed enrichment`);
  }
  
  return enrichedResults;
}

// ============ PENDING TASKS UPDATE ============

async function updatePendingTasks(logger, enrichedCount) {
  try {
    let content = await fs.readFile(CONFIG.pendingTasksFile, 'utf8');
    
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];
    const timeStr = now.split('T')[1].slice(0, 5);
    
    // Add enrichment log entry
    const logEntry = `\n### **Auto-Enrichment Run - ${dateStr} ${timeStr}**\n- **Leads Enriched:** ${enrichedCount}\n- **Status:** ✅ COMPLETED\n- **Auto-triggered:** Yes\n`;
    
    // Find the DealFlow section and add log entry
    const dealFlowSection = content.indexOf('### **TASK-002:');
    if (dealFlowSection !== -1) {
      const nextSection = content.indexOf('### **TASK-', dealFlowSection + 1);
      const insertPos = nextSection !== -1 ? nextSection : content.length;
      content = content.slice(0, insertPos) + logEntry + content.slice(insertPos);
    }
    
    // Update last updated timestamp
    content = content.replace(
      /Last Updated:.*$/m,
      `Last Updated: ${dateStr} ${timeStr} HKT`
    );
    
    await fs.writeFile(CONFIG.pendingTasksFile, content);
    logger.success('Updated PENDING_TASKS.md with enrichment results');
  } catch (err) {
    logger.warn('Could not update PENDING_TASKS.md:', err.message);
  }
}

// ============ WATCH MODE ============

async function watchMode(state, logger) {
  logger.watch('Starting watch mode (checking every 30s)...');
  logger.watch(`Monitoring: ${CONFIG.leadsFile}`);
  
  let lastMtime = null;
  
  while (true) {
    try {
      const stats = await fs.stat(CONFIG.leadsFile);
      
      if (lastMtime === null || stats.mtime > lastMtime) {
        if (lastMtime !== null) {
          logger.watch('Leads file modified, checking for new leads...');
        }
        
        const leads = await loadLeads();
        const enriched = await processNewLeads(leads, state, logger);
        
        if (enriched.length > 0) {
          // Load existing enriched leads
          let existingEnriched = [];
          try {
            const data = await fs.readFile(CONFIG.enrichedLeadsFile, 'utf8');
            existingEnriched = JSON.parse(data).leads || [];
          } catch (err) {
            // File doesn't exist yet
          }
          
          // Merge and save
          const allEnriched = [...existingEnriched, ...enriched];
          await state.save(allEnriched);
          
          // Update pending tasks
          await updatePendingTasks(logger, enriched.length);
        }
        
        lastMtime = stats.mtime;
      }
    } catch (err) {
      logger.error('Watch error:', err.message);
    }
    
    await new Promise(r => setTimeout(r, CONFIG.watchIntervalMs));
  }
}

// ============ SINGLE RUN ============

async function singleRun(state, logger, leadId = null, dryRun = false) {
  logger.info('Starting single enrichment run...');
  
  const leads = await loadLeads();
  
  if (leadId) {
    // Filter to specific lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      logger.error(`Lead ${leadId} not found`);
      return;
    }
    logger.info(`Enriching specific lead: ${lead.name}`);
  }
  
  const leadsToProcess = leadId ? [leads.find(l => l.id === leadId)] : leads;
  
  if (dryRun) {
    logger.info('DRY RUN MODE - No changes will be saved');
    console.log('\nLeads that would be enriched:');
    leadsToProcess
      .filter(l => !state.processedIds.has(l.id))
      .forEach(l => console.log(`  - ${l.name} @ ${l.company}`));
    return;
  }
  
  const enriched = await processNewLeads(leadsToProcess, state, logger);
  
  if (enriched.length > 0) {
    // Load existing enriched leads
    let existingEnriched = [];
    try {
      const data = await fs.readFile(CONFIG.enrichedLeadsFile, 'utf8');
      existingEnriched = JSON.parse(data).leads || [];
    } catch (err) {
      // File doesn't exist yet
    }
    
    // Merge and save
    const allEnriched = [...existingEnriched, ...enriched];
    await state.save(allEnriched);
    
    // Update pending tasks
    await updatePendingTasks(logger, enriched.length);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('ENRICHMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total leads processed: ${enriched.length}`);
    console.log(`High quality: ${enriched.filter(e => e.quality === 'high').length}`);
    console.log(`Medium quality: ${enriched.filter(e => e.quality === 'medium').length}`);
    console.log(`Low quality: ${enriched.filter(e => e.quality === 'low').length}`);
    console.log(`Emails found: ${enriched.filter(e => e.email?.verified?.valid).length}`);
    console.log(`LinkedIn profiles: ${enriched.filter(e => e.social?.profiles?.linkedin).length}`);
    console.log(`Twitter profiles: ${enriched.filter(e => e.social?.profiles?.twitter).length}`);
    console.log('='.repeat(60));
  }
}

// ============ MAIN ============

async function main() {
  const args = process.argv.slice(2);
  const isOnce = args.includes('--once');
  const isDryRun = args.includes('--dry-run');
  const leadIdArg = args.find(a => a.startsWith('--lead-id='));
  const leadId = leadIdArg ? leadIdArg.split('=')[1] : null;
  
  const logger = new Logger();
  const state = new EnrichmentState();
  
  console.log('\n' + '='.repeat(60));
  console.log('DEALFLOW LEAD ENRICHMENT AUTOMATION');
  console.log('='.repeat(60) + '\n');
  
  // Load previous state
  await state.load();
  
  if (isOnce || leadId || isDryRun) {
    await singleRun(state, logger, leadId, isDryRun);
  } else {
    await watchMode(state, logger);
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Enrichment automation stopped');
  process.exit(0);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
