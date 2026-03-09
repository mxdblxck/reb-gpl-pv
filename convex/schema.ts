import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const siteParamsValidator = v.object({
  siteId: v.string(),
  energyLoad: v.number(), // Wh/day
  psh: v.number(), // Peak Sun Hours (default 4.95)
  pr: v.number(), // Performance Ratio (default 0.72)
  modulePower: v.number(), // Wp (default 555)
  groups: v.number(), // Number of PV groups
  autonomy: v.number(), // Days (default 5)
  dod: v.number(), // Depth of Discharge (default 0.8)
  batteryEfficiency: v.number(), // (default 0.85)
  cellVoltage: v.number(), // V Ni-Cad (default 1.2)
  unitaryBatteryCapacity: v.number(), // Ah (default 1275)
  systemVoltage: v.number(), // V (default 48)
});

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    sites: v.array(siteParamsValidator),
    updatedAt: v.string(), // ISO 8601
  })
    .index("by_user", ["userId"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),
});
