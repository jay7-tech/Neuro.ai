import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { Client } from 'pg';
import { db, makePatient, makeUser, setupTestDatabase } from './setup';
import { createMedication, recordDose, todaysDoses, adherence } from '@/server/services/medications';
import { listAlerts, raiseAlert, updateAlertStatus } from '@/server/services/alerts';
import { reportLocation } from '@/server/services/location';
import { listMessages, sendMessage } from '@/server/services/messages';
import { listMyPatients } from '@/server/services/patients';
import { recordSession } from '@/server/services/games';
import { missedDoseJob } from '@/server/jobs/jobs';
import { runOnce } from '@/server/jobs/runner';
import { publish } from '@/server/realtime/bus';
import { EVENTS_CHANNEL } from '@/server/realtime/events';
import { alerts, doseEvents } from '@/server/db/schema';
import { addDays, localDate, zonedToUtc } from '@/server/domain/time';
import { AppError } from '@/server/errors';

setupTestDatabase();
const TZ = 'Asia/Kolkata';
const code = (e: unknown) => (e instanceof AppError ? e.code : e);

async function setup() {
  const pu = await makeUser('patient');
  const cg = await makeUser('caregiver');
  const p = await makePatient([[pu, 'patient'], [cg, 'caregiver']], { homeLat: 12.9716, homeLng: 77.5946, geofenceRadiusM: 300 });
  return { pu, cg, p };
}

describe('medication adherence', () => {
  it('records doses idempotently and only for real schedule slots', async () => {
    const { pu, cg, p } = await setup();
    const yesterday = addDays(localDate(new Date(), TZ), -1);
    const m = await createMedication(db(), cg, p.id, { name: 'Memantine', dosage: '10 mg', instructions: null, times: ['08:00'], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDate: yesterday, endDate: null });
    const slot = zonedToUtc(yesterday, '08:00', TZ).toISOString();

    await recordDose(db(), pu, p.id, { medicationId: m.id, scheduledFor: slot, status: 'skipped' });
    await recordDose(db(), pu, p.id, { medicationId: m.id, scheduledFor: slot, status: 'taken' });
    const rows = await db().select().from(doseEvents).where(eq(doseEvents.medicationId, m.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('taken');

    const bogus = zonedToUtc(yesterday, '08:07', TZ).toISOString();
    await expect(recordDose(db(), pu, p.id, { medicationId: m.id, scheduledFor: bogus, status: 'taken' })).rejects.toSatisfy((e) => code(e) === 'BAD_REQUEST');
  });

  it('marks overdue doses missed, alerts once, and is safe to re-run', async () => {
    const { cg, p } = await setup();
    const yesterday = addDays(localDate(new Date(), TZ), -1);
    await createMedication(db(), cg, p.id, { name: 'Donepezil', dosage: '5 mg', instructions: null, times: ['09:00', '21:00'], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDate: yesterday, endDate: null });

    const job = missedDoseJob(60, 48);
    const now = zonedToUtc(localDate(new Date(), TZ), '00:30', TZ); // after both of yesterday's slots + grace
    expect(await runOnce(db(), job, now)).toBe('ran');
    expect(await runOnce(db(), job, now)).toBe('ran');

    const missed = await db().select().from(doseEvents).where(and(eq(doseEvents.patientId, p.id), eq(doseEvents.status, 'missed')));
    expect(missed).toHaveLength(2);
    const open = await listAlerts(db(), cg, p.id, { status: 'open', limit: 10 });
    expect(open.filter((a) => a.type === 'missed_dose')).toHaveLength(2);

    const report = await adherence(db(), cg, p.id, 2, 60, now);
    expect(report.counts.missed).toBe(2);
    expect(report.adherenceRate).toBe(0);
  });

  it("returns today's doses with state and names", async () => {
    const { pu, cg, p } = await setup();
    const today = localDate(new Date(), TZ);
    await createMedication(db(), cg, p.id, { name: 'Amlodipine', dosage: '5 mg', instructions: null, times: ['00:00', '23:59'], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDate: today, endDate: null });
    const r = await todaysDoses(db(), pu, p.id, 60);
    expect(r.doses.map((d) => d.name)).toEqual(['Amlodipine', 'Amlodipine']);
    expect(r.doses.at(-1)?.state).toBe('upcoming');
  });
});

describe('advisory-locked jobs', () => {
  it('runs a job on only one of several concurrent workers', async () => {
    let runs = 0;
    const job = { name: 'test-job', intervalMs: 1000, run: async () => { runs += 1; await new Promise((r) => setTimeout(r, 200)); } };
    const results = await Promise.all([runOnce(db(), job), runOnce(db(), job), runOnce(db(), job)]);
    expect(runs).toBe(1);
    expect(results.filter((r) => r === 'skipped')).toHaveLength(2);
  });

  it('records failures without crashing the worker', async () => {
    const job = { name: 'boom', intervalMs: 1000, run: async () => { throw new Error('kaboom'); } };
    expect(await runOnce(db(), job)).toBe('failed');
  });
});

describe('alerts', () => {
  it('de-duplicates open alerts by key and allows a new one after resolution', async () => {
    const { cg, p } = await setup();
    const a = { patientId: p.id, type: 'sos' as const, severity: 'critical' as const, title: 'Help', dedupeKey: 'k1' };
    const first = await raiseAlert(db(), a);
    expect(first).not.toBeNull();
    expect(await raiseAlert(db(), a)).toBeNull();

    await updateAlertStatus(db(), cg, p.id, first!.id, 'resolved');
    expect(await raiseAlert(db(), a)).not.toBeNull();
    await expect(updateAlertStatus(db(), cg, p.id, first!.id, 'acknowledged')).rejects.toSatisfy((e) => code(e) === 'CONFLICT');
  });
});

describe('geofence', () => {
  it('raises after two confident outside pings and auto-resolves on return', async () => {
    const { pu, cg, p } = await setup();
    const away = { lat: 12.9716 + 0.01, lng: 77.5946, accuracyM: 20 }; // ~1.1 km
    const r1 = await reportLocation(db(), pu, p.id, away);
    expect(r1.alertRaised).toBe(false);
    const r2 = await reportLocation(db(), pu, p.id, away);
    expect(r2.alertRaised).toBe(true);
    expect((await listAlerts(db(), cg, p.id, { status: 'open', limit: 10 }))[0].type).toBe('geofence_exit');

    await reportLocation(db(), pu, p.id, { lat: 12.9716, lng: 77.5946, accuracyM: 10 });
    const open = await db().select().from(alerts).where(and(eq(alerts.patientId, p.id), eq(alerts.status, 'open')));
    expect(open).toHaveLength(0);
  });
});

describe('messaging', () => {
  it('paginates with a keyset cursor and tracks unread counts', async () => {
    const { pu, cg, p } = await setup();
    for (let i = 0; i < 5; i++) await sendMessage(db(), cg, p.id, `msg ${i}`);
    const page1 = await listMessages(db(), pu, p.id, { limit: 3 });
    expect(page1.items.map((m) => m.body)).toEqual(['msg 2', 'msg 3', 'msg 4']);
    const page2 = await listMessages(db(), pu, p.id, { limit: 3, before: page1.nextCursor! });
    expect(page2.items.map((m) => m.body)).toEqual(['msg 0', 'msg 1']);
    expect(page2.nextCursor).toBeNull();

    const [mine] = await listMyPatients(db(), pu);
    expect(mine.unreadMessages).toBe(5);
    await sendMessage(db(), pu, p.id, 'reply'); // replying marks the thread read
    expect((await listMyPatients(db(), pu))[0].unreadMessages).toBe(0);
  });
});

describe('games', () => {
  it('stores performance and recommends promotion after sustained success', async () => {
    const { pu, p } = await setup();
    const round = { game: 'color_match' as const, difficulty: 'easy' as const, score: 10, maxScore: 10, mistakes: 0, durationMs: 20_000 };
    await recordSession(db(), pu, p.id, round);
    await recordSession(db(), pu, p.id, round);
    const third = await recordSession(db(), pu, p.id, round);
    expect(third.session.performance).toBe(1);
    expect(third.recommendation).toMatchObject({ change: 'promote', level: 'medium' });
  });
});

describe('realtime bus', () => {
  it('delivers NOTIFY only when the transaction commits', async () => {
    const listener = new Client({ connectionString: process.env.DATABASE_URL });
    await listener.connect();
    await listener.query(`LISTEN ${EVENTS_CHANNEL}`);
    const received: string[] = [];
    listener.on('notification', (m) => received.push(JSON.parse(m.payload!).type));

    await db().transaction(async (tx) => {
      await publish(tx, '00000000-0000-0000-0000-000000000000', 'message.created');
      tx.rollback();
    }).catch(() => undefined);
    await db().transaction(async (tx) => publish(tx, '00000000-0000-0000-0000-000000000000', 'alert.created'));

    await new Promise((r) => setTimeout(r, 200));
    await listener.end();
    expect(received).toEqual(['alert.created']);
  });
});
