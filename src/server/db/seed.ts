/**
 * Demo data: `npm run db:seed`. Wipes and recreates everything — refuses to run in production.
 *
 * Generates three weeks of realistic history (dose adherence with a few misses and
 * late doses, a mood series with a recent dip, game sessions with improving scores)
 * using a seeded PRNG, so every run produces the same dataset.
 */
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from './client';
import * as s from './schema';
import { hashPassword } from '../auth/password';
import { expandOccurrences } from '../domain/schedule';
import { addDays, localDate, zonedToUtc } from '../domain/time';
import { performance } from '../domain/difficulty';
import { logger } from '../logger';

export const DEMO_PASSWORD = 'neuro-demo-2026';
const TZ = 'Asia/Kolkata';
const HOME = { lat: 12.9716, lng: 77.5946 }; // Bengaluru

/** mulberry32: tiny, fast, deterministic PRNG. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed a production database');
  const db = getDb();
  const rand = rng(42);
  const now = new Date();
  const today = localDate(now, TZ);
  const start = addDays(today, -21);

  await db.execute(sql`
    truncate table audit_logs, job_runs, location_pings, alerts, messages, clinical_notes, game_sessions,
      mood_entries, task_completions, care_tasks, dose_events, medications, playlist_tracks, memories,
      family_members, invitations, care_team_members, patients, sessions, users restart identity cascade`);

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [john, jane, emily, arjun] = await db
    .insert(s.users)
    .values([
      { email: 'john@demo.neuro.ai', name: 'John Doe', role: 'patient', passwordHash },
      { email: 'jane@demo.neuro.ai', name: 'Jane Smith', role: 'caregiver', passwordHash },
      { email: 'emily@demo.neuro.ai', name: 'Dr. Emily White', role: 'clinician', passwordHash },
      { email: 'arjun@demo.neuro.ai', name: 'Arjun Rao', role: 'caregiver', passwordHash },
    ])
    .returning();

  const [p1, p2] = await db
    .insert(s.patients)
    .values([
      {
        userId: john.id,
        displayName: 'John Doe',
        dateOfBirth: '1948-03-14',
        bloodGroup: 'O+',
        address: '12 Lavelle Road, Bengaluru 560001',
        medicalSummary: 'Mild cognitive impairment (MoCA 22/30, Jan 2026). Hypertension, controlled. Allergic to penicillin.',
        timezone: TZ,
        homeLat: HOME.lat,
        homeLng: HOME.lng,
        geofenceRadiusM: 300,
        photoUrl: 'https://placehold.co/150x150/E0E7FF/4A69C4?text=JD',
      },
      {
        displayName: 'Kamala Rao',
        dateOfBirth: '1944-11-02',
        bloodGroup: 'B+',
        address: '48 4th Cross, Jayanagar, Bengaluru 560011',
        medicalSummary: "Moderate Alzheimer's disease. Type 2 diabetes. Does not use a phone independently.",
        timezone: TZ,
        homeLat: 12.925,
        homeLng: 77.5938,
        geofenceRadiusM: 200,
        photoUrl: 'https://placehold.co/150x150/E0E7FF/4A69C4?text=KR',
      },
    ])
    .returning();

  await db.insert(s.careTeamMembers).values([
    { patientId: p1.id, userId: john.id, role: 'patient' },
    { patientId: p1.id, userId: jane.id, role: 'caregiver' },
    { patientId: p1.id, userId: emily.id, role: 'clinician' },
    { patientId: p2.id, userId: arjun.id, role: 'caregiver' },
    { patientId: p2.id, userId: emily.id, role: 'clinician' },
  ]);

  const meds = await db
    .insert(s.medications)
    .values([
      { patientId: p1.id, name: 'Donepezil (Aricept)', dosage: '5 mg tablet', instructions: 'At bedtime', times: ['21:00'], startDate: start },
      { patientId: p1.id, name: 'Memantine (Namenda)', dosage: '10 mg tablet', instructions: 'With breakfast and dinner', times: ['08:30', '19:30'], startDate: start },
      { patientId: p1.id, name: 'Amlodipine', dosage: '5 mg tablet', instructions: 'Morning, with water', times: ['08:30'], startDate: start },
      { patientId: p2.id, name: 'Rivastigmine patch', dosage: '4.6 mg/24h', instructions: 'Change patch every morning', times: ['09:00'], startDate: start },
      { patientId: p2.id, name: 'Metformin', dosage: '500 mg tablet', instructions: 'With lunch and dinner', times: ['13:00', '20:00'], startDate: start },
    ])
    .returning();

  // Dose history: ~88% on time, some late, a few skipped/missed. Leave today's due doses unrecorded.
  const events: (typeof s.doseEvents.$inferInsert)[] = [];
  for (const p of [p1, p2]) {
    const own = meds.filter((m) => m.patientId === p.id);
    const occ = expandOccurrences(
      own.map((m) => ({ id: m.id, times: m.times, daysOfWeek: m.daysOfWeek, startDate: m.startDate, endDate: m.endDate, active: m.active })),
      zonedToUtc(start, '00:00', TZ),
      new Date(now.getTime() - 2 * 3_600_000),
      TZ,
    );
    for (const o of occ) {
      const r = rand();
      const status = r < 0.88 ? 'taken' : r < 0.93 ? 'skipped' : 'missed';
      const delayMin = status === 'taken' ? (rand() < 0.1 ? 70 + rand() * 60 : rand() * 25) : 90;
      events.push({
        medicationId: o.scheduleId,
        patientId: p.id,
        scheduledFor: o.at,
        status,
        recordedAt: new Date(o.at.getTime() + delayMin * 60_000),
        recordedBy: p.id === p1.id ? john.id : arjun.id,
      });
    }
  }
  await db.insert(s.doseEvents).values(events);

  await db.insert(s.careTasks).values([
    { patientId: p1.id, title: 'Morning walk in the garden', time: '07:30', category: 'activity' },
    { patientId: p1.id, title: 'Breakfast', time: '08:15', category: 'meal' },
    { patientId: p1.id, title: 'Crossword with Jane', time: '10:30', category: 'social' },
    { patientId: p1.id, title: 'Lunch', time: '13:00', category: 'meal' },
    { patientId: p1.id, title: 'Afternoon rest', time: '14:30', category: 'routine' },
    { patientId: p1.id, title: 'Video call with Peter', time: '18:00', category: 'social', daysOfWeek: [0, 3, 6] },
    { patientId: p1.id, title: 'Neurology follow-up', time: '11:00', category: 'appointment', daysOfWeek: [2] },
    { patientId: p2.id, title: 'Blood sugar check', time: '08:00', category: 'routine' },
    { patientId: p2.id, title: 'Temple visit with Arjun', time: '17:00', category: 'social', daysOfWeek: [5] },
  ]);

  // Mood: stable ~4 for two weeks, then a dip over the last 3 days (drives the demo alert).
  const moods: (typeof s.moodEntries.$inferInsert)[] = [];
  for (let d = 20; d >= 0; d--) {
    const base = d <= 2 ? 2.2 : 4;
    for (const hour of [9, 18]) {
      const at = new Date(zonedToUtc(addDays(today, -d), '00:00', TZ).getTime() + hour * 3_600_000);
      if (at > now) continue;
      const score = Math.max(1, Math.min(5, Math.round(base + (rand() - 0.5) * 1.4)));
      moods.push({ patientId: p1.id, score, recordedAt: at, recordedBy: john.id, note: d <= 2 && hour === 18 ? 'Felt confused this evening' : null });
    }
  }
  await db.insert(s.moodEntries).values(moods);

  // Games: gradual improvement, promoted from easy to medium on memory match.
  const games: (typeof s.gameSessions.$inferInsert)[] = [];
  const gameTypes = ['memory_match', 'color_match', 'sequence_memory', 'word_scramble'] as const;
  for (let d = 20; d >= 1; d--) {
    const game = gameTypes[d % 4];
    const level = game === 'memory_match' && d < 10 ? 'medium' : 'easy';
    const maxScore = game === 'sequence_memory' ? 10 : 8;
    const skill = 0.55 + (20 - d) * 0.018 + (rand() - 0.5) * 0.15;
    const score = Math.max(0, Math.min(maxScore, Math.round(maxScore * skill)));
    const input = { game, difficulty: level, score, maxScore, mistakes: Math.round((1 - skill) * 6), durationMs: Math.round((50 + rand() * 60) * 1000) } as const;
    games.push({ ...input, patientId: p1.id, performance: performance(input), createdAt: new Date(now.getTime() - d * 86_400_000) });
  }
  await db.insert(s.gameSessions).values(games);

  await db.insert(s.familyMembers).values([
    { patientId: p1.id, name: 'Jane Doe', relation: 'Wife', phone: '+91 98450 00001', photoUrl: 'https://placehold.co/400x400/E0E7FF/4A69C4?text=Wife', message: 'Through thick and thin, for fifty-two years. I love you more every day.' },
    { patientId: p1.id, name: 'Peter Doe', relation: 'Son', phone: '+91 98450 00002', photoUrl: 'https://placehold.co/400x400/E0E7FF/4A69C4?text=Son', message: 'Dad, you taught me everything I know about being strong and kind.' },
    { patientId: p1.id, name: 'Mary Doe', relation: 'Daughter', phone: '+91 98450 00003', photoUrl: 'https://placehold.co/400x400/E0E7FF/4A69C4?text=Daughter', message: 'Remember our fishing trips at Kabini? Those are my favourite memories.' },
    { patientId: p2.id, name: 'Arjun Rao', relation: 'Son', phone: '+91 98450 00010' },
  ]);

  await db.insert(s.memories).values([
    { patientId: p1.id, title: 'Family trip to Goa', description: 'The whole family at Calangute beach. Peter built a sandcastle taller than Mary.', photoUrl: 'https://placehold.co/600x400/E0E7FF/4A69C4?text=Goa+1994', occurredOn: '1994-12-26', createdBy: jane.id },
    { patientId: p1.id, title: 'Your 70th birthday', description: 'Everyone came home. You gave a speech that made Jane cry.', photoUrl: 'https://placehold.co/600x400/E0E7FF/4A69C4?text=70th+Birthday', occurredOn: '2018-03-14', createdBy: jane.id },
    { patientId: p1.id, title: 'Retirement from HAL', description: '34 years as an aeronautical engineer. The team gave you a model of the Tejas.', photoUrl: 'https://placehold.co/600x400/E0E7FF/4A69C4?text=Retirement', occurredOn: '2008-06-30', createdBy: jane.id },
  ]);

  await db.insert(s.playlistTracks).values([
    { patientId: p1.id, title: 'Moonlight Sonata (1st movement)', artist: 'Beethoven', url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Beethoven_Moonlight_1st_movement.ogg', position: 0 },
    { patientId: p1.id, title: 'Gymnopédie No. 1', artist: 'Erik Satie', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Gymnopedie_No._1..ogg', position: 1 },
  ]);

  const msgBase = now.getTime() - 5 * 3_600_000;
  await db.insert(s.messages).values([
    { patientId: p1.id, senderId: jane.id, body: 'Good morning John! Remember we have the crossword at 10:30.', createdAt: new Date(msgBase) },
    { patientId: p1.id, senderId: john.id, body: 'Yes! I will be ready.', createdAt: new Date(msgBase + 20 * 60_000) },
    { patientId: p1.id, senderId: emily.id, body: 'Hi John, Jane — I have reviewed this week’s mood log. Let’s talk at Tuesday’s visit.', createdAt: new Date(msgBase + 3 * 3_600_000) },
  ]);

  await db.insert(s.clinicalNotes).values([
    {
      patientId: p1.id,
      authorId: emily.id,
      body: 'Follow-up visit. Orientation to time intermittently impaired; recall 2/3 at 5 minutes. Tolerating donepezil 5 mg without GI effects. Plan: continue current regimen, reassess for 10 mg in 6 weeks. Encourage daily cognitive activity.',
      createdAt: new Date(now.getTime() - 9 * 86_400_000),
    },
  ]);

  // Location: a normal day at home, one short walk inside the fence.
  const pings = [0, 0.0005, 0.0012, 0.0006, 0.0002].map((dLat, i) => ({
    patientId: p1.id,
    lat: HOME.lat + dLat,
    lng: HOME.lng + dLat / 2,
    accuracyM: 15,
    distanceFromHomeM: Math.round(dLat * 111_000),
    insideGeofence: true,
    recordedAt: new Date(now.getTime() - (5 - i) * 30 * 60_000),
  }));
  await db.insert(s.locationPings).values(pings);

  logger.info(
    { users: 4, patients: 2, doseEvents: events.length, moodEntries: moods.length, gameSessions: games.length, password: DEMO_PASSWORD },
    'seed complete — log in as john@ / jane@ / emily@ / arjun@demo.neuro.ai',
  );
}

main()
  .catch((err) => {
    logger.fatal({ err }, 'seed failed');
    process.exitCode = 1;
  })
  .finally(() => closeDb());
