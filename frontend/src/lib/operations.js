export const severityLabels = { critical: 'Critique', high: 'Élevée', medium: 'Modérée', low: 'Faible', info: 'Information' };
export const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
export const asList = (value) => Array.isArray(value) ? value : [];
export const dateValue = (value) => value ? new Date(value).getTime() : NaN;
export const formatDate = (value) => Number.isFinite(dateValue(value)) ? new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date non renseignée';
export const detailUrl = (kitId, ai = false) => '/SmartKitdetails?kitId=' + encodeURIComponent(kitId) + (ai ? '&tab=ai' : '');
export const activeAlerts = (alerts) => asList(alerts).filter(a => a.status === 'active' || a.status === 'acknowledged');
export function prioritize(alerts) {
  return [...alerts].sort((a, b) => (severityRank[a.severity] ?? 5) - (severityRank[b.severity] ?? 5) || (dateValue(b.createdAt) || 0) - (dateValue(a.createdAt) || 0));
}
export function latestByKit(records) {
  const result = new Map();
  for (const row of asList(records)) {
    if (!row.kitId) continue;
    const previous = result.get(row.kitId);
    if (!previous || (dateValue(row.createdAt || row.timestamp) || 0) > (dateValue(previous.createdAt || previous.timestamp) || 0)) result.set(row.kitId, row);
  }
  return result;
}
export function observedRecently(record, now = Date.now()) {
  const time = dateValue(record?.createdAt || record?.timestamp);
  return Number.isFinite(time) && now - time >= 0 && now - time <= 300000;
}
export function coordinates(kit) {
  const lat = kit.gpsCoordinates?.latitude ?? kit.latitude;
  const lng = kit.gpsCoordinates?.longitude ?? kit.longitude;
  if (lat == null || lng == null || lat === '' || lng === '') return null;
  const pair = [Number(lat), Number(lng)];
  return pair.every(Number.isFinite) && Math.abs(pair[0]) <= 90 && Math.abs(pair[1]) <= 180 ? pair : null;
}

export function predictionMatchesKit(event, kitId) {
  if (!kitId || !event?.result) return false;
  const identities = [event.kitId, event.result.identity?.kit_id, event.result.kit_id, event.result.kitId].filter(Boolean);
  return identities.length > 0 && identities.every(id => id === kitId);
}
