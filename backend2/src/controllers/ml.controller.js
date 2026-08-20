import EnrichedTelemetry from '../models/EnrichedTelemetry.js';

/**
 * GET /api/ml/telemetry
 * Récupère l'historique des télémétries enrichies à 63 champs.
 * Supporte le filtrage optionnel par kitId / kit_id et la pagination.
 */
export async function getEnrichedTelemetry(req, res) {
  try {
    const { kitId, kit_id, limit = 100, page = 1, sort = 'desc' } = req.query;

    const query = {};
    const targetKitId = kitId || kit_id;
    if (targetKitId) {
      // Permet de filtrer soit par le champ kit_id soit par kitId (selon ce qui est stocké)
      query.$or = [
        { kit_id: targetKitId },
        { kitId: targetKitId }
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
      EnrichedTelemetry.countDocuments(query)
    ]);

    // Nettoyer les objets retournés en enlevant les champs Mongoose internes (__v, _id) si nécessaire,
    // ou les laisser pour référence. L'objet conserve la structure plate à 63 champs.
    const formattedData = telemetries.map(t => {
      const { _id, __v, createdAt, updatedAt, ...flatData } = t;
      return flatData;
    });

    res.json({
      success: true,
      count: formattedData.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: formattedData
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des télémétries enrichies :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur interne lors de la récupération des données' });
  }
}
