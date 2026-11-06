export function playCallRingtone() {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return () => undefined;

  const context = new AudioContextConstructor();
  let stopped = false;
  let timeout;

  const playTone = () => {
    if (stopped || context.state !== 'running') return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
    timeout = window.setTimeout(playTone, 950);
  };

  context.resume().then(playTone).catch(() => {
    // Incoming-call audio may be blocked until the user interacts with the page.
  });

  return () => {
    stopped = true;
    if (timeout !== undefined) window.clearTimeout(timeout);
    if (context.state !== 'closed') {
      context.close().catch(() => {
        // The ringtone is already stopped; a closed audio context needs no recovery.
      });
    }
  };
}
