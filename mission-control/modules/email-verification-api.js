/**
 * Email Verification API Module
 * Integrates Hunter.io v2 API for real-time email verification
 * 
 * @module email-verification-api
 * @author Code (Backend Developer Agent)
 * @task TASK-SI-001
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

/**
 * API Configuration
 * IMPORTANT: Replace 'YOUR_HUNTER_API_KEY' with your actual Hunter.io API key
 * Get your free API key at: https://hunter.io/api
 * Free tier: 50 requests/month
 */
const CONFIG = {
  // DONE: EricF - Add your Hunter.io API key here
  API_KEY: process.env.HUNTER_API_KEY || 'YOUR_HUNTER_API_KEY',
  BASE_URL: 'api.hunter.io',
  API_VERSION: 'v2',
  TIMEOUT_MS: 10000,
  
  // Cache settings
  CACHE_DIR: path.join(__dirname, '..', '.cache'),
  CACHE_TTL_HOURS: 24, // Cache results for 24 hours
  CACHE_MAX_ENTRIES: 1000,
  
  // Rate limiting (free tier: 50 requests/month)
  MAX_REQUESTS_PER_MONTH: 50,
  RATE_LIMIT_FILE: path.join(__dirname, '..', '.cache', 'rate-limit.json'),
};

// ============================================
// CACHE MANAGEMENT
// ============================================

class Cache {
  constructor() {
    this.cachePath = path.join(CONFIG.CACHE_DIR, 'email-verification-cache.json');
    this.memory = new Map();
    this._ensureCacheDir();
    this._loadFromDisk();
  }

  _ensureCacheDir() {
    if (!fs.existsSync(CONFIG.CACHE_DIR)) {
      fs.mkdirSync(CONFIG.CACHE_DIR, { recursive: true });
    }
  }

  _loadFromDisk() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
        const now = Date.now();
        const ttlMs = CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000;
        
        // Only load non-expired entries
        Object.entries(data).forEach(([key, entry]) => {
          if (now - entry.timestamp < ttlMs) {
            this.memory.set(key, entry);
          }
        });
        
      }
    } catch (error) {
      console.warn('[EmailVerification] Failed to load cache:', error.message);
    }
  }

  _saveToDisk() {
    try {
      const data = {};
      this.memory.forEach((value, key) => {
        data[key] = value;
      });
      fs.writeFileSync(this.cachePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('[EmailVerification] Failed to save cache:', error.message);
    }
  }

  get(key) {
    const entry = this.memory.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const ttlMs = CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000;
    
    if (now - entry.timestamp > ttlMs) {
      this.memory.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data) {
    // Enforce max entries limit (LRU eviction)
    if (this.memory.size >= CONFIG.CACHE_MAX_ENTRIES) {
      const oldestKey = this.memory.keys().next().value;
      this.memory.delete(oldestKey);
    }
    
    this.memory.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Async save to disk
    setImmediate(() => this._saveToDisk());
  }

  clear() {
    this.memory.clear();
    this._saveToDisk();
  }

  getStats() {
    return {
      entries: this.memory.size,
      cachePath: this.cachePath
    };
  }
}

// Global cache instance
const cache = new Cache();

// ============================================
// RATE LIMITING
// ============================================

class RateLimiter {
  constructor() {
    this.rateLimitPath = CONFIG.RATE_LIMIT_FILE;
    this._ensureRateLimitFile();
  }

  _ensureRateLimitFile() {
    if (!fs.existsSync(CONFIG.CACHE_DIR)) {
      fs.mkdirSync(CONFIG.CACHE_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(this.rateLimitPath)) {
      this._resetMonthlyCount();
    }
  }

  _resetMonthlyCount() {
    const data = {
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      count: 0,
      lastReset: new Date().toISOString()
    };
    fs.writeFileSync(this.rateLimitPath, JSON.stringify(data, null, 2));
    return data;
  }

  _getCurrentData() {
    try {
      const data = JSON.parse(fs.readFileSync(this.rateLimitPath, 'utf8'));
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Reset if new month
      if (data.month !== currentMonth) {
        return this._resetMonthlyCount();
      }
      
      return data;
    } catch (error) {
      return this._resetMonthlyCount();
    }
  }

  canMakeRequest() {
    const data = this._getCurrentData();
    return data.count < CONFIG.MAX_REQUESTS_PER_MONTH;
  }

  recordRequest() {
    const data = this._getCurrentData();
    data.count++;
    data.lastRequest = new Date().toISOString();
    fs.writeFileSync(this.rateLimitPath, JSON.stringify(data, null, 2));
    return {
      used: data.count,
      remaining: CONFIG.MAX_REQUESTS_PER_MONTH - data.count,
      limit: CONFIG.MAX_REQUESTS_PER_MONTH
    };
  }

  getStatus() {
    const data = this._getCurrentData();
    return {
      used: data.count,
      remaining: CONFIG.MAX_REQUESTS_PER_MONTH - data.count,
      limit: CONFIG.MAX_REQUESTS_PER_MONTH,
      month: data.month,
      canMakeRequest: data.count < CONFIG.MAX_REQUESTS_PER_MONTH
    };
  }
}

const rateLimiter = new RateLimiter();

// ============================================
// HTTP CLIENT
// ============================================

/**
 * Make HTTPS request to Hunter.io API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
function makeApiRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
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
        'User-Agent': 'MissionControl-EmailVerification/1.0'
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
          
          // Handle API errors
          if (parsed.errors) {
            reject(new Error(`API Error: ${JSON.stringify(parsed.errors)}`));
            return;
          }
          
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
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
// PATTERN-BASED FALLBACK
// ============================================

/**
 * Common email patterns by domain
 * Used as fallback when API limit is reached
 */
const DOMAIN_PATTERNS = {
  'gmail.com': ['{first}', '{last}', '{first}.{last}', '{first}{last}'],
  'yahoo.com': ['{first}', '{last}', '{first}.{last}', '{first}_{last}'],
  'outlook.com': ['{first}', '{last}', '{first}.{last}', '{first}{last}'],
  'hotmail.com': ['{first}', '{last}', '{first}.{last}', '{first}{last}'],
  'icloud.com': ['{first}', '{last}', '{first}.{last}'],
  'protonmail.com': ['{first}', '{last}', '{first}.{last}'],
  'aol.com': ['{first}', '{last}', '{first}.{last}'],
};

/**
 * Generate email patterns based on domain
 * @param {string} domain - Email domain
 * @returns {string[]} Array of likely patterns
 */
function getFallbackPatterns(domain) {
  const lowerDomain = domain.toLowerCase();
  
  // Known domain patterns
  if (DOMAIN_PATTERNS[lowerDomain]) {
    return DOMAIN_PATTERNS[lowerDomain];
  }
  
  // Generic patterns for unknown domains
  return [
    '{first}',
    '{last}',
    '{first}.{last}',
    '{first}{last}',
    '{first}_{last}',
    '{first}-{last}',
    '{f}{last}',
    '{first}{l}'
  ];
}

/**
 * Generate fallback verification result
 * @param {string} email - Email to verify
 * @returns {Object} Fallback result
 */
function generateFallbackResult(email) {
  const [, domain] = email.split('@');
  
  return {
    email,
    status: 'unknown',
    result: 'fallback',
    score: null,
    regexp: true,
    gibberish: false,
    disposable: false,
    webmail: isWebmailDomain(domain),
    mx_records: null,
    smtp_server: null,
    smtp_check: null,
    accept_all: null,
    block: null,
    sources: [],
    _fallback: true,
    _message: 'API limit reached. Using pattern-based fallback.',
    suggestedPatterns: getFallbackPatterns(domain)
  };
}

/**
 * Check if domain is a known webmail provider
 * @param {string} domain - Email domain
 * @returns {boolean}
 */
function isWebmailDomain(domain) {
  const webmailDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
    'yandex.com', 'zoho.com', 'gmx.com', 'live.com'
  ];
  return webmailDomains.includes(domain.toLowerCase());
}

// ============================================
// EMAIL VALIDATION UTILS
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email address
 * @param {string} email - Email to normalize
 * @returns {string}
 */
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Verify a single email address
 * @param {string} email - Email address to verify
 * @returns {Promise<Object>} Verification result
 * 
 * Response format:
 * {
 *   email: string,
 *   status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'unknown',
 *   result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown',
 *   score: number (0-100),
 *   regexp: boolean,
 *   gibberish: boolean,
 *   disposable: boolean,
 *   webmail: boolean,
 *   mx_records: boolean,
 *   smtp_server: boolean,
 *   smtp_check: boolean,
 *   accept_all: boolean,
 *   block: boolean,
 *   sources: Array<{domain: string, extracted_on: string, last_seen_on: string}>
 * }
 */
async function verifyEmail(email) {
  // Validate input
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string');
  }
  
  const normalizedEmail = normalizeEmail(email);
  
  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      email: normalizedEmail,
      status: 'invalid',
      result: 'undeliverable',
      score: 0,
      regexp: false,
      _error: 'Invalid email format'
    };
  }

  // Check cache first
  const cached = cache.get(`email:${normalizedEmail}`);
  if (cached) {
    return { ...cached, _cached: true };
  }

  // Check if we can make API request
  if (!rateLimiter.canMakeRequest()) {
    console.warn('[EmailVerification] API limit reached, using fallback');
    return generateFallbackResult(normalizedEmail);
  }

  // Check if API key is configured
  if (CONFIG.API_KEY === 'YOUR_HUNTER_API_KEY') {
    console.warn('[EmailVerification] API key not configured, using fallback');
    return generateFallbackResult(normalizedEmail);
  }

  try {
    const response = await makeApiRequest('email-verifier', {
      email: normalizedEmail
    });

    // Record API usage
    const rateLimit = rateLimiter.recordRequest();

    // Transform response
    const result = {
      email: response.data?.email || normalizedEmail,
      status: response.data?.status,
      result: response.data?.result,
      score: response.data?.score,
      regexp: response.data?.regexp,
      gibberish: response.data?.gibberish,
      disposable: response.data?.disposable,
      webmail: response.data?.webmail,
      mx_records: response.data?.mx_records,
      smtp_server: response.data?.smtp_server,
      smtp_check: response.data?.smtp_check,
      accept_all: response.data?.accept_all,
      block: response.data?.block,
      sources: response.data?.sources || [],
      _rateLimit: rateLimit
    };

    // Cache the result
    cache.set(`email:${normalizedEmail}`, result);

    return result;
  } catch (error) {
    console.error('[EmailVerification] API error:', error.message);
    
    // Return fallback on API error
    return generateFallbackResult(normalizedEmail);
  }
}

/**
 * Verify multiple email addresses in batch
 * @param {string[]} emails - Array of email addresses
 * @param {Object} options - Batch options
 * @param {number} options.concurrency - Max concurrent requests (default: 3)
 * @returns {Promise<Object>} Batch verification results
 * 
 * Response format:
 * {
 *   results: Array<Object>,
 *   summary: {
 *     total: number,
 *     valid: number,
 *     invalid: number,
 *     risky: number,
 *     unknown: number,
 *     cached: number,
 *     fallback: number
 *   },
 *   rateLimit: Object
 * }
 */
async function verifyBatch(emails, options = {}) {
  if (!Array.isArray(emails)) {
    throw new Error('Emails must be an array');
  }

  const { concurrency = 3 } = options;
  
  // Remove duplicates and normalize
  const uniqueEmails = [...new Set(emails.map(normalizeEmail))];
  

  const results = [];
  let cached = 0;
  let fallback = 0;

  // Process in batches to control concurrency
  for (let i = 0; i < uniqueEmails.length; i += concurrency) {
    const batch = uniqueEmails.slice(i, i + concurrency);
    const batchPromises = batch.map(email => verifyEmail(email));
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      results.push(result);
      if (result._cached) cached++;
      if (result._fallback) fallback++;
    });

    // Small delay between batches to be nice to the API
    if (i + concurrency < uniqueEmails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calculate summary
  const summary = {
    total: results.length,
    valid: results.filter(r => r.result === 'deliverable' && !r._fallback).length,
    invalid: results.filter(r => r.result === 'undeliverable' && !r._fallback).length,
    risky: results.filter(r => r.result === 'risky' && !r._fallback).length,
    unknown: results.filter(r => r.result === 'unknown' || r._fallback).length,
    cached,
    fallback
  };

  return {
    results,
    summary,
    rateLimit: rateLimiter.getStatus()
  };
}

/**
 * Get domain information and email patterns
 * @param {string} domain - Domain to lookup (e.g., 'stripe.com')
 * @returns {Promise<Object>} Domain information
 * 
 * Response format:
 * {
 *   domain: string,
 *   disposable: boolean,
 *   webmail: boolean,
 *   accept_all: boolean,
 *   registered: boolean,
 *   pattern: string | null,
 *   organization: string | null,
 *   description: string | null,
 *   industry: string | null,
 *   twitter: string | null,
 *   facebook: string | null,
 *   linkedin: string | null,
 *   instagram: string | null,
 *   youtube: string | null,
 *   technologies: string[],
 *   email_count: number,
 *   emails: Array<{value: string, type: string}>
 * }
 */
async function getDomainInfo(domain) {
  if (!domain || typeof domain !== 'string') {
    throw new Error('Domain is required and must be a string');
  }

  // Remove protocol and path if present
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

  // Check cache first
  const cached = cache.get(`domain:${cleanDomain}`);
  if (cached) {
    return { ...cached, _cached: true };
  }

  // Check if we can make API request
  if (!rateLimiter.canMakeRequest()) {
    console.warn('[EmailVerification] API limit reached, using fallback');
    return {
      domain: cleanDomain,
      pattern: null,
      patterns: getFallbackPatterns(cleanDomain),
      _fallback: true,
      _message: 'API limit reached. Using generic patterns.'
    };
  }

  // Check if API key is configured
  if (CONFIG.API_KEY === 'YOUR_HUNTER_API_KEY') {
    console.warn('[EmailVerification] API key not configured, using fallback');
    return {
      domain: cleanDomain,
      pattern: null,
      patterns: getFallbackPatterns(cleanDomain),
      _fallback: true,
      _message: 'API key not configured. Using generic patterns.'
    };
  }

  try {
    const response = await makeApiRequest('domain-search', {
      domain: cleanDomain,
      limit: 10
    });

    // Record API usage
    const rateLimit = rateLimiter.recordRequest();

    const result = {
      domain: response.data?.domain || cleanDomain,
      disposable: response.data?.disposable,
      webmail: response.data?.webmail,
      accept_all: response.data?.accept_all,
      registered: response.data?.registered,
      pattern: response.data?.pattern,
      organization: response.data?.organization,
      description: response.data?.description,
      industry: response.data?.industry,
      twitter: response.data?.twitter,
      facebook: response.data?.facebook,
      linkedin: response.data?.linkedin,
      instagram: response.data?.instagram,
      youtube: response.data?.youtube,
      technologies: response.data?.technologies || [],
      email_count: response.data?.emails?.length || 0,
      emails: (response.data?.emails || []).map(e => ({
        value: e.value,
        type: e.type,
        confidence: e.confidence,
        sources: e.sources?.length || 0
      })),
      _rateLimit: rateLimit
    };

    // Cache the result
    cache.set(`domain:${cleanDomain}`, result);

    return result;
  } catch (error) {
    console.error('[EmailVerification] API error:', error.message);
    
    return {
      domain: cleanDomain,
      pattern: null,
      patterns: getFallbackPatterns(cleanDomain),
      _fallback: true,
      _error: error.message
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get module statistics
 * @returns {Object} Module stats
 */
function getStats() {
  return {
    cache: cache.getStats(),
    rateLimit: rateLimiter.getStatus()
  };
}

/**
 * Clear the cache
 */
function clearCache() {
  cache.clear();
}

/**
 * Reset rate limit counter (for testing)
 */
function resetRateLimit() {
  rateLimiter._resetMonthlyCount();
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Main functions
  verifyEmail,
  verifyBatch,
  getDomainInfo,
  
  // Utility functions
  getStats,
  clearCache,
  resetRateLimit,
  
  // Configuration (read-only access)
  getConfig: () => ({ ...CONFIG }),
  
  // For testing
  _cache: cache,
  _rateLimiter: rateLimiter
};
