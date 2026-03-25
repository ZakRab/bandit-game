# Multi-Armed Bandits: Network Builder Game

Interactive presentation game teaching exploration vs exploitation through a networking simulation.

## Setup

### 1. Install & Run

```bash
npm install
npx convex dev    # sets up Convex backend (login if prompted)
npm run dev        # in a second terminal
```

### 2. Deploy to Vercel

```bash
npx convex deploy              # deploy Convex to production
vercel --prod                   # deploy frontend (add NEXT_PUBLIC_CONVEX_URL env var)
```

Set `NEXT_PUBLIC_CONVEX_URL` in Vercel to your Convex production URL (shown after `convex deploy`).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Player game (mobile-first) |
| `/dashboard` | Presenter dashboard (code: `bandit2026`) |
| `/qr` | QR code slide (white bg, for projecting) |

## How It Works

- Players scan QR code and get assigned a random persona
- Each persona has hidden success rates for 4 connection types
- 3 rounds of 4 attempts each
- Round 1: No strategy (gut feeling)
- Round 2: Epsilon-greedy hints shown
- Round 3: Thompson sampling confidence bars shown
- Presenter controls rounds from the dashboard
- All data syncs in real-time via Convex

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS
- Convex (real-time backend)
- Deployed on Vercel
