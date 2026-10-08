import { create } from 'zustand';
import type {
  SystemData,
  GeoLocation,
  QuoteData,
  DiagnosticCheck,
  DiagnosticStatus,
  InstallPayload,
  KitRecord,
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
  // ── Champs du modèle Kit backend ──────────────────────────────────────
  clientPhone: string | null;   // N° Orange du client (clientPhone dans Kit)
  installedBy: string | null;   // Identifiant du technicien installateur
  // ── Kit existant trouvé lors du scan ──────────────────────────────────
  kitRecord: KitRecord | null;  // Rempli si le kit existe déjà en BDD

  // ─── Actions ──────────────────────────────────────────────────────────
  setBoxId: (id: string) => void;
  setHasQuote: (has: boolean) => void;
  setQuoteData: (id: string, data: QuoteData) => void;
  setManualData: (data: SystemData) => void;
  setLocation: (loc: GeoLocation) => void;
  setDiagnostic: (status: DiagnosticStatus, checks: DiagnosticCheck[]) => void;
  setClientPhone: (phone: string) => void;
  setInstalledBy: (tech: string) => void;
  setKitRecord: (kit: KitRecord | null) => void;

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
  clientPhone: null,
  installedBy: null,
  kitRecord: null,
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
  setClientPhone: (phone) => set({ clientPhone: phone }),
  setInstalledBy: (tech) => set({ installedBy: tech }),
  setKitRecord: (kit) => set({ kitRecord: kit }),

  /**
   * Construit le payload complet prêt à POST /api/installations
   * Retourne null si les données obligatoires sont manquantes.
   */
  buildPayload: (): InstallPayload | null => {
    const {
      boxId, hasQuote, quoteId, quoteData, manualData,
      location, diagnosticStatus, diagnosticChecks,
      clientPhone, installedBy,
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
      // ── Champs du modèle Kit backend ──
      ...(clientPhone ? { clientPhone } : {}),
      ...(installedBy ? { installedBy } : {}),
    };
  },

  reset: () => set({ ...initialState }),
}));
