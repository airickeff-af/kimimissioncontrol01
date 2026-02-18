/**
 * Pixel Office Enhanced - TASK-058 & TASK-062
 * Agent Interactions + Weather/Time Display
 * 
 * Features:
 * - Standup mode: Agents gather at meeting table
 * - Coffee corner chats: Random agent conversations
 * - High-five animations when tasks complete
 * - Sleep/zzz animations when idle
 * - Emergency alert mode (all rush to stations)
 * - Real weather from Shanghai
 * - Day/night cycle based on actual time
 * - Rain/snow animations
 * - Clock display
 */

class PixelOfficeEnhanced {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.options = {
            location: options.location || { lat: 31.2304, lon: 121.4737, name: 'Shanghai' },
            weatherApiKey: options.weatherApiKey || null,
            enableWeather: options.enableWeather !== false,
            enableTime: options.enableTime !== false,
            ...options
        };
        
        // State
        this.agents = new Map();
        this.furniture = [];
        this.particles = [];
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        // Time/Weather state
        this.currentTime = new Date();
        this.weather = {
            condition: 'clear', // clear, rain, snow, clouds
            temperature: 22,
            isDay: true,
            lastUpdate: null
        };
        
        // Interaction modes
        this.mode = 'normal'; // normal, standup, emergency, coffee
        this.modeTimer = 0;
        
        // Animation loop
        this.lastTime = 0;
        this.running = false;
        
        // Meeting table position (center)
        this.meetingTable = { x: 0, y: 0 };
        
        // Coffee corner position
        this.coffeeCorner = { x: -8, y: 8 };
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.setupInteractions();
        this.startTimeUpdates();
        
        if (this.options.enableWeather) {
            this.fetchWeather();
            // Update weather every 10 minutes
            setInterval(() => this.fetchWeather(), 600000);
        }
        
        // Start random interactions
        this.startRandomInteractions();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 30;
        this.canvas.height = window.innerWidth < 768 ? 400 : 600;
    }
    
    setupInteractions() {
        // Mouse drag for panning
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.dragStart.x;
                const dy = e.clientY - this.dragStart.y;
                this.camera.x -= dx / this.camera.zoom;
                this.camera.y -= dy / this.camera.zoom;
                this.dragStart.x = e.clientX;
                this.dragStart.y = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Zoom with wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(factor, e.offsetX, e.offsetY);
        });
    }
    
    zoom(factor, centerX, centerY) {
        const newZoom = Math.max(0.5, Math.min(3, this.camera.zoom * factor));
        const zoomRatio = newZoom / this.camera.zoom;
        
        // Adjust camera to zoom toward center point
        this.camera.x = centerX - (centerX - this.camera.x) * zoomRatio;
        this.camera.y = centerY - (centerY - this.camera.y) * zoomRatio;
        this.camera.zoom = newZoom;
    }
    
    // ============================================
    // TIME & WEATHER
    // ============================================
    
    startTimeUpdates() {
        // Update time every second
        setInterval(() => {
            this.currentTime = new Date();
            this.updateDayNightCycle();
        }, 1000);
        
        this.updateDayNightCycle();
    }
    
    updateDayNightCycle() {
        const hour = this.currentTime.getHours();
        // Day: 6:00 - 18:00, Night: 18:00 - 6:00
        this.weather.isDay = hour >= 6 && hour < 18;
    }
    
    async fetchWeather() {
        try {
            // Using Open-Meteo API (free, no key required)
            const { lat, lon } = this.options.location;
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await response.json();
            
            if (data.current_weather) {
                const weatherCode = data.current_weather.weathercode;
                this.weather.temperature = data.current_weather.temperature;
                this.weather.condition = this.parseWeatherCode(weatherCode);
                this.weather.lastUpdate = new Date();
                
                console.log(`[Weather] ${this.options.location.name}: ${this.weather.condition}, ${this.weather.temperature}°C`);
            }
        } catch (error) {
            console.warn('Weather fetch failed:', error);
            // Fallback to clear weather
            this.weather.condition = 'clear';
        }
    }
    
    parseWeatherCode(code) {
        // WMO Weather interpretation codes
        if (code === 0) return 'clear';
        if (code >= 1 && code <= 3) return 'clouds';
        if (code >= 45 && code <= 48) return 'fog';
        if (code >= 51 && code <= 67) return 'rain';
        if (code >= 71 && code <= 77) return 'snow';
        if (code >= 80 && code <= 82) return 'rain';
        if (code >= 85 && code <= 86) return 'snow';
        if (code >= 95) return 'rain';
        return 'clear';
    }
    
    // ============================================
    // AGENT MANAGEMENT
    // ============================================
    
    addAgent(agentData) {
        const agent = {
            id: agentData.id,
            name: agentData.name,
            emoji: agentData.emoji,
            color: agentData.color,
            role: agentData.role,
            x: agentData.x || 0,
            y: agentData.y || 0,
            homeX: agentData.x || 0,
            homeY: agentData.y || 0,
            targetX: agentData.x || 0,
            targetY: agentData.y || 0,
            state: 'idle', // idle, walking, working, sleeping, talking
            stateTimer: 0,
            direction: 'down',
            frame: 0,
            frameTimer: 0,
            sleepTimer: 0,
            speechBubble: null,
            speechTimer: 0,
            activity: agentData.activity || 'idle',
            zzz: [], // Sleep particles
            highFiveTarget: null,
            ...agentData
        };
        
        this.agents.set(agent.id, agent);
        return agent;
    }
    
    addFurniture(type, x, y, width = 2, height = 2) {
        this.furniture.push({ type, x, y, width, height });
    }
    
    // ============================================
    // INTERACTION MODES
    // ============================================
    
    startStandup() {
        this.mode = 'standup';
        this.modeTimer = 30000; // 30 seconds
        
        // All agents move to meeting table
        const positions = this.getCirclePositions(this.meetingTable.x, this.meetingTable.y, 4, this.agents.size);
        let i = 0;
        
        for (const agent of this.agents.values()) {
            const pos = positions[i++];
            this.moveAgent(agent.id, pos.x, pos.y);
            agent.state = 'walking';
        }
        
        this.addActivity('📢', 'Nexus', 'Daily standup started!', 'system');
    }
    
    endStandup() {
        this.mode = 'normal';
        
        // Return agents to their positions
        for (const agent of this.agents.values()) {
            this.moveAgent(agent.id, agent.homeX, agent.homeY);
        }
        
        this.addActivity('📢', 'Nexus', 'Standup complete. Back to work!', 'system');
    }
    
    startCoffeeChat() {
        if (this.mode !== 'normal') return;
        
        this.mode = 'coffee';
        this.modeTimer = 15000; // 15 seconds
        
        // Pick 2-4 random agents for coffee chat
        const agents = Array.from(this.agents.values());
        const chatSize = Math.min(agents.length, 2 + Math.floor(Math.random() * 3));
        const shuffled = agents.sort(() => 0.5 - Math.random()).slice(0, chatSize);
        
        // Position them around coffee corner
        const positions = this.getCirclePositions(this.coffeeCorner.x, this.coffeeCorner.y, 2, chatSize);
        
        shuffled.forEach((agent, i) => {
            this.moveAgent(agent.id, positions[i].x, positions[i].y);
            agent.chatGroup = shuffled.map(a => a.id);
        });
        
        // Random conversation topics
        const topics = [
            'Did you see the new feature?',
            'Coffee break! ☕',
            'Weekend plans?',
            'That bug was tricky...',
            'Lunch? 🍜'
        ];
        
        setTimeout(() => {
            shuffled.forEach(agent => {
                if (Math.random() > 0.5) {
                    this.showSpeech(agent.id, topics[Math.floor(Math.random() * topics.length)]);
                }
            });
        }, 2000);
        
        this.addActivity('☕', 'System', `${chatSize} agents chatting at coffee corner`, 'social');
    }
    
    endCoffeeChat() {
        this.mode = 'normal';
        
        for (const agent of this.agents.values()) {
            agent.chatGroup = null;
            this.moveAgent(agent.id, agent.homeX, agent.homeY);
        }
    }
    
    triggerHighFive(agentId1, agentId2) {
        const agent1 = this.agents.get(agentId1);
        const agent2 = this.agents.get(agentId2);
        
        if (!agent1 || !agent2) return;
        
        // Move agents toward each other
        const midX = (agent1.x + agent2.x) / 2;
        const midY = (agent1.y + agent2.y) / 2;
        
        this.moveAgent(agentId1, midX - 0.5, midY);
        this.moveAgent(agentId2, midX + 0.5, midY);
        
        agent1.highFiveTarget = agentId2;
        agent2.highFiveTarget = agentId1;
        
        // Show celebration
        setTimeout(() => {
            this.showSpeech(agentId1, '🙌 High five!');
            this.showSpeech(agentId2, '🙌 Yeah!');
            this.createConfetti(midX, midY);
            
            setTimeout(() => {
                agent1.highFiveTarget = null;
                agent2.highFiveTarget = null;
            }, 2000);
        }, 1000);
        
        this.addActivity('🙌', 'System', `${agent1.name} and ${agent2.name} high-fived!`, 'celebration');
    }
    
    triggerEmergencyAlert() {
        this.mode = 'emergency';
        this.modeTimer = 20000; // 20 seconds
        
        // All agents rush to their stations
        for (const agent of this.agents.values()) {
            this.moveAgent(agent.id, agent.homeX, agent.homeY);
            agent.state = 'working';
            
            // Flash red status
            agent.emergencyMode = true;
        }
        
        this.addActivity('🚨', 'Nexus', 'EMERGENCY ALERT! All agents to stations!', 'urgent');
        
        // End emergency after timer
        setTimeout(() => {
            this.endEmergencyAlert();
        }, this.modeTimer);
    }
    
    endEmergencyAlert() {
        this.mode = 'normal';
        
        for (const agent of this.agents.values()) {
            agent.emergencyMode = false;
            agent.state = 'idle';
        }
        
        this.addActivity('✅', 'Nexus', 'Emergency resolved. Stand down.', 'system');
    }
    
    // ============================================
    // AGENT MOVEMENT & STATES
    // ============================================
    
    moveAgent(agentId, targetX, targetY) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.targetX = targetX;
        agent.targetY = targetY;
        agent.state = 'walking';
        
        // Determine direction
        const dx = targetX - agent.x;
        const dy = targetY - agent.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            agent.direction = dx > 0 ? 'right' : 'left';
        } else {
            agent.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    updateAgents(dt) {
        for (const agent of this.agents.values()) {
            // Animation frame
            agent.frameTimer += dt;
            if (agent.frameTimer > 150) {
                agent.frameTimer = 0;
                agent.frame = (agent.frame + 1) % 4;
            }
            
            // State updates
            switch (agent.state) {
                case 'walking':
                    this.updateWalking(agent, dt);
                    break;
                case 'idle':
                    this.updateIdle(agent, dt);
                    break;
                case 'sleeping':
                    this.updateSleeping(agent, dt);
                    break;
                case 'talking':
                    this.updateTalking(agent, dt);
                    break;
            }
            
            // Speech bubble timer
            if (agent.speechTimer > 0) {
                agent.speechTimer -= dt;
                if (agent.speechTimer <= 0) {
                    agent.speechBubble = null;
                }
            }
            
            // Update sleep particles
            if (agent.state === 'sleeping') {
                this.updateSleepParticles(agent, dt);
            }
        }
        
        // Mode timer
        if (this.modeTimer > 0) {
            this.modeTimer -= dt;
            if (this.modeTimer <= 0) {
                if (this.mode === 'standup') this.endStandup();
                else if (this.mode === 'coffee') this.endCoffeeChat();
            }
        }
    }
    
    updateWalking(agent, dt) {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 0.003 * dt; // Units per ms
        
        if (dist < 0.1) {
            agent.x = agent.targetX;
            agent.y = agent.targetY;
            agent.state = 'idle';
        } else {
            agent.x += (dx / dist) * Math.min(speed, dist);
            agent.y += (dy / dist) * Math.min(speed, dist);
        }
    }
    
    updateIdle(agent, dt) {
        // Chance to fall asleep if idle too long
        agent.sleepTimer += dt;
        
        // Fall asleep after 10 seconds of idle
        if (agent.sleepTimer > 10000 && Math.random() < 0.001) {
            agent.state = 'sleeping';
            agent.sleepTimer = 0;
        }
    }
    
    updateSleeping(agent, dt) {
        // Wake up randomly or if there's activity
        if (Math.random() < 0.0005) {
            agent.state = 'idle';
            agent.sleepTimer = 0;
        }
    }
    
    updateTalking(agent, dt) {
        // Look at chat partner
        if (agent.chatGroup) {
            // Simple animation
        }
    }
    
    updateSleepParticles(agent, dt) {
        // Spawn new zzz particles
        if (Math.random() < 0.02) {
            agent.zzz.push({
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1
            });
        }
        
        // Update existing particles
        agent.zzz = agent.zzz.filter(z => {
            z.y -= 0.02 * dt;
            z.x += Math.sin(z.y * 0.1) * 0.01 * dt;
            z.opacity -= 0.001 * dt;
            z.scale += 0.001 * dt;
            return z.opacity > 0;
        });
    }
    
    showSpeech(agentId, text) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.speechBubble = text;
        agent.speechTimer = 3000;
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    toScreen(x, y, z = 0) {
        const isoX = (x - y) * 32;
        const isoY = (x + y) * 16 - z * 16;
        return {
            x: (isoX - this.camera.x) * this.camera.zoom + this.canvas.width / 2,
            y: (isoY - this.camera.y) * this.camera.zoom + this.canvas.height / 3
        };
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear and background
        this.renderBackground(ctx);
        
        // Weather effects (behind everything)
        if (this.weather.condition === 'rain' || this.weather.condition === 'snow') {
            this.renderWeather(ctx);
        }
        
        // Floor
        this.renderFloor(ctx);
        
        // Sort and render entities by depth
        const entities = [
            ...this.furniture.map(f => ({ ...f, type: 'furniture' })),
            ...Array.from(this.agents.values()).map(a => ({ ...a, type: 'agent' }))
        ].sort((a, b) => (a.y + a.x) - (b.y + b.x));
        
        for (const entity of entities) {
            if (entity.type === 'furniture') {
                this.renderFurniture(ctx, entity);
            } else {
                this.renderAgent(ctx, entity);
            }
        }
        
        // UI overlays
        this.renderUI(ctx);
        
        // Weather overlay (tint)
        this.renderWeatherOverlay(ctx);
    }
    
    renderBackground(ctx) {
        // Sky gradient based on time
        let gradient;
        const hour = this.currentTime.getHours();
        
        if (this.weather.isDay) {
            if (this.weather.condition === 'rain') {
                gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#4a5568');
                gradient.addColorStop(1, '#718096');
            } else {
                gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#E0F6FF');
            }
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#1a202c');
            gradient.addColorStop(1, '#2d3748');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Window frame
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
        
        // Window panes
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 10);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height - 10);
        ctx.moveTo(10, this.canvas.height / 2);
        ctx.lineTo(this.canvas.width - 10, this.canvas.height / 2);
        ctx.stroke();
    }
    
    renderFloor(ctx) {
        const tileSize = 32 * this.camera.zoom;
        const rows = 20;
        const cols = 20;
        
        for (let x = -rows/2; x < rows/2; x++) {
            for (let y = -cols/2; y < cols/2; y++) {
                const pos = this.toScreen(x, y);
                
                // Check if visible
                if (pos.x < -tileSize || pos.x > this.canvas.width + tileSize ||
                    pos.y < -tileSize || pos.y > this.canvas.height + tileSize) {
                    continue;
                }
                
                // Floor tile color
                const isEven = (x + y) % 2 === 0;
                ctx.fillStyle = isEven ? '#d4c4a8' : '#c4b498';
                
                // Darken at night
                if (!this.weather.isDay) {
                    ctx.fillStyle = isEven ? '#8b7355' : '#7a6548';
                }
                
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x + tileSize, pos.y + tileSize/2);
                ctx.lineTo(pos.x, pos.y + tileSize);
                ctx.lineTo(pos.x - tileSize, pos.y + tileSize/2);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    renderFurniture(ctx, furniture) {
        const pos = this.toScreen(furniture.x, furniture.y);
        const size = 32 * this.camera.zoom;
        
        // Simple furniture rendering
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(pos.x - size/2, pos.y - size, size, size);
        
        // Furniture type indicator
        ctx.fillStyle = '#fff';
        ctx.font = `${size/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const icons = {
            'desk': '🪑',
            'chair': '🪑',
            'computer': '💻',
            'plant': '🪴',
            'meeting_table': '📋',
            'coffee_machine': '☕'
        };
        
        ctx.fillText(icons[furniture.type] || '📦', pos.x, pos.y - size/2);
    }
    
    renderAgent(ctx, agent) {
        const pos = this.toScreen(agent.x, agent.y);
        const size = 24 * this.camera.zoom;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, size/2, size/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Agent body (simple circle for now)
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Emoji
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(agent.emoji, pos.x, pos.y - size/2);
        
        // State indicators
        if (agent.state === 'sleeping') {
            this.renderSleepIndicator(ctx, agent, pos, size);
        }
        
        if (agent.emergencyMode) {
            // Red flashing border
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y - size/2, size/2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Speech bubble
        if (agent.speechBubble) {
            this.renderSpeechBubble(ctx, agent, pos, size);
        }
        
        // Name label
        ctx.fillStyle = '#333';
        ctx.font = `bold ${size/3}px sans-serif`;
        ctx.fillText(agent.name, pos.x, pos.y + size/3);
        
        // Status dot
        const statusColors = {
            'idle': '#888',
            'working': '#4caf50',
            'busy': '#ff9800',
            'sleeping': '#9c27b0'
        };
        ctx.fillStyle = statusColors[agent.state] || '#888';
        ctx.beginPath();
        ctx.arc(pos.x + size/2, pos.y - size, size/6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSleepIndicator(ctx, agent, pos, size) {
        // Render zzz particles
        ctx.fillStyle = '#9c27b0';
        ctx.font = `${size/2}px sans-serif`;
        
        agent.zzz.forEach(z => {
            ctx.globalAlpha = z.opacity;
            ctx.fillText('z', pos.x + z.x * size, pos.y - size - z.y * size);
        });
        
        ctx.globalAlpha = 1;
    }
    
    renderSpeechBubble(ctx, agent, pos, size) {
        const bubbleWidth = 100 * this.camera.zoom;
        const bubbleHeight = 30 * this.camera.zoom;
        const bubbleX = pos.x;
        const bubbleY = pos.y - size * 1.5;
        
        // Bubble background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight, 8);
        ctx.fill();
        ctx.stroke();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(bubbleX - 5, bubbleY + bubbleHeight/2);
        ctx.lineTo(bubbleX, bubbleY + bubbleHeight/2 + 8);
        ctx.lineTo(bubbleX + 5, bubbleY + bubbleHeight/2);
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.fillStyle = '#333';
        ctx.font = `${size/3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = agent.speechBubble.length > 20 
            ? agent.speechBubble.substring(0, 20) + '...'
            : agent.speechBubble;
        ctx.fillText(text, bubbleX, bubbleY);
    }
    
    renderUI(ctx) {
        // Clock
        const timeStr = this.currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.canvas.width - 120, 20, 100, 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, this.canvas.width - 70, 47);
        
        // Weather info
        if (this.weather.lastUpdate) {
            const weatherIcon = {
                'clear': this.weather.isDay ? '☀️' : '🌙',
                'clouds': '☁️',
                'rain': '🌧️',
                'snow': '❄️',
                'fog': '🌫️'
            }[this.weather.condition] || '☀️';
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(20, 20, 100, 40);
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${weatherIcon} ${this.weather.temperature}°C`, 70, 47);
        }
        
        // Mode indicator
        if (this.mode !== 'normal') {
            const modeLabels = {
                'standup': '📢 STANDUP',
                'coffee': '☕ COFFEE BREAK',
                'emergency': '🚨 EMERGENCY'
            };
            
            ctx.fillStyle = this.mode === 'emergency' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.canvas.width/2 - 80, 20, 160, 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(modeLabels[this.mode], this.canvas.width/2, 40);
        }
        
        // Location
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, this.canvas.height - 40, 120, 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 ${this.options.location.name}`, 80, this.canvas.height - 20);
    }
    
    renderWeather(ctx) {
        // Update particles
        this.updateWeatherParticles();
        
        // Render particles
        ctx.fillStyle = this.weather.condition === 'rain' ? 'rgba(150, 150, 200, 0.6)' : 'rgba(255, 255, 255, 0.8)';
        
        this.particles.forEach(p => {
            ctx.beginPath();
            if (this.weather.condition === 'rain') {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - 2, p.y + 10);
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    updateWeatherParticles() {
        // Spawn new particles
        const spawnRate = this.weather.condition === 'rain' ? 5 : 2;
        for (let i = 0; i < spawnRate; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                speedY: this.weather.condition === 'rain' ? 8 + Math.random() * 4 : 1 + Math.random() * 2,
                speedX: this.weather.condition === 'rain' ? -1 + Math.random() * 2 : -0.5 + Math.random(),
                size: this.weather.condition === 'rain' ? 2 : 2 + Math.random() * 3
            });
        }
        
        // Update existing particles
        this.particles = this.particles.filter(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            return p.y < this.canvas.height;
        });
    }
    
    renderWeatherOverlay(ctx) {
        // Night overlay
        if (!this.weather.isDay) {
            ctx.fillStyle = 'rgba(0, 0, 40, 0.4)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Rain/snow darkness
        if (this.weather.condition === 'rain' || this.weather.condition === 'snow') {
            ctx.fillStyle = 'rgba(100, 100, 120, 0.2)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    createConfetti(x, y) {
        // Add celebration particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x * 32 + this.canvas.width / 2,
                y: y * 16 + this.canvas.height / 3,
                speedY: -2 - Math.random() * 4,
                speedX: -2 + Math.random() * 4,
                size: 3 + Math.random() * 3,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                isConfetti: true,
                life: 100
            });
        }
    }
    
    // ============================================
    // UTILITIES
    // ============================================
    
    getCirclePositions(centerX, centerY, radius, count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            positions.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
        return positions;
    }
    
    startRandomInteractions() {
        // Random coffee chats
        setInterval(() => {
            if (this.mode === 'normal' && Math.random() < 0.3) {
                this.startCoffeeChat();
            }
        }, 30000);
        
        // Random high-fives when tasks complete
        setInterval(() => {
            if (this.mode === 'normal' && Math.random() < 0.2) {
                const agents = Array.from(this.agents.keys());
                if (agents.length >= 2) {
                    const idx1 = Math.floor(Math.random() * agents.length);
                    let idx2 = Math.floor(Math.random() * agents.length);
                    while (idx2 === idx1) idx2 = Math.floor(Math.random() * agents.length);
                    this.triggerHighFive(agents[idx1], agents[idx2]);
                }
            }
        }, 20000);
    }
    
    // ============================================
    // MAIN LOOP
    // ============================================
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }
    
    stop() {
        this.running = false;
    }
    
    loop() {
        if (!this.running) return;
        
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.updateAgents(dt);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
    
    // ============================================
    // ACTIVITY LOG
    // ============================================
    
    addActivity(emoji, agent, action, type = 'agent') {
        // This would integrate with the activity log panel
        const event = new CustomEvent('pixel-office-activity', {
            detail: { emoji, agent, action, type, time: new Date() }
        });
        document.dispatchEvent(event);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelOfficeEnhanced;
}
