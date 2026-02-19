# TASK-P0-008: Fix scout.html to Use Live API Data

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Code-3, Forge-3  
**Status:** 🔴 NOT STARTED

---

## Problem
The scout.html page contains **completely static HTML content** with hardcoded opportunities. There is no JavaScript data fetching at all.

## Evidence
```html
<!-- Lines 50-180: Hardcoded opportunities -->
<div class="opportunity">
    <span class="tag">AFFILIATE MARKETING</span>
    <h2>SaaS Tool Affiliate Stack (Typefully + Beehiiv + ConvertKit)</h2>
    
    <div class="metric">
        <span class="metric-icon">⏱️</span>
        <span class="metric-label">Time Required:</span>
        <span class="metric-value">3-5 hours/week</span>
    </div>
    
    <!-- Static content continues... -->
</div>

<!-- Static date -->
<p class="date">Updated: February 18, 2026</p>
```

## Solution

### Step 1: Add API Configuration and Fetch
```html
<script>
const API_URL = '/api';

async function loadOpportunities() {
    const content = document.getElementById('opportunities-content');
    content.innerHTML = '<div class="loading">Loading opportunities...</div>';

    try {
        const response = await fetch(`${API_URL}/scout`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('API returned error');
        }

        renderOpportunities(data.opportunities || []);
        document.getElementById('last-updated').textContent = 
            `Updated: ${new Date().toLocaleDateString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric' 
            })}`;
    } catch (error) {
        content.innerHTML = `<div class="error">⚠️ Failed to load opportunities: ${error.message}</div>`;
    }
}

function renderOpportunities(opportunities) {
    const content = document.getElementById('opportunities-content');
    
    if (opportunities.length === 0) {
        content.innerHTML = '<div class="loading">No opportunities found</div>';
        return;
    }

    content.innerHTML = opportunities.map(opp => `
        <div class="opportunity">
            <span class="tag" style="background: ${opp.tagColor || '#00d4ff20'}; color: ${opp.tagColor || '#00d4ff'};">
                ${opp.category || 'OPPORTUNITY'}
            </span>
            <h2>${opp.title}</h2>
            
            <div class="metric">
                <span class="metric-icon">⏱️</span>
                <span class="metric-label">Time Required:</span>
                <span class="metric-value">${opp.timeRequired || 'TBD'}</span>
            </div>
            
            <div class="metric">
                <span class="metric-icon">💰</span>
                <span class="metric-label">Revenue Potential:</span>
                <span class="metric-value">${opp.revenue || 'TBD'}</span>
            </div>

            <div class="section">
                <h3>📝 Description</h3>
                <p>${opp.description || ''}</p>
            </div>

            ${opp.steps ? `
            <div class="section">
                <h3>🎯 Steps to Start</h3>
                <div class="steps">
                    ${opp.steps.map((step, i) => `
                        <div class="step"><strong>${step}</strong></div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `).join('');
}

// Load on page load
loadOpportunities();

// Auto-refresh every 30 minutes
setInterval(loadOpportunities, 30 * 60 * 1000);
</script>
```

### Step 2: Update HTML Structure
Replace static content with dynamic container:
```html
<div class="container">
    <h1>🔭 Scout Report</h1>
    <p class="subtitle">Daily Opportunities Research</p>
    <p class="date" id="last-updated">Loading...</p>
    
    <div id="opportunities-content">
        <div class="loading">Loading opportunities...</div>
    </div>
</div>
```

### Step 3: Add Loading and Error Styles
```css
.loading { text-align: center; padding: 3rem; color: #888; }
.error { text-align: center; padding: 3rem; color: #ff4444; }
```

## Files to Modify
- `/root/.openclaw/workspace/scout.html`

## Acceptance Criteria
- [ ] Fetches opportunities from `/api/scout`
- [ ] Displays opportunities dynamically
- [ ] Shows loading state during fetch
- [ ] Shows error message on API failure
- [ ] Updates "last updated" timestamp dynamically
- [ ] Auto-refreshes every 30 minutes
- [ ] All static hardcoded content removed

## Testing
1. Load page - verify API call is made
2. Verify opportunities display from API
3. Verify loading state shows initially
4. Test error handling with API down
5. Wait 30 minutes - verify auto-refresh
