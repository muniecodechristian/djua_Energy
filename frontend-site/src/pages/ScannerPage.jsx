import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, ShieldCheck } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Prêt");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            html5QrCodeRef.current.clear().catch(() => {});
            html5QrCodeRef.current = null;
          });
      }
    };
  }, []);

  const startScan = async () => {
    setError("");
    setResult("");
    setStatus("Démarrage du scanner...");

    try {
      const elementId = "scanner-reader";
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(elementId);
      }

      const devices = await Html5Qrcode.getCameras();
      const cameraId = (devices && devices.length && devices[0].id) || undefined;

      await html5QrCodeRef.current.start(
        cameraId || { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setResult(decodedText);
          setStatus("QR détecté");
          stopScan();
        },
        (errorMessage) => {
          // optional error callback
        }
      );

      setScanning(true);
      setStatus("Caméra active — pointez le QR code");
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setStatus("Erreur");
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear().catch(() => {});
        html5QrCodeRef.current = null;
      }
    }
  };

  const stopScan = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      await html5QrCodeRef.current.stop();
    } catch (e) {
      // ignore
    }
    try {
      await html5QrCodeRef.current.clear();
    } catch (e) {
      // ignore
    }
    html5QrCodeRef.current = null;
    setScanning(false);
    setStatus(result ? "Terminé" : "Arrêté");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 px-4 py-12 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Scanner</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Scannez un QR code pour récupérer les informations rapidement.</p>
        </header>

        <main className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-700 dark:text-slate-300">
              <Camera size={16} />
              <span>{scanning ? "Caméra active" : "Caméra inactive"}</span>
            </div>

            <div id="scanner-reader" ref={qrRef} className="h-64 w-full rounded-md bg-black/80" />

            <div className="mt-3 flex gap-2">
              {!scanning ? (
                <button onClick={startScan} className="px-4 py-2 rounded bg-blue-600 text-white">Démarrer</button>
              ) : (
                <button onClick={stopScan} className="px-4 py-2 rounded bg-gray-600 text-white">Arrêter</button>
              )}
              <button
                onClick={() => {
                  setResult("");
                  setError("");
                  setStatus("Prêt");
                }}
                className="px-4 py-2 rounded border"
              >
                Réinitialiser
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded p-2 bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {result && (
              <div className="mt-3 rounded p-2 bg-emerald-50 text-emerald-800 border border-emerald-100">
                <div className="text-sm font-medium">Résultat</div>
                <div className="mt-1 text-sm break-all">{result}</div>
              </div>
            )}

            <div className="mt-3 text-xs text-slate-500">Statut: {status}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
