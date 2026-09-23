import { handler } from '@/server/http/handler';
import { deleteResource, updateResource } from '@/server/services/reminiscence';
import { FamilyMemberInput, PatientEntityParams } from '@/lib/contracts';

export const PUT = handler({ params: PatientEntityParams, body: FamilyMemberInput }, ({ db, actor, params, body }) =>
  updateResource(db, actor, params.patientId, 'family', params.id, body),
);
export const DELETE = handler({ params: PatientEntityParams }, async ({ db, actor, params }) => {
  await deleteResource(db, actor, params.patientId, 'family', params.id);
});
