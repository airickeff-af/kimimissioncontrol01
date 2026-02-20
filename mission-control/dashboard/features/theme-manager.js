/**
 * Theme Manager - Dark/Light Mode Toggle - P1-035
 * Manages theme switching with persistence
 */

class ThemeManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'meemo_theme';
    this.defaultTheme = options.defaultTheme || 'dark';
    this.onChange = options.onChange || (() => {});
    
    this.currentTheme = this.defaultTheme;
    this.themes = {
      dark: {
        id: 'dark',
        name: 'Dark Mode',
        icon: '🌙',
        colors: {
          bgPrimary: '#1a1a2e',
          bgSecondary: '#16213e',
          bgCard: '#0f3460',
          textPrimary: '#f5e6c8',
          textSecondary: '#a0a0a0',
          accent: '#00d4ff',
          border: '#e94560'
        }
      },
      light: {
        id: 'light',
        name: 'Light Mode',
        icon: '☀️',
        colors: {
          bgPrimary: '#f5f5f5',
          bgSecondary: '#ffffff',
          bgCard: '#fafafa',
          textPrimary: '#1a1a2e',
          textSecondary: '#666666',
          accent: '#0066cc',
          border: '#e94560'
        }
      },
      auto: {
        id: 'auto',
        name: 'Auto (System)',
        icon: '🔄',
        colors: null // Uses system preference
      }
    };
  }

  /**
   * Initialize theme
   */
  async initialize() {
    const saved = await this.loadTheme();
    if (saved && this.themes[saved]) {
      this.currentTheme = saved;
    }
    
    this.applyTheme(this.currentTheme);
    
    // Listen for system changes if in auto mode
    if (this.currentTheme === 'auto') {
      this.setupSystemListener();
    }
    
    return this.currentTheme;
  }

  /**
   * Load saved theme
   */
  async loadTheme() {
    try {
      const response = await fetch('/api/preferences/theme');
      if (response.ok) {
        const data = await response.json();
        return data.theme;
      }
    } catch (e) {}
    
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      return null;
    }
  }

  /**
   * Save theme preference
   */
  async saveTheme(theme) {
    try {
      await fetch('/api/preferences/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
    } catch (e) {}
    
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (e) {}
  }

  /**
   * Apply theme to document
   */
  applyTheme(themeId) {
    const theme = this.themes[themeId];
    if (!theme) return;
    
    const root = document.documentElement;
    
    if (themeId === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyThemeColors(prefersDark ? this.themes.dark.colors : this.themes.light.colors);
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      this.applyThemeColors(theme.colors);
      root.setAttribute('data-theme', themeId);
    }
    
    this.currentTheme = themeId;
    this.onChange(themeId, theme);
  }

  /**
   * Apply color variables
   */
  applyThemeColors(colors) {
    if (!colors) return;
    
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-card', colors.bgCard);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--border', colors.border);
  }

  /**
   * Set up system preference listener
   */
  setupSystemListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applyThemeColors(e.matches ? this.themes.dark.colors : this.themes.light.colors);
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Toggle between dark and light
   */
  async toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Set specific theme
   */
  async setTheme(themeId) {
    if (!this.themes[themeId]) return;
    
    this.applyTheme(themeId);
    await this.saveTheme(themeId);
    
    if (themeId === 'auto') {
      this.setupSystemListener();
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return {
      id: this.currentTheme,
      ...this.themes[this.currentTheme]
    };
  }

  /**
   * Get all available themes
   */
  getThemes() {
    return Object.values(this.themes);
  }
}

/**
 * Theme Toggle UI Component
 */
class ThemeToggleUI {
  constructor(themeManager, options = {}) {
    this.manager = themeManager;
    this.container = options.container || document.body;
    this.position = options.position || 'header';
  }

  /**
   * Create toggle button
   */
  createToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle-btn';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = this.getIcon();
    
    toggle.addEventListener('click', () => this.handleClick());
    
    this.element = toggle;
    this.container.appendChild(toggle);
    
    return toggle;
  }

  /**
   * Create theme selector dropdown
   */
  createSelector() {
    const selector = document.createElement('div');
    selector.className = 'theme-selector';
    
    const current = this.manager.getCurrentTheme();
    
    selector.innerHTML = `
      <button class="theme-selector-trigger" onclick="themeUI.toggleDropdown()">
        <span class="theme-icon">${current.icon}</span>
        <span class="theme-name">${current.name}</span>
        <span class="theme-arrow">▼</span>
      </button>
      <div class="theme-dropdown">
        ${this.manager.getThemes().map(t => `
          <button class="theme-option ${t.id === current.id ? 'active' : ''}"
                  onclick="themeUI.selectTheme('${t.id}')">
            <span class="theme-icon">${t.icon}</span>
            <span class="theme-name">${t.name}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    this.container.appendChild(selector);
    this.selectorElement = selector;
    
    return selector;
  }

  /**
   * Handle toggle click
   */
  async handleClick() {
    const newTheme = await this.manager.toggle();
    this.updateIcon();
  }

  /**
   * Get current icon
   */
  getIcon() {
    const theme = this.manager.getCurrentTheme();
    return theme.icon || '🌙';
  }

  /**
   * Update button icon
   */
  updateIcon() {
    if (this.element) {
      this.element.innerHTML = this.getIcon();
    }
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown() {
    if (this.selectorElement) {
      this.selectorElement.classList.toggle('open');
    }
  }

  /**
   * Select theme from dropdown
   */
  async selectTheme(themeId) {
    await this.manager.setTheme(themeId);
    this.updateIcon();
    this.toggleDropdown();
    
    // Update active state in dropdown
    if (this.selectorElement) {
      this.selectorElement.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.onclick.toString().includes(themeId));
      });
    }
  }
}

// CSS for themes
const themeStyles = `
  :root {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-card: #0f3460;
    --text-primary: #f5e6c8;
    --text-secondary: #a0a0a0;
    --accent: #00d4ff;
    --border: #e94560;
  }
  
  [data-theme="light"] {
    --bg-primary: #f5f5f5;
    --bg-secondary: #ffffff;
    --bg-card: #fafafa;
    --text-primary: #1a1a2e;
    --text-secondary: #666666;
    --accent: #0066cc;
    --border: #e94560;
  }
  
  .theme-toggle-btn {
    background: transparent;
    border: 2px solid var(--border);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .theme-toggle-btn:hover {
    transform: scale(1.1);
    background: var(--bg-card);
  }
  
  .theme-selector {
    position: relative;
  }
  
  .theme-selector-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-card);
    border: 2px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.5rem;
  }
  
  .theme-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--bg-card);
    border: 2px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    display: none;
    min-width: 150px;
  }
  
  .theme-selector.open .theme-dropdown {
    display: block;
  }
  
  .theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.45rem;
    text-align: left;
  }
  
  .theme-option:hover,
  .theme-option.active {
    background: var(--bg-secondary);
  }
`;

// Inject styles
const styleEl = document.createElement('style');
styleEl.textContent = themeStyles;
document.head.appendChild(styleEl);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, ThemeToggleUI };
}
