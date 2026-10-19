import { FilePlus2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageEntrance from '../components/PageEntrance';
import SalesQuotes from '../components/SalesQuotes';

export default function AdminQuotes() {
  return (
    <PageEntrance className="ops-page">
      <div className="ops-page-heading">
        <div>
          <p className="ops-eyebrow">SUIVI COMMERCIAL</p>
          <h1>Devis</h1>
          <p>Suivez les propositions, retrouvez les clients et traitez les devis à valider.</p>
        </div>
        <Link className="ops-button primary" to="/devis/nouveau">
          <FilePlus2 size={15} />Nouveau devis
        </Link>
      </div>
      <SalesQuotes />
    </PageEntrance>
  );
}
