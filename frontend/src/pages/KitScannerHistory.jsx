import PageEntrance from '../components/PageEntrance';
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Scan, Search, CheckCircle2, AlertTriangle, Radio, BatteryCharging,
  Sun, Zap, ArrowUpRight, Wrench, Clock, FileText, UserCheck, ShieldAlert,
  Thermometer, Check
} from 'lucide-react';
import { useKitScanHistoryQuery } from '../hooks/tanstack/useKitQueries';
import { formatDate } from '../lib/operations';
import { ListSkeleton } from '../components/PageSkeleton';

export default function KitScannerHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKitId = searchParams.get('kitId') || '';

  const [inputKitId, setInputKitId] = useState(initialKitId);
  const [activeKitId, setActiveKitId] = useState(initialKitId);

  const { data, isLoading, isFetching, isError, refetch } = useKitScanHistoryQuery(activeKitId);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanId = inputKitId.trim().toUpperCase();
    if (cleanId) {
      setActiveKitId(cleanId);
      setSearchParams({ kitId: cleanId });
    }
  };

  const handleQuickSelect = (kitId) => {
    setInputKitId(kitId);
    setActiveKitId(kitId);
    setSearchParams({ kitId });
  };

  const kit = data?.kit;
  const signal = data?.signal;
  const interventions = data?.interventions || [];
  const activeAlerts = data?.activeAlerts || [];
  const exists = data?.exists;

  return (
    <PageEntrance className="ops-page">
      <div className="ops-page-heading">
        <div>
          <p className="ops-eyebrow">DIAGNOSTIC TERRAIN & TRANSMISSION DU SAVOIR</p>
          <h1>Scan & Historique des Équipements</h1>
          <p>Scannez un kit pour vérifier son signal IoT et consulter les rapports techniques antérieurs.</p>
        </div>
        <span className="ops-badge medium">Outil Technicien</span>
      </div>

      {/* Barre de Scan / Recherche */}
      <section className="ops-card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Scanner ou saisir le matricule (ex: KIT-GOMBE-001)..."
              value={inputKitId}
              onChange={(e) => setInputKitId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!inputKitId.trim() || isFetching}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-semibold rounded-xl text-sm transition-colors"
          >
            <Search size={16} />
            {isFetching ? 'Vérification...' : 'Vérifier le kit'}
          </button>
        </form>

        {/* Suggestion d'accès rapide */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>Kits d'exemple :</span>
          {['KIT-GOMBE-001', 'KIT-LIMETE-001', 'KIT-001'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleQuickSelect(id)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      </section>

      {/* État de chargement */}
      {isLoading && (
        <div className="space-y-4">
          <ListSkeleton />
        </div>
      )}

      {/* Résultat si kit inconnu */}
      {!isLoading && activeKitId && data && !exists && (
        <div className="ops-card border-red-500/30 bg-red-500/5 text-center py-10 space-y-3">
          <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-bold text-white">Kit non répertorié : {activeKitId}</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Ce matricule n'existe pas encore dans la base de données de supervision. S'il s'agit d'une nouvelle installation, vous pouvez procéder à son enregistrement dans le parc.
          </p>
          <div className="pt-2">
            <Link to="/parc" className="ops-button primary inline-flex">
              Accéder à l'inventaire du parc
            </Link>
          </div>
        </div>
      )}

      {/* Fiche complète du Kit scanné */}
      {!isLoading && activeKitId && data && exists && (
        <div className="space-y-6">
          {/* En-tête de Statut et Signal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Carte 1 : Existence & Identification */}
            <div className="ops-card bg-slate-800/80 border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 size={16} /> Kit vérifié & actif
              </div>
              <h2 className="text-xl font-bold text-white font-mono">{kit.kitId}</h2>
              <dl className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Zone :</dt>
                  <dd className="font-semibold text-white">{kit.zone || 'Non assignée'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Offre :</dt>
                  <dd>{kit.offerName || 'Standard'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Client :</dt>
                  <dd className="font-mono">{kit.clientPhone || '—'}</dd>
                </div>
              </dl>
            </div>

            {/* Carte 2 : État du Signal IoT */}
            <div className={`ops-card ${signal?.isOnline ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${signal?.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <Radio size={16} className={signal?.isOnline ? 'animate-pulse' : ''} />
                  {signal?.isOnline ? 'Signal ESP32 actif' : 'Signal silencieux'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {signal?.lastSeen ? formatDate(signal.lastSeen) : 'Aucun signal récent'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {signal?.isOnline
                  ? 'L’ESP32 transmet les télémétries en temps réel. Les capteurs de tension et courant sont opérationnels.'
                  : 'Le kit n’a pas émis récemment. Vérifiez l’alimentation du boîtier de monitoring ou la couverture GSM.'}
              </p>
            </div>

            {/* Carte 3 : Action Rapide Intervention */}
            <div className="ops-card bg-slate-800/80 border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Action terrain</span>
                <p className="text-xs text-slate-300 mt-1">
                  Besoin d'intervenir sur ce kit ? Préparez une intervention de maintenance en charge.
                </p>
              </div>
              <Link
                to={`/InterventionWizard?kitId=${encodeURIComponent(kit.kitId)}`}
                className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-semibold rounded-lg text-xs transition-colors"
              >
                <Wrench size={14} /> Planifier maintenance sur ce kit
              </Link>
            </div>
          </div>

          {/* Métriques télémétrie en direct */}
          {signal && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="ops-card p-3 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <BatteryCharging size={14} className="text-emerald-400" /> Tension Batterie
                </span>
                <p className="text-lg font-bold text-white font-mono">
                  {signal.batteryVoltage != null ? `${signal.batteryVoltage} V` : '—'}
                </p>
              </div>

              <div className="ops-card p-3 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <Zap size={14} className="text-amber-400" /> Charge (SoC)
                </span>
                <p className="text-lg font-bold text-white font-mono">
                  {signal.socPct != null ? `${signal.socPct} %` : '—'}
                </p>
              </div>

              <div className="ops-card p-3 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <Sun size={14} className="text-yellow-400" /> Puissance Solaire
                </span>
                <p className="text-lg font-bold text-white font-mono">
                  {signal.solarPowerW != null ? `${signal.solarPowerW} W` : '—'}
                </p>
              </div>

              <div className="ops-card p-3 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <Radio size={14} className="text-blue-400" /> Charge Utilisée
                </span>
                <p className="text-lg font-bold text-white font-mono">
                  {signal.loadPowerW != null ? `${signal.loadPowerW} W` : '—'}
                </p>
              </div>

              <div className="ops-card p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <Thermometer size={14} className="text-amber-400" /> Température
                </span>
                <p className="text-lg font-bold text-white font-mono">
                  {signal.deviceTemp != null ? `${signal.deviceTemp} °C` : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Alertes actives sur le kit */}
          {activeAlerts.length > 0 && (
            <div className="ops-card border-red-500/30 bg-red-500/10 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <ShieldAlert size={18} /> {activeAlerts.length} alerte(s) active(s) nécessitant une attention
              </div>
              <div className="space-y-2 mt-2">
                {activeAlerts.map((a) => (
                  <div key={a._id} className="text-xs text-slate-200 bg-black/30 p-2.5 rounded-lg border border-red-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-red-300">[{a.severity?.toUpperCase()}] {a.label}</span>
                      <p className="text-slate-400 mt-0.5">{a.description}</p>
                    </div>
                    {a.assignedTo && (
                      <span className="text-[11px] text-slate-300 bg-slate-800 px-2 py-1 rounded">
                        Assignée à: {a.assignedTo.prenom} {a.assignedTo.nom}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRANSMISSION DU SAVOIR : HISTORIQUE DES INTERVENTIONS ET RAPPORTS */}
          <section className="ops-card space-y-4">
            <div className="ops-card-heading border-b border-slate-800 pb-3">
              <div>
                <h2>Historique technique & Rapports des techniciens</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consultez les diagnostics et réparations antérieures rédigés par les autres techniciens pour orienter votre intervention.
                </p>
              </div>
              <span className="ops-badge info">
                {interventions.length} intervention(s) répertoriée(s)
              </span>
            </div>

            {interventions.length === 0 ? (
              <div className="ops-empty py-8 text-center text-slate-400 text-sm">
                <FileText size={28} className="mx-auto mb-2 opacity-40" />
                <p>Aucune intervention antérieure enregistrée sur ce kit.</p>
                <p className="text-xs text-slate-500 mt-1">Vous êtes le premier technicien à intervenir sur cet équipement.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interventions.map((item, index) => {
                  const tech = item.assignedTo;
                  const isDone = item.status === 'Terminée';

                  return (
                    <div
                      key={item._id}
                      className={`p-4 rounded-xl border ${isDone ? 'border-slate-700 bg-slate-900/60' : 'border-amber-500/30 bg-amber-500/5'} space-y-3`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`ops-badge ${isDone ? 'success' : 'medium'}`}>
                              {item.status}
                            </span>
                            <span className="text-xs font-semibold text-[#F59E0B] uppercase">
                              {item.type || 'Maintenance'}
                            </span>
                            <span className="text-xs text-slate-400">· Priorité : {item.priority}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <div>Date : {formatDate(item.completedAt || item.scheduledDate || item.createdAt)}</div>
                          {item.createdBy && <div>Par Shop Manager : {item.createdBy.prenom} {item.createdBy.nom}</div>}
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-300 bg-black/20 p-2.5 rounded-lg border border-white/5">
                          <span className="font-semibold text-slate-400">Consignes initiales : </span>
                          {item.description}
                        </p>
                      )}

                      {/* COMPTE-RENDU TECHNIQUE DÉTAILLÉ */}
                      {item.report ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              <FileText size={14} /> Compte-rendu du technicien ({tech?.prenom ? `${tech.prenom} ${tech.nom}` : 'Technicien assigné'}) :
                            </span>
                            {tech?.seniority === 'senior' && (
                              <span className="text-[#F59E0B] bg-[var(--ops-canvas)] px-2 py-0.5 rounded text-[10px]">
                                ★ Technicien Senior
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                            {item.report}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-800/40 p-2 rounded text-xs text-slate-400 italic">
                          Intervention en cours ou aucun rapport consigné pour cette étape.
                        </div>
                      )}

                      {/* Signature du technicien */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <UserCheck size={14} className="text-[#F59E0B]" />
                          Technicien intervenant : <strong className="text-slate-200">{tech?.prenom ? `${tech.prenom} ${tech.nom}` : 'Assigné'}</strong>
                          {tech?.zone && <span>(Zone: {tech.zone})</span>}
                        </span>
                        <span>Réf: {item._id?.slice(-6)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </PageEntrance>
  );
}
