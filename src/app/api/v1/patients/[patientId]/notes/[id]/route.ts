import { handler } from '@/server/http/handler';
import { deleteNote, updateNote } from '@/server/services/notes';
import { NoteInput, PatientEntityParams } from '@/lib/contracts';

export const PATCH = handler({ params: PatientEntityParams, body: NoteInput }, ({ db, actor, params, body }) =>
  updateNote(db, actor, params.patientId, params.id, body.body),
);
export const DELETE = handler({ params: PatientEntityParams }, async ({ db, actor, params }) => {
  await deleteNote(db, actor, params.patientId, params.id);
});
