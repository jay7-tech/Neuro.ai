import { handler } from '@/server/http/handler';
import { env } from '@/server/env';
import { patientSummary } from '@/server/services/insights';
import { PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) =>
  patientSummary(db, actor, params.patientId, env().DOSE_GRACE_MINUTES),
);
