import { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { X, Keyboard, Loader2 } from 'lucide-react';
import { useInstallStore } from '../store/useInstallStore';
import { kitsApi } from '../services/api';

interface Props {
  onNext: () => void;
  onKitExists: () => void;
}

export default function Step01Scan({ onNext, onKitExists }: Props) {
  const { setBoxId, setKitRecord } = useInstallStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scanned = useRef(false);

  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [checking, setChecking] = useState(false);

  // ─── Logique principale : vérifie le kit en BDD puis route ────────────────
  const checkAndRoute = async (id: string) => {
    if (checking) return;
    setChecking(true);

    try {
      const result = await kitsApi.getKit(id.trim());

      if (result.exists && result.data) {
        // Kit déjà installé → stocker ses infos et afficher la page dédiée
        setBoxId(id.trim());
        setKitRecord(result.data);
        onKitExists();
      } else {
        // Nouveau kit → continuer l'onboarding
        setBoxId(id.trim());
        setKitRecord(null);
        onNext();
      }
    } catch {
      // Erreur réseau : on laisse passer, le backend rejettera un doublon si besoin
      setBoxId(id.trim());
      setKitRecord(null);
      onNext();
    } finally {
      setChecking(false);
    }
  };

  // ─── Démarrage caméra ─────────────────────────────────────────────────────
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

  // ─── Boucle de décodage QR ────────────────────────────────────────────────
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
        checkAndRoute(code.data);
        return;
      }
    }
    if (!checking) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  // ─── Saisie manuelle ──────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    const id = manualId.trim();
    if (!id) return;
    checkAndRoute(id);
  };

  // ─── Écran de vérification en cours ──────────────────────────────────────
  if (checking) {
    return (
      <div className="screen" style={{ background: '#0F172A', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner" size={48} color="#FF7900" style={{ marginBottom: 24 }} />
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Vérification du boîtier...</h2>
        <p style={{ color: '#94A3B8', marginTop: 8 }}>Veuillez patienter.</p>
      </div>
    );
  }

  // ─── Mode saisie manuelle ─────────────────────────────────────────────────
  if (manualMode) {
    return (
      <div className="screen fade-enter" style={{ background: '#fff' }}>
        <div className="screen-content">
          <button
            className="btn btn-ghost"
            style={{ width: 'auto', marginBottom: 24 }}
            onClick={() => setManualMode(false)}
          >
            ← Retour au scan
          </button>
          <h1 className="screen-title">Saisir l'identifiant</h1>
          <p className="screen-desc">Entrez l'ID inscrit sur l'étiquette du boîtier.</p>

          <label className="label-text">Identifiant du boîtier</label>
          <div className="input-wrap" style={{ marginBottom: 24 }}>
            <input
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              placeholder="Ex: DJB-00482"
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              autoFocus
              disabled={checking}
            />
          </div>
        </div>

        <div className="screen-footer">
          <button
            className="btn btn-primary"
            disabled={!manualId.trim() || checking}
            onClick={handleManualSubmit}
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  // ─── Écran de scan caméra ─────────────────────────────────────────────────
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

            <div className="scan-header">
              <button className="scan-close-btn" onClick={onNext}>
                <X size={22} color="#fff" />
              </button>
            </div>

            <div className="scan-overlay">
              <div className="scan-frame">
                <div className="scan-corner tl" />
                <div className="scan-corner tr" />
                <div className="scan-corner bl" />
                <div className="scan-corner br" />
                <div className="scan-laser" />
              </div>
              <p className="scan-instruction-title">Scannez le QR code du boîtier</p>
              <p className="scan-instruction-sub">Le code sera automatiquement détecté.</p>
            </div>

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
