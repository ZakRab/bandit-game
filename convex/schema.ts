import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  gameState: defineTable({
    currentRound: v.number(),
    roundActive: v.boolean(),
  }),
  players: defineTable({
    visitorId: v.string(),
    persona: v.string(),
  }).index("by_visitor", ["visitorId"]),
  choices: defineTable({
    visitorId: v.string(),
    round: v.number(),
    attempt: v.number(),
    choice: v.string(),
    success: v.boolean(),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_round", ["round"]),
});
