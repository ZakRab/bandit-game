"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  CONNECTION_TYPES,
  ConnectionType,
  PERSONAS,
  Persona,
  ATTEMPTS_PER_ROUND,
  ROUNDS_COUNT,
  rollSuccess,
  getPersonaById,
} from "@/lib/game-config";
import { v4 as uuidv4 } from "uuid";

interface Choice {
  round: number;
  attempt: number;
  choice: ConnectionType;
  success: boolean;
}

interface Stats {
  attempts: number;
  successes: number;
}

function getStats(choices: Choice[]): Record<ConnectionType, Stats> {
  const stats: Record<ConnectionType, Stats> = {
    major: { attempts: 0, successes: 0 },
    adjacent: { attempts: 0, successes: 0 },
    different: { attempts: 0, successes: 0 },
    alumni: { attempts: 0, successes: 0 },
  };
  for (const c of choices) {
    stats[c.choice].attempts++;
    if (c.success) stats[c.choice].successes++;
  }
  return stats;
}

function getBestType(stats: Record<ConnectionType, Stats>): ConnectionType | null {
  let best: ConnectionType | null = null;
  let bestRate = -1;
  for (const type of CONNECTION_TYPES) {
    const s = stats[type.id];
    if (s.attempts > 0) {
      const rate = s.successes / s.attempts;
      if (rate > bestRate) {
        bestRate = rate;
        best = type.id;
      }
    }
  }
  return best;
}

function getConfidence(s: Stats): { level: "unknown" | "low" | "medium" | "high"; rate: number } {
  if (s.attempts === 0) return { level: "unknown", rate: 0 };
  const rate = s.successes / s.attempts;
  if (s.attempts <= 1) return { level: "low", rate };
  if (s.attempts <= 3) return { level: "medium", rate };
  return { level: "high", rate };
}

export default function PlayerPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundActive, setRoundActive] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [lastResult, setLastResult] = useState<{ success: boolean; type: ConnectionType } | null>(null);
  const [connected, setConnected] = useState(false);
  const resultTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roundChoices = choices.filter((c) => c.round === currentRound);
  const currentAttempt = roundChoices.length;
  const canPlay = roundActive && currentRound >= 1 && currentRound <= ROUNDS_COUNT && currentAttempt < ATTEMPTS_PER_ROUND;
  const allStats = getStats(choices);
  const bestType = getBestType(allStats);
  const totalSuccesses = choices.filter((c) => c.success).length;

  // Initialize player
  useEffect(() => {
    let id = localStorage.getItem("bandit_player_id");
    let personaId = localStorage.getItem("bandit_persona_id");

    if (!id) {
      id = uuidv4();
      localStorage.setItem("bandit_player_id", id);
    }
    if (!personaId) {
      const p = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      personaId = p.id;
      localStorage.setItem("bandit_persona_id", personaId);
    }

    setPlayerId(id);
    setPersona(getPersonaById(personaId) || PERSONAS[0]);

    // Register player in Supabase
    supabase
      .from("players")
      .upsert({ id, persona: personaId }, { onConflict: "id" })
      .then();

    // Load existing choices
    supabase
      .from("choices")
      .select("*")
      .eq("player_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setChoices(
            data.map((d: { round: number; attempt: number; choice: string; success: boolean }) => ({
              round: d.round,
              attempt: d.attempt,
              choice: d.choice as ConnectionType,
              success: d.success,
            }))
          );
        }
      });
  }, []);

  // Subscribe to game state
  useEffect(() => {
    supabase
      .from("game_sessions")
      .select("*")
      .eq("id", "main")
      .single()
      .then(({ data }) => {
        if (data) {
          setCurrentRound(data.current_round);
          setRoundActive(data.round_active);
          setConnected(true);
        }
      });

    const channel = supabase
      .channel("game-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_sessions", filter: "id=eq.main" },
        (payload) => {
          const data = payload.new as { current_round: number; round_active: boolean };
          setCurrentRound(data.current_round);
          setRoundActive(data.round_active);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnected(true);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const makeChoice = useCallback(
    async (type: ConnectionType) => {
      if (!canPlay || !playerId || !persona) return;

      const success = rollSuccess(persona.rates[type]);
      const attempt = currentAttempt + 1;

      const newChoice: Choice = { round: currentRound, attempt, choice: type, success };
      setChoices((prev) => [...prev, newChoice]);

      setLastResult({ success, type });
      if (resultTimeout.current) clearTimeout(resultTimeout.current);
      resultTimeout.current = setTimeout(() => setLastResult(null), 1500);

      await supabase.from("choices").insert({
        player_id: playerId,
        round: currentRound,
        attempt,
        choice: type,
        success,
      });
    },
    [canPlay, playerId, persona, currentAttempt, currentRound]
  );

  if (!persona || !playerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted text-lg">Loading...</div>
      </div>
    );
  }

  const isReveal = currentRound > ROUNDS_COUNT;

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">Network Builder</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-success" : "bg-fail"}`} />
          <span className="text-sm text-muted">{connected ? "Connected" : "Connecting..."}</span>
        </div>
      </div>

      {/* Persona Card */}
      <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
        <div className="text-sm text-muted mb-1">You are</div>
        <div className="text-xl font-bold text-white">{persona.name}</div>
        <div className="text-sm text-muted mt-1">
          {persona.major} major, {persona.goal}
        </div>
      </div>

      {/* Lobby */}
      {currentRound === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">🎰</div>
          <h2 className="text-xl font-semibold text-white mb-2">Waiting for game to start...</h2>
          <p className="text-muted text-sm">The presenter will start Round 1 shortly.</p>
        </div>
      )}

      {/* Active Game */}
      {currentRound >= 1 && currentRound <= ROUNDS_COUNT && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-muted">Round {currentRound}/{ROUNDS_COUNT}</span>
              <span className="text-sm text-muted ml-3">
                Attempt {Math.min(currentAttempt + 1, ATTEMPTS_PER_ROUND)}/{ATTEMPTS_PER_ROUND}
              </span>
            </div>
            <div className="text-sm font-medium text-success">
              {totalSuccesses} total {totalSuccesses === 1 ? "success" : "successes"}
            </div>
          </div>

          {/* Algorithm Hints */}
          {currentRound === 2 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 text-sm">
              <div className="font-semibold text-blue-400 mb-1">Strategy: Epsilon-Greedy</div>
              <div className="text-blue-300/80">
                Pick your best option ~80% of the time. Try something random ~20%.
              </div>
            </div>
          )}
          {currentRound === 3 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4 text-sm">
              <div className="font-semibold text-purple-400 mb-1">Strategy: Thompson Sampling</div>
              <div className="text-purple-300/80">
                Be optimistic about uncertainty. Try options you are unsure about!
              </div>
            </div>
          )}

          {/* Game Area */}
          {!roundActive ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted text-lg">
                {currentAttempt >= ATTEMPTS_PER_ROUND
                  ? "Round complete! Waiting for next round..."
                  : "Round paused. Waiting for presenter..."}
              </div>
            </div>
          ) : currentAttempt >= ATTEMPTS_PER_ROUND ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3">
                  {roundChoices.filter((c) => c.success).length >= 3 ? "🔥" : "👍"}
                </div>
                <div className="text-lg font-semibold text-white">Round {currentRound} complete!</div>
                <div className="text-muted mt-1">
                  {roundChoices.filter((c) => c.success).length}/{ATTEMPTS_PER_ROUND} successful
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CONNECTION_TYPES.map((type) => {
                const isLastResult = lastResult?.type === type.id;
                const isBest = currentRound >= 2 && bestType === type.id;
                const confidence = currentRound >= 3 ? getConfidence(allStats[type.id]) : null;

                return (
                  <button
                    key={type.id}
                    onClick={() => makeChoice(type.id)}
                    disabled={!canPlay}
                    className={`relative flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isLastResult
                        ? lastResult.success
                          ? "border-success animate-pulse-success bg-success/10"
                          : "border-fail animate-pulse-fail bg-fail/10"
                        : isBest
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-card-border bg-card hover:border-accent/50 hover:bg-accent/5"
                    }`}
                    style={{ minHeight: "120px" }}
                  >
                    {isBest && (
                      <div className="absolute top-2 right-2 text-yellow-400 text-xs font-medium">Best ⭐</div>
                    )}
                    <span className="text-3xl mb-2">{type.emoji}</span>
                    <span className="text-sm font-medium text-white text-center">{type.label}</span>
                    {allStats[type.id].attempts > 0 && (
                      <span className="text-xs text-muted mt-1">
                        {allStats[type.id].successes}/{allStats[type.id].attempts}
                      </span>
                    )}

                    {confidence && (
                      <div className="w-full mt-2">
                        <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              confidence.level === "unknown"
                                ? "bg-gray-500"
                                : confidence.rate >= 0.5
                                  ? "bg-success"
                                  : "bg-fail"
                            }`}
                            style={{
                              width: confidence.level === "unknown" ? "100%" : `${confidence.rate * 100}%`,
                              opacity: confidence.level === "unknown" ? 0.3 : 1,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-muted mt-0.5 text-center">
                          {confidence.level === "unknown"
                            ? "Unknown"
                            : confidence.level === "low"
                              ? "Uncertain"
                              : confidence.level === "medium"
                                ? "Some data"
                                : "Confident"}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Result Flash */}
          {lastResult && (
            <div className={`text-center text-2xl font-bold animate-pop ${lastResult.success ? "text-success" : "text-fail"}`}>
              {lastResult.success ? "Connection Made!" : "No Response"}
            </div>
          )}

          {/* Round Stats */}
          {roundChoices.length > 0 && (
            <div className="mt-4 bg-card border border-card-border rounded-xl p-4">
              <div className="text-sm text-muted mb-2">This Round</div>
              <div className="flex gap-2">
                {roundChoices.map((c, i) => (
                  <div
                    key={i}
                    className={`flex-1 text-center py-2 rounded-lg text-sm ${
                      c.success ? "bg-success/20 text-success" : "bg-fail/20 text-fail"
                    }`}
                  >
                    {CONNECTION_TYPES.find((t) => t.id === c.choice)?.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reveal */}
      {isReveal && persona && (
        <div className="flex-1">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-white">Game Over!</h2>
            <div className="text-3xl font-bold text-accent mt-2">
              {totalSuccesses} / {choices.length} successful
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4 mb-4">
            <div className="text-sm text-muted mb-2">Your Persona</div>
            <div className="text-lg font-bold text-white">{persona.name}</div>
            <div className="text-sm text-muted">{persona.major} major, {persona.goal}</div>
            <div className="text-sm text-success mt-2">
              Best strategy: {persona.bestConnectionLabel} ({Math.round(persona.rates[persona.bestConnection as ConnectionType] * 100)}%)
            </div>
            <div className="text-xs text-muted mt-1">{persona.why}</div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4 mb-4">
            <div className="text-sm text-muted mb-3">Your Hidden Rates</div>
            {CONNECTION_TYPES.map((type) => (
              <div key={type.id} className="flex items-center gap-3 mb-2">
                <span className="text-lg">{type.emoji}</span>
                <span className="text-sm text-white flex-1">{type.label}</span>
                <div className="w-24 h-2 bg-card-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${persona.rates[type.id] * 100}%` }} />
                </div>
                <span className="text-sm font-mono text-muted w-10 text-right">
                  {Math.round(persona.rates[type.id] * 100)}%
                </span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-sm text-muted mb-3">Your Choices</div>
            {[1, 2, 3].map((round) => {
              const rc = choices.filter((c) => c.round === round);
              const successes = rc.filter((c) => c.success).length;
              return (
                <div key={round} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted">Round {round}</span>
                    <span className="text-xs text-muted">{successes}/{rc.length}</span>
                  </div>
                  <div className="flex gap-1">
                    {rc.map((c, i) => (
                      <div
                        key={i}
                        className={`flex-1 text-center py-1.5 rounded text-xs ${
                          c.success ? "bg-success/20 text-success" : "bg-fail/20 text-fail"
                        }`}
                      >
                        {CONNECTION_TYPES.find((t) => t.id === c.choice)?.emoji}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
