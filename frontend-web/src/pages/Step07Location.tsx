import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';
import type { GeoLocation } from '../types/install.types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons (Vite build issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props { onNext: () => void; }

function MapPositionController({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position]);

  return null;
}

// Composant interne qui écoute les clics sur la carte
function LocationPicker({
  position,
  setPosition,
  onPositionChange,
}: {
  position: [number, number];
  setPosition: (p: [number, number]) => void;
  onPositionChange: () => void;
}) {
  useMapEvents({
    click: (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onPositionChange();
    },
  });
  return <Marker position={position} />;
}

export default function Step07Location({ onNext }: Props) {
  const setLocation = useInstallStore(s => s.setLocation);
  const [isLocating, setIsLocating] = useState(true);
  const [position, setPosition] = useState<[number, number]>([-4.3224, 15.307]);
  const [locationName, setLocationName] = useState('');
  const [isNameEdited, setIsNameEdited] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [accuracy, setAccuracy] = useState(12);

  useEffect(() => {
    if (isNameEdited) return undefined;

    const controller = new AbortController();
    const [latitude, longitude] = position;
    const timer = window.setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          addressdetails: '1',
          lat: latitude.toString(),
          lon: longitude.toString(),
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'fr' },
        });
        if (!response.ok) throw new Error('Géocodage indisponible');

        const result = await response.json();
        const address = result.address ?? {};
        const district = address.neighbourhood ?? address.suburb ?? address.village
          ?? address.town ?? address.city_district ?? address.city;
        const city = address.city ?? address.town ?? address.municipality ?? address.county;
        const placeName = [district, city].filter((name, index, names) => name && names.indexOf(name) === index).join(', ');

        if (!isNameEdited) {
          setLocationName(placeName || result.name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (!isNameEdited) setLocationName(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } finally {
        if (!controller.signal.aborted) setIsGeocoding(false);
      }
    }, 1000);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [position, isNameEdited]);

  // Tenter la géolocalisation réelle
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setIsNameEdited(false);
        setAccuracy(Math.round(pos.coords.accuracy));
        setIsLocating(false);
      },
      () => {
        // Fallback Kinshasa
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const handleConfirm = () => {
    const loc: GeoLocation = {
      latitude: position[0],
      longitude: position[1],
      name: locationName,
      accuracy,
    };
    setLocation(loc);
    onNext();
  };

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={7} totalSteps={11} />

      <div style={{ padding: '20px 24px 12px' }}>
        <h1 className="screen-title" style={{ marginBottom: 6 }}>Position de l'installation</h1>
        <p className="screen-desc" style={{ marginBottom: 0 }}>
          La position est utilisée pour détecter un éventuel déplacement du système.
        </p>
      </div>

      <div className="map-container">
        <MapContainer
          center={position}
          zoom={14}
          className="map-el"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapPositionController position={position} />
          <LocationPicker
            position={position}
            setPosition={setPosition}
            onPositionChange={() => setIsNameEdited(false)}
          />
        </MapContainer>

        <div className="map-overlay-card">
          <div className="map-icon-box">
            <MapPin size={22} color="var(--text-2)" />
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={locationName}
              onChange={e => {
                setLocationName(e.target.value);
                setIsNameEdited(true);
              }}
              style={{
                border: 'none', outline: 'none', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 700, color: 'var(--text)', width: '100%',
                background: 'transparent',
              }}
              placeholder={isGeocoding ? 'Recherche du lieu...' : 'Nom de la localisation'}
            />
            <p className="map-accuracy">Précision : ± {accuracy} m</p>
          </div>
        </div>
      </div>

      <div className="screen-footer">
        <Button
          title="Confirmer cette position"
          isLoading={isLocating}
          onClick={handleConfirm}
        />
      </div>
    </div>
  );
}
