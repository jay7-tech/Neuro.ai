export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (haversine). Accurate to well under 0.5% at city scale. */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type PingClassification = 'inside' | 'outside' | 'uncertain';

/**
 * A phone reporting ±150 m accuracy 320 m from home is not *confidently* outside a
 * 300 m fence. We only call a ping outside when even the most favourable reading of
 * its error circle is beyond the radius.
 */
export function classifyPing(home: LatLng, radiusM: number, ping: LatLng & { accuracyM: number }) {
  const distanceM = haversineM(home, ping);
  let classification: PingClassification;
  if (distanceM - ping.accuracyM > radiusM) classification = 'outside';
  else if (distanceM + ping.accuracyM <= radiusM) classification = 'inside';
  else classification = 'uncertain';
  return { distanceM: Math.round(distanceM), classification };
}

/**
 * Debounced breach detection: raise only after `consecutive` confident "outside"
 * readings in a row, so a single GPS jump does not page a caregiver at 3 a.m.
 *
 * @param history classifications, most recent first, including the current ping.
 */
export function isGeofenceBreach(history: readonly PingClassification[], consecutive = 2): boolean {
  if (history.length < consecutive) return false;
  return history.slice(0, consecutive).every((c) => c === 'outside');
}
