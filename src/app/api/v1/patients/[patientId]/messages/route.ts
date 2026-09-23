import { handler } from '@/server/http/handler';
import { listMessages, sendMessage } from '@/server/services/messages';
import { CursorQuery, MessageInput, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams, query: CursorQuery }, ({ db, actor, params, query }) =>
  listMessages(db, actor, params.patientId, query),
);
export const POST = handler({ params: PatientParams, body: MessageInput, status: 201 }, ({ db, actor, params, body }) =>
  sendMessage(db, actor, params.patientId, body.body),
);
