# API Input Validation Documentation

## Overview

All API endpoints in Mission Control now implement comprehensive input validation to prevent injection attacks and ensure data integrity.

## Validation Module

**Location:** `/api/lib/validation.js`

The validation module provides:
- Parameter type checking (integer, string, enum, date)
- Pattern matching for allowed characters
- Length limits
- Range validation (min/max values)
- Injection attack detection (SQL, NoSQL, Command, XSS)
- Automatic sanitization of string inputs

## Validation Rules

### Common Parameters

| Parameter | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `limit` | integer | 1-1000, default: 50 | Number of results to return |
| `page` | integer | 1-10000, default: 1 | Page number for pagination |
| `offset` | integer | 0-100000, default: 0 | Offset for pagination |
| `status` | enum | pending, in_progress, completed, blocked, planned, active, idle, busy | Status filter |
| `priority` | enum | P0, P1, P2, P3, low, medium, high, critical | Priority filter |
| `agent` | string | Max 100 chars, pattern: `^[a-zA-Z0-9_-]+$` | Agent name/ID |
| `region` | string | Max 50 chars, pattern: `^[a-zA-Z0-9_\s-]+$` | Geographic region |
| `type` | enum | task_complete, task_active, system, audit, idle, error, warning, info | Log type filter |
| `from` | date | ISO 8601 format | Start date for range |
| `to` | date | ISO 8601 format | End date for range |
| `search` | string | Max 200 chars | Search query |
| `query` | string | Max 200 chars | Generic query |

## Protected Endpoints

### 1. /api/logs/activity

**Query Parameters:**
- `limit` (integer, 1-1000) - Number of logs to return
- `agent` (string) - Filter by agent name
- `type` (enum) - Filter by log type
- `from` (date) - Start date
- `to` (date) - End date

**Validation:**
- `limit` is parsed as integer with bounds checking
- `agent` is sanitized and checked for dangerous patterns
- Date parameters are validated as ISO 8601 dates

### 2. /api/agents

**Query Parameters:**
- `status` (enum) - Filter by agent status
- `limit` (integer, 1-1000) - Pagination limit
- `page` (integer, 1-10000) - Page number

**Validation:**
- All parameters are validated against allowed values
- String parameters are sanitized to prevent XSS

### 3. /api/tasks

**Query Parameters:**
- `status` (enum) - Filter by task status
- `priority` (enum) - Filter by priority (P0, P1, P2, P3)
- `agent` (string) - Filter by assigned agent
- `limit` (integer, 1-1000) - Results per page
- `page` (integer, 1-10000) - Page number

**Validation:**
- `priority` must be one of: P0, P1, P2, P3, low, medium, high, critical
- `agent` is sanitized and pattern-checked
- Pagination parameters have safe defaults and bounds

### 4. /api/health

**Query Parameters:**
- None (read-only endpoint)

**Validation:**
- Any provided query parameters are sanitized but not used

### 5. /api/stats

**Query Parameters:**
- `from` (date) - Start date for statistics
- `to` (date) - End date for statistics
- `type` (enum) - Statistics type

**Validation:**
- Date range parameters are validated as proper dates
- No dangerous patterns allowed in any parameter

### 6. /api/deployments

**Query Parameters:**
- `limit` (integer, 1-1000) - Number of deployments to return
- `status` (enum) - Filter by status (success, failed, pending)
- `from` (date) - Start date
- `to` (date) - End date

**Validation:**
- `limit` defaults to 50, max 1000
- Date parameters validated as ISO 8601

## Error Responses

All endpoints return standardized error responses for invalid input:

```json
{
  "success": false,
  "error": "Invalid query parameters",
  "details": [
    "Parameter 'limit' must be at most 1000",
    "Parameter 'agent' contains invalid characters"
  ],
  "timestamp": "2026-02-19T00:00:00.000Z"
}
```

**HTTP Status Codes:**
- `400 Bad Request` - Invalid parameters
- `200 OK` - Valid request (even if no results)

## Security Features

### Injection Prevention

The validation module detects and blocks:

1. **SQL Injection**
   - Single quotes, double dashes, hash symbols
   - UNION, SELECT, INSERT, UPDATE, DELETE, DROP statements
   - Malformed equality operators

2. **NoSQL Injection**
   - MongoDB operators ($where, $regex, $ne, $gt, etc.)

3. **Command Injection**
   - Semicolons, ampersands, pipes
   - Backticks, command substitution
   - Logical operators (||, &&)

4. **Path Traversal**
   - Double dots (../, ..\)
   - URL-encoded variants (%2e%2e%2f)

5. **XSS Prevention**
   - Script tags
   - JavaScript protocols
   - Event handlers (onload, onclick, etc.)
   - iframe, object, embed tags

### Input Sanitization

All string inputs are automatically sanitized:
- Null bytes removed
- HTML special characters encoded (<, >, &, ", ')
- Whitespace trimmed
- Length limits enforced

## Usage Example

```javascript
const { validateQuery, VALIDATION_RULES } = require('./lib/validation');

module.exports = (req, res) => {
  // Define endpoint-specific rules
  const rules = {
    limit: VALIDATION_RULES.limit,
    status: VALIDATION_RULES.status,
    agent: VALIDATION_RULES.agent
  };
  
  // Validate query parameters
  const result = validateQuery(req.query || {}, rules);
  
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: result.errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Use sanitized values
  const { limit, status, agent } = result.sanitized;
  
  // ... endpoint logic
};
```

## Testing

To test validation:

```bash
# Valid request
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?limit=10&priority=P0"

# Invalid - limit too high
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?limit=5000"
# Response: 400 Bad Request - "Parameter 'limit' must be at most 1000"

# Injection attempt (blocked)
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?agent='; DROP TABLE agents; --"
# Response: 400 Bad Request - "Parameter 'agent' contains potentially dangerous content"

# XSS attempt (sanitized)
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?search=<script>alert('xss')</script>"
# Response: 400 Bad Request - "Parameter 'search' contains potentially dangerous content"
```

## Implementation Status

| Endpoint | Validation | Sanitization | Error Handling |
|----------|------------|--------------|----------------|
| /api/logs/activity | ✅ | ✅ | ✅ |
| /api/agents | ✅ | ✅ | ✅ |
| /api/tasks | ✅ | ✅ | ✅ |
| /api/health | ✅ | ✅ | ✅ |
| /api/stats | ✅ | ✅ | ✅ |
| /api/deployments | ✅ | ✅ | ✅ |

## Changelog

- **2026-02-19** - Initial validation implementation
  - Added validation.js module
  - Secured all 6 API endpoints
  - Added comprehensive documentation
