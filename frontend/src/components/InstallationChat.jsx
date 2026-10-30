import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Send, Mic, Image as ImageIcon, X, CheckCheck, Check,
  Radio, StopCircle, Paperclip, ChevronDown, Phone,
  MoreVertical, Smile, Volume2, MessageSquare, Search, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import {
  useGetInstallationMessages,
  useSendInstallationMessage,
  useMarkInstallationMessagesRead
} from '../hooks/tanstack/useInstallations';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { getAppSocket } from '../lib/socket';
import './InstallationChat.css';

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDate = null;

  messages.forEach((msg) => {
    const msgDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
    if (msgDate && msgDate !== lastDate) {
      groups.push({ type: 'date-separator', label: formatDateLabel(msg.createdAt), key: `sep-${msgDate}` });
      lastDate = msgDate;
    }
    groups.push({ type: 'message', data: msg, key: msg._id || Math.random() });
  });

  return groups;
}

function AudioPlayerBubble({ src, isMe }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const p = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
    setProgress(p);
  };

  const handleEnded = () => setPlaying(false);
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * (audioRef.current.duration || 0);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`ic-audio-player ${isMe ? 'ic-audio-me' : 'ic-audio-them'}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ display: 'none' }}
      />
      <button className="ic-audio-play-btn" onClick={togglePlay} type="button">
        {playing ? <StopCircle size={18} /> : <Volume2 size={18} />}
      </button>
      <div className="ic-audio-track" onClick={handleSeek}>
        <div className="ic-audio-bar">
          <div className="ic-audio-progress" style={{ width: `${progress}%` }} />
        </div>
        <div className="ic-audio-waveform">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="ic-wave-bar"
              style={{
                height: `${30 + Math.sin(i * 0.9) * 20}%`,
                opacity: progress / 100 > i / 22 ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      </div>
      <span className="ic-audio-duration">{fmt(duration)}</span>
    </div>
  );
}

export default function InstallationChat({ installationId, title, recipientName }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // future: socket typing indicator
  const [showConvDrawer, setShowConvDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allConversations = [] } = useQuery({
    queryKey: ['installation-conversations'],
    queryFn: async () => {
      const res = await api.get('/api/installations/conversations');
      return res.data?.data || [];
    },
    enabled: Boolean(showConvDrawer),
    refetchInterval: 10000,
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const { data: chatData, refetch } = useGetInstallationMessages(installationId);
  const sendMutation = useSendInstallationMessage();
  const markReadMutation = useMarkInstallationMessagesRead();

  const messages = Array.isArray(chatData) ? chatData : (chatData?.messages || []);
  const conversation = chatData?.conversation || null;
  const groupedItems = groupMessagesByDate(messages);

  // Mark as read on open
  useEffect(() => {
    if (installationId && messages.length > 0) {
      markReadMutation.mutate({ id: installationId });
    }
  }, [installationId, messages.length]);

  // Socket.io real-time
  useEffect(() => {
    if (!installationId) return;
    const socket = getAppSocket();
    socket.emit('join:installation', { installationId });

    const handleNewMessage = (newMsg) => {
      if (newMsg.installation === installationId || newMsg.installation?._id === installationId) {
        refetch();
        if (newMsg.sender?._id !== currentUser?._id && newMsg.sender !== currentUser?._id) {
          markReadMutation.mutate({ id: installationId });
        }
      }
    };
    const handleMessagesRead = () => refetch();

    socket.on('chat:new-message', handleNewMessage);
    socket.on('chat:broadcast', handleNewMessage);
    socket.on('chat:messages-read', handleMessagesRead);
    socket.on('conversation:updated', handleMessagesRead);

    return () => {
      socket.off('chat:new-message', handleNewMessage);
      socket.off('chat:broadcast', handleNewMessage);
      socket.off('chat:messages-read', handleMessagesRead);
      socket.off('conversation:updated', handleMessagesRead);
      socket.emit('leave:installation', { installationId });
    };
  }, [installationId, refetch, currentUser]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Show scroll-to-bottom button
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!isNearBottom);
  };

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [isRecording]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    try {
      if (selectedImage) {
        await sendMutation.mutateAsync({
          id: installationId,
          content: inputText.trim() || 'Photo du chantier',
          type: 'image',
          mediaUrl: selectedImage,
        });
        setSelectedImage(null);
      } else {
        await sendMutation.mutateAsync({
          id: installationId,
          content: inputText.trim(),
          type: 'text',
        });
      }
      setInputText('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      toast.error('Erreur lors de l\'envoi du message.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('L\'enregistrement vocal n\'est pas supporté.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await sendMutation.mutateAsync({
              id: installationId,
              content: 'Note vocale',
              type: 'audio',
              mediaUrl: reader.result,
              audioDuration: recordingDuration || 1,
            });
            toast.success('Note vocale transmise.');
          } catch {
            toast.error('Erreur lors de l\'envoi de la note vocale.');
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Impossible d\'accéder au microphone. Vérifiez vos permissions.');
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
      toast.info('Enregistrement annulé.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Fichier image invalide.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image > 5 Mo.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const participantCount = conversation?.participants?.length || 2;
  const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="ic-root">
      {/* ─── Header ─── */}
      <div className="ic-header">
        <div className="ic-header-left">
          <div className="ic-avatar">
            {recipientName ? recipientName.charAt(0).toUpperCase() : 'D'}
          </div>
          <div className="ic-header-info">
            <span className="ic-header-name">{recipientName || title || 'Support Opérations Djua'}</span>
            <span className="ic-header-sub">
              <span className="ic-online-dot" />
              Canal sécurisé &bull; {participantCount} participants
            </span>
          </div>
        </div>
        <div className="ic-header-actions">
          <button
            className={`ic-icon-btn ${showConvDrawer ? 'is-active' : ''}`}
            title="Surveillance : Toutes les discussions des installations"
            type="button"
            onClick={() => setShowConvDrawer(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: showConvDrawer ? 'rgba(255, 121, 0, 0.12)' : '#F1F5F9',
              color: showConvDrawer ? '#FF7900' : '#475569',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: showConvDrawer ? '1px solid #FF7900' : '1px solid #E2E8F0'
            }}
          >
            <MessageSquare size={14} />
            <span>Toutes les discussions</span>
          </button>
          <button className="ic-icon-btn" title="Appel direct" type="button">
            <Phone size={16} />
          </button>
        </div>
      </div>

      {/* ─── Tiroir / Volet Liste des discussions pour la surveillance ─── */}
      {showConvDrawer && (
        <div style={{
          background: '#F8FAFC',
          borderBottom: '2px solid #E2E8F0',
          padding: '12px 16px',
          maxHeight: 260,
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} color="#FF7900" />
              Canaux de discussion actifs ({allConversations.length})
            </strong>
            <button
              type="button"
              onClick={() => setShowConvDrawer(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: '4px 10px', marginBottom: 10 }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Filtrer chantier, client, technicien…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 12, width: '100%', color: '#0F172A' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allConversations
              .filter(c => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const folderNum = c.installation?.folderNumber || c.folderNumber || '';
                const folderName = c.installation?.folderName || '';
                const client = c.installation?.customer?.name || c.customerName || '';
                const tech = c.installation?.assignedTechnician ? `${c.installation.assignedTechnician.prenom} ${c.installation.assignedTechnician.nom}` : '';
                return folderNum.toLowerCase().includes(q) || folderName.toLowerCase().includes(q) || client.toLowerCase().includes(q) || tech.toLowerCase().includes(q);
              })
              .map(c => {
                const isCurrent = String(c.installation?._id || c.installation) === String(installationId);
                const myParticipant = c.participants?.find(p => String(p.user?._id || p.user) === String(currentUser?._id));
                const unread = myParticipant?.unreadCount || 0;

                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      if (!isCurrent && c.installation?._id) {
                        navigate(`/installations/${c.installation._id}`);
                      }
                      setShowConvDrawer(false);
                    }}
                    style={{
                      background: isCurrent ? 'rgba(255, 121, 0, 0.08)' : '#FFFFFF',
                      border: isCurrent ? '1.5px solid #FF7900' : '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 12.5, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.installation?.folderName || c.installation?.folderNumber || c.folderNumber}
                        </strong>
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          • {c.installation?.customer?.name || c.customerName}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                        {c.lastMessage?.content ? `${c.lastMessage.senderName || 'Utilisateur'}: ${c.lastMessage.content}` : 'Aucun message récent'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {unread > 0 && (
                        <span style={{ background: '#EF4444', color: '#FFF', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 6px' }}>
                          {unread}
                        </span>
                      )}
                      <ChevronRight size={14} color="#94A3B8" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── Messages Area ─── */}
      <div
        className="ic-messages-area"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="ic-empty-state">
            <div className="ic-empty-icon-wrap">
              <Radio size={26} />
            </div>
            <p className="ic-empty-title">Canal de coordination ouvert</p>
            <p className="ic-empty-sub">Envoyez un message, une photo ou une note vocale du chantier.</p>
          </div>
        ) : (
          groupedItems.map((item) => {
            if (item.type === 'date-separator') {
              return (
                <div key={item.key} className="ic-date-separator">
                  <span>{item.label}</span>
                </div>
              );
            }

            const msg = item.data;
            const isMe = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
            const isTech = msg.senderRole === 'technician';
            const isAdmin = ['admin', 'administration', 'shop_manager'].includes(msg.senderRole);
            const isRead = msg.status === 'read' || (msg.readBy && msg.readBy.length > 1);

            return (
              <div key={item.key} className={`ic-row ${isMe ? 'ic-row-me' : 'ic-row-them'}`}>
                {!isMe && (
                  <div className="ic-avatar-sm">
                    {(msg.senderName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`ic-bubble ${isMe ? 'ic-bubble-me' : 'ic-bubble-them'}`}>
                  {/* Sender info - only for "them" messages */}
                  {!isMe && (
                    <div className="ic-sender-row">
                      <span className="ic-sender-name">{msg.senderName}</span>
                      <span className={`ic-role-tag ${isTech ? 'ic-role-tech' : isAdmin ? 'ic-role-admin' : 'ic-role-ops'}`}>
                        {isTech ? 'Technicien' : isAdmin ? 'Superviseur' : 'Opérations'}
                      </span>
                    </div>
                  )}

                  {/* Text content */}
                  {msg.type === 'text' && msg.content && (
                    <p className="ic-text">{msg.content}</p>
                  )}

                  {/* Image */}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="ic-img-wrap">
                      <img src={msg.mediaUrl} alt="Photo chantier" className="ic-img" />
                      {msg.content && msg.content !== 'Photo du chantier' && (
                        <p className="ic-img-caption">{msg.content}</p>
                      )}
                    </div>
                  )}

                  {/* Audio */}
                  {msg.type === 'audio' && msg.mediaUrl && (
                    <AudioPlayerBubble src={msg.mediaUrl} isMe={isMe} />
                  )}

                  {/* Timestamp + read receipt */}
                  <div className="ic-meta-row">
                    <span className="ic-timestamp">{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      <span className={`ic-ticks ${isRead ? 'ic-ticks-read' : ''}`}>
                        {isRead ? <CheckCheck size={13} /> : <Check size={13} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Scroll-to-bottom fab ─── */}
      {showScrollBtn && (
        <button
          className="ic-scroll-fab"
          onClick={() => scrollToBottom()}
          type="button"
          title="Aller en bas"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {/* ─── Image Preview Banner ─── */}
      {selectedImage && (
        <div className="ic-preview-bar">
          <div className="ic-preview-thumb">
            <img src={selectedImage} alt="Apercu" />
            <button
              className="ic-preview-remove"
              type="button"
              onClick={() => setSelectedImage(null)}
            >
              <X size={11} />
            </button>
          </div>
          <div className="ic-preview-label">
            <span>Photo prête à envoyer</span>
            <small>Ajoutez un commentaire si besoin</small>
          </div>
        </div>
      )}

      {/* ─── Recording Bar ─── */}
      {isRecording && (
        <div className="ic-recording-bar">
          <div className="ic-recording-indicator">
            <span className="ic-rec-dot" />
            <span className="ic-rec-label">Enregistrement en cours</span>
            <span className="ic-rec-timer">{fmtDuration(recordingDuration)}</span>
          </div>
          <div className="ic-recording-controls">
            <button className="ic-rec-cancel-btn" type="button" onClick={cancelRecording}>
              <X size={14} /> Annuler
            </button>
            <button className="ic-rec-send-btn" type="button" onClick={stopRecordingAndSend}>
              <Send size={14} /> Envoyer
            </button>
          </div>
        </div>
      )}

      {/* ─── Input Bar ─── */}
      {!isRecording && (
        <form className="ic-input-bar" onSubmit={handleSendMessage}>
          {/* Attach image */}
          <button
            type="button"
            className="ic-tool-btn"
            title="Joindre une photo"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />

          {/* Text input */}
          <div className="ic-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="ic-text-field"
              placeholder="Écrire un message…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>

          {/* Voice note OR send */}
          {inputText.trim() || selectedImage ? (
            <button
              type="submit"
              className="ic-send-btn ic-send-active"
              disabled={sendMutation.isPending}
            >
              <Send size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="ic-send-btn ic-mic-btn"
              onClick={startRecording}
              title="Note vocale"
            >
              <Mic size={17} />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
