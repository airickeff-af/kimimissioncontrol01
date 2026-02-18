/**
 * Pixel Office Sprite System
 * Loads and animates 22 agent sprites with 8-frame animations
 * For: TASK-092 Pixel Office
 */

class SpriteLoader {
    constructor(basePath = 'assets/sprites/') {
        this.basePath = basePath;
        this.sprites = new Map();
        this.metadata = null;
        this.loaded = false;
    }

    async load() {
        // Load metadata
        const response = await fetch(`${this.basePath}sprite_metadata.json`);
        this.metadata = await response.json();
        
        // Load all agent sprite sheets
        const loadPromises = Object.keys(this.metadata.agents).map(agentId => 
            this.loadAgentSheet(agentId)
        );
        
        // Load furniture and effects
        loadPromises.push(this.loadFurniture());
        loadPromises.push(this.loadEffects());
        
        await Promise.all(loadPromises);
        this.loaded = true;
        console.log('SpriteLoader: All sprites loaded');
    }

    loadAgentSheet(agentId) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(agentId, {
                    image: img,
                    type: 'agent',
                    row: this.metadata.agents[agentId].row
                });
                resolve();
            };
            img.onerror = reject;
            img.src = `${this.basePath}${agentId}_sheet.png`;
        });
    }

    loadFurniture() {
        const furniture = ['desk', 'chair', 'computer', 'plant', 'commander_desk', 'nexus'];
        return Promise.all(furniture.map(type => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.sprites.set(`furniture_${type}`, { image: img, type: 'furniture' });
                    resolve();
                };
                img.onerror = reject;
                img.src = `${this.basePath}furniture_${type}.png`;
            });
        }));
    }

    loadEffects() {
        const effects = ['shadow', 'speech', 'selection'];
        const statuses = ['idle', 'working', 'busy', 'error'];
        
        return Promise.all([
            ...effects.map(type => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        this.sprites.set(`effect_${type}`, { image: img, type: 'effect' });
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = `${this.basePath}effect_${type}.png`;
                });
            }),
            ...statuses.map(status => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        this.sprites.set(`status_${status}`, { image: img, type: 'status' });
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = `${this.basePath}status_${status}.png`;
                });
            })
        ]);
    }

    getSprite(agentId, animation, frame) {
        const sprite = this.sprites.get(agentId);
        if (!sprite) return null;

        const animIndex = this.metadata.animations[animation] || 0;
        const framesPerAnim = this.metadata.frames_per_animation;
        const spriteSize = this.metadata.sprite_size;
        
        const x = (animIndex * framesPerAnim + (frame % framesPerAnim)) * spriteSize;
        const y = sprite.row * spriteSize;

        return {
            image: sprite.image,
            sx: x,
            sy: y,
            sw: spriteSize,
            sh: spriteSize
        };
    }

    getFurniture(type) {
        return this.sprites.get(`furniture_${type}`);
    }

    getEffect(type) {
        return this.sprites.get(`effect_${type}`);
    }

    getStatus(status) {
        return this.sprites.get(`status_${status}`);
    }
}

class AnimatedAgent {
    constructor(agentId, name, x, y, config = {}) {
        this.id = agentId;
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = 0;
        
        // Animation state
        this.animation = 'idle';
        this.frame = 0;
        this.frameTimer = 0;
        this.frameDuration = config.frameDuration || 150; // ms per frame
        
        // Movement
        this.targetX = x;
        this.targetY = y;
        this.speed = config.speed || 2;
        this.direction = 'down';
        
        // Activity
        this.activity = 'idle';
        this.activityData = {};
        this.progress = 0;
        
        // Visual
        this.speechBubble = null;
        this.speechTimer = 0;
        this.selected = false;
        this.scale = config.scale || 1;
        
        // Status
        this.status = 'idle';
    }

    update(dt) {
        // Animation
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameDuration) {
            this.frameTimer = 0;
            this.frame = (this.frame + 1) % 8;
        }
        
        // Movement
        if (this.activity === 'walking') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 0.1) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.setActivity('idle');
            } else {
                const moveDist = Math.min(this.speed * dt * 0.01, dist);
                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
                
                // Update direction
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.direction = dx > 0 ? 'right' : 'left';
                } else {
                    this.direction = dy > 0 ? 'down' : 'up';
                }
            }
        }
        
        // Speech bubble timer
        if (this.speechTimer > 0) {
            this.speechTimer -= dt;
            if (this.speechTimer <= 0) {
                this.speechBubble = null;
            }
        }
        
        // Progress animation
        if (this.activity === 'working') {
            this.progress = (this.progress + dt * 0.0002) % 1;
        }
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.setActivity('walking');
    }

    say(text, duration = 3000) {
        this.speechBubble = text;
        this.speechTimer = duration;
    }

    setActivity(activity, data = {}) {
        this.activity = activity;
        this.activityData = data;
        
        // Map activity to animation
        const animMap = {
            'idle': 'idle',
            'walking': `walk_${this.direction}`,
            'working': 'typing',
            'talking': 'talking',
            'auditing': 'idle'
        };
        
        this.animation = animMap[activity] || 'idle';
        
        // Update status
        if (activity === 'working') this.status = 'working';
        else if (activity === 'walking') this.status = 'busy';
        else this.status = 'idle';
    }

    render(ctx, spriteLoader, isoMath, camera, offsetX = 0, offsetY = 0) {
        // Get screen position
        const screenPos = isoMath.toScreen(this.x, this.y, this.z);
        const finalX = screenPos.x + offsetX;
        const finalY = screenPos.y + offsetY;
        
        // Apply camera
        const camX = (finalX - camera.x) * camera.zoom;
        const camY = (finalY - camera.y) * camera.zoom;
        
        // Get sprite
        const sprite = spriteLoader.getSprite(this.id, this.animation, this.frame);
        if (!sprite) return;
        
        const size = spriteLoader.metadata.sprite_size * camera.zoom * this.scale;
        
        // Draw shadow
        const shadow = spriteLoader.getEffect('shadow');
        if (shadow) {
            ctx.drawImage(shadow.image, camX - size/2, camY - size/4, size, size/2);
        }
        
        // Draw selection ring if selected
        if (this.selected) {
            const selection = spriteLoader.getEffect('selection');
            if (selection) {
                ctx.drawImage(selection.image, camX - size/2, camY - size, size, size);
            }
        }
        
        // Draw agent sprite
        ctx.drawImage(
            sprite.image,
            sprite.sx, sprite.sy, sprite.sw, sprite.sh,
            camX - size/2, camY - size, size, size
        );
        
        // Draw speech bubble
        if (this.speechBubble) {
            this.renderSpeechBubble(ctx, spriteLoader, camX, camY - size, camera.zoom);
        }
        
        // Draw activity bar
        this.renderActivityBar(ctx, spriteLoader, camX, camY, camera.zoom);
    }

    renderSpeechBubble(ctx, spriteLoader, x, y, zoom) {
        const bubble = spriteLoader.getEffect('speech');
        if (!bubble) return;
        
        const width = 80 * zoom;
        const height = 40 * zoom;
        
        ctx.drawImage(bubble.image, x - width/2, y - height - 10, width, height);
        
        // Draw text
        ctx.font = `${10 * zoom}px monospace`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        const text = this.speechBubble.length > 20 
            ? this.speechBubble.substring(0, 20) + '...' 
            : this.speechBubble;
        ctx.fillText(text, x, y - height/2);
    }

    renderActivityBar(ctx, spriteLoader, x, y, zoom) {
        const barWidth = 50 * zoom;
        const barHeight = 12 * zoom;
        const barX = x - barWidth / 2;
        const barY = y + 5;
        
        // Background
        ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Status icon
        const status = spriteLoader.getStatus(this.status);
        if (status) {
            ctx.drawImage(status.image, barX + 2, barY + 2, 8 * zoom, 8 * zoom);
        }
        
        // Status text
        ctx.font = `${8 * zoom}px monospace`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        const statusText = this.getStatusText();
        ctx.fillText(statusText.substring(0, 12), barX + 12, barY + 9);
        
        // Progress bar if working
        if (this.activity === 'working') {
            const progWidth = (barWidth - 4) * this.progress;
            ctx.fillStyle = '#64c864';
            ctx.fillRect(barX + 2, barY + barHeight - 4, progWidth, 3);
        }
    }

    getStatusText() {
        const texts = {
            'idle': 'Idle',
            'walking': 'Walking',
            'working': this.activityData.task || 'Working',
            'talking': 'Talking',
            'auditing': 'Auditing'
        };
        return texts[this.activity] || 'Unknown';
    }
}

class OfficeRenderer {
    constructor(canvas, spriteLoader) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spriteLoader = spriteLoader;
        
        this.agents = new Map();
        this.furniture = [];
        this.camera = { x: 0, y: 0, zoom: 1 };
        
        this.isoMath = {
            toScreen: (x, y, z) => ({
                x: (x - y) * 32 + this.canvas.width / 2,
                y: (x + y) * 16 - z * 16 + this.canvas.height / 3
            })
        };
        
        this.lastTime = 0;
        this.running = false;
    }

    addAgent(agentId, name, x, y, config = {}) {
        const agent = new AnimatedAgent(agentId, name, x, y, config);
        this.agents.set(agentId, agent);
        return agent;
    }

    addFurniture(type, x, y) {
        this.furniture.push({ type, x, y });
    }

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
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        for (const agent of this.agents.values()) {
            agent.update(dt);
        }
    }

    render() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw floor grid
        this.drawFloor();
        
        // Sort entities by depth
        const entities = [
            ...this.furniture.map(f => ({ ...f, isAgent: false })),
            ...Array.from(this.agents.values()).map(a => ({ ...a, isAgent: true, agent: a }))
        ].sort((a, b) => (a.y + a.x) - (b.y + b.x));
        
        // Draw entities
        for (const entity of entities) {
            if (entity.isAgent) {
                entity.agent.render(ctx, this.spriteLoader, this.isoMath, this.camera);
            } else {
                this.drawFurniture(entity);
            }
        }
    }

    drawFloor() {
        const ctx = this.ctx;
        const size = 20;
        
        for (let x = -size; x <= size; x++) {
            for (let y = -size; y <= size; y++) {
                const pos = this.isoMath.toScreen(x, y, 0);
                const camX = (pos.x - this.camera.x) * this.camera.zoom;
                const camY = (pos.y - this.camera.y) * this.camera.zoom;
                
                const tileSize = 32 * this.camera.zoom;
                
                ctx.fillStyle = (x + y) % 2 === 0 ? '#d4c4a8' : '#c4b498';
                ctx.beginPath();
                ctx.moveTo(camX, camY);
                ctx.lineTo(camX + tileSize, camY + tileSize/2);
                ctx.lineTo(camX, camY + tileSize);
                ctx.lineTo(camX - tileSize, camY + tileSize/2);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    drawFurniture(furniture) {
        const sprite = this.spriteLoader.getFurniture(furniture.type);
        if (!sprite) return;
        
        const pos = this.isoMath.toScreen(furniture.x, furniture.y, 0);
        const camX = (pos.x - this.camera.x) * this.camera.zoom;
        const camY = (pos.y - this.camera.y) * this.camera.zoom;
        
        const size = 32 * this.camera.zoom;
        
        this.ctx.drawImage(sprite.image, camX - size/2, camY - size, size, size);
    }

    // Camera controls
    pan(dx, dy) {
        this.camera.x += dx / this.camera.zoom;
        this.camera.y += dy / this.camera.zoom;
    }

    zoom(factor, centerX, centerY) {
        const newZoom = Math.max(0.5, Math.min(3, this.camera.zoom * factor));
        
        // Zoom towards center
        this.camera.x += (centerX - this.canvas.width/2) * (1/factor - 1) / this.camera.zoom;
        this.camera.y += (centerY - this.canvas.height/2) * (1/factor - 1) / this.camera.zoom;
        
        this.camera.zoom = newZoom;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteLoader, AnimatedAgent, OfficeRenderer };
}
