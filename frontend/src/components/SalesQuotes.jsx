import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, ChevronDown, RefreshCw, FileText, Maximize2 } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import './SalesQuotes.css';

const labels = {
  draft: 'En attente',
  approved: 'Accepté',
  rejected: 'Refusé',
  installing: 'Enregistrement du kit',
  installed: 'Installé',
};

function formatCurrency(amount, code) {
  const symbol = (!code || code === 'CDF' || code === 'XAF' || code === 'FC') ? 'Francs' : code;
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${symbol}`;
}

function QuoteRow({ quote, onNewClientQuote, focusQuote, onViewDetails }) {
  const [open, setOpen] = useState(quote.number === focusQuote);

  return (
    <article className="sales-quote">
      <button type="button" className="sales-quote-heading" onClick={() => setOpen(!open)} aria-expanded={open}>
        <FileText size={18} />
        <span>
          <strong>{quote.customer.name}</strong>
          <small>{quote.customer.phone} · {quote.number}</small>
        </span>
        <span className="sales-quote-status">{labels[quote.status]}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="sales-quote-detail">
          <dl>
            <div>
              <dt>Montant estimé</dt>
              <dd>{formatCurrency(quote.amount, quote.currency)}</dd>
            </div>
            <div>
              <dt>Créé le</dt>
              <dd>{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</dd>
            </div>
            <div>
              <dt>Installation prévue</dt>
              <dd>{quote.plannedDate || 'À planifier'}</dd>
            </div>
            <div>
              <dt>Installation enregistrée</dt>
              <dd>{quote.installedDay || 'Non enregistrée'}{quote.kitId ? ` · ${quote.kitId}` : ''}</dd>
            </div>
          </dl>
          <p>{[quote.site?.adresse, quote.site?.ville].filter(Boolean).join(', ')}</p>
          <p>{quote.system?.panels} panneaux de {quote.system?.panelPower} W · Batterie {quote.system?.batteryCapacity} kWh · Onduleur {quote.system?.inverterPower} kVA</p>
          
          <h3>Appareils du client ({quote.appliances?.length || 0})</h3>
          <ul>
            {quote.appliances?.slice(0, 8).map((item, index) => (
              <li key={index}>
                <span>{item.quantity} × {item.name}</span>
                <span>{item.watts} W · {item.hours} h/j</span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {onViewDetails && (
              <button
                type="button"
                className="sales-secondary"
                onClick={() => onViewDetails(quote)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Maximize2 size={14} /> Voir le détail complet du devis
              </button>
            )}
            {onNewClientQuote && (
              <button type="button" className="sales-secondary" onClick={() => onNewClientQuote(quote)}>
                Nouveau devis pour ce client
              </button>
            )}
          </div>

        </div>
      )}
    </article>
  );
}

export default function SalesQuotes({ onNewClientQuote, focusQuote }) {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const userId = user?._id;
  const [search, setSearch] = useState(focusQuote || '');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTerm(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const query = useQuery({
    queryKey: ['sales-quotes', userId, term, page],
    queryFn: async () => (await api.get('/api/quotes', { params: { search: term, page } })).data.data,
    refetchInterval: 30000,
  });

  const data = query.data;
  const totalStats = Object.values(data?.stats || {}).reduce((sum, value) => sum + value, 0);

  return (
    <section className="sales-register" aria-label="Suivi des devis et clients">
      <header>
        <div>
          <h2>Devis et clients</h2>
          <p>Retrouvez un client par son nom, son téléphone ou son numéro de devis.</p>
        </div>
        <button
          type="button"
          className="sales-secondary"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          aria-label="Actualiser les devis"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      <div className="sales-stats">
        {[
          ['Total des devis', totalStats],
          ['En attente', data?.stats?.draft || 0],
          ['Refusés', data?.stats?.rejected || 0],
          ['Validés', (data?.stats?.approved || 0) + (data?.stats?.installing || 0) + (data?.stats?.installed || 0)],
          ['Installés', data?.stats?.installed || 0],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {data?.notices?.map(notice => (
        <div className="sales-install-alert" role="status" key={notice._id}>
          <AlertTriangle size={19} />
          <div>
            <strong>Installation à une autre date · {notice.number}</strong>
            <p>{notice.clientName} · Kit {notice.kitId} : prévue le {notice.plannedDate}, enregistrée le {notice.installedDay}.</p>
            <small>Alerte disponible jusqu’au {new Date(notice.expiresAt).toLocaleDateString('fr-FR')}.</small>
          </div>
        </div>
      ))}

      <label className="sales-search">
        <Search size={18} />
        <input
          aria-label="Rechercher un client ou un devis"
          placeholder="Nom, téléphone ou numéro de devis"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </label>

      {query.isPending && <p role="status">Chargement des devis…</p>}
      {query.isError && (
        <p role="alert" className="sales-error">Impossible de charger les devis. Vérifiez votre connexion et réessayez.</p>
      )}

      {data && (
        <>
          <p className="sales-count">{data.total} devis trouvé{data.total > 1 ? 's' : ''}</p>
          {data.quotes.map(quote => (
            <QuoteRow
              key={quote._id}
              quote={quote}
              focusQuote={focusQuote}
              onNewClientQuote={onNewClientQuote}
              onViewDetails={quote => navigate(`/devis/${encodeURIComponent(quote.number)}`)}
            />
          ))}
          {!data.total && <p>Aucun devis enregistré pour cette recherche.</p>}
          <div className="sales-pagination">
            <button className="sales-secondary" type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Précédent
            </button>
            <span>Page {page} sur {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
            <button className="sales-secondary" type="button" disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>
              Suivant
            </button>
          </div>
        </>
      )}

    </section>
  );
}

export function SalesQuoteOverview({ onOpen }) {
  const userId = useAuthStore(state => state.user?._id);
  const query = useQuery({
    queryKey: ['sales-quotes', userId, '', 1],
    queryFn: async () => (await api.get('/api/quotes', { params: { page: 1 } })).data.data,
    refetchInterval: 30000,
  });
  const data = query.data;

  return (
    <aside className="sales-overview" aria-label="Résumé commercial">
      <div className="sales-overview-line">
        <div>
          <strong>Votre activité devis</strong>
          <p>
            {query.isPending
              ? 'Chargement…'
              : query.isError
              ? 'Suivi indisponible pour le moment.'
              : `${Object.values(data?.stats || {}).reduce((sum, value) => sum + value, 0)} devis · ${data?.stats?.draft || 0} en attente · ${data?.stats?.rejected || 0} refusés · ${(data?.stats?.approved || 0) + (data?.stats?.installing || 0) + (data?.stats?.installed || 0)} acceptés · ${data?.stats?.installed || 0} installés`}
          </p>
        </div>
        <button type="button" className="sales-secondary" onClick={onOpen}>
          Mes devis et clients{data?.notices?.length ? ` · ${data.notices.length} alerte(s)` : ''}
        </button>
      </div>
      {data?.notices?.map(notice => (
        <div className="sales-install-alert" role="status" key={notice._id}>
          <AlertTriangle size={18} />
          <div>
            <strong>Installation à une autre date · {notice.number}</strong>
            <p>
              {notice.clientName} · Prévue le {notice.plannedDate}, enregistrée le {notice.installedDay}.<br />
              Kit {notice.kitId} · Alerte conservée 7 jours.
            </p>
          </div>
        </div>
      ))}
    </aside>
  );
}
