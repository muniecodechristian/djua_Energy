import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RotateCcw, MoveHorizontal, ZoomIn, ZoomOut } from 'lucide-react';

const PARTS = {
  solar: { label: 'Panneau solaire', description: 'Production et conversion de l’énergie solaire.', fields: [['Puissance', 'solar_power_w', 'W'], ['Tension', 'solar_voltage_v', 'V'], ['Courant', 'solar_current_a', 'A']] },
  battery: { label: 'Batterie', description: 'Stockage et alimentation du kit.', fields: [['Charge disponible', 'state_of_charge_pct', '%'], ['Tension', 'battery_voltage_v', 'V'], ['État de santé', 'state_of_health_pct', '%']] },
  controller: { label: 'Contrôleur', description: 'Mesures du boîtier et communication du kit.', fields: [['Température', 'device_temperature_c', '°C'], ['Signal réseau', 'signal_strength_dbm', 'dBm'], ['Humidité', 'humidity_pct', '%']] },
};
const valueLabel = (value, unit) => value == null || !Number.isFinite(Number(value)) ? 'Non disponible' : `${Number(Number(value).toFixed(1))} ${unit}`;

export default function KitExplorer({ telemetry, compact = false, design = null }) {
  const host = useRef(null);
  const viewer = useRef(null);
  const [selected, setSelected] = useState('solar');
  const [unavailable, setUnavailable] = useState(false);
  const part = PARTS[selected];

  useEffect(() => {
    const element = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(compact ? 29 : 36, 1, 0.1, 80);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 0.7, 0);
    const render = () => renderer.render(scene, camera);
    const reset = () => { camera.position.set(5, 3.5, 6); controls.target.set(0, 0.7, 0); controls.update(); render(); };
    scene.add(new THREE.HemisphereLight(0xffffff, 0x596477, 3));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(3, 6, 4);
    scene.add(light);
    const groups = {};
    const materials = [];
    const box = (group, size, position, color, metalness = 0.15) => {
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness });
      materials.push(material);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      group.add(mesh);
      return mesh;
    };
    const group = (name, position) => {
      const g = new THREE.Group();
      g.userData.part = name;
      g.position.set(...position);
      groups[name] = g;
      scene.add(g);
      return g;
    };
    // A schematic assembly, deliberately independent of any manufacturer's dimensions.
    const solar = group('solar', [-1.15, 1.1, 0]);
    solar.rotation.x = -0.35;
    box(solar, [1.8, 0.1, 2.25], [0, 0, 0], 0x89939d, 0.7);
    box(solar, [1.68, 0.03, 2.13], [0, 0.075, 0], 0x152b40, 0.5);
    for (let x = 0; x < 4; x++) for (let z = 0; z < 6; z++) {
      box(solar, [0.38, 0.012, 0.315], [-0.61 + x * 0.405, 0.1, -0.875 + z * 0.35], 0x28465f, 0.45);
    }
    const stand = new THREE.Group(); scene.add(stand);
    box(stand, [0.08, 0.85, 0.08], [-1.8, 0.425, 0.5], 0x6b7580);
    box(stand, [0.08, 0.85, 0.08], [-0.5, 0.425, 0.5], 0x6b7580);
    const battery = group('battery', [1.15, 0.55, 0.65]);
    box(battery, [1.12, 0.94, 0.8], [0, 0, 0], 0xced2d3);
    box(battery, [1.15, 0.12, 0.83], [0, 0.5, 0], 0x323b43);
    box(battery, [0.17, 0.12, 0.17], [-0.3, 0.62, 0], 0xcb6349);
    box(battery, [0.17, 0.12, 0.17], [0.3, 0.62, 0], 0x515963);
    box(battery, [0.7, 0.28, 0.015], [0, 0, 0.41], 0x38434c);
    const controller = group('controller', [1.05, 0.85, -0.95]);
    box(controller, [0.9, 1.32, 0.35], [0, 0, 0], 0xe2e3df);
    box(controller, [0.62, 0.3, 0.02], [0, 0.25, 0.19], 0x244139);
    for (let x = 0; x < 5; x++) box(controller, [0.035, 0.28, 0.02], [-0.24 + x * 0.12, -0.3, 0.19], 0x657078);
    const cable = (points) => {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      const material = new THREE.MeshStandardMaterial({ color: 0x77828b, roughness: 0.8 });
      materials.push(material);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.023, 6, false), material));
    };
    cable([[-0.35, 0.9, -0.5], [0, 0.22, -0.7], [0.65, 0.22, -0.9], [1, 0.4, -0.9]]);
    cable([[1.1, 0.3, -0.8], [1.7, 0.12, -0.3], [1.6, 0.12, 0.6], [1.45, 1.1, 0.65]]);
    const grid = new THREE.GridHelper(9, 18, 0x89939d, 0x89939d);
    grid.material.transparent = true; grid.material.opacity = 0.14; scene.add(grid);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = null;
    const pointerDown = e => { down = [e.clientX, e.clientY]; };
    const pointerUp = e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(Object.values(groups), true)[0];
      if (hit) { let object = hit.object; while (object && !object.userData.part) object = object.parent; if (object) setSelected(object.userData.part); }
    };
    const resize = () => {
      const width = element.clientWidth; const height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    const lost = event => { event.preventDefault(); setUnavailable(true); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize); observer.observe(element);
    const themeObserver = new MutationObserver(render); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    viewer.current = {
      reset,
      turn: () => { const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8); camera.position.copy(controls.target).add(offset); controls.update(); render(); },
      zoom: factor => { const offset = camera.position.clone().sub(controls.target); offset.multiplyScalar(factor).clampLength(controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(offset); controls.update(); render(); },
      select: name => { Object.entries(groups).forEach(([id, g]) => g.traverse(object => { if (object.isMesh) { object.material.emissive.set(id === name ? 0xb66727 : 0x000000); object.material.emissiveIntensity = 0.14; } })); render(); },
    };
    reset(); resize(); viewer.current.select('solar');
    return () => {
      viewer.current = null; observer.disconnect(); themeObserver.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.traverse(object => { object.geometry?.dispose(); });
      materials.forEach(material => material.dispose()); grid.material.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [compact]);

  useEffect(() => { viewer.current?.select(selected); }, [selected]);

  return <section className="kit-explorer" aria-label="Exploration du kit en trois dimensions">
    <div className="kit-explorer-stage">
      <div className="kit-explorer-caption"><span>Vue d’ensemble</span><span>Schéma 3D</span></div>
      <div ref={host} className="kit-explorer-canvas" aria-label="Modèle du kit : faites glisser pour tourner, utilisez la molette pour zoomer" />
      {unavailable && <p className="kit-explorer-fallback">La vue 3D n’est pas disponible sur cet appareil. Les composants et leurs mesures restent accessibles ci-contre.</p>}
      <div className="kit-explorer-tools" aria-label="Commandes de la vue 3D">
        <button type="button" onClick={() => viewer.current?.turn()} aria-label="Tourner le kit"><MoveHorizontal size={16} /></button>
        <button type="button" onClick={() => viewer.current?.zoom(0.85)} aria-label="Zoomer"><ZoomIn size={16} /></button>
        <button type="button" onClick={() => viewer.current?.zoom(1.15)} aria-label="Dézoomer"><ZoomOut size={16} /></button>
        <button type="button" onClick={() => viewer.current?.reset()} aria-label="Réinitialiser la vue"><RotateCcw size={15} /></button>
      </div>
      <p className="kit-explorer-hint">Glisser pour tourner · Molette pour zoomer · Cliquer pour explorer</p>
    </div>
    <aside className="kit-explorer-inspector">
      <div className="kit-explorer-parts" aria-label="Sélectionner un composant">
        {Object.entries(PARTS).map(([id, item]) => <button type="button" key={id} aria-pressed={selected === id} onClick={() => setSelected(id)}>{item.label}</button>)}
      </div>
      <div aria-live="polite">
        <p className="kit-section-label">Composant sélectionné</p>
        <h3>{part.label}</h3><p className="kit-explorer-description">{part.description}</p>
        <dl>{design ? (design[selected]||[]).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value??'Non renseigné'}</dd></div>) : part.fields.map(([label, field, unit]) => <div key={field}><dt>{label}</dt><dd>{valueLabel(telemetry?.[field], unit)}</dd></div>)}</dl>
      </div>
      <p className="kit-explorer-note">{design ? 'Schéma de principe. Les quantités et références exactes figurent dans le devis.' : 'Représentation schématique. La forme et les dimensions ne décrivent pas le matériel exact installé.'}</p>
    </aside>
  </section>;
}
