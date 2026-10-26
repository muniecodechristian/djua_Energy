import React, { useState, useEffect } from "react";
import { Outlet, Navigate, NavLink, useLocation } from "react-router-dom";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar"; 
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Printer, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- LIENS DE NAVIGATION ---
const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Élèves", icon: Users, path: "/studentdetails" },
  { title: "Distribution", icon: CreditCard, path: "/addstudent" },
  { title: "Impressions", icon: Printer, path: "/print" },
  { title: "Paramètres", icon: Settings, path: "/settings" },
];

// Composant interne pour le contenu de la Sidebar (accès au statut 'open')
function SidebarInner() {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar>
      {/* En-tête de la Sidebar */}
      <SidebarHeader>
        <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white overflow-hidden">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0">
            S
          </div>
          {open && <span className="whitespace-nowrap text-sm tracking-tight">SolarKits</span>}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.title}
                to={item.path} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {open && <span className="whitespace-nowrap">{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Footer / User Profile */}
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
              C
            </div>
            {open && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">Christian</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Admin</p>
              </div>
            )}
          </div>
          {open && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0">
              <LogOut size={14} />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function PrivateLayout({ isAuthenticated }) {
  // 1. Détection initiale du thème (localStorage ou préférence système)
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // 2. Persistance et application de la classe 'dark'
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; 
  }

  const toggleTheme = () => {
    setIsDark((prevIsDark) => !prevIsDark);
  };

  return (
    /* Redéfinition de la largeur de la sidebar à 13rem via variable CSS */
    <SidebarProvider style={{ "--sidebar-width": "13rem" }}>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* Sidebar */}
        <SidebarInner />

        {/* Zone de droite (Header + Contenu) */}
        <SidebarInset>
          
          {/* Header fixe */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger /> 
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Heureux de vous revoir, Christian !
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Distribution et déploiement des kits solaires
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Barre de recherche */}
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input 
                  placeholder="Rechercher une province..." 
                  className="pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs" 
                />
              </div>

              {/* Toggle Mode Sombre / Clair */}
              <Button 
                onClick={toggleTheme}
                variant="outline" 
                size="icon" 
                className="h-9 w-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-xs"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </Button>

              {/* Bouton notifications */}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-xs"
              >
                <Bell size={17} />
              </Button>
            </div>
          </header>

          {/* Page centrale */}
          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}