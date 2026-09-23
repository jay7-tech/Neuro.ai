/**
 * Authorization policy — the single source of truth for "who may do what".
 *
 * Access is relationship-based: a user's permissions come from the role they hold on
 * a particular patient's care team, not from their account type. A clinician who is
 * not on John's care team sees nothing of John's. This module is pure so the entire
 * matrix is covered by unit tests.
 */
import type { CareRole } from '../db/schema';

export const ACTIONS = [
  'patient:read',
  'patient:update',
  'medication:read',
  'medication:write',
  'dose:record',
  'task:read',
  'task:write',
  'task:complete',
  'mood:read',
  'mood:write',
  'game:read',
  'game:play',
  'note:read',
  'note:write',
  'message:read',
  'message:send',
  'alert:read',
  'alert:raise_sos',
  'alert:acknowledge',
  'location:read',
  'location:report',
  'location:configure',
  'reminiscence:read',
  'reminiscence:write',
  'team:read',
  'team:invite_caregiver',
  'team:invite_clinician',
  'team:remove_member',
  'audit:read',
  'insights:read',
] as const;

export type Action = (typeof ACTIONS)[number];

const PATIENT: readonly Action[] = [
  'patient:read',
  'medication:read',
  'dose:record',
  'task:read',
  'task:complete',
  'mood:read',
  'mood:write',
  'game:read',
  'game:play',
  'message:read',
  'message:send',
  'alert:raise_sos',
  'location:report',
  'reminiscence:read',
  'team:read',
  'team:invite_caregiver',
];

const CAREGIVER: readonly Action[] = [
  'patient:read',
  'patient:update',
  'medication:read',
  'medication:write',
  'dose:record',
  'task:read',
  'task:write',
  'task:complete',
  'mood:read',
  'mood:write',
  'game:read',
  'note:read',
  'message:read',
  'message:send',
  'alert:read',
  'alert:raise_sos',
  'alert:acknowledge',
  'location:read',
  'location:report',
  'location:configure',
  'reminiscence:read',
  'reminiscence:write',
  'team:read',
  'team:invite_caregiver',
  'team:invite_clinician',
  'team:remove_member',
  'audit:read',
  'insights:read',
];

const CLINICIAN: readonly Action[] = [
  'patient:read',
  'medication:read',
  'medication:write',
  'task:read',
  'mood:read',
  'game:read',
  'note:read',
  'note:write',
  'message:read',
  'message:send',
  'alert:read',
  'alert:acknowledge',
  'location:read',
  'reminiscence:read',
  'team:read',
  'team:invite_clinician',
  'audit:read',
  'insights:read',
];

export const PERMISSIONS: Record<CareRole, ReadonlySet<Action>> = {
  patient: new Set(PATIENT),
  caregiver: new Set(CAREGIVER),
  clinician: new Set(CLINICIAN),
};

export function can(role: CareRole | null | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role].has(action);
}

/** Which care-team roles a member holding `role` may issue invitations for. */
export function invitableRoles(role: CareRole): CareRole[] {
  const out: CareRole[] = [];
  if (can(role, 'team:invite_caregiver')) out.push('caregiver');
  if (can(role, 'team:invite_clinician')) out.push('clinician');
  return out;
}
