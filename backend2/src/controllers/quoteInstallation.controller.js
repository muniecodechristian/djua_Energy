import { z } from 'zod';
import Quote from '../models/Quote.model.js';
import Kit from '../models/kit.model.js';
import { quoteScope, completeQuoteInstallation } from '../services/quote.service.js';
const schema = z.object({
  kitId: z.string().trim().min(1).max(100), quoteId: z.string().trim().min(1).max(100),
  gpsCoordinates: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }),
  diagnosticStatus: z.enum(['ok', 'partial', 'failed', 'pending']).optional(),
});
export async function createQuoteKit(req, res) {
  const fail = (code, message) => res.status(code).json({ success: false, message });
  if(!req.user) return fail(401,'Connectez-vous pour installer un devis.');
  if(!['technician','admin','administration'].includes(req.user.role)) return fail(403,'Seul un technicien peut enregistrer cette installation.');
  const parsed = schema.safeParse(req.body);
  if(!parsed.success) return fail(400,'Numéro de devis, kit ou coordonnées invalides.');
  const input = parsed.data;
  let quote;
  try {
    quote = await Quote.findOne({ ...quoteScope(req.user), number: input.quoteId.toUpperCase() });
    if(!quote) return fail(404,'Devis introuvable dans votre équipe.');
    const existing = await Kit.findOne({ kitId: input.kitId });
    if(existing) {
      if(existing.quoteId !== quote.number || String(existing.salesClient) !== String(quote.client)) return fail(409,'Ce kit est déjà associé à une autre installation.');
      await completeQuoteInstallation(quote, existing);
      return res.json({ success: true, data: existing, alreadyRegistered: true });
    }
    quote = await Quote.findOneAndUpdate({ _id: quote._id, $or: [{ status: 'approved' }, { status: 'installing', kitId: input.kitId }] }, { $set: { status: 'installing', kitId: input.kitId } }, { returnDocument: 'after' });
    if(!quote) return fail(409,'Le devis doit être validé et ne peut être utilisé que pour un seul kit.');
    const kit = await Kit.create({
      kitId: input.kitId, clientPhone: quote.customer.phone, clientName: quote.customer.name,
      offerName: `${quote.system.panels} panneaux`, quoteId: quote.number, source: 'quote',
      salesClient: quote.client, system: quote.system, appliances: quote.appliances,
      shopManager: quote.shopManager, zone: req.user.zone || '', installedBy: req.user._id,
      installationDate: new Date().toISOString(), gpsCoordinates: input.gpsCoordinates,
      diagnosticStatus: input.diagnosticStatus,
    });
    await completeQuoteInstallation(quote, kit);
    return res.status(201).json({ success: true, data: kit });
  } catch(error) {
    try {
    if(quote) {
      // Compensate only if no kit was persisted. A lost reply can safely be retried.
      const kit = await Kit.findOne({ kitId: input.kitId });
      if(kit?.quoteId === quote.number) {
        await completeQuoteInstallation(quote, kit);
        return res.json({ success: true, data: kit, alreadyRegistered: true });
      }
      await Quote.updateOne({ _id: quote._id, status: 'installing', kitId: input.kitId }, { $set: { status: 'approved' }, $unset: { kitId: 1 } });
    }
    } catch { /* Keep the claim: the same kit can safely retry after a database outage. */ }
    return fail(error.code === 11000 ? 409 : 500, 'Impossible d’enregistrer cette installation. Réessayez.');
  }
}
