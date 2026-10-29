// src/services/whatsapp.service.js
// Service d'envoi WhatsApp via Meta Cloud API ou Twilio.
// Si aucun fournisseur n'est configuré, génère un lien wa.me.

import axios from 'axios';
import twilio from 'twilio';

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_COUNTRY_CODE || '243';
const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();
const META_API_VERSION = process.env.META_WHATSAPP_API_VERSION || 'v22.0';
const META_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
const META_ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN;
const META_TEMPLATE_NAME = process.env.META_WHATSAPP_TEMPLATE_NAME || 'nouvelle_intervention';
const META_TEMPLATE_LANGUAGE = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE || 'fr';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const TWILIO_CONTENT_SID = process.env.TWILIO_CONTENT_SID;

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

function getMetaMessagesUrl() {
  return `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_NUMBER_ID}/messages`;
}

async function sendMetaTemplate(phone, templateName, parameters) {
  if (!META_PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
    return null;
  }

  const response = await axios.post(
    getMetaMessagesUrl(),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizePhone(phone),
      type: 'template',
      template: {
        name: templateName,
        language: { code: META_TEMPLATE_LANGUAGE },
        components: [
          {
            type: 'body',
            parameters: parameters.map((text) => ({ type: 'text', text: String(text || '-') })),
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );

  return response.data;
}

async function sendTwilioMessage(phone, text, parameters = []) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return null;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const message = {
    from: TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
      ? TWILIO_WHATSAPP_FROM
      : `whatsapp:${TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:+${normalizePhone(phone)}`,
  };
  if (TWILIO_CONTENT_SID) {
    message.contentSid = TWILIO_CONTENT_SID;
    message.contentVariables = JSON.stringify(
      Object.fromEntries(parameters.map((value, index) => [String(index + 1), String(value || '-')])),
    );
  } else {
    message.body = text;
  }

  return client.messages.create(message);
}

function isMetaConfigured() {
  return Boolean(META_PHONE_NUMBER_ID && META_ACCESS_TOKEN);
}

function isTwilioConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM);
}

async function sendConfiguredMessage(phone, text, metaTemplateName, metaParameters) {
  if (WHATSAPP_PROVIDER === 'twilio') {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio WhatsApp est sélectionné mais ses variables sont incomplètes.');
    }
    return sendTwilioMessage(phone, text, metaParameters);
  }

  if (WHATSAPP_PROVIDER === 'meta') {
    if (!isMetaConfigured()) {
      throw new Error('Meta WhatsApp est sélectionné mais ses variables sont incomplètes.');
    }
    return sendMetaTemplate(phone, metaTemplateName, metaParameters);
  }

  throw new Error(`Fournisseur WhatsApp invalide: ${WHATSAPP_PROVIDER}. Utilisez meta ou twilio.`);
}

/**
 * Envoie (ou prépare) la notification WhatsApp pour une intervention.
 * Les messages sortants utilisent un template approuvé par Meta.
 *
 * @returns {Promise<{ sent: boolean, link: string|null, error?: string }>}
 */
export async function sendInterventionToWhatsApp(technician, intervention) {
  try {
    const phone = technician?.whatsapp || technician?.identifier || '';
    const text = buildInterventionMessage(intervention, technician);
    const link = buildWhatsAppLink(phone, text);

    if (!normalizePhone(phone)) {
      return { sent: false, link: null, error: 'Le technicien ne possède pas de numéro WhatsApp valide.' };
    }

    if ((WHATSAPP_PROVIDER === 'meta' && isMetaConfigured())
      || (WHATSAPP_PROVIDER === 'twilio' && isTwilioConfigured())) {
      try {
        await sendConfiguredMessage(phone, text, META_TEMPLATE_NAME, [
          `${technician?.prenom || ''} ${technician?.nom || ''}`.trim(),
          intervention.title,
          intervention.kitId,
          intervention.type || 'maintenance',
          intervention.priority || 'Moyenne',
          intervention.scheduledDate
            ? new Date(intervention.scheduledDate).toLocaleString('fr-FR')
            : 'À planifier',
          intervention.description,
        ]);
        console.log(`[WhatsApp ${WHATSAPP_PROVIDER}] Message envoyé au technicien ${technician?._id || technician}`);
        return { sent: true, link };
      } catch (err) {
        const apiError = err.response?.data?.error?.message || err.message;
        console.error(`[WhatsApp ${WHATSAPP_PROVIDER}] Échec envoi API:`, apiError);
        return { sent: false, link, error: apiError };
      }
    }

    console.log(`[WhatsApp] Lien généré pour le technicien ${technician?._id || technician}: ${link}`);
    return { sent: false, link, error: `WhatsApp ${WHATSAPP_PROVIDER} non configuré.` };
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

    if ((WHATSAPP_PROVIDER === 'meta' && isMetaConfigured())
      || (WHATSAPP_PROVIDER === 'twilio' && isTwilioConfigured())) {
      try {
        await sendConfiguredMessage(
          phone,
          text,
          process.env.META_WHATSAPP_NOTIFICATION_TEMPLATE_NAME || META_TEMPLATE_NAME,
          [
          title,
          message,
          ],
        );
        console.log(`[WhatsApp ${WHATSAPP_PROVIDER}] Notification envoyée à ${user?._id || user}`);
        return { sent: true, link };
      } catch (err) {
        const apiError = err.response?.data?.error?.message || err.message;
        console.error(`[WhatsApp ${WHATSAPP_PROVIDER}] Échec envoi API:`, apiError);
        return { sent: false, link, error: apiError };
      }
    }
    console.log(`[WhatsApp] Lien généré: ${link}`);
    return { sent: false, link, error: `WhatsApp ${WHATSAPP_PROVIDER} non configuré.` };
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