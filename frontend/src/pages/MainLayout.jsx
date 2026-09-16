import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ArrowUpRight, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import AIAssistant from '../components/AIAssistant';
import ErrorBoundary from '../components/ErrorBoundary';
import { useKitsQuery, useAlertsQuery } from '../hooks/tanstack/useKitQueries';
import { navigation, pageInfo } from '../lib/navigation';
import { asList, activeAlerts, detailUrl } from '../lib/operations';
export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dialog = useRef(null);
  const content = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const info = pageInfo(location.pathname);
  const kits = useKitsQuery();
  const alerts = useAlertsQuery();
  const count = activeAlerts(alerts.data).length;
  useEffect(() => { document.title = info.label + ' · Djua Energy'; content.current?.scrollTo(0, 0); }, [location.pathname, info.label]);
  useEffect(() => {
    const shortcut = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); dialog.current?.showModal(); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  const results = [...navigation.map(item => ({label:item.label, description:item.description, path:item.path})), ...asList(kits.data).map(kit => ({label:kit.kitId || 'Équipement', description:kit.province || kit.region || 'Fiche équipement', path:detailUrl(kit.kitId)}))].filter(item => (item.label + ' ' + item.description).toLowerCase().includes(search.toLowerCase())).slice(0, 10);
  return <div className="ops-shell">
    <a className="ops-skip-link" href="#main-content">Aller au contenu</a>
    <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
    <div className="ops-main">
      <header className="ops-topbar">
        <div className="ops-breadcrumb"><button className="ops-icon-button ops-menu-toggle" aria-label="Ouvrir la navigation" aria-expanded={isSidebarOpen} aria-controls="primary-navigation" onClick={() => setIsSidebarOpen(true)}><Menu size={20}/></button><span className="ops-breadcrumb-root">Espace de travail</span><ChevronRight size={14}/><strong>{info.label}</strong></div>
        <div className="ops-topbar-actions"><button className="ops-search-trigger" onClick={() => dialog.current?.showModal()} aria-label="Rechercher une page ou un équipement"><Search size={16}/><span>Rechercher…</span><kbd>Ctrl K</kbd></button><Link className="ops-icon-button ops-notifications" to="/notification" aria-label={alerts.isSuccess ? count + ' alertes ouvertes' : 'Consulter les alertes'}><Bell size={18}/>{count > 0 && <i/>}</Link><ThemeToggle/></div>
      </header>
      <main id="main-content" tabIndex={-1} ref={content} className="ops-content"><ErrorBoundary embedded><Suspense fallback={<div className="ops-empty" role="status">Chargement de votre espace…</div>}><Outlet/></Suspense></ErrorBoundary></main>
    </div>
    <dialog className="ops-search-dialog" ref={dialog} onClick={event => { if(event.target === dialog.current) dialog.current.close(); }}>
      <div className="ops-search-head"><Search size={20}/><input aria-label="Rechercher une page ou un kit" placeholder="Rechercher une page, un équipement…" value={search} onChange={event => setSearch(event.target.value)}/><button className="ops-icon-button" aria-label="Fermer la recherche" onClick={() => dialog.current.close()}><X size={18}/></button></div>
      <p className="ops-eyebrow">Pages et équipements</p>
      <div className="ops-search-results">{results.map(item => <button key={item.path} onClick={() => { dialog.current.close(); navigate(item.path); }}><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowUpRight size={16}/></button>)}{results.length === 0 && <p className="ops-empty">Aucun résultat pour cette recherche.</p>}</div>
    </dialog>
    <AIAssistant/>
  </div>;
}
