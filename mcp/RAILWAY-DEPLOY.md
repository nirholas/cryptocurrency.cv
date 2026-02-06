# Railway Deployment Instructions

**Official Deployment:** `https://plugins.support` (already deployed)

This guide is for deploying your own instance.

## Quick Deploy (CLI)

1. **Install Railway CLI:**
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy from the mcp folder:**
   ```bash
   cd mcp
   railway init
   railway up
   ```

4. **Get your deployment URL:**
   ```bash
   railway open
   ```
   
   Your URL will be something like: `https://your-app.up.railway.app`

5. **Use in ChatGPT:**
   - Endpoint: `https://your-app.up.railway.app/sse`

## Environment Variables (Optional)

If needed, set environment variables:
```bash
railway variables set API_BASE=https://cryptocurrency.cv
railway variables set PORT=3001
```

## Check Deployment Status

```bash
railway status
railway logs
```

## One-Click Deploy (Alternative)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/nirholas/free-crypto-news&envs=API_BASE&API_BASEDefault=https://cryptocurrency.cv)

Click the button above to deploy without CLI.
