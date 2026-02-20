-- 2D Sprite Fallback Assets
-- 32x32 pixel sprites for 7 animation states

-- Sprite States:
-- 1. idle - standing still
-- 2. walk - walking animation
-- 3. run - running animation
-- 4. exercise - workout pose
-- 5. sleep - sleeping/resting
-- 6. work - working on laptop
-- 7. celebrate - happy celebration

-- Sprite sheet layout (256x224):
-- Row 1: Idle frames (8 frames)
-- Row 2: Walk frames (8 frames)
-- Row 3: Run frames (8 frames)
-- Row 4: Exercise frames (8 frames)
-- Row 5: Sleep frames (8 frames)
-- Row 6: Work frames (8 frames)
-- Row 7: Celebrate frames (8 frames)

-- CSS Sprite Sheet Reference
/*
.sprite {
    width: 32px;
    height: 32px;
    background-image: url('/assets/sprites/character.png');
    background-size: 256px 224px;
}

.sprite.idle { animation: idle 1s steps(8) infinite; }
.sprite.walk { animation: walk 0.8s steps(8) infinite; }
.sprite.run { animation: run 0.5s steps(8) infinite; }
.sprite.exercise { animation: exercise 1.2s steps(8) infinite; }
.sprite.sleep { animation: sleep 2s steps(8) infinite; }
.sprite.work { animation: work 1.5s steps(8) infinite; }
.sprite.celebrate { animation: celebrate 0.6s steps(8) infinite; }

@keyframes idle { from { background-position: 0 0; } to { background-position: -256px 0; } }
@keyframes walk { from { background-position: 0 -32px; } to { background-position: -256px -32px; } }
@keyframes run { from { background-position: 0 -64px; } to { background-position: -256px -64px; } }
@keyframes exercise { from { background-position: 0 -96px; } to { background-position: -256px -96px; } }
@keyframes sleep { from { background-position: 0 -128px; } to { background-position: -256px -128px; } }
@keyframes work { from { background-position: 0 -160px; } to { background-position: -256px -160px; } }
@keyframes celebrate { from { background-position: 0 -192px; } to { background-position: -256px -192px; } }
*/
