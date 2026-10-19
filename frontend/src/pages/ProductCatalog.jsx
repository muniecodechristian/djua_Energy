import { useMemo, useRef, useState } from 'react';
import { ImagePlus, PackagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import PageEntrance from '../components/PageEntrance';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { useCatalogProducts, useDeleteCatalogProduct, useSaveCatalogProduct } from '../hooks/tanstack/useCatalogProducts';
import './ProductCatalog.css';

const categories = ['Éclairage', 'Multimédia', 'Cuisine', 'Climatisation', 'Pompage', 'Autres'];
const emptyProducts = [];
const emptyProduct = {
  name: '', category: 'Multimédia', brand: '', model: '', watts: '100', hours: '5',
  period: 'both', diversity: '0.8', price: '0', currency: 'USD', imageData: '', active: true,
};

async function prepareImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choisissez un fichier image.');
  if (file.size > 8 * 1024 * 1024) throw new Error('L’image doit faire moins de 8 Mo avant compression.');
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    source.close();
    throw new Error('Impossible de préparer cette image dans le navigateur.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  const result = canvas.toDataURL('image/jpeg', 0.78);
  if (result.length > 1_450_000) throw new Error('Image trop volumineuse après compression. Choisissez une image plus légère.');
  return result;
}

function ProductEditor({ product, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => product
    ? Object.fromEntries(Object.keys(emptyProduct).map(key => [key, product[key] ?? emptyProduct[key]]))
    : emptyProduct);
  const [imageBusy, setImageBusy] = useState(false);
  const fileInput = useRef(null);
  const update = event => {
    const { name, value, type, checked } = event.target;
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };
  const selectImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      const imageData = await prepareImage(file);
      setForm(previous => ({ ...previous, imageData }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setImageBusy(false);
    }
  };
  const submit = event => {
    event.preventDefault();
    onSave({
      id: product?._id,
      ...form,
      watts: Number(form.watts),
      hours: Number(form.hours),
      diversity: Number(form.diversity),
      price: Number(form.price),
    });
  };

  return (
    <div className="catalog-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="catalog-dialog" role="dialog" aria-modal="true" aria-labelledby="catalog-editor-title">
        <header><div><p className="ops-eyebrow">{product ? 'MODIFICATION' : 'NOUVELLE RÉFÉRENCE'}</p><h2 id="catalog-editor-title">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h2></div><button type="button" className="ops-icon-button" onClick={onClose} aria-label="Fermer"><X size={18}/></button></header>
        <form onSubmit={submit}>
          <div className="catalog-form-grid">
            <label>Nom du produit<input name="name" value={form.name} onChange={update} placeholder="Ex. Télévision LED 32 pouces" maxLength={100} required /></label>
            <label>Catégorie<select name="category" value={form.category} onChange={update}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
            <label>Marque<input name="brand" value={form.brand} onChange={update} maxLength={80} placeholder="Ex. Samsung" /></label>
            <label>Modèle / référence<input name="model" value={form.model} onChange={update} maxLength={80} placeholder="Ex. UA32T" /></label>
            <label>Puissance nominale (W)<input name="watts" type="number" min="0" max="10000000" step="any" value={form.watts} onChange={update} required /></label>
            <label>Utilisation estimée (h/jour)<input name="hours" type="number" min="0" max="24" step="0.5" value={form.hours} onChange={update} required /></label>
            <label>Période d’utilisation<select name="period" value={form.period} onChange={update}><option value="day">Jour</option><option value="night">Nuit</option><option value="both">Jour et nuit</option><option value="continuous">Continue</option></select></label>
            <label className="catalog-price-field"><span>Prix indicatif</span><span><input name="price" type="number" min="0" step="any" value={form.price} onChange={update} /><select aria-label="Devise" name="currency" value={form.currency} onChange={update}><option>USD</option><option>CDF</option></select></span></label>
          </div>
          <div className="catalog-image-field">
            <input ref={fileInput} className="catalog-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} aria-label="Choisir une image produit" />
            {form.imageData ? <img src={form.imageData} alt="Aperçu du produit" /> : <span className="catalog-image-placeholder"><ImagePlus size={22}/></span>}
            <div><strong>Photo du produit</strong><small>JPEG, PNG ou WebP. L’image est réduite avant envoi.</small><button className="ops-button" type="button" disabled={imageBusy} onClick={() => fileInput.current?.click()}>{imageBusy ? 'Préparation…' : form.imageData ? 'Changer la photo' : 'Choisir une photo'}</button>{form.imageData && <button className="catalog-remove-image" type="button" onClick={() => setForm(previous => ({ ...previous, imageData: '' }))}>Retirer la photo</button>}</div>
          </div>
          <label className="catalog-active-toggle"><input name="active" type="checkbox" checked={form.active} onChange={update}/><span><strong>Disponible pour les devis</strong><small>Le produit sera visible aux commerciaux lorsqu’il est actif.</small></span></label>
          <footer><button className="ops-button" type="button" onClick={onClose}>Annuler</button><button className="ops-button primary" type="submit" disabled={saving || imageBusy}>{saving ? 'Enregistrement…' : product ? 'Enregistrer les changements' : 'Ajouter au catalogue'}</button></footer>
        </form>
      </section>
    </div>
  );
}

export default function ProductCatalog() {
  const user = useAuthStore(state => state.user);
  const isAdmin = ['admin', 'administration'].includes(user?.role);
  const query = useCatalogProducts();
  const save = useSaveCatalogProduct();
  const remove = useDeleteCatalogProduct();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [editor, setEditor] = useState(null);
  const products = Array.isArray(query.data) ? query.data : emptyProducts;
  const visibleProducts = useMemo(() => products.filter(product => (
    (category === 'Tous' || product.category === category)
    && [product.name, product.brand, product.model].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )), [products, category, search]);
  const usedProducts = [...products].filter(product => product.active).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 5);

  const saveProduct = values => save.mutate(values, {
    onSuccess: () => {
      toast.success(values.id ? 'Produit mis à jour.' : 'Produit ajouté au catalogue.');
      setEditor(null);
    },
    onError: error => toast.error(error.response?.data?.message || 'Impossible d’enregistrer ce produit.'),
  });
  const deleteProduct = product => {
    if (!window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) return;
    remove.mutate(product._id, {
      onSuccess: () => toast.success('Produit supprimé.'),
      onError: error => toast.error(error.response?.data?.message || 'Impossible de supprimer ce produit.'),
    });
  };

  return (
    <PageEntrance className="catalog-page">
      <header className="catalog-page-heading">
        <div><p className="ops-eyebrow">RÉFÉRENTIEL DES APPAREILS</p><h1>Catalogue de produits</h1><p>Gérez les équipements proposés aux commerciaux pour préparer les recommandations solaires.</p></div>
        {isAdmin && <button className="ops-button primary" onClick={() => setEditor({ ...emptyProduct })}><Plus size={15}/>Ajouter un produit</button>}
      </header>

      {query.isError && <div className="ops-notice" role="alert">Impossible de charger le catalogue depuis le serveur. Vérifiez la connexion et réessayez.<button onClick={() => query.refetch()}>Réessayer</button></div>}

      <div className="catalog-layout">
        <main className="catalog-main">
          <div className="catalog-categories" aria-label="Filtrer par catégorie">
            {['Tous', ...categories].map(item => <button key={item} className={category === item ? 'is-active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}<span>{item === 'Tous' ? products.length : products.filter(product => product.category === item).length}</span></button>)}
          </div>
          <div className="catalog-toolbar">
            <label className="ops-input-wrap"><Search size={16}/><input aria-label="Rechercher un produit" placeholder="Produit, marque ou référence…" value={search} onChange={event => setSearch(event.target.value)}/></label>
            <span>{query.isSuccess ? `${visibleProducts.length} produit${visibleProducts.length === 1 ? '' : 's'}` : 'Catalogue'}</span>
          </div>
          {query.isPending ? <div className="catalog-empty">Chargement du catalogue…</div> : query.isError ? null : visibleProducts.length === 0 ? (
            <div className="catalog-empty"><PackagePlus size={25}/><strong>{products.length ? 'Aucun produit trouvé' : 'Le catalogue est vide'}</strong><p>{products.length ? 'Changez de recherche ou de catégorie.' : isAdmin ? 'Ajoutez les premiers appareils pour les partager avec les commerciaux.' : 'L’administrateur n’a pas encore ajouté de produits.'}</p></div>
          ) : (
            <div className="catalog-product-grid">
              {visibleProducts.map(product => <article className={`catalog-product-card ${!product.active ? 'is-inactive' : ''}`} key={product._id}>
                <div className="catalog-product-photo">{product.imageData ? <img src={product.imageData} alt={product.name} /> : <PackagePlus size={27}/>}<span className={`catalog-product-status ${product.active ? 'is-active' : ''}`}>{product.active ? 'Actif' : 'Masqué'}</span></div>
                <div className="catalog-product-content"><span className="catalog-product-category">{product.category}</span><h2>{product.name}</h2><p>{[product.brand, product.model].filter(Boolean).join(' · ') || 'Marque non renseignée'}</p><div className="catalog-product-specs"><strong>{product.watts} W</strong><span>{product.hours} h/j</span></div><div className="catalog-product-bottom"><strong>{product.price ? `${Number(product.price).toLocaleString('fr-FR')} ${product.currency}` : 'Prix à préciser'}</strong>{isAdmin && <div><button type="button" aria-label={`Modifier ${product.name}`} onClick={() => setEditor({ ...product })}><Pencil size={14}/></button><button type="button" aria-label={`Supprimer ${product.name}`} onClick={() => deleteProduct(product)} disabled={remove.isPending}><Trash2 size={14}/></button></div>}</div></div>
              </article>)}
            </div>
          )}
        </main>
        <aside className="catalog-aside">
          <section className="catalog-aside-card"><header><h2>Produits actifs</h2><small>Catalogue partagé</small></header>{query.isPending ? <p>Chargement…</p> : <ol>{usedProducts.map((product,index) => <li key={product._id}><span className="catalog-rank">{index + 1}</span>{product.imageData ? <img src={product.imageData} alt="" /> : <span className="catalog-thumb-empty"><PackagePlus size={15}/></span>}<span><strong>{product.name}</strong><small>{product.brand || product.category} · {product.watts} W</small></span></li>)}</ol>}</section>
          <section className="catalog-help-card"><h2>Catalogue partagé</h2><p>Les produits actifs et leurs photos sont disponibles au commercial dans le parcours de devis.</p></section>
        </aside>
      </div>
      {editor && <ProductEditor product={editor._id ? editor : null} saving={save.isPending} onClose={() => setEditor(null)} onSave={saveProduct}/>}
    </PageEntrance>
  );
}
