import { randomInt } from 'node:crypto';
import { and, asc, count, eq } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { careTeamMembers, invitations, patients, users, type CareRole } from '../db/schema';
import { invitableRoles } from '../authz/policy';
import { hashToken } from '../auth/session';
import { AppError, conflict, forbidden, notFound } from '../errors';
import type { Actor } from '../http/handler';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';
import { audit } from './audit';

/** Crockford base32 minus look-alikes (no I, L, O, U): readable aloud over the phone. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const INVITE_TTL_MS = 72 * 3_600_000;

export function generateInviteCode(): string {
  let out = '';
  for (let i = 0; i < 8; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export async function listTeam(db: Executor, actor: Actor, patientId: string) {
  await requireAccess(db, actor, patientId, 'team:read');
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: careTeamMembers.role,
      since: careTeamMembers.createdAt,
    })
    .from(careTeamMembers)
    .innerJoin(users, eq(users.id, careTeamMembers.userId))
    .where(eq(careTeamMembers.patientId, patientId))
    .orderBy(asc(careTeamMembers.createdAt));
}

export async function createInvite(db: Database, actor: Actor, patientId: string, role: CareRole) {
  const myRole = await requireAccess(db, actor, patientId, 'team:read');
  if (!invitableRoles(myRole).includes(role)) throw forbidden(`A ${myRole} cannot invite a ${role}`);

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.transaction(async (tx) => {
    const [inv] = await tx
      .insert(invitations)
      .values({ patientId, role, codeHash: hashToken(code), createdBy: actor.user.id, expiresAt })
      .returning({ id: invitations.id });
    await audit(tx, actor, {
      patientId,
      action: 'invite.created',
      entity: 'invitation',
      entityId: inv.id,
      metadata: { role },
    });
  });
  // The plaintext code is returned exactly once and never stored.
  return { code: `${code.slice(0, 4)}-${code.slice(4)}`, role, expiresAt };
}

export async function acceptInvite(db: Database, actor: Actor, code: string) {
  return db.transaction(async (tx) => {
    // Row lock: two people racing to redeem the same code cannot both succeed.
    const [inv] = await tx
      .select()
      .from(invitations)
      .where(eq(invitations.codeHash, hashToken(code)))
      .for('update')
      .limit(1);
    if (!inv) throw notFound('Invitation');
    if (inv.acceptedAt) throw conflict('This invite code has already been used');
    if (inv.expiresAt < new Date()) throw new AppError('BAD_REQUEST', 'This invite code has expired');
    if (actor.user.role !== inv.role) {
      throw forbidden(`This code is for a ${inv.role}; you are signed in as a ${actor.user.role}`);
    }

    const [existing] = await tx
      .select({ role: careTeamMembers.role })
      .from(careTeamMembers)
      .where(and(eq(careTeamMembers.patientId, inv.patientId), eq(careTeamMembers.userId, actor.user.id)));
    if (existing) throw conflict('You are already on this care team');

    await tx.insert(careTeamMembers).values({ patientId: inv.patientId, userId: actor.user.id, role: inv.role });
    await tx
      .update(invitations)
      .set({ acceptedAt: new Date(), acceptedBy: actor.user.id })
      .where(eq(invitations.id, inv.id));
    await audit(tx, actor, {
      patientId: inv.patientId,
      action: 'team.joined',
      entity: 'care_team',
      entityId: actor.user.id,
      metadata: { role: inv.role },
    });
    await publish(tx, inv.patientId, 'team.changed');

    const [p] = await tx
      .select({ id: patients.id, displayName: patients.displayName })
      .from(patients)
      .where(eq(patients.id, inv.patientId));
    return { patient: p, role: inv.role };
  });
}

export async function removeMember(db: Database, actor: Actor, patientId: string, userId: string) {
  const isSelf = userId === actor.user.id;
  if (!isSelf) await requireAccess(db, actor, patientId, 'team:remove_member');

  await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ role: careTeamMembers.role })
      .from(careTeamMembers)
      .where(and(eq(careTeamMembers.patientId, patientId), eq(careTeamMembers.userId, userId)))
      .for('update');
    if (!target) throw notFound('Care team member');
    if (target.role === 'patient') throw forbidden('The patient cannot be removed from their own care team');

    if (target.role === 'caregiver') {
      const [{ n }] = await tx
        .select({ n: count() })
        .from(careTeamMembers)
        .where(and(eq(careTeamMembers.patientId, patientId), eq(careTeamMembers.role, 'caregiver')));
      const [p] = await tx.select({ userId: patients.userId }).from(patients).where(eq(patients.id, patientId));
      // A patient without their own login would be orphaned: nobody could manage their record.
      if (n <= 1 && !p?.userId) throw conflict('This patient must keep at least one caregiver');
    }

    await tx
      .delete(careTeamMembers)
      .where(and(eq(careTeamMembers.patientId, patientId), eq(careTeamMembers.userId, userId)));
    await audit(tx, actor, { patientId, action: 'team.member_removed', entity: 'care_team', entityId: userId });
    await publish(tx, patientId, 'team.changed');
  });
}
