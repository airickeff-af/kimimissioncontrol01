/**
 * PIE - News Source Integrations
 * 
 * RSS, API, and Web Scraping integrations for the Opportunity Radar
 * 
 * @module news-integrations
 * @author Glasses (Researcher Agent)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ============================================================================
// BASE INTEGRATION CLASS
// ============================================================================

class NewsSource {
  constructor(config) {
    this.name = config.name;
    this.type = config.type;
    this.url = config.url;
    this.apiKey = config.apiKey || null;
    this.rateLimit = config.rateLimit || 1000; // ms between requests
    this.lastRequest = 0;
  }

  async rateLimitCheck() {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequest;
    
    if (timeSinceLast < this.rateLimit) {
      await this.sleep(this.rateLimit - timeSinceLast);
    }
    
    this.lastRequest = Date.now();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetch() {
    throw new Error('fetch() must be implemented by subclass');
  }

  normalize(item) {
    return {
      title: item.title || '',
      description: item.description || '',
      link: item.link || item.url || '',
      published: new Date(item.published || item.pubDate || item.date || Date.now()),
      author: item.author || item.creator || null,
      source: this.name,
      categories: item.categories || []
    };
  }
}

// ============================================================================
// RSS INTEGRATION
// ============================================================================

class RSSSource extends NewsSource {
  constructor(config) {
    super({ ...config, type: 'rss' });
  }

  async fetch() {
    await this.rateLimitCheck();
    
    const response = await this.httpRequest(this.url);
    const items = this.parseRSS(response.body);
    
    return items.map(item => this.normalize(item));
  }

  parseRSS(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    
    const patterns = {
      title: /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/,
      link: /<link>(.*?)<\/link>/,
      description: /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/,
      pubDate: /<pubDate>(.*?)<\/pubDate>/,
      author: /<(?:dc:creator|author)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:dc:creator|author)>/i,
      category: /<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi
    };

    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      
      const item = {};
      
      for (const [field, regex] of Object.entries(patterns)) {
        if (field === 'category') {
          const categories = [];
          let catMatch;
          while ((catMatch = regex.exec(content)) !== null) {
            categories.push(this.cleanText(catMatch[1]));
          }
          item.categories = categories;
        } else {
          const fieldMatch = content.match(regex);
          if (fieldMatch) {
            item[field] = this.cleanText(fieldMatch[1]);
          }
        }
      }
      
      if (item.title && item.link) {
        items.push(item);
      }
    }

    return items;
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'OpportunityRadar/1.0 (Intelligence Engine)',
          'Accept': 'application/rss+xml, text/xml, */*'
        },
        timeout: 15000
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
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
}

// ============================================================================
// API INTEGRATIONS
// ============================================================================

class CryptoPanicSource extends NewsSource {
  constructor(apiKey) {
    super({
      name: 'CryptoPanic',
      type: 'api',
      url: 'https://cryptopanic.com/api/v1/posts/',
      apiKey,
      rateLimit: 2000
    });
  }

  async fetch(filters = {}) {
    await this.rateLimitCheck();
    
    const params = new URLSearchParams({
      auth_token: this.apiKey,
      public: 'true',
      ...filters
    });

    const response = await this.httpRequest(`${this.url}?${params}`);
    const data = JSON.parse(response.body);
    
    return data.results.map(item => this.normalize({
      title: item.title,
      description: item.metadata?.description || '',
      link: item.url,
      published: item.created_at,
      author: item.source?.title,
      categories: item.currencies?.map(c => c.code) || []
    }));
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'OpportunityRadar/1.0',
          'Accept': 'application/json'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
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
}

class NewsAPISource extends NewsSource {
  constructor(apiKey) {
    super({
      name: 'NewsAPI',
      type: 'api',
      url: 'https://newsapi.org/v2/everything',
      apiKey,
      rateLimit: 1000
    });
  }

  async fetch(query, options = {}) {
    await this.rateLimitCheck();
    
    const params = new URLSearchParams({
      q: query,
      apiKey: this.apiKey,
      sortBy: options.sortBy || 'publishedAt',
      language: options.language || 'en',
      pageSize: options.limit || 20,
      ...options
    });

    const response = await this.httpRequest(`${this.url}?${params}`);
    const data = JSON.parse(response.body);
    
    return data.articles.map(item => this.normalize({
      title: item.title,
      description: item.description,
      link: item.url,
      published: item.publishedAt,
      author: item.author,
      source: item.source?.name
    }));
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'OpportunityRadar/1.0',
          'Accept': 'application/json'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
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
}

// ============================================================================
// WEB SCRAPING INTEGRATIONS
// ============================================================================

class WebScraper {
  constructor(config) {
    this.name = config.name;
    this.url = config.url;
    this.selectors = config.selectors;
    this.rateLimit = config.rateLimit || 2000;
    this.lastRequest = 0;
  }

  async rateLimitCheck() {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequest;
    
    if (timeSinceLast < this.rateLimit) {
      await this.sleep(this.rateLimit - timeSinceLast);
    }
    
    this.lastRequest = Date.now();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetch() {
    await this.rateLimitCheck();
    
    const response = await this.httpRequest(this.url);
    const items = this.parseHTML(response.body);
    
    return items;
  }

  parseHTML(html) {
    const items = [];
    
    // Extract items using regex patterns
    const itemPattern = new RegExp(this.selectors.item, 'gi');
    const titlePattern = new RegExp(this.selectors.title, 'i');
    const linkPattern = new RegExp(this.selectors.link, 'i');
    const descPattern = this.selectors.description ? new RegExp(this.selectors.description, 'i') : null;
    
    let match;
    while ((match = itemPattern.exec(html)) !== null) {
      const itemHtml = match[0];
      
      const titleMatch = itemHtml.match(titlePattern);
      const linkMatch = itemHtml.match(linkPattern);
      
      if (titleMatch && linkMatch) {
        const item = {
          title: this.cleanHTML(titleMatch[1]),
          link: this.resolveURL(linkMatch[1]),
          description: descPattern ? this.cleanHTML(itemHtml.match(descPattern)?.[1] || '') : '',
          published: new Date(),
          source: this.name
        };
        
        items.push(item);
      }
    }
    
    return items;
  }

  cleanHTML(html) {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  resolveURL(url) {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    
    const base = new URL(this.url);
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.hostname}${url}`;
    }
    return `${base.protocol}//${base.hostname}/${url}`;
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
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
}

// ============================================================================
// SOURCE REGISTRY
// ============================================================================

const RSS_SOURCES = [
  // Crypto News
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'TheBlock', url: 'https://www.theblock.co/rss.xml' },
  { name: 'BitcoinMagazine', url: 'https://bitcoinmagazine.com/feed' },
  { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/' },
  
  // Startup/Funding
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/' },
  { name: 'CrunchbaseNews', url: 'https://news.crunchbase.com/feed/' },
  { name: 'PitchBook', url: 'https://pitchbook.com/news/feed' },
  
  // NFT/Metaverse
  { name: 'NFTNow', url: 'https://nftnow.com/feed/' },
  { name: 'NFTPlazas', url: 'https://nftplazas.com/feed/' }
];

const WEB_SCRAPERS = [
  {
    name: 'DappRadar',
    url: 'https://dappradar.com/blog',
    selectors: {
      item: '<article[^>]*>([\s\S]*?)<\/article>',
      title: '<h[1-6][^>]*>(.*?)<\/h[1-6]>',
      link: 'href="([^"]+)"',
      description: '<p[^>]*>(.*?)<\/p>'
    }
  }
];

// ============================================================================
// SOURCE MANAGER
// ============================================================================

class SourceManager {
  constructor() {
    this.sources = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    // Register RSS sources
    for (const config of RSS_SOURCES) {
      this.register(new RSSSource(config));
    }

    // Register web scrapers
    for (const config of WEB_SCRAPERS) {
      this.register(new WebScraper(config));
    }
  }

  register(source) {
    this.sources.set(source.name, source);
  }

  unregister(name) {
    this.sources.delete(name);
  }

  get(name) {
    return this.sources.get(name);
  }

  getAll() {
    return Array.from(this.sources.values());
  }

  getByType(type) {
    return this.getAll().filter(s => s.type === type);
  }

  async fetchAll() {
    const results = [];
    
    for (const source of this.sources.values()) {
      try {
        const items = await source.fetch();
        results.push({ source: source.name, items, error: null });
      } catch (error) {
        results.push({ source: source.name, items: [], error: error.message });
      }
    }
    
    return results;
  }

  async fetchSource(name) {
    const source = this.sources.get(name);
    if (!source) {
      throw new Error(`Source "${name}" not found`);
    }
    return source.fetch();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  NewsSource,
  RSSSource,
  CryptoPanicSource,
  NewsAPISource,
  WebScraper,
  SourceManager,
  RSS_SOURCES,
  WEB_SCRAPERS
};
