import { useCallback, useEffect, useState } from 'react';
import { CallControls, CallingState, SpeakerLayout, StreamCall, StreamTheme, StreamVideo, useCalls, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';
import '@stream-io/video-react-sdk/dist/css/styles.css';

function ActiveCall({ call, onLeave }) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) onLeave();
  }, [callingState, onLeave]);

  if (callingState === CallingState.RINGING) {
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
        <p>Appel en cours… En attente de réponse.</p>
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
  const handleLeave = useCallback(() => setActiveCall(null), []);
  const incomingCall = calls.find(call => (
    !call.isCreatedByMe && call.state.callingState === CallingState.RINGING
  ));

  const startCall = async (video) => {
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
        <button type="button" className="ic-icon-btn" title="Appel audio" disabled={members.length < 2} onClick={() => startCall(false)}>
          <Phone size={16} />
        </button>
        <button type="button" className="ic-icon-btn" title="Appel vidéo" disabled={members.length < 2} onClick={() => startCall(true)}>
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
            <ActiveCall call={activeCall} onLeave={handleLeave} />
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
