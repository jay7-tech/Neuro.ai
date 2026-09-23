import { z } from 'zod';
import { handler } from '@/server/http/handler';
import { removeMember } from '@/server/services/team';
import { Uuid } from '@/lib/contracts';

const Params = z.object({ patientId: Uuid, userId: Uuid });

export const DELETE = handler({ params: Params }, async ({ db, actor, params }) => {
  await removeMember(db, actor, params.patientId, params.userId);
});
