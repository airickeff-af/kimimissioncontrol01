/**
 * Pixel Office Sprite System
 * Loads and animates 22 agent sprites with 8-frame animations
 * For: TASK-092 Pixel Office
 */

/**
 * @typedef {Object} SpriteData
 * @property {HTMLImageElement} image - The sprite sheet image
 * @property {number} sx - Source x coordinate
 * @property {number} sy - Source y coordinate
 * @property {number} sw - Source width
 * @property {number} sh - Source height
 */

/**
 * @typedef {Object} SpriteMetadata
 * @property {number} sprite_size - Size of each sprite in pixels
 * @property {number} frames_per_animation - Number of frames per animation
 * @property {Object.<string, number>} animations - Animation name to index mapping
 * @property {Object.<string, Object>} agents - Agent ID to metadata mapping
 */

/**
 * @typedef {Object} SpriteEntry
 * @property {HTMLImageElement} image - The loaded image
 * @property {string} type - Type of sprite ('agent', 'furniture', 'effect', 'status')
 * @property {number} [row] - Row index for agent sprites
 */

/**
 * Loads and manages sprite sheets for the Pixel Office.
 * Handles loading of agent sprites, furniture, effects, and status indicators.
 */
class SpriteLoader {
    /**
     * Creates a new SpriteLoader instance.
     * 
     * @param {string} [basePath='assets/sprites/'] - Base path to sprite assets
     * @throws {TypeError} If basePath is not a string
     */
    constructor(basePath = 'assets/sprites/') {
        // Validate constructor parameters
        if (typeof basePath !== 'string') {
            throw new TypeError(`SpriteLoader: basePath must be a string, got ${typeof basePath}`);
        }
        
        /** @type {string} */
        this.basePath = basePath;
        
        /** @type {Map<string, SpriteEntry>} */
        this.sprites = new Map();
        
        /** @type {SpriteMetadata|null} */
        this.metadata = null;
        
        /** @type {boolean} */
        this.loaded = false;
        
        /** @type {Array<{agentId: string, error: Error}>} */
        this.failedLoads = [];
    }

    /**
     * Loads all sprite assets including metadata, agent sheets, furniture, and effects.
     * Failed loads are tracked in this.failedLoads for error recovery.
     * 
     * @returns {Promise<void>}
     * @throws {Error} If metadata cannot be loaded
     */
    async load() {
        try {
            // Load metadata first - required for all other operations
            const response = await fetch(`${this.basePath}sprite_metadata.json`);
            if (!response.ok) {
                throw new Error(`Failed to load metadata: ${response.status} ${response.statusText}`);
            }
            this.metadata = await response.json();
        } catch (error) {
            console.error('SpriteLoader: Failed to load metadata:', error);
            throw new Error(`SpriteLoader initialization failed: ${error.message}`);
        }
        
        // Validate metadata structure
        if (!this.metadata || !this.metadata.agents || !this.metadata.animations) {
            throw new Error('SpriteLoader: Invalid metadata structure');
        }
        
        // Load all agent sprite sheets with error recovery
        const loadPromises = Object.keys(this.metadata.agents).map(agentId => 
            this.loadAgentSheet(agentId).catch(error => {
                console.warn(`SpriteLoader: Failed to load agent ${agentId}, using fallback:`, error.message);
                this.failedLoads.push({ agentId, error });
                // Create a placeholder entry for failed loads
                this.sprites.set(agentId, {
                    image: this._createFallbackImage(),
                    type: 'agent',
                    row: this.metadata.agents[agentId].row
                });
            })
        );
        
        // Load furniture and effects (non-critical, failures logged but not thrown)
        loadPromises.push(
            this.loadFurniture().catch(error => {
                console.warn('SpriteLoader: Some furniture failed to load:', error.message);
            })
        );
        loadPromises.push(
            this.loadEffects().catch(error => {
                console.warn('SpriteLoader: Some effects failed to load:', error.message);
            })
        );
        
        await Promise.all(loadPromises);
        this.loaded = true;
        console.log(`SpriteLoader: All sprites loaded (${this.failedLoads.length} failures)`);
    }

    /**
     * Creates a fallback image for when sprite loading fails.
     * Generates a simple colored square with an X pattern.
     * 
     * @returns {HTMLImageElement} Fallback image
     * @private
     */
    _createFallbackImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Draw magenta placeholder with X
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(32, 32);
        ctx.moveTo(32, 0);
        ctx.lineTo(0, 32);
        ctx.stroke();
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    /**
     * Loads a single agent's sprite sheet.
     * 
     * @param {string} agentId - The agent identifier
     * @returns {Promise<void>}
     * @throws {Error} If the image fails to load
     */
    loadAgentSheet(agentId) {
        // Validate agentId
        if (!agentId || typeof agentId !== 'string') {
            return Promise.reject(new Error(`Invalid agentId: ${agentId}`));
        }
        
        if (!this.metadata || !this.metadata.agents[agentId]) {
            return Promise.reject(new Error(`Unknown agent: ${agentId}`));
        }
        
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
            
            img.onerror = () => {
                reject(new Error(`Failed to load sprite sheet for agent: ${agentId}`));
            };
            
            // Set crossOrigin to handle CORS issues gracefully
            img.crossOrigin = 'anonymous';
            img.src = `${this.basePath}${agentId}_sheet.png`;
            
            // Timeout fallback for stalled loads
            setTimeout(() => {
                if (!img.complete) {
                    reject(new Error(`Timeout loading sprite sheet for agent: ${agentId}`));
                }
            }, 10000);
        });
    }

    /**
     * Loads all furniture sprite images.
     * 
     * @returns {Promise<void>}
     */
    loadFurniture() {
        const furniture = ['desk', 'chair', 'computer', 'plant', 'commander_desk', 'nexus'];
        return Promise.all(furniture.map(type => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    this.sprites.set(`furniture_${type}`, { image: img, type: 'furniture' });
                    resolve();
                };
                
                img.onerror = () => {
                    reject(new Error(`Failed to load furniture: ${type}`));
                };
                
                img.crossOrigin = 'anonymous';
                img.src = `${this.basePath}furniture_${type}.png`;
            });
        }));
    }

    /**
     * Loads all effect and status sprite images.
     * 
     * @returns {Promise<void>}
     */
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
                    
                    img.onerror = () => {
                        reject(new Error(`Failed to load effect: ${type}`));
                    };
                    
                    img.crossOrigin = 'anonymous';
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
                    
                    img.onerror = () => {
                        reject(new Error(`Failed to load status: ${status}`));
                    };
                    
                    img.crossOrigin = 'anonymous';
                    img.src = `${this.basePath}status_${status}.png`;
                });
            })
        ]);
    }

    /**
     * Gets sprite data for a specific agent, animation, and frame.
     * 
     * @param {string} agentId - The agent identifier
     * @param {string} animation - Animation name (e.g., 'idle', 'walk_down')
     * @param {number} frame - Frame number (0-7)
     * @returns {SpriteData|null} Sprite data or null if not found
     */
    getSprite(agentId, animation, frame) {
        // Validate inputs
        if (!agentId || typeof agentId !== 'string') {
            console.warn('SpriteLoader.getSprite: Invalid agentId');
            return null;
        }
        if (!animation || typeof animation !== 'string') {
            console.warn('SpriteLoader.getSprite: Invalid animation');
            return null;
        }
        if (typeof frame !== 'number' || frame < 0 || !Number.isFinite(frame)) {
            console.warn('SpriteLoader.getSprite: Invalid frame');
            return null;
        }
        
        const sprite = this.sprites.get(agentId);
        if (!sprite) {
            console.warn(`SpriteLoader.getSprite: Agent not found: ${agentId}`);
            return null;
        }

        // Use metadata defaults if properties missing
        const animIndex = this.metadata?.animations?.[animation] ?? 0;
        const framesPerAnim = this.metadata?.frames_per_animation ?? 8;
        const spriteSize = this.metadata?.sprite_size ?? 32;
        
        // Calculate source coordinates in the sprite sheet
        // Each row is one agent, columns are animation frames
        const x = (animIndex * framesPerAnim + (Math.floor(frame) % framesPerAnim)) * spriteSize;
        const y = sprite.row * spriteSize;

        return {
            image: sprite.image,
            sx: x,
            sy: y,
            sw: spriteSize,
            sh: spriteSize
        };
    }

    /**
     * Gets a furniture sprite by type.
     * 
     * @param {string} type - Furniture type (e.g., 'desk', 'chair')
     * @returns {SpriteEntry|undefined} Furniture sprite entry
     */
    getFurniture(type) {
        if (!type || typeof type !== 'string') {
            console.warn('SpriteLoader.getFurniture: Invalid type');
            return undefined;
        }
        return this.sprites.get(`furniture_${type}`);
    }

    /**
     * Gets an effect sprite by type.
     * 
     * @param {string} type - Effect type (e.g., 'shadow', 'speech')
     * @returns {SpriteEntry|undefined} Effect sprite entry
     */
    getEffect(type) {
        if (!type || typeof type !== 'string') {
            console.warn('SpriteLoader.getEffect: Invalid type');
            return undefined;
        }
        return this.sprites.get(`effect_${type}`);
    }

    /**
     * Gets a status indicator sprite.
     * 
     * @param {string} status - Status name (e.g., 'idle', 'working', 'busy', 'error')
     * @returns {SpriteEntry|undefined} Status sprite entry
     */
    getStatus(status) {
        if (!status || typeof status !== 'string') {
            console.warn('SpriteLoader.getStatus: Invalid status');
            return undefined;
        }
        return this.sprites.get(`status_${status}`);
    }
}

/**
 * Represents an animated agent in the office.
 * Handles movement, animation state, and rendering.
 */
class AnimatedAgent {
    /**
     * Creates a new AnimatedAgent instance.
     * 
     * @param {string} agentId - Unique agent identifier
     * @param {string} name - Display name
     * @param {number} x - Initial X position in world coordinates
     * @param {number} y - Initial Y position in world coordinates
     * @param {Object} [config={}] - Configuration options
     * @param {number} [config.frameDuration=150] - Milliseconds per animation frame
     * @param {number} [config.speed=2] - Movement speed
     * @param {number} [config.scale=1] - Visual scale multiplier
     * @throws {TypeError} If required parameters are invalid
     */
    constructor(agentId, name, x, y, config = {}) {
        // Validate required parameters
        if (!agentId || typeof agentId !== 'string') {
            throw new TypeError(`AnimatedAgent: agentId must be a non-empty string, got ${typeof agentId}`);
        }
        if (!name || typeof name !== 'string') {
            throw new TypeError(`AnimatedAgent: name must be a non-empty string, got ${typeof name}`);
        }
        if (typeof x !== 'number' || !Number.isFinite(x)) {
            throw new TypeError(`AnimatedAgent: x must be a finite number, got ${typeof x}`);
        }
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            throw new TypeError(`AnimatedAgent: y must be a finite number, got ${typeof y}`);
        }
        if (config !== null && typeof config !== 'object') {
            throw new TypeError(`AnimatedAgent: config must be an object, got ${typeof config}`);
        }
        
        /** @type {string} */
        this.id = agentId;
        
        /** @type {string} */
        this.name = name;
        
        /** @type {number} */
        this.x = x;
        
        /** @type {number} */
        this.y = y;
        
        /** @type {number} */
        this.z = 0;
        
        // Animation state
        /** @type {string} */
        this.animation = 'idle';
        
        /** @type {number} */
        this.frame = 0;
        
        /** @type {number} */
        this.frameTimer = 0;
        
        /** @type {number} */
        this.frameDuration = config.frameDuration || 150; // ms per frame
        
        // Movement
        /** @type {number} */
        this.targetX = x;
        
        /** @type {number} */
        this.targetY = y;
        
        /** @type {number} */
        this.speed = config.speed || 2;
        
        /** @type {string} */
        this.direction = 'down';
        
        // Activity
        /** @type {string} */
        this.activity = 'idle';
        
        /** @type {Object} */
        this.activityData = {};
        
        /** @type {number} */
        this.progress = 0;
        
        // Visual
        /** @type {string|null} */
        this.speechBubble = null;
        
        /** @type {number} */
        this.speechTimer = 0;
        
        /** @type {boolean} */
        this.selected = false;
        
        /** @type {number} */
        this.scale = config.scale || 1;
        
        // Status
        /** @type {string} */
        this.status = 'idle';
    }

    /**
     * Updates the agent's animation and movement state.
     * Should be called each frame with the delta time.
     * 
     * @param {number} dt - Delta time in milliseconds since last update
     */
    update(dt) {
        // Validate delta time
        if (typeof dt !== 'number' || !Number.isFinite(dt) || dt < 0) {
            console.warn(`AnimatedAgent.update: Invalid dt: ${dt}`);
            return;
        }
        
        // Animation frame advancement
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameDuration) {
            this.frameTimer = 0;
            this.frame = (this.frame + 1) % 8;
        }
        
        // Movement handling
        if (this.activity === 'walking') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 0.1) {
                // Reached destination
                this.x = this.targetX;
                this.y = this.targetY;
                this.setActivity('idle');
            } else {
                // Move towards target
                const moveDist = Math.min(this.speed * dt * 0.01, dist);
                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
                
                // Update facing direction based on movement vector
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.direction = dx > 0 ? 'right' : 'left';
                } else {
                    this.direction = dy > 0 ? 'down' : 'up';
                }
            }
        }
        
        // Speech bubble timer countdown
        if (this.speechTimer > 0) {
            this.speechTimer -= dt;
            if (this.speechTimer <= 0) {
                this.speechBubble = null;
            }
        }
        
        // Progress animation for working activity
        if (this.activity === 'working') {
            this.progress = (this.progress + dt * 0.0002) % 1;
        }
    }

    /**
     * Sets a movement target for the agent.
     * 
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    moveTo(x, y) {
        if (typeof x !== 'number' || !Number.isFinite(x)) {
            console.warn(`AnimatedAgent.moveTo: Invalid x: ${x}`);
            return;
        }
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            console.warn(`AnimatedAgent.moveTo: Invalid y: ${y}`);
            return;
        }
        
        this.targetX = x;
        this.targetY = y;
        this.setActivity('walking');
    }

    /**
     * Displays a speech bubble above the agent.
     * 
     * @param {string} text - Text to display
     * @param {number} [duration=3000] - Duration in milliseconds
     */
    say(text, duration = 3000) {
        if (typeof text !== 'string') {
            console.warn('AnimatedAgent.say: text must be a string');
            return;
        }
        this.speechBubble = text;
        this.speechTimer = duration;
    }

    /**
     * Sets the agent's current activity and updates animation/state accordingly.
     * 
     * @param {string} activity - Activity type ('idle', 'walking', 'working', 'talking', 'auditing')
     * @param {Object} [data={}] - Additional activity data
     */
    setActivity(activity, data = {}) {
        if (typeof activity !== 'string') {
            console.warn(`AnimatedAgent.setActivity: Invalid activity: ${activity}`);
            return;
        }
        
        this.activity = activity;
        this.activityData = data || {};
        
        // Map activity to animation name
        const animMap = {
            'idle': 'idle',
            'walking': `walk_${this.direction}`,
            'working': 'typing',
            'talking': 'talking',
            'auditing': 'audit'
        };
        
        this.animation = animMap[activity] || 'idle';
        
        // Update status indicator
        if (activity === 'working') this.status = 'working';
        else if (activity === 'walking') this.status = 'busy';
        else this.status = 'idle';
    }

    /**
     * Renders the agent to the canvas.
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {SpriteLoader} spriteLoader - Loaded sprite loader instance
     * @param {Object} isoMath - Isometric math utilities
     * @param {Object} camera - Camera state {x, y, zoom}
     * @param {number} [offsetX=0] - X offset for rendering
     * @param {number} [offsetY=0] - Y offset for rendering
     */
    render(ctx, spriteLoader, isoMath, camera, offsetX = 0, offsetY = 0) {
        // Validate required parameters
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
            console.warn('AnimatedAgent.render: Invalid canvas context');
            return;
        }
        if (!spriteLoader || !spriteLoader.loaded) {
            console.warn('AnimatedAgent.render: SpriteLoader not ready');
            return;
        }
        if (!isoMath || typeof isoMath.toScreen !== 'function') {
            console.warn('AnimatedAgent.render: Invalid isoMath');
            return;
        }
        if (!camera || typeof camera.zoom !== 'number') {
            console.warn('AnimatedAgent.render: Invalid camera');
            return;
        }
        
        // Convert world position to screen position using isometric projection
        // isoMath.toScreen transforms 3D world coords (x, y, z) to 2D screen coords
        const screenPos = isoMath.toScreen(this.x, this.y, this.z);
        const finalX = screenPos.x + offsetX;
        const finalY = screenPos.y + offsetY;
        
        // Apply camera transform (pan and zoom)
        const camX = (finalX - camera.x) * camera.zoom;
        const camY = (finalY - camera.y) * camera.zoom;
        
        // Get the current sprite frame
        const sprite = spriteLoader.getSprite(this.id, this.animation, this.frame);
        if (!sprite) {
            console.warn(`AnimatedAgent.render: Could not get sprite for ${this.id}`);
            return;
        }
        
        const size = spriteLoader.metadata.sprite_size * camera.zoom * this.scale;
        
        // Draw shadow beneath agent
        const shadow = spriteLoader.getEffect('shadow');
        if (shadow) {
            ctx.drawImage(shadow.image, camX - size/2, camY - size/4, size, size/2);
        }
        
        // Draw selection ring if agent is selected
        if (this.selected) {
            const selection = spriteLoader.getEffect('selection');
            if (selection) {
                ctx.drawImage(selection.image, camX - size/2, camY - size, size, size);
            }
        }
        
        // Draw the agent sprite
        ctx.drawImage(
            sprite.image,
            sprite.sx, sprite.sy, sprite.sw, sprite.sh,
            camX - size/2, camY - size, size, size
        );
        
        // Draw speech bubble if active
        if (this.speechBubble) {
            this.renderSpeechBubble(ctx, spriteLoader, camX, camY - size, camera.zoom);
        }
        
        // Draw activity/status bar
        this.renderActivityBar(ctx, spriteLoader, camX, camY, camera.zoom);
    }

    /**
     * Renders a speech bubble above the agent.
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {SpriteLoader} spriteLoader - Sprite loader
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} zoom - Camera zoom level
     * @private
     */
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

    /**
     * Renders the agent's activity/status bar.
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {SpriteLoader} spriteLoader - Sprite loader
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} zoom - Camera zoom level
     * @private
     */
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

    /**
     * Gets the display text for the current activity status.
     * 
     * @returns {string} Status display text
     */
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

/**
 * Main renderer for the Pixel Office.
 * Handles the render loop, camera, and entity drawing.
 */
class OfficeRenderer {
    /**
     * Creates a new OfficeRenderer instance.
     * 
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     * @param {SpriteLoader} spriteLoader - Loaded sprite loader
     * @throws {TypeError} If parameters are invalid
     */
    constructor(canvas, spriteLoader) {
        // Validate canvas
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new TypeError('OfficeRenderer: canvas must be an HTMLCanvasElement');
        }
        
        // Validate spriteLoader
        if (!spriteLoader || !(spriteLoader instanceof SpriteLoader)) {
            throw new TypeError('OfficeRenderer: spriteLoader must be a SpriteLoader instance');
        }
        
        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;
        
        /** @type {CanvasRenderingContext2D} */
        this.ctx = canvas.getContext('2d');
        
        /** @type {SpriteLoader} */
        this.spriteLoader = spriteLoader;
        
        /** @type {Map<string, AnimatedAgent>} */
        this.agents = new Map();
        
        /** @type {Array<{type: string, x: number, y: number}>} */
        this.furniture = [];
        
        /** @type {{x: number, y: number, zoom: number}} */
        this.camera = { x: 0, y: 0, zoom: 1 };
        
        /**
         * Isometric math utilities.
         * Converts 3D world coordinates to 2D screen coordinates.
         * 
         * Isometric projection formula:
         * - screenX = (worldX - worldY) * tileWidth/2 + centerOffset
         * - screenY = (worldX + worldY) * tileHeight/2 - z * tileHeight/2 + centerOffset
         * 
         * This creates the classic 2.5D isometric view where:
         * - Moving in +X goes down-right
         * - Moving in +Y goes down-left
         * - Moving in +Z goes up (elevation)
         * 
         * @type {Object}
         */
        this.isoMath = {
            /**
             * Converts world coordinates to screen coordinates.
             * 
             * @param {number} x - World X coordinate
             * @param {number} y - World Y coordinate
             * @param {number} z - World Z coordinate (elevation)
             * @returns {{x: number, y: number}} Screen coordinates
             */
            toScreen: (x, y, z) => ({
                // (x - y) creates the diagonal axis for isometric X
                // Multiplied by 32 (half tile width) to scale to pixels
                x: (x - y) * 32 + this.canvas.width / 2,
                // (x + y) creates the perpendicular diagonal axis for isometric Y
                // z * 16 subtracts elevation (higher Z = higher on screen)
                y: (x + y) * 16 - z * 16 + this.canvas.height / 3
            })
        };
        
        /** @type {number} */
        this.lastTime = 0;
        
        /** @type {boolean} */
        this.running = false;
    }

    /**
     * Adds an agent to the office.
     * 
     * @param {string} agentId - Agent identifier
     * @param {string} name - Display name
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {Object} [config={}] - Agent configuration
     * @returns {AnimatedAgent} The created agent instance
     */
    addAgent(agentId, name, x, y, config = {}) {
        const agent = new AnimatedAgent(agentId, name, x, y, config);
        this.agents.set(agentId, agent);
        return agent;
    }

    /**
     * Adds furniture to the office.
     * 
     * @param {string} type - Furniture type
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    addFurniture(type, x, y) {
        if (typeof type !== 'string') {
            console.warn('OfficeRenderer.addFurniture: Invalid type');
            return;
        }
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.warn('OfficeRenderer.addFurniture: Invalid position');
            return;
        }
        this.furniture.push({ type, x, y });
    }

    /**
     * Starts the render loop.
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    /**
     * Stops the render loop.
     */
    stop() {
        this.running = false;
    }

    /**
     * Main render loop. Updates and renders all entities.
     * Uses requestAnimationFrame for smooth rendering.
     * 
     * @private
     */
    loop() {
        if (!this.running) return;
        
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }

    /**
     * Updates all entities.
     * 
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt) {
        for (const agent of this.agents.values()) {
            agent.update(dt);
        }
    }

    /**
     * Renders the entire office scene.
     * Handles clearing, floor grid, and entity rendering with proper depth sorting.
     */
    render() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw floor grid
        this.drawFloor();
        
        // Sort entities by depth for correct occlusion
        // In isometric view, depth = x + y (lower values are behind)
        const entities = [
            ...this.furniture.map(f => ({ ...f, isAgent: false })),
            ...Array.from(this.agents.values()).map(a => ({ ...a, isAgent: true, agent: a }))
        ].sort((a, b) => (a.y + a.x) - (b.y + b.x));
        
        // Draw entities in depth order
        for (const entity of entities) {
            if (entity.isAgent) {
                entity.agent.render(ctx, this.spriteLoader, this.isoMath, this.camera);
            } else {
                this.drawFurniture(entity);
            }
        }
    }

    /**
     * Draws the isometric floor grid.
     * Creates a diamond pattern of tiles centered on the world origin.
     * 
     * Isometric tile drawing:
     * - Each tile is a diamond shape (rhombus)
     * - Tile width = 64px (32 * 2), height = 32px (16 * 2)
     * - Checkerboard pattern for visual distinction
     */
    drawFloor() {
        const ctx = this.ctx;
        const size = 20;
        
        for (let x = -size; x <= size; x++) {
            for (let y = -size; y <= size; y++) {
                // Convert grid coordinates to screen coordinates
                const pos = this.isoMath.toScreen(x, y, 0);
                const camX = (pos.x - this.camera.x) * this.camera.zoom;
                const camY = (pos.y - this.camera.y) * this.camera.zoom;
                
                // Isometric tile dimensions
                // Half-width = 32 * zoom, half-height = 16 * zoom
                const tileSize = 32 * this.camera.zoom;
                
                // Checkerboard pattern: alternating colors based on (x + y) parity
                ctx.fillStyle = (x + y) % 2 === 0 ? '#d4c4a8' : '#c4b498';
                
                // Draw diamond shape for isometric tile
                // Points: top, right, bottom, left
                ctx.beginPath();
                ctx.moveTo(camX, camY);                           // Top point
                ctx.lineTo(camX + tileSize, camY + tileSize/2);   // Right point
                ctx.lineTo(camX, camY + tileSize);                // Bottom point
                ctx.lineTo(camX - tileSize, camY + tileSize/2);   // Left point
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    /**
     * Draws a furniture item.
     * 
     * @param {{type: string, x: number, y: number}} furniture - Furniture data
     */
    drawFurniture(furniture) {
        const sprite = this.spriteLoader.getFurniture(furniture.type);
        if (!sprite) return;
        
        // Convert world position to screen position
        const pos = this.isoMath.toScreen(furniture.x, furniture.y, 0);
        const camX = (pos.x - this.camera.x) * this.camera.zoom;
        const camY = (pos.y - this.camera.y) * this.camera.zoom;
        
        const size = 32 * this.camera.zoom;
        
        this.ctx.drawImage(sprite.image, camX - size/2, camY - size, size, size);
    }

    /**
     * Pans the camera by a delta amount.
     * 
     * @param {number} dx - Delta X in screen pixels
     * @param {number} dy - Delta Y in screen pixels
     */
    pan(dx, dy) {
        if (typeof dx !== 'number' || typeof dy !== 'number') {
            console.warn('OfficeRenderer.pan: Invalid delta values');
            return;
        }
        this.camera.x += dx / this.camera.zoom;
        this.camera.y += dy / this.camera.zoom;
    }

    /**
     * Zooms the camera towards a center point.
     * 
     * @param {number} factor - Zoom multiplier (>1 zooms in, <1 zooms out)
     * @param {number} centerX - Screen X coordinate to zoom towards
     * @param {number} centerY - Screen Y coordinate to zoom towards
     */
    zoom(factor, centerX, centerY) {
        if (typeof factor !== 'number' || factor <= 0) {
            console.warn('OfficeRenderer.zoom: Invalid factor');
            return;
        }
        
        // Clamp zoom level between 0.5x and 3x
        const newZoom = Math.max(0.5, Math.min(3, this.camera.zoom * factor));
        
        // Adjust camera position to zoom towards center point
        // Formula: camera += (center - canvas_center) * (1/factor - 1) / current_zoom
        this.camera.x += (centerX - this.canvas.width/2) * (1/factor - 1) / this.camera.zoom;
        this.camera.y += (centerY - this.canvas.height/2) * (1/factor - 1) / this.camera.zoom;
        
        this.camera.zoom = newZoom;
    }
}

// Export for use in Node.js/CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteLoader, AnimatedAgent, OfficeRenderer };
}
