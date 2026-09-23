import { handler } from '@/server/http/handler';
import { getPatient, updatePatient } from '@/server/services/patients';
import { PatientParams, UpdatePatientInput } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) => getPatient(db, actor, params.patientId));
export const PATCH = handler({ params: PatientParams, body: UpdatePatientInput }, ({ db, actor, params, body }) =>
  updatePatient(db, actor, params.patientId, body),
);
