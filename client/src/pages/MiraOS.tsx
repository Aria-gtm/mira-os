import { useState, useEffect, useRef } from "react";
import { useMira } from "@/contexts/MiraContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Moon, Sun, Battery, Anchor, Power, Send, Mic, StopCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Waveform } from "@/components/Waveform";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  audioUrl?: string;
}

export default function MiraOS() {
  const { state, setCapacity, setAnchors, setVisionLine, setShutdown, manualOverridePhase, isLoading: stateLoading } = useMira();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingState, setLoadingState] = useState<'transcribing' | 'thinking' | 'speaking' | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Voice chat mutation
  const voiceChatMutation = trpc.mira.voiceChat.useMutation({
    onSuccess: async (data) => {
      setMessages(prev => [
        ...prev,
        { role: "user", content: data.transcript },
        { role: "assistant", content: data.message, audioUrl: data.audioUrl }
      ]);

      // Auto-extract anchors in morning mode
      if (state.phase === "MORNING" && state.anchors.length < 3) {
        const newAnchors = [...state.anchors, data.transcript.substring(0, 100)];
        if (newAnchors.length <= 3) {
          setAnchors(newAnchors);
        }
      }

      // Play TTS audio
      if (data.audioUrl && audioRef.current) {
        setLoadingState('speaking');
        audioRef.current.src = data.audioUrl;
        audioRef.current.play().catch(err => console.error('Audio playback failed:', err));
      }
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
    },
    onSettled: () => {
      setIsProcessing(false);
      setLoadingState(null);
    }
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start conversation on phase change
  useEffect(() => {
    if (messages.length === 0 && !stateLoading) {
      let greeting = "";
      if (state.phase === "MORNING") {
        greeting = "Good morning. The sun is up. What are your 3 anchors for today?";
      } else if (state.phase === "FOCUS") {
        greeting = "I'm here. What are we moving forward?";
      } else if (state.phase === "EVENING") {
        greeting = "The day is done. What would you like to release?";
      }
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [state.phase, stateLoading]);

  // Handle voice recording
  const startRecording = async () => {
    try {
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
        
        setIsProcessing(true);
        setLoadingState('transcribing');

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          setLoadingState('thinking');
          await voiceChatMutation.mutateAsync({
            audioData: base64Audio,
            conversationHistory: messages.filter(m => m.role !== "system").map(m => ({
              role: m.role,
              content: m.content
            }))
          });
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to use voice chat.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle text input
  const handleSendText = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    setIsProcessing(true);
    setLoadingState('thinking');

    // For text input, we skip voice transcription and TTS
    // Just send to chat endpoint directly
    // TODO: Implement text-only chat endpoint
    setIsProcessing(false);
    setLoadingState(null);
  };

  return (
    <div className="flex h-screen w-full bg-background transition-colors duration-1000 overflow-hidden">
      
      {/* LEFT PANEL: The "Self" State */}
      <div className="w-80 border-r p-6 flex flex-col gap-6 bg-muted/10 h-full overflow-y-auto">
        
        {/* Phase Indicator */}
        <div>
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
            TIME PHASE
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShutdown(!state.isShutdown)}>
              <Power className={`w-4 h-4 ${state.isShutdown ? 'text-red-500' : 'text-muted-foreground'}`} />
            </Button>
          </h2>
          <div className="flex items-center gap-3 mb-4">
            {state.phase === "MORNING" && <Sun className="w-6 h-6 text-orange-500" />}
            {state.phase === "FOCUS" && <Sparkles className="w-6 h-6 text-blue-500" />}
            {state.phase === "EVENING" && <Moon className="w-6 h-6 text-indigo-500" />}
            <span className="text-2xl font-serif capitalize tracking-tight">{state.phase.toLowerCase()}</span>
          </div>
          
          {/* Debug Controls */}
          <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1" onClick={() => manualOverridePhase("MORNING")}>
              Morning
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1" onClick={() => manualOverridePhase("FOCUS")}>
              Focus
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1" onClick={() => manualOverridePhase("EVENING")}>
              Evening
            </Button>
          </div>
        </div>

        {/* Capacity Slider */}
        <div>
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Battery className="w-3 h-3" /> CAPACITY
          </h2>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold">{state.capacity}</span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={state.capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </Card>
        </div>

        {/* Anchors */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Anchor className="w-3 h-3" /> ANCHORS
          </h2>
          {state.anchors.length === 0 ? (
            <div className="text-sm text-muted-foreground italic pl-1 opacity-50">
              Set in morning chat...
            </div>
          ) : (
            <ul className="space-y-2">
              {state.anchors.map((anchor, i) => (
                <Card key={i} className="p-3 text-sm font-medium border-l-4 border-l-primary">
                  {anchor}
                </Card>
              ))}
            </ul>
          )}
        </div>

        {/* Vision Line */}
        {state.visionLine && (
          <div>
            <h2 className="text-xs font-bold tracking-widest text-muted-foreground mb-2">
              TODAY'S VISION
            </h2>
            <Card className="p-3 text-sm italic border-l-4 border-l-purple-500">
              "{state.visionLine}"
            </Card>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: The Conversation */}
      <div className="flex-1 flex flex-col bg-background relative h-full">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[70%] p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </Card>
            </div>
          ))}
          
          {/* Loading State */}
          {loadingState && (
            <div className="flex justify-start">
              <Card className="max-w-[70%] p-4 bg-muted">
                <p className="text-sm text-muted-foreground italic">
                  {loadingState === 'transcribing' && 'Transcribing...'}
                  {loadingState === 'thinking' && 'Thinking...'}
                  {loadingState === 'speaking' && 'Speaking...'}
                </p>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-6 bg-muted/5">
          <div className="flex gap-3 items-center">
            
            {/* Voice Button */}
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="rounded-full w-14 h-14 flex-shrink-0"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? (
                <StopCircle className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            {/* Waveform when recording */}
            {isRecording && (
              <div className="flex-1">
                <Waveform />
              </div>
            )}

            {/* Text Input (when not recording) */}
            {!isRecording && (
              <>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
                  placeholder="Type a message or use voice..."
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button
                  size="lg"
                  onClick={handleSendText}
                  disabled={!inputText.trim() || isProcessing}
                  className="rounded-full w-14 h-14 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Status Text */}
          {isRecording && (
            <p className="text-xs text-center text-muted-foreground mt-3">
              Tap the stop button when you're done speaking
            </p>
          )}
        </div>

        {/* Hidden audio player for TTS */}
        <audio ref={audioRef} onEnded={() => setLoadingState(null)} />
      </div>
    </div>
  );
}
