// src/services/installationOverdue.service.js
// Worker (cron-like) : vérifie les devis validés dont la date d'installation est dépassée
// sans qu'aucune installation n'ait été enregistrée par le technicien.
// Déclenche une alerte + notification temps réel au commercial (owner) et au responsable
// de shop (shopManager) qui a créé ce commercial.

import Quote from '../models/Quote.model.js';
import Alert from '../models/Alert.model.js';
import User from '../models/user.model.js';
import { notifyUser } from './notification.service.js';
import { sendNotificationToWhatsApp } from './whatsapp.service.js';
import { businessDay } from './quote.service.js';

const ALERT_TYPE = 'installation_overdue';

export async function checkOverdueInstallations() {
  try {
    const today = businessDay();
    const quotes = await Quote.find({
      status: { $in: ['approved', 'installing'] },
      plannedDate: { $exists: true, $ne: null, $lt: today },
    }).lean();

    let created = 0;
    for (const quote of quotes) {
      // Déduplication : une seule alerte active par devis
      const existing = await Alert.findOne({ kitId: quote.number, type: ALERT_TYPE, status: 'active' }).lean();
      if (existing) continue;

      const alert = await Alert.create({
        kitId: quote.number,
        source: 'system',
        type: ALERT_TYPE,
        severity: 'high',
        label: `Installation en retard — ${quote.number}`,
        description: `Le devis ${quote.number} (${quote.customer?.name || 'client'}) devait être installé le ${quote.plannedDate}. Aucune installation n'a été enregistrée à ce jour.`,
        createdBy: quote.shopManager || quote.owner || null,
        status: 'active',
      });

      const payload = {
        type: 'INSTALLATION_OVERDUE',
        message: alert.description,
        alert,
        quoteNumber: quote.number,
        plannedDate: quote.plannedDate,
      };

      // Notification temps réel au commercial (owner)
      if (quote.owner) {
        try { notifyUser(String(quote.owner), 'alert:new', payload); } catch (_) { /* noop */ }
      }
      // Notification temps réel au responsable de shop
      if (quote.shopManager && String(quote.shopManager) !== String(quote.owner)) {
        try { notifyUser(String(quote.shopManager), 'alert:new', payload); } catch (_) { /* noop */ }
      }

      // Notification WhatsApp (message + alerte) aux mêmes destinataires
      try {
        if (quote.owner) {
          const ownerUser = await User.findById(quote.owner).select('whatsapp identifier').lean();
          if (ownerUser) await sendNotificationToWhatsApp(ownerUser, alert.label, alert.description);
        }
        if (quote.shopManager && String(quote.shopManager) !== String(quote.owner)) {
          const shopUser = await User.findById(quote.shopManager).select('whatsapp identifier').lean();
          if (shopUser) await sendNotificationToWhatsApp(shopUser, alert.label, alert.description);
        }
      } catch (_) { /* noop */ }

      created += 1;
    }

    console.log(`[OverdueWorker] ${quotes.length} devis vérifiés, ${created} nouvelle(s) alerte(s) créée(s).`);
  } catch (error) {
    console.error('[OverdueWorker] Erreur lors de la vérification:', error.message);
  }
}

export function startInstallationOverdueWorker(intervalMs = 60 * 60 * 1000) {
  // Première exécution au démarrage (après un court délai pour laisser l'IO se stabiliser)
  setTimeout(() => {
    checkOverdueInstallations().catch((e) => console.error('[OverdueWorker]', e.message));
  }, 5000);

  setInterval(() => {
    checkOverdueInstallations().catch((e) => console.error('[OverdueWorker]', e.message));
  }, intervalMs);

  console.log(`[OverdueWorker] Worker démarré (intervalle ${Math.round(intervalMs / 60000)} min).`);
}