import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import Quote from '../models/Quote.model.js';
import Client from '../models/SalesClient.model.js';
import Notice from '../models/InstallationNotice.model.js';
import { createInstallationFromQuote } from './installation.controller.js';
import { quoteScope, salesScope, normalizeSalesPhone, foldName, validPlannedDate, QUOTE_TIMEZONE } from '../services/quote.service.js';
const text = z.string().trim().max(250);
const details = z.object({
  ...Object.fromEntries(['fullName','postNom','companyName','contactName','contactPostNom','contactPref','budgetPeriod','budgetCurrency','rccm','idNationale','tva','secteur','adresse','ville','province'].map(key => [key, text.optional()])),
  budget: z.union([text, z.number().nonnegative()]).optional(),
});
const lineItem = z.object({
  category: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(250).optional().default(''),
  quantity: z.number().positive().max(100000),
  unit: z.enum(['piece', 'forfait']).default('piece'),
  unitPrice: z.number().nonnegative().max(1e14),
  currency: z.enum(['USD', 'CDF']),
});
const schema = z.object({
  requestKey: z.string().min(8).max(100),
  customer: z.object({ name: text.min(2), phone: text.min(7), email: z.union([z.email(), z.literal('')]).optional(), address: text.optional(), profile: z.enum(['personne', 'entreprise']).optional(), details:details.optional() }),
  site: z.object({ adresse: text.optional(), ville: text.optional(), quartier: text.optional(), commune: text.optional(), lat: z.number().min(-90).max(90).optional(), lng: z.number().min(-180).max(180).optional() }),
  buildingType:text.optional(),
  system: z.object({ panels: z.number().int().positive().max(100000), panelPower: z.number().positive().max(10000), batteryCapacity: z.number().nonnegative().max(1000000), inverterPower: z.number().positive().max(1000000), expectedLoad: z.number().nonnegative().optional() }),
  appliances: z.array(z.object({ name: text.min(1), quantity: z.number().int().min(1).max(100000), watts: z.number().nonnegative().max(10000000), hours: z.number().min(0).max(24), period: z.enum(['day', 'night', 'both', 'mixed', 'continuous']).optional() })).min(1).max(200),
  lineItems: z.array(lineItem).max(100).optional(),
  amount: z.number().nonnegative().max(1e14), currency: z.enum(['USD', 'CDF']), recommendationId: text.optional(),
}).superRefine((quote, context) => {
  if (!quote.lineItems?.length) return;
  const itemCurrencies = new Set(quote.lineItems.map(item => item.currency));
  const itemTotal = quote.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (itemCurrencies.size !== 1 || !itemCurrencies.has(quote.currency)) {
    context.addIssue({ code: 'custom', message: 'La devise des éléments doit correspondre à celle du devis.', path: ['lineItems'] });
  }
  if (Math.abs(itemTotal - quote.amount) > 0.01) {
    context.addIssue({ code: 'custom', message: 'Le total des éléments doit correspondre au montant du devis.', path: ['lineItems'] });
  }
});
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fail = (res, status, message) => res.status(status).json({ success: false, message });
export async function saveQuote(req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Informations client, appareils ou dimensionnement incomplets.');
  const input = parsed.data;
  input.customer.phone = normalizeSalesPhone(input.customer.phone);
  if (!/^\d{7,15}$/.test(input.customer.phone)) return fail(res, 400, 'Numéro de téléphone invalide.');
  try {
    const prior = await Quote.findOne({ owner: req.user._id, requestKey: input.requestKey });
    if (prior) return res.json({ success: true, data: prior });
    const shopManager = req.user.role === 'shop_manager' ? req.user._id : req.user.createdBy || null;
    const clientFilter = { scope: salesScope(req.user), phone: input.customer.phone };
    let client;
    try { client = await Client.findOneAndUpdate(clientFilter, { $set: { ...input.customer, searchName: foldName(input.customer.name) } }, { upsert: true, returnDocument: 'after', runValidators: true }); }
    catch (error) { if(error.code !== 11000) throw error; client = await Client.findOne(clientFilter); }
    const quote = await Quote.create({
      ...input,
      lineItems: input.lineItems?.map(item => ({
        ...item,
        total: Math.round(item.quantity * item.unitPrice * 100) / 100,
      })),
      status: 'draft',
      owner: req.user._id,
      shopManager,
      client: client._id,
      number: `DJ-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`,
    });
    return res.status(201).json({ success: true, data: quote });
  } catch (error) {
    if (error.code === 11000) {
      const prior = await Quote.findOne({ owner: req.user._id, requestKey: input.requestKey });
      if(prior) return res.json({ success: true, data: prior });
    }
    return fail(res, 500, 'Impossible d’enregistrer le devis. Réessayez.');
  }
}
export async function listQuotes(req, res) {
  try {
    const scope = quoteScope(req.user);
    const search = String(req.query.search || '').trim().slice(0, 100);
    const filter = { ...scope };
    const followUpBefore = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const status = String(req.query.status || '');
    if (status === 'validated') filter.status = { $in: ['approved', 'installing', 'installed'] };
    else if (['draft', 'approved', 'rejected', 'installing', 'installed'].includes(status)) filter.status = status;
    if (req.query.followUp === 'true') {
      filter.status = 'draft';
      filter.createdAt = { $lt: followUpBefore };
    }
    if(search) {
      const phone = normalizeSalesPhone(search);
      const clients = await Client.find({ $or: [{ searchName: new RegExp(escapeRegex(foldName(search)), 'i') }, ...(phone ? [{ phone: new RegExp(escapeRegex(phone)) }] : [])] }).select('_id').limit(1000).lean();
      filter.$or = [{ client: { $in: clients.map(client => client._id) } }, { number: new RegExp(escapeRegex(search), 'i') }, { 'customer.name': new RegExp(escapeRegex(search), 'i') }, ...(phone ? [{ 'customer.phone': new RegExp(escapeRegex(phone)) }] : [])];
    }
    const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
    const [quotes, total, stats, notices, kitIds, followUps, pendingAmounts] = await Promise.all([
      Quote.find(filter)
        .populate('owner', 'nom prenom email role phone')
        .populate('shopManager', 'nom prenom email phone')
        .populate('validatedBy', 'nom prenom email')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page-1)*30)
        .limit(30)
        .lean(),
      Quote.countDocuments(filter),
      Quote.aggregate([{ $match: scope }, { $group: {
        _id: '$status',
        count: { $sum: 1 },
        draftsToFollowUp: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'draft'] }, { $lt: ['$createdAt', followUpBefore] }] }, 1, 0] } },
      } }]),
      Notice.find({ ...scope, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(100).lean(),
      Quote.distinct('kitId', { ...scope, kitId: { $type: 'string' } }),
      Quote.find({ ...scope, status: 'draft', createdAt: { $lt: followUpBefore } }).sort({ createdAt: -1 }).limit(5).lean(),
      Quote.aggregate([
        { $match: { ...scope, status: { $nin: ['installed', 'rejected'] } } },
        { $group: { _id: '$currency', amount: { $sum: '$amount' } } },
      ]),
    ]);
    const statusCounts = Object.fromEntries(stats.map(item => [item._id, item.count]));
    statusCounts.draftsToFollowUp = stats.reduce((sum, item) => sum + item.draftsToFollowUp, 0);
    statusCounts.total = stats.reduce((sum, item) => sum + item.count, 0);
    statusCounts.valuePendingByCurrency = Object.fromEntries(pendingAmounts.map(item => [item._id, item.amount]));

    const isAdmin = ['admin', 'administration'].includes(req.user.role);
    const userIdStr = String(req.user._id);
    const sanitizedQuotes = quotes.map(q => {
      const isOwner = q.owner && String(q.owner) === userIdStr;
      if (!isAdmin && !isOwner) {
        const { plannedDate, ...rest } = q;
        return rest;
      }
      return q;
    });

    res.json({ success: true, data: { quotes: sanitizedQuotes, total, page, pageSize: 30, stats: statusCounts, notices, kitIds, followUps, timezone: QUOTE_TIMEZONE } });
  } catch { return fail(res, 500, 'Impossible de charger les devis.'); }
}
export async function getQuote(req, res) {
  try {
    const rawParam = String(req.params.number || '').trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawParam);
    const filter = isObjectId
      ? { ...quoteScope(req.user), $or: [{ number: rawParam.toUpperCase() }, { _id: rawParam }] }
      : { ...quoteScope(req.user), number: rawParam.toUpperCase() };

    let quote = await Quote.findOne(filter)
      .populate('owner', 'nom prenom email role phone')
      .populate('shopManager', 'nom prenom email phone')
      .populate('validatedBy', 'nom prenom email')
      .lean();

    if (!quote) {
      if (req.user.role === 'technician') {
        const any = await Quote.findOne(isObjectId ? { $or: [{ number: rawParam.toUpperCase() }, { _id: rawParam }] } : { number: rawParam.toUpperCase() }).lean();
        if (any) {
          return fail(res, 403, "Vous n'avez pas la permission d'utiliser ce devis parce que ce commercial ne fait pas partie de votre équipe.");
        }
      }
      return fail(res, 404, 'Devis introuvable dans votre équipe.');
    }

    if (req.user.role === 'technician' && !['approved', 'installed'].includes(quote.status)) return fail(res, 409, 'Ce devis n’est pas encore validé ou son installation est en cours.');
    if (req.user.role === 'technician' && quote.status === 'installed') return fail(res, 409, 'Ce devis est déjà associé à un kit installé.');

    const isAdmin = ['admin', 'administration'].includes(req.user.role);
    const isOwner = quote.owner && String(quote.owner._id || quote.owner) === String(req.user._id);
    if (!isAdmin && !isOwner && req.user.role !== 'technician') {
      delete quote.plannedDate;
    }

    return res.json({ success: true, data: quote });
  } catch { return fail(res, 500, 'Impossible de charger le devis.'); }
}
export async function approveQuote(req, res) {
  try {
    const rawParam = String(req.params.number || '').trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawParam);
    const filter = isObjectId
      ? { ...quoteScope(req.user), $or: [{ number: rawParam.toUpperCase() }, { _id: rawParam }] }
      : { ...quoteScope(req.user), number: rawParam.toUpperCase() };

    const quote = await Quote.findOne(filter);
    if(!quote) return fail(res,404,'Devis introuvable.');

    const isAdmin = ['admin', 'administration'].includes(req.user.role);
    const isOwner = quote.owner && String(quote.owner) === String(req.user._id);
    const isShopManager = req.user.role === 'shop_manager' && (!quote.shopManager || String(quote.shopManager) === String(req.user._id));
    if (!isAdmin && !isOwner && !isShopManager) {
      return fail(res, 403, 'Seul le créateur du devis, le responsable shop ou un administrateur peut enregistrer la réponse du client.');
    }

    if (quote.status === 'approved' || quote.status === 'installing' || quote.status === 'installed') {
      return res.json({ success: true, data: quote });
    }
    if (quote.status !== 'draft') return fail(res, 409, 'Seul un devis en attente peut être accepté.');

    const acceptedQuote = await Quote.findOneAndUpdate(
      { _id: quote._id, status: 'draft' },
      { $set: { status: 'approved', acceptedAt: new Date(), acceptedBy: req.user._id, validatedAt: new Date(), validatedBy: req.user._id } },
      { returnDocument: 'after' },
    );
    if (!acceptedQuote) {
      const currentQuote = await Quote.findById(quote._id);
      if (currentQuote && ['approved', 'installing', 'installed'].includes(currentQuote.status)) {
        return res.json({ success: true, data: currentQuote });
      }
      return fail(res, 409, 'Le devis a déjà reçu une décision.');
    }

    return res.json({ success: true, data: acceptedQuote });
  } catch (error) {
    console.error('[quote.controller] Erreur enregistrement acceptation devis:', error);
    return fail(res, 500, 'Impossible d’enregistrer l’acceptation du devis.');
  }
}

export async function rejectQuote(req, res) {
  try {
    const rawParam = String(req.params.number || '').trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawParam);
    const filter = isObjectId
      ? { ...quoteScope(req.user), $or: [{ number: rawParam.toUpperCase() }, { _id: rawParam }] }
      : { ...quoteScope(req.user), number: rawParam.toUpperCase() };
    const quote = await Quote.findOne(filter);
    if (!quote) return fail(res, 404, 'Devis introuvable.');

    const isAdmin = ['admin', 'administration'].includes(req.user.role);
    const isOwner = quote.owner && String(quote.owner) === String(req.user._id);
    const isShopManager = req.user.role === 'shop_manager' && (!quote.shopManager || String(quote.shopManager) === String(req.user._id));
    if (!isAdmin && !isOwner && !isShopManager) {
      return fail(res, 403, 'Seul le créateur du devis, le responsable shop ou un administrateur peut enregistrer la réponse du client.');
    }
    if (quote.status === 'rejected') return res.json({ success: true, data: quote });
    if (quote.status !== 'draft') return fail(res, 409, 'Seul un devis en attente peut être refusé.');

    const rejectedQuote = await Quote.findOneAndUpdate(
      { _id: quote._id, status: 'draft' },
      { $set: { status: 'rejected', rejectedAt: new Date(), rejectedBy: req.user._id } },
      { returnDocument: 'after' },
    );
    if (!rejectedQuote) {
      const currentQuote = await Quote.findById(quote._id);
      if (currentQuote?.status === 'rejected') return res.json({ success: true, data: currentQuote });
      return fail(res, 409, 'Le devis a déjà reçu une décision.');
    }
    return res.json({ success: true, data: rejectedQuote });
  } catch (error) {
    console.error('[quote.controller] Erreur enregistrement refus devis:', error);
    return fail(res, 500, 'Impossible d’enregistrer le refus du devis.');
  }
}

export async function createQuoteInstallation(req, res) {
  const input = z.object({
    plannedDate: z.string().optional(),
    folderName: z.string().trim().max(120).optional(),
  }).safeParse(req.body);
  if (!input.success) return fail(res, 400, 'Les informations du dossier d’installation sont invalides.');
  if (input.data.plannedDate && !validPlannedDate(input.data.plannedDate)) {
    return fail(res, 400, 'Choisissez aujourd’hui ou une date future (heure de Kinshasa).');
  }

  try {
    const rawParam = String(req.params.number || '').trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawParam);
    const filter = isObjectId
      ? { ...quoteScope(req.user), $or: [{ number: rawParam.toUpperCase() }, { _id: rawParam }] }
      : { ...quoteScope(req.user), number: rawParam.toUpperCase() };
    const quote = await Quote.findOne(filter);
    if (!quote) return fail(res, 404, 'Devis introuvable.');

    const isAdmin = ['admin', 'administration'].includes(req.user.role);
    const isOwner = quote.owner && String(quote.owner) === String(req.user._id);
    const isShopManager = req.user.role === 'shop_manager' && (!quote.shopManager || String(quote.shopManager) === String(req.user._id));
    if (!isAdmin && !isOwner && !isShopManager) {
      return fail(res, 403, 'Seul le créateur du devis, le responsable shop ou un administrateur peut créer le dossier d’installation.');
    }
    if (!['approved', 'installing', 'installed'].includes(quote.status)) {
      return fail(res, 409, 'Le devis doit être accepté avant la création du dossier d’installation.');
    }

    const installationFolder = await createInstallationFromQuote(
      quote,
      req.user,
      input.data.plannedDate || '',
      input.data.folderName || '',
    );
    if (input.data.plannedDate && quote.plannedDate !== input.data.plannedDate) {
      quote.plannedDate = input.data.plannedDate;
      await quote.save();
    }
    return res.status(201).json({ success: true, data: installationFolder });
  } catch (error) {
    console.error('[quote.controller] Erreur création dossier depuis devis:', error);
    return fail(res, 500, 'Impossible de créer le dossier d’installation.');
  }
}
