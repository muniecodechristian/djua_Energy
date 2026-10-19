// src/services/notification.service.js
// Couche d'abstraction pour les émissions Socket.io ciblées.
// Toutes les notifications temps réel passent par ce service.
// Aucun controller ne doit appeler directement getIO() — toujours via ce service.

import { getIO } from './socket.service.js';

/**
 * Émet une notification vers un utilisateur spécifique via son room personnel.
 * Le user doit être connecté au room `user:{userId}` pour recevoir.
 *
 * @param {string} userId  - ID MongoDB de l'utilisateur cible
 * @param {string} event   - Nom de l'événement Socket.io
 * @param {object} payload - Données de la notification
 */
export function notifyUser(userId, event, payload) {
  try {
    const io = getIO();
    const room = `user:${userId}`;
    io.to(room).emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Notification] ${event} → user:${userId}`);
  } catch (error) {
    // Fail silently — les notifications ne doivent jamais crasher le flow principal
    console.error(`[Notification] Échec émission ${event} → user:${userId}:`, error.message);
  }
}

/**
 * Émet une notification vers tous les utilisateurs d'une zone.
 *
 * @param {string} zoneName - Nom de la zone
 * @param {string} event    - Nom de l'événement Socket.io
 * @param {object} payload  - Données de la notification
 */
export function notifyZone(zoneName, event, payload) {
  try {
    const io = getIO();
    const room = `zone:${zoneName}`;
    io.to(room).emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Notification] ${event} → zone:${zoneName}`);
  } catch (error) {
    console.error(`[Notification] Échec émission ${event} → zone:${zoneName}:`, error.message);
  }
}

// ── Événements métier spécialisés ─────────────────────────────────────────────

/**
 * Notifie un technicien qu'une nouvelle alerte lui a été assignée.
 */
export function notifyNewAlert(technicianId, alertData) {
  notifyUser(technicianId, 'alert:new', {
    type: 'ALERT_ASSIGNED',
    message: `Nouvelle alerte: ${alertData.label}`,
    alert: alertData,
  });
}

/**
 * Notifie un technicien qu'une nouvelle intervention lui a été assignée.
 */
export function notifyNewIntervention(technicianId, interventionData) {
  notifyUser(technicianId, 'intervention:new', {
    type: 'INTERVENTION_ASSIGNED',
    message: `Nouvelle intervention: ${interventionData.title}`,
    intervention: interventionData,
  });
}

/**
 * Notifie un technicien que son intervention a été réassignée.
 */
export function notifyInterventionReassigned(technicianId, interventionData) {
  notifyUser(technicianId, 'intervention:reassigned', {
    type: 'INTERVENTION_REASSIGNED',
    message: `Intervention réassignée: ${interventionData.title}`,
    intervention: interventionData,
  });
}

/**
 * Notifie le shop_manager qu'un technicien a mis à jour le statut d'une intervention.
 */
export function notifyInterventionStatusUpdate(shopManagerId, interventionData) {
  notifyUser(shopManagerId, 'intervention:status-updated', {
    type: 'INTERVENTION_STATUS_UPDATED',
    message: `Intervention "${interventionData.title}" → ${interventionData.status}`,
    intervention: interventionData,
  });
}

/**
 * Notifie le shop_manager qu'un technicien a soumis un rapport.
 */
export function notifyReportSubmitted(shopManagerId, interventionData) {
  notifyUser(shopManagerId, 'intervention:report-submitted', {
    type: 'REPORT_SUBMITTED',
    message: `Rapport soumis pour: ${interventionData.title}`,
    intervention: interventionData,
  });
}

/**
 * Notifie un technicien que son alerte a été réassignée.
 */
export function notifyAlertReassigned(technicianId, alertData) {
  notifyUser(technicianId, 'alert:reassigned', {
    type: 'ALERT_REASSIGNED',
    message: `Alerte réassignée: ${alertData.label}`,
    alert: alertData,
  });
}
