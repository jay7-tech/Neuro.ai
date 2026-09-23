import { z } from 'zod';
import { handler } from '@/server/http/handler';
import { requireAccess } from '@/server/services/access';
import { listAudit } from '@/server/services/audit';
import { PatientParams } from '@/lib/contracts';

const Query = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.coerce.number().int().optional(),
});

export const GET = handler({ params: PatientParams, query: Query }, async ({ db, actor, params, query }) => {
  await requireAccess(db, actor, params.patientId, 'audit:read');
  return listAudit(db, params.patientId, query);
});
