/**
 * Costume Manager - Core logic for Holiday Costume System
 * Handles costume application, AI generation, and state management
 */

class CostumeManager {
  constructor(options = {}) {
    this.currentHoliday = null;
    this.activeCostumes = new Map();
    this.aiCache = new Map();
    this.defaultCostumes = new Map();
    this.userBirthday = null;
    this.costumesEnabled = true;
    this.aiEnabled = options.aiEnabled !== false; // Default true
    this.aiProvider = options.aiProvider || 'replicate'; // or 'stability', 'openai'
    this.apiKey = options.apiKey || null;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Event callbacks
    this.onCostumeChange = options.onCostumeChange || (() => {});
    this.onHolidayChange = options.onHolidayChange || (() => {});
  }

  /**
   * Initialize the costume manager
   */
  async initialize() {
    await this.loadUserBirthday();
    await this.loadSavedCostumes();
    this.currentHoliday = this.detectHoliday();
    
    if (this.currentHoliday) {
      await this.loadCostumeAssets();
    }
    
    return this;
  }

  /**
   * Load user's birthday from storage
   */
  async loadUserBirthday() {
    try {
      const saved = localStorage.getItem('user_birthday');
      if (saved) {
        this.userBirthday = new Date(saved);
      }
    } catch (e) {
      console.warn('[CostumeManager] Could not load birthday:', e);
    }
  }

  /**
   * Save user's birthday
   */
  async saveUserBirthday(date) {
    this.userBirthday = new Date(date);
    try {
      localStorage.setItem('user_birthday', this.userBirthday.toISOString());
    } catch (e) {
      console.warn('[CostumeManager] Could not save birthday:', e);
    }
    // Recheck holidays
    this.currentHoliday = this.detectHoliday();
    if (this.currentHoliday) {
      await this.loadCostumeAssets();
    }
  }

  /**
   * Load saved custom costumes from storage
   */
  async loadSavedCostumes() {
    try {
      const saved = localStorage.getItem('custom_costumes');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [agentId, costume] of Object.entries(parsed)) {
          this.defaultCostumes.set(agentId, costume);
        }
      }
    } catch (e) {
      console.warn('[CostumeManager] Could not load saved costumes:', e);
    }
  }

  /**
   * Save custom costumes to storage
   */
  saveCostumes() {
    try {
      const obj = Object.fromEntries(this.defaultCostumes);
      localStorage.setItem('custom_costumes', JSON.stringify(obj));
    } catch (e) {
      console.warn('[CostumeManager] Could not save costumes:', e);
    }
  }

  /**
   * Detect which holiday is currently active
   */
  detectHoliday() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateStr = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Check fixed-date holidays
    for (const [key, holiday] of Object.entries(HOLIDAY_COSTUMES)) {
      if (holiday.date === dateStr) {
        return key;
      }
      if (holiday.date === 'variable' && this.isVariableHoliday(key, now)) {
        return key;
      }
      if (holiday.date === '11-4th-thu' && this.isThanksgiving(now)) {
        return key;
      }
    }
    
    // Check if it's Pride Month (June)
    if (month === 6) {
      return 'pride';
    }
    
    // Check user birthday
    if (this.userBirthday && this.isBirthdayToday(now)) {
      return 'birthday';
    }
    
    return null;
  }

  /**
   * Check if today is Thanksgiving (4th Thursday of November)
   */
  isThanksgiving(date) {
    if (date.getMonth() !== 10) return false; // November is month 10
    
    const year = date.getFullYear();
    const november = new Date(year, 10, 1);
    let thursdayCount = 0;
    
    for (let d = 1; d <= 30; d++) {
      const checkDate = new Date(year, 10, d);
      if (checkDate.getDay() === 4) { // Thursday
        thursdayCount++;
        if (thursdayCount === 4) {
          return date.getDate() === d;
        }
      }
    }
    return false;
  }

  /**
   * Check if today is the user's birthday
   */
  isBirthdayToday(now) {
    if (!this.userBirthday) return false;
    return now.getMonth() === this.userBirthday.getMonth() && 
           now.getDate() === this.userBirthday.getDate();
  }

  /**
   * Check variable holidays (Lunar New Year, Easter, Hanukkah, Diwali)
   */
  isVariableHoliday(holidayKey, date) {
    const year = date.getFullYear();
    
    // Simplified calculations - in production, use a proper lunar calendar library
    const variableDates = {
      'lunar_new_year': this.getLunarNewYear(year),
      'easter': this.getEaster(year),
      'hanukkah': this.getHanukkah(year),
      'diwali': this.getDiwali(year)
    };
    
    const holidayDate = variableDates[holidayKey];
    if (!holidayDate) return false;
    
    // Check if today is within the holiday period
    const start = holidayDate;
    const end = new Date(start);
    end.setDate(end.getDate() + (holidayKey === 'hanukkah' ? 8 : 1)); // Hanukkah is 8 days
    
    return date >= start && date < end;
  }

  /**
   * Get Lunar New Year date (simplified approximation)
   */
  getLunarNewYear(year) {
    // Approximate dates for 2025-2030
    const dates = {
      2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03'
    };
    const dateStr = dates[year] || '02-10';
    return new Date(`${year}-${dateStr}`);
  }

  /**
   * Get Easter date (Gauss algorithm)
   */
  getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  }

  /**
   * Get Hanukkah date (simplified - starts 25th of Kislev)
   */
  getHanukkah(year) {
    // Approximate Hebrew calendar conversion
    const dates = {
      2025: '12-14', 2026: '12-04', 2027: '12-24', 2028: '12-12', 2029: '12-01', 2030: '12-20'
    };
    const dateStr = dates[year] || '12-10';
    return new Date(`${year}-${dateStr}`);
  }

  /**
   * Get Diwali date (simplified - 15th day of Kartik)
   */
  getDiwali(year) {
    const dates = {
      2025: '10-21', 2026: '11-08', 2027: '10-29', 2028: '10-17', 2029: '11-05', 2030: '10-26'
    };
    const dateStr = dates[year] || '11-01';
    return new Date(`${year}-${dateStr}`);
  }

  /**
   * Load costume assets for current holiday
   */
  async loadCostumeAssets() {
    if (!this.currentHoliday || !this.costumesEnabled) return;
    
    const holiday = HOLIDAY_COSTUMES[this.currentHoliday];
    if (!holiday) return;

    // Pre-generate or load costumes for all agents
    for (const agent of AGENTS_DATA) {
      const costume = await this.applyCostume(agent.id, this.currentHoliday);
      if (costume) {
        this.activeCostumes.set(agent.id, costume);
      }
    }
    
    this.onHolidayChange(this.currentHoliday, holiday);
  }

  /**
   * Apply costume to a specific agent
   */
  async applyCostume(agentId, holidayKey = this.currentHoliday) {
    if (!holidayKey || !this.costumesEnabled) return null;
    
    const holiday = HOLIDAY_COSTUMES[holidayKey];
    if (!holiday) return null;
    
    // Get costume definition for this agent or use default
    const costumeDef = holiday.costumes[agentId] || holiday.costumes.default;
    if (!costumeDef) return null;

    // Check for AI-generated texture cache
    const cacheKey = `${agentId}_${holidayKey}`;
    if (this.aiEnabled && !this.aiCache.has(cacheKey)) {
      const cached = this.getCachedTexture(cacheKey);
      if (cached) {
        this.aiCache.set(cacheKey, cached);
      } else {
        const aiTexture = await this.generateAITexture(agentId, holiday);
        if (aiTexture) {
          this.aiCache.set(cacheKey, aiTexture);
          this.cacheTexture(cacheKey, aiTexture);
        }
      }
    }

    // Build costume object
    const costume = {
      ...costumeDef,
      holiday: holidayKey,
      holidayName: holiday.name,
      theme: holiday.theme
    };

    // Use AI texture if available, otherwise use sprites
    if (this.aiCache.has(cacheKey)) {
      costume.texture = this.aiCache.get(cacheKey);
      costume.source = 'ai';
    } else {
      costume.sprites = this.getSpritePaths(costumeDef);
      costume.source = 'sprite';
    }

    return costume;
  }

  /**
   * Get sprite paths for costume components
   */
  getSpritePaths(costumeDef) {
    const paths = {};
    const basePath = '/dashboard/costume-system/sprites/costumes/';
    
    if (costumeDef.head) paths.head = `${basePath}${costumeDef.head}.png`;
    if (costumeDef.body) paths.body = `${basePath}${costumeDef.body}.png`;
    if (costumeDef.accessory) paths.accessory = `${basePath}${costumeDef.accessory}.png`;
    if (costumeDef.effect) paths.effect = `/dashboard/costume-system/sprites/effects/${costumeDef.effect}.gif`;
    
    return paths;
  }

  /**
   * Generate AI texture for costume
   */
  async generateAITexture(agentId, holiday) {
    if (!this.aiEnabled) return null;
    
    try {
      const agent = AGENTS_DATA.find(a => a.id === agentId);
      if (!agent) return null;

      const prompt = `${holiday.aiPrompt}, ${agent.color} color scheme, character named ${agent.name}`;
      
      // Try to generate via API
      const textureUrl = await this.callAIGeneration(prompt, agentId, holiday.id);
      return textureUrl;
      
    } catch (error) {
      console.warn(`[CostumeManager] AI generation failed for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Call AI generation API
   */
  async callAIGeneration(prompt, agentId, holidayId) {
    // Check if we have a backend API
    try {
      const response = await fetch('/api/generate-costume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          agentId,
          holiday: holidayId,
          size: 32,
          negativePrompt: 'blurry, low quality, distorted, extra limbs'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.textureUrl;
      }
    } catch (e) {
      // Backend not available, try client-side generation if enabled
    }

    // Fallback: Generate colored placeholder with pattern
    return this.generatePlaceholderTexture(agentId, holidayId);
  }

  /**
   * Generate a placeholder texture (fallback when AI is unavailable)
   */
  generatePlaceholderTexture(agentId, holidayId) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const agent = AGENTS_DATA.find(a => a.id === agentId);
    const holiday = HOLIDAY_COSTUMES[holidayId];
    
    // Draw base with agent color
    ctx.fillStyle = agent ? agent.color : '#888';
    ctx.fillRect(0, 0, 32, 32);
    
    // Add holiday theme overlay
    if (holiday) {
      ctx.fillStyle = holiday.theme.primary + '40'; // 25% opacity
      ctx.fillRect(0, 0, 32, 32);
      
      // Draw simple pattern based on holiday
      ctx.fillStyle = holiday.theme.accent;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(i * 8, 0, 2, 32);
        ctx.fillRect(0, i * 8, 32, 2);
      }
    }
    
    return canvas.toDataURL();
  }

  /**
   * Cache texture in localStorage
   */
  cacheTexture(key, textureUrl) {
    try {
      const cache = JSON.parse(localStorage.getItem('costume_texture_cache') || '{}');
      cache[key] = {
        url: textureUrl,
        timestamp: Date.now()
      };
      localStorage.setItem('costume_texture_cache', JSON.stringify(cache));
    } catch (e) {
      console.warn('[CostumeManager] Could not cache texture:', e);
    }
  }

  /**
   * Get cached texture if not expired
   */
  getCachedTexture(key) {
    try {
      const cache = JSON.parse(localStorage.getItem('costume_texture_cache') || '{}');
      const entry = cache[key];
      if (entry && (Date.now() - entry.timestamp) < this.cacheExpiry) {
        return entry.url;
      }
    } catch (e) {
      console.warn('[CostumeManager] Could not retrieve cached texture:', e);
    }
    return null;
  }

  /**
   * Save default costume for an agent
   */
  saveDefaultCostume(agentId, costume) {
    this.defaultCostumes.set(agentId, costume);
    this.saveCostumes();
  }

  /**
   * Restore default costume for an agent
   */
  restoreDefaultCostume(agentId) {
    return this.defaultCostumes.get(agentId);
  }

  /**
   * Toggle costumes on/off
   */
  toggleCostumes(enabled) {
    this.costumesEnabled = enabled;
    
    if (!enabled) {
      this.activeCostumes.clear();
    } else {
      this.loadCostumeAssets();
    }
    
    this.onCostumeChange(enabled);
    return this.costumesEnabled;
  }

  /**
   * Force refresh all costumes
   */
  async refreshAllCostumes() {
    this.activeCostumes.clear();
    await this.loadCostumeAssets();
  }

  /**
   * Get costume for a specific agent
   */
  getCostume(agentId) {
    return this.activeCostumes.get(agentId);
  }

  /**
   * Check if agent has an active costume
   */
  hasCostume(agentId) {
    return this.activeCostumes.has(agentId) && this.costumesEnabled;
  }

  /**
   * Get current holiday info
   */
  getCurrentHoliday() {
    if (!this.currentHoliday) return null;
    return {
      id: this.currentHoliday,
      ...HOLIDAY_COSTUMES[this.currentHoliday]
    };
  }

  /**
   * Get all upcoming holidays
   */
  getUpcomingHolidays(count = 5) {
    const now = new Date();
    const holidays = [];
    
    for (const [key, holiday] of Object.entries(HOLIDAY_COSTUMES)) {
      if (holiday.date === 'user_defined') continue;
      
      let holidayDate;
      if (holiday.date === 'variable') {
        holidayDate = this.getVariableHolidayDate(key, now.getFullYear());
      } else if (holiday.date === '11-4th-thu') {
        // Find Thanksgiving for this year
        for (let d = 22; d <= 28; d++) {
          const check = new Date(now.getFullYear(), 10, d);
          if (check.getDay() === 4) {
            holidayDate = check;
            break;
          }
        }
      } else {
        const [month, day] = holiday.date.split('-');
        holidayDate = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day));
      }
      
      if (holidayDate && holidayDate > now) {
        holidays.push({
          id: key,
          ...holiday,
          nextDate: holidayDate
        });
      }
    }
    
    return holidays
      .sort((a, b) => a.nextDate - b.nextDate)
      .slice(0, count);
  }

  /**
   * Get date for variable holiday
   */
  getVariableHolidayDate(key, year) {
    switch (key) {
      case 'lunar_new_year': return this.getLunarNewYear(year);
      case 'easter': return this.getEaster(year);
      case 'hanukkah': return this.getHanukkah(year);
      case 'diwali': return this.getDiwali(year);
      default: return null;
    }
  }

  /**
   * Preview a holiday without changing current
   */
  async previewHoliday(holidayKey) {
    const holiday = HOLIDAY_COSTUMES[holidayKey];
    if (!holiday) return null;
    
    const previewCostumes = {};
    for (const agent of AGENTS_DATA.slice(0, 5)) { // Preview first 5 agents
      const costume = await this.applyCostume(agent.id, holidayKey);
      if (costume) {
        previewCostumes[agent.id] = costume;
      }
    }
    
    return {
      holiday,
      costumes: previewCostumes
    };
  }

  /**
   * Export costume data for backup
   */
  exportCostumes() {
    return {
      userBirthday: this.userBirthday?.toISOString(),
      customCostumes: Object.fromEntries(this.defaultCostumes),
      version: '1.0'
    };
  }

  /**
   * Import costume data from backup
   */
  importCostumes(data) {
    if (data.userBirthday) {
      this.userBirthday = new Date(data.userBirthday);
    }
    if (data.customCostumes) {
      for (const [agentId, costume] of Object.entries(data.customCostumes)) {
        this.defaultCostumes.set(agentId, costume);
      }
      this.saveCostumes();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CostumeManager };
}
