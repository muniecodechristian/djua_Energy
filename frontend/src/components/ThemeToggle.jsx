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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-alt)] px-3 py-2 text-xs font-semibold text-[var(--app-foreground)] hover:bg-[var(--panel)] hover:text-[#FF7900] transition-colors"
    >
      <span className="flex items-center justify-center text-[var(--app-foreground)]">
        <motion.span
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -35, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isDark ? <SunMedium size={17} className="text-orange-400" /> : <MoonStar size={17} className="text-orange-500" />}
        </motion.span>
      </span>
      <span className="hidden sm:inline text-xs font-medium">
        {isDark ? 'Clair' : 'Sombre'}
      </span>
    </motion.button>
  );
}

