import { create } from 'zustand';
import type {
  SystemData,
  GeoLocation,
  QuoteData,
  DiagnosticCheck,
  DiagnosticStatus,
  InstallPayload,
} from '../types/install.types';

interface InstallState {
  // ─── Données collectées étape par étape ───────────────────────────────
  boxId: string | null;
  hasQuote: boolean | null;
  quoteId: string | null;
  quoteData: QuoteData | null;
  manualData: SystemData | null;
  location: GeoLocation | null;
  diagnosticStatus: DiagnosticStatus;
  diagnosticChecks: DiagnosticCheck[];

  // ─── Actions ──────────────────────────────────────────────────────────
  setBoxId: (id: string) => void;
  setHasQuote: (has: boolean) => void;
  setQuoteData: (id: string, data: QuoteData) => void;
  setManualData: (data: SystemData) => void;
  setLocation: (loc: GeoLocation) => void;
  setDiagnostic: (status: DiagnosticStatus, checks: DiagnosticCheck[]) => void;

  // ─── Construct payload prêt à envoyer au backend ──────────────────────
  buildPayload: () => InstallPayload | null;

  reset: () => void;
}

const initialState = {
  boxId: null,
  hasQuote: null,
  quoteId: null,
  quoteData: null,
  manualData: null,
  location: null,
  diagnosticStatus: 'pending' as DiagnosticStatus,
  diagnosticChecks: [],
};

export const useInstallStore = create<InstallState>((set, get) => ({
  ...initialState,

  setBoxId: (id) => set({ boxId: id }),
  setHasQuote: (has) => set({ hasQuote: has }),
  setQuoteData: (id, data) => set({ quoteId: id, quoteData: data }),
  setManualData: (data) => set({ manualData: data }),
  setLocation: (loc) => set({ location: loc }),
  setDiagnostic: (status, checks) =>
    set({ diagnosticStatus: status, diagnosticChecks: checks }),

  /**
   * Construit le payload complet prêt à POST /api/installations
   * Retourne null si les données obligatoires sont manquantes.
   */
  buildPayload: (): InstallPayload | null => {
    const {
      boxId, hasQuote, quoteId, quoteData, manualData,
      location, diagnosticStatus, diagnosticChecks,
    } = get();

    if (!boxId || !location) return null;

    const system: SystemData | null =
      hasQuote && quoteData ? quoteData.system : manualData;

    if (!system) return null;

    return {
      boxId,
      source: hasQuote ? 'quote' : 'manual',
      ...(quoteId ? { quoteId } : {}),
      system,
      location,
      diagnosticStatus,
      diagnosticChecks,
      installedAt: new Date().toISOString(),
      ...(quoteData?.client ? { clientName: quoteData.client } : {}),
    };
  },

  reset: () => set({ ...initialState }),
}));
