import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userProfiles, userState, dailyGoals } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { buildMiraSystemPrompt } from "./miraPersonality.js";

const MIRA_BASE_PROMPT = `You are Mira, a reflective-intelligence companion designed to help users stay aligned with their daily goals, energy cycles, emotional state, and future self.

Your tone is grounded, calm, warm, perceptive, and human. You speak like someone who truly gets them. You are never generic, cliché, inspirational-speaker-ish, robotic, or overly therapeutic.

Your role is to reflect, clarify, guide, and help them return to themselves. You are their thought partner, their mirror, their calm second brain.

**You NEVER say:**
- "You've got this!"
- "Rise into your power."
- "You are enough."
- "Believe in yourself!"
- Any wellness-influencer clichés

**You DO:**
- Process three layers: Surface need → Underlying pattern → Future self alignment
- Keep responses SHORT (2-3 sentences unless they ask for more)
- Use natural, conversational language
- Match their emotional bandwidth
- Offer grounded next steps, not hype

Your approach:
- Clarify the moment
- Choose one small pivot
- Anchor to their future self
- Offer reflection
- Suggest music/sensory grounding when helpful
- Celebrate progress, no matter how small
- Gently redirect when they're falling into old patterns
- Keep responses concise and conversational (2-3 sentences max)
- Never explicitly say "I'm your future self" - just BE that supportive presence

The user is a woman focused on personal growth, goal achievement, and living in alignment with her natural cycles. Meet her where she is with warmth and understanding.`;

export const miraRouter = router({
  // ============================================
  // OS STATE MANAGEMENT
  // ============================================
  
  getOSState: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user.id;

    // Get or create user state
    let state = await db
      .select()
      .from(userState)
      .where(eq(userState.userId, userId))
      .limit(1);

    if (state.length === 0) {
      // Create initial state
      await db.insert(userState).values({
        userId,
        currentPhase: "FOCUS",
        capacityScore: 8,
        isShutdown: 0,
        shutdownRisk: "none",
        morningAnchors: JSON.stringify([]),
        visionLine: null,
        lastActiveDate: new Date().toISOString().split('T')[0],
        lastInteraction: new Date(),
        lowCapacityStreak: 0,
        lastEnergyLevel: "medium",
      });

      state = await db
        .select()
        .from(userState)
        .where(eq(userState.userId, userId))
        .limit(1);
    }

    return state[0];
  }),

  updateOSState: protectedProcedure
    .input(
      z.object({
        phase: z.enum(["MORNING", "FOCUS", "EVENING"]).optional(),
        capacity: z.number().min(1).max(10).optional(),
        anchors: z.array(z.string()).optional(),
        visionLine: z.string().optional(),
        isShutdown: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;
      const today = new Date().toISOString().split('T')[0];

      // Build update object
      const updateData: any = {
        lastInteraction: new Date(),
        lastActiveDate: today,
      };

      if (input.phase !== undefined) {
        updateData.currentPhase = input.phase;
      }

      if (input.capacity !== undefined) {
        updateData.capacityScore = input.capacity;
        
        // Track low capacity streaks
        if (input.capacity <= 3) {
          const current = await db.select().from(userState).where(eq(userState.userId, userId)).limit(1);
          updateData.lowCapacityStreak = (current[0]?.lowCapacityStreak || 0) + 1;
        } else {
          updateData.lowCapacityStreak = 0;
        }
        
        updateData.lastEnergyLevel = input.capacity <= 3 ? "low" : input.capacity >= 7 ? "high" : "medium";
      }

      if (input.anchors !== undefined) {
        updateData.morningAnchors = JSON.stringify(input.anchors);
        updateData.lastGoalsDate = today;
      }

      if (input.visionLine !== undefined) {
        updateData.visionLine = input.visionLine;
        updateData.lastReflectionDate = today;
      }

      if (input.isShutdown !== undefined) {
        updateData.isShutdown = input.isShutdown ? 1 : 0;
      }

      // Update state
      await db
        .update(userState)
        .set(updateData)
        .where(eq(userState.userId, userId));

      // Return updated state
      const updated = await db
        .select()
        .from(userState)
        .where(eq(userState.userId, userId))
        .limit(1);

      return updated[0];
    }),

  // ============================================
  // INTELLIGENT CHAT WITH CONTEXT INJECTION
  // ============================================

  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;

      // 1. FETCH ALL CONTEXT
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const [stateData, profileData, goalsData] = await Promise.all([
        db.select().from(userState).where(eq(userState.userId, userId)).limit(1),
        db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
        db.select().from(dailyGoals).where(eq(dailyGoals.userId, userId)).where(eq(dailyGoals.date, today)).limit(1),
      ]);

      const state = stateData[0];
      const profile = profileData[0];
      const goals = goalsData[0];

      // 2. CHECK FOR SHUTDOWN RISK (Drift Detection)
      let driftContext = "";
      if (state) {
        const hoursSince = (new Date().getTime() - new Date(state.lastInteraction).getTime()) / (1000 * 60 * 60);
        
        if (hoursSince > 72) {
          // 3+ days = suspected shutdown
          if (profile?.callOutPreference === "minimal") {
            driftContext = ` [SYSTEM: User has been away for 3+ days. Say "Welcome back" but do not ask why.]`;
          } else if (profile?.callOutPreference === "soft") {
            driftContext = ` [SYSTEM: User has been away for 3+ days. Gently ask: "Do you want to reset or catch up?"]`;
          } else {
            driftContext = ` [SYSTEM: User has been away for 3+ days. Directly ask: "What happened? Let's talk about it."]`;
          }
        }
      }

      // 3. BUILD DYNAMIC SYSTEM PROMPT
      let systemPrompt = MIRA_BASE_PROMPT;

      if (profile) {
        // Use full personality system
        systemPrompt = buildMiraSystemPrompt({
          futureSelf: profile.futureSelf,
          goals: profile.goals ? JSON.parse(profile.goals) : [],
          values: profile.values ? JSON.parse(profile.values) : [],
          tiredPattern: profile.tiredPattern,
          overwhelmSignals: profile.overwhelmSignals,
          spiralTime: profile.spiralTime,
          personalityMode: profile.personalityMode,
          communicationStyle: profile.communicationStyle,
          callOutPreference: profile.callOutPreference,
          comfortStyle: profile.comfortStyle,
          groundingMethods: profile.groundingMethods ? JSON.parse(profile.groundingMethods) : [],
          guidanceExample: profile.guidanceExample || undefined,
        });
      }

      // 4. INJECT OS STATE CONTEXT
      if (state) {
        systemPrompt += `\n\n=== CURRENT CONTEXT ===\n`;
        systemPrompt += `Time Phase: ${state.currentPhase}\n`;
        systemPrompt += `User Capacity: ${state.capacityScore}/10\n`;

        // Phase-specific instructions
        if (state.currentPhase === "MORNING") {
          systemPrompt += `\nMODE: MORNING ALIGNMENT
- Goal: Help user define 3 anchors (intentions) for the day
- Style: Crisp, awakening, forward-looking
- If anchors are not set, ask for them\n`;
        } else if (state.currentPhase === "EVENING") {
          systemPrompt += `\nMODE: EVENING REFLECTION
- Goal: Help user close loops and release tension
- Style: Slower, reflective, warmer
- Ask: "What is one thing you want to release from today?"\n`;
        }

        // Capacity-based instructions
        if (state.capacityScore <= 3) {
          systemPrompt += `\nCRITICAL: USER IS LOW ENERGY (${state.capacityScore}/10)
- Remove all friction
- Use short, gentle sentences
- Do not ask open-ended "why" questions
- Focus on "Smallest Viable Action"\n`;
        } else if (state.capacityScore >= 8) {
          systemPrompt += `\nUSER IS HIGH ENERGY
- Be direct and high-tempo
- Push them to align with their highest "Future Self"\n`;
        }

        // Inject anchors if they exist
        if (state.morningAnchors) {
          try {
            const anchors = JSON.parse(state.morningAnchors);
            if (anchors.length > 0) {
              systemPrompt += `\nTODAY'S ANCHORS: ${anchors.join(", ")}\n- Align all responses to these anchors\n`;
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      }

      // 5. INJECT TODAY'S GOALS
      if (goals) {
        systemPrompt += `\nTODAY'S GOALS:\n`;
        if (goals.personalGoal) systemPrompt += `- Personal: ${goals.personalGoal}\n`;
        if (goals.professionalGoal) systemPrompt += `- Professional: ${goals.professionalGoal}\n`;
        if (goals.growthGoal) systemPrompt += `- Growth: ${goals.growthGoal}\n`;
        if (goals.energyLevel) systemPrompt += `- Energy Level: ${goals.energyLevel}\n`;
      }

      // 6. INJECT DRIFT CONTEXT
      if (driftContext) {
        systemPrompt += driftContext;
      }

      // 7. CALL LLM
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages,
      ];

      const response = await invokeLLM({ messages });
      const messageContent = response.choices[0]?.message?.content;
      const message = typeof messageContent === 'string' ? messageContent : "I'm here for you. Tell me more.";

      // 8. UPDATE LAST INTERACTION
      if (state) {
        await db
          .update(userState)
          .set({ lastInteraction: new Date() })
          .where(eq(userState.userId, userId));
      }

      return {
        role: "assistant" as const,
        content: message,
      };
    }),

  // ============================================
  // VOICE CHAT (Transcribe + Chat + TTS)
  // ============================================

  voiceChat: publicProcedure
    .input(
      z.object({
        audioData: z.string(), // base64 encoded audio
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. TRANSCRIBE AUDIO
      const base64Data = input.audioData.split(',')[1];
      const audioBuffer = Buffer.from(base64Data, 'base64');

      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const transcription = await transcriptionResponse.json();
      const transcript = transcription.text;

      // 2. BUILD CONVERSATION HISTORY
      const messages: Array<{role: "user" | "assistant"; content: string}> = [];
      
      if (input.conversationHistory && input.conversationHistory.length > 0) {
        messages.push(...input.conversationHistory);
      }
      
      messages.push({ role: "user", content: transcript });

      // 3. GET AI RESPONSE (with context injection if authenticated)
      let aiResponse: string;
      
      if (ctx.user) {
        // Authenticated - use full context injection via chat procedure
        const chatResult = await miraRouter.createCaller(ctx).chat({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        aiResponse = chatResult.content;
      } else {
        // Public demo - use base prompt
        const response = await invokeLLM({
          messages: [
            { role: "system", content: MIRA_BASE_PROMPT },
            ...messages,
          ],
        });
        const messageContent = response.choices[0]?.message?.content;
        aiResponse = typeof messageContent === 'string' ? messageContent : "I'm here for you. Tell me more.";
      }

      // 4. GENERATE TTS AUDIO
      let audioUrl: string | undefined;
      try {
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'nova',
            input: aiResponse,
          }),
        });

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioBlob = Buffer.from(audioBuffer);
          
          const { storagePut } = await import('./storage.js');
          const timestamp = Date.now();
          const { url } = await storagePut(
            `mira-voice/${timestamp}.mp3`,
            audioBlob,
            'audio/mpeg'
          );
          audioUrl = url;
        }
      } catch (err) {
        console.error('TTS generation failed:', err);
      }

      return {
        transcript,
        message: aiResponse,
        audioUrl,
      };
    }),

  // ============================================
  // ONBOARDING (Keep existing)
  // ============================================

  checkOnboarding: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user.id;

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    return {
      hasCompletedOnboarding: profile.length > 0 && !!profile[0].futureSelf,
    };
  }),

  saveOnboarding: protectedProcedure
    .input(
      z.object({
        whatsWorking: z.string(),
        currentSelf: z.string(),
        futureSelf: z.string(),
        supportNeeds: z.array(z.string()),
        tonePreference: z.string(),
        shutdownPreference: z.string(),
        pattern: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('[saveOnboarding] Starting with input:', JSON.stringify(input, null, 2));
        
        // Map quiz answers to database enum values
        const mapCommunicationStyle = (answer: string): string => {
          if (answer.includes('steady, calm')) return 'gentle';
          if (answer.includes('warm, friendly')) return 'warm';
          if (answer.includes('simply and directly')) return 'direct';
          if (answer.includes('neutral and adjust')) return 'adaptive';
          return 'adaptive';
        };
        
        const mapCallOutPreference = (answer: string): string => {
          if (answer.includes('Give me space')) return 'user-initiated';
          if (answer.includes('Check in softly')) return 'gentle';
          if (answer.includes('Nudge me gently')) return 'proactive';
          if (answer.includes('Call me out kindly')) return 'auto';
          return 'user-initiated';
        };
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const userId = ctx.user.id;
        console.log('[saveOnboarding] User ID:', userId);

        const existing = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);
        
        console.log('[saveOnboarding] Existing profile found:', existing.length > 0);

        const profileData = {
        userId,
        futureSelf: input.futureSelf,
        goals: JSON.stringify(input.supportNeeds),
        values: JSON.stringify([]),
        tiredPattern: input.pattern || "Not yet identified",
        overwhelmSignals: "To be discovered through use",
        spiralTime: "evening",
        personalityMode: "adaptive",
        communicationStyle: mapCommunicationStyle(input.tonePreference),
        callOutPreference: mapCallOutPreference(input.shutdownPreference),
        comfortStyle: "Gentle support and understanding",
        groundingMethods: JSON.stringify([]),
        supportIntensity: "light",
        nudgeTolerance: "medium",
        verbosity: "standard",
        guidanceExample: null,
        quizData: JSON.stringify({
          whatsWorking: input.whatsWorking,
          currentSelf: input.currentSelf,
          futureSelf: input.futureSelf,
          supportNeeds: input.supportNeeds,
          tonePreference: input.tonePreference,
          shutdownPreference: input.shutdownPreference,
          pattern: input.pattern,
        }),
      };

        console.log('[saveOnboarding] Profile data to save:', JSON.stringify(profileData, null, 2));

        if (existing.length > 0) {
          console.log('[saveOnboarding] Updating existing profile');
          await db
            .update(userProfiles)
            .set(profileData)
            .where(eq(userProfiles.userId, userId));
        } else {
          console.log('[saveOnboarding] Inserting new profile');
          await db.insert(userProfiles).values(profileData);
        }

        console.log('[saveOnboarding] Success!');
        return { success: true };
      } catch (error) {
        console.error('[saveOnboarding] ERROR:', error);
        console.error('[saveOnboarding] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
      }
    }),
});
