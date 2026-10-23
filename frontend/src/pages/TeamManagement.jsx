import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban, Pencil, RotateCcw, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import PageEntrance from '../components/PageEntrance';
import TeamAccountForm from '../components/TeamAccountForm';
import { TableSkeleton } from '../components/PageSkeleton';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';

const roleLabels = { technician: 'Technicien', commercial: 'Commercial', shop_manager: 'Responsable shop' };

export default function TeamManagement() {
  const user = useAuthStore(state => state.user);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', postNom: '', role: 'technician', identifier: '', whatsapp: '', password: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/auth/team-users')
      .then(response => { if (active) setMembers(response.data?.data || []); })
      .catch(error => { if (active) toast.error(error.response?.data?.message || 'Impossible de charger l’équipe.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const openEdit = member => {
    setEditingMember(member);
    setEditForm({
      prenom: member.prenom || '',
      nom: member.nom || '',
      postNom: member.postNom || '',
      role: member.role || 'technician',
      identifier: member.identifier || '',
      whatsapp: member.whatsapp || '',
      password: '',
    });
  };

  const handleEditChange = event => {
    setEditForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEditSubmit = async event => {
    event.preventDefault();
    if (['technician', 'commercial'].includes(editForm.role) && !editForm.whatsapp.trim()) {
      toast.error('Le numéro WhatsApp est obligatoire pour les techniciens et commerciaux.');
      return;
    }
    setIsSavingEdit(true);
    try {
      const payload = {
        prenom: editForm.prenom,
        nom: editForm.nom,
        postNom: editForm.postNom,
        role: editForm.role,
        identifier: editForm.identifier.trim(),
        whatsapp: editForm.whatsapp.trim(),
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      const response = await api.patch(`/auth/team-users/${editingMember._id}`, payload);
      const updated = response.data?.data;
      setMembers(prev => prev.map(m => m._id === editingMember._id ? { ...m, ...updated } : m));
      toast.success('Informations du membre mises à jour.');
      setEditingMember(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de modifier ce compte.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const updateStatus = async member => {
    const status = member.status === 'suspended' ? 'active' : 'suspended';
    setPendingId(member._id);
    try {
      await api.patch(`/auth/team-users/${member._id}/status`, { status });
      setMembers(previous => previous.map(item => item._id === member._id ? { ...item, status } : item));
      toast.success(status === 'suspended' ? 'Compte suspendu.' : 'Compte réactivé.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de modifier ce compte.');
    } finally {
      setPendingId('');
    }
  };

  const deleteMember = async member => {
    if (!window.confirm(`Supprimer définitivement le compte de ${member.prenom} ${member.nom} ?`)) return;
    setPendingId(member._id);
    try {
      await api.delete(`/auth/team-users/${member._id}`);
      setMembers(previous => previous.filter(item => item._id !== member._id));
      toast.success('Compte supprimé.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de supprimer ce compte.');
    } finally {
      setPendingId('');
    }
  };

  if (user?.role !== 'shop_manager') return <Navigate to={user?.role === 'admin' || user?.role === 'administration' ? '/AdministrationSettings' : '/dashboard'} replace/>;

  return <PageEntrance className="ops-page">
    <div className="ops-page-heading"><div><p className="ops-eyebrow">ÉQUIPE DE TERRAIN</p><h1>Gestion de l’équipe</h1><p>Créez et gérez les comptes des techniciens et commerciaux affectés à votre zone.</p></div></div>
    <section className="ops-card">
      <div className="ops-card-heading"><h2 className="inline-flex items-center gap-2"><Users size={17}/>Nouveau membre</h2><small>Zone : {user.zone || 'Non attribuée'}</small></div>
      <div className="ops-form"><TeamAccountForm onCreated={member => setMembers(previous => [member, ...previous])}/></div>
    </section>
    <section className="ops-card" style={{ marginTop: 18 }}>
      <div className="ops-card-heading"><h2>Membres de l'équipe</h2><small>{members.length} compte(s)</small></div>
      {isLoading ? <TableSkeleton/> : members.length === 0 ? <div className="ops-empty"><span className="ops-empty-icon"><Users size={24}/></span><h3>Aucun membre dans votre équipe</h3><p>Les techniciens et commerciaux créés apparaîtront ici.</p></div> : <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Nom</th><th>Fonction</th><th>WhatsApp</th><th>Identifiant</th><th>Zone</th><th>État</th><th>Actions</th></tr></thead><tbody>{members.map(member => <tr key={member._id}><td><strong>{member.prenom} {member.nom}</strong>{member.postNom ? <small className="block text-xs opacity-75">{member.postNom}</small> : null}</td><td>{roleLabels[member.role] || member.role}</td><td><span className="font-mono text-xs">{member.whatsapp || '—'}</span></td><td>{member.identifier}</td><td>{member.zone || '—'}</td><td><span className={'ops-badge ' + (member.status === 'suspended' ? 'medium' : 'low')}>{member.status === 'suspended' ? 'Suspendu' : 'Actif'}</span></td><td><div className="ops-inline-actions"><button className="ops-icon-button" type="button" title="Modifier les informations" aria-label={`Modifier ${member.prenom} ${member.nom}`} disabled={pendingId === member._id} onClick={() => openEdit(member)}><Pencil size={16}/></button><button className="ops-icon-button" type="button" title={member.status === 'suspended' ? 'Réactiver le compte' : 'Suspendre le compte'} aria-label={member.status === 'suspended' ? `Réactiver ${member.prenom} ${member.nom}` : `Suspendre ${member.prenom} ${member.nom}`} disabled={pendingId === member._id} onClick={() => updateStatus(member)}>{member.status === 'suspended' ? <RotateCcw size={16}/> : <Ban size={16}/>}</button><button className="ops-icon-button" type="button" title="Supprimer le compte" aria-label={`Supprimer ${member.prenom} ${member.nom}`} disabled={pendingId === member._id} onClick={() => deleteMember(member)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
    </section>

    {/* Modal de modification de membre */}
    {editingMember && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[var(--app-surface,#18181b)] border border-[var(--panel-border,#27272a)] rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-left">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border,#27272a)] mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Modifier les informations</h2>
              <small className="text-xs text-zinc-400">Zone : {editingMember.zone || user.zone || 'Zone locale'}</small>
            </div>
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="ops-form">
            <div className="ops-form-row">
              <label>Prénom<input name="prenom" value={editForm.prenom} onChange={handleEditChange} minLength={2} required /></label>
              <label>Nom<input name="nom" value={editForm.nom} onChange={handleEditChange} minLength={2} required /></label>
            </div>
            <label>Post-nom <span>(facultatif)</span><input name="postNom" value={editForm.postNom} onChange={handleEditChange} /></label>
            <label>Fonction<select name="role" value={editForm.role} onChange={handleEditChange}><option value="technician">Technicien</option><option value="commercial">Commercial</option></select></label>
            <label>Numéro WhatsApp <span style={{ color: '#ea580c' }}>*</span><input name="whatsapp" type="tel" placeholder="+243…" value={editForm.whatsapp} onChange={handleEditChange} required /><small>Requis pour joindre le membre par WhatsApp.</small></label>
            <label>Email ou téléphone<input name="identifier" type="text" value={editForm.identifier} onChange={handleEditChange} required /></label>
            <label>Nouveau mot de passe <span>(laisser vide pour ne pas modifier)</span><input name="password" type="password" placeholder="••••••••" value={editForm.password} onChange={handleEditChange} minLength={8} /><small>8 caractères min, majuscule, chiffre et symbole.</small></label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--panel-border,#27272a)] mt-4">
              <button type="button" className="ops-button" onClick={() => setEditingMember(null)} disabled={isSavingEdit}>Annuler</button>
              <button type="submit" className="ops-button primary" disabled={isSavingEdit}>{isSavingEdit ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </PageEntrance>;
}