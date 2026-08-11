import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  Wrench,
  Radio,
  Box,
  ClipboardList,
  Users,
  MessageSquare,
  Bell,
  Settings,
  Headphones,
  FileCode,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FilePlus,
  Activity
} from 'lucide-react';
import QuickSubscriptionButton from './QuickSubscriptionButton';

const mainNavItems = [
  { label: 'Statut Centrale', icon: Zap, path: '/dashboard' },
  { label: 'Souscription OE', icon: FilePlus, path: '/subscription', badge: 'Nouveau' },
  { label: 'Decisions', icon: MessageSquare, path: '/decision' },
  { label: 'Kits intelligent', icon: Box, path: '/SmartKitdetails' },
  { label: 'Suivi de Flotte', icon: Radio, path: '/FleetMonitoring' },
  { label: 'Interventions', icon: ClipboardList, path: '/InterventionWizard' },
  { label: 'Clients', icon: Users, path: '/CustomerProfile' },
  { label: 'Opérations', icon: Wrench, path: '/OperationsOverview', badge: '12' },
  { label: 'Notifications', icon: Bell, path: '/notification' },
  { label: 'Télémétrie IoT',   icon: Activity,       path: '/telemetry', badge: 'Live' },
  { label: 'Registre Orange', icon: ClipboardList, path: '/orange-kits' },
  { label: 'Administration', icon: Settings, path: '/AdministrationSettings' },
];

const bottomNavItems = [
  { label: 'Support Technique', icon: Headphones, path: '/support' },
  { label: 'Docs & API', icon: FileCode, path: '/docs' },
];

import { useLogoutMutation } from '../hooks/tanstack/useAuthMutations.js';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogoutMutation();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/')
    });
  };

  return (
    <>
      <aside
        className={`relative flex flex-col justify-between h-screen bg-zinc-950/40 backdrop-blur-xl border-r border-zinc-800/50 text-zinc-300 transition-all duration-300 select-none z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Bouton Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-7 bg-zinc-900 border border-zinc-700/60 text-zinc-400 hover:text-white rounded-full p-1 cursor-pointer shadow-[0_4px_12px_rgb(0,0,0,0.5)] transition-colors hover:border-[#FF7900]/50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* En-tête : Logo & Titre */}
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

          {/* Navigation Principale */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-150px)] no-scrollbar">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 relative group ${
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

        {/* Bas du menu : Support & Utilisateur */}
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

          {/* Profil Utilisateur */}
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

        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </aside>

      {/* Bouton flottant accessible globalement */}
      <QuickSubscriptionButton />
    </>
  );
}