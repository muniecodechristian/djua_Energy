import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useVoiceInput — Hook de transcription vocale en temps réel.
 *
 * Utilise la Web Speech API (SpeechRecognition) — native dans tous les
 * navigateurs modernes (Chrome, Edge, Safari 15+). Pas de dépendance externe.
 *
 * @param {Object} options
 * @param {string}   options.lang          — Langue BCP-47 (défaut : 'fr-FR')
 * @param {Function} options.onTranscript  — Appelé avec le texte final reconnu
 * @param {Function} options.onInterim     — Appelé avec le texte intermédiaire (live)
 * @param {Function} options.onError       — Appelé en cas d'erreur (string)
 *
 * @returns {{
 *   isListening    : boolean,
 *   isSupported    : boolean,
 *   interimText    : string,
 *   start          : () => void,
 *   stop           : () => void,
 *   toggle         : () => void,
 * }}
 */
export function useVoiceInput({
  lang = 'fr-FR',
  onTranscript,
  onInterim,
  onError,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  // ── Vérification support navigateur ─────────────────────────────────────────
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // ── Initialisation de l'instance SpeechRecognition ──────────────────────────
  const getRecognition = useCallback(() => {
    if (!isSupported) return null;
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang;
    recognition.interimResults = true;   // Transcription en direct
    recognition.continuous = false;      // S'arrête naturellement après une pause
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        onInterim?.(interim);
      }

      if (final) {
        setInterimText('');
        onTranscript?.(final.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimText('');
      // 'no-speech' est silencieux (l'utilisateur n'a rien dit)
      if (event.error === 'no-speech') return;
      onError?.(event.error);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [lang, onTranscript, onInterim, onError, isSupported]);

  // ── Actions publiques ────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (!isSupported) {
      onError?.('Votre navigateur ne supporte pas la reconnaissance vocale.');
      return;
    }
    const recognition = getRecognition();
    if (!recognition || isListening) return;
    try {
      recognition.start();
      setIsListening(true);
      setInterimText('');
    } catch {
      // Ignoré si déjà démarré
    }
  }, [isSupported, isListening, getRecognition, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  // ── Nettoyage au démontage ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isListening, isSupported, interimText, start, stop, toggle };
}
