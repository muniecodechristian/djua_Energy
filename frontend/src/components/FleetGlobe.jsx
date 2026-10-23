import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ZoomIn, ZoomOut, RotateCcw, Globe2, MapPin } from 'lucide-react';
import { distanceMeters } from '../lib/geofence';

const xyz = (p, r = 100) => {
  const lat = (p.latitude * Math.PI) / 180;
  const lon = (p.longitude * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    -r * Math.cos(lat) * Math.sin(lon)
  );
};

const ZONE_TARGETS = {
  kinshasa:   { latitude: -4.3225, longitude: 15.3222, distance: 42, label: 'Kinshasa' },
  lubumbashi: { latitude: -11.6642, longitude: 27.4728, distance: 42, label: 'Lubumbashi' },
  goma:       { latitude: -1.6792, longitude: 29.2235, distance: 42, label: 'Goma' },
  butembo:    { latitude: 0.1322, longitude: 29.2930, distance: 42, label: 'Butembo' },
  bukavu:     { latitude: -2.4908, longitude: 28.8579, distance: 42, label: 'Bukavu' },
  matadi:     { latitude: -5.8160, longitude: 13.4600, distance: 42, label: 'Matadi' },
  mbujimayi:  { latitude: -6.1360, longitude: 23.5900, distance: 42, label: 'Mbuji-Mayi' },
  kisangani:  { latitude: 0.5153, longitude: 25.1920, distance: 42, label: 'Kisangani' },
};

const STATUS_3D = {
  active:   { color: 0x10b981, hex: '#10b981', label: 'Actif' },
  online:   { color: 0x10b981, hex: '#10b981', label: 'Actif' },
  verifier: { color: 0xf59e0b, hex: '#f59e0b', label: 'À vérifier' },
  warning:  { color: 0xf59e0b, hex: '#f59e0b', label: 'À vérifier' },
  alert:    { color: 0xef4444, hex: '#ef4444', label: 'Alerte' },
  critical: { color: 0xef4444, hex: '#ef4444', label: 'Alerte' },
  offline:  { color: 0x64748b, hex: '#64748b', label: 'Hors ligne' },
};

export default function FleetGlobe({ sites, onSelect, userZone }) {
  const host = useRef(null);
  const api = useRef(null);
  const choose = useRef(onSelect);
  const [hover, setHover] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  const zoneKey = (userZone || '').toLowerCase().replace(/[\s-]/g, '');
  const activeZoneConfig = ZONE_TARGETS[zoneKey] || null;

  useEffect(() => {
    choose.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setUnavailable(true));
      return;
    }

    const element = host.current;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minDistance = 1;
    controls.maxDistance = 600;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x29493b, 3));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(150, 180, 120);
    scene.add(sun);

    const globeMaterial = new THREE.MeshBasicMaterial({ color: 0x698b80 });
    let disposed = false;

    const earthTexture = new THREE.TextureLoader().load(
      import.meta.env.BASE_URL + 'maps/earth-blue-marble.png',
      texture => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        globeMaterial.map = texture;
        globeMaterial.color.set(0xffffff);
        globeMaterial.needsUpdate = true;
        renderer.render(scene, camera);
      }
    );

    const globe = new THREE.Mesh(new THREE.SphereGeometry(100, 96, 64), globeMaterial);
    scene.add(globe);

    const grid = new THREE.Group();
    scene.add(grid);
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = Array.from({ length: 129 }, (_, i) =>
        xyz({ latitude: lat, longitude: (i / 128) * 360 }, 100.1)
      );
      grid.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x9bb6a8, transparent: true, opacity: 0.17 })
        )
      );
    }
    for (let lon = 0; lon < 360; lon += 15) {
      const pts = Array.from({ length: 65 }, (_, i) =>
        xyz({ latitude: -90 + (i / 64) * 180, longitude: lon }, 100.1)
      );
      grid.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x9bb6a8, transparent: true, opacity: 0.17 })
        )
      );
    }

    const markers = new THREE.Group();
    const traces = new THREE.Group();
    scene.add(markers, traces);

    const render = () => {
      const unit = (2 * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, element.clientHeight);
      for (const item of markers.children) {
        if (item.isSprite) item.scale.set(50 * unit, 13 * unit, 1);
      }
      renderer.render(scene, camera);
    };

    const clear = group => {
      while (group.children.length) {
        const child = group.children[0];
        if (!child.isSprite) child.geometry?.dispose();
        child.material?.map?.dispose();
        child.material?.dispose();
        group.remove(child);
      }
    };

    let defaultTarget = new THREE.Vector3(100, 0, 0);
    let defaultDistance = 80;

    const reset = () => {
      controls.minDistance = 1;
      const normal = defaultTarget.clone().normalize();
      camera.up.copy(normal);
      controls.target.copy(defaultTarget);
      camera.position.copy(defaultTarget).addScaledVector(normal, defaultDistance);
      camera.position.y += defaultDistance * 0.15;
      controls.update();
      render();
    };

    const world = () => {
      controls.minDistance = 108;
      camera.up.set(0, 1, 0);
      controls.target.set(0, 0, 0);
      camera.position.copy(defaultTarget.clone().normalize().multiplyScalar(330));
      controls.update();
      render();
    };

    const focusZone = () => {
      if (activeZoneConfig) {
        defaultTarget.copy(xyz(activeZoneConfig, 100));
        defaultDistance = activeZoneConfig.distance || 42;
        reset();
      } else {
        reset();
      }
    };

    const zoom = factor => {
      const direction = camera.position
        .clone()
        .sub(controls.target)
        .multiplyScalar(factor)
        .clampLength(controls.minDistance, 600);
      camera.position.copy(controls.target).add(direction);
      controls.update();
      render();
    };

    const update = values => {
      clear(markers);
      clear(traces);
      const located = values.filter(s => s.position || s.reference);

      if (activeZoneConfig) {
        defaultTarget.copy(xyz(activeZoneConfig, 100));
        defaultDistance = activeZoneConfig.distance || 42;
      } else if (located.length) {
        const vectors = located.map(s => xyz(s.position || s.reference));
        const bounds = new THREE.Box3().setFromPoints(vectors);
        bounds.getCenter(defaultTarget);
        const extent = bounds.getSize(new THREE.Vector3()).length();
        defaultTarget.normalize().multiplyScalar(100);
        defaultDistance = Math.max(12, Math.min(260, extent * 1.8));
      }

      if (located.length) {
        const vectors = located.map(s => xyz(s.position || s.reference));
        const bounds = new THREE.Box3().setFromPoints(vectors);
        const extent = bounds.getSize(new THREE.Vector3()).length();
        const radius = Math.max(0.7, Math.min(2.2, extent * 0.025 || 1.2));

        for (const site of located) {
          const current = site.position || site.reference;
          const outside = site.position && site.reference && distanceMeters(site.reference, site.position) > 90;
          
          // Match state/status colors
          const statusKey = outside ? 'alert' : site.status || (site.position ? 'active' : 'offline');
          const conf = STATUS_3D[statusKey] || STATUS_3D.active;

          // 1. Point 3D : Anneau/cercle de géofence au sol sur le globe (comme le cercle 90m 2D)
          const ringGeo = new THREE.RingGeometry(0.1, radius * 2.8, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: conf.color,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          const ringPos = xyz(current, 100.12);
          ring.position.copy(ringPos);
          ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ringPos.clone().normalize());
          markers.add(ring);

          // 2. Contour de l'anneau de géofence
          const ringOutlineGeo = new THREE.RingGeometry(radius * 2.7, radius * 2.85, 32);
          const ringOutlineMat = new THREE.MeshBasicMaterial({
            color: conf.color,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide
          });
          const ringOutline = new THREE.Mesh(ringOutlineGeo, ringOutlineMat);
          ringOutline.position.copy(xyz(current, 100.14));
          ringOutline.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ringPos.clone().normalize());
          markers.add(ringOutline);

          // 3. Point 3D (comme dans l'autre carte : point blanc à contour avec centre coloré d'état)
          const outerWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1
          });
          const outerDot = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.3, 16, 14), outerWhiteMat);
          outerDot.position.copy(xyz(current, 100 + radius * 0.9));
          outerDot.userData = { kitId: site.kitId, statusLabel: conf.label };
          markers.add(outerDot);

          const innerColorMat = new THREE.MeshStandardMaterial({
            color: conf.color,
            emissive: conf.color,
            emissiveIntensity: statusKey === 'alert' ? 0.7 : 0.45,
            roughness: 0.2,
            metalness: 0.2
          });
          const marker = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.95, 16, 14), innerColorMat);
          marker.position.copy(xyz(current, 100 + radius * 1.05));
          marker.userData = { kitId: site.kitId, statusLabel: conf.label };
          markers.add(marker);

          // Tracé GPS
          if (site.trail.length > 1) {
            const line = new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(site.trail.map(p => xyz(p, 100 + radius * 0.7))),
              new THREE.LineBasicMaterial({ color: conf.color, linewidth: 2 })
            );
            traces.add(line);
          }
        }
      }
      render();
    };

    let initialized = false;
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let start;

    const hit = e => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const obj = ray.intersectObjects(markers.children)[0]?.object;
      return obj?.userData?.kitId ? obj.userData : null;
    };

    const down = e => {
      start = [e.clientX, e.clientY];
    };

    const up = e => {
      if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) < 5) {
        const item = hit(e);
        if (item?.kitId) choose.current(item.kitId);
      }
    };

    const move = e => {
      const item = hit(e);
      setHover(item?.kitId ? `${item.kitId} · ${item.statusLabel || ''}` : '');
    };

    const resize = () => {
      const w = element.clientWidth;
      const h = element.clientHeight;
      if (w && h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      }
    };

    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointermove', move);

    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    api.current = {
      zoom,
      reset,
      world,
      focusZone,
      update: values => {
        update(values);
        if (!initialized) {
          if (activeZoneConfig) {
            focusZone();
          } else if (values.some(s => s.position || s.reference)) {
            world();
          }
          initialized = true;
        }
      },
    };
    resize();

    return () => {
      disposed = true;
      earthTexture.dispose();
      api.current = null;
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointermove', move);
      clear(markers);
      clear(traces);
      clear(grid);
      globe.geometry.dispose();
      globeMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [activeZoneConfig]);

  useEffect(() => {
    api.current?.update(sites);
  }, [sites]);

  const located = sites.filter(s => s.position || s.reference).length;

  return (
    <div className="geofence-scene fleet-globe">
      <div
        ref={host}
        className="fleet-globe-canvas"
        aria-label="Vue géographique 3D de tous les kits. Cliquez sur un repère pour ouvrir son site."
      />
      <span className="geofence-north">
        {located} / {sites.length} kits localisés
        {activeZoneConfig && ` · Zone : ${activeZoneConfig.label}`}
      </span>
      {hover && <span className="fleet-globe-hover">{hover} · Ouvrir le site</span>}
      {(unavailable || !located) && (
        <p className="geofence-unavailable">
          {unavailable
            ? 'La 3D est indisponible. Sélectionnez un kit dans la liste.'
            : 'Aucune position GPS disponible pour le parc.'}
        </p>
      )}
      <div className="geofence-camera-tools">
        {activeZoneConfig && (
          <button
            onClick={() => api.current?.focusZone()}
            aria-label={`Centrer sur ${activeZoneConfig.label}`}
            title={`Centrer sur votre zone (${activeZoneConfig.label})`}
          >
            <MapPin size={15} />
          </button>
        )}
        <button onClick={() => api.current?.world()} aria-label="Afficher le monde en 3D" title="Vue mondiale">
          <Globe2 size={15} />
        </button>
        <button onClick={() => api.current?.zoom(0.7)} aria-label="Zoomer sur le parc 3D">
          <ZoomIn size={15} />
        </button>
        <button onClick={() => api.current?.zoom(1.4)} aria-label="Dézoomer du parc 3D">
          <ZoomOut size={15} />
        </button>
        <button onClick={() => api.current?.reset()} aria-label="Recentrer tous les kits">
          <RotateCcw size={14} />
        </button>
      </div>
      <a
        className="geofence-scene-note globe-attribution"
        href="https://visibleearth.nasa.gov/images/57730/the-blue-marble-land-surface-ocean-color-and-sea-ice"
        target="_blank"
        rel="noreferrer"
      >
        Fond terrestre : NASA Blue Marble · Repères GPS 3D
      </a>
    </div>
  );
}
