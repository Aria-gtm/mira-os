import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userProfiles } from "../drizzle/schema";
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;

      // Check if profile exists
      const existing = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      const profileData = {
        userId,
        futureSelf: input.futureSelf,
        goals: JSON.stringify(input.supportNeeds),
        values: JSON.stringify([]),
        tiredPattern: input.pattern || "",
        overwhelmSignals: "",
        spiralTime: "",
        personalityMode: "adaptive",
        communicationStyle: input.tonePreference,
        callOutPreference: input.shutdownPreference,
        comfortStyle: "",
        groundingMethods: JSON.stringify([]),
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

      if (existing.length > 0) {
        // Update existing profile
        await db
          .update(userProfiles)
          .set(profileData)
          .where(eq(userProfiles.userId, userId));
      } else {
        // Insert new profile
        await db.insert(userProfiles).values(profileData);
      }

      return { success: true };
    }),

  transcribeAudio: publicProcedure
    .input(
      z.object({
        audio: z.string(), // base64 encoded audio
      })
    )
    .mutation(async ({ input }) => {
      // Convert base64 to buffer
      const base64Data = input.audio.split(',')[1];
      const audioBuffer = Buffer.from(base64Data, 'base64');

      // Transcribe with Whisper
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
      return { text: transcription.text };
    }),

  saveProfile_OLD: protectedProcedure
    .input(
      z.object({
        futureSelf: z.string(),
        goals: z.array(z.string()),
        values: z.array(z.string()),
        tiredPattern: z.string(),
        overwhelmSignals: z.string(),
        spiralTime: z.string(),
        personalityMode: z.string(),
        communicationStyle: z.string(),
        callOutPreference: z.string(),
        comfortStyle: z.string(),
        groundingMethods: z.array(z.string()),
        guidanceExample: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;

      // Check if profile exists
      const existing = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      const profileData = {
        userId,
        futureSelf: input.futureSelf,
        goals: JSON.stringify(input.goals),
        values: JSON.stringify(input.values),
        tiredPattern: input.tiredPattern,
        overwhelmSignals: input.overwhelmSignals,
        spiralTime: input.spiralTime,
        personalityMode: input.personalityMode,
        communicationStyle: input.communicationStyle,
        callOutPreference: input.callOutPreference,
        comfortStyle: input.comfortStyle,
        groundingMethods: JSON.stringify(input.groundingMethods),
        guidanceExample: input.guidanceExample || null,
      };

      if (existing.length > 0) {
        // Update existing profile
        await db
          .update(userProfiles)
          .set(profileData)
          .where(eq(userProfiles.userId, userId));
      } else {
        // Insert new profile
        await db.insert(userProfiles).values(profileData);
      }

      return { success: true };
    }),

  chat: publicProcedure
    .input(
      z.object({
        message: z.string(),
        userId: z.number().optional(), // Optional user ID for personalization
        conversationHistory: z.array(z.object({
          role: z.string(),
          content: z.string()
        })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Retrieve user profile if userId provided
      let systemPrompt = MIRA_BASE_PROMPT;
      
      if (input.userId) {
        const db = await getDb();
        if (db) {
          const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, input.userId)).limit(1);
          const profile = profiles[0];
          
          if (profile) {
            // Use full personality system with user profile
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
        }
      } else {
        // No user ID, use base prompt
        systemPrompt = MIRA_BASE_PROMPT;
      }
      
      // Build messages array with conversation history
      const messages: Array<{role: "system" | "user" | "assistant"; content: string}> = [
        { role: "system", content: systemPrompt },
      ];
      
      // Add conversation history if provided
      if (input.conversationHistory && input.conversationHistory.length > 0) {
        messages.push(...input.conversationHistory.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })));
      } else {
        // Just add current message
        messages.push({ role: "user", content: input.message });
      }
      
      const response = await invokeLLM({
        messages,
      });

      const messageContent = response.choices[0]?.message?.content;
      const message = typeof messageContent === 'string' ? messageContent : "I'm here for you. Tell me more.";

      // Generate TTS audio
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
            voice: 'nova', // Warm feminine voice (user preference)
            input: message,
          }),
        });

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioBlob = Buffer.from(audioBuffer);
          
          // Upload to S3
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
        // Continue without audio
      }

      return {
        message,
        audioUrl,
      };
    }),

  transcribe: protectedProcedure
    .input(
      z.object({
        audio: z.string(), // base64 encoded audio
        fieldId: z.string(), // which field is being transcribed
      })
    )
    .mutation(async ({ input }) => {
      // Convert base64 to buffer
      const base64Data = input.audio.split(',')[1];
      const audioBuffer = Buffer.from(base64Data, 'base64');

      // Transcribe with Whisper
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
      return { text: transcription.text };
    }),

  voiceChat: publicProcedure
    .input(
      z.object({
        audio: z.string(), // base64 encoded audio
        userId: z.number().optional(), // Optional for personalization
      })
    )
    .mutation(async ({ input }) => {
      // Convert base64 to buffer
      const base64Data = input.audio.split(',')[1];
      const audioBuffer = Buffer.from(base64Data, 'base64');

      // Transcribe with Whisper
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

      // Get user profile for personalized prompt (if userId provided)
      const db = await getDb();
      let systemPrompt = MIRA_BASE_PROMPT;
      
      if (db && input.userId) {
        const profile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, input.userId))
          .limit(1);
        
        if (profile.length > 0) {
          const p = profile[0];
          systemPrompt = buildMiraSystemPrompt({
            futureSelf: p.futureSelf,
            goals: JSON.parse(p.goals),
            values: JSON.parse(p.values),
            tiredPattern: p.tiredPattern,
            overwhelmSignals: p.overwhelmSignals,
            spiralTime: p.spiralTime,
            personalityMode: p.personalityMode,
            communicationStyle: p.communicationStyle,
            callOutPreference: p.callOutPreference,
            comfortStyle: p.comfortStyle,
            groundingMethods: JSON.parse(p.groundingMethods),
            guidanceExample: p.guidanceExample || undefined,
          });
        }
      }

      // Get AI response using personalized prompt
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
        }),
      });

      const aiResponse = await response.json();

      const messageContent = aiResponse.choices?.[0]?.message?.content;
      const message = typeof messageContent === 'string' ? messageContent : "I'm here for you. Tell me more.";

      // Generate TTS
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'nova', // Warm feminine voice (user preference)
          input: message,
        }),
      });

      const audioArrayBuffer = await ttsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

      return {
        transcript,
        message,
        audioUrl,
      };
    }),
});
