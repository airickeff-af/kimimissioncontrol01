/**
 * HOLIDAY MODE SYSTEM — MC PROJECT
 * 6 Holidays: New Year, Birthday, Lunar New Year, Christmas, Halloween, Valentine's
 * 
 * @author Sentry-MC (Implementation)
 * @requested-by Meemo (PM)
 * @date 2026-02-20
 */

// Holiday Configuration
const HOLIDAYS = {
    'new-year': {
        id: 'new-year',
        name: 'New Year',
        emoji: '🎊',
        icon: '🎉',
        colors: {
            primary: 0xFFD700,    // Gold
            secondary: 0xFF6B6B,  // Red
            accent: 0x4ECDC4      // Teal
        },
        costume: {
            hat: 'party-hat',
            accessories: ['confetti', 'noise-maker'],
            particleEffect: 'confetti-fall'
        },
        theme: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)',
            glowColor: '#FFD700',
            particleColors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF']
        },
        dates: ['01-01'] // MM-DD format
    },
    'birthday': {
        id: 'birthday',
        name: 'Birthday',
        emoji: '🎂',
        icon: '🎈',
        colors: {
            primary: 0xFF69B4,    // Hot Pink
            secondary: 0x87CEEB,  // Sky Blue
            accent: 0xFFD700      // Gold
        },
        costume: {
            hat: 'birthday-crown',
            accessories: ['balloons', 'cake-slice'],
            particleEffect: 'balloon-rise'
        },
        theme: {
            background: 'linear-gradient(135deg, #2d1b4e 0%, #4a1942 100%)',
            glowColor: '#FF69B4',
            particleColors: ['#FF69B4', '#87CEEB', '#FFD700', '#98FB98']
        },
        dates: ['user-birthday'] // Set by user
    },
    'lunar-new-year': {
        id: 'lunar-new-year',
        name: 'Lunar New Year',
        emoji: '🧧',
        icon: '🐉',
        colors: {
            primary: 0xDC143C,    // Crimson
            secondary: 0xFFD700,  // Gold
            accent: 0xFF4500      // Orange Red
        },
        costume: {
            hat: 'dragon-hat',
            accessories: ['lantern', 'red-envelope'],
            particleEffect: 'lantern-float'
        },
        theme: {
            background: 'linear-gradient(135deg, #4a0000 0%, #8B0000 100%)',
            glowColor: '#FFD700',
            particleColors: ['#DC143C', '#FFD700', '#FF4500', '#FFA500']
        },
        dates: ['lunar-calendar'] // Calculated yearly
    },
    'christmas': {
        id: 'christmas',
        name: 'Christmas',
        emoji: '🎄',
        icon: '🎅',
        colors: {
            primary: 0x228B22,    // Forest Green
            secondary: 0xDC143C,  // Crimson
            accent: 0xFFD700      // Gold
        },
        costume: {
            hat: 'santa-hat',
            accessories: ['candy-cane', 'gift-bag'],
            particleEffect: 'snow-fall'
        },
        theme: {
            background: 'linear-gradient(135deg, #0d3328 0%, #1a5c3d 100%)',
            glowColor: '#FFD700',
            particleColors: ['#FFFFFF', '#DC143C', '#228B22', '#FFD700']
        },
        dates: ['12-25']
    },
    'halloween': {
        id: 'halloween',
        name: 'Halloween',
        emoji: '🎃',
        icon: '👻',
        colors: {
            primary: 0xFF6600,    // Halloween Orange
            secondary: 0x4B0082,  // Indigo
            accent: 0x000000      // Black
        },
        costume: {
            hat: 'pumpkin-head',
            accessories: ['cape', 'candy-bucket'],
            particleEffect: 'ghost-float'
        },
        theme: {
            background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b00 100%)',
            glowColor: '#FF6600',
            particleColors: ['#FF6600', '#4B0082', '#00FF00', '#8B4513']
        },
        dates: ['10-31']
    },
    'valentines': {
        id: 'valentines',
        name: "Valentine's Day",
        emoji: '💝',
        icon: '❤️',
        colors: {
            primary: 0xFF1493,    // Deep Pink
            secondary: 0xFF69B4,  // Hot Pink
            accent: 0xFFB6C1      // Light Pink
        },
        costume: {
            hat: 'heart-crown',
            accessories: ['rose', 'love-letter'],
            particleEffect: 'heart-float'
        },
        theme: {
            background: 'linear-gradient(135deg, #2d1b3d 0%, #4a1b3d 100%)',
            glowColor: '#FF1493',
            particleColors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FFFFFF']
        },
        dates: ['02-14']
    }
};

// Current active holiday
let activeHoliday = null;
let holidayParticles = [];

/**
 * Initialize Holiday Mode System
 */
function initHolidaySystem() {
    // Check for automatic holiday detection
    const today = getTodayString();
    const currentHoliday = detectHoliday(today);
    
    if (currentHoliday) {
        activateHoliday(currentHoliday);
    }
    
    // Add holiday button to UI
    addHolidayButton();
}

/**
 * Get today's date in MM-DD format
 */
function getTodayString() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${month}-${day}`;
}

/**
 * Detect if today is a holiday
 */
function detectHoliday(dateString) {
    for (const [key, holiday] of Object.entries(HOLIDAYS)) {
        if (holiday.dates.includes(dateString)) {
            return key;
        }
    }
    return null;
}

/**
 * Activate a holiday mode
 */
function activateHoliday(holidayId) {
    const holiday = HOLIDAYS[holidayId];
    if (!holiday) return;
    
    activeHoliday = holidayId;
    
    // Apply holiday theme
    applyHolidayTheme(holiday);
    
    // Apply character costume
    applyHolidayCostume(holiday);
    
    // Start particle effects
    startHolidayParticles(holiday);
    
    // Update UI
    updateHolidayUI(holiday);
    
    console.log(`[Holiday Mode] Activated: ${holiday.name}`);
}

/**
 * Deactivate holiday mode
 */
function deactivateHoliday() {
    activeHoliday = null;
    
    // Reset theme
    resetTheme();
    
    // Remove costume
    removeHolidayCostume();
    
    // Stop particles
    stopHolidayParticles();
    
    // Update UI
    updateHolidayUI(null);
    
    console.log('[Holiday Mode] Deactivated');
}

/**
 * Apply holiday theme to UI
 */
function applyHolidayTheme(holiday) {
    const theme = holiday.theme;
    
    // Apply background
    document.body.style.background = theme.background;
    
    // Apply glow colors to elements
    document.documentElement.style.setProperty('--holiday-glow', theme.glowColor);
    document.documentElement.style.setProperty('--holiday-primary', '#' + holiday.colors.primary.toString(16));
    
    // Add holiday class to body
    document.body.classList.add(`holiday-${holiday.id}`);
    document.body.classList.add('holiday-active');
}

/**
 * Reset theme to default
 */
function resetTheme() {
    document.body.style.background = '#0a0a0f';
    document.body.className = document.body.className.replace(/holiday-\S+/g, '').trim();
}

/**
 * Apply holiday costume to character
 */
function applyHolidayCostume(holiday) {
    if (!character) return;
    
    const costume = holiday.costume;
    
    // Create costume accessories
    costume.accessories.forEach(acc => {
        createAccessory(acc, holiday.colors);
    });
    
    // Apply hat
    if (costume.hat) {
        createHat(costume.hat, holiday.colors);
    }
    
    // Change character material colors
    character.traverse((child) => {
        if (child.isMesh && child.material) {
            // Store original color
            if (!child.userData.originalColor) {
                child.userData.originalColor = child.material.color.clone();
            }
            
            // Apply holiday tint
            const holidayColor = new THREE.Color(holiday.colors.primary);
            child.material.color.lerp(holidayColor, 0.2);
        }
    });
}

/**
 * Remove holiday costume
 */
function removeHolidayCostume() {
    if (!character) return;
    
    // Remove accessories
    const accessories = character.children.filter(child => child.userData.isAccessory);
    accessories.forEach(acc => character.remove(acc));
    
    // Restore original colors
    character.traverse((child) => {
        if (child.isMesh && child.material && child.userData.originalColor) {
            child.material.color.copy(child.userData.originalColor);
        }
    });
}

/**
 * Create a hat accessory
 */
function createHat(hatType, colors) {
    const hatGroup = new THREE.Group();
    hatGroup.userData.isAccessory = true;
    hatGroup.userData.isHat = true;
    
    const primaryColor = new THREE.Color(colors.primary);
    const material = new THREE.MeshStandardMaterial({ 
        color: primaryColor,
        roughness: 0.5,
        metalness: 0.3
    });
    
    switch(hatType) {
        case 'party-hat':
            // Cone party hat
            const coneGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
            const cone = new THREE.Mesh(coneGeo, material);
            cone.position.y = 0.95;
            hatGroup.add(cone);
            
            // Pom-pom on top
            const pompomGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const pompomMat = new THREE.MeshStandardMaterial({ color: colors.secondary });
            const pompom = new THREE.Mesh(pompomGeo, pompomMat);
            pompom.position.y = 1.1;
            hatGroup.add(pompom);
            break;
            
        case 'birthday-crown':
            // Crown shape
            const crownGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.15, 5);
            const crown = new THREE.Mesh(crownGeo, material);
            crown.position.y = 0.9;
            hatGroup.add(crown);
            break;
            
        case 'santa-hat':
            // Santa hat
            const santaGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
            const santa = new THREE.Mesh(santaGeo, material);
            santa.position.y = 0.95;
            santa.rotation.z = -0.2;
            hatGroup.add(santa);
            
            // White trim
            const trimGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
            const trimMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const trim = new THREE.Mesh(trimGeo, trimMat);
            trim.position.y = 0.78;
            trim.rotation.x = Math.PI / 2;
            hatGroup.add(trim);
            break;
            
        case 'pumpkin-head':
            // Pumpkin
            const pumpkinGeo = new THREE.SphereGeometry(0.25, 8, 8);
            const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
            const pumpkin = new THREE.Mesh(pumpkinGeo, pumpkinMat);
            pumpkin.position.y = 0.95;
            pumpkin.scale.y = 0.8;
            hatGroup.add(pumpkin);
            
            // Stem
            const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 1.15;
            hatGroup.add(stem);
            break;
            
        default:
            // Default party hat
            const defaultGeo = new THREE.ConeGeometry(0.15, 0.25, 8);
            const defaultHat = new THREE.Mesh(defaultGeo, material);
            defaultHat.position.y = 0.9;
            hatGroup.add(defaultHat);
    }
    
    character.add(hatGroup);
}

/**
 * Create an accessory
 */
function createAccessory(accessoryType, colors) {
    const accGroup = new THREE.Group();
    accGroup.userData.isAccessory = true;
    
    const material = new THREE.MeshStandardMaterial({ 
        color: colors.secondary,
        roughness: 0.6
    });
    
    switch(accessoryType) {
        case 'balloons':
            // Floating balloons
            for (let i = 0; i < 3; i++) {
                const balloonGeo = new THREE.SphereGeometry(0.1, 8, 8);
                const balloonMat = new THREE.MeshStandardMaterial({ 
                    color: i === 0 ? colors.primary : i === 1 ? colors.secondary : colors.accent
                });
                const balloon = new THREE.Mesh(balloonGeo, balloonMat);
                balloon.position.set(
                    0.4 + i * 0.15,
                    0.5 + i * 0.2,
                    0.2
                );
                accGroup.add(balloon);
            }
            break;
            
        case 'candy-cane':
            // Candy cane in hand
            const caneGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI);
            const caneMat = new THREE.MeshStandardMaterial({ 
                color: 0xFFFFFF,
                roughness: 0.3
            });
            const cane = new THREE.Mesh(caneGeo, caneMat);
            cane.position.set(0.4, 0.3, 0.2);
            cane.rotation.z = Math.PI / 2;
            accGroup.add(cane);
            break;
    }
    
    character.add(accGroup);
}

/**
 * Start holiday particle effects
 */
function startHolidayParticles(holiday) {
    const particleEffect = holiday.costume.particleEffect;
    const colors = holiday.theme.particleColors;
    
    switch(particleEffect) {
        case 'confetti-fall':
            createConfettiParticles(colors);
            break;
        case 'snow-fall':
            createSnowParticles();
            break;
        case 'heart-float':
            createHeartParticles(colors);
            break;
        case 'balloon-rise':
            createBalloonParticles(colors);
            break;
        default:
            createDefaultParticles(colors);
    }
}

/**
 * Create confetti particles
 */
function createConfettiParticles(colors) {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const rotations = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 1] = Math.random() * 5 + 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
        
        velocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: -Math.random() * 0.05 - 0.02,
            z: (Math.random() - 0.5) * 0.02
        });
        
        rotations.push({
            x: Math.random() * 0.1,
            y: Math.random() * 0.1,
            z: Math.random() * 0.1
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const colorArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const color = new THREE.Color(colors[i % colors.length]);
        colorArray[i * 3] = color.r;
        colorArray[i * 3 + 1] = color.g;
        colorArray[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, rotations, type: 'confetti' };
    scene.add(particles);
    holidayParticles.push(particles);
}

/**
 * Create snow particles
 */
function createSnowParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = Math.random() * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        velocities.push({
            x: (Math.random() - 0.5) * 0.01,
            y: -Math.random() * 0.03 - 0.01,
            z: (Math.random() - 0.5) * 0.01
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.08,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, type: 'snow' };
    scene.add(particles);
    holidayParticles.push(particles);
}

/**
 * Create heart particles
 */
function createHeartParticles(colors) {
    // Simplified as floating spheres for hearts
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 4;
        positions[i * 3 + 1] = Math.random() * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        
        velocities.push({
            x: (Math.random() - 0.5) * 0.01,
            y: Math.random() * 0.02 + 0.01,
            z: (Math.random() - 0.5) * 0.01
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: colors[0],
        size: 0.15,
        transparent: true,
        opacity: 0.6
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, type: 'hearts' };
    scene.add(particles);
    holidayParticles.push(particles);
}

/**
 * Create balloon particles
 */
function createBalloonParticles(colors) {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: colors[i % colors.length],
            roughness: 0.3,
            metalness: 0.1
        });
        
        const balloon = new THREE.Mesh(geometry, material);
        balloon.position.set(
            (Math.random() - 0.5) * 5,
            -2,
            (Math.random() - 0.5) * 5
        );
        
        balloon.userData = {
            velocity: Math.random() * 0.02 + 0.01,
            wobble: Math.random() * Math.PI * 2,
            type: 'balloon'
        };
        
        scene.add(balloon);
        holidayParticles.push(balloon);
    }
}

/**
 * Create default particles
 */
function createDefaultParticles(colors) {
    createConfettiParticles(colors);
}

/**
 * Stop holiday particles
 */
function stopHolidayParticles() {
    holidayParticles.forEach(particle => {
        scene.remove(particle);
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
    });
    holidayParticles = [];
}

/**
 * Update holiday particles animation
 */
function updateHolidayParticles() {
    holidayParticles.forEach(particle => {
        const type = particle.userData.type;
        
        if (type === 'confetti') {
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.userData.velocities;
            
            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                
                // Reset if below ground
                if (positions[i * 3 + 1] < -2) {
                    positions[i * 3 + 1] = 5;
                    positions[i * 3] = (Math.random() - 0.5) * 6;
                }
            }
            particle.geometry.attributes.position.needsUpdate = true;
            particle.rotation.y += 0.01;
        }
        else if (type === 'snow') {
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.userData.velocities;
            
            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x + Math.sin(Date.now() * 0.001 + i) * 0.002;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                
                if (positions[i * 3 + 1] < -2) {
                    positions[i * 3 + 1] = 8;
                }
            }
            particle.geometry.attributes.position.needsUpdate = true;
        }
        else if (type === 'hearts') {
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.userData.velocities;
            
            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += Math.sin(Date.now() * 0.002 + i) * 0.005;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += Math.cos(Date.now() * 0.002 + i) * 0.005;
                
                if (positions[i * 3 + 1] > 5) {
                    positions[i * 3 + 1] = 0;
                }
            }
            particle.geometry.attributes.position.needsUpdate = true;
        }
        else if (type === 'balloon') {
            particle.position.y += particle.userData.velocity;
            particle.position.x += Math.sin(Date.now() * 0.001 + particle.userData.wobble) * 0.005;
            
            if (particle.position.y > 6) {
                particle.position.y = -2;
            }
        }
    });
}

/**
 * Add holiday button to UI
 */
function addHolidayButton() {
    const characterContainer = document.querySelector('.character-container');
    if (!characterContainer) return;
    
    const holidayBtn = document.createElement('button');
    holidayBtn.id = 'holidayBtn';
    holidayBtn.className = 'holiday-btn';
    holidayBtn.innerHTML = '🎉 Holiday';
    holidayBtn.onclick = toggleHolidayMenu;
    
    characterContainer.appendChild(holidayBtn);
    
    // Create holiday menu
    const holidayMenu = document.createElement('div');
    holidayMenu.id = 'holidayMenu';
    holidayMenu.className = 'holiday-menu';
    holidayMenu.style.display = 'none';
    
    let menuHTML = '<div class="holiday-menu-header">Select Holiday</div>';
    
    for (const [key, holiday] of Object.entries(HOLIDAYS)) {
        menuHTML += `
            <div class="holiday-option" data-holiday="${key}">
                <span class="holiday-icon">${holiday.icon}</span>
                <span class="holiday-name">${holiday.name}</span>
            </div>
        `;
    }
    
    menuHTML += `
        <div class="holiday-divider"></div>
        <div class="holiday-option" data-holiday="reset">
            <span class="holiday-icon">↩️</span>
            <span class="holiday-name">Reset</span>
        </div>
    `;
    
    holidayMenu.innerHTML = menuHTML;
    characterContainer.appendChild(holidayMenu);
    
    // Add click handlers
    holidayMenu.querySelectorAll('.holiday-option').forEach(option => {
        option.onclick = () => {
            const holidayId = option.dataset.holiday;
            if (holidayId === 'reset') {
                deactivateHoliday();
            } else {
                activateHoliday(holidayId);
            }
            holidayMenu.style.display = 'none';
        };
    });
}

/**
 * Toggle holiday menu visibility
 */
function toggleHolidayMenu() {
    const menu = document.getElementById('holidayMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Update holiday UI
 */
function updateHolidayUI(holiday) {
    const btn = document.getElementById('holidayBtn');
    if (btn) {
        if (holiday) {
            btn.innerHTML = `${holiday.emoji} ${holiday.name}`;
            btn.classList.add('active');
        } else {
            btn.innerHTML = '🎉 Holiday';
            btn.classList.remove('active');
        }
    }
}

// Export for use in main script
window.HolidaySystem = {
    init: initHolidaySystem,
    activate: activateHoliday,
    deactivate: deactivateHoliday,
    getActive: () => activeHoliday,
    updateParticles: updateHolidayParticles,
    HOLIDAYS
};
