import { useCallback, useEffect, useState } from 'react';
import { CallControls, CallingState, SpeakerLayout, StreamCall, StreamTheme, StreamVideo, useCalls, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';
import { playCallRingtone } from '../lib/callRingtone';
import '@stream-io/video-react-sdk/dist/css/styles.css';

function ActiveCall({ call, onLeave, onNoAnswer }) {
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
        .catch(error => toast.error(error.message || 'L’appel n’a pas abouti.'));
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [call, callingState, onNoAnswer]);

  if ([CallingState.IDLE, CallingState.JOINING, CallingState.RINGING].includes(callingState)) {
    const cancelCall = async () => {
      try {
        await call.leave({ reject: true, reason: 'cancel' });
        onLeave();
      } catch (error) {
        toast.error(error.message || 'Impossible d’annuler l’appel.');
      }
    };

    return (
      <div className="ic-call-waiting">
        <p>Appel lancé… En attente de réponse. Sans connexion du participant sous 30 secondes, il sera signalé sans réponse.</p>
        <button type="button" onClick={cancelCall}>
          <PhoneOff size={16} /> Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="ic-call-stage">
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls onLeave={onLeave} />
    </div>
  );
}

function CallControlsPanel({ client, members, installationId }) {
  const calls = useCalls();
  const [activeCall, setActiveCall] = useState(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const handleLeave = useCallback(() => setActiveCall(null), []);
  const incomingCall = calls.find(call => (
    !call.isCreatedByMe
    && call.state.callingState === CallingState.RINGING
    && call.state.custom?.installationId === installationId
  ));

  useEffect(() => {
    if (!incomingCall || activeCall) return undefined;
    return playCallRingtone();
  }, [incomingCall, activeCall]);

  const handleNoAnswer = useCallback(() => {
    setActiveCall(null);
    toast.warning('Aucune réponse : le participant ne s’est pas connecté, il est peut-être hors ligne.');
  }, []);

  const startCall = async (video) => {
    if (isStartingCall || activeCall || incomingCall) return;
    setIsStartingCall(true);
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
    } catch (error) {
      setActiveCall(null);
      toast.error(error.message || 'Impossible de démarrer l’appel Stream.');
    } finally {
      setIsStartingCall(false);
    }
  };

  const acceptCall = async () => {
    try {
      await incomingCall.join();
      setActiveCall(incomingCall);
    } catch (error) {
      toast.error(error.message || 'Impossible de rejoindre l’appel.');
    }
  };

  const declineCall = async () => {
    try {
      await incomingCall.leave({ reject: true, reason: 'decline' });
    } catch (error) {
      toast.error(error.message || 'Impossible de refuser l’appel.');
    }
  };

  return (
    <>
      <div className="ic-stream-call-actions">
        <button type="button" className="ic-icon-btn" title="Appel audio" aria-label="Appel audio" disabled={members.length < 2 || Boolean(activeCall) || Boolean(incomingCall) || isStartingCall} onClick={() => startCall(false)}>
          <Phone size={16} />
        </button>
        <button type="button" className="ic-icon-btn" title="Appel vidéo" aria-label="Appel vidéo" disabled={members.length < 2 || Boolean(activeCall) || Boolean(incomingCall) || isStartingCall} onClick={() => startCall(true)}>
          <Video size={16} />
        </button>
      </div>

      {incomingCall && !activeCall && (
        <div className="ic-incoming-call" role="dialog" aria-label="Appel entrant">
          <strong>Appel entrant</strong>
          <div>
            <button type="button" onClick={acceptCall}><Phone size={16} /> Répondre</button>
            <button type="button" className="is-decline" onClick={declineCall}><PhoneOff size={16} /> Refuser</button>
          </div>
        </div>
      )}

      {activeCall && (
        <div className="ic-call-overlay" role="dialog" aria-label="Appel en cours">
          <StreamCall call={activeCall}>
            <ActiveCall call={activeCall} onLeave={handleLeave} onNoAnswer={handleNoAnswer} />
          </StreamCall>
        </div>
      )}
    </>
  );
}

export default function StreamInstallationCalls({ client, members, installationId }) {
  if (!client) {
    return (
      <div className="ic-stream-call-actions">
        <button type="button" className="ic-icon-btn" title="Stream indisponible" disabled><Phone size={16} /></button>
        <button type="button" className="ic-icon-btn" title="Stream indisponible" disabled><Video size={16} /></button>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <CallControlsPanel client={client} members={members} installationId={installationId} />
      </StreamTheme>
    </StreamVideo>
  );
}
