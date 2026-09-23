import { handler } from '@/server/http/handler';
import { raiseSos } from '@/server/services/alerts';
import { PatientParams, SosInput } from '@/lib/contracts';

export const POST = handler({ params: PatientParams, body: SosInput, status: 201 }, ({ db, actor, params, body }) =>
  raiseSos(db, actor, params.patientId, body.message),
);
