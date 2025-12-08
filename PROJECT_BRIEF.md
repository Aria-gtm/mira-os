# Mira - Your Self, Expanded

## Vision

**"The OS your future self is waiting for."**

Mira brings intelligent support to your today and your tomorrow — easing what feels heavy, keeping you aligned and centered as you grow toward your best future self.

## Core Product

**Voice-first AI companion** that helps users navigate their present while building toward their future self through:

1. **TRY DEMO** - Immediate voice conversation with Mira (no login required)
   - User speaks → Mira transcribes → AI responds → TTS voice plays back
   - Natural conversation flow with history
   - Quick action buttons for common needs ("I need to wind down", "Help me focus", etc.)

2. **PERSONALIZE** - 5-question onboarding quiz to customize Mira's personality
   - Voice or text input for answers
   - Saves user profile to database
   - Adapts Mira's tone and approach based on answers

3. **Future: Full Product** - Ongoing relationship with personalized AI companion
   - Conversation memory across sessions
   - Pattern recognition and proactive support
   - Integration with user's daily life

## Current Status (Latest Session: Mira OS Transformation)

### What We Built This Session

**Mira OS Infrastructure** - Transformed from chatbot to time-aware operating system:

1. **State Machine (MiraContext)**
   - Time-based phase detection: MORNING (5-11am), FOCUS (11am-8pm), EVENING (8pm-4am)
   - Auto-syncs with database every 60 seconds
   - Optimistic updates for instant UI feedback
   - Provides `useMira()` hook for global OS state

2. **OS View (MiraOS Page)**
   - Left panel: Phase indicator, capacity slider (1-10), anchors list, vision line display
   - Right panel: Conversation with voice/text input
   - Phase-specific greetings and behaviors
   - Auto-extracts anchors in MORNING mode
   - Waveform visualization while recording

3. **Intelligent Backend (miraRouter rewrite)**
   - `getOSState` - Fetch current OS state (phase, capacity, anchors, vision line)
   - `updateOSState` - Update state with tracking (low capacity streaks, shutdown risk)
   - `chat` - Full context injection:
     * Personality from user profile (`buildMiraSystemPrompt`)
     * Today's goals from dailyGoals table
     * OS state (phase, capacity, anchors)
     * Shutdown drift detection (3+ days away)
     * Phase-specific instructions (morning anchors, evening reflection)
     * Capacity-aware response adaptation (low energy = short sentences, high energy = push harder)
   - `voiceChat` - Enhanced with context awareness (uses chat procedure if authenticated)

4. **Database Schema Extensions**
   - `userState` table - OS RAM (phase, capacity, shutdown risk, anchors, vision line, temporal tracking)
   - `weeklySummaries` table - Weekly reflection data (energized/drained tracking)
   - `monthlyMilestones` table - Monthly check-ins (future self alignment)
   - Extended `dailyGoals` with `energyLevel` and `capacityNote`
   - Extended `dailyReflections` with `visionLine`
   - Extended `userProfiles` with `supportIntensity`, `nudgeTolerance`, `verbosity`

5. **Integration**
   - Wired up existing personality system (`buildMiraSystemPrompt` now used in chat)
   - Wired up existing goals system (today's goals now injected into prompts)
   - Added MiraProvider to App.tsx (wraps entire app with OS state)
   - Added `/os` route for new OS view

**Status**: Code complete, server compiles and runs. **NOT YET TESTED** end-to-end by user.

### Previous Session Accomplishments

- ✅ **Google OAuth login** - LOGIN button redirects to Manus OAuth portal (Google/Microsoft/Apple)
- ✅ **Authenticated dashboard** - `/dashboard` page with voice chat for logged-in users
- ✅ **Conversation persistence** - Database tables (conversations + messages) save all chats
- ✅ **Conversation history sidebar** - Clickable list of past conversations with timestamps
- ✅ **Daily goals widget** - Integrated into dashboard sidebar
- ✅ **Auto-title generation** - First user message becomes conversation title
- ✅ **Full CRUD operations** - Create, read, update conversations via tRPC
- ✅ **Comprehensive testing** - 17 backend tests passing

### Earlier Accomplishments

- ✅ Complete voice recording system (start/stop with proper refs)
- ✅ Animated waveform visualization (pink-to-purple gradient bars)
- ✅ Detailed loading states ("Transcribing..." → "Thinking..." → "Speaking...")
- ✅ TTS voice changed to "alloy" (clean placeholder until Sol/custom voice)
- ✅ Conversation history UI with auto-scroll
- ✅ Beautiful gradient buttons (TRY DEMO purple-pink, PERSONALIZE pink-coral)
- ✅ Warm color palette throughout (no harsh reds/blacks)
- ✅ Backend integration (Whisper + GPT-4 + TTS in single voiceChat procedure)
- ✅ Error handling with retry buttons (no blocking alerts)

### Technical Stack

- **Frontend**: React 19 + Tailwind 4 + tRPC 11 + Wouter routing
- **Backend**: Express 4 + tRPC + Drizzle ORM + MySQL
- **AI Services**: 
  * OpenAI Whisper (speech-to-text)
  * OpenAI GPT-4 (conversation)
  * OpenAI TTS (text-to-speech, "alloy" voice)
- **Auth**: Manus OAuth (optional, demo works without login)
- **Storage**: S3 for audio files

## Product Strategy

### Quantum Leap Approach

- **Traditional**: Spend months perfecting before launch
- **Quantum**: Ship fast, learn from real usage, iterate based on feedback
- Build core experience → test with real users → improve based on actual behavior
- Elon Musk speed: bias toward action over planning

### Current Phase: Mira OS Testing

**Mira OS Infrastructure: ✅ CODE COMPLETE**

What was built:
- Time-aware state machine (auto-switches phases based on time of day)
- Context injection (personality + goals + phase + capacity + shutdown detection)
- Capacity modeling (1-10 slider with response adaptation)
- Shutdown drift detection (3+ days triggers appropriate response)
- OS view with dual panels (state on left, conversation on right)

What needs testing:
1. Does `/os` page render correctly in browser?
2. Does phase auto-switch at time boundaries (5am, 11am, 8pm)?
3. Does voice recording work with new context injection?
4. Do AI responses actually include goals and phase information?
5. Does capacity slider change response style (test low vs high)?
6. Does shutdown detection trigger after 3+ days away?
7. Do anchors extract in MORNING mode?
8. Does vision line save in EVENING mode?

**Next: User Testing → Refinement → Monetization**

### Launch Roadmap

**Phase 1: Test Mira OS (This Week)**
- Test `/os` route in browser
- Verify time-based phase switching
- Test voice chat with context injection
- Verify capacity-aware responses
- Test shutdown detection
- Validate anchors and vision line

**Phase 2: Refine Based on Testing**
- Fix any bugs discovered
- Improve UI/UX based on feedback
- Implement text input (currently has TODO)
- Add weekly/monthly cycles (tables exist, need UI)

**Phase 3: Clean Up for Launch**
- Remove waitlist (no longer needed)
- Update homepage copy from "coming soon" to "get started now"
- Decide if TRY DEMO stays free forever or becomes limited preview

**Phase 4: Add Payment (Stripe Integration)**
- Run `webdev_add_feature` with `feature="stripe"` to auto-configure
- Define subscription tiers and pricing
- Add subscription check to dashboard (redirect to payment if not subscribed)
- Build billing page (manage subscription, view invoices, update payment)

**Phase 5: Polish for Production**
- Add privacy policy & terms of service
- Email notifications (welcome, payment confirmations)
- Usage limits (track conversation count, show "upgrade" prompt)

**Phase 6: Analytics & Support**
- Track sign-ups, conversion rate (free → paid), churn rate
- Add FAQ page or contact form
- Error monitoring for payment failures

### Future Phases (Post-Launch)

1. **Voice Optimization** - Streaming responses, Sol voice upgrade, or ElevenLabs custom voice
2. **Weekly/Monthly Cycles** - Build UI for weekly summaries and monthly milestones (tables already exist)
3. **Pattern Recognition** - Identify user patterns and proactively offer support
4. **Proactive Orchestrator** - Scheduled nudges based on user preferences
5. **Multi-modal Input** - Text chat alongside voice
6. **Mobile App** - Native iOS/Android for always-available companion

## Design Philosophy

### Visual Language

- **Warm gradients**: Purple-to-pink (#A78BFA → #F472B6), pink-to-coral (#F472B6 → #FCA5A5)
- **Soft, inviting**: No harsh blacks or reds, everything flows in warm spectrum
- **Premium feel**: Subtle shadows, smooth hover effects, polished micro-interactions
- **Cohesive aesthetic**: Gradients throughout (buttons, waveforms, CTAs)

### Voice Personality (Target: "Sol")

- Warm, grounded, calm
- Mature feminine presence
- Human, not bubbly or whispery
- Not robotic or clinical

### UX Principles

- **Immediate feedback**: Show what's happening at every step
- **Clear progress**: "Transcribing → Thinking → Speaking" not "Loading..."
- **No dead ends**: Always provide next action (mic button to continue conversation)
- **Graceful errors**: Inline retry buttons, not blocking alerts
- **Accessible**: Clear instructions ("Tap again to stop recording")

## Key Decisions Made

### This Session (Mira OS Transformation)

1. **State machine architecture** - MiraContext with time-based phase detection
2. **60-second polling** - Balance between real-time updates and database load
3. **Client-side time detection** - Use browser local time for phase switching
4. **Capacity scale 1-10** - More granular than low/medium/high
5. **Shutdown threshold 3 days** - Balance between giving space and catching drift
6. **Context injection in chat** - Fetch personality + goals + OS state on every message
7. **Optimistic updates** - Instant UI feedback while database syncs in background

### Previous Sessions

1. **Voice-first, not text-first** - Core experience is speaking to Mira
2. **Demo before login** - Let users experience Mira immediately (voiceChat is public procedure)
3. **Alloy as placeholder** - Accept "good enough" voice now, upgrade later
4. **Loading states over streaming** - Test if detailed progress feels fast enough before building complex streaming
5. **Gradient everywhere** - Commit to warm, premium aesthetic throughout
6. **Quantum Leap speed** - Ship working version, iterate based on real feedback

## Metrics to Track (Future)

### Engagement

- % of visitors who click TRY DEMO
- Average conversation length (messages per session)
- % who continue conversation after first response
- % who complete PERSONALIZE quiz
- % who use `/os` vs `/dashboard`
- Average capacity score (track user energy levels)
- Shutdown rate (% of users who drift for 3+ days)

### Technical

- Voice recording success rate
- Transcription accuracy
- Average response time (transcribe + think + speak)
- Audio playback failure rate
- Phase switching accuracy
- Context injection latency

### Conversion

- Waitlist signups (to be removed)
- Demo → Personalize conversion
- Return visitors
- Free → Paid conversion (future)

## Next Priorities

### Immediate (This Week)

1. **Test Mira OS** - Open `/os` in browser, test all features
2. **Verify phase switching** - Test at different times of day (5am, 11am, 8pm)
3. **Test context injection** - Verify AI responses include goals and phase
4. **Test capacity adaptation** - Set slider to low (≤3) and high (≥8), compare responses
5. **Test shutdown detection** - Manually set lastInteraction to 4 days ago, verify response

### Short-term (Next 2 Weeks)

1. **Fix bugs** - Address any issues discovered during testing
2. **Implement text input** - Complete TODO in MiraOS.tsx
3. **Build weekly/monthly UI** - Tables exist, need guided flows
4. **Remove waitlist** - Clean up testing artifacts
5. **Update homepage** - Change copy for launch

### Medium-term (Next Month)

1. **Monetization** - Stripe integration, subscription tiers, billing page
2. **Legal** - Privacy policy, terms of service
3. **Voice optimization** - Streaming responses if speed is still an issue
4. **Voice upgrade** - Sol API release or ElevenLabs custom voice
5. **Analytics** - Track conversion metrics, user engagement

## Repository Structure

```
client/
  src/
    pages/
      Home.tsx              ← Main app (dormant/landing/speaking/listening/active states)
      MiraOS.tsx            ← NEW: OS view (phase/capacity/anchors + conversation)
      Dashboard.tsx         ← Authenticated dashboard with voice chat
      DailyGoals.tsx        ← Daily goals page
    contexts/
      MiraContext.tsx       ← NEW: State machine (time-based phase detection)
      ThemeContext.tsx      ← Theme provider
    components/
      Waveform.tsx          ← Animated recording visualization
    lib/trpc.ts             ← tRPC client setup
    index.css               ← Global styles, gradients, animations

server/
  miraRouter.ts             ← NEW: Intelligent router (context injection, shutdown detection)
  miraRouter.old.ts         ← Backed up original
  miraPersonality.ts        ← buildMiraSystemPrompt (now wired into chat)
  conversationRouter.ts     ← Conversation CRUD
  goalsRouter.ts            ← Daily goals CRUD
  db.ts                     ← Database query helpers
  _core/
    llm.ts                  ← GPT-4 integration
    voiceTranscription.ts   ← Whisper integration

drizzle/
  schema.ts                 ← Database schema (12 tables total)
    - users, userProfiles (onboarding data)
    - waitlist (to be removed)
    - dailyGoals, dailyReflections (extended with new fields)
    - accountabilityPartners, shareTokens
    - conversations, messages
    - userState (NEW: OS RAM)
    - weeklySummaries (NEW: weekly reflection)
    - monthlyMilestones (NEW: monthly check-ins)

todo.md                     ← Feature tracking (40+ phases completed)
CONTEXT.md                  ← Current metrics and priorities
CHECKPOINT_MIRA_OS_V1.md    ← This session's checkpoint
```

## Contact & Handoff

**For new AI agents working on this project:**
- Read this brief first
- Check CONTEXT.md for current metrics and priorities
- Review CHECKPOINT_MIRA_OS_V1.md for latest session details
- Review todo.md for completed work and pending tasks
- Follow Quantum Leap approach: 1-hour shortcuts, not 1-month traditional paths

**Current state**: Mira OS infrastructure complete but NOT TESTED. Priority is user testing to verify everything works as intended.
