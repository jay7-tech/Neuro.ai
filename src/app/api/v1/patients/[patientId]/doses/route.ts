import { handler } from '@/server/http/handler';
import { recordDose } from '@/server/services/medications';
import { PatientParams, RecordDoseInput } from '@/lib/contracts';

export const POST = handler({ params: PatientParams, body: RecordDoseInput, status: 201 }, ({ db, actor, params, body }) =>
  recordDose(db, actor, params.patientId, body),
);
