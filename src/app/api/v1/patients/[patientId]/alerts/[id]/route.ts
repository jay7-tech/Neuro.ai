import { handler } from '@/server/http/handler';
import { updateAlertStatus } from '@/server/services/alerts';
import { AlertUpdateInput, PatientEntityParams } from '@/lib/contracts';

export const PATCH = handler({ params: PatientEntityParams, body: AlertUpdateInput }, ({ db, actor, params, body }) =>
  updateAlertStatus(db, actor, params.patientId, params.id, body.status),
);
