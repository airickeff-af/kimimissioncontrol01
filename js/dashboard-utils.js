// Auto-refresh utility for Mission Control dashboards
// Adds 30-minute auto-refresh and working refresh buttons

(function() {
  'use strict';
  
  // Configuration
  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const API_BASE = window.location.origin.includes('vercel.app') 
    ? window.location.origin + '/api'
    : 'http://localhost:3001/api';
  
  // Auto-refresh function
  function autoRefresh() {
    console.log('[Mission Control] Auto-refreshing...');
    window.location.reload();
  }
  
  // Setup auto-refresh
  function setupAutoRefresh() {
    setInterval(autoRefresh, REFRESH_INTERVAL);
    console.log('[Mission Control] Auto-refresh enabled: 30 minutes');
    
    // Show notification
    showNotification('Auto-refresh enabled (30 min)', 'info');
  }
  
  // Fix refresh buttons
  function fixRefreshButtons() {
    const refreshButtons = document.querySelectorAll('.refresh-btn, [onclick*="reload"], button[title*="refresh" i]');
    
    refreshButtons.forEach(btn => {
      // Remove old onclick
      btn.removeAttribute('onclick');
      
      // Add new click handler
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Show loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '🔄 Refreshing...';
        btn.disabled = true;
        
        // Reload page
        window.location.reload();
      });
      
      console.log('[Mission Control] Fixed refresh button:', btn);
    });
  }
  
  // Fetch live data from API
  async function fetchLiveData(endpoint) {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[Mission Control] API Error:', error);
      return null;
    }
  }
  
  // Update dashboard with live data
  async function updateDashboard() {
    // Try to fetch token data
    const tokenData = await fetchLiveData('tokens');
    if (tokenData) {
      updateTokenDisplay(tokenData);
    }
    
    // Try to fetch agent data
    const agentData = await fetchLiveData('agents');
    if (agentData) {
      updateAgentDisplay(agentData);
    }
  }
  
  // Update token display
  function updateTokenDisplay(data) {
    const totalCostEl = document.querySelector('.total-cost, [data-metric="cost"]');
    if (totalCostEl && data.total) {
      totalCostEl.textContent = `$${data.total.cost}`;
    }
    
    // Update agent cards if they exist
    if (data.agents) {
      data.agents.forEach(agent => {
        const agentCard = document.querySelector(`[data-agent="${agent.name}"]`);
        if (agentCard) {
          const costEl = agentCard.querySelector('.agent-cost');
          if (costEl) costEl.textContent = `$${agent.cost}`;
        }
      });
    }
  }
  
  // Update agent display
  function updateAgentDisplay(data) {
    // Update agent status indicators
    if (data.agents) {
      data.agents.forEach(agent => {
        const statusEl = document.querySelector(`[data-agent-status="${agent.name}"]`);
        if (statusEl) {
          statusEl.className = `status-badge status-${agent.status}`;
          statusEl.textContent = agent.status;
        }
      });
    }
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'info' ? 'ℹ️' : '✅'}</span>
      <span class="notification-text">${message}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(0, 212, 255, 0.9);
      color: #000;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Initialize
  function init() {
    console.log('[Mission Control] Dashboard utilities loaded');
    
    // Fix refresh buttons
    fixRefreshButtons();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    // Try to fetch live data
    updateDashboard();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
