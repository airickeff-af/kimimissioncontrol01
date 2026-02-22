#!/usr/bin/env node
/**
 * Scout Competitor Monitor - Enhanced Alert System
 * Tracks competitor activities, news, and announcements with real-time alerts
 * 
 * Usage: node competitor-monitor.js [--check|--report|--alert-test|--send-alert]
 * 
 * @author Scout (Research Agent)
 * @task TASK-SI-006
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  dataPath: path.join(__dirname, '../../data/competitors.json'),
  alertLogPath: path.join(__dirname, '../../data/competitor-alerts.json'),
  historyPath: path.join(__dirname, '../../data/competitor-history.json'),
  maxHistoryDays: 30,
  userTimezone: 'Asia/Shanghai',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: '1508346957', // EricF's Telegram ID
    apiBase: 'https://api.telegram.org/bot'
  }
};

// Alert Types and Keywords
const ALERT_TRIGGERS = {
  PRODUCT_LAUNCH: {
    keywords: ['launch', 'new product', 'new feature', 'introducing', 'unveil', 'announce', 'release', 'beta', 'alpha'],
    priority: 'P0',
    icon: '🚀'
  },
  FUNDING: {
    keywords: ['funding', 'raised', 'series', 'investment', 'investor', 'valuation', 'unicorn', 'capital', 'backed'],
    priority: 'P0',
    icon: '💰'
  },
  MARKET_ENTRY: {
    keywords: ['expansion', 'enter', 'launch in', 'new market', 'geo', 'regional', 'asia', 'southeast asia', 'hong kong', 'singapore', 'malaysia', 'thailand', 'philippines', 'indonesia', 'vietnam'],
    priority: 'P0',
    icon: '🌏'
  },
  KEY_HIRE: {
    keywords: ['hire', 'appointed', 'joins', 'executive', 'ceo', 'cto', 'cfo', 'cmo', 'chief', 'president', 'vp', 'head of', 'bd', 'business development'],
    priority: 'P1',
    icon: '👔'
  },
  PARTNERSHIP: {
    keywords: ['partnership', 'partner', 'collaborate', 'integrate', 'alliance', 'team up', 'join forces', 'strategic'],
    priority: 'P0',
    icon: '🤝'
  },
  ACQUISITION: {
    keywords: ['acquisition', 'acquire', 'buy', 'bought', 'merger', 'merge', 'takeover', 'purchase'],
    priority: 'P0',
    icon: '🏢'
  },
  REGULATORY: {
    keywords: ['regulatory', 'license', 'approval', 'compliance', 'sec', 'mas', 'hkma', 'approval', 'authorized', 'permit'],
    priority: 'P0',
    icon: '⚖️'
  }
};

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Load competitor configuration
 */
function loadCompetitors() {
  try {
    const data = fs.readFileSync(CONFIG.dataPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`${colors.red}✗ Failed to load competitors.json:${colors.reset}`, err.message);
    process.exit(1);
  }
}

/**
 * Load or initialize alert history
 */
function loadHistory() {
  try {
    if (fs.existsSync(CONFIG.historyPath)) {
      const data = fs.readFileSync(CONFIG.historyPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Ignore errors, return empty history
  }
  return { alerts: [], lastCheck: null, dailyDigest: [], weeklySummary: [] };
}

/**
 * Save alert history
 */
function saveHistory(history) {
  try {
    // Ensure directory exists
    const dir = path.dirname(CONFIG.historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Trim old alerts
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CONFIG.maxHistoryDays);
    
    history.alerts = history.alerts.filter(a => new Date(a.timestamp) > cutoff);
    history.lastCheck = new Date().toISOString();
    
    fs.writeFileSync(CONFIG.historyPath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error(`${colors.red}✗ Failed to save history:${colors.reset}`, err.message);
  }
}

/**
 * Format timestamp for display
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: CONFIG.userTimezone,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(alert) {
  const token = CONFIG.telegram.botToken;
  const chatId = CONFIG.telegram.chatId;
  
  if (!token) {
    return { success: false, error: 'No bot token' };
  }

  const trigger = ALERT_TRIGGERS[alert.type] || { icon: '🔔' };
  
  // Format message based on priority
  let priorityEmoji = '⚪';
  if (alert.priority === 'P0') priorityEmoji = '🔴';
  else if (alert.priority === 'P1') priorityEmoji = '🟡';
  else if (alert.priority === 'P2') priorityEmoji = '🟢';

  const message = `${trigger.icon} <b>COMPETITOR ALERT</b> ${trigger.icon}

${priorityEmoji} <b>Priority:</b> ${alert.priority}
🏢 <b>Competitor:</b> ${alert.competitor}
📌 <b>Type:</b> ${alert.type.replace(/_/g, ' ')}

<b>${alert.title}</b>

${alert.description}

${alert.url ? `🔗 <a href="${alert.url}">Read more</a>` : ''}

<i>Detected: ${formatTime(alert.timestamp)}</i>`;

  return new Promise((resolve) => {
    const url = `${CONFIG.telegram.apiBase}${token}/sendMessage`;
    const data = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.ok) {
            resolve({ success: true, messageId: result.result.message_id });
          } else {
            console.error(`${colors.red}✗ Telegram API error:${colors.reset}`, result.description);
            resolve({ success: false, error: result.description });
          }
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`${colors.red}✗ Failed to send Telegram:${colors.reset}`, err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(data);
    req.end();
  });
}

/**
 * Send daily digest
 */
async function sendDailyDigest(alerts) {
  if (alerts.length === 0) return { success: true, message: 'No alerts to send' };

  const token = CONFIG.telegram.botToken;
  const chatId = CONFIG.telegram.chatId;
  
  if (!token) {
    return { success: false, error: 'No bot token' };
  }

  const today = new Date().toLocaleDateString('en-US', {
    timeZone: CONFIG.userTimezone,
    month: 'short',
    day: 'numeric'
  });

  let message = `📊 <b>DAILY COMPETITOR DIGEST</b> - ${today}\n\n`;
  
  const p0Alerts = alerts.filter(a => a.priority === 'P0');
  const p1Alerts = alerts.filter(a => a.priority === 'P1');
  
  if (p0Alerts.length > 0) {
    message += `🔴 <b>P0 Alerts (${p0Alerts.length})</b>\n`;
    p0Alerts.forEach(a => {
      const trigger = ALERT_TRIGGERS[a.type] || { icon: '🔔' };
      message += `${trigger.icon} <b>${a.competitor}</b>: ${a.title}\n`;
    });
    message += '\n';
  }
  
  if (p1Alerts.length > 0) {
    message += `🟡 <b>P1 Alerts (${p1Alerts.length})</b>\n`;
    p1Alerts.slice(0, 5).forEach(a => {
      const trigger = ALERT_TRIGGERS[a.type] || { icon: '🔔' };
      message += `${trigger.icon} ${a.competitor}: ${a.title}\n`;
    });
    if (p1Alerts.length > 5) {
      message += `<i>...and ${p1Alerts.length - 5} more</i>\n`;
    }
    message += '\n';
  }

  message += `<i>Use --report for full details</i>`;

  return new Promise((resolve) => {
    const url = `${CONFIG.telegram.apiBase}${token}/sendMessage`;
    const data = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.ok) {
            resolve({ success: true, messageId: result.result.message_id });
          } else {
            resolve({ success: false, error: result.description });
          }
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(data);
    req.end();
  });
}

/**
 * Classify alert type based on content
 */
function classifyAlertType(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  for (const [type, config] of Object.entries(ALERT_TRIGGERS)) {
    if (config.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return type;
    }
  }
  
  return 'GENERAL';
}

/**
 * Determine priority based on alert type and competitor
 */
function determinePriority(alertType, competitor) {
  const trigger = ALERT_TRIGGERS[alertType];
  if (trigger) {
    return trigger.priority;
  }
  
  // Default based on competitor priority
  if (competitor.priority === 'P0') return 'P1';
  return 'P2';
}

/**
 * Create and process a new alert
 */
async function createAlert(alertData) {
  const history = loadHistory();
  
  // Auto-classify if type not provided
  if (!alertData.type) {
    alertData.type = classifyAlertType(alertData.title, alertData.description);
  }
  
  // Determine priority
  if (!alertData.priority) {
    const competitor = loadCompetitors().competitors.find(c => c.name === alertData.competitor);
    alertData.priority = determinePriority(alertData.type, competitor || { priority: 'P1' });
  }
  
  const alert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...alertData
  };
  
  // Save to history
  history.alerts.push(alert);
  saveHistory(history);
  
  // Send immediate notification for P0 alerts
  if (alert.priority === 'P0') {
    await sendTelegramNotification(alert);
  }
  
  return alert;
}

/**
 * Generate monitoring report
 */
function generateReport(competitors) {
  
  const now = new Date().toLocaleString('en-US', {
    timeZone: CONFIG.userTimezone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  
  // Group by priority
  const p0 = competitors.filter(c => c.priority === 'P0');
  const p1 = competitors.filter(c => c.priority === 'P1');
  const p2 = competitors.filter(c => c.priority === 'P2');
  
  // Summary stats
  
  // Alert Triggers Reference
  Object.entries(ALERT_TRIGGERS).forEach(([type, config]) => {
    const priorityColor = config.priority === 'P0' ? colors.red : 
                          config.priority === 'P1' ? colors.yellow : colors.green;
  });
  
  // P0 Competitors
  if (p0.length > 0) {
    p0.forEach(c => {
    });
  }
  
  // P1 Competitors
  if (p1.length > 0) {
    p1.forEach(c => {
    });
  }
  
  // P2 Competitors
  if (p2.length > 0) {
    p2.forEach(c => {
    });
  }
  
  // Category breakdown
  const categories = {};
  competitors.forEach(c => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });
  
  Object.entries(categories).forEach(([cat, count]) => {
    const icon = cat === 'crypto_exchange' ? '💱' : cat === 'payment_processor' ? '💳' : '🏦';
  });
  
}

/**
 * Simulate a competitor check (placeholder for actual API integration)
 */
async function runCompetitorCheck(competitors) {
  
  const history = loadHistory();
  const newAlerts = [];
  const timestamp = new Date().toISOString();
  
  // Check each P0 and P1 competitor
  const checkList = competitors.filter(c => c.priority === 'P0' || c.priority === 'P1');
  
  for (const comp of checkList) {
    process.stdout.write(`  Checking ${comp.name}... `);
    
    // Simulate check delay
    await new Promise(r => setTimeout(r, 100));
    
    // Placeholder: In production, this would fetch RSS feeds, Twitter API, etc.
    const checkResult = {
      competitorId: comp.id,
      name: comp.name,
      checkedAt: timestamp,
      sources: Object.keys(comp.urls),
      newItems: [], // Would contain actual news items
      status: 'checked'
    };
    
  }
  
  
  // Update history
  history.lastCheck = timestamp;
  saveHistory(history);
  
  return newAlerts;
}

/**
 * Generate alert test
 */
async function testAlertSystem(competitors) {
  
  const testAlerts = [
    {
      competitor: 'Binance',
      type: 'PARTNERSHIP',
      title: 'Binance Announces Strategic Partnership with SEA Payment Provider',
      description: 'Major partnership to expand crypto payment infrastructure across Southeast Asia. Integration expected Q2 2026.',
      url: 'https://example.com/binance-partnership',
      priority: 'P0'
    },
    {
      competitor: 'Stripe',
      type: 'PRODUCT_LAUNCH',
      title: 'Stripe Launches Crypto Payouts for SEA Merchants',
      description: 'New feature allowing merchants to receive payments in stablecoins across 6 SEA countries.',
      url: 'https://example.com/stripe-crypto',
      priority: 'P0'
    },
    {
      competitor: 'Coinbase',
      type: 'MARKET_ENTRY',
      title: 'Coinbase Secures Hong Kong VASP License',
      description: 'Regulatory approval to operate virtual asset trading platform in Hong Kong.',
      url: 'https://example.com/coinbase-hk',
      priority: 'P0'
    },
    {
      competitor: 'Wise',
      type: 'KEY_HIRE',
      title: 'Wise Appoints Former Grab Exec as SEA Regional Head',
      description: 'New hire brings extensive experience in SEA fintech expansion.',
      priority: 'P1'
    },
    {
      competitor: 'Crypto.com',
      type: 'FUNDING',
      title: 'Crypto.com Raises $200M Series D for Asia Expansion',
      description: 'Funding round led by SEA sovereign wealth fund to accelerate regional growth.',
      url: 'https://example.com/cryptocom-funding',
      priority: 'P0'
    }
  ];
  
  
  for (const alertData of testAlerts) {
    const trigger = ALERT_TRIGGERS[alertData.type] || { icon: '🔔' };
    const priorityColor = alertData.priority === 'P0' ? colors.red : 
                          alertData.priority === 'P1' ? colors.yellow : colors.green;
    
    
    const alert = await createAlert(alertData);
  }
  
  
  // Show recent alerts
  showRecentAlerts();
  
  return testAlerts;
}

/**
 * Show recent alerts
 */
function showRecentAlerts() {
  const history = loadHistory();
  
  
  if (!history.alerts || history.alerts.length === 0) {
    return;
  }
  
  // Sort by timestamp desc
  const sorted = history.alerts.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  ).slice(0, 15);
  
  sorted.forEach(alert => {
    const trigger = ALERT_TRIGGERS[alert.type] || { icon: '🔔' };
    const priorityColor = alert.priority === 'P0' ? colors.red : 
                          alert.priority === 'P1' ? colors.yellow : colors.green;
    
  });
  
}

/**
 * Export monitoring data for dashboard
 */
function exportForDashboard(competitors) {
  const history = loadHistory();
  
  // Get alerts from last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentAlerts = history.alerts.filter(a => new Date(a.timestamp) > oneDayAgo);
  
  const dashboardData = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: competitors.length,
      p0: competitors.filter(c => c.priority === 'P0').length,
      p1: competitors.filter(c => c.priority === 'P1').length,
      p2: competitors.filter(c => c.priority === 'P2').length,
      alerts24h: recentAlerts.length,
      p0Alerts24h: recentAlerts.filter(a => a.priority === 'P0').length
    },
    byCategory: {},
    recentAlerts: recentAlerts.slice(0, 10),
    competitors: competitors.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      region: c.region,
      priority: c.priority,
      alertThreshold: c.alertThreshold,
      urls: c.urls
    }))
  };
  
  // Category breakdown
  competitors.forEach(c => {
    dashboardData.byCategory[c.category] = (dashboardData.byCategory[c.category] || 0) + 1;
  });
  
  return dashboardData;
}

/**
 * Send manual alert (for testing)
 */
async function sendManualAlert() {
  const alertData = {
    competitor: 'TestCorp',
    type: 'PRODUCT_LAUNCH',
    title: 'Manual Test Alert: New Feature Announcement',
    description: 'This is a manually triggered test alert to verify the notification pipeline.',
    url: 'https://example.com/test',
    priority: 'P0'
  };
  
  
  const alert = await createAlert(alertData);
  
  
  return alert;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--report';
  
  const data = loadCompetitors();
  const competitors = data.competitors;
  
  switch (command) {
    case '--check':
      await runCompetitorCheck(competitors);
      break;
      
    case '--report':
      generateReport(competitors);
      showRecentAlerts();
      break;
      
    case '--alert-test':
      await testAlertSystem(competitors);
      break;
      
    case '--send-alert':
      await sendManualAlert();
      break;
      
    case '--daily-digest':
      const history = loadHistory();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dailyAlerts = history.alerts.filter(a => new Date(a.timestamp) > oneDayAgo);
      await sendDailyDigest(dailyAlerts);
      break;
      
    case '--export':
      const dashboardData = exportForDashboard(competitors);
      break;
      
    case '--help':
    default:
${colors.cyan}${colors.bright}🔭 Scout Competitor Monitor - Enhanced Alert System${colors.reset}

Usage: node competitor-monitor.js [command]

Commands:
  --report       Generate monitoring report (default)
  --check        Run competitor check simulation
  --alert-test   Generate test alerts with all trigger types
  --send-alert   Send a single manual test alert
  --daily-digest Send daily digest of alerts
  --export       Export dashboard data as JSON
  --help         Show this help message

Alert Triggers:
  🚀 PRODUCT_LAUNCH - New product/feature announcements (P0)
  💰 FUNDING        - Funding rounds and investments (P0)
  🌏 MARKET_ENTRY   - Geographic expansion (P0)
  👔 KEY_HIRE       - Executive hires (P1)
  🤝 PARTNERSHIP    - Strategic partnerships (P0)
  🏢 ACQUISITION    - M&A activity (P0)
  ⚖️  REGULATORY     - Regulatory approvals (P0)

Priority Levels:
  🔴 P0 - Immediate Telegram notification
  🟡 P1 - Daily digest
  🟢 P2 - Weekly summary

Examples:
  node competitor-monitor.js --report
  node competitor-monitor.js --check
  node competitor-monitor.js --alert-test
  node competitor-monitor.js --export > dashboard-data.json
`);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error(`${colors.red}✗ Error:${colors.reset}`, err.message);
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  loadCompetitors,
  loadHistory,
  saveHistory,
  createAlert,
  sendTelegramNotification,
  sendDailyDigest,
  classifyAlertType,
  determinePriority,
  generateReport,
  runCompetitorCheck,
  exportForDashboard,
  ALERT_TRIGGERS,
  CONFIG
};
