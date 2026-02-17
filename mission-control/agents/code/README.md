# DealFlow Lead Scoring Algorithm

Auto-scores DealFlow leads by quality/priority on a 0-100 scale.

## Scoring Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Industry | 40% | DeFi/RWA/Payments priority |
| Company Size | 30% | Company scale/presence |
| Contact Seniority | 20% | Decision-maker level |
| Region | 10% | Geographic priority |

## Priority Tiers

| Tier | Score Range | Description |
|------|-------------|-------------|
| P0 | 80-100 | High priority - immediate action |
| P1 | 60-79 | Medium priority - follow up soon |
| P2 | 40-59 | Low priority - nurture |
| P3 | 0-39 | Cold - deprioritize |

## Files

- `lead-scoring.js` - Core scoring algorithm
- `lead-scoring-api.js` - Express API endpoints
- `../../data/scored-leads.json` - Scoring results output

## Usage

### CLI
```bash
node lead-scoring.js
```

### API Server
```bash
node lead-scoring-api.js
```

### API Endpoints

#### Score All Leads
```bash
POST /api/leads/score
# or with custom leads
POST /api/leads/score
{ "leads": [...] }
```

#### Score Single Lead
```bash
POST /api/leads/score-single
{
  "lead": {
    "id": "lead_001",
    "company": "Example Corp",
    "contact_name": "John Doe",
    "email": "john@example.ph",
    "notes": "CEO of crypto exchange"
  }
}
```

#### Get Scored Results
```bash
GET /api/leads/scored
GET /api/leads/scored?tier=P0
GET /api/leads/scored?minScore=80&limit=10
```

#### Get Weights Config
```bash
GET /api/leads/weights
```

## Integration

```javascript
const { calculateLeadScore, scoreLeads } = require('./lead-scoring');

// Score single lead
const result = calculateLeadScore(lead);

// Score multiple leads
const results = scoreLeads(leads);
```

## Current Results

- **Total Leads**: 6
- **Average Score**: 88/100
- **P0 (High Priority)**: 5 leads
- **P1 (Medium Priority)**: 1 lead

### Top Scored Leads
1. Coins.ph - 92 (P0)
2. BloomX - 92 (P0)
3. Rebit.ph - 92 (P0)
4. PDAX - 90 (P0)
5. Binance Philippines - 86 (P0)
