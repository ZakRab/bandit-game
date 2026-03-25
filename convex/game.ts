import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Game State ──────────────────────────────────────────────

export const getState = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db.query("gameState").first();
    return state ?? { currentRound: 0, roundActive: false };
  },
});

export const setRound = mutation({
  args: { currentRound: v.number(), roundActive: v.boolean() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("gameState").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("gameState", args);
    }
  },
});

// ── Players ─────────────────────────────────────────────────

export const joinGame = mutation({
  args: { visitorId: v.string(), persona: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("players")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
    if (!existing) {
      await ctx.db.insert("players", args);
    }
  },
});

export const getPlayers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("players").collect();
  },
});

// ── Choices ─────────────────────────────────────────────────

export const makeChoice = mutation({
  args: {
    visitorId: v.string(),
    round: v.number(),
    attempt: v.number(),
    choice: v.string(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("choices", args);
  },
});

export const getMyChoices = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    if (!args.visitorId) return [];
    return await ctx.db
      .query("choices")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();
  },
});

export const getAllChoices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("choices").collect();
  },
});

// ── Reset ───────────────────────────────────────────────────

export const resetGame = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all choices
    const choices = await ctx.db.query("choices").collect();
    for (const c of choices) {
      await ctx.db.delete(c._id);
    }
    // Delete all players
    const players = await ctx.db.query("players").collect();
    for (const p of players) {
      await ctx.db.delete(p._id);
    }
    // Reset game state
    const state = await ctx.db.query("gameState").first();
    if (state) {
      await ctx.db.patch(state._id, { currentRound: 0, roundActive: false });
    }
  },
});
