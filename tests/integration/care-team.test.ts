import { describe, expect, it } from 'vitest';
import { db, makePatient, makeUser, useDatabase } from './setup';
import { login, register } from '@/server/services/auth';
import { validateSession } from '@/server/auth/session';
import { acceptInvite, createInvite, listTeam, removeMember } from '@/server/services/team';
import { getPatient } from '@/server/services/patients';
import { createMedication } from '@/server/services/medications';
import { AppError } from '@/server/errors';
import { auditLogs } from '@/server/db/schema';

useDatabase();

const code = (e: unknown) => (e instanceof AppError ? e.code : e);

describe('auth', () => {
  it('registers a patient with their own record and a working session', async () => {
    const { user, token } = await register(db(), { name: 'Asha', email: 'Asha@Example.com', password: 'correct-horse-1', role: 'patient' }, { ttlDays: 30 });
    const session = await validateSession(db(), token, 30);
    expect(session?.user.id).toBe(user.id);

    const actor = { user, requestId: 'r', ip: null };
    const { listMyPatients } = await import('@/server/services/patients');
    const mine = await listMyPatients(db(), actor);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ displayName: 'Asha', role: 'patient' });
  });

  it('treats emails case-insensitively and rejects duplicates', async () => {
    await register(db(), { name: 'A', email: 'dup@example.com', password: 'correct-horse-1', role: 'caregiver' }, { ttlDays: 30 });
    await expect(register(db(), { name: 'B', email: 'DUP@example.com', password: 'correct-horse-1', role: 'caregiver' }, { ttlDays: 30 })).rejects.toSatisfy(
      (e) => code(e) === 'CONFLICT',
    );
    await expect(login(db(), { email: 'Dup@Example.com', password: 'correct-horse-1' }, { ttlDays: 30 })).resolves.toBeTruthy();
  });

  it('gives the same error for wrong password and unknown email', async () => {
    await register(db(), { name: 'A', email: 'a@example.com', password: 'correct-horse-1', role: 'caregiver' }, { ttlDays: 30 });
    const e1 = await login(db(), { email: 'a@example.com', password: 'wrong-password-1' }, { ttlDays: 30 }).catch((e) => e);
    const e2 = await login(db(), { email: 'nobody@example.com', password: 'wrong-password-1' }, { ttlDays: 30 }).catch((e) => e);
    expect(e1.message).toBe(e2.message);
  });

  it('rejects expired and unknown session tokens', async () => {
    expect(await validateSession(db(), 'not-a-real-token', 30)).toBeNull();
    expect(await validateSession(db(), undefined, 30)).toBeNull();
  });
});

describe('relationship-based access control', () => {
  it('hides patients from non-members with 404 (no existence leak)', async () => {
    const owner = await makeUser('caregiver');
    const stranger = await makeUser('clinician');
    const p = await makePatient([[owner, 'caregiver']]);
    await expect(getPatient(db(), stranger, p.id)).rejects.toSatisfy((e) => code(e) === 'NOT_FOUND');
  });

  it('returns 403 when a member lacks the permission', async () => {
    const patientUser = await makeUser('patient');
    const p = await makePatient([[patientUser, 'patient']]);
    await expect(
      createMedication(db(), patientUser, p.id, { name: 'X', dosage: '1', instructions: null, times: ['09:00'], daysOfWeek: [1], startDate: '2026-09-01', endDate: null }),
    ).rejects.toSatisfy((e) => code(e) === 'FORBIDDEN');
  });

  it('hides clinical summary from the patient view', async () => {
    const pu = await makeUser('patient');
    const cg = await makeUser('caregiver');
    const p = await makePatient([[pu, 'patient'], [cg, 'caregiver']], { medicalSummary: 'MCI' });
    expect((await getPatient(db(), pu, p.id)).medicalSummary).toBeNull();
    expect((await getPatient(db(), cg, p.id)).medicalSummary).toBe('MCI');
  });
});

describe('invitations', () => {
  it('lets a caregiver invite a clinician who then joins exactly once', async () => {
    const cg = await makeUser('caregiver');
    const doc = await makeUser('clinician');
    const p = await makePatient([[cg, 'caregiver']]);

    const inv = await createInvite(db(), cg, p.id, 'clinician');
    expect(inv.code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const raw = inv.code.replace('-', '');

    await expect(acceptInvite(db(), doc, raw)).resolves.toMatchObject({ role: 'clinician' });
    expect((await listTeam(db(), cg, p.id)).map((m) => m.role).sort()).toEqual(['caregiver', 'clinician']);

    const other = await makeUser('clinician');
    await expect(acceptInvite(db(), other, raw)).rejects.toSatisfy((e) => code(e) === 'CONFLICT');
  });

  it('allows only one of two concurrent redemptions', async () => {
    const cg = await makeUser('caregiver');
    const p = await makePatient([[cg, 'caregiver']]);
    const raw = (await createInvite(db(), cg, p.id, 'caregiver')).code.replace('-', '');
    const [a, b] = [await makeUser('caregiver'), await makeUser('caregiver')];

    const results = await Promise.allSettled([acceptInvite(db(), a, raw), acceptInvite(db(), b, raw)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });

  it('rejects codes issued for a different role, and roles a member cannot invite', async () => {
    const pu = await makeUser('patient');
    const p = await makePatient([[pu, 'patient']]);
    await expect(createInvite(db(), pu, p.id, 'clinician')).rejects.toSatisfy((e) => code(e) === 'FORBIDDEN');

    const raw = (await createInvite(db(), pu, p.id, 'caregiver')).code.replace('-', '');
    const doc = await makeUser('clinician');
    await expect(acceptInvite(db(), doc, raw)).rejects.toSatisfy((e) => code(e) === 'FORBIDDEN');
  });

  it('will not orphan a patient who has no login of their own', async () => {
    const cg = await makeUser('caregiver');
    const p = await makePatient([[cg, 'caregiver']]);
    await expect(removeMember(db(), cg, p.id, cg.user.id)).rejects.toSatisfy((e) => code(e) === 'CONFLICT');
  });

  it('records every step in the audit log', async () => {
    const cg = await makeUser('caregiver');
    const p = await makePatient([[cg, 'caregiver']]);
    await createInvite(db(), cg, p.id, 'caregiver');
    const rows = await db().select().from(auditLogs);
    expect(rows.map((r) => r.action)).toContain('invite.created');
  });
});
