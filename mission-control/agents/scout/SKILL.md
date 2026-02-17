# SKILL.md - Scout (Research Agent)

## Regional Lead Auto-Discovery (TASK-SI-004)

### Overview
Weekly automated scanning system for discovering new companies in target regions (SEA, HK, Australia) across Crypto, Fintech, Payments, and DeFi industries.

### Usage
```bash
# Run full discovery scan
node auto-discover.js --scan

# Dry run (no changes saved)
node auto-discover.js --dry-run

# Generate weekly report
node auto-discover.js --report

# Show sample leads
node auto-discover.js --sample
```

### Cron Setup
```bash
# Add to crontab - runs every Monday at 9:00 AM
0 9 * * 1 /root/.openclaw/workspace/mission-control/agents/scout/weekly-discover.sh
```

### Target Configuration
- **Regions**: Philippines, Singapore, Hong Kong, Thailand, Indonesia, Australia
- **Industries**: Crypto, Fintech, Payments, DeFi
- **Sources**: Crunchbase, Tech Blogs (TechCrunch, e27, DealStreetAsia), LinkedIn signals

### Files
- `auto-discover.js` - Main discovery script
- `weekly-discover.sh` - Cron wrapper script
- `README-AUTO-DISCOVER.md` - Full documentation
- `../../data/auto-discover-state.json` - Scan state tracking
- `../../data/auto-discover-reports/` - Weekly scan reports

---

## Competitor Alert System

### Overview
Real-time monitoring system for tracking competitor activities across crypto exchanges, payment processors, and fintech companies in SEA/HK markets.

### Alert Triggers

| Trigger | Icon | Priority | Description |
|---------|------|----------|-------------|
| PRODUCT_LAUNCH | 🚀 | P0 | New product/feature announcements |
| FUNDING | 💰 | P0 | Funding rounds and investments |
| MARKET_ENTRY | 🌏 | P0 | Geographic expansion into SEA/HK |
| KEY_HIRE | 👔 | P1 | Executive hires (CEO, CTO, BD) |
| PARTNERSHIP | 🤝 | P0 | Strategic partnerships |
| ACQUISITION | 🏢 | P0 | M&A activity |
| REGULATORY | ⚖️ | P0 | Regulatory approvals/licenses |

### Priority Levels

- **P0 (🔴)** - Immediate Telegram notification
- **P1 (🟡)** - Daily digest
- **P2 (🟢)** - Weekly summary

### Monitored Competitors

#### P0 (Critical)
- Binance - Global crypto exchange (SEA focus)
- Coinbase - Expanding to SEA
- Stripe - Payment processor (strong SEA presence)
- Coins.ph - Philippines crypto exchange
- Coins.xyz - Global crypto exchange

#### P1 (Important)
- Wise - Payment processor
- Revolut - Fintech expanding to SEA
- Crypto.com - Singapore-based exchange
- OKX - Asia-focused exchange
- Bybit - Dubai/Singapore exchange
- Grab Financial Group - SEA fintech
- SeaMoney (ShopeePay) - SEA fintech

#### P2 (Monitor)
- HTX - Asia-focused exchange
- Payoneer - Payment processor
- Checkout.com - Payment processor (HK office)

### Usage

```bash
# Generate monitoring report
node competitor-monitor.js --report

# Run competitor check
node competitor-monitor.js --check

# Generate test alerts
node competitor-monitor.js --alert-test

# Send manual alert
node competitor-monitor.js --send-alert

# Send daily digest
node competitor-monitor.js --daily-digest

# Export dashboard data
node competitor-monitor.js --export > dashboard-data.json
```

### Files

- `competitor-monitor.js` - Main monitoring script
- `../../data/competitors.json` - Competitor configuration
- `../../data/competitor-history.json` - Alert history log

### Telegram Integration

Alerts are sent to EricF's Telegram (ID: 1508346957). Set `TELEGRAM_BOT_TOKEN` environment variable to enable live notifications.

### Alert History

All alerts are logged to `competitor-history.json` with:
- Unique alert ID
- Timestamp
- Competitor name
- Alert type
- Priority level
- Title and description
- Source URL

### Future Enhancements

- RSS feed monitoring for blog/newsroom URLs
- Twitter/X API integration for social monitoring
- NewsAPI/GNews integration for press coverage
- Web scraping for real-time updates
- ML-based sentiment analysis

---

## Partnership Opportunity Finder (TASK-SI-009)

### Overview
Intelligence system that identifies companies actively seeking partnerships through hiring signals, press releases, conference appearances, and website changes. Scores opportunities by strategic fit with coins.ph/coins.xyz.

### Partnership Signals Tracked

| Signal | Icon | Description | Priority |
|--------|------|-------------|----------|
| JOB_POSTING | 💼 | BD/Partnerships Manager roles | P1 |
| PRESS_RELEASE | 📰 | Partnership announcements | P0 |
| CONFERENCE | 🎤 | Speaking at partnership events | P1 |
| WEBSITE_CHANGE | 🌐 | New partner pages, marketplaces | P2 |
| PARTNERSHIP_PAGE | 🤝 | Integration directories | P2 |
| FUNDING_ANNOUNCEMENT | 💰 | Growth = partnership needs | P1 |
| LINKEDIN_POST | 💬 | "Looking for partners" posts | P2 |
| INTEGRATION_MARKETPLACE | 🔌 | API ecosystem expansion | P2 |

### Scoring Algorithm

Opportunities scored 0-100 based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Strategic Fit | 30% | Alignment with coins.ph/coins.xyz strategy |
| Partnership Urgency | 25% | How actively they're seeking partners |
| Market Presence | 20% | Company size, reach, influence |
| Accessibility | 15% | Ease of reaching decision makers |
| Timing | 10% | Current market conditions |

### Usage

```bash
# Generate weekly partnership report
node partnership-finder.js --report

# Generate HTML dashboard
node partnership-finder.js --dashboard

# Score all opportunities
node partnership-finder.js --score

# Show help
node partnership-finder.js --help
```

### Weekly Report Output

Top 10 partnership targets including:
- Company name and signal type
- Partnership score (0-100)
- Why they're seeking partners
- How to approach (outreach recommendations)
- Contact information (email, LinkedIn, website)
- Score breakdown by factor

### Files

- `partnership-finder.js` - Main finder script
- `weekly-partnership-report.sh` - Cron wrapper
- `../../data/partnership-opportunities.json` - Opportunity database
- `../../reports/partnership-report-YYYY-MM-DD.json` - Weekly reports
- `../../reports/partnership-dashboard-YYYY-MM-DD.html` - Visual dashboard

### Cron Setup

```bash
# Add to crontab - runs every Monday at 9:00 AM
0 9 * * 1 /root/.openclaw/workspace/mission-control/agents/scout/weekly-partnership-report.sh
```

### Current Top Targets (Example)

1. **Bybit** (81/100) - Hiring P2P BD for SEA expansion
2. **Solana Foundation** (79/100) - Hiring Growth Lead SEA
3. **Crypto.com** (79/100) - Active at Consensus HK 2025
4. **Remitly** (78/100) - Active Coins.ph stablecoin partnership
5. **Matrixport** (73/100) - Hiring Custody BD SEA

### Outreach Strategy Templates

**Job Posting Strategy:**
- Reach out to hiring manager on LinkedIn
- Mention you saw the BD/Partnerships role
- Offer warm introductions to potential partners

**Press Release Strategy:**
- Reference their recent announcement
- Congratulate on partnership/news
- Propose complementary integration

**Conference Strategy:**
- Schedule meeting at upcoming event
- Request 15-min coffee chat
- Prepare specific integration proposal
