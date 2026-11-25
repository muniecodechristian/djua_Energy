import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { useShopsQuery } from '../hooks/tanstack/useShops';

export default function ShopManagementPanel() {
  const queryClient = useQueryClient();
  const { data: shops = [], isLoading, isError } = useShopsQuery();
  const [form, setForm] = useState({ name: '', address: '', region: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/shops', form);
      queryClient.setQueryData(['shops'], previous => [
        ...(previous || []).filter(shop => shop._id !== response.data.data._id),
        response.data.data,
      ].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Shop créé. Vous pouvez maintenant y affecter des comptes.');
      setForm({ name: '', address: '', region: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de créer ce shop.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="space-y-5">
    <form className="ops-form" onSubmit={submit}>
      <div className="ops-form-row">
        <label>Nom du shop<input name="name" value={form.name} onChange={update} minLength={2} required placeholder="Ex. Shop Kinshasa"/></label>
        <label>Région<input name="region" value={form.region} onChange={update} minLength={2} required placeholder="Ex. Kinshasa"/></label>
      </div>
      <label>Adresse<input name="address" value={form.address} onChange={update} minLength={3} required placeholder="Adresse du shop"/></label>
      <div className="ops-inline-actions">
        <button className="ops-button primary" type="submit" disabled={isSubmitting}>
          <Plus size={16}/>{isSubmitting ? 'Création…' : 'Créer le shop'}
        </button>
      </div>
    </form>

    <div>
      <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold"><Building2 size={16}/>Shops enregistrés</h3>
      {isError ? <p role="alert" className="ops-empty">Impossible de charger les shops.</p>
        : isLoading ? <p className="text-sm opacity-70">Chargement des shops…</p>
          : shops.length === 0 ? <p className="text-sm opacity-70">Aucun shop créé pour le moment.</p>
            : <ul className="divide-y divide-[var(--panel-border,#27272a)]">
              {shops.map(shop => <li key={shop._id} className="flex items-start gap-3 py-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-amber-500"/>
                <span><strong className="block text-sm">{shop.name}</strong><small className="opacity-70">{shop.address} · {shop.region}</small></span>
              </li>)}
            </ul>}
    </div>
  </div>;
}
