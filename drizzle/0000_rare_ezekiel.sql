CREATE TYPE "public"."current_phase" AS ENUM('MORNING', 'FOCUS', 'EVENING');--> statement-breakpoint
CREATE TYPE "public"."energy_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."nudge_tolerance" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."operating_as_future_self" AS ENUM('yes', 'no', 'unsure');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."shutdown_risk" AS ENUM('none', 'suspected', 'active');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."support_intensity" AS ENUM('quiet', 'light', 'close');--> statement-breakpoint
CREATE TYPE "public"."verbosity" AS ENUM('short', 'standard', 'detailed');--> statement-breakpoint
CREATE TABLE "accountabilityPartners" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accountabilityPartners_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"partnerId" integer,
	"partnerEmail" varchar(320) NOT NULL,
	"partnerName" varchar(255),
	"status" "status" DEFAULT 'pending' NOT NULL,
	"permissions" varchar(50) DEFAULT 'view_goals' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conversations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"title" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dailyGoals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dailyGoals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"personalGoal" text,
	"professionalGoal" text,
	"growthGoal" text,
	"energyLevel" "energy_level" DEFAULT 'medium' NOT NULL,
	"capacityNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dailyReflections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dailyReflections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"personalProgress" text,
	"professionalProgress" text,
	"growthProgress" text,
	"visionLine" text,
	"patterns" text,
	"wins" text,
	"struggles" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"conversationId" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"audioUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthlyMilestones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "monthlyMilestones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"month" varchar(7) NOT NULL,
	"milestones" text NOT NULL,
	"operatingAsFutureSelf" "operating_as_future_self" DEFAULT 'unsure' NOT NULL,
	"reflection" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shareTokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shareTokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"permissions" varchar(50) DEFAULT 'view_goals' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shareTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"future_self" text NOT NULL,
	"goals" text NOT NULL,
	"values" text NOT NULL,
	"tired_pattern" text NOT NULL,
	"overwhelm_signals" text NOT NULL,
	"spiral_time" varchar(20) NOT NULL,
	"personality_mode" varchar(20) DEFAULT 'adaptive' NOT NULL,
	"communication_style" varchar(20) NOT NULL,
	"call_out_preference" varchar(20) NOT NULL,
	"comfort_style" text NOT NULL,
	"grounding_methods" text NOT NULL,
	"support_intensity" "support_intensity" DEFAULT 'light' NOT NULL,
	"nudge_tolerance" "nudge_tolerance" DEFAULT 'medium' NOT NULL,
	"verbosity" "verbosity" DEFAULT 'standard' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"guidance_example" text,
	"quiz_data" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "userState" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userState_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"currentPhase" "current_phase" DEFAULT 'FOCUS' NOT NULL,
	"capacityScore" integer DEFAULT 8 NOT NULL,
	"isShutdown" boolean DEFAULT false NOT NULL,
	"shutdownRisk" "shutdown_risk" DEFAULT 'none' NOT NULL,
	"morningAnchors" text,
	"visionLine" text,
	"lastActiveDate" varchar(10),
	"lastGoalsDate" varchar(10),
	"lastReflectionDate" varchar(10),
	"lastInteraction" timestamp DEFAULT now() NOT NULL,
	"lowCapacityStreak" integer DEFAULT 0 NOT NULL,
	"lastEnergyLevel" "energy_level" DEFAULT 'medium' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userState_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "waitlist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(320) NOT NULL,
	"name" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weeklySummaries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "weeklySummaries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"weekStart" varchar(10) NOT NULL,
	"energizedBy" text,
	"drainedBy" text,
	"adjustments" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
