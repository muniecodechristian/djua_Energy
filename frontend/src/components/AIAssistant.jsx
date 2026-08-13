import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Minimize2, 
  RotateCcw, 
  User, 
  ChevronRight,
  Zap
} from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Bonjour Christian ! Je suis l\'assistant intelligent Djua. Comment puis-je vous aider dans la gestion de votre parc aujourd\'hui ?',
      time: 'À l\'instant'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll vers le bas lors de l'envoi d'un message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulation de réponse de l'IA (À remplacer par ton API backend / OpenAI / Gemini)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Analyse en cours... J'ai vérifié les données télémétriques. Tout fonctionne de manière optimale.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (text) => {
    setInput(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* 1. FENÊTRE DU CHAT (Visible uniquement si isOpen === true) */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[520px] bg-[#0d1322]/95 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* HEADER */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#111827] via-[#1a2338] to-[#111827] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7900] to-amber-400 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(255,121,0,0.3)]">
                  <div className="w-full h-full bg-[#0D121D] rounded-[10px] flex items-center justify-center">
                    <Bot size={18} className="text-[#FF7900]" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0D121D]"></span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">Djua Copilot</h3>
                  <span className="bg-[#FF7900]/10 text-[#FF7900] border border-[#FF7900]/30 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Assistant virtuel en ligne</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setMessages([messages[0]])} 
                title="Réinitialiser la discussion"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <RotateCcw size={15} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* ZONE DE MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-[#070a11]/40">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isAi ? 'items-start' : 'items-end justify-end'}`}>
                  {isAi && (
                    <div className="w-7 h-7 rounded-lg bg-[#FF7900]/10 border border-[#FF7900]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={14} className="text-[#FF7900]" />
                    </div>
                  )}

                  <div className={`max-w-[80%] space-y-1 ${isAi ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        isAi
                          ? 'bg-[#161f33] border border-slate-700/60 text-slate-200 rounded-tl-xs'
                          : 'bg-gradient-to-r from-[#FF7900] to-amber-500 text-white rounded-br-xs font-semibold'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 px-1 block">{msg.time}</span>
                  </div>

                  {!isAi && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mb-4">
                      <User size={14} className="text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Indicateur de saisie "L'IA réfléchit..." */}
            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FF7900]/10 border border-[#FF7900]/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-[#FF7900] animate-pulse" />
                </div>
                <div className="bg-[#161f33] border border-slate-700/60 p-3 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#FF7900] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#FF7900] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#FF7900] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* SUGGESTIONS / ACTIONS RAPIDES */}
          <div className="px-3 py-2 bg-[#0b0f1a] border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => handleQuickAction("Rapport des hubs critiques à Goma")}
              className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-full px-2.5 py-1 whitespace-nowrap flex items-center gap-1 transition-colors"
            >
              <Zap size={10} className="text-amber-400" /> Hubs critiques Goma
            </button>
            <button 
              onClick={() => handleQuickAction("Statut global du parc RDC")}
              className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors"
            >
              Statut RDC
            </button>
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSend} className="p-3 bg-[#0d1322] border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question à l'IA..."
              className="flex-1 bg-[#070a11] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF7900] to-amber-500 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(255,121,0,0.4)] transition-all flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}

      {/* 2. BOUTON FLOTTANT (Trigger principal) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF7900] to-amber-400 p-0.5 shadow-[0_10px_25px_rgba(255,121,0,0.35)] hover:shadow-[0_12px_30px_rgba(255,121,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="w-full h-full bg-[#0D121D] group-hover:bg-[#111827] rounded-full flex items-center justify-center transition-colors">
          {isOpen ? (
            <X size={24} className="text-white transition-transform duration-300 rotate-90" />
          ) : (
            <div className="relative">
              <Bot size={26} className="text-[#FF7900] group-hover:scale-110 transition-transform" />
              <Sparkles size={12} className="text-amber-300 absolute -top-1 -right-1.5 animate-pulse" />
            </div>
          )}
        </div>

        {/* Badge de notification (optionnel) */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-[#070A10] animate-pulse"></span>
        )}
      </button>

    </div>
  );
}