# PIE - Opportunity Radar

**Predictive Intelligence Engine Module**  
Monitor crypto/NFT/startup ecosystems for partnership opportunities and competitive intelligence.

---

## Features

### 🎯 Core Capabilities
- **News Monitoring**: RSS feeds from CoinDesk, CoinTelegraph, TechCrunch, and more
- **Competitor Tracking**: Track Binance, Coinbase, Kraken, OpenSea, and others
- **Funding Alerts**: Detect funding rounds and investment activities
- **Partnership Detection**: Identify potential collaboration opportunities
- **Hot Sector Analysis**: Track trending sectors (AI, DePIN, RWA, etc.)

### 📡 Alert Channels
- Console (real-time)
- File (JSON/Markdown/CSV)
- Slack webhooks
- Discord webhooks
- Custom webhooks

### 📊 Intelligence Outputs
- Real-time dashboard (HTML)
- Daily intelligence briefings
- Competitor activity reports
- Funding tracker
- Partnership maps

---

## Quick Start

```bash
# Run a full scan
node index.js scan

# Start continuous monitoring
node index.js start

# Generate dashboard
node index.js dashboard

# Search intelligence database
node index.js search "Binance partnership"

# Generate briefing
node index.js briefing
```

---

## Architecture

```
mission-control/agents/pie/
├── index.js                    # Main integration entry point
├── opportunity-radar.js        # Core monitoring engine
├── news-integrations.js        # RSS/API/Web scraping
├── alert-system.js             # Multi-channel alerts
├── competitor-dashboard.js     # Competitor tracking
└── README.md                   # This file
```

---

## Module Details

### opportunity-radar.js
Core monitoring engine with:
- Configurable monitoring intervals
- Content analysis and scoring
- Opportunity detection algorithms
- Data persistence

### news-integrations.js
News source integrations:
- RSS feed parsing (CoinDesk, TechCrunch, etc.)
- API integrations (CryptoPanic, NewsAPI)
- Web scraping capabilities
- Source manager for extensibility

### alert-system.js
Multi-channel alert system:
- Priority-based filtering
- Deduplication
- Console, File, Slack, Discord channels
- Custom webhook support

### competitor-dashboard.js
Competitor intelligence dashboard:
- Activity tracking
- Metrics history
- Funding tracker
- Partnership mapping
- HTML dashboard generation

---

## Configuration

### Environment Variables
```bash
# Slack notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export SLACK_CHANNEL="#opportunities"

# Discord notifications
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### Custom Competitors
```javascript
// In competitor-dashboard.js or via API
competitorTracker.addCompetitor({
  name: 'Your Competitor',
  type: 'exchange',
  website: 'https://example.com',
  twitter: '@example',
  tags: ['defi', 'ethereum']
});
```

### Custom News Sources
```javascript
// In news-integrations.js
sourceManager.register(new RSSSource({
  name: 'Custom Source',
  url: 'https://example.com/feed.xml'
}));
```

---

## Data Storage

```
data/opportunity-radar/
├── alerts/
│   └── 2024-01-15.json       # Daily alerts
├── cache/
│   └── coindesk.json         # Source cache
├── reports/
│   ├── briefing-2024-01-15.json
│   └── opportunity-2024-01-15.json
├── competitors/
│   ├── binance.json
│   └── coinbase.json
└── dashboard.html            # Generated dashboard
```

---

## Alert Types

| Type | Description | Priority |
|------|-------------|----------|
| FUNDING_ALERT | Funding round announced | HIGH |
| PARTNERSHIP_OPPORTUNITY | Potential partnership | HIGH |
| M&A_ACTIVITY | Merger or acquisition | HIGH |
| PRODUCT_LAUNCH | New product/feature | MEDIUM |
| MARKET_EXPANSION | Geographic expansion | MEDIUM |
| COMPETITOR_MOVE | Significant competitor action | MEDIUM |

---

## Opportunity Scoring

The radar scores opportunities based on:
- **Keyword matches** (partnership, funding, etc.)
- **Competitor mentions**
- **Hot sector alignment**
- **Funding amount** (if applicable)

Score thresholds:
- **Hot** (≥3.0): Immediate attention
- **Medium** (1.5-3.0): Review recommended
- **Low** (<1.5): Background monitoring

---

## API Usage

```javascript
const { PIEOpportunityRadar } = require('./index');

const pie = new PIEOpportunityRadar({
  alertChannels: ['console', 'slack']
});

await pie.initialize();

// Run scan
await pie.runFullScan();

// Query alerts
const alerts = pie.getAlerts({ priority: 'HIGH' });

// Search
const results = pie.search('DeFi partnership');

// Get dashboard
const dashboard = pie.getDashboard();
```

---

## Inspired By

- **Crunchbase**: Funding alerts and company intelligence
- **Google Alerts**: News monitoring and keyword tracking
- **Owler**: Competitive intelligence and company profiles

---

## License

MIT - Part of the PIE (Predictive Intelligence Engine) system.
