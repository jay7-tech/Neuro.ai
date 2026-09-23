import { describe, expect, it } from 'vitest';
import { ACTIONS, can, invitableRoles, PERMISSIONS } from '@/server/authz/policy';
import { MemoryRateLimitStore } from '@/server/http/rate-limit';
import { detectDistress, ruleBasedAnswer, type CompanionContext } from '@/server/domain/companion';
import { AcceptInviteInput, MedicationInput, RegisterInput } from '@/lib/contracts';

describe('authorization policy', () => {
  it('denies everything to non-members', () => {
    for (const a of ACTIONS) expect(can(null, a)).toBe(false);
  });

  it('keeps clinical notes away from patients and authorship with clinicians', () => {
    expect(can('patient', 'note:read')).toBe(false);
    expect(can('caregiver', 'note:read')).toBe(true);
    expect(can('caregiver', 'note:write')).toBe(false);
    expect(can('clinician', 'note:write')).toBe(true);
  });

  it('lets patients act for themselves but not surveil themselves', () => {
    expect(can('patient', 'dose:record')).toBe(true);
    expect(can('patient', 'location:report')).toBe(true);
    expect(can('patient', 'location:read')).toBe(false);
    expect(can('patient', 'medication:write')).toBe(false);
  });

  it('scopes invitations by role', () => {
    expect(invitableRoles('patient')).toEqual(['caregiver']);
    expect(invitableRoles('caregiver')).toEqual(['caregiver', 'clinician']);
    expect(invitableRoles('clinician')).toEqual(['clinician']);
  });

  it('only references known actions', () => {
    for (const set of Object.values(PERMISSIONS)) for (const a of set) expect(ACTIONS).toContain(a);
  });
});

describe('token bucket rate limiter', () => {
  const rule = { capacity: 3, refillPerSec: 1 };

  it('allows a burst up to capacity, then limits', () => {
    const s = new MemoryRateLimitStore();
    const t = 1_000_000;
    expect([1, 2, 3].map(() => s.take('k', rule, t).allowed)).toEqual([true, true, true]);
    const denied = s.take('k', rule, t);
    expect(denied).toMatchObject({ allowed: false, retryAfterSec: 1 });
  });

  it('refills over time and isolates keys', () => {
    const s = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i++) s.take('a', rule, 0);
    expect(s.take('a', rule, 0).allowed).toBe(false);
    expect(s.take('b', rule, 0).allowed).toBe(true);
    expect(s.take('a', rule, 1_500).allowed).toBe(true);
  });

  it('evicts least-recently-used keys beyond maxKeys', () => {
    const s = new MemoryRateLimitStore(2);
    s.take('a', rule, 0);
    s.take('b', rule, 0);
    s.take('c', rule, 0);
    expect(s.size).toBe(2);
  });
});

describe('companion fallback', () => {
  const ctx: CompanionContext = {
    patientName: 'John Doe',
    now: { date: '23 September 2026', weekday: 'Wednesday', time: '10:05' },
    nextDoses: [
      { name: 'Memantine', dosage: '10 mg', time: '08:30', state: 'taken' },
      { name: 'Donepezil', dosage: '5 mg', time: '21:00', state: 'upcoming' },
    ],
    plan: [
      { title: 'Breakfast', time: '08:15', completed: true },
      { title: 'Crossword with Jane', time: '10:30', completed: false },
    ],
    family: [
      { name: 'Peter Doe', relation: 'Son' },
      { name: 'Mary Doe', relation: 'Daughter' },
    ],
    careTeam: [{ name: 'Jane Smith', role: 'caregiver' }],
  };

  it.each([
    ['What day is it today?', 'Wednesday'],
    ['what time is it', '10:05'],
    ['When is my next medicine?', 'Donepezil'],
    ["What's next on my schedule?", 'Crossword'],
    ["What is my son's name?", 'Peter Doe'],
    ['Who is my caregiver?', 'Jane Smith'],
    ['Where is my brother?', "don't have your brother"],
  ])('%s', (q, expected) => {
    expect(ruleBasedAnswer(q, ctx)).toContain(expected);
  });

  it('detects distress', () => {
    expect(detectDistress('I fell in the bathroom')).toBe(true);
    expect(detectDistress('What is for lunch?')).toBe(false);
  });
});

describe('contracts', () => {
  it('normalises invite codes typed with dashes and lowercase', () => {
    expect(AcceptInviteInput.parse({ code: 'ab3d-9kq2' }).code).toBe('AB3D9KQ2');
  });

  it('deduplicates and sorts medication times, and validates date order', () => {
    expect(MedicationInput.parse({ name: 'X', dosage: '1', times: ['20:00', '08:00', '08:00'], startDate: '2026-09-01' }).times).toEqual(['08:00', '20:00']);
    expect(MedicationInput.safeParse({ name: 'X', dosage: '1', times: ['08:00'], startDate: '2026-09-10', endDate: '2026-09-01' }).success).toBe(false);
  });

  it('enforces a password policy', () => {
    const base = { name: 'A', email: 'a@b.co', role: 'caregiver' } as const;
    expect(RegisterInput.safeParse({ ...base, password: 'short1' }).success).toBe(false);
    expect(RegisterInput.safeParse({ ...base, password: 'longbutnodigits' }).success).toBe(false);
    expect(RegisterInput.safeParse({ ...base, password: 'correct-horse-1' }).success).toBe(true);
  });
});
