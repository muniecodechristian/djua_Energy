import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-[#17211e] text-white">
      <div className="border-b border-white/10 px-6 py-14 sm:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c9e06d]">Parlons de votre installation</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
              Votre projet solaire commence par une conversation.
            </h2>
          </div>
          <a href="tel:+243995424606" className="inline-flex min-h-12 items-center gap-2 self-start rounded-md bg-[#d9e8a7] px-5 text-sm font-bold text-[#17211e] hover:bg-white sm:self-auto">
            <Phone size={15} /> Appeler Djua
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-12 md:grid-cols-3">
        <div>
          <Link href="/" className="text-lg font-bold tracking-tight">Djua Energy</Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
            Étude, installation et suivi de systèmes solaires pour les foyers et les activités en RDC.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Découvrir</h3>
          <nav className="mt-4 flex flex-col gap-3 text-sm text-white/65" aria-label="Liens de pied de page">
            <Link href="/#solutions" className="hover:text-white">Nos solutions</Link>
            <Link href="/#approche" className="hover:text-white">Notre approche</Link>
            <Link href="/about" className="hover:text-white">À propos de Djua</Link>
            <Link href="/services" className="hover:text-white">Services</Link>
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Nous contacter</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/65">
            <p><MapPin className="mr-2 inline size-4 text-[#c9e06d]" />Kinshasa, RDC</p>
            <a href="tel:+243995424606" className="hover:text-white"><Phone className="mr-2 inline size-4 text-[#c9e06d]" />099 542 4606</a>
            <a href="tel:+243837807301" className="hover:text-white"><Phone className="mr-2 inline size-4 text-[#c9e06d]" />+243 837 807 301</a>
            <a href="mailto:Techplus643@gmail.com" className="hover:text-white"><Mail className="mr-2 inline size-4 text-[#c9e06d]" />Techplus643@gmail.com</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-xs text-white/45 sm:px-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} Djua Energy. Tous droits réservés.</span>
          <Link href="/#contact" className="inline-flex items-center gap-1 hover:text-white">Demander une étude <ArrowUpRight size={13} /></Link>
        </div>
      </div>
    </footer>
  );
}
