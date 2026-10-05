import { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { X, Zap, ZapOff, Keyboard, Loader2 } from 'lucide-react';
import { useInstallStore } from '../store/useInstallStore';
import { devicesApi } from '../services/api';

interface Props { onNext: () => void; }

export default function Step01Scan({ onNext }: Props) {
  const setBoxId = useInstallStore(s => s.setBoxId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scanned = useRef(false);

  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState(false);
  
  const [checking, setChecking] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  // ─── Vérification en base ────────────────────────────────────────────────
  const checkAndProceed = async (id: string) => {
    if (checking) return;
    setChecking(true);
    setAlreadyExists(false);
    
    try {
      const device = await devicesApi.getDevice(id);
      if (device) {
        // Le kit existe déjà
        setAlreadyExists(true);
      } else {
        // Le kit n'existe pas, on peut l'installer
        setBoxId(id);
        onNext();
      }
    } catch (err) {
      console.error('Erreur vérification kit:', err);
      // En cas d'erreur réseau, on permet de continuer
      setBoxId(id);
      onNext();
    } finally {
      setChecking(false);
    }
  };

  // ─── Démarrage caméra ──────────────────────────────────────────────────
  useEffect(() => {
    if (manualMode) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(tick);
        }
      })
      .catch(() => setCameraError(true));

    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [manualMode]);

  // ─── Boucle de scan QR ────────────────────────────────────────────────
  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || scanned.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        scanned.current = true;
        streamRef.current?.getTracks().forEach(t => t.stop());
        checkAndProceed(code.data);
        return;
      }
    }
    if (!checking) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  // ─── Saisie manuelle ──────────────────────────────────────────────────
  const handleManualSubmit = () => {
    const id = manualId.trim();
    if (!id) return;
    checkAndProceed(id);
  };

  if (manualMode) {
    return (
      <div className="screen fade-enter" style={{ background: '#fff' }}>
        <div className="screen-content">
          <button className="btn btn-ghost" style={{ width:'auto', marginBottom: 24 }} onClick={() => setManualMode(false)}>
            ← Retour au scan
          </button>
          <h1 className="screen-title">Saisir l'identifiant</h1>
          <p className="screen-desc">Entrez l'ID inscrit sur l'étiquette du boîtier.</p>
          <label className="label-text">Identifiant du boîtier</label>
          <div className="input-wrap" style={{ marginBottom: alreadyExists ? 8 : 24 }}>
            <input
              value={manualId}
              onChange={e => {
                setManualId(e.target.value);
                setAlreadyExists(false);
              }}
              placeholder="Ex: DJB-00482"
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              autoFocus
              disabled={checking}
            />
          </div>
          {alreadyExists && (
            <div style={{ color: '#E11D48', fontSize: 14, marginBottom: 24, padding: '12px', background: '#FFE4E6', borderRadius: 8 }}>
              Ce boîtier est déjà enregistré dans le système. Vous ne pouvez pas l'installer à nouveau.
            </div>
          )}
        </div>
        <div className="screen-footer">
          <button className="btn btn-primary" disabled={!manualId.trim() || checking} onClick={handleManualSubmit}>
            {checking ? <Loader2 className="spinner" size={20} /> : 'Continuer'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Ecran de scan en cours de vérification ───────────────────────────
  if (checking) {
    return (
      <div className="screen" style={{ background: '#0F172A', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner" size={48} color="#FF7900" style={{ marginBottom: 24 }} />
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Vérification du boîtier...</h2>
        <p style={{ color: '#94A3B8', marginTop: 8 }}>Veuillez patienter.</p>
      </div>
    );
  }

  if (alreadyExists && !manualMode) {
    return (
      <div className="screen" style={{ background: '#fff' }}>
        <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <X size={32} />
          </div>
          <h1 className="screen-title" style={{ color: '#0F172A' }}>Boîtier déjà existant</h1>
          <p className="screen-desc" style={{ marginBottom: 32 }}>Ce boîtier est déjà enregistré dans le système. Vous ne pouvez pas l'installer une deuxième fois.</p>
          <button className="btn btn-primary" onClick={() => {
            setAlreadyExists(false);
            scanned.current = false;
            // relance la caméra
            rafRef.current = requestAnimationFrame(tick);
          }}>
            Scanner un autre boîtier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="scan-screen">
        {cameraError ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: 32 }}>
            <p style={{ marginBottom: 16, fontSize: 15 }}>Caméra non disponible.</p>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setManualMode(true)}>
              Saisir manuellement
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="scan-video" playsInline muted />
            <canvas ref={canvasRef} className="scan-canvas" />

            {/* Header */}
            <div className="scan-header">
              <button className="scan-close-btn" onClick={onNext}>
                <X size={22} color="#fff" />
              </button>
            </div>

            {/* Overlay central */}
            <div className="scan-overlay">
              <div className="scan-frame">
                <div className="scan-corner tl" />
                <div className="scan-corner tr" />
                <div className="scan-corner bl" />
                <div className="scan-corner br" />
                <div className="scan-laser" />
              </div>
              <button className="scan-torch-btn">
                <Zap size={22} color="#fff" />
              </button>
              <p className="scan-instruction-title">Scannez le QR code du boîtier</p>
              <p className="scan-instruction-sub">Le code sera automatiquement détecté.</p>
            </div>

            {/* Bas */}
            <div className="scan-bottom">
              <button
                className="btn"
                style={{ background: 'rgba(241,245,249,.92)', color: '#0F172A' }}
                onClick={() => setManualMode(true)}
              >
                <Keyboard size={16} style={{ marginRight: 8 }} />
                Saisir l'identifiant manuellement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
