/**
 * Data Calculation Accuracy Tests
 * 
 * Tests for data processing and calculation accuracy:
 * - Token usage calculations
 * - Task priority sorting
 * - File hash calculations
 * - Statistics aggregations
 * - Cost calculations
 */

const crypto = require('crypto');

describe('Data Calculation Accuracy', () => {
  
  describe('Token Usage Calculations', () => {
    const PRICING = {
      input: 0.0001,      // $0.10 per 1M tokens
      output: 0.0004,     // $0.40 per 1M tokens
      cacheRead: 0.000025,
      cacheWrite: 0.0001
    };

    it('should calculate token costs correctly', () => {
      const calculateCost = (tokensIn, tokensOut, cacheRead = 0, cacheWrite = 0) => {
        const inputCost = tokensIn * PRICING.input / 1000;
        const outputCost = tokensOut * PRICING.output / 1000;
        const cacheReadCost = cacheRead * PRICING.cacheRead / 1000;
        const cacheWriteCost = cacheWrite * PRICING.cacheWrite / 1000;
        return inputCost + outputCost + cacheReadCost + cacheWriteCost;
      };

      // Test: 1000 input + 500 output tokens
      const cost1 = calculateCost(1000, 500);
      expect(cost1).toBeCloseTo(0.0001 * 1 + 0.0004 * 0.5, 6);

      // Test: 10000 input + 5000 output tokens
      const cost2 = calculateCost(10000, 5000);
      expect(cost2).toBeCloseTo(0.0001 * 10 + 0.0004 * 5, 6);
    });

    it('should aggregate agent token usage correctly', () => {
      const sessions = [
        { agentName: 'Code', tokensIn: 1000, tokensOut: 500, cost: 0.3 },
        { agentName: 'Code', tokensIn: 2000, tokensOut: 1000, cost: 0.6 },
        { agentName: 'Scout', tokensIn: 500, tokensOut: 250, cost: 0.15 }
      ];

      const aggregateByAgent = (sessions) => {
        const agentMap = new Map();
        
        for (const session of sessions) {
          if (!agentMap.has(session.agentName)) {
            agentMap.set(session.agentName, {
              name: session.agentName,
              tokensIn: 0,
              tokensOut: 0,
              cost: 0,
              sessions: 0
            });
          }
          
          const agent = agentMap.get(session.agentName);
          agent.tokensIn += session.tokensIn;
          agent.tokensOut += session.tokensOut;
          agent.cost += session.cost;
          agent.sessions++;
        }
        
        return Array.from(agentMap.values());
      };

      const agents = aggregateByAgent(sessions);

      expect(agents.length).toBe(2);
      
      const codeAgent = agents.find(a => a.name === 'Code');
      expect(codeAgent.tokensIn).toBe(3000);
      expect(codeAgent.tokensOut).toBe(1500);
      expect(codeAgent.cost).toBeCloseTo(0.9, 2);
      expect(codeAgent.sessions).toBe(2);

      const scoutAgent = agents.find(a => a.name === 'Scout');
      expect(scoutAgent.tokensIn).toBe(500);
      expect(scoutAgent.sessions).toBe(1);
    });

    it('should calculate total usage correctly', () => {
      const agents = [
        { tokensIn: 3000, tokensOut: 1500, cost: 0.9 },
        { tokensIn: 500, tokensOut: 250, cost: 0.15 }
      ];

      const total = agents.reduce((acc, agent) => ({
        tokensIn: acc.tokensIn + agent.tokensIn,
        tokensOut: acc.tokensOut + agent.tokensOut,
        cost: acc.cost + agent.cost
      }), { tokensIn: 0, tokensOut: 0, cost: 0 });

      expect(total.tokensIn).toBe(3500);
      expect(total.tokensOut).toBe(1750);
      expect(total.cost).toBeCloseTo(1.05, 2);
    });

    it('should calculate daily usage trends', () => {
      const sessions = [
        { timestamp: '2026-02-18T10:00:00Z', totalTokens: 1000, cost: 0.1 },
        { timestamp: '2026-02-18T14:00:00Z', totalTokens: 2000, cost: 0.2 },
        { timestamp: '2026-02-17T10:00:00Z', totalTokens: 1500, cost: 0.15 }
      ];

      const getDailyUsage = (sessions) => {
        const dailyMap = new Map();
        
        for (const session of sessions) {
          const date = new Date(session.timestamp).toISOString().split('T')[0];
          
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { date, tokens: 0, cost: 0, sessions: 0 });
          }
          
          const day = dailyMap.get(date);
          day.tokens += session.totalTokens;
          day.cost += session.cost;
          day.sessions++;
        }
        
        return Array.from(dailyMap.values()).sort((a, b) => 
          a.date.localeCompare(b.date)
        );
      };

      const daily = getDailyUsage(sessions);

      expect(daily.length).toBe(2);
      expect(daily[0].date).toBe('2026-02-17');
      expect(daily[0].tokens).toBe(1500);
      expect(daily[1].date).toBe('2026-02-18');
      expect(daily[1].tokens).toBe(3000);
    });
  });

  describe('Task Priority Calculations', () => {
    it('should sort tasks by priority weight', () => {
      const tasks = [
        { id: 'T1', priority: 'P2', created: '2026-02-18T10:00:00Z' },
        { id: 'T2', priority: 'P0', created: '2026-02-18T11:00:00Z' },
        { id: 'T3', priority: 'P1', created: '2026-02-18T09:00:00Z' },
        { id: 'T4', priority: 'P3', created: '2026-02-18T08:00:00Z' }
      ];

      const priorityWeights = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };

      const sorted = [...tasks].sort((a, b) => {
        const priorityDiff = priorityWeights[a.priority] - priorityWeights[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.created) - new Date(b.created);
      });

      expect(sorted[0].priority).toBe('P0');
      expect(sorted[1].priority).toBe('P1');
      expect(sorted[2].priority).toBe('P2');
      expect(sorted[3].priority).toBe('P3');
    });

    it('should normalize priority strings correctly', () => {
      const normalizePriority = (priority) => {
        if (!priority) return 'P2';
        
        const normalized = priority.toUpperCase().trim();
        
        if (['P0', 'P1', 'P2', 'P3'].includes(normalized)) {
          return normalized;
        }
        
        const map = {
          'CRITICAL': 'P0',
          'URGENT': 'P0',
          'HIGH': 'P1',
          'MEDIUM': 'P2',
          'NORMAL': 'P2',
          'LOW': 'P3'
        };
        
        return map[normalized] || 'P2';
      };

      expect(normalizePriority('critical')).toBe('P0');
      expect(normalizePriority('URGENT')).toBe('P0');
      expect(normalizePriority('high')).toBe('P1');
      expect(normalizePriority('P2')).toBe('P2');
      expect(normalizePriority('low')).toBe('P3');
      expect(normalizePriority('unknown')).toBe('P2');
      expect(normalizePriority(null)).toBe('P2');
    });

    it('should calculate task statistics accurately', () => {
      const tasks = [
        { status: 'pending', priority: 'P0' },
        { status: 'in_progress', priority: 'P1' },
        { status: 'pending', priority: 'P2' },
        { status: 'completed', priority: 'P0' },
        { status: 'review', priority: 'P1' }
      ];

      const stats = {
        total: tasks.length,
        byStatus: {},
        byPriority: {}
      };

      for (const task of tasks) {
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      }

      expect(stats.total).toBe(5);
      expect(stats.byStatus.pending).toBe(2);
      expect(stats.byStatus.in_progress).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.byStatus.review).toBe(1);
      expect(stats.byPriority.P0).toBe(2);
      expect(stats.byPriority.P1).toBe(2);
      expect(stats.byPriority.P2).toBe(1);
    });

    it('should calculate subtask completion percentage', () => {
      const task = {
        subtasks: [
          { completed: true },
          { completed: true },
          { completed: false },
          { completed: false }
        ]
      };

      const completed = task.subtasks.filter(s => s.completed).length;
      const percentage = (completed / task.subtasks.length) * 100;

      expect(completed).toBe(2);
      expect(percentage).toBe(50);
    });
  });

  describe('File Hash Calculations', () => {
    it('should calculate MD5 hash consistently', () => {
      const content = 'test content';
      const hash1 = crypto.createHash('md5').update(content).digest('hex');
      const hash2 = crypto.createHash('md5').update(content).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(32); // MD5 hex is 32 chars
      expect(hash1).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should produce different hashes for different content', () => {
      const hash1 = crypto.createHash('md5').update('content1').digest('hex');
      const hash2 = crypto.createHash('md5').update('content2').digest('hex');

      expect(hash1).not.toBe(hash2);
    });

    it('should detect content changes via hash comparison', () => {
      let fileHash = crypto.createHash('md5').update('original').digest('hex');
      
      const hasChanged = (newContent) => {
        const newHash = crypto.createHash('md5').update(newContent).digest('hex');
        const changed = newHash !== fileHash;
        fileHash = newHash;
        return changed;
      };

      expect(hasChanged('original')).toBe(false);
      expect(hasChanged('modified')).toBe(true);
      expect(hasChanged('modified')).toBe(false);
    });
  });

  describe('Statistics Aggregations', () => {
    it('should calculate mean correctly', () => {
      const values = [10, 20, 30, 40, 50];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;

      expect(mean).toBe(30);
    });

    it('should calculate median correctly', () => {
      const median = (values) => {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      };

      expect(median([1, 2, 3, 4, 5])).toBe(3);
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it('should calculate percentiles correctly', () => {
      const percentile = (values, p) => {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
      };

      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      expect(percentile(values, 50)).toBe(50); // Median
      expect(percentile(values, 90)).toBe(90); // 90th percentile
      expect(percentile(values, 0)).toBe(10);  // Min
      expect(percentile(values, 100)).toBe(100); // Max
    });

    it('should calculate agent productivity metrics', () => {
      const agents = [
        { tasksCompleted: 50, tasksActive: 5, totalTokens: 10000 },
        { tasksCompleted: 30, tasksActive: 3, totalTokens: 5000 },
        { tasksCompleted: 70, tasksActive: 2, totalTokens: 15000 }
      ];

      const metrics = {
        totalCompleted: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
        totalActive: agents.reduce((sum, a) => sum + a.tasksActive, 0),
        avgTokensPerTask: agents.reduce((sum, a) => sum + a.totalTokens, 0) / 
                         agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
        mostProductive: agents.reduce((max, a) => 
          a.tasksCompleted > max.tasksCompleted ? a : max
        )
      };

      expect(metrics.totalCompleted).toBe(150);
      expect(metrics.totalActive).toBe(10);
      expect(metrics.avgTokensPerTask).toBeCloseTo(200, 0);
      expect(metrics.mostProductive.tasksCompleted).toBe(70);
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate cumulative costs over time', () => {
      const dailyCosts = [0.5, 0.75, 1.2, 0.9, 1.5];

      const cumulative = dailyCosts.reduce((acc, cost, i) => {
        acc.push((acc[i - 1] || 0) + cost);
        return acc;
      }, []);

      expect(cumulative).toEqual([0.5, 1.25, 2.45, 3.35, 4.85]);
    });

    it('should calculate cost per agent efficiently', () => {
      const sessions = [
        { agent: 'Code', cost: 0.5 },
        { agent: 'Scout', cost: 0.3 },
        { agent: 'Code', cost: 0.4 },
        { agent: 'Pixel', cost: 0.2 }
      ];

      const costPerAgent = sessions.reduce((acc, session) => {
        acc[session.agent] = (acc[session.agent] || 0) + session.cost;
        return acc;
      }, {});

      expect(costPerAgent['Code']).toBeCloseTo(0.9, 2);
      expect(costPerAgent['Scout']).toBeCloseTo(0.3, 2);
      expect(costPerAgent['Pixel']).toBeCloseTo(0.2, 2);
    });

    it('should format currency correctly', () => {
      const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 4
        }).format(value);
      };

      expect(formatCurrency(0.5)).toBe('$0.50');
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(0.1234)).toBe('$0.1234');
    });

    it('should calculate budget utilization', () => {
      const budget = 100;
      const spent = 65;
      
      const utilization = (spent / budget) * 100;
      const remaining = budget - spent;

      expect(utilization).toBe(65);
      expect(remaining).toBe(35);
    });
  });

  describe('Date/Time Calculations', () => {
    it('should calculate time differences correctly', () => {
      const now = new Date('2026-02-18T12:00:00Z');
      const past = new Date('2026-02-18T10:30:00Z');
      
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      expect(diffMins).toBe(90);
      expect(diffHours).toBe(1);
    });

    it('should determine if task is due soon', () => {
      const now = new Date('2026-02-18T12:00:00Z');
      
      const isDueSoon = (dueDate, hours = 24) => {
        const due = new Date(dueDate);
        const diffHours = (due - now) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= hours;
      };

      expect(isDueSoon('2026-02-18T20:00:00Z')).toBe(true);  // 8 hours
      expect(isDueSoon('2026-02-19T10:00:00Z')).toBe(true);  // 22 hours
      expect(isDueSoon('2026-02-19T14:00:00Z')).toBe(false); // 26 hours
      expect(isDueSoon('2026-02-17T10:00:00Z')).toBe(false); // Past
    });

    it('should group by date correctly', () => {
      const items = [
        { date: '2026-02-18T10:00:00Z', value: 1 },
        { date: '2026-02-18T14:00:00Z', value: 2 },
        { date: '2026-02-17T09:00:00Z', value: 3 }
      ];

      const grouped = items.reduce((acc, item) => {
        const date = item.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
      }, {});

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2026-02-18']).toHaveLength(2);
      expect(grouped['2026-02-17']).toHaveLength(1);
    });
  });
});
