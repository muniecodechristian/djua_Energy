// Keep aligned with backend2/src/services/geofence.service.js.
export const GEOFENCE_RADIUS_METERS = 90;
const R = 6371000;
const rad = degrees => degrees * Math.PI / 180;
const deg = radians => radians * 180 / Math.PI;
export function gpsPosition(latitude, longitude) {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') return null;
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0) ? { latitude:lat, longitude:lon } : null;
}
export function distanceMeters(a, b) {
  const dLat=rad(b.latitude-a.latitude), dLon=rad(b.longitude-a.longitude);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
}
export function offsetMeters(a,b) {
  const lat1=rad(a.latitude), lat2=rad(b.latitude), dLon=rad(b.longitude-a.longitude);
  const bearing=Math.atan2(Math.sin(dLon)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon));
  const distance=distanceMeters(a,b);
  return { east:Math.sin(bearing)*distance, north:Math.cos(bearing)*distance };
}
export function destination(origin, distance, bearingDegrees=90) {
  const delta=distance/R, bearing=rad(bearingDegrees), lat=rad(origin.latitude), lon=rad(origin.longitude);
  const nextLat=Math.asin(Math.sin(lat)*Math.cos(delta)+Math.cos(lat)*Math.sin(delta)*Math.cos(bearing));
  const nextLon=lon+Math.atan2(Math.sin(bearing)*Math.sin(delta)*Math.cos(lat),Math.cos(delta)-Math.sin(lat)*Math.sin(nextLat));
  return {latitude:deg(nextLat), longitude:((deg(nextLon)+540)%360)-180};
}
