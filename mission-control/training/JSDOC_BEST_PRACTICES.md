# JSDoc Best Practices

**Target Agents:** Pixel, CodeMaster, Code Team  
**Purpose:** Complete guide to documentation standards  
**Standard:** All functions must have JSDoc comments

---

## Why JSDoc Matters

### For Your Teammates
- They can understand your code without reading implementation
- IDE autocomplete shows parameter types
- No more guessing what a function returns

### For Future You
- You'll forget why you wrote that code
- JSDoc reminds you of your own logic
- Makes refactoring safer

### For Quality Score
- Missing JSDoc: -3 points
- Incomplete JSDoc: -1 point
- **Good JSDoc: +2 bonus points**

---

## JSDoc Basics

### Minimum Required

Every function must have:

```javascript
/**
 * What the function does (one line)
 * @param {Type} name - Description
 * @returns {Type} Description
 */
```

### Complete Example

```javascript
/**
 * Calculates the total cost including tax
 * @param {number} subtotal - Price before tax
 * @param {number} [taxRate=0.08] - Tax rate as decimal (default 8%)
 * @returns {number} Total cost with tax applied
 * @throws {Error} When subtotal is negative
 * @example
 * // Basic usage
 * const total = calculateTotal(100);
 * console.log(total); // 108
 * 
 * // With custom tax rate
 * const total = calculateTotal(100, 0.1);
 * console.log(total); // 110
 */
function calculateTotal(subtotal, taxRate = 0.08) {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }
  return subtotal * (1 + taxRate);
}
```

---

## JSDoc Tags Reference

### @param - Function Parameters

```javascript
/**
 * @param {string} name - Required string parameter
 * @param {number} [age] - Optional number parameter
 * @param {boolean} [isActive=true] - Optional with default value
 * @param {Object} config - Configuration object
 * @param {string} config.apiKey - Nested property
 * @param {string[]} tags - Array of strings
 * @param {*} data - Any type
 */
```

### @returns - Return Value

```javascript
/**
 * @returns {string} The formatted name
 * @returns {Promise<Object>} Async return
 * @returns {string|null} May return null
 * @returns {void} No return value
 */
```

### @throws - Exceptions

```javascript
/**
 * @throws {Error} When input is invalid
 * @throws {TypeError} When parameter type is wrong
 * @throws {NotFoundError} When resource doesn't exist
 */
```

### @example - Usage Examples

```javascript
/**
 * @example
 * // Basic usage
 * const result = myFunction('input');
 * 
 * @example
 * // With options
 * const result = myFunction('input', { verbose: true });
 */
```

### Other Useful Tags

```javascript
/**
 * @async - Function is async
 * @deprecated - Function will be removed
 * @private - Not part of public API
 * @readonly - Property is read-only
 * @override - Overrides parent method
 * @see {@link otherFunction} - Related function
 * @since 1.2.0 - When it was added
 */
```

---

## Type Definitions

### Basic Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text | `"hello"` |
| `number` | Numeric | `42`, `3.14` |
| `boolean` | True/false | `true` |
| `Object` | Key-value pairs | `{ name: "John" }` |
| `Array` | List | `[1, 2, 3]` |
| `Function` | Callback | `() => {}` |
| `Promise<T>` | Async result | `Promise.resolve()` |
| `Date` | Date object | `new Date()` |
| `RegExp` | Regular expression | `/pattern/` |
| `Error` | Error object | `new Error()` |
| `null` | Null value | `null` |
| `undefined` | Undefined | `undefined` |
| `*` | Any type | - |

### Complex Types

```javascript
/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} email - Email address
 * @property {Date} createdAt - Account creation date
 * @property {boolean} [isActive] - Optional status flag
 */

/**
 * @param {User} user - The user to process
 */
function processUser(user) {
  // Implementation
}
```

### Union Types

```javascript
/**
 * @param {string|number} id - ID can be string or number
 * @param {Object|null} config - Config object or null
 * @returns {Promise<string|Error>} Result or error
 */
```

---

## Class Documentation

```javascript
/**
 * Represents an agent in the Mission Control system
 * @class
 * @classdesc Manages agent state, tasks, and communication
 */
class Agent {
  /**
   * Creates a new Agent instance
   * @param {Object} config - Agent configuration
   * @param {string} config.id - Unique agent identifier
   * @param {string} config.name - Agent display name
   * @param {string} [config.emoji] - Agent emoji identifier
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.emoji = config.emoji || '🤖';
  }

  /**
   * Assigns a task to the agent
   * @async
   * @param {Task} task - Task to assign
   * @returns {Promise<boolean>} True if assignment successful
   * @throws {Error} When agent is already at capacity
   */
  async assignTask(task) {
    // Implementation
  }
}
```

---

## Module Documentation

```javascript
/**
 * @fileoverview API utility functions for Mission Control
 * @module api/utils
 * @author Mission Control Team
 * @version 1.0.0
 */

/**
 * Makes authenticated API requests
 * @param {string} endpoint - API endpoint path
 * @param {Object} [options] - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.body] - Request body
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  // Implementation
}
```

---

## Common Patterns

### API Endpoint Handler

```javascript
/**
 * GET /api/agents
 * Returns list of all active agents
 * @async
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 * @example
 * // Response format
 * {
 *   "agents": [
 *     { "id": "nexus", "name": "Nexus", "status": "active" }
 *   ]
 * }
 */
export async function getAgentsHandler(req, res) {
  // Implementation
}
```

### React Component

```javascript
/**
 * Displays agent status card with avatar and metrics
 * @param {Object} props - Component props
 * @param {Agent} props.agent - Agent data object
 * @param {boolean} [props.compact=false] - Show compact version
 * @param {Function} [props.onClick] - Click handler
 * @returns {JSX.Element} Rendered component
 */
function AgentCard({ agent, compact = false, onClick }) {
  // Implementation
}
```

### Utility Function

```javascript
/**
 * Formats a date to relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.locale='en-US'] - Locale for formatting
 * @param {boolean} [options.includeSeconds=false] - Include seconds precision
 * @returns {string} Relative time string
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000));
 * // Returns: "1 hour ago"
 */
function formatRelativeTime(date, options = {}) {
  // Implementation
}
```

---

## JSDoc Checklist

Before submitting code, verify:

```
□ Every function has JSDoc block
□ All parameters have @param tags
□ Return type specified with @returns
□ Types are specific (not just {Object})
□ Optional parameters marked with []
□ Default values documented
□ At least one @example for complex functions
□ @throws for functions that can error
□ Classes have @class and @classdesc
□ Modules have @fileoverview
```

---

## IDE Configuration

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "javascript.validate.enable": true,
  "typescript.validate.enable": true,
  "editor.quickSuggestions": {
    "comments": "on",
    "strings": "on",
    "other": "on"
  }
}
```

### ESLint JSDoc Plugin

```bash
npm install --save-dev eslint-plugin-jsdoc
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsdoc'],
  rules: {
    'jsdoc/require-jsdoc': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-description': 'warn',
    'jsdoc/require-example': 'warn'
  }
};
```

---

## Quick Reference Card

```javascript
/**
 * Brief description
 * @param {Type} name - Description
 * @param {Type} [optional] - Optional param
 * @param {Type} [withDefault='value'] - With default
 * @returns {Type} Description
 * @throws {ErrorType} When/why
 * @example
 * // Usage example
 * functionCall('arg');
 */
```

---

**Questions?** Contact Training Agent  
**Related:** `/training/QUALITY_GATE_PREP.md`
