import { useState } from 'react';
import { Search, CheckCircle2, Package, Battery, Zap, X } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';
import { quotesApi } from '../services/api';
import type { StoredQuote } from '../types/install.types';

interface Props { onNext: () => void; }

export default function Step04Search({ onNext }: Props) {
  const setStoreQuoteData = useInstallStore(s => s.setQuoteData);
  const [quoteId, setQuoteId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<StoredQuote | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!quoteId.trim()) return;
    setIsSearching(true);
    setError('');
    setResult(null);
    try {
      const data = await quotesApi.searchQuote(quoteId.trim());
      if (data) setResult(data);
      else setError('Aucun devis trouvé pour cet identifiant.');
    } catch(error: any) {
      setError(error.message || 'Erreur lors de la recherche. Réessayez.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseQuote = () => {
    if (!result) return;
    setStoreQuoteData(result.id, {
      client: result.client,
      location: result.location,
      system: result.system,
      phone: result.phone, plannedDate:result.plannedDate, appliances:result.appliances,
    });
    onNext();
  };

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={4} totalSteps={11} />

      <div className="screen-content">
        <h1 className="screen-title">Rechercher un devis</h1>
        <p className="screen-desc">Entrez le numéro du devis associé à cette installation.</p>

        <label className="label-text">Numéro du devis</label>
        <div className="input-wrap" style={{ marginBottom: 16 }}>
          <input
            value={quoteId}
            onChange={e => {setQuoteId(e.target.value);setResult(null);setError('');}}
            disabled={isSearching}
            placeholder="Ex : DJ-2026-A1B2C3D4E5"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          {quoteId && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} disabled={isSearching} onClick={() => {setQuoteId('');setResult(null);}}>
              <X size={14} color="var(--text-muted)" />
            </button>
          )}
        </div>

        <Button title="Rechercher" isLoading={isSearching} onClick={handleSearch} style={{ marginBottom: 24 }} />

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="fade-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <CheckCircle2 size={20} color="var(--success)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>Devis trouvé</span>
            </div>

            <div className="card">
              <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{result.id}</p>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 2 }}>{result.client}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{result.location}</p>
              <p style={{fontSize:13,marginBottom:12}}>Téléphone : {result.phone}<br/>Installation prévue : {result.plannedDate} (Kinshasa)</p>
              <h2 style={{fontSize:14,fontWeight:600}}>Appareils du client</h2>
              <ul style={{paddingLeft:20,marginBottom:16}}>{result.appliances.map((item,index)=><li key={index} style={{fontSize:13,marginBottom:6}}>{item.quantity} × {item.name} · {item.watts} W · {item.hours} h/j</li>)}</ul>
              <div className="divider" />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '12px 0' }}>Système prévu</p>

              {[
                { icon: <Package size={15} color="var(--text-muted)" />, label: `${result.system.panels} × panneaux ${result.system.panelPower} W`, value: `${(result.system.panels * result.system.panelPower / 1000).toFixed(1)} kW` },
                { icon: <Battery size={15} color="var(--text-muted)" />, label: `Batterie ${result.system.batteryCapacity} kWh` },
                { icon: <Zap size={15} color="var(--text-muted)" />, label: `Onduleur ${result.system.inverterPower} kVA` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {row.icon}
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-3)' }}>{row.label}</span>
                  {row.value && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="screen-footer">
          <Button title="Utiliser ce devis" onClick={handleUseQuote} />
          <button className="btn btn-ghost" onClick={() => setResult(null)}>Ce n'est pas le bon devis</button>
        </div>
      )}
    </div>
  );
}
