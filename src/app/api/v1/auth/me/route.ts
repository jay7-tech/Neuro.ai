import { handler } from '@/server/http/handler';
import { listMyPatients } from '@/server/services/patients';

export const GET = handler({}, async ({ db, actor }) => ({
  user: actor.user,
  patients: await listMyPatients(db, actor),
}));
