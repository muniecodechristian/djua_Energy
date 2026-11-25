import { useState } from 'react';
import { MapPin, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { useShopsQuery } from '../hooks/tanstack/useShops';

const emptyForm = { nom: '', prenom: '', postNom: '', identifier: '', whatsapp: '', password: '', shopId: '' };
const roleLabels = { admin: 'Administrateur', shop_manager: 'Responsable shop', technician: 'Technicien', commercial: 'Commercial' };
const roleDescriptions = { technician: 'Interventions et missions de terrain', commercial: 'Devis et suivi commercial' };

export default function TeamAccountForm({ onCreated, initialRole, allowedRoles }) {
  const user = useAuthStore(state => state.user);
  const role = user?.role === 'administration' ? 'admin' : user?.role;
  const isAdmin = role === 'admin';
  const { data: shops = [], isError: shopsError } = useShopsQuery(isAdmin);
  const [form, setForm] = useState(emptyForm);
  const availableRoles = allowedRoles || (isAdmin ? ['shop_manager', 'technician', 'commercial', 'admin'] : ['technician', 'commercial']);
  const [teamRole, setTeamRole] = useState(initialRole || (isAdmin ? 'shop_manager' : 'technician'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assignedShop = shops.find(shop => shop._id === form.shopId);
  const assignedZone = isAdmin ? (teamRole === 'admin' ? '' : assignedShop?.region || '') : (user?.zone || '').trim();

  const update = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    if (isAdmin && teamRole !== 'admin' && !assignedShop) {
      toast.error('Sélectionnez un shop avant de créer ce compte.');
      return;
    }
    if (!assignedZone && teamRole !== 'admin') {
      toast.error('Votre compte n’a pas de zone attribuée. Contactez un administrateur.');
      return;
    }
    if (['technician', 'commercial'].includes(teamRole) && !form.whatsapp.trim()) {
      toast.error('Le numéro WhatsApp est obligatoire pour les techniciens et commerciaux.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/team-users', {
        nom: form.nom,
        prenom: form.prenom,
        postNom: form.postNom,
        identifier: form.identifier.trim(),
        ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
        password: form.password,
        role: teamRole,
        ...(assignedZone ? { zone: assignedZone } : {}),
        ...(isAdmin && teamRole !== 'admin' ? { shopId: assignedShop._id } : {}),
      });
      toast.success(assignedShop ? `${roleLabels[teamRole]} affecté au shop ${assignedShop.name}.` : 'Compte administrateur créé.');
      onCreated?.(response.data?.data);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error?.message || 'Impossible de créer ce compte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form className="ops-form" onSubmit={submit}>
    <div className="ops-form-row">
      <label>Prénom<input name="prenom" autoComplete="given-name" value={form.prenom} onChange={update} minLength={2} required/></label>
      <label>Nom<input name="nom" autoComplete="family-name" value={form.nom} onChange={update} minLength={2} required/></label>
    </div>
    <label>Post-nom <span>(facultatif)</span><input name="postNom" autoComplete="additional-name" value={form.postNom} onChange={update}/></label>
    {availableRoles.length === 1 ? <label>Fonction<input value={roleLabels[teamRole]} readOnly/></label> : role === 'shop_manager' ? (
      <fieldset className="ops-team-role-picker">
        <legend>Type de compte à créer</legend>
        <div className="ops-team-role-options">
          {availableRoles.map(option => (
            <button
              key={option}
              type="button"
              className="ops-team-role-option"
              aria-pressed={teamRole === option}
              onClick={() => setTeamRole(option)}
            >
              <strong>{roleLabels[option]}</strong>
              <small>{roleDescriptions[option]}</small>
            </button>
          ))}
        </div>
      </fieldset>
    ) : <label>Fonction<select value={teamRole} onChange={event => setTeamRole(event.target.value)}>{availableRoles.map(option => <option key={option} value={option}>{roleLabels[option]}</option>)}</select></label>}
    <label>Numéro WhatsApp <span style={{ color: '#ea580c' }}>*</span><input name="whatsapp" type="tel" autoComplete="tel" placeholder="+243…" value={form.whatsapp} onChange={update} required={['technician', 'commercial'].includes(teamRole)}/><small>Numéro WhatsApp obligatoire pour la coordination de terrain.</small></label>
    <label>Email ou téléphone<input name="identifier" type="text" autoComplete="username" placeholder="nom@exemple.com ou +243…" value={form.identifier} onChange={update} required/></label>
    <label>Mot de passe initial<input name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={update} required/><small>8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small></label>
    {teamRole !== 'admin' && (isAdmin
      ? <label><span className="inline-flex items-center gap-2"><MapPin size={14}/>Shop d’affectation</span>
        <select name="shopId" value={form.shopId} onChange={update} required>
          <option value="">Sélectionner un shop</option>
          {shops.map(shop => <option key={shop._id} value={shop._id}>{shop.name} — {shop.region}</option>)}
        </select>
        {assignedShop && <small>{assignedShop.address}</small>}
        {shopsError
          ? <small role="alert">Impossible de charger les shops. Réessayez ou contactez un administrateur.</small>
          : !shops.length && <small>Créez d’abord un shop dans Paramètres → Shops & équipes.</small>}
      </label>
      : <label><span className="inline-flex items-center gap-2"><MapPin size={14}/>Zone d’affectation</span><input value={user?.zone || ''} readOnly placeholder="Zone du responsable" required/></label>)}
    <div className="ops-inline-actions"><button className="ops-button primary" type="submit" disabled={isSubmitting || (!isAdmin && !assignedZone) || (isAdmin && teamRole !== 'admin' && !assignedShop)}><UserPlus size={16}/>{isSubmitting ? 'Création…' : `Créer ${roleLabels[teamRole].toLowerCase()}`}</button></div>
  </form>;
}