import Quote from '../models/Quote.model.js';
import Notice from '../models/InstallationNotice.model.js';
export const QUOTE_TIMEZONE = 'Africa/Kinshasa';
export function businessDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: QUOTE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validPlannedDate(value, now = new Date()) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value && value >= businessDay(now);
}
export function normalizeSalesPhone(value) {
  let digits = String(value || '').replace(/\D/g, '').replace(/^00/, '');
  if (/^0\d{9}$/.test(digits)) digits = `243${digits.slice(1)}`;
  return digits;
}
export const foldName = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function quoteScope(user) {
  if (['admin', 'administration'].includes(user.role)) return {};
  if (user.role === 'commercial') return { owner: user._id };
  if (user.role === 'shop_manager') return { shopManager: user._id };
  if (user.role === 'technician' && user.createdBy) return { shopManager: user.createdBy };
  return { owner: null };
}
export function salesScope(user) {
  return String(user.role === 'shop_manager' ? user._id : user.createdBy || user._id);
}
export async function completeQuoteInstallation(quote, kit) {
  // Use the persisted kit creation time, never a client-supplied installation date.
  const installedAt = new Date(kit.createdAt);
  const installedDay = businessDay(installedAt);
  const dateMatched = installedDay === quote.plannedDate;
  if (!dateMatched) {
    // Retries must never extend an alert's lifetime.
    await Notice.updateOne({ quote: quote._id }, { $setOnInsert: {
      number: quote.number, owner: quote.owner, shopManager: quote.shopManager,
      clientName: quote.customer.name, kitId: kit.kitId, plannedDate: quote.plannedDate,
      installedDay, expiresAt: new Date(installedAt.getTime() + 7 * 86400000),
    } }, { upsert: true });
  }
  await Quote.updateOne({ _id: quote._id, kitId: kit.kitId }, { $set: { status: 'installed', installedAt, installedDay, dateMatched } });
}
