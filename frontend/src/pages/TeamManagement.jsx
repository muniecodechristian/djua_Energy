import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban, RotateCcw, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import PageEntrance from '../components/PageEntrance';
import TeamAccountForm from '../components/TeamAccountForm';
import { TableSkeleton } from '../components/PageSkeleton';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';

const roleLabels = { technician: 'Technicien', commercial: 'Commercial' };

export default function TeamManagement() {
  const user = useAuthStore(state => state.user);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/auth/team-users')
      .then(response => { if (active) setMembers(response.data?.data || []); })
      .catch(error => { if (active) toast.error(error.response?.data?.message || 'Impossible de charger l’équipe.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

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
    <div className="ops-page-heading"><div><p className="ops-eyebrow">ÉQUIPE DE TERRAIN</p><h1>Gestion de l’équipe</h1><p>Créez les comptes des techniciens et commerciaux affectés à votre zone.</p></div></div>
    <section className="ops-card">
      <div className="ops-card-heading"><h2 className="inline-flex items-center gap-2"><Users size={17}/>Nouveau membre</h2><small>Zone : {user.zone || 'Non attribuée'}</small></div>
      <div className="ops-form"><TeamAccountForm onCreated={member => setMembers(previous => [member, ...previous])}/></div>
    </section>
    <section className="ops-card" style={{ marginTop: 18 }}>
      <div className="ops-card-heading"><h2>Membres créés</h2><small>{members.length} compte(s)</small></div>
      {isLoading ? <TableSkeleton/> : members.length === 0 ? <div className="ops-empty"><span className="ops-empty-icon"><Users size={24}/></span><h3>Aucun membre dans votre équipe</h3><p>Les techniciens et commerciaux créés apparaîtront ici.</p></div> : <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Nom</th><th>Fonction</th><th>Identifiant</th><th>Zone</th><th>État</th><th>Actions</th></tr></thead><tbody>{members.map(member => <tr key={member._id}><td><strong>{member.prenom} {member.nom}</strong></td><td>{roleLabels[member.role] || member.role}</td><td>{member.identifier}</td><td>{member.zone || '—'}</td><td><span className={'ops-badge ' + (member.status === 'suspended' ? 'medium' : 'low')}>{member.status === 'suspended' ? 'Suspendu' : 'Actif'}</span></td><td><div className="ops-inline-actions"><button className="ops-icon-button" type="button" title={member.status === 'suspended' ? 'Réactiver le compte' : 'Suspendre le compte'} aria-label={member.status === 'suspended' ? `Réactiver ${member.prenom} ${member.nom}` : `Suspendre ${member.prenom} ${member.nom}`} disabled={pendingId === member._id} onClick={() => updateStatus(member)}>{member.status === 'suspended' ? <RotateCcw size={16}/> : <Ban size={16}/>}</button><button className="ops-icon-button" type="button" title="Supprimer le compte" aria-label={`Supprimer ${member.prenom} ${member.nom}`} disabled={pendingId === member._id} onClick={() => deleteMember(member)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
    </section>
  </PageEntrance>;
}