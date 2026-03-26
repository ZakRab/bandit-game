"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CONNECTION_TYPES,
  ConnectionType,
  PERSONAS,
  ATTEMPTS_PER_ROUND,
  ROUNDS_COUNT,
  DASHBOARD_CODE,
  getPersonaById,
} from "@/lib/game-config";

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");

  const gameState = useQuery(api.game.getState);
  const players = useQuery(api.game.getPlayers) ?? [];
  const allChoices = useQuery(api.game.getAllChoices) ?? [];

  const setRound = useMutation(api.game.setRound);
  const resetGameMut = useMutation(api.game.resetGame);

  const currentRound = gameState?.currentRound ?? 0;
  const roundActive = gameState?.roundActive ?? false;
  const isReveal = currentRound > ROUNDS_COUNT;

  const handleAuth = () => {
    if (code === DASHBOARD_CODE) {
      setAuthenticated(true);
      localStorage.setItem("bandit_dashboard_auth", "true");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("bandit_dashboard_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card border border-card-border rounded-xl p-8 max-w-sm w-full mx-4">
          <h1 className="text-xl font-bold text-white mb-4 text-center">Presenter Dashboard</h1>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="Enter access code"
            className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleAuth}
            className="w-full mt-3 px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  // Computed stats
  const roundChoices = (round: number) => allChoices.filter((c) => c.round === round);
  const currentRoundChoices = roundChoices(currentRound);

  const choiceDistribution = (round: number) => {
    const rc = roundChoices(round);
    const total = rc.length || 1;
    return CONNECTION_TYPES.map((type) => {
      const count = rc.filter((c) => c.choice === type.id).length;
      return { ...type, count, pct: Math.round((count / total) * 100) };
    });
  };

  const roundAvg = (round: number) => {
    const rc = roundChoices(round);
    const playerIds = [...new Set(rc.map((c) => c.visitorId))];
    if (playerIds.length === 0) return 0;
    const total = playerIds.reduce((sum, pid) => {
      return sum + rc.filter((c) => c.visitorId === pid && c.success).length;
    }, 0);
    return total / playerIds.length;
  };

  const playersCompleted = () => {
    const playerIds = [...new Set(currentRoundChoices.map((c) => c.visitorId))];
    return playerIds.filter(
      (pid) => currentRoundChoices.filter((c) => c.visitorId === pid).length >= ATTEMPTS_PER_ROUND
    ).length;
  };

  const ROUND_LABELS = ["", "Gut Feeling", "Epsilon-Greedy", "Thompson Sampling"];

  const leaderboard = (round: number) => {
    const rc = allChoices.filter((c) => c.round === round);
    const playerIds = [...new Set(rc.map((c) => c.visitorId))];
    return playerIds
      .map((pid) => {
        const pc = rc.filter((c) => c.visitorId === pid);
        const player = players.find((p) => p.visitorId === pid);
        return {
          pid,
          name: player?.name || "Unknown",
          persona: player ? getPersonaById(player.persona) : null,
          successes: pc.filter((c) => c.success).length,
          total: pc.length,
        };
      })
      .sort((a, b) => b.successes - a.successes);
  };

  const startRound = (round: number) => setRound({ currentRound: round, roundActive: true });
  const endRound = () => setRound({ currentRound, roundActive: false });
  const showReveal = () => setRound({ currentRound: ROUNDS_COUNT + 1, roundActive: false });

  const resetGame = async () => {
    if (!confirm("This will delete ALL player data and reset the game. Are you sure?")) return;
    await resetGameMut();
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Presenter Dashboard</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-muted">
              Players: <span className="text-white font-semibold">{players.length}</span>
            </span>
            <span className="text-muted">
              Round:{" "}
              <span className="text-white font-semibold">
                {currentRound === 0 ? "Lobby" : isReveal ? "Reveal" : `${currentRound}/${ROUNDS_COUNT}`}
              </span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                roundActive ? "bg-success/20 text-success" : "bg-muted/20 text-muted"
              }`}
            >
              {roundActive ? "LIVE" : "PAUSED"}
            </span>
          </div>
        </div>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-fail/20 text-fail rounded-lg text-sm hover:bg-fail/30 transition-colors"
        >
          Reset Game
        </button>
      </div>

      {/* Round Controls */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Round Controls</h2>
        <div className="flex flex-wrap gap-3">
          {currentRound === 0 && (
            <button
              onClick={() => startRound(1)}
              className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 text-lg"
            >
              Start Round 1
            </button>
          )}
          {currentRound >= 1 && currentRound <= ROUNDS_COUNT && roundActive && (
            <button
              onClick={endRound}
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 text-lg"
            >
              End Round {currentRound}
            </button>
          )}
          {currentRound >= 1 && currentRound <= ROUNDS_COUNT && !roundActive && (
            <>
              {currentRound < ROUNDS_COUNT && (
                <button
                  onClick={() => startRound(currentRound + 1)}
                  className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 text-lg"
                >
                  Start Round {currentRound + 1}
                </button>
              )}
              {currentRound === ROUNDS_COUNT && (
                <button
                  onClick={showReveal}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 text-lg"
                >
                  Show Reveal
                </button>
              )}
              <button
                onClick={() => startRound(currentRound)}
                className="px-6 py-3 bg-card-border text-white rounded-lg font-medium hover:bg-muted text-sm"
              >
                Re-open Round {currentRound}
              </button>
            </>
          )}
          {isReveal && <div className="text-muted text-lg flex items-center">Reveal mode active</div>}
        </div>
        <div className="mt-3 text-sm text-muted">
          {currentRound >= 1 && currentRound <= ROUNDS_COUNT && (
            <>
              {playersCompleted()} / {players.length} players completed this round
            </>
          )}
        </div>
      </div>

      {/* Player List */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Players ({players.length})
        </h2>
        {players.length === 0 ? (
          <div className="text-muted text-sm">No players yet. Waiting for students to join...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {players.map((p) => {
              const persona = getPersonaById(p.persona);
              const pc = allChoices.filter((c) => c.visitorId === p.visitorId);
              const successes = pc.filter((c) => c.success).length;
              return (
                <div
                  key={p.visitorId}
                  className="bg-background rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-muted ml-1.5 text-xs">
                    {persona?.name}
                  </span>
                  {pc.length > 0 && (
                    <span className="text-accent ml-1.5 text-xs font-mono">
                      {successes}/{pc.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Round Leaderboard */}
      {currentRound >= 1 && !isReveal && (
        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Round {currentRound} Leaderboard — {ROUND_LABELS[currentRound]}
          </h3>
          {leaderboard(currentRound).length === 0 ? (
            <div className="text-muted text-sm">Waiting for results...</div>
          ) : (
            <div className="space-y-2">
              {leaderboard(currentRound).map((entry, i) => (
                <div key={entry.pid} className="flex items-center gap-3 bg-background rounded-lg p-3">
                  <span className="text-lg font-bold text-muted w-8">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-medium truncate">{entry.name}</span>
                  </div>
                  <span className="text-lg font-bold text-accent shrink-0">
                    {entry.successes}/{ATTEMPTS_PER_ROUND}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Stats */}
      {currentRound >= 1 && !isReveal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Choice Distribution */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-sm text-muted mb-4">Round {currentRound} Choice Distribution</h3>
            <div className="space-y-3">
              {choiceDistribution(currentRound).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">
                      {item.emoji} {item.label}
                    </span>
                    <span className="text-sm text-muted">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-3 bg-card-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Summary */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-sm text-muted mb-4">Average Scores by Round</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((r) => {
                const avg = roundAvg(r);
                const hasData = roundChoices(r).length > 0;
                return (
                  <div key={r} className={`${!hasData ? "opacity-30" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">
                        Round {r}
                        {r === 1 ? " (Gut)" : r === 2 ? " (Epsilon-Greedy)" : " (Thompson)"}
                      </span>
                      <span className="text-sm font-mono text-white">
                        {hasData ? avg.toFixed(1) : "-"} / {ATTEMPTS_PER_ROUND}
                      </span>
                    </div>
                    <div className="h-3 bg-card-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          r === 1 ? "bg-gray-400" : r === 2 ? "bg-blue-500" : "bg-purple-500"
                        }`}
                        style={{ width: hasData ? `${(avg / ATTEMPTS_PER_ROUND) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reveal Mode */}
      {isReveal && (
        <div className="space-y-6">
          {/* Score Comparison */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Score Progression</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[1, 2, 3].map((r) => {
                const avg = roundAvg(r);
                return (
                  <div key={r} className="bg-background rounded-lg p-4">
                    <div className="text-xs text-muted mb-1">Round {r}</div>
                    <div className="text-3xl font-bold text-white">{avg.toFixed(1)}</div>
                    <div className="text-xs text-muted mt-1">/ {ATTEMPTS_PER_ROUND}</div>
                    <div className="text-xs mt-2 text-muted">
                      {r === 1 ? "No strategy" : r === 2 ? "Epsilon-Greedy" : "Thompson Sampling"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden Rates Table */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hidden Probability Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted">
                    <th className="text-left py-2 pr-4">Persona</th>
                    {CONNECTION_TYPES.map((t) => (
                      <th key={t.id} className="text-center py-2 px-2">
                        {t.emoji} {t.label}
                      </th>
                    ))}
                    <th className="text-center py-2 pl-2">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {PERSONAS.map((p) => (
                    <tr key={p.id} className="border-t border-card-border">
                      <td className="py-2 pr-4 text-white font-medium">{p.name}</td>
                      {CONNECTION_TYPES.map((t) => {
                        const rate = p.rates[t.id];
                        const isBest = p.bestConnection === t.id;
                        return (
                          <td
                            key={t.id}
                            className={`text-center py-2 px-2 font-mono ${
                              isBest ? "text-success font-bold" : "text-muted"
                            }`}
                          >
                            {Math.round(rate * 100)}%
                          </td>
                        );
                      })}
                      <td className="text-center py-2 pl-2 text-success text-xs">{p.bestConnectionLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboards by Round */}
          {[1, 2, 3].map((r) => {
            const entries = leaderboard(r);
            if (entries.length === 0) return null;
            return (
              <div key={r} className="bg-card border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Round {r}: {ROUND_LABELS[r]}
                </h3>
                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <div key={entry.pid} className="flex items-center gap-3 bg-background rounded-lg p-3">
                      <span className="text-lg font-bold text-muted w-8">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{entry.name}</div>
                        <div className="text-xs text-muted">
                          {entry.persona?.name} ({entry.persona?.major})
                        </div>
                      </div>
                      <span className="text-lg font-bold text-accent shrink-0">
                        {entry.successes}/{ATTEMPTS_PER_ROUND}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Regret Visualization */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Regret Curves (Theoretical)</h3>
            <div className="relative h-48 border-l-2 border-b-2 border-card-border ml-4">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted whitespace-nowrap">
                Cumulative Regret
              </div>
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-xs text-muted">Attempts</div>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0 100 L 100 10" stroke="#EF4444" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                <path d="M 0 100 Q 50 50 100 30" stroke="#3B82F6" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                <path d="M 0 100 Q 30 60 100 55" stroke="#8B5CF6" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-fail" />
                <span className="text-muted">Random (linear)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500" />
                <span className="text-muted">Epsilon-Greedy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-purple-500" />
                <span className="text-muted">Thompson (log)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
