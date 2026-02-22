#!/usr/bin/env node
/**
 * Scout - News Sentiment Analyzer
 * Analyzes sentiment of competitor news and industry trends
 * Reference: Simple heuristic approach inspired by VADER sentiment analysis
 */

const fs = require('fs');
const path = require('path');

// Sentiment dictionaries
const SENTIMENT_WORDS = {
  positive: [
    'launch', 'growth', 'partnership', 'funding', 'raise', 'investment', 'expansion',
    'breakthrough', 'innovation', 'success', 'milestone', 'achievement', 'profit',
    'revenue', 'gain', 'surge', 'rally', 'bullish', 'optimistic', 'promising',
    'strategic', 'collaboration', 'alliance', 'acquisition', 'merger', 'ipo',
    'unicorn', 'valuation', 'scale', 'adoption', 'mainstream', 'regulatory clarity',
    'approval', 'compliance', 'framework', 'guidelines', 'protection', 'security',
    'upgrade', 'enhancement', 'improvement', 'efficiency', 'sustainable', 'green',
    'carbon neutral', 'esg', 'inclusive', 'accessible', 'user-friendly', 'seamless',
    'integration', 'interoperability', 'decentralized', 'transparent', 'audit',
    'verified', 'certified', 'award', 'recognition', 'leader', 'pioneer', 'first',
    'record', 'high', ' ATH', 'all-time high', 'moon', 'rocket', 'soar', 'climb',
    'boost', 'strengthen', 'solid', 'robust', 'resilient', 'mature', 'stable'
  ],
  negative: [
    'hack', 'exploit', 'breach', 'attack', 'theft', 'stolen', 'drained', 'rugpull',
    'scam', 'fraud', 'ponzi', 'lawsuit', 'litigation', 'sued', 'investigation',
    'sec', 'regulatory action', 'enforcement', 'fine', 'penalty', 'violation',
    'shutdown', 'ban', 'prohibition', 'restriction', 'delist', 'suspend',
    'liquidation', 'bankruptcy', 'insolvency', 'default', 'collapse', 'crash',
    'dump', 'plunge', 'tank', 'bearish', 'pessimistic', 'concern', 'warning',
    'risk', 'vulnerability', 'flaw', 'bug', 'glitch', 'error', 'failure',
    'delay', 'postpone', 'cancel', 'abandon', 'depart', 'resign', 'fired',
    'layoff', 'cut', 'reduce', 'decline', 'drop', 'fall', 'low', 'ATL',
    'all-time low', 'death spiral', 'doom', 'bleed', 'hemorrhage', 'loss',
    'deficit', 'debt', 'liability', 'contagion', 'systemic', 'crisis', 'panic',
    'fear', 'uncertainty', 'FUD', 'manipulation', 'wash trading', 'insider',
    'conflict of interest', 'whistleblower', 'allegation', 'accusation', 'scandal'
  ],
  neutral: [
    'announce', 'update', 'report', 'statement', 'comment', 'interview',
    'conference', 'event', 'webinar', 'podcast', 'blog', 'article', 'research',
    'study', 'analysis', 'review', 'survey', 'poll', 'data', 'statistics',
    'market', 'price', 'volume', 'trading', 'exchange', 'wallet', 'address',
    'transaction', 'block', 'hash', 'protocol', 'network', 'chain', 'layer',
    'token', 'coin', 'nft', 'defi', 'dao', 'web3', 'metaverse', 'ai', 'ml',
    'blockchain', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'solana',
    'polygon', 'arbitrum', 'optimism', 'base', 'layer2', 'rollup', 'bridge',
    'oracle', 'validator', 'node', 'miner', 'staking', 'yield', 'liquidity',
    'amm', 'dex', 'cex', 'custody', 'self-custody', 'kyc', 'aml', 'compliance'
  ]
};

// Industry/competitor keywords to track
const TRACKED_ENTITIES = {
  competitors: [
    'ethereum', 'solana', 'avalanche', 'polygon', 'arbitrum', 'optimism',
    'base', 'zksync', 'starknet', 'cosmos', 'polkadot', 'near',
    'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'bitget',
    'metamask', 'phantom', 'rabby', 'rainbow', 'argent',
    'opensea', 'blur', 'magiceden', 'tensor', 'foundation',
    'uniswap', 'aave', 'compound', 'curve', 'lido', 'rocketpool',
    'chainlink', 'thegraph', 'filecoin', 'ipfs', 'arweave'
  ],
  regulatory: [
    'sec', 'cftc', 'finra', 'treasury', 'fed', 'central bank',
    'regulation', 'legislation', 'bill', 'act', 'compliance',
    'g20', 'g7', 'fatf', 'fsb', 'iosco', 'basel',
    'mica', 'travel rule', 'kyc', 'aml', 'ofac', 'sanctions'
  ],
  market_signals: [
    'etf', 'spot etf', 'futures', 'options', 'derivatives',
    'institutional', 'whale', 'accumulation', 'distribution',
    'funding rate', 'open interest', 'liquidation', 'margin',
    'volatility', 'vix', 'fear index', 'greed index'
  ]
};

class SentimentAnalyzer {
  constructor() {
    this.historyPath = path.join(__dirname, 'sentiment-history.json');
    this.history = this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        return JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading history:', e.message);
    }
    return { daily: {}, alerts: [] };
  }

  saveHistory() {
    try {
      fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      console.error('Error saving history:', e.message);
    }
  }

  /**
   * Analyze sentiment of a single news item
   */
  analyzeItem(text, source = '', category = 'general') {
    const lowerText = text.toLowerCase();
    let score = 0;
    const matches = { positive: [], negative: [], neutral: [] };
    const entities = { competitors: [], regulatory: [], market_signals: [] };

    // Count sentiment words
    SENTIMENT_WORDS.positive.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const count = (lowerText.match(regex) || []).length;
      if (count > 0) {
        score += count;
        matches.positive.push({ word, count });
      }
    });

    SENTIMENT_WORDS.negative.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const count = (lowerText.match(regex) || []).length;
      if (count > 0) {
        score -= count;
        matches.negative.push({ word, count });
      }
    });

    SENTIMENT_WORDS.neutral.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const count = (lowerText.match(regex) || []).length;
      if (count > 0) {
        matches.neutral.push({ word, count });
      }
    });

    // Detect entities
    Object.entries(TRACKED_ENTITIES).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(lowerText)) {
          entities[type].push(keyword);
        }
      });
    });

    // Determine sentiment category
    let sentiment = 'neutral';
    if (score >= 1) sentiment = 'positive';
    else if (score <= -1) sentiment = 'negative';

    // Calculate confidence based on word count
    const totalWords = text.split(/\s+/).length;
    const sentimentWords = matches.positive.length + matches.negative.length;
    const confidence = Math.min(1, sentimentWords / Math.max(1, totalWords * 0.1));

    return {
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      source,
      category,
      score,
      sentiment,
      confidence: Math.round(confidence * 100),
      matches,
      entities,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze multiple news items
   */
  analyzeBatch(items) {
    return items.map(item => {
      if (typeof item === 'string') {
        return this.analyzeItem(item);
      }
      return this.analyzeItem(item.text, item.source, item.category);
    });
  }

  /**
   * Generate daily sentiment report
   */
  generateDailyReport(date = new Date().toISOString().split('T')[0]) {
    const dayData = this.history.daily[date] || { items: [] };
    
    if (dayData.items.length === 0) {
      return { date, status: 'no_data', message: 'No data for this date' };
    }

    const items = dayData.items;
    const total = items.length;
    const positive = items.filter(i => i.sentiment === 'positive').length;
    const negative = items.filter(i => i.sentiment === 'negative').length;
    const neutral = items.filter(i => i.sentiment === 'neutral').length;

    const avgScore = items.reduce((sum, i) => sum + i.score, 0) / total;
    const totalScore = items.reduce((sum, i) => sum + i.score, 0);

    // Entity breakdown
    const entityMentions = {};
    items.forEach(item => {
      Object.entries(item.entities).forEach(([type, entities]) => {
        entities.forEach(entity => {
          const key = `${type}:${entity}`;
          if (!entityMentions[key]) {
            entityMentions[key] = { type, entity, count: 0, sentimentSum: 0 };
          }
          entityMentions[key].count++;
          entityMentions[key].sentimentSum += item.score;
        });
      });
    });

    // Top mentioned entities
    const topEntities = Object.values(entityMentions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(e => ({
        ...e,
        avgSentiment: e.sentimentSum / e.count
      }));

    // Category breakdown
    const byCategory = {};
    items.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { count: 0, score: 0 };
      }
      byCategory[item.category].count++;
      byCategory[item.category].score += item.score;
    });

    return {
      date,
      summary: {
        total,
        positive,
        negative,
        neutral,
        positive_pct: Math.round((positive / total) * 100),
        negative_pct: Math.round((negative / total) * 100),
        neutral_pct: Math.round((neutral / total) * 100),
        avg_score: Math.round(avgScore * 100) / 100,
        total_score: totalScore
      },
      sentiment_trend: avgScore > 0.5 ? 'bullish' : avgScore < -0.5 ? 'bearish' : 'neutral',
      top_entities: topEntities,
      by_category: byCategory,
      top_positive: items
        .filter(i => i.sentiment === 'positive')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
      top_negative: items
        .filter(i => i.sentiment === 'negative')
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
    };
  }

  /**
   * Check for significant sentiment shifts
   */
  checkAlerts(currentReport) {
    const alerts = [];
    const date = currentReport.date;
    
    // Get previous day's report
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevReport = this.history.daily[prevDateStr]?.report;

    if (prevReport) {
      const currentPos = currentReport.summary.positive_pct;
      const prevPos = prevReport.summary.positive_pct;
      const currentNeg = currentReport.summary.negative_pct;
      const prevNeg = prevReport.summary.negative_pct;

      // Check for >20% shift in positive sentiment
      const posShift = currentPos - prevPos;
      if (Math.abs(posShift) >= 20) {
        alerts.push({
          type: 'sentiment_shift',
          severity: posShift > 0 ? 'positive' : 'negative',
          metric: 'positive_sentiment',
          change: Math.round(posShift),
          message: `Positive sentiment ${posShift > 0 ? 'surged' : 'dropped'} by ${Math.abs(Math.round(posShift))}%`,
          timestamp: new Date().toISOString()
        });
      }

      // Check for >20% shift in negative sentiment
      const negShift = currentNeg - prevNeg;
      if (Math.abs(negShift) >= 20) {
        alerts.push({
          type: 'sentiment_shift',
          severity: negShift > 0 ? 'negative' : 'positive',
          metric: 'negative_sentiment',
          change: Math.round(negShift),
          message: `Negative sentiment ${negShift > 0 ? 'surged' : 'dropped'} by ${Math.abs(Math.round(negShift))}%`,
          timestamp: new Date().toISOString()
        });
      }

      // Check for trend reversal
      const currentTrend = currentReport.sentiment_trend;
      const prevTrend = prevReport.sentiment_trend;
      if (currentTrend !== prevTrend && currentTrend !== 'neutral' && prevTrend !== 'neutral') {
        alerts.push({
          type: 'trend_reversal',
          severity: currentTrend === 'bullish' ? 'positive' : 'negative',
          from: prevTrend,
          to: currentTrend,
          message: `Market sentiment shifted from ${prevTrend} to ${currentTrend}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Check for high negative concentration
    if (currentReport.summary.negative_pct >= 50) {
      alerts.push({
        type: 'high_negative',
        severity: 'critical',
        metric: 'negative_concentration',
        value: currentReport.summary.negative_pct,
        message: `High negative sentiment: ${currentReport.summary.negative_pct}% of news is negative`,
        timestamp: new Date().toISOString()
      });
    }

    // Save alerts
    this.history.alerts = [...this.history.alerts, ...alerts].slice(-100);
    this.saveHistory();

    return alerts;
  }

  /**
   * Add news items for a date
   */
  addItems(items, date = new Date().toISOString().split('T')[0]) {
    if (!this.history.daily[date]) {
      this.history.daily[date] = { items: [] };
    }

    const analyzed = this.analyzeBatch(items);
    this.history.daily[date].items.push(...analyzed);
    
    // Generate report
    const report = this.generateDailyReport(date);
    this.history.daily[date].report = report;
    
    // Check for alerts
    const alerts = this.checkAlerts(report);
    
    this.saveHistory();
    
    return { analyzed: analyzed.length, report, alerts };
  }

  /**
   * Get sentiment history for a date range
   */
  getHistory(startDate, endDate) {
    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (this.history.daily[dateStr]?.report) {
        results.push(this.history.daily[dateStr].report);
      }
    }
    
    return results;
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboard(date = new Date().toISOString().split('T')[0]) {
    const report = this.generateDailyReport(date);
    const prevReports = this.getHistory(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date
    );

    const alerts = this.history.alerts.slice(-10);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scout Sentiment Dashboard - ${date}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #e0e0e0;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #00d4ff, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #888; margin-bottom: 24px; }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .card {
      background: #12121a;
      border: 1px solid #1e1e2e;
      border-radius: 12px;
      padding: 20px;
    }
    
    .card h3 {
      font-size: 14px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .metric {
      font-size: 36px;
      font-weight: 700;
    }
    
    .metric.positive { color: #22c55e; }
    .metric.negative { color: #ef4444; }
    .metric.neutral { color: #888; }
    
    .trend {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .trend.bullish { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .trend.bearish { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .trend.neutral { background: rgba(136, 136, 136, 0.2); color: #888; }
    
    .alert {
      background: #1a1a2e;
      border-left: 4px solid;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 0 8px 8px 0;
    }
    
    .alert.critical { border-color: #ef4444; }
    .alert.negative { border-color: #f59e0b; }
    .alert.positive { border-color: #22c55e; }
    
    .alert-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .alert-time {
      font-size: 12px;
      color: #666;
    }
    
    .entity-list {
      list-style: none;
    }
    
    .entity-list li {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #1e1e2e;
    }
    
    .entity-list li:last-child { border-bottom: none; }
    
    .entity-name {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .entity-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #1e1e2e;
      color: #888;
    }
    
    .entity-sentiment {
      font-weight: 600;
    }
    
    .sentiment-bar {
      height: 8px;
      background: #1e1e2e;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      margin-top: 16px;
    }
    
    .sentiment-bar .positive {
      background: #22c55e;
      height: 100%;
    }
    
    .sentiment-bar .neutral {
      background: #666;
      height: 100%;
    }
    
    .sentiment-bar .negative {
      background: #ef4444;
      height: 100%;
    }
    
    .news-item {
      padding: 12px;
      background: #1a1a2e;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    
    .news-item .score {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .news-item.positive .score { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .news-item.negative .score { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    
    .chart-container {
      height: 200px;
      margin-top: 16px;
    }
    
    .mini-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 100%;
    }
    
    .mini-bar {
      flex: 1;
      background: #7c3aed;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      position: relative;
    }
    
    .mini-bar:hover::after {
      content: attr(data-value);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Scout Sentiment Dashboard</h1>
    <p class="subtitle">Daily intelligence briefing for ${date}</p>
    
    <div class="grid">
      <div class="card">
        <h3>Overall Sentiment</h3>
        <div class="metric ${report.sentiment_trend}">${report.summary.avg_score > 0 ? '+' : ''}${report.summary.avg_score}</div>
        <span class="trend ${report.sentiment_trend}">${report.sentiment_trend.toUpperCase()}</span>
      </div>
      
      <div class="card">
        <h3>News Analyzed</h3>
        <div class="metric neutral">${report.summary.total}</div>
        <div class="sentiment-bar">
          <div class="positive" style="width: ${report.summary.positive_pct}%"></div>
          <div class="neutral" style="width: ${report.summary.neutral_pct}%"></div>
          <div class="negative" style="width: ${report.summary.negative_pct}%"></div>
        </div>
      </div>
      
      <div class="card">
        <h3>Positive News</h3>
        <div class="metric positive">${report.summary.positive_pct}%</div>
        <span style="color: #666; font-size: 14px;">${report.summary.positive} articles</span>
      </div>
      
      <div class="card">
        <h3>Negative News</h3>
        <div class="metric negative">${report.summary.negative_pct}%</div>
        <span style="color: #666; font-size: 14px;">${report.summary.negative} articles</span>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>🚨 Recent Alerts</h3>
        ${alerts.length === 0 ? '<p style="color: #666;">No alerts in the last 24 hours</p>' : 
          alerts.map(a => `
            <div class="alert ${a.severity}">
              <div class="alert-title">${a.message}</div>
              <div class="alert-time">${new Date(a.timestamp).toLocaleString()}</div>
            </div>
          `).join('')}
      </div>
      
      <div class="card">
        <h3>🔥 Most Mentioned</h3>
        <ul class="entity-list">
          ${report.top_entities.slice(0, 5).map(e => `
            <li>
              <span class="entity-name">
                ${e.entity}
                <span class="entity-badge">${e.type}</span>
              </span>
              <span class="entity-sentiment" style="color: ${e.avgSentiment > 0 ? '#22c55e' : e.avgSentiment < 0 ? '#ef4444' : '#888'}">
                ${e.avgSentiment > 0 ? '+' : ''}${e.avgSentiment.toFixed(1)}
              </span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>📈 7-Day Trend</h3>
        <div class="chart-container">
          <div class="mini-chart">
            ${prevReports.map(r => `
              <div class="mini-bar" 
                   style="height: ${Math.max(10, Math.min(100, 50 + r.summary.avg_score * 20))}%; background: ${r.summary.avg_score > 0 ? '#22c55e' : r.summary.avg_score < 0 ? '#ef4444' : '#666'}"
                   data-value="${r.date}: ${r.summary.avg_score > 0 ? '+' : ''}${r.summary.avg_score}">
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>📰 Top Positive Stories</h3>
        ${report.top_positive.slice(0, 3).map(item => `
          <div class="news-item positive">
            <span class="score">+${item.score}</span>
            <p style="font-size: 14px; color: #ccc;">${item.text}</p>
            ${item.entities.competitors.length > 0 ? `<span style="font-size: 12px; color: #7c3aed;">🏷️ ${item.entities.competitors.join(', ')}</span>` : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <h3>⚠️ Top Negative Stories</h3>
        ${report.top_negative.slice(0, 3).map(item => `
          <div class="news-item negative">
            <span class="score">${item.score}</span>
            <p style="font-size: 14px; color: #ccc;">${item.text}</p>
            ${item.entities.competitors.length > 0 ? `<span style="font-size: 12px; color: #7c3aed;">🏷️ ${item.entities.competitors.join(', ')}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * CLI interface
   */
  static cli() {
    const args = process.argv.slice(2);
    const analyzer = new SentimentAnalyzer();

    if (args[0] === 'analyze' && args[1]) {
      // Analyze a single text
      const result = analyzer.analyzeItem(args[1]);
    } else if (args[0] === 'report') {
      // Generate daily report
      const date = args[1] || new Date().toISOString().split('T')[0];
      const report = analyzer.generateDailyReport(date);
    } else if (args[0] === 'dashboard') {
      // Generate HTML dashboard
      const date = args[1] || new Date().toISOString().split('T')[0];
      const html = analyzer.generateDashboard(date);
      const outPath = path.join(__dirname, `dashboard-${date}.html`);
      fs.writeFileSync(outPath, html);
    } else if (args[0] === 'history') {
      // Get history range
      const endDate = args[1] || new Date().toISOString().split('T')[0];
      const startDate = args[2] || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const history = analyzer.getHistory(startDate, endDate);
    } else {
Scout Sentiment Analyzer

Usage:
  node sentiment-analyzer.js analyze "news text here"    Analyze single item
  node sentiment-analyzer.js report [YYYY-MM-DD]         Generate daily report
  node sentiment-analyzer.js dashboard [YYYY-MM-DD]      Generate HTML dashboard
  node sentiment-analyzer.js history [end] [start]       Get history range

Examples:
  node sentiment-analyzer.js analyze "Ethereum launches major upgrade with improved scalability"
  node sentiment-analyzer.js report
  node sentiment-analyzer.js dashboard 2024-02-18
      `);
    }
  }
}

// Export for use as module
module.exports = { SentimentAnalyzer, SENTIMENT_WORDS, TRACKED_ENTITIES };

// Run CLI if called directly
if (require.main === module) {
  SentimentAnalyzer.cli();
}
