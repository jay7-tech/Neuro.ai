import { handler } from '@/server/http/handler';
import { locationStatus, reportLocation } from '@/server/services/location';
import { LocationPingInput, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) => locationStatus(db, actor, params.patientId));
export const POST = handler({ params: PatientParams, body: LocationPingInput, status: 201 }, ({ db, actor, params, body }) =>
  reportLocation(db, actor, params.patientId, body),
);
