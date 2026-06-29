# FixLoop — Autonomous Deployment Guardian

FixLoop has been upgraded from a localhost demo into a production-ready **GitHub App**. It autonomously guards your deployments against visual and performance regressions using Cerebras Gemma 4 AI.

## How It Works

1. **Baseline Capture:** FixLoop captures baseline screenshots of your configured production routes.
2. **PR Analysis:** Whenever a Pull Request is opened or updated, FixLoop screenshots the preview deployment (e.g., Vercel preview URL).
3. **Pixel Diffing:** It performs a fast pixel diff to triage changed regions.
4. **Agent Pipeline:** The 4-agent AI pipeline runs on any flagged chunks to identify regressions, find root causes, and generate code fixes.
5. **Reporting:** FixLoop posts a detailed report as a comment on the PR.
6. **Auto-Fixing:** If a regression is fixable, FixLoop automatically opens a fix PR against your branch.

## Setup & Deployment (Railway)

Follow these steps to deploy FixLoop and install it on your repository.

### Step 1: Deploy to Railway

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
2. Login and initialize a new project:
   ```bash
   railway login
   railway init
   ```
3. Link to your current directory:
   ```bash
   railway link
   ```
4. Deploy the app:
   ```bash
   railway up
   ```
5. In the Railway dashboard, generate a public domain for your service (e.g., `fixloop-production.up.railway.app`). This is your **App URL**.

### Step 2: Create the GitHub App

1. Go to your GitHub account settings: **Settings > Developer Settings > GitHub Apps > New GitHub App**.
2. Configure the app with the following details:
   - **GitHub App name:** `FixLoop Guardian` (or similar)
   - **Homepage URL:** Your Railway App URL (e.g., `https://fixloop-production.up.railway.app`)
   - **Webhook URL:** Your Railway App URL + `/api/webhook` (e.g., `https://fixloop-production.up.railway.app/api/webhook`)
   - **Webhook secret:** Create a random secure string (save this for later)
3. Set the following **Repository Permissions**:
   - **Pull requests:** Read & write
   - **Contents:** Read & write
   - **Issues:** Read & write
4. Subscribe to the following **Events**:
   - `Pull request`
   - `Installation`
5. Click **Create GitHub App**.
6. On the app page, scroll down to **Private keys** and click **Generate a private key**. Save the downloaded `.pem` file. Note the **App ID** at the top of the page.

### Step 3: Configure Environment Variables

In your Railway dashboard, go to the **Variables** tab and add the following:

```
CEREBRAS_API_KEY=your_cerebras_api_key
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# The URL of the production site you want to protect
TARGET_PRODUCTION_URL=https://your-production-site.com

# Your Vercel preview URL pattern (use {branch} as placeholder)
VERCEL_PREVIEW_PATTERN=https://your-project-git-{branch}-yourorg.vercel.app

# The Railway URL where FixLoop is hosted
APP_URL=https://fixloop-production.up.railway.app
```
*Note: Ensure the private key is properly formatted with `\n` for line breaks.*

Trigger a redeploy on Railway if the variables don't apply automatically.

### Step 4: Install the App on Your Project

1. Go to your GitHub App settings page and click **Install App** from the sidebar.
2. Select the organization or user account, and choose the specific repository you want to protect.
3. Click **Install**. This will trigger the `installation` webhook.
4. Visit your FixLoop dashboard at your Railway App URL. Go to the **Baselines** tab and click **Recapture Baseline** to capture the initial production state.

### Step 5: Test the Workflow

1. Open a new Pull Request in your protected repository with a UI change (e.g., altering a button color).
2. FixLoop will receive the webhook, screenshot the preview URL, run the analysis, and post a detailed report on the PR.
3. You can monitor the live progress in the FixLoop dashboard.

---

## Local Demo Mode

The original interactive localhost demo is still available.

1. Create a `.env.local` file with your `CEREBRAS_API_KEY`.
2. Run `npm run dev`.
3. Navigate to [http://localhost:3000/checkout-preview](http://localhost:3000/checkout-preview) to view the isolated checkout demo.
