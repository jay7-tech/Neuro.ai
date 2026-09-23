import { and, desc, eq, lt } from 'drizzle-orm';
import type { Executor } from '../db/client';
import { auditLogs, users } from '../db/schema';
import type { Actor } from '../http/handler';

export type AuditEntry = {
  patientId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Written on the same executor as the change, so the audit row commits or rolls back with it. */
export async function audit(db: Executor, actor: Actor | null, entry: AuditEntry): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: actor?.user.id ?? null,
    patientId: entry.patientId ?? null,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    requestId: actor?.requestId ?? null,
  });
}

export async function listAudit(db: Executor, patientId: string, opts: { limit: number; before?: number }) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(and(eq(auditLogs.patientId, patientId), opts.before ? lt(auditLogs.id, opts.before) : undefined))
    .orderBy(desc(auditLogs.id))
    .limit(opts.limit);
}
