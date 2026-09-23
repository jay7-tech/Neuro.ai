import { handler } from '@/server/http/handler';
import { deleteTask, updateTask } from '@/server/services/tasks';
import { PatientEntityParams, TaskInput } from '@/lib/contracts';

export const PUT = handler({ params: PatientEntityParams, body: TaskInput }, ({ db, actor, params, body }) =>
  updateTask(db, actor, params.patientId, params.id, body),
);
export const DELETE = handler({ params: PatientEntityParams }, async ({ db, actor, params }) => {
  await deleteTask(db, actor, params.patientId, params.id);
});
