/**
 * ═══════════════════════════════════════════════════════════════
 * MISSION CONTROL UI COMPONENTS - JavaScript Module
 * Version: 1.0.0
 * Author: Forge-2 (UI Components Specialist)
 * Date: 2026-02-17
 * 
 * Features:
 * - Sidebar toggle functionality
 * - Mobile responsive handling
 * - Dropdown management
 * - Loading states
 * - Agent category expansion
 * - Activity feed simulation
 * ═══════════════════════════════════════════════════════════════
 */

class MissionControlUI {
  constructor(options = {}) {
    this.options = {
      sidebarSelector: '#mc-sidebar',
      toggleSelector: '#mc-sidebar-toggle',
      mobileMenuSelector: '#mc-mobile-menu-btn',
      overlaySelector: '#mc-sidebar-overlay',
      storageKey: 'mc-sidebar-collapsed',
      ...options
    };
    
    this.sidebar = document.querySelector(this.options.sidebarSelector);
    this.toggle = document.querySelector(this.options.toggleSelector);
    this.mobileMenuBtn = document.querySelector(this.options.mobileMenuSelector);
    this.overlay = document.querySelector(this.options.overlaySelector);
    
    this.init();
  }
  
  init() {
    this.initSidebar();
    this.initMobileMenu();
    this.initAgentCategories();
    this.initDropdowns();
    this.initTooltips();
    this.initButtonStates();
    this.restoreSidebarState();
  }
  
  /**
   * Initialize sidebar toggle functionality
   */
  initSidebar() {
    if (!this.toggle || !this.sidebar) return;
    
    this.toggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('collapsed');
      this.saveSidebarState();
      this.dispatchEvent('sidebarToggle', {
        collapsed: this.sidebar.classList.contains('collapsed')
      });
    });
  }
  
  /**
   * Initialize mobile menu handling
   */
  initMobileMenu() {
    if (!this.mobileMenuBtn || !this.overlay) return;
    
    this.mobileMenuBtn.addEventListener('click', () => {
      this.sidebar.classList.add('mc-mobile-open');
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    this.overlay.addEventListener('click', () => {
      this.closeMobileSidebar();
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileSidebar();
        this.closeAllDropdowns();
      }
    });
  }
  
  /**
   * Close mobile sidebar
   */
  closeMobileSidebar() {
    if (!this.sidebar) return;
    this.sidebar.classList.remove('mc-mobile-open');
    if (this.overlay) this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  /**
   * Save sidebar state to localStorage
   */
  saveSidebarState() {
    if (!this.sidebar) return;
    localStorage.setItem(
      this.options.storageKey,
      this.sidebar.classList.contains('collapsed')
    );
  }
  
  /**
   * Restore sidebar state from localStorage
   */
  restoreSidebarState() {
    if (!this.sidebar) return;
    const isCollapsed = localStorage.getItem(this.options.storageKey) === 'true';
    if (isCollapsed) {
      this.sidebar.classList.add('collapsed');
    }
  }
  
  /**
   * Initialize agent category expansion
   */
  initAgentCategories() {
    document.querySelectorAll('.mc-agent-category-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const category = header.parentElement;
        const isExpanded = category.classList.contains('expanded');
        
        // Optional: Close other categories
        // document.querySelectorAll('.mc-agent-category').forEach(c => c.classList.remove('expanded'));
        
        category.classList.toggle('expanded');
        
        this.dispatchEvent('categoryToggle', {
          category: category,
          expanded: !isExpanded
        });
      });
    });
  }
  
  /**
   * Initialize dropdown menus
   */
  initDropdowns() {
    document.querySelectorAll('.mc-dropdown').forEach(dropdown => {
      const trigger = dropdown.querySelector('[data-dropdown-trigger]') || 
                      dropdown.querySelector('button') ||
                      dropdown.querySelector('.mc-dropdown-trigger');
      
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleDropdown(dropdown);
        });
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  }
  
  /**
   * Toggle dropdown state
   */
  toggleDropdown(dropdown) {
    const isActive = dropdown.classList.contains('active');
    this.closeAllDropdowns();
    
    if (!isActive) {
      dropdown.classList.add('active');
      this.dispatchEvent('dropdownOpen', { dropdown });
    }
  }
  
  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    document.querySelectorAll('.mc-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }
  
  /**
   * Initialize tooltips
   */
  initTooltips() {
    // Tooltips are CSS-only, but we can add dynamic positioning here if needed
    document.querySelectorAll('.mc-tooltip').forEach(tooltip => {
      tooltip.addEventListener('mouseenter', () => {
        this.positionTooltip(tooltip);
      });
    });
  }
  
  /**
   * Position tooltip dynamically if needed
   */
  positionTooltip(tooltip) {
    // Add dynamic positioning logic here if tooltips overflow viewport
    const rect = tooltip.getBoundingClientRect();
    const tooltipText = tooltip.querySelector('::before');
    
    // Check if tooltip would overflow top of viewport
    if (rect.top < 40) {
      tooltip.style.setProperty('--tooltip-position', 'bottom');
    }
  }
  
  /**
   * Initialize button loading states
   */
  initButtonStates() {
    document.querySelectorAll('.mc-btn[data-loading]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (btn.disabled) return;
        
        const loadingDuration = parseInt(btn.dataset.loading) || 2000;
        this.setButtonLoading(btn, true);
        
        setTimeout(() => {
          this.setButtonLoading(btn, false);
        }, loadingDuration);
      });
    });
  }
  
  /**
   * Set button loading state
   */
  setButtonLoading(btn, isLoading) {
    if (isLoading) {
      btn.classList.add('mc-btn-loading');
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
    } else {
      btn.classList.remove('mc-btn-loading');
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
      }
    }
  }
  
  /**
   * Dispatch custom event
   */
  dispatchEvent(name, detail) {
    const event = new CustomEvent(`mc:${name}`, { detail });
    document.dispatchEvent(event);
  }
  
  /**
   * Listen for custom events
   */
  on(event, callback) {
    document.addEventListener(`mc:${event}`, (e) => callback(e.detail));
  }
  
  /**
   * Toggle sidebar programmatically
   */
  toggleSidebar() {
    if (!this.sidebar) return;
    this.sidebar.classList.toggle('collapsed');
    this.saveSidebarState();
  }
  
  /**
   * Expand/collapse agent category programmatically
   */
  toggleCategory(categoryId, expand = null) {
    const category = document.querySelector(`[data-category="${categoryId}"]`);
    if (!category) return;
    
    if (expand === null) {
      category.classList.toggle('expanded');
    } else if (expand) {
      category.classList.add('expanded');
    } else {
      category.classList.remove('expanded');
    }
  }
  
  /**
   * Show skeleton loading state for an element
   */
  showSkeleton(selector, type = 'text') {
    const element = document.querySelector(selector);
    if (!element) return;
    
    element.dataset.originalContent = element.innerHTML;
    
    const skeletonClass = type === 'card' ? 'mc-skeleton-card' : 
                          type === 'avatar' ? 'mc-skeleton-avatar' : 
                          'mc-skeleton-text';
    
    element.innerHTML = `
      <div class="mc-skeleton ${skeletonClass}"></div>
      <div class="mc-skeleton ${skeletonClass}"></div>
      <div class="mc-skeleton ${skeletonClass}"></div>
    `;
  }
  
  /**
   * Hide skeleton and restore content
   */
  hideSkeleton(selector) {
    const element = document.querySelector(selector);
    if (!element || !element.dataset.originalContent) return;
    
    element.innerHTML = element.dataset.originalContent;
    delete element.dataset.originalContent;
  }
  
  /**
   * Update progress bar
   */
  updateProgress(selector, percentage) {
    const progressBar = document.querySelector(`${selector} .mc-progress-bar`);
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
  }
  
  /**
   * Animate number counter
   */
  animateNumber(element, target, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * easeOut);
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }
  
  /**
   * Add activity item to feed
   */
  addActivity(containerSelector, activity) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const activityEl = document.createElement('div');
    activityEl.className = 'mc-activity-item';
    activityEl.innerHTML = `
      <div class="mc-activity-dot ${activity.status || 'online'}"></div>
      <div class="mc-activity-content">
        <div class="mc-activity-text">${activity.text}</div>
        <div class="mc-activity-time">${activity.time || 'Just now'}</div>
      </div>
    `;
    
    container.insertBefore(activityEl, container.firstChild);
    
    // Remove old items if too many
    const maxItems = 10;
    while (container.children.length > maxItems) {
      container.removeChild(container.lastChild);
    }
  }
  
  /**
   * Destroy instance and clean up
   */
  destroy() {
    // Remove event listeners
    if (this.toggle) {
      this.toggle.removeEventListener('click');
    }
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.removeEventListener('click');
    }
    if (this.overlay) {
      this.overlay.removeEventListener('click');
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Debounce function
 */
function debounce(func, wait) {
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
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format relative time
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(date).toLocaleDateString();
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-INITIALIZE
// ═══════════════════════════════════════════════════════════════

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mcUI = new MissionControlUI();
  });
} else {
  window.mcUI = new MissionControlUI();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MissionControlUI, debounce, throttle, formatRelativeTime, copyToClipboard };
}
