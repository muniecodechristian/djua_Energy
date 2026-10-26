import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let animationFrame = 0;

    const updateVisibility = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        setIsVisible(window.scrollY > 480);
        animationFrame = 0;
      });
    };

    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="Remonter en haut de la page"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        })
      }
      className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 sm:bottom-7 sm:right-7"
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
