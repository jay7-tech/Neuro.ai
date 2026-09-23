import { handler } from '@/server/http/handler';
import { createResource, listResource } from '@/server/services/reminiscence';
import { FamilyMemberInput, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) => listResource(db, actor, params.patientId, 'family'));
export const POST = handler({ params: PatientParams, body: FamilyMemberInput, status: 201 }, ({ db, actor, params, body }) =>
  createResource(db, actor, params.patientId, 'family', body),
);
