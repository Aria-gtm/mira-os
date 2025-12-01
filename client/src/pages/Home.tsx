import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, LogIn } from "lucide-react";
import { Waveform } from "@/components/Waveform";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mode, setMode] = useState<"demo" | "quiz">("demo");
  const [demoState, setDemoState] = useState<"dormant" | "landing" | "speaking" | "listening" | "active">("dormant");
  const [quizStep, setQuizStep] = useState(0);
  const [activeResponse, setActiveResponse] = useState<{
    title: string;
    text: string;
    icon: string;
    color: string;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingState, setLoadingState] = useState<'transcribing' | 'thinking' | 'speaking' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [quizName, setQuizName] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [quizData, setQuizData] = useState({
    whatsWorking: "",
    currentSelf: "",
    futureSelf: "",
    supportNeeds: [] as string[],
    tonePreference: "",
    shutdownPreference: "",
    pattern: null as string | null,
  });

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

  const voiceChatMutation = trpc.mira.voiceChat.useMutation({
    onSuccess: (data) => {
      // Add messages to conversation history
      setMessages(prev => [
        ...prev,
        { role: 'user', content: data.transcript },
        { role: 'assistant', content: data.message }
      ]);
      
      // Update loading state to speaking
      setLoadingState('speaking');
      
      // Play audio response
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
          // Don't block the UI if audio fails - user can still read the text
          setError('Audio playback failed. You can still read the response above.');
        });
      }
      
      // Move to active state
      setDemoState('active');
      setIsProcessing(false);
      setLoadingState(null);
      setError(null);
    },
    onError: (err) => {
      console.error('Voice chat error:', err);
      setError('Failed to process your message. Please try again.');
      setIsProcessing(false);
    },
  });

  const saveOnboardingMutation = trpc.mira.saveOnboarding.useMutation({
    onSuccess: () => {
      // Quiz saved successfully, continue to demo
      setDemoState("landing");
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const wakeUp = () => {
    setDemoState("speaking");
  };

  const advanceToListening = () => {
    setDemoState("listening");
  };

  const choose = (type: "morning" | "reset" | "wind") => {
    if (type === "morning") {
      setActiveResponse({
        title: "Morning Flow",
        text: "Let's start. I've queued a gentle wake-up sequence and your daily intentions.",
        icon: "🌅",
        color: "text-violet-600",
      });
    } else if (type === "reset") {
      setActiveResponse({
        title: "Focus Reset",
        text: "Pausing notifications. Let's do a 2-minute box breathing session to clear the noise.",
        icon: "🌿",
        color: "text-blue-500",
      });
    } else {
      setActiveResponse({
        title: "Wind Down",
        text: "Shifting to evening mode. Preparing your reflection prompts and sleep audio.",
        icon: "🌙",
        color: "text-pink-600",
      });
    }
    setDemoState("active");
  };

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
        await processAudio(audioBlob);
        
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

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        // Update loading state to transcribing
        setLoadingState('transcribing');
        
        // After a moment, update to thinking (simulating transcription time)
        setTimeout(() => setLoadingState('thinking'), 800);
        
        // Send to server
        voiceChatMutation.mutate({ 
          audio: base64Audio 
        });
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing audio. Please try recording again.');
      setIsProcessing(false);
    }
  };

  const retryLastRecording = () => {
    setError(null);
    setDemoState('listening');
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

      {/* NAV */}
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
              onClick={() => window.location.href = getLoginUrl()}
              className="text-[10px] font-bold font-sans uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 text-purple-700 transition-all shadow-sm backdrop-blur-sm"
            >
              Login
            </button>
            <button
              onClick={() => setShowWaitlist(true)}
              className="text-[10px] font-bold font-sans uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-gray-200 bg-white/40 hover:bg-white text-mira-text transition-all shadow-sm backdrop-blur-sm"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto pt-32 pb-24 px-6 relative z-10">
        {/* HERO TEXT */}
        <section className="mb-14 md:mb-16 lg:mb-20 text-center space-y-6 animate-fade-in-up">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-[4.2rem] leading-[0.9] text-mira-text tracking-tight">
            Mira: Your self,
            <br />
            <span className="italic text-aurora font-medium">expanded.</span>
          </h1>
          <p className="font-sans text-sm md:text-base lg:text-lg font-medium text-mira-subtext leading-relaxed max-w-xs mx-auto opacity-90">
            Mira brings intelligent support to your today and your tomorrow —
            easing what feels heavy, keeping you aligned and centered as you
            grow toward your best future self.
          </p>
        </section>

        {/* CONTROLS */}
        <div
          className="flex justify-center gap-4 mb-10 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <button
            onClick={() => {
              setMode("demo");
              setDemoState("landing");
            }}
            className="px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg text-white"
            style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)' }}
          >
            <span>Try Demo</span>
            <span className="opacity-90">▶</span>
          </button>
          <button
            onClick={() => {
              setMode("quiz");
              setQuizStep(0);
            }}
            className="px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg text-white"
            style={{ background: 'linear-gradient(135deg, #F472B6 0%, #FCA5A5 100%)' }}
          >
            <span>Personalize</span>
            <span className="opacity-90">⚙</span>
          </button>
        </div>

        {/* Login/Dashboard Button */}
        <div className="flex justify-center mb-6">
          {user ? (
            <a
              href="/dashboard"
              className="px-6 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full hover:border-purple-400 transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <span className="opacity-70">→</span>
            </a>
          ) : (
            <a
              href={getLoginUrl()}
              className="px-6 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full hover:border-purple-400 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </a>
          )}
        </div>

        {/* THE LIVING OBJECT */}
        <div
          className={`relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[5/6] mira-crystal animate-float ${
            demoState === "speaking" ? "animate-bloom" : ""
          }`}
        >
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
                demoState === "dormant" ? "opacity-0" : "opacity-40"
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest">
                Mon 7:00 AM
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {mode === "quiz" ? "Calibration" : "Online"}
              </span>
            </div>

            {/* DEMO FLOW */}
            {mode === "demo" && (
              <div className="flex-1 flex flex-col justify-center items-center text-center w-full">
                {/* DORMANT STATE */}
                {demoState === "dormant" && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-6 transition-all duration-1000">
                    <div className="relative w-64 h-64 flex justify-center items-center">
                      {/* Vivid Soul */}
                      <div className="absolute inset-0 vivid-soul rounded-full animate-rotate-slow"></div>

                      {/* Geometric Rings */}
                      <div className="absolute inset-4 border border-white/40 rounded-full animate-pulse-ring"></div>
                      <div
                        className="absolute inset-12 border border-white/20 rounded-full animate-rotate-slow"
                        style={{ animationDirection: "reverse" }}
                      ></div>

                      {/* The Infinity Path M */}
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
                    
                    {/* Text below the circle */}
                    <p className="font-serif text-base text-mira-text text-center mt-8">
                      Present. Listening. Ready.
                    </p>
                  </div>
                )}

                {/* LANDING STATE */}
                {demoState === "landing" && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-6 animate-fade-in-up">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-100/80 to-pink-100/80 flex items-center justify-center mb-8 backdrop-blur-md border border-white/40 shadow-lg">
                      <div className="text-3xl font-serif text-purple-600 animate-pulse">
                        M.
                      </div>
                    </div>

                             <h2 className="font-serif text-3xl text-mira-text mb-4">
                      Hello there.
                    </h2>
                    <p className="font-sans text-sm md:text-base font-light text-mira-subtext mb-3 max-w-xs">
                      Take a moment. Let's see what working with Mira feels like.
                    </p>
                    <p className="font-sans text-xs md:text-sm font-light text-mira-subtext/70 mb-6 max-w-xs">
                      Experience how Mira helps you stay centered, aligned, and moving toward your best self.
                    </p>

                    <button
                      onClick={() => setDemoState("speaking")}
                      className="btn-connect px-10 py-4 rounded-full text-xs font-bold uppercase tracking-[0.25em] shadow-xl pointer-events-auto"
                    >
                      Connect with Mira
                    </button>
                  </div>
                )}

                {/* SPEAKING STATE */}
                {demoState === "speaking" && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-6 animate-fade-in-up">
                    {/* Speaking Visualizer */}
                    <div className="mb-10 w-24 h-24 rounded-full bg-gradient-to-tr from-violet-100 to-pink-100 flex items-center justify-center animate-pulse">
                      <div className="flex items-center gap-1.5 h-8">
                        <div className="w-1.5 aurora-gradient rounded-full animate-wave-bar"></div>
                        <div
                          className="w-1.5 aurora-gradient rounded-full animate-wave-bar"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1.5 aurora-gradient rounded-full animate-wave-bar"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-1.5 aurora-gradient rounded-full animate-wave-bar"
                          style={{ animationDelay: "0.3s" }}
                        ></div>
                      </div>
                    </div>

                    <p className="font-serif text-2xl leading-relaxed text-mira-text mb-6 text-center max-w-md">
                      "Hi... Whenever you're ready, I can help you get centered
                      for your day, or help with anything on your mind."
                    </p>
                    
                    <p className="font-sans text-sm text-mira-subtext mb-10 text-center max-w-sm">
                      Click below when you're ready to choose how Mira can help you today.
                    </p>

                    <button
                      onClick={advanceToListening}
                      className="mira-button px-8 py-3 font-sans text-xs font-bold uppercase tracking-widest"
                    >
                      I'm Ready
                    </button>
                  </div>
                )}

                {/* LISTENING STATE */}
                {demoState === "listening" && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-4 animate-fade-in-up">
                    <p className="font-sans text-xs font-bold text-purple-400 mb-2 uppercase tracking-widest animate-pulse">
                      Listening...
                    </p>
                    
                    <p className="font-sans text-sm text-mira-subtext mb-6 text-center max-w-xs">
                      Choose an option below, or tap the microphone to speak freely.
                    </p>

                    <div className="flex flex-col gap-3 w-full px-1">
                      <button
                        onClick={() => choose("morning")}
                        className="btn-glass group"
                      >
                        "Walk me through my morning."
                      </button>
                      <button
                        onClick={() => choose("reset")}
                        className="btn-glass group"
                      >
                        "Help me reset my focus."
                      </button>
                      <button
                        onClick={() => choose("wind")}
                        className="btn-glass group"
                      >
                        "I need to wind down."
                      </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-sans text-red-800">{error}</p>
                          <button
                            onClick={retryLastRecording}
                            className="mt-2 text-xs font-sans font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex items-center gap-3 text-gray-400">
                      <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing || !!error}
                        className={`p-4 rounded-full transition-all ${
                          isRecording 
                            ? "text-white" 
                            : isProcessing
                            ? "bg-purple-500 text-white"
                            : "bg-white/40 hover:bg-white"
                        }`}
                        style={isRecording ? { background: 'linear-gradient(135deg, #FCA5A5 0%, #F472B6 100%)' } : {}}
                      >
                        {isRecording ? (
                          <Waveform />
                        ) : isProcessing ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0v-4.5a3 3 0 00-3-3z"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-sans uppercase tracking-widest font-bold">
                          {isRecording ? "Recording..." : isProcessing ? (loadingState === 'transcribing' ? "Transcribing..." : loadingState === 'thinking' ? "Thinking..." : loadingState === 'speaking' ? "Speaking..." : "Processing...") : "Tap to speak"}
                        </span>
                        {isRecording && (
                          <span className="text-[10px] font-sans text-mira-subtext/60 mt-0.5">
                            Tap again to stop recording
                          </span>
                        )}
                        {!isRecording && !isProcessing && (
                          <span className="text-[10px] font-sans text-mira-subtext/60 mt-0.5">
                            Speak when ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIVE STATE - Conversation History */}
                {demoState === "active" && (
                  <div className="absolute inset-0 flex flex-col px-4 py-6 animate-fade-in-up">
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif text-3xl text-mira-text">Conversation</h3>
                        <button
                          onClick={() => {
                            setDemoState("listening");
                            setActiveResponse(null);
                          }}
                          className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-widest text-mira-subtext hover:text-mira-text transition-colors border border-mira-subtext/30 rounded-lg hover:border-mira-text flex-shrink-0"
                        >
                          Continue
                        </button>
                      </div>
                    </div>

                    {/* Conversation History */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[60vh] pr-2">
                      {messages.map((msg: {role: string, content: string}, idx: number) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            msg.role === "user" ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-purple-100 text-mira-text"
                                : "bg-white/50 border border-purple-200 text-mira-text"
                            }`}
                          >
                            <p className="font-sans text-sm leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                          <span className="text-[10px] font-sans text-mira-subtext/60 mt-1 px-2">
                            {msg.role === "user" ? "You" : "Mira"}
                          </span>
                        </div>
                      ))}
                      
                      {/* Loading Skeleton */}
                      {isProcessing && (
                        <div className="flex flex-col items-start">
                          <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/50 border border-purple-200">
                            <div className="space-y-2">
                              <div className="h-3 bg-purple-200/50 rounded animate-pulse w-3/4"></div>
                              <div className="h-3 bg-purple-200/50 rounded animate-pulse w-full"></div>
                              <div className="h-3 bg-purple-200/50 rounded animate-pulse w-2/3"></div>
                            </div>
                          </div>
                          <span className="text-[10px] font-sans text-mira-subtext/60 mt-1 px-2">
                            {loadingState === 'transcribing' ? 'Transcribing your message...' : loadingState === 'thinking' ? 'Mira is thinking...' : loadingState === 'speaking' ? 'Preparing voice response...' : 'Processing...'}
                          </span>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Error Message in Conversation View */}
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-sans text-red-800">{error}</p>
                          <button
                            onClick={() => setError(null)}
                            className="mt-2 text-xs font-sans font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 items-center">
                      {/* Mic button to continue conversation */}
                      <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing || !!error}
                        className={`p-4 rounded-full transition-all flex-shrink-0 ${
                          isRecording 
                            ? "text-white" 
                            : isProcessing
                            ? "bg-purple-500 text-white"
                            : "bg-purple-100 hover:bg-purple-200 text-purple-600"
                        }`}
                        style={isRecording ? { background: 'linear-gradient(135deg, #FCA5A5 0%, #F472B6 100%)' } : {}}
                      >
                        {isRecording ? (
                          <Waveform />
                        ) : isProcessing ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0v-4.5a3 3 0 00-3-3z"
                            />
                          </svg>
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <p className="text-xs font-sans font-bold text-mira-text uppercase tracking-widest">
                          {isRecording ? "Recording..." : isProcessing ? (loadingState === 'transcribing' ? "Transcribing..." : loadingState === 'thinking' ? "Thinking..." : loadingState === 'speaking' ? "Speaking..." : "Processing...") : "Tap mic to continue"}
                        </p>
                        {isRecording && (
                          <p className="text-[10px] font-sans text-mira-subtext/60 mt-0.5">
                            Tap again to stop
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setDemoState("dormant");
                          setActiveResponse(null);
                          setMessages([]);
                        }}
                        className="px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:border-red-400 transition-colors flex-shrink-0"
                      >
                        End
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUIZ FLOW */}
            {mode === "quiz" && (
              <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="overflow-y-auto max-h-[400px] w-full px-1 py-2 no-scrollbar mt-4">
                  {/* Intro */}
                  {quizStep === 0 && (
                    <div className="flex flex-col justify-center h-full text-center px-4 animate-fade-in-up">
                      <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-3xl font-serif italic text-purple-600">
                        M.
                      </div>
                      <h3 className="font-serif text-3xl mb-4 leading-tight text-gray-900">
                        Let's get you started.
                      </h3>
                      <p className="font-sans text-sm text-gray-500 mb-10 leading-relaxed">
                        I'm here to support your days in a way that feels
                        natural and light for you.
                      </p>
                      <button
                        onClick={startQuiz}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                      >
                        Begin
                      </button>
                    </div>
                  )}

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
                          className="w-full p-4 pr-12 rounded-xl bg-white/60 border border-gray-200 text-lg font-serif text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
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
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest"
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
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "Give me simple, clear steps."
                        </button>
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "Offer a few options and let me choose."
                        </button>
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "Handle what you can for me and show me the result."
                        </button>
                        <button onClick={nextQuiz} className="w-full btn-glass">
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
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "Only speak when I ask."
                        </button>
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "Light check-ins here and there."
                        </button>
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "More regular support to keep me moving."
                        </button>
                        <button onClick={nextQuiz} className="w-full btn-glass">
                          "Stay close and help me stay aligned."
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DONE */}
                  {quizStep === 6 && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center px-6 bg-[#FFFCF9]/95 backdrop-blur-xl z-50 text-center">
                      <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl mb-6 shadow-xl animate-bounce">
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
                            futureSelf: quizName, // Use the name from quiz step 1
                            supportNeeds: quizData.supportNeeds,
                            tonePreference: quizData.tonePreference,
                            shutdownPreference: quizData.shutdownPreference,
                            pattern: quizData.pattern,
                          });
                          setMode("demo");
                          setDemoState("dormant");
                          setQuizStep(0);
                        }}
                        className="btn-connect w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                        disabled={saveOnboardingMutation.isPending}
                      >
                        {saveOnboardingMutation.isPending ? "Saving..." : "Start with Mira"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER CTA */}
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
      
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
