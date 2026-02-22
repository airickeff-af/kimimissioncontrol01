/**
 * DealFlow Hunter.io Integration Module
 * TASK-057: Email Verification & Enrichment
 * 
 * Features:
 * - Auto-verify emails for all leads via Hunter.io API
 * - Pattern matching for company email formats
 * - Bulk verification with rate limiting
 * - Target: 95% email coverage (currently 65%)
 * 
 * @module dealflow-hunter-integration
 * @version 1.0.0
 * @author Nexus (Air1ck3ff)
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Hunter.io API Configuration
  HUNTER_API_KEY: process.env.HUNTER_API_KEY || '',
  HUNTER_BASE_URL: 'api.hunter.io',
  HUNTER_API_VERSION: 'v2',
  
  // Rate Limiting (Hunter.io free tier: 50 requests/month)
  // Upgrade to paid tier for production: 2500 requests/month
  RATE_LIMIT: {
    maxRequests: parseInt(process.env.HUNTER_RATE_LIMIT) || 50,
    requestsPerMonth: parseInt(process.env.HUNTER_MONTHLY_LIMIT) || 50,
    delayBetweenRequests: 1000 // 1 second between requests
  },
  
  // Data Paths
  DATA_DIR: path.join(__dirname, '..', '..', 'data'),
  LEADS_FILE: path.join(__dirname, '..', '..', 'data', 'leads.json'),
  ENRICHED_FILE: path.join(__dirname, '..', '..', 'data', 'enriched-leads-v2.json'),
  HUNTER_CACHE_FILE: path.join(__dirname, '..', '..', 'data', 'hunter-cache.json'),
  RATE_LIMIT_FILE: path.join(__dirname, '..', '..', 'data', 'hunter-rate-limit.json'),
  
  // Verification Settings
  VERIFICATION: {
    minConfidenceScore: 50,  // Minimum Hunter confidence to consider verified
    acceptCatchAll: false,   // Don't accept catch-all domains as verified
    checkDisposable: true,   // Flag disposable emails
    checkWebmail: true       // Flag webmail addresses (gmail, yahoo, etc.)
  },
  
  // Email Pattern Fallbacks
  FALLBACK_PATTERNS: [
    '{first}',
    '{last}',
    '{first}.{last}',
    '{first}{last}',
    '{first}_{last}',
    '{first}-{last}',
    '{f}{last}',
    '{first}{l}',
    '{last}.{first}',
    '{first}@',
    'hello@',
    'contact@',
    'info@',
    'support@',
    'admin@'
  ]
};

// ============================================
// HUNTER.IO API CLIENT
// ============================================

class HunterClient extends EventEmitter {
  constructor(apiKey = CONFIG.HUNTER_API_KEY) {
    super();
    this.apiKey = apiKey;
    this.requestCount = 0;
    this.monthlyCount = 0;
    this.cache = new Map();
    this.lastRequest = 0;
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'YOUR_HUNTER_API_KEY' && this.apiKey.length > 10;
  }

  /**
   * Make HTTPS request to Hunter.io API
   */
  async makeRequest(endpoint, params = {}) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < CONFIG.RATE_LIMIT.delayBetweenRequests) {
      await this.sleep(CONFIG.RATE_LIMIT.delayBetweenRequests - timeSinceLastRequest);
    }

    // Check monthly limit
    if (this.monthlyCount >= CONFIG.RATE_LIMIT.requestsPerMonth) {
      throw new Error('Monthly API limit reached');
    }

    return new Promise((resolve, reject) => {
      const queryParams = new URLSearchParams({
        api_key: this.apiKey,
        ...params
      }).toString();

      const options = {
        hostname: CONFIG.HUNTER_BASE_URL,
        path: `/api/${CONFIG.HUNTER_API_VERSION}/${endpoint}?${queryParams}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MissionControl-DealFlow/1.0'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.errors) {
              reject(new Error(`API Error: ${JSON.stringify(parsed.errors)}`));
              return;
            }

            this.requestCount++;
            this.monthlyCount++;
            this.lastRequest = Date.now();
            
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Invalid JSON: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  /**
   * Verify a single email address
   */
  async verifyEmail(email) {
    // Check cache first
    const cached = this.getCached(`email:${email}`);
    if (cached) return { ...cached, _cached: true };

    if (!this.isConfigured()) {
      return this.generateFallbackResult(email, 'API key not configured');
    }

    try {
      const response = await this.makeRequest('email-verifier', { email });
      
      const result = this.transformVerificationResponse(response.data, email);
      this.setCached(`email:${email}`, result);
      
      this.emit('verified', { email, result });
      return result;
    } catch (error) {
      console.warn(`[Hunter] Verification failed for ${email}:`, error.message);
      return this.generateFallbackResult(email, error.message);
    }
  }

  /**
   * Get domain information and email patterns
   */
  async getDomainInfo(domain) {
    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();

    // Check cache
    const cached = this.getCached(`domain:${cleanDomain}`);
    if (cached) return { ...cached, _cached: true };

    if (!this.isConfigured()) {
      return this.generateFallbackDomainInfo(cleanDomain);
    }

    try {
      const response = await this.makeRequest('domain-search', {
        domain: cleanDomain,
        limit: 20
      });

      const result = this.transformDomainResponse(response.data, cleanDomain);
      this.setCached(`domain:${cleanDomain}`, result);
      
      return result;
    } catch (error) {
      console.warn(`[Hunter] Domain search failed for ${cleanDomain}:`, error.message);
      return this.generateFallbackDomainInfo(cleanDomain);
    }
  }

  /**
   * Find email for a specific person at a domain
   */
  async findEmail(firstName, lastName, domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cacheKey = `find:${firstName}:${lastName}:${cleanDomain}`;
    
    const cached = this.getCached(cacheKey);
    if (cached) return { ...cached, _cached: true };

    if (!this.isConfigured()) {
      return this.generatePatternBasedEmail(firstName, lastName, cleanDomain);
    }

    try {
      const response = await this.makeRequest('email-finder', {
        domain: cleanDomain,
        first_name: firstName,
        last_name: lastName
      });

      const result = {
        email: response.data?.email,
        score: response.data?.score,
        verified: response.data?.verification?.status === 'valid',
        position: response.data?.position,
        twitter: response.data?.twitter,
        linkedin_url: response.data?.linkedin_url,
        phone_number: response.data?.phone_number,
        company: response.data?.company,
        sources: response.data?.sources || [],
        _found: !!response.data?.email
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      console.warn(`[Hunter] Email finder failed:`, error.message);
      return this.generatePatternBasedEmail(firstName, lastName, cleanDomain);
    }
  }

  /**
   * Transform Hunter verification response
   */
  transformVerificationResponse(data, email) {
    return {
      email,
      status: data?.status, // valid, invalid, accept_all, webmail, unknown
      result: data?.result, // deliverable, undeliverable, risky, unknown
      score: data?.score, // 0-100
      regexp: data?.regexp, // format valid
      gibberish: data?.gibberish, // random characters
      disposable: data?.disposable, // temp email
      webmail: data?.webmail, // gmail, yahoo, etc
      mx_records: data?.mx_records, // MX records exist
      smtp_server: data?.smtp_server, // SMTP server responds
      smtp_check: data?.smtp_check, // Mailbox exists
      accept_all: data?.accept_all, // Catch-all domain
      block: data?.block, // Blocked
      sources: data?.sources || [],
      _verified: data?.result === 'deliverable' && data?.score >= CONFIG.VERIFICATION.minConfidenceScore
    };
  }

  /**
   * Transform Hunter domain response
   */
  transformDomainResponse(data, domain) {
    return {
      domain,
      pattern: data?.pattern, // Most common pattern
      patterns: this.extractPatterns(data?.emails || []),
      organization: data?.organization,
      description: data?.description,
      industry: data?.industry,
      emails: (data?.emails || []).map(e => ({
        value: e.value,
        type: e.type,
        confidence: e.confidence,
        sources: e.sources?.length || 0,
        first_name: e.first_name,
        last_name: e.last_name,
        position: e.position,
        linkedin: e.linkedin,
        twitter: e.twitter,
        phone_number: e.phone_number
      })),
      email_count: data?.emails?.length || 0,
      _hasPattern: !!data?.pattern
    };
  }

  /**
   * Extract patterns from email list
   */
  extractPatterns(emails) {
    const patterns = new Set();
    
    for (const email of emails) {
      if (email.first_name && email.last_name) {
        const local = email.value.split('@')[0].toLowerCase();
        const first = email.first_name.toLowerCase();
        const last = email.last_name.toLowerCase();
        const f = first[0];
        const l = last[0];

        if (local === first) patterns.add('{first}');
        if (local === last) patterns.add('{last}');
        if (local === `${first}.${last}`) patterns.add('{first}.{last}');
        if (local === `${first}${last}`) patterns.add('{first}{last}');
        if (local === `${first}_${last}`) patterns.add('{first}_{last}');
        if (local === `${first}-${last}`) patterns.add('{first}-{last}');
        if (local === `${f}${last}`) patterns.add('{f}{last}');
        if (local === `${first}${l}`) patterns.add('{first}{l}');
        if (local === `${last}.${first}`) patterns.add('{last}.{first}');
      }
    }

    return Array.from(patterns);
  }

  /**
   * Generate pattern-based email (fallback)
   */
  generatePatternBasedEmail(firstName, lastName, domain) {
    const first = (firstName || '').toLowerCase().trim();
    const last = (lastName || '').toLowerCase().trim();
    const f = first[0] || '';
    const l = last[0] || '';

    const patterns = [
      `${first}@${domain}`,
      `${last}@${domain}`,
      `${first}.${last}@${domain}`,
      `${first}${last}@${domain}`,
      `${f}${last}@${domain}`,
      `${first}${l}@${domain}`,
      `${first}_${last}@${domain}`
    ];

    return {
      _fallback: true,
      _method: 'pattern_based',
      first_name: firstName,
      last_name: lastName,
      domain,
      suggested_emails: patterns,
      confidence: 'low',
      verification_required: true
    };
  }

  /**
   * Generate fallback result
   */
  generateFallbackResult(email, reason) {
    const [, domain] = email.split('@');
    
    return {
      email,
      status: 'unknown',
      result: 'unknown',
      score: null,
      _fallback: true,
      _reason: reason,
      _suggested_action: 'Use pattern-based verification or manual research'
    };
  }

  /**
   * Generate fallback domain info
   */
  generateFallbackDomainInfo(domain) {
    return {
      domain,
      pattern: null,
      patterns: CONFIG.FALLBACK_PATTERNS,
      emails: [],
      email_count: 0,
      _fallback: true,
      _message: 'Using generic patterns - API not available'
    };
  }

  /**
   * Cache helpers
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 24 hour TTL
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// BULK EMAIL VERIFICATION
// ============================================

class BulkVerifier extends EventEmitter {
  constructor(hunterClient) {
    super();
    this.hunter = hunterClient;
    this.results = [];
    this.stats = {
      total: 0,
      processed: 0,
      verified: 0,
      failed: 0,
      fallback: 0
    };
  }

  /**
   * Verify multiple leads
   */
  async verifyLeads(leads, options = {}) {
    const { 
      concurrency = 1, 
      priorityField = 'priority',
      onProgress = null 
    } = options;

    // Sort by priority (P0 first, then P1, etc.)
    const sortedLeads = this.sortByPriority(leads, priorityField);
    
    this.stats.total = sortedLeads.length;
    this.results = [];


    // Process in batches
    for (let i = 0; i < sortedLeads.length; i += concurrency) {
      const batch = sortedLeads.slice(i, i + concurrency);
      
      const batchPromises = batch.map(lead => this.verifyLead(lead));
      const batchResults = await Promise.all(batchPromises);
      
      this.results.push(...batchResults);
      this.stats.processed += batch.length;

      // Update stats
      batchResults.forEach(r => {
        if (r.email_verified === 'verified') this.stats.verified++;
        else if (r.email_verified === 'fallback') this.stats.fallback++;
        else this.stats.failed++;
      });

      // Progress callback
      if (onProgress) {
        onProgress({
          current: this.stats.processed,
          total: this.stats.total,
          percent: Math.round((this.stats.processed / this.stats.total) * 100),
          stats: { ...this.stats }
        });
      }

      // Progress log
      if (this.stats.processed % 10 === 0 || this.stats.processed === this.stats.total) {
      }
    }

    return {
      results: this.results,
      stats: { ...this.stats },
      coverage: this.calculateCoverage()
    };
  }

  /**
   * Verify a single lead
   */
  async verifyLead(lead) {
    const result = { ...lead };

    try {
      // If lead has email, verify it
      if (lead.email) {
        const verification = await this.hunter.verifyEmail(lead.email);
        
        result.email_verification = verification;
        result.email_verified = verification._verified ? 'verified' : 
                                  verification._fallback ? 'fallback' : 'unverified';
        result.email_score = verification.score;
        result.email_status = verification.status;
        
        // Flag issues
        result.email_issues = [];
        if (verification.disposable) result.email_issues.push('disposable');
        if (verification.webmail && CONFIG.VERIFICATION.checkWebmail) {
          result.email_issues.push('webmail');
        }
        if (verification.accept_all && !CONFIG.VERIFICATION.acceptCatchAll) {
          result.email_issues.push('catch_all');
        }
      }

      // Get domain info for pattern matching
      if (lead.domain || lead.company) {
        const domain = lead.domain || this.inferDomain(lead.company);
        if (domain) {
          const domainInfo = await this.hunter.getDomainInfo(domain);
          result.domain_info = domainInfo;
          result.email_patterns = domainInfo.patterns || [];
          
          // If no email but we have name and pattern, suggest email
          if (!lead.email && lead.name && domainInfo.pattern) {
            const suggestedEmail = this.generateEmailFromPattern(
              lead.name, 
              domain, 
              domainInfo.pattern
            );
            if (suggestedEmail) {
              result.suggested_email = suggestedEmail;
              result.email = suggestedEmail; // Auto-fill
            }
          }
        }
      }

      // Try to find email if we have name but no email
      if (!result.email && lead.name && (lead.domain || lead.company)) {
        const nameParts = this.parseName(lead.name);
        const domain = lead.domain || this.inferDomain(lead.company);
        
        if (nameParts.first && domain) {
          const found = await this.hunter.findEmail(
            nameParts.first,
            nameParts.last,
            domain
          );
          
          if (found.email) {
            result.email = found.email;
            result.email_verified = found.verified ? 'verified' : 'pattern';
            result.email_score = found.score;
            result.email_source = 'hunter_finder';
          }
        }
      }

      result.enriched_at = new Date().toISOString();
      
    } catch (error) {
      console.error(`[BulkVerifier] Error verifying ${lead.name}:`, error.message);
      result.verification_error = error.message;
      result.email_verified = 'error';
    }

    return result;
  }

  /**
   * Sort leads by priority
   */
  sortByPriority(leads, priorityField) {
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3, 'Cold': 4 };
    
    return [...leads].sort((a, b) => {
      const pA = priorityOrder[a[priorityField]] || 5;
      const pB = priorityOrder[b[priorityField]] || 5;
      return pA - pB;
    });
  }

  /**
   * Infer domain from company name
   */
  inferDomain(company) {
    if (!company) return null;
    
    const domainMap = {
      'PDAX': 'pdax.ph',
      'Coins.ph': 'coins.ph',
      'Coins.xyz': 'coins.xyz',
      'Crypto.com': 'crypto.com',
      'GCash': 'gcash.com',
      'Xendit': 'xendit.co',
      'Angkas': 'angkas.com',
      'BloomX': 'bloomx.ph',
      'Rebit.ph': 'rebit.ph',
      'Binance': 'binance.com',
      'Maya': 'maya.ph',
      'PayMongo': 'paymongo.com',
      'Plentina': 'plentina.com',
      'Tonik': 'tonikbank.com'
    };

    // Direct match
    if (domainMap[company]) return domainMap[company];

    // Try to construct domain
    const clean = company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/(inc|llc|ltd|corp|gmbh)$/i, '');
    
    return `${clean}.com`;
  }

  /**
   * Parse full name into parts
   */
  parseName(fullName) {
    if (!fullName) return { first: '', last: '' };
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    
    return {
      first: parts[0],
      last: parts.slice(1).join(' ')
    };
  }

  /**
   * Generate email from pattern
   */
  generateEmailFromPattern(name, domain, pattern) {
    const parts = this.parseName(name);
    if (!parts.first) return null;

    const first = parts.first.toLowerCase();
    const last = (parts.last || '').toLowerCase();
    const f = first[0] || '';
    const l = last[0] || '';

    const email = pattern
      .replace('{first}', first)
      .replace('{last}', last)
      .replace('{f}', f)
      .replace('{l}', l);

    return `${email}@${domain}`;
  }

  /**
   * Calculate email coverage percentage
   */
  calculateCoverage() {
    const withEmail = this.results.filter(r => r.email && r.email.length > 0).length;
    const verified = this.results.filter(r => 
      r.email_verified === 'verified' || r.email_verified === 'pattern'
    ).length;
    
    return {
      total: this.stats.total,
      withEmail,
      withoutEmail: this.stats.total - withEmail,
      verified,
      coveragePercent: Math.round((withEmail / this.stats.total) * 100),
      verifiedPercent: Math.round((verified / this.stats.total) * 100)
    };
  }
}

// ============================================
// PIPELINE INTEGRATION
// ============================================

class DealFlowPipeline {
  constructor() {
    this.hunter = new HunterClient();
    this.verifier = new BulkVerifier(this.hunter);
  }

  /**
   * Run full enrichment pipeline
   */
  async runPipeline(options = {}) {

    // Load leads
    const leads = await this.loadLeads();

    // Check API status
    if (!this.hunter.isConfigured()) {
    } else {
    }

    // Run verification
    const results = await this.verifier.verifyLeads(leads, {
      concurrency: 1,
      onProgress: (progress) => {
        // Could emit to WebSocket here
      }
    });

    // Save results
    await this.saveResults(results);

    // Print summary
    this.printSummary(results);

    return results;
  }

  /**
   * Load leads from file
   */
  async loadLeads() {
    try {
      const data = await fs.readFile(CONFIG.LEADS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : parsed.leads || [];
    } catch (error) {
      console.error('Failed to load leads:', error.message);
      return [];
    }
  }

  /**
   * Save enrichment results
   */
  async saveResults(results) {
    try {
      await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
      
      // Save enriched leads
      await fs.writeFile(
        CONFIG.ENRICHED_FILE,
        JSON.stringify({
          pipeline_version: '1.0.0',
          enriched_at: new Date().toISOString(),
          agent: 'DealFlow',
          task: 'TASK-057',
          stage: 'ENRICHMENT_COMPLETE',
          total_leads: results.stats.total,
          stats: results.stats,
          coverage: results.coverage,
          leads: results.results
        }, null, 2)
      );

      // Save cache
      const cacheData = {};
      this.hunter.cache.forEach((value, key) => {
        cacheData[key] = value;
      });
      
      await fs.writeFile(
        CONFIG.HUNTER_CACHE_FILE,
        JSON.stringify(cacheData, null, 2)
      );

    } catch (error) {
      console.error('Failed to save results:', error.message);
    }
  }

  /**
   * Print summary report
   */
  printSummary(results) {
    const { stats, coverage } = results;




    // Priority breakdown
    const byPriority = {};
    results.results.forEach(r => {
      const p = r.priority || 'Unknown';
      if (!byPriority[p]) byPriority[p] = { total: 0, withEmail: 0 };
      byPriority[p].total++;
      if (r.email) byPriority[p].withEmail++;
    });

    Object.entries(byPriority)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([priority, data]) => {
        const pct = Math.round((data.withEmail / data.total) * 100);
      });

  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  HunterClient,
  BulkVerifier,
  DealFlowPipeline,
  CONFIG
};

// ============================================
// CLI EXECUTION
// ============================================

if (require.main === module) {
  const pipeline = new DealFlowPipeline();
  
  pipeline.runPipeline().catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
}
