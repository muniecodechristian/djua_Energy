import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Scan, CheckCircle2, Clock, AlertTriangle, FileText,
  User, MapPin, Zap, Battery, Sun, Thermometer, Radio,
  Send, X, RefreshCw, LogOut, ShieldCheck, ChevronRight, Check
} from 'lucide-react';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import {
  useGetInterventions,
  useUpdateInterventionStatus,
  useAddInterventionReport
} from '../hooks/tanstack/useInterventions';
import { useKitScanHistoryQuery } from '../hooks/tanstack/useKitQueries';
import { asList, formatDate } from '../lib/operations';
import { getAppSocket } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';

export default function TechnicianApp() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Onglet actif dans l'app technicien : 'missions' | 'scan' ──────────────
  const [activeTab, setActiveTab] = useState('missions');
  const [missionFilter, setMissionFilter] = useState('all'); // 'all' | 'planned' | 'in_progress' | 'completed'

  // ── Requêtes & Mutations ──────────────────────────────────────────────────
  const interventionsQuery = useGetInterventions();
  const updateStatus = useUpdateInterventionStatus();
  const addReport = useAddInterventionReport();

  // ── État Scan & Diagnostic Kit ────────────────────────────────────────────
  const [scannedKitInput, setScannedKitInput] = useState('');
  const [activeKitIdToScan, setActiveKitIdToScan] = useState('');
  const scanQuery = useKitScanHistoryQuery(activeKitIdToScan);

  // ── Modal Rapport de Clôture ──────────────────────────────────────────────
  const [reportingMission, setReportingMission] = useState(null);
  const [reportText, setReportText] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  // ── Socket.io écoute temps réel ───────────────────────────────────────────
  useEffect(() => {
    const socket = getAppSocket();
    const handleUpdate = () => {
      queryClient.invalidateQueries(['interventions']);
      if (activeKitIdToScan) {
        queryClient.invalidateQueries(['kit-scan-history', activeKitIdToScan]);
      }
    };

    socket.on('intervention:new', handleUpdate);
    socket.on('intervention:status-updated', handleUpdate);
    socket.on('intervention:report-submitted', handleUpdate);

    return () => {
      socket.off('intervention:new', handleUpdate);
      socket.off('intervention:status-updated', handleUpdate);
      socket.off('intervention:report-submitted', handleUpdate);
    };
  }, [queryClient, activeKitIdToScan]);

  const allMissions = asList(interventionsQuery.data);

  // Filtrer uniquement pour le technicien connecté
  const myMissions = allMissions.filter((i) => {
    const techId = i.assignedTo?._id || i.assignedTo;
    return techId?.toString() === user?._id?.toString() || user?.role === 'admin';
  });

  const plannedMissions = myMissions.filter((i) => i.status === 'Planifiée' || !i.status);
  const inProgressMissions = myMissions.filter((i) => i.status === 'En cours');
  const completedMissions = myMissions.filter((i) => i.status === 'Terminée');

  const displayedMissions = myMissions.filter((m) => {
    if (missionFilter === 'planned') return m.status === 'Planifiée' || !m.status;
    if (missionFilter === 'in_progress') return m.status === 'En cours';
    if (missionFilter === 'completed') return m.status === 'Terminée';
    return true;
  });

  const handleStartMission = (missionId) => {
    updateStatus.mutate({ id: missionId, status: 'En cours' });
  };

  const handleOpenScanForMission = (targetKitId) => {
    setScannedKitInput(targetKitId);
    setActiveKitIdToScan(targetKitId);
    setActiveTab('scan');
  };

  const handleTriggerScan = (e) => {
    e?.preventDefault();
    if (scannedKitInput.trim()) {
      setActiveKitIdToScan(scannedKitInput.trim().toUpperCase());
    }
  };

  const handleOpenReportModal = (mission) => {
    setReportingMission(mission);
    setReportText(mission.report || '');
    setReportError('');
    setReportSuccess('');
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportText.trim()) {
      setReportError('Veuillez renseigner un compte-rendu technique des interventions réalisées.');
      return;
    }

    addReport.mutate(
      { id: reportingMission._id, report: reportText.trim() },
      {
        onSuccess: () => {
          if (reportingMission.status !== 'Terminée') {
            updateStatus.mutate({ id: reportingMission._id, status: 'Terminée' });
          }
          setReportSuccess('Rapport transmis avec succès au Responsable Shop.');
          setTimeout(() => {
            setReportingMission(null);
            setReportText('');
            setReportSuccess('');
          }, 1200);
        },
        onError: (err) => {
          setReportError(err?.response?.data?.message || 'Erreur lors de la soumission du rapport.');
        },
      }
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans pb-16">
      {/* ── TOPBAR DE L'APP TECHNICIEN ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0e1626]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-[#F59E0B] flex items-center justify-center text-black font-black shadow-md shadow-none">
              <Zap size={20} className="fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">Djua Field Ops</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--ops-canvas)] text-[#F59E0B] border border-[var(--ops-line)] rounded-full">
                  TECHNICIEN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <User size={11} className="text-[#F59E0B]" />
                <strong className="text-slate-200">{user?.prenom} {user?.nom}</strong>
                {user?.zone && (
                  <span className="flex items-center gap-0.5 text-slate-400">
                    · <MapPin size={11} /> {user.zone}
                  </span>
                )}
                {user?.seniority === 'senior' && (
                  <span className="text-[#F59E0B] font-semibold">★ Senior</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── NAVIGATION PAR ONGLETS PRINCIPAUX ─────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#121c2e] rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('missions')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'missions'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-none'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={16} />
            Mes Missions ({inProgressMissions.length + plannedMissions.length})
          </button>

          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'scan'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-none'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scan size={16} />
            Scanner & Vérifier Kit
          </button>
        </div>
      </div>

      {/* ── CONTENU : VUE 1 - MES MISSIONS ───────────────────────────────────── */}
      {activeTab === 'missions' && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          {/* Sous-filtre missions */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Missions assignées par le Shop Manager</span>
            </h2>

            <div className="flex gap-1 bg-[#121c2e] p-1 rounded-lg border border-slate-800 text-xs">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'in_progress', label: `En cours (${inProgressMissions.length})` },
                { id: 'planned', label: `À faire (${plannedMissions.length})` },
                { id: 'completed', label: `Terminées (${completedMissions.length})` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setMissionFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    missionFilter === filter.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {interventionsQuery.isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="animate-spin mx-auto mb-2 text-[#F59E0B]" size={22} />
              Chargement de vos missions…
            </div>
          ) : displayedMissions.length === 0 ? (
            <div className="bg-[#121c2e]/60 border border-slate-800 rounded-2xl p-8 text-center">
              <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-white">Aucune mission dans cette catégorie</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Dès que votre Responsable Shop vous planifie une nouvelle maintenance, elle apparaîtra ici instantanément.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedMissions.map((mission) => {
                const isDone = mission.status === 'Terminée';
                const isInProgress = mission.status === 'En cours';

                return (
                  <article
                    key={mission._id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-emerald-950/10 border-emerald-500/20'
                        : isInProgress
                        ? 'bg-[#14233c] border-sky-500/40 shadow-lg shadow-sky-950/20'
                        : 'bg-[#121c2e] border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isInProgress
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {mission.status || 'Planifiée'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-300">
                            Priorité : {mission.priority || 'Moyenne'}
                          </span>
                          <span className="text-[11px] text-slate-500">·</span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(mission.scheduledDate || mission.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="text-[#F59E0B]">{mission.kitId}</span>
                          <span className="text-slate-400 font-normal text-xs">({mission.type || 'Maintenance'})</span>
                        </h3>
                      </div>

                      {/* Actions terrain */}
                      <div className="flex items-center gap-2">
                        {!isDone && !isInProgress && (
                          <button
                            onClick={() => handleStartMission(mission._id)}
                            disabled={updateStatus.isLoading}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-amber-500/20"
                          >
                            Démarrer
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            onClick={() => handleOpenReportModal(mission)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-emerald-500/20"
                          >
                            <FileText size={13} />
                            Rapport & Clôturer
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mb-1">{mission.title}</p>
                    {mission.description && (
                      <p className="text-xs text-slate-400 bg-black/30 p-2.5 rounded-lg border border-slate-800/80">
                        {mission.description}
                      </p>
                    )}

                    {/* Si rapport déjà rédigé */}
                    {mission.report && (
                      <div className="mt-3 bg-emerald-950/25 border border-emerald-500/30 p-2.5 rounded-lg">
                        <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mb-1">
                          <CheckCircle2 size={12} /> Compte-rendu envoyé :
                        </p>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">{mission.report}</p>
                      </div>
                    )}

                    {/* Bouton rapide de scan de ce kit spécifique */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenScanForMission(mission.kitId)}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Scan size={14} />
                        Vérifier le signal & l'historique complet de ce kit
                        <ChevronRight size={13} />
                      </button>

                      {isDone && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check size={13} /> Mission clôturée
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ── CONTENU : VUE 2 - SCANNER & VÉRIFIER UN KIT ───────────────────────── */}
      {activeTab === 'scan' && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          {/* Formulaire de scan */}
          <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Scan size={18} className="text-[#F59E0B]" />
                Vérification & Historique de maintenance du Kit
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scannez ou saisissez l'identifiant du kit pour vérifier son existence, lire son signal IoT et consulter les rapports techniques antérieurs.
              </p>
            </div>

            <form onSubmit={handleTriggerScan} className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: DJUA-KIT-001"
                value={scannedKitInput}
                onChange={(e) => setScannedKitInput(e.target.value)}
                className="flex-1 bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white uppercase placeholder-slate-500 font-mono focus:outline-none focus:border-[#F59E0B]"
                required
              />
              <button
                type="submit"
                disabled={!scannedKitInput.trim() || scanQuery.isFetching}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-600 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-none disabled:opacity-50"
              >
                {scanQuery.isFetching ? <RefreshCw size={15} className="animate-spin" /> : <Scan size={15} />}
                Vérifier
              </button>
            </form>
          </div>

          {/* Résultats de la vérification */}
          {scanQuery.isFetching && (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="animate-spin mx-auto mb-2 text-[#F59E0B]" size={22} />
              Vérification de l'équipement et recherche des maintenances antérieures…
            </div>
          )}

          {scanQuery.isError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              Erreur lors de la vérification du kit. Vérifiez votre connexion.
            </div>
          )}

          {scanQuery.isSuccess && (
            <div className="space-y-4">
              {/* Statut d'existence */}
              {scanQuery.data?.exists ? (
                <div className="bg-[#121c2e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{scanQuery.data.kit?.kitId}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                            EXISTANT & ENREGISTRÉ
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Client : {scanQuery.data.kit?.clientPhone || 'N/A'} · Offre : {scanQuery.data.kit?.offerName || 'Standard'}
                          {scanQuery.data.kit?.province && ` · ${scanQuery.data.kit?.province}`}
                        </p>
                      </div>
                    </div>

                    {/* Signal en ligne */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 ${
                        scanQuery.data.signal?.isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${scanQuery.data.signal?.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {scanQuery.data.signal?.isOnline ? 'ESP32 Connecté' : 'Signal Hors Ligne'}
                      </span>
                    </div>
                  </div>

                  {/* Métriques télémétriques temps réel */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Radio size={14} className="text-[#F59E0B]" />
                      Signaux télémétriques actuels
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Battery size={13} className="text-emerald-400" /> Tension Batterie
                        </span>
                        <p className="text-base font-bold text-white mt-1">
                          {scanQuery.data.signal?.batteryVoltage != null ? `${scanQuery.data.signal.batteryVoltage} V` : '—'}
                        </p>
                      </div>

                      <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Zap size={13} className="text-amber-400" /> Charge (SoC)
                        </span>
                        <p className="text-base font-bold text-white mt-1">
                          {scanQuery.data.signal?.socPct != null ? `${scanQuery.data.signal.socPct} %` : '—'}
                        </p>
                      </div>

                      <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Sun size={13} className="text-[#F59E0B]" /> Puissance Solaire
                        </span>
                        <p className="text-base font-bold text-white mt-1">
                          {scanQuery.data.signal?.solarPowerW != null ? `${scanQuery.data.signal.solarPowerW} W` : '—'}
                        </p>
                      </div>

                      <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Thermometer size={13} className="text-sky-400" /> Température
                        </span>
                        <p className="text-base font-bold text-white mt-1">
                          {scanQuery.data.signal?.deviceTemp != null ? `${scanQuery.data.signal.deviceTemp} °C` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── HISTORIQUE COMPLET DES MAINTENANCES SUR CE KIT ────────────── */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <FileText size={15} className="text-[#F59E0B]" />
                      Historique des maintenances & rapports des précédents techniciens ({scanQuery.data.interventions?.length || 0})
                    </h4>

                    {scanQuery.data.interventions?.length === 0 ? (
                      <div className="bg-black/20 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                        Aucune maintenance antérieure enregistrée sur ce kit. Vous êtes le premier technicien à intervenir.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {scanQuery.data.interventions.map((prevIntervention) => (
                          <div
                            key={prevIntervention._id}
                            className="bg-black/30 border border-slate-800 rounded-xl p-3 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-semibold text-slate-200">
                                {prevIntervention.title} ({prevIntervention.type || 'Maintenance'})
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                prevIntervention.status === 'Terminée'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {prevIntervention.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <span>
                                Par : <strong className="text-slate-200">{prevIntervention.assignedTo?.prenom} {prevIntervention.assignedTo?.nom}</strong>
                                {prevIntervention.assignedTo?.seniority === 'senior' && ' (Senior)'}
                              </span>
                              <span>·</span>
                              <span>{formatDate(prevIntervention.updatedAt || prevIntervention.scheduledDate)}</span>
                            </div>

                            {prevIntervention.report ? (
                              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2.5 text-slate-200 text-xs whitespace-pre-wrap">
                                <p className="font-bold text-[11px] text-emerald-400 mb-1">Rapport technique :</p>
                                {prevIntervention.report}
                              </div>
                            ) : (
                              <p className="text-slate-500 italic text-[11px]">Aucun rapport écrit n'avait été saisi.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center space-y-2">
                  <AlertTriangle size={32} className="mx-auto text-rose-400" />
                  <h3 className="text-sm font-bold text-rose-300">Kit introuvable</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Le kit <strong>{activeKitIdToScan}</strong> n'existe pas dans le registre. Vérifiez la saisie ou contactez votre Responsable Shop.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ── MODAL : RÉDIGER LE RAPPORT DE CLÔTURE ────────────────────────────── */}
      {reportingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121c2e] border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Compte-rendu de maintenance</h3>
                  <p className="text-xs text-slate-400">Kit {reportingMission.kitId}</p>
                </div>
              </div>
              <button
                onClick={() => setReportingMission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div className="text-xs text-slate-300 bg-black/30 p-2.5 rounded-lg border border-slate-800">
                <p><strong>Mission :</strong> {reportingMission.title}</p>
                {reportingMission.description && (
                  <p className="text-slate-400 mt-1"><strong>Consignes manager :</strong> {reportingMission.description}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Rapport technique d'intervention <span className="text-[#F59E0B]">*</span>
                </label>
                <textarea
                  rows={5}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Détaillez les manipulations effectuées : tension mesurée, état de la batterie, remplacement de fusible/câble, recommandations pour les prochains techniciens…"
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {reportSuccess && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> {reportSuccess}
                </p>
              )}
              {reportError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {reportError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportingMission(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addReport.isLoading || !reportText.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Send size={14} />
                  {addReport.isLoading ? 'Envoi en cours…' : 'Valider & Transmettre le rapport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
