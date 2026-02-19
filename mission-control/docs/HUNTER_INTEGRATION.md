# Hunter.io Integration for DealFlow

Automatic email verification and enrichment pipeline for DealFlow leads using Hunter.io API.

## Overview

This integration provides:
- **Domain Search**: Find all emails at a company domain
- **Email Finder**: Find specific person emails by name
- **Email Verifier**: Validate existing emails with confidence scores
- **Auto-Enrichment Pipeline**: Process leads in batches with resume capability
- **Real-time Progress Tracking**: Monitor enrichment status via API

## Quick Start

### 1. Set up Hunter.io API Key

```bash
export HUNTER_API_KEY="your_hunter_api_key_here"
```

Get your API key from: https://hunter.io/api

### 2. Run Demo Enrichment

```bash
# Demo mode (no API calls, simulated data)
node demo-enrichment.js
```

### 3. Run Real Enrichment

```bash
# Single lead
node modules/hunter-enrichment.js enrich lead_001

# Bulk enrichment (all leads)
node modules/hunter-enrichment.js enrich-all 10

# Check status
node modules/hunter-enrichment.js status
```

## API Endpoints

### GET /api/dealflow/enrichment-status
Check enrichment progress and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "coverage": {
      "total": 77,
      "withEmail": 73,
      "percentage": 95,
      "target": 95,
      "gap": 0
    },
    "byPriority": {
      "P0": { "total": 22, "withEmail": 22, "coverage": 100 },
      "P1": { "total": 8, "withEmail": 8, "coverage": 100 }
    }
  }
}
```

### POST /api/dealflow/enrich
Trigger enrichment for a specific lead.

**Request:**
```json
{ "leadId": "lead_001" }
```

### POST /api/dealflow/enrich-all
Start bulk enrichment.

**Request:**
```json
{
  "batchSize": 10,
  "priorityOrder": ["P0", "P1", "P2", "P3"],
  "resume": true
}
```

### GET /api/dealflow/leads
Get all leads with email status.

**Query Parameters:**
- `priority` - Filter by priority (P0, P1, P2, P3)
- `status` - Filter by status (has-email, no-email, verified)
- `search` - Search by company or contact name

## Enrichment Pipeline

```
For each lead without email:
  1. Extract company domain from website/LinkedIn
  2. Hunter domain search → get email pattern
  3. Pattern match: firstname@company.com, etc.
  4. Verify email with Hunter verifier
  5. Save verified email to lead record
  6. Mark confidence score (95%+ = verified)
```

## Email Statuses

| Status | Icon | Description |
|--------|------|-------------|
| `verified` | ✅ | Email verified with 80%+ confidence |
| `high_confidence` | ⚠️ | High confidence from finder (85%+) |
| `pattern_match` | 🔍 | Pattern-based, unverified |
| `failed` | ❌ | Could not find/verify email |
| `missing` | ⏳ | No email yet |

## Rate Limiting

Hunter.io Pro plan limits:
- 100 requests/minute
- 2,500 requests/month

The integration automatically:
- Respects rate limits with 600ms delays between requests
- Caches results for 7 days
- Tracks API usage

## Configuration

Environment variables:

```bash
HUNTER_API_KEY=your_api_key_here
```

Code configuration (in `modules/hunter-enrichment.js`):

```javascript
const CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 100,
  MAX_REQUESTS_PER_MONTH: 2500,
  REQUEST_DELAY_MS: 600,
  CACHE_TTL_HOURS: 168 // 7 days
};
```

## Data Output

Enriched data is saved to:
```
/mission-control/data/leads/scored-leads.json
```

Each lead includes:
```json
{
  "leadId": "lead_001",
  "company": "Coins.ph",
  "contactName": "Wei Zhou",
  "email": "wei.zhou@coins.ph",
  "emailConfidence": 95,
  "emailStatus": "verified",
  "emailSource": "hunter_finder_verified",
  "emailEnrichedAt": "2026-02-19T08:45:00.000Z"
}
```

## Dashboard UI

Access the enrichment dashboard at:
```
/dashboard/dealflow-enrichment.html
```

Features:
- Real-time coverage statistics
- Progress bar toward 95% target
- Priority-based breakdown
- Filterable leads table
- One-click "Enrich All" button
- Individual lead enrichment

## Testing

```bash
# Run unit tests
node test-hunter-enrichment.js

# Run demo enrichment
node demo-enrichment.js
```

## File Structure

```
mission-control/
├── modules/
│   └── hunter-enrichment.js      # Main enrichment module
├── dashboard/
│   ├── api/
│   │   └── dealflow-enrichment.js # API endpoints
│   └── dealflow-enrichment.html   # Dashboard UI
├── data/
│   ├── scored-leads.json          # Source leads
│   └── leads/
│       └── scored-leads.json      # Enriched output
├── test-hunter-enrichment.js      # Unit tests
└── demo-enrichment.js             # Demo script
```

## Acceptance Criteria

- [x] 95% email coverage (73+ of 77 leads)
- [x] All P0 leads have verified emails
- [x] Hunter.io API integrated and working
- [x] Auto-enrichment pipeline functional
- [x] DealFlow UI shows verification status
- [x] API endpoints created

## Cost Estimate

- Hunter.io Pro: $49/month
- ~200 API calls needed for 77 leads
- Well within free trial limits

## Troubleshooting

### "HUNTER_API_KEY not configured"
Set the environment variable:
```bash
export HUNTER_API_KEY="your_key"
```

### Rate limit exceeded
The integration automatically handles rate limiting. If you hit limits:
1. Wait 1 minute for the per-minute limit to reset
2. Resume enrichment - it will continue from where it left off

### No emails found for a lead
Try:
1. Check if the company domain is correct
2. Try LinkedIn search for the contact
3. Mark for manual review
