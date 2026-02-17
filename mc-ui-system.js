/**
 * ═══════════════════════════════════════════════════════════════
 * MISSION CONTROL THEME SYSTEM - JavaScript Module
 * Version: 1.0.0
 * Author: Forge (UX Developer)
 * Date: 2026-02-17
 * 
 * Features:
 * - Theme switching (dark/light)
 * - System preference detection
 * - Persistent storage
 * - Smooth transitions
 * ═══════════════════════════════════════════════════════════════
 */

class MCThemeManager {
  constructor(options = {}) {
    this.options = {
      storageKey: 'mc-theme',
      attributeName: 'data-theme',
      transitionClass: 'mc-theme-transition',
      defaultTheme: 'dark',
      ...options
    };
    
    this.currentTheme = this.options.defaultTheme;
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    this.init();
  }
  
  init() {
    this.loadTheme();
    this.setupListeners();
    this.applyTheme(this.currentTheme, false);
  }
  
  /**
   * Load theme from storage or detect system preference
   */
  loadTheme() {
    const stored = localStorage.getItem(this.options.storageKey);
    
    if (stored) {
      this.currentTheme = stored;
    } else if (this.mediaQuery.matches) {
      this.currentTheme = 'light';
    }
  }
  
  /**
   * Setup event listeners
   */
  setupListeners() {
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(this.options.storageKey)) {
        this.setTheme(e.matches ? 'light' : 'dark');
      }
    });
  }
  
  /**
   * Apply theme to document
   */
  applyTheme(theme, animate = true) {
    const root = document.documentElement;
    
    if (animate) {
      // Add transition class for smooth color change
      document.body.classList.add(this.options.transitionClass);
      
      // Remove after transition completes
      setTimeout(() => {
        document.body.classList.remove(this.options.transitionClass);
      }, 350);
    }
    
    root.setAttribute(this.options.attributeName, theme);
    this.currentTheme = theme;
    
    // Dispatch custom event
    this.dispatchEvent('themeChange', { theme });
  }
  
  /**
   * Set theme and save to storage
   */
  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') {
      console.warn(`Invalid theme: ${theme}. Using 'dark'.`);
      theme = 'dark';
    }
    
    this.applyTheme(theme, true);
    localStorage.setItem(this.options.storageKey, theme);
  }
  
  /**
   * Toggle between dark and light
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }
  
  /**
   * Check if dark mode is active
   */
  isDark() {
    return this.currentTheme === 'dark';
  }
  
  /**
   * Reset to system preference
   */
  resetToSystem() {
    localStorage.removeItem(this.options.storageKey);
    const systemTheme = this.mediaQuery.matches ? 'light' : 'dark';
    this.applyTheme(systemTheme, true);
  }
  
  /**
   * Dispatch custom event
   */
  dispatchEvent(name, detail) {
    const event = new CustomEvent(`mc:${name}`, { detail });
    document.dispatchEvent(event);
  }
  
  /**
   * Listen for theme changes
   */
  onChange(callback) {
    document.addEventListener('mc:themeChange', (e) => callback(e.detail.theme));
  }
}

// ═══════════════════════════════════════════════════════════════
// ANIMATION SYSTEM - JavaScript Module
// ═══════════════════════════════════════════════════════════════

class MCAnimationManager {
  constructor(options = {}) {
    this.options = {
      observerThreshold: 0.1,
      observerRootMargin: '0px 0px -50px 0px',
      ...options
    };
    
    this.observer = null;
    this.init();
  }
  
  init() {
    this.initScrollObserver();
    this.initStaggerAnimations();
  }
  
  /**
   * Initialize Intersection Observer for scroll animations
   */
  initScrollObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements
      document.querySelectorAll('.mc-scroll-reveal, .mc-scroll-reveal-left, .mc-scroll-reveal-right, .mc-scroll-reveal-scale')
        .forEach(el => el.classList.add('mc-visible'));
      return;
    }
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('mc-visible');
          
          // Optionally unobserve after animation
          if (entry.target.dataset.animateOnce !== 'false') {
            this.observer.unobserve(entry.target);
          }
        } else if (entry.target.dataset.animateOnce === 'false') {
          entry.target.classList.remove('mc-visible');
        }
      });
    }, {
      threshold: this.options.observerThreshold,
      rootMargin: this.options.observerRootMargin
    });
    
    // Observe all scroll-reveal elements
    document.querySelectorAll('.mc-scroll-reveal, .mc-scroll-reveal-left, .mc-scroll-reveal-right, .mc-scroll-reveal-scale')
      .forEach(el => this.observer.observe(el));
  }
  
  /**
   * Initialize stagger animations for lists
   */
  initStaggerAnimations() {
    const staggerContainers = document.querySelectorAll('.mc-stagger-auto');
    
    staggerContainers.forEach(container => {
      const children = container.children;
      const baseDelay = parseInt(container.dataset.staggerDelay) || 50;
      
      Array.from(children).forEach((child, index) => {
        child.style.animationDelay = `${index * baseDelay}ms`;
      });
    });
  }
  
  /**
   * Animate a number counting up
   */
  animateNumber(element, target, options = {}) {
    const config = {
      duration: 1000,
      easing: 'easeOut',
      suffix: '',
      prefix: '',
      ...options
    };
    
    const start = parseInt(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const range = target - start;
    const startTime = performance.now();
    
    const easings = {
      linear: t => t,
      easeOut: t => 1 - Math.pow(1 - t, 3),
      easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      bounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    };
    
    const ease = easings[config.easing] || easings.easeOut;
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / config.duration, 1);
      const easedProgress = ease(progress);
      const current = Math.round(start + range * easedProgress);
      
      element.textContent = `${config.prefix}${current.toLocaleString()}${config.suffix}`;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }
  
  /**
   * Trigger a CSS animation on an element
   */
  trigger(element, animationClass, options = {}) {
    const config = {
      duration: null,
      onComplete: null,
      ...options
    };
    
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (!element) return;
    
    // Remove any existing animation classes
    element.classList.remove(animationClass);
    
    // Force reflow
    void element.offsetWidth;
    
    // Add animation class
    element.classList.add(animationClass);
    
    // Handle completion
    const duration = config.duration || this.getAnimationDuration(element);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
      if (config.onComplete) config.onComplete();
    }, duration);
  }
  
  /**
   * Get CSS animation duration
   */
  getAnimationDuration(element) {
    const styles = window.getComputedStyle(element);
    const duration = styles.animationDuration || styles.transitionDuration;
    return parseFloat(duration) * (duration.includes('ms') ? 1 : 1000);
  }
  
  /**
   * Parallax effect for elements
   */
  parallax(selector, speed = 0.5) {
    const elements = document.querySelectorAll(selector);
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const offset = (scrollY - elementTop) * speed;
        
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }
}

// ═══════════════════════════════════════════════════════════════
// MOBILE RESPONSIVE SYSTEM - JavaScript Module
// ═══════════════════════════════════════════════════════════════

class MCMobileManager {
  constructor(options = {}) {
    this.options = {
      sidebarSelector: '.mc-sidebar',
      mobileBreakpoint: 1024,
      bottomSheetBreakpoint: 480,
      ...options
    };
    
    this.sidebar = null;
    this.overlay = null;
    this.isMobile = false;
    this.touchStartY = 0;
    
    this.init();
  }
  
  init() {
    this.sidebar = document.querySelector(this.options.sidebarSelector);
    this.createOverlay();
    this.checkMobile();
    this.setupListeners();
    this.setupTouchGestures();
  }
  
  /**
   * Create overlay element if it doesn't exist
   */
  createOverlay() {
    this.overlay = document.querySelector('.mc-sidebar-overlay');
    
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'mc-sidebar-overlay';
      document.body.appendChild(this.overlay);
    }
    
    this.overlay.addEventListener('click', () => this.closeSidebar());
  }
  
  /**
   * Setup event listeners
   */
  setupListeners() {
    // Window resize
    window.addEventListener('resize', this.debounce(() => {
      this.checkMobile();
    }, 250));
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
    
    // Handle mobile bottom sheet on very small screens
    this.handleBottomSheet();
  }
  
  /**
   * Check if we're on mobile
   */
  checkMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < this.options.mobileBreakpoint;
    
    if (wasMobile !== this.isMobile) {
      this.dispatchEvent('mobileChange', { isMobile: this.isMobile });
    }
  }
  
  /**
   * Open sidebar (mobile)
   */
  openSidebar() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.add('mc-mobile-open');
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    this.dispatchEvent('sidebarOpen', {});
  }
  
  /**
   * Close sidebar (mobile)
   */
  closeSidebar() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.remove('mc-mobile-open');
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    this.dispatchEvent('sidebarClose', {});
  }
  
  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    if (this.sidebar?.classList.contains('mc-mobile-open')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }
  
  /**
   * Setup touch gestures for mobile
   */
  setupTouchGestures() {
    if (!this.sidebar) return;
    
    // Swipe to close sidebar
    this.sidebar.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    this.sidebar.addEventListener('touchmove', (e) => {
      if (!this.touchStartX) return;
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - this.touchStartX;
      const deltaY = touchY - this.touchStartY;
      
      // Check if horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -50) {
        this.closeSidebar();
        this.touchStartX = null;
      }
    }, { passive: true });
    
    // Edge swipe to open
    document.addEventListener('touchstart', (e) => {
      if (!this.isMobile) return;
      
      const touchX = e.touches[0].clientX;
      if (touchX < 20) {
        this.touchStartX = touchX;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!this.touchStartX) return;
      
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - this.touchStartX;
      
      if (deltaX > 50) {
        this.openSidebar();
        this.touchStartX = null;
      }
    }, { passive: true });
  }
  
  /**
   * Handle bottom sheet on very small screens
   */
  handleBottomSheet() {
    if (window.innerWidth <= this.options.bottomSheetBreakpoint) {
      this.sidebar?.classList.add('mc-bottom-sheet');
    } else {
      this.sidebar?.classList.remove('mc-bottom-sheet');
    }
  }
  
  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Dispatch custom event
   */
  dispatchEvent(name, detail) {
    const event = new CustomEvent(`mc:${name}`, { detail });
    document.dispatchEvent(event);
  }
  
  /**
   * Check if currently mobile
   */
  getIsMobile() {
    return this.isMobile;
  }
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED MISSION CONTROL UI MANAGER
// ═══════════════════════════════════════════════════════════════

class MissionControlUI {
  constructor(options = {}) {
    this.options = {
      autoInit: true,
      ...options
    };
    
    this.theme = null;
    this.animation = null;
    this.mobile = null;
    
    if (this.options.autoInit) {
      this.init();
    }
  }
  
  init() {
    // Initialize all subsystems
    this.theme = new MCThemeManager(this.options.theme);
    this.animation = new MCAnimationManager(this.options.animation);
    this.mobile = new MCMobileManager(this.options.mobile);
    
    // Setup global event listeners
    this.setupGlobalListeners();
    
    console.log('🎮 Mission Control UI initialized');
  }
  
  setupGlobalListeners() {
    // Theme toggle buttons
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newTheme = this.theme.toggle();
        this.updateThemeIcons(newTheme);
      });
    });
    
    // Mobile menu buttons
    document.querySelectorAll('[data-mobile-menu]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mobile.toggleSidebar();
      });
    });
    
    // Number animation triggers
    document.querySelectorAll('[data-animate-number]').forEach(el => {
      const target = parseInt(el.dataset.animateNumber);
      const options = {
        suffix: el.dataset.suffix || '',
        prefix: el.dataset.prefix || '',
        duration: parseInt(el.dataset.duration) || 1000
      };
      
      // Animate when visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animation.animateNumber(el, target, options);
            observer.unobserve(el);
          }
        });
      });
      
      observer.observe(el);
    });
  }
  
  updateThemeIcons(theme) {
    document.querySelectorAll('[data-theme-icon]').forEach(icon => {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  }
  
  // Public API
  setTheme(theme) { return this.theme.setTheme(theme); }
  getTheme() { return this.theme.getTheme(); }
  toggleTheme() { return this.theme.toggle(); }
  
  openSidebar() { return this.mobile.openSidebar(); }
  closeSidebar() { return this.mobile.closeSidebar(); }
  toggleSidebar() { return this.mobile.toggleSidebar(); }
  
  animate(element, animation, options) { 
    return this.animation.trigger(element, animation, options); 
  }
  
  animateNumber(element, target, options) {
    return this.animation.animateNumber(element, target, options);
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-INITIALIZE
// ═══════════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MC = new MissionControlUI();
  });
} else {
  window.MC = new MissionControlUI();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    MissionControlUI, 
    MCThemeManager, 
    MCAnimationManager, 
    MCMobileManager 
  };
}
