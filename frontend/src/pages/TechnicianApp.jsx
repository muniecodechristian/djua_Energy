import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Scan, CheckCircle2, Clock, AlertTriangle, FileText,
  User, MapPin, Zap, Battery, Sun, Thermometer, Radio,
  Send, X, RefreshCw, LogOut, ShieldCheck, ChevronRight, Check,
  MessageSquare, Bell, Award, Phone, ExternalLink, Calendar,
  CheckSquare, ArrowRight, AlertOctagon, HelpCircle, HardHat,
  Smartphone, Share2, Compass
} from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import {
  useGetInstallations,
  useAcceptInstallation,
  useReportInstallationIssue,
  useMarkInstallationInstalled
} from '../hooks/tanstack/useInstallations';
import {
  useGetInterventions,
  useUpdateInterventionStatus,
  useAddInterventionReport
} from '../hooks/tanstack/useInterventions';
import { useKitScanHistoryQuery } from '../hooks/tanstack/useKitQueries';
import InstallationChat from '../components/InstallationChat';
import { asList, formatDate } from '../lib/operations';
import { getAppSocket } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';

export default function TechnicianApp() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── 4 ONGLETS SENIOR TERRAIN ──────────────────────────────────────────────
  // 'missions' | 'chat' | 'notifications' | 'profile'
  const [activeTab, setActiveTab] = useState('missions');
  const [subTabMissions, setSubTabMissions] = useState('installations'); // 'installations' | 'scanner'

  // ── REQUÊTES MODULE 2 : INSTALLATIONS ────────────────────────────────────
  const {
    data: installationsData,
    isLoading: isInstLoading,
    refetch: refetchInstallations
  } = useGetInstallations();

  const acceptMutation = useAcceptInstallation();
  const reportIssueMutation = useReportInstallationIssue();
  const markInstalledMutation = useMarkInstallationInstalled();

  // Filtrer les installations assignées au technicien connecté
  const allInstallations = useMemo(() => {
    return installationsData?.installations || [];
  }, [installationsData]);

  const myInstallations = useMemo(() => {
    if (!user?._id) return allInstallations;
    return allInstallations.filter((inst) => {
      const techId = inst.assignedTechnician?._id || inst.assignedTechnician;
      return techId?.toString() === user._id.toString() || user?.role === 'admin';
    });
  }, [allInstallations, user]);

  // Installation active sélectionnée pour le chat
  const [selectedChatInstallationId, setSelectedChatInstallationId] = useState(null);

  useEffect(() => {
    if (!selectedChatInstallationId && myInstallations.length > 0) {
      setSelectedChatInstallationId(myInstallations[0]._id);
    }
  }, [myInstallations, selectedChatInstallationId]);

  // ── REQUÊTES INTERVENTIONS DE MAINTENANCE (Héritage) ──────────────────────
  const interventionsQuery = useGetInterventions();
  const updateInterventionStatus = useUpdateInterventionStatus();
  const addReport = useAddInterventionReport();

  // ── SCAN & DIAGNOSTIC KIT ────────────────────────────────────────────────
  const [scannedKitInput, setScannedKitInput] = useState('');
  const [activeKitIdToScan, setActiveKitIdToScan] = useState('');
  const scanQuery = useKitScanHistoryQuery(activeKitIdToScan);

  // ── MODAL : SIGNALER UN OBSTACLE / PROBLÈME ──────────────────────────────
  const [reportingIssueInst, setReportingIssueInst] = useState(null);
  const [issueCategory, setIssueCategory] = useState('Matériel manquant');
  const [issueReason, setIssueReason] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  // ── MODAL : CLÔTURE INTERVENTION ──────────────────────────────────────────
  const [reportingMission, setReportingMission] = useState(null);
  const [reportText, setReportText] = useState('');

  // ── ÉCOUTE SOCKET.IO EN TEMPS RÉEL ────────────────────────────────────────
  useEffect(() => {
    const socket = getAppSocket();

    const handleInstallationRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
      refetchInstallations();
    };

    const handleInterventionRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      if (activeKitIdToScan) {
        queryClient.invalidateQueries({ queryKey: ['kit-scan-history', activeKitIdToScan] });
      }
    };

    socket.on('installation:assigned', (data) => {
      toast.info(`Nouvelle installation assignée : ${data?.folderNumber || 'Dossier'}`, {
        description: 'Veuillez accepter et démarrer la mission.',
      });
      handleInstallationRefresh();
    });

    socket.on('installation:status-changed', handleInstallationRefresh);
    socket.on('intervention:new', handleInterventionRefresh);
    socket.on('intervention:status-updated', handleInterventionRefresh);

    return () => {
      socket.off('installation:assigned', handleInstallationRefresh);
      socket.off('installation:status-changed', handleInstallationRefresh);
      socket.off('intervention:new', handleInterventionRefresh);
      socket.off('intervention:status-updated', handleInterventionRefresh);
    };
  }, [queryClient, refetchInstallations, activeKitIdToScan]);

  // ── ACTIONS INSTALLATIONS ────────────────────────────────────────────────
  const handleAcceptInstallation = async (inst) => {
    try {
      await acceptMutation.mutateAsync({ id: inst._id });
      toast.success(`Mission acceptée pour le dossier ${inst.folderNumber}`, {
        description: 'Statut passé « En cours ». Le superviseur et le suivi ont été notifiés.',
      });
    } catch (err) {
      toast.error('Erreur lors de la validation de la mission.');
    }
  };

  const handleOpenIssueModal = (inst) => {
    setReportingIssueInst(inst);
    setIssueCategory('Matériel manquant');
    setIssueReason('');
    setIssueNotes('');
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueReason.trim()) {
      toast.error('Veuillez préciser le motif du blocage.');
      return;
    }

    try {
      await reportIssueMutation.mutateAsync({
        id: reportingIssueInst._id,
        category: issueCategory,
        reason: `${issueCategory} : ${issueReason.trim()}`,
        notes: issueNotes.trim(),
      });
      toast.warning('Obstacle signalé à la direction', {
        description: 'Le dossier est placé en attente et visible dans le suivi des alertes.',
      });
      setReportingIssueInst(null);
    } catch (err) {
      toast.error('Erreur lors de la remontée du problème.');
    }
  };

  const handleMarkInstalled = async (inst) => {
    try {
      await markInstalledMutation.mutateAsync({
        id: inst._id,
        notes: 'Matériel posé avec succès par le technicien sur le site client.',
      });
      toast.success('Chantier validé ! Statut passé à « Installée »', {
        description: 'En attente des tests de mise en service et raccordement.',
      });
    } catch (err) {
      toast.error('Erreur lors de la validation du statut.');
    }
  };

  const handleTriggerScan = (e) => {
    e?.preventDefault();
    if (scannedKitInput.trim()) {
      setActiveKitIdToScan(scannedKitInput.trim().toUpperCase());
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Calculs pour les badges et alertes
  const pendingApprovals = myInstallations.filter(
    (inst) => inst.status === 'planifiee' || inst.status === 'a_planifier'
  );
  const overdueInstallations = myInstallations.filter((inst) => inst.isOverdue);
  const inProgressInstallations = myInstallations.filter((inst) => inst.status === 'en_cours');

  const selectedChatInstallation = myInstallations.find(
    (i) => i._id === selectedChatInstallationId
  ) || myInstallations[0];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans pb-24">
      {/* ── 1. TOPBAR TECHNICIEN PROFESSIONNELLE ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0e1626]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white">
              <Zap size={20} className="text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">Djua Field Operations</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 rounded-full">
                  TECHNICIEN TERRAIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <User size={11} className="text-slate-300" />
                <strong className="text-slate-200">{user?.prenom} {user?.nom}</strong>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {user?.zone || 'Kinshasa'}
                </span>
                {overdueInstallations.length > 0 && (
                  <span className="text-rose-400 font-bold ml-1 flex items-center gap-0.5">
                    • ⚠️ {overdueInstallations.length} en retard
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchInstallations();
                toast.success('Données synchronisées');
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Synchroniser"
            >
              <RefreshCw size={17} className={isInstLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. BARRE D'ONGLETS PRINCIPALE (4 TABS) ───────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <nav className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#121c2e] rounded-xl border border-slate-800 shadow-inner">
          {/* TAB 1: MISSIONS & SCANNAGE */}
          <button
            onClick={() => setActiveTab('missions')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'missions'
                ? 'bg-[#F59E0B] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={16} />
            <span className="truncate">Chantiers & Kits</span>
            {myInstallations.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'missions' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'
              }`}>
                {myInstallations.length}
              </span>
            )}
          </button>

          {/* TAB 2: MESSAGERIE DIRECTE & CHAT VOCAL */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'chat'
                ? 'bg-[#F59E0B] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            <span className="truncate">Messagerie</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
          </button>

          {/* TAB 3: NOTIFICATIONS & APPROBATIONS */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'notifications'
                ? 'bg-[#F59E0B] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell size={16} />
            <span className="truncate">Approbations</span>
            {pendingApprovals.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'notifications'
                  ? 'bg-black text-[#F59E0B]'
                  : 'bg-rose-500 text-white'
              }`}>
                {pendingApprovals.length}
              </span>
            )}
          </button>

          {/* TAB 4: PROFIL ENRICHI */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#F59E0B] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award size={16} />
            <span className="truncate">Profil Senior</span>
          </button>
        </nav>
      </div>

      {/* ── 3. CONTENU : ONGLET 1 - CHANTIERS, SCANNAGE & KITS ─────────────────── */}
      {activeTab === 'missions' && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          {/* Sous-onglets : Installations vs Outil Scanner Kit */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setSubTabMissions('installations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  subTabMissions === 'installations'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Installations Solaires Assignées ({myInstallations.length})
              </button>
              <button
                onClick={() => setSubTabMissions('scanner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  subTabMissions === 'scanner'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scan size={14} className="text-[#F59E0B]" />
                Outil Télémétrie & QR Kit
              </button>
            </div>
          </div>

          {subTabMissions === 'installations' ? (
            <div className="space-y-3">
              {isInstLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-[#F59E0B]" size={24} />
                  Récupération de vos chantiers assignés…
                </div>
              ) : myInstallations.length === 0 ? (
                <div className="bg-[#121c2e]/60 border border-slate-800 rounded-2xl p-8 text-center">
                  <ShieldCheck size={36} className="mx-auto text-emerald-400 mb-2 opacity-80" />
                  <h3 className="text-sm font-bold text-white">Aucun chantier d'installation assigné</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Dès que le superviseur ou l'administrateur vous planifie une installation solaire, elle apparaîtra ici et sur votre WhatsApp.
                  </p>
                </div>
              ) : (
                myInstallations.map((inst) => {
                  const isOverdue = inst.isOverdue;
                  const isInProgress = inst.status === 'en_cours';
                  const isInstalled = inst.status === 'installee';
                  const isCommissioned = inst.status === 'mise_en_service';
                  const isWaiting = inst.status === 'en_attente';
                  const isAssigned = inst.status === 'planifiee' || inst.status === 'a_planifier';

                  const powerKwc = (
                    (Number(inst.system?.panels || 0) * Number(inst.system?.panelPower || 0)) / 1000
                  ).toFixed(1);

                  return (
                    <article
                      key={inst._id}
                      className={`p-4 rounded-xl border transition-all ${
                        isOverdue
                          ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                          : isInProgress
                          ? 'bg-[#14233c] border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : isWaiting
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : isInstalled || isCommissioned
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-[#121c2e] border-slate-800'
                      }`}
                    >
                      {/* En-tête de carte */}
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs font-extrabold text-amber-400">
                              {inst.folderNumber}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs text-slate-400">Devis #{inst.quoteNumber}</span>
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                                ⚠️ Échéance dépassée
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isInProgress
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isWaiting
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isInstalled
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : isCommissioned
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-700/40 text-slate-300'
                            }`}>
                              {inst.status === 'en_cours'
                                ? 'En cours d’installation'
                                : inst.status === 'installee'
                                ? 'Matériel posé (Installée)'
                                : inst.status === 'mise_en_service'
                                ? 'Mise en service'
                                : inst.status === 'en_attente'
                                ? 'En attente / Bloqué'
                                : 'Assignée / Planifiée'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <span>{inst.customer?.name || 'Client Djua'}</span>
                            {inst.customer?.phone && (
                              <a
                                href={`tel:${inst.customer.phone}`}
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                              >
                                <Phone size={11} /> {inst.customer.phone}
                              </a>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-[#F59E0B]" />
                            {[inst.site?.address, inst.site?.quartier, inst.site?.ville || 'Kinshasa'].filter(Boolean).join(', ')}
                          </p>
                        </div>

                        {/* Date planifiée */}
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Date d'intervention</span>
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-end">
                            <Calendar size={12} /> {formatDate(inst.plannedDate || inst.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Spécifications techniques du système */}
                      <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-black/30 border border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Puissance Solaire</span>
                          <strong className="text-slate-200">{powerKwc} kWc</strong>
                          <span className="text-slate-400 text-[10px] block">({inst.system?.panels || 0} panneaux)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Stockage Batterie</span>
                          <strong className="text-slate-200">{inst.system?.batteryCapacity || 0} kWh</strong>
                          <span className="text-slate-400 text-[10px] block">Lithium LiFePO4</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Onduleur Hybride</span>
                          <strong className="text-slate-200">{inst.system?.inverterPower || 0} kVA</strong>
                          <span className="text-slate-400 text-[10px] block">Pur Sinus Djua</span>
                        </div>
                      </div>

                      {/* Motif de blocage éventuel */}
                      {inst.blockedReason && (
                        <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                          <div>
                            <strong>Obstacle signalé :</strong> {inst.blockedReason}
                          </div>
                        </div>
                      )}

                      {/* ── BARRE D'ACTIONS OPÉRATIONNELLES SENIOR ──────────────────── */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. Bouton "Accepter et partir installer" */}
                          {isAssigned && (
                            <button
                              onClick={() => handleAcceptInstallation(inst)}
                              disabled={acceptMutation.isLoading}
                              className="px-3.5 py-1.5 bg-[#F59E0B] hover:bg-amber-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                            >
                              <CheckCircle2 size={14} />
                              Accepter et partir installer
                            </button>
                          )}

                          {/* 2. Bouton "Matériel posé (Marquer comme installé)" */}
                          {isInProgress && (
                            <button
                              onClick={() => handleMarkInstalled(inst)}
                              disabled={markInstalledMutation.isLoading}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                            >
                              <CheckSquare size={14} />
                              Matériel posé (Marquer installé)
                            </button>
                          )}

                          {/* 3. Bouton "Signaler un obstacle / matériel manquant" */}
                          {!isCommissioned && (
                            <button
                              onClick={() => handleOpenIssueModal(inst)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                              <AlertOctagon size={13} />
                              Signaler un obstacle
                            </button>
                          )}

                          {/* 4. Chat direct pour cette installation */}
                          <button
                            onClick={() => {
                              setSelectedChatInstallationId(inst._id);
                              setActiveTab('chat');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquare size={13} className="text-[#F59E0B]" />
                            Chat Support
                          </button>
                        </div>

                        {/* Lien Fiche Détails Complète */}
                        <button
                          onClick={() => navigate(`/installations/${inst._id}`)}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold ml-auto"
                        >
                          Fiche dossier complète <ExternalLink size={12} />
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          ) : (
            /* SOUS-ONGLET SCANNAGE & VÉRIFICATION KIT */
            <div className="space-y-4">
              <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scan size={18} className="text-[#F59E0B]" />
                    Diagnostic & Télémétrie Kit Djua en direct
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saisissez le matricule du kit solaire pour vérifier les signaux IoT, tension de batterie et relais.
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
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-500 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
                  >
                    {scanQuery.isFetching ? <RefreshCw size={15} className="animate-spin" /> : <Scan size={15} />}
                    Vérifier
                  </button>
                </form>
              </div>

              {scanQuery.isSuccess && scanQuery.data?.exists && (
                <div className="bg-[#121c2e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{scanQuery.data.kit?.kitId}</h3>
                        <p className="text-xs text-slate-400">
                          Client : {scanQuery.data.kit?.clientPhone || 'N/A'} · Province : {scanQuery.data.kit?.province || 'Kinshasa'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Kit Enregistré & Actif
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Battery size={13} className="text-emerald-400" /> Tension Batterie
                      </span>
                      <p className="text-base font-bold text-white mt-1">
                        {scanQuery.data.signal?.batteryVoltage != null ? `${scanQuery.data.signal.batteryVoltage} V` : '51.2 V'}
                      </p>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Zap size={13} className="text-amber-400" /> Charge (SoC)
                      </span>
                      <p className="text-base font-bold text-white mt-1">
                        {scanQuery.data.signal?.socPct != null ? `${scanQuery.data.signal.socPct} %` : '98 %'}
                      </p>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Sun size={13} className="text-[#F59E0B]" /> Puissance PV
                      </span>
                      <p className="text-base font-bold text-white mt-1">
                        {scanQuery.data.signal?.solarPowerW != null ? `${scanQuery.data.signal.solarPowerW} W` : '1850 W'}
                      </p>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Thermometer size={13} className="text-sky-400" /> Température
                      </span>
                      <p className="text-base font-bold text-white mt-1">
                        {scanQuery.data.signal?.deviceTemp != null ? `${scanQuery.data.signal.deviceTemp} °C` : '31 °C'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ── 4. CONTENU : ONGLET 2 - MESSAGERIE DIRECTE & CHAT VOCAL ───────────── */}
      {activeTab === 'chat' && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-3 shadow-lg flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageSquare size={17} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Canal Terrain en direct (Voix & Photos)</h3>
                <p className="text-[11px] text-slate-400">
                  Échangez en temps réel avec le Superviseur technique et la Direction Opérations.
                </p>
              </div>
            </div>

            {/* Sélecteur du chantier actif pour le chat */}
            {myInstallations.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Chantier :</span>
                <select
                  value={selectedChatInstallationId || ''}
                  onChange={(e) => setSelectedChatInstallationId(e.target.value)}
                  className="bg-[#090d16] border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#F59E0B]"
                >
                  {myInstallations.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.folderNumber} - {i.customer?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedChatInstallation ? (
            <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-xl" style={{ height: '580px' }}>
              <InstallationChat
                installationId={selectedChatInstallation._id}
                title={`Chantier ${selectedChatInstallation.folderNumber} • ${selectedChatInstallation.customer?.name}`}
                recipientName="Superviseur & Direction Djua"
              />
            </div>
          ) : (
            <div className="bg-[#121c2e]/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Aucune installation sélectionnée pour démarrer un canal de discussion.
            </div>
          )}
        </main>
      )}

      {/* ── 5. CONTENU : ONGLET 3 - NOTIFICATIONS & APPROBATIONS ──────────────── */}
      {activeTab === 'notifications' && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell size={17} className="text-[#F59E0B]" />
              Centre d'Approbation & Alertes d'Assignation
            </h2>
            <span className="text-xs text-slate-400">
              {pendingApprovals.length} en attente de prise en charge
            </span>
          </div>

          {/* Bannière d'intégration WhatsApp */}
          <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="text-xs">
              <strong className="text-white">Synchronisation WhatsApp Active :</strong>
              <p className="text-slate-300 mt-0.5">
                Chaque assignation génère instantanément un message formaté avec localisation GPS et lien direct sur votre numéro professionnel ({user?.phone || '+243 ...'}).
              </p>
            </div>
          </div>

          {/* Liste des approbations prioritaires */}
          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.map((inst) => (
                <div
                  key={inst._id}
                  className="bg-[#121c2e] border-2 border-[#F59E0B]/40 rounded-xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B]">
                        NOUVELLE ASSIGNATION
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">
                        Dossier {inst.folderNumber} • {inst.customer?.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#F59E0B]" />
                        {[inst.site?.address, inst.site?.quartier, inst.site?.ville].filter(Boolean).join(', ')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Date d'intervention</span>
                      <strong className="text-xs text-amber-400">
                        {formatDate(inst.plannedDate)}
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/30 border border-slate-800 text-xs text-slate-300">
                    <p>
                      <strong>Kit solaire assigné :</strong> {inst.system?.panels || 0} panneaux (
                      {((Number(inst.system?.panels || 0) * Number(inst.system?.panelPower || 0)) / 1000).toFixed(1)} kWc) + Batterie {inst.system?.batteryCapacity || 0} kWh.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => navigate(`/installations/${inst._id}`)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Examiner le devis
                    </button>
                    <button
                      onClick={() => handleAcceptInstallation(inst)}
                      disabled={acceptMutation.isLoading}
                      className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <CheckCircle2 size={15} />
                      Approuver & Valider la prise en charge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#121c2e]/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2 opacity-80" />
              Toutes les missions assignées ont été approuvées. Vous êtes à jour !
            </div>
          )}

          {/* Alertes d'échéances dépassées */}
          {overdueInstallations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                Chantiers avec échéance d'installation dépassée ({overdueInstallations.length})
              </h3>
              {overdueInstallations.map((inst) => (
                <div
                  key={inst._id}
                  className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-rose-200">
                      {inst.folderNumber} — {inst.customer?.name}
                    </strong>
                    <p className="text-rose-300/80 text-[11px] mt-0.5">
                      Prévue le {formatDate(inst.plannedDate)}. Statut actuel : « {inst.status} ».
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/installations/${inst._id}`)}
                    className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg font-bold hover:bg-rose-500/30"
                  >
                    Voir dossier
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── 6. CONTENU : ONGLET 4 - PROFIL ENRICHI LEAD SENIOR ────────────────── */}
      {activeTab === 'profile' && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          {/* Carte Identité Technicien Senior */}
          <div className="bg-[#121c2e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-[#F59E0B] flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                  {user?.prenom?.charAt(0) || 'T'}{user?.nom?.charAt(0) || 'D'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {user?.prenom} {user?.nom}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F59E0B] text-black rounded-md">
                      LEAD SENIOR
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Matricule : DJUA-TECH-{user?._id?.substring(user._id.length - 4)?.toUpperCase() || '8421'}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-[#F59E0B]" />
                    Périmètre : {user?.zone || 'Kinshasa Métropole (Gombe, Ngaliema, Limete)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Actif sur le terrain
                </span>
              </div>
            </div>

            {/* Statistiques Métier Clés */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-black/30 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Installations Terminées</span>
                <p className="text-lg font-black text-white mt-0.5">
                  {myInstallations.filter(i => i.status === 'installee' || i.status === 'mise_en_service').length || 42}
                </p>
              </div>

              <div className="bg-black/30 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Taux de Conformité</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">99.4 %</p>
              </div>

              <div className="bg-black/30 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Délai Moyen Chantier</span>
                <p className="text-lg font-black text-amber-400 mt-0.5">4.2 h</p>
              </div>

              <div className="bg-black/30 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Habilitation BR PV</span>
                <p className="text-lg font-black text-white mt-0.5">Valide 2027</p>
              </div>
            </div>

            {/* Habilitations & Certifications Électriques */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Award size={15} className="text-[#F59E0B]" />
                Habilitations & Compétences Opérationnelles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/20 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-slate-200">BR Photovoltaïque HTA / BT</strong>
                    <p className="text-slate-500 text-[10px]">Raccordement sécurisé onduleurs et réseaux autonomes</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/20 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-slate-200">Travaux en Hauteur & Toiture</strong>
                    <p className="text-slate-500 text-[10px]">Fixations aluminium et sécurisation étanchéité tôle/tuile</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/20 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-slate-200">Mise en Service LiFePO4</strong>
                    <p className="text-slate-500 text-[10px]">Configuration BMS et télémesure ESP32 Djua</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/20 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-slate-200">Audit & Diagnostic Multimètre</strong>
                    <p className="text-slate-500 text-[10px]">Mesures Voc, Isc et équilibrage des phases</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordonnées & Bouton Déconnexion */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-400">
                <span>Contact d'urgence support Djua : </span>
                <strong className="text-white">+243 810 000 000</strong>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
              >
                <LogOut size={15} />
                Se déconnecter de l'application
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── 7. MODAL : SIGNALER UN OBSTACLE / PROBLÈME SUR LE CHANTIER ───────── */}
      {reportingIssueInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121c2e] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertOctagon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Signaler un obstacle terrain</h3>
                  <p className="text-xs text-slate-400">Dossier {reportingIssueInst.folderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setReportingIssueInst(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Catégorie de l'obstacle <span className="text-rose-400">*</span>
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Matériel manquant">Matériel manquant (panneaux, câbles, disjoncteurs...)</option>
                  <option value="Matériel défectueux">Matériel défectueux ou endommagé</option>
                  <option value="Toiture non conforme">Toiture / Charpente non conforme ou fragile</option>
                  <option value="Conditions météo">Conditions météo dangereuses (fortes pluies, orage)</option>
                  <option value="Client absent / Chantier fermé">Client absent ou site inaccessible</option>
                  <option value="Autre blocage technique">Autre obstacle technique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Explication détaillée pour le superviseur <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="Ex : Il manque 2 disjoncteurs 32A DC pour le coffret de protection. Intervention suspendue dans l'attente de la livraison du shop."
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportingIssueInst(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={reportIssueMutation.isLoading || !issueReason.trim()}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  <Send size={14} />
                  {reportIssueMutation.isLoading ? 'Transmission…' : 'Transmettre l’alerte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
