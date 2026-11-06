import React, { lazy, Suspense, useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Send, ArrowLeft, RefreshCw, Search, CheckCheck
} from 'lucide-react';
import { installationApi, type InstallationItem } from '../services/api';
import './TechnicianMessages.css';

const TechnicianInstallationCalls = lazy(() => import('../components/TechnicianInstallationCalls'));

interface TechnicianMessagesProps {
  initialInstallationId?: string | null;
  isActive?: boolean;
  onBackToMissions?: () => void;
}

export default function TechnicianMessages({
  initialInstallationId,
  isActive = true,
  onBackToMissions
}: TechnicianMessagesProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [selectedInstallationId, setSelectedInstallationId] = useState<string | null>(initialInstallationId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchingMessageFor = useRef<string | null>(null);
  const latestMessageId = useRef<string | null>(null);
  const selectedInstallationRef = useRef<string | null>(selectedInstallationId);

  // Charger les conversations ou les installations assignées
  const fetchConversationsList = async () => {
    setLoadingConv(true);
    try {
      const [convList, instList] = await Promise.all([
        installationApi.getConversations().catch(() => []),
        installationApi.getAssignedInstallations().catch(() => [])
      ]);
      setConversations(convList);
      setInstallations(instList);

    } catch (err) {
      console.error('[TechnicianMessages] Erreur chargement discussions:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversationsList();
    const interval = window.setInterval(fetchConversationsList, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  // Quand une installation est sélectionnée, charger les messages
  const fetchMessages = async (instId: string) => {
    if (fetchingMessageFor.current === instId) return;
    fetchingMessageFor.current = instId;
    if (messages.length === 0) setLoadingMsg(true);
    try {
      const data = await installationApi.getMessages(instId);
      if (selectedInstallationRef.current !== instId) return;
      const nextMessages = data.messages || [];
      const nextLatestId = nextMessages.length
        ? String(nextMessages[nextMessages.length - 1]._id || nextMessages[nextMessages.length - 1].id || '')
        : null;
      const isInitialLoad = latestMessageId.current === null;
      const hasNewMessage = nextLatestId && nextLatestId !== latestMessageId.current;
      latestMessageId.current = nextLatestId;
      if (hasNewMessage) setMessages(nextMessages);
      if (hasNewMessage) {
        window.requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({
          behavior: isInitialLoad ? 'auto' : 'smooth',
        }));
      }
    } catch (err) {
      console.error('[TechnicianMessages] Erreur chargement messages:', err);
    } finally {
      fetchingMessageFor.current = null;
      setLoadingMsg(false);
    }
  };

  useEffect(() => {
    selectedInstallationRef.current = selectedInstallationId;
    if (selectedInstallationId && isActive) {
      latestMessageId.current = null;
      setMessages([]);
      setLoadingMsg(true);
      fetchMessages(selectedInstallationId);
      const interval = setInterval(() => {
        if (!document.hidden) fetchMessages(selectedInstallationId);
      }, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [selectedInstallationId, isActive]);

  useEffect(() => {
    if (initialInstallationId) setSelectedInstallationId(initialInstallationId);
  }, [initialInstallationId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedInstallationId || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await installationApi.sendMessage(selectedInstallationId, {
        content: text,
        type: 'text'
      });
      await fetchMessages(selectedInstallationId);
    } catch (err) {
      console.error('[TechnicianMessages] Erreur envoi message:', err);
      setInputText(text); // restaurer si échec
    } finally {
      setSending(false);
    }
  };

  // Trouver les métadonnées de l'installation sélectionnée
  const activeInstallation =
    installations.find(i => i._id === selectedInstallationId) ||
    conversations.find(c => c.installation?._id === selectedInstallationId)?.installation;
  const callInstallationId = selectedInstallationId || initialInstallationId || installations[0]?._id || null;
  const visibleInstallations = installations.filter(inst => {
    const conv = conversations.find(c => c.installation?._id === inst._id);
    const query = searchTerm.trim().toLowerCase();
    return !query || [
      inst.folderName,
      inst.folderNumber,
      inst.customer?.name,
      conv?.lastMessage?.content,
      conv?.lastMessage?.senderName,
    ].some(value => String(value || '').toLowerCase().includes(query));
  });

  return (
    <div className={`technician-messages-page${isActive ? '' : ' is-hidden'}`}>
      {callInstallationId && (
        <Suspense fallback={null}>
          <TechnicianInstallationCalls
            installationId={callInstallationId}
            showControls={isActive && Boolean(selectedInstallationId)}
          />
        </Suspense>
      )}
      {/* Si aucune discussion sélectionnée ou vue liste mobile */}
      {!selectedInstallationId ? (
        <div className="technician-chat-list">
          <div className="technician-chat-list-heading">
            <h2>Chats</h2>
            <button
              type="button"
              onClick={fetchConversationsList}
              className="technician-chat-refresh"
              aria-label="Actualiser les discussions"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <label className="technician-chat-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Rechercher une discussion"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="technician-chat-filter" aria-label="Filtres de discussion">
            <span className="is-active">Toutes</span>
            <span>Chantiers <b>{installations.length}</b></span>
          </div>

          {loadingConv ? (
            <div className="technician-chat-empty">
              <div className="spinner spinner-brand" />
              <p>Chargement des discussions…</p>
            </div>
          ) : installations.length === 0 ? (
            <div className="technician-chat-empty">
              <MessageSquare size={30} />
              <strong>Aucune discussion active</strong>
              <p>Les discussions s’ouvrent avec vos missions d’installation.</p>
            </div>
          ) : visibleInstallations.length === 0 ? (
            <div className="technician-chat-empty"><p>Aucune discussion ne correspond à cette recherche.</p></div>
          ) : (
            <div className="technician-chat-conversations">
              {visibleInstallations.map((inst) => {
                const conv = conversations.find(c => c.installation?._id === inst._id);
                const lastMsg = conv?.lastMessage;
                const title = inst.folderName || inst.customer?.name || inst.folderNumber || 'Chantier';

                return (
                  <button
                    key={inst._id}
                    type="button"
                    onClick={() => setSelectedInstallationId(inst._id)}
                    className="technician-chat-conversation"
                  >
                    <div className="technician-chat-avatar">
                      {(inst.customer?.name || title).charAt(0).toUpperCase()}
                    </div>
                    <div className="technician-chat-conversation-copy">
                      <div className="technician-chat-conversation-title">
                        <strong>{title}</strong>
                        <time>{lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</time>
                      </div>
                      <p>{lastMsg ? `${lastMsg.senderName || 'Équipe'} : ${lastMsg.content || 'Nouveau message'}` : `Dossier ${inst.folderNumber || ''} · Équipe chantier`}</p>
                    </div>
                    {conv?.unreadCount > 0 && <span className="technician-chat-unread">{conv.unreadCount}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VUE CHAT OUVERT */
        <div className="technician-chat-thread">
          {/* Header du chat */}
          <div className="technician-chat-header">
            <div className="technician-chat-header-person">
              <button
                type="button"
                onClick={() => setSelectedInstallationId(null)}
                className="technician-chat-back"
                aria-label="Retour aux discussions"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="technician-chat-header-avatar">
                {(activeInstallation?.customer?.name || activeInstallation?.folderName || 'D').charAt(0).toUpperCase()}
              </div>
              <div className="technician-chat-header-copy">
                <strong>
                  {activeInstallation?.folderName || activeInstallation?.customer?.name || 'Support Opérations'}
                </strong>
                <small>{activeInstallation?.folderNumber ? `Dossier ${activeInstallation.folderNumber}` : 'Discussion du chantier'}</small>
              </div>
            </div>

            <div className="technician-chat-header-actions">
              <button
                type="button"
                aria-label="Actualiser les messages"
                onClick={() => fetchMessages(selectedInstallationId)}
                className="technician-chat-refresh"
              >
                <RefreshCw size={15} className={loadingMsg ? 'ops-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Corps des messages */}
          <div className="technician-chat-messages">
            {messages.length === 0 ? (
              <div className="technician-chat-empty">
                <MessageSquare size={28} />
                <strong>Aucun message pour le moment</strong>
                <p>Échangez avec le superviseur et l’équipe du chantier.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'technician';
                return (
                  <div
                    key={msg._id || idx}
                    className={`technician-chat-message-row ${isMe ? 'is-mine' : 'is-theirs'}`}
                  >
                    {!isMe && (
                      <span className="technician-chat-sender">
                        {msg.senderName || 'Équipe'} · {msg.senderRole || 'Superviseur'}
                      </span>
                    )}

                    <div className="technician-chat-bubble">
                      {msg.content}
                      <div className="technician-chat-message-meta">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <CheckCheck size={11} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <form
            onSubmit={handleSend}
            className="technician-chat-composer"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Message…"
              aria-label="Votre message"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              aria-label="Envoyer le message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
