/**
 * Hunter.io Email Enrichment Module for DealFlow
 * Integrates Hunter.io API for automatic email verification and enrichment
 * 
 * @module hunter-enrichment
 * @task P1 - Hunter.io Integration Sprint
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  API_KEY: process.env.HUNTER_API_KEY || null, // Must be set via environment
  BASE_URL: 'api.hunter.io',
  API_VERSION: 'v2',
  TIMEOUT_MS: 15000,
  
  // Rate limiting (Hunter Pro: 100 requests/minute, 2500/month)
  MAX_REQUESTS_PER_MINUTE: 100,
  MAX_REQUESTS_PER_MONTH: 2500,
  REQUEST_DELAY_MS: 600, // 600ms = ~100 req/min max
  
  // Cache settings
  CACHE_DIR: path.join(__dirname, '..', '.cache'),
  CACHE_TTL_HOURS: 168, // 7 days cache for email data
  
  // Data paths
  DATA_DIR: path.join(__dirname, '..', 'data'),
  LEADS_FILE: path.join(__dirname, '..', 'data', 'scored-leads.json'),
  ENRICHMENT_STATE_FILE: path.join(__dirname, '..', 'data', 'enrichment-state.json'),
  OUTPUT_FILE: path.join(__dirname, '..', 'data', 'leads', 'scored-leads.json'),
};

// ============================================
// STATE MANAGEMENT
// ============================================

class EnrichmentState {
  constructor() {
    this.statePath = CONFIG.ENRICHMENT_STATE_FILE;
    this.state = {
      startedAt: null,
      lastProcessed: null,
      processedCount: 0,
      successfulEnrichments: 0,
      failedEnrichments: 0,
      leads: {}, // leadId -> { status, email, confidence, attempts }
      apiCalls: {
        total: 0,
        domainSearch: 0,
        emailFinder: 0,
        emailVerifier: 0
      },
      isRunning: false
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.statePath, 'utf8');
      const saved = JSON.parse(data);
      this.state = { ...this.state, ...saved };
    } catch (error) {
    }
  }

  async save() {
    try {
      await fs.mkdir(path.dirname(this.statePath), { recursive: true });
      await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[EnrichmentState] Failed to save state:', error.message);
    }
  }

  markLeadProcessing(leadId) {
    this.state.leads[leadId] = {
      ...this.state.leads[leadId],
      status: 'processing',
      startedAt: new Date().toISOString()
    };
  }

  markLeadSuccess(leadId, email, confidence, source) {
    this.state.leads[leadId] = {
      ...this.state.leads[leadId],
      status: 'completed',
      email,
      confidence,
      source,
      completedAt: new Date().toISOString()
    };
    this.state.successfulEnrichments++;
    this.state.processedCount++;
    this.state.lastProcessed = leadId;
  }

  markLeadFailed(leadId, reason) {
    this.state.leads[leadId] = {
      ...this.state.leads[leadId],
      status: 'failed',
      reason,
      failedAt: new Date().toISOString()
    };
    this.state.failedEnrichments++;
    this.state.processedCount++;
    this.state.lastProcessed = leadId;
  }

  incrementApiCall(type) {
    this.state.apiCalls.total++;
    this.state.apiCalls[type]++;
  }

  getStats() {
    return {
      ...this.state,
      coverage: this.calculateCoverage()
    };
  }

  calculateCoverage() {
    const total = Object.keys(this.state.leads).length;
    const withEmail = Object.values(this.state.leads).filter(l => l.email).length;
    return total > 0 ? Math.round((withEmail / total) * 100) : 0;
  }
}

// ============================================
// CACHE MANAGEMENT
// ============================================

class Cache {
  constructor() {
    this.cachePath = path.join(CONFIG.CACHE_DIR, 'hunter-cache.json');
    this.memory = new Map();
  }

  async load() {
    try {
      await fs.mkdir(CONFIG.CACHE_DIR, { recursive: true });
      const data = await fs.readFile(this.cachePath, 'utf8');
      const parsed = JSON.parse(data);
      const ttlMs = CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000;
      const now = Date.now();
      
      Object.entries(parsed).forEach(([key, entry]) => {
        if (now - entry.timestamp < ttlMs) {
          this.memory.set(key, entry);
        }
      });
    } catch (error) {
      // No cache yet
    }
  }

  async save() {
    try {
      const data = {};
      this.memory.forEach((value, key) => {
        data[key] = value;
      });
      await fs.writeFile(this.cachePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('[Cache] Failed to save:', error.message);
    }
  }

  get(key) {
    const entry = this.memory.get(key);
    if (!entry) return null;
    
    const ttlMs = CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.memory.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data) {
    this.memory.set(key, {
      data,
      timestamp: Date.now()
    });
    // Async save
    setImmediate(() => this.save());
  }
}

// ============================================
// RATE LIMITER
// ============================================

class RateLimiter {
  constructor() {
    this.requests = [];
    this.minuteWindow = 60 * 1000;
  }

  async waitIfNeeded() {
    const now = Date.now();
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => now - time < this.minuteWindow);
    
    if (this.requests.length >= CONFIG.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = this.requests[0];
      const waitTime = this.minuteWindow - (now - oldestRequest) + 100;
      await this.sleep(waitTime);
      return this.waitIfNeeded();
    }
    
    // Add small delay between requests
    if (this.requests.length > 0) {
      await this.sleep(CONFIG.REQUEST_DELAY_MS);
    }
    
    this.requests.push(Date.now());
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// HUNTER API CLIENT
// ============================================

function makeApiRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.API_KEY) {
      reject(new Error('HUNTER_API_KEY not configured'));
      return;
    }

    const queryParams = new URLSearchParams({
      api_key: CONFIG.API_KEY,
      ...params
    }).toString();

    const options = {
      hostname: CONFIG.BASE_URL,
      path: `/api/${CONFIG.API_VERSION}/${endpoint}?${queryParams}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DealFlow-HunterEnrichment/1.0'
      },
      timeout: CONFIG.TIMEOUT_MS
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.errors) {
            reject(new Error(`API Error: ${JSON.stringify(parsed.errors)}`));
            return;
          }
          
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Invalid JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// ============================================
// EMAIL PATTERN GENERATION
// ============================================

function generateEmailPatterns(firstName, lastName, domain) {
  const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const l = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const fi = f.charAt(0);
  const li = l.charAt(0);
  
  return [
    `${f}@${domain}`,
    `${l}@${domain}`,
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${fi}${l}@${domain}`,
    `${f}${li}@${domain}`,
    `${fi}.${l}@${domain}`,
    `${f}.${li}@${domain}`,
    `${l}.${f}@${domain}`,
    `${fi}${li}@${domain}`,
    `${f}-${l}@${domain}`,
    `${fi}_${l}@${domain}`
  ];
}

function parseName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: parts[0] };
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return { first, last };
}

// ============================================
// HUNTER API FUNCTIONS
// ============================================

async function domainSearch(domain, state, cache) {
  const cacheKey = `domain:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await makeApiRequest('domain-search', {
      domain,
      limit: 100
    });
    
    state.incrementApiCall('domainSearch');
    
    const result = {
      domain: response.data?.domain,
      pattern: response.data?.pattern,
      organization: response.data?.organization,
      emails: (response.data?.emails || []).map(e => ({
        value: e.value,
        type: e.type,
        confidence: e.confidence,
        firstName: e.first_name,
        lastName: e.last_name,
        position: e.position,
        seniority: e.seniority,
        department: e.department,
        linkedin: e.linkedin,
        twitter: e.twitter,
        phone: e.phone_number
      })),
      emailCount: response.data?.emails?.length || 0
    };
    
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`  [DomainSearch] Error for ${domain}:`, error.message);
    return null;
  }
}

async function emailFinder(firstName, lastName, domain, state, cache) {
  const cacheKey = `finder:${firstName}:${lastName}:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await makeApiRequest('email-finder', {
      first_name: firstName,
      last_name: lastName,
      domain
    });
    
    state.incrementApiCall('emailFinder');
    
    const result = {
      email: response.data?.email,
      score: response.data?.score,
      firstName: response.data?.first_name,
      lastName: response.data?.last_name,
      domain: response.data?.domain,
      position: response.data?.position,
      department: response.data?.department,
      seniority: response.data?.seniority,
      linkedin: response.data?.linkedin,
      twitter: response.data?.twitter,
      phone: response.data?.phone_number,
      company: response.data?.company,
      sources: response.data?.sources || []
    };
    
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`  [EmailFinder] Error for ${firstName} ${lastName}:`, error.message);
    return null;
  }
}

async function verifyEmail(email, state, cache) {
  const cacheKey = `verify:${email}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await makeApiRequest('email-verifier', {
      email
    });
    
    state.incrementApiCall('emailVerifier');
    
    const result = {
      email: response.data?.email,
      status: response.data?.status,
      result: response.data?.result,
      score: response.data?.score,
      regexp: response.data?.regexp,
      gibberish: response.data?.gibberish,
      disposable: response.data?.disposable,
      webmail: response.data?.webmail,
      mxRecords: response.data?.mx_records,
      smtpServer: response.data?.smtp_server,
      smtpCheck: response.data?.smtp_check,
      acceptAll: response.data?.accept_all,
      block: response.data?.block,
      sources: response.data?.sources || []
    };
    
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`  [VerifyEmail] Error for ${email}:`, error.message);
    return null;
  }
}

// ============================================
// ENRICHMENT PIPELINE
// ============================================

async function enrichLead(lead, state, cache, rateLimiter) {
  const { leadId, company, contactName, priorityTier } = lead;
  
  
  state.markLeadProcessing(leadId);
  
  // Extract domain from company or use existing
  let domain = lead.domain;
  if (!domain) {
    // Try to guess domain from company name
    const companySlug = company.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/(corporation|inc|llc|ltd|gmbh|pte|co)$/i, '');
    domain = `${companySlug}.com`;
  }
  
  // Clean domain
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  
  const { first, last } = parseName(contactName);
  
  // Step 1: Try Email Finder (most accurate)
  await rateLimiter.waitIfNeeded();
  const finderResult = await emailFinder(first, last, domain, state, cache);
  
  if (finderResult?.email && finderResult.score >= 70) {
    
    // Verify the found email
    await rateLimiter.waitIfNeeded();
    const verifyResult = await verifyEmail(finderResult.email, state, cache);
    
    if (verifyResult?.result === 'deliverable' && verifyResult.score >= 80) {
      state.markLeadSuccess(leadId, finderResult.email, verifyResult.score, 'hunter_finder_verified');
      return {
        email: finderResult.email,
        confidence: verifyResult.score,
        status: 'verified',
        source: 'hunter_finder_verified',
        hunterData: { finder: finderResult, verification: verifyResult }
      };
    } else if (finderResult.score >= 85) {
      // High confidence from finder even if verification failed
      state.markLeadSuccess(leadId, finderResult.email, finderResult.score, 'hunter_finder_high_confidence');
      return {
        email: finderResult.email,
        confidence: finderResult.score,
        status: 'high_confidence',
        source: 'hunter_finder_high_confidence',
        hunterData: { finder: finderResult }
      };
    }
  }
  
  // Step 2: Domain Search - find pattern and match
  await rateLimiter.waitIfNeeded();
  const domainResult = await domainSearch(domain, state, cache);
  
  if (domainResult?.emails?.length > 0) {
    // Look for exact name match
    const exactMatch = domainResult.emails.find(e => 
      e.firstName?.toLowerCase() === first.toLowerCase() &&
      e.lastName?.toLowerCase() === last.toLowerCase()
    );
    
    if (exactMatch) {
      state.markLeadSuccess(leadId, exactMatch.value, exactMatch.confidence || 80, 'hunter_domain_exact');
      return {
        email: exactMatch.value,
        confidence: exactMatch.confidence || 80,
        status: 'verified',
        source: 'hunter_domain_exact',
        hunterData: { domain: domainResult, match: exactMatch }
      };
    }
    
    // Use pattern to generate email
    if (domainResult.pattern) {
      const pattern = domainResult.pattern
        .replace('{first}', first.toLowerCase())
        .replace('{last}', last.toLowerCase())
        .replace('{f}', first.charAt(0).toLowerCase())
        .replace('{l}', last.charAt(0).toLowerCase());
      
      const generatedEmail = `${pattern}@${domain}`;
      
      // Verify generated email
      await rateLimiter.waitIfNeeded();
      const verifyResult = await verifyEmail(generatedEmail, state, cache);
      
      if (verifyResult?.result === 'deliverable') {
        state.markLeadSuccess(leadId, generatedEmail, verifyResult.score, 'hunter_pattern_verified');
        return {
          email: generatedEmail,
          confidence: verifyResult.score,
          status: 'verified',
          source: 'hunter_pattern_verified',
          hunterData: { pattern: domainResult.pattern, verification: verifyResult }
        };
      } else {
        // Return pattern-based email with lower confidence
        state.markLeadSuccess(leadId, generatedEmail, 60, 'hunter_pattern_unverified');
        return {
          email: generatedEmail,
          confidence: 60,
          status: 'pattern_match',
          source: 'hunter_pattern_unverified',
          hunterData: { pattern: domainResult.pattern }
        };
      }
    }
  }
  
  // Step 3: Fallback - generate common patterns
  const patterns = generateEmailPatterns(first, last, domain);
  
  // Try to verify a few patterns
  for (const email of patterns.slice(0, 3)) {
    await rateLimiter.waitIfNeeded();
    const verifyResult = await verifyEmail(email, state, cache);
    
    if (verifyResult?.result === 'deliverable') {
      state.markLeadSuccess(leadId, email, verifyResult.score, 'hunter_fallback_verified');
      return {
        email,
        confidence: verifyResult.score,
        status: 'verified',
        source: 'hunter_fallback_verified',
        hunterData: { verification: verifyResult }
      };
    }
  }
  
  // Failed to find email
  state.markLeadFailed(leadId, 'No verifiable email found');
  return {
    email: null,
    confidence: 0,
    status: 'failed',
    source: null,
    patterns: patterns
  };
}

// ============================================
// BULK PROCESSING
// ============================================

async function processLeads(leads, options = {}) {
  const {
    batchSize = 10,
    priorityOrder = ['P0', 'P1', 'P2', 'P3'],
    resume = true
  } = options;
  
  const state = new EnrichmentState();
  const cache = new Cache();
  const rateLimiter = new RateLimiter();
  
  await state.load();
  await cache.load();
  
  if (state.state.isRunning) {
  }
  
  state.state.isRunning = true;
  state.state.startedAt = new Date().toISOString();
  await state.save();
  
  // Sort leads by priority
  const sortedLeads = [...leads].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.priorityTier);
    const bIndex = priorityOrder.indexOf(b.priorityTier);
    return aIndex - bIndex;
  });
  
  // Filter out already processed leads if resuming
  const leadsToProcess = resume 
    ? sortedLeads.filter(l => !state.state.leads[l.leadId] || state.state.leads[l.leadId].status === 'processing')
    : sortedLeads;
  
  
  const results = [];
  
  // Process in batches
  for (let i = 0; i < leadsToProcess.length; i += batchSize) {
    const batch = leadsToProcess.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(leadsToProcess.length / batchSize);
    
    
    for (const lead of batch) {
      try {
        const result = await enrichLead(lead, state, cache, rateLimiter);
        results.push({ leadId: lead.leadId, ...result });
        await state.save();
      } catch (error) {
        console.error(`[Error] Failed to enrich ${lead.leadId}:`, error.message);
        state.markLeadFailed(lead.leadId, error.message);
        await state.save();
      }
    }
    
    // Progress report
    const stats = state.getStats();
  }
  
  state.state.isRunning = false;
  await state.save();
  
  
  return {
    results,
    stats: state.getStats()
  };
}

// ============================================
// DATA INTEGRATION
// ============================================

async function updateLeadsFile(enrichmentResults) {
  try {
    // Read current leads
    const leadsData = await fs.readFile(CONFIG.LEADS_FILE, 'utf8');
    const leads = JSON.parse(leadsData);
    
    // Update leads with enrichment data
    const updatedScoredLeads = leads.scoredLeads.map(lead => {
      const enrichment = enrichmentResults.results.find(r => r.leadId === lead.leadId);
      if (enrichment && enrichment.email) {
        return {
          ...lead,
          email: enrichment.email,
          emailConfidence: enrichment.confidence,
          emailStatus: enrichment.status,
          emailSource: enrichment.source,
          emailEnrichedAt: new Date().toISOString()
        };
      }
      return lead;
    });
    
    // Update summary
    const withEmail = updatedScoredLeads.filter(l => l.email).length;
    const coverage = Math.round((withEmail / updatedScoredLeads.length) * 100);
    
    const updatedData = {
      summary: {
        ...leads.summary,
        emailCoverage: coverage,
        leadsWithEmail: withEmail,
        totalLeads: updatedScoredLeads.length,
        enrichedAt: new Date().toISOString()
      },
      scoredLeads: updatedScoredLeads
    };
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(CONFIG.OUTPUT_FILE), { recursive: true });
    
    // Write updated file
    await fs.writeFile(CONFIG.OUTPUT_FILE, JSON.stringify(updatedData, null, 2));
    
    
    return updatedData;
  } catch (error) {
    console.error('[Data] Failed to update leads file:', error.message);
    throw error;
  }
}

// ============================================
// API ENDPOINT HANDLERS
// ============================================

async function handleEnrichLead(leadId) {
  const leadsData = await fs.readFile(CONFIG.LEADS_FILE, 'utf8');
  const leads = JSON.parse(leadsData);
  const lead = leads.scoredLeads.find(l => l.leadId === leadId);
  
  if (!lead) {
    return { error: 'Lead not found', leadId };
  }
  
  const state = new EnrichmentState();
  const cache = new Cache();
  const rateLimiter = new RateLimiter();
  
  await state.load();
  await cache.load();
  
  const result = await enrichLead(lead, state, cache, rateLimiter);
  await state.save();
  
  return {
    leadId,
    ...result,
    stats: state.getStats()
  };
}

async function handleEnrichAll(options = {}) {
  const leadsData = await fs.readFile(CONFIG.LEADS_FILE, 'utf8');
  const leads = JSON.parse(leadsData);
  
  const results = await processLeads(leads.scoredLeads, options);
  await updateLeadsFile(results);
  
  return results;
}

async function handleEnrichmentStatus() {
  const state = new EnrichmentState();
  await state.load();
  
  return state.getStats();
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Main enrichment functions
  enrichLead,
  processLeads,
  updateLeadsFile,
  
  // API handlers
  handleEnrichLead,
  handleEnrichAll,
  handleEnrichmentStatus,
  
  // Hunter API functions
  domainSearch: (domain, state, cache) => domainSearch(domain, state, cache),
  emailFinder: (first, last, domain, state, cache) => emailFinder(first, last, domain, state, cache),
  verifyEmail: (email, state, cache) => verifyEmail(email, state, cache),
  
  // Utilities
  generateEmailPatterns,
  parseName,
  
  // Classes
  EnrichmentState,
  Cache,
  RateLimiter,
  
  // Config
  CONFIG
};

// ============================================
// CLI RUNNER
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!CONFIG.API_KEY) {
    console.error('❌ HUNTER_API_KEY environment variable not set');
    console.error('   Get your API key from: https://hunter.io/api');
    console.error('   Run: export HUNTER_API_KEY=your_key_here');
    process.exit(1);
  }
  
  switch (command) {
    case 'enrich':
      const leadId = args[1];
      if (!leadId) {
        console.error('Usage: node hunter-enrichment.js enrich <leadId>');
        process.exit(1);
      }
      handleEnrichLead(leadId).then(result => {
      });
      break;
      
    case 'enrich-all':
      const batchSize = parseInt(args[1]) || 10;
      handleEnrichAll({ batchSize }).then(result => {
      });
      break;
      
    case 'status':
      handleEnrichmentStatus().then(stats => {
        if (stats.isRunning) {
        }
      });
      break;
      
    default:
      process.exit(0);
  }
}
