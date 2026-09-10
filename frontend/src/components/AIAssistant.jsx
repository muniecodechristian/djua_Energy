import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  RotateCcw,
  User,
  Zap,
  Copy,
  Check,
  AlertCircle,
  MapPin,
} from "lucide-react";
import api from "../api/axios";

const getFriendlyAIError = (error) => {
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "Le service met plus de temps que prévu à répondre. Réessayez dans quelques instants.";
  }

  switch (error?.response?.status) {
    case 401:
    case 403:
      return "Votre session ne permet pas d'utiliser l'assistant. Reconnectez-vous puis réessayez.";
    case 429:
      return "Trop de demandes sont en cours. Patientez un instant avant de réessayer.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "L'assistant est momentanément indisponible. Réessayez dans quelques instants.";
    default:
      return "Nous n'avons pas pu obtenir de réponse. Vérifiez votre connexion puis réessayez.";
  }
};

// Composant pour l'affichage des messages IA avec effet streaming et questions suggérées
const AIMessageBubble = ({ msg, handleCopy, copiedId, onSuggestionClick }) => {
  const [isTyping, setIsTyping] = useState(msg.isNew);
  const [displayedText, setDisplayedText] = useState(msg.isNew ? "" : msg.text);

  useEffect(() => {
    if (!msg.isNew) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index < msg.text.length) {
        setDisplayedText((prev) => prev + msg.text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 10); // Vitesse de streaming (10ms par caractère = rapide et fluide)
    return () => clearInterval(interval);
  }, [msg.isNew, msg.text]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        className={`relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed transition-all w-fit shadow-sm ${msg.isError
          ? "bg-red-950/40 border border-red-800/50 text-red-200 rounded-tl-xs"
          : "bg-[var(--panel-alt)] border border-[var(--panel-border)] text-[var(--app-foreground)] rounded-tl-xs"
          }`}
      >
        {msg.isError && (
          <div className="flex items-center gap-1.5 mb-1.5 text-red-400 font-medium text-xs">
            <AlertCircle size={13} />
            <span>Assistant momentanément indisponible</span>
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">
          {displayedText}
          {isTyping && <span className="inline-block w-1.5 h-3.5 ml-1 bg-zinc-400 animate-pulse align-middle rounded-sm" />}
        </div>

        {/* Bouton copier sobre au survol */}
        {!msg.isError && !isTyping && (
          <button
            onClick={() => handleCopy(msg.id, msg.text)}
            className="absolute -bottom-2.5 right-3 opacity-0 group-hover:opacity-100 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] p-1 rounded-md transition-all duration-150 shadow-md"
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

      {/* Affichage Senior des Next Questions */}
      {!isTyping && msg.nextQuestions && msg.nextQuestions.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-0.5 max-w-[95%]">
          {msg.nextQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(q)}
              className="text-left text-[12px] font-medium text-amber-500/90 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-xl px-3.5 py-2 transition-all duration-200 active:scale-[0.98] w-fit"
            >
              <div className="flex items-start gap-2">
                <Zap size={13} className="mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{q}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const extractAIPayload = (payload) => {
    const data = payload?.data ?? payload;
    if (!data) return { text: "Aucune réponse reçue.", nextQuestions: [] };

    // Si c'est le format spécifique avec assistant_message
    if (data.assistant_message) {
      return {
        text: data.assistant_message,
        nextQuestions: data.next_questions || []
      };
    }

    // Ne jamais afficher directement une erreur renvoyée dans une réponse 2xx.
    if (data.error || data.errors) {
      return {
        text: "L'assistant est momentanément indisponible. Réessayez dans quelques instants.",
        nextQuestions: []
      };
    }

    // Fallback parsing (string, object text/message, etc.)
    if (typeof data === "string") return { text: data, nextQuestions: [] };
    if (typeof data === "object") {
      if (typeof data.message === "string") return { text: data.message, nextQuestions: [] };
      if (typeof data.text === "string") return { text: data.text, nextQuestions: [] };
      if (typeof data.reply === "string") return { text: data.reply, nextQuestions: [] };
      if (Array.isArray(data)) return { text: data.map(d => extractAIPayload(d).text).join("\n"), nextQuestions: [] };
      if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
        const c = data.choices[0];
        if (typeof c.text === "string") return { text: c.text, nextQuestions: [] };
        if (c.message && typeof c.message.content === "string") return { text: c.message.content, nextQuestions: [] };
      }
      return { text: "Je n'ai pas pu interpréter cette réponse. Vous pouvez reformuler votre demande.", nextQuestions: [] };
    }
    return { text: String(data), nextQuestions: [] };
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
      const resp = await api.post("/ai/chat", {
        context: {},
        message: userMessage.text,
      });
      const payload = resp.data?.data ?? resp.data;
      const parsed = extractAIPayload(payload);

      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: parsed.text,
        nextQuestions: parsed.nextQuestions,
        isNew: true, // Pour déclencher l'effet typewriter
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[AIAssistant] Request failed", {
          code: err?.code,
          status: err?.response?.status,
        });
      }

      const aiError = {
        id: Date.now() + 1,
        sender: "ai",
        isError: true,
        text: getFriendlyAIError(err),
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
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 font-sans antialiased">
      {/* FENÊTRE PRINCIPALE DU CHAT */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[520px] h-[min(700px,calc(100vh-7rem))] max-h-[86vh] bg-[var(--panel)] text-[var(--app-foreground)] border border-[var(--panel-border)] rounded-[28px] shadow-2xl shadow-black/30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 ease-out">
          {/* HEADER EDITORIAL & TACTILE */}
          <div className="px-5 py-4 bg-[var(--panel)] border-b border-[var(--panel-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#e7edf0] border border-[#cbd5d8] overflow-hidden flex items-center justify-center shadow-inner">
                  <img src="/bot.gif" alt="" aria-hidden="true" className="w-[135%] h-[135%] max-w-none object-cover mix-blend-multiply" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#18181b]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-[var(--app-foreground)] tracking-tight">
                    Djua Copilot
                  </h3>
                  <span className="bg-[var(--panel-alt)] text-[var(--muted-foreground)] border border-[var(--panel-border)] text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Copilot
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] font-normal">
                  Assistant de parc
                </p>
              </div>
            </div>

            {/* CONTROLES HEADER */}
            <div className="flex items-center gap-0.5 bg-[var(--panel-alt)] p-1 rounded-xl border border-[var(--panel-border)]">
              <button
                onClick={handleReset}
                title="Réinitialiser la conversation"
                className="p-1.5 hover:bg-[var(--panel)] text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] rounded-lg transition-colors duration-150"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Fermer l’assistant"
                aria-label="Fermer l’assistant"
                className="p-1.5 hover:bg-[var(--panel)] text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] rounded-lg transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ZONE DE MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--app-surface)]">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 group ${isAi ? "items-start" : "items-end justify-end"}`}
                >
                  {isAi && (
                    <div className="w-7 h-7 rounded-full bg-[#e7edf0] border border-[#cbd5d8] overflow-hidden flex items-center justify-center flex-shrink-0 mt-1 shadow-inner">
                      <img src="/bot.gif" alt="" aria-hidden="true" className="w-[140%] h-[140%] max-w-none object-cover mix-blend-multiply" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] space-y-1 ${isAi ? "text-left" : "text-right"}`}
                  >
                    {isAi ? (
                      <AIMessageBubble
                        msg={msg}
                        handleCopy={handleCopy}
                        copiedId={copiedId}
                        onSuggestionClick={(q) => sendMessage(q)}
                      />
                    ) : (
                      <div className="relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed transition-all bg-orange-500 border border-orange-400 text-white font-medium rounded-tr-xs shadow-sm">
                        <div className="whitespace-pre-wrap break-words">
                          {msg.text}
                        </div>
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-zinc-500 px-1 block">
                      {msg.time}
                    </span>
                  </div>

                  {!isAi && (
                    <div className="w-6 h-6 rounded-full bg-[var(--panel-alt)] border border-[var(--panel-border)] flex items-center justify-center flex-shrink-0 mb-4 text-[var(--muted-foreground)]">
                      <User size={12} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* INDICATEUR DE CHARGEMENT ÉLÉGANT */}
            {isTyping && (
              <div className="flex items-center gap-2.5 animate-in fade-in duration-150">
                <div className="w-7 h-7 rounded-full bg-[#e7edf0] border border-[#cbd5d8] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                  <img src="/bot.gif" alt="" aria-hidden="true" className="w-[140%] h-[140%] max-w-none object-cover mix-blend-multiply" />
                </div>
                <div className="bg-[#1c1c1f] border border-[#27272a] px-3.5 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* SUGGESTIONS PINTEREST (CHIPS CLEANS) */}
          <div className="px-3.5 py-2 bg-[var(--panel)] border-t border-[var(--panel-border)] flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => sendMessage("Rapport des hubs critiques à Goma")}
              className="text-xs font-medium text-[var(--app-foreground)] bg-[var(--panel-alt)] hover:bg-[var(--panel)] border border-[var(--panel-border)] rounded-full px-3.5 py-1.5 whitespace-nowrap flex items-center gap-1.5 transition-all duration-150 active:scale-95"
            >
              <MapPin size={12} className="text-orange-400" /> Hubs Goma
            </button>
            <button
              onClick={() => sendMessage("Statut global du parc RDC")}
              className="text-xs font-medium text-[var(--app-foreground)] bg-[var(--panel-alt)] hover:bg-[var(--panel)] border border-[var(--panel-border)] rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all duration-150 active:scale-95"
            >
              Statut parc RDC
            </button>
          </div>

          {/* ZONE D'INPUT CHAUDE ET TACTILE */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-[var(--panel)] border-t border-[var(--panel-border)] flex items-end gap-2"
          >
            <div className="flex-1 relative bg-[var(--panel-alt)] border border-[var(--panel-border)] focus-within:border-[#FF7900] rounded-2xl transition-colors duration-150">
              <textarea
                ref={(e) => {
                  textareaRef.current = e;
                  inputRef.current = e;
                }}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message à Djua..."
                className="w-full bg-transparent px-3.5 py-2.5 text-xs text-[var(--app-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none resize-none max-h-28 scrollbar-thin scrollbar-thumb-zinc-700"
              />
              <div className="hidden sm:flex items-center gap-1 absolute right-3 bottom-2.5 text-[10px] text-zinc-500 font-mono pointer-events-none">
                <span>↵</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-40 disabled:hover:bg-orange-500 flex items-center justify-center transition-all duration-150 active:scale-95 flex-shrink-0 shadow-sm"
            >
              <Send size={14} className="translate-x-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* BOUTON FLOTTANT TACTILE (PINTEREST FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
        className="group relative flex items-center gap-2.5 h-14 rounded-full bg-[var(--panel)] hover:bg-[var(--panel-alt)] border border-[var(--panel-border)] text-[var(--app-foreground)] shadow-xl shadow-black/30 active:scale-95 transition-all duration-200 px-2.5 pr-4"
      >
        {isOpen ? (
          <X size={20} className="text-zinc-200 transition-transform duration-200" />
        ) : (
          <>
            <span className="w-10 h-10 rounded-full bg-[#e7edf0] border border-[#cbd5d8] overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200">
              <img src="/bot.gif" alt="Ouvrir l’assistant Djua" className="w-[135%] h-[135%] max-w-none object-cover mix-blend-multiply" />
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-zinc-100">Djua Copilot</span>
              <span className="text-[10px] text-zinc-400">Besoin d’aide ?</span>
            </span>
          </>
        )}

        {/* Badge d'état sobre */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#141416]" />
        )}
      </button>
    </div>
  );
}