import { handler } from '@/server/http/handler';
import { moodAnalytics, recordMood } from '@/server/services/mood';
import { MoodInput, MoodQuery, PatientParams } from '@/lib/contracts';

export const GET = handler({ params: PatientParams, query: MoodQuery }, ({ db, actor, params, query }) =>
  moodAnalytics(db, actor, params.patientId, query.days),
);
export const POST = handler({ params: PatientParams, body: MoodInput, status: 201 }, ({ db, actor, params, body }) =>
  recordMood(db, actor, params.patientId, body),
);
