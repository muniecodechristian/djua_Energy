import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2,
  RotateCcw,
  User,
  Zap,
  Copy,
  Check,
  AlertCircle,
  CornerDownLeft,
} from "lucide-react";
import api from "../api/axios";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Bonjour Christian ! Je suis **Djua Copilot**. Comment puis-je vous aider dans la gestion et le suivi de votre parc aujourd'hui ?",
      time: "À l'instant",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll vers le bas
  const scrollToBottom = (behavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus sur l'input au premier affichage
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isTyping]);

  // Écoute la touche Echap pour fermer la modale et l'événement global 'open-ai-chat'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleOpenAIChat = (e) => {
      const { message } = e.detail || {};
      setIsOpen(true);
      if (message) {
        // Laisser le temps à la boîte de s'ouvrir avant d'envoyer
        setTimeout(() => {
          sendMessage(message);
        }, 300);
      }
    };
    window.addEventListener("open-ai-chat", handleOpenAIChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenAIChat);
  }, []);

  // Ajustement automatique de la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const extractAIText = (payload) => {
    const data = payload?.data ?? payload;
    if (!data) return "";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      if (typeof data.message === "string") return data.message;
      if (typeof data.text === "string") return data.text;
      if (typeof data.reply === "string") return data.reply;
      if (Array.isArray(data))
        return data.map((d) => extractAIText(d)).join("\n");
      if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
        const c = data.choices[0];
        if (typeof c.text === "string") return c.text;
        if (c.message && typeof c.message.content === "string")
          return c.message.content;
      }
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  const sendMessage = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsTyping(true);

    try {
      const resp = await api.post("/ai/conversation", {
        context: {},
        message: userMessage.text,
      });
      const payload = resp.data?.data ?? resp.data;
      const text = extractAIText(payload) || "Aucune réponse reçue de l'IA.";

      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Erreur réseau lors de la communication.";
      const aiError = {
        id: Date.now() + 1,
        sender: "ai",
        isError: true,
        text: `Une erreur est survenue : ${errMsg}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiError]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now(),
        sender: "ai",
        text: "Discussion réinitialisée. Comment puis-je vous aider ?",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans antialiased">
      {/* FENÊTRE PRINCIPALE DU CHAT */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[82vh] bg-[#0B0F19]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out">
          {/* HEADER PREMIUM */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900/90 via-[#131B2E]/80 to-slate-900/90 border-b border-white/[0.08] flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-[1.5px] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                    <Bot size={20} className="text-amber-400" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#0B0F19]">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    Djua Copilot
                  </h3>
                  <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    PRO AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Assistant de parc intelligent
                </p>
              </div>
            </div>

            {/* CONTROLES HEADER */}
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
              <button
                onClick={handleReset}
                title="Réinitialiser la conversation"
                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all duration-200"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Réduire"
                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all duration-200"
              >
                <Minimize2 size={14} />
              </button>
            </div>
          </div>

          {/* ZONE DE MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent bg-gradient-to-b from-transparent via-[#060911]/30 to-[#060911]/60">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 group ${isAi ? "items-start" : "items-end justify-end"}`}
                >
                  {isAi && (
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Sparkles size={13} className="text-amber-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] space-y-1 ${isAi ? "text-left" : "text-right"}`}
                  >
                    <div
                      className={`relative p-3.5 rounded-2xl text-xs font-normal leading-relaxed shadow-lg transition-all ${
                        msg.isError
                          ? "bg-red-500/10 border border-red-500/30 text-red-200 rounded-tl-sm"
                          : isAi
                            ? "bg-[#131C2E]/90 border border-white/[0.08] text-slate-200 rounded-tl-sm backdrop-blur-md"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-br-sm shadow-amber-500/10"
                      }`}
                    >
                      {msg.isError && (
                        <div className="flex items-center gap-1.5 mb-1 text-red-400 font-semibold text-[11px]">
                          <AlertCircle size={13} />
                          <span>Erreur système</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>

                      {/* Bouton copier au survol pour les messages IA */}
                      {isAi && !msg.isError && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="absolute -bottom-2.5 right-2 opacity-0 group-hover:opacity-100 bg-[#1B263B] border border-white/10 text-slate-400 hover:text-white p-1 rounded-md transition-all duration-200 shadow-md"
                          title="Copier le message"
                        >
                          {copiedId === msg.id ? (
                            <Check size={11} className="text-emerald-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] font-medium text-slate-500 px-1.5 block">
                      {msg.time}
                    </span>
                  </div>

                  {!isAi && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0 mb-4 shadow-sm">
                      <User size={13} className="text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* INDICATEUR DE TYPING DYNAMIQUE */}
            {isTyping && (
              <div className="flex items-center gap-3 animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles
                    size={13}
                    className="text-amber-400 animate-pulse"
                  />
                </div>
                <div className="bg-[#131C2E]/90 border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ACTIONS RAPIDES / SUGGESTIONS */}
          <div className="px-3 py-2 bg-[#080C14]/90 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => sendMessage("Rapport des hubs critiques à Goma")}
              className="text-[11px] font-medium text-slate-300 bg-white/[0.04] hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-300 border border-white/[0.08] rounded-xl px-3 py-1.5 whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            >
              <Zap size={11} className="text-amber-400" /> Hubs Goma
            </button>
            <button
              onClick={() => sendMessage("Statut global du parc RDC")}
              className="text-[11px] font-medium text-slate-300 bg-white/[0.04] hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-300 border border-white/[0.08] rounded-xl px-3 py-1.5 whitespace-nowrap transition-all duration-200 active:scale-95"
            >
              Statut parc RDC
            </button>
          </div>

          {/* ZONE D'INPUT AVEC TEXTAREA AUTO-RESIZE */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-[#080C14] border-t border-white/[0.08] flex items-end gap-2"
          >
            <div className="flex-1 relative bg-[#0F1626] border border-white/[0.1] focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 rounded-2xl transition-all duration-200">
              <textarea
                ref={(e) => {
                  textareaRef.current = e;
                  inputRef.current = e;
                }}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question à Djua..."
                className="w-full bg-transparent px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-28 scrollbar-thin scrollbar-thumb-slate-700"
              />
              <div className="hidden sm:flex items-center gap-1 absolute right-2.5 bottom-2.5 text-[10px] text-slate-600 font-mono pointer-events-none">
                <span>↵</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all duration-200 flex-shrink-0"
            >
              <Send
                size={15}
                className={
                  input.trim()
                    ? "translate-x-0.5 -translate-y-0.5 transition-transform"
                    : ""
                }
              />
            </button>
          </form>
        </div>
      )}

      {/* BOUTON FLOTTANT TRIGGER (MODERN FLOATING ACTION BUTTON) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-[1.5px] shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="w-full h-full bg-[#0B0F19] group-hover:bg-[#111726] rounded-[14px] flex items-center justify-center transition-colors">
          {isOpen ? (
            <X
              size={22}
              className="text-white transition-transform duration-300 rotate-90"
            />
          ) : (
            <div className="relative">
              <Bot
                size={24}
                className="text-amber-400 group-hover:scale-110 transition-transform duration-300"
              />
              <Sparkles
                size={11}
                className="text-amber-200 absolute -top-1 -right-1.5 animate-pulse"
              />
            </div>
          )}
        </div>

        {/* Badge d'état quand la fenêtre est fermée */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-4 ring-[#0B0F19]">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
          </span>
        )}
      </button>
    </div>
  );
}
