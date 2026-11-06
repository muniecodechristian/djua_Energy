import { useEffect } from 'react';
import TECHNICIAN_APP_URL from '../lib/technicianAppUrl';

export default function TechnicianAppRedirect() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(TECHNICIAN_APP_URL);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-neutral-100">
      <section className="max-w-md rounded-2xl border border-neutral-800 bg-[#141414] p-6 text-center shadow-xl">
        <h1 className="text-lg font-bold">Espace réservé</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400" role="status">
          Les techniciens ne peuvent pas accéder à la grande plateforme. Vous allez être redirigé vers l’application technicien.
        </p>
        <a
          className="mt-5 inline-flex rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-400"
          href={TECHNICIAN_APP_URL}
        >
          Ouvrir l’application technicien
        </a>
      </section>
    </main>
  );
}
