#!/bin/bash
# Deploy Mission Control to Netlify as backup

echo "🚀 Deploying Mission Control to Netlify..."
echo "=========================================="

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the project
cd /root/.openclaw/workspace/mission-control

# Create netlify.toml for SPA routing
cat > netlify.toml << 'EOF'
[build]
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

echo "✅ netlify.toml created with SPA routing"

# Deploy to Netlify
netlify deploy --prod --dir=. --site=mission-control-dashboard

echo ""
echo "✅ Netlify deployment complete!"
