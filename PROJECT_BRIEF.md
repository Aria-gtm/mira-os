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

## Current Status (Latest Session: Authentication & Dashboard)

### What We Built This Session
- ✅ **Google OAuth login** - LOGIN button redirects to Manus OAuth portal (Google/Microsoft/Apple)
- ✅ **Authenticated dashboard** - `/dashboard` page with voice chat for logged-in users
- ✅ **Conversation persistence** - Database tables (conversations + messages) save all chats
- ✅ **Conversation history sidebar** - Clickable list of past conversations with timestamps
- ✅ **Daily goals widget** - Integrated into dashboard sidebar
- ✅ **Auto-title generation** - First user message becomes conversation title
- ✅ **Full CRUD operations** - Create, read, update conversations via tRPC
- ✅ **Comprehensive testing** - 8 new conversation tests, 17 total backend tests passing

### Previous Session Accomplishments
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
- **Backend**: Express 4 + tRPC + Drizzle ORM + PostgreSQL
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

### Current Phase: Pre-Launch Preparation
**Authentication & Persistence: ✅ COMPLETE**
- Users can login with Google OAuth
- Dashboard provides authenticated voice chat experience
- All conversations persist across sessions
- Conversation history accessible via sidebar

**Next: Monetization Setup**
1. Remove waitlist (no longer needed)
2. Add Stripe payment integration (built-in feature available)
3. Define subscription tiers (e.g., $9/month unlimited, $0 for 5 conversations/month)
4. Protect dashboard with subscription check
5. Add billing page for subscription management

### Launch Roadmap
**Phase 1: Clean Up (Remove Testing Artifacts)**
- Remove "JOIN WAITLIST" button and backend code
- Update homepage copy from "coming soon" to "get started now"
- Decide if TRY DEMO stays free forever or becomes limited preview

**Phase 2: Add Payment (Stripe Integration)**
- Run `webdev_add_feature` with `feature="stripe"` to auto-configure
- Define subscription tiers and pricing
- Add subscription check to dashboard (redirect to payment if not subscribed)
- Build billing page (manage subscription, view invoices, update payment)

**Phase 3: Polish for Production**
- Add privacy policy & terms of service
- Email notifications (welcome, payment confirmations)
- Usage limits (track conversation count, show "upgrade" prompt)

**Phase 4: Analytics & Support**
- Track sign-ups, conversion rate (free → paid), churn rate
- Add FAQ page or contact form
- Error monitoring for payment failures

### Future Phases (Post-Launch)
1. **Voice Optimization** - Streaming responses, Sol voice upgrade, or ElevenLabs custom voice
2. **Personalization Engine** - Use quiz data to adapt Mira's responses
3. **Pattern Recognition** - Identify user patterns and proactively offer support
4. **Multi-modal Input** - Text chat alongside voice
5. **Mobile App** - Native iOS/Android for always-available companion

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

### Technical
- Voice recording success rate
- Transcription accuracy
- Average response time (transcribe + think + speak)
- Audio playback failure rate

### Conversion
- Waitlist signups
- Demo → Personalize conversion
- Return visitors

## Next Priorities

### Immediate (This Week)
1. **User testing** - Test authentication flow, dashboard voice chat, conversation persistence
2. **Launch prep decision** - Remove waitlist, add Stripe, or keep testing?

### Short-term (Next 2 Weeks)
1. **Monetization** - Stripe integration, subscription tiers, billing page
2. **Clean up** - Remove testing artifacts, update copy for launch
3. **Legal** - Privacy policy, terms of service

### Medium-term (Next Month)
1. **Voice optimization** - Streaming responses if speed is still an issue
2. **Voice upgrade** - Sol API release or ElevenLabs custom voice
3. **Analytics** - Track conversion metrics, user engagement

## Repository Structure

```
client/
  src/
    pages/Home.tsx          ← Main app (dormant/landing/speaking/listening/active states)
    components/
      Waveform.tsx          ← Animated recording visualization
    lib/trpc.ts             ← tRPC client setup
    index.css               ← Global styles, gradients, animations

server/
  miraRouter.ts             ← voiceChat procedure (Whisper + GPT-4 + TTS)
  db.ts                     ← Database query helpers
  _core/
    llm.ts                  ← GPT-4 integration
    voiceTranscription.ts   ← Whisper integration

drizzle/
  schema.ts                 ← User profiles, quiz data, conversations, messages

server/
  conversationRouter.ts     ← Conversation CRUD (create, list, get, addMessage, updateTitle)
  conversation.test.ts      ← 8 tests for conversation management

todo.md                     ← Feature tracking (40 phases completed)
```

## Contact & Handoff

**For new AI agents working on this project:**
- Read this brief first
- Check CONTEXT.md for current metrics and priorities
- Use PROMPTS.md for copy/paste management commands
- Review todo.md for completed work and pending tasks
- Follow Quantum Leap approach: 1-hour shortcuts, not 1-month traditional paths
