import { handler } from '@/server/http/handler';
import { discontinueMedication, updateMedication } from '@/server/services/medications';
import { MedicationInput, PatientEntityParams } from '@/lib/contracts';

export const PUT = handler({ params: PatientEntityParams, body: MedicationInput }, ({ db, actor, params, body }) =>
  updateMedication(db, actor, params.patientId, params.id, body),
);
export const DELETE = handler({ params: PatientEntityParams }, async ({ db, actor, params }) => {
  await discontinueMedication(db, actor, params.patientId, params.id);
});
