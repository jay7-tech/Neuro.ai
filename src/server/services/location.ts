import { desc, eq } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { locationPings, patients } from '../db/schema';
import { notFound } from '../errors';
import type { Actor } from '../http/handler';
import { classifyPing, isGeofenceBreach, type PingClassification } from '../domain/geo';
import { localDate } from '../domain/time';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';
import { raiseAlert, resolveOpenAlerts } from './alerts';

export async function reportLocation(
  db: Database,
  actor: Actor,
  patientId: string,
  ping: { lat: number; lng: number; accuracyM: number },
) {
  await requireAccess(db, actor, patientId, 'location:report');

  return db.transaction(async (tx) => {
    // Lock the patient row so concurrent pings from one device are evaluated in order.
    const [p] = await tx
      .select({
        homeLat: patients.homeLat,
        homeLng: patients.homeLng,
        radius: patients.geofenceRadiusM,
        tz: patients.timezone,
        name: patients.displayName,
      })
      .from(patients)
      .where(eq(patients.id, patientId))
      .for('update');
    if (!p) throw notFound('Patient');

    const hasFence = p.homeLat !== null && p.homeLng !== null;
    const result = hasFence
      ? classifyPing({ lat: p.homeLat!, lng: p.homeLng! }, p.radius, ping)
      : { distanceM: null, classification: 'uncertain' as PingClassification };

    const [prev] = await tx
      .select({ inside: locationPings.insideGeofence })
      .from(locationPings)
      .where(eq(locationPings.patientId, patientId))
      .orderBy(desc(locationPings.recordedAt))
      .limit(1);

    const [row] = await tx
      .insert(locationPings)
      .values({
        patientId,
        ...ping,
        distanceFromHomeM: result.distanceM,
        insideGeofence: result.classification === 'uncertain' ? null : result.classification === 'inside',
      })
      .returning();

    const prevClass: PingClassification =
      prev?.inside === true ? 'inside' : prev?.inside === false ? 'outside' : 'uncertain';
    let alertRaised = false;
    if (hasFence && isGeofenceBreach([result.classification, prevClass])) {
      const alert = await raiseAlert(tx, {
        patientId,
        type: 'geofence_exit',
        severity: 'critical',
        title: `${p.name} has left the safe zone`,
        // One open wandering alert per local day; it auto-resolves on return.
        dedupeKey: `geofence_exit:${localDate(new Date(), p.tz)}`,
        detail: { lat: ping.lat, lng: ping.lng, distanceM: result.distanceM, radiusM: p.radius },
      });
      alertRaised = alert !== null;
    } else if (result.classification === 'inside') {
      await resolveOpenAlerts(tx, patientId, 'geofence_exit');
    }

    await publish(tx, patientId, 'location.updated');
    return { ...row, classification: result.classification, alertRaised };
  });
}

export async function locationStatus(db: Executor, actor: Actor, patientId: string, historyLimit = 50) {
  await requireAccess(db, actor, patientId, 'location:read');
  const [p] = await db
    .select({ homeLat: patients.homeLat, homeLng: patients.homeLng, radiusM: patients.geofenceRadiusM })
    .from(patients)
    .where(eq(patients.id, patientId));
  if (!p) throw notFound('Patient');
  const history = await db
    .select()
    .from(locationPings)
    .where(eq(locationPings.patientId, patientId))
    .orderBy(desc(locationPings.recordedAt))
    .limit(historyLimit);
  return { geofence: p.homeLat === null ? null : p, latest: history[0] ?? null, history };
}
