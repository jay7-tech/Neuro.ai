import { handler } from '@/server/http/handler';
import { setTaskCompletion } from '@/server/services/tasks';
import { CompleteTaskInput, PatientEntityParams } from '@/lib/contracts';

export const PUT = handler({ params: PatientEntityParams, body: CompleteTaskInput }, ({ db, actor, params, body }) =>
  setTaskCompletion(db, actor, params.patientId, params.id, body),
);
