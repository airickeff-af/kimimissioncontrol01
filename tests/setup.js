/**
 * Test Setup File
 * 
 * Global test configuration and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MC_API_PORT = '3002'; // Use different port for tests

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create mock request/response objects
   */
  createMockReq: (options = {}) => ({
    url: options.url || '/api/health',
    method: options.method || 'GET',
    headers: options.headers || {},
    ...options
  }),

  createMockRes: () => {
    const res = {
      statusCode: null,
      headers: {},
      data: null,
      setHeader: jest.fn((key, value) => { res.headers[key] = value; }),
      writeHead: jest.fn((code) => { res.statusCode = code; }),
      end: jest.fn((data) => { res.data = data; })
    };
    return res;
  },

  /**
   * Create a mock file system structure for testing
   */
  createMockFsStructure: () => ({
    agents: {
      code: {
        SOUL: `
# Code - Backend Lead

**Name:** Code
**Role:** Backend Lead
**Codename:** "The Architect"
**Division:** Engineering

**Specialties**
- API Development
- Database Design
- System Architecture
`,
        state: {
          status: 'online',
          lastActive: new Date().toISOString(),
          stats: { tasksCompleted: 42, tasksActive: 3 }
        }
      },
      scout: {
        SOUL: `
# Scout - Researcher

**Name:** Scout
**Role:** Researcher
**Codename:** "The Seeker"
**Division:** Intelligence

**Specialties**
- Market Research
- Competitive Analysis
- Lead Discovery
`,
        state: {
          status: 'working',
          lastActive: new Date().toISOString(),
          stats: { tasksCompleted: 28, tasksActive: 5 }
        }
      }
    },
    tasks: {
      queue: [],
      history: [],
      nextId: 1
    }
  })
};

// Silence console during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
