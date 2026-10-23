import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { quickSpring } from '../lib/motion';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Sun, PanelLeftClose, PanelLeftOpen, X, LogOut, LogIn } from 'lucide-react';
import { navigationForRole } from '../lib/navigation';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { useLogoutMutation } from '../hooks/tanstack/useAuthMutations';

const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBjEVP6WMcrEsv2nLYSgS9v4WfV711u6ne8fa0aJHDt8jAPuumn7dzikn8PIFEYq7whxH5iUZF0Hp4b92Z9SI44LG4uRnir7pr0-ES6zx8j0xpVv2pEq-x2t_pioe64Plt7nSVa8R3qmC0HbNrrXrNmnwO6NR6nrr80S_g0KTAAhwU7TLDwQxylz9da34eGd7zyXiuyuz5ah02oKZx3i2MRdZVu6H3tfwGv5hNcm8A_UvHUSZdbWh7He3c3Alx5dlSJzww";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
 const reduced = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const panel = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const sync = () => setMobile(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!mobile || !isSidebarOpen) return;
    const previous = document.activeElement;
    const links = () => [...panel.current.querySelectorAll('a, button:not(:disabled)')].filter(el => el.getClientRects().length);
    links()[0]?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const items = links();
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const element = panel.current;
    element.addEventListener('keydown', trap);
    return () => { element.removeEventListener('keydown', trap); previous?.focus(); };
  }, [mobile, isSidebarOpen]);
  const user = useAuthStore(state => state.user);
  const role = user?.role === 'administration' ? 'admin' : user?.role;
  const visibleNavigation = navigationForRole(role);
  const sections = [...new Set(visibleNavigation.map(item => item.section))];
  const showSectionLabels = !['admin', 'commercial'].includes(role);
  const logout = useLogoutMutation();
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setIsSidebarOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [setIsSidebarOpen]);
  return <>
    <AnimatePresence>{isSidebarOpen && <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="ops-backdrop" aria-label="Fermer la navigation" onClick={() => setIsSidebarOpen(false)} />}</AnimatePresence>
    <aside ref={panel} inert={mobile && !isSidebarOpen ? true : undefined} id="primary-navigation" className={'ops-sidebar ' + (collapsed ? 'is-collapsed ' : '') + (isSidebarOpen ? 'is-open' : '')}>
      <Link to={role === 'admin' ? '/AdministrationSettings' : role === 'commercial' ? '/devis' : '/dashboard'} className="ops-brand" onClick={() => setIsSidebarOpen(false)}><span className="ops-brand-icon" style={{ background: 'transparent' }}><img src={LOGO_URL} alt="Djua Energy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span><span className="ops-nav-label"><strong>djua<span className="ops-brand-light"> energy</span></strong><small>SOLAR OPERATIONS</small></span></Link>
      <button className="ops-mobile-close ops-icon-button" aria-label="Fermer le menu" onClick={() => setIsSidebarOpen(false)}><X size={18}/></button>
      <LayoutGroup id="primary-nav"><nav aria-label="Navigation principale">
        {sections.map(section => <div className="ops-nav-group" key={section}>
          {showSectionLabels && <p className="ops-nav-section">{section}</p>}
          {visibleNavigation.filter(item => item.section === section).map(({path, label, icon: Icon}) => <NavLink key={path} to={path} title={label} onClick={() => setIsSidebarOpen(false)} className={({isActive}) => 'ops-nav-item' + (isActive ? ' is-active' : '')}>{({isActive}) => <>{isActive && <motion.span className="ops-nav-indicator" layoutId="active-nav" transition={reduced ? { duration: 0 } : quickSpring}/>}<Icon size={18}/><span className="ops-nav-label">{label}</span></>}</NavLink>)}
        </div>)}
      </nav></LayoutGroup>
      <div className="ops-sidebar-bottom">
        <div className="ops-workspace ops-nav-label"><span className="ops-status-dot"/><span>Espace de supervision<small>Parc solaire · RDC</small></span></div>
        <div className="ops-account"><div className="ops-avatar">{user?.prenom?.[0] || 'V'}</div><div className="ops-nav-label"><strong>{user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Visiteur'}</strong><small>{user ? 'Session connectée' : 'Navigation libre'}</small></div>{user ? <button className="ops-icon-button" aria-label="Se déconnecter" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut size={17}/></button> : <Link className="ops-icon-button" to="/login" aria-label="Se connecter"><LogIn size={17}/></Link>}</div>
        <button className="ops-collapse" aria-label={collapsed ? 'Développer la navigation' : 'Réduire la navigation'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={17}/> : <><PanelLeftClose size={17}/><span>Réduire le menu</span></>}</button>
      </div>
    </aside>
  </>;
}
