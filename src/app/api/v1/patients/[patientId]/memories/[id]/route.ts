import { handler } from '@/server/http/handler';
import { deleteResource, updateResource } from '@/server/services/reminiscence';
import { MemoryInput, PatientEntityParams } from '@/lib/contracts';

export const PUT = handler({ params: PatientEntityParams, body: MemoryInput }, ({ db, actor, params, body }) =>
  updateResource(db, actor, params.patientId, 'memories', params.id, body),
);
export const DELETE = handler({ params: PatientEntityParams }, async ({ db, actor, params }) => {
  await deleteResource(db, actor, params.patientId, 'memories', params.id);
});
