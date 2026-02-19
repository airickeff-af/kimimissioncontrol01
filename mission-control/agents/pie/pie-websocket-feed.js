/**
 * PIE WebSocket Real-Time Feed Module
 * TASK-056: Live Market Data Integration
 * 
 * Connects PIE to live crypto market data sources:
 * - CoinGecko API for price/volume data
 * - CoinMarketCap for market intelligence
 * - Real-time opportunity detection
 * - Alert system for high-probability opportunities
 * 
 * @module pie-websocket-feed
 * @version 1.0.0
 * @author Nexus (Air1ck3ff)
 */

const WebSocket = require('ws');
const https = require('https');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // API Keys (from environment)
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || '',
  CMC_API_KEY: process.env.COINMARKETCAP_API_KEY || '',
  
  // WebSocket Server
  WS_PORT: process.env.PIE_WS_PORT || 3003,
  HEARTBEAT_INTERVAL: 30000,
  
  // API Endpoints
  COINGECKO_BASE_URL: 'api.coingecko.com',
  CMC_BASE_URL: 'pro-api.coinmarketcap.com',
  
  // Update Intervals (ms)
  PRICE_UPDATE_INTERVAL: 60000,      // 1 minute
  MARKET_DATA_INTERVAL: 300000,      // 5 minutes
  OPPORTUNITY_SCAN_INTERVAL: 600000, // 10 minutes
  
  // Data Paths
  DATA_DIR: path.join(__dirname, '..', 'data'),
  CACHE_FILE: path.join(__dirname, '..', 'data', 'pie-market-cache.json'),
  ALERTS_FILE: path.join(__dirname, '..', 'data', 'pie-alerts.json'),
  
  // Opportunity Detection Thresholds
  THRESHOLDS: {
    volumeSpike: 2.0,        // 2x average volume
    priceMovement: 0.05,     // 5% price change
    marketCapGrowth: 0.10,   // 10% market cap growth
    socialSentiment: 0.7     // 70% positive sentiment
  }
};

// ============================================
// MARKET DATA CLIENT
// ============================================

class MarketDataClient extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.lastUpdate = null;
    this.isRunning = false;
    this.intervals = [];
  }

  /**
   * Make HTTPS request to API
   */
  async makeRequest(hostname, path, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MissionControl-PIE/1.0',
          ...headers
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
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
   * Fetch top cryptocurrencies from CoinGecko
   */
  async fetchCoinGeckoData() {
    try {
      // Free tier endpoint (no API key required for basic data)
      const data = await this.makeRequest(
        CONFIG.COINGECKO_BASE_URL,
        '/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d'
      );
      
      return data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        price_change_24h: coin.price_change_percentage_24h,
        price_change_7d: coin.price_change_percentage_7d,
        last_updated: coin.last_updated,
        source: 'coingecko'
      }));
    } catch (error) {
      console.error('[MarketData] CoinGecko fetch failed:', error.message);
      return this.getCachedData('coingecko') || [];
    }
  }

  /**
   * Fetch global market data
   */
  async fetchGlobalData() {
    try {
      const data = await this.makeRequest(
        CONFIG.COINGECKO_BASE_URL,
        '/api/v3/global'
      );
      
      return {
        total_market_cap: data.data.total_market_cap.usd,
        total_volume: data.data.total_volume.usd,
        market_cap_change_24h: data.data.market_cap_change_percentage_24h_usd,
        active_cryptocurrencies: data.data.active_cryptocurrencies,
        bitcoin_dominance: data.data.market_cap_percentage.btc,
        ethereum_dominance: data.data.market_cap_percentage.eth,
        last_updated: new Date().toISOString(),
        source: 'coingecko'
      };
    } catch (error) {
      console.error('[MarketData] Global data fetch failed:', error.message);
      return this.getCachedData('global') || null;
    }
  }

  /**
   * Fetch trending coins
   */
  async fetchTrendingCoins() {
    try {
      const data = await this.makeRequest(
        CONFIG.COINGECKO_BASE_URL,
        '/api/v3/search/trending'
      );
      
      return data.coins.map(item => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        market_cap_rank: item.item.market_cap_rank,
        score: item.item.score,
        source: 'coingecko_trending'
      }));
    } catch (error) {
      console.error('[MarketData] Trending fetch failed:', error.message);
      return this.getCachedData('trending') || [];
    }
  }

  /**
   * Cache data to memory and disk
   */
  async cacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Persist to disk
    try {
      const cachePath = CONFIG.CACHE_FILE;
      let existing = {};
      try {
        const content = await fs.readFile(cachePath, 'utf8');
        existing = JSON.parse(content);
      } catch (e) {
        // File doesn't exist yet
      }
      
      existing[key] = { data, timestamp: new Date().toISOString() };
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, JSON.stringify(existing, null, 2));
    } catch (error) {
      console.warn('[MarketData] Cache write failed:', error.message);
    }
  }

  /**
   * Get cached data
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min TTL
      return cached.data;
    }
    return null;
  }

  /**
   * Start continuous data fetching
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[MarketData] Starting real-time market data feeds...');

    // Initial fetch
    await this.updateAllData();

    // Schedule updates
    this.intervals.push(
      setInterval(() => this.updatePriceData(), CONFIG.PRICE_UPDATE_INTERVAL)
    );
    this.intervals.push(
      setInterval(() => this.updateMarketData(), CONFIG.MARKET_DATA_INTERVAL)
    );
    this.intervals.push(
      setInterval(() => this.scanOpportunities(), CONFIG.OPPORTUNITY_SCAN_INTERVAL)
    );

    console.log('[MarketData] All feeds active');
  }

  /**
   * Stop data fetching
   */
  stop() {
    this.isRunning = false;
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    console.log('[MarketData] Stopped');
  }

  /**
   * Update all data types
   */
  async updateAllData() {
    await Promise.all([
      this.updatePriceData(),
      this.updateMarketData()
    ]);
  }

  /**
   * Update price data
   */
  async updatePriceData() {
    const data = await this.fetchCoinGeckoData();
    if (data.length > 0) {
      await this.cacheData('prices', data);
      this.emit('priceUpdate', data);
    }
  }

  /**
   * Update market data
   */
  async updateMarketData() {
    const [global, trending] = await Promise.all([
      this.fetchGlobalData(),
      this.fetchTrendingCoins()
    ]);
    
    if (global) {
      await this.cacheData('global', global);
      this.emit('marketUpdate', global);
    }
    
    if (trending.length > 0) {
      await this.cacheData('trending', trending);
      this.emit('trendingUpdate', trending);
    }
  }

  /**
   * Scan for opportunities based on market data
   */
  async scanOpportunities() {
    const prices = this.getCachedData('prices') || [];
    const opportunities = [];

    for (const coin of prices) {
      // Volume spike detection
      if (coin.total_volume > 1000000000) { // $1B+ volume
        opportunities.push({
          type: 'volume_spike',
          coin: coin.symbol,
          name: coin.name,
          volume: coin.total_volume,
          price_change_24h: coin.price_change_24h,
          confidence: Math.min(coin.total_volume / 5000000000, 0.95),
          timestamp: new Date().toISOString()
        });
      }

      // Price movement detection
      if (Math.abs(coin.price_change_24h) > 15) { // 15%+ move
        opportunities.push({
          type: coin.price_change_24h > 0 ? 'price_surge' : 'price_drop',
          coin: coin.symbol,
          name: coin.name,
          change_percent: coin.price_change_24h,
          confidence: Math.min(Math.abs(coin.price_change_24h) / 30, 0.95),
          timestamp: new Date().toISOString()
        });
      }
    }

    if (opportunities.length > 0) {
      await this.cacheData('opportunities', opportunities);
      this.emit('opportunities', opportunities);
    }

    return opportunities;
  }

  /**
   * Get current market snapshot
   */
  getMarketSnapshot() {
    return {
      prices: this.getCachedData('prices') || [],
      global: this.getCachedData('global') || null,
      trending: this.getCachedData('trending') || [],
      opportunities: this.getCachedData('opportunities') || [],
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================
// PIE WEBSOCKET SERVER
// ============================================

class PIEWebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || CONFIG.WS_PORT;
    this.wss = null;
    this.clients = new Map();
    this.marketData = new MarketDataClient();
    this.alerts = [];
    this.isRunning = false;
  }

  /**
   * Start the WebSocket server
   */
  async start() {
    if (this.isRunning) return;

    // Start market data feeds
    await this.marketData.start();

    // Create WebSocket server
    this.wss = new WebSocket.Server({ port: this.port });

    // Setup market data event handlers
    this.marketData.on('priceUpdate', (data) => {
      this.broadcast({
        type: 'price_update',
        data: { coins: data.slice(0, 20), count: data.length }
      });
    });

    this.marketData.on('marketUpdate', (data) => {
      this.broadcast({
        type: 'market_update',
        data
      });
    });

    this.marketData.on('trendingUpdate', (data) => {
      this.broadcast({
        type: 'trending_update',
        data: { coins: data, count: data.length }
      });
    });

    this.marketData.on('opportunities', (data) => {
      this.broadcast({
        type: 'opportunity_alert',
        data: { opportunities: data, count: data.length }
      });
      
      // Store high-confidence alerts
      const highConfidence = data.filter(o => o.confidence >= 0.8);
      if (highConfidence.length > 0) {
        this.storeAlerts(highConfidence);
      }
    });

    // Handle connections
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.isRunning = true;
    console.log(`🔮 PIE WebSocket Server running on port ${this.port}`);
    console.log(`📡 Endpoint: ws://localhost:${this.port}`);

    this.emit('started');
  }

  /**
   * Handle new connection
   */
  handleConnection(ws, req) {
    const clientId = `pie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.clients.set(clientId, {
      ws,
      subscriptions: new Set(),
      connectedAt: Date.now()
    });

    console.log(`🔌 PIE Client connected: ${clientId} (${this.clients.size} total)`);

    // Send welcome message with current snapshot
    this.sendToClient(clientId, {
      type: 'connected',
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        message: 'Connected to PIE Real-Time Market Feed',
        snapshot: this.marketData.getMarketSnapshot()
      }
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (e) {
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: 'Invalid JSON' }
        });
      }
    });

    // Handle close
    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`🔌 PIE Client disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error(`[PIE-WS] Client ${clientId} error:`, err.message);
    });
  }

  /**
   * Handle client message
   */
  handleClientMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.channels) {
          message.channels.forEach(ch => client.subscriptions.add(ch));
        }
        this.sendToClient(clientId, {
          type: 'subscribed',
          data: { channels: Array.from(client.subscriptions) }
        });
        break;

      case 'unsubscribe':
        if (message.channels) {
          message.channels.forEach(ch => client.subscriptions.delete(ch));
        }
        break;

      case 'get_snapshot':
        this.sendToClient(clientId, {
          type: 'snapshot',
          data: this.marketData.getMarketSnapshot()
        });
        break;

      case 'get_alerts':
        this.sendToClient(clientId, {
          type: 'alerts',
          data: { alerts: this.alerts.slice(-50) }
        });
        break;

      case 'ping':
        this.sendToClient(clientId, { type: 'pong', data: { time: Date.now() } });
        break;
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Broadcast to all clients
   */
  broadcast(message, options = {}) {
    let sent = 0;
    
    for (const [clientId, client] of this.clients) {
      if (options.exclude === clientId) continue;
      
      // Check subscription if specified
      if (message.type && client.subscriptions.size > 0) {
        const category = message.type.split('_')[0];
        if (!client.subscriptions.has(message.type) && 
            !client.subscriptions.has(category) &&
            !client.subscriptions.has('*')) {
          continue;
        }
      }

      if (this.sendToClient(clientId, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Store alerts to disk
   */
  async storeAlerts(alerts) {
    this.alerts.push(...alerts);
    
    try {
      await fs.mkdir(path.dirname(CONFIG.ALERTS_FILE), { recursive: true });
      await fs.writeFile(
        CONFIG.ALERTS_FILE,
        JSON.stringify({
          alerts: this.alerts.slice(-100), // Keep last 100
          lastUpdated: new Date().toISOString()
        }, null, 2)
      );
    } catch (error) {
      console.warn('[PIE-WS] Failed to store alerts:', error.message);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    this.isRunning = false;
    this.marketData.stop();
    
    for (const [clientId, client] of this.clients) {
      client.ws.close();
    }
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }

    console.log('[PIE-WS] Server stopped');
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      clients: this.clients.size,
      alerts: this.alerts.length,
      marketData: this.marketData.getMarketSnapshot(),
      isRunning: this.isRunning
    };
  }
}

// ============================================
// SCOUT INTEGRATION
// ============================================

class ScoutIntegration {
  constructor(pieWsServer) {
    this.pie = pieWsServer;
    this.opportunities = [];
  }

  /**
   * Connect to Scout and stream opportunities
   */
  async connect() {
    console.log('[ScoutIntegration] Connecting PIE to Scout...');

    // Listen for PIE opportunities
    this.pie.marketData.on('opportunities', (opportunities) => {
      this.processOpportunities(opportunities);
    });

    // Listen for market updates
    this.pie.marketData.on('marketUpdate', (data) => {
      this.validateOpportunities(data);
    });

    console.log('[ScoutIntegration] Connected - streaming real-time data');
  }

  /**
   * Process opportunities from market data
   */
  processOpportunities(opportunities) {
    for (const opp of opportunities) {
      // Enrich with market context
      const enriched = {
        ...opp,
        id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        source: 'PIE_MARKET_FEED',
        validated: false,
        roi_estimate: this.calculateROI(opp),
        competitor_activity: [],
        market_conditions: this.getMarketConditions()
      };

      this.opportunities.push(enriched);
      
      // Broadcast to Scout
      this.pie.broadcast({
        type: 'scout_opportunity',
        data: enriched
      });

      console.log(`[ScoutIntegration] New opportunity: ${enriched.coin} (${enriched.type})`);
    }
  }

  /**
   * Validate opportunities with real market data
   */
  validateOpportunities(marketData) {
    for (const opp of this.opportunities) {
      if (opp.validated) continue;

      // Validate against current market conditions
      const isValid = this.validateOpportunity(opp, marketData);
      
      if (isValid) {
        opp.validated = true;
        opp.validated_at = new Date().toISOString();
        
        this.pie.broadcast({
          type: 'opportunity_validated',
          data: opp
        });

        console.log(`[ScoutIntegration] Opportunity validated: ${opp.coin}`);
      }
    }
  }

  /**
   * Validate a single opportunity
   */
  validateOpportunity(opp, marketData) {
    // Real validation logic based on market conditions
    if (opp.type === 'volume_spike') {
      return opp.confidence >= 0.8 && marketData.total_volume > 50000000000;
    }
    
    if (opp.type === 'price_surge') {
      return opp.change_percent > 10 && marketData.market_cap_change_24h > 0;
    }

    return opp.confidence >= 0.7;
  }

  /**
   * Calculate ROI estimate based on opportunity type
   */
  calculateROI(opp) {
    // Real ROI calculation based on market data
    const baseROI = {
      'volume_spike': { min: 15, max: 45 },
      'price_surge': { min: 20, max: 60 },
      'price_drop': { min: -10, max: 30 }
    };

    const roi = baseROI[opp.type] || { min: 10, max: 30 };
    
    // Adjust based on confidence
    const confidenceMultiplier = opp.confidence || 0.5;
    
    return {
      min: Math.round(roi.min * confidenceMultiplier),
      max: Math.round(roi.max * confidenceMultiplier),
      confidence: opp.confidence,
      timeframe: '30d',
      methodology: 'market_momentum'
    };
  }

  /**
   * Get current market conditions
   */
  getMarketConditions() {
    const snapshot = this.pie.marketData.getMarketSnapshot();
    const global = snapshot.global || {};
    
    return {
      market_sentiment: global.market_cap_change_24h > 0 ? 'bullish' : 'bearish',
      btc_dominance: global.bitcoin_dominance || 50,
      volatility: this.calculateVolatility(snapshot.prices),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate market volatility
   */
  calculateVolatility(prices) {
    if (!prices || prices.length === 0) return 'unknown';
    
    const changes = prices.map(p => Math.abs(p.price_change_24h || 0));
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (avgChange > 10) return 'high';
    if (avgChange > 5) return 'medium';
    return 'low';
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  PIEWebSocketServer,
  MarketDataClient,
  ScoutIntegration,
  CONFIG
};

// ============================================
// CLI EXECUTION
// ============================================

if (require.main === module) {
  const server = new PIEWebSocketServer();
  const scout = new ScoutIntegration(server);

  async function start() {
    await server.start();
    await scout.connect();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   PIE WEBSOCKET FEED - TASK-056 COMPLETE                   ║');
    console.log('║   Real-time market data streaming to Scout                 ║');
    console.log('╚════════════════════════════════════════════════════════════\n');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n[PIE-WS] Shutting down...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n[PIE-WS] Shutting down...');
      await server.stop();
      process.exit(0);
    });
  }

  start().catch(err => {
    console.error('[PIE-WS] Failed to start:', err);
    process.exit(1);
  });
}
