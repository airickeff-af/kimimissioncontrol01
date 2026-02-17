# Scout Trend Forecaster

Industry Trend Forecasting System for Crypto & Fintech in Southeast Asia.

## Overview

This agent predicts emerging trends based on:
- **Funding velocity** - Which sectors are getting more investment
- **Hiring trends** - Which roles and companies are growing
- **News volume** - Spikes in media coverage
- **Patent filings** - New technology areas
- **Conference topics** - What's being discussed in the industry

## Installation

```bash
cd /mission-control/agents/scout
npm install  # if dependencies are added later
```

## Usage

### Generate Quarterly Trend Report

```bash
node trend-forecaster.js forecast Q1 2025
```

### Analyze Specific Sector

```bash
node trend-forecaster.js analyze crypto
node trend-forecaster.js analyze fintech
node trend-forecaster.js analyze blockchain
```

### Show Help

```bash
node trend-forecaster.js help
```

## Available Sectors

- `crypto` - Cryptocurrency markets and projects
- `fintech` - Financial technology broadly
- `blockchain` - Enterprise and public blockchain
- `defi` - Decentralized finance
- `payments` - Payment systems and infrastructure
- `digital_banking` - Neobanks and digital-first banking

## Output

Reports are saved to `reports/` directory:
- `YYYY-QX-trend-report.json` - Machine-readable data
- `YYYY-QX-trend-report.md` - Human-readable report

## Methodology

The forecaster uses simple statistical methods (no ML):

1. **Month-over-Month Growth Rates** - Compare current vs previous period
2. **Momentum Scoring** - Weighted average across indicator categories:
   - Funding: 35%
   - Hiring: 25%
   - News: 20%
   - Patents: 10%
   - Conferences: 10%
3. **Keyword Analysis** - Track emerging terminology frequency
4. **Trend Projection** - Apply decay factor (0.85) to momentum for forward-looking estimates

## Data Sources

In production, the system connects to:
- Funding: Crunchbase, PitchBook, regional databases
- Hiring: LinkedIn, job boards, company career pages
- News: News APIs, RSS feeds, media monitoring
- Patents: USPTO, EPO, regional patent offices
- Conferences: Event APIs, agenda scraping

## Architecture

```
trend-forecaster.js
├── TrendIndicator      # Individual metric with growth calculation
├── SectorAnalysis      # Sector-level aggregation and forecasting
├── DataCollector       # Data ingestion (mock data for now)
└── TrendForecaster     # Main engine and report generation
```

## Configuration

Edit the `CONFIG` object in `trend-forecaster.js`:

```javascript
const CONFIG = {
  reportDir: path.join(__dirname, 'reports'),
  dataDir: path.join(__dirname, 'data'),
  sectors: ['crypto', 'fintech', 'blockchain', 'defi', 'payments', 'digital_banking'],
  regions: ['singapore', 'indonesia', 'thailand', 'vietnam', 'malaysia', 'philippines'],
  forecastHorizon: 6, // months
};
```

## 2025 Q1 Forecast Summary (Crypto/Fintech in SEA)

### Overall Sentiment: CAUTIOUSLY OPTIMISTIC

**Key Findings:**
- Crypto sector showing strong recovery (+19.93% funding growth)
- Fintech facing headwinds (-20.92% funding decline)
- Hiring remains positive across blockchain/DeFi roles
- Regulatory clarity improving (MAS framework updates)

**Accelerating Sectors:**
1. Crypto (+14.01% momentum)
2. DeFi (+12.09% momentum)
3. Payments (+12.09% momentum)
4. Blockchain (+11.12% momentum)
5. Digital Banking (+12.09% momentum)

**Top Emerging Trends:**
1. QR Payments (55 mentions)
2. Embedded Finance (52 mentions)
3. Open Banking (48 mentions)
4. Real-time Payments (48 mentions)
5. Institutional Adoption (45 mentions)

**3-6 Month Outlook:**
- Direction: Modest growth
- Confidence: Medium
- Key opportunities: Cross-border payments, RWA tokenization, AI-blockchain convergence

## License

Internal use only - Mission Control Agent System
