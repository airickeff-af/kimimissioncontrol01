# Vercel Deployment Guide

## Quick Deploy

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Deploy!

## Environment Variables

Set these in Vercel dashboard:

```
HUNTER_API_KEY=your_hunter_key
TELEGRAM_BOT_TOKEN=your_telegram_token
VOYAGE_API_KEY=your_voyage_key
```

## API Routes

Serverless functions in `/api/` directory:
- `/api/tokens` - Token usage data
- `/api/agents` - Agent status
- `/api/tasks` - Task queue

## Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records
3. SSL auto-provisioned

## Live URL

After deploy, your Mission Control will be at:
`https://mission-control-YOURNAME.vercel.app`

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
vercel dev
```
