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

const GAME_URL = "https://bandit-game.vercel.app";

// ── Slide definitions ──────────────────────────────────────

interface Slide {
  type: "content" | "qr" | "game" | "reveal" | "regret";
  round?: number;
  presenter: string;
  render: () => React.ReactNode;
}

function useSlides(): Slide[] {
  return [
    // 0 — Title
    {
      type: "content", presenter: "W",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="slide-enter text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 leading-tight">
            MULTI-ARMED BANDITS
          </div>
          <div className="slide-enter-delay-1 text-2xl text-slate-400 font-light tracking-wide mb-12">
            Optimal Decision-Making Under Uncertainty
          </div>
          <div className="slide-enter-delay-2 flex items-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-600" />
            <span className="text-sm text-slate-500 tracking-widest uppercase">Lance &middot; Wilson &middot; Zak &middot; Tatum &middot; Kenny</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-600" />
          </div>
        </div>
      ),
    },
    // 1 — Exploration vs Exploitation
    {
      type: "content", presenter: "W",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="slide-enter text-5xl font-bold text-white mb-4">The Exploration-Exploitation Dilemma</h1>
          <p className="slide-enter-delay-1 text-xl text-slate-400 mb-14 text-center max-w-2xl">
            You have multiple options with unknown success rates and <span className="text-white font-semibold">limited attempts</span>. What do you do?
          </p>
          <div className="grid grid-cols-3 gap-8 max-w-4xl w-full">
            {[
              { icon: "M15 11l-1-1m0 0l-1 1m1-1v4m0 0h4m-4 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z", title: "EXPLOIT", desc: "Pick what's worked so far", color: "from-red-500 to-orange-500", border: "border-red-500/30", bg: "bg-red-500/5", delay: "slide-enter-delay-1" },
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "EXPLORE", desc: "Try something new", color: "from-blue-500 to-cyan-500", border: "border-blue-500/30", bg: "bg-blue-500/5", delay: "slide-enter-delay-2" },
              { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "MIX STRATEGICALLY", desc: "Balance both intelligently", color: "from-purple-500 to-pink-500", border: "border-purple-500/30", bg: "bg-purple-500/5", delay: "slide-enter-delay-3" },
            ].map((item) => (
              <div key={item.title} className={`${item.delay} ${item.bg} border ${item.border} rounded-2xl p-8 text-center hover:scale-105 transition-transform`}>
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${item.color} mb-4`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                </div>
                <div className={`text-xl font-bold bg-gradient-to-r ${item.color} text-transparent bg-clip-text mb-2`}>{item.title}</div>
                <div className="text-base text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 2 — QR Code
    { type: "qr", presenter: "W", render: () => null },
    // 3 — How Game Works
    {
      type: "content", presenter: "L",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-12">How the Game Works</h1>
          <div className="space-y-6 w-full">
            {[
              { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", text: "You're a student building your professional network", color: "text-blue-400" },
              { icon: "M4 6h16M4 10h16M4 14h16M4 18h16", text: "4 types of connections available to explore", color: "text-green-400" },
              { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Each has a HIDDEN response rate you must discover", color: "text-yellow-400" },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: `3 rounds, ${ATTEMPTS_PER_ROUND} attempts per round = ${ROUNDS_COUNT * ATTEMPTS_PER_ROUND} total tries`, color: "text-purple-400" },
              { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", text: "Goal: Maximize successful connections", color: "text-pink-400" },
            ].map((item, i) => (
              <div key={i} className={`slide-enter-delay-${i + 1} flex items-center gap-5 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50`}>
                <div className={`shrink-0 ${item.color}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                </div>
                <span className="text-lg text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 4 — Connection Types
    {
      type: "content", presenter: "L",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="slide-enter text-5xl font-bold text-white mb-12">The 4 Connection Types</h1>
          <div className="grid grid-cols-4 gap-6 max-w-4xl w-full mb-10">
            {[
              { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", name: "YOUR MAJOR", desc: "Students in your field", gradient: "from-blue-500 to-blue-600", delay: "slide-enter-delay-1" },
              { icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", name: "ADJACENT FIELDS", desc: "Related but different majors", gradient: "from-emerald-500 to-teal-600", delay: "slide-enter-delay-2" },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", name: "DIFFERENT COLLEGES", desc: "Completely different areas", gradient: "from-amber-500 to-orange-600", delay: "slide-enter-delay-3" },
              { icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", name: "ALUMNI / PROS", desc: "People who've graduated", gradient: "from-violet-500 to-purple-600", delay: "slide-enter-delay-4" },
            ].map((t) => (
              <div key={t.name} className={`${t.delay} group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 text-center hover:scale-105 transition-transform`}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.gradient}`} />
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${t.gradient} mb-4 mt-2`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} /></svg>
                </div>
                <div className={`text-sm font-bold tracking-wider bg-gradient-to-r ${t.gradient} text-transparent bg-clip-text mb-2`}>{t.name}</div>
                <div className="text-sm text-slate-400">{t.desc}</div>
              </div>
            ))}
          </div>
          <p className="slide-enter-delay-5 text-xl italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Which is best? You&apos;ll have to discover through exploration!
          </p>
        </div>
      ),
    },
    // 5 — Round 1
    {
      type: "game", presenter: "Z", round: 1,
      render: () => (
        <div className="text-center mb-6">
          <h1 className="slide-enter text-5xl font-bold text-white mb-3">Round 1 — Play Now</h1>
          <p className="slide-enter-delay-1 text-xl text-slate-400">No strategy — go with your gut!</p>
          <p className="slide-enter-delay-2 text-base text-slate-500 mt-1">{ATTEMPTS_PER_ROUND} attempts &middot; Pick whatever feels right</p>
        </div>
      ),
    },
    // 6 — Epsilon-Greedy Intro
    {
      type: "content", presenter: "T",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-10">Strategy 1: Epsilon-Greedy</h1>
          <div className="grid grid-cols-2 gap-8 mb-10 w-full max-w-2xl">
            <div className="slide-enter-delay-1 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-8 text-center slide-glow">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-emerald-500 mb-2">80%</div>
              <div className="text-lg text-white font-semibold">EXPLOIT</div>
              <div className="text-base text-slate-400 mt-1">best option so far</div>
            </div>
            <div className="slide-enter-delay-2 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-8 text-center">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-amber-500 mb-2">20%</div>
              <div className="text-lg text-white font-semibold">EXPLORE</div>
              <div className="text-base text-slate-400 mt-1">randomly</div>
            </div>
          </div>
          <div className="slide-enter-delay-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 w-full max-w-2xl">
            <div className="text-sm text-slate-500 font-semibold tracking-wider mb-3 uppercase">Why it works</div>
            <div className="space-y-2 text-slate-300">
              {["Mostly exploits what works", "Keeps exploring for better options", "Guaranteed not to get stuck on a bad choice"].map((t, i) => (
                <div key={i} className="flex items-center gap-3"><svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t}</div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // 7 — Epsilon-Greedy Example
    {
      type: "content", presenter: "T",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-10">Epsilon-Greedy: Example</h1>
          <div className="slide-enter-delay-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 w-full mb-6">
            <div className="text-sm text-slate-500 font-semibold tracking-wider mb-3 uppercase">Your Round 1 Results</div>
            <table className="w-full text-sm"><thead><tr className="text-slate-500 text-xs uppercase tracking-wider"><th className="text-left py-2">Type</th><th className="text-center">Tries</th><th className="text-center">Success</th><th className="text-center">Rate</th></tr></thead>
              <tbody className="text-slate-300">
                <tr className="border-t border-slate-700/50"><td className="py-2">Your Major</td><td className="text-center">2</td><td className="text-center">1</td><td className="text-center">50%</td></tr>
                <tr className="border-t border-slate-700/50"><td className="py-2">Adjacent Fields</td><td className="text-center">1</td><td className="text-center">0</td><td className="text-center text-red-400">0%</td></tr>
                <tr className="border-t border-slate-700/50 text-green-400 font-semibold"><td className="py-2">Different Colleges</td><td className="text-center">1</td><td className="text-center">1</td><td className="text-center">100%</td></tr>
                <tr className="border-t border-slate-700/50"><td className="py-2">Alumni/Pros</td><td className="text-center">0</td><td className="text-center">0</td><td className="text-center text-slate-500">—</td></tr>
              </tbody></table>
          </div>
          <div className="slide-enter-delay-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 w-full">
            <div className="text-blue-400 font-bold mb-3 text-sm uppercase tracking-wider">For Round 2:</div>
            <p className="text-white mb-2">Best so far: <span className="text-green-400 font-bold">Different Colleges (100%)</span></p>
            <p className="text-slate-400">~8 attempts → Pick Different (exploit)</p>
            <p className="text-slate-400">~2 attempts → Try something random (explore)</p>
          </div>
        </div>
      ),
    },
    // 8 — Epsilon-Greedy Code
    {
      type: "content", presenter: "T",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-10">Epsilon-Greedy: The Code</h1>
          <pre className="slide-enter-delay-1 bg-slate-900 border border-slate-700/50 rounded-2xl p-8 text-sm font-mono text-slate-300 w-full mb-8 overflow-x-auto leading-relaxed">{`success_rate = {}
for each connection_type:
    success_rate[type] = successes / attempts

if random() < 0.2:         # explore
    choice = random_choice()
else:                      # exploit
    choice = max(success_rate)

pull(choice)
update_stats(choice, outcome)`}</pre>
          <div className="slide-enter-delay-2 flex gap-6">
            {[
              { label: "O(k)", sub: "per decision", color: "from-blue-500 to-cyan-500" },
              { label: "PRODUCTION", sub: "Amazon, Facebook", color: "from-purple-500 to-pink-500" },
            ].map((b) => (
              <div key={b.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-6 py-3 text-center">
                <div className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${b.color}`}>{b.label}</div>
                <div className="text-sm text-slate-500">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 9 — Round 2
    {
      type: "game", presenter: "Z", round: 2,
      render: () => (
        <div className="text-center mb-6">
          <h1 className="slide-enter text-5xl font-bold text-white mb-3">Round 2 — Play Now</h1>
          <p className="slide-enter-delay-1 text-xl text-blue-400">Apply Epsilon-Greedy!</p>
          <p className="slide-enter-delay-2 text-base text-slate-500 mt-1">80% exploit your best &middot; 20% explore randomly</p>
        </div>
      ),
    },
    // 10 — Problem with Epsilon-Greedy
    {
      type: "content", presenter: "K",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-4">The Problem with Epsilon-Greedy</h1>
          <p className="slide-enter-delay-1 text-xl text-slate-400 mb-10">It treats all unknowns equally!</p>
          <div className="grid grid-cols-2 gap-8 w-full mb-8">
            <div className="slide-enter-delay-2 bg-slate-800/50 border border-green-500/20 rounded-2xl p-8 text-center">
              <div className="text-lg text-slate-300 mb-3">Alumni: 5 tries → 1 success (20%)</div>
              <div className="inline-flex px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 font-bold text-lg mb-2">HIGH CONFIDENCE</div>
              <div className="text-base text-slate-400">You know it&apos;s probably bad</div>
            </div>
            <div className="slide-enter-delay-3 bg-slate-800/50 border border-yellow-500/20 rounded-2xl p-8 text-center">
              <div className="text-lg text-slate-300 mb-3">Different: 1 try → 1 success (100%)</div>
              <div className="inline-flex px-4 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-lg mb-2">HIGH UNCERTAINTY</div>
              <div className="text-base text-slate-400">Could be great, could be luck!</div>
            </div>
          </div>
          <div className="slide-enter-delay-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 text-center w-full slide-glow">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Thompson&apos;s Insight: Be optimistic about uncertainty
            </p>
          </div>
        </div>
      ),
    },
    // 11 — Thompson Sampling with Beta distribution graphs
    {
      type: "content", presenter: "K",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-5xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-3">Thompson Sampling</h1>
          <p className="slide-enter-delay-1 text-xl font-mono text-purple-400 mb-8">Model each option as Beta(successes + 1, failures + 1)</p>
          {/* Beta distribution graphs */}
          <div className="slide-enter-delay-2 grid grid-cols-2 gap-6 w-full mb-8">
            {/* Alumni — Beta(2,5) — narrow peak at ~0.2 */}
            <div className="bg-slate-800/60 border border-green-500/20 rounded-2xl p-5">
              <div className="text-center mb-3">
                <span className="text-lg font-bold text-green-400">Alumni</span>
                <span className="text-base text-slate-400 ml-2">5 tries, 1 success</span>
              </div>
              <svg viewBox="0 0 200 110" className="w-full h-auto">
                {/* Axes */}
                <line x1="30" y1="85" x2="190" y2="85" stroke="#475569" strokeWidth="1" />
                <line x1="30" y1="85" x2="30" y2="10" stroke="#475569" strokeWidth="1" />
                {/* X-axis labels */}
                <text x="30" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.0</text>
                <text x="70" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.2</text>
                <text x="110" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.4</text>
                <text x="150" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.6</text>
                <text x="190" y="100" fill="#64748b" fontSize="8" textAnchor="middle">1.0</text>
                <text x="110" y="110" fill="#64748b" fontSize="8" textAnchor="middle">Success Probability</text>
                {/* Y-axis label */}
                <text x="12" y="50" fill="#64748b" fontSize="7" textAnchor="middle" transform="rotate(-90, 12, 50)">Likelihood</text>
                {/* Beta(2,5) curve — narrow peak near 0.2 */}
                <defs><linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" /></linearGradient></defs>
                <path d="M 30 85 C 35 85, 45 80, 55 50 C 60 30, 65 18, 70 15 C 75 18, 80 30, 90 55 C 105 75, 130 83, 160 84.5 L 190 85 Z" fill="url(#greenGrad)" />
                <path d="M 30 85 C 35 85, 45 80, 55 50 C 60 30, 65 18, 70 15 C 75 18, 80 30, 90 55 C 105 75, 130 83, 160 84.5 L 190 85" fill="none" stroke="#22c55e" strokeWidth="2.5" />
                {/* Peak annotation */}
                <line x1="70" y1="15" x2="70" y2="85" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                <rect x="48" y="28" width="52" height="22" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#22c55e" strokeWidth="0.5" />
                <text x="74" y="37" fill="#22c55e" fontSize="8" textAnchor="middle" fontWeight="bold">~20%</text>
                <text x="74" y="46" fill="#86efac" fontSize="7" textAnchor="middle">High confidence</text>
              </svg>
            </div>
            {/* Different — Beta(2,1) — wide, rising slope */}
            <div className="bg-slate-800/60 border border-amber-500/20 rounded-2xl p-5">
              <div className="text-center mb-3">
                <span className="text-lg font-bold text-amber-400">Different Colleges</span>
                <span className="text-base text-slate-400 ml-2">1 try, 1 success</span>
              </div>
              <svg viewBox="0 0 200 110" className="w-full h-auto">
                <line x1="30" y1="85" x2="190" y2="85" stroke="#475569" strokeWidth="1" />
                <line x1="30" y1="85" x2="30" y2="10" stroke="#475569" strokeWidth="1" />
                <text x="30" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.0</text>
                <text x="70" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.2</text>
                <text x="110" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.4</text>
                <text x="150" y="100" fill="#64748b" fontSize="8" textAnchor="middle">0.6</text>
                <text x="190" y="100" fill="#64748b" fontSize="8" textAnchor="middle">1.0</text>
                <text x="110" y="110" fill="#64748b" fontSize="8" textAnchor="middle">Success Probability</text>
                <text x="12" y="50" fill="#64748b" fontSize="7" textAnchor="middle" transform="rotate(-90, 12, 50)">Likelihood</text>
                {/* Beta(2,1) curve — wide rising slope */}
                <defs><linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" /></linearGradient></defs>
                <path d="M 30 85 L 190 15 L 190 85 Z" fill="url(#amberGrad)" />
                <path d="M 30 85 L 190 15" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                {/* Wide annotation */}
                <rect x="95" y="42" width="65" height="22" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="0.5" />
                <text x="127" y="51" fill="#f59e0b" fontSize="8" textAnchor="middle" fontWeight="bold">Could be anywhere!</text>
                <text x="127" y="60" fill="#fcd34d" fontSize="7" textAnchor="middle">High uncertainty</text>
              </svg>
            </div>
          </div>
          <div className="slide-enter-delay-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 w-full text-center slide-glow">
            <p className="text-sm text-purple-300/60 uppercase tracking-wider mb-2 font-semibold">The Algorithm</p>
            <p className="text-2xl text-white font-semibold">Sample from each distribution → Pick the highest sample</p>
          </div>
        </div>
      ),
    },
    // 12 — Thompson Code
    {
      type: "content", presenter: "K",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-10">Thompson Sampling: The Code</h1>
          <pre className="slide-enter-delay-1 bg-slate-900 border border-slate-700/50 rounded-2xl p-8 text-base font-mono text-slate-300 w-full mb-8 overflow-x-auto leading-relaxed">{`for each connection_type:
    α = successes + 1
    β = failures + 1
    θ ~ Beta(α, β)   # Sample

choice = argmax(θ)    # Pick highest`}</pre>
          <div className="slide-enter-delay-2 flex gap-6">
            {[
              { label: "O(k)", sub: "per decision", color: "from-blue-500 to-cyan-500" },
              { label: "O(log T)", sub: "regret — provably optimal!", color: "from-purple-500 to-pink-500" },
              { label: "USED AT", sub: "Netflix, Google, FDA", color: "from-amber-500 to-orange-500" },
            ].map((b) => (
              <div key={b.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-3 text-center">
                <div className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${b.color}`}>{b.label}</div>
                <div className="text-sm text-slate-500">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 13 — Round 3
    {
      type: "game", presenter: "Z", round: 3,
      render: () => (
        <div className="text-center mb-6">
          <h1 className="slide-enter text-5xl font-bold text-white mb-3">Round 3 — Play Now</h1>
          <p className="slide-enter-delay-1 text-xl text-purple-400">Apply Thompson Sampling!</p>
          <p className="slide-enter-delay-2 text-base text-slate-500 mt-1">Be optimistic about uncertainty &middot; Explore what you&apos;re unsure about</p>
        </div>
      ),
    },
    // 14 — Reveal
    { type: "reveal", presenter: "W", render: () => null },
    // 15 — Live Regret Analysis (from real game data)
    { type: "regret", presenter: "W", render: () => null },
    // 16 — Key Insight
    {
      type: "content", presenter: "W",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-12">The Key Insight</h1>
          <p className="slide-enter-delay-1 text-2xl text-slate-300 mb-12 text-center">
            There&apos;s no universal &quot;best&quot; strategy — it depends on <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">YOUR context</span>.
          </p>
          <div className="grid grid-cols-2 gap-5 w-full mb-10">
            {[
              { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", title: "CAREER GOALS", desc: "Alumni & weak ties work best", color: "from-blue-500 to-cyan-500" },
              { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", title: "PROJECTS", desc: "Complementary skills beat similarity", color: "from-green-500 to-emerald-500" },
              { icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", title: "RESEARCH", desc: "Vertical connections — grad students, faculty", color: "from-amber-500 to-orange-500" },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "COMMUNITY", desc: "Bridging connections across groups", color: "from-purple-500 to-pink-500" },
            ].map((item, i) => (
              <div key={item.title} className={`slide-enter-delay-${i + 1} bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4`}>
                <div className={`shrink-0 p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                </div>
                <div>
                  <div className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${item.color}`}>{item.title}</div>
                  <div className="text-base text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="slide-enter-delay-5 text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold text-center">
            MAB helps you efficiently learn YOUR optimal strategy — that&apos;s why LinkedIn&apos;s algorithm is personalized.
          </p>
        </div>
      ),
    },
    // 16 — Regret
    {
      type: "content", presenter: "W",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-4">Regret Analysis</h1>
          <p className="slide-enter-delay-1 text-lg text-slate-400 mb-10">Regret = gap between optimal outcome and what you actually got</p>
          <div className="grid grid-cols-3 gap-6 w-full mb-10">
            {[
              { title: "Random", big: "O(T)", desc: "Linear — keeps making mistakes", color: "from-red-500 to-rose-500", delay: "slide-enter-delay-2" },
              { title: "Epsilon-Greedy", big: "O(T^2/3)", desc: "Sublinear — good", color: "from-blue-500 to-cyan-500", delay: "slide-enter-delay-3" },
              { title: "Thompson", big: "O(log T)", desc: "Logarithmic — optimal!", color: "from-purple-500 to-pink-500", delay: "slide-enter-delay-4" },
            ].map((c) => (
              <div key={c.title} className={`${c.delay} bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 text-center`}>
                <div className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${c.color} mb-2`}>{c.title}</div>
                <div className="text-3xl font-mono font-bold text-white mb-1">{c.big}</div>
                <div className="text-base text-slate-400">{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="slide-enter-delay-5 relative h-36 w-full max-w-2xl border-l-2 border-b-2 border-slate-700 ml-6">
            <div className="absolute -left-14 top-1/2 -translate-y-1/2 -rotate-90 text-sm text-slate-500 whitespace-nowrap">Cumulative Regret</div>
            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-sm text-slate-500">Attempts</div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0 100 L 100 10" stroke="#EF4444" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 0 100 Q 50 50 100 30" stroke="#3B82F6" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 0 100 Q 30 60 100 55" stroke="#8B5CF6" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      ),
    },
    // 17 — Real-World Applications
    {
      type: "content", presenter: "L",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-12">Real-World Applications</h1>
          <div className="grid grid-cols-3 gap-5 w-full">
            {[
              { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", title: "Clinical Trials", desc: "FDA-approved adaptive treatment allocation", color: "from-red-500 to-rose-500" },
              { icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", title: "A/B Testing", desc: "Google, Facebook, Amazon feature testing", color: "from-blue-500 to-cyan-500" },
              { icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z", title: "Online Advertising", desc: "Meta ads platform — which creative to show", color: "from-amber-500 to-orange-500" },
              { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "Resource Allocation", desc: "Portfolio optimization & budget decisions", color: "from-green-500 to-emerald-500" },
              { icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z", title: "Recommendations", desc: "Netflix, TikTok, YouTube — what to show next", color: "from-purple-500 to-pink-500" },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "Network Routing", desc: "AWS load balancing — which server path", color: "from-indigo-500 to-violet-500" },
            ].map((item, i) => (
              <div key={item.title} className={`slide-enter-delay-${Math.min(i + 1, 5)} bg-slate-800/30 border border-slate-700/50 rounded-xl p-5`}>
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${item.color} mb-3`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                </div>
                <div className="text-white font-semibold mb-1">{item.title}</div>
                <div className="text-sm text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 18 — Why This Matters
    {
      type: "content", presenter: "L",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
          <h1 className="slide-enter text-5xl font-bold text-white mb-10">Why This Matters</h1>
          <div className="slide-enter-delay-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 w-full mb-8">
            <div className="text-sm text-slate-500 font-semibold tracking-wider mb-4 uppercase">Real-world optimization has:</div>
            <div className="space-y-3">
              {["Unknown parameters — you don't know rates upfront", "Limited resources — can't try everything infinitely", "Changing conditions — preferences drift over time", "Cost of exploration — every failed attempt has a cost"].map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shrink-0" />{t}
                </div>
              ))}
            </div>
          </div>
          <div className="slide-enter-delay-2 grid grid-cols-2 gap-4 w-full">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-xl p-5 text-center">
              <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">MAB FRAMEWORK</div>
              <div className="text-base text-slate-400">A principled way to balance learning vs. earning</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-xl p-5 text-center slide-glow">
              <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">THOMPSON SAMPLING</div>
              <div className="text-base text-slate-400">O(log T) regret — Provably near-optimal</div>
            </div>
          </div>
        </div>
      ),
    },
    // 19 — Questions
    {
      type: "content", presenter: "A",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="slide-enter text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-12">Questions?</h1>
          <div className="slide-enter-delay-1 space-y-5 text-xl text-slate-300 mb-12">
            <p>When is exploration unethical?</p>
            <p>What if probabilities change over time?</p>
            <p>Where else do you see explore-exploit tradeoffs?</p>
          </div>
          <div className="slide-enter-delay-2 flex items-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-600" />
            <span className="text-sm text-slate-500 tracking-widest uppercase">Lance &middot; Wilson &middot; Zak &middot; Tatum &middot; Kenny</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-600" />
          </div>
        </div>
      ),
    },
  ];
}

// ── Game Dashboard (embedded in game slides) ───────────────

function GameDashboard({ round }: { round: number }) {
  const players = useQuery(api.game.getPlayers) ?? [];
  const allChoices = useQuery(api.game.getAllChoices) ?? [];
  const ROUND_LABELS = ["", "Gut Feeling", "Epsilon-Greedy", "Thompson Sampling"];
  const rc = allChoices.filter((c) => c.round === round);

  const dist = () => {
    const total = rc.length || 1;
    return CONNECTION_TYPES.map((t) => { const count = rc.filter((c) => c.choice === t.id).length; return { ...t, count, pct: Math.round((count / total) * 100) }; });
  };
  const avg = () => {
    const pids = [...new Set(rc.map((c) => c.visitorId))];
    if (!pids.length) return 0;
    return pids.reduce((s, p) => s + rc.filter((c) => c.visitorId === p && c.success).length, 0) / pids.length;
  };
  const done = () => {
    const pids = [...new Set(rc.map((c) => c.visitorId))];
    return pids.filter((p) => rc.filter((c) => c.visitorId === p).length >= ATTEMPTS_PER_ROUND).length;
  };
  const lb = () => {
    const pids = [...new Set(rc.map((c) => c.visitorId))];
    return pids.map((p) => ({ p, name: players.find((pl) => pl.visitorId === p)?.name || "?", s: rc.filter((c) => c.visitorId === p && c.success).length })).sort((a, b) => b.s - a.s);
  };

  return (
    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-3">Choice Distribution</h3>
        <div className="space-y-2.5">
          {dist().map((item) => (
            <div key={item.id}>
              <div className="flex justify-between mb-0.5"><span className="text-xs text-slate-300">{item.emoji} {item.label}</span><span className="text-sm text-slate-500">{item.count} ({item.pct}%)</span></div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-700/50">
          <div className="text-sm text-slate-500">Class Average</div>
          <div className="text-3xl font-bold text-white">{avg().toFixed(1)} <span className="text-sm text-slate-500">/ {ATTEMPTS_PER_ROUND}</span></div>
          <div className="text-sm text-slate-500 mt-1">{done()} / {players.length} completed</div>
        </div>
      </div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 col-span-2 overflow-y-auto">
        <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-3">Round {round}: {ROUND_LABELS[round]}</h3>
        <div className="space-y-1.5">
          {lb().map((e, i) => (
            <div key={e.p} className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
              <span className={`text-sm font-bold w-6 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-slate-600"}`}>#{i + 1}</span>
              <span className="text-sm text-white flex-1 truncate">{e.name}</span>
              <span className="text-sm font-bold text-accent">{e.s}/{ATTEMPTS_PER_ROUND}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reveal Dashboard ───────────────────────────────────────

function RevealDashboard() {
  const players = useQuery(api.game.getPlayers) ?? [];
  const allChoices = useQuery(api.game.getAllChoices) ?? [];
  const ROUND_LABELS = ["", "Gut Feeling", "Epsilon-Greedy", "Thompson Sampling"];

  const roundAvg = (r: number) => {
    const rc = allChoices.filter((c) => c.round === r);
    const pids = [...new Set(rc.map((c) => c.visitorId))];
    if (!pids.length) return 0;
    return pids.reduce((s, p) => s + rc.filter((c) => c.visitorId === p && c.success).length, 0) / pids.length;
  };
  const lb = (r: number) => {
    const rc = allChoices.filter((c) => c.round === r);
    const pids = [...new Set(rc.map((c) => c.visitorId))];
    return pids.map((p) => ({ p, name: players.find((pl) => pl.visitorId === p)?.name || "?", persona: players.find((pl) => pl.visitorId === p) ? getPersonaById(players.find((pl) => pl.visitorId === p)!.persona) : null, s: rc.filter((c) => c.visitorId === p && c.success).length })).sort((a, b) => b.s - a.s);
  };

  return (
    <div className="space-y-4 flex-1 overflow-y-auto">
      <div className="slide-enter grid grid-cols-3 gap-4 text-center">
        {[1, 2, 3].map((r) => (
          <div key={r} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-sm text-slate-500 mb-1">{ROUND_LABELS[r]}</div>
            <div className="text-4xl font-bold text-white">{roundAvg(r).toFixed(1)}</div>
            <div className="text-sm text-slate-500">/ {ATTEMPTS_PER_ROUND}</div>
          </div>
        ))}
      </div>
      <div className="slide-enter-delay-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-slate-500 text-xs uppercase tracking-wider"><th className="text-left py-1.5 pr-3">Persona</th>{CONNECTION_TYPES.map((t) => (<th key={t.id} className="text-center py-1.5 px-2">{t.emoji} {t.label}</th>))}</tr></thead>
            <tbody>{PERSONAS.map((p) => (<tr key={p.id} className="border-t border-slate-700/30">{[<td key="name" className="py-1.5 pr-3 text-white font-medium">{p.name} <span className="text-slate-500 text-xs">({p.major})</span></td>, ...CONNECTION_TYPES.map((t) => (<td key={t.id} className={`text-center py-1.5 px-2 font-mono ${p.bestConnection === t.id ? "text-green-400 font-bold" : "text-slate-500"}`}>{Math.round(p.rates[t.id] * 100)}%</td>))]}</tr>))}</tbody></table>
        </div>
      </div>
      <div className="slide-enter-delay-2 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((r) => (
          <div key={r} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-sm text-slate-500 mb-2 uppercase tracking-wider">{ROUND_LABELS[r]}</div>
            <div className="space-y-1">{lb(r).slice(0, 8).map((e, i) => (<div key={e.p} className="flex items-center gap-1.5 text-xs"><span className={`w-4 ${i === 0 ? "text-yellow-400 font-bold" : "text-slate-600"}`}>#{i + 1}</span><span className="text-white truncate flex-1">{e.name}</span><span className="text-accent font-bold">{e.s}/{ATTEMPTS_PER_ROUND}</span></div>))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Regret Analysis ───────────────────────────────────

function RegretDashboard() {
  const players = useQuery(api.game.getPlayers) ?? [];
  const allChoices = useQuery(api.game.getAllChoices) ?? [];
  const ROUND_LABELS = ["", "Gut Feeling", "Epsilon-Greedy", "Thompson Sampling"];
  const ROUND_COLORS = ["", "#9ca3af", "#3b82f6", "#8b5cf6"];

  // For each player, compute per-round regret: optimal_expected - actual
  const playerRegrets = () => {
    const pids = [...new Set(allChoices.map((c) => c.visitorId))];
    return pids.map((pid) => {
      const player = players.find((p) => p.visitorId === pid);
      const persona = player ? getPersonaById(player.persona) : null;
      if (!persona) return null;
      const bestRate = Math.max(...Object.values(persona.rates));
      const optimalPerRound = bestRate * ATTEMPTS_PER_ROUND;

      const rounds = [1, 2, 3].map((r) => {
        const rc = allChoices.filter((c) => c.visitorId === pid && c.round === r);
        const actual = rc.filter((c) => c.success).length;
        return { round: r, actual, optimal: optimalPerRound, regret: optimalPerRound - actual };
      });
      return { pid, name: player?.name || "?", rounds };
    }).filter(Boolean) as { pid: string; name: string; rounds: { round: number; actual: number; optimal: number; regret: number }[] }[];
  };

  const data = playerRegrets();
  if (data.length === 0) return <div className="text-slate-500 text-center mt-20">No game data yet</div>;

  // Class averages per round
  const roundStats = [1, 2, 3].map((r) => {
    const roundData = data.map((d) => d.rounds[r - 1]);
    const avgActual = roundData.reduce((s, d) => s + d.actual, 0) / roundData.length;
    const avgOptimal = roundData[0].optimal;
    const avgRegret = roundData.reduce((s, d) => s + d.regret, 0) / roundData.length;
    return { round: r, avgActual, avgOptimal, avgRegret };
  });

  const totalAvgRegret = roundStats.reduce((s, r) => s + r.avgRegret, 0);
  const cumulativeRegret = roundStats.map((_, i) => roundStats.slice(0, i + 1).reduce((s, r) => s + r.avgRegret, 0));
  const maxCumRegret = Math.max(...cumulativeRegret, 1);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-5">
      <h1 className="slide-enter text-5xl font-bold text-white">Your Regret Analysis</h1>
      <p className="slide-enter-delay-1 text-lg text-slate-400">How much did each strategy cost you vs. always picking the optimal?</p>

      {/* Per-round cards */}
      <div className="slide-enter-delay-2 grid grid-cols-3 gap-5">
        {roundStats.map((r) => (
          <div key={r.round} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">{ROUND_LABELS[r.round]}</div>
            <div className="flex items-end gap-3 mb-3">
              <div className="text-4xl font-bold text-white">{r.avgActual.toFixed(1)}</div>
              <div className="text-base text-slate-500 mb-1">/ {r.avgOptimal.toFixed(1)} optimal</div>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${(r.avgActual / r.avgOptimal) * 100}%`, backgroundColor: ROUND_COLORS[r.round] }} />
            </div>
            <div className="text-base font-semibold" style={{ color: ROUND_COLORS[r.round] }}>
              Regret: {r.avgRegret.toFixed(1)} missed connections
            </div>
          </div>
        ))}
      </div>

      {/* Cumulative regret bar chart + total */}
      <div className="slide-enter-delay-3 grid grid-cols-2 gap-5">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="text-sm text-slate-500 uppercase tracking-wider mb-4">Cumulative Regret by Round</div>
          <div className="flex items-end gap-6 h-40">
            {cumulativeRegret.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="text-base font-bold text-white mb-1">{val.toFixed(1)}</div>
                <div className="w-full rounded-t-lg transition-all" style={{ height: `${(val / maxCumRegret) * 100}%`, backgroundColor: ROUND_COLORS[i + 1], minHeight: "4px" }} />
                <div className="text-sm text-slate-500 mt-2">R{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <div className="text-sm text-slate-500 uppercase tracking-wider mb-3">Total Class Regret</div>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400 mb-2">
            {totalAvgRegret.toFixed(1)}
          </div>
          <div className="text-base text-slate-400">missed connections per player</div>
          <div className="text-base text-slate-400 mt-1">out of {(roundStats[0].avgOptimal * 3).toFixed(1)} possible</div>
          <div className="mt-4 text-base font-semibold text-slate-300">
            {roundStats[2].avgRegret < roundStats[0].avgRegret
              ? `Thompson cut regret by ${((1 - roundStats[2].avgRegret / roundStats[0].avgRegret) * 100).toFixed(0)}% vs gut feeling`
              : "Strategies are learning — more attempts would show bigger gains"}
          </div>
        </div>
      </div>

      {/* Regret trend arrow */}
      <div className="slide-enter-delay-4 bg-gradient-to-r from-red-500/5 via-blue-500/5 to-purple-500/5 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          {roundStats.map((r, i) => (
            <div key={r.round} className="flex-1 text-center">
              <div className="text-sm text-slate-500 mb-1">{ROUND_LABELS[r.round]}</div>
              <div className="text-2xl font-bold" style={{ color: ROUND_COLORS[r.round] }}>{r.avgRegret.toFixed(1)}</div>
              <div className="text-sm text-slate-500">regret</div>
              {i < 2 && (
                <div className="inline-block mt-1">
                  {roundStats[i + 1].avgRegret < r.avgRegret
                    ? <span className="text-green-400 text-lg">→ ↓</span>
                    : <span className="text-amber-400 text-lg">→</span>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-3 text-base text-slate-400">
          Smarter algorithms → less regret → better outcomes
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────

export default function PresentPage() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");
  const [si, setSi] = useState(0);

  const gameState = useQuery(api.game.getState);
  const setRound = useMutation(api.game.setRound);
  const resetGameMut = useMutation(api.game.resetGame);
  const slides = useSlides();
  const slide = slides[si];
  const cr = gameState?.currentRound ?? 0;
  const ra = gameState?.roundActive ?? false;

  useEffect(() => { if (localStorage.getItem("bandit_dashboard_auth") === "true") setAuthed(true); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setSi((i) => Math.min(i + 1, slides.length - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setSi((i) => Math.max(i - 1, 0)); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [slides.length]);

  const startR = useCallback((r: number) => setRound({ currentRound: r, roundActive: true }), [setRound]);
  const endR = useCallback(() => setRound({ currentRound: cr, roundActive: false }), [setRound, cr]);
  const reveal = useCallback(() => setRound({ currentRound: ROUNDS_COUNT + 1, roundActive: false }), [setRound]);

  const handleAuth = () => { if (code === DASHBOARD_CODE) { setAuthed(true); localStorage.setItem("bandit_dashboard_auth", "true"); } };

  if (!authed) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-card border border-card-border rounded-xl p-8 max-w-sm w-full mx-4">
        <h1 className="text-xl font-bold text-white mb-4 text-center">Presenter Mode</h1>
        <input type="password" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth()} placeholder="Access code" className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent" />
        <button onClick={handleAuth} className="w-full mt-3 px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/80">Enter</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1a] overflow-hidden" key={si}>
      <div className="flex-1 flex flex-col p-10 min-h-0">
        {/* QR slide */}
        {slide.type === "qr" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="slide-enter text-5xl font-bold text-white mb-10">Pull Out Your Phones</h1>
            <div className="slide-scale bg-white p-6 rounded-3xl shadow-2xl shadow-blue-500/20 mb-6">
              <QRCodeSVG value={`${GAME_URL}/play`} size={320} level="H" />
            </div>
            <p className="slide-enter-delay-2 text-lg text-slate-400 font-mono">{GAME_URL}/play</p>
          </div>
        )}

        {/* Content slide */}
        {slide.type === "content" && <div className="flex-1 min-h-0">{slide.render()}</div>}

        {/* Game slide */}
        {slide.type === "game" && slide.round && (
          <div className="flex-1 flex flex-col min-h-0">
            {slide.render()}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              {!ra && cr !== slide.round && (
                <button onClick={() => startR(slide.round!)} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition">Start Round {slide.round}</button>
              )}
              {ra && cr === slide.round && (
                <button onClick={endR} className="px-5 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition">End Round {slide.round}</button>
              )}
              {!ra && cr === slide.round && (
                <>
                  <button onClick={() => startR(slide.round!)} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">Re-open</button>
                  <span className="text-green-400 text-sm font-medium">Round complete</span>
                </>
              )}
              <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${ra && cr === slide.round ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-500"}`}>
                {ra && cr === slide.round ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <GameDashboard round={slide.round} />
          </div>
        )}

        {/* Reveal */}
        {slide.type === "reveal" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <h1 className="text-4xl font-bold text-white">The Reveal</h1>
              <div className="ml-auto">
                {cr <= ROUNDS_COUNT && <button onClick={reveal} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90">Reveal to Players</button>}
                {cr > ROUNDS_COUNT && <span className="text-purple-400 text-sm">Players can see results</span>}
              </div>
            </div>
            <RevealDashboard />
          </div>
        )}

        {/* Live Regret Analysis */}
        {slide.type === "regret" && (
          <div className="flex-1 flex flex-col min-h-0">
            <RegretDashboard />
          </div>
        )}
      </div>

      {/* Presenter hint — bottom right, barely visible */}
      <div className="absolute bottom-4 right-6 text-[10px] font-mono text-slate-700/40 select-none pointer-events-none">
        {slide.presenter}
      </div>

      {/* Minimal floating nav */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-4 py-2">
        <button onClick={() => setSi((i) => Math.max(i - 1, 0))} disabled={si === 0} className="text-slate-400 hover:text-white disabled:opacity-20 transition px-1">←</button>
        <span className="text-sm text-slate-500 w-12 text-center">{si + 1}/{slides.length}</span>
        <button onClick={() => setSi((i) => Math.min(i + 1, slides.length - 1))} disabled={si === slides.length - 1} className="text-slate-400 hover:text-white disabled:opacity-20 transition px-1">→</button>
      </div>
    </div>
  );
}
