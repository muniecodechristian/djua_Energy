// src/services/whatsapp.service.js
// Service d'abstraction pour l'envoi de messages WhatsApp aux techniciens.
// Si WHATSAPP_API_URL est configuré, tente un envoi via l'API externe.
// Sinon, génère un lien wa.me exploitable (ouverture manuelle / deep-link).

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_COUNTRY_CODE || '243';

/**
 * Normalise un numéro de téléphone en format international (sans +).
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  // Si le numéro commence par 0, on retire le 0 et on préfixe le code pays
  if (digits.startsWith('0')) digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  // Si pas de code pays (moins de 9 chiffres), on préfixe
  if (digits.length < 9) digits = DEFAULT_COUNTRY_CODE + digits;
  return digits;
}

/**
 * Construit le texte du message WhatsApp pour une intervention.
 */
export function buildInterventionMessage(intervention, technician) {
  const techName = technician
    ? `${technician.prenom || ''} ${technician.nom || ''}`.trim()
    : 'Technicien';
  const lines = [
    `Bonjour ${techName},`,
    '',
    `Une nouvelle intervention vous a été assignée :`,
    `• Titre : ${intervention.title}`,
    `• Kit : ${intervention.kitId}`,
    `• Type : ${intervention.type || 'maintenance'}`,
    `• Priorité : ${intervention.priority || 'Moyenne'}`,
    `• Statut : ${intervention.status || 'Planifiée'}`,
    intervention.scheduledDate
      ? `• Date prévue : ${new Date(intervention.scheduledDate).toLocaleString('fr-FR')}`
      : null,
    '',
    `Description : ${intervention.description}`,
    '',
    `Merci de prendre en charge cette mission et de mettre à jour le statut dans l'application Djua.`,
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Génère un lien wa.me pour ouvrir WhatsApp avec un message pré-rempli.
 */
export function buildWhatsAppLink(phone, text) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

/**
 * Envoie (ou prépare) la notification WhatsApp pour une intervention.
 * Ne doit jamais faire échouer le flow principal : erreurs capturées.
 *
 * @returns {Promise<{ sent: boolean, link: string|null, error?: string }>}
 */
export async function sendInterventionToWhatsApp(technician, intervention) {
  try {
    const phone = technician?.whatsapp || technician?.identifier || '';
    const text = buildInterventionMessage(intervention, technician);
    const link = buildWhatsAppLink(phone, text);

    const apiUrl = process.env.WHATSAPP_API_URL;
    if (apiUrl) {
      try {
        await (await import('axios')).default.post(apiUrl, {
          to: normalizePhone(phone),
          message: text,
          interventionId: intervention?._id?.toString?.() || intervention?._id,
        });
        console.log(`[WhatsApp] Message envoyé au technicien ${technician?._id || technician}`);
        return { sent: true, link };
      } catch (err) {
        console.error('[WhatsApp] Échec envoi API:', err.message);
        return { sent: false, link, error: err.message };
      }
    }

    // Pas d'API configurée : on renvoie le deep-link (ouverture côté client)
    console.log(`[WhatsApp] Lien généré pour le technicien ${technician?._id || technician}: ${link}`);
    return { sent: false, link };
  } catch (error) {
    console.error('[WhatsApp] Erreur inattendue:', error.message);
    return { sent: false, link: null, error: error.message };
  }
}

/**
 * Envoie (ou prépare) une notification WhatsApp générique.
 */
export async function sendNotificationToWhatsApp(user, title, message) {
  try {
    const phone = user?.whatsapp || user?.identifier || '';
    const text = `${title}\n\n${message}`;
    const link = buildWhatsAppLink(phone, text);

    const apiUrl = process.env.WHATSAPP_API_URL;
    if (apiUrl) {
      try {
        await (await import('axios')).default.post(apiUrl, {
          to: normalizePhone(phone),
          message: text,
        });
        console.log(`[WhatsApp] Notification envoyée à ${user?._id || user}`);
        return { sent: true, link };
      } catch (err) {
        console.error('[WhatsApp] Échec envoi API:', err.message);
        return { sent: false, link, error: err.message };
      }
    }
    console.log(`[WhatsApp] Lien généré: ${link}`);
    return { sent: false, link };
  } catch (error) {
    console.error('[WhatsApp] Erreur inattendue:', error.message);
    return { sent: false, link: null, error: error.message };
  }
}


export default {
  normalizePhone,
  buildInterventionMessage,
  buildWhatsAppLink,
  sendInterventionToWhatsApp,
  sendNotificationToWhatsApp,
};