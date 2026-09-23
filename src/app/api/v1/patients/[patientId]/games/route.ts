import { handler } from '@/server/http/handler';
import { gameStats, recordSession } from '@/server/services/games';
import { GameSessionInput, MoodQuery, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams, query: MoodQuery }, ({ db, actor, params, query }) =>
  gameStats(db, actor, params.patientId, query.days),
);
export const POST = handler({ params: PatientParams, body: GameSessionInput, status: 201 }, ({ db, actor, params, body }) =>
  recordSession(db, actor, params.patientId, body),
);
