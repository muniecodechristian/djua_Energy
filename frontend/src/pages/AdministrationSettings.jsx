import { Link } from 'react-router-dom';
import { Palette, ShieldCheck, Database, ArrowUpRight, Info } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import useAuthStore from '../hooks/Zustand/useAuthStore';
export default function AdministrationSettings(){
 const user=useAuthStore(state=>state.user);
 return <div className="ops-page"><div className="ops-page-heading"><div><p className="ops-eyebrow">ESPACE DE TRAVAIL</p><h1>Paramètres</h1><p>Préférences d’affichage et informations sur les fonctions disponibles.</p></div></div>
 <div className="ops-settings-grid"><section className="ops-card ops-setting"><Palette size={22}/><h2>Apparence</h2><p>Choisissez le thème clair ou sombre. Votre préférence est conservée dans ce navigateur.</p><ThemeToggle/></section>
 <section className="ops-card ops-setting"><ShieldCheck size={22}/><h2>Session</h2><p>{user?'Connecté avec le compte '+(user.identifier||[user.prenom,user.nom].filter(Boolean).join(' '))+'.':'Vous consultez la plateforme en navigation libre. Certaines fonctions du serveur peuvent nécessiter une connexion.'}</p><Link className="ops-text-link" to="/">Page de connexion <ArrowUpRight size={15}/></Link></section>
 <section className="ops-card ops-setting"><Database size={22}/><h2>Données de supervision</h2><p>L’inventaire, les alertes et la télémétrie sont chargés depuis le serveur. Les brouillons de maintenance sont enregistrés localement.</p><Link className="ops-text-link" to="/telemetry">Consulter les mesures <ArrowUpRight size={15}/></Link></section>
 <section className="ops-card ops-setting"><Info size={22}/><h2>Administration avancée</h2><p>La gestion des rôles, l’affectation des techniciens et l’audit nécessitent des services dédiés. Ces fonctions ne sont pas encore disponibles dans cet espace.</p><span className="ops-badge info">À connecter</span></section></div></div>;
}
