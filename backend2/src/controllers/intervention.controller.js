import { Intervention } from '../models/Intervention.model.js';

export const createIntervention = async (req, res) => {
  try {
    const { kitId, title, description, priority, scheduledDate } = req.body;

    if (!kitId || !title || !description) {
      return res.status(400).json({ success: false, message: 'kitId, title, et description sont requis' });
    }

    const newIntervention = await Intervention.create({
      kitId,
      title,
      description,
      priority: priority || 'Moyenne',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date()
    });

    res.status(201).json({ success: true, data: newIntervention });
  } catch (error) {
    console.error('Erreur lors de la création de l\'intervention:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getInterventions = async (req, res) => {
  try {
    // Permet de filtrer par kitId si fourni en query params
    const filter = {};
    if (req.query.kitId) {
      filter.kitId = req.query.kitId;
    }

    const interventions = await Intervention.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: interventions });
  } catch (error) {
    console.error('Erreur lors de la récupération des interventions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
