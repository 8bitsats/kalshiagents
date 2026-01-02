import { create } from "zustand";
import type { FusedState, StrategyDecision, SystemState } from "@/lib/api";

type Store = {
  // State
  state: FusedState | null;
  decision: StrategyDecision | null;
  systemState: SystemState | null;
  wsConnected: boolean;

  // Actions
  setState: (state: FusedState | null) => void;
  setDecision: (decision: StrategyDecision | null) => void;
  setSystemState: (systemState: SystemState | null) => void;
  setWsConnected: (connected: boolean) => void;
};

export const useStore = create<Store>((set) => ({
  state: null,
  decision: null,
  systemState: null,
  wsConnected: false,

  setState: (state) => set({ state }),
  setDecision: (decision) => set({ decision }),
  setSystemState: (systemState) => set({ systemState }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
}));

