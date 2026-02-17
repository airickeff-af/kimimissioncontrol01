# Scout Regional Lead Auto-Discovery

**Task:** TASK-SI-004  
**Priority:** P2  
**Agent:** Scout (Research Agent)

## Overview

Weekly automated scanning system for discovering new companies in target regions (SEA, HK, Australia) across Crypto, Fintech, Payments, and DeFi industries.

## Files

| File | Description |
|------|-------------|
| `auto-discover.js` | Main discovery script |
| `weekly-discover.sh` | Cron wrapper script |
| `../../data/auto-discover-state.json` | Scan state tracking |
| `../../data/auto-discover-reports/` | Weekly scan reports |

## Usage

### Manual Scan
```bash
# Run full discovery scan
node auto-discover.js --scan

# Dry run (no changes saved)
node auto-discover.js --dry-run

# Generate weekly report
node auto-discover.js --report

# Show sample leads
node auto-discover.js --sample

# Show help
node auto-discover.js --help
```

### Cron Setup (Weekly)
```bash
# Add to crontab - runs every Monday at 9:00 AM
0 9 * * 1 /root/.openclaw/workspace/mission-control/agents/scout/weekly-discover.sh
```

## Target Configuration

### Regions
- Philippines
- Singapore
- Hong Kong
- Thailand
- Indonesia
- Australia

### Industries
- Crypto
- Fintech
- Payments
- DeFi

### Data Sources
1. **Crunchbase** - Funding announcements
2. **Tech Blogs** - TechCrunch, e27, DealStreetAsia
3. **LinkedIn** - Company growth signals

## Lead Scoring

| Factor | Weight | Criteria |
|--------|--------|----------|
| Industry Match | 40% | Target industry match |
| Funding Amount | 30% | $1M+ = 70pts, $5M+ = 85pts, $10M+ = 100pts |
| Region Match | 20% | Target region match |
| Recency | 10% | Last week = 100pts, last month = 85pts |

### Priority Tiers
- **P0**: Score 85+ (Critical)
- **P1**: Score 70-84 (Important)
- **P2**: Score 55-69 (Worth monitoring)
- **P3**: Score <55 (Low priority)

## Output

### Lead Format
```json
{
  "id": "lead_031",
  "company": "Amber Group",
  "contact_name": "Michael Wu",
  "title": "CEO",
  "priority": "P1",
  "region": "Singapore",
  "industry": "Crypto (Series C)",
  "auto_discovered": true,
  "tags": ["auto-discovered", "singapore", "crypto"],
  "funding_amount": 50000000,
  "funding_round": "Series C",
  "discovery_score": 80
}
```

### Report Format
Reports saved to `../../data/auto-discover-reports/report-YYYY-MM-DD.json`

```json
{
  "generatedAt": "2026-02-17T22:41:54.597Z",
  "summary": {
    "totalQueries": 72,
    "newDiscoveries": 55,
    "addedToLeads": 55,
    "skippedDuplicates": 0
  },
  "byRegion": { "Singapore": 12, "Hong Kong": 10, ... },
  "byIndustry": { "Crypto": 15, "Fintech": 15, ... },
  "byPriority": { "P0": 0, "P1": 55, "P2": 0, "P3": 0 }
}
```

## Integration Notes

### To Enable Live Data (Production)
1. **Crunchbase API**: Replace `searchFundingAnnouncements()` with actual API calls
2. **News APIs**: Integrate NewsAPI, GNews for tech blog scanning
3. **LinkedIn API**: Use LinkedIn Marketing API for company signals
4. **RSS Feeds**: Parse TechCrunch, e27, DealStreetAsia RSS feeds

### Duplicate Detection
- Tracks known companies in `auto-discover-state.json`
- Checks against existing `leads.json` before adding
- Prevents duplicate entries across scans

## Sample Discovered Leads

| Company | Region | Industry | Funding | Priority |
|---------|--------|----------|---------|----------|
| Amber Group | Singapore | Crypto | $50M Series C | P1 |
| WeLab | Hong Kong | Fintech | $35M Series D | P1 |
| PayMongo | Philippines | Payments | $31M Series B | P1 |
| Pendle Finance | Singapore | DeFi | $15M Series A | P1 |
| Synthetix | Australia | DeFi | $20M Series A | P1 |

## Logs

Scan logs: `/root/.openclaw/workspace/mission-control/data/auto-discover.log`

## Maintenance

- State file tracks 52 weeks of scan history
- Reports retained indefinitely
- Duplicate prevention based on company name matching
- Automatic lead ID generation
