import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Daily Goals System", () => {
  it("should set and retrieve today's goals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Set goals
    const setResult = await caller.goals.setTodayGoals({
      personalGoal: "Meditate for 10 minutes",
      professionalGoal: "Complete project proposal",
      growthGoal: "Read 30 pages",
    });

    expect(setResult.success).toBe(true);

    // Retrieve goals
    const goals = await caller.goals.getTodayGoals();

    expect(goals).toBeDefined();
    expect(goals?.personalGoal).toBe("Meditate for 10 minutes");
    expect(goals?.professionalGoal).toBe("Complete project proposal");
    expect(goals?.growthGoal).toBe("Read 30 pages");
  });

  it("should set and retrieve today's reflection", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Set reflection
    const setResult = await caller.goals.setTodayReflection({
      personalProgress: "Meditated in the morning",
      professionalProgress: "Finished proposal draft",
      growthProgress: "Read 35 pages",
      patterns: "More focused in the morning",
      wins: "Completed all three goals",
      struggles: "Got distracted after lunch",
    });

    expect(setResult.success).toBe(true);

    // Retrieve reflection
    const reflection = await caller.goals.getTodayReflection();

    expect(reflection).toBeDefined();
    expect(reflection?.personalProgress).toBe("Meditated in the morning");
    expect(reflection?.wins).toBe("Completed all three goals");
  });

  it("should update existing goals instead of creating duplicates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Set goals first time
    await caller.goals.setTodayGoals({
      personalGoal: "First goal",
      professionalGoal: "First professional",
      growthGoal: "First growth",
    });

    // Update goals
    await caller.goals.setTodayGoals({
      personalGoal: "Updated goal",
      professionalGoal: "Updated professional",
      growthGoal: "Updated growth",
    });

    // Should only have one entry for today
    const goals = await caller.goals.getTodayGoals();
    expect(goals?.personalGoal).toBe("Updated goal");
  });
});
