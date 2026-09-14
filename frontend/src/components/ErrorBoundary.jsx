import React from 'react';
import {
  ShieldAlert,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Home,
  Trash2,
  Activity,
} from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: null,
      timestamp: null,
      showDetails: false,
      copied: false,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error) {
    const timestamp = new Date().toISOString();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const incidentId = `DJUA-ERR-${timestamp.slice(0, 10).replace(/-/g, '')}-${randomHex}`;
    return {
      hasError: true,
      error,
      timestamp,
      incidentId,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log technique structuré en console pour les outils de monitoring
    console.error(`[Djua-Runtime-Incident] ID: ${this.state.incidentId || 'UNKNOWN'}`, {
      error,
      componentStack: errorInfo?.componentStack,
      timestamp: this.state.timestamp,
      location: typeof window !== 'undefined' ? window.location.href : null,
    });
  }

  handleSoftReset = () => {
    this.setState({ isRecovering: true });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.warn('Error during onReset callback:', e);
      }
    }
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });
    }, 250);
  };

  handleHardReload = () => {
    this.setState({ isRecovering: true });
    window.location.reload();
  };

  handlePurgeAndReload = () => {
    this.setState({ isRecovering: true });
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }
    window.location.reload();
  };

  handleNavigateHome = () => {
    window.location.href = '/dashboard';
  };

  handleCopyReport = async () => {
    const { error, errorInfo, incidentId, timestamp } = this.state;
    const report = {
      incidentId,
      timestamp,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      errorMessage: error?.message || String(error),
      errorName: error?.name || 'Error',
      errorStack: error?.stack || 'No stack available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
    };

    const textToCopy = `=== RAPPORT D'INCIDENT DJUA ENERGY ===\n${JSON.stringify(report, null, 2)}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, incidentId, timestamp, showDetails, copied, isRecovering } = this.state;
    const isDOMMismatch =
      error?.name === 'NotFoundError' ||
      error?.message?.includes('insertBefore') ||
      error?.message?.includes('removeChild');

    const isEmbedded = Boolean(this.props.embedded);

    return (
      <div
        id="djua-error-boundary-root"
        className={`${
          isEmbedded
            ? 'h-full min-h-[550px] w-full py-8'
            : 'min-h-screen w-full bg-[#08090a]'
        } text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative selection:bg-[#FF7900]/30 select-text`}
      >
        {/* Grille industrielle d'arrière-plan */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 121, 0, 0.12) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
            backgroundSize: '32px 32px, 16px 16px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        <div className="relative z-10 w-full max-w-2xl bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* En-tête statut industriel */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-900">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#FF7900] shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    Interruption Runtime
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {incidentId}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                  Arrêt sécurisé du module d'affichage
                </h1>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <Activity size={13} className="text-emerald-400" />
              <span>Système sécurisé</span>
            </div>
          </div>

          {/* Diagnostic clair */}
          <div className="py-5 space-y-3">
            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {isDOMMismatch ? (
                <p>
                  Une désynchronisation a été interceptée entre l'arbre DOM géré par le runtime React et des mutations extérieures du navigateur (ex. extension de traduction automatique ou script injecté). Le gestionnaire d'intégrité a isolé l'affichage pour prévenir tout état incohérent.
                </p>
              ) : (
                <p>
                  Une exception critique a été interceptée lors de l'exécution ou du rendu d'un composant. La session et l'intégrité des opérations locales restent protégées.
                </p>
              )}
            </div>

            {/* Badge de l'erreur */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-xs font-mono break-all">
              <Terminal size={14} className="text-[#FF7900] shrink-0" />
              <span className="text-zinc-200 font-semibold">{error?.name || 'Error'}:</span>
              <span className="text-zinc-400">{error?.message || 'Erreur d’exécution non spécifiée'}</span>
            </div>
          </div>

          {/* Barre d'actions Senior */}
          <div className="pt-2 pb-4 space-y-3">
            <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-500">
              Procédures de reprise d'exploitation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Bouton principal : Soft reset */}
              <button
                id="btn-recover-runtime"
                type="button"
                onClick={this.handleSoftReset}
                disabled={isRecovering}
                className="group inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#FF7900] hover:bg-[#e06c00] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw
                  size={15}
                  className={`transition-transform group-hover:-rotate-90 duration-300 ${
                    isRecovering ? 'animate-spin' : ''
                  }`}
                />
                <span>Relancer le runtime</span>
                <kbd className="ml-auto hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-black/30 rounded border border-white/20">
                  Soft
                </kbd>
              </button>

              {/* Bouton rechargement dur */}
              <button
                id="btn-hard-reload"
                type="button"
                onClick={this.handleHardReload}
                disabled={isRecovering}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw
                  size={14}
                  className={`text-zinc-400 ${isRecovering ? 'animate-spin' : ''}`}
                />
                <span>Recharger la page</span>
                <kbd className="ml-auto hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-zinc-800 rounded border border-zinc-700 text-zinc-400">
                  F5
                </kbd>
              </button>

              {/* Purge du cache local */}
              <button
                id="btn-purge-cache"
                type="button"
                onClick={this.handlePurgeAndReload}
                disabled={isRecovering}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/50 border border-zinc-800/60 hover:border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                <Trash2 size={14} className="text-zinc-400" />
                <span>Purger le cache local & Recharger</span>
              </button>

              {/* Navigation de repli */}
              <button
                id="btn-nav-dashboard"
                type="button"
                onClick={this.handleNavigateHome}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/50 border border-zinc-800/60 hover:border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                <Home size={14} className="text-zinc-400" />
                <span>Retour au tableau de bord</span>
              </button>
            </div>
          </div>

          {/* Volet technique d'incident */}
          <div className="border-t border-zinc-900 pt-4 mt-2">
            <div className="flex items-center justify-between gap-2">
              <button
                id="btn-toggle-diagnostics"
                type="button"
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
              >
                <Terminal size={14} className="text-zinc-500" />
                <span>Dossier technique d'incident (L3)</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button
                id="btn-copy-report"
                type="button"
                onClick={this.handleCopyReport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Rapport copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-zinc-400" />
                    <span>Copier le rapport</span>
                  </>
                )}
              </button>
            </div>

            {showDetails && (
              <div className="mt-3 p-4 rounded-xl bg-zinc-950 border border-zinc-900 font-mono text-[11px] space-y-3 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400 pb-2 border-b border-zinc-900 text-[10px]">
                  <div><span className="text-zinc-600">ID INCIDENT :</span> {incidentId}</div>
                  <div><span className="text-zinc-600">HORODATAGE :</span> {timestamp}</div>
                </div>

                <div>
                  <div className="text-zinc-500 font-bold mb-1 text-[10px] uppercase">Pile d'appel (Stack Trace) :</div>
                  <pre className="max-h-40 overflow-y-auto overflow-x-auto p-2.5 rounded bg-black/60 text-rose-300/90 text-[10px] leading-relaxed custom-scrollbar">
                    {error?.stack || 'Aucune pile d’appel disponible'}
                  </pre>
                </div>

                {errorInfo?.componentStack && (
                  <div>
                    <div className="text-zinc-500 font-bold mb-1 text-[10px] uppercase">Arborescence Composants React :</div>
                    <pre className="max-h-32 overflow-y-auto overflow-x-auto p-2.5 rounded bg-black/60 text-zinc-400 text-[10px] leading-relaxed custom-scrollbar">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
