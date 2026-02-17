/**
 * ═══════════════════════════════════════════════════════════════
 * MISSION CONTROL - MOBILE RESPONSIVE MODULE
 * Author: Forge-3 (Advanced UI Specialist)
 * Date: 2026-02-17
 * 
 * Features:
 * - Mobile navigation management
 * - Touch gesture handling
 * - Responsive breakpoint detection
 * - Swipe actions
 * - Pull-to-refresh
 * ═══════════════════════════════════════════════════════════════
 */

const MC_Mobile = {
    // Configuration
    config: {
        sidebarWidth: 280,
        swipeThreshold: 50,
        longPressDelay: 500,
        doubleTapDelay: 300
    },
    
    // State
    state: {
        isMobile: false,
        isTablet: false,
        sidebarOpen: false,
        touchStartX: 0,
        touchStartY: 0,
        touchStartTime: 0,
        lastTapTime: 0,
        isScrolling: false
    },
    
    /**
     * Initialize mobile responsive features
     */
    init() {
        this.detectDevice();
        this.setupEventListeners();
        this.setupMobileNavigation();
        this.setupTouchGestures();
        this.setupPullToRefresh();
        
        console.log('📱 Mobile responsive system initialized');
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * DEVICE DETECTION
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Detect current device type
     */
    detectDevice() {
        const width = window.innerWidth;
        this.state.isMobile = width < 640;
        this.state.isTablet = width >= 640 && width < 1024;
        
        // Update body class
        document.body.classList.toggle('is-mobile', this.state.isMobile);
        document.body.classList.toggle('is-tablet', this.state.isTablet);
        document.body.classList.toggle('is-desktop', !this.state.isMobile && !this.state.isTablet);
        
        return {
            isMobile: this.state.isMobile,
            isTablet: this.state.isTablet,
            width: width
        };
    },
    
    /**
     * Check if touch device
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * MOBILE NAVIGATION
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Setup mobile navigation components
     */
    setupMobileNavigation() {
        // Create mobile sidebar if it doesn't exist
        if (!document.querySelector('.mobile-sidebar')) {
            this.createMobileSidebar();
        }
        
        // Create mobile header if it doesn't exist
        if (!document.querySelector('.mobile-header')) {
            this.createMobileHeader();
        }
    },
    
    /**
     * Create mobile sidebar
     */
    createMobileSidebar() {
        const existingSidebar = document.querySelector('.sidebar');
        if (!existingSidebar) return;
        
        // Clone sidebar content for mobile
        const mobileSidebar = document.createElement('div');
        mobileSidebar.className = 'mobile-sidebar';
        mobileSidebar.innerHTML = `
            <div class="mobile-sidebar-header">
                <div class="brand">
                    <div class="logo">◈</div>
                    <div class="brand-text">
                        <h1>Mission Control</h1>
                    </div>
                </div>
                <button class="mobile-sidebar-close" onclick="MC_Mobile.closeSidebar()">×</button>
            </div>
            <div class="mobile-sidebar-content">
                ${existingSidebar.innerHTML}
            </div>
        `;
        
        document.body.appendChild(mobileSidebar);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-sidebar-overlay';
        overlay.onclick = () => this.closeSidebar();
        document.body.appendChild(overlay);
    },
    
    /**
     * Create mobile header
     */
    createMobileHeader() {
        const header = document.createElement('header');
        header.className = 'mobile-header show-mobile-only';
        header.innerHTML = `
            <button class="mobile-menu-btn" onclick="MC_Mobile.openSidebar()" aria-label="Open menu">
                ☰
            </button>
            <div class="mobile-brand">
                <span style="font-weight: 700; font-size: 1.1rem;">Mission Control</span>
            </div>
            <button class="mobile-menu-btn" onclick="MC_Mobile.showQuickActions()" aria-label="Quick actions">
                ⚡
            </button>
        `;
        
        document.body.insertBefore(header, document.body.firstChild);
    },
    
    /**
     * Open mobile sidebar
     */
    openSidebar() {
        const sidebar = document.querySelector('.mobile-sidebar');
        const overlay = document.querySelector('.mobile-sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            this.state.sidebarOpen = true;
            document.body.style.overflow = 'hidden';
        }
    },
    
    /**
     * Close mobile sidebar
     */
    closeSidebar() {
        const sidebar = document.querySelector('.mobile-sidebar');
        const overlay = document.querySelector('.mobile-sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            this.state.sidebarOpen = false;
            document.body.style.overflow = '';
        }
    },
    
    /**
     * Toggle mobile sidebar
     */
    toggleSidebar() {
        if (this.state.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    },
    
    /**
     * Show quick actions modal (mobile)
     */
    showQuickActions() {
        // Create modal if not exists
        let modal = document.querySelector('.mobile-quick-actions');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'mobile-quick-actions';
            modal.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--mc-bg-card);
                border-top: 1px solid var(--mc-border-default);
                border-radius: 20px 20px 0 0;
                padding: 20px;
                z-index: 1000;
                transform: translateY(100%);
                transition: transform 0.3s ease;
            `;
            modal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 1.1rem;">Quick Actions</h3>
                    <button onclick="MC_Mobile.hideQuickActions()" style="
                        background: none;
                        border: none;
                        color: var(--mc-text-muted);
                        font-size: 1.5rem;
                        cursor: pointer;
                    ">×</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <button class="quick-action-btn" onclick="MC_Mobile.triggerAction('spawn')">
                        <div style="font-size: 1.5rem; margin-bottom: 4px;">🤖</div>
                        <div style="font-size: 0.8rem;">Spawn</div>
                    </button>
                    <button class="quick-action-btn" onclick="MC_Mobile.triggerAction('task')">
                        <div style="font-size: 1.5rem; margin-bottom: 4px;">📋</div>
                        <div style="font-size: 0.8rem;">Task</div>
                    </button>
                    <button class="quick-action-btn" onclick="MC_Mobile.triggerAction('research')">
                        <div style="font-size: 1.5rem; margin-bottom: 4px;">🔍</div>
                        <div style="font-size: 0.8rem;">Research</div>
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.className = 'mobile-quick-actions-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease;
            `;
            overlay.onclick = () => this.hideQuickActions();
            document.body.appendChild(overlay);
        }
        
        // Show modal
        modal.style.transform = 'translateY(0)';
        const overlay = document.querySelector('.mobile-quick-actions-overlay');
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
        }
    },
    
    /**
     * Hide quick actions modal
     */
    hideQuickActions() {
        const modal = document.querySelector('.mobile-quick-actions');
        const overlay = document.querySelector('.mobile-quick-actions-overlay');
        
        if (modal) {
            modal.style.transform = 'translateY(100%)';
        }
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
        }
    },
    
    /**
     * Trigger quick action
     */
    triggerAction(action) {
        this.hideQuickActions();
        
        switch (action) {
            case 'spawn':
                if (typeof MC_DASHBOARD !== 'undefined') {
                    MC_DASHBOARD.addLog('MOBILE', 'INFO', 'Spawn agent action triggered');
                }
                MC_Animation.showToast('Spawn Agent - Coming Soon', { type: 'info' });
                break;
            case 'task':
                if (typeof MC_DASHBOARD !== 'undefined') {
                    MC_DASHBOARD.addLog('MOBILE', 'INFO', 'Create task action triggered');
                }
                MC_Animation.showToast('Create Task - Coming Soon', { type: 'info' });
                break;
            case 'research':
                if (typeof MC_DASHBOARD !== 'undefined') {
                    MC_DASHBOARD.addLog('MOBILE', 'INFO', 'Research action triggered');
                }
                MC_Animation.showToast('Research - Coming Soon', { type: 'info' });
                break;
        }
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * TOUCH GESTURES
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Setup touch gesture handlers
     */
    setupTouchGestures() {
        if (!this.isTouchDevice()) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            this.state.isScrolling = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            this.state.isScrolling = true;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - touchStartTime;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            // Detect swipe
            if (absDeltaX > this.config.swipeThreshold && absDeltaX > absDeltaY) {
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
            
            // Detect tap (not scroll)
            if (!this.state.isScrolling && touchDuration < 200) {
                this.handleTap(e.target);
            }
            
            // Detect long press
            if (!this.state.isScrolling && touchDuration > this.config.longPressDelay) {
                this.handleLongPress(e.target);
            }
        }, { passive: true });
    },
    
    /**
     * Handle swipe right gesture
     */
    handleSwipeRight() {
        // Open sidebar if near left edge
        if (this.state.touchStartX < 50 && this.state.isMobile) {
            this.openSidebar();
        }
    },
    
    /**
     * Handle swipe left gesture
     */
    handleSwipeLeft() {
        // Close sidebar
        if (this.state.sidebarOpen) {
            this.closeSidebar();
        }
    },
    
    /**
     * Handle tap
     */
    handleTap(target) {
        // Add ripple effect to buttons
        if (target.tagName === 'BUTTON' || target.closest('button')) {
            const button = target.tagName === 'BUTTON' ? target : target.closest('button');
            MC_Animation.addRipple({ clientX: 0, clientY: 0 }, button);
        }
    },
    
    /**
     * Handle long press
     */
    handleLongPress(target) {
        // Could show context menu
        console.log('Long press detected');
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * PULL TO REFRESH
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Setup pull-to-refresh functionality
     */
    setupPullToRefresh() {
        if (!this.state.isMobile) return;
        
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        const threshold = 100;
        
        const container = document.querySelector('.main, main, .dashboard') || document.body;
        
        // Create pull indicator
        const indicator = document.createElement('div');
        indicator.className = 'ptr-indicator';
        indicator.innerHTML = '<div class="loading-spinner loading-spinner-sm"></div>';
        indicator.style.cssText = `
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            transition: top 0.2s ease;
        `;
        container.style.position = 'relative';
        container.appendChild(indicator);
        
        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0 && container.scrollTop === 0) {
                const pullDistance = Math.min(diff * 0.5, threshold);
                indicator.style.top = `${pullDistance - 50}px`;
                
                if (pullDistance >= threshold) {
                    indicator.classList.add('ready');
                }
            }
        }, { passive: true });
        
        container.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            const diff = currentY - startY;
            
            if (diff > threshold && container.scrollTop === 0) {
                // Trigger refresh
                indicator.classList.add('refreshing');
                this.handleRefresh();
            } else {
                // Reset
                indicator.style.top = '-50px';
            }
            
            isPulling = false;
            indicator.classList.remove('ready');
        });
    },
    
    /**
     * Handle pull-to-refresh
     */
    async handleRefresh() {
        MC_Animation.showToast('Refreshing...', { type: 'info', duration: 1000 });
        
        // Refresh dashboard data
        if (typeof MC_DASHBOARD !== 'undefined') {
            await MC_DASHBOARD.refreshAll();
        }
        
        // Reset indicator
        setTimeout(() => {
            const indicator = document.querySelector('.ptr-indicator');
            if (indicator) {
                indicator.classList.remove('refreshing');
                indicator.style.top = '-50px';
            }
            MC_Animation.showToast('Refreshed!', { type: 'success', duration: 1500 });
        }, 1000);
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * EVENT LISTENERS
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Setup window event listeners
     */
    setupEventListeners() {
        // Handle resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.detectDevice();
                if (!this.state.isMobile && this.state.sidebarOpen) {
                    this.closeSidebar();
                }
            }, 250);
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.detectDevice(), 100);
        });
        
        // Handle keyboard show/hide (mobile)
        window.addEventListener('resize', () => {
            const height = window.innerHeight;
            const isKeyboardOpen = height < window.screen.height * 0.75;
            document.body.classList.toggle('keyboard-open', isKeyboardOpen);
        });
        
        // Handle back button (Android)
        window.addEventListener('popstate', () => {
            if (this.state.sidebarOpen) {
                this.closeSidebar();
                history.pushState(null, '');
            }
        });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * UTILITY FUNCTIONS
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Scroll to element smoothly
     */
    scrollTo(selector, options = {}) {
        const { offset = 0, behavior = 'smooth' } = options;
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
        
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior });
        }
    },
    
    /**
     * Lock body scroll
     */
    lockScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
    },
    
    /**
     * Unlock body scroll
     */
    unlockScroll() {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
    },
    
    /**
     * Get viewport dimensions
     */
    getViewport() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            aspect: window.innerWidth / window.innerHeight
        };
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MC_Mobile.init());
} else {
    MC_Mobile.init();
}

// Expose globally
window.MC_Mobile = MC_Mobile;
