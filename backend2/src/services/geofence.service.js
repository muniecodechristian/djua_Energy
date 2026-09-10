// src/services/geofence.service.js
import Kit from '../models/kit.model.js';
import Alert from '../models/Alert.model.js';
import { emitGeofenceAlert, emitGeofenceResolved } from './socket.service.js';

// Utilitaire de calcul de distance (formule de Haversine) en mètres
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Rayon de la terre en mètres
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export const GEOFENCE_RADIUS_METERS = 90;

const hasValidCoordinatePair = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90
    && lon >= -180 && lon <= 180
    && !(lat === 0 && lon === 0);
};

/** Vérifie si la position reçue sort du cercle de sécurité du kit. */
export async function checkAndTriggerGeofence(kitId, incomingLat, incomingLon) {
  if (!hasValidCoordinatePair(incomingLat, incomingLon)) return null;

  try {
    // 1. Récupérer le modèle de kit en BDD pour obtenir sa position enregistrée
    const kit = await Kit.findOne({ kitId });
    
    if (!kit || !hasValidCoordinatePair(kit.gpsCoordinates?.latitude, kit.gpsCoordinates?.longitude)) {
      // Pas de position de référence stockée dans le kit, impossible de comparer
      return null;
    }

    const refLat = kit.gpsCoordinates.latitude;
    const refLon = kit.gpsCoordinates.longitude;

    // 2. Calculer la distance entre la position de référence du kit et la nouvelle position reçue
    const distanceMeters = calculateDistance(refLat, refLon, incomingLat, incomingLon);

    const isOutside = distanceMeters > GEOFENCE_RADIUS_METERS;

    if (isOutside) {
      // 3. Vérifier si une alerte "geofence_exit" est déjà active pour ce kit (anti-spam)
      const existingAlert = await Alert.findOne({
        kitId,
        type: 'geofence_exit',
        status: 'active'
      });

      if (!existingAlert) {
        // 4. Créer l'alerte avec la source venant du BACK ('system')
        const newAlert = await Alert.create({
          kitId,
          source: 'geofencing',
          type: 'geofence_exit',
          severity: 'critical',
          label: 'Sortie de périmètre',
          description: `Le kit ${kitId} est sorti de son cercle de sécurité de ${GEOFENCE_RADIUS_METERS} m. Distance mesurée : ${Math.round(distanceMeters)} m.`,
          metadata: {
            referencePosition: { latitude: refLat, longitude: refLon },
            currentPosition: { latitude: incomingLat, longitude: incomingLon },
            distanceMeters: Math.round(distanceMeters)
          },
          status: 'active'
        });

        console.log(`[GEOFENCE] Alerte générée pour ${kitId}: ${Math.round(distanceMeters)} m`);
        
        // Émettre l'alerte au frontend via Socket.io
        emitGeofenceAlert(newAlert);
        return newAlert;
      }
    } else {
      // Le retour dans le cercle clôt l'alerte active sans créer d'alerte inverse.
      const resolved = await Alert.updateMany(
        { kitId, type: 'geofence_exit', status: 'active' },
        { status: 'resolved', resolvedAt: new Date() }
      );
      if (resolved.modifiedCount > 0) emitGeofenceResolved(kitId);
    }

    return { outside: isOutside, distanceMeters: Math.round(distanceMeters), referencePosition: { latitude: refLat, longitude: refLon }, currentPosition: { latitude: Number(incomingLat), longitude: Number(incomingLon) } };

  } catch (error) {
    console.error(" Erreur lors du calcul du geofencing back :", error);
  }
}