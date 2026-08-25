import axios from 'axios';
import config from '../config/env.config.js';
import Client from '../models/client.model.js';
import Kit from '../models/kit.model.js';
import ScoringData from '../models/scoringData.model.js';
import Payment from '../models/payment.model.js';

class OrangeEnergyService {
  constructor() {
    this.client = axios.create({
      baseURL: config.orangeEnergyApiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Récupère les données clients stockées localement.
   * Ne contacte plus l'API externe sensible /api/external/clients pour respecter la confidentialité.
   * La liste est alimentée de façon non-sensible au fil de l'eau par la synchronisation des kits.
   */
  async syncAndGetClients() {
    return await Client.find({}).sort({ createdAt: -1 });
  }

  /**
   * Récupère les kits de l'API externe, résout l'ownerName pour chacun d'eux,
   * alimente la liste locale des clients de manière confidentielle et met à jour les kits.
   */
  async syncAndGetKits() {
    try {
      const response = await this.client.get('/api/external/kits');
      const kitsData = response.data?.data || [];

      console.log(`[OrangeEnergy Service] Synchronisation de ${kitsData.length} kits avec résolution des propriétaires...`);

      if (kitsData.length > 0) {
        await Promise.all(kitsData.map(async (kit) => {
          try {
            const detailResponse = await this.client.get(`/api/external/kits/${encodeURIComponent(kit.kitId)}`);
            const kitDetails = detailResponse.data?.data;
            if (kitDetails) {
              // Mettre à jour le kit dans MongoDB
              await Kit.findOneAndUpdate({ kitId: kit.kitId }, { $set: kitDetails }, { upsert: true });

              // Insérer/Mettre à jour le client de façon sécurisée (uniquement les détails non-sensibles liés au kit)
              await Client.findOneAndUpdate(
                { kitId: kitDetails.kitId },
                {
                  $set: {
                    kitId: kitDetails.kitId,
                    clientPhone: kitDetails.clientPhone,
                    offerName: kitDetails.offerName,
                    installationDate: kitDetails.installationDate,
                    subscriptionFeePaid: kitDetails.subscriptionFeePaid,
                    status: kitDetails.status,
                    gpsCoordinates: kitDetails.gpsCoordinates
                  }
                },
                { upsert: true }
              );
            }
          } catch (err) {
            console.error(`[OrangeEnergy Service] Échec sync détails du kit ${kit.kitId} (utilisation infos basiques) :`, err.message);
            await Kit.findOneAndUpdate({ kitId: kit.kitId }, { $set: kit }, { upsert: true });
          }
        }));
      }
    } catch (error) {
      console.error('[OrangeEnergy Service] Échec sync kits (utilisation cache local) :', error.message);
    }
    return await Kit.find({}).sort({ createdAt: -1 });
  }

  /**
   * Récupère un kit par son identifiant depuis l'API externe,
   * met à jour le kit et le profil client associé sans données sensibles.
   */
  async syncAndGetKitById(kitId) {
    try {
      const response = await this.client.get(`/api/external/kits/${encodeURIComponent(kitId)}`);
      const kitDetails = response.data?.data;
      if (kitDetails) {
        console.log(`[OrangeEnergy Service] Synchronisation individuelle du kit ${kitId}...`);
        
        await Kit.findOneAndUpdate({ kitId }, { $set: kitDetails }, { upsert: true });

        await Client.findOneAndUpdate(
          { kitId: kitDetails.kitId },
          {
            $set: {
              kitId: kitDetails.kitId,
              clientPhone: kitDetails.clientPhone,
              offerName: kitDetails.offerName,
              installationDate: kitDetails.installationDate,
              subscriptionFeePaid: kitDetails.subscriptionFeePaid,
              status: kitDetails.status,
              gpsCoordinates: kitDetails.gpsCoordinates
            }
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error(`[OrangeEnergy Service] Échec sync kit individuel ${kitId} :`, error.message);
    }
    return await Kit.findOne({ kitId });
  }

  /**
   * Récupère le scoring d'un numéro de téléphone, le synchronise en base, et le retourne.
   */
  async syncAndGetScoringData(phone) {
    try {
      const response = await this.client.get(`/api/external/scoring-data/${encodeURIComponent(phone)}`);
      const scoringData = response.data?.data;

      if (scoringData) {
        console.log(`[OrangeEnergy Service] Synchronisation scoring pour le téléphone ${phone}...`);
        await ScoringData.findOneAndUpdate(
          { clientPhone: phone },
          { $set: { clientPhone: phone, ...scoringData } },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error(`[OrangeEnergy Service] Échec sync scoring pour le téléphone ${phone} (cache local) :`, error.message);
    }
    return await ScoringData.findOne({ clientPhone: phone });
  }

  /**
   * Récupère l'historique complet des paiements depuis l'API externe,
   * les synchronise en base MongoDB locale et les retourne.
   */
  async syncAndGetPayments() {
    try {
      const response = await this.client.get('/api/external/payments');
      const paymentsData = response.data?.data || [];

      console.log(`[OrangeEnergy Service] Synchronisation de ${paymentsData.length} paiements...`);
      if (paymentsData.length > 0) {
        console.log('--- DÉTAILS DES PAIEMENTS SYNCHRONISÉS ---');
        paymentsData.forEach(p => {
          console.log(`  • ID: ${p.paymentId} | Phone: ${p.clientPhone} | Montant: ${p.amountUSD} USD | Date: ${p.date} | Status: ${p.status}`);
        });
        console.log('------------------------------------------');
        await Promise.all(paymentsData.map(async (payment) => {
          await Payment.findOneAndUpdate(
            { paymentId: payment.paymentId },
            { $set: payment },
            { upsert: true }
          );
        }));
      }
    } catch (error) {
      console.error('[OrangeEnergy Service] Échec sync paiements (utilisation cache local) :', error.message);
    }
    return await Payment.find({}).sort({ date: -1 });
  }

  /**
   * Récupère les paiements associés à un numéro de téléphone depuis l'API externe,
   * les synchronise en base et les retourne.
   */
  async syncAndGetPaymentsByPhone(phone) {
    try {
      const response = await this.client.get(`/api/external/payments/${encodeURIComponent(phone)}`);
      const paymentsData = response.data?.data || [];

      console.log(`[OrangeEnergy Service] Synchronisation des paiements pour le téléphone ${phone}...`);
      if (paymentsData.length > 0) {
        console.log(`--- DÉTAILS DES PAIEMENTS POUR ${phone} ---`);
        paymentsData.forEach(p => {
          console.log(`  • ID: ${p.paymentId} | Montant: ${p.amountUSD} USD | Date: ${p.date} | Status: ${p.status}`);
        });
        console.log('--------------------------------------------------');
        await Promise.all(paymentsData.map(async (payment) => {
          await Payment.findOneAndUpdate(
            { paymentId: payment.paymentId },
            { $set: payment },
            { upsert: true }
          );
        }));
      }
    } catch (error) {
      console.error(`[OrangeEnergy Service] Échec sync paiements pour le téléphone ${phone} (cache local) :`, error.message);
    }
    return await Payment.find({ clientPhone: phone }).sort({ date: -1 });
  }
}

export default new OrangeEnergyService();