import PageEntrance from '../components/PageEntrance';
import { Link } from 'react-router-dom';
import {
    Palette,
    ShieldCheck,
    Database,
    ArrowUpRight,
    Info,
    Maximize2,
    MoreHorizontal,
    SlidersHorizontal,
    UserCheck,
    HardDrive,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import useAuthStore from '../hooks/Zustand/useAuthStore';

const PREVIEW_BARS = [38, 55, 47, 62, 58, 74, 66, 52, 70, 68, 84, 76, 92, 80, 88, 96, 72, 82];

/* Classes Tailwind réutilisées (thème clair par défaut, variantes dark: pour le sombre) */
const card =
    'flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-[#17171a]';
const cardHead =
    'flex items-center justify-between px-3.5 py-2.5 text-xs text-zinc-500 dark:text-zinc-400';
const cardBody =
    '-mx-px -mb-px flex-1 rounded-2xl border-t border-black/10 p-[18px] ' +
    'bg-[radial-gradient(120%_90%_at_0%_0%,#ffffff_0%,#f3f3f5_70%)] ' +
    'dark:border-white/10 dark:bg-[radial-gradient(120%_90%_at_0%_0%,#1b1b1f_0%,#0f0f11_70%)]';
const bodyText = 'max-w-[60ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400';
const linkBtn =
    'mt-3.5 inline-flex items-center gap-1.5 rounded-[10px] border border-black/10 bg-zinc-100 px-3 py-1.5 text-[13px] text-zinc-900 no-underline transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 dark:border-white/10 dark:bg-[#17171a] dark:text-zinc-100 dark:hover:border-zinc-500';
const chip =
    'inline-flex items-center gap-2 rounded-[10px] border border-black/10 bg-zinc-100 px-3 py-1.5 text-[13px] dark:border-white/10 dark:bg-[#17171a]';

const DOT = {
    ok: 'bg-emerald-500',
    warn: 'bg-amber-400',
    info: 'bg-blue-400',
};

function CardHead({ icon: Icon, label, expand }) {
    return (
        <div className={cardHead}>
            <span className="inline-flex items-center gap-2">
                <Icon size={13} />
                {label}
            </span>
            {expand ? <Maximize2 size={13} /> : <MoreHorizontal size={15} />}
        </div>
    );
}

function StatCard({ icon, label, value, status, tone }) {
    return (
        <article className={card}>
            <CardHead icon={icon} label={label} />
            <div className={cardBody}>
                <strong className="mb-2 block text-[22px] font-semibold tracking-tight">{value}</strong>
                <span className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <i className={`inline-block size-2 shrink-0 rounded-full ${DOT[tone]}`} />
                    {status}
                </span>
            </div>
        </article>
    );
}

export default function AdministrationSettings() {
    const user = useAuthStore((state) => state.user);
    const userName = user
        ? user.identifier || [user.prenom, user.nom].filter(Boolean).join(' ')
        : '';

    return (
        <PageEntrance className="flex flex-col gap-5 p-4 text-zinc-900 dark:text-zinc-100 sm:p-6">
            {/* En-tête */}
            <header>
                <h1 className="mb-1 text-[22px] font-semibold tracking-tight">Paramètres</h1>
                <p className="max-w-[62ch] text-sm text-zinc-500 dark:text-zinc-400">
                    Préférences d’affichage et informations sur les fonctions disponibles.
                </p>
            </header>

            {/* Cartes de synthèse */}
            <section aria-label="Résumé" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Palette}
                    label="Affichage"
                    value="Thème"
                    status="Conservé dans ce navigateur"
                    tone="ok"
                />
                <StatCard
                    icon={UserCheck}
                    label="Session"
                    value={user ? 'Connecté' : 'Navigation libre'}
                    status={user ? 'Compte actif' : 'Connexion facultative'}
                    tone={user ? 'ok' : 'warn'}
                />
                <StatCard
                    icon={Database}
                    label="Supervision"
                    value="Serveur"
                    status="Inventaire, alertes, télémétrie"
                    tone="ok"
                />
                <StatCard
                    icon={HardDrive}
                    label="Brouillons"
                    value="Local"
                    status="Maintenance enregistrée ici"
                    tone="ok"
                />
            </section>

            {/* Barre de section */}
            <div className="mt-1.5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Préférences</h2>
                <div className="flex gap-2">
                    <span className={chip}>
                        <SlidersHorizontal size={13} />
                        Personnaliser
                    </span>
                    <span className={`${chip} px-2.5`}>
                        <MoreHorizontal size={15} />
                    </span>
                </div>
            </div>

            {/* Grille principale */}
            <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
                {/* Apparence */}
                <section className={`${card} lg:row-span-2`}>
                    <CardHead icon={Palette} label="Apparence" expand />
                    <div className={cardBody}>
                        <h3 className="mb-2 text-xl font-semibold tracking-tight">Thème de l’interface</h3>
                        <p className={bodyText}>
                            Choisissez le thème clair ou sombre. Votre préférence est conservée dans ce
                            navigateur.
                        </p>
                        <div className="mb-6 mt-4">
                            <ThemeToggle />
                        </div>
                        <div aria-hidden="true" className="flex h-44 items-end gap-1.5 pt-2">
                            {PREVIEW_BARS.map((h, i) => (
                                <span
                                    key={i}
                                    style={{ height: `${h}%` }}
                                    className="flex flex-1 items-end rounded-t bg-zinc-200 dark:bg-[#2c2c31]"
                                >
                                    <span
                                        style={{ height: `${40 + (i % 5) * 6}%` }}
                                        className="w-full rounded-t border-t border-white/40 bg-zinc-400 dark:bg-[#5a5a61]"
                                    />
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Session */}
                <section className={card}>
                    <CardHead icon={ShieldCheck} label="Session" expand />
                    <div className={cardBody}>
                        <p className={bodyText}>
                            {user
                                ? 'Connecté avec le compte ' + userName + '.'
                                : 'Vous consultez la plateforme en navigation libre. Certaines fonctions du serveur peuvent nécessiter une connexion.'}
                        </p>
                        <Link className={linkBtn} to="/">
                            Page de connexion <ArrowUpRight size={15} />
                        </Link>
                    </div>
                </section>

                {/* Données de supervision */}
                <section className={card}>
                    <CardHead icon={Database} label="Données de supervision" expand />
                    <div className={cardBody}>
                        <p className={bodyText}>
                            L’inventaire, les alertes et la télémétrie sont chargés depuis le serveur. Les
                            brouillons de maintenance sont enregistrés localement.
                        </p>
                        <Link className={linkBtn} to="/parc">
                            Consulter le parc <ArrowUpRight size={15} />
                        </Link>
                    </div>
                </section>

                {/* Administration avancée */}
                <section className={`${card} lg:col-span-2`}>
                    <CardHead icon={Info} label="Administration avancée" />
                    <div className={`${cardBody} flex flex-wrap items-center justify-between gap-4`}>
                        <p className={bodyText}>
                            La gestion des rôles, l’affectation des techniciens et l’audit nécessitent des
                            services dédiés. Ces fonctions ne sont pas encore disponibles dans cet espace.
                        </p>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-zinc-100 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-[#17171a]">
                            <i className={`inline-block size-2 rounded-full ${DOT.info}`} />À connecter
                        </span>
                    </div>
                </section>
            </div>
        </PageEntrance>
    );
}