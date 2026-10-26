import { Mail, MapPin, Phone } from "lucide-react";

const phone = "+243850000000";
const email = "contact@djua-energy.cd";
const whatsapp = "https://wa.me/243850000000";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-16 bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-center md:gap-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400 sm:text-sm">
            Votre prochain projet commence ici
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Et si on parlait de votre énergie ?
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            Expliquez-nous ce dont vous avez besoin. Notre équipe vous aide à
            imaginer une solution solaire qui vous correspond.
          </p>
        </div>

        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-500 px-7 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-400 sm:text-base"
        >
          Nous contacter
        </a>
      </div>

      <div className="mx-auto mt-10 grid max-w-7xl gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 sm:grid-cols-3 sm:gap-6">
        <a
          href={`tel:${phone}`}
          className="inline-flex min-w-0 items-center gap-3 transition hover:text-amber-300"
        >
          <Phone size={17} className="shrink-0 text-amber-400" aria-hidden="true" />
          <span>+243 850 000 000</span>
        </a>
        <a
          href={`mailto:${email}`}
          className="inline-flex min-w-0 items-center gap-3 transition hover:text-amber-300"
        >
          <Mail size={17} className="shrink-0 text-amber-400" aria-hidden="true" />
          <span className="break-all">{email}</span>
        </a>
        <p className="inline-flex min-w-0 items-center gap-3">
          <MapPin size={17} className="shrink-0 text-amber-400" aria-hidden="true" />
          Kinshasa, République démocratique du Congo
        </p>
      </div>
    </section>
  );
}
