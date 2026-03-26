"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QRCodeSVG } from "qrcode.react";
import {
  CONNECTION_TYPES,
  PERSONAS,
  ATTEMPTS_PER_ROUND,
  ROUNDS_COUNT,
  DASHBOARD_CODE,
  getPersonaById,
} from "@/lib/game-config";

// ── Slide definitions ──────────────────────────────────────

interface Slide {
  type: "content" | "qr" | "game" | "reveal";
  title: string;
  presenter: string;
  round?: number; // which round this game slide controls
  content: React.ReactNode;
}

function useSlides(gameUrl: string): Slide[] {
  return [
    // 0 — Title
    {
      type: "content",
      title: "",
      presenter: "Wilson",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-6xl font-bold text-white mb-4">MULTI-ARMED BANDITS</h1>
          <p className="text-2xl text-muted mb-8">Optimal Decision-Making Under Uncertainty</p>
          <p className="text-lg text-muted">Lance | Wilson | Zak | Tatum | Kenny</p>
          <p className="text-sm text-muted mt-2">March 26, 2026</p>
        </div>
      ),
    },
    // 1 — Exploration vs Exploitation
    {
      type: "content",
      title: "The Exploration-Exploitation Dilemma",
      presenter: "Wilson",
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-xl text-muted mb-10 text-center max-w-2xl">
            You have multiple options. Each has an unknown success rate.
            You have <span className="text-white font-semibold">limited attempts</span>. What do you do?
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-3xl w-full">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <div className="text-xl font-bold text-red-400 mb-2">EXPLOIT</div>
              <div className="text-sm text-muted">Pick what&apos;s worked so far</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <div className="text-xl font-bold text-blue-400 mb-2">EXPLORE</div>
              <div className="text-sm text-muted">Try something new</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🧠</div>
              <div className="text-xl font-bold text-purple-400 mb-2">MIX</div>
              <div className="text-sm text-muted">Balance both intelligently</div>
            </div>
          </div>
        </div>
      ),
    },
    // 2 — QR Code
    {
      type: "qr",
      title: "Pull Out Your Phones",
      presenter: "Wilson",
      content: null, // rendered specially
    },
    // 3 — How Game Works
    {
      type: "content",
      title: "How the Game Works",
      presenter: "Lance",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <div className="space-y-6 text-lg">
            {[
              ["🎓", "You're a student building your professional network"],
              ["🔢", "4 types of connections available to explore"],
              ["🔒", "Each has a HIDDEN response rate you must discover"],
              ["🎮", `3 rounds, ${ATTEMPTS_PER_ROUND} attempts per round = ${ROUNDS_COUNT * ATTEMPTS_PER_ROUND} total tries`],
              ["🏆", "Goal: Maximize successful connections"],
            ].map(([emoji, text], i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-3xl">{emoji}</span>
                <span className="text-white">{text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 4 — Connection Types
    {
      type: "content",
      title: "The 4 Connection Types",
      presenter: "Lance",
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="grid grid-cols-2 gap-6 max-w-2xl w-full mb-8">
            {[
              { emoji: "🎓", name: "YOUR MAJOR", desc: "Students in your field" },
              { emoji: "🔬", name: "ADJACENT FIELDS", desc: "Related but different majors" },
              { emoji: "🌍", name: "DIFFERENT COLLEGES", desc: "Completely different areas" },
              { emoji: "💼", name: "ALUMNI / PROS", desc: "People who've graduated" },
            ].map((t, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">{t.emoji}</div>
                <div className="text-lg font-bold text-white mb-1">{t.name}</div>
                <div className="text-sm text-muted">{t.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xl text-accent font-semibold">Which is best? You&apos;ll have to discover through exploration!</p>
        </div>
      ),
    },
    // 5 — Round 1 Game
    {
      type: "game",
      title: "Round 1 — Play Now",
      presenter: "Zak",
      round: 1,
      content: (
        <div className="text-center mb-6">
          <p className="text-2xl text-white font-semibold">No strategy — go with your gut!</p>
          <p className="text-lg text-muted mt-2">{ATTEMPTS_PER_ROUND} attempts — Pick whatever feels right</p>
        </div>
      ),
    },
    // 6 — Epsilon-Greedy Intro
    {
      type: "content",
      title: "Strategy 1: Epsilon-Greedy",
      presenter: "Tatum",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-green-400 mb-2">80%</div>
              <div className="text-lg text-white font-semibold">EXPLOIT</div>
              <div className="text-sm text-muted mt-1">best option so far</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-yellow-400 mb-2">20%</div>
              <div className="text-lg text-white font-semibold">EXPLORE</div>
              <div className="text-sm text-muted mt-1">randomly</div>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-6 w-full">
            <div className="text-sm text-muted mb-3 font-semibold">WHY IT WORKS</div>
            <div className="space-y-2 text-white">
              <p>Mostly exploits what works</p>
              <p>Keeps exploring for better options</p>
              <p>Guaranteed not to get stuck on a bad choice</p>
            </div>
          </div>
        </div>
      ),
    },
    // 7 — Epsilon-Greedy Example
    {
      type: "content",
      title: "Epsilon-Greedy: Example",
      presenter: "Tatum",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full mb-6">
            <div className="text-sm text-muted mb-3 font-semibold">YOUR ROUND 1 RESULTS</div>
            <table className="w-full text-sm">
              <thead><tr className="text-muted"><th className="text-left py-1">Type</th><th className="text-center">Tries</th><th className="text-center">Success</th><th className="text-center">Rate</th></tr></thead>
              <tbody className="text-white">
                <tr><td className="py-1">Your Major</td><td className="text-center">2</td><td className="text-center">1</td><td className="text-center">50%</td></tr>
                <tr><td className="py-1">Adjacent Fields</td><td className="text-center">1</td><td className="text-center">0</td><td className="text-center">0%</td></tr>
                <tr className="text-success font-semibold"><td className="py-1">Different Colleges</td><td className="text-center">1</td><td className="text-center">1</td><td className="text-center">100%</td></tr>
                <tr><td className="py-1">Alumni/Pros</td><td className="text-center">0</td><td className="text-center">0</td><td className="text-center text-muted">—</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 w-full">
            <div className="text-blue-400 font-semibold mb-3">FOR ROUND 2:</div>
            <p className="text-white mb-2">Best so far: <span className="text-success font-bold">Different Colleges (100%)</span></p>
            <p className="text-muted">~8 attempts → Pick Different (exploit)</p>
            <p className="text-muted">~2 attempts → Try something random (explore)</p>
          </div>
        </div>
      ),
    },
    // 8 — Epsilon-Greedy Code
    {
      type: "content",
      title: "Epsilon-Greedy: The Code",
      presenter: "Tatum",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <pre className="bg-card border border-card-border rounded-xl p-6 text-sm font-mono text-white w-full mb-6 overflow-x-auto">{`success_rate = {}
for each connection_type:
    success_rate[type] = successes / attempts

if random() < 0.2:         # explore
    choice = random_choice()
else:                      # exploit
    choice = max(success_rate)

pull(choice)
update_stats(choice, outcome)`}</pre>
          <div className="flex gap-6">
            <div className="bg-card border border-card-border rounded-lg px-4 py-2 text-center">
              <div className="text-accent font-bold">O(k)</div>
              <div className="text-xs text-muted">per decision</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg px-4 py-2 text-center">
              <div className="text-accent font-bold">PRODUCTION</div>
              <div className="text-xs text-muted">Amazon, Facebook</div>
            </div>
          </div>
        </div>
      ),
    },
    // 9 — Round 2 Game
    {
      type: "game",
      title: "Round 2 — Play Now",
      presenter: "Zak",
      round: 2,
      content: (
        <div className="text-center mb-6">
          <p className="text-2xl text-white font-semibold">Apply Epsilon-Greedy!</p>
          <p className="text-lg text-muted mt-2">80% exploit your best option — 20% explore randomly</p>
        </div>
      ),
    },
    // 10 — Problem with Epsilon-Greedy
    {
      type: "content",
      title: "The Problem with Epsilon-Greedy",
      presenter: "Kenny",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <p className="text-2xl text-white mb-8 text-center">It treats all unknowns equally!</p>
          <div className="grid grid-cols-2 gap-6 w-full mb-8">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
              <div className="text-lg text-white mb-2">Alumni: 5 tries → 1 success (20%)</div>
              <div className="text-green-400 font-bold text-xl">HIGH CONFIDENCE</div>
              <div className="text-sm text-muted mt-1">You know it&apos;s probably bad</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
              <div className="text-lg text-white mb-2">Different: 1 try → 1 success (100%)</div>
              <div className="text-yellow-400 font-bold text-xl">HIGH UNCERTAINTY</div>
              <div className="text-sm text-muted mt-1">Could be great, could be luck!</div>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center w-full">
            <p className="text-xl text-purple-400 font-bold">Thompson&apos;s Insight: Be optimistic about uncertainty</p>
          </div>
        </div>
      ),
    },
    // 11 — Thompson Sampling
    {
      type: "content",
      title: "Thompson Sampling: Bayesian Approach",
      presenter: "Kenny",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full mb-6">
            <p className="text-lg text-white mb-4">Model each option as <span className="font-mono text-accent">Beta(successes + 1, failures + 1)</span></p>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted mb-1">Alumni: 5 tries, 1 success → Beta(2, 5)</div>
                <div className="h-4 bg-card-border rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: "90%" }} /></div>
                <div className="text-xs text-muted mt-0.5">Narrow — confident it&apos;s ~20%</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Different: 1 try, 1 success → Beta(2, 1)</div>
                <div className="h-4 bg-card-border rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: "40%" }} /></div>
                <div className="text-xs text-muted mt-0.5">Wide — could be anywhere from 10% to 90%!</div>
              </div>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 w-full text-center">
            <p className="text-lg text-white font-semibold">THE ALGORITHM</p>
            <p className="text-purple-300 mt-2">Sample from each distribution → Pick the highest sample</p>
          </div>
        </div>
      ),
    },
    // 12 — Thompson Code
    {
      type: "content",
      title: "Thompson Sampling: The Code",
      presenter: "Kenny",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <pre className="bg-card border border-card-border rounded-xl p-6 text-sm font-mono text-white w-full mb-6 overflow-x-auto">{`for each connection_type:
    α = successes + 1
    β = failures + 1
    θ ~ Beta(α, β)   # Sample

choice = argmax(θ)    # Pick highest`}</pre>
          <div className="flex gap-6">
            <div className="bg-card border border-card-border rounded-lg px-4 py-2 text-center">
              <div className="text-accent font-bold">O(k)</div>
              <div className="text-xs text-muted">per decision</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg px-4 py-2 text-center">
              <div className="text-purple-400 font-bold">O(log T)</div>
              <div className="text-xs text-muted">regret — provably optimal!</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg px-4 py-2 text-center">
              <div className="text-accent font-bold">USED AT</div>
              <div className="text-xs text-muted">Netflix, Google, FDA</div>
            </div>
          </div>
        </div>
      ),
    },
    // 13 — Round 3 Game
    {
      type: "game",
      title: "Round 3 — Play Now",
      presenter: "Zak",
      round: 3,
      content: (
        <div className="text-center mb-6">
          <p className="text-2xl text-white font-semibold">Apply Thompson Sampling!</p>
          <p className="text-lg text-muted mt-2">Be optimistic about uncertainty — Explore what you&apos;re unsure about</p>
        </div>
      ),
    },
    // 14 — Reveal
    {
      type: "reveal",
      title: "The Reveal: Hidden Success Rates",
      presenter: "Wilson",
      content: null, // rendered from dashboard data
    },
    // 15 — Key Insight
    {
      type: "content",
      title: "The Key Insight",
      presenter: "Wilson",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <p className="text-2xl text-white mb-10 text-center">
            There&apos;s no universal &quot;best&quot; strategy — it depends on <span className="text-accent">YOUR</span> context.
          </p>
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            {[
              ["🎯", "CAREER GOALS", "Alumni & weak ties work best"],
              ["🛠", "PROJECTS", "Complementary skills beat similarity"],
              ["🔬", "RESEARCH", "Vertical connections — grad students, faculty"],
              ["🌐", "COMMUNITY", "Bridging connections across groups"],
            ].map(([emoji, title, desc], i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-4">
                <div className="text-xl mb-1">{emoji} <span className="text-white font-semibold">{title}</span></div>
                <div className="text-sm text-muted">{desc}</div>
              </div>
            ))}
          </div>
          <p className="text-lg text-accent text-center font-semibold">
            MAB helps you efficiently learn YOUR optimal strategy — that&apos;s why LinkedIn&apos;s algorithm is personalized.
          </p>
        </div>
      ),
    },
    // 16 — Regret Analysis
    {
      type: "content",
      title: "Regret Analysis",
      presenter: "Wilson",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <p className="text-lg text-muted mb-8 text-center">Regret = gap between optimal outcome and what you actually got</p>
          <div className="grid grid-cols-3 gap-6 w-full mb-8">
            <div className="bg-fail/10 border border-fail/30 rounded-xl p-6 text-center">
              <div className="text-xl font-bold text-fail mb-1">Random</div>
              <div className="text-2xl font-mono text-white">O(T)</div>
              <div className="text-sm text-muted mt-1">Linear — keeps making mistakes</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
              <div className="text-xl font-bold text-blue-400 mb-1">Epsilon-Greedy</div>
              <div className="text-2xl font-mono text-white">O(T<sup>2/3</sup>)</div>
              <div className="text-sm text-muted mt-1">Sublinear — good</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
              <div className="text-xl font-bold text-purple-400 mb-1">Thompson</div>
              <div className="text-2xl font-mono text-white">O(log T)</div>
              <div className="text-sm text-muted mt-1">Logarithmic — optimal!</div>
            </div>
          </div>
          <div className="relative h-40 w-full border-l-2 border-b-2 border-card-border">
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted whitespace-nowrap">Cumulative Regret</div>
            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-xs text-muted">Attempts</div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0 100 L 100 10" stroke="#EF4444" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 0 100 Q 50 50 100 30" stroke="#3B82F6" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 0 100 Q 30 60 100 55" stroke="#8B5CF6" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      ),
    },
    // 17 — Real-World Applications
    {
      type: "content",
      title: "Real-World Applications",
      presenter: "Lance",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 w-full">
            {[
              ["🏥", "Clinical Trials", "FDA-approved adaptive treatment allocation"],
              ["🧪", "A/B Testing", "Google, Facebook, Amazon feature testing"],
              ["📢", "Online Advertising", "Meta ads platform — which creative to show"],
              ["💰", "Resource Allocation", "Portfolio optimization & budget decisions"],
              ["🎬", "Recommendations", "Netflix, TikTok, YouTube — what to show next"],
              ["🌐", "Network Routing", "AWS load balancing — which server path"],
            ].map(([emoji, title, desc], i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-4">
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="text-white font-semibold mb-1">{title}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 18 — Why This Matters
    {
      type: "content",
      title: "Why This Matters",
      presenter: "Lance",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full mb-6">
            <div className="text-sm text-muted mb-3 font-semibold">REAL-WORLD OPTIMIZATION HAS:</div>
            <div className="space-y-2 text-white">
              <p>Unknown parameters — you don&apos;t know rates upfront</p>
              <p>Limited resources — can&apos;t try everything infinitely</p>
              <p>Changing conditions — preferences drift over time</p>
              <p>Cost of exploration — every failed attempt has a cost</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 text-center">
              <div className="text-lg font-bold text-accent mb-1">MAB FRAMEWORK</div>
              <div className="text-sm text-muted">A principled way to balance learning vs. earning</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
              <div className="text-lg font-bold text-purple-400 mb-1">THOMPSON SAMPLING</div>
              <div className="text-sm text-muted">O(log T) regret — Provably near-optimal</div>
            </div>
          </div>
        </div>
      ),
    },
    // 19 — Questions
    {
      type: "content",
      title: "Questions?",
      presenter: "All",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
          <div className="space-y-6 text-lg text-muted mb-10">
            <p className="text-white">When is exploration unethical?</p>
            <p className="text-white">What if probabilities change over time?</p>
            <p className="text-white">Where else do you see explore-exploit tradeoffs?</p>
          </div>
          <p className="text-muted">Lance | Wilson | Zak | Tatum | Kenny</p>
        </div>
      ),
    },
  ];
}

// ── Game Dashboard Component (embedded in game slides) ─────

function GameDashboard({ round }: { round: number }) {
  const players = useQuery(api.game.getPlayers) ?? [];
  const allChoices = useQuery(api.game.getAllChoices) ?? [];

  const ROUND_LABELS = ["", "Gut Feeling", "Epsilon-Greedy", "Thompson Sampling"];

  const roundChoicesData = allChoices.filter((c) => c.round === round);

  const choiceDistribution = () => {
    const total = roundChoicesData.length || 1;
    return CONNECTION_TYPES.map((type) => {
      const count = roundChoicesData.filter((c) => c.choice === type.id).length;
      return { ...type, count, pct: Math.round((count / total) * 100) };
    });
  };

  const roundAvg = () => {
    const playerIds = [...new Set(roundChoicesData.map((c) => c.visitorId))];
    if (playerIds.length === 0) return 0;
    const total = playerIds.reduce((sum, pid) => {
      return sum + roundChoicesData.filter((c) => c.visitorId === pid && c.success).length;
    }, 0);
    return total / playerIds.length;
  };

  const playersCompleted = () => {
    const playerIds = [...new Set(roundChoicesData.map((c) => c.visitorId))];
    return playerIds.filter(
      (pid) => roundChoicesData.filter((c) => c.visitorId === pid).length >= ATTEMPTS_PER_ROUND
    ).length;
  };

  const leaderboard = () => {
    const playerIds = [...new Set(roundChoicesData.map((c) => c.visitorId))];
    return playerIds
      .map((pid) => {
        const pc = roundChoicesData.filter((c) => c.visitorId === pid);
        const player = players.find((p) => p.visitorId === pid);
        return {
          pid,
          name: player?.name || "Unknown",
          successes: pc.filter((c) => c.success).length,
        };
      })
      .sort((a, b) => b.successes - a.successes);
  };

  return (
    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
      {/* Choice Distribution */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <h3 className="text-xs text-muted mb-3">Choice Distribution</h3>
        <div className="space-y-2">
          {choiceDistribution().map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-white">{item.emoji} {item.label}</span>
                <span className="text-xs text-muted">{item.count} ({item.pct}%)</span>
              </div>
              <div className="h-2 bg-card-border rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-card-border">
          <div className="text-xs text-muted">Class Average</div>
          <div className="text-2xl font-bold text-white">{roundAvg().toFixed(1)} <span className="text-sm text-muted">/ {ATTEMPTS_PER_ROUND}</span></div>
        </div>
        <div className="mt-2">
          <div className="text-xs text-muted">{playersCompleted()} / {players.length} completed</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card border border-card-border rounded-xl p-4 col-span-2 overflow-y-auto">
        <h3 className="text-xs text-muted mb-3">Round {round} Leaderboard — {ROUND_LABELS[round]}</h3>
        <div className="space-y-1.5">
          {leaderboard().map((entry, i) => (
            <div key={entry.pid} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
              <span className="text-sm font-bold text-muted w-6">#{i + 1}</span>
              <span className="text-sm text-white flex-1 truncate">{entry.name}</span>
              <span className="text-sm font-bold text-accent">{entry.successes}/{ATTEMPTS_PER_ROUND}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reveal Dashboard Component ─────────────────────────────

function RevealDashboard() {
  const players = useQuery(api.game.getPlayers) ?? [];
  const allChoices = useQuery(api.game.getAllChoices) ?? [];

  const ROUND_LABELS = ["", "Gut Feeling", "Epsilon-Greedy", "Thompson Sampling"];

  const roundAvg = (round: number) => {
    const rc = allChoices.filter((c) => c.round === round);
    const playerIds = [...new Set(rc.map((c) => c.visitorId))];
    if (playerIds.length === 0) return 0;
    const total = playerIds.reduce((sum, pid) => sum + rc.filter((c) => c.visitorId === pid && c.success).length, 0);
    return total / playerIds.length;
  };

  const leaderboard = (round: number) => {
    const rc = allChoices.filter((c) => c.round === round);
    const playerIds = [...new Set(rc.map((c) => c.visitorId))];
    return playerIds
      .map((pid) => {
        const pc = rc.filter((c) => c.visitorId === pid);
        const player = players.find((p) => p.visitorId === pid);
        return { pid, name: player?.name || "Unknown", persona: player ? getPersonaById(player.persona) : null, successes: pc.filter((c) => c.success).length };
      })
      .sort((a, b) => b.successes - a.successes);
  };

  return (
    <div className="space-y-4 flex-1 overflow-y-auto">
      {/* Score Progression */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[1, 2, 3].map((r) => (
          <div key={r} className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-xs text-muted mb-1">Round {r} — {ROUND_LABELS[r]}</div>
            <div className="text-3xl font-bold text-white">{roundAvg(r).toFixed(1)}</div>
            <div className="text-xs text-muted">/ {ATTEMPTS_PER_ROUND}</div>
          </div>
        ))}
      </div>

      {/* Hidden Rates */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted">
                <th className="text-left py-1 pr-3">Persona</th>
                {CONNECTION_TYPES.map((t) => (<th key={t.id} className="text-center py-1 px-2">{t.emoji} {t.label}</th>))}
              </tr>
            </thead>
            <tbody>
              {PERSONAS.map((p) => (
                <tr key={p.id} className="border-t border-card-border">
                  <td className="py-1 pr-3 text-white font-medium">{p.name} <span className="text-muted text-xs">({p.major})</span></td>
                  {CONNECTION_TYPES.map((t) => {
                    const isBest = p.bestConnection === t.id;
                    return (<td key={t.id} className={`text-center py-1 px-2 font-mono ${isBest ? "text-success font-bold" : "text-muted"}`}>{Math.round(p.rates[t.id] * 100)}%</td>);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-round leaderboards */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((r) => (
          <div key={r} className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-xs text-muted mb-2">{ROUND_LABELS[r]}</div>
            <div className="space-y-1">
              {leaderboard(r).slice(0, 8).map((e, i) => (
                <div key={e.pid} className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted w-4">#{i + 1}</span>
                  <span className="text-white truncate flex-1">{e.name}</span>
                  <span className="text-accent font-bold">{e.successes}/{ATTEMPTS_PER_ROUND}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Presenter Page ────────────────────────────────────

export default function PresentPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [gameUrl, setGameUrl] = useState("");

  const gameState = useQuery(api.game.getState);
  const setRound = useMutation(api.game.setRound);
  const resetGameMut = useMutation(api.game.resetGame);

  const slides = useSlides(gameUrl);
  const slide = slides[slideIndex];
  const currentRound = gameState?.currentRound ?? 0;
  const roundActive = gameState?.roundActive ?? false;

  useEffect(() => {
    setGameUrl(process.env.NEXT_PUBLIC_GAME_URL || window.location.origin);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("bandit_dashboard_auth") === "true") setAuthenticated(true);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlideIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length]);

  const handleAuth = () => {
    if (code === DASHBOARD_CODE) {
      setAuthenticated(true);
      localStorage.setItem("bandit_dashboard_auth", "true");
    }
  };

  const startRound = useCallback((round: number) => setRound({ currentRound: round, roundActive: true }), [setRound]);
  const endRound = useCallback(() => setRound({ currentRound, roundActive: false }), [setRound, currentRound]);
  const showReveal = useCallback(() => setRound({ currentRound: ROUNDS_COUNT + 1, roundActive: false }), [setRound]);

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card border border-card-border rounded-xl p-8 max-w-sm w-full mx-4">
          <h1 className="text-xl font-bold text-white mb-4 text-center">Presenter Mode</h1>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth()} placeholder="Enter access code" className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent" />
          <button onClick={handleAuth} className="w-full mt-3 px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 transition-colors">Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Slide Content */}
      <div className="flex-1 flex flex-col p-8 min-h-0">
        {/* Title bar */}
        {slide.title && (
          <div className="mb-4 shrink-0">
            <h1 className="text-4xl font-bold text-white">{slide.title}</h1>
            <div className="text-sm text-muted mt-1">{slide.presenter}</div>
          </div>
        )}

        {/* QR slide */}
        {slide.type === "qr" && gameUrl && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <QRCodeSVG value={`${gameUrl}/play`} size={300} level="H" bgColor="transparent" fgColor="#ffffff" />
            <p className="mt-4 text-lg text-muted font-mono">{gameUrl}/play</p>
          </div>
        )}

        {/* Content slide */}
        {slide.type === "content" && <div className="flex-1 min-h-0">{slide.content}</div>}

        {/* Game slide */}
        {slide.type === "game" && slide.round && (
          <div className="flex-1 flex flex-col min-h-0">
            {slide.content}
            {/* Round controls */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              {!roundActive && currentRound !== slide.round && (
                <button onClick={() => startRound(slide.round!)} className="px-5 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80">
                  Start Round {slide.round}
                </button>
              )}
              {roundActive && currentRound === slide.round && (
                <button onClick={endRound} className="px-5 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400">
                  End Round {slide.round}
                </button>
              )}
              {!roundActive && currentRound === slide.round && (
                <>
                  <button onClick={() => startRound(slide.round!)} className="px-5 py-2 bg-card-border text-white rounded-lg font-medium hover:bg-muted text-sm">
                    Re-open Round {slide.round}
                  </button>
                  <span className="text-success text-sm font-medium">Round {slide.round} complete</span>
                </>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ml-auto ${roundActive && currentRound === slide.round ? "bg-success/20 text-success" : "bg-muted/20 text-muted"}`}>
                {roundActive && currentRound === slide.round ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <GameDashboard round={slide.round} />
          </div>
        )}

        {/* Reveal slide */}
        {slide.type === "reveal" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              {currentRound <= ROUNDS_COUNT && (
                <button onClick={showReveal} className="px-5 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400">
                  Show Reveal to Players
                </button>
              )}
              {currentRound > ROUNDS_COUNT && <span className="text-purple-400 text-sm font-medium">Players can see the reveal</span>}
            </div>
            <RevealDashboard />
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="shrink-0 border-t border-card-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSlideIndex((i) => Math.max(i - 1, 0))} disabled={slideIndex === 0} className="px-3 py-1.5 bg-background rounded text-sm text-white disabled:opacity-30">
            ← Prev
          </button>
          <button onClick={() => setSlideIndex((i) => Math.min(i + 1, slides.length - 1))} disabled={slideIndex === slides.length - 1} className="px-3 py-1.5 bg-background rounded text-sm text-white disabled:opacity-30">
            Next →
          </button>
          <span className="text-sm text-muted ml-2">
            {slideIndex + 1} / {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>Presenter: <span className="text-white">{slide.presenter}</span></span>
          <span>← → or Space to navigate</span>
          <button onClick={async () => { if (confirm("Reset all game data?")) await resetGameMut(); }} className="text-fail hover:text-fail/80">Reset</button>
        </div>
      </div>
    </div>
  );
}
