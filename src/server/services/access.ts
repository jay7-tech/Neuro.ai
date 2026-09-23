import { and, eq } from 'drizzle-orm';
import type { Executor } from '../db/client';
import { careTeamMembers, type CareRole } from '../db/schema';
import { can, type Action } from '../authz/policy';
import { forbidden, notFound } from '../errors';
import type { Actor } from '../http/handler';

export async function membershipRole(db: Executor, userId: string, patientId: string): Promise<CareRole | null> {
  const [row] = await db
    .select({ role: careTeamMembers.role })
    .from(careTeamMembers)
    .where(and(eq(careTeamMembers.patientId, patientId), eq(careTeamMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}

/**
 * Enforces the policy for `action` on `patientId`.
 *
 * Non-members get 404, not 403: a user outside the care team must not be able to
 * probe which patient ids exist.
 */
export async function requireAccess(db: Executor, actor: Actor, patientId: string, action: Action): Promise<CareRole> {
  const role = await membershipRole(db, actor.user.id, patientId);
  if (!role) throw notFound('Patient');
  if (!can(role, action)) throw forbidden(`Your role (${role}) cannot perform ${action}`);
  return role;
}
