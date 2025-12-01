import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [shutdownPreference, setShutdownPreference] = useState("");
  const [guidanceStyle, setGuidanceStyle] = useState("");
  const [presence, setPresence] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  const saveOnboarding = trpc.mira.saveOnboarding.useMutation({
    onSuccess: () => {
      setStep(6);
      setTimeout(() => {
        setLocation("/prototype");
      }, 2000);
    },
  });

  const handleNext = () => {
    if (step === 5) {
      // Save onboarding data
      saveOnboarding.mutate({
        whatsWorking: "Getting started with Mira",
        currentSelf: name || "User",
        futureSelf: "A more aligned version of myself",
        supportNeeds: [guidanceStyle, presence].filter(Boolean),
        tonePreference: tonePreference || "adaptive",
        shutdownPreference: shutdownPreference || "soft_check",
        pattern: null,
      });
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return name.length > 0;
    if (step === 2) return tonePreference.length > 0;
    if (step === 3) return shutdownPreference.length > 0;
    if (step === 4) return guidanceStyle.length > 0;
    if (step === 5) return presence.length > 0;
    return false;
  };

  const handleVoiceRecord = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Voice recording is not supported in your browser");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          // Transcribe with backend
          try {
            const result = await fetch("/api/trpc/mira.transcribeAudio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64Audio }),
            });
            const data = await result.json();
            if (data.result?.data?.text) {
              setName(data.result.data.text);
            }
          } catch (error) {
            console.error("Transcription failed:", error);
          }
        };
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      }, 3000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Film Grain Overlay */}
      <div className="noise-overlay" />

      {/* Living Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#FFFCF9]">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[900px] h-[900px] bg-[#E9D5FF] rounded-full aurora-blob opacity-60"
          style={{ animation: "blob 20s infinite alternate" }}
        />
        <div 
          className="absolute top-[30%] right-[-20%] w-[800px] h-[800px] bg-[#FBCFE8] rounded-full aurora-blob opacity-60"
          style={{ animation: "blob 20s infinite alternate-reverse", animationDelay: "-5s" }}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-20 pb-24 px-6 relative z-10">
        <div className="mira-crystal p-8 min-h-[500px] flex flex-col">
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              {step === 6 ? "Complete" : `Step ${step + 1} of 6`}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              Calibration
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            {step === 0 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-3xl font-serif italic text-purple-600">
                  M.
                </div>
                <h3 className="font-serif text-3xl leading-tight">Let's get you started.</h3>
                <p className="text-sm text-secondary leading-relaxed">
                  I'm here to support your days in a way that feels natural and light for you.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-serif text-2xl leading-tight">First — what should I call you?</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name..."
                    className="w-full p-4 pr-12 rounded-xl bg-white/60 border border-gray-200 text-lg font-serif placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <button
                    onClick={handleVoiceRecord}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors ${
                      isRecording ? "text-red-500 animate-pulse bg-red-50" : "text-gray-400 hover:text-purple-500"
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-serif text-2xl leading-tight">
                  When we talk, which of these sounds most like what you want?
                </h3>
                <div className="space-y-3">
                  {[
                    "Speak to me like a steady, calm presence.",
                    "Speak to me in a warm, friendly way.",
                    "Speak to me simply and directly. No fluff.",
                    "Start neutral and adjust based on how I'm doing.",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setTonePreference(option)}
                      className={`w-full btn-glass text-left ${
                        tonePreference === option ? "bg-white border-purple-400" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-serif text-2xl leading-tight">
                  When you've checked out or shut down, what's actually most helpful?
                </h3>
                <div className="space-y-3">
                  {[
                    "Give me space — I'll come back when I'm ready.",
                    "Check in softly, nothing heavy.",
                    "Nudge me gently back on track.",
                    "Call me out kindly — I respond to honesty.",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setShutdownPreference(option)}
                      className={`w-full btn-glass text-left ${
                        shutdownPreference === option ? "bg-white border-purple-400" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className="font-serif text-2xl leading-tight">
                  When you need help, what style of guidance works best?
                </h3>
                <div className="space-y-3">
                  {[
                    "Give me simple, clear steps.",
                    "Offer a few options and let me choose.",
                    "Handle what you can for me and show me the result.",
                    "Keep it flexible and adjust in the moment.",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setGuidanceStyle(option)}
                      className={`w-full btn-glass text-left ${
                        guidanceStyle === option ? "bg-white border-purple-400" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h3 className="font-serif text-2xl leading-tight">
                  Day to day, how present do you want Mira to be?
                </h3>
                <div className="space-y-3">
                  {[
                    "Only speak when I ask.",
                    "Light check-ins here and there.",
                    "More regular support to keep me moving.",
                    "Stay close and help me stay aligned.",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPresence(option)}
                      className={`w-full btn-glass text-left ${
                        presence === option ? "bg-white border-purple-400" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl mx-auto shadow-xl animate-bounce">
                  ✓
                </div>
                <h3 className="font-serif text-3xl">That's all I need.</h3>
                <p className="text-sm font-medium text-secondary max-w-[80%] mx-auto">
                  I'll start from this and keep adjusting as I learn you. Whenever you're ready, I'm here.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {step < 6 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-gray-200"
                  disabled={saveOnboarding.isPending}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saveOnboarding.isPending}
                className="flex-1 btn-connect py-4 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                {saveOnboarding.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : step === 0 ? (
                  "Begin"
                ) : step === 5 ? (
                  "Complete"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
