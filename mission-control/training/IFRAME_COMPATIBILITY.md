# iframe Compatibility Guide

**Target Agents:** Forge (Frontend), Pixel (Design)  
**Purpose:** Ensure all components work correctly in iframe contexts  
**Problem Solved:** iframe compatibility issues affecting dashboard integration

---

## The iframe Problem

### Why iframes Matter

Mission Control uses iframes for:
- Embedded widgets (token tracker, task board)
- Third-party integrations
- Sandboxed content
- Modular dashboard components

### Common iframe Failures

| Issue | Symptom | Impact |
|-------|---------|--------|
| **Parent CSS leaking** | Styles don't match design | Visual inconsistency |
| **Height not adjusting** | Scrollbars or cut-off content | Poor UX |
| **Communication broken** | Parent/child can't talk | Non-functional |
| **Cookies blocked** | Auth doesn't work | Security errors |
| **Mobile overflow** | Content extends beyond viewport | Broken mobile |

---

## iframe Best Practices

### 1. CSS Isolation

**Always scope your styles:**

```css
/* ❌ BAD: Global styles affect parent */
body {
  background: #f5e6c8;
}

/* ✅ GOOD: Scoped to your component */
.mission-control-widget {
  background: #f5e6c8;
  /* Reset any inherited styles */
  margin: 0;
  padding: 16px;
  font-family: 'Press Start 2P', cursive;
}

/* Use CSS custom properties for theming */
.mission-control-widget {
  --mc-primary: #f5e6c8;
  --mc-secondary: #e8d4a8;
  --mc-border: #8b7355;
  
  background: var(--mc-primary);
  color: var(--mc-border);
}
```

### 2. iframe Resizing

**Make iframe height adjust to content:**

```javascript
// In child (iframe content)
function notifyParentOfHeight() {
  const height = document.body.scrollHeight;
  window.parent.postMessage({
    type: 'RESIZE',
    height: height
  }, '*'); // Specify target origin in production
}

// Send on load and resize
window.addEventListener('load', notifyParentOfHeight);
window.addEventListener('resize', notifyParentOfHeight);

// Also when content changes
const observer = new MutationObserver(notifyParentOfHeight);
observer.observe(document.body, { childList: true, subtree: true });
```

```javascript
// In parent (dashboard)
window.addEventListener('message', (event) => {
  // Verify origin in production
  if (event.data.type === 'RESIZE') {
    const iframe = document.getElementById('widget-iframe');
    iframe.style.height = `${event.data.height}px`;
  }
});
```

### 3. Cross-Origin Communication

**Safe postMessage protocol:**

```javascript
// Define message types
const MESSAGE_TYPES = {
  RESIZE: 'RESIZE',
  READY: 'READY',
  DATA_REQUEST: 'DATA_REQUEST',
  DATA_RESPONSE: 'DATA_RESPONSE',
  ERROR: 'ERROR'
};

// In child
function sendToParent(type, payload) {
  window.parent.postMessage({
    source: 'mission-control-widget',
    type,
    payload,
    timestamp: Date.now()
  }, 'https://dashboard-ten-sand-20.vercel.app'); // Specific origin
}

// In parent
window.addEventListener('message', (event) => {
  // Always verify origin
  if (event.origin !== 'https://widget-origin.com') return;
  
  // Verify source
  if (event.data.source !== 'mission-control-widget') return;
  
  switch (event.data.type) {
    case MESSAGE_TYPES.READY:
      console.log('Widget ready');
      break;
    case MESSAGE_TYPES.DATA_REQUEST:
      handleDataRequest(event.data.payload);
      break;
  }
});
```

### 4. Mobile Responsive in iframes

**Handle viewport correctly:**

```html
<!-- In iframe HTML -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
```

```css
/* Mobile-first styles */
.mission-control-widget {
  width: 100%;
  min-width: 280px;
  max-width: 100%;
  box-sizing: border-box;
}

/* Prevent overflow */
.mission-control-widget * {
  max-width: 100%;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .mission-control-widget {
    padding: 8px;
  }
  
  .widget-grid {
    grid-template-columns: 1fr;
  }
}
```

### 5. Cookie/Storage Handling

**Handle third-party cookie restrictions:**

```javascript
// Check if storage is available
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Use parent storage via postMessage if iframe storage blocked
function getStoredData(key) {
  if (isStorageAvailable()) {
    return localStorage.getItem(key);
  }
  
  // Fallback: request from parent
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data.type === 'STORAGE_RESPONSE') {
        window.removeEventListener('message', handler);
        resolve(event.data.value);
      }
    };
    window.addEventListener('message', handler);
    sendToParent('STORAGE_REQUEST', { key });
  });
}
```

---

## Widget Implementation Template

### Complete iframe Widget

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mission Control Widget</title>
  <style>
    /* Reset */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* Widget container */
    .mc-widget {
      --mc-bg: #f5e6c8;
      --mc-border: #8b7355;
      --mc-text: #5a4a3a;
      
      font-family: 'Press Start 2P', cursive;
      background: var(--mc-bg);
      color: var(--mc-text);
      padding: 16px;
      min-height: 100px;
      width: 100%;
    }
    
    /* Content styles */
    .mc-widget-header {
      border-bottom: 4px solid var(--mc-border);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    
    .mc-widget-content {
      line-height: 1.6;
    }
    
    /* Mobile */
    @media (max-width: 480px) {
      .mc-widget {
        padding: 12px;
      }
      .mc-widget-header {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="mc-widget" id="widget">
    <div class="mc-widget-header">
      <h2>Widget Title</h2>
    </div>
    <div class="mc-widget-content" id="content">
      Loading...
    </div>
  </div>
  
  <script>
    // Widget initialization
    (function() {
      const WIDGET_ORIGIN = 'https://dashboard-ten-sand-20.vercel.app';
      
      // Notify parent when ready
      function notifyReady() {
        window.parent.postMessage({
          source: 'mc-widget',
          type: 'READY',
          height: document.body.scrollHeight
        }, WIDGET_ORIGIN);
      }
      
      // Handle resize
      function updateHeight() {
        window.parent.postMessage({
          source: 'mc-widget',
          type: 'RESIZE',
          height: document.body.scrollHeight
        }, WIDGET_ORIGIN);
      }
      
      // Listen for messages from parent
      window.addEventListener('message', (event) => {
        if (event.origin !== WIDGET_ORIGIN) return;
        
        switch (event.data.type) {
          case 'UPDATE_DATA':
            updateContent(event.data.payload);
            break;
          case 'REQUEST_HEIGHT':
            updateHeight();
            break;
        }
      });
      
      // Update content
      function updateContent(data) {
        document.getElementById('content').innerHTML = 
          JSON.stringify(data, null, 2);
        updateHeight();
      }
      
      // Initialize
      window.addEventListener('load', () => {
        notifyReady();
        
        // Watch for content changes
        const observer = new MutationObserver(updateHeight);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
      });
    })();
  </script>
</body>
</html>
```

### Parent Container

```html
<!-- Dashboard embedding the widget -->
<div class="widget-container">
  <iframe 
    id="token-tracker-widget"
    src="https://widgets.mission-control.com/token-tracker"
    frameborder="0"
    scrolling="no"
    style="width: 100%; border: none;"
    allow="fullscreen"
    sandbox="allow-scripts allow-same-origin"
  ></iframe>
</div>

<script>
  // Widget manager
  class WidgetManager {
    constructor(iframeId) {
      this.iframe = document.getElementById(iframeId);
      this.origin = 'https://widgets.mission-control.com';
      this.ready = false;
      
      window.addEventListener('message', this.handleMessage.bind(this));
    }
    
    handleMessage(event) {
      if (event.origin !== this.origin) return;
      if (event.data.source !== 'mc-widget') return;
      
      switch (event.data.type) {
        case 'READY':
          this.ready = true;
          this.iframe.style.height = `${event.data.height}px`;
          break;
        case 'RESIZE':
          this.iframe.style.height = `${event.data.height}px`;
          break;
      }
    }
    
    sendData(data) {
      if (!this.ready) return;
      
      this.iframe.contentWindow.postMessage({
        type: 'UPDATE_DATA',
        payload: data
      }, this.origin);
    }
  }
  
  // Initialize
  const tokenWidget = new WidgetManager('token-tracker-widget');
</script>
```

---

## Testing iframe Compatibility

### Manual Testing Checklist

```
□ Widget loads in iframe
□ No parent CSS leakage
□ Height adjusts to content
□ Mobile responsive works
□ postMessage communication works
□ Cookies/storage work (or fallback works)
□ No console errors
□ Cross-browser tested
□ Resizing handled correctly
□ Parent can send data to child
□ Child can send data to parent
```

### Automated Testing

```javascript
// iframe test utilities
describe('Widget iframe compatibility', () => {
  let iframe;
  
  beforeEach(() => {
    iframe = document.createElement('iframe');
    iframe.src = '/widget.html';
    document.body.appendChild(iframe);
  });
  
  test('loads without errors', async () => {
    await new Promise(resolve => {
      iframe.onload = resolve;
    });
    expect(iframe.contentWindow.document.body).toBeTruthy();
  });
  
  test('sends READY message', async () => {
    const message = await waitForMessage('READY');
    expect(message.height).toBeGreaterThan(0);
  });
  
  test('resizes when content changes', async () => {
    const initialHeight = await waitForMessage('READY').then(m => m.height);
    
    // Add content
    const doc = iframe.contentWindow.document;
    doc.body.innerHTML += '<div style="height: 500px;"></div>';
    
    const newHeight = await waitForMessage('RESIZE').then(m => m.height);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });
});
```

---

## Common iframe Issues & Solutions

### Issue: Styles Not Applying

**Cause:** CSS specificity or parent styles overriding

**Fix:**
```css
.mission-control-widget {
  /* Use !important sparingly but effectively */
  background: #f5e6c8 !important;
  
  /* Or increase specificity */
  html body .mission-control-widget {
    background: #f5e6c8;
  }
}
```

### Issue: iframe Not Resizing

**Cause:** Height calculation or message not received

**Fix:**
```javascript
// Ensure height is calculated after content renders
function updateHeight() {
  requestAnimationFrame(() => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'RESIZE', height }, '*');
  });
}

// Call on load and when images load
window.addEventListener('load', updateHeight);
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('load', updateHeight);
});
```

### Issue: postMessage Not Working

**Cause:** Origin mismatch or message format

**Fix:**
```javascript
// Always specify exact origin
const ALLOWED_ORIGINS = [
  'https://dashboard-ten-sand-20.vercel.app',
  'http://localhost:3000'
];

window.parent.postMessage(data, ALLOWED_ORIGINS[0]);

// And verify on receive
window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn('Message from unauthorized origin:', event.origin);
    return;
  }
  // Handle message
});
```

---

## iframe Security Checklist

```
□ Always verify message origin
□ Use specific targetOrigin in postMessage
□ Set appropriate sandbox attributes
□ Validate all received data
□ Don't trust iframe content
□ Use HTTPS for all iframe sources
□ Set X-Frame-Options or CSP frame-ancestors
□ Sanitize any data displayed from iframe
```

---

## Remember

> "iframe compatibility isn't an afterthought - it's a core requirement for dashboard integration."

**Test in iframe context early and often.**

---

**Questions?** Contact Training Agent  
**Related:** `/training/API_INTEGRATION_CHECKLIST.md`
