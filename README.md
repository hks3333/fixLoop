# FixLoop

A self-healing UI regression detection and repair system powered by Cerebras AI. This MVP demonstrates an autonomous 4-agent pipeline that detects visual regressions, identifies root causes, generates fixes, and verifies them — all in under 60 seconds.

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Screenshots:** Playwright (server-side via Next.js API routes)
- **AI:** Cerebras API (Gemma 4, model ID: `gemma-4-31b`)
- **Streaming:** Server-Sent Events (SSE) for real-time updates

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.local.example` to `.env.local` and fill in your Cerebras API key:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```
   CEREBRAS_API_KEY=your_actual_key_here
   CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Save baseline screenshots:**
   Make sure `styles/checkout.css` is in its clean (bug-free) state, then run:
   ```bash
   npx ts-node scripts/save-baseline.ts
   ```
   This saves baseline screenshots to `public/baseline/`.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Flow

1. Verify the checkout UI looks clean in the left preview panel
2. Click the red **Deploy** button
3. Watch the clock start and the 4 agents execute sequentially:
   - **Agent A (Visual QA):** Compares baseline vs post-deploy screenshots to detect regressions
   - **Agent B (Root Cause):** Analyzes CSS diff to identify the exact property change
   - **Agent C (Fixer):** Generates the minimal CSS patch to fix the regression
   - **Agent D (Verifier):** Confirms the fix resolves the regression
4. A PR card appears showing the generated fix
5. Target time: under 45 seconds on Cerebras

## How It Works

The demo injects a known CSS bug (`z-index: 10` → `z-index: 0` on `.button-wrapper`), which causes the checkout button to render behind an overlay and become unclickable. The 4-agent pipeline autonomously detects, diagnoses, fixes, and verifies this regression.

## Project Structure

```
fixloop/
├── app/
│   ├── page.tsx                  # Main dashboard UI
│   ├── layout.tsx
│   ├── globals.css
│   ├── checkout-preview/         # Isolated checkout page for screenshots
│   └── api/
│       ├── deploy/route.ts       # POST — injects the bug
│       ├── run-loop/route.ts     # GET — SSE stream, runs all 4 agents
│       └── reset/route.ts        # POST — restores the bug
├── components/
│   ├── CheckoutApp.tsx           # The breakable target UI
│   ├── AgentCard.tsx             # Individual agent status card
│   ├── DiffViewer.tsx            # Before/after screenshot comparison
│   ├── PatchViewer.tsx           # Shows the generated code fix
│   └── PRCard.tsx                # Final PR summary card
├── lib/
│   ├── cerebras.ts               # Cerebras API client wrapper
│   ├── agents.ts                 # All 4 agent functions
│   ├── screenshotter.ts          # Playwright screenshot logic
│   ├── bugInjector.ts            # CSS bug injection/reset logic
│   └── types.ts                  # Shared TypeScript types
├── public/
│   └── baseline/                 # Stored baseline screenshots
├── styles/
│   └── checkout.css              # The CSS file the agents will fix
├── scripts/
│   └── save-baseline.ts          # One-time baseline screenshot script
└── package.json
```

## Reset

Click the **Reset** button to restore the CSS to its clean state and reload the preview iframe for another demo run.
