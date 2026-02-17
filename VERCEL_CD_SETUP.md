# Vercel Continuous Deployment Setup

This guide walks you through setting up automatic Vercel deployments on every git push.

## 📋 Prerequisites

- GitHub repository with push access
- Vercel account (https://vercel.com)
- Vercel CLI installed locally (optional, for testing)

## 🔐 Step 1: Get Your Vercel Token

### For EricF (Repository Owner):

1. **Login to Vercel**
   ```bash
   npx vercel login
   # or
   vercel login
   ```

2. **Generate Token**
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Name: `GitHub Actions CI/CD`
   - Copy the token (starts with `vercel_`)

3. **Get Project IDs**
   ```bash
   # In your project directory
   vercel projects list
   
   # Or check .vercel/project.json
   cat .vercel/project.json
   ```

   You'll need:
   - `orgId` - Your Vercel organization ID
   - `projectId` - Your project ID

## 🔧 Step 2: Add GitHub Secrets

### In GitHub Repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**

2. Click **New repository secret** and add:

   | Secret Name | Value | Description |
   |------------|-------|-------------|
   | `VERCEL_TOKEN` | `vercel_xxx...` | Your Vercel API token |
   | `VERCEL_ORG_ID` | `team_xxx...` or `user_xxx...` | Vercel organization ID |
   | `VERCEL_PROJECT_ID` | `prj_xxx...` | Vercel project ID |

3. **Verify secrets are set:**
   - All three secrets should appear in the list
   - Values are masked (shown as `***`)

## 🚀 Step 3: Test the Deployment

### Manual Trigger:

1. Go to **Actions** tab in GitHub
2. Select **"Vercel Continuous Deployment"**
3. Click **Run workflow**
4. Select `master` branch
5. Click **Run workflow**

### Automatic Trigger:

1. Make any change to the repository
2. Commit and push to `master`:
   ```bash
   git add .
   git commit -m "Test auto-deployment"
   git push origin master
   ```
3. Watch the Actions tab for the workflow to run

## 📊 Monitoring Deployments

### GitHub Actions Dashboard

- Go to **Actions** tab
- View workflow runs
- Click any run to see detailed logs

### Key Workflow Stages:

1. **🔍 Pre-Deployment Checks** - Validates secrets and skip tags
2. **📊 Quality Audit Gate** - Runs pre-deploy audit (non-blocking)
3. **🚀 Deploy to Vercel** - Builds and deploys to production
4. **🏥 Post-Deploy Health Check** - Verifies `/api/health` returns 200
5. **⏮️ Rollback on Failure** - Auto-rollback if health checks fail

### Health Check Endpoints

The deployment verifies these endpoints:
- `GET /api/health` - Must return 200
- `GET /` - Main page
- `GET /api/tokens` - Token API
- `GET /api/agents` - Agents API
- `GET /api/tasks` - Tasks API

## 🔄 Rollback Procedures

### Automatic Rollback

If health checks fail, the workflow automatically:
1. Finds the previous stable deployment
2. Promotes it to production
3. Verifies the rollback succeeded

### Manual Rollback

If you need to rollback manually:

```bash
# Install Vercel CLI
npm install --global vercel

# Login
vercel login

# List deployments
vercel list

# Promote a specific deployment
vercel promote <deployment-url>
```

### Git-based Rollback

```bash
# Revert the last commit
git revert HEAD

# Push to trigger new deployment
git push origin master
```

## 🛠️ Troubleshooting

### "VERCEL_TOKEN secret is not set"

**Solution:** Add the `VERCEL_TOKEN` secret to GitHub repository settings.

### "Deployment failed with 401 Unauthorized"

**Solution:** 
- Verify your Vercel token is valid
- Check that `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
- Ensure token has access to the project

### "Health check failed"

**Solution:**
- Check the `/api/health` endpoint manually
- Review application logs in Vercel dashboard
- Check if environment variables are set correctly

### "Rollback failed"

**Solution:**
- Check if there are previous deployments
- Verify git history exists
- Manually deploy previous commit via Vercel CLI

## 📁 Files Created

```
.github/
└── workflows/
    └── vercel-deploy.yml      # Main deployment workflow

scripts/
├── health-check.sh            # Post-deploy health verification
└── rollback.sh                # Automatic rollback script
```

## 📝 Skip Deployment

To skip deployment for a commit, include `[skip-deploy]` in the commit message:

```bash
git commit -m "Update docs [skip-deploy]"
```

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

## 📞 Support

If deployment issues persist:
1. Check GitHub Actions logs for detailed error messages
2. Verify Vercel project settings
3. Ensure all secrets are correctly set
4. Test locally with `vercel --prod`
