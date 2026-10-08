import { AlertTriangle, Cpu, Phone, Package, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { useInstallStore } from '../store/useInstallStore';

interface Props {
  onScanAnother: () => void; // retour au scan pour un autre boîtier
}

// ─── Helpers d'affichage ─────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: 'active' | 'suspended' | 'terminated' }) {
  const config = {
    active:     { label: 'Actif',     bg: '#DCFCE7', color: '#166534' },
    suspended:  { label: 'Suspendu',  bg: '#FEF9C3', color: '#854D0E' },
    terminated: { label: 'Résilié',   bg: '#FFE4E6', color: '#9F1239' },
  }[status];

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: config.bg, color: config.color,
      padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: config.color }} />
      {config.label}
    </span>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function StepKitExists({ onScanAnother }: Props) {
  const { boxId, kitRecord } = useInstallStore();

  // Cas de secours (ne devrait pas arriver en pratique)
  if (!kitRecord) {
    return (
      <div className="screen fade-enter" style={{ justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <p>Aucune information disponible pour ce boîtier.</p>
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={onScanAnother}>
          Scanner un autre boîtier
        </button>
      </div>
    );
  }

  return (
    <div className="screen fade-enter" style={{ background: '#F8FAFC' }}>
      <div className="screen-scroll">

        {/* ─── Bannière d'avertissement ──────────────────────────────────── */}
        <div style={{
          background: '#FFF7ED',
          borderBottom: '1px solid #FED7AA',
          padding: '20px 20px 16px',
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#FF7900', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={22} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#7C2D12', marginBottom: 4 }}>
              Boîtier déjà installé
            </p>
            <p style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.5 }}>
              Ce boîtier est enregistré dans le système. Consultez ses informations ci-dessous.
            </p>
          </div>
        </div>

        {/* ─── Identifiant + statut ──────────────────────────────────────── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: 20, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Cpu size={22} color="#64748B" />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>Identifiant boîtier</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px' }}>
                  {boxId}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Statut</span>
              <StatusBadge status={kitRecord.status} />
            </div>
          </div>

          {/* ─── Infos client ─────────────────────────────────────────────── */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: 20, marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
              Client
            </p>

            <InfoRow icon={<Phone size={16} color="#64748B" />} label="Téléphone" value={kitRecord.clientPhone} />
            <InfoRow icon={<Package size={16} color="#64748B" />} label="Offre souscrite" value={kitRecord.offerName} />
            <InfoRow
              icon={<span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>$</span>}
              label="Montant périodique"
              value={kitRecord.periodicAmountUSD != null ? `${kitRecord.periodicAmountUSD} USD` : '—'}
            />
            <InfoRow
              icon={<CheckCircle2 size={16} color={kitRecord.subscriptionFeePaid ? '#16A34A' : '#94A3B8'} />}
              label="Abonnement payé"
              value={kitRecord.subscriptionFeePaid ? 'Oui' : 'Non'}
              valueColor={kitRecord.subscriptionFeePaid ? '#16A34A' : '#EF4444'}
            />
          </div>

          {/* ─── Installation ──────────────────────────────────────────────── */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: 20, marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
              Installation
            </p>

            <InfoRow
              icon={<Calendar size={16} color="#64748B" />}
              label="Date d'installation"
              value={formatDate(kitRecord.installationDate)}
            />

            {kitRecord.gpsCoordinates && (
              <InfoRow
                icon={<MapPin size={16} color="#64748B" />}
                label="Coordonnées GPS"
                value={`${kitRecord.gpsCoordinates.latitude.toFixed(5)}, ${kitRecord.gpsCoordinates.longitude.toFixed(5)}`}
              />
            )}

            <InfoRow
              icon={<span style={{ fontSize: 12, color: '#64748B' }}>Mois</span>}
              label="Mois payés"
              value={`${kitRecord.paidMonthsCount}`}
            />
          </div>

          <div className="pb-safe" />
        </div>
      </div>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <div className="screen-footer">
        <button className="btn btn-primary" onClick={onScanAnother}>
          Scanner un autre boîtier
        </button>
      </div>
    </div>
  );
}

// ─── Composant de ligne d'info réutilisable ───────────────────────────────────

function InfoRow({
  icon, label, value, valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 14, marginBottom: 14,
      borderBottom: '1px solid #F1F5F9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 14, color: '#64748B' }}>{label}</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: valueColor ?? '#0F172A' }}>
        {value}
      </span>
    </div>
  );
}
