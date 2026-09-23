import { z } from 'zod';
import { handler } from '@/server/http/handler';
import { planForDay } from '@/server/services/tasks';
import { PatientParams } from '@/lib/contracts';

const Query = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const GET = handler({ params: PatientParams, query: Query }, ({ db, actor, params, query }) =>
  planForDay(db, actor, params.patientId, query.date),
);
