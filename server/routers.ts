import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { miraRouter } from "./miraRouter";
import { goalsRouter } from "./goalsRouter.js";
import { conversationRouter } from "./conversationRouter";
import { z } from "zod";
import { getDb } from "./db";
import { waitlist } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  mira: miraRouter,
  goals: goalsRouter,
  conversations: conversationRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  waitlist: router({
    join: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        try {
          // Insert into waitlist
          await db.insert(waitlist).values({
            email: input.email,
            name: input.name || null,
          });

          // Notify owner
          await notifyOwner({
            title: "New Waitlist Signup",
            content: `${input.name || "Someone"} (${input.email}) joined the Mira waitlist!`,
          });

          return { success: true };
        } catch (err: any) {
          // Check for duplicate email
          if (err.code === "ER_DUP_ENTRY" || err.message?.includes("Duplicate")) {
            throw new Error("This email is already on the waitlist.");
          }
          throw err;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
