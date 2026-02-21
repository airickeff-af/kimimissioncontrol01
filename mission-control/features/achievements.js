/**
 * Achievement System - P1-033
 * Badge and achievement tracking for health-wealth goals
 */

const ACHIEVEMENTS = {
  // Streak Achievements
  streak_3: {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Check in 3 days in a row',
    icon: '🔥',
    category: 'consistency',
    requirement: { type: 'streak', value: 3 }
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'consistency',
    requirement: { type: 'streak', value: 7 }
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30 days of consistency',
    icon: '📅',
    category: 'consistency',
    requirement: { type: 'streak', value: 30 }
  },
  streak_100: {
    id: 'streak_100',
    name: 'Century Club',
    description: '100 day streak!',
    icon: '💯',
    category: 'consistency',
    requirement: { type: 'streak', value: 100 }
  },
  
  // Health Achievements
  health_check_7: {
    id: 'health_check_7',
    name: 'Health Conscious',
    description: '7 health check-ins',
    icon: '❤️',
    category: 'health',
    requirement: { type: 'health_checks', value: 7 }
  },
  health_check_30: {
    id: 'health_check_30',
    name: 'Health Hero',
    description: '30 health check-ins',
    icon: '💪',
    category: 'health',
    requirement: { type: 'health_checks', value: 30 }
  },
  exercise_100: {
    id: 'exercise_100',
    name: 'Century Sweat',
    description: '100 minutes of exercise',
    icon: '🏃',
    category: 'health',
    requirement: { type: 'exercise_minutes', value: 100 }
  },
  sleep_master: {
    id: 'sleep_master',
    name: 'Sleep Master',
    description: '7 days of 7+ hours sleep',
    icon: '😴',
    category: 'health',
    requirement: { type: 'sleep_streak', value: 7 }
  },
  
  // Wealth Achievements
  saver_50: {
    id: 'saver_50',
    name: 'Smart Saver',
    description: 'Save $50 total',
    icon: '💰',
    category: 'wealth',
    requirement: { type: 'savings', value: 50 }
  },
  saver_500: {
    id: 'saver_500',
    name: 'Century Saver',
    description: 'Save $500 total',
    icon: '💎',
    category: 'wealth',
    requirement: { type: 'savings', value: 500 }
  },
  budget_perfect: {
    id: 'budget_perfect',
    name: 'Budget Boss',
    description: 'Stay under budget for a week',
    icon: '📊',
    category: 'wealth',
    requirement: { type: 'budget_week', value: 1 }
  },
  investor: {
    id: 'investor',
    name: 'First Investment',
    description: 'Track your first investment',
    icon: '📈',
    category: 'wealth',
    requirement: { type: 'investments', value: 1 }
  },
  
  // Special Achievements
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Check in before 7 AM',
    icon: '🌅',
    category: 'special',
    requirement: { type: 'early_checkin', value: 1 }
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Check in after 10 PM',
    icon: '🦉',
    category: 'special',
    requirement: { type: 'late_checkin', value: 1 }
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Check in on Saturday and Sunday',
    icon: '🎯',
    category: 'special',
    requirement: { type: 'weekend_checkins', value: 2 }
  },
  comeback: {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Start a new streak after breaking one',
    icon: '🔄',
    category: 'special',
    requirement: { type: 'comeback', value: 1 }
  }
};

class AchievementSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'meemo_achievements';
    this.onUnlock = options.onUnlock || (() => {});
    
    this.unlocked = new Set();
    this.progress = {};
    this.stats = {
      totalUnlocked: 0,
      byCategory: {}
    };
  }

  /**
   * Initialize from storage
   */
  async initialize() {
    const data = await this.loadData();
    if (data) {
      this.unlocked = new Set(data.unlocked || []);
      this.progress = data.progress || {};
      this.stats = data.stats || { totalUnlocked: 0, byCategory: {} };
    }
    return this;
  }

  /**
   * Load data from storage
   */
  async loadData() {
    try {
      // Try API first
      const response = await fetch('/api/achievements');
      if (response.ok) return await response.json();
    } catch (e) {}
    
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save to storage
   */
  async saveData() {
    const data = {
      unlocked: Array.from(this.unlocked),
      progress: this.progress,
      stats: this.stats,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {}
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {}
  }

  /**
   * Check and unlock achievements
   */
  async checkAchievements(userStats) {
    const newlyUnlocked = [];
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (this.unlocked.has(id)) continue;
      
      const unlocked = this.checkRequirement(achievement.requirement, userStats);
      if (unlocked) {
        this.unlocked.add(id);
        newlyUnlocked.push(achievement);
        
        // Update stats
        this.stats.totalUnlocked++;
        this.stats.byCategory[achievement.category] = 
          (this.stats.byCategory[achievement.category] || 0) + 1;
        
        // Trigger callback
        this.onUnlock(achievement);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      await this.saveData();
    }
    
    return newlyUnlocked;
  }

  /**
   * Check if requirement is met
   */
  checkRequirement(req, stats) {
    switch (req.type) {
      case 'streak':
        return (stats.streak || 0) >= req.value;
      case 'health_checks':
        return (stats.healthChecks || 0) >= req.value;
      case 'exercise_minutes':
        return (stats.exerciseMinutes || 0) >= req.value;
      case 'savings':
        return (stats.totalSavings || 0) >= req.value;
      case 'investments':
        return (stats.investments || 0) >= req.value;
      case 'early_checkin':
        return stats.earlyCheckIn === true;
      case 'late_checkin':
        return stats.lateCheckIn === true;
      default:
        return false;
    }
  }

  /**
   * Get all achievements with unlock status
   */
  getAllAchievements() {
    return Object.values(ACHIEVEMENTS).map(a => ({
      ...a,
      unlocked: this.unlocked.has(a.id),
      unlockedAt: this.unlocked.has(a.id) ? this.progress[a.id]?.unlockedAt : null
    }));
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements() {
    return Array.from(this.unlocked).map(id => ({
      ...ACHIEVEMENTS[id],
      unlocked: true,
      unlockedAt: this.progress[id]?.unlockedAt
    }));
  }

  /**
   * Get achievements by category
   */
  getByCategory(category) {
    return Object.values(ACHIEVEMENTS)
      .filter(a => a.category === category)
      .map(a => ({
        ...a,
        unlocked: this.unlocked.has(a.id)
      }));
  }

  /**
   * Get progress stats
   */
  getStats() {
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = this.unlocked.size;
    
    return {
      total,
      unlocked,
      percentage: Math.round((unlocked / total) * 100),
      byCategory: this.stats.byCategory
    };
  }
}

/**
 * Achievement UI Component
 */
class AchievementUI {
  constructor(achievementSystem, options = {}) {
    this.system = achievementSystem;
    this.container = options.container || document.body;
  }

  /**
   * Create achievement display
   */
  createDisplay() {
    const display = document.createElement('div');
    display.className = 'achievements-panel';
    display.innerHTML = this.renderHTML();
    
    this.container.appendChild(display);
    this.element = display;
    
    return display;
  }

  /**
   * Render HTML
   */
  renderHTML() {
    const achievements = this.system.getAllAchievements();
    const stats = this.system.getStats();
    
    const categories = ['consistency', 'health', 'wealth', 'special'];
    
    return `
      <div class="achievements-header">
        <h2>🏆 Achievements</h2>
        <div class="achievements-stats">
          <span class="stats-unlocked">${stats.unlocked}/${stats.total}</span>
          <div class="stats-bar">
            <div class="stats-fill" style="width: ${stats.percentage}%"></div>
          </div>
        </div>
      </div>
      
      <div class="achievements-categories">
        ${categories.map(cat => {
          const catAchievements = achievements.filter(a => a.category === cat);
          const catUnlocked = catAchievements.filter(a => a.unlocked).length;
          
          return `
            <div class="achievement-category">
              <h3>${cat.charAt(0).toUpperCase() + cat.slice(1)} 
                <span>${catUnlocked}/${catAchievements.length}</span>
              </h3>
              <div class="achievement-grid">
                ${catAchievements.map(a => `
                  <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}"
                       title="${a.description}">
                    <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
                    <div class="achievement-name">${a.name}</div>
                    ${a.unlocked ? '<div class="achievement-check">✓</div>' : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Show unlock notification
   */
  showUnlockNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-unlock-notification';
    notification.innerHTML = `
      <div class="unlock-content">
        <div class="unlock-icon">${achievement.icon}</div>
        <div class="unlock-text">
          <div class="unlock-title">Achievement Unlocked!</div>
          <div class="unlock-name">${achievement.name}</div>
          <div class="unlock-desc">${achievement.description}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACHIEVEMENTS, AchievementSystem, AchievementUI };
}
