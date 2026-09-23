import { handler } from '@/server/http/handler';
import { createInvite } from '@/server/services/team';
import { CreateInviteInput, PatientParams } from '@/lib/contracts';

export const POST = handler({ params: PatientParams, body: CreateInviteInput, status: 201 }, ({ db, actor, params, body }) =>
  createInvite(db, actor, params.patientId, body.role),
);
