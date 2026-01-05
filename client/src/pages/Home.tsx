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
  const [quizData, setQuizData] = useState({
    whatsWorking: "",
    currentSelf: "",
    futureSelf: "",
    supportNeeds: [] as string[],
    tonePreference: "",
    shutdownPreference: "",
    pattern: null as string | null,
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

      {/* NAV - Hidden on onboarding gate */}
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

        {/* SINGLE CTA - Let's Begin */}
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

        {/* THE LIVING OBJECT - QUIZ FLOW */}
        {quizStep > 0 && (
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
              <div className="flex justify-between items-start pt-2 opacity-40">
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  Calibration
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  Step {quizStep}/7
                </span>
              </div>

              {/* QUIZ FLOW */}
              <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="overflow-y-auto max-h-[400px] w-full px-1 py-2 no-scrollbar mt-4">
                  {/* Step 1: Name */}
                  {quizStep === 1 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-3xl font-serif italic text-purple-600">
                        M.
                      </div>
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        What should I call you?
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        Just your first name is fine.
                      </p>
                      <input
                        type="text"
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        placeholder="Your name"
                        className="w-full p-4 mb-6 rounded-xl bg-white/60 border border-gray-200 text-base font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                      />
                      <button
                        onClick={nextQuiz}
                        disabled={!quizName.trim()}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 2: What's working */}
                  {quizStep === 2 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        What's working right now?
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        What parts of your life feel aligned, even if small?
                      </p>
                      <textarea
                        value={quizData.whatsWorking}
                        onChange={(e) =>
                          setQuizData({ ...quizData, whatsWorking: e.target.value })
                        }
                        placeholder="I've been consistent with morning walks..."
                        rows={4}
                        className="w-full p-4 mb-6 rounded-xl bg-white/60 border border-gray-200 text-base font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                      />
                      <button
                        onClick={nextQuiz}
                        disabled={!quizData.whatsWorking.trim()}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 3: Current self */}
                  {quizStep === 3 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        How would you describe yourself right now?
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        Your current state, mood, or phase of life.
                      </p>
                      <textarea
                        value={quizData.currentSelf}
                        onChange={(e) =>
                          setQuizData({ ...quizData, currentSelf: e.target.value })
                        }
                        placeholder="I'm in transition, feeling a bit scattered..."
                        rows={4}
                        className="w-full p-4 mb-6 rounded-xl bg-white/60 border border-gray-200 text-base font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                      />
                      <button
                        onClick={nextQuiz}
                        disabled={!quizData.currentSelf.trim()}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 4: Future self */}
                  {quizStep === 4 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        Who are you becoming?
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        The version of you that feels most aligned.
                      </p>
                      <textarea
                        value={quizData.futureSelf}
                        onChange={(e) =>
                          setQuizData({ ...quizData, futureSelf: e.target.value })
                        }
                        placeholder="Someone more grounded, creative, present..."
                        rows={4}
                        className="w-full p-4 mb-6 rounded-xl bg-white/60 border border-gray-200 text-base font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                      />
                      <button
                        onClick={nextQuiz}
                        disabled={!quizData.futureSelf.trim()}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 5: Support needs */}
                  {quizStep === 5 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        What kind of support helps you most?
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        Select all that resonate.
                      </p>
                      <div className="space-y-3 mb-6">
                        {[
                          "Gentle reminders",
                          "Reflective questions",
                          "Encouragement",
                          "Accountability",
                          "Space to think",
                        ].map((need) => (
                          <button
                            key={need}
                            onClick={() => {
                              const current = quizData.supportNeeds;
                              if (current.includes(need)) {
                                setQuizData({
                                  ...quizData,
                                  supportNeeds: current.filter((n) => n !== need),
                                });
                              } else {
                                setQuizData({
                                  ...quizData,
                                  supportNeeds: [...current, need],
                                });
                              }
                            }}
                            className={`w-full p-4 rounded-xl text-left font-sans text-sm transition-all ${
                              quizData.supportNeeds.includes(need)
                                ? "bg-purple-100 border-2 border-purple-400 text-purple-900"
                                : "bg-white/60 border border-gray-200 text-gray-700 hover:border-purple-300"
                            }`}
                          >
                            {need}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={nextQuiz}
                        disabled={quizData.supportNeeds.length === 0}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 6: Tone preference */}
                  {quizStep === 6 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        How should I sound?
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        Choose the tone that feels right.
                      </p>
                      <div className="space-y-3 mb-6">
                        {[
                          { value: "warm", label: "Warm & nurturing" },
                          { value: "direct", label: "Direct & clear" },
                          { value: "poetic", label: "Poetic & reflective" },
                          { value: "balanced", label: "Balanced & adaptive" },
                        ].map((tone) => (
                          <button
                            key={tone.value}
                            onClick={() =>
                              setQuizData({ ...quizData, tonePreference: tone.value })
                            }
                            className={`w-full p-4 rounded-xl text-left font-sans text-sm transition-all ${
                              quizData.tonePreference === tone.value
                                ? "bg-purple-100 border-2 border-purple-400 text-purple-900"
                                : "bg-white/60 border border-gray-200 text-gray-700 hover:border-purple-300"
                            }`}
                          >
                            {tone.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={nextQuiz}
                        disabled={!quizData.tonePreference}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 7: Shutdown preference */}
                  {quizStep === 7 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        When you need to disconnect, should I...
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-8 leading-relaxed">
                        How Mira responds when you step away.
                      </p>
                      <div className="space-y-3 mb-6">
                        {[
                          { value: "silent", label: "Go silent until you return" },
                          { value: "gentle", label: "Send a gentle check-in" },
                          { value: "respect", label: "Respect your space completely" },
                        ].map((pref) => (
                          <button
                            key={pref.value}
                            onClick={() =>
                              setQuizData({ ...quizData, shutdownPreference: pref.value })
                            }
                            className={`w-full p-4 rounded-xl text-left font-sans text-sm transition-all ${
                              quizData.shutdownPreference === pref.value
                                ? "bg-purple-100 border-2 border-purple-400 text-purple-900"
                                : "bg-white/60 border border-gray-200 text-gray-700 hover:border-purple-300"
                            }`}
                          >
                            {pref.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setQuizStep(8)}
                        disabled={!quizData.shutdownPreference}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 8: Completion */}
                  {quizStep === 8 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-3xl text-purple-600">
                        ✓
                      </div>
                      <h3 className="font-serif text-3xl mb-4 text-gray-900">
                        That's all I need.
                      </h3>
                      <p className="font-sans text-sm font-medium text-gray-500 mb-8 max-w-[80%] mx-auto">
                        I'll start from this and keep adjusting as I learn you.
                        Whenever you're ready, I'm here.
                      </p>
                      <button
                        onClick={() => {
                          // Save quiz to database
                          saveOnboardingMutation.mutate({
                            whatsWorking: quizData.whatsWorking,
                            currentSelf: quizData.currentSelf,
                            futureSelf: quizName,
                            supportNeeds: quizData.supportNeeds,
                            tonePreference: quizData.tonePreference,
                            shutdownPreference: quizData.shutdownPreference,
                            pattern: quizData.pattern,
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
            </div>
          </div>
        )}

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
