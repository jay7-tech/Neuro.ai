import { handler } from '@/server/http/handler';
import { env } from '@/server/env';
import { askCompanion } from '@/server/services/assistant';
import { CompanionInput, PatientParams } from '@/lib/contracts';

export const POST = handler(
  { params: PatientParams, body: CompanionInput, rateLimit: 'ai' },
  ({ db, actor, params, body }) => askCompanion(db, actor, params.patientId, body.question, env().DOSE_GRACE_MINUTES),
);
