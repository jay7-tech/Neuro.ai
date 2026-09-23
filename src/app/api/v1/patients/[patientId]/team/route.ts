import { handler } from '@/server/http/handler';
import { listTeam } from '@/server/services/team';
import { PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) => listTeam(db, actor, params.patientId));
