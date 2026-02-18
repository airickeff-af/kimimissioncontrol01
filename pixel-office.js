/**
 * Pixel Office Animation System - TASK-092
 * Kairosoft-style pixel art agent animations
 * 
 * Features:
 * - 4-frame walking animations (4 directions)
 * - Idle animations (breathing, blinking)
 * - Dynamic shadows
 * - Screen glow effects
 * - Smooth position transitions
 */

class PixelOffice {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.agents = new Map();
        this.animationFrame = null;
        this.lastTime = 0;
        
        // Agent definitions with colors and symbols
        this.agentTypes = {
            nexus: { color: '#ff2a6d', symbol: '◈', name: 'Nexus' },
            glasses: { color: '#00d4ff', symbol: '🔍', name: 'Glasses' },
            quill: { color: '#fbbf24', symbol: '✍️', name: 'Quill' },
            pixel: { color: '#a855f7', symbol: '🎨', name: 'Pixel' },
            gary: { color: '#f97316', symbol: '📢', name: 'Gary' },
            larry: { color: '#06b6d4', symbol: '📱', name: 'Larry' },
            sentry: { color: '#22c55e', symbol: '⚙️', name: 'Sentry' },
            audit: { color: '#8b5cf6', symbol: '✅', name: 'Audit' },
            cipher: { color: '#6366f1', symbol: '🔒', name: 'Cipher' }
        };
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.createFloor();
        this.spawnAgents();
        this.startAnimationLoop();
        
        // Add periodic direction changes for demo
        setInterval(() => this.randomizeDirections(), 5000);
        setInterval(() => this.randomizeStates(), 8000);
    }
    
    createCanvas() {
        this.canvas = document.createElement('div');
        this.canvas.id = 'pixel-office-canvas';
        this.canvas.style.cssText = `
            width: 100%;
            height: 400px;
            background: linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 100%);
            border: 4px solid #8b7355;
            box-shadow: 4px 4px 0 #8b7355;
            position: relative;
            overflow: hidden;
            image-rendering: pixelated;
            margin-bottom: 2rem;
        `;
        this.container.insertBefore(this.canvas, this.container.firstChild);
        
        // Add time overlay
        this.timeOverlay = document.createElement('div');
        this.timeOverlay.className = 'time-overlay afternoon';
        this.canvas.appendChild(this.timeOverlay);
        
        // Add command balcony
        this.createCommandBalcony();
        
        // Add furniture
        this.createFurniture();
    }
    
    createCommandBalcony() {
        const balcony = document.createElement('div');
        balcony.className = 'command-balcony';
        this.canvas.appendChild(balcony);
    }
    
    createFurniture() {
        // Create desks at workstation positions
        const deskPositions = [
            { x: 20, y: 45 }, { x: 35, y: 45 }, { x: 50, y: 45 },
            { x: 65, y: 45 }, { x: 80, y: 45 },
            { x: 20, y: 70 }, { x: 50, y: 70 }, { x: 80, y: 70 }
        ];
        
        deskPositions.forEach(pos => {
            const desk = document.createElement('div');
            desk.className = 'furniture-desk';
            desk.style.left = `${pos.x}%`;
            desk.style.top = `${pos.y}%`;
            desk.style.transform = 'translate(-50%, -50%)';
            this.canvas.appendChild(desk);
        });
        
        // Create meeting table in center
        const table = document.createElement('div');
        table.className = 'furniture-table';
        table.id = 'meeting-table';
        table.style.left = '50%';
        table.style.top = '55%';
        table.style.transform = 'translate(-50%, -50%)';
        table.style.display = 'none';
        this.canvas.appendChild(table);
        
        // Create plants
        const plantPositions = [
            { x: 10, y: 30 }, { x: 90, y: 30 },
            { x: 10, y: 85 }, { x: 90, y: 85 }
        ];
        
        plantPositions.forEach(pos => {
            const plant = document.createElement('div');
            plant.className = 'furniture-plant';
            plant.style.left = `${pos.x}%`;
            plant.style.top = `${pos.y}%`;
            plant.style.transform = 'translate(-50%, -50%)';
            this.canvas.appendChild(plant);
        });
    }
    
    createFloor() {
        const floor = document.createElement('div');
        floor.className = 'iso-floor';
        floor.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(30deg, transparent 49%, rgba(139,115,85,0.1) 50%, transparent 51%),
                linear-gradient(-30deg, transparent 49%, rgba(139,115,85,0.1) 50%, transparent 51%);
            background-size: 60px 34px;
            pointer-events: none;
        `;
        this.canvas.appendChild(floor);
    }
    
    spawnAgents() {
        // Office layout positions (percentage-based)
        const positions = [
            { id: 'nexus', x: 50, y: 30, type: 'nexus' },
            { id: 'glasses', x: 20, y: 50, type: 'glasses' },
            { id: 'quill', x: 35, y: 50, type: 'quill' },
            { id: 'pixel', x: 50, y: 50, type: 'pixel' },
            { id: 'gary', x: 65, y: 50, type: 'gary' },
            { id: 'larry', x: 80, y: 50, type: 'larry' },
            { id: 'sentry', x: 20, y: 75, type: 'sentry' },
            { id: 'audit', x: 50, y: 75, type: 'audit' },
            { id: 'cipher', x: 80, y: 75, type: 'cipher' }
        ];
        
        positions.forEach(pos => {
            this.createAgent(pos);
        });
    }
    
    createAgent(config) {
        const agent = document.createElement('div');
        agent.className = `pixel-agent sprite-${config.type} idle dir-down`;
        agent.id = `agent-${config.id}`;
        agent.style.left = `${config.x}%`;
        agent.style.top = `${config.y}%`;
        agent.style.transform = 'translate(-50%, -50%)';
        
        // Add shadow
        const shadow = document.createElement('div');
        shadow.className = 'agent-shadow';
        agent.appendChild(shadow);
        
        // Add label
        const label = document.createElement('div');
        label.className = 'agent-label';
        label.textContent = this.agentTypes[config.type].name;
        label.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Press Start 2P', cursive;
            font-size: 8px;
            color: #3d3225;
            white-space: nowrap;
            text-shadow: 1px 1px 0 #fff8e7;
            pointer-events: none;
        `;
        agent.appendChild(label);
        
        this.canvas.appendChild(agent);
        
        // Store agent state
        this.agents.set(config.id, {
            element: agent,
            type: config.type,
            x: config.x,
            y: config.y,
            state: 'idle',
            direction: 'down',
            targetX: config.x,
            targetY: config.y,
            walkProgress: 0
        });
        
        // Add click interaction
        agent.addEventListener('click', () => this.onAgentClick(config.id));
    }
    
    onAgentClick(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        // Toggle state
        const states = ['idle', 'walking', 'working'];
        const currentIndex = states.indexOf(agent.state);
        const nextState = states[(currentIndex + 1) % states.length];
        
        this.setAgentState(agentId, nextState);
        
        // Show feedback
        this.showAgentFeedback(agentId, nextState);
    }
    
    showAgentFeedback(agentId, state) {
        const agent = this.agents.get(agentId);
        const feedback = document.createElement('div');
        feedback.textContent = state.toUpperCase();
        feedback.style.cssText = `
            position: absolute;
            left: ${agent.x}%;
            top: ${agent.y - 15}%;
            transform: translate(-50%, -50%);
            font-family: 'Press Start 2P', cursive;
            font-size: 8px;
            color: ${this.agentTypes[agent.type].color};
            text-shadow: 1px 1px 0 #000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
            z-index: 100;
        `;
        
        // Add float animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatUp {
                0% { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -150%); }
            }
        `;
        document.head.appendChild(style);
        
        this.canvas.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }
    
    setAgentState(agentId, state) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.state = state;
        agent.element.className = `pixel-agent sprite-${agent.type} ${state} dir-${agent.direction}`;
    }
    
    setAgentDirection(agentId, direction) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.direction = direction;
        agent.element.className = `pixel-agent sprite-${agent.type} ${agent.state} dir-${direction}`;
    }
    
    moveAgent(agentId, targetX, targetY) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.targetX = targetX;
        agent.targetY = targetY;
        agent.walkProgress = 0;
        
        // Calculate direction
        const dx = targetX - agent.x;
        const dy = targetY - agent.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.setAgentDirection(agentId, dx > 0 ? 'right' : 'left');
        } else {
            this.setAgentDirection(agentId, dy > 0 ? 'down' : 'up');
        }
        
        this.setAgentState(agentId, 'walking');
    }
    
    randomizeDirections() {
        const directions = ['down', 'up', 'left', 'right'];
        this.agents.forEach((agent, id) => {
            if (agent.state === 'idle') {
                const randomDir = directions[Math.floor(Math.random() * directions.length)];
                this.setAgentDirection(id, randomDir);
            }
        });
    }
    
    randomizeStates() {
        const states = ['idle', 'walking', 'working'];
        this.agents.forEach((agent, id) => {
            if (Math.random() > 0.7) {
                const randomState = states[Math.floor(Math.random() * states.length)];
                this.setAgentState(id, randomState);
                
                // If walking, move to random position
                if (randomState === 'walking') {
                    const newX = 15 + Math.random() * 70;
                    const newY = 25 + Math.random() * 50;
                    this.moveAgent(id, newX, newY);
                }
            }
        });
    }
    
    update(deltaTime) {
        // Update agent positions
        this.agents.forEach((agent, id) => {
            if (agent.state === 'walking') {
                // Interpolate position
                const speed = 0.05; // 5% per frame
                const dx = agent.targetX - agent.x;
                const dy = agent.targetY - agent.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 1) {
                    // Arrived
                    agent.x = agent.targetX;
                    agent.y = agent.targetY;
                    this.setAgentState(id, 'idle');
                } else {
                    // Move toward target
                    agent.x += dx * speed;
                    agent.y += dy * speed;
                }
                
                // Update DOM
                agent.element.style.left = `${agent.x}%`;
                agent.element.style.top = `${agent.y}%`;
            }
        });
    }
    
    startAnimationLoop() {
        const loop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.animationFrame = requestAnimationFrame(loop);
        };
        
        this.animationFrame = requestAnimationFrame(loop);
    }
    
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    // Public API for external control
    getAgentState(agentId) {
        return this.agents.get(agentId);
    }
    
    getAllAgents() {
        return Array.from(this.agents.entries());
    }
    
    setAllAgentsState(state) {
        this.agents.forEach((agent, id) => {
            this.setAgentState(id, state);
        });
    }
    
    // Meeting mode - all agents gather in center
    startMeeting() {
        this.agents.forEach((agent, id) => {
            this.moveAgent(id, 50, 50);
        });
    }
    
    // Return to workstations
    returnToWorkstations() {
        const workstations = {
            nexus: { x: 50, y: 30 },
            glasses: { x: 20, y: 50 },
            quill: { x: 35, y: 50 },
            pixel: { x: 50, y: 50 },
            gary: { x: 65, y: 50 },
            larry: { x: 80, y: 50 },
            sentry: { x: 20, y: 75 },
            audit: { x: 50, y: 75 },
            cipher: { x: 80, y: 75 }
        };
        
        this.agents.forEach((agent, id) => {
            const station = workstations[agent.type];
            if (station) {
                this.moveAgent(id, station.x, station.y);
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Find the main content area
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        window.pixelOffice = new PixelOffice(mainContent.id || 'main-content');
        console.log('[Pixel Office] Animation system initialized');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelOffice;
}
