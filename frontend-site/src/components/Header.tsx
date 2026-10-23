import React, { useState, useEffect } from 'react';

const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBjEVP6WMcrEsv2nLYSgS9v4WfV711u6ne8fa0aJHDt8jAPuumn7dzikn8PIFEYq7whxH5iUZF0Hp4b92Z9SI44LG4uRnir7pr0-ES6zx8j0xpVv2pEq-x2t_pioe64Plt7nSVa8R3qmC0HbNrrXrNmnwO6NR6nrr80S_g0KTAAhwU7TLDwQxylz9da34eGd7zyXiuyuz5ah02oKZx3i2MRdZVu6H3tfwGv5hNcm8A_UvHUSZdbWh7He3c3Alx5dlSJzww";

interface HeaderProps {
  onOpenPilot?: () => void;
  appLoginUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPilot,
  appLoginUrl = "http://localhost:5173/"
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollY / docHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Scroll Indicator */}
      <div
        id="dj-bar"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-200 ${
          isScrolled ? 'dj-s shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 transition-all duration-300">
            {/* Brand Logo */}
            <a className="flex items-center gap-3 group" href="#" title="Djua Energy">
              <img
                alt="Djua Logo"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                src={LOGO_URL}
              />
            </a>

            {/* Desktop Navigation Links style Notion / Monday */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium text-slate-600">
              <a
                className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
                href="#ecosysteme-monday"
              >
                Produit
              </a>
              <a
                className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
                href="#solutions"
              >
                Solutions
              </a>
              <a
                className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
                href="#tarifs"
              >
                Tarifs
              </a>
              <a
                className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
                href="#temoignages"
              >
                Témoignages
              </a>
              <a
                className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition-colors"
                href="#faq"
              >
                FAQ
              </a>
            </nav>

            {/* Header Actions / CTA */}
            <div className="hidden sm:flex items-center space-x-3 sm:space-x-4">
              <a
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
                href={appLoginUrl}
              >
                Se connecter
              </a>
              <button
                type="button"
                onClick={onOpenPilot}
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 hover:text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                Démarrer gratuitement
              </button>
            </div>

            {/* Mobile menu trigger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              href="#ecosysteme-monday"
            >
              Produit
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              href="#solutions"
            >
              Solutions
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              href="#tarifs"
            >
              Tarifs
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              href="#temoignages"
            >
              Témoignages
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              href="#faq"
            >
              FAQ
            </a>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a
                className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 rounded-xl"
                href={appLoginUrl}
              >
                Se connecter
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPilot?.();
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 text-center"
              >
                Démarrer gratuitement
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
