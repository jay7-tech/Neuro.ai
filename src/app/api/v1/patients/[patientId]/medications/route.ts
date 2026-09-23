import { z } from 'zod';
import { handler } from '@/server/http/handler';
import { createMedication, listMedications } from '@/server/services/medications';
import { MedicationInput, PatientParams } from '@/lib/contracts';

const Query = z.object({ includeInactive: z.enum(['true', 'false']).default('false') });

export const GET = handler({ params: PatientParams, query: Query }, ({ db, actor, params, query }) =>
  listMedications(db, actor, params.patientId, query.includeInactive === 'true'),
);
export const POST = handler({ params: PatientParams, body: MedicationInput, status: 201 }, ({ db, actor, params, body }) =>
  createMedication(db, actor, params.patientId, body),
);
