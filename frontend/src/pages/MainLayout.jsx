import BackButton from '../components/BackButton';
import { motion, useReducedMotion } from 'framer-motion';
import { easeOut } from '../lib/motion';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ArrowUpRight, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import AIAssistant from '../components/AIAssistant';
import ErrorBoundary from '../components/ErrorBoundary';
import { useKitsQuery, useAlertsQuery } from '../hooks/tanstack/useKitQueries';
import { navigationForRole, pageInfo } from '../lib/navigation';
import { asList, activeAlerts, detailUrl } from '../lib/operations';
import PageSkeleton from '../components/PageSkeleton';
import useAuthStore from '../hooks/Zustand/useAuthStore';
export default function MainLayout() {
 const reduced = useReducedMotion();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dialog = useRef(null);
  const content = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const role = user?.role === 'administration' ? 'admin' : user?.role;
  const isAdmin = role === 'admin';
  const isCommercial = role === 'commercial';
  const isTechnician = role === 'technician';
  const hasRestrictedNavigation = isAdmin || isCommercial || isTechnician;
  const visibleNavigation = navigationForRole(role);
  const isTeamPage = location.pathname.toLowerCase() === '/equipe';
  const info = isCommercial && location.pathname.toLowerCase() === '/dashboard'
    ? { label: 'Tableau de bord', description: 'Votre activité commerciale et les installations à suivre.' }
    : pageInfo(location.pathname);
  const skeletonVariant = ({
    '/dashboard': 'dashboard',
    '/parc': 'table',
    '/notification': 'alerts',
    '/interventionwizard': 'maintenance',
    '/devis': 'form',
    '/devis/nouveau': 'form',
    '/administrationsettings': 'settings',
    '/smartkitdetails': 'detail',
    '/customerprofile': 'profile',
    '/operationsoverview': 'overview',
    '/equipe': 'maintenance',
    '/technicien': 'maintenance',
    '/rapports': 'table',
    '/catalogue': 'table',
  })[location.pathname.toLowerCase()] || 'dashboard';
  const secondaryPage = !visibleNavigation.some(item => item.path.toLowerCase() === location.pathname.toLowerCase());
  const isAdminOnlyPage = location.pathname.toLowerCase() === '/rapports';
  const isCatalogPage = location.pathname.toLowerCase() === '/catalogue';
  const isAdminSettingsShortcut = ['/notification', '/equipe', '/interventionwizard'].includes(location.pathname.toLowerCase());
  const restrictedPageFallback = isCommercial ? '/devis' : isTechnician ? '/technicien' : '/dashboard';
  const backFallback = isAdmin ? '/AdministrationSettings' : location.pathname.toLowerCase() === '/devis/nouveau' ? '/devis' : /smartkit|customerprofile/i.test(location.pathname) ? '/parc' : '/dashboard';
  const kits = useKitsQuery({ enabled: !hasRestrictedNavigation });
  const alerts = useAlertsQuery({ enabled: !hasRestrictedNavigation });
  const count = activeAlerts(alerts.data).length;
  useEffect(() => { document.title = info.label + ' · Djua Energy'; content.current?.scrollTo(0, 0); }, [location.pathname, info.label]);
  useEffect(() => {
    const shortcut = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); dialog.current?.showModal(); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  const results = [...visibleNavigation.map(item => ({label:item.label, description:item.description, path:item.path})), ...(!hasRestrictedNavigation ? asList(kits.data).filter(kit => kit.kitId).map(kit => ({label:kit.kitId || 'Équipement', description:kit.province || kit.region || 'Fiche équipement', path:detailUrl(kit.kitId)})) : [])].filter(item => (item.label + ' ' + item.description).toLowerCase().includes(search.toLowerCase())).slice(0, 10);
  if (isAdmin && !visibleNavigation.some(item => item.path.toLowerCase() === location.pathname.toLowerCase()) && !['/devis/nouveau'].includes(location.pathname.toLowerCase()) && !isAdminSettingsShortcut && !/smartkit|customerprofile/i.test(location.pathname)) return <Navigate to="/AdministrationSettings" replace/>;
  if (isAdminOnlyPage && !isAdmin && !isCommercial && role !== 'shop_manager') return <Navigate to={restrictedPageFallback} replace/>;
  if (isCatalogPage && !isAdmin) return <Navigate to={restrictedPageFallback} replace/>;
  if (isCommercial && !['/dashboard', '/devis', '/devis/nouveau', '/parc', '/rapports'].includes(location.pathname.toLowerCase()) && !/smartkit|customerprofile/i.test(location.pathname)) return <Navigate to="/dashboard" replace/>;
  if (isTechnician && location.pathname.toLowerCase() !== '/technicien') return <Navigate to="/technicien" replace/>;
  if (!isAdmin && location.pathname.toLowerCase() === '/administrationsettings') return <Navigate to={role === 'shop_manager' ? '/equipe' : '/dashboard'} replace/>;
  if (isTeamPage && role !== 'shop_manager' && !isAdmin) return <Navigate to={isTechnician ? '/technicien' : '/dashboard'} replace/>;
  const isShopManager = role === 'shop_manager';
  if (isShopManager && !['/dashboard', '/parc', '/notification', '/InterventionWizard', '/equipe', '/devis', '/devis/nouveau'].includes(location.pathname.toLowerCase()) && !/smartkit|customerprofile/i.test(location.pathname)) return <Navigate to="/dashboard" replace/>;
  return <div className="ops-shell">
    <a className="ops-skip-link" href="#main-content">Aller au contenu</a>
    <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
    <div className="ops-main">
      <header className="ops-topbar">
        <div className="ops-breadcrumb">{secondaryPage && <BackButton fallback={backFallback}/>}<button className="ops-icon-button ops-menu-toggle" aria-label="Ouvrir la navigation" aria-expanded={isSidebarOpen} aria-controls="primary-navigation" onClick={() => setIsSidebarOpen(true)}><Menu size={20}/></button><span className="ops-breadcrumb-root">Espace de travail</span><ChevronRight size={14}/><strong>{info.label}</strong></div>
          <div className="ops-topbar-actions">{!hasRestrictedNavigation && <><button className="ops-search-trigger" onClick={() => dialog.current?.showModal()} aria-label="Rechercher une page ou un équipement"><Search size={16}/><span>Rechercher…</span><kbd>Ctrl K</kbd></button><Link className="ops-icon-button ops-notifications" to="/notification" aria-label={alerts.isSuccess ? count + ' alertes ouvertes' : 'Consulter les alertes'}><Bell size={18}/>{count > 0 && <i/>}</Link></>}<ThemeToggle/></div>
      </header>
      <motion.main initial={reduced ? false : { opacity: 0.85, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.2, ease: easeOut }} key={location.pathname} id="main-content" tabIndex={-1} ref={content} className="ops-content"><ErrorBoundary embedded><Suspense fallback={<PageSkeleton variant={skeletonVariant}/>}><Outlet/></Suspense></ErrorBoundary></motion.main>
    </div>
    <dialog aria-label="Recherche de pages et d’équipements" className="ops-search-dialog" ref={dialog} onClick={event => { if(event.target === dialog.current) dialog.current.close(); }}>
      <div className="ops-search-head"><Search size={20}/><input aria-label="Rechercher une page ou un kit" placeholder="Rechercher une page, un équipement…" value={search} onChange={event => setSearch(event.target.value)}/><button className="ops-icon-button" aria-label="Fermer la recherche" onClick={() => dialog.current.close()}><X size={18}/></button></div>
      <p className="ops-eyebrow">Pages et équipements</p>
      <div className="ops-search-results">{results.map(item => <button key={item.path} onClick={() => { dialog.current.close(); navigate(item.path); }}><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowUpRight size={16}/></button>)}{results.length === 0 && <p className="ops-empty">Aucun résultat pour cette recherche.</p>}</div>
    </dialog>
    {!hasRestrictedNavigation && <AIAssistant/>}
  </div>;
}
