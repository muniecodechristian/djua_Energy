import { useState } from 'react';
import { Link } from 'react-router-dom';
import KitExplorer from './KitExplorer';
import { useKitLiveTelemetry } from '../hooks/tanstack/useKitLiveTelemetry';
import { detailUrl } from '../lib/operations';
import '../pages/SmartKitDetails.css';

export default function DashboardKitPreview({ kits }) {
  const [selection, setSelection] = useState('');
  const kitId = kits.some(kit => kit.kitId === selection) ? selection : kits.find(kit => kit.kitId)?.kitId;
  const { latestTelemetry, isLoading, isLive } = useKitLiveTelemetry(kitId);
  if (!kitId) return <div className="dashboard-map-empty"><strong>Aucun kit à explorer</strong><p>La vue 3D sera disponible dès qu’un kit sera présent dans le parc.</p></div>;
  return <div className="dashboard-kit-preview">
    <div className="dashboard-kit-selector">
      <label>Équipement<select value={kitId} onChange={event => setSelection(event.target.value)}>{kits.filter(kit => kit.kitId).map(kit => <option key={kit.kitId} value={kit.kitId}>{kit.kitId}</option>)}</select></label>
      <span role="status">{isLoading ? 'Chargement des mesures…' : isLive ? 'Mesures en direct' : latestTelemetry ? 'Dernières mesures reçues' : 'Mesures indisponibles'}</span>
      <Link to={detailUrl(kitId)}>Ouvrir la fiche ↗</Link>
    </div>
    <KitExplorer compact key={kitId} telemetry={latestTelemetry} />
  </div>;
}
