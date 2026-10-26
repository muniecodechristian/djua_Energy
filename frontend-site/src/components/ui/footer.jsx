import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

const phone = "+243850000000";
const email = "contact@djua-energy.cd";
const whatsapp = "https://wa.me/243850000000";

const navigation = [
  { label: "Accueil", href: "#accueil" },
  { label: "Nos solutions", href: "#solutions" },
  { label: "Notre démarche", href: "#demarche" },
  { label: "Témoignages", href: "#temoignages" },
];

const expertise = [
  { label: "Étude personnalisée", href: "#expertise" },
  { label: "Installation solaire", href: "#solutions" },
  { label: "Stockage d’énergie", href: "#solutions" },
  { label: "Suivi de l’installation", href: "#demarche" },
];

function FooterLinks({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-5 space-y-3">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      id="contact"
      className="scroll-mt-16 bg-[#101116] text-white"
    >
      <section className="border-b border-white/10 px-5 py-16 text-center sm:px-8 sm:py-20 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
          Parlons de votre projet
        </p>
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Donnons à votre énergie{" "}
          <span className="text-slate-400">une nouvelle autonomie.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
          Décrivez-nous vos besoins : nous vous aiderons à envisager la solution
          adaptée à votre maison, votre activité ou votre site.
        </p>
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Nous contacter
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_1fr_1.1fr] lg:gap-12 lg:px-10 lg:py-14">
        <div>
          <a
            href="#accueil"
            aria-label="Djua Energy, retour à l’accueil"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <img
              src="/brand/djua-logo.png"
              alt=""
              width="72"
              height="40"
              loading="lazy"
              decoding="async"
              className="h-10 w-[4.5rem] rounded-lg bg-white object-contain p-1"
            />
            <span className="font-bold tracking-wide text-white">
              DJUA ENERGY
            </span>
          </a>
          <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
            Des solutions solaires pensées pour les maisons, les entreprises et
            les sites qui ont besoin d’une énergie fiable en RDC.
          </p>
        </div>

        <FooterLinks title="Navigation" links={navigation} />
        <FooterLinks title="Nos expertises" links={expertise} />

        <div>
          <h3 className="text-sm font-bold text-white">Nous trouver</h3>
          <ul className="mt-5 space-y-4 text-sm text-slate-400">
            <li className="flex items-start gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-slate-300"
                aria-hidden="true"
              />
              <span>Kinshasa, République démocratique du Congo</span>
            </li>
            <li>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-3 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300"
              >
                <Phone size={16} aria-hidden="true" />
                +243 850 000 000
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 break-all transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300"
              >
                <Mail size={16} className="shrink-0" aria-hidden="true" />
                {email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5 text-xs text-slate-500 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Djua Energy. Tous droits réservés.</p>
          <a
            href="#accueil"
            className="w-fit transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300"
          >
            Retour à l’accueil
          </a>
        </div>
      </div>
    </footer>
  );
}
