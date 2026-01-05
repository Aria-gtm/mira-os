import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, LogIn } from "lucide-react";
import { Waveform } from "@/components/Waveform";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [quizName, setQuizName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [quizData, setQuizData] = useState({
    tonePreference: "",
    shutdownPreference: "",
    guidanceStyle: "",
    presenceLevel: "",
  });

  // Check if user has completed onboarding
  const { data: onboardingStatus, isLoading: checkingOnboarding } = trpc.mira.checkOnboarding.useQuery(
    undefined,
    { enabled: !!user }
  );

  const waitlistMutation = trpc.waitlist.join.useMutation({
    onSuccess: () => {
      alert("You're on the list! We'll be in touch soon.");
      setShowWaitlist(false);
      setEmail("");
      setName("");
    },
    onError: (err) => {
      alert(err.message || "Failed to join waitlist. Please try again.");
    },
  });

  const saveOnboardingMutation = trpc.mira.saveOnboarding.useMutation({
    onSuccess: () => {
      // Redirect to dashboard after successful onboarding
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      console.error("Failed to save quiz:", err);
      alert("Failed to save your responses. Please try again.");
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Redirect to dashboard if user has completed onboarding
  useEffect(() => {
    if (user && onboardingStatus?.hasCompletedOnboarding) {
      window.location.href = "/dashboard";
    }
  }, [user, onboardingStatus]);

  const startQuiz = () => {
    setQuizStep(1);
  };

  const nextQuiz = () => {
    setQuizStep(quizStep + 1);
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // For now, just log - voice transcription can be added later
        console.log('Audio recorded:', audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please allow microphone permissions in your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    waitlistMutation.mutate({
      email,
      name: name || undefined,
    });
  };

  // Show loading state while checking onboarding status
  if (user && checkingOnboarding) {
    return (
      <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-[#FFFCF9] text-mira-text overflow-x-hidden min-h-screen selection:bg-purple-100 selection:text-purple-900">
      <div className="noise-overlay"></div>

      {/* LIVING BACKGROUND */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#FFFCF9]">
        <div className="absolute top-[-20%] left-[-10%] w-[900px] h-[900px] bg-[#E9D5FF] rounded-full aurora-blob animate-blob opacity-60"></div>
        <div
          className="absolute top-[30%] right-[-20%] w-[800px] h-[800px] bg-[#FBCFE8] rounded-full aurora-blob animate-blob opacity-60"
          style={{ animationDelay: "-5s", animationDirection: "reverse" }}
        ></div>
        <div
          className="absolute bottom-[-10%] left-[20%] w-[900px] h-[900px] bg-[#BAE6FD] rounded-full aurora-blob animate-blob opacity-60"
          style={{ animationDelay: "-10s" }}
        ></div>
      </div>

      {/* NAV - Hidden when user is logged in (on onboarding gate) */}
      {!user && (
        <nav
          className={`fixed top-0 w-full z-50 transition-all duration-700 ${
            scrolled
              ? "py-4 bg-white/70 border-b border-white/40 backdrop-blur-xl"
              : "py-6 bg-transparent"
          }`}
        >
          <div className="max-w-md mx-auto px-6 flex justify-between items-center">
            <span className="font-serif text-2xl font-bold tracking-tight text-mira-text">
              Mira.
            </span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowWaitlist(true)}
                className="text-[10px] font-bold font-sans uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-gray-200 bg-white/40 hover:bg-white text-mira-text transition-all shadow-sm backdrop-blur-sm"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* MAIN */}
      <main className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto pt-32 pb-24 px-6 relative z-10">
        {/* HERO TEXT - New Copy */}
        <section className="mb-14 md:mb-16 lg:mb-20 text-center space-y-6 animate-fade-in-up">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-[4.2rem] leading-[0.9] text-mira-text tracking-tight">
            Meet Mira —<br />
            <span className="italic text-aurora font-medium">your intelligent companion.</span>
          </h1>
          <p className="font-sans text-sm md:text-base lg:text-lg font-medium text-mira-subtext leading-relaxed max-w-md mx-auto opacity-90">
            Mira gets to know your direction — where you are now, who you're becoming, and what feels aligned. She adapts to you, not the other way around.
          </p>
        </section>

        {/* SINGLE CTA - Let's Begin (only show when quiz hasn't started) */}
        {quizStep === 0 && (
          <div
            className="flex flex-col items-center gap-4 mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {!user ? (
              <>
                <a
                  href={getLoginUrl()}
                  className="px-12 py-5 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)' }}
                >
                  <span>Let's Begin</span>
                  <span className="opacity-90">→</span>
                </a>
                <p className="font-sans text-xs text-mira-subtext/70 max-w-xs text-center">
                  Quick, one-time setup. You won't need to do this again.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={startQuiz}
                  className="px-12 py-5 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)' }}
                >
                  <span>Let's Begin</span>
                  <span className="opacity-90">→</span>
                </button>
                <p className="font-sans text-xs text-mira-subtext/70 max-w-xs text-center">
                  Quick, one-time setup. You won't need to do this again.
                </p>
              </>
            )}
          </div>
        )}

        {/* THE LIVING OBJECT - Enhanced with dormant state and quiz */}
        <div className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[5/6] mira-crystal animate-float">
          {/* Reflection Shine */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/80 via-white/10 to-transparent pointer-events-none"></div>

          {/* Hardware Status Light */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/5 rounded-full overflow-hidden z-20">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 w-full animate-pulse opacity-80"></div>
          </div>

          {/* CONTENT LAYER */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 text-mira-text pointer-events-auto">
            {/* Minimal Header */}
            <div
              className={`flex justify-between items-start pt-2 transition-opacity duration-700 ${
                quizStep === 0 ? "opacity-0" : "opacity-40"
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {quizStep === 0 ? "" : "Calibration"}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {quizStep > 0 && quizStep < 6 ? `Step ${quizStep}/5` : ""}
              </span>
            </div>

            {/* DORMANT STATE - Beautiful animation when quiz hasn't started */}
            {quizStep === 0 && (
              <div className="flex-1 flex flex-col justify-center items-center text-center w-full">
                <div className="absolute inset-0 flex flex-col justify-center items-center px-6 transition-all duration-1000">
                  <div className="relative w-64 h-64 flex justify-center items-center">
                    {/* Vivid Soul - Enhanced gradient animation */}
                    <div className="absolute inset-0 vivid-soul rounded-full animate-rotate-slow"></div>

                    {/* Geometric Rings - Multiple layers */}
                    <div className="absolute inset-4 border border-white/40 rounded-full animate-pulse-ring"></div>
                    <div
                      className="absolute inset-12 border border-white/20 rounded-full animate-rotate-slow"
                      style={{ animationDirection: "reverse" }}
                    ></div>
                    <div
                      className="absolute inset-8 border border-white/10 rounded-full animate-pulse-ring"
                      style={{ animationDelay: "1s" }}
                    ></div>

                    {/* The Infinity Path M - Enhanced */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32">
                      <svg
                        width="120"
                        height="120"
                        viewBox="0 0 100 100"
                        fill="none"
                      >
                        <defs>
                          <linearGradient
                            id="whiteGrad"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                            <stop offset="100%" stopColor="white" />
                          </linearGradient>
                        </defs>

                        <path
                          d="M 25 80 L 25 20 L 50 50 L 75 20 L 75 80"
                          stroke="url(#whiteGrad)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                          className="path-draw"
                        />

                        <circle
                          r="3.5"
                          fill="white"
                          filter="drop-shadow(0 0 4px white)"
                          className="path-particle"
                        ></circle>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Text below the circle - Enhanced */}
                  <p className="font-serif text-lg text-mira-text text-center mt-8 animate-pulse">
                    Present. Listening. Ready.
                  </p>
                </div>
              </div>
            )}

            {/* QUIZ FLOW - ORIGINAL APPROVED QUESTIONS */}
            {quizStep > 0 && (
              <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="overflow-y-auto max-h-[400px] w-full px-1 py-2 no-scrollbar mt-4">
                  
                  {/* Q1: Name */}
                  {quizStep === 1 && (
                    <div className="animate-fade-in-up">
                      <h3 className="font-serif text-2xl mb-6 leading-tight text-gray-900">
                        First — what should I call you?
                      </h3>

                      <div className="relative w-full mb-6">
                        <input
                          type="text"
                          placeholder="Your name..."
                          value={quizName}
                          onChange={(e) => setQuizName(e.target.value)}
                          className="w-full p-4 pr-12 rounded-xl bg-white/60 border border-gray-200 text-lg font-serif text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors shadow-sm"
                        />
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isRecording
                              ? "text-pink-500 animate-pulse bg-pink-50"
                              : "text-gray-400 hover:text-purple-500"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0v-4.5a3 3 0 00-3-3z"
                            />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={nextQuiz}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                      >
                        Next
                      </button>
                    </div>
                  )}

                  {/* Q2: Tone */}
                  {quizStep === 2 && (
                    <div className="animate-fade-in-up">
                      <h3 className="font-serif text-2xl mb-6 leading-tight text-gray-900">
                        When we talk, which of these sounds most like what you
                        want?
                      </h3>
                      <div className="space-y-3">
                        <button onClick={() => { setQuizData(prev => ({ ...prev, tonePreference: "Speak to me like a steady, calm presence." })); nextQuiz(); }} className="w-full btn-glass">
                          "Speak to me like a steady, calm presence."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, tonePreference: "Speak to me in a warm, friendly way." })); nextQuiz(); }} className="w-full btn-glass">
                          "Speak to me in a warm, friendly way."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, tonePreference: "Speak to me simply and directly. No fluff." })); nextQuiz(); }} className="w-full btn-glass">
                          "Speak to me simply and directly. No fluff."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, tonePreference: "Start neutral and adjust based on how I'm doing." })); nextQuiz(); }} className="w-full btn-glass">
                          "Start neutral and adjust based on how I'm doing."
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Q3: Shutdown */}
                  {quizStep === 3 && (
                    <div className="animate-fade-in-up">
                      <h3 className="font-serif text-2xl mb-6 leading-tight text-gray-900">
                        When you've checked out or shut down, what's actually
                        most helpful?
                      </h3>
                      <div className="space-y-3">
                        <button onClick={() => { setQuizData(prev => ({ ...prev, shutdownPreference: "Give me space — I'll come back when I'm ready." })); nextQuiz(); }} className="w-full btn-glass">
                          "Give me space — I'll come back when I'm ready."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, shutdownPreference: "Check in softly, nothing heavy." })); nextQuiz(); }} className="w-full btn-glass">
                          "Check in softly, nothing heavy."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, shutdownPreference: "Nudge me gently back on track." })); nextQuiz(); }} className="w-full btn-glass">
                          "Nudge me gently back on track."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, shutdownPreference: "Call me out kindly — I respond to honesty." })); nextQuiz(); }} className="w-full btn-glass">
                          "Call me out kindly — I respond to honesty."
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Q4: Guidance */}
                  {quizStep === 4 && (
                    <div className="animate-fade-in-up">
                      <h3 className="font-serif text-2xl mb-6 leading-tight text-gray-900">
                        When you need help, what style of guidance works best?
                      </h3>
                      <div className="space-y-3">
                        <button onClick={() => { setQuizData(prev => ({ ...prev, guidanceStyle: "Give me simple, clear steps." })); nextQuiz(); }} className="w-full btn-glass">
                          "Give me simple, clear steps."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, guidanceStyle: "Offer a few options and let me choose." })); nextQuiz(); }} className="w-full btn-glass">
                          "Offer a few options and let me choose."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, guidanceStyle: "Handle what you can for me and show me the result." })); nextQuiz(); }} className="w-full btn-glass">
                          "Handle what you can for me and show me the result."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, guidanceStyle: "Keep it flexible and adjust in the moment." })); nextQuiz(); }} className="w-full btn-glass">
                          "Keep it flexible and adjust in the moment."
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Q5: Presence */}
                  {quizStep === 5 && (
                    <div className="animate-fade-in-up">
                      <h3 className="font-serif text-2xl mb-6 leading-tight text-gray-900">
                        Day to day, how present do you want Mira to be?
                      </h3>
                      <div className="space-y-3">
                        <button onClick={() => { setQuizData(prev => ({ ...prev, presenceLevel: "Only speak when I ask." })); nextQuiz(); }} className="w-full btn-glass">
                          "Only speak when I ask."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, presenceLevel: "Light check-ins here and there." })); nextQuiz(); }} className="w-full btn-glass">
                          "Light check-ins here and there."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, presenceLevel: "More regular support to keep me moving." })); nextQuiz(); }} className="w-full btn-glass">
                          "More regular support to keep me moving."
                        </button>
                        <button onClick={() => { setQuizData(prev => ({ ...prev, presenceLevel: "Stay close and help me stay aligned." })); nextQuiz(); }} className="w-full btn-glass">
                          "Stay close and help me stay aligned."
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DONE */}
                  {quizStep === 6 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <div className="mb-6 w-20 h-20 mx-auto rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl shadow-xl animate-bounce">
                        ✓
                      </div>
                      <h3 className="font-serif text-3xl mb-4 text-gray-900">
                        That's all I need.
                      </h3>
                      <p className="font-sans text-sm font-medium text-gray-500 mb-8 max-w-[80%] mx-auto leading-relaxed">
                        I'll start from this and keep adjusting as I learn you.
                        Whenever you're ready, I'm here.
                      </p>
                      <button
                        onClick={() => {
                          // Save quiz to database
                          saveOnboardingMutation.mutate({
                            whatsWorking: "",
                            currentSelf: "",
                            futureSelf: quizName,
                            supportNeeds: [quizData.guidanceStyle, quizData.presenceLevel],
                            tonePreference: quizData.tonePreference,
                            shutdownPreference: quizData.shutdownPreference,
                            pattern: null,
                          });
                        }}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                        disabled={saveOnboardingMutation.isPending}
                      >
                        {saveOnboardingMutation.isPending ? "Saving..." : "Enter Mira"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER CTA - Only show when not in quiz */}
        {quizStep === 0 && (
          <section className="pt-8 md:pt-12 lg:pt-16 pb-12 md:pb-16 lg:pb-20 text-center relative border-t border-gray-200/50 mt-12 md:mt-16 lg:mt-20">
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-none mb-6 md:mb-8 lg:mb-10 text-mira-text pb-2">
              Start your journey.
            </h2>
            <p className="font-sans text-gray-500 mb-8 md:mb-10 lg:mb-12 font-medium text-sm md:text-base lg:text-lg">
              Your future self is waiting.
            </p>
            <button
              onClick={() => setShowWaitlist(true)}
              className="w-full py-5 md:py-6 lg:py-7 btn-connect rounded-2xl font-sans text-xs md:text-sm lg:text-base uppercase tracking-[0.2em] font-bold shadow-xl hover:scale-[1.02] transition-transform"
            >
              Join Waitlist
            </button>
          </section>
        )}
      </main>

      {/* WAITLIST MODAL */}
      {showWaitlist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="mira-crystal max-w-md w-full p-8 animate-fade-in-up">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-serif text-3xl text-gray-900">
                Join the waitlist
              </h3>
              <button
                onClick={() => setShowWaitlist(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="font-sans text-sm text-gray-500 mb-6">
              Be among the first to experience Mira when we launch.
            </p>

            <form onSubmit={handleJoinWaitlist} className="space-y-4">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/60 border border-gray-200 text-base font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-4 rounded-xl bg-white/60 border border-gray-200 text-base font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-4 btn-connect rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Join Waitlist
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
