import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Mic, Square, Image as ImageIcon, X, Play,
  Pause, Clock, User, Shield, AlertCircle, FileText, CheckCheck, Check,
  Users, Radio
} from 'lucide-react';
import { toast } from 'sonner';
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

export default function InstallationChat({ installationId, title, recipientName }) {
  const currentUser = useAuthStore(state => state.user);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // TanStack queries
  const { data: chatData, refetch } = useGetInstallationMessages(installationId);
  const sendMutation = useSendInstallationMessage();
  const markReadMutation = useMarkInstallationMessagesRead();

  const messages = Array.isArray(chatData) ? chatData : (chatData?.messages || []);
  const conversation = chatData?.conversation || null;

  // Marquer comme lus à l'ouverture
  useEffect(() => {
    if (installationId && messages.length > 0) {
      markReadMutation.mutate({ id: installationId });
    }
  }, [installationId, messages.length]);

  // Socket.io real-time connection
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

    const handleMessagesRead = () => {
      refetch();
    };

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

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording, selectedImage]);

  // Timer for audio recording
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Envoi de message texte ou image
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
        setInputText('');
      } else {
        await sendMutation.mutateAsync({
          id: installationId,
          content: inputText.trim(),
          type: 'text',
        });
        setInputText('');
      }
    } catch (err) {
      toast.error('Erreur lors de l’envoi du message.');
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('L’enregistrement vocal n’est pas supporté par votre navigateur.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert to base64 Data URL
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          try {
            await sendMutation.mutateAsync({
              id: installationId,
              content: 'Note vocale',
              type: 'audio',
              mediaUrl: base64Audio,
              audioDuration: recordingDuration || 1,
            });
            toast.success('Note vocale transmise en direct.');
          } catch (err) {
            toast.error('Erreur lors de l’envoi de la note vocale.');
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[AudioRecorder] Error:', err);
      toast.error('Impossible d’accéder au microphone. Vérifiez vos permissions.');
    }
  };

  // Stop & Send Voice Recording
  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cancel Voice Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Do not send
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
      toast.info('Enregistrement vocal annulé.');
    }
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L’image ne doit pas dépasser 5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSelectedImage(uploadEvent.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const participantCount = conversation?.participants?.length || 2;

  return (
    <div className="inst-chat-container">
      {/* En-tête du Chat Senior */}
      <div className="inst-chat-header">
        <div className="inst-chat-contact">
          <div className="inst-chat-avatar">
            {recipientName ? recipientName.charAt(0) : 'T'}
          </div>
          <div>
            <h4>{recipientName || title || 'Support Opérations Djua'}</h4>
            <div className="inst-chat-status">
              <span className="inst-chat-status-dot" />
              <span>Canal Sécurisé • {participantCount} participants connectés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="inst-chat-messages">
        {messages.length === 0 ? (
          <div className="inst-chat-empty">
            <Radio size={28} className="inst-chat-empty-icon" />
            <p>Canal de coordination ouvert.</p>
            <small>Transmettez un compte-rendu, posez une question ou envoyez une photo de chantier.</small>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
            const isTech = msg.senderRole === 'technician';
            const isAdmin = ['admin', 'administration', 'shop_manager'].includes(msg.senderRole);
            const isRead = msg.status === 'read' || (msg.readBy && msg.readBy.length > 1);

            return (
              <div
                key={msg._id || Math.random()}
                className={`inst-chat-row ${isMe ? 'is-me' : 'is-other'}`}
              >
                <div className={`inst-chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                  {/* Nom & Rôle de l'expéditeur */}
                  <div className="inst-chat-sender-info">
                    <span className="inst-sender-name">{msg.senderName}</span>
                    <span className={`inst-sender-role ${isTech ? 'role-tech' : isAdmin ? 'role-admin' : ''}`}>
                      {isTech ? 'Technicien' : isAdmin ? 'Superviseur' : 'Opérations'}
                    </span>
                  </div>

                  {/* Message Texte */}
                  {msg.content && msg.type === 'text' && (
                    <p className="inst-chat-text">{msg.content}</p>
                  )}

                  {/* Message Image */}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="inst-chat-image-wrap">
                      <img src={msg.mediaUrl} alt="Photo chantier" className="inst-chat-image" />
                      {msg.content && msg.content !== 'Photo du chantier' && (
                        <p className="inst-chat-image-caption">{msg.content}</p>
                      )}
                    </div>
                  )}

                  {/* Message Vocal Audio */}
                  {msg.type === 'audio' && msg.mediaUrl && (
                    <div className="inst-chat-audio-wrap">
                      <div className="inst-chat-audio-icon">
                        <Mic size={16} />
                      </div>
                      <audio controls src={msg.mediaUrl} className="inst-chat-audio-player" />
                    </div>
                  )}

                  {/* Timestamp & Accusés de réception */}
                  <div className="inst-chat-time-row">
                    <span className="inst-chat-timestamp">{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      <span className={`inst-chat-ticks ${isRead ? 'is-read' : ''}`}>
                        {isRead ? <CheckCheck size={14} /> : <Check size={13} />}
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

      {/* Aperçu image avant envoi */}
      {selectedImage && (
        <div className="inst-chat-preview-banner">
          <div className="inst-chat-preview-thumb">
            <img src={selectedImage} alt="Aperçu" />
            <button
              type="button"
              className="inst-preview-close-btn"
              onClick={() => setSelectedImage(null)}
            >
              <X size={13} />
            </button>
          </div>
          <span>Image prête à être envoyée</span>
        </div>
      )}

      {/* Barre d'enregistrement vocal en cours */}
      {isRecording ? (
        <div className="inst-chat-recording-bar">
          <div className="inst-recording-pulse">
            <span className="inst-pulse-dot" />
            <span>Enregistrement vocal… ({recordingDuration}s)</span>
          </div>
          <div className="inst-recording-actions">
            <button
              type="button"
              className="inst-btn-record-cancel"
              onClick={cancelRecording}
            >
              Annuler
            </button>
            <button
              type="button"
              className="inst-btn-record-send"
              onClick={stopRecordingAndSend}
            >
              <Send size={14} /> Envoyer le vocal
            </button>
          </div>
        </div>
      ) : (
        /* Barre de saisie standard */
        <form onSubmit={handleSendMessage} className="inst-chat-input-bar">
          {/* Bouton Pièce jointe image */}
          <button
            type="button"
            className="inst-chat-action-btn"
            title="Joindre une photo du chantier"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={19} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* Bouton Enregistreur vocal */}
          <button
            type="button"
            className="inst-chat-action-btn record-trigger"
            title="Enregistrer un message vocal"
            onClick={startRecording}
          >
            <Mic size={19} />
          </button>

          {/* Champ texte */}
          <input
            type="text"
            className="inst-chat-text-input"
            placeholder="Écrire un message en direct…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          {/* Bouton Envoyer */}
          <button
            type="submit"
            className="inst-chat-send-btn"
            disabled={!inputText.trim() && !selectedImage}
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
