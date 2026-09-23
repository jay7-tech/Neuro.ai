import { eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { careTeamMembers, patients, users } from '../db/schema';
import { conflict, AppError } from '../errors';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSession, type SessionUser } from '../auth/session';
import type { LoginInput, RegisterInput } from '@/lib/contracts';
import { audit } from './audit';

type SessionMeta = { ttlDays: number; userAgent?: string | null; ip?: string | null };

export async function register(db: Database, input: RegisterInput, meta: SessionMeta) {
  const passwordHash = await hashPassword(input.password);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${input.email.toLowerCase()}`)
      .limit(1);
    if (existing) throw conflict('An account with this email already exists');

    const [user] = await tx
      .insert(users)
      .values({ email: input.email, passwordHash, name: input.name, role: input.role })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    // A patient account owns its own patient record from day one.
    if (input.role === 'patient') {
      const [patient] = await tx
        .insert(patients)
        .values({ userId: user.id, displayName: input.name })
        .returning({ id: patients.id });
      await tx.insert(careTeamMembers).values({ patientId: patient.id, userId: user.id, role: 'patient' });
    }

    await audit(tx, null, { action: 'user.registered', entity: 'user', entityId: user.id, metadata: { role: user.role } });
    const session = await createSession(tx, user.id, meta);
    return { user: user satisfies SessionUser, ...session };
  });
}

export async function login(db: Database, input: LoginInput, meta: SessionMeta) {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${input.email.toLowerCase()}`)
    .limit(1);

  // verifyPassword runs a full bcrypt compare even when the user does not exist.
  const ok = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !ok) throw new AppError('UNAUTHENTICATED', 'Incorrect email or password');

  const session = await createSession(db, user.id, meta);
  await audit(db, null, { action: 'user.login', entity: 'user', entityId: user.id });
  const { id, email, name, role } = user;
  return { user: { id, email, name, role } satisfies SessionUser, ...session };
}

export async function getUser(db: Database, id: string): Promise<SessionUser | null> {
  const [u] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, id));
  return u ?? null;
}
