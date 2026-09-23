import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { clinicalNotes, users } from '../db/schema';
import { forbidden, notFound } from '../errors';
import type { Actor } from '../http/handler';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';
import { audit } from './audit';

export async function listNotes(db: Executor, actor: Actor, patientId: string) {
  await requireAccess(db, actor, patientId, 'note:read');
  return db
    .select({
      id: clinicalNotes.id,
      body: clinicalNotes.body,
      createdAt: clinicalNotes.createdAt,
      updatedAt: clinicalNotes.updatedAt,
      authorId: clinicalNotes.authorId,
      authorName: users.name,
    })
    .from(clinicalNotes)
    .innerJoin(users, eq(users.id, clinicalNotes.authorId))
    .where(and(eq(clinicalNotes.patientId, patientId), isNull(clinicalNotes.deletedAt)))
    .orderBy(desc(clinicalNotes.createdAt));
}

export async function createNote(db: Database, actor: Actor, patientId: string, body: string) {
  await requireAccess(db, actor, patientId, 'note:write');
  return db.transaction(async (tx) => {
    const [n] = await tx.insert(clinicalNotes).values({ patientId, authorId: actor.user.id, body }).returning();
    await audit(tx, actor, { patientId, action: 'note.created', entity: 'clinical_note', entityId: n.id });
    await publish(tx, patientId, 'note.changed', n.id);
    return n;
  });
}

/** Clinical notes are editable only by their author, and deletion is soft (medico-legal record). */
async function ownNote(db: Executor, actor: Actor, patientId: string, id: string) {
  const [n] = await db
    .select()
    .from(clinicalNotes)
    .where(and(eq(clinicalNotes.id, id), eq(clinicalNotes.patientId, patientId), isNull(clinicalNotes.deletedAt)))
    .for('update');
  if (!n) throw notFound('Note');
  if (n.authorId !== actor.user.id) throw forbidden('Only the author can change a clinical note');
  return n;
}

export async function updateNote(db: Database, actor: Actor, patientId: string, id: string, body: string) {
  await requireAccess(db, actor, patientId, 'note:write');
  return db.transaction(async (tx) => {
    const before = await ownNote(tx, actor, patientId, id);
    const [n] = await tx.update(clinicalNotes).set({ body }).where(eq(clinicalNotes.id, id)).returning();
    await audit(tx, actor, { patientId, action: 'note.updated', entity: 'clinical_note', entityId: id, metadata: { previousLength: before.body.length } });
    await publish(tx, patientId, 'note.changed', id);
    return n;
  });
}

export async function deleteNote(db: Database, actor: Actor, patientId: string, id: string) {
  await requireAccess(db, actor, patientId, 'note:write');
  await db.transaction(async (tx) => {
    await ownNote(tx, actor, patientId, id);
    await tx.update(clinicalNotes).set({ deletedAt: new Date() }).where(eq(clinicalNotes.id, id));
    await audit(tx, actor, { patientId, action: 'note.deleted', entity: 'clinical_note', entityId: id });
    await publish(tx, patientId, 'note.changed', id);
  });
}
