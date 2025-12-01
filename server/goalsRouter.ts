import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { dailyGoals, dailyReflections } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const goalsRouter = router({
  // Create or update today's goals
  setTodayGoals: protectedProcedure
    .input(
      z.object({
        personalGoal: z.string().optional(),
        professionalGoal: z.string().optional(),
        growthGoal: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Check if goals already exist for today
      const existing = await db
        .select()
        .from(dailyGoals)
        .where(and(eq(dailyGoals.userId, ctx.user.id), eq(dailyGoals.date, today)))
        .limit(1);

      if (existing.length > 0) {
        // Update existing goals
        await db
          .update(dailyGoals)
          .set({
            personalGoal: input.personalGoal,
            professionalGoal: input.professionalGoal,
            growthGoal: input.growthGoal,
          })
          .where(eq(dailyGoals.id, existing[0].id));
      } else {
        // Create new goals
        await db.insert(dailyGoals).values({
          userId: ctx.user.id,
          date: today,
          personalGoal: input.personalGoal,
          professionalGoal: input.professionalGoal,
          growthGoal: input.growthGoal,
        });
      }

      return { success: true };
    }),

  // Get today's goals
  getTodayGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const today = new Date().toISOString().split("T")[0];

    const goals = await db
      .select()
      .from(dailyGoals)
      .where(and(eq(dailyGoals.userId, ctx.user.id), eq(dailyGoals.date, today)))
      .limit(1);

    return goals[0] || null;
  }),

  // Create or update today's reflection
  setTodayReflection: protectedProcedure
    .input(
      z.object({
        personalProgress: z.string().optional(),
        professionalProgress: z.string().optional(),
        growthProgress: z.string().optional(),
        patterns: z.string().optional(),
        wins: z.string().optional(),
        struggles: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date().toISOString().split("T")[0];

      // Check if reflection already exists for today
      const existing = await db
        .select()
        .from(dailyReflections)
        .where(and(eq(dailyReflections.userId, ctx.user.id), eq(dailyReflections.date, today)))
        .limit(1);

      if (existing.length > 0) {
        // Update existing reflection
        await db
          .update(dailyReflections)
          .set({
            personalProgress: input.personalProgress,
            professionalProgress: input.professionalProgress,
            growthProgress: input.growthProgress,
            patterns: input.patterns,
            wins: input.wins,
            struggles: input.struggles,
          })
          .where(eq(dailyReflections.id, existing[0].id));
      } else {
        // Create new reflection
        await db.insert(dailyReflections).values({
          userId: ctx.user.id,
          date: today,
          personalProgress: input.personalProgress,
          professionalProgress: input.professionalProgress,
          growthProgress: input.growthProgress,
          patterns: input.patterns,
          wins: input.wins,
          struggles: input.struggles,
        });
      }

      return { success: true };
    }),

  // Get today's reflection
  getTodayReflection: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const today = new Date().toISOString().split("T")[0];

    const reflections = await db
      .select()
      .from(dailyReflections)
      .where(and(eq(dailyReflections.userId, ctx.user.id), eq(dailyReflections.date, today)))
      .limit(1);

    return reflections[0] || null;
  }),

  // Get recent goals history (last 7 days)
  getRecentGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split("T")[0];

    const goals = await db
      .select()
      .from(dailyGoals)
      .where(eq(dailyGoals.userId, ctx.user.id))
      .orderBy(dailyGoals.date);

    return goals.filter((g) => g.date >= cutoffDate);
  }),

  // Get recent reflections history (last 7 days)
  getRecentReflections: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split("T")[0];

    const reflections = await db
      .select()
      .from(dailyReflections)
      .where(eq(dailyReflections.userId, ctx.user.id))
      .orderBy(dailyReflections.date);

    return reflections.filter((r) => r.date >= cutoffDate);
  }),
});
