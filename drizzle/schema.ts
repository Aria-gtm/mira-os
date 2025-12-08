import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Mira User Profile - stores onboarding data and preferences
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(), // FK to users.id
  
  // Future Self & Identity
  futureSelf: text("future_self").notNull(), // Who they want to be in 3-6 months
  
  // Goals & Values (stored as JSON)
  goals: text("goals").notNull(), // JSON array of specific goals
  values: text("values").notNull(), // JSON array of core values
  
  // Patterns & Pain Points
  tiredPattern: text("tired_pattern").notNull(), // Pattern they're tired of repeating
  overwhelmSignals: text("overwhelm_signals").notNull(), // How body signals overwhelm
  spiralTime: varchar("spiral_time", { length: 20 }).notNull(), // morning/afternoon/night
  
  // Preferences
  personalityMode: varchar("personality_mode", { length: 20 }).notNull().default("adaptive"),
  communicationStyle: varchar("communication_style", { length: 20 }).notNull(), // gentle/direct/real-talk
  callOutPreference: varchar("call_out_preference", { length: 20 }).notNull(), // auto/user-initiated
  comfortStyle: text("comfort_style").notNull(), // How they want to be comforted
  groundingMethods: text("grounding_methods").notNull(), // JSON array of grounding methods
  
  // OS Personality Knobs
  supportIntensity: mysqlEnum("support_intensity", ["quiet", "light", "close"]).default("light").notNull(),
  nudgeTolerance: mysqlEnum("nudge_tolerance", ["low", "medium", "high"]).default("medium").notNull(),
  verbosity: mysqlEnum("verbosity", ["short", "standard", "detailed"]).default("standard").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(), // User's timezone for accurate phase detection
  
  // Context
  guidanceExample: text("guidance_example"), // Example of moment they wish someone guided them better
  
  // Quiz Data (stored as JSON)
  quizData: text("quiz_data"), // Complete quiz responses
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// Waitlist - stores email signups
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = typeof waitlist.$inferInsert;

/**
 * Daily Goals - Track 3 goals each day (personal, professional, growth)
 */
export const dailyGoals = mysqlTable("dailyGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  personalGoal: text("personalGoal"),
  professionalGoal: text("professionalGoal"),
  growthGoal: text("growthGoal"),
  
  // OS Variables - Capacity tracking
  energyLevel: mysqlEnum("energyLevel", ["low", "medium", "high"]).default("medium").notNull(),
  capacityNote: text("capacityNote"), // Optional context ("slept badly", "stacked meetings")
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyGoal = typeof dailyGoals.$inferSelect;
export type InsertDailyGoal = typeof dailyGoals.$inferInsert;

/**
 * Daily Reflections - Evening check-in on progress and patterns
 */
export const dailyReflections = mysqlTable("dailyReflections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  personalProgress: text("personalProgress"),
  professionalProgress: text("professionalProgress"),
  growthProgress: text("growthProgress"),
  
  // Vision Line - "Today I moved closer to my vision by..."
  visionLine: text("visionLine"),
  
  patterns: text("patterns"), // What patterns did they notice?
  wins: text("wins"), // What went well?
  struggles: text("struggles"), // What was hard?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReflection = typeof dailyReflections.$inferSelect;
export type InsertDailyReflection = typeof dailyReflections.$inferInsert;

/**
 * Accountability Partners - Users who can view each other's goals and progress
 */
export const accountabilityPartners = mysqlTable("accountabilityPartners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // The user who owns the goals
  partnerId: int("partnerId"), // The partner's user ID (null if not registered yet)
  partnerEmail: varchar("partnerEmail", { length: 320 }).notNull(),
  partnerName: varchar("partnerName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  permissions: varchar("permissions", { length: 50 }).default("view_goals").notNull(), // view_goals, view_reflections, comment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountabilityPartner = typeof accountabilityPartners.$inferSelect;
export type InsertAccountabilityPartner = typeof accountabilityPartners.$inferInsert;

/**
 * Share Tokens - Temporary shareable links for goals/reflections
 */
export const shareTokens = mysqlTable("shareTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  permissions: varchar("permissions", { length: 50 }).default("view_goals").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShareToken = typeof shareTokens.$inferSelect;
export type InsertShareToken = typeof shareTokens.$inferInsert;

/**
 * Conversations - Store chat sessions with Mira
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users.id
  title: varchar("title", { length: 255 }), // Auto-generated from first message
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages - Individual messages within conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(), // FK to conversations.id
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(), // The text content of the message
  audioUrl: text("audioUrl"), // URL to TTS audio (for assistant messages)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * User State - Live OS state tracking (Mira's RAM)
 * Tracks current phase, capacity, shutdown risk, and temporal awareness
 */
export const userState = mysqlTable("userState", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // OS Variables
  currentPhase: mysqlEnum("currentPhase", ["MORNING", "FOCUS", "EVENING"]).default("FOCUS").notNull(),
  capacityScore: int("capacityScore").default(8).notNull(), // 1-10 scale
  
  // Shutdown Detection
  isShutdown: int("isShutdown").default(0).notNull(), // 0 = false, 1 = true (MySQL boolean)
  shutdownRisk: mysqlEnum("shutdownRisk", ["none", "suspected", "active"]).default("none").notNull(),
  
  // Daily Artifacts
  morningAnchors: text("morningAnchors"), // JSON array of 3 intentions
  visionLine: text("visionLine"), // Evening vision line
  
  // Temporal Tracking
  lastActiveDate: varchar("lastActiveDate", { length: 10 }), // YYYY-MM-DD
  lastGoalsDate: varchar("lastGoalsDate", { length: 10 }),
  lastReflectionDate: varchar("lastReflectionDate", { length: 10 }),
  lastInteraction: timestamp("lastInteraction").defaultNow().notNull(),
  
  // Pattern Detection
  lowCapacityStreak: int("lowCapacityStreak").default(0).notNull(), // Consecutive days with low energy
  lastEnergyLevel: mysqlEnum("lastEnergyLevel", ["low", "medium", "high"]).default("medium").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserState = typeof userState.$inferSelect;
export type InsertUserState = typeof userState.$inferInsert;

/**
 * Weekly Summaries - Reflection on what energized/drained, adjustments for next week
 */
export const weeklySummaries = mysqlTable("weeklySummaries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(), // Monday YYYY-MM-DD
  
  energizedBy: text("energizedBy"), // JSON array or comma-separated
  drainedBy: text("drainedBy"), // JSON array or comma-separated
  adjustments: text("adjustments"), // One or two concrete changes for next week
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = typeof weeklySummaries.$inferInsert;

/**
 * Monthly Milestones - 1-2 measurable milestones, "Am I operating as my future self?" check
 */
export const monthlyMilestones = mysqlTable("monthlyMilestones", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  
  milestones: text("milestones").notNull(), // JSON array [{ label, target, status }]
  operatingAsFutureSelf: mysqlEnum("operatingAsFutureSelf", ["yes", "no", "unsure"]).default("unsure").notNull(),
  reflection: text("reflection"), // Short "why / what's next"
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonthlyMilestone = typeof monthlyMilestones.$inferSelect;
export type InsertMonthlyMilestone = typeof monthlyMilestones.$inferInsert;