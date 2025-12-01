import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Waveform } from "@/components/Waveform";
import { Loader2, Mic, LogOut, Plus, MessageSquare, Target, Settings } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingState, setLoadingState] = useState<'transcribing' | 'thinking' | 'speaking' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auth
  const { user, loading: userLoading, logout } = useAuth({ redirectOnUnauthenticated: true });

  // Conversations
  const { data: conversations = [], refetch: refetchConversations } = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Current conversation messages
  const { data: currentConversation, refetch: refetchCurrentConversation } = trpc.conversations.get.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );

  // Daily goals for today
  const { data: todayGoals } = trpc.goals.getTodayGoals.useQuery(undefined, { enabled: !!user });

  // Mutations
  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }
      refetchConversations();
    },
  });

  const addMessageMutation = trpc.conversations.addMessage.useMutation({
    onSuccess: () => {
      refetchCurrentConversation();
      refetchConversations(); // Update conversation list (updatedAt changed)
    },
  });

  const voiceChatMutation = trpc.mira.voiceChat.useMutation({
    onSuccess: async (data) => {
      // Create conversation if this is the first message
      if (!currentConversationId) {
        const newConv = await createConversationMutation.mutateAsync({});
        const newConvId = newConv.conversationId;
        if (newConvId) {
          setCurrentConversationId(newConvId);
        }
        
        // Save both messages to the new conversation
        if (newConvId) {
          await addMessageMutation.mutateAsync({
            conversationId: newConvId,
            role: 'user',
            content: data.transcript,
          });
          
          await addMessageMutation.mutateAsync({
            conversationId: newConvId,
            role: 'assistant',
            content: data.message,
            audioUrl: data.audioUrl,
          });
        }
      } else {
        // Save to existing conversation
        await addMessageMutation.mutateAsync({
          conversationId: currentConversationId,
          role: 'user',
          content: data.transcript,
        });
        
        await addMessageMutation.mutateAsync({
          conversationId: currentConversationId,
          role: 'assistant',
          content: data.message,
          audioUrl: data.audioUrl,
        });
      }
      
      setLoadingState('speaking');
      
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
          setError('Audio playback failed. You can still read the response above.');
        });
      }
      
      setIsProcessing(false);
      setLoadingState(null);
      setError(null);
    },
    onError: (err) => {
      console.error('Voice chat error:', err);
      setError('Failed to process your message. Please try again.');
      setIsProcessing(false);
      setLoadingState(null);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

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

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsProcessing(true);
    setLoadingState('transcribing');

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      setTimeout(() => setLoadingState('thinking'), 800);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        voiceChatMutation.mutate({ audio: base64Audio, userId: user?.id });
      };

      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setError(null);
  };

  const handleSelectConversation = (id: number) => {
    setCurrentConversationId(id);
    setError(null);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const messages = currentConversation?.messages || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <header className="border-b border-purple-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mira
            </h1>
            <span className="text-sm text-gray-600">Welcome, {user.name || 'there'}</span>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversation History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversations
                </h3>
                <button
                  onClick={handleNewConversation}
                  className="p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-4 h-4 text-purple-600" />
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {conversations.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No conversations yet
                  </p>
                )}
                
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentConversationId === conv.id
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.title || 'New conversation'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>

              {/* Daily Goals Widget */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4" />
                  Today's Goals
                </h3>
                
                {todayGoals ? (
                  <div className="space-y-2">
                    {todayGoals.personalGoal && (
                      <div className="text-xs">
                        <p className="font-medium text-purple-600">Personal</p>
                        <p className="text-gray-600 mt-1">{todayGoals.personalGoal}</p>
                      </div>
                    )}
                    {todayGoals.professionalGoal && (
                      <div className="text-xs">
                        <p className="font-medium text-pink-600">Professional</p>
                        <p className="text-gray-600 mt-1">{todayGoals.professionalGoal}</p>
                      </div>
                    )}
                    {todayGoals.growthGoal && (
                      <div className="text-xs">
                        <p className="font-medium text-indigo-600">Growth</p>
                        <p className="text-gray-600 mt-1">{todayGoals.growthGoal}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href="/goals"
                    className="text-xs text-purple-600 hover:text-purple-700 underline"
                  >
                    Set your goals for today
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Main - Voice Chat */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">Ready to talk with Mira?</p>
                    <p className="text-sm">Tap the microphone button below to start</p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {msg.role === 'user' ? 'You' : 'Mira'}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading skeleton */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <p className="text-sm text-gray-600">
                          {loadingState === 'transcribing' && 'Transcribing...'}
                          {loadingState === 'thinking' && 'Mira is thinking...'}
                          {loadingState === 'speaking' && 'Speaking...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || !!error}
                  className="w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isRecording
                      ? 'linear-gradient(135deg, #FCA5A5 0%, #F472B6 100%)'
                      : 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)'
                  }}
                >
                  {isRecording ? (
                    <Waveform />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isRecording ? 'RECORDING...' : 'TAP TO SPEAK'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isRecording ? 'Tap again to stop recording' : 'Speak when ready'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
