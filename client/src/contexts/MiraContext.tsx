import React, { createContext, useContext, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export type MiraPhase = "MORNING" | "FOCUS" | "EVENING";

interface MiraState {
  phase: MiraPhase;
  capacity: number;
  anchors: string[];
  visionLine: string | null;
  isShutdown: boolean;
}

interface MiraContextType {
  state: MiraState;
  isLoading: boolean;
  setCapacity: (level: number) => void;
  setAnchors: (anchors: string[]) => void;
  setVisionLine: (line: string) => void;
  setShutdown: (status: boolean) => void;
  manualOverridePhase: (phase: MiraPhase) => void;
  sendMessage: (messages: any[]) => Promise<any>;
}

const MiraContext = createContext<MiraContextType | null>(null);

export function MiraProvider({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  
  // 1. FETCH STATE (Poll every minute to keep fresh)
  const { data: dbState, isLoading } = trpc.mira.getOSState.useQuery(undefined, {
    refetchInterval: 60000, // Check every minute
    retry: 3,
  });

  // 2. MUTATION HANDLERS
  const updateMutation = trpc.mira.updateOSState.useMutation({
    onMutate: async (newInput) => {
      // Optimistic update
      await utils.mira.getOSState.cancel();
      const prevData = utils.mira.getOSState.getData();
      if (prevData) {
        utils.mira.getOSState.setData(undefined, { ...prevData, ...newInput } as any);
      }
      return { prevData };
    },
    onError: (err, newVal, context) => {
      // Rollback on error
      if (context?.prevData) {
        utils.mira.getOSState.setData(undefined, context.prevData);
      }
    },
    onSettled: () => {
      utils.mira.getOSState.invalidate();
    },
  });

  const chatMutation = trpc.mira.chat.useMutation();

  // 3. DERIVE CURRENT STATE
  const state: MiraState = {
    phase: (dbState?.currentPhase as MiraPhase) || "FOCUS",
    capacity: dbState?.capacityScore || 8,
    anchors: dbState?.morningAnchors ? JSON.parse(dbState.morningAnchors) : [],
    visionLine: dbState?.visionLine || null,
    isShutdown: dbState?.isShutdown === 1,
  };

  // 4. THE TIMEKEEPER (Auto-Sync Phase based on Local Time)
  useEffect(() => {
    if (!dbState) return; // Wait for initial data

    const syncPhaseToTime = () => {
      const hour = new Date().getHours();
      let calculatedPhase: MiraPhase = "FOCUS";

      // DEFINING THE WINDOWS
      // Morning: 5 AM - 11 AM
      if (hour >= 5 && hour < 11) calculatedPhase = "MORNING";
      // Evening: 8 PM - 4 AM
      else if (hour >= 20 || hour < 4) calculatedPhase = "EVENING";
      
      // If the DB says something different than the Clock, force an update
      if (dbState.currentPhase !== calculatedPhase) {
        console.log(`[Mira OS] Shifting Phase: ${dbState.currentPhase} → ${calculatedPhase}`);
        updateMutation.mutate({ phase: calculatedPhase });
      }
    };

    // Check immediately
    syncPhaseToTime();

    // Then check every minute
    const interval = setInterval(syncPhaseToTime, 60000);
    return () => clearInterval(interval);
  }, [dbState?.currentPhase]);

  // 5. CONTEXT VALUE
  const contextValue: MiraContextType = {
    state,
    isLoading,
    
    setCapacity: (level: number) => {
      updateMutation.mutate({ capacity: level });
    },
    
    setAnchors: (anchors: string[]) => {
      updateMutation.mutate({ anchors });
    },
    
    setVisionLine: (line: string) => {
      updateMutation.mutate({ visionLine: line });
    },
    
    setShutdown: (status: boolean) => {
      updateMutation.mutate({ isShutdown: status });
    },
    
    manualOverridePhase: (phase: MiraPhase) => {
      updateMutation.mutate({ phase });
    },
    
    sendMessage: async (messages: any[]) => {
      const response = await chatMutation.mutateAsync({ messages });
      return response;
    },
  };

  return (
    <MiraContext.Provider value={contextValue}>
      {children}
    </MiraContext.Provider>
  );
}

export const useMira = () => {
  const context = useContext(MiraContext);
  if (!context) {
    throw new Error("useMira must be used within MiraProvider");
  }
  return context;
};
