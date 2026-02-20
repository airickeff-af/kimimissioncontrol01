/**
 * Daily Streak Counter - P1-031
 * Tracks consecutive daily check-ins with visual indicator
 */

class StreakCounter {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'meemo_daily_streak';
    this.onStreakUpdate = options.onStreakUpdate || (() => {});
    this.onMilestone = options.onMilestone || (() => {});
    
    this.streak = 0;
    this.lastCheckIn = null;
    this.longestStreak = 0;
    this.totalCheckIns = 0;
    
    this.milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  }

  /**
   * Initialize streak data from storage
   */
  async initialize() {
    const data = await this.loadData();
    if (data) {
      this.streak = data.streak || 0;
      this.lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn) : null;
      this.longestStreak = data.longestStreak || 0;
      this.totalCheckIns = data.totalCheckIns || 0;
      
      // Validate streak (check if broken)
      this.validateStreak();
    }
    
    return this.getStatus();
  }

  /**
   * Load data from localStorage or API
   */
  async loadData() {
    // Try API first (if authenticated)
    try {
      const response = await fetch('/api/streak');
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Fallback to localStorage
    }
    
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save data to storage
   */
  async saveData() {
    const data = {
      streak: this.streak,
      lastCheckIn: this.lastCheckIn?.toISOString(),
      longestStreak: this.longestStreak,
      totalCheckIns: this.totalCheckIns,
      updatedAt: new Date().toISOString()
    };
    
    // Try API first
    try {
      await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      // Fallback to localStorage
    }
    
    // Always save to localStorage as backup
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[StreakCounter] Could not save to localStorage');
    }
  }

  /**
   * Check if user has checked in today
   */
  hasCheckedInToday() {
    if (!this.lastCheckIn) return false;
    
    const now = new Date();
    const last = new Date(this.lastCheckIn);
    
    return now.getDate() === last.getDate() &&
           now.getMonth() === last.getMonth() &&
           now.getFullYear() === last.getFullYear();
  }

  /**
   * Validate and update streak status
   */
  validateStreak() {
    if (!this.lastCheckIn) return;
    
    const now = new Date();
    const last = new Date(this.lastCheckIn);
    
    // Reset time to midnight for comparison
    now.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      // Streak broken
      this.streak = 0;
      this.saveData();
    }
  }

  /**
   * Perform daily check-in
   */
  async checkIn() {
    if (this.hasCheckedInToday()) {
      return {
        success: false,
        message: 'Already checked in today',
        streak: this.streak
      };
    }
    
    const now = new Date();
    const last = this.lastCheckIn ? new Date(this.lastCheckIn) : null;
    
    if (last) {
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        this.streak++;
      } else if (diffDays > 1) {
        // Streak broken, start new
        this.streak = 1;
      }
    } else {
      // First check-in
      this.streak = 1;
    }
    
    this.lastCheckIn = now;
    this.totalCheckIns++;
    
    if (this.streak > this.longestStreak) {
      this.longestStreak = this.streak;
    }
    
    await this.saveData();
    
    // Check for milestone
    const milestone = this.milestones.find(m => m === this.streak);
    if (milestone) {
      this.onMilestone(milestone, this.streak);
    }
    
    this.onStreakUpdate(this.streak);
    
    return {
      success: true,
      streak: this.streak,
      totalCheckIns: this.totalCheckIns,
      longestStreak: this.longestStreak,
      milestone: milestone || null
    };
  }

  /**
   * Get current streak status
   */
  getStatus() {
    return {
      streak: this.streak,
      longestStreak: this.longestStreak,
      totalCheckIns: this.totalCheckIns,
      lastCheckIn: this.lastCheckIn,
      checkedInToday: this.hasCheckedInToday(),
      nextMilestone: this.getNextMilestone()
    };
  }

  /**
   * Get next milestone
   */
  getNextMilestone() {
    return this.milestones.find(m => m > this.streak) || null;
  }

  /**
   * Get streak history (for charts)
   */
  async getHistory(days = 30) {
    // This would typically come from an API
    // For now, generate mock data based on current streak
    const history = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simplified: assume checked in if within current streak
      const checkedIn = i < this.streak;
      
      history.push({
        date: date.toISOString().split('T')[0],
        checkedIn,
        streak: checkedIn ? Math.max(0, this.streak - i) : 0
      });
    }
    
    return history;
  }

  /**
   * Reset streak (for testing)
   */
  async reset() {
    this.streak = 0;
    this.lastCheckIn = null;
    await this.saveData();
  }
}

/**
 * Streak UI Component
 */
class StreakUI {
  constructor(streakCounter, options = {}) {
    this.counter = streakCounter;
    this.container = options.container || document.body;
    this.position = options.position || 'top-right';
  }

  /**
   * Create streak display
   */
  createDisplay() {
    const display = document.createElement('div');
    display.className = `streak-display streak-${this.position}`;
    display.innerHTML = this.renderHTML();
    
    this.container.appendChild(display);
    this.element = display;
    
    this.updateDisplay();
    
    return display;
  }

  /**
   * Render HTML
   */
  renderHTML() {
    return `
      <div class="streak-card">
        <div class="streak-flame">🔥</div>
        <div class="streak-info">
          <div class="streak-count">0</div>
          <div class="streak-label">Day Streak</div>
        </div>
        <button class="streak-checkin-btn" onclick="streakUI.checkIn()">
          Check In
        </button>
      </div>
      <div class="streak-progress"></div>
    `;
  }

  /**
   * Update display with current streak
   */
  updateDisplay() {
    if (!this.element) return;
    
    const status = this.counter.getStatus();
    const countEl = this.element.querySelector('.streak-count');
    const btnEl = this.element.querySelector('.streak-checkin-btn');
    const progressEl = this.element.querySelector('.streak-progress');
    
    if (countEl) {
      countEl.textContent = status.streak;
    }
    
    if (btnEl) {
      if (status.checkedInToday) {
        btnEl.textContent = '✓ Checked In';
        btnEl.disabled = true;
        btnEl.classList.add('checked-in');
      } else {
        btnEl.textContent = 'Check In';
        btnEl.disabled = false;
        btnEl.classList.remove('checked-in');
      }
    }
    
    // Update progress to next milestone
    if (progressEl && status.nextMilestone) {
      const progress = (status.streak / status.nextMilestone) * 100;
      progressEl.style.width = `${progress}%`;
      progressEl.setAttribute('data-next', `${status.nextMilestone} days`);
    }
  }

  /**
   * Handle check-in
   */
  async checkIn() {
    const result = await this.counter.checkIn();
    
    if (result.success) {
      this.updateDisplay();
      this.showCheckInAnimation();
      
      if (result.milestone) {
        this.showMilestoneCelebration(result.milestone);
      }
    }
  }

  /**
   * Show check-in animation
   */
  showCheckInAnimation() {
    const flame = this.element.querySelector('.streak-flame');
    if (flame) {
      flame.classList.add('animate');
      setTimeout(() => flame.classList.remove('animate'), 1000);
    }
  }

  /**
   * Show milestone celebration
   */
  showMilestoneCelebration(milestone) {
    const celebration = document.createElement('div');
    celebration.className = 'streak-milestone';
    celebration.innerHTML = `
      <div class="milestone-content">
        <div class="milestone-icon">🏆</div>
        <div class="milestone-text">
          <h3>${milestone} Day Streak!</h3>
          <p>Incredible dedication! 🔥</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(celebration);
    
    setTimeout(() => celebration.classList.add('show'), 10);
    setTimeout(() => {
      celebration.classList.remove('show');
      setTimeout(() => celebration.remove(), 500);
    }, 4000);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StreakCounter, StreakUI };
}
