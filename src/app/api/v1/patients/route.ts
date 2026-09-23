import { handler } from '@/server/http/handler';
import { createPatient, listMyPatients } from '@/server/services/patients';
import { CreatePatientInput } from '@/lib/contracts';

export const GET = handler({}, ({ db, actor }) => listMyPatients(db, actor));
export const POST = handler({ body: CreatePatientInput, status: 201 }, ({ db, actor, body }) => createPatient(db, actor, body));
