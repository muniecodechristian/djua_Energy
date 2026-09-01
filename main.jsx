import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import djuaLogo from './assets/logo-djua-dark.svg'
import './styles.css'

const CATEGORIES = {
  'Éclairage': { icon: '💡', tone: 'sun' },
  Cuisine: { icon: '🍳', tone: 'rose' },
  'Multimédia': { icon: '🖥️', tone: 'blue' },
  Climatisation: { icon: '❄️', tone: 'ice' },
  Pompage: { icon: '💧', tone: 'water' },
  Autres: { icon: '🔧', tone: 'gray' },
}

const INITIAL_APPLIANCES = [
  { id: 1, name: 'Ampoule LED', category: 'Éclairage', icon: '💡', watts: 10, hours: 5, quantity: 6, period: 'day', diversity: 1 },
  { id: 2, name: 'Réfrigérateur', category: 'Cuisine', icon: '🧊', watts: 120, hours: 12, quantity: 1, period: 'both', diversity: .8 },
  { id: 3, name: 'Mixeur', category: 'Cuisine', icon: '🥤', watts: 500, hours: .2, quantity: 1, period: 'day', diversity: .4 },
  { id: 4, name: 'Télévision', category: 'Multimédia', icon: '📺', watts: 120, hours: 5, quantity: 1, period: 'both', diversity: .8 },
  { id: 5, name: 'Décodeur', category: 'Multimédia', icon: '📼', watts: 20, hours: 5, quantity: 1, period: 'both', diversity: .8 },
  { id: 6, name: 'Routeur Wi-Fi', category: 'Multimédia', icon: '📡', watts: 10, hours: 24, quantity: 1, period: 'both', diversity: .95 },
  { id: 7, name: 'Fer à repasser', category: 'Autres', icon: '🔌', watts: 1100, hours: 1, quantity: 1, period: 'day', diversity: .7 },
]

const PRESETS = [
  { name: 'Télévision', category: 'Multimédia', icon: '📺', watts: 120, hours: 5, period: 'both', diversity: .8 },
  { name: 'Ventilateur', category: 'Climatisation', icon: '🌀', watts: 75, hours: 8, period: 'night', diversity: .8 },
  { name: 'Pompe à eau', category: 'Pompage', icon: '💧', watts: 750, hours: 1, period: 'day', diversity: .65 },
  { name: 'Ordinateur', category: 'Multimédia', icon: '💻', watts: 65, hours: 6, period: 'day', diversity: .85 },
]

const fmtEnergy = wh => wh >= 1000 ? `${(wh / 1000).toFixed(2)} kWh` : `${Math.round(wh)} Wh`
const fmtPower = watts => watts >= 1000 ? `${(watts / 1000).toFixed(2)} kW` : `${Math.round(watts)} W`
const periodLabel = period => ({ day: '☀ Jour', night: '☾ Nuit', both: '☀☾ Jour & nuit' }[period])

function calculate(appliances, autonomy = 1) {
  const dailyWh = appliances.reduce((total, a) => total + a.watts * a.hours * a.quantity, 0)
  const dayWh = appliances.reduce((total, a) => total + a.watts * a.hours * a.quantity * (a.period === 'night' ? 0 : a.period === 'both' ? .5 : 1), 0)
  const nightWh = dailyWh - dayWh
  const simultaneousWatts = appliances.reduce((total, a) => total + a.watts * a.quantity * a.diversity, 0)
  const energyToProduce = dailyWh * 1.15 * 1.2
  const rawSolarKw = energyToProduce / 1000 / 5.1
  const panelCount = Math.max(2, Math.ceil(rawSolarKw / .6))
  const solarKw = panelCount * .6
  const batteryKwh = Math.max(2.5, Math.ceil((dailyWh / 1000 * autonomy / .8) / 2.5) * 2.5)
  const inverterKva = Math.max(1.5, Math.ceil((simultaneousWatts * 1.25 / .8) / 500) * .5)
  return { dailyWh, dayWh, nightWh, simultaneousWatts, energyToProduce, rawSolarKw, panelCount, solarKw, batteryKwh, inverterKva, autonomy }
}

function Logo() { return <div className="logo"><img src={djuaLogo} alt="Djua" /></div> }

function Sidebar() {
  const nav = ['Tableau de bord', 'Dimensionnements', 'Clients', 'Devis', 'Installations', 'Interventions', 'Produits', 'Rapports', 'Paramètres']
  const icons = ['⌂', '▦', '♙', '▤', '⌁', '♧', '♢', '▧', '⚙']
  return <aside className="sidebar"><Logo /><nav>{nav.map((item, i) => <button className={item === 'Dimensionnements' ? 'active' : ''} key={item}><span>{icons[i]}</span>{item}</button>)}</nav><div className="profile"><div className="avatar">CM</div><div><b>Chris M.</b><small>Commercial</small></div><span>⌄</span></div><div className="help">ⓘ <span><b>Besoin d'aide ?</b><small>Consultez notre centre d'aide</small></span></div></aside>
}

function Quantity({ value, onChange, min = 1, max = 99 }) {
  return <div className="quantity"><button onClick={() => onChange(Math.max(min, value - 1))}>−</button><strong>{value}</strong><button onClick={() => onChange(Math.min(max, value + 1))}>+</button></div>
}

function ApplianceRow({ item, onUpdate }) {
  const energy = item.watts * item.hours * item.quantity
  return <div className="appliance-row"><div className={`appliance-icon ${CATEGORIES[item.category]?.tone || 'gray'}`}>{item.icon}</div><div className="appliance-name"><b>{item.name}</b><span>{fmtPower(item.watts)} · {item.hours} h/jour · {periodLabel(item.period)}</span></div><Quantity value={item.quantity} onChange={quantity => onUpdate({ ...item, quantity })} /><div className="row-energy"><b>{fmtPower(item.watts)}</b><span>{fmtEnergy(energy)}/jour</span></div><button className="dots">•••</button></div>
}

function ApplianceList({ appliances, onUpdate, openAdd }) {
  const categories = Object.keys(CATEGORIES)
  return <section className="device-panel"><div className="panel-head"><h2>Appareils</h2><div className="panel-actions"><label className="search">⌕ <input placeholder="Rechercher un appareil" /></label><button className="primary add" onClick={openAdd}>＋ Ajouter un appareil</button><button className="filter">☷</button></div></div><div className="groups">{categories.map(category => {
    const group = appliances.filter(a => a.category === category)
    const energy = group.reduce((sum, a) => sum + a.watts * a.hours * a.quantity, 0)
    return <div className="category" key={category}><div className="category-head"><span className="chevron">{group.length ? '⌄' : '›'}</span><span>{CATEGORIES[category].icon}</span><b>{category}</b><em>{group.reduce((sum, a) => sum + a.quantity, 0)}</em><strong>{fmtEnergy(energy)}/jour</strong></div>{group.map(item => <ApplianceRow item={item} onUpdate={onUpdate} key={item.id} />)}</div>
  })}</div></section>
}

function Summary({ calc, appliances }) {
  const day = calc.dailyWh ? Math.round(calc.dayWh / calc.dailyWh * 100) : 0
  return <aside className="summary"><h3>Résumé énergétique</h3><div className="metric feature"><small>Consommation quotidienne</small><b>{(calc.dailyWh / 1000).toFixed(2)} <small>kWh / jour</small></b><div className="spark"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div><div className="metric"><small>Puissance installée</small><b>{(appliances.reduce((n, a) => n + a.watts * a.quantity, 0) / 1000).toFixed(2)} <small>kW</small></b></div><div className="metric"><small>Puissance simultanée estimée ⓘ</small><b>{(calc.simultaneousWatts / 1000).toFixed(2)} <small>kW</small></b></div><div className="usage"><small>Répartition d’utilisation</small><div><div className="donut" style={{ '--day': `${day * 3.6}deg` }} /><p><span>● Jour (6h – 18h) <b>{day}%</b></span><span>● Nuit (18h – 6h) <b>{100 - day}%</b></span></p></div></div><div className="metric devices"><small>Appareils</small><b>{appliances.reduce((sum, a) => sum + a.quantity, 0)}</b><a>Voir la liste complète →</a></div><div className="tip">💡 <span><b>Conseil Djua</b>Ajoutez les appareils manquants ou ajustez les heures d’utilisation pour obtenir un dimensionnement précis.</span></div></aside>
}

function AddModal({ onClose, onAdd }) {
  const [deviceName, setDeviceName] = useState('')
  const [category, setCategory] = useState('Multimédia')
  const [quantity, setQuantity] = useState(1)
  const [watts, setWatts] = useState(PRESETS[0].watts)
  const [voltage, setVoltage] = useState(220)
  const [amps, setAmps] = useState(Number((PRESETS[0].watts / 220).toFixed(2)))
  const [powerMode, setPowerMode] = useState('watts')
  const [hours, setHours] = useState(PRESETS[0].hours)
  const [period, setPeriod] = useState(PRESETS[0].period)
  const updateVoltage = value => { const next = Number(value); setVoltage(next); setWatts(Math.round(next * amps)) }
  const updateAmps = value => { const next = Number(value); setAmps(next); setWatts(Math.round(voltage * next)) }
  const daily = watts * hours * quantity
  return <div className="modal-backdrop"><section className="modal design-modal"><header><div><h2>Ajouter un appareil</h2><p>Renseignez les caractéristiques et l’utilisation de l’appareil.</p></div><button onClick={onClose} aria-label="Fermer">×</button></header><div className="modal-grid"><main className="form"><div className="device-top-fields"><div><label>Catégorie</label><select className="category-select" value={category} onChange={e => setCategory(e.target.value)}>{Object.keys(CATEGORIES).map(name => <option value={name} key={name}>{CATEGORIES[name].icon}　{name}</option>)}</select></div><div><label>Quel appareil ajoutez-vous ?</label><input className="device-name-input" value={deviceName} onChange={e => setDeviceName(e.target.value)} placeholder="Ex. Machine à laver" autoFocus /></div></div><div className="quantity-field"><label>Quantité</label><div><Quantity value={quantity} onChange={setQuantity} /></div><span>pièce(s)</span></div><section className="form-section"><h3>Caractéristiques électriques</h3><p>Renseignez la puissance de l’appareil.</p><div className="power-switch"><button className={powerMode === 'watts' ? 'selected' : ''} onClick={() => setPowerMode('watts')}>ϟ　Puissance en Watts (W)</button><button className={powerMode === 'volts' ? 'selected' : ''} onClick={() => setPowerMode('volts')}>♧　Tension (V) et courant (A)</button></div>{powerMode === 'watts' ? <><label>Puissance</label><div className="input-unit"><input type="number" min="0" value={watts} onChange={e => { setWatts(Number(e.target.value)); setAmps(Number((Number(e.target.value) / voltage).toFixed(2))) }} /><span>W</span></div></> : <div className="voltage-inputs"><div><label>Tension</label><div className="input-unit"><input type="number" min="0" value={voltage} onChange={e => updateVoltage(e.target.value)} /><span>V</span></div></div><div><label>Courant</label><div className="input-unit"><input type="number" min="0" step=".01" value={amps} onChange={e => updateAmps(e.target.value)} /><span>A</span></div></div><p className="calculated-power">Puissance calculée : <b>{watts} W</b></p></div>}<small className="suggest">Valeur indicative : vérifiez l’étiquette de votre appareil.</small></section><section className="form-section"><h3>Utilisation quotidienne</h3><p>Combien d’heures par jour cet appareil est-il utilisé ?</p><div className="form-two"><div><label>Heures d’utilisation par jour</label><div className="input-unit"><input type="number" min="0" max="24" step=".1" value={hours} onChange={e => setHours(Number(e.target.value))} /><span>h / jour</span></div></div><div><label>Période principale d’utilisation</label><div className="periods">{[['day','☀ Jour (6h – 18h)'],['night','☾ Nuit (18h – 6h)'],['both','☀☾ Les deux']].map(([id, label]) => <button className={period === id ? 'selected' : ''} onClick={() => setPeriod(id)} key={id}>{label}</button>)}</div></div></div><button className="notes">⌄　 Ajouter des notes (optionnel)</button></section></main><aside className="preview"><div className="preview-icon">{CATEGORIES[category].icon}</div><h3>{deviceName || 'Nouvel appareil'}</h3><span>× {quantity}</span><p>{watts} W / unité<br />{hours} h / jour</p><hr/><small>Consommation estimée</small><b>{fmtEnergy(daily)} / jour</b></aside></div><footer><button className="cancel" onClick={onClose}>Annuler</button><button className="primary" onClick={() => onAdd({ id: Date.now(), name: deviceName.trim() || 'Nouvel appareil', category, icon: CATEGORIES[category].icon, watts, hours, quantity, period, diversity: .8 })}>Ajouter l’appareil</button></footer></section></div>
}

function Recommendation({ calc, appliances, onBack }) {
  const [mode, setMode] = useState('recommended')
  const presets = { economic: .7, recommended: 1, autonomy: 1.5 }
  const active = calculate(appliances, presets[mode])
  const cards = [['economic', 'Économique', 'Coût optimisé'], ['recommended', 'Recommandée', 'Meilleur équilibre'], ['autonomy', 'Autonomie +', 'Autonomie maximale']]
  return <><header className="topbar"><button className="back" onClick={onBack}>←</button><b>Maison de Jean Kabeya</b><span className="top-spacer"/><span className="saved">◌ Dernier calcul : il y a 2 min</span><button className="secondary">↻ Recalculer</button><button className="more">•••</button><button className="primary">Créer le devis　→</button></header><main className="recommend-page"><div className="recommend-main"><h1>Système recommandé <span>Recommandé par Djua</span></h1><p className="subtitle">Basé sur {appliances.reduce((n,a) => n + a.quantity,0)} appareils　•　{(calc.dailyWh/1000).toFixed(2)} kWh/jour　•　Kinshasa, RDC</p><section className="config"><h3>Choisir une configuration</h3><div className="config-cards">{cards.map(([id, name, note]) => <button className={mode === id ? 'selected' : ''} onClick={() => setMode(id)} key={id}><b>{id === 'economic' ? '♧' : id === 'recommended' ? '☆' : '♙'}　{name}</b><small>{note}</small><strong>{active.solarKw.toFixed(1)} kWc　 |　 {active.batteryKwh.toFixed(1)} kWh　 |　 {active.inverterKva.toFixed(1)} kVA</strong><span>Autonomie ≈ {active.autonomy} jour{active.autonomy > 1 ? 's' : ''}</span></button>)}</div></section><section className="composition"><h3>Composition du système recommandé</h3><div className="kit-grid"><article><i>☀</i><div><b>Panneaux solaires</b><strong>{active.panelCount} × 600 W</strong><span>Total : {active.solarKw.toFixed(1)} kWc</span><em>Monocristallin</em></div></article><article><i>▣</i><div><b>Batterie</b><strong>{active.batteryKwh.toFixed(1)} kWh LiFePO₄</strong><span>Énergie utile · {Math.round(active.batteryKwh*.8*10)/10} kWh (80% DoD)</span><em>48 V</em></div></article><article><i>〽</i><div><b>Onduleur</b><strong>{active.inverterKva.toFixed(1)} kVA / 48 V</strong><span>Puissance continue · {(active.inverterKva*.8).toFixed(1)} kW</span><em>Marge de puissance : +25%</em></div></article></div></section><section className="benefits"><div>ϟ <span>Production estimée<b>≈ {(active.solarKw * 5.1 * .82).toFixed(1)} kWh / jour</b><small>En moyenne annuelle</small></span></div><div>▣ <span>Autonomie estimée<b>≈ {active.autonomy} jour{active.autonomy > 1 ? 's' : ''}</b><small>Sans apport solaire</small></span></div><div>♢ <span>Niveau de confiance<b>Élevé</b><small>Données d’ensoleillement locales</small></span></div><div>♙ <span>Garantie produits<b>Jusqu’à 10 ans</b><small>Selon les équipements</small></span></div></section><section className="why"><div><h3>Pourquoi cette configuration ?</h3><dl><dt>Consommation quotidienne (client)</dt><dd>{(calc.dailyWh/1000).toFixed(2)} kWh</dd><dt>Pertes système</dt><dd>+ 15%</dd><dt>Marge de sécurité</dt><dd>+ 20%</dd><dt>Énergie à produire</dt><dd>≈ {(active.energyToProduce/1000).toFixed(2)} kWh / jour</dd><dt>Irradiation solaire utilisée (PSH)</dt><dd>5.1 h / jour</dd><dt>Puissance solaire minimale</dt><dd>≈ {active.rawSolarKw.toFixed(2)} kWc</dd></dl></div><aside>💡 <b>Bon à savoir</b><p>La configuration recommandée couvre vos besoins avec une bonne autonomie et une marge de sécurité confortable.</p></aside></section></div><RecommendationAside active={active} /></main></>
}

function RecommendationAside({ active }) { const estimatedCost = Math.round(active.solarKw * 720 + active.batteryKwh * 290 + active.inverterKva * 180 + 450); return <aside className="recommend-aside"><section><h3>Résumé énergétique</h3><p><span>Consommation quotidienne</span><b>{(active.dailyWh/1000).toFixed(2)} kWh / jour</b></p><p><span>Puissance simultanée</span><b>{(active.simultaneousWatts/1000).toFixed(2)} kW</b></p><p><span>Autonomie cible</span><b>{active.autonomy} jour{active.autonomy>1?'s':''}</b></p></section><section className="chart"><h3>Aperçu de la production <small>(moyenne annuelle)</small></h3><div>{[83,95,86,79,80,96,87,79,71,72,92].map((h,i) => <i key={i} style={{height:`${h}%`}} />)}</div><span>Fév　Mar　Avr　Mai　Juin　Juil　Août　Sep　Oct　Nov　Déc</span></section><section className="impact">♧ <div><b>Impact environnemental</b><p>Réduction de CO₂ estimée　≈ {(active.dailyWh/1000 * .5).toFixed(1)} tonnes / an</p></div></section><section className="quote"><h3>Estimation commerciale</h3><p>Produits compatibles <span>6 références disponibles</span></p><b>Coût matériel (estimation) <strong>{estimatedCost.toLocaleString('fr-FR')} $</strong></b><small>Hors installation et accessoires</small><button className="secondary">Voir le détail des équipements　☷</button><button className="primary">Créer le devis　→</button></section></aside> }

function App() {
  const [appliances, setAppliances] = useState(INITIAL_APPLIANCES)
  const [adding, setAdding] = useState(false)
  const [screen, setScreen] = useState('sizing')
  const calc = useMemo(() => calculate(appliances), [appliances])
  const update = next => setAppliances(list => list.map(a => a.id === next.id ? next : a))
  const add = item => { setAppliances(list => [...list, item]); setAdding(false) }
  if (screen === 'recommendation') return <div className="app"><Sidebar /><div className="content"><Recommendation calc={calc} appliances={appliances} onBack={() => setScreen('sizing')} /></div></div>
  return <div className="app"><Sidebar /><div className="content"><header className="topbar"><button className="back">←</button><b>Nouveau dimensionnement</b><span className="draft">Brouillon</span><span className="top-spacer"/><span className="saved">◉ Enregistré à 10:42</span><button className="more">•••</button><button className="primary" onClick={() => setScreen('recommendation')}>Calculer le système recommandé</button></header><main className="sizing-page"><div className="work"><section className="property"><div><h1>Maison de Jean Kabeya　<span>⌕</span></h1><p>Maison individuelle　•　Kinshasa, RDC</p></div><div className="quick"><span>▧　{appliances.reduce((n,a)=>n+a.quantity,0)} appareils</span><span>◷　{(calc.dailyWh/1000).toFixed(2)} kWh / jour<small>Consommation quotidienne</small></span></div></section><ApplianceList appliances={appliances} onUpdate={update} openAdd={() => setAdding(true)} /><section className="total"><div><b>Total</b><span>{appliances.reduce((n,a)=>n+a.quantity,0)} appareils</span></div><div><strong>{(calc.dailyWh/1000).toFixed(2)} kWh / jour</strong><span>Puissance simultanée estimée : <b>{(calc.simultaneousWatts/1000).toFixed(2)} kW</b></span></div></section></div><Summary calc={calc} appliances={appliances}/></main></div>{adding && <AddModal onClose={() => setAdding(false)} onAdd={add}/>}</div>
}

createRoot(document.getElementById('root')).render(<App />)
