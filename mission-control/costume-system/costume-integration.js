/**
 * Costume System Integration - Main entry point
 * Initializes and integrates the Holiday Costume System with Pixel Office
 */

// Global costume system instance
let costumeManager = null;
let costumeUI = null;

/**
 * Initialize the costume system
 */
async function initializeCostumeSystem(options = {}) {
  console.log('[CostumeSystem] Initializing...');
  
  // Inject styles
  if (typeof injectCostumeStyles === 'function') {
    injectCostumeStyles();
  }
  
  // Initialize manager
  costumeManager = new CostumeManager({
    aiEnabled: options.aiEnabled !== false,
    onCostumeChange: (enabled) => {
      console.log(`[CostumeSystem] Costumes ${enabled ? 'enabled' : 'disabled'}`);
      updateAgentCostumes();
    },
    onHolidayChange: (holidayId, holiday) => {
      console.log(`[CostumeSystem] Holiday changed: ${holiday?.name || 'None'}`);
      showHolidayNotification(holiday);
    }
  });
  
  await costumeManager.initialize();
  
  // Initialize UI
  costumeUI = new CostumeUI(costumeManager, {
    container: document.body,
    onSelectAgent: (agentId) => {
      console.log(`[CostumeSystem] Selected agent: ${agentId}`);
    },
    onApplyCostume: (agentId, costume) => {
      applyCostumeToAgent(agentId, costume);
    }
  });
  
  costumeUI.initialize();
  
  // Apply initial costumes to agents
  updateAgentCostumes();
  
  console.log('[CostumeSystem] Initialized successfully');
  return { manager: costumeManager, ui: costumeUI };
}

/**
 * Update costumes for all agents
 */
function updateAgentCostumes() {
  if (!costumeManager || !window.agents) return;
  
  window.agents.forEach(agent => {
    const costume = costumeManager.getCostume(agent.id);
    if (costume) {
      agent.costume = costume;
    } else {
      delete agent.costume;
    }
  });
}

/**
 * Apply costume to specific agent
 */
function applyCostumeToAgent(agentId, costume) {
  if (!window.agents) return;
  
  const agent = window.agents.find(a => a.id === agentId);
  if (agent) {
    agent.costume = costume;
  }
}

/**
 * Show holiday notification
 */
function showHolidayNotification(holiday) {
  if (!holiday) return;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'holiday-notification';
  notification.innerHTML = `
    <div class="holiday-notify-content">
      <span class="holiday-notify-icon">${holiday.icon}</span>
      <div class="holiday-notify-text">
        <strong>${holiday.name}</strong>
        <span>Holiday costumes are now active! 🎭</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

/**
 * Render costume for agent (called from Agent.render)
 */
function renderAgentCostume(ctx, agent, x, y, size) {
  if (!agent.costume) return;
  
  const costume = agent.costume;
  
  // Render based on source type
  if (costume.source === 'ai' && costume.texture) {
    renderAITexture(ctx, costume.texture, x, y, size);
  } else if (costume.source === 'sprite' && costume.sprites) {
    renderSprites(ctx, costume.sprites, agent, x, y, size);
  }
  
  // Render effect
  if (costume.effect) {
    renderEffect(ctx, costume.effect, x, y, size, agent.frame);
  }
}

/**
 * Render AI-generated texture
 */
function renderAITexture(ctx, textureUrl, x, y, size) {
  // Load and cache image
  if (!window.costumeImages) window.costumeImages = new Map();
  
  let img = window.costumeImages.get(textureUrl);
  if (!img) {
    img = new Image();
    img.src = textureUrl;
    window.costumeImages.set(textureUrl, img);
  }
  
  if (img.complete) {
    ctx.drawImage(img, x - size * 0.1, y - size * 0.3, size * 1.2, size * 1.5);
  }
}

/**
 * Render sprite-based costume
 */
function renderSprites(ctx, sprites, agent, x, y, size) {
  // Render body
  if (sprites.body && window.spriteLoader) {
    const bodySprite = window.spriteLoader.getCostumeSprite(sprites.body, agent.animation, agent.frame);
    if (bodySprite) {
      ctx.drawImage(
        bodySprite.image,
        bodySprite.sx, bodySprite.sy, bodySprite.sw, bodySprite.sh,
        x, y, size, size
      );
    }
  }
  
  // Render head (offset up)
  if (sprites.head && window.spriteLoader) {
    const headSprite = window.spriteLoader.getCostumeSprite(sprites.head, agent.animation, agent.frame);
    if (headSprite) {
      ctx.drawImage(
        headSprite.image,
        headSprite.sx, headSprite.sy, headSprite.sw, headSprite.sh,
        x, y - size * 0.3, size, size
      );
    }
  }
  
  // Render accessory
  if (sprites.accessory && window.spriteLoader) {
    const accSprite = window.spriteLoader.getCostumeSprite(sprites.accessory, agent.animation, agent.frame);
    if (accSprite) {
      ctx.drawImage(
        accSprite.image,
        accSprite.sx, accSprite.sy, accSprite.sw, accSprite.sh,
        x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6
      );
    }
  }
}

/**
 * Render costume effect
 */
function renderEffect(ctx, effectName, x, y, size, frame) {
  const time = Date.now() / 1000;
  
  switch (effectName) {
    case 'sparkle_burst':
    case 'sparkles':
      renderSparkles(ctx, x, y, size, time);
      break;
    case 'heart_burst':
    case 'hearts':
      renderHearts(ctx, x, y, size, time);
      break;
    case 'snow_fall':
    case 'snow':
      renderSnow(ctx, x, y, size, time);
      break;
    case 'confetti_rain':
    case 'confetti':
      renderConfetti(ctx, x, y, size, time);
      break;
    case 'firework_trail':
      renderFireworks(ctx, x, y, size, time);
      break;
    case 'lantern_glow':
      renderGlow(ctx, x, y, size, '#FFD700', time);
      break;
    case 'rainbow_burst':
      renderRainbow(ctx, x, y, size, time);
      break;
    default:
      // Unknown effect, render generic sparkles
      renderSparkles(ctx, x, y, size, time);
  }
}

/**
 * Render sparkle effect
 */
function renderSparkles(ctx, x, y, size, time) {
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 5; i++) {
    const angle = (time * 2 + i * (Math.PI * 2 / 5)) % (Math.PI * 2);
    const dist = size * (0.6 + Math.sin(time * 3 + i) * 0.1);
    const sx = x + size / 2 + Math.cos(angle) * dist;
    const sy = y - size * 0.2 + Math.sin(angle) * dist * 0.5;
    const sparkleSize = 2 + Math.sin(time * 4 + i) * 1;
    
    ctx.beginPath();
    ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render heart effect
 */
function renderHearts(ctx, x, y, size, time) {
  ctx.fillStyle = '#FF69B4';
  for (let i = 0; i < 3; i++) {
    const offset = (time + i * 0.5) % 2;
    const hx = x + size / 2 + (i - 1) * size * 0.3;
    const hy = y - size * 0.3 - offset * size * 0.2;
    const scale = 0.5 + Math.sin(time * 2 + i) * 0.2;
    
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(scale, scale);
    ctx.fillText('❤', 0, 0);
    ctx.restore();
  }
}

/**
 * Render snow effect
 */
function renderSnow(ctx, x, y, size, time) {
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 8; i++) {
    const sx = x + (i / 8) * size;
    const sy = y + ((time * 50 + i * 20) % (size * 1.5));
    const snowSize = 1.5 + Math.sin(time + i) * 0.5;
    
    ctx.beginPath();
    ctx.arc(sx, sy, snowSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render confetti effect
 */
function renderConfetti(ctx, x, y, size, time) {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  
  for (let i = 0; i < 10; i++) {
    const cx = x + ((time * 30 + i * 37) % size);
    const cy = y + ((time * 40 + i * 23) % (size * 1.2));
    const color = colors[i % colors.length];
    
    ctx.fillStyle = color;
    ctx.fillRect(cx, cy, 3, 3);
  }
}

/**
 * Render firework effect
 */
function renderFireworks(ctx, x, y, size, time) {
  const colors = ['#FFD700', '#FF6B6B', '#00D4FF', '#FF69B4'];
  const burstTime = time % 2;
  
  if (burstTime < 1) {
    const progress = burstTime;
    const radius = progress * size;
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const fx = x + size / 2 + Math.cos(angle) * radius;
      const fy = y - size * 0.3 + Math.sin(angle) * radius * 0.5;
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 1 - progress;
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

/**
 * Render glow effect
 */
function renderGlow(ctx, x, y, size, color, time) {
  const gradient = ctx.createRadialGradient(
    x + size / 2, y + size / 2, 0,
    x + size / 2, y + size / 2, size
  );
  gradient.addColorStop(0, color + '60');
  gradient.addColorStop(1, color + '00');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * (0.8 + Math.sin(time * 2) * 0.1), 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Render rainbow effect
 */
function renderRainbow(ctx, x, y, size, time) {
  const colors = ['#FF0000', '#FF8C00', '#FFD700', '#008000', '#0000FF', '#4B0082', '#9400D3'];
  
  for (let i = 0; i < colors.length; i++) {
    const offset = (time * 2 + i * 0.2) % (Math.PI * 2);
    const rx = x + size / 2 + Math.cos(offset) * size * 0.4;
    const ry = y - size * 0.2 + Math.sin(offset) * size * 0.2;
    
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Add holiday notification styles
 */
const notificationStyles = `
.holiday-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  background: var(--bg-card, #0f3460);
  border: 4px solid var(--accent-green, #51cf66);
  border-radius: 12px;
  padding: 16px 24px;
  z-index: 3000;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.3);
}

.holiday-notification.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.holiday-notify-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.holiday-notify-icon {
  font-size: 2.5rem;
}

.holiday-notify-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.holiday-notify-text strong {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.6rem;
  color: var(--accent-green, #51cf66);
}

.holiday-notify-text span {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  color: var(--text-light, #f5e6c8);
}
`;

// Inject notification styles
const styleEl = document.createElement('style');
styleEl.textContent = notificationStyles;
document.head.appendChild(styleEl);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeCostumeSystem,
    updateAgentCostumes,
    applyCostumeToAgent,
    renderAgentCostume
  };
}
