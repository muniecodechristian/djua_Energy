import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCalls,
  useCallStateHooks,
  type Call,
} from '@stream-io/video-react-sdk';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { installationApi, type StreamInstallationSession } from '../services/api';
import { playCallRingtone } from '../lib/callRingtone';
import './TechnicianInstallationCalls.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';

interface TechnicianInstallationCallsProps {
  installationId: string;
  showControls?: boolean;
}

function ActiveCall({
  call,
  onLeave,
  onError,
  onNoAnswer,
}: {
  call: Call;
  onLeave: () => void;
  onError: (message: string) => void;
  onNoAnswer: () => void;
}) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) onLeave();
  }, [callingState, onLeave]);

  useEffect(() => {
    if (callingState !== CallingState.RINGING) return undefined;
    return playCallRingtone();
  }, [callingState]);

  useEffect(() => {
    if (callingState !== CallingState.RINGING) return undefined;
    const timer = window.setTimeout(() => {
      call.leave({ reject: true, reason: 'timeout' })
        .then(onNoAnswer)
        .catch(cause => onError(cause instanceof Error ? cause.message : 'L’appel n’a pas abouti.'));
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [call, callingState, onError, onNoAnswer]);

  if ([CallingState.IDLE, CallingState.JOINING, CallingState.RINGING].includes(callingState)) {
    const cancelCall = async () => {
      try {
        await call.leave({ reject: true, reason: 'cancel' });
        onLeave();
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : 'Impossible d’annuler l’appel.');
      }
    };

    return (
      <div className="technician-call-status">
        <p>{callingState === CallingState.RINGING
          ? 'Appel lancé… En attente de réponse. Sans connexion du participant sous 30 secondes, il sera signalé sans réponse.'
          : 'Connexion à l’appel…'}</p>
        <button type="button" className="technician-call-cancel" onClick={cancelCall}>
          <PhoneOff size={16} /> Annuler l’appel
        </button>
      </div>
    );
  }

  return (
    <div className="technician-call-stage">
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls onLeave={onLeave} />
    </div>
  );
}

function InstallationCallActions({
  client,
  members,
  installationId,
  showControls,
}: {
  client: StreamVideoClient;
  members: StreamInstallationSession['members'];
  installationId: string;
  showControls: boolean;
}) {
  const calls = useCalls();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const clearActiveCall = useCallback(() => setActiveCall(null), []);

  const incomingCall = calls.find(call => (
    !call.isCreatedByMe
    && call.state.callingState === CallingState.RINGING
  ));

  useEffect(() => {
    if (!incomingCall || activeCall) return undefined;
    return playCallRingtone();
  }, [incomingCall, activeCall]);

  const showNoAnswer = useCallback(() => {
    setActiveCall(null);
    setNotice('Aucune réponse : le participant ne s’est pas connecté, il est peut-être hors ligne.');
  }, []);

  const startCall = async (video: boolean) => {
    if (calling) return;
    setCalling(true);
    setError('');
    setNotice('');
    try {
      const call = client.call('default', crypto.randomUUID());
      await call.getOrCreate({
        ring: true,
        video,
        data: {
          members: members.map(member => ({ user_id: member.id })),
          custom: { installationId },
        },
      });
      setActiveCall(call);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de démarrer l’appel.');
    } finally {
      setCalling(false);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    setError('');
    try {
      await incomingCall.join();
      setActiveCall(incomingCall);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de rejoindre l’appel.');
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    setError('');
    try {
      await incomingCall.leave({ reject: true, reason: 'decline' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de refuser l’appel.');
    }
  };

  return (
    <>
      {showControls && (
        <div className="technician-call-actions">
          <button
            type="button"
            title="Appel audio"
            aria-label="Appel audio"
            disabled={calling || members.length < 2 || Boolean(activeCall) || Boolean(incomingCall)}
            onClick={() => startCall(false)}
          >
            <Phone size={17} />
          </button>
          <button
            type="button"
            title="Appel vidéo"
            aria-label="Appel vidéo"
            disabled={calling || members.length < 2 || Boolean(activeCall) || Boolean(incomingCall)}
            onClick={() => startCall(true)}
          >
            <Video size={17} />
          </button>
        </div>
      )}

      {incomingCall && !activeCall && createPortal(
        <div className="technician-incoming-backdrop">
          <section className="technician-incoming-dialog" role="alertdialog" aria-modal="true" aria-labelledby="technician-incoming-title">
            <div className="technician-incoming-icon"><Phone size={25} /></div>
            <h2 id="technician-incoming-title">Appel entrant</h2>
            <p>Un membre de l’équipe vous appelle. Répondez pour rejoindre la conversation.</p>
            {error && <p className="technician-incoming-error" role="alert">{error}</p>}
            <div className="technician-incoming-actions">
              <button type="button" className="is-answer" onClick={answerCall}><Phone size={17} /> Répondre</button>
              <button type="button" className="is-decline" onClick={declineCall}><PhoneOff size={17} /> Refuser</button>
            </div>
          </section>
        </div>,
        document.body,
      )}

      {activeCall && (
        createPortal(
          <div className="technician-call-overlay" role="dialog" aria-label="Appel en cours">
            <StreamCall call={activeCall}>
              <ActiveCall
                call={activeCall}
                onLeave={clearActiveCall}
                onError={setError}
                onNoAnswer={showNoAnswer}
              />
            </StreamCall>
          </div>,
          document.body,
        )
      )}

      {error && <span className="technician-call-error" role="alert">{error}</span>}
      {notice && <span className="technician-call-notice" role="status">{notice}</span>}
    </>
  );
}

export default function TechnicianInstallationCalls({
  installationId,
  showControls = true,
}: TechnicianInstallationCallsProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [members, setMembers] = useState<StreamInstallationSession['members']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let videoClient: StreamVideoClient | null = null;
    setClient(null);
    setMembers([]);
    setLoading(true);
    setError('');

    const connect = async () => {
      const session = await installationApi.getStreamSession(installationId);
      if (!session?.apiKey || !session.token || !session.user?.id || !session.members?.length) {
        throw new Error('La réponse Stream est incomplète.');
      }

      videoClient = new StreamVideoClient({
        apiKey: session.apiKey,
        user: { id: session.user.id, name: session.user.name },
        token: session.token,
        tokenProvider: async () => (await installationApi.getStreamSession(installationId)).token,
      });

      if (!active) {
        await videoClient.disconnectUser();
        return;
      }

      setClient(videoClient);
      setMembers(session.members);
      setLoading(false);
    };

    connect().catch(cause => {
      if (active) {
        setError(
          (cause as { response?: { data?: { message?: string } } })?.response?.data?.message
          || (cause instanceof Error ? cause.message : 'Connexion Stream impossible.'),
        );
        setLoading(false);
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(disconnectError => {
          console.error('[TechnicianCalls] Déconnexion Stream impossible:', disconnectError);
        });
      }
    });

    return () => {
      active = false;
      if (videoClient) {
        videoClient.disconnectUser().catch(disconnectError => {
          console.error('[TechnicianCalls] Déconnexion Stream impossible:', disconnectError);
        });
      }
    };
  }, [installationId]);

  return (
    <div className="technician-call-container">
      {loading && <span className="technician-call-hint">Connexion aux appels…</span>}
      {error && <span className="technician-call-error" role="status">{error}</span>}
      {client && (
        <StreamVideo client={client}>
          <StreamTheme>
            <InstallationCallActions
              client={client}
              members={members}
              installationId={installationId}
              showControls={showControls}
            />
          </StreamTheme>
        </StreamVideo>
      )}
    </div>
  );
}
