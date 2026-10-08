// src/controllers/kit.controller.js
// CRUD minimal sur le modèle Kit :
//   GET  /api/kits/:kitId  — chercher un kit existant (utilisé lors du scan QR)
//   POST /api/kits          — créer un nouveau kit après l'onboarding technicien

import Kit from '../models/kit.model.js';

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
    // ── Vérification doublon ─────────────────────────────────────────────────
    const existing = await Kit.findOne({ kitId }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Le kit ${kitId} existe déjà dans le système`,
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
    console.error('[Kit Controller] createKit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
}
