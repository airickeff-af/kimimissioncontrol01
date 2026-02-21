/**
 * Costume Styles - CSS for Holiday Costume System
 * Pixel-art themed UI components
 */

const costumeStyles = `
/* ============================================
   COSTUME SYSTEM STYLES
   ============================================ */

/* Floating Costume Button */
.costume-btn {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: var(--bg-card, #0f3460);
  border: 3px solid var(--panel-border, #e94560);
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 999;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 var(--panel-shadow, #533483);
}

.costume-btn:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 6px 0 var(--panel-shadow, #533483);
}

.costume-btn:active {
  transform: scale(1.05) translateY(2px);
  box-shadow: 0 2px 0 var(--panel-shadow, #533483);
}

.costume-btn.active {
  border-color: var(--accent-green, #51cf66);
  animation: costumePulse 2s infinite;
}

@keyframes costumePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(81, 207, 102, 0.4); }
  50% { box-shadow: 0 0 0 15px rgba(81, 207, 102, 0); }
}

/* Holiday Selector Panel */
.holiday-selector-panel {
  position: fixed;
  top: 140px;
  right: 20px;
  width: 340px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  background: var(--bg-card, #0f3460);
  border: 4px solid var(--panel-border, #e94560);
  border-radius: 12px;
  padding: 16px;
  z-index: 1000;
  font-family: 'Press Start 2P', cursive;
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--panel-border, #e94560);
}

.panel-header h3 {
  font-size: 0.7rem;
  color: var(--accent-cyan, #00d4ff);
  margin: 0;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.close-btn {
  width: 28px;
  height: 28px;
  background: var(--accent-red, #ef4444);
  border: 2px solid var(--text-light, #f5e6c8);
  border-radius: 4px;
  color: var(--text-light, #f5e6c8);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

.close-btn:hover {
  transform: scale(1.1);
  background: #ff5555;
}

/* Current Holiday Section */
.current-holiday {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.1);
  border: 2px solid var(--accent-cyan, #00d4ff);
  border-radius: 8px;
  margin-bottom: 16px;
}

.holiday-badge {
  font-size: 2.5rem;
  line-height: 1;
}

.holiday-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.holiday-name {
  font-size: 0.6rem;
  color: var(--text-light, #f5e6c8);
}

.holiday-status {
  font-size: 0.5rem;
  color: var(--accent-green, #51cf66);
}

/* Toggle Switch */
.costume-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-secondary, #16213e);
  border-radius: 8px;
}

.toggle-label {
  font-size: 0.5rem;
  color: var(--text-light, #f5e6c8);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #666;
  transition: .3s;
  border-radius: 26px;
  border: 2px solid #444;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

input:checked + .slider {
  background-color: var(--accent-green, #51cf66);
  border-color: var(--accent-green, #51cf66);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Upcoming Holidays */
.upcoming-holidays h4 {
  font-size: 0.5rem;
  color: var(--accent-cyan, #00d4ff);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid rgba(0, 212, 255, 0.3);
}

.holiday-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.holiday-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary, #16213e);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.holiday-item:hover {
  background: rgba(0, 212, 255, 0.15);
  border-color: var(--accent-cyan, #00d4ff);
  transform: translateX(-4px);
}

.holiday-item.active {
  border-color: var(--accent-green, #51cf66);
  background: rgba(81, 207, 102, 0.1);
}

.holiday-icon {
  font-size: 1.5rem;
  width: 32px;
  text-align: center;
}

.holiday-item .holiday-info {
  flex: 1;
}

.holiday-item .holiday-name {
  font-size: 0.5rem;
  color: var(--text-light, #f5e6c8);
  display: block;
}

.holiday-date {
  font-size: 0.4rem;
  color: var(--text-secondary, #a0a0a0);
}

.preview-btn {
  padding: 4px 8px;
  font-size: 0.4rem;
  background: var(--accent-cyan, #00d4ff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #000;
  font-family: 'Press Start 2P', cursive;
  transition: all 0.1s;
}

.preview-btn:hover {
  background: #33ddff;
  transform: scale(1.05);
}

/* Customization Panel */
.customization-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid rgba(233, 69, 96, 0.3);
}

.customization-panel h4 {
  font-size: 0.5rem;
  color: var(--accent-cyan, #00d4ff);
  margin-bottom: 10px;
}

.customization-panel .btn {
  width: 100%;
  margin-bottom: 8px;
  padding: 10px;
  font-size: 0.5rem;
  font-family: 'Press Start 2P', cursive;
  background: var(--bg-secondary, #16213e);
  border: 3px solid var(--panel-border, #e94560);
  border-radius: 6px;
  color: var(--text-light, #f5e6c8);
  cursor: pointer;
  transition: all 0.1s;
}

.customization-panel .btn:hover {
  background: var(--accent-cyan, #00d4ff);
  color: #000;
  transform: translateY(-2px);
  box-shadow: 0 4px 0 var(--panel-shadow, #533483);
}

.customization-panel .btn-primary {
  background: var(--accent-green, #51cf66);
  border-color: var(--accent-green, #51cf66);
  color: #000;
}

/* Panel Footer */
.panel-footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid rgba(233, 69, 96, 0.3);
}

.panel-footer .btn {
  flex: 1;
  padding: 8px;
  font-size: 0.4rem;
  font-family: 'Press Start 2P', cursive;
  background: var(--bg-secondary, #16213e);
  border: 2px solid var(--panel-border, #e94560);
  border-radius: 4px;
  color: var(--text-light, #f5e6c8);
  cursor: pointer;
  transition: all 0.1s;
}

.panel-footer .btn:hover {
  background: var(--accent-cyan, #00d4ff);
  color: #000;
}

/* ============================================
   MODAL STYLES
   ============================================ */

.costume-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-card, #0f3460);
  border: 4px solid var(--panel-border, #e94560);
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: modalPop 0.3s ease-out;
  box-shadow: 0 12px 0 rgba(0, 0, 0, 0.3);
}

@keyframes modalPop {
  from { 
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--panel-border, #e94560);
}

.modal-header h3 {
  font-size: 0.7rem;
  color: var(--accent-cyan, #00d4ff);
  margin: 0;
}

.modal-body {
  font-family: 'VT323', monospace;
}

/* Agent Selector */
.agent-selector h4 {
  font-size: 0.6rem;
  color: var(--text-light, #f5e6c8);
  margin-bottom: 12px;
  text-align: center;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.agent-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: var(--bg-secondary, #16213e);
  border: 3px solid var(--panel-border, #e94560);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-option:hover {
  border-color: var(--accent-cyan, #00d4ff);
  transform: translateY(-4px);
  box-shadow: 0 6px 0 var(--panel-shadow, #533483);
}

.agent-sprite {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid var(--text-light, #f5e6c8);
}

.agent-name {
  font-size: 0.45rem;
  color: var(--text-light, #f5e6c8);
  text-align: center;
}

.agent-role {
  font-size: 0.4rem;
  color: var(--text-secondary, #a0a0a0);
  text-align: center;
}

/* Costume Editor */
.costume-editor {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 20px;
}

.editor-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

#costumePreview {
  width: 128px;
  height: 128px;
  image-rendering: pixelated;
  border: 4px solid var(--panel-border, #e94560);
  border-radius: 8px;
  background: var(--bg-secondary, #16213e);
}

.preview-controls {
  display: flex;
  gap: 8px;
}

.preview-controls .btn {
  padding: 8px 12px;
  font-size: 0.45rem;
  font-family: 'Press Start 2P', cursive;
  background: var(--bg-secondary, #16213e);
  border: 2px solid var(--panel-border, #e94560);
  border-radius: 4px;
  color: var(--text-light, #f5e6c8);
  cursor: pointer;
}

.preview-controls .btn:hover {
  background: var(--accent-cyan, #00d4ff);
  color: #000;
}

.editor-parts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.part-section h5 {
  font-size: 0.5rem;
  color: var(--accent-cyan, #00d4ff);
  margin-bottom: 8px;
}

.part-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.part-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--bg-secondary, #16213e);
  border: 2px solid var(--panel-border, #e94560);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'VT323', monospace;
}

.part-option:hover {
  border-color: var(--accent-cyan, #00d4ff);
  transform: scale(1.05);
}

.part-option.selected {
  border-color: var(--accent-green, #51cf66);
  background: rgba(81, 207, 102, 0.2);
  box-shadow: 0 0 10px rgba(81, 207, 102, 0.3);
}

.part-icon {
  font-size: 1.2rem;
}

.part-name {
  font-size: 0.7rem;
  color: var(--text-light, #f5e6c8);
}

.editor-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid rgba(233, 69, 96, 0.3);
}

.editor-actions .btn {
  flex: 1;
  padding: 12px;
  font-size: 0.5rem;
  font-family: 'Press Start 2P', cursive;
  background: var(--bg-secondary, #16213e);
  border: 3px solid var(--panel-border, #e94560);
  border-radius: 6px;
  color: var(--text-light, #f5e6c8);
  cursor: pointer;
  transition: all 0.1s;
}

.editor-actions .btn-primary {
  background: var(--accent-green, #51cf66);
  border-color: var(--accent-green, #51cf66);
  color: #000;
}

.editor-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 0 var(--panel-shadow, #533483);
}

/* Preview Content */
.preview-content {
  text-align: center;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-icon {
  font-size: 3rem;
}

.preview-header h3 {
  font-size: 0.7rem;
  color: var(--accent-cyan, #00d4ff);
  margin: 0;
}

.preview-agents {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.preview-agent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: var(--bg-secondary, #16213e);
  border-radius: 6px;
}

.preview-sprite {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid var(--text-light, #f5e6c8);
}

.preview-name {
  font-size: 0.4rem;
  color: var(--text-light, #f5e6c8);
}

.preview-costume {
  font-size: 0.35rem;
  color: var(--text-secondary, #a0a0a0);
}

.preview-theme {
  font-size: 0.5rem;
  color: var(--text-secondary, #a0a0a0);
}

/* Birthday Settings */
.birthday-settings {
  text-align: center;
}

.birthday-settings h4 {
  font-size: 0.6rem;
  color: var(--accent-cyan, #00d4ff);
  margin-bottom: 8px;
}

.birthday-settings p {
  font-size: 0.7rem;
  color: var(--text-secondary, #a0a0a0);
  margin-bottom: 16px;
}

.birthday-input {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  font-family: 'VT323', monospace;
  background: var(--bg-secondary, #16213e);
  border: 3px solid var(--panel-border, #e94560);
  border-radius: 6px;
  color: var(--text-light, #f5e6c8);
  margin-bottom: 16px;
}

.birthday-actions {
  display: flex;
  gap: 12px;
}

.birthday-actions .btn {
  flex: 1;
  padding: 12px;
  font-size: 0.5rem;
  font-family: 'Press Start 2P', cursive;
  background: var(--bg-secondary, #16213e);
  border: 3px solid var(--panel-border, #e94560);
  border-radius: 6px;
  color: var(--text-light, #f5e6c8);
  cursor: pointer;
}

.birthday-actions .btn-primary {
  background: var(--accent-green, #51cf66);
  border-color: var(--accent-green, #51cf66);
  color: #000;
}

/* Notification */
.costume-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--accent-green, #51cf66);
  color: #000;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.5rem;
  z-index: 3000;
  opacity: 0;
  transition: all 0.3s ease-out;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
}

.costume-notification.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* ============================================
   RESPONSIVE STYLES
   ============================================ */

@media (max-width: 768px) {
  .costume-btn {
    top: auto;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }
  
  .holiday-selector-panel {
    top: auto;
    bottom: 90px;
    right: 10px;
    left: 10px;
    width: auto;
    max-height: 60vh;
  }
  
  .agent-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .costume-editor {
    grid-template-columns: 1fr;
  }
  
  .editor-preview {
    order: -1;
  }
  
  .preview-agents {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .part-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .agent-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .part-options {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .editor-actions {
    flex-direction: column;
  }
}

/* ============================================
   SCROLLBAR STYLES
   ============================================ */

.holiday-selector-panel::-webkit-scrollbar,
.agent-grid::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.holiday-selector-panel::-webkit-scrollbar-track,
.agent-grid::-webkit-scrollbar-track,
.modal-content::-webkit-scrollbar-track {
  background: var(--bg-secondary, #16213e);
  border-radius: 4px;
}

.holiday-selector-panel::-webkit-scrollbar-thumb,
.agent-grid::-webkit-scrollbar-thumb,
.modal-content::-webkit-scrollbar-thumb {
  background: var(--panel-border, #e94560);
  border-radius: 4px;
}

.holiday-selector-panel::-webkit-scrollbar-thumb:hover,
.agent-grid::-webkit-scrollbar-thumb:hover,
.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan, #00d4ff);
}
`;

// Function to inject styles into document
function injectCostumeStyles() {
  const styleEl = document.createElement('style');
  styleEl.id = 'costume-system-styles';
  styleEl.textContent = costumeStyles;
  document.head.appendChild(styleEl);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { costumeStyles, injectCostumeStyles };
}
