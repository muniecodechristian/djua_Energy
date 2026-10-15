import { useState } from 'react';
import { MapPin, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';

const emptyForm = { nom: '', prenom: '', postNom: '', identifier: '', password: '', zone: '' };
const roleLabels = { shop_manager: 'Responsable shop', technician: 'Technicien', commercial: 'Commercial' };

export default function TeamAccountForm({ onCreated }) {
  const user = useAuthStore(state => state.user);
  const role = user?.role === 'administration' ? 'admin' : user?.role;
  const isAdmin = role === 'admin';
  const [form, setForm] = useState(emptyForm);
  const [teamRole, setTeamRole] = useState(isAdmin ? 'shop_manager' : 'technician');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assignedZone = isAdmin ? form.zone.trim() : (user?.zone || '').trim();

  const update = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    if (!assignedZone) {
      toast.error(isAdmin ? 'Indiquez la zone du responsable.' : 'Votre compte n’a pas de zone attribuée. Contactez un administrateur.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/team-users', {
        nom: form.nom,
        prenom: form.prenom,
        postNom: form.postNom,
        identifier: form.identifier.trim(),
        password: form.password,
        role: teamRole,
        zone: assignedZone,
      });
      toast.success(`${roleLabels[teamRole]} créé pour la zone ${assignedZone}.`);
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
    {!isAdmin && <label>Fonction<select value={teamRole} onChange={event => setTeamRole(event.target.value)}><option value="technician">Technicien</option><option value="commercial">Commercial</option></select></label>}
    {isAdmin && <label>Fonction<input value="Responsable shop" readOnly/></label>}
    <label>Email ou téléphone<input name="identifier" type="text" autoComplete="username" placeholder="nom@exemple.com ou +243…" value={form.identifier} onChange={update} required/></label>
    <label>Mot de passe initial<input name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={update} required/><small>8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small></label>
    <label><span className="inline-flex items-center gap-2"><MapPin size={14}/>Zone d’affectation</span><input name="zone" value={isAdmin ? form.zone : (user?.zone || '')} onChange={isAdmin ? update : undefined} readOnly={!isAdmin} placeholder={isAdmin ? 'Ex. Kinshasa, Goma…' : 'Zone du responsable'} required/></label>
    <div className="ops-inline-actions"><button className="ops-button primary" type="submit" disabled={isSubmitting || (!isAdmin && !assignedZone)}><UserPlus size={16}/>{isSubmitting ? 'Création…' : `Créer ${roleLabels[teamRole].toLowerCase()}`}</button></div>
  </form>;
}