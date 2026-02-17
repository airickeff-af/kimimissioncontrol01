/**
 * ═══════════════════════════════════════════════════════════════
 * MISSION CONTROL - THEME SYSTEM MODULE
 * Author: Forge-3 (Advanced UI Specialist)
 * Date: 2026-02-17
 * 
 * Features:
 * - Dark/Light mode toggle with persistence
 * - Multiple color scheme switching
 * - System preference detection
 * - Smooth theme transitions
 * ═══════════════════════════════════════════════════════════════
 */

const MC_Theme = {
    // Configuration
    config: {
        storageKey: 'mc-theme-preference',
        defaultTheme: 'dark',
        defaultScheme: 'cyberpunk',
        availableThemes: ['dark', 'light', 'high-contrast'],
        availableSchemes: ['cyberpunk', 'ocean', 'sunset', 'forest', 'aurora']
    },
    
    // Current state
    state: {
        theme: 'dark',
        scheme: 'cyberpunk',
        systemPreference: 'dark'
    },
    
    /**
     * Initialize the theme system
     */
    init() {
        // Detect system preference
        this.detectSystemPreference();
        
        // Load saved preferences
        this.loadPreferences();
        
        // Apply initial theme
        this.applyTheme();
        this.applyScheme();
        
        // Listen for system preference changes
        this.setupSystemListener();
        
        console.log('🎨 Theme system initialized:', this.state);
    },
    
    /**
     * Detect system color scheme preference
     */
    detectSystemPreference() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            this.state.systemPreference = mediaQuery.matches ? 'light' : 'dark';
        }
    },
    
    /**
     * Load preferences from localStorage
     */
    loadPreferences() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const preferences = JSON.parse(saved);
                this.state.theme = preferences.theme || this.config.defaultTheme;
                this.state.scheme = preferences.scheme || this.config.defaultScheme;
            }
        } catch (error) {
            console.warn('Failed to load theme preferences:', error);
        }
    },
    
    /**
     * Save preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify({
                theme: this.state.theme,
                scheme: this.state.scheme
            }));
        } catch (error) {
            console.warn('Failed to save theme preferences:', error);
        }
    },
    
    /**
     * Apply the current theme to the document
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Update toggle button if it exists
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.toggle('active', this.state.theme === 'light');
        }
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('mc:themechange', {
            detail: { theme: this.state.theme }
        }));
    },
    
    /**
     * Apply the current color scheme
     */
    applyScheme() {
        document.documentElement.setAttribute('data-scheme', this.state.scheme);
        
        // Update scheme selector if it exists
        document.querySelectorAll('.scheme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.scheme === this.state.scheme);
        });
        
        // Dispatch scheme change event
        window.dispatchEvent(new CustomEvent('mc:schemechange', {
            detail: { scheme: this.state.scheme }
        }));
    },
    
    /**
     * Toggle between dark and light themes
     */
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.savePreferences();
        
        // Log the change
        if (typeof MC_DASHBOARD !== 'undefined') {
            MC_DASHBOARD.addLog('THEME', 'INFO', `Switched to ${this.state.theme} mode`);
        }
    },
    
    /**
     * Set a specific theme
     */
    setTheme(theme) {
        if (!this.config.availableThemes.includes(theme)) {
            console.warn(`Unknown theme: ${theme}`);
            return;
        }
        
        this.state.theme = theme;
        this.applyTheme();
        this.savePreferences();
    },
    
    /**
     * Set a specific color scheme
     */
    setScheme(scheme) {
        if (!this.config.availableSchemes.includes(scheme)) {
            console.warn(`Unknown scheme: ${scheme}`);
            return;
        }
        
        this.state.scheme = scheme;
        this.applyScheme();
        this.savePreferences();
        
        // Log the change
        if (typeof MC_DASHBOARD !== 'undefined') {
            MC_DASHBOARD.addLog('THEME', 'INFO', `Color scheme changed to ${scheme}`);
        }
    },
    
    /**
     * Cycle through available color schemes
     */
    cycleScheme() {
        const schemes = this.config.availableSchemes;
        const currentIndex = schemes.indexOf(this.state.scheme);
        const nextIndex = (currentIndex + 1) % schemes.length;
        this.setScheme(schemes[nextIndex]);
    },
    
    /**
     * Use system preference
     */
    useSystemPreference() {
        this.state.theme = this.state.systemPreference;
        this.applyTheme();
        this.savePreferences();
    },
    
    /**
     * Setup listener for system preference changes
     */
    setupSystemListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                this.state.systemPreference = e.matches ? 'light' : 'dark';
                // Optionally auto-switch: this.useSystemPreference();
            });
        }
    },
    
    /**
     * Get current theme info
     */
    getInfo() {
        return {
            ...this.state,
            isDark: this.state.theme === 'dark',
            isLight: this.state.theme === 'light'
        };
    },
    
    /**
     * Reset to defaults
     */
    reset() {
        this.state.theme = this.config.defaultTheme;
        this.state.scheme = this.config.defaultScheme;
        this.applyTheme();
        this.applyScheme();
        this.savePreferences();
    },
    
    /**
     * Create theme toggle button HTML
     */
    createToggleButton() {
        const isLight = this.state.theme === 'light';
        return `
            <button class="theme-toggle ${isLight ? 'active' : ''}" 
                    onclick="MC_Theme.toggleTheme()"
                    title="Toggle ${isLight ? 'Dark' : 'Light'} Mode"
                    aria-label="Toggle theme">
                <div class="theme-toggle-slider">
                    <span class="theme-toggle-icon">${isLight ? '☀️' : '🌙'}</span>
                </div>
            </button>
        `;
    },
    
    /**
     * Create color scheme selector HTML
     */
    createSchemeSelector() {
        const schemes = this.config.availableSchemes.map(scheme => `
            <div class="scheme-option ${scheme === this.state.scheme ? 'active' : ''}"
                 data-scheme="${scheme}"
                 onclick="MC_Theme.setScheme('${scheme}')"
                 title="${scheme.charAt(0).toUpperCase() + scheme.slice(1)} Theme">
            </div>
        `).join('');
        
        return `<div class="scheme-selector">${schemes}</div>`;
    },
    
    /**
     * Create theme settings panel HTML
     */
    createSettingsPanel() {
        return `
            <div class="theme-settings">
                <h3 class="theme-settings-title">
                    <span>🎨</span>
                    Appearance
                </h3>
                
                <div class="theme-setting-row">
                    <div class="theme-setting-label">
                        <span class="theme-setting-name">Dark Mode</span>
                        <span class="theme-setting-desc">Toggle between light and dark themes</span>
                    </div>
                    ${this.createToggleButton()}
                </div>
                
                <div class="theme-setting-row">
                    <div class="theme-setting-label">
                        <span class="theme-setting-name">Color Scheme</span>
                        <span class="theme-setting-desc">Choose your accent colors</span>
                    </div>
                </div>
                
                <div style="padding-left: 16px;">
                    ${this.createSchemeSelector()}
                </div>
                
                <div class="theme-setting-row">
                    <div class="theme-setting-label">
                        <span class="theme-setting-name">System Preference</span>
                        <span class="theme-setting-desc">Use your device's theme setting</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="MC_Theme.useSystemPreference()">
                        Apply
                    </button>
                </div>
            </div>
        `;
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MC_Theme.init());
} else {
    MC_Theme.init();
}

// Expose globally
window.MC_Theme = MC_Theme;
