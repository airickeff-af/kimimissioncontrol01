# MC Project - Deployment Guide

## GitHub Pages Setup

1. Push code to `github.com/airickeff-af/mc-project`
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose `main` branch and `/public` folder
5. Site will be at: `https://airickeff-af.github.io/mc-project`

## Vercel Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to link project
4. Auto-deploys on every push to main

## Environment Variables

```bash
# .env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
```

## Database Setup

```bash
# Run schema
psql $DATABASE_URL < database/schema.sql
```

## Day 1 Deploy Checklist

- [ ] GitHub repo created
- [ ] GitHub Pages enabled
- [ ] Vercel project linked
- [ ] API endpoints responding
- [ ] 3D viewer loading
- [ ] GLB file uploaded (pending EricF)
