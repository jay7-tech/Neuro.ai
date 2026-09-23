import { handler } from '@/server/http/handler';
import { env } from '@/server/env';
import { adherence } from '@/server/services/medications';
import { AdherenceQuery, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams, query: AdherenceQuery }, ({ db, actor, params, query }) =>
  adherence(db, actor, params.patientId, query.days, env().DOSE_GRACE_MINUTES),
);
