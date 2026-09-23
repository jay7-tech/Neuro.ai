import { handler } from '@/server/http/handler';
import { listAlerts } from '@/server/services/alerts';
import { AlertQuery, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams, query: AlertQuery }, ({ db, actor, params, query }) =>
  listAlerts(db, actor, params.patientId, query),
);
