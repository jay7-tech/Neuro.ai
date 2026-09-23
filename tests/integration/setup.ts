import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from '@/server/db/client';
import { users, patients, careTeamMembers, type CareRole, type UserRole } from '@/server/db/schema';
import type { Actor } from '@/server/http/handler';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://neuro:neuro@localhost:5433/neuro_test';
process.env.BCRYPT_COST = '4';
process.env.APP_URL = 'http://localhost:9002';

export const db = () => getDb();

export function setupTestDatabase() {
  beforeAll(async () => {
    await migrate(getDb(), { migrationsFolder: './drizzle' });
  });
  beforeEach(async () => {
    await getDb().execute(sql`
      truncate table audit_logs, job_runs, location_pings, alerts, messages, clinical_notes, game_sessions,
        mood_entries, task_completions, care_tasks, dose_events, medications, playlist_tracks, memories,
        family_members, invitations, care_team_members, patients, sessions, users restart identity cascade`);
  });
  afterAll(async () => {
    await closeDb();
  });
}

let n = 0;
export async function makeUser(role: UserRole, name = `${role}-${++n}`): Promise<Actor> {
  const [u] = await getDb()
    .insert(users)
    .values({ email: `${name}@test.local`, name, role, passwordHash: 'x' })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });
  return { user: u, requestId: `test-${n}`, ip: '127.0.0.1' };
}

export async function makePatient(members: [Actor, CareRole][], over: Partial<typeof patients.$inferInsert> = {}) {
  const [p] = await getDb()
    .insert(patients)
    .values({ displayName: 'Test Patient', timezone: 'Asia/Kolkata', ...over })
    .returning();
  for (const [a, role] of members)
    await getDb().insert(careTeamMembers).values({ patientId: p.id, userId: a.user.id, role });
  return p;
}
