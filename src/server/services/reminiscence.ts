import { and, asc, desc, eq } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { Database, Executor } from '../db/client';
import { familyMembers, memories, playlistTracks } from '../db/schema';
import { notFound } from '../errors';
import type { Actor } from '../http/handler';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';
import { audit } from './audit';

/**
 * Family members, memories and the music playlist share identical access rules and
 * lifecycle, so one small generic repository serves all three instead of three
 * copy-pasted services.
 */
type Resource = 'family' | 'memories' | 'playlist';

const TABLES = {
  family: { table: familyMembers, order: asc(familyMembers.name) },
  memories: { table: memories, order: desc(memories.occurredOn) },
  playlist: { table: playlistTracks, order: asc(playlistTracks.position) },
} as const;

type Row<R extends Resource> = (typeof TABLES)[R]['table']['$inferSelect'];
type Insert<R extends Resource> = Omit<(typeof TABLES)[R]['table']['$inferInsert'], 'id' | 'patientId'>;

// Every table here has `id` and `patientId` columns; narrow once for the generic helpers.
type Keyed = PgTable & { id: typeof familyMembers.id; patientId: typeof familyMembers.patientId };
const t = (r: Resource) => TABLES[r].table as unknown as Keyed;

export async function listResource<R extends Resource>(
  db: Executor,
  actor: Actor,
  patientId: string,
  r: R,
): Promise<Row<R>[]> {
  await requireAccess(db, actor, patientId, 'reminiscence:read');
  const table = t(r);
  return (await db.select().from(table).where(eq(table.patientId, patientId)).orderBy(TABLES[r].order)) as Row<R>[];
}

export async function createResource<R extends Resource>(
  db: Database,
  actor: Actor,
  patientId: string,
  r: R,
  input: Insert<R>,
) {
  await requireAccess(db, actor, patientId, 'reminiscence:write');
  return db.transaction(async (tx) => {
    const extra = r === 'memories' ? { createdBy: actor.user.id } : {};
    const [row] = (await tx
      .insert(t(r))
      .values({ ...input, ...extra, patientId } as never)
      .returning()) as Row<R>[];
    await audit(tx, actor, { patientId, action: `${r}.created`, entity: r, entityId: (row as { id: string }).id });
    await publish(tx, patientId, 'reminiscence.changed');
    return row;
  });
}

export async function updateResource<R extends Resource>(
  db: Database,
  actor: Actor,
  patientId: string,
  r: R,
  id: string,
  input: Insert<R>,
) {
  await requireAccess(db, actor, patientId, 'reminiscence:write');
  return db.transaction(async (tx) => {
    const table = t(r);
    const [row] = (await tx
      .update(table)
      .set(input as never)
      .where(and(eq(table.id, id), eq(table.patientId, patientId)))
      .returning()) as Row<R>[];
    if (!row) throw notFound('Item');
    await audit(tx, actor, { patientId, action: `${r}.updated`, entity: r, entityId: id });
    await publish(tx, patientId, 'reminiscence.changed');
    return row;
  });
}

export async function deleteResource(db: Database, actor: Actor, patientId: string, r: Resource, id: string) {
  await requireAccess(db, actor, patientId, 'reminiscence:write');
  await db.transaction(async (tx) => {
    const table = t(r);
    const rows = await tx
      .delete(table)
      .where(and(eq(table.id, id), eq(table.patientId, patientId)))
      .returning({ id: table.id });
    if (!rows.length) throw notFound('Item');
    await audit(tx, actor, { patientId, action: `${r}.deleted`, entity: r, entityId: id });
    await publish(tx, patientId, 'reminiscence.changed');
  });
}
