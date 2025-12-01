# Mira Project TODO

## Phase 1: Database Schema & Backend API
- [x] Create user profiles table with onboarding data
- [ ] Create conversations table for chat history
- [ ] Create messages table for conversation messages
- [x] Build tRPC procedures for onboarding quiz
- [x] Build tRPC procedures for voice transcription
- [x] Build tRPC procedures for AI conversation
- [x] Build tRPC procedures for retrieving user personality data

## Phase 2: Marketing Pages (Gemini Design)
- [x] Convert Gemini HTML to React Home page
- [x] Add warm aesthetic (#FFFCF9 background, film grain, glassmorphism)
- [x] Add Cormorant Garamond / Instrument Serif typography
- [x] Add animated aurora background blobs
- [x] Add hero section with "Mira: Your self, expanded"
- [x] Add Reflective + Proactive Intelligence explanation
- [x] Add "A Day with Mira" examples (Morning/Midday/Evening)
- [x] Add integration callouts (Spotify, YouTube, calendar, Bible, affirmations)
- [x] Fix all "Rhea" → "Ria" in dialogue examples
- [ ] Create About page with Mira's identity and mission
- [ ] Ensure mobile responsiveness

## Phase 3: Onboarding Quiz
- [x] Convert Gemini onboarding quiz to React component
- [x] Add voice recording functionality (Whisper API)
- [x] Add 5 behavior-based questions
- [x] Add "Person You're Becoming" setup
- [x] Save onboarding data to database
- [x] Add smooth animations and transitions

## Phase 4: Voice Conversation Interface
- [x] Create Prototype/Demo page for voice chat
- [x] Add voice recording with Web Audio API
- [x] Integrate Whisper API for speech-to-text
- [x] Integrate OpenAI GPT-4 for conversation
- [x] Integrate OpenAI TTS for voice responses
- [x] Add personality system using onboarding data
- [x] Add visual feedback (waveforms, pulsing orbs)
- [x] Add conversation history display

## Phase 5: Testing & Polish
- [x] Test all pages on desktop
- [ ] Test all pages on mobile
- [x] Test voice recording and transcription
- [x] Test AI conversation with personality
- [x] Verify no nested anchor tags
- [x] Verify all CTAs link correctly
- [ ] Run auto-critique checklist
- [ ] Create checkpoint

## Phase 6: Exact Gemini Code Implementation
- [x] Replace Home.tsx with exact Gemini HTML structure
- [x] Convert Alpine.js interactive demo to React state management
- [x] Implement "Living M" animation (vivid soul nebula + geometric rings + infinity path particle)
- [x] Implement demo flow states (dormant → landing → speaking → listening → active)
- [x] Implement quiz flow with 5 questions
- [x] Remove all emojis and use exact text from Gemini code
- [x] Preserve all CSS classes and styling exactly
- [x] Ensure waveform visualizations match Gemini design
- [x] Test all interactive states

## Phase 11: Voice Integration (Real Backend Functionality)
- [x] Add voice recording to microphone button in listening state
- [x] Upload recorded audio to S3 storage
- [x] Integrate Whisper API for speech-to-text transcription
- [x] Send transcribed text to OpenAI GPT-4 for conversation
- [ ] Integrate OpenAI TTS for voice responses
- [ ] Play voice responses in the active state
- [x] Add loading states during transcription and AI processing
- [x] Handle errors gracefully (mic permission, network issues)
- [ ] Test complete voice flow end-to-end

## Phase 12: OpenAI TTS Voice Responses
- [x] Add OpenAI TTS API integration to miraRouter
- [x] Generate speech audio from AI responses
- [x] Return audio URL from chat mutation
- [x] Auto-play voice responses in active state
- [ ] Add audio player controls (pause, replay)

## Phase 13: Quiz Database Integration
- [x] Connect quiz submission to saveOnboarding mutation
- [x] Store all 5 quiz answers in database
- [ ] Retrieve user profile in chat mutation
- [ ] Use personality data to customize AI responses
- [ ] Test personalized conversation flow

## Phase 14: Waitlist Email Capture
- [x] Create waitlist table in database schema
- [x] Add waitlist router with email validation
- [x] Implement owner notification on signup
- [x] Build waitlist modal UI with form
- [x] Add success/error states
- [x] Test email capture and notifications

## Phase 15: Spotify OAuth Integration
- [ ] Set up Spotify OAuth flow (authorization code)
- [ ] Create OAuth callback route
- [ ] Store Spotify tokens in database
- [ ] Add Spotify API helpers (search, play, pause, queue)
- [ ] Integrate with AI conversation (function calling)
- [ ] Test music playback during conversation

## Phase 16: Google OAuth (YouTube + Calendar)
- [ ] Set up Google OAuth flow
- [ ] Request YouTube and Calendar scopes
- [ ] Store Google tokens in database
- [ ] Add YouTube API helpers (search videos, get embed URL)
- [ ] Add Calendar API helpers (list events, create events)
- [ ] Integrate with AI conversation
- [ ] Test meditation playback and calendar management

## Phase 17: Personalize AI with Quiz Data
- [x] Retrieve user profile from database in chat mutation
- [x] Build dynamic system prompt using quiz preferences
- [x] Inject tone preference into AI personality
- [x] Inject shutdown preference into AI behavior
- [ ] Test personalized conversations

## Phase 17.5: Refine Mira Personality (ChatGPT Insights)
- [x] Add three-layer thinking (Surface → Pattern → Alignment)
- [x] Add core moves framework (Clarify, Pivot, Anchor, Reflect, Ground)
- [x] Add tone boundaries (never say "You've got this!", etc.)
- [x] Update system prompt with refined personality
- [x] Integrate buildMiraSystemPrompt for full profiles
- [ ] Test refined personality in conversations

## Phase 18: Spotify OAuth & Music Playback
- [ ] Request Spotify API credentials from user
- [ ] Create Spotify OAuth routes (authorize + callback)
- [ ] Store Spotify tokens in database
- [ ] Add Spotify API helpers (search, play, pause, queue)
- [ ] Add function calling for music control
- [ ] Test music playback during conversation

## Phase 19: Google OAuth (YouTube + Calendar)
- [ ] Request Google API credentials from user
- [ ] Create Google OAuth routes (authorize + callback)
- [ ] Store Google tokens in database
- [ ] Add YouTube API helpers (search videos)
- [ ] Add Calendar API helpers (list/create events)
- [ ] Add function calling for YouTube and Calendar
- [ ] Test meditation playback and calendar management

## Phase 20: Daily Goals Check-In System
- [x] Create dailyGoals table (userId, date, personalGoal, professionalGoal, growthGoal, timestamp)
- [x] Create dailyReflections table (userId, date, personalProgress, professionalProgress, growthProgress, patterns, wins, struggles, timestamp)
- [x] Add tRPC procedures for creating daily goals
- [x] Add tRPC procedures for retrieving today's goals
- [x] Add tRPC procedures for creating evening reflections
- [x] Add tRPC procedures for retrieving reflection history
- [x] Create morning check-in UI component
- [x] Create evening reflection UI component
- [x] Add time-based prompts (morning vs evening detection)
- [x] Test complete daily goals flow

## Phase 21: Goal Sharing & Accountability Partners
- [ ] Create accountabilityPartners table (userId, partnerId, partnerEmail, partnerName, status, permissions)
- [ ] Create shareTokens table (userId, token, expiresAt, permissions)
- [ ] Add tRPC procedure to invite accountability partner by email
- [ ] Add tRPC procedure to accept/reject partner invitations
- [ ] Add tRPC procedure to generate shareable link with expiration
- [ ] Add tRPC procedure to view shared goals (public endpoint)
- [ ] Add tRPC procedure to list accountability partners
- [ ] Add tRPC procedure to remove accountability partner
- [ ] Create accountability partners UI in goals page
- [ ] Create share link generator UI
- [ ] Create public shared goals view page
- [ ] Add email notifications for partner invitations
- [ ] Test complete sharing flow

## Phase 22: Fix Responsive Design
- [x] Fix Home page container to adapt from mobile (max-w-md) to desktop (max-w-4xl or wider)
- [x] Ensure demo container expands on larger screens
- [x] Test responsive breakpoints (mobile, tablet, desktop)

## Phase 23: Proper Desktop Responsive Design
- [x] Scale up main heading (text-[4.2rem] → text-6xl md:text-7xl lg:text-8xl)
- [x] Scale up body text (text-sm → text-sm md:text-base lg:text-lg)
- [x] Scale up buttons (text-xs → text-sm md:text-base)
- [x] Increase button padding on desktop
- [x] Scale up demo container and Living M animation
- [x] Increase spacing between sections on desktop
- [x] Test on 1920x1080 desktop resolution
- [x] Verify mobile design still works (320px - 768px)

## Phase 24: Restore Gemini's Exact Design
- [x] Restore max-w-md container (NOT max-w-4xl)
- [x] Remove all md: and lg: responsive breakpoints I added
- [x] Verify background color is #FFFCF9
- [x] Verify text colors: #1C1917 (text), #57534E (subtext)
- [x] Verify fonts: Instrument Serif (serif), Inter (sans)
- [x] Verify main heading is text-[4.2rem] leading-[0.9]
- [x] Verify body text is text-sm
- [x] Verify button text is text-xs)
- [ ] Test voice recording functionality (USER MUST TEST)
- [ ] Test OpenAI conversation (USER MUST TEST)
- [ ] Test TTS playback (USER MUST TEST)
- [ ] Test quiz flow (USER MUST TEST)
- [ ] Test waitlist modal (USER MUST TEST)
- [x] Run all vitest tests (9/9 passing)
- [x] Full 360-degree analysis (see /home/ubuntu/mira_360_analysis.md)

## Phase 28: Fix Critical Bugs (User Reported)
- [ ] Fix transcription failure error ("Failed to transcribe audio. Please try again.")
- [ ] Add text content to landing card (currently missing)
- [ ] Add instructions to speaking state (was removed)
- [ ] Verify demo flow shows all states correctly
- [ ] Test voice recording works on mobile

## Phase 28: Fix Critical Bugs (User Reported)
- [ ] Fix transcription failure error ("Failed to transcribe audio. Please try again.")
- [ ] Add more text content to landing card to fill blank space
- [ ] Add instructions to speaking state (was removed, need to restore)
- [ ] Test voice recording works on mobile device

## Phase 29: Fix NEW Critical Bugs (User Tested)
- [x] Fix invisible white text in dormant state (changed to text-mira-text)
- [x] Fix recording auto-stops after few seconds (removed 5s setTimeout)
- [x] Fix TTS code (server generates + uploads, client plays) - USER MUST TEST
- [x] Test visual result - text is visible in dark color below circle
- [ ] Test full voice flow end-to-end (USER MUST TEST ON MOBILE)

## Phase 30: Fix Recording Stop Bug (CRITICAL)
- [x] Fix recording won't stop (removed 500ms minimum check) - THIS WAS WRONG, BUG STILL EXISTS
- [x] Add clear instruction: "Tap again to stop recording" (shows when recording)
- [x] Style "I'm Ready" button (added mira-button class back to CSS)
- [x] ACTUAL FIX: Convert mediaRecorder from useState to useRef (state doesn't update immediately)
- [ ] Test recording start/stop works on mobile (USER MUST TEST)

## Phase 31: Conversation History UI & Error Handling
- [ ] Design conversation history UI (scrollable chat interface)
- [ ] Add conversation history display in active state
- [ ] Show user messages and Mira responses with timestamps
- [ ] Add retry button for transcription errors
- [ ] Add retry button for audio playback errors
- [ ] Replace generic alert() with helpful error messages
- [ ] Test conversation history persists across interactions
- [ ] Test retry buttons work correctly


## Phase 32: COMPLETE REBUILD - Voice Recording & Conversation
- [x] Create unified voiceChat tRPC procedure (transcribe + chat + TTS in one call)
- [x] Rebuild TRY DEMO with separate startRecording() and stopRecording() functions
- [x] Add clear "Tap again to stop recording" instruction when recording
- [x] Add conversation history UI (scrollable chat with user/Mira messages)
- [x] Add TTS audio playback (auto-play Mira's voice responses)
- [x] Rebuild PERSONALIZE quiz with voice recording for answers
- [x] Changed voiceChat from protected to public procedure (works without login)
- [ ] USER MUST TEST: Complete TRY DEMO flow on mobile device
- [ ] USER MUST TEST: Verify recording starts/stops immediately
- [ ] USER MUST TEST: Verify conversation history displays correctly
- [ ] USER MUST TEST: Verify TTS audio plays automatically


## Phase 33: UI Fixes from User Testing
- [x] Fix overlapping "Conversation" text with "Continue" button (increased spacing, made button bordered)
- [x] Add max-height (60vh) and scroll behavior to conversation history
- [x] Add loading skeleton (pulsing placeholder) while waiting for Mira's response
- [x] Replace generic error alerts with inline retry buttons (red box with "Try Again" button)
- [x] Handle audio playback permission errors gracefully (shows error message, doesn't block UI)
- [x] Add auto-scroll to bottom when new messages arrive
- [x] Disable mic button when error is showing
- [ ] USER MUST TEST: All fixes on mobile device


## Phase 34: Critical Fixes from Latest Testing
- [x] Fix STILL overlapping "Conversation" header with "Continue" button (moved to separate layout: header left, button top-right)
- [x] Add mic button to conversation view so user can continue chatting after Mira responds (purple mic button at bottom with "Tap mic to continue" text)
- [x] Change TTS voice from "nova" to "shimmer" for more natural, warm, expressive sound
- [x] Test conversation layout in browser (no overlap, clean spacing)
- [ ] USER MUST TEST: Conversation flow on mobile - record → response → record again → response
- [ ] USER MUST TEST: New shimmer voice quality on mobile device


## Phase 35: Thorough Testing & Waveform Visualization
- [x] Add animated waveform visualization while recording (5 bars with wave animation)
- [x] Integrate waveform into listening view mic button
- [x] Integrate waveform into conversation view mic button
- [x] Remove static red pulse, use waveform when isRecording=true
- [x] Test state transitions in browser (limited by no microphone)
- [ ] USER MUST TEST: Record voice and verify waveform animates
- [ ] USER MUST TEST: Continue conversation flow (record → response → record again)
- [ ] USER MUST TEST: Verify shimmer voice quality is better than nova


## Phase 36: Color Improvements for Waveform & Buttons
- [x] Change waveform bars from white to warm purple/pink gradient (pink #F472B6 to purple #A78BFA)
- [x] Improve black JOIN WAITLIST button - changed to purple-to-pink gradient matching site aesthetic
- [x] Test color changes in browser (JOIN WAITLIST button looks beautiful with gradient)
- [ ] USER MUST TEST: Verify waveform gradient looks good while recording on mobile
- [ ] Consider changing recording button background from red to softer warm color (optional)


## Phase 37: Soften Recording Button Color
- [x] Change recording button background from harsh red to warm coral-pink gradient (#FCA5A5 → #F472B6)
- [x] Applied gradient to both listening view and conversation view mic buttons
- [x] Changed quiz voice recording icon from red to pink
- [ ] USER MUST TEST: Recording button color on mobile device


## Phase 38: Speed Up Voice Interaction + Change Voice
- [x] Change TTS voice from "shimmer" to "alloy" (clean, neutral placeholder)
- [x] Add detailed loading states: "Transcribing..." → "Thinking..." → "Speaking..."
- [x] Show user transcript immediately in conversation history
- [x] Add loadingState tracking (transcribing, thinking, speaking)
- [x] Update all UI text to show current loading state
- [ ] USER MUST TEST: Voice interaction speed and loading states on mobile
- [ ] If still too slow: Implement full streaming (SSE) for real-time text updates
- [ ] Future: Replace with Sol when OpenAI releases to API, or create custom voice with ElevenLabs


## Phase 39: Redesign Landing Buttons & CTA
- [x] Give TRY DEMO button purple-to-pink gradient (#A78BFA → #F472B6)
- [x] Give PERSONALIZE button complementary pink-to-coral gradient (#F472B6 → #FCA5A5)
- [x] Make both buttons same size and visual weight (equal padding, shadows, hover effects)
- [x] Replace "Begin." with "Start your journey."
- [x] Simplify tagline to "Your future self is waiting."
- [ ] USER MUST TEST: Button design and visibility on mobile device


## Phase 40: Voice Change to Nova + Speed Improvements
- [x] Change TTS voice from alloy to nova (user feedback: alloy too masculine)
- [x] Keep existing loading states ("Transcribing..." → "Thinking..." → "Speaking...")
- [x] Quantum Leap approach: Ship now, add streaming later ONLY if user testing shows it's too slow
- [ ] USER MUST TEST: Voice quality (nova vs alloy) on mobile device
- [ ] USER MUST TEST: Speed feels acceptable with current loading states
- [ ] If still too slow after testing: Implement Server-Sent Events streaming for real-time GPT-4 response


## Phase 41: Full Authenticated Mira Experience for Owner Testing
- [ ] Add "Login" button to homepage (top-right corner, subtle but accessible)
- [ ] Create /dashboard route with authenticated layout
- [ ] Add conversation persistence schema to database (conversations table with userId, messages, timestamps)
- [ ] Create Dashboard page with three sections:
  * Left sidebar: Conversation history list
  * Center: Active voice chat interface with Mira
  * Right sidebar: Daily goals widget
- [ ] Implement conversation CRUD operations (create, read, update, delete)
- [ ] Add "New Conversation" button to start fresh chat
- [ ] Integrate daily goals from /goals page into dashboard sidebar
- [ ] Add profile settings (update quiz answers, preferences)
- [ ] Protect /dashboard route (redirect to login if not authenticated)
- [ ] Add logout button in dashboard
- [ ] Test complete flow: login → dashboard → voice chat → conversation saves → logout → login → resume conversation
- [ ] Ensure public site (TRY DEMO, PERSONALIZE) still works without login

## Phase 40: Authentication & Dashboard (CRITICAL FOR USER TESTING)
- [x] Add conversations table to database schema
- [x] Add messages table to database schema
- [x] Create backend procedures for saving conversations
- [x] Create backend procedures for retrieving conversation history
- [x] Build /dashboard page with authenticated voice chat
- [x] Add conversation history sidebar to dashboard
- [x] Add daily goals widget to dashboard
- [x] Add login button to homepage (non-intrusive)
- [x] Update voiceChat to save messages to database when authenticated
- [x] Test complete OAuth login flow
- [x] Write comprehensive tests for conversation management (8 tests passing)
- [x] All 17 backend tests passing
- [ ] User must test: Login with Google, voice chat on dashboard, conversation persistence
- [ ] Save checkpoint for user testing
