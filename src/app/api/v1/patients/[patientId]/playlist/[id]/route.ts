import { handler } from '@/server/http/handler';
import { deleteResource, updateResource } from '@/server/services/reminiscence';
import { TrackInput, PatientEntityParams } from '@/lib/contracts';

export const PUT = handler({ params: PatientEntityParams, body: TrackInput }, ({ db, actor, params, body }) =>
  updateResource(db, actor, params.patientId, 'playlist', params.id, body),
);
export const DELETE = handler({ params: PatientEntityParams }, async ({ db, actor, params }) => {
  await deleteResource(db, actor, params.patientId, 'playlist', params.id);
});
