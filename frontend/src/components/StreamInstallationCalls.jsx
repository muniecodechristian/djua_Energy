import { useCallback, useEffect, useState } from 'react';
import { CallingState, RecordCallButton, SpeakerLayout, StreamCall, StreamTheme, StreamVideo, useCalls, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Mic, MicOff, MonitorUp, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { createPortal } from 'react-dom';
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
        <p>
          {callingState === CallingState.IDLE
            ? 'Préparation de l’appel…'
            : callingState === CallingState.JOINING
              ? 'Le participant accepte l’appel. Connexion en cours…'
              : 'Appel lancé… En attente de réponse. Sans connexion du participant sous 30 secondes, il sera signalé sans réponse.'}
        </p>
        <button type="button" onClick={cancelCall}>
          <PhoneOff size={16} /> Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="ic-call-stage">
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallMediaControls call={call} onLeave={onLeave} />
    </div>
  );
}

function CallMediaControls({ call, onLeave }) {
  const { useMicrophoneState, useCameraState, useScreenShareState } = useCallStateHooks();
  const { microphone, optionsAwareIsMute: isMicrophoneMuted, isTogglePending: isMicrophonePending } = useMicrophoneState();
  const { camera, optionsAwareIsMute: isCameraMuted, isTogglePending: isCameraPending } = useCameraState();
  const { screenShare, optionsAwareIsMute: isScreenShareMuted, isTogglePending: isScreenSharePending } = useScreenShareState();

  const toggleMicrophone = async () => {
    try {
      await microphone.toggle();
    } catch (error) {
      toast.error(error.message || 'Impossible de modifier le microphone.');
    }
  };

  const toggleCamera = async () => {
    try {
      await camera.toggle();
    } catch (error) {
      toast.error(error.message || 'Impossible de modifier la caméra.');
    }
  };

  const toggleScreenShare = async () => {
    try {
      await screenShare.toggle();
    } catch (error) {
      toast.error(error.message || 'Impossible de partager l’écran.');
    }
  };

  return (
    <div className="ic-call-media-controls" aria-label="Commandes de l’appel">
      <button
        type="button"
        className="ic-call-media-button"
        aria-label={isMicrophoneMuted ? 'Activer le microphone' : 'Couper le microphone'}
        title={isMicrophoneMuted ? 'Activer le microphone' : 'Couper le microphone'}
        aria-pressed={!isMicrophoneMuted}
        disabled={isMicrophonePending}
        onClick={toggleMicrophone}
      >
        {isMicrophoneMuted ? <MicOff size={19} /> : <Mic size={19} />}
        <span>{isMicrophoneMuted ? 'Micro coupé' : 'Micro'}</span>
      </button>
      <button
        type="button"
        className="ic-call-media-button"
        aria-label={isCameraMuted ? 'Activer la vidéo' : 'Désactiver la vidéo'}
        title={isCameraMuted ? 'Activer la vidéo' : 'Désactiver la vidéo'}
        aria-pressed={!isCameraMuted}
        disabled={isCameraPending}
        onClick={toggleCamera}
      >
        {isCameraMuted ? <VideoOff size={19} /> : <Video size={19} />}
        <span>{isCameraMuted ? 'Vidéo coupée' : 'Vidéo'}</span>
      </button>
      <button
        type="button"
        className="ic-call-media-button"
        aria-label={isScreenShareMuted ? 'Partager l’écran' : 'Arrêter le partage d’écran'}
        title={isScreenShareMuted ? 'Partager l’écran' : 'Arrêter le partage d’écran'}
        aria-pressed={!isScreenShareMuted}
        disabled={isScreenSharePending}
        onClick={toggleScreenShare}
      >
        <MonitorUp size={19} />
        <span>{isScreenShareMuted ? 'Partager écran' : 'Arrêter partage'}</span>
      </button>
      <div className="ic-call-record-control" title="Enregistrement de l’appel">
        <RecordCallButton caption="Enregistrer" />
      </div>
      <button type="button" className="ic-call-media-button is-danger" aria-label="Quitter l’appel" title="Quitter l’appel" onClick={() => call.leave().then(onLeave).catch(error => toast.error(error.message || 'Impossible de quitter l’appel.'))}>
        <PhoneOff size={19} />
        <span>Quitter</span>
      </button>
    </div>
  );
}

function CallControlsPanel({ client, members, installationId }) {
  const calls = useCalls();
  const [activeCall, setActiveCall] = useState(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [acceptingCall, setAcceptingCall] = useState(null);
  const handleLeave = useCallback(() => setActiveCall(null), []);
  const incomingCall = calls.find(call => (
    !call.isCreatedByMe
    && call.state.callingState === CallingState.RINGING
    && call.state.custom?.installationId === installationId
  ));
  const pendingIncomingCall = incomingCall || acceptingCall;

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
    if (!incomingCall || acceptingCall) return;
    setAcceptingCall(incomingCall);
    try {
      await incomingCall.join();
      setActiveCall(incomingCall);
    } catch (error) {
      toast.error(error.message || 'Impossible de rejoindre l’appel.');
    } finally {
      setAcceptingCall(null);
    }
  };

  const declineCall = async () => {
    if (!incomingCall || acceptingCall) return;
    try {
      await incomingCall.leave({ reject: true, reason: 'decline' });
    } catch (error) {
      toast.error(error.message || 'Impossible de refuser l’appel.');
    }
  };

  return (
    <>
      <div className="ic-stream-call-actions">
        <button type="button" className="ic-call-start-button" title="Appel audio" aria-label="Appel audio" disabled={members.length < 2 || Boolean(activeCall) || Boolean(pendingIncomingCall) || isStartingCall} onClick={() => startCall(false)}>
          <Phone size={16} />
          <span>Audio</span>
        </button>
        <button type="button" className="ic-call-start-button" title="Appel vidéo" aria-label="Appel vidéo" disabled={members.length < 2 || Boolean(activeCall) || Boolean(pendingIncomingCall) || isStartingCall} onClick={() => startCall(true)}>
          <Video size={16} />
          <span>Vidéo</span>
        </button>
        {isStartingCall && <span className="ic-call-start-status" role="status">Préparation de l’appel…</span>}
      </div>

      {pendingIncomingCall && !activeCall && createPortal(
        <div className="ic-incoming-call" role="dialog" aria-label="Appel entrant">
          <strong>{acceptingCall ? 'Connexion à l’appel…' : 'Appel entrant'}</strong>
          <div>
            <button type="button" disabled={Boolean(acceptingCall)} onClick={acceptCall}><Phone size={16} />{acceptingCall ? 'Connexion…' : 'Répondre'}</button>
            <button type="button" className="is-decline" disabled={Boolean(acceptingCall)} onClick={declineCall}><PhoneOff size={16} /> Refuser</button>
          </div>
        </div>,
        document.body,
      )}

      {activeCall && createPortal(
        <div className="ic-call-overlay" role="dialog" aria-label="Appel en cours">
          <StreamCall call={activeCall}>
            <ActiveCall call={activeCall} onLeave={handleLeave} onNoAnswer={handleNoAnswer} />
          </StreamCall>
        </div>,
        document.body,
      )}
    </>
  );
}

export default function StreamInstallationCalls({ client, members, installationId, loading, error }) {
  if (!client) {
    const status = loading ? 'Connexion à Stream en cours' : error ? 'Stream indisponible' : 'Stream non connecté';
    return (
      <div className="ic-stream-call-actions">
        <button type="button" className="ic-call-start-button" title={status} aria-label={`Appel audio, ${status}`} disabled><Phone size={16} /><span>Audio</span></button>
        <button type="button" className="ic-call-start-button" title={status} aria-label={`Appel vidéo, ${status}`} disabled><Video size={16} /><span>Vidéo</span></button>
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
