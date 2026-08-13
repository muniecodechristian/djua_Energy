// src/services/geofence.service.js
import Kit from '../models/kit.model.js';
import Alert from '../models/Alert.model.js';
import { emitGeofenceAlert } from './socket.service.js';

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

/**
 * Vérifie si le kit s'est éloigné de plus de 2 km de sa position de référence dans le KitSchema
 */
export async function checkAndTriggerGeofence(kitId, incomingLat, incomingLon) {
  if (!incomingLat || !incomingLon) return;

  try {
    // 1. Récupérer le modèle de kit en BDD pour obtenir sa position enregistrée
    const kit = await Kit.findOne({ kitId });
    
    if (!kit || !kit.gpsCoordinates || kit.gpsCoordinates.latitude == null || kit.gpsCoordinates.longitude == null) {
      // Pas de position de référence stockée dans le kit, impossible de comparer
      return; 
    }

    const refLat = kit.gpsCoordinates.latitude;
    const refLon = kit.gpsCoordinates.longitude;

    // 2. Calculer la distance entre la position de référence du kit et la nouvelle position reçue
    const distanceMeters = calculateDistance(refLat, refLon, incomingLat, incomingLon);

    // Seuil de déclenchement : 2 kilomètres = 2000 mètres
    const THRESHOLD_METERS = 2000;

    if (distanceMeters > THRESHOLD_METERS) {
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
          source: 'system', //  Indique que l'alerte est générée par le serveur/backend
          type: 'geofence_exit',
          severity: 'critical',
          label: 'Sortie de périmètre (Détecté par le Back)',
          description: `Le kit ${kitId} a dépassé son rayon autorisé de 2 km. Distance mesurée : ${Math.round(distanceMeters)} mètres.`,
          metadata: {
            referencePosition: { latitude: refLat, longitude: refLon },
            currentPosition: { latitude: incomingLat, longitude: incomingLon },
            distanceMeters: Math.round(distanceMeters)
          },
          status: 'active'
        });

        console.log(` [GEOFENCE BACK] Alerte critique générée pour ${kitId} : ${Math.round(distanceMeters)}m de distance.`);
        
        // Émettre l'alerte au frontend via Socket.io
        emitGeofenceAlert(newAlert);
      }
    } else {
      // Si le kit est revenu dans la zone autorisée (< 2 km), on résout automatiquement l'alerte
      await Alert.updateMany(
        { kitId, type: 'geofence_exit', status: 'active' },
        { status: 'resolved', resolvedAt: new Date() }
      );
    }

  } catch (error) {
    console.error(" Erreur lors du calcul du geofencing back :", error);
  }
}