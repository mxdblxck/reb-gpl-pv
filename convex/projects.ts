import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel.d.ts";

// ── helpers ──────────────────────────────────────────────────────────────────

async function getAuthUser(ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  }
  return user;
}

// ── queries ───────────────────────────────────────────────────────────────────

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || project.userId !== user._id) return null;
    return project;
  },
});

// ── mutations ─────────────────────────────────────────────────────────────────

const siteParamsValidator = v.object({
  siteId: v.string(),
  energyLoad: v.number(),
  psh: v.number(),
  pr: v.number(),
  modulePower: v.number(),
  groups: v.number(),
  autonomy: v.number(),
  dod: v.number(),
  batteryEfficiency: v.number(),
  cellVoltage: v.number(),
  unitaryBatteryCapacity: v.number(),
  systemVoltage: v.number(),
});

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    sites: v.array(siteParamsValidator),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    return await ctx.db.insert("projects", {
      userId: user._id,
      name: args.name,
      description: args.description,
      notes: args.notes,
      sites: args.sites,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    sites: v.optional(v.array(siteParamsValidator)),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new ConvexError({ message: "Project not found", code: "NOT_FOUND" });
    }
    const { projectId, ...fields } = args;
    await ctx.db.patch(projectId, {
      ...fields,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new ConvexError({ message: "Project not found", code: "NOT_FOUND" });
    }
    await ctx.db.delete(args.projectId);
  },
});
