# Mira - Current Context

**Last Updated**: December 1, 2025 - Mira OS Transformation Session

## Current Metrics

### Product Status
- **Stage**: Pre-launch (Mira OS infrastructure complete, testing required)
- **MRR**: $0 (not launched)
- **Customers**: 0 (no paid users yet)
- **Trials**: 0 (demo available but not tracked)

### Technical Health
- **Dev Server**: Running on port 3000 (http://localhost:3000/)
- **TypeScript**: No compilation errors
- **Build**: Passing (production bundle: 505 KB client, 69.3 KB server)
- **Tests**: 17/17 backend tests passing
- **Latest Work**: Mira OS transformation (state machine + context injection + OS view)

## What's Working

### Core Functionality ✅ (From Previous Sessions)
1. **Voice recording** - Start/stop works correctly (mediaRecorderRef fixed)
2. **Transcription** - Whisper API integration working
3. **AI conversation** - GPT-4 responds with personality
4. **TTS playback** - "Alloy" voice plays automatically
5. **Conversation history** - Messages display with auto-scroll
6. **Error handling** - Inline retry buttons, no blocking alerts

### Authentication & Persistence ✅ (From Previous Session)
1. **Google OAuth login** - LOGIN button → Manus OAuth portal (Google/Microsoft/Apple)
2. **Dashboard page** - `/dashboard` route with authenticated voice chat
3. **Conversation persistence** - All messages saved to database (conversations + messages tables)
4. **Conversation history** - Sidebar shows clickable list of past conversations
5. **Daily goals widget** - Integrated into dashboard sidebar
6. **Auto-title generation** - First user message becomes conversation title
7. **Session persistence** - Users can logout, login, and resume conversations

### Mira OS Infrastructure ✅ (This Session - CODE COMPLETE, NOT TESTED)

**1. State Machine (MiraContext)**
- Time-based phase detection (MORNING 5-11am, FOCUS 11am-8pm, EVENING 8pm-4am)
- Auto-syncs with database every 60 seconds
- Optimistic updates for instant UI feedback
- Provides `useMira()` hook for global OS state
- **Status**: Code written, server compiles, NOT tested in browser

**2. OS View (MiraOS Page)**
- Left panel: Phase indicator, capacity slider (1-10), anchors list, vision line
- Right panel: Conversation with voice/text input
- Phase-specific greetings
- Auto-extracts anchors in MORNING mode
- Waveform visualization while recording
- **Status**: Component created, route added (`/os`), NOT tested in browser

**3. Intelligent Backend (miraRouter)**
- `getOSState` - Fetch current OS state from database
- `updateOSState` - Update state with tracking (low capacity streaks, shutdown risk)
- `chat` - Full context injection:
  * Personality from user profile (`buildMiraSystemPrompt`)
  * Today's goals from dailyGoals table
  * OS state (phase, capacity, anchors)
  * Shutdown drift detection (3+ days away)
  * Phase-specific instructions (morning anchors, evening reflection)
  * Capacity-aware response adaptation (low energy = short sentences, high energy = push harder)
- `voiceChat` - Enhanced with context awareness (uses chat procedure if authenticated)
- **Status**: Code written, server compiles, NOT tested with real conversations

**4. Database Schema Extensions**
- `userState` table - OS RAM (phase, capacity, shutdown risk, anchors, vision line, temporal tracking)
- `weeklySummaries` table - Weekly reflection data (energized/drained tracking)
- `monthlyMilestones` table - Monthly check-ins (future self alignment)
- Extended `dailyGoals` with `energyLevel` and `capacityNote`
- Extended `dailyReflections` with `visionLine`
- Extended `userProfiles` with `supportIntensity`, `nudgeTolerance`, `verbosity`
- **Status**: Schema updated, server starts successfully, tables created on startup

**5. Integration**
- Wired up existing personality system (`buildMiraSystemPrompt` now used in chat procedure)
- Wired up existing goals system (today's goals now injected into chat prompts)
- Added MiraProvider to App.tsx (wraps entire app with OS state)
- Added `/os` route for new OS view
- **Status**: Code integrated, NOT tested end-to-end

## What's NOT Working

### Known Issues ❌

**1. Mira OS NOT TESTED**
- `/os` route exists but NOT opened in browser
- Phase switching logic written but NOT verified at time boundaries
- Context injection code written but NOT verified in AI responses
- Capacity-aware responses implemented but NOT tested (low vs high)
- Shutdown detection logic written but NOT tested (requires 3+ days away)
- Anchors extraction implemented but NOT tested in MORNING mode
- Vision line save/display implemented but NOT tested in EVENING mode
- **Action Required**: Full end-to-end testing by user

**2. Text Input Incomplete**
- MiraOS.tsx has text input field visible
- `handleSendText()` function has TODO comment
- Only voice input works currently
- **Action Required**: Implement text chat endpoint or reuse existing chat procedure

**3. Voice Interaction Speed** (From Previous Session)
- 7-12 second delay feels slow
- User reports "notably long gap" between speaking and response
- Loading states help but may not be enough
- **Decision Pending**: Test with real users, implement streaming if needed

**4. Voice Quality** (From Previous Session)
- "Alloy" is placeholder, not ideal
- Alloy is "clean and adaptable" but not Mira's final voice
- **Target**: Sol voice (warm, grounded, mature feminine)
- **Blocker**: Sol not available in API yet
- **Alternative**: ElevenLabs custom voice (~$11/month)

**5. Waitlist Still Present** (From Previous Session)
- "JOIN WAITLIST" button no longer needed
- User quote: "I'm not even sure why it's there"
- **Action**: Remove before launch

**6. No Monetization** (From Previous Session)
- Payment system not implemented
- Dashboard is free for now
- Need to add Stripe integration
- Need to define subscription tiers

## Current Priorities

### P0 - Critical (This Week)

**1. Test Mira OS Infrastructure**
- Open `/os` in browser, verify page renders correctly
- Test time-based phase switching at different hours (5am, 11am, 8pm)
- Record voice message, verify AI response includes context (goals, phase, capacity)
- Test capacity slider: set to low (≤3) and high (≥8), compare response styles
- Test shutdown detection: manually set `lastInteraction` to 4 days ago in database, verify greeting
- Test anchors extraction: set phase to MORNING, send 3 messages, verify anchors appear
- Test vision line: set phase to EVENING, type vision line, verify it saves

**2. Fix Bugs Discovered During Testing**
- Address any issues found in P0 testing
- Implement text input if needed
- Fix any UI/UX problems

### P1 - Important (Next 2 Weeks)

**1. Build Weekly/Monthly Cycles**
- Tables exist (`weeklySummaries`, `monthlyMilestones`)
- Need UI for weekly review flow
- Need UI for monthly milestone check
- Need guided prompts for reflection

**2. Remove Waitlist**
- Delete "JOIN WAITLIST" button from homepage
- Remove waitlist backend code and database table
- Update homepage copy for launch

**3. Add Stripe Payment**
- Run `webdev_add_feature` with `feature="stripe"`
- Define subscription tiers (e.g., $9/month unlimited, $0 for 5 conversations/month)
- Protect dashboard with subscription check
- Build billing page (manage subscription, view invoices, update payment)

**4. Legal Requirements**
- Privacy policy
- Terms of service
- Required for paid products

### P2 - Nice to Have (Future)

1. **Voice Optimization** - Streaming responses if speed is still an issue
2. **Voice Upgrade** - Sol API release or ElevenLabs custom voice
3. **Pattern Recognition** - Analyze low capacity streaks, detect recurring shutdown triggers
4. **Proactive Orchestrator** - Scheduled nudges based on user preferences
5. **Conversation Search** - Search through past conversations by keywords or date
6. **Export Conversations** - Download conversation transcripts as PDF or text
7. **Voice Settings** - Customize Mira's voice speed, tone, language
8. **Analytics** - Track engagement metrics (sign-ups, conversion, churn)
9. **Email Notifications** - Welcome emails, payment confirmations
10. **Usage Limits** - Track conversation count, show "upgrade" prompt

## What Changed This Session

### Product Changes

**Mira OS Transformation** - Shifted from chatbot to time-aware operating system:

1. **State machine created** - MiraContext with time-based phase detection
2. **OS view created** - MiraOS page with dual panels (state + conversation)
3. **Context injection implemented** - Chat procedure now fetches personality + goals + OS state
4. **Shutdown detection added** - Tracks last interaction, responds appropriately after 3+ days
5. **Capacity modeling added** - 1-10 slider with response adaptation
6. **Phase-specific behavior** - Morning anchors, evening reflection, focus mode
7. **Personality system wired** - `buildMiraSystemPrompt` now used in every chat
8. **Goals system wired** - Today's goals now injected into every chat prompt

### Technical Changes

1. **Database schema** - Added 3 new tables (`userState`, `weeklySummaries`, `monthlyMilestones`)
2. **Database schema** - Extended 3 existing tables (`dailyGoals`, `dailyReflections`, `userProfiles`)
3. **MiraContext.tsx** - New state machine with time-based phase detection
4. **MiraOS.tsx** - New OS view page with dual panels
5. **miraRouter.ts** - Complete rewrite with context injection and shutdown detection
6. **miraRouter.old.ts** - Backed up original router
7. **App.tsx** - Added MiraProvider wrapper and `/os` route
8. **Production build** - Tested build process (505 KB client, 69.3 KB server)

### Strategy Changes

1. **Quantum Leap approach maintained** - Ship code → test → iterate (not perfect then ship)
2. **Testing priority** - User testing now P0 before any new features
3. **Weekly/monthly cycles planned** - Tables exist, UI needed next
4. **Deployment clarified** - Manus sandbox is temporary, need permanent hosting decision

## Decisions Made

### This Session (Mira OS Transformation)

**Architecture**
- State machine pattern (MiraContext) for global OS state
- 60-second polling interval for database sync
- Client-side time detection for phase switching
- Optimistic updates for instant UI feedback

**Data Model**
- Capacity scale 1-10 (more granular than low/medium/high)
- Shutdown threshold 3 days (balance between space and drift detection)
- JSON storage for anchors (3-item array in userState table)
- Separate tables for weekly/monthly cycles (not embedded in userState)

**Context Injection**
- Fetch personality + goals + OS state on every chat message
- Build dynamic system prompt with all context
- Phase-specific instructions (morning anchors, evening reflection)
- Capacity-aware response adaptation (low energy = short sentences, high energy = push harder)

**Shutdown Detection**
- 3+ days away = suspected shutdown
- Response style based on `callOutPreference`:
  * Minimal: "Welcome back" (no questions)
  * Soft: "Do you want to reset or catch up?"
  * Direct: "What happened? Let's talk about it."

### Previous Sessions

**Authentication Strategy**
- OAuth provider: Manus OAuth (supports Google, Microsoft, Apple)
- Public routes: TRY DEMO and PERSONALIZE remain free, no login required
- Protected routes: Dashboard and `/os` require authentication
- Session persistence: Users can logout, login, and resume conversations

**Monetization Strategy**
- Freemium model: Free tier (limited conversations) + paid tier (unlimited)
- Payment processor: Stripe (built-in Manus feature)
- Pricing (tentative): $0 for 5 conversations/month, $9/month for unlimited
- Billing: Subscription-based, managed via dashboard billing page

**Launch Roadmap**
- Phase 1: Test Mira OS (this week)
- Phase 2: Refine based on testing (next week)
- Phase 3: Clean up (remove waitlist, update copy)
- Phase 4: Add payment (Stripe integration, subscription tiers)
- Phase 5: Polish (privacy policy, terms, email notifications)
- Phase 6: Analytics & support (track metrics, add FAQ/contact)

## Next Session Priorities

1. **Test Mira OS** - Full end-to-end testing of all new features
2. **Fix bugs** - Address any issues discovered during testing
3. **Implement text input** - Complete TODO in MiraOS.tsx
4. **Build weekly/monthly UI** - Tables exist, need guided flows
5. **Deployment decision** - Choose permanent hosting platform (Vercel, Railway, etc.)

## Handoff Notes

**For next AI agent:**

**Current State**
- Mira OS infrastructure is CODE COMPLETE but NOT TESTED
- Server compiles and runs without errors
- Database schema updated (12 tables total)
- 3 new files created (MiraContext, MiraOS, miraRouter rewrite)
- 2 files modified (schema.ts, App.tsx)
- 1 file backed up (miraRouter.old.ts)

**What Works (Verified)**
- Server starts successfully
- No TypeScript compilation errors
- Production build completes (505 KB client, 69.3 KB server)
- Database tables created on startup

**What's Unknown (Needs Testing)**
- Does `/os` page render correctly?
- Does phase auto-switch at time boundaries?
- Does context injection work in AI responses?
- Does capacity slider affect response style?
- Does shutdown detection trigger appropriately?
- Do anchors extract in MORNING mode?
- Does vision line save in EVENING mode?

**User's Exact Words**
- "I'm not even sure if you know what you're doing yourself"
- "I need you to review everything on this chat from the beginning"
- "No skimming no skipping no shortcuts no speeding through things"
- "Do not waste my time do not lie and say you did what you did not do"
- "I will test you and ask questions to make sure you've done a proper analysis"

**User's Priorities**
1. **Honesty** - Admit what's tested vs theoretical
2. **Thoroughness** - No shortcuts, complete analysis
3. **Facts** - Update docs with accurate current state
4. **Testing** - Verify everything works before claiming success

**Follow Quantum Leap Approach**
- Ship code → test → iterate (not perfect then ship)
- 1-hour shortcuts, not 1-month traditional paths
- But ALWAYS test before claiming complete

**Current Blocker**: User testing required before any new features or deployment.
