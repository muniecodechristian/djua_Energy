import React, { createContext, useContext, useState } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 1. CONTEXTE ---
const SidebarContext = createContext(null);

export function useSidebar() { 
  const context = useContext(SidebarContext);
  if (!context) throw new Error("Sidebar must be used within SidebarProvider");
  return context; 
}

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ open, toggleSidebar: () => setOpen(!open) }}>
      {children}
    </SidebarContext.Provider>
  );
}

// --- 2. COMPOSANTS DE STRUCTURE ---
export function Sidebar({ children, className }) {
  const { open } = useSidebar();
  return (
    <aside className={cn(
      // sticky top-0 + h-screen font que la sidebar ne bouge JAMAIS au défilement
      "sticky top-0 h-screen shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col z-40",
      open ? "w-64" : "w-16",
      className
    )}>
      {children}
    </aside>
  );
}

export function SidebarInset({ children, className }) {
  return (
    <div className={cn("flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200", className)}>
      {children}
    </div>
  );
}

export function SidebarHeader({ children, className }) { 
  return <div className={cn("p-4 flex items-center h-16 border-b border-slate-200/80 dark:border-slate-800/80", className)}>{children}</div>; 
}

export function SidebarContent({ children, className }) { 
  return <div className={cn("flex-1 overflow-y-auto p-3", className)}>{children}</div>; 
}

export function SidebarFooter({ children, className }) { 
  return <div className={cn("p-3 mt-auto border-t border-slate-200/80 dark:border-slate-800/80", className)}>{children}</div>; 
}

export function SidebarTrigger({ className }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button 
      onClick={toggleSidebar} 
      className={cn("p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors", className)}
    >
      <PanelLeft size={20} />
    </button>
  );
}