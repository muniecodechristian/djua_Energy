import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Settings,
  Headphones,
  FileCode,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useLogoutMutation } from '../hooks/tanstack/useAuthMutations.js';

const mainNavItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Parc', icon: Map, path: '/parc' },
  { label: 'Interventions', icon: ClipboardList, path: '/InterventionWizard' },
  { label: 'Administration', icon: Settings, path: '/AdministrationSettings' },
];

const bottomNavItems = [
  { label: 'Support Technique', icon: Headphones, path: '/support' },
  { label: 'Docs & API', icon: FileCode, path: '/docs' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogoutMutation();

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <>
      <aside
        className={`relative flex flex-col justify-between h-screen bg-zinc-950/40 backdrop-blur-xl border-r border-zinc-800/50 text-zinc-300 transition-all duration-300 select-none z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-7 bg-zinc-900 border border-zinc-700/60 text-zinc-400 hover:text-white rounded-full p-1 cursor-pointer shadow-[0_4px_12px_rgb(0,0,0,0.5)] transition-colors hover:border-[#FF7900]/50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div>
          <div className={`flex items-center h-16 px-4 border-b border-zinc-800/40 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-[#FF7900] to-amber-500 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-[0_0_15px_rgba(255,121,0,0.3)] group-hover:shadow-[0_0_20px_rgba(255,121,0,0.5)] transition-shadow">
                D
              </div>

              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white tracking-tight group-hover:text-[#FF7900] transition-colors">Djua Energy</span>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">Télémétrie & Flotte</span>
                </div>
              )}
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-150px)] no-scrollbar">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 relative group ${
                    isActive
                      ? 'bg-[#FF7900] text-white shadow-[0_0_15px_rgba(255,121,0,0.3)]'
                      : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isCollapsed
                          ? 'absolute top-1 right-1 w-2 h-2 p-0 bg-white text-transparent shadow-[0_0_8px_#FF7900]'
                          : isActive
                            ? 'bg-white text-[#FF7900]'
                            : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40'
                      }`}
                    >
                      {!isCollapsed && item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-zinc-800/40 space-y-1 bg-zinc-950/60 backdrop-blur-md">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-[#FF7900] text-white shadow-[0_0_15px_rgba(255,121,0,0.3)]'
                    : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          <div className={`pt-3 mt-2 border-t border-zinc-800/40 flex items-center justify-between ${isCollapsed ? 'justify-center' : 'px-1'}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-200 flex-shrink-0 shadow-inner">
                CM
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-200 truncate leading-tight">Christian M.</span>
                  <span className="text-[10px] font-medium text-zinc-500 truncate leading-tight mt-0.5">Admin Système</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar { width: 5px; }
            .no-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .no-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .no-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF7900; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `,
        }} />
      </aside>

    </>
  );
}
