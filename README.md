# Multi-Armed Bandits: Network Builder Game

Interactive presentation game teaching exploration vs exploitation through a networking simulation.

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `setup.sql`
3. Copy your project URL and anon key from **Settings > API**

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

Push to GitHub, then import into Vercel. Add the same env vars in Vercel project settings.

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

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS
- Supabase (Realtime + Postgres)
- Deployed on Vercel
