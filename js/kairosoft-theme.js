/**
 * TASK-047: Kairosoft Theme Application
 * Apply Kairosoft game aesthetic to all dashboard pages
 */

// Kairosoft Theme Configuration
const KAIROSOFT_THEME = {
    colors: {
        bgPrimary: '#2d1b4e',
        bgSecondary: '#3d2652',
        panelBg: '#f4e4c1',
        panelBorder: '#8b7355',
        panelShadow: '#5c4a3a',
        textDark: '#2c1810',
        textLight: '#f4e4c1',
        accentCyan: '#00d4ff',
        accentPink: '#ff6b6b',
        accentGreen: '#51cf66',
        accentBlue: '#339af0',
        accentYellow: '#fcc419',
        accentPurple: '#da77f2',
        accentOrange: '#ff8787'
    },
    fonts: {
        header: "'Press Start 2P', cursive",
        body: "'VT323', monospace"
    }
};

// Common Kairosoft CSS to inject
const KAIROSOFT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

:root {
    --k-bg: #2d1b4e;
    --k-bg-secondary: #3d2652;
    --k-panel: #f4e4c1;
    --k-border: #8b7355;
    --k-shadow: #5c4a3a;
    --k-text: #2c1810;
    --k-text-light: #f4e4c1;
    --k-cyan: #00d4ff;
    --k-pink: #ff6b6b;
    --k-green: #51cf66;
    --k-blue: #339af0;
    --k-yellow: #fcc419;
    --k-purple: #da77f2;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    image-rendering: pixelated;
    -webkit-tap-highlight-color: transparent;
}

html {
    font-family: 'VT323', monospace;
    background: var(--k-bg);
    color: var(--k-text-light);
    line-height: 1.4;
}

body {
    min-height: 100vh;
    overflow-x: hidden;
}

/* Pixel Grid Background */
body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px);
    pointer-events: none;
    z-index: 0;
}

/* Game Container */
.k-container {
    position: relative;
    z-index: 1;
    max-width: 1600px;
    margin: 0 auto;
    padding: 15px;
    min-height: 100vh;
    padding-bottom: 100px;
}

/* Header */
.k-header {
    background: linear-gradient(180deg, #5c3d7a 0%, #3d2652 100%);
    border: 4px solid #2d1b4e;
    border-radius: 8px;
    padding: 15px 20px;
    margin-bottom: 15px;
    box-shadow: 0 4px 0 #1a0f2e, inset 0 2px 0 rgba(255,255,255,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}

.k-title {
    font-family: 'Press Start 2P', cursive;
    font-size: clamp(0.6rem, 2vw, 0.9rem);
    color: var(--k-yellow);
    text-shadow: 3px 3px 0 #2d1b4e;
    letter-spacing: 2px;
    line-height: 1.6;
}

.k-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.k-stat-box {
    background: var(--k-panel);
    border: 3px solid var(--k-border);
    border-radius: 4px;
    padding: 8px 12px;
    min-width: 80px;
    text-align: center;
    box-shadow: 0 3px 0 var(--k-shadow);
}

.k-stat-label {
    color: #8b7355;
    font-size: 0.75rem;
}

.k-stat-value {
    color: var(--k-text);
    font-weight: bold;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.8rem;
}

/* Panel */
.k-panel {
    background: var(--k-panel);
    border: 4px solid var(--k-border);
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 0 var(--k-shadow), inset 0 2px 0 rgba(255,255,255,0.5);
    margin-bottom: 15px;
}

.k-panel-title {
    font-family: 'Press Start 2P', cursive;
    font-size: 0.65rem;
    color: var(--k-border);
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 3px solid var(--k-border);
    line-height: 1.6;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Buttons */
.k-btn {
    font-family: 'Press Start 2P', cursive;
    font-size: 0.5rem;
    padding: 10px 14px;
    background: linear-gradient(180deg, #74c0fc 0%, #339af0 100%);
    border: 3px solid #2d1b4e;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 4px 0 #2d1b4e;
    transition: all 0.1s;
    color: var(--k-text);
    line-height: 1.4;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.k-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #2d1b4e;
}

.k-btn:active {
    transform: translateY(4px);
    box-shadow: 0 0 0 #2d1b4e;
}

.k-btn.active {
    background: linear-gradient(180deg, #69db7c 0%, #51cf66 100%);
}

.k-btn.secondary {
    background: linear-gradient(180deg, #fcc419 0%, #f59f00 100%);
}

.k-btn.danger {
    background: linear-gradient(180deg, #ff8787 0%, #fa5252 100%);
}

/* Navigation */
.k-nav {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* Cards */
.k-card {
    background: linear-gradient(180deg, #fff 0%, #f0e6d3 100%);
    border: 3px solid var(--k-border);
    border-radius: 6px;
    padding: 12px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
}

.k-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: var(--card-color, var(--k-cyan));
}

.k-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 0 var(--k-shadow);
}

/* Status Badges */
.k-status {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: 'Press Start 2P', cursive;
    white-space: nowrap;
    border: 2px solid;
}

.k-status.active { background: rgba(81, 207, 102, 0.2); color: #2b8a3e; border-color: #51cf66; }
.k-status.busy { background: rgba(252, 196, 25, 0.2); color: #e67700; border-color: #fcc419; }
.k-status.idle { background: rgba(134, 142, 153, 0.2); color: #495057; border-color: #adb5bd; }
.k-status.offline { background: rgba(255, 107, 107, 0.2); color: #c92a2a; border-color: #ff6b6b; }

/* Tables */
.k-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

.k-table th {
    background: var(--k-border);
    color: var(--k-panel);
    font-family: 'Press Start 2P', cursive;
    font-size: 0.55rem;
    padding: 12px;
    text-align: left;
}

.k-table td {
    padding: 10px 12px;
    border-bottom: 2px dashed var(--k-border);
    color: var(--k-text);
}

.k-table tr:hover td {
    background: rgba(139, 115, 85, 0.1);
}

/* Progress Bars */
.k-progress {
    width: 100%;
    height: 20px;
    background: #ddd;
    border: 2px solid var(--k-text);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.k-progress-fill {
    height: 100%;
    transition: width 0.5s ease;
}

.k-progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Press Start 2P', cursive;
    font-size: 0.5rem;
    color: var(--k-text);
    text-shadow: 1px 1px 0 rgba(255,255,255,0.7);
}

/* Form Elements */
.k-input {
    font-family: 'VT323', monospace;
    font-size: 1rem;
    padding: 10px 14px;
    background: #fff;
    border: 3px solid var(--k-border);
    border-radius: 6px;
    color: var(--k-text);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.k-input:focus {
    outline: none;
    border-color: var(--k-blue);
}

/* Scrollbar */
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: var(--k-panel); border-radius: 5px; }
::-webkit-scrollbar-thumb { background: var(--k-border); border-radius: 5px; border: 2px solid var(--k-panel); }
::-webkit-scrollbar-thumb:hover { background: #6b5a45; }

/* Mobile Navigation */
.k-mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #3d2652;
    border-top: 4px solid #2d1b4e;
    padding: 10px;
    z-index: 101;
    justify-content: space-around;
}

.k-mobile-nav-btn {
    padding: 10px 14px;
    background: var(--k-panel);
    border: 3px solid var(--k-border);
    border-radius: 6px;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.5rem;
    color: var(--k-text);
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    line-height: 1.4;
    box-shadow: 0 3px 0 var(--k-shadow);
}

/* Grid Layouts */
.k-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.k-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.k-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }

/* Responsive */
@media (max-width: 1200px) {
    .k-grid-4 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .k-container { padding: 10px; padding-bottom: 90px; }
    .k-title { font-size: 0.55rem; letter-spacing: 1px; }
    .k-stat-box { padding: 6px 8px; min-width: 60px; }
    .k-grid-2, .k-grid-3, .k-grid-4 { grid-template-columns: 1fr; }
    .k-mobile-nav { display: flex; }
}

@media (max-width: 480px) {
    .k-title { font-size: 0.45rem; }
    .k-mobile-nav-btn { padding: 8px 10px; font-size: 0.45rem; }
}
`;

console.log('Kairosoft Theme System loaded');
console.log('Apply to pages: scout.html, dealflow-view.html, task-board.html, token-tracker.html, logs-view.html, data-viewer.html');
