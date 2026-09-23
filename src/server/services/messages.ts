import { and, desc, eq, lt } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { careTeamMembers, messages, users } from '../db/schema';
import type { Actor } from '../http/handler';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';

/** Keyset pagination on created_at: stable under concurrent inserts, unlike OFFSET. */
export async function listMessages(db: Executor, actor: Actor, patientId: string, q: { limit: number; before?: string }) {
  await requireAccess(db, actor, patientId, 'message:read');
  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      senderName: users.name,
      senderRole: careTeamMembers.role,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .leftJoin(careTeamMembers, and(eq(careTeamMembers.userId, messages.senderId), eq(careTeamMembers.patientId, messages.patientId)))
    .where(and(eq(messages.patientId, patientId), q.before ? lt(messages.createdAt, new Date(q.before)) : undefined))
    .orderBy(desc(messages.createdAt))
    .limit(q.limit + 1);

  const hasMore = rows.length > q.limit;
  const page = rows.slice(0, q.limit).reverse();
  return { items: page, nextCursor: hasMore ? page[0].createdAt.toISOString() : null };
}

export async function sendMessage(db: Database, actor: Actor, patientId: string, body: string) {
  await requireAccess(db, actor, patientId, 'message:send');
  return db.transaction(async (tx) => {
    const [m] = await tx.insert(messages).values({ patientId, senderId: actor.user.id, body }).returning();
    await tx
      .update(careTeamMembers)
      .set({ lastReadAt: m.createdAt })
      .where(and(eq(careTeamMembers.patientId, patientId), eq(careTeamMembers.userId, actor.user.id)));
    await publish(tx, patientId, 'message.created', m.id);
    return m;
  });
}

export async function markRead(db: Executor, actor: Actor, patientId: string) {
  await requireAccess(db, actor, patientId, 'message:read');
  await db
    .update(careTeamMembers)
    .set({ lastReadAt: new Date() })
    .where(and(eq(careTeamMembers.patientId, patientId), eq(careTeamMembers.userId, actor.user.id)));
}
