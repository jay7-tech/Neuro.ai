import { handler } from '@/server/http/handler';
import { markRead } from '@/server/services/messages';
import { PatientParams } from '@/lib/contracts';

export const POST = handler({ params: PatientParams }, async ({ db, actor, params }) => {
  await markRead(db, actor, params.patientId);
});
