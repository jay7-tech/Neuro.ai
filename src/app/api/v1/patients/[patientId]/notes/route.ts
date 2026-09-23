import { handler } from '@/server/http/handler';
import { createNote, listNotes } from '@/server/services/notes';
import { NoteInput, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams }, ({ db, actor, params }) => listNotes(db, actor, params.patientId));
export const POST = handler({ params: PatientParams, body: NoteInput, status: 201 }, ({ db, actor, params, body }) =>
  createNote(db, actor, params.patientId, body.body),
);
