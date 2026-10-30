import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Send, ArrowLeft, User, RefreshCw,
  Image as ImageIcon, CheckCheck, Clock, AlertCircle
} from 'lucide-react';
import { installationApi, type InstallationItem } from '../services/api';

interface TechnicianMessagesProps {
  initialInstallationId?: string | null;
  onBackToMissions?: () => void;
}

export default function TechnicianMessages({
  initialInstallationId,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      // Si aucune installation sélectionnée et qu'il y en a au moins une
      if (!selectedInstallationId && (convList.length > 0 || instList.length > 0)) {
        const firstId = convList[0]?.installation?._id || instList[0]?._id;
        if (firstId) setSelectedInstallationId(firstId);
      }
    } catch (err) {
      console.error('[TechnicianMessages] Erreur chargement discussions:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversationsList();
  }, []);

  // Quand une installation est sélectionnée, charger les messages
  const fetchMessages = async (instId: string) => {
    setLoadingMsg(true);
    try {
      const data = await installationApi.getMessages(instId);
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('[TechnicianMessages] Erreur chargement messages:', err);
    } finally {
      setLoadingMsg(false);
    }
  };

  useEffect(() => {
    if (selectedInstallationId) {
      fetchMessages(selectedInstallationId);
      const interval = setInterval(() => {
        fetchMessages(selectedInstallationId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedInstallationId]);

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

  return (
    <div className="technician-messages-page" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', background: '#F9FAFB' }}>
      {/* Si aucune discussion sélectionnée ou vue liste mobile */}
      {!selectedInstallationId ? (
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
              Discussions de Chantier
            </h2>
            <button
              type="button"
              onClick={fetchConversationsList}
              style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} /> Actualiser
            </button>
          </div>

          {loadingConv ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
              <div className="spinner spinner-brand" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Chargement des canaux…</p>
            </div>
          ) : installations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#FFFFFF', borderRadius: 14, border: '1px dashed #E5E7EB' }}>
              <MessageSquare size={32} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Aucune discussion active</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Les canaux de discussion s'ouvrent dès que vous recevez une mission d'installation.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {installations.map((inst) => {
                const conv = conversations.find(c => c.installation?._id === inst._id);
                const lastMsg = conv?.lastMessage;

                return (
                  <div
                    key={inst._id}
                    onClick={() => setSelectedInstallationId(inst._id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#FFF7F0',
                      color: '#FF5C00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      {inst.customer?.name?.charAt(0) || 'D'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inst.folderName || inst.customer?.name || inst.folderNumber}
                        </strong>
                        <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>
                          {inst.folderNumber}
                        </span>
                      </div>

                      <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg ? `${lastMsg.senderName}: ${lastMsg.content}` : 'Échanger avec le superviseur et l’équipe'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VUE CHAT OUVERT */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF' }}>
          {/* Header du chat */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedInstallationId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#4B5563', display: 'flex' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <strong style={{ fontSize: 14, color: '#111827', display: 'block' }}>
                  {activeInstallation?.folderName || activeInstallation?.customer?.name || 'Support Opérations'}
                </strong>
                <small style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                  Superviseur & Direction connectés
                </small>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchMessages(selectedInstallationId)}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}
            >
              <RefreshCw size={15} className={loadingMsg ? 'ops-spin' : ''} />
            </button>
          </div>

          {/* Corps des messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#9CA3AF' }}>
                <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: 13 }}>Aucun message pour l'instant.</p>
                <small style={{ fontSize: 11 }}>Posez vos questions techniques ou signalez l'avancée du chantier.</small>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'technician';
                return (
                  <div
                    key={msg._id || idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    {!isMe && (
                      <span style={{ fontSize: 10, color: '#6B7280', marginBottom: 2, paddingLeft: 4, fontWeight: 600 }}>
                        {msg.senderName} ({msg.senderRole || 'Superviseur'})
                      </span>
                    )}

                    <div style={{
                      maxWidth: '82%',
                      padding: '8px 12px',
                      borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isMe ? '#FF5C00' : '#FFFFFF',
                      color: isMe ? '#FFFFFF' : '#111827',
                      border: isMe ? 'none' : '1px solid #E2E8F0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      fontSize: 13,
                      lineHeight: 1.45,
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                        fontSize: 9.5,
                        color: isMe ? 'rgba(255,255,255,0.75)' : '#94A3B8'
                      }}>
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
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #E5E7EB',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Message pour le superviseur…"
              style={{
                flex: 1,
                border: '1px solid #CBD5E1',
                borderRadius: 20,
                padding: '8px 14px',
                fontSize: 13,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: inputText.trim() ? '#FF5C00' : '#E5E7EB',
                color: '#FFFFFF',
                border: 'none',
                cursor: inputText.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
