import { handler } from '@/server/http/handler';
import { nextLevel } from '@/server/services/games';
import { GameParams } from '@/lib/contracts';

export const GET = handler({ params: GameParams }, ({ db, actor, params }) =>
  nextLevel(db, actor, params.patientId, params.game),
);
