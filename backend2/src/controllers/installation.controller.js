import { randomBytes } from 'node:crypto';
import InstallationFolder from '../models/InstallationFolder.model.js';
import InstallationMessage from '../models/InstallationMessage.model.js';
import InstallationConversation from '../models/InstallationConversation.model.js';
import Quote from '../models/Quote.model.js';
import Kit from '../models/kit.model.js';
import User from '../models/user.model.js';
import { getIO } from '../services/socket.service.js';
import { sendInstallationToWhatsApp } from '../services/whatsapp.service.js';
import { notifyUser } from '../services/notification.service.js';
import { businessDay } from '../services/quote.service.js';

const fail = (res, status, message) => res.status(status).json({ success: false, message });

function emitInstallationEvent(event, data) {
  try {
    const io = getIO();
    if (io) io.emit(event, data);
  } catch {
    // Socket emit optional
  }
}

/**
 * Fonction helper appelée lors de la validation d'un devis pour créer automatiquement
 * le dossier d'installation associé.
 */
export async function createInstallationFromQuote(quote, validatingUser, plannedDate = '') {
  const existing = await InstallationFolder.findOne({ quote: quote._id });
  if (existing) {
    if (plannedDate && existing.status === 'a_planifier') {
      existing.status = 'planifiee';
      existing.plannedDate = plannedDate;
      existing.history.push({
        status: 'planifiee',
        changedBy: validatingUser._id,
        note: `Date d'installation mise à jour : ${plannedDate}`,
        timestamp: new Date()
      });
      await existing.save();
    }
    return existing;
  }

  const year = new Date().getFullYear();
  const hex = randomBytes(3).toString('hex').toUpperCase();
  const folderNumber = `INST-${year}-${hex}`;

  const initialStatus = plannedDate ? 'planifiee' : 'a_planifier';

  const folder = await InstallationFolder.create({
    folderNumber,
    quote: quote._id,
    quoteNumber: quote.number,
    client: quote.client,
    customer: quote.customer,
    site: quote.site || {},
    system: quote.system,
    appliances: quote.appliances || [],
    amount: quote.amount || 0,
    currency: quote.currency || 'USD',
    createdBy: validatingUser._id, // Celui qui a validé le devis
    shopManager: quote.shopManager || null,
    zone: validatingUser.zone || '',
    plannedDate: plannedDate || quote.plannedDate || '',
    status: initialStatus,
    history: [
      {
        status: initialStatus,
        changedBy: validatingUser._id,
        note: `Dossier d'installation initié suite à la validation du devis ${quote.number}`,
        timestamp: new Date()
      }
    ]
  });

  emitInstallationEvent('installation:created', folder);
  return folder;
}

/**
 * GET /api/installations
 * Liste tous les dossiers d'installation selon le rôle de l'utilisateur :
 * - admin / administration : VISION TOTALE sur toutes les étapes, techniciens et zones
 * - shop_manager : Installations de son équipe / zone
 * - technician : Installations qui lui sont assignées
 * - commercial : Installations issues des devis qu'il a créés/validés
 */
export async function listInstallations(req, res) {
  try {
    const { role, _id, zone } = req.user;
    const filter = {};

    if (role === 'admin' || role === 'administration') {
      // Vision totale : pas de restriction sur le créateur ou la zone
      if (req.query.zone) filter.zone = req.query.zone;
    } else if (role === 'shop_manager') {
      filter.$or = [
        { shopManager: _id },
        { zone: zone || '' }
      ];
    } else if (role === 'technician') {
      filter.assignedTechnician = _id;
    } else if (role === 'commercial') {
      filter.$or = [
        { createdBy: _id },
        { 'quote.owner': _id }
      ];
    }

    // Filtres optionnels
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.technician) {
      filter.assignedTechnician = req.query.technician;
    }

    if (req.query.search) {
      const term = String(req.query.search).trim();
      filter.$or = [
        { folderNumber: new RegExp(term, 'i') },
        { quoteNumber: new RegExp(term, 'i') },
        { 'customer.name': new RegExp(term, 'i') },
        { 'customer.phone': new RegExp(term, 'i') },
        { kitId: new RegExp(term, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);

    const [installations, total, stats] = await Promise.all([
      InstallationFolder.find(filter)
        .populate('assignedTechnician', 'nom prenom identifier seniority zone')
        .populate('createdBy', 'nom prenom identifier role')
        .populate('shopManager', 'nom prenom identifier')
        .populate('validatedBy', 'nom prenom identifier')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InstallationFolder.countDocuments(filter),
      InstallationFolder.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = {
      a_planifier: 0,
      planifiee: 0,
      en_cours: 0,
      en_attente: 0,
      installee: 0,
      mise_en_service: 0,
      validee: 0,
      overdue: 0,
      total
    };

    stats.forEach(item => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    const today = businessDay();
    const enrichedInstallations = installations.map(inst => {
      const isOverdue = Boolean(
        inst.plannedDate &&
        inst.plannedDate < today &&
        !['installee', 'mise_en_service', 'validee'].includes(inst.status)
      );
      if (isOverdue) statusCounts.overdue += 1;
      return {
        ...inst,
        isOverdue,
        overdueLabel: isOverdue ? "Échéance dépassée • Retard d'intervention" : null,
      };
    });

    return res.json({
      success: true,
      data: {
        installations: enrichedInstallations,
        total,
        page,
        limit,
        stats: statusCounts
      }
    });
  } catch (error) {
    console.error('[InstallationController] listInstallations error:', error);
    return fail(res, 500, 'Impossible de récupérer la liste des installations.');
  }
}

/**
 * GET /api/installations/:id
 * Obtenir le détail complet d'un dossier d'installation
 */
export async function getInstallationDetail(req, res) {
  try {
    const { id } = req.params;
    const folder = await InstallationFolder.findById(id)
      .populate('quote')
      .populate('assignedTechnician', 'nom prenom identifier phone seniority zone whatsapp')
      .populate('createdBy', 'nom prenom identifier role')
      .populate('shopManager', 'nom prenom identifier phone')
      .populate('validatedBy', 'nom prenom identifier')
      .populate('history.changedBy', 'nom prenom role')
      .lean();

    const today = businessDay();
    const isOverdue = Boolean(
      folder.plannedDate &&
      folder.plannedDate < today &&
      !['installee', 'mise_en_service', 'validee'].includes(folder.status)
    );

    return res.json({
      success: true,
      data: {
        ...folder,
        isOverdue,
        overdueLabel: isOverdue ? "Échéance dépassée • Retard d'intervention" : null,
      }
    });
  } catch (error) {
    console.error('[InstallationController] getInstallationDetail error:', error);
    return fail(res, 500, 'Impossible de charger le dossier.');
  }
}

/**
 * PATCH /api/installations/:id/assign
 * Affecter un technicien et définir/modifier la date d'installation
 * Autorisé pour : admin, administration, shop_manager, commercial
 */
export async function assignTechnician(req, res) {
  try {
    const { id } = req.params;
    const { technicianId, plannedDate, note } = req.body;

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    let tech = null;
    if (technicianId) {
      tech = await User.findById(technicianId);
      if (!tech || tech.role !== 'technician') {
        return fail(res, 400, 'Technicien sélectionné invalide.');
      }

      // Si le demandeur est commercial, vérifier que le technicien a bien été créé par lui
      if (req.user.role === 'commercial' && String(tech.createdBy) !== String(req.user._id)) {
        return fail(res, 403, 'Vous ne pouvez assigner que des techniciens que vous avez créés.');
      }

      folder.assignedTechnician = tech._id;
    }

    if (plannedDate) {
      folder.plannedDate = plannedDate;
    }

    // Passage d'état automatique vers 'planifiee' si c'était 'a_planifier'
    if (folder.status === 'a_planifier' && (technicianId || plannedDate)) {
      folder.status = 'planifiee';
    }

    folder.history.push({
      status: folder.status,
      changedBy: req.user._id,
      note: note || `Technicien assigné et date fixée au ${folder.plannedDate || 'non définie'}`,
      timestamp: new Date()
    });

    await folder.save();

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone phone whatsapp')
      .populate('createdBy', 'nom prenom identifier role')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:updated', populated);

    // Envoi de la notification WhatsApp et notification in-app au technicien
    if (tech) {
      try {
        await sendInstallationToWhatsApp(tech, populated);
        notifyUser(String(tech._id), 'installation:assigned', {
          title: 'Nouvelle installation assignée',
          message: `Le dossier ${populated.folderNumber} (${populated.customer?.name}) vous a été confié pour le ${populated.plannedDate || 'dès que possible'}.`,
          folderId: populated._id,
          folderNumber: populated.folderNumber,
          plannedDate: populated.plannedDate,
        });
      } catch (notifyErr) {
        console.error('[InstallationController] Erreur envoi WhatsApp / notification technicien:', notifyErr);
      }
    }

    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('[InstallationController] assignTechnician error:', error);
    return fail(res, 500, 'Erreur lors de l’assignation du technicien.');
  }
}

/**
 * PATCH /api/installations/:id/status
 * Faire avancer l'étape de l'installation :
 * ex: en_cours (démarrage terrain), en_attente (blocage), installee
 */
export async function updateInstallationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note, blockedReason } = req.body;

    const allowedStatuses = ['a_planifier', 'planifiee', 'en_cours', 'en_attente', 'installee', 'mise_en_service', 'validee'];
    if (!allowedStatuses.includes(status)) {
      return fail(res, 400, 'Statut d’installation invalide.');
    }

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier introuvable.');

    // Permissions : technicien assigné ou admin/manager
    const isTech = req.user.role === 'technician' && String(folder.assignedTechnician) === String(req.user._id);
    const isAdmin = ['admin', 'administration', 'shop_manager'].includes(req.user.role);
    if (!isTech && !isAdmin) {
      return fail(res, 403, 'Vous n’avez pas les droits pour modifier l’état de cette installation.');
    }

    folder.status = status;
    if (status === 'en_cours' && !folder.startedAt) {
      folder.startedAt = new Date();
    }
    if (status === 'en_attente') {
      folder.blockedReason = blockedReason || note || 'Intervention suspendue';
    } else {
      folder.blockedReason = '';
    }
    if (status === 'installee' && !folder.installedAt) {
      folder.installedAt = new Date();
    }

    folder.history.push({
      status,
      changedBy: req.user._id,
      note: note || (status === 'en_attente' ? `Bloqué : ${blockedReason}` : `Statut passé à : ${status}`),
      timestamp: new Date()
    });

    await folder.save();

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:updated', populated);

    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('[InstallationController] updateInstallationStatus error:', error);
    return fail(res, 500, 'Erreur lors du changement de statut.');
  }
}

/**
 * POST /api/installations/:id/commission
 * Étape clé de mise en service :
 * - Renseignement de la checklist complète
 * - Liaison du boîtier IoT / Kit ID (numéro scanné)
 * - Capture des coordonnées GPS
 * - Passage automatique à 'mise_en_service' ou 'validee'
 */
export async function commissionInstallation(req, res) {
  try {
    const { id } = req.params;
    const { kitId, gpsCoordinates, checklist, notes } = req.body;

    if (!kitId || !kitId.trim()) {
      return fail(res, 400, 'L’identifiant du kit ou de la box IoT est requis.');
    }

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    // Vérifier si le kitId est déjà utilisé ailleurs
    const existingKit = await Kit.findOne({ kitId: kitId.trim() });
    if (existingKit && existingKit.quoteId !== folder.quoteNumber) {
      return fail(res, 409, `Le kit ${kitId} est déjà enregistré sur une autre installation.`);
    }

    folder.kitId = kitId.trim();

    if (gpsCoordinates && gpsCoordinates.latitude && gpsCoordinates.longitude) {
      folder.gpsCoordinates = {
        latitude: Number(gpsCoordinates.latitude),
        longitude: Number(gpsCoordinates.longitude),
        accuracy: Number(gpsCoordinates.accuracy) || null
      };
    }

    // Mise à jour de la checklist
    if (checklist) {
      folder.checklist = {
        ...folder.checklist,
        ...checklist,
        completedAt: new Date()
      };
    }

    folder.status = 'mise_en_service';
    folder.commissionedAt = new Date();

    folder.history.push({
      status: 'mise_en_service',
      changedBy: req.user._id,
      note: notes || `Mise en service effectuée avec le boîtier IoT ${kitId}. Checklist renseignée.`,
      timestamp: new Date()
    });

    await folder.save();

    // Synchronisation avec le modèle Kit pour que le monitoring puisse débuter immédiatement
    let kitRecord = existingKit;
    if (!kitRecord) {
      kitRecord = await Kit.create({
        kitId: folder.kitId,
        clientPhone: folder.customer?.phone || '',
        clientName: folder.customer?.name || '',
        offerName: `${folder.system?.panels || 1} panneaux`,
        quoteId: folder.quoteNumber,
        source: 'quote',
        salesClient: folder.client,
        system: folder.system,
        appliances: folder.appliances,
        shopManager: folder.shopManager,
        zone: folder.zone || req.user.zone || '',
        installedBy: req.user._id,
        installationDate: new Date().toISOString(),
        gpsCoordinates: folder.gpsCoordinates,
        status: 'active'
      });
    }

    // Mettre à jour le devis d'origine en statut 'installed'
    await Quote.findByIdAndUpdate(folder.quote, {
      status: 'installed',
      kitId: folder.kitId,
      installedAt: new Date(),
      installedDay: new Date().toISOString().slice(0, 10)
    });

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:commissioned', populated);

    return res.json({ success: true, data: populated, kit: kitRecord });
  } catch (error) {
    console.error('[InstallationController] commissionInstallation error:', error);
    return fail(res, 500, 'Erreur lors de la mise en service.');
  }
}

/**
 * PATCH /api/installations/:id/validate
 * Validation finale par l'Administrateur
 */
export async function validateInstallation(req, res) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!['admin', 'administration'].includes(req.user.role)) {
      return fail(res, 403, 'Seul un administrateur peut valider définitivement une installation.');
    }

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier introuvable.');

    folder.status = 'validee';
    folder.validatedAt = new Date();
    folder.validatedBy = req.user._id;

    folder.history.push({
      status: 'validee',
      changedBy: req.user._id,
      note: note || 'Validation définitive de la conformité de l’installation par l’administrateur.',
      timestamp: new Date()
    });

    await folder.save();

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone')
      .populate('validatedBy', 'nom prenom identifier')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:validated', populated);

    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('[InstallationController] validateInstallation error:', error);
    return fail(res, 500, 'Erreur lors de la validation finale.');
  }
}

/**
 * PATCH /api/installations/:id/accept
 * Le technicien confirme la réception de l'installation et part sur site
 * Fait passer le statut en 'en_cours' et notifie le suivi
 */
export async function acceptInstallation(req, res) {
  try {
    const { id } = req.params;
    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    if (req.user.role === 'technician' && String(folder.assignedTechnician) !== String(req.user._id)) {
      return fail(res, 403, 'Cette installation n’est pas assignée à votre profil.');
    }

    folder.status = 'en_cours';
    folder.startedAt = new Date();
    folder.history.push({
      status: 'en_cours',
      changedBy: req.user._id,
      note: `Mission acceptée par le technicien ${req.user.prenom} ${req.user.nom}. Départ sur site pour intervention.`,
      timestamp: new Date()
    });

    await folder.save();

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone phone whatsapp')
      .populate('createdBy', 'nom prenom identifier role')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:accepted', populated);
    emitInstallationEvent('installation:updated', populated);

    return res.json({
      success: true,
      data: populated,
      message: 'Mission acceptée avec succès. Statut passé en cours.'
    });
  } catch (error) {
    console.error('[InstallationController] acceptInstallation error:', error);
    return fail(res, 500, 'Erreur lors de l’acceptation de la mission.');
  }
}

/**
 * PATCH /api/installations/:id/report-issue
 * Le technicien signale un obstacle ou matériel manquant sur le chantier
 * Passe le statut en 'en_attente' et documente la cause
 */
export async function reportInstallationIssue(req, res) {
  try {
    const { id } = req.params;
    const { reason, category = 'Obstacle terrain', notes } = req.body;

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    const blockMsg = reason || notes || 'Problème signalé sur site';
    folder.status = 'en_attente';
    folder.blockedReason = blockMsg;

    folder.history.push({
      status: 'en_attente',
      changedBy: req.user._id,
      note: `Suspension [${category}] : ${blockMsg}`,
      timestamp: new Date()
    });

    await folder.save();

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone')
      .populate('createdBy', 'nom prenom identifier role')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:blocked', populated);
    emitInstallationEvent('installation:updated', populated);

    return res.json({
      success: true,
      data: populated,
      message: 'Obstacle remonté et consigné dans le suivi de l’installation.'
    });
  } catch (error) {
    console.error('[InstallationController] reportInstallationIssue error:', error);
    return fail(res, 500, 'Erreur lors du signalement du problème.');
  }
}

/**
 * PATCH /api/installations/:id/mark-installed
 * Le technicien signale que le matériel est posé sur site (statut 'installee')
 */
export async function markInstalled(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    folder.status = 'installee';
    folder.installedAt = new Date();

    folder.history.push({
      status: 'installee',
      changedBy: req.user._id,
      note: notes || 'Matériel solaire posé sur site avec succès par le technicien. Prêt pour mise en service.',
      timestamp: new Date()
    });

    await folder.save();

    const populated = await InstallationFolder.findById(id)
      .populate('assignedTechnician', 'nom prenom identifier seniority zone')
      .populate('createdBy', 'nom prenom identifier role')
      .populate('history.changedBy', 'nom prenom role');

    emitInstallationEvent('installation:installed', populated);
    emitInstallationEvent('installation:updated', populated);

    return res.json({
      success: true,
      data: populated,
      message: 'Statut mis à jour : Installation posée sur site.'
    });
  } catch (error) {
    console.error('[InstallationController] markInstalled error:', error);
    return fail(res, 500, 'Erreur lors de la mise à jour du statut.');
  }
}

/**
 * Helper : Trouve ou crée automatiquement la conversation rattachée au dossier d'installation
 */
async function getOrCreateInstallationConversation(folder, currentUser) {
  let conversation = await InstallationConversation.findOne({ installation: folder._id });
  if (!conversation) {
    const initialParticipants = [];
    if (folder.assignedTechnician) {
      initialParticipants.push({
        user: folder.assignedTechnician,
        role: 'technician',
        name: 'Technicien Assigné',
        unreadCount: 0,
        lastSeenAt: new Date(),
      });
    }
    if (folder.createdBy && String(folder.createdBy) !== String(folder.assignedTechnician)) {
      initialParticipants.push({
        user: folder.createdBy,
        role: 'shop_manager',
        name: 'Superviseur',
        unreadCount: 0,
        lastSeenAt: new Date(),
      });
    }

    conversation = await InstallationConversation.create({
      installation: folder._id,
      folderNumber: folder.folderNumber,
      customerName: folder.customer?.name || 'Client Djua',
      participants: initialParticipants,
      status: 'active',
      totalMessages: 0,
    });
  }

  // Vérifier si l'utilisateur courant est présent dans les participants
  const existingParticipant = conversation.participants.find(
    (p) => String(p.user) === String(currentUser._id)
  );
  if (!existingParticipant) {
    conversation.participants.push({
      user: currentUser._id,
      role: currentUser.role,
      name: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Utilisateur',
      unreadCount: 0,
      lastSeenAt: new Date(),
    });
    await conversation.save();
  }

  return conversation;
}

/**
 * GET /api/installations/:id/messages
 * Récupère le fil de discussion en temps réel (texte, audio, image) lié à l'installation
 * ainsi que les métadonnées de la conversation senior.
 */
export async function getInstallationMessages(req, res) {
  try {
    const { id } = req.params;
    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    const conversation = await getOrCreateInstallationConversation(folder, req.user);

    // Réinitialise le compteur non lus pour l'utilisateur qui consulte
    await InstallationConversation.updateOne(
      { _id: conversation._id, 'participants.user': req.user._id },
      { $set: { 'participants.$.unreadCount': 0, 'participants.$.lastSeenAt': new Date() } }
    );

    const messages = await InstallationMessage.find({ installation: id })
      .populate('sender', 'nom prenom role identifier')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error('[InstallationController] getInstallationMessages error:', error);
    return fail(res, 500, 'Impossible de récupérer les messages.');
  }
}

/**
 * POST /api/installations/:id/messages
 * Envoie un message dans le chat temps réel (texte, vocal audio, ou photo)
 * avec mise à jour atomique de la conversation, des compteurs non lus et broadcast Socket.io.
 */
export async function sendInstallationMessage(req, res) {
  try {
    const { id } = req.params;
    const { content, type = 'text', mediaUrl, audioDuration, replyTo } = req.body;

    if (!content && !mediaUrl) {
      return fail(res, 400, 'Le contenu ou le média est requis.');
    }

    const folder = await InstallationFolder.findById(id);
    if (!folder) return fail(res, 404, 'Dossier d’installation introuvable.');

    const conversation = await getOrCreateInstallationConversation(folder, req.user);

    const previewText = content
      ? content.substring(0, 80)
      : type === 'audio'
      ? `🎤 Note vocale (${Math.round(audioDuration || 0)}s)`
      : '📷 Photo transmise du chantier';

    const message = await InstallationMessage.create({
      conversation: conversation._id,
      installation: id,
      sender: req.user._id,
      senderName: `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() || 'Utilisateur',
      senderRole: req.user.role,
      type: type || 'text',
      content: content || '',
      mediaUrl: mediaUrl || null,
      audioDuration: audioDuration ? Number(audioDuration) : null,
      status: 'sent',
      replyTo: replyTo || null,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Mise à jour de la conversation
    conversation.lastMessage = {
      messageId: message._id,
      content: previewText,
      type,
      sender: req.user._id,
      senderName: message.senderName,
      createdAt: new Date(),
    };
    conversation.totalMessages += 1;

    // Incrémentation des non-lus pour les autres participants
    conversation.participants.forEach((p) => {
      if (String(p.user) !== String(req.user._id)) {
        p.unreadCount = (p.unreadCount || 0) + 1;
      } else {
        p.lastSeenAt = new Date();
      }
    });

    await conversation.save();

    const populatedMessage = await InstallationMessage.findById(message._id)
      .populate('sender', 'nom prenom role identifier')
      .populate('replyTo', 'content type senderName')
      .lean();

    // Broadcast Socket.io
    try {
      const io = getIO();
      if (io) {
        io.to(`installation:${id}`).emit('chat:new-message', populatedMessage);
        io.to(`installation:${id}`).emit('conversation:updated', {
          conversationId: conversation._id,
          lastMessage: conversation.lastMessage,
          totalMessages: conversation.totalMessages,
        });
        io.emit('chat:broadcast', { installationId: id, message: populatedMessage });
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      data: populatedMessage,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error('[InstallationController] sendInstallationMessage error:', error);
    return fail(res, 500, 'Erreur lors de l’envoi du message.');
  }
}

/**
 * PATCH /api/installations/:id/messages/read
 * Marque les messages comme lus pour l'utilisateur courant et réinitialise son compteur
 */
export async function markInstallationMessagesRead(req, res) {
  try {
    const { id } = req.params;

    await InstallationMessage.updateMany(
      {
        installation: id,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $set: { status: 'read' },
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
      }
    );

    await InstallationConversation.updateOne(
      { installation: id, 'participants.user': req.user._id },
      { $set: { 'participants.$.unreadCount': 0, 'participants.$.lastSeenAt': new Date() } }
    );

    try {
      const io = getIO();
      if (io) {
        io.to(`installation:${id}`).emit('chat:messages-read', {
          installationId: id,
          userId: req.user._id,
          readAt: new Date(),
        });
      }
    } catch (_) {}

    return res.json({ success: true, message: 'Messages marqués comme lus.' });
  } catch (error) {
    console.error('[InstallationController] markInstallationMessagesRead error:', error);
    return fail(res, 500, 'Erreur lors de la confirmation de lecture.');
  }
}

