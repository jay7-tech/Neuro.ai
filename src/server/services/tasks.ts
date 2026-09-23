import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { careTasks, patients, taskCompletions } from '../db/schema';
import { badRequest, notFound } from '../errors';
import type { Actor } from '../http/handler';
import { addDays, localDate, weekdayOf } from '../domain/time';
import { publish } from '../realtime/bus';
import type { z } from 'zod';
import type { TaskInput } from '@/lib/contracts';
import { requireAccess } from './access';
import { audit } from './audit';

type Task = z.infer<typeof TaskInput>;

async function tzOf(db: Executor, patientId: string) {
  const [p] = await db.select({ tz: patients.timezone }).from(patients).where(eq(patients.id, patientId));
  if (!p) throw notFound('Patient');
  return p.tz;
}

export async function listTasks(db: Executor, actor: Actor, patientId: string) {
  await requireAccess(db, actor, patientId, 'task:read');
  return db
    .select()
    .from(careTasks)
    .where(and(eq(careTasks.patientId, patientId), eq(careTasks.active, true)))
    .orderBy(asc(careTasks.time));
}

/** The daily plan for one local date, with completion state. */
export async function planForDay(db: Executor, actor: Actor, patientId: string, date?: string) {
  await requireAccess(db, actor, patientId, 'task:read');
  const tz = await tzOf(db, patientId);
  const day = date ?? localDate(new Date(), tz);
  const dow = weekdayOf(day);

  const tasks = (
    await db
      .select()
      .from(careTasks)
      .where(and(eq(careTasks.patientId, patientId), eq(careTasks.active, true)))
      .orderBy(asc(careTasks.time))
  ).filter((t) => t.daysOfWeek.includes(dow));

  const done = tasks.length
    ? await db
        .select()
        .from(taskCompletions)
        .where(and(inArray(taskCompletions.taskId, tasks.map((t) => t.id)), eq(taskCompletions.onDate, day)))
    : [];
  const doneById = new Map(done.map((d) => [d.taskId, d.completedAt]));

  return {
    date: day,
    items: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      time: t.time,
      category: t.category,
      completed: doneById.has(t.id),
      completedAt: doneById.get(t.id)?.toISOString() ?? null,
    })),
  };
}

export async function createTask(db: Database, actor: Actor, patientId: string, input: Task) {
  await requireAccess(db, actor, patientId, 'task:write');
  return db.transaction(async (tx) => {
    const [t] = await tx.insert(careTasks).values({ ...input, patientId }).returning();
    await audit(tx, actor, { patientId, action: 'task.created', entity: 'care_task', entityId: t.id });
    await publish(tx, patientId, 'task.changed', t.id);
    return t;
  });
}

export async function updateTask(db: Database, actor: Actor, patientId: string, id: string, input: Task) {
  await requireAccess(db, actor, patientId, 'task:write');
  return db.transaction(async (tx) => {
    const [t] = await tx
      .update(careTasks)
      .set(input)
      .where(and(eq(careTasks.id, id), eq(careTasks.patientId, patientId)))
      .returning();
    if (!t) throw notFound('Task');
    await audit(tx, actor, { patientId, action: 'task.updated', entity: 'care_task', entityId: id });
    await publish(tx, patientId, 'task.changed', id);
    return t;
  });
}

export async function deleteTask(db: Database, actor: Actor, patientId: string, id: string) {
  await requireAccess(db, actor, patientId, 'task:write');
  await db.transaction(async (tx) => {
    const [t] = await tx
      .update(careTasks)
      .set({ active: false })
      .where(and(eq(careTasks.id, id), eq(careTasks.patientId, patientId)))
      .returning({ id: careTasks.id });
    if (!t) throw notFound('Task');
    await audit(tx, actor, { patientId, action: 'task.deleted', entity: 'care_task', entityId: id });
    await publish(tx, patientId, 'task.changed', id);
  });
}

export async function setTaskCompletion(
  db: Database,
  actor: Actor,
  patientId: string,
  id: string,
  input: { date?: string; completed: boolean },
) {
  await requireAccess(db, actor, patientId, 'task:complete');
  const tz = await tzOf(db, patientId);
  const today = localDate(new Date(), tz);
  const day = input.date ?? today;
  // Allow correcting yesterday, but not ticking off the future.
  if (day > today || day < addDays(today, -1)) throw badRequest('Tasks can only be completed for today or yesterday');

  await db.transaction(async (tx) => {
    const [t] = await tx.select({ id: careTasks.id }).from(careTasks).where(and(eq(careTasks.id, id), eq(careTasks.patientId, patientId)));
    if (!t) throw notFound('Task');
    if (input.completed) {
      await tx.insert(taskCompletions).values({ taskId: id, onDate: day, completedBy: actor.user.id }).onConflictDoNothing();
    } else {
      await tx.delete(taskCompletions).where(and(eq(taskCompletions.taskId, id), eq(taskCompletions.onDate, day)));
    }
    await publish(tx, patientId, 'task.changed', id);
  });
  return { taskId: id, date: day, completed: input.completed };
}
