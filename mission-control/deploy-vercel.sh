#!/bin/bash
# Vercel deployment script

echo "🚀 Deploying to Vercel..."

# Check if logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Vercel"
    echo "🔗 Visit: https://vercel.com/oauth/device?user_code=$(vercel login 2>&1 | grep -o '[A-Z]*-[A-Z]*' | head -1)"
    exit 1
fi

# Deploy
vercel --prod --yes

echo "✅ Deploy complete!"
