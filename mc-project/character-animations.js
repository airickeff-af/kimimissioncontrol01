// Enhanced Character Animation System for MC Project
// Adds pose buttons: WALK, WAVE, MEDITATE, DANCE, IDLE

let currentPose = 'IDLE';
let poseTimer = null;

// Pose definitions with bone rotations
const POSES = {
    IDLE: {
        name: 'Idle',
        emoji: '🧘',
        duration: 0,
        arms: { left: { x: 0, z: 0.2 }, right: { x: 0, z: -0.2 } },
        legs: { left: { x: 0 }, right: { x: 0 } },
        body: { y: 0, bobbing: true }
    },
    WALK: {
        name: 'Walking',
        emoji: '🚶',
        duration: 0,
        animate: 'walkCycle'
    },
    WAVE: {
        name: 'Waving',
        emoji: '👋',
        duration: 3000,
        arms: { 
            left: { x: 0, z: 0.2 }, 
            right: { x: -2.5, z: -0.5, wave: true } // Right arm waves
        },
        legs: { left: { x: 0 }, right: { x: 0 } },
        body: { y: 0, bobbing: false }
    },
    MEDITATE: {
        name: 'Meditating',
        emoji: '🧘',
        duration: 5000,
        arms: { 
            left: { x: -0.5, z: 0.8 }, // Hands on knees
            right: { x: -0.5, z: -0.8 }
        },
        legs: { 
            left: { x: -1.2, z: -0.5 }, // Cross-legged
            right: { x: -1.2, z: 0.5 }
        },
        body: { y: -0.3, bobbing: true, slow: true } // Lower, slow breathing
    },
    DANCE: {
        name: 'Dancing',
        emoji: '💃',
        duration: 4000,
        animate: 'danceCycle'
    },
    JUMP: {
        name: 'Jumping',
        emoji: '⬆️',
        duration: 1000,
        animate: 'jump'
    }
};

// Apply a pose to the character
function setPose(poseName) {
    if (!character || !characterParts.body) return;
    
    currentPose = poseName;
    const pose = POSES[poseName];
    
    console.log(`🎭 Setting pose: ${pose.name} ${pose.emoji}`);
    
    // Update UI
    document.getElementById('movement-state').textContent = pose.name;
    
    // Clear any existing pose timer
    if (poseTimer) {
        clearTimeout(poseTimer);
        poseTimer = null;
    }
    
    // If pose has duration, return to IDLE after
    if (pose.duration > 0) {
        poseTimer = setTimeout(() => {
            setPose('IDLE');
        }, pose.duration);
    }
}

// Enhanced animation update with pose support
function updateCharacterAnimation(delta) {
    if (!character) return;
    
    const pose = POSES[currentPose];
    const time = Date.now() * 0.001;
    
    switch (currentPose) {
        case 'IDLE':
            animateIdle(time, delta);
            break;
        case 'WALK':
            animateWalk(time, delta);
            break;
        case 'WAVE':
            animateWave(time, delta);
            break;
        case 'MEDITATE':
            animateMeditate(time, delta);
            break;
        case 'DANCE':
            animateDance(time, delta);
            break;
        case 'JUMP':
            animateJump(time, delta);
            break;
    }
}

function animateIdle(time, delta) {
    // Gentle breathing
    const breath = Math.sin(time * 2) * 0.05;
    
    if (characterParts.body) {
        characterParts.body.position.y = 0.8 + breath * 0.02;
        characterParts.body.rotation.y = Math.sin(time * 0.5) * 0.05;
    }
    
    // Subtle arm sway
    if (characterParts.leftArm) {
        characterParts.leftArm.rotation.z = 0.2 + Math.sin(time) * 0.05;
        characterParts.leftArm.rotation.x = Math.sin(time * 0.7) * 0.05;
    }
    if (characterParts.rightArm) {
        characterParts.rightArm.rotation.z = -0.2 - Math.sin(time) * 0.05;
        characterParts.rightArm.rotation.x = Math.sin(time * 0.7 + 1) * 0.05;
    }
    
    // Head look around
    if (characterParts.head) {
        characterParts.head.rotation.y = Math.sin(time * 0.3) * 0.15;
        characterParts.head.rotation.x = Math.sin(time * 0.5) * 0.05;
    }
}

function animateWalk(time, delta) {
    if (!movement.isMoving) {
        // Return to idle if not walking
        animateIdle(time, delta);
        return;
    }
    
    const walkSpeed = 8;
    const walkCycle = time * walkSpeed;
    
    // Leg swing
    if (characterParts.leftLeg) {
        characterParts.leftLeg.rotation.x = Math.sin(walkCycle) * 0.6;
    }
    if (characterParts.rightLeg) {
        characterParts.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.6;
    }
    
    // Arm swing (opposite to legs)
    if (characterParts.leftArm) {
        characterParts.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * 0.4;
        characterParts.leftArm.rotation.z = 0.2;
    }
    if (characterParts.rightArm) {
        characterParts.rightArm.rotation.x = Math.sin(walkCycle) * 0.4;
        characterParts.rightArm.rotation.z = -0.2;
    }
    
    // Body bob
    if (characterParts.body) {
        characterParts.body.position.y = 0.8 + Math.abs(Math.sin(walkCycle)) * 0.05;
        characterParts.body.rotation.y = Math.sin(walkCycle * 0.5) * 0.05;
    }
}

function animateWave(time, delta) {
    const waveSpeed = 10;
    
    // Right arm waves
    if (characterParts.rightArm) {
        // Raise arm
        characterParts.rightArm.rotation.x = THREE.MathUtils.lerp(
            characterParts.rightArm.rotation.x, 
            -2.5, 
            0.1
        );
        // Wave back and forth
        characterParts.rightArm.rotation.z = -0.5 + Math.sin(time * waveSpeed) * 0.3;
    }
    
    // Left arm stays down
    if (characterParts.leftArm) {
        characterParts.leftArm.rotation.x = THREE.MathUtils.lerp(
            characterParts.leftArm.rotation.x, 
            0, 
            0.1
        );
        characterParts.leftArm.rotation.z = 0.2;
    }
    
    // Slight body turn toward waving arm
    if (characterParts.body) {
        characterParts.body.rotation.y = THREE.MathUtils.lerp(
            characterParts.body.rotation.y,
            -0.3,
            0.05
        );
    }
    
    // Happy head tilt
    if (characterParts.head) {
        characterParts.head.rotation.z = Math.sin(time * 3) * 0.1;
    }
}

function animateMeditate(time, delta) {
    // Slow breathing
    const breath = Math.sin(time * 1.5) * 0.1;
    
    // Lower body (sitting)
    if (characterParts.body) {
        characterParts.body.position.y = THREE.MathUtils.lerp(
            characterParts.body.position.y,
            0.5,
            0.02
        );
        characterParts.body.rotation.y = Math.sin(time * 0.2) * 0.02;
    }
    
    // Cross legs
    if (characterParts.leftLeg) {
        characterParts.leftLeg.rotation.x = THREE.MathUtils.lerp(
            characterParts.leftLeg.rotation.x,
            -1.2,
            0.02
        );
        characterParts.leftLeg.rotation.z = THREE.MathUtils.lerp(
            characterParts.leftLeg.rotation.z,
            -0.5,
            0.02
        );
    }
    if (characterParts.rightLeg) {
        characterParts.rightLeg.rotation.x = THREE.MathUtils.lerp(
            characterParts.rightLeg.rotation.x,
            -1.2,
            0.02
        );
        characterParts.rightLeg.rotation.z = THREE.MathUtils.lerp(
            characterParts.rightLeg.rotation.z,
            0.5,
            0.02
        );
    }
    
    // Hands on knees
    if (characterParts.leftArm) {
        characterParts.leftArm.rotation.x = THREE.MathUtils.lerp(
            characterParts.leftArm.rotation.x,
            -0.5,
            0.02
        );
        characterParts.leftArm.rotation.z = THREE.MathUtils.lerp(
            characterParts.leftArm.rotation.z,
            0.8,
            0.02
        );
    }
    if (characterParts.rightArm) {
        characterParts.rightArm.rotation.x = THREE.MathUtils.lerp(
            characterParts.rightArm.rotation.x,
            -0.5,
            0.02
        );
        characterParts.rightArm.rotation.z = THREE.MathUtils.lerp(
            characterParts.rightArm.rotation.z,
            -0.8,
            0.02
        );
    }
    
    // Calm head
    if (characterParts.head) {
        characterParts.head.rotation.x = THREE.MathUtils.lerp(
            characterParts.head.rotation.x,
            0.1,
            0.02
        );
    }
}

function animateDance(time, delta) {
    const beat = time * 8;
    
    // Bouncy body
    if (characterParts.body) {
        characterParts.body.position.y = 0.8 + Math.abs(Math.sin(beat)) * 0.1;
        characterParts.body.rotation.y = Math.sin(beat * 0.5) * 0.3;
    }
    
    // Arms in the air
    if (characterParts.leftArm) {
        characterParts.leftArm.rotation.x = -2 + Math.sin(beat) * 0.3;
        characterParts.leftArm.rotation.z = 0.5 + Math.sin(beat * 0.7) * 0.2;
    }
    if (characterParts.rightArm) {
        characterParts.rightArm.rotation.x = -2 + Math.sin(beat + Math.PI) * 0.3;
        characterParts.rightArm.rotation.z = -0.5 - Math.sin(beat * 0.7) * 0.2;
    }
    
    // Kick legs
    if (characterParts.leftLeg) {
        characterParts.leftLeg.rotation.x = Math.sin(beat) * 0.4;
    }
    if (characterParts.rightLeg) {
        characterParts.rightLeg.rotation.x = Math.sin(beat + Math.PI) * 0.4;
    }
    
    // Head bopping
    if (characterParts.head) {
        characterParts.head.rotation.x = Math.sin(beat * 2) * 0.1;
        characterParts.head.rotation.y = Math.sin(beat) * 0.2;
    }
}

function animateJump(time, delta) {
    const jumpDuration = 1000; // ms
    const progress = ((Date.now() % jumpDuration) / jumpDuration);
    
    // Parabolic jump arc
    const jumpHeight = Math.sin(progress * Math.PI) * 0.8;
    
    if (characterParts.body) {
        characterParts.body.position.y = 0.8 + jumpHeight;
    }
    
    // Arms up during jump
    if (characterParts.leftArm) {
        characterParts.leftArm.rotation.x = -2.5 * Math.sin(progress * Math.PI);
    }
    if (characterParts.rightArm) {
        characterParts.rightArm.rotation.x = -2.5 * Math.sin(progress * Math.PI);
    }
    
    // Legs tuck
    if (characterParts.leftLeg) {
        characterParts.leftLeg.rotation.x = -0.5 * Math.sin(progress * Math.PI);
    }
    if (characterParts.rightLeg) {
        characterParts.rightLeg.rotation.x = -0.5 * Math.sin(progress * Math.PI);
    }
}

// Export for use in main viewer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setPose, POSES, updateCharacterAnimation };
}
