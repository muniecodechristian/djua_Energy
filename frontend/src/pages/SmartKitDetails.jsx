import './SmartKitDetails.css';
import PageEntrance from '../components/PageEntrance';
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { AlertTriangle, CheckCircle2, MapPin, MessageCircle, Radio, Sun, X, Zap } from 'lucide-react';
import { useKitLiveTelemetry } from '../hooks/tanstack/useKitLiveTelemetry.js';
import { useAlertsQuery, useKitsQuery, useKitTelemetrySummaryQuery } from '../hooks/tanstack/useKitQueries.js';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { predictionMatchesKit } from '../lib/operations';
import { getTelemetryMetrics } from '../lib/telemetryMetrics';
import { useCreateIntervention, useTeamTechnicians } from '../hooks/tanstack/useInterventions.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
const KitExplorer = lazy(() => import('../components/KitExplorer'));


/* ------------------------------------------------------------------
   Design tokens
   - Neutres : viennent de vos variables CSS (--panel, --panel-border...)
   - Ambre : SEULE couleur de marque (#F59E0B, ambre Djua)
   - Vert / rouge / ambre : réservés aux ÉTATS (ok / alerte / attention)
------------------------------------------------------------------- */
const ORANGE = '#F59E0B';
const SURFACE = 'bg-[var(--panel)] border border-[var(--panel-border)]';
const MUTED = 'text-[var(--muted-foreground)]';
const FG = 'text-[var(--app-foreground)]';
const SUBTLE = 'bg-[var(--panel-alt)]';
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]';

const TONES = {
  ok: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  bad: 'bg-red-500/10 text-red-600 dark:text-red-400',
  off: `${SUBTLE} ${MUTED}`,
  brand: 'bg-[var(--ops-canvas)] text-[#C2410C] dark:text-[#FF9A3D]',
};

/* ------------------------------ Utils ------------------------------ */
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
    <span style="position:absolute;height:100%;width:100%;border-radius:50%;background:rgba(245,158,11,0.35);animation:kit-ping 1.6s cubic-bezier(0,0,.2,1) infinite;"></span>
    <span style="position:relative;border-radius:50%;width:14px;height:14px;background:${ORANGE};border:2.5px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);"></span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const parseDateString = (v) => {
  if (!v) return null;
  let d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  d = new Date(Number(v) * 1000);
  if (!isNaN(d.getTime())) return d;
  d = new Date(Number(v));
  return isNaN(d.getTime()) ? null : d;
};

const fmt = (value, unit = '') => {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'number') return `${Number(value.toFixed(2))}${unit}`;
  return `${value}${unit}`;
};

const flattenRawTelemetry = (snapshot) => snapshot ? ({
  event_time: snapshot.meta?.event_time || snapshot.createdAt,
  device_id: snapshot.deviceId,
  solar_power_w: snapshot.solar?.power_w,
  solar_voltage_v: snapshot.solar?.voltage_v,
  solar_current_a: snapshot.solar?.current_a,
  energy_generated_wh: snapshot.solar?.energy_interval_wh,
  solar_error_code: snapshot.solar?.error_code,
  battery_voltage_v: snapshot.battery?.voltage_v,
  battery_current_a: snapshot.battery?.current_a,
  battery_power_w: snapshot.battery?.power_w,
  state_of_charge_pct: snapshot.battery?.state_of_charge_pct,
  state_of_health_pct: snapshot.battery?.state_of_health_pct,
  battery_error_code: snapshot.battery?.error_code,
  load_power_w: snapshot.dc_load?.power_w,
  load_voltage_v: snapshot.dc_load?.voltage_v,
  load_current_a: snapshot.dc_load?.current_a,
  load_energy_interval_wh: snapshot.dc_load?.energy_interval_wh,
  overload_detected: snapshot.dc_load?.overload_detected,
  ac_load_voltage_v: snapshot.ac_load?.voltage_v,
  ac_load_current_a: snapshot.ac_load?.current_a,
  ac_apparent_power_va: snapshot.ac_load?.apparent_power_va,
  latitude: snapshot.gpsCoordinates?.latitude,
  longitude: snapshot.gpsCoordinates?.longitude,
  signal_strength_dbm: snapshot.environment?.signal_strength_dbm,
  device_temperature_c: snapshot.environment?.device_temperature_c,
  ambient_temperature_c: snapshot.environment?.ambient_temperature_c,
  humidity_pct: snapshot.environment?.humidity_pct,
  message_id: snapshot.meta?.message_id,
  sequence_number: snapshot.meta?.sequence_number,
  firmware_version: snapshot.extraData?.firmware_version || snapshot.extraData?.firmwareVersion,
  device_model: snapshot.extraData?.device_model || snapshot.extraData?.model,
  serial_number: snapshot.extraData?.serial_number || snapshot.extraData?.serialNumber,
}) : null;

const formatDate = (value) => {
  const date = parseDateString(value);
  return date ? date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Non renseigné';
};

const distanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hasValidGps = (latitude, longitude) => {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') return false;
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    && !(lat === 0 && lon === 0);
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  }, [center, map]);
  return null;
};

/* ---------------------------- Primitives ---------------------------- */
const Card = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`kit-card ${SURFACE} rounded-lg p-5 ${className}`}>
    {(title || action) && (
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className={`text-sm font-semibold ${FG}`}>{title}</h2>
          {subtitle && <p className={`mt-0.5 text-xs ${MUTED}`}>{subtitle}</p>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);

const Pill = ({ tone = 'off', dot = false, pulse = false, children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}>
    {dot && <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />}
    {children}
  </span>
);

const Meter = ({ value, max = 100, warnBelow, className = '' }) => {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100));
  const low = warnBelow != null && value != null && value < warnBelow;
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${SUBTLE} ${className}`} role="presentation">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${pct}%`, background: low ? '#DC2626' : ORANGE }}
      />
    </div>
  );
};

/* Ligne label / valeur : remplace 12 cartes identiques */
const Row = ({ label, value, meter, status }) => (
  <div className="py-2.5">
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${MUTED}`}>{label}</span>
      {status || <span className={`text-sm font-medium tabular-nums ${FG}`}>{value}</span>}
    </div>
    {meter && <Meter {...meter} className="mt-2" />}
  </div>
);
const RowList = ({ children }) => <div className="divide-y divide-[var(--panel-border)]">{children}</div>;

/* Un seul graphique, une seule unité, un choix de mesure */
const TrendChart = ({ data, options, height = 256 }) => {
  const availableOptions = options.length ? options : [{ key: 'unavailable', label: 'Mesure indisponible', unit: '' }];
  const [key, setKey] = useState(availableOptions[0].key);
  const cur = availableOptions.find((o) => o.key === key) || availableOptions[0];
  const hasData = data.some((d) => d[cur.key] != null);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Mesure affichée">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setKey(o.key)}
            aria-pressed={key === o.key}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS} ${key === o.key
              ? 'border-[#F59E0B] bg-[var(--ops-canvas)] text-[var(--app-foreground)]'
              : `border-[var(--panel-border)] ${MUTED} hover:text-[var(--app-foreground)]`}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div style={{ height }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${cur.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--panel-border)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} minTickGap={32} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={44} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v) => [`${fmt(v)} ${cur.unit}`, cur.label]}
                contentStyle={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: 8, fontSize: 12, color: 'var(--app-foreground)' }}
              />
              <Area type="monotone" dataKey={cur.key} stroke={ORANGE} strokeWidth={2} fill={`url(#fill-${cur.key})`} dot={false} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex h-full items-center justify-center rounded-md ${SUBTLE} text-sm ${MUTED}`}>
            Pas encore de relevés pour cette mesure.
          </div>
        )}
      </div>
    </div>
  );
};

const SignalBars = ({ dbm }) => {
  const strength = dbm >= -50 ? 4 : dbm >= -65 ? 3 : dbm >= -80 ? 2 : 1;
  return (
    <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4].map((b) => (
        <div key={b} className="w-1.5 rounded-sm" style={{ height: `${b * 25}%`, background: b <= strength ? ORANGE : 'var(--panel-border)' }} />
      ))}
    </div>
  );
};

/* ----------------------------- Chargement ---------------------------- */
const LoadingScreen = ({ kitId }) => (
  <div className="min-h-screen bg-[var(--app-surface)]" aria-busy="true">
    <header className={`${SURFACE} border-x-0 border-t-0 px-5 py-4`}>
      <div className="mx-auto max-w-screen-2xl">
        <h1 className={`text-lg font-semibold ${FG}`}>{kitId || 'Équipement non sélectionné'}</h1>
        <p className={`mt-1 text-sm ${MUTED}`}>Connexion au kit en cours…</p>
      </div>
    </header>
    <main className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-3 px-5 py-6 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`${SURFACE} h-40 animate-pulse rounded-lg`} />
      ))}
    </main>
  </div>
);

/* --------------------------- Prédiction IA --------------------------- */
const PRIORITY = {
  critical: { label: 'Critique', tone: 'bad' },
  high: { label: 'Élevée', tone: 'bad' },
  medium: { label: 'Modérée', tone: 'warn' },
  low: { label: 'Faible', tone: 'ok' },
  none: { label: 'Aucune alerte', tone: 'off' },
};

const ALERT_TYPE_LABELS = {
  battery_degradation: 'Dégradation de la batterie',
  anomalous_consumption: 'Consommation anormale',
  temp_warning: 'Avertissement température',
  overheating: 'Surchauffe du boîtier',
  grid_instability: 'Instabilité du réseau',
  low_battery: 'Batterie faible',
  critical_battery: 'Batterie critique',
  solar_underperformance: 'Production solaire faible',
  geofence_exit: 'Sortie de zone',
  system_normal: 'Système normal',
  normal: 'Normal',
  none: 'Aucune',
};

const formatAlertType = (type) => {
  if (!type) return 'Aucune';
  const key = String(type).toLowerCase();
  if (ALERT_TYPE_LABELS[key]) return ALERT_TYPE_LABELS[key];
  const s = key.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const translateAlertTitle = (title, priority) => {
  if (!title) return priority === 'none' ? 'Situation normale, aucune alerte détectée' : 'Alerte de fonctionnement détectée';
  const l = title.toLowerCase();
  if (l.includes('battery degradation')) return 'Dégradation de la batterie détectée';
  if (l.includes('anomalous consumption')) return 'Consommation électrique anormale';
  if (l.includes('overheating')) return 'Surchauffe du boîtier';
  if (l.includes('grid instability')) return 'Instabilité du réseau électrique';
  if (l.includes('low battery')) return 'Niveau de batterie bas';
  return title;
};

const STATUS_LABELS = {
  ok: 'Données enregistrées',
  no_new_records: 'Aucun nouvel enregistrement',
  quarantined: 'Données mises en quarantaine',
  error: 'Erreur de traitement',
};

const RISK_SCALE = {
  critical: 95, high: 85, medium: 50, low: 20, none: 5,
};
const RISKS = [
  {
    label: 'Maintenance',
    field: 'maintenance_priority',
    text: {
      critical: 'Intervention urgente recommandée. Composants fortement dégradés.',
      high: 'Intervention recommandée à court terme. Anomalies matérielles détectées.',
      medium: 'Usure anormale. À vérifier lors de la prochaine visite.',
      low: 'Légère dérive des paramètres de santé. Comportement globalement normal.',
      none: 'Matériel en bon état. Aucune maintenance nécessaire.',
    },
  },
  {
    label: 'Sécurité',
    field: 'security_priority',
    text: {
      critical: 'Risque immédiat de dommage matériel (surchauffe, surcharge).',
      high: 'Comportement très anormal pouvant mener à une défaillance.',
      medium: 'Comportement suspect ou limites d’utilisation approchées.',
      low: 'Quelques mesures proches des limites, mais sans danger.',
      none: 'Aucun comportement à risque détecté.',
    },
  },
  {
    label: 'Alerte globale',
    field: 'priority',
    text: {
      critical: 'Situation critique : prise en charge immédiate par le support.',
      high: 'Problème sévère. Une action rapide évitera la panne.',
      medium: 'Anomalie modérée. Un technicien ou un agent devrait vérifier.',
      low: 'Alerte mineure ou fluctuation temporaire. À surveiller.',
      none: 'Kit sain et autonome.',
    },
  },
];

function PredictionIATab({ kitId }) {
  const [prediction, setPrediction] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const serverUrl = api.defaults.baseURL;

  useEffect(() => {
    const socket = io(serverUrl, { withCredentials: true, transports: ['websocket', 'polling'] });
    setPrediction(null);
    setLastUpdate(null);
    socket.on('prediction:update', ({ result, timestamp, kitId: eventKitId }) => {
      if (!predictionMatchesKit({ kitId: eventKitId, result }, kitId)) return;
      setPrediction(result);
      setLastUpdate(timestamp);
    });
    return () => { socket.off('prediction:update'); socket.disconnect(); };
  }, [serverUrl, kitId]);

  const alert = prediction?.alert || null;
  const priority = PRIORITY[alert?.priority] ? alert.priority : 'none';
  const cfg = PRIORITY[priority];

  return (
    <div className="space-y-4">
      <Card
        title="Analyse prédictive"
        subtitle={prediction
          ? `Dernier résultat reçu à ${lastUpdate ? new Date(lastUpdate).toLocaleTimeString('fr-FR') : '—'}`
          : 'Aucun résultat reçu pour cet équipement pendant cette session.'}
        action={<Pill tone={prediction ? 'brand' : 'off'} dot pulse={!!prediction}>{prediction ? 'Résultat reçu' : 'En attente'}</Pill>}
      >
        {!prediction && (
          <p className={`max-w-xl text-sm ${MUTED}`}>
            Les résultats s’affichent dès qu’une analyse de cet équipement est reçue. L’absence de résultat ne permet pas de conclure à l’absence de risque.
          </p>
        )}
      </Card>

      {prediction && (
        <>
          <Card>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 rounded-md p-2 ${TONES[cfg.tone]}`}>
                {priority === 'none' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={cfg.tone}>Priorité : {cfg.label}</Pill>
                  {alert?.type && <span className={`text-xs ${MUTED}`}>{formatAlertType(alert.type)}</span>}
                </div>
                <p className={`mt-2 text-base font-semibold ${FG}`}>{translateAlertTitle(alert?.title, priority)}</p>
                {alert?.message && <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${MUTED}`}>{alert.message}</p>}
                {alert?.recommended_action && (
                  <div className={`mt-4 rounded-md border-l-2 border-l-[#F59E0B] ${SUBTLE} p-3 text-sm ${FG}`}>
                    <span className="font-semibold">À faire : </span>{alert.recommended_action}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Traitement">
              <RowList>
                <Row label="Statut" value={STATUS_LABELS[prediction.status] || prediction.status || '—'} />
                <Row label="Priorité" value={cfg.label} />
                <Row label="Type d’alerte" value={formatAlertType(alert?.type)} />
                <Row label="Appareil ciblé" value={alert?.device_id || '—'} />
                {alert?.confidence != null && <Row label="Fiabilité de la prédiction" value={`${Math.round(alert.confidence * 100)} %`} />}
              </RowList>
            </Card>

            <Card title="Niveaux de risque" subtitle="Estimés par le modèle">
              {!alert ? (
                <p className={`text-sm ${MUTED}`}>Le modèle n’a pas encore analysé d’enregistrement.</p>
              ) : (
                <div className="space-y-4">
                  {RISKS.map(({ label, field, text }) => {
                    const level = RISK_SCALE[alert[field]] != null ? alert[field] : 'none';
                    return (
                      <div key={label}>
                        <div className="flex items-baseline justify-between">
                          <span className={`text-sm font-medium ${FG}`}>{label}</span>
                          <span className={`text-sm tabular-nums ${MUTED}`}>{RISK_SCALE[level]} %</span>
                        </div>
                        <Meter value={RISK_SCALE[level]} className="mt-1.5" />
                        <p className={`mt-1.5 text-xs leading-relaxed ${MUTED}`}>{text[level]}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ Page principale ============================ */
const TAB_IDS = { synthese: 'Synthèse', solaire: 'Énergie solaire', env: 'Environnement', gps: 'Réseau et GPS', ia: 'Prédiction IA' };

export default function SmartKitDetails() {
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kitId');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'ai' ? 'ia' : 'synthese');
  const [toast, setToast] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [liveGeofenceAlert, setLiveGeofenceAlert] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [interventionForm, setInterventionForm] = useState({ title: '', description: '', priority: 'Moyenne', assignedTo: '' });

  const { telemetryRecords, latestTelemetry, isLive, isLoading } = useKitLiveTelemetry(kitId);
  const telemetrySummary = useKitTelemetrySummaryQuery(kitId);
  const { data: kits = [] } = useKitsQuery();
  const { data: alerts = [] } = useAlertsQuery();
  const createIntervention = useCreateIntervention();
const technicians = useTeamTechnicians();
  const kitReference = kits.find((kit) => kit.kitId === kitId);

  const rawSnapshot = telemetrySummary.data?.latest || null;
  const T = isLive
    ? latestTelemetry
    : telemetrySummary.data
      ? flattenRawTelemetry(rawSnapshot)
      : latestTelemetry;
  const history30d = telemetrySummary.data?.history30d;

  useEffect(() => {
    if (!isLoading) { setIsChecking(false); return; }
    const timer = setTimeout(() => setIsChecking(false), 3500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    const existing = (Array.isArray(alerts) ? alerts : []).find(
      (a) => a.kitId === kitId && a.type === 'geofence_exit' && a.status === 'active'
        && hasValidGps(a.metadata?.currentPosition?.latitude, a.metadata?.currentPosition?.longitude)
    );
    setLiveGeofenceAlert(existing || null);
  }, [alerts, kitId]);

  useEffect(() => {
    const socket = io(api.defaults.baseURL, { withCredentials: true, transports: ['websocket', 'polling'] });
    socket.on('geofence_alert', (a) => {
      if (a?.kitId === kitId && hasValidGps(a.metadata?.currentPosition?.latitude, a.metadata?.currentPosition?.longitude)) {
        setLiveGeofenceAlert(a);
      }
    });
    socket.on('geofence_resolved', ({ kitId: id }) => { if (id === kitId) setLiveGeofenceAlert(null); });
    return () => { socket.off('geofence_alert'); socket.off('geofence_resolved'); socket.disconnect(); };
  }, [kitId]);

  const hasTelemetryGps = hasValidGps(T?.latitude, T?.longitude);
  const lat = hasTelemetryGps ? Number(T.latitude) : Number(kitReference?.gpsCoordinates?.latitude ?? 0);
  const lng = hasTelemetryGps ? Number(T.longitude) : Number(kitReference?.gpsCoordinates?.longitude ?? 0);
  const refLat = kitReference?.gpsCoordinates?.latitude == null ? NaN : Number(kitReference.gpsCoordinates.latitude);
  const refLng = kitReference?.gpsCoordinates?.longitude == null ? NaN : Number(kitReference.gpsCoordinates.longitude);
  const hasReferenceGps = hasValidGps(refLat, refLng);
  const currentDistance = hasReferenceGps && hasTelemetryGps ? distanceInMeters(refLat, refLng, lat, lng) : null;
  const isOutsideGeofence = Boolean(liveGeofenceAlert) || (currentDistance != null && currentDistance > 90);
  const snapshotTime = telemetrySummary.data?.communication?.lastSeen || rawSnapshot?.createdAt || T?.event_time || null;
  const communicationIsRecent = isLive || Boolean(telemetrySummary.data?.communication?.isRecent);
  const communicationStatus = communicationIsRecent
    ? 'Active'
    : snapshotTime ? 'Inactive' : 'Aucune donnée';
  const currentConsumption = T?.load_power_w != null
    ? { value: T.load_power_w, unit: 'W' }
    : T?.ac_apparent_power_va != null
      ? { value: T.ac_apparent_power_va, unit: 'VA' }
      : null;
  const averageConsumption = history30d?.averageDcLoadPowerW != null
    ? { value: history30d.averageDcLoadPowerW, unit: 'W' }
    : history30d?.averageAcLoadApparentPowerVa != null
      ? { value: history30d.averageAcLoadApparentPowerVa, unit: 'VA' }
      : null;
  const referenceLocation = kitReference?.zone || telemetrySummary.data?.kit?.zone || 'Non renseignée';
  const gpsStatus = isOutsideGeofence
    ? 'Hors périmètre'
    : hasTelemetryGps
      ? hasReferenceGps ? 'Confirmée' : 'Reçue'
      : 'Non disponible';
  const kitAlerts = (Array.isArray(alerts) ? alerts : []).filter(
    (alert) => alert.kitId === kitId && ['active', 'acknowledged'].includes(alert.status),
  );
  const hasDiagnosticData = [
    T?.solar_power_w,
    T?.solar_voltage_v,
    T?.battery_voltage_v,
    T?.battery_power_w,
    T?.load_power_w,
    T?.ac_apparent_power_va,
  ].some((value) => value != null);

  const recentRecords = telemetryRecords.slice(-24);
  const chartOptionsByPath = new Map();
  const chartData = recentRecords.map((record, index) => {
    const date = parseDateString(record.event_time || record.timestamp || record.gateway_received_at);
    const row = {
      time: date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : `#${index + 1}`,
    };
    for (const metric of getTelemetryMetrics(record)) {
      if (typeof metric.value !== 'number' || !Number.isFinite(metric.value)) continue;
      chartOptionsByPath.set(metric.path, metric);
      row[metric.chartKey] = metric.value;
    }
    return row;
  });
  const chartOptions = [...chartOptionsByPath.values()].map((metric) => ({
    key: metric.chartKey,
    label: `${metric.group} · ${metric.label}`,
    unit: metric.unit,
  }));
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* Problèmes à signaler en haut de page */
  const issues = [];
  if (isOutsideGeofence) issues.push(`Le kit est sorti de son périmètre${currentDistance != null ? ` (${Math.round(currentDistance)} m)` : ''}.`);
  if (T?.overload_detected) issues.push('Surcharge détectée.');
  if (T?.abnormal_consumption_detected) issues.push('Consommation anormale détectée.');
  if (T?.battery_error_code && T.battery_error_code !== 'NONE') issues.push(`Erreur batterie : ${T.battery_error_code}.`);
  if (T?.solar_error_code && T.solar_error_code !== 'NONE') issues.push(`Erreur panneau : ${T.solar_error_code}.`);
  const technicalStatus = !T
    ? 'Non disponible'
    : !hasDiagnosticData
      ? 'Données insuffisantes'
      : issues.length || kitAlerts.length
      ? 'À surveiller'
      : 'Aucune anomalie détectée';
  const openKitAiChat = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat', {
      detail: {
        message: 'Fais le point sur l’état actuel de mon kit et explique les mesures ou alertes qui nécessitent mon attention.',
        context: {
          scope: 'kit_status',
          kit: {
            kitId,
            deviceId: T?.device_id || kitReference?.deviceId || null,
            model: T?.device_model || null,
            firmwareVersion: T?.firmware_version || null,
            zone: referenceLocation,
            technicalStatus,
            communicationStatus,
            isLive,
            lastTelemetryAt: snapshotTime,
            productionLast30DaysKwh: history30d?.productionKwh ?? null,
            solarPowerW: T?.solar_power_w ?? null,
            solarVoltageV: T?.solar_voltage_v ?? null,
            solarCurrentA: T?.solar_current_a ?? null,
            batteryChargePercent: T?.state_of_charge_pct ?? null,
            batteryVoltageV: T?.battery_voltage_v ?? null,
            batteryCurrentA: T?.battery_current_a ?? null,
            batteryPowerW: T?.battery_power_w ?? null,
            currentConsumption: currentConsumption,
            averageConsumption30Days: averageConsumption,
            signalStrengthDbm: T?.signal_strength_dbm ?? null,
            deviceTemperatureC: T?.device_temperature_c ?? null,
            gpsStatus,
            alerts: [
              ...issues,
              ...kitAlerts.map((alert) => alert.title || alert.message || alert.type || 'Alerte active'),
            ],
          },
        },
      },
    }));
  };

  if (isChecking) return <LoadingScreen kitId={kitId} />;

  const rssi = T?.signal_strength_dbm;

  const handleCreateIntervention = (e) => {
    e.preventDefault();
    createIntervention.mutate({
      kitId,
      ...interventionForm,
      ...(interventionForm.assignedTo ? { assignedTo: interventionForm.assignedTo } : {}),
    }, {
      onSuccess: (data) => {
        const whatsapp = data?.data;
        showToast(
          whatsapp?.whatsappSent
            ? 'Intervention créée et message WhatsApp envoyé au technicien.'
            : `Intervention créée, mais WhatsApp n’a pas été envoyé${whatsapp?.whatsappError ? ` : ${whatsapp.whatsappError}` : '.'}`,
        );
        setIsModalOpen(false);
        setInterventionForm({ title: '', description: '', priority: 'Moyenne', assignedTo: '' });
      },
      onError: () => {
        showToast('Erreur lors de la création de l\'intervention');
      }
    });
  };

  return (
    <PageEntrance className="kit-detail-page font-sans">
      <style>{`
        .dark .map-tiles-dark { filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(92%) saturate(0.85); }
        .leaflet-container { background: var(--panel-alt) !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes kit-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none !important; } }
      `}</style>

      {/* Confirmation */}
      <div aria-live="polite" className="pointer-events-none fixed right-5 top-5 z-50">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`${SURFACE} flex items-center gap-2 rounded-md px-4 py-3 text-sm shadow-lg`}
            >
              <CheckCircle2 size={16} className="text-emerald-500" /> {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* En-tête */}
      <header className={`sticky top-0 z-40 ${SURFACE} border-x-0 border-t-0`}>
        <div className="mx-auto max-w-screen-2xl px-5 pt-4">
          <Link to="/parc" className="kit-breadcrumb">← Retour au parc</Link>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight">{kitId || 'Équipement non sélectionné'}</h1>
                <Pill tone={communicationIsRecent ? 'ok' : 'off'} dot>
                  {isLive ? 'Connexion en direct' : communicationIsRecent ? 'Données récentes' : 'Sans signal récent'}
                </Pill>
                {isOutsideGeofence && <Pill tone="bad">Hors périmètre</Pill>}
              </div>
              <p className={`mt-1 text-sm ${MUTED}`}>
                {isLive ? 'Mesures actualisées automatiquement'
                  : snapshotTime ? `Dernières mesures reçues : ${formatDate(snapshotTime)}` : 'Aucune mesure reçue pour ce kit'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openKitAiChat}
                className={`kit-secondary-action ${FOCUS}`}
              >
                <MessageCircle size={15} className="mr-1.5 inline" />
                Causer avec l’IA pour ce kit
              </button>
              <button
                type="button" onClick={() => setActiveTab('ia')}
                className={`kit-secondary-action ${FOCUS}`}
              >
                Consulter le diagnostic
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={`kit-action ${FOCUS}`}
              >
                Créer une intervention
              </button>
            </div>
          </div>

          <nav className="hide-scrollbar -mb-px mt-4 flex gap-6 overflow-x-auto" role="tablist" aria-label="Sections du kit">
            {Object.entries(TAB_IDS).map(([id, label]) => (
              <button
                key={id} type="button" role="tab" aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${FOCUS} ${activeTab === id
                  ? 'border-[#F59E0B] text-[var(--app-foreground)]'
                  : `border-transparent ${MUTED} hover:text-[var(--app-foreground)]`}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-5 py-6">
        {issues.length > 0 && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className={`text-sm font-semibold ${FG}`}>{issues.length > 1 ? `${issues.length} points demandent votre attention` : 'Un point demande votre attention'}</p>
              <ul className={`mt-1 space-y-0.5 text-sm ${MUTED}`}>{issues.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* ============ Synthèse ============ */}
            {activeTab === 'synthese' && (
              <div className="space-y-5">
                <div className="kit-summary-title">
                  <h2>Vue d'ensemble</h2>
                  <p>{snapshotTime ? `Dernier relevé : ${formatDate(snapshotTime)}` : 'En attente des premières mesures'}</p>
                </div>

                <div className="kit-overview-grid">
                  <Card title="Production solaire" subtitle="Énergie mesurée sur les 30 derniers jours" className="kit-overview-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs ${MUTED}`}>30 derniers jours</p>
                        <p className={`mt-1 text-2xl font-semibold tabular-nums ${FG}`}>
                          {history30d?.productionKwh != null ? fmt(history30d.productionKwh, ' kWh') : 'Non disponible'}
                        </p>
                        <p className={`mt-3 text-xs ${MUTED}`}>
                          Actuellement · {T?.solar_power_w != null ? fmt(T.solar_power_w, ' W') : 'Non disponible'}
                        </p>
                      </div>
                      <Sun size={20} className="shrink-0 text-[var(--ops-emphasis)]" />
                    </div>
                  </Card>

                  <Card title="Consommation" subtitle="Mesures de charge disponibles" className="kit-overview-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs ${MUTED}`}>Moyenne mesurée · 30 jours</p>
                        <p className={`mt-1 text-2xl font-semibold tabular-nums ${FG}`}>
                          {averageConsumption ? fmt(averageConsumption.value, ` ${averageConsumption.unit}`) : 'Non disponible'}
                        </p>
                        <p className={`mt-3 text-xs ${MUTED}`}>
                          Actuellement · {currentConsumption ? fmt(currentConsumption.value, ` ${currentConsumption.unit}`) : 'Non disponible'}
                        </p>
                      </div>
                      <Zap size={20} className="shrink-0 text-[var(--ops-emphasis)]" />
                    </div>
                  </Card>

                  <Card title="Communication" subtitle="Fraîcheur des relevés ESP32" className="kit-overview-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Pill tone={communicationIsRecent ? 'ok' : 'off'} dot>{communicationStatus}</Pill>
                        <p className={`mt-3 text-sm font-medium ${FG}`}>
                          {T?.signal_strength_dbm != null ? `Signal · ${fmt(T.signal_strength_dbm, ' dBm')}` : 'Réseau · non communiqué'}
                        </p>
                        <p className={`mt-1 text-xs ${MUTED}`}>Dernière donnée · {formatDate(snapshotTime)}</p>
                      </div>
                      <Radio size={20} className="shrink-0 text-[var(--ops-emphasis)]" />
                    </div>
                  </Card>

                  <Card title="Boîtier & localisation" subtitle="Informations présentes dans les données reçues" className="kit-overview-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${FG}`}>ID · {T?.device_id || 'Non transmis'}</p>
                        <p className={`mt-2 text-sm ${FG}`}>Position · {gpsStatus}</p>
                        <p className={`mt-1 text-xs ${MUTED}`}>
                          {hasTelemetryGps ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : referenceLocation}
                        </p>
                      </div>
                      <MapPin size={20} className="shrink-0 text-[var(--ops-emphasis)]" />
                    </div>
                  </Card>
                </div>

                {telemetrySummary.isError && (
                  <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300" role="status">
                    Le résumé historique IoT n’a pas pu être chargé. Les valeurs de synthèse indisponibles ne sont pas estimées.
                  </p>
                )}

                <Suspense fallback={<div className="kit-card p-6 text-sm" role="status">Chargement de la vue du kit…</div>}>
                  <KitExplorer telemetry={T} />
                </Suspense>

                <Card title="Évolution des mesures" subtitle="Les courbes disponibles sont détectées dans les 24 derniers relevés.">
                  <TrendChart data={chartData} options={chartOptions} />
                </Card>

                <Card title="Mesures techniques" subtitle="Valeurs du dernier relevé brut reçu">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="kit-section-label">Solaire</p>
                      <RowList>
                        <Row label="Tension" value={fmt(T?.solar_voltage_v, ' V')} />
                        <Row label="Courant" value={fmt(T?.solar_current_a, ' A')} />
                        <Row label="Puissance" value={fmt(T?.solar_power_w, ' W')} />
                        <Row label="Énergie intervalle" value={fmt(T?.energy_generated_wh, ' Wh')} />
                      </RowList>
                    </div>
                    <div>
                      <p className="kit-section-label">Batterie</p>
                      <RowList>
                        <Row label="Tension" value={fmt(T?.battery_voltage_v, ' V')} />
                        <Row label="Courant" value={fmt(T?.battery_current_a, ' A')} />
                        <Row label="Puissance" value={fmt(T?.battery_power_w, ' W')} />
                        <Row label="Charge" value={fmt(T?.state_of_charge_pct, ' %')} />
                      </RowList>
                    </div>
                    <div>
                      <p className="kit-section-label">Sortie AC</p>
                      <RowList>
                        <Row label="Tension" value={fmt(T?.ac_load_voltage_v, ' V')} />
                        <Row label="Courant" value={fmt(T?.ac_load_current_a, ' A')} />
                        <Row label="Puissance apparente" value={fmt(T?.ac_apparent_power_va, ' VA')} />
                      </RowList>
                    </div>
                    <div>
                      <p className="kit-section-label">GPS / GSM</p>
                      <RowList>
                        <Row label="Position" value={gpsStatus} />
                        <Row label="Coordonnées" value={hasTelemetryGps ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Non disponible'} />
                        <Row label="Signal radio" value={fmt(T?.signal_strength_dbm, ' dBm')} />
                        <Row label="Dernière transmission" value={formatDate(snapshotTime)} />
                      </RowList>
                    </div>
                  </div>
                  </Card>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <Card title="Boîtier Djua" subtitle="Informations matérielles communiquées par le kit">
                    <RowList>
                      <Row label="ID du boîtier" value={T?.device_id || 'Non transmis'} />
                      <Row label="Modèle" value={T?.device_model || 'Non transmis'} />
                      <Row label="Version du firmware" value={T?.firmware_version || 'Non transmise'} />
                      <Row label="Numéro de série" value={T?.serial_number || 'Non transmis'} />
                      <Row label="Enregistrement dans la base" value={formatDate(telemetrySummary.data?.kit?.createdAt || kitReference?.createdAt)} />
                      <Row label="Emplacement" value={hasTelemetryGps ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : referenceLocation} />
                    </RowList>
                  </Card>

                  <Card title="Capteurs et connectivité" subtitle="Présence de mesures dans le dernier message, sans présumer de leur état matériel">
                    <RowList>
                      {[
                        { label: 'Entrée panneaux', received: T?.solar_voltage_v != null || T?.solar_current_a != null || T?.solar_power_w != null },
                        { label: 'Entrée batterie', received: T?.battery_voltage_v != null || T?.battery_current_a != null || T?.battery_power_w != null },
                        { label: 'Capteur AC', received: T?.ac_load_voltage_v != null || T?.ac_load_current_a != null || T?.ac_apparent_power_va != null },
                        { label: 'GPS', received: hasTelemetryGps },
                        { label: 'Signal radio', received: T?.signal_strength_dbm != null },
                      ].map((sensor) => (
                        <Row
                          key={sensor.label}
                          label={sensor.label}
                          status={<Pill tone={sensor.received ? 'ok' : 'off'}>{sensor.received ? 'Donnée reçue' : 'Non disponible'}</Pill>}
                        />
                      ))}
                    </RowList>
                  </Card>
                </div>

                <Card title="Ce qui se passe sur cette installation" subtitle={`État technique · ${technicalStatus}`}>
                  {issues.length > 0 || kitAlerts.length > 0 ? (
                    <ul className="space-y-2">
                      {[...issues, ...kitAlerts.map((alert) => alert.title || alert.message || alert.type || 'Alerte active')].map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-sm ${MUTED}`}>
                      {hasDiagnosticData
                        ? 'Aucune anomalie télémétrique ou alerte active détectée dans les données disponibles.'
                        : 'En attente de mesures suffisantes pour établir un diagnostic.'}
                    </p>
                  )}
                  {history30d?.sampleCount != null && (
                    <p className={`mt-3 text-xs ${MUTED}`}>{history30d.sampleCount} relevé(s) exploité(s) sur les 30 derniers jours.</p>
                  )}
                </Card>
              </div>
            )}

            {/* ============ Énergie solaire ============ */}
            {activeTab === 'solaire' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card title="Panneau solaire" subtitle="Relevés du contrôleur de charge">
                    <RowList>
                      <Row label="Tension" value={fmt(T?.solar_voltage_v, ' V')} meter={{ value: T?.solar_voltage_v, max: 50 }} />
                      <Row label="Courant" value={fmt(T?.solar_current_a, ' A')} meter={{ value: T?.solar_current_a, max: 20 }} />
                      <Row label="Puissance" value={fmt(T?.solar_power_w, ' W')} meter={{ value: T?.solar_power_w, max: 400 }} />
                      <Row label="Énergie sur l’intervalle" value={fmt(T?.energy_generated_wh, ' Wh')} />
                    </RowList>
                  </Card>
                  <Card title="Batterie">
                    <RowList>
                      <Row label="Niveau de charge" value={fmt(T?.state_of_charge_pct, ' %')} meter={{ value: T?.state_of_charge_pct, warnBelow: 20 }} />
                      <Row label="Santé" value={fmt(T?.state_of_health_pct, ' %')} meter={{ value: T?.state_of_health_pct }} />
                      <Row label="Tension" value={fmt(T?.battery_voltage_v, ' V')} />
                      <Row label="Courant" value={fmt(T?.battery_current_a, ' A')} />
                      <Row label="Puissance" value={fmt(T?.battery_power_w, ' W')} />
                    </RowList>
                  </Card>
                </div>
                <Card title="Historique solaire" subtitle="24 derniers relevés">
                  <TrendChart
                    data={chartData}
                    options={[
                      { key: 'puissance_pv', label: 'Puissance (W)', unit: 'W' },
                      { key: 'tension_pv', label: 'Tension (V)', unit: 'V' },
                      { key: 'courant_pv', label: 'Courant (A)', unit: 'A' },
                      { key: 'soc', label: 'Batterie (%)', unit: '%' },
                    ]}
                  />
                </Card>
              </div>
            )}

            {/* ============ Environnement ============ */}
            {activeTab === 'env' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-1">
                  <Card title="Boîtier électronique" subtitle="Seuil de vigilance : 60 °C">
                    <p className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="text-4xl font-semibold tracking-tight">{T?.device_temperature_c ?? '—'}</span>
                      {T?.device_temperature_c != null && <span className={`text-base ${MUTED}`}>°C</span>}
                    </p>
                    <Meter value={T?.device_temperature_c} max={80} className="mt-3" />
                    <p className="mt-3">
                      <Pill tone={T?.device_temperature_c == null ? 'off' : T.device_temperature_c > 60 ? 'bad' : 'ok'}>
                        {T?.device_temperature_c == null ? 'Température indisponible' : T.device_temperature_c > 60 ? 'Seuil dépassé' : 'Sous le seuil'}
                      </Pill>
                    </p>
                  </Card>
                  <Card title="Conditions extérieures">
                    <RowList>
                      <Row label="Température" value={fmt(T?.ambient_temperature_c, ' °C')} meter={{ value: T?.ambient_temperature_c, max: 50 }} />
                      <Row label="Humidité relative" value={fmt(T?.humidity_pct, ' %')} meter={{ value: T?.humidity_pct }} />
                    </RowList>
                  </Card>
                </div>
                <Card title="Historique" subtitle="24 derniers relevés" className="lg:col-span-2">
                  <TrendChart
                    height={300}
                    data={chartData}
                    options={[
                      { key: 'temp_boitier', label: 'Boîtier (°C)', unit: '°C' },
                      { key: 'temp_ambiante', label: 'Ambiante (°C)', unit: '°C' },
                      { key: 'humidite', label: 'Humidité (%)', unit: '%' },
                    ]}
                  />
                </Card>
              </div>
            )}

            {/* ============ Réseau et GPS ============ */}
            {activeTab === 'gps' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card title="Connexion" className="lg:col-span-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-semibold tabular-nums">{rssi != null ? `${rssi} dBm` : '—'}</p>
                      <p className={`text-xs ${MUTED}`}>
                        {rssi == null ? 'Signal indisponible' : rssi >= -65 ? 'Signal excellent' : rssi >= -80 ? 'Signal correct' : 'Signal faible'}
                      </p>
                    </div>
                    <SignalBars dbm={rssi ?? -99} />
                  </div>
                  <RowList>
                    <Row label="Réception" value={isLive ? 'En direct' : 'Dernier relevé connu'} />
                    <Row label="Région" value={T?.region || 'Non communiquée'} />
                    <Row label="Type d’installation" value={T?.installation_type ? T.installation_type.replace(/_/g, ' ') : 'Non communiqué'} />
                    <Row label="ID du message" value={<span className="break-all text-xs">{T?.message_id || '—'}</span>} />
                  </RowList>
                </Card>

                <Card
                  title="Position du kit"
                  subtitle={hasTelemetryGps ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'GPS indisponible'}
                  action={hasReferenceGps && hasTelemetryGps
                    ? <Pill tone={isOutsideGeofence ? 'bad' : 'ok'}>{isOutsideGeofence ? `Hors zone : ${Math.round(currentDistance || 0)} m` : 'Dans la zone de 90 m'}</Pill>
                    : null}
                  className="lg:col-span-2"
                >
                  <div className="relative h-80 w-full overflow-hidden rounded-md border border-[var(--panel-border)]">
                    <MapContainer center={[lat, lng]} zoom={hasTelemetryGps || hasReferenceGps ? 14 : 5} style={{ height: '100%', width: '100%' }}>
                      <MapUpdater center={[lat, lng]} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-dark" />
                      {hasReferenceGps && (
                        <Circle
                          center={[refLat, refLng]} radius={90}
                          pathOptions={{ color: isOutsideGeofence ? '#DC2626' : ORANGE, fillColor: isOutsideGeofence ? '#DC2626' : ORANGE, fillOpacity: 0.12, weight: 2 }}
                        />
                      )}
                      {hasTelemetryGps && <Marker position={[lat, lng]} icon={customIcon} />}
                      {hasReferenceGps && <Marker position={[refLat, refLng]} />}
                    </MapContainer>
                  </div>
                  {!hasTelemetryGps && !hasReferenceGps && (
                    <p className={`mt-3 text-sm ${MUTED}`}>Aucune position connue pour ce kit.</p>
                  )}
                </Card>
              </div>
            )}

            {/* ============ Prédiction IA ============ */}
            {activeTab === 'ia' && <PredictionIATab key={kitId} kitId={kitId} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODAL CRÉATION INTERVENTION */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-xl bg-[var(--panel)] shadow-2xl border border-[var(--panel-border)]"
            >
              <div className="px-6 py-4 border-b border-[var(--panel-border)] flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${FG}`}>Créer une intervention</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] hover:bg-[var(--panel-alt)] transition-colors`}
                  aria-label="Fermer la boîte de dialogue"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateIntervention} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${FG} mb-1.5`}>Titre de l'intervention</label>
                  <input
                    type="text"
                    required
                    value={interventionForm.title}
                    onChange={(e) => setInterventionForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-foreground)] placeholder-[var(--muted-foreground)] focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                    placeholder="Ex: Remplacement du contrôleur"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${FG} mb-1.5`}>Description</label>
                  <textarea
                    required
                    rows={3}
                    value={interventionForm.description}
                    onChange={(e) => setInterventionForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-foreground)] placeholder-[var(--muted-foreground)] focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B] resize-none"
                    placeholder="Détails de l'anomalie et du matériel nécessaire..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${FG} mb-1.5`}>Priorité</label>
                  <select
                    value={interventionForm.priority}
                    onChange={(e) => setInterventionForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-foreground)] focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                    <option value="Critique">Critique</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${FG} mb-1.5`}>Technicien assigné (optionnel)</label>
                  <select
                    value={interventionForm.assignedTo}
                    onChange={(e) => setInterventionForm(f => ({ ...f, assignedTo: e.target.value }))}
                    className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-foreground)] focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  >
                    <option value="">Auto (technicien senior de la zone)</option>
                    {(technicians.data || []).map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.prenom} {t.nom} {t.seniority === 'senior' ? '(Senior)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--panel-border)] hover:bg-[var(--panel-alt)] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createIntervention.isLoading}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-[#F59E0B] text-black hover:bg-[#FBBF24] transition-colors disabled:opacity-50"
                  >
                    {createIntervention.isLoading ? 'Création...' : 'Créer l\'intervention'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageEntrance>
  );
}