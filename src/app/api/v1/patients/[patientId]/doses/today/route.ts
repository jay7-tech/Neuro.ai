import { handler } from '@/server/http/handler';
import { env } from '@/server/env';
import { todaysDoses } from '@/server/services/medications';
import { PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) =>
  todaysDoses(db, actor, params.patientId, env().DOSE_GRACE_MINUTES),
);
