import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";

export default function DailyGoals() {
  const { user, isAuthenticated, loading } = useAuth();
  const [view, setView] = useState<"morning" | "evening">("morning");
  
  // Morning goals state
  const [personalGoal, setPersonalGoal] = useState("");
  const [professionalGoal, setProfessionalGoal] = useState("");
  const [growthGoal, setGrowthGoal] = useState("");
  
  // Voice recording state
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Evening reflection state
  const [personalProgress, setPersonalProgress] = useState("");
  const [professionalProgress, setProfessionalProgress] = useState("");
  const [growthProgress, setGrowthProgress] = useState("");
  const [patterns, setPatterns] = useState("");
  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");

  // Fetch today's goals and reflection
  const { data: todayGoals } = trpc.goals.getTodayGoals.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: todayReflection } = trpc.goals.getTodayReflection.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const setGoalsMutation = trpc.goals.setTodayGoals.useMutation({
    onSuccess: () => {
      toast.success("Goals saved! Let's make today count.");
    },
    onError: (err) => {
      toast.error(`Failed to save goals: ${err.message}`);
    },
  });

  const setReflectionMutation = trpc.goals.setTodayReflection.useMutation({
    onSuccess: () => {
      toast.success("Reflection saved. Rest well.");
    },
    onError: (err) => {
      toast.error(`Failed to save reflection: ${err.message}`);
    },
  });

  // Load existing goals/reflection when data arrives
  useEffect(() => {
    if (todayGoals) {
      setPersonalGoal(todayGoals.personalGoal || "");
      setProfessionalGoal(todayGoals.professionalGoal || "");
      setGrowthGoal(todayGoals.growthGoal || "");
    }
  }, [todayGoals]);

  useEffect(() => {
    if (todayReflection) {
      setPersonalProgress(todayReflection.personalProgress || "");
      setProfessionalProgress(todayReflection.professionalProgress || "");
      setGrowthProgress(todayReflection.growthProgress || "");
      setPatterns(todayReflection.patterns || "");
      setWins(todayReflection.wins || "");
      setStruggles(todayReflection.struggles || "");
    }
  }, [todayReflection]);

  // Auto-detect time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 17) {
      setView("evening");
    } else {
      setView("morning");
    }
  }, []);

  const handleSaveGoals = () => {
    setGoalsMutation.mutate({
      personalGoal,
      professionalGoal,
      growthGoal,
    });
  };

  const handleSaveReflection = () => {
    setReflectionMutation.mutate({
      personalProgress,
      professionalProgress,
      growthProgress,
      patterns,
      wins,
      struggles,
    });
  };

  const startRecording = async (field: string) => {
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
        
        // TODO: Send to transcription API
        // For now, just show a message
        toast.info("Voice transcription coming soon!");
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingField(field);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingField) {
      mediaRecorderRef.current.stop();
      setRecordingField(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF9]">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF9]">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-serif mb-4">Daily Check-In</h2>
          <p className="text-gray-600 mb-6">Please log in to access your daily goals.</p>
          <Button onClick={() => window.location.href = "/onboarding"}>
            Get Started
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF9] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif mb-2">Daily Check-In</h1>
          <p className="text-gray-600">
            {view === "morning" ? "What are we working on today?" : "How did today go?"}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-4 mb-8 justify-center">
          <Button
            variant={view === "morning" ? "default" : "outline"}
            onClick={() => setView("morning")}
          >
            Morning Goals
          </Button>
          <Button
            variant={view === "evening" ? "default" : "outline"}
            onClick={() => setView("evening")}
          >
            Evening Reflection
          </Button>
        </div>

        {/* Morning Goals View */}
        {view === "morning" && (
          <Card className="p-8">
            <h2 className="text-2xl font-serif mb-6">Set Your 3 Goals</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Personal Goal
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Something for your well-being, relationships, or self-care"
                    value={personalGoal}
                    onChange={(e) => setPersonalGoal(e.target.value)}
                    rows={3}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => recordingField === 'personal' ? stopRecording() : startRecording('personal')}
                    className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {recordingField === 'personal' ? (
                      <MicOff className="w-5 h-5 text-red-500" />
                    ) : (
                      <Mic className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Professional Goal
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Work, business, or career progress"
                    value={professionalGoal}
                    onChange={(e) => setProfessionalGoal(e.target.value)}
                    rows={3}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => recordingField === 'professional' ? stopRecording() : startRecording('professional')}
                    className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {recordingField === 'professional' ? (
                      <MicOff className="w-5 h-5 text-red-500" />
                    ) : (
                      <Mic className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Growth/Health Goal
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Learning, fitness, mindfulness, or personal development"
                    value={growthGoal}
                    onChange={(e) => setGrowthGoal(e.target.value)}
                    rows={3}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => recordingField === 'growth' ? stopRecording() : startRecording('growth')}
                    className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {recordingField === 'growth' ? (
                      <MicOff className="w-5 h-5 text-red-500" />
                    ) : (
                      <Mic className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleSaveGoals}
                disabled={setGoalsMutation.isPending}
                className="w-full"
              >
                {setGoalsMutation.isPending ? "Saving..." : "Save Goals"}
              </Button>
            </div>
          </Card>
        )}

        {/* Evening Reflection View */}
        {view === "evening" && (
          <Card className="p-8">
            <h2 className="text-2xl font-serif mb-6">Evening Reflection</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Personal Progress
                </label>
                <Textarea
                  placeholder="How did your personal goal go?"
                  value={personalProgress}
                  onChange={(e) => setPersonalProgress(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Professional Progress
                </label>
                <Textarea
                  placeholder="How did your professional goal go?"
                  value={professionalProgress}
                  onChange={(e) => setProfessionalProgress(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Growth/Health Progress
                </label>
                <Textarea
                  placeholder="How did your growth goal go?"
                  value={growthProgress}
                  onChange={(e) => setGrowthProgress(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Patterns Noticed
                </label>
                <Textarea
                  placeholder="What patterns did you notice today?"
                  value={patterns}
                  onChange={(e) => setPatterns(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Wins
                </label>
                <Textarea
                  placeholder="What went well?"
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Struggles
                </label>
                <Textarea
                  placeholder="What was hard?"
                  value={struggles}
                  onChange={(e) => setStruggles(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSaveReflection}
                disabled={setReflectionMutation.isPending}
                className="w-full"
              >
                {setReflectionMutation.isPending ? "Saving..." : "Save Reflection"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
