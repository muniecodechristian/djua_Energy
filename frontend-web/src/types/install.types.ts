// ─── Types partagés pour l'état du wizard d'installation ────────────────────

export interface SystemData {
  panels: number;
  panelPower: number;        // W par panneau
  batteryCapacity: number;   // kWh
  inverterPower: number;     // kVA
  expectedLoad?: number;     // kW (optionnel)
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name: string;
  accuracy: number; // mètres
}

export interface QuoteData {
  client: string;
  location: string;
  system: SystemData;
}

export type DiagnosticStatus = 'ok' | 'partial' | 'failed' | 'pending';

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: 'pending' | 'ok' | 'error';
  message?: string;
}

// ─── Payload final envoyé au backend ─────────────────────────────────────────

export interface InstallPayload {
  boxId: string;                         // ID du boîtier scanné
  source: 'quote' | 'manual';           // Origine des données système
  quoteId?: string;                      // Référence devis Orange Energy
  system: SystemData;                    // Spécifications du système installé
  location: GeoLocation;                // Position GPS de l'installation
  diagnosticStatus: DiagnosticStatus;   // Résultat du diagnostic boîtier
  diagnosticChecks: DiagnosticCheck[];  // Détail de chaque vérification
  installedAt: string;                  // ISO timestamp de l'installation
  clientName?: string;                  // Nom du client (si devis)
}

// ─── Réponse backend esperée ──────────────────────────────────────────────────

export interface InstallResponse {
  success: boolean;
  data?: {
    installationId: string;
    kitId: string;
    message: string;
  };
  error?: string;
}

// ─── Réponse Device API ───────────────────────────────────────────────────────

export interface DeviceState {
  status: 'online' | 'offline' | 'unknown';
  telemetry: Record<string, number> | null;
  alerts: unknown[];
  lastSeen: string;
}

// ─── Réponse Orange Energy API ────────────────────────────────────────────────

export interface OrangeQuote {
  id: string;
  client: string;
  location: string;
  system: SystemData;
  createdAt?: string;
}
