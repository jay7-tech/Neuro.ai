import { handler } from '@/server/http/handler';
import { checkMedicine } from '@/server/services/assistant';
import { MedicineIdInput, PatientParams } from '@/lib/contracts';

export const POST = handler(
  { params: PatientParams, body: MedicineIdInput, rateLimit: 'ai' },
  ({ db, actor, params, body }) => checkMedicine(db, actor, params.patientId, body.photoDataUri),
);
