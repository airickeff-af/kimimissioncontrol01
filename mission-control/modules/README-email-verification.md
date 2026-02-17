# Email Verification API Setup Guide

## Overview

This module integrates Hunter.io v2 API for real-time email verification to reduce bounce rates.

**Task:** TASK-SI-001  
**Priority:** P1  
**Due:** Feb 20, 11:59 PM

---

## Quick Start

### 1. Get Your API Key

1. Go to [Hunter.io](https://hunter.io/)
2. Sign up for a free account
3. Navigate to [API Settings](https://hunter.io/api)
4. Copy your API key

**Free Tier:** 50 requests/month  
**Paid Plans:** Available for higher volume

### 2. Configure the API Key

Choose one of these methods:

#### Option A: Environment Variable (Recommended)

```bash
export HUNTER_API_KEY="your-api-key-here"
```

Add to your `.bashrc`, `.zshrc`, or project `.env` file.

#### Option B: Direct Configuration

Edit `/mission-control/modules/email-verification-api.js`:

```javascript
const CONFIG = {
  API_KEY: 'your-api-key-here',  // Replace YOUR_HUNTER_API_KEY
  // ... rest of config
};
```

---

## Usage

### Verify a Single Email

```javascript
const { verifyEmail } = require('./modules/email-verification-api');

const result = await verifyEmail('eric@example.com');
console.log(result);
```

**Response:**
```json
{
  "email": "eric@example.com",
  "status": "valid",
  "result": "deliverable",
  "score": 95,
  "regexp": true,
  "gibberish": false,
  "disposable": false,
  "webmail": false,
  "mx_records": true,
  "smtp_server": true,
  "smtp_check": true,
  "accept_all": false,
  "block": false,
  "sources": []
}
```

### Batch Verification

```javascript
const { verifyBatch } = require('./modules/email-verification-api');

const emails = ['eric@example.com', 'john@company.com'];
const batchResult = await verifyBatch(emails, { concurrency: 3 });

console.log(batchResult.summary);
// { total: 2, valid: 1, invalid: 0, risky: 0, unknown: 1, cached: 0, fallback: 0 }
```

### Get Domain Information

```javascript
const { getDomainInfo } = require('./modules/email-verification-api');

const info = await getDomainInfo('stripe.com');
console.log(info.pattern);  // "{first}.{last}"
```

---

## API Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | The verified email address |
| `status` | string | `valid`, `invalid`, `accept_all`, `webmail`, `unknown` |
| `result` | string | `deliverable`, `undeliverable`, `risky`, `unknown` |
| `score` | number | Quality score (0-100), higher is better |
| `regexp` | boolean | Format is valid |
| `gibberish` | boolean | Random/gibberish email |
| `disposable` | boolean | Temporary/disposable email |
| `webmail` | boolean | Webmail provider (Gmail, Yahoo, etc.) |
| `mx_records` | boolean | Domain has MX records |
| `smtp_server` | boolean | SMTP server responds |
| `smtp_check` | boolean | Email exists on server |
| `accept_all` | boolean | Domain accepts all emails (catch-all) |
| `block` | boolean | Email is blocked |
| `sources` | array | Public sources where email was found |

---

## Features

### ✅ Caching

Results are cached for 24 hours to minimize API calls. Cache is stored in:
```
/mission-control/.cache/email-verification-cache.json
```

### ✅ Rate Limiting

The module tracks API usage against the 50 requests/month free tier limit.

```javascript
const { getStats } = require('./modules/email-verification-api');
console.log(getStats().rateLimit);
// { used: 10, remaining: 40, limit: 50, month: "2026-02" }
```

### ✅ Fallback Mode

When API limit is reached or API key is not configured, the module falls back to pattern-based verification with common email patterns.

---

## Testing

Run the examples:

```bash
cd /mission-control/modules
node email-verification-examples.js
```

Run specific example:

```javascript
const examples = require('./email-verification-examples');
examples.exampleBatchVerification();
```

---

## Error Handling

The module handles errors gracefully:

```javascript
try {
  const result = await verifyEmail('invalid-email');
  
  if (result._fallback) {
    console.warn('Using fallback mode - results may be less accurate');
  }
  
  if (result._cached) {
    console.log('Result from cache');
  }
} catch (error) {
  console.error('Verification failed:', error.message);
}
```

---

## File Structure

```
/mission-control/
├── modules/
│   ├── email-verification-api.js       # Main module
│   ├── email-verification-examples.js  # Usage examples
│   └── README-email-verification.md    # This file
└── .cache/
    ├── email-verification-cache.json   # Verification cache
    └── rate-limit.json                 # API usage tracking
```

---

## API Limits & Pricing

| Plan | Requests/Month | Price |
|------|---------------|-------|
| Free | 50 | $0 |
| Starter | 500 | $49 |
| Growth | 2,500 | $99 |
| Pro | 10,000 | $199 |
| Enterprise | Custom | Contact Sales |

[View full pricing](https://hunter.io/pricing)

---

## Troubleshooting

### "API key not configured"

Set your API key via environment variable or edit the config in the module file.

### "API limit reached"

Wait for the next month or upgrade your Hunter.io plan. The module will use fallback mode.

### Cache not persisting

Ensure the `/mission-control/.cache/` directory is writable:

```bash
mkdir -p /mission-control/.cache
chmod 755 /mission-control/.cache
```

---

## References

- [Hunter.io API Documentation](https://hunter.io/api/docs)
- [Email Verification Endpoint](https://hunter.io/api/docs#email-verifier)
- [Domain Search Endpoint](https://hunter.io/api/docs#domain-search)

---

## Support

For issues with this module, contact the Backend Developer Agent (Code).  
For Hunter.io API issues, contact [Hunter.io Support](https://hunter.io/support).
