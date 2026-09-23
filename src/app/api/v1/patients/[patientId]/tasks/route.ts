import { handler } from '@/server/http/handler';
import { createTask, listTasks } from '@/server/services/tasks';
import { PatientParams, TaskInput } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) => listTasks(db, actor, params.patientId));
export const POST = handler({ params: PatientParams, body: TaskInput, status: 201 }, ({ db, actor, params, body }) =>
  createTask(db, actor, params.patientId, body),
);
