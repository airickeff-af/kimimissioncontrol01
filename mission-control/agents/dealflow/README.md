# DealFlow Lead Enrichment Automation

**Location:** `/mission-control/agents/dealflow/auto-enrich.js`

## Overview

Auto-enrich is a Node.js automation script that watches for new leads and automatically enriches them with email addresses and social media profiles using the existing finder modules.

## Features

- **Automatic Lead Detection**: Watches `leads.json` for new entries
- **Email Discovery**: Uses pattern-based generation and MX verification
- **Social Discovery**: Finds LinkedIn, Twitter, and GitHub profiles
- **Batch Processing**: Processes leads in configurable batches
- **State Persistence**: Tracks processed leads to avoid duplicates
- **Retry Logic**: Automatically retries failed enrichments
- **Logging**: Comprehensive logging to console and file
- **PENDING_TASKS Integration**: Updates task log with enrichment results

## Usage

### Watch Mode (Continuous)
```bash
node auto-enrich.js
```
Monitors `leads.json` every 30 seconds and processes new leads automatically.

### Single Run
```bash
node auto-enrich.js --once
```
Processes all unenriched leads once and exits.

### Dry Run (Preview)
```bash
node auto-enrich.js --once --dry-run
```
Shows which leads would be enriched without making changes.

### Enrich Specific Lead
```bash
node auto-enrich.js --lead-id=lead_001 --once
```
Enriches a specific lead by ID.

## Configuration

Edit the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
  leadsFile: '/mission-control/data/leads.json',
  enrichedLeadsFile: '/mission-control/data/enriched-leads.json',
  logFile: '/mission-control/logs/enrichment.log',
  watchIntervalMs: 30000,      // Check interval in watch mode
  maxConcurrent: 3,            // Parallel enrichments
  delayBetweenBatches: 1000,   // Delay between batches
  retryAttempts: 2,            // Retry failed enrichments
  retryDelayMs: 5000           // Delay between retries
};
```

## Input Format

The `leads.json` file should contain an array of lead objects:

```json
[
  {
    "id": "lead_001",
    "name": "John Doe",
    "company": "Acme Inc",
    "title": "CEO",
    "domain": "acme.com",
    "region": "USA",
    "industry": "Technology",
    "priority": "P1",
    "score": 85
  }
]
```

## Output Format

Enriched leads are saved to `enriched-leads.json`:

```json
{
  "lastUpdated": "2026-02-17T22:41:59.661Z",
  "stats": {
    "totalProcessed": 5,
    "totalEnriched": 5,
    "byQuality": { "high": 2, "medium": 2, "low": 1, "insufficient": 0 }
  },
  "leads": [
    {
      "original": { /* original lead data */ },
      "enriched": { /* enriched contact info */ },
      "email": { /* email discovery results */ },
      "social": { /* social profile discovery */ },
      "verification": { /* verification results */ },
      "confidence": 80,
      "quality": "high",
      "enrichedAt": "2026-02-17T22:41:56.855Z"
    }
  ]
}
```

## Enrichment Quality Levels

- **High** (80-100%): Verified email + multiple social profiles
- **Medium** (60-79%): Verified email + 1 social profile
- **Low** (40-59%): Best guess email or unverified social
- **Insufficient** (<40%): Limited data found

## Integration with Lead Pipeline

The auto-enrich script integrates with the existing lead pipeline:

1. **Lead Intake**: New leads added to `leads.json`
2. **Auto-Detection**: Script detects file changes
3. **Enrichment**: Processes new leads using finder modules
4. **Storage**: Saves enriched data to `enriched-leads.json`
5. **Logging**: Updates `PENDING_TASKS.md` with results

## Modules Used

- `email-finder.js`: Pattern-based email discovery and MX verification
- `social-finder.js`: LinkedIn, Twitter, GitHub profile discovery
- `lead-enricher.js`: Combines email and social enrichment

## Logs

Logs are written to `/mission-control/logs/enrichment.log`:

```
[2026-02-17T22:41:55.123Z] INFO: Starting single enrichment run...
[2026-02-17T22:41:55.234Z] ENRICH: Enriching: Nichel Gaba @ PDAX
[2026-02-17T22:41:56.439Z] SUCCESS: Enriched Nichel Gaba: INSUFFICIENT (32% confidence)
```

## Example Enriched Lead

```json
{
  "original": {
    "id": "lead_001",
    "name": "Nichel Gaba",
    "company": "PDAX",
    "title": "Founder & CEO",
    "domain": "pdax.ph"
  },
  "email": {
    "verified": {
      "email": "nichel.gaba@pdax.ph",
      "valid": true,
      "score": 80,
      "mxRecords": ["aspmx.l.google.com", "alt1.aspmx.l.google.com"]
    },
    "confidence": 80
  },
  "social": {
    "profiles": {},
    "confidence": 0
  },
  "confidence": 32,
  "quality": "insufficient",
  "enrichedAt": "2026-02-17T22:41:56.855Z"
}
```

## Troubleshooting

### No leads being enriched
- Check that `leads.json` exists and is valid JSON
- Verify lead objects have required fields: `id`, `name`, `company`, `domain`
- Check logs for parsing errors

### All enrichments failing
- Verify network connectivity for DNS lookups
- Check that domain values are valid (e.g., `pdax.ph` not `pdax`)
- Review `enrichment.log` for specific errors

### Duplicate processing
- The script tracks processed IDs in `enriched-leads.json`
- Delete this file to re-process all leads
- Or use `--lead-id=` to target specific leads

## Future Enhancements

- [ ] Webhook notifications on enrichment completion
- [ ] Integration with CRM systems
- [ ] Machine learning for pattern recognition
- [ ] Rate limiting for external APIs
- [ ] Email verification via SMTP
- [ ] LinkedIn API integration
