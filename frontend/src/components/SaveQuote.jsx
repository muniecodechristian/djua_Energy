import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import './SalesQuotes.css';
export default function SaveQuote({ payload, onSaved }) {
  const user = useAuthStore(state => state.user);
  const [requestKey] = useState(() => crypto.randomUUID());
  const [saved, setSaved] = useState(null);
  const cache = useQueryClient();
  const mutation = useMutation({ mutationFn: async () => (await api.post('/api/quotes', { ...payload, requestKey })).data.data, onSuccess: quote => { setSaved(quote); onSaved?.(quote); cache.invalidateQueries({ queryKey: ['sales-quotes'] }); } });
  if(!['commercial','shop_manager','admin','administration'].includes(user?.role)) return <p className="sales-save-hint">Connectez-vous avec un compte commercial pour enregistrer ce client et son devis.</p>;
  return <div className="sales-save"><div><strong>{saved ? saved.number : 'Conserver ce devis dans le dossier client'}</strong><p>{saved ? 'Client et devis enregistrés. Retrouvez-les dans « Mes devis et clients ».' : 'Un client peut avoir plusieurs devis. Vous pourrez ensuite valider celui qu’il accepte.'}</p>{mutation.isError && <p role="alert" className="sales-error">{mutation.error?.response?.data?.message || 'Enregistrement impossible. Réessayez.'}</p>}</div><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || !!saved}>{saved ? <Check size={16}/> : mutation.isPending ? <Loader2 size={16}/> : <Save size={16}/>} {saved ? 'Enregistré' : mutation.isPending ? 'Enregistrement…' : 'Enregistrer client et devis'}</button></div>;
}
