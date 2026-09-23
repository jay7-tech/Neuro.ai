import { handler } from '@/server/http/handler';
import { acceptInvite } from '@/server/services/team';
import { AcceptInviteInput } from '@/lib/contracts';

export const POST = handler({ body: AcceptInviteInput, rateLimit: 'auth' }, ({ db, actor, body }) =>
  acceptInvite(db, actor, body.code),
);
