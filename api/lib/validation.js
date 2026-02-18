/**
 * Input Validation Module for Mission Control API
 * Validates and sanitizes query parameters to prevent injection attacks
 */

// Validation rules for each parameter type
const VALIDATION_RULES = {
  // Pagination
  limit: {
    type: 'integer',
    min: 1,
    max: 1000,
    default: 50,
    description: 'Number of results to return (1-1000)'
  },
  page: {
    type: 'integer',
    min: 1,
    max: 10000,
    default: 1,
    description: 'Page number for pagination (1-10000)'
  },
  offset: {
    type: 'integer',
    min: 0,
    max: 100000,
    default: 0,
    description: 'Offset for pagination (0-100000)'
  },
  
  // Task filters
  status: {
    type: 'enum',
    allowed: ['pending', 'in_progress', 'completed', 'blocked', 'planned', 'active', 'idle', 'busy'],
    description: 'Task or agent status filter'
  },
  priority: {
    type: 'enum',
    allowed: ['P0', 'P1', 'P2', 'P3', 'low', 'medium', 'high', 'critical'],
    description: 'Task priority filter'
  },
  agent: {
    type: 'string',
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: 'Agent name or ID (alphanumeric, hyphens, underscores)'
  },
  
  // Deal/Lead filters
  region: {
    type: 'string',
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_\s-]+$/,
    description: 'Geographic region (alphanumeric, spaces, hyphens)'
  },
  
  // Log filters
  type: {
    type: 'enum',
    allowed: ['task_complete', 'task_active', 'system', 'audit', 'idle', 'error', 'warning', 'info'],
    description: 'Log entry type filter'
  },
  
  // Date filters
  from: {
    type: 'date',
    description: 'Start date for date range (ISO 8601 format)'
  },
  to: {
    type: 'date',
    description: 'End date for date range (ISO 8601 format)'
  },
  
  // Search
  search: {
    type: 'string',
    maxLength: 200,
    description: 'Search query string'
  },
  query: {
    type: 'string',
    maxLength: 200,
    description: 'Generic query string'
  }
};

// Dangerous patterns for injection detection
const DANGEROUS_PATTERNS = [
  // SQL injection
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec\s*\(/i,
  /execute\s*\(/i,
  /select\s+/i,
  /insert\s+/i,
  /update\s+/i,
  /delete\s+/i,
  /drop\s+/i,
  /union\s+/i,
  
  // NoSQL injection
  /\$where/i,
  /\$regex/i,
  /\$ne/i,
  /\$gt/i,
  /\$lt/i,
  /\$gte/i,
  /\$lte/i,
  /\$in/i,
  /\$nin/i,
  /\$exists/i,
  
  // Command injection
  /[;&|`]/,
  /\$\(/,
  /`.*`/,
  /\|\|/,
  /&&/,
  
  // Path traversal
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%252e%252e%252f/i,
  
  // XSS patterns
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i
];

/**
 * Check if value contains dangerous patterns
 * @param {string} value - Value to check
 * @returns {boolean} - True if dangerous patterns found
 */
function containsDangerousPatterns(value) {
  if (typeof value !== 'string') return false;
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Sanitize a string value
 * @param {string} value - Value to sanitize
 * @returns {string} - Sanitized value
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  
  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // HTML encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized;
}

/**
 * Validate a single parameter
 * @param {string} name - Parameter name
 * @param {*} value - Parameter value
 * @param {object} rule - Validation rule
 * @returns {object} - { valid: boolean, error?: string, sanitized?: any }
 */
function validateParam(name, value, rule) {
  if (!rule) {
    // Unknown parameter - allow but sanitize if string
    if (typeof value === 'string') {
      if (containsDangerousPatterns(value)) {
        return { valid: false, error: `Parameter '${name}' contains potentially dangerous content` };
      }
      return { valid: true, sanitized: sanitizeString(value) };
    }
    return { valid: true, sanitized: value };
  }
  
  // Handle undefined/null
  if (value === undefined || value === null) {
    if (rule.default !== undefined) {
      return { valid: true, sanitized: rule.default };
    }
    return { valid: true, sanitized: value };
  }
  
  // Check for dangerous patterns in string values
  if (typeof value === 'string' && containsDangerousPatterns(value)) {
    return { valid: false, error: `Parameter '${name}' contains potentially dangerous content` };
  }
  
  switch (rule.type) {
    case 'integer':
      const intVal = parseInt(value, 10);
      if (isNaN(intVal)) {
        return { valid: false, error: `Parameter '${name}' must be a valid integer` };
      }
      if (rule.min !== undefined && intVal < rule.min) {
        return { valid: false, error: `Parameter '${name}' must be at least ${rule.min}` };
      }
      if (rule.max !== undefined && intVal > rule.max) {
        return { valid: false, error: `Parameter '${name}' must be at most ${rule.max}` };
      }
      return { valid: true, sanitized: intVal };
      
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `Parameter '${name}' must be a string` };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { valid: false, error: `Parameter '${name}' exceeds maximum length of ${rule.maxLength}` };
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return { valid: false, error: `Parameter '${name}' contains invalid characters` };
      }
      return { valid: true, sanitized: sanitizeString(value) };
      
    case 'enum':
      if (!rule.allowed.includes(value)) {
        return { valid: false, error: `Parameter '${name}' must be one of: ${rule.allowed.join(', ')}` };
      }
      return { valid: true, sanitized: value };
      
    case 'date':
      const dateVal = new Date(value);
      if (isNaN(dateVal.getTime())) {
        return { valid: false, error: `Parameter '${name}' must be a valid date` };
      }
      return { valid: true, sanitized: dateVal.toISOString() };
      
    default:
      return { valid: true, sanitized: value };
  }
}

/**
 * Validate query parameters against defined rules
 * @param {object} query - Query object (req.query)
 * @param {object} rules - Validation rules for expected parameters
 * @returns {object} - { valid: boolean, errors?: string[], sanitized?: object }
 */
function validateQuery(query, rules = {}) {
  const errors = [];
  const sanitized = {};
  
  // Merge provided rules with default rules
  const allRules = { ...VALIDATION_RULES, ...rules };
  
  // Process all provided query parameters
  for (const [key, value] of Object.entries(query)) {
    const rule = allRules[key];
    const result = validateParam(key, value, rule);
    
    if (!result.valid) {
      errors.push(result.error);
    } else {
      sanitized[key] = result.sanitized;
    }
  }
  
  // Apply defaults for missing parameters that have default values
  for (const [key, rule] of Object.entries(allRules)) {
    if (sanitized[key] === undefined && rule.default !== undefined) {
      sanitized[key] = rule.default;
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true, sanitized };
}

/**
 * Create validation middleware for Express/Vercel
 * @param {object} rules - Validation rules
 * @returns {function} - Middleware function
 */
function createValidator(rules) {
  return function validateMiddleware(req, res, next) {
    const result = validateQuery(req.query || {}, rules);
    
    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Replace query with sanitized values
    req.query = result.sanitized;
    
    if (typeof next === 'function') {
      next();
    }
    
    return result;
  };
}

/**
 * Send validation error response
 * @param {object} res - Response object
 * @param {string[]} errors - Array of error messages
 */
function sendValidationError(res, errors) {
  res.status(400).json({
    success: false,
    error: 'Invalid query parameters',
    details: errors,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  VALIDATION_RULES,
  validateQuery,
  validateParam,
  createValidator,
  sendValidationError,
  sanitizeString,
  containsDangerousPatterns
};
