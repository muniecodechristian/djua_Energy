import { create } from 'zustand';

interface SystemData {
  panels: number;
  panelPower: number;
  batteryCapacity: number;
  inverterPower: number;
  expectedLoad?: number;
}

interface InstallState {
  boxId: string | null;
  hasQuote: boolean | null;
  quoteId: string | null;
  quoteData: any | null;
  manualData: SystemData | null;
  location: { latitude: number; longitude: number; name: string; accuracy: number } | null;
  
  // Actions
  setBoxId: (id: string) => void;
  setHasQuote: (has: boolean) => void;
  setQuoteData: (id: string, data: any) => void;
  setManualData: (data: SystemData) => void;
  setLocation: (loc: { latitude: number; longitude: number; name: string; accuracy: number }) => void;
  reset: () => void;
}

export const useInstallStore = create<InstallState>((set) => ({
  boxId: null,
  hasQuote: null,
  quoteId: null,
  quoteData: null,
  manualData: null,
  location: null,

  setBoxId: (id) => set({ boxId: id }),
  setHasQuote: (has) => set({ hasQuote: has }),
  setQuoteData: (id, data) => set({ quoteId: id, quoteData: data }),
  setManualData: (data) => set({ manualData: data }),
  setLocation: (loc) => set({ location: loc }),
  reset: () => set({
    boxId: null,
    hasQuote: null,
    quoteId: null,
    quoteData: null,
    manualData: null,
    location: null,
  }),
}));
