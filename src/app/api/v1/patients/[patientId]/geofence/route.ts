import { handler } from '@/server/http/handler';
import { configureGeofence } from '@/server/services/patients';
import { GeofenceInput, PatientParams } from '@/lib/contracts';

export const PUT = handler({ params: PatientParams, body: GeofenceInput }, ({ db, actor, params, body }) =>
  configureGeofence(db, actor, params.patientId, body),
);
