/**
 * Weekly Report Email System - P1-032
 * Automated weekly summary emails with stats and insights
 */

class WeeklyReportSystem {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/weekly-report';
    this.fromEmail = options.fromEmail || 'meemo@mission-control.app';
    this.templateId = options.templateId || 'weekly-summary';
  }

  /**
   * Generate weekly report data
   */
  async generateReport(userId, weekStart = null) {
    const startDate = weekStart || this.getWeekStart();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Fetch user data
    const [
      healthStats,
      wealthStats,
      achievements,
      streakData
    ] = await Promise.all([
      this.fetchHealthStats(userId, startDate, endDate),
      this.fetchWealthStats(userId, startDate, endDate),
      this.fetchAchievements(userId, startDate, endDate),
      this.fetchStreakData(userId)
    ]);
    
    return {
      userId,
      weekRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      summary: this.generateSummary(healthStats, wealthStats),
      health: healthStats,
      wealth: wealthStats,
      achievements: achievements,
      streak: streakData,
      insights: this.generateInsights(healthStats, wealthStats),
      nextWeekGoals: this.suggestGoals(healthStats, wealthStats)
    };
  }

  /**
   * Fetch health statistics
   */
  async fetchHealthStats(userId, startDate, endDate) {
    // Mock data - replace with actual API calls
    return {
      checkIns: 5,
      averageMood: 7.2,
      exerciseMinutes: 180,
      sleepAverage: 7.5,
      waterIntake: '2.1L avg',
      topActivity: 'Walking',
      improvement: '+12%'
    };
  }

  /**
   * Fetch wealth statistics
   */
  async fetchWealthStats(userId, startDate, endDate) {
    // Mock data - replace with actual API calls
    return {
      savingsAdded: 250,
      expensesTracked: 42,
      budgetAdherence: '87%',
      investmentsMonitored: 3,
      topCategory: 'Food & Dining',
      netWorthChange: '+1.2%',
      insight: 'You saved 15% more than last week!'
    };
  }

  /**
   * Fetch achievements earned
   */
  async fetchAchievements(userId, startDate, endDate) {
    // Mock data
    return [
      { id: 'streak_7', name: '7-Day Streak', icon: '🔥', earnedAt: new Date() },
      { id: 'saver_100', name: 'Century Saver', icon: '💰', earnedAt: new Date() },
      { id: 'health_check_5', name: 'Health Conscious', icon: '❤️', earnedAt: new Date() }
    ];
  }

  /**
   * Fetch streak data
   */
  async fetchStreakData(userId) {
    // Mock data
    return {
      current: 12,
      longest: 28,
      totalCheckIns: 156
    };
  }

  /**
   * Generate summary text
   */
  generateSummary(health, wealth) {
    const summaries = [];
    
    if (health.checkIns >= 5) {
      summaries.push('Fantastic week! You checked in daily and stayed on top of your health.');
    } else if (health.checkIns >= 3) {
      summaries.push('Good week! You maintained consistent health tracking.');
    } else {
      summaries.push('Let\'s aim for more check-ins next week!');
    }
    
    if (wealth.savingsAdded > 0) {
      summaries.push(`You added $${wealth.savingsAdded} to your savings. Keep it up!`);
    }
    
    return summaries.join(' ');
  }

  /**
   * Generate insights
   */
  generateInsights(health, wealth) {
    const insights = [];
    
    // Health insights
    if (health.averageMood >= 7) {
      insights.push({
        type: 'positive',
        category: 'Mental Health',
        message: 'Your mood has been consistently high. Great job maintaining positivity!'
      });
    }
    
    if (health.sleepAverage < 7) {
      insights.push({
        type: 'suggestion',
        category: 'Sleep',
        message: 'Try to get 7-8 hours of sleep for better recovery and focus.'
      });
    }
    
    // Wealth insights
    if (wealth.budgetAdherence >= 90) {
      insights.push({
        type: 'positive',
        category: 'Budgeting',
        message: 'Excellent budget discipline! You stayed within budget almost perfectly.'
      });
    }
    
    return insights;
  }

  /**
   * Suggest goals for next week
   */
  suggestGoals(health, wealth) {
    const goals = [];
    
    if (health.exerciseMinutes < 150) {
      goals.push({
        category: 'Health',
        goal: 'Exercise 30 minutes daily',
        target: 150,
        unit: 'minutes'
      });
    }
    
    if (wealth.savingsAdded < 100) {
      goals.push({
        category: 'Wealth',
        goal: 'Save $50 this week',
        target: 50,
        unit: 'dollars'
      });
    }
    
    goals.push({
      category: 'Consistency',
      goal: 'Check in every day',
      target: 7,
      unit: 'check-ins'
    });
    
    return goals;
  }

  /**
   * Send weekly report email
   */
  async sendReport(userId, email, report = null) {
    const reportData = report || await this.generateReport(userId);
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          template: this.templateId,
          data: reportData
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send report: ${response.status}`);
      }
      
      return {
        success: true,
        sentAt: new Date().toISOString(),
        weekRange: reportData.weekRange
      };
    } catch (error) {
      console.error('[WeeklyReport] Failed to send:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get start of current week (Monday)
   */
  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Schedule weekly report (for cron job)
   */
  static getScheduleConfig() {
    return {
      // Run every Sunday at 6 PM
      cron: '0 18 * * 0',
      timezone: 'Asia/Shanghai',
      description: 'Send weekly summary emails to all users'
    };
  }
}

/**
 * Email template for weekly report
 */
const weeklyReportTemplate = {
  subject: 'Your Weekly MEEMO Summary 🔥',
  
  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #1a1a2e; color: #f5e6c8; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px; background: #16213e; border-radius: 12px; }
        .streak { font-size: 48px; margin: 10px 0; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-card { background: #0f3460; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #00d4ff; }
        .stat-label { font-size: 14px; color: #a0a0a0; margin-top: 5px; }
        .achievements { margin: 20px 0; }
        .achievement { display: inline-block; margin: 5px; padding: 10px; background: #16213e; border-radius: 20px; }
        .insights { background: #0f3460; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .insight { margin: 10px 0; padding: 10px; border-left: 3px solid #00d4ff; }
        .goals { margin: 20px 0; }
        .goal { display: flex; align-items: center; margin: 10px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { display: inline-block; padding: 15px 30px; background: #e94560; color: white; text-decoration: none; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Weekly Summary</h1>
          <div class="streak">🔥 ${data.streak.current}</div>
          <p>Day Streak</p>
          <p>${data.weekRange.start} - ${data.weekRange.end}</p>
        </div>
        
        <p>${data.summary}</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${data.health.checkIns}</div>
            <div class="stat-label">Health Check-ins</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${data.wealth.savingsAdded}</div>
            <div class="stat-label">Saved This Week</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.health.averageMood}</div>
            <div class="stat-label">Avg Mood</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.wealth.budgetAdherence}</div>
            <div class="stat-label">Budget Score</div>
          </div>
        </div>
        
        <div class="achievements">
          <h3>🏆 Achievements Earned</h3>
          ${data.achievements.map(a => `
            <span class="achievement">${a.icon} ${a.name}</span>
          `).join('')}
        </div>
        
        <div class="insights">
          <h3>💡 Insights</h3>
          ${data.insights.map(i => `
            <div class="insight">
              <strong>${i.category}:</strong> ${i.message}
            </div>
          `).join('')}
        </div>
        
        <div class="goals">
          <h3>🎯 Goals for Next Week</h3>
          ${data.nextWeekGoals.map(g => `
            <div class="goal">
              <span>${g.category}: ${g.goal}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="cta">
          <a href="https://mission-control.app/dashboard">View Full Dashboard →</a>
        </div>
      </div>
    </body>
    </html>
  `
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WeeklyReportSystem, weeklyReportTemplate };
}
