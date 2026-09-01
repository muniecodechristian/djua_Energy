import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoonStar, SunMedium } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');
    root.classList.toggle('dark', nextDark);
    root.dataset.theme = nextDark ? 'dark' : 'light';
    root.style.colorScheme = nextDark ? 'dark' : 'light';
    window.localStorage.setItem('djua-theme', nextDark ? 'dark' : 'light');
    setIsDark(nextDark);
  };

  return (
    <motion.button
      type="button"
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      onClick={toggleTheme}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)]/80 px-3 py-2 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-400 hover:border-orange-500/50 hover:shadow-[0_18px_40px_rgba(249,115,22,0.18)] sm:left-auto sm:right-[120px]"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--panel-alt)] text-[var(--app-foreground)] ring-1 ring-[var(--panel-border)]">
        <motion.span
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -35, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isDark ? <SunMedium size={16} className="text-orange-400" /> : <MoonStar size={16} className="text-orange-500" />}
        </motion.span>
      </span>
      <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-foreground)] sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </motion.button>
  );
}
