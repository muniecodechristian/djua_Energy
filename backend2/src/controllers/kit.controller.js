// src/controllers/kit.controller.js
// CRUD minimal sur le modèle Kit :
//   GET  /api/kits/:kitId  — chercher un kit existant (utilisé lors du scan QR)
//   POST /api/kits          — créer un nouveau kit après l'onboarding technicien

import Kit from '../models/kit.model.js';

function normalizePhone(phone) {
  return String(phone).replace(/\D/g, '').replace(/^00/, '');
}

function phoneLookupPattern(phone) {
  const digits = normalizePhone(phone);
  return new RegExp(`^\\+?\\s*${[...digits].join('[\\s()./-]*')}\\s*$`);
}

// ─── GET /api/kits/:kitId ──────────────────────────────────────────────────────
/**
 * Recherche un Kit par son identifiant (matricule scanné / saisi manuellement).
 *
 * Réponses :
 *   200  { success: true,  exists: true,  data: Kit }   → kit trouvé
 *   200  { success: true,  exists: false }               → kit inconnu (nouveau)
 *   500  { success: false, message }                     → erreur serveur
 */
export async function getKitById(req, res) {
  const { kitId } = req.params;

  try {
    const kit = await Kit.findOne({ kitId }).lean();

    if (!kit) {
      return res.json({ success: true, exists: false });
    }

    return res.json({ success: true, exists: true, data: kit });
  } catch (err) {
    console.error('[Kit Controller] getKitById error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
}

// ─── POST /api/kits ────────────────────────────────────────────────────────────
/**
 * Crée un nouveau Kit à partir du payload complet collecté lors de l'onboarding.
 *
 * Body attendu :
 *   kitId            string   (obligatoire)
 *   clientPhone      string   (obligatoire)
 *   offerName        string   (obligatoire)
 *   installationDate string   (optionnel — ISO 8601)
 *   periodicAmountUSD number  (optionnel)
 *   gpsCoordinates   { latitude, longitude }  (optionnel)
 *   [tous les champs supplémentaires du wizard : system, quoteId, source, etc.]
 *
 * Réponses :
 *   201  { success: true,  data: Kit }
 *   400  { success: false, message }   → champs obligatoires manquants
 *   409  { success: false, message }   → kit déjà existant
 *   500  { success: false, message }   → erreur serveur
 */
export async function createKit(req, res) {
  const {
    kitId,
    clientPhone,
    offerName,
    installationDate,
    periodicAmountUSD,
    gpsCoordinates,
    ...extraFields
  } = req.body;

  // ── Validation des champs obligatoires ───────────────────────────────────────
  if (!kitId || !clientPhone || !offerName) {
    return res.status(400).json({
      success: false,
      message: 'Les champs kitId, clientPhone et offerName sont obligatoires',
    });
  }

  try {
    // Une nouvelle tentative du même kit après une réponse perdue est un succès.
    const existing = await Kit.findOne({ kitId }).lean();
    if (existing) {
      if (normalizePhone(existing.clientPhone) === normalizePhone(clientPhone)) {
        return res.status(200).json({ success: true, data: existing, alreadyRegistered: true });
      }

      return res.status(409).json({
        success: false,
        code: 'KIT_ALREADY_EXISTS',
        message: `Le kit ${kitId} existe déjà dans le système`,
      });
    }

    const phoneAlreadyUsed = await Kit.findOne({ clientPhone: phoneLookupPattern(clientPhone) }).lean();
    if (phoneAlreadyUsed) {
      return res.status(409).json({
        success: false,
        code: 'CLIENT_PHONE_ALREADY_USED',
        message: 'Ce numéro de téléphone est déjà utilisé.',
      });
    }

    // ── Création ─────────────────────────────────────────────────────────────
    const kit = await Kit.create({
      kitId,
      clientPhone,
      offerName,
      installationDate: installationDate ?? new Date().toISOString(),
      periodicAmountUSD,
      status: 'active',
      gpsCoordinates,
      ...extraFields,        // champs wizard supplémentaires (strict:false acceptera)
    });

    return res.status(201).json({ success: true, data: kit });
  } catch (err) {
    console.error('[Kit Controller] createKit error:', {
      name: err.name,
      code: err.code,
      message: err.message,
      errors: err.errors,
    });

    if (err.code === 11000) {
      if (err.keyPattern?.clientPhone || err.keyValue?.clientPhone) {
        return res.status(409).json({
          success: false,
          code: 'CLIENT_PHONE_ALREADY_USED',
          message: 'Ce numéro de téléphone est déjà utilisé.',
        });
      }

      return res.status(409).json({
        success: false,
        code: 'KIT_ALREADY_EXISTS',
        message: `Le kit ${kitId} existe déjà dans le système`,
      });
    }

    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Les données de l’installation sont invalides',
        details: Object.values(err.errors ?? {}).map(({ path, message }) => ({ path, message })),
      });
    }

    return res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
}
