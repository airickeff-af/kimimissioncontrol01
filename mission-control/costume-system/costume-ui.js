/**
 * Costume UI - User interface for Holiday Costume System
 * Creates panels, selectors, and customization interfaces
 */

class CostumeUI {
  constructor(costumeManager, options = {}) {
    this.manager = costumeManager;
    this.container = options.container || document.body;
    this.onSelectAgent = options.onSelectAgent || (() => {});
    this.onApplyCostume = options.onApplyCostume || (() => {});
    
    this.panel = null;
    this.modal = null;
    this.selectedAgent = null;
    this.isVisible = false;
  }

  /**
   * Initialize UI components
   */
  initialize() {
    this.createCostumeButton();
    this.createPanel();
    this.bindKeyboardShortcuts();
    return this;
  }

  /**
   * Create floating costume button
   */
  createCostumeButton() {
    const btn = document.createElement('button');
    btn.className = 'costume-btn';
    btn.innerHTML = '🎭';
    btn.title = 'Holiday Costumes (C)';
    btn.onclick = () => this.togglePanel();
    
    // Add pulse animation if costumes are active
    if (this.manager.currentHoliday) {
      btn.classList.add('active');
    }
    
    this.container.appendChild(btn);
    this.costumeButton = btn;
  }

  /**
   * Create main costume panel
   */
  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'holiday-selector-panel';
    panel.style.display = 'none';
    
    panel.innerHTML = this.renderPanelContent();
    
    this.container.appendChild(panel);
    this.panel = panel;
    
    this.bindPanelEvents();
  }

  /**
   * Render panel HTML content
   */
  renderPanelContent() {
    const currentHoliday = this.manager.getCurrentHoliday();
    const upcoming = this.manager.getUpcomingHolidays(5);
    
    return `
      <div class="panel-header">
        <h3>🎭 Holiday Costumes</h3>
        <button class="close-btn" onclick="costumeUI.togglePanel()">×</button>
      </div>
      
      <div class="current-holiday">
        <span class="holiday-badge">${currentHoliday ? currentHoliday.icon : '❓'}</span>
        <div class="holiday-info">
          <span class="holiday-name">${currentHoliday ? currentHoliday.name : 'No Active Holiday'}</span>
          <span class="holiday-status">${this.manager.costumesEnabled ? '✅ Active' : '⏸️ Paused'}</span>
        </div>
      </div>
      
      <div class="costume-toggle">
        <label class="switch">
          <input type="checkbox" id="costumeToggle" ${this.manager.costumesEnabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="toggle-label">Enable Costumes</span>
      </div>
      
      <div class="upcoming-holidays">
        <h4>📅 Upcoming Holidays</h4>
        <div class="holiday-list">
          ${upcoming.map(h => `
            <div class="holiday-item ${h.id === this.manager.currentHoliday ? 'active' : ''}" data-holiday="${h.id}">
              <span class="holiday-icon">${h.icon}</span>
              <div class="holiday-info">
                <span class="holiday-name">${h.name}</span>
                <span class="holiday-date">${this.formatDate(h.nextDate)}</span>
              </div>
              <button class="preview-btn" data-holiday="${h.id}" onclick="event.stopPropagation(); costumeUI.previewHoliday('${h.id}')">Preview</button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="customization-panel">
        <h4>✨ Customization</h4>
        <button class="btn btn-primary" onclick="costumeUI.openAgentSelector()">
          👤 Customize Agent
        </button>
        <button class="btn" onclick="costumeUI.openBirthdaySettings()">
          🎂 Set Birthday
        </button>
      </div>
      
      <div class="panel-footer">
        <button class="btn btn-small" onclick="costumeUI.refreshCostumes()">🔄 Refresh</button>
        <button class="btn btn-small" onclick="costumeUI.exportData()">💾 Export</button>
      </div>
    `;
  }

  /**
   * Bind panel event listeners
   */
  bindPanelEvents() {
    // Toggle switch
    const toggle = this.panel.querySelector('#costumeToggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        this.manager.toggleCostumes(e.target.checked);
        this.updateButtonState();
      });
    }

    // Holiday item clicks
    const holidayItems = this.panel.querySelectorAll('.holiday-item');
    holidayItems.forEach(item => {
      item.addEventListener('click', () => {
        const holidayId = item.dataset.holiday;
        this.selectHoliday(holidayId);
      });
    });
  }

  /**
   * Bind keyboard shortcuts
   */
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Press 'C' to toggle costume panel
      if (e.key === 'c' || e.key === 'C') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          this.togglePanel();
        }
      }
      // Press 'Escape' to close panel
      if (e.key === 'Escape' && this.isVisible) {
        this.hidePanel();
      }
    });
  }

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  /**
   * Show panel
   */
  showPanel() {
    this.panel.style.display = 'block';
    this.isVisible = true;
    this.refreshPanelContent();
  }

  /**
   * Hide panel
   */
  hidePanel() {
    this.panel.style.display = 'none';
    this.isVisible = false;
    if (this.modal) {
      this.closeModal();
    }
  }

  /**
   * Refresh panel content
   */
  refreshPanelContent() {
    this.panel.innerHTML = this.renderPanelContent();
    this.bindPanelEvents();
  }

  /**
   * Update costume button state
   */
  updateButtonState() {
    if (this.manager.costumesEnabled && this.manager.currentHoliday) {
      this.costumeButton.classList.add('active');
    } else {
      this.costumeButton.classList.remove('active');
    }
  }

  /**
   * Select a holiday
   */
  selectHoliday(holidayId) {
    // Update UI
    const items = this.panel.querySelectorAll('.holiday-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.holiday === holidayId);
    });
  }

  /**
   * Preview a holiday
   */
  async previewHoliday(holidayId) {
    const preview = await this.manager.previewHoliday(holidayId);
    if (!preview) return;

    this.showModal('Holiday Preview', `
      <div class="preview-content">
        <div class="preview-header">
          <span class="preview-icon">${preview.holiday.icon}</span>
          <h3>${preview.holiday.name}</h3>
        </div>
        <div class="preview-agents">
          ${Object.entries(preview.costumes).map(([agentId, costume]) => {
            const agent = AGENTS_DATA.find(a => a.id === agentId);
            return `
              <div class="preview-agent">
                <div class="preview-sprite" style="background-color: ${agent.color}"></div>
                <span class="preview-name">${agent.name}</span>
                <span class="preview-costume">${costume.head.replace(/_/g, ' ')}</span>
              </div>
            `;
          }).join('')}
        </div>
        <p class="preview-theme">Theme: ${Object.values(preview.holiday.theme).join(', ')}</p>
      </div>
    `);
  }

  /**
   * Open agent selector for customization
   */
  openAgentSelector() {
    const content = `
      <div class="agent-selector">
        <h4>Select an Agent to Customize</h4>
        <div class="agent-grid">
          ${AGENTS_DATA.map(agent => `
            <div class="agent-option" data-agent="${agent.id}" onclick="costumeUI.selectAgent('${agent.id}')">
              <div class="agent-sprite" style="background-color: ${agent.color}"></div>
              <span class="agent-name">${agent.name}</span>
              <span class="agent-role">${agent.role}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    this.showModal('Select Agent', content);
  }

  /**
   * Select an agent and open costume editor
   */
  selectAgent(agentId) {
    this.selectedAgent = AGENTS_DATA.find(a => a.id === agentId);
    this.closeModal();
    this.openCostumeEditor(agentId);
  }

  /**
   * Open costume editor for specific agent
   */
  openCostumeEditor(agentId) {
    const agent = AGENTS_DATA.find(a => a.id === agentId);
    const currentCostume = this.manager.getCostume(agentId);
    
    const content = `
      <div class="costume-editor">
        <div class="editor-preview">
          <canvas id="costumePreview" width="128" height="128"></canvas>
          <div class="preview-controls">
            <button class="btn" onclick="costumeUI.animatePreview()">▶ Animate</button>
            <button class="btn" onclick="costumeUI.randomizeCostume()">🎲 Random</button>
          </div>
        </div>
        
        <div class="editor-parts">
          <div class="part-section">
            <h5>🎩 Head</h5>
            <div class="part-options" data-part="head">
              ${this.renderPartOptions('head', currentCostume?.head)}
            </div>
          </div>
          
          <div class="part-section">
            <h5>👔 Body</h5>
            <div class="part-options" data-part="body">
              ${this.renderPartOptions('body', currentCostume?.body)}
            </div>
          </div>
          
          <div class="part-section">
            <h5>🎀 Accessories</h5>
            <div class="part-options" data-part="accessory">
              ${this.renderPartOptions('accessory', currentCostume?.accessory)}
            </div>
          </div>
          
          <div class="part-section">
            <h5>✨ Effects</h5>
            <div class="part-options" data-part="effect">
              ${this.renderPartOptions('effect', currentCostume?.effect)}
            </div>
          </div>
        </div>
        
        <div class="editor-actions">
          <button class="btn btn-primary" onclick="costumeUI.saveAgentCostume()">💾 Save Costume</button>
          <button class="btn" onclick="costumeUI.resetAgentCostume()">↩️ Reset to Default</button>
        </div>
      </div>
    `;
    
    this.showModal(`Customize ${agent.name}`, content);
    this.renderCostumePreview(agentId);
  }

  /**
   * Render part options
   */
  renderPartOptions(part, selected) {
    const options = this.getPartOptions(part);
    return options.map(opt => `
      <button class="part-option ${opt.id === selected ? 'selected' : ''}" 
              data-part="${part}" 
              data-value="${opt.id}"
              onclick="costumeUI.selectPart('${part}', '${opt.id}')">
        <span class="part-icon">${opt.icon}</span>
        <span class="part-name">${opt.name}</span>
      </button>
    `).join('');
  }

  /**
   * Get available options for a part type
   */
  getPartOptions(part) {
    const options = {
      head: [
        { id: 'none', name: 'None', icon: '❌' },
        { id: 'party_hat', name: 'Party Hat', icon: '🎉' },
        { id: 'crown', name: 'Crown', icon: '👑' },
        { id: 'glasses', name: 'Glasses', icon: '👓' },
        { id: 'santa_hat', name: 'Santa Hat', icon: '🎅' },
        { id: 'bunny_ears', name: 'Bunny Ears', icon: '🐰' },
      ],
      body: [
        { id: 'default', name: 'Default', icon: '👤' },
        { id: 'tuxedo', name: 'Tuxedo', icon: '🤵' },
        { id: 'dress', name: 'Dress', icon: '👗' },
        { id: 'hoodie', name: 'Hoodie', icon: '🧥' },
        { id: 'uniform', name: 'Uniform', icon: '👮' },
      ],
      accessory: [
        { id: 'none', name: 'None', icon: '❌' },
        { id: 'cane', name: 'Cane', icon: '🦯' },
        { id: 'bag', name: 'Bag', icon: '👜' },
        { id: 'phone', name: 'Phone', icon: '📱' },
        { id: 'laptop', name: 'Laptop', icon: '💻' },
      ],
      effect: [
        { id: 'none', name: 'None', icon: '❌' },
        { id: 'sparkles', name: 'Sparkles', icon: '✨' },
        { id: 'hearts', name: 'Hearts', icon: '💖' },
        { id: 'fire', name: 'Fire', icon: '🔥' },
        { id: 'snow', name: 'Snow', icon: '❄️' },
      ]
    };
    
    return options[part] || [];
  }

  /**
   * Select a part option
   */
  selectPart(part, value) {
    // Update UI
    const container = this.modal.querySelector(`[data-part="${part}"]`);
    container.querySelectorAll('.part-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === value);
    });
    
    // Update preview
    this.renderCostumePreview(this.selectedAgent.id);
  }

  /**
   * Render costume preview
   */
  renderCostumePreview(agentId) {
    const canvas = document.getElementById('costumePreview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const agent = AGENTS_DATA.find(a => a.id === agentId);
    
    // Clear canvas
    ctx.clearRect(0, 0, 128, 128);
    
    // Draw agent base
    ctx.fillStyle = agent.color;
    ctx.fillRect(32, 32, 64, 64);
    
    // Draw face
    ctx.fillStyle = '#000';
    ctx.fillRect(44, 48, 8, 8);
    ctx.fillRect(76, 48, 8, 8);
    ctx.fillRect(48, 72, 32, 8);
    
    // Get selected parts
    const parts = {};
    ['head', 'body', 'accessory', 'effect'].forEach(part => {
      const selected = this.modal.querySelector(`[data-part="${part}"] .part-option.selected`);
      parts[part] = selected ? selected.dataset.value : 'none';
    });
    
    // Draw parts (simplified - in real implementation, use actual sprites)
    if (parts.head !== 'none') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(48, 8, 32, 24);
    }
    if (parts.accessory !== 'none') {
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(88, 48, 24, 24);
    }
    if (parts.effect !== 'none') {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(64, 64, 56, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Animate preview
   */
  animatePreview() {
    const canvas = document.getElementById('costumePreview');
    if (!canvas) return;
    
    let frame = 0;
    const animate = () => {
      frame = (frame + 1) % 8;
      this.renderCostumePreview(this.selectedAgent.id);
      
      // Add animation offset
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(frame * 0.8) * 0.2})`;
      ctx.fillRect(32, 32, 64, 64);
      
      if (frame < 7) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  /**
   * Randomize costume
   */
  randomizeCostume() {
    ['head', 'body', 'accessory', 'effect'].forEach(part => {
      const options = this.modal.querySelectorAll(`[data-part="${part}"] .part-option`);
      const random = options[Math.floor(Math.random() * options.length)];
      this.selectPart(part, random.dataset.value);
    });
  }

  /**
   * Save agent costume
   */
  saveAgentCostume() {
    const parts = {};
    ['head', 'body', 'accessory', 'effect'].forEach(part => {
      const selected = this.modal.querySelector(`[data-part="${part}"] .part-option.selected`);
      if (selected && selected.dataset.value !== 'none') {
        parts[part] = selected.dataset.value;
      }
    });
    
    this.manager.saveDefaultCostume(this.selectedAgent.id, parts);
    this.closeModal();
    this.showNotification(`Costume saved for ${this.selectedAgent.name}!`);
  }

  /**
   * Reset agent costume to default
   */
  resetAgentCostume() {
    this.manager.defaultCostumes.delete(this.selectedAgent.id);
    this.manager.saveCostumes();
    this.closeModal();
    this.showNotification(`Costume reset for ${this.selectedAgent.name}`);
  }

  /**
   * Open birthday settings
   */
  openBirthdaySettings() {
    const content = `
      <div class="birthday-settings">
        <h4>🎂 Set Your Birthday</h4>
        <p>Get a special birthday celebration in the office!</p>
        <input type="date" id="birthdayInput" class="birthday-input">
        <div class="birthday-actions">
          <button class="btn btn-primary" onclick="costumeUI.saveBirthday()">Save Birthday</button>
          <button class="btn" onclick="costumeUI.closeModal()">Cancel</button>
        </div>
      </div>
    `;
    
    this.showModal('Birthday Settings', content);
    
    // Set current value if exists
    if (this.manager.userBirthday) {
      const input = document.getElementById('birthdayInput');
      input.valueAsDate = this.manager.userBirthday;
    }
  }

  /**
   * Save birthday
   */
  async saveBirthday() {
    const input = document.getElementById('birthdayInput');
    if (input.value) {
      await this.manager.saveUserBirthday(input.value);
      this.closeModal();
      this.showNotification('Birthday saved! 🎉');
      this.refreshPanelContent();
    }
  }

  /**
   * Refresh costumes
   */
  async refreshCostumes() {
    await this.manager.refreshAllCostumes();
    this.showNotification('Costumes refreshed!');
    this.updateButtonState();
  }

  /**
   * Export costume data
   */
  exportData() {
    const data = this.manager.exportCostumes();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `costumes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Costume data exported!');
  }

  /**
   * Show modal dialog
   */
  showModal(title, content) {
    // Close existing modal
    if (this.modal) {
      this.closeModal();
    }
    
    const modal = document.createElement('div');
    modal.className = 'costume-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="close-btn" onclick="costumeUI.closeModal()">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    
    this.container.appendChild(modal);
    this.modal = modal;
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  /**
   * Close modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  /**
   * Show notification
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'costume-notification';
    notification.textContent = message;
    
    this.container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CostumeUI };
}
