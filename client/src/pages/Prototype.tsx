import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Mic, Volume2, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Prototype() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const voiceChat = trpc.mira.voiceChat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: data.transcript },
        { role: "assistant", content: data.message },
      ]);

      // Play audio response
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    },
    onError: (error) => {
      console.error("Voice chat error:", error);
      alert("Failed to process voice message. Please try again.");
    },
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Voice recording is not supported in your browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          voiceChat.mutate({ audio: base64Audio });
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
        <div 
          className="absolute bottom-[-10%] left-[20%] w-[900px] h-[900px] bg-[#BAE6FD] rounded-full aurora-blob opacity-60"
          style={{ animation: "blob 20s infinite alternate", animationDelay: "-10s" }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 py-4 bg-white/70 border-b border-white/40 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          <Link href="/">
            <span className="font-serif text-2xl font-bold tracking-tight cursor-pointer">Mira.</span>
          </Link>
          <Link href="/">
            <button className="text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-gray-200 bg-white/40 hover:bg-white transition-all shadow-sm backdrop-blur-sm">
              Home
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-20 pb-24 px-6 relative z-10">
        {/* Voice Interface */}
        <div className="mira-crystal p-8 mb-6 min-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 opacity-40">
            <span className="text-[9px] font-bold uppercase tracking-widest">Voice Chat</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {isRecording ? "Recording" : isPlaying ? "Speaking" : "Online"}
            </span>
          </div>

          {/* Conversation Display */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-3xl font-serif italic text-purple-600 mb-4">
                  M.
                </div>
                <h3 className="font-serif text-2xl mb-2">I'm listening</h3>
                <p className="text-sm text-secondary">Press the microphone to start talking</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-white/50 border border-white/30 ml-8"
                      : "bg-gradient-to-br from-purple-50 to-pink-50 mr-8"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              ))
            )}
            {voiceChat.isPending && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <p className="text-xs text-secondary mt-2">Processing...</p>
              </div>
            )}
          </div>

          {/* Voice Control */}
          <div className="flex flex-col items-center gap-4">
            {/* Waveform Visualization */}
            {(isRecording || isPlaying) && (
              <div className="flex items-center justify-center gap-1 h-12">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full"
                    style={{
                      animation: "waveBar 2s ease-in-out infinite",
                      animationDelay: `${i * 0.1}s`,
                      height: "20%",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Microphone Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={voiceChat.isPending || isPlaying}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : voiceChat.isPending || isPlaying
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-purple-600 to-pink-600 hover:scale-110"
              }`}
            >
              {isPlaying ? (
                <Volume2 className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>

            <p className="text-xs text-secondary text-center">
              {isRecording
                ? "Listening... (tap to stop)"
                : isPlaying
                ? "Mira is speaking..."
                : voiceChat.isPending
                ? "Processing your message..."
                : "Tap to speak"}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-secondary space-y-2">
          <p>Speak naturally. Mira will respond with voice and text.</p>
          <p className="opacity-60">
            Tip: Use headphones for the best experience
          </p>
        </div>
      </main>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
