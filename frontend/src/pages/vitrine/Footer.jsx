import React from 'react';

const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBjEVP6WMcrEsv2nLYSgS9v4WfV711u6ne8fa0aJHDt8jAPuumn7dzikn8PIFEYq7whxH5iUZF0Hp4b92Z9SI44LG4uRnir7pr0-ES6zx8j0xpVv2pEq-x2t_pioe64Plt7nSVa8R3qmC0HbNrrXrNmnwO6NR6nrr80S_g0KTAAhwU7TLDwQxylz9da34eGd7zyXiuyuz5ah02oKZx3i2MRdZVu6H3tfwGv5hNcm8A_UvHUSZdbWh7He3c3Alx5dlSJzww";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800" data-purpose="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Logo & Mission */}
          <div className="lg:col-span-2 space-y-5">
            <a className="inline-block" href="#" title="Djua Home">
              <img
                alt="Djua Logo"
                className="h-8 w-auto brightness-0 invert object-contain"
                src={LOGO_URL}
              />
            </a>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              L'énergie solaire fiable, intelligente et connectée en République Démocratique du Congo. Étude, fabrication et déploiement clé en main pour un avenir sans coupure.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a
                aria-label="Facebook"
                className="text-slate-400 hover:text-white transition-colors"
                href="#"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                aria-label="Instagram"
                className="text-slate-400 hover:text-white transition-colors"
                href="#"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                aria-label="LinkedIn"
                className="text-slate-400 hover:text-white transition-colors"
                href="#"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Solutions
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a className="hover:text-white transition-colors" href="#solutions">
                  Résidentiel &amp; Villas
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#solutions">
                  Mini-Grids Ruraux
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#solutions">
                  Kits Tertiaires &amp; PME
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#solutions">
                  Conteneurs PowerCube
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#supervision">
                  Télémétrie &amp; IoT GSM
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Entreprise */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Entreprise
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a className="hover:text-white transition-colors" href="#">
                  À Propos de Djua
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#tarifs">
                  Comparatif Diesel
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#temoignages">
                  Études de Cas
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#">
                  Carrières &amp; Recrutement
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#">
                  Actualités Énergie RDC
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Direct */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Contact Direct
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>+243 850 000 000</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>contact@djua-energy.cd</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>Boulevard du 30 Juin, Gombe, Kinshasa, RDC</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Copyright & Legal Links */}
        <div className="mt-14 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Djua Energy RDC. Tous droits réservés.</p>
          <div className="flex space-x-6">
            <a className="hover:text-slate-400 transition-colors" href="#">
              Politique de Confidentialité
            </a>
            <a className="hover:text-slate-400 transition-colors" href="#">
              Conditions Générales
            </a>
            <a className="hover:text-slate-400 transition-colors" href="#">
              Mentions Légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
