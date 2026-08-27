import EnrichedTelemetry from '../models/EnrichedTelemetry.js';
import { stripRetiredTelemetryFields } from '../services/telemetryEnricher.service.js';

/**
 * GET /api/ml/telemetry
 * Récupère l'historique des télémétries enrichies au nouveau format imbriqué
 * attendu par le modèle IA (identity, customer, contract, payments, records…).
 * Supporte le filtrage optionnel par kitId et la pagination.
 */
export async function getEnrichedTelemetry(req, res) {
  try {
    const { kitId, kit_id, limit = 100, page = 1, sort = 'desc' } = req.query;

    const query = {};
    const targetKitId = kitId || kit_id;
    if (targetKitId) {
      // Filtre sur le nouveau schéma imbriqué (identity.kit_id)
      // et sur l'ancien schéma plat (kit_id / kitId) pour la rétrocompatibilité
      query.$or = [
        { 'identity.kit_id': targetKitId },
        { kit_id: targetKitId },
        { kitId: targetKitId },
      ];
    }

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skipNum = (pageNum - 1) * limitNum;
    const sortOrder = sort === 'asc' ? 1 : -1;

    const [telemetries, total] = await Promise.all([
      EnrichedTelemetry.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      EnrichedTelemetry.countDocuments(query),
    ]);

    // Supprimer les champs internes Mongoose avant de renvoyer
    const formattedData = telemetries.map(t => {
      const { _id, __v, createdAt, updatedAt, ...doc } = t;
      if (Array.isArray(doc.records)) {
        doc.records = doc.records.map(stripRetiredTelemetryFields);
      }
      return doc;
    });

    res.json({
      success: true,
      count: formattedData.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: formattedData,
    });
  } catch (err) {
    console.error('[ML Controller] Erreur récupération télémétries enrichies :', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur interne lors de la récupération des données',
    });
  }
}
