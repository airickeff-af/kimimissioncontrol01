# Lead Scoring Algorithm v2.0

**Task:** TASK-023  
**Assigned:** Nexus (Air1ck3ff)  
**Due:** Feb 20, 2026  
**Status:** ✅ COMPLETED  
**Algorithm Version:** 2.0.0

---

## Overview

AI-powered lead quality scoring system that evaluates leads on a 0-100 scale based on four key criteria designed for EricF's partnership and business development needs.

## Scoring Criteria

### 1. Company Size/Funding (25%)
Evaluates the financial stability and scale of the target company.

**Sub-categories:**
- **Funding (40%)**: Amount raised, funding stage
  - $100M+ → 100 points
  - $50M-$100M → 90 points
  - $20M-$50M → 80 points
  - $10M-$20M → 70 points
  - $5M-$10M → 60 points
  - $1M-$5M → 50 points
  - Seed/Pre-seed → 40 points
  - Bootstrapped → 30 points

- **Company Size (35%)**: Employee count, market presence
  - Enterprise (1000+) → 100 points
  - Large (500-1000) → 85 points
  - Scale-up (100-500) → 75 points
  - Growth (50-100) → 65 points
  - Mid-size (20-50) → 55 points
  - Startup (5-20) → 45 points
  - Small (<5) → 35 points

- **Market Presence (25%)**: Market dominance indicators
  - Dominant (market leader) → 100 points
  - Major (top 3) → 85 points
  - Established → 70 points
  - Growing → 60 points
  - Emerging → 45 points

### 2. Partnership Potential (30%)
Assesses the strategic fit and collaboration opportunities.

**Sub-categories:**
- **Partnership Type (40%)**: Type of potential partnership
  - Integration → 100 points
  - Distribution → 95 points
  - Strategic Alliance → 90 points
  - Investment → 85 points
  - Co-marketing → 70 points
  - Vendor → 60 points
  - Referral → 50 points

- **Deal Size Potential (35%)**: Estimated partnership value
  - Enterprise ($1M+) → 100 points
  - Large ($500K-$1M) → 85 points
  - Medium ($100K-$500K) → 70 points
  - Small ($25K-$100K) → 55 points
  - Pilot (<$25K) → 40 points

- **Strategic Fit (25%)**: Alignment with strategic goals
  - Based on keyword analysis of lead notes
  - High-value keywords: integration, API, partnership, B2B, enterprise
  - Scored 0-100 based on keyword matches

### 3. Contact Accessibility (25%)
Measures how reachable the contact is through various channels.

**Scoring:**
- Verified email → 25 points
- Unverified email → 15 points
- Personal LinkedIn → 20 points
- Company LinkedIn only → 10 points
- Active Twitter/X → 15 points
- Phone number → 15 points
- Telegram → 10 points
- Website contact form → 5 points

**Seniority Multiplier:**
- CEO/Founder → 1.0x (full points)
- C-Level → 0.95x
- VP/Head of → 0.90x
- Director → 0.85x
- Manager → 0.80x
- Other → 0.75x

*Rationale: Higher-level contacts are harder to reach but more valuable when contacted.*

### 4. Market Relevance (20%)
Evaluates industry alignment and geographic fit.

**Sub-categories:**
- **Industry (50%)**: Crypto/blockchain sector alignment
  - Crypto Exchange → 100 points
  - DeFi → 100 points
  - RWA (Real World Assets) → 95 points
  - Payments/Remittance → 90 points
  - Web3 Infrastructure → 90 points
  - Blockchain → 85 points
  - Crypto Wallet → 85 points
  - Custody → 80 points
  - FinTech → 75 points
  - Other → 40 points

- **Geography (30%)**: Priority markets for EricF
  - Philippines → 100 points (primary market)
  - Southeast Asia → 90 points
  - Singapore → 85 points
  - Hong Kong → 85 points
  - Indonesia → 80 points
  - Thailand → 80 points
  - Vietnam/Malaysia → 75 points
  - Asia Pacific → 70 points
  - US → 70 points
  - Europe → 65 points

- **Timing (20%)**: Current opportunity indicators
  - Active fundraising → 95 points
  - Recent funding → 90 points
  - Expansion mode → 85 points
  - Hiring spree → 80 points
  - Product launch → 80 points
  - Stable → 60 points
  - Unknown → 50 points

## Priority Tiers

Based on total score (0-100):

| Tier | Score Range | Action Required |
|------|-------------|-----------------|
| **P0** | 80-100 | Contact within 24 hours |
| **P1** | 65-79 | Contact within 3 days |
| **P2** | 50-64 | Contact within 1 week |
| **P3** | 35-49 | Contact within 2 weeks |
| **Cold** | 0-34 | Nurture or archive |

## API Endpoints

### Score All Leads
```
POST /api/v2/leads/score
```
Score all leads from the database or provided array.

### Score Single Lead
```
POST /api/v2/leads/score-single
Body: { lead: { ... } }
```
Score an individual lead.

### Batch Scoring
```
POST /api/v2/leads/batch-score
Body: { leads: [...], batchSize: 50, parallel: false }
```
Score large datasets in batches.

### Get Scored Leads
```
GET /api/v2/leads/scored
Query: ?tier=P1&minScore=65&limit=50
```
Retrieve scored leads with filters.

### Get Weights
```
GET /api/v2/leads/weights
```
Get current scoring configuration.

### Get Analytics
```
GET /api/v2/leads/analytics
Query: ?groupBy=tier|industry|region|scoreRange
```
Get detailed scoring analytics.

## File Locations

- **Algorithm:** `/mission-control/agents/code/lead-scoring-v2.js`
- **API Routes:** `/mission-control/agents/code/lead-scoring-api-v2.js`
- **Scored Leads:** `/mission-control/data/scored-leads-v2.json`
- **Documentation:** `/mission-control/docs/lead-scoring-v2.md` (this file)

## Usage Examples

### CLI Usage
```bash
cd /mission-control/agents/code
node lead-scoring-v2.js
```

### API Usage
```javascript
const scoring = require('./lead-scoring-v2');

// Score single lead
const result = scoring.calculateLeadScore(lead);
console.log(result.totalScore, result.priorityTier);

// Score multiple leads
const results = scoring.scoreLeads(leads);
```

### Express Integration
```javascript
const express = require('express');
const scoringRouter = require('./lead-scoring-api-v2');

const app = express();
app.use('/api/v2/leads', scoringRouter);
```

## Current Results (26 Leads)

**Summary:**
- Average Score: 47/100
- P0 (Immediate): 0 leads
- P1 (High Priority): 2 leads
- P2 (Medium Priority): 7 leads
- P3 (Low Priority): 16 leads
- Cold: 1 lead

**Top 5 Leads:**
1. PDAX (Nichel Gaba) - Score: 70 (P1)
2. Coins.ph (Wei Zhou) - Score: 68 (P1)
3. Angkas (George Royeca) - Score: 56 (P2)
4. GCash (Martha Sazon) - Score: 56 (P2)
5. Xendit Group (Moses Lo) - Score: 55 (P2)

**Category Averages:**
- Company Size/Funding: 48/100
- Partnership Potential: 50/100
- Contact Accessibility: 23/100 ⚠️
- Market Relevance: 68/100

## Recommendations

### Immediate Actions
1. **Contact Accessibility is low (23/100)** - Need to find verified emails for top leads
2. **No P0 leads identified** - Need more research on top prospects
3. **Focus on PDAX and Coins.ph** - Highest scores, prioritize contact research

### Algorithm Improvements
1. Add sentiment analysis for notes field
2. Integrate with Crunchbase API for funding data
3. Add social media activity scoring
4. Implement ML model for continuous improvement

## Changelog

### v2.0.0 (Feb 18, 2026)
- ✅ Complete redesign based on 4 new criteria
- ✅ Added partnership potential scoring
- ✅ Enhanced contact accessibility metrics
- ✅ Improved market relevance scoring
- ✅ Added batch scoring API
- ✅ Added analytics endpoints
- ✅ Added actionable recommendations

### v1.0.0 (Feb 17, 2026)
- Initial implementation
- Basic 4-criteria scoring (industry, company size, seniority, region)

---

*Last Updated: Feb 18, 2026 5:30 AM HKT*  
*Maintained by: Nexus (Air1ck3ff)*
