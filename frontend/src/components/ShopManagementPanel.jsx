import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Plus, UserCheck, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { useShopsQuery } from '../hooks/tanstack/useShops';

/**
 * Hook pour récupérer les responsables shop disponibles (shop_managers).
 * On réutilise l'endpoint /auth/team-users qui retourne uniquement les shop_managers pour l'admin.
 */
function useShopManagers() {
  const [managers, setManagers] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchManagers = async () => {
    if (managers !== null) return managers;
    setIsLoading(true);
    try {
      const response = await api.get('/auth/team-users');
      const data = (response.data?.data || []).filter(u => u.role === 'shop_manager');
      setManagers(data);
      return data;
    } catch {
      setManagers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { managers, isLoading, fetchManagers };
}

function AssignManagerRow({ shop, onAssigned }) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState('');

  const loadManagers = async () => {
    if (managers !== null) { setOpen(o => !o); return; }
    setIsLoading(true);
    try {
      const response = await api.get('/auth/team-users');
      const data = (response.data?.data || []).filter(u => u.role === 'shop_manager');
      setManagers(data);
      setOpen(true);
    } catch {
      toast.error('Impossible de charger les responsables.');
    } finally {
      setIsLoading(false);
    }
  };

  const assign = async () => {
    if (!selected) { toast.error('Sélectionnez un responsable.'); return; }
    setIsSaving(true);
    try {
      const response = await api.put(`/api/shops/${shop._id}/manager`, { managerId: selected });
      toast.success('Responsable assigné au shop avec succès.');
      onAssigned(response.data?.data);
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible d\'assigner le responsable.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 underline"
        onClick={loadManagers}
        disabled={isLoading}
      >
        <UserCheck size={13}/>
        {isLoading ? 'Chargement…' : (shop.managerId ? 'Changer de responsable' : 'Assigner un responsable')}
        <ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'}/>
      </button>
      {open && managers !== null && (
        <div className="flex items-center gap-2 mt-2">
          <select
            className="text-xs border border-zinc-700 rounded px-2 py-1 bg-zinc-900 text-white flex-1"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">— Choisir un responsable —</option>
            {managers.map(m => (
              <option key={m._id} value={m._id}>
                {m.prenom} {m.nom} {m.shopId?.name ? `(déjà dans ${m.shopId.name})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ops-button primary text-xs px-3 py-1"
            onClick={assign}
            disabled={isSaving || !selected}
          >
            {isSaving ? '…' : 'Assigner'}
          </button>
        </div>
      )}
    </div>
  );
}

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
      toast.success('Shop créé. Vous pouvez maintenant y affecter un responsable.');
      setForm({ name: '', address: '', region: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de créer ce shop.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerAssigned = (updatedShop) => {
    queryClient.setQueryData(['shops'], previous =>
      (previous || []).map(s => s._id === updatedShop._id ? { ...s, managerId: updatedShop.managerId } : s)
    );
  };

  return (
    <div className="space-y-5">
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
              : (
                <ul className="divide-y divide-[var(--panel-border,#27272a)]">
                  {shops.map(shop => (
                    <li key={shop._id} className="flex items-start gap-3 py-3">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-amber-500"/>
                      <div className="flex-1">
                        <strong className="block text-sm">{shop.name}</strong>
                        <small className="opacity-70">{shop.address} · {shop.region}</small>
                        {shop.managerId ? (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                            <UserCheck size={12}/>
                            <span>
                              Responsable : <strong>{shop.managerId.prenom} {shop.managerId.nom}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-zinc-500">Aucun responsable assigné</div>
                        )}
                        <AssignManagerRow shop={shop} onAssigned={handleManagerAssigned}/>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
      </div>
    </div>
  );
}
