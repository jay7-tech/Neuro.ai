/**
 * Response types derived directly from the service layer's return types.
 * `import type` is erased at compile time, so no server code reaches the browser,
 * yet a change to a service's return shape breaks the client build — end-to-end
 * type safety without a code generator.
 */
import type * as Patients from '@/server/services/patients';
import type * as Meds from '@/server/services/medications';
import type * as Tasks from '@/server/services/tasks';
import type * as Mood from '@/server/services/mood';
import type * as Games from '@/server/services/games';
import type * as Notes from '@/server/services/notes';
import type * as Messages from '@/server/services/messages';
import type * as Alerts from '@/server/services/alerts';
import type * as Location from '@/server/services/location';
import type * as Team from '@/server/services/team';
import type * as Insights from '@/server/services/insights';
import type * as Assistant from '@/server/services/assistant';
import type * as Audit from '@/server/services/audit';
import type { SessionUser } from '@/server/auth/session';
import type { Recommendation } from '@/server/domain/difficulty';
import type { familyMembers, memories, playlistTracks, medications, careTasks } from '@/server/db/schema';

/** What JSON.stringify does to a value: Dates become strings, recursively. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

type R<F extends (...args: never[]) => unknown> = Jsonify<Awaited<ReturnType<F>>>;

export type Me = { user: SessionUser; patients: PatientListItem[] };
export type PatientListItem = R<typeof Patients.listMyPatients>[number];
export type PatientDetail = R<typeof Patients.getPatient>;
export type Medication = Jsonify<typeof medications.$inferSelect>;
export type TodayDoses = R<typeof Meds.todaysDoses>;
export type DoseItem = TodayDoses['doses'][number];
export type Adherence = R<typeof Meds.adherence>;
export type Task = Jsonify<typeof careTasks.$inferSelect>;
export type DayPlan = R<typeof Tasks.planForDay>;
export type MoodAnalytics = R<typeof Mood.moodAnalytics>;
export type GameStats = R<typeof Games.gameStats>;
export type GameResult = R<typeof Games.recordSession>;
export type LevelRecommendation = Recommendation;
export type Note = R<typeof Notes.listNotes>[number];
export type MessagePage = R<typeof Messages.listMessages>;
export type ChatMessage = MessagePage['items'][number];
export type AlertItem = R<typeof Alerts.listAlerts>[number];
export type LocationStatus = R<typeof Location.locationStatus>;
export type TeamMember = R<typeof Team.listTeam>[number];
export type Invite = R<typeof Team.createInvite>;
export type Summary = R<typeof Insights.patientSummary>;
export type CompanionReply = R<typeof Assistant.askCompanion>;
export type MedicineCheck = R<typeof Assistant.checkMedicine>;
export type AuditEntry = R<typeof Audit.listAudit>[number];
export type FamilyMember = Jsonify<typeof familyMembers.$inferSelect>;
export type Memory = Jsonify<typeof memories.$inferSelect>;
export type Track = Jsonify<typeof playlistTracks.$inferSelect>;
