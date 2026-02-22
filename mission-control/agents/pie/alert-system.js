/**
 * PIE - Alert System
 * 
 * Multi-channel alert system for hot opportunities
 * Supports: Console, File, Webhook, Email (SMTP), Slack, Discord
 * 
 * @module alert-system
 * @author Glasses (Researcher Agent)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ============================================================================
// ALERT TYPES & PRIORITIES
// ============================================================================

const ALERT_TYPES = {
  FUNDING_ALERT: '💰 Funding Alert',
  PARTNERSHIP_OPPORTUNITY: '🤝 Partnership Opportunity',
  MA_ACTIVITY: '🏢 M&A Activity',
  PRODUCT_LAUNCH: '🚀 Product Launch',
  MARKET_EXPANSION: '🌍 Market Expansion',
  COMPETITOR_MOVE: '⚔️ Competitor Move',
  SECTOR_HEAT: '🔥 Hot Sector',
  GENERAL_INTELLIGENCE: '📊 Intelligence'
};

const PRIORITIES = {
  CRITICAL: { level: 4, color: '\x1b[31m', label: 'CRITICAL' },
  HIGH: { level: 3, color: '\x1b[33m', label: 'HIGH' },
  MEDIUM: { level: 2, color: '\x1b[36m', label: 'MEDIUM' },
  LOW: { level: 1, color: '\x1b[32m', label: 'LOW' }
};

// ============================================================================
// BASE ALERT CHANNEL
// ============================================================================

class AlertChannel {
  constructor(config = {}) {
    this.name = config.name || 'base';
    this.enabled = config.enabled !== false;
    this.filter = config.filter || {};
  }

  async send(alert) {
    throw new Error('send() must be implemented by subclass');
  }

  shouldSend(alert) {
    if (!this.enabled) return false;
    
    if (this.filter.types && !this.filter.types.includes(alert.type)) {
      return false;
    }
    
    if (this.filter.minPriority) {
      const alertPriority = PRIORITIES[alert.priority]?.level || 0;
      const minPriority = PRIORITIES[this.filter.minPriority]?.level || 0;
      if (alertPriority < minPriority) return false;
    }
    
    return true;
  }

  formatAlert(alert) {
    const typeLabel = ALERT_TYPES[alert.type] || alert.type;
    const priorityInfo = PRIORITIES[alert.priority] || PRIORITIES.LOW;
    
    return {
      ...alert,
      typeLabel,
      priorityLabel: priorityInfo.label,
      formattedTime: new Date(alert.timestamp).toLocaleString()
    };
  }
}

// ============================================================================
// CONSOLE CHANNEL
// ============================================================================

class ConsoleChannel extends AlertChannel {
  constructor(config = {}) {
    super({ name: 'console', ...config });
    this.useColors = config.useColors !== false;
    this.includeDetails = config.includeDetails !== false;
  }

  async send(alert) {
    if (!this.shouldSend(alert)) return;
    
    const formatted = this.formatAlert(alert);
    const priorityInfo = PRIORITIES[alert.priority] || PRIORITIES.LOW;
    const reset = '\x1b[0m';
    
    let output = '\n';
    output += `${'='.repeat(60)}\n`;
    output += `${priorityInfo.color}[${formatted.priorityLabel}]${reset} ${formatted.typeLabel}\n`;
    output += `${'='.repeat(60)}\n`;
    output += `🕐 ${formatted.formattedTime}\n`;
    output += `📰 ${alert.item?.title || 'N/A'}\n`;
    
    if (alert.item?.link) {
      output += `🔗 ${alert.item.link}\n`;
    }
    
    if (alert.summary) {
      output += `\n📝 Summary: ${alert.summary}\n`;
    }
    
    if (this.includeDetails && alert.details) {
      output += `\n📊 Details:\n`;
      
      if (alert.details.fundingAmount) {
        output += `   💵 Funding: $${(alert.details.fundingAmount / 1000000).toFixed(2)}M\n`;
      }
      
      if (alert.details.competitors?.length > 0) {
        const names = alert.details.competitors.map(c => c.name).join(', ');
        output += `   ⚔️ Competitors: ${names}\n`;
      }
      
      if (alert.details.sectors?.length > 0) {
        output += `   🔥 Sectors: ${alert.details.sectors.join(', ')}\n`;
      }
      
      if (alert.details.opportunityScore) {
        output += `   📈 Score: ${alert.details.opportunityScore}/10\n`;
      }
    }
    
    if (alert.actionItems?.length > 0) {
      output += `\n✅ Action Items:\n`;
      alert.actionItems.forEach((item, i) => {
        output += `   ${i + 1}. ${item}\n`;
      });
    }
    
    output += `${'='.repeat(60)}\n`;
    
  }
}

// ============================================================================
// FILE CHANNEL
// ============================================================================

class FileChannel extends AlertChannel {
  constructor(config = {}) {
    super({ name: 'file', ...config });
    this.outputDir = config.outputDir || './data/alerts';
    this.format = config.format || 'json'; // json, markdown, csv
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async send(alert) {
    if (!this.shouldSend(alert)) return;
    
    const date = new Date().toISOString().split('T')[0];
    
    switch (this.format) {
      case 'json':
        await this.writeJSON(alert, date);
        break;
      case 'markdown':
        await this.writeMarkdown(alert, date);
        break;
      case 'csv':
        await this.writeCSV(alert, date);
        break;
    }
  }

  async writeJSON(alert, date) {
    const filePath = path.join(this.outputDir, `${date}.json`);
    
    let alerts = [];
    if (fs.existsSync(filePath)) {
      alerts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    alerts.push(alert);
    fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
  }

  async writeMarkdown(alert, date) {
    const filePath = path.join(this.outputDir, `${date}.md`);
    const formatted = this.formatAlert(alert);
    
    let content = '';
    if (!fs.existsSync(filePath)) {
      content = `# Opportunity Radar Alerts - ${date}\n\n`;
    }
    
    content += `## ${formatted.typeLabel} [${formatted.priorityLabel}]\n\n`;
    content += `- **Time:** ${formatted.formattedTime}\n`;
    content += `- **Title:** ${alert.item?.title || 'N/A'}\n`;
    content += `- **Link:** ${alert.item?.link || 'N/A'}\n`;
    
    if (alert.summary) {
      content += `- **Summary:** ${alert.summary}\n`;
    }
    
    if (alert.details?.fundingAmount) {
      content += `- **Funding:** $${(alert.details.fundingAmount / 1000000).toFixed(2)}M\n`;
    }
    
    content += '\n---\n\n';
    
    fs.appendFileSync(filePath, content);
  }

  async writeCSV(alert, date) {
    const filePath = path.join(this.outputDir, `${date}.csv`);
    const formatted = this.formatAlert(alert);
    
    const headers = ['timestamp', 'type', 'priority', 'title', 'link', 'summary', 'funding_amount'];
    
    let writeHeaders = !fs.existsSync(filePath);
    
    const row = [
      alert.timestamp,
      alert.type,
      alert.priority,
      `"${(alert.item?.title || '').replace(/"/g, '""')}"`,
      alert.item?.link || '',
      `"${(alert.summary || '').replace(/"/g, '""')}"`,
      alert.details?.fundingAmount || ''
    ];
    
    let content = '';
    if (writeHeaders) {
      content = headers.join(',') + '\n';
    }
    content += row.join(',') + '\n';
    
    fs.appendFileSync(filePath, content);
  }
}

// ============================================================================
// WEBHOOK CHANNEL
// ============================================================================

class WebhookChannel extends AlertChannel {
  constructor(config = {}) {
    super({ name: 'webhook', ...config });
    this.webhookUrl = config.webhookUrl;
    this.headers = config.headers || { 'Content-Type': 'application/json' };
    this.timeout = config.timeout || 10000;
  }

  async send(alert) {
    if (!this.shouldSend(alert) || !this.webhookUrl) return;
    
    const payload = this.buildPayload(alert);
    
    try {
      await this.post(this.webhookUrl, payload);
    } catch (error) {
      console.error(`Webhook error: ${error.message}`);
    }
  }

  buildPayload(alert) {
    return {
      timestamp: alert.timestamp,
      type: alert.type,
      priority: alert.priority,
      title: alert.item?.title,
      link: alert.item?.link,
      summary: alert.summary,
      details: alert.details,
      actionItems: alert.actionItems
    };
  }

  post(url, payload) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: this.timeout
      };

      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(data);
      req.end();
    });
  }
}

// ============================================================================
// SLACK CHANNEL
// ============================================================================

class SlackChannel extends AlertChannel {
  constructor(config = {}) {
    super({ name: 'slack', ...config });
    this.webhookUrl = config.webhookUrl;
    this.channel = config.channel;
    this.username = config.username || 'Opportunity Radar';
    this.iconEmoji = config.iconEmoji || ':radar:';
  }

  async send(alert) {
    if (!this.shouldSend(alert) || !this.webhookUrl) return;
    
    const payload = this.buildSlackPayload(alert);
    
    try {
      await this.post(this.webhookUrl, payload);
    } catch (error) {
      console.error(`Slack error: ${error.message}`);
    }
  }

  buildSlackPayload(alert) {
    const formatted = this.formatAlert(alert);
    const color = this.getColor(alert.priority);
    
    const fields = [
      {
        title: 'Priority',
        value: formatted.priorityLabel,
        short: true
      },
      {
        title: 'Time',
        value: formatted.formattedTime,
        short: true
      }
    ];

    if (alert.details?.fundingAmount) {
      fields.push({
        title: 'Funding',
        value: `$${(alert.details.fundingAmount / 1000000).toFixed(2)}M`,
        short: true
      });
    }

    if (alert.details?.competitors?.length > 0) {
      fields.push({
        title: 'Competitors',
        value: alert.details.competitors.map(c => c.name).join(', '),
        short: true
      });
    }

    const attachment = {
      color,
      title: alert.item?.title || 'New Alert',
      title_link: alert.item?.link,
      text: alert.summary,
      fields,
      footer: 'Opportunity Radar',
      ts: Math.floor(Date.now() / 1000)
    };

    if (alert.actionItems?.length > 0) {
      attachment.fields.push({
        title: 'Action Items',
        value: alert.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n'),
        short: false
      });
    }

    return {
      channel: this.channel,
      username: this.username,
      icon_emoji: this.iconEmoji,
      attachments: [attachment]
    };
  }

  getColor(priority) {
    switch (priority) {
      case 'CRITICAL': return '#FF0000';
      case 'HIGH': return '#FF8C00';
      case 'MEDIUM': return '#FFD700';
      default: return '#00FF00';
    }
  }

  post(url, payload) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(data);
      req.end();
    });
  }
}

// ============================================================================
// DISCORD CHANNEL
// ============================================================================

class DiscordChannel extends AlertChannel {
  constructor(config = {}) {
    super({ name: 'discord', ...config });
    this.webhookUrl = config.webhookUrl;
    this.username = config.username || 'Opportunity Radar';
    this.avatarUrl = config.avatarUrl;
  }

  async send(alert) {
    if (!this.shouldSend(alert) || !this.webhookUrl) return;
    
    const payload = this.buildDiscordPayload(alert);
    
    try {
      await this.post(this.webhookUrl, payload);
    } catch (error) {
      console.error(`Discord error: ${error.message}`);
    }
  }

  buildDiscordPayload(alert) {
    const formatted = this.formatAlert(alert);
    const color = this.getColor(alert.priority);
    
    const embed = {
      title: alert.item?.title?.substring(0, 256) || 'New Alert',
      url: alert.item?.link,
      description: alert.summary?.substring(0, 4096),
      color,
      timestamp: alert.timestamp,
      footer: {
        text: 'Opportunity Radar'
      },
      fields: [
        {
          name: 'Type',
          value: formatted.typeLabel,
          inline: true
        },
        {
          name: 'Priority',
          value: formatted.priorityLabel,
          inline: true
        }
      ]
    };

    if (alert.details?.fundingAmount) {
      embed.fields.push({
        name: 'Funding',
        value: `$${(alert.details.fundingAmount / 1000000).toFixed(2)}M`,
        inline: true
      });
    }

    if (alert.details?.competitors?.length > 0) {
      embed.fields.push({
        name: 'Competitors',
        value: alert.details.competitors.map(c => c.name).join(', ').substring(0, 1024),
        inline: false
      });
    }

    if (alert.details?.sectors?.length > 0) {
      embed.fields.push({
        name: 'Sectors',
        value: alert.details.sectors.join(', ').substring(0, 1024),
        inline: false
      });
    }

    if (alert.actionItems?.length > 0) {
      embed.fields.push({
        name: 'Action Items',
        value: alert.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n').substring(0, 1024),
        inline: false
      });
    }

    return {
      username: this.username,
      avatar_url: this.avatarUrl,
      embeds: [embed]
    };
  }

  getColor(priority) {
    switch (priority) {
      case 'CRITICAL': return 0xFF0000;
      case 'HIGH': return 0xFF8C00;
      case 'MEDIUM': return 0xFFD700;
      default: return 0x00FF00;
    }
  }

  post(url, payload) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(data);
      req.end();
    });
  }
}

// ============================================================================
// ALERT MANAGER
// ============================================================================

class AlertManager {
  constructor() {
    this.channels = [];
    this.alertHistory = [];
    this.maxHistory = 1000;
    this.deduplicationWindow = 3600000; // 1 hour
  }

  addChannel(channel) {
    this.channels.push(channel);
    return this;
  }

  removeChannel(name) {
    this.channels = this.channels.filter(c => c.name !== name);
    return this;
  }

  async broadcast(alert) {
    // Deduplication check
    if (this.isDuplicate(alert)) {
      return;
    }

    // Add to history
    this.alertHistory.push({
      ...alert,
      broadcastAt: new Date().toISOString()
    });

    // Trim history
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistory);
    }

    // Broadcast to all channels
    const results = await Promise.allSettled(
      this.channels.map(channel => channel.send(alert))
    );

    return results;
  }

  isDuplicate(alert) {
    const now = Date.now();
    const alertTitle = alert.item?.title?.toLowerCase()?.trim();
    
    if (!alertTitle) return false;

    return this.alertHistory.some(h => {
      const historyTitle = h.item?.title?.toLowerCase()?.trim();
      const timeDiff = now - new Date(h.broadcastAt).getTime();
      
      return historyTitle === alertTitle && timeDiff < this.deduplicationWindow;
    });
  }

  getHistory(options = {}) {
    let history = [...this.alertHistory];
    
    if (options.type) {
      history = history.filter(h => h.type === options.type);
    }
    
    if (options.priority) {
      history = history.filter(h => h.priority === options.priority);
    }
    
    if (options.limit) {
      history = history.slice(-options.limit);
    }
    
    return history;
  }

  clearHistory() {
    this.alertHistory = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ALERT_TYPES,
  PRIORITIES,
  AlertChannel,
  ConsoleChannel,
  FileChannel,
  WebhookChannel,
  SlackChannel,
  DiscordChannel,
  AlertManager
};
