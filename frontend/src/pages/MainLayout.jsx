import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Search, Bell, Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Sidebar from '@/components/Sidebar';
import AIAssistant from '@/components/AIAssistant';

const PageLoader = () => (
  <div className="min-h-[70vh] w-full flex flex-col items-center justify-center relative overflow-hidden font-sans bg-black">
    <div className="relative flex flex-col items-center gap-5 z-10">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-zinc-900 border-t-[#FF7900] animate-spin"></div>
        <div className="absolute w-9 h-9 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shadow-sm">
          <Bot size={18} className="text-[#FF7900]" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-extrabold text-white tracking-wider uppercase">Chargement</span>
          <Sparkles size={13} className="text-[#FF7900] animate-pulse" />
        </div>
        <p className="text-[11px] font-medium text-zinc-500 tracking-wide">
          Préparation de votre espace de travail...
        </p>
      </div>

      <div className="w-40 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#FF7900] animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-black text-zinc-200 font-sans overflow-hidden">
      
      <div className="relative z-20">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto bg-black relative z-10">
        <header className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-zinc-900 bg-black/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <Menu size={22} />
            </Button>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">Heureux de vous revoir, Christian !</h2>
              <p className="text-xs text-zinc-500 hidden sm:block">Distribution et déploiement des kits solaires par province en RDC</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-40 sm:w-64 hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Rechercher une province..." 
                className="pl-9 bg-zinc-900/40 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-[#FF7900] rounded-xl transition-all" 
              />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="icon" className="bg-zinc-900/40 border-zinc-800 text-white hover:bg-zinc-800 hover:text-[#FF7900] rounded-xl transition-colors">
                <Bell size={18} />
              </Button>
            </motion.div>
          </div>
        </header>

        <div className="flex-1 bg-black">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>

        <AIAssistant />
      </main>
    </div>
  );
}