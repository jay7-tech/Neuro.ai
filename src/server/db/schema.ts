import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

/** Account-level role: decides which app surface a user lands on. */
export const userRole = pgEnum('user_role', ['patient', 'caregiver', 'clinician']);

/** Role a user holds *on a specific patient's care team*. Authorization is evaluated against this. */
export const careRole = pgEnum('care_role', ['patient', 'caregiver', 'clinician']);

export const doseStatus = pgEnum('dose_status', ['taken', 'skipped', 'missed']);

export const gameType = pgEnum('game_type', ['memory_match', 'color_match', 'sequence_memory', 'word_scramble']);
export const difficulty = pgEnum('difficulty', ['easy', 'medium', 'hard']);

export const alertType = pgEnum('alert_type', ['missed_dose', 'geofence_exit', 'mood_decline', 'sos']);
export const alertSeverity = pgEnum('alert_severity', ['info', 'warning', 'critical']);
export const alertStatus = pgEnum('alert_status', ['open', 'acknowledged', 'resolved']);

export const taskCategory = pgEnum('task_category', ['routine', 'meal', 'activity', 'appointment', 'social']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: userRole('role').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_lower_uq').on(sql`lower(${t.email})`)],
);

/**
 * Server-side sessions. The cookie carries a random 256-bit token; only its SHA-256
 * digest is stored, so a database leak does not yield usable session tokens.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(), // sha256(token), hex
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
);

/* ------------------------------------------------------------------ */
/* Patients & care teams                                               */
/* ------------------------------------------------------------------ */

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Optional: many dementia patients never log in themselves and are managed by caregivers. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    dateOfBirth: date('date_of_birth'),
    bloodGroup: text('blood_group'),
    address: text('address'),
    medicalSummary: text('medical_summary'),
    photoUrl: text('photo_url'),
    /** IANA zone; schedules are defined in the patient's local wall-clock time. */
    timezone: text('timezone').notNull().default('Asia/Kolkata'),
    homeLat: doublePrecision('home_lat'),
    homeLng: doublePrecision('home_lng'),
    geofenceRadiusM: integer('geofence_radius_m').notNull().default(300),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('patients_user_uq').on(t.userId),
    check('patients_radius_ck', sql`${t.geofenceRadiusM} BETWEEN 50 AND 20000`),
  ],
);

export const careTeamMembers = pgTable(
  'care_team_members',
  {
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: careRole('role').notNull(),
    /** Drives unread-message counts without a per-message receipts table. */
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.patientId, t.userId] }), index('care_team_user_idx').on(t.userId)],
);

/** Short-lived, single-use codes that let a caregiver or clinician join a care team. */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    role: careRole('role').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedBy: uuid('accepted_by').references(() => users.id, { onDelete: 'set null' }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('invitations_code_uq').on(t.codeHash), index('invitations_patient_idx').on(t.patientId)],
);

/* ------------------------------------------------------------------ */
/* Medication & adherence                                              */
/* ------------------------------------------------------------------ */

export const medications = pgTable(
  'medications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    dosage: text('dosage').notNull(),
    instructions: text('instructions'),
    /** Local wall-clock times, "HH:MM". */
    times: text('times').array().notNull(),
    /** 0 = Sunday … 6 = Saturday. */
    daysOfWeek: smallint('days_of_week').array().notNull().default(sql`'{0,1,2,3,4,5,6}'::smallint[]`),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    active: boolean('active').notNull().default(true),
    ...timestamps,
  },
  (t) => [index('medications_patient_idx').on(t.patientId)],
);

/**
 * One row per (medication, scheduled instant). The unique constraint makes recording
 * idempotent: a double-tap on "Taken" or a worker retry never produces duplicates.
 */
export const doseEvents = pgTable(
  'dose_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    status: doseStatus('status').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [
    uniqueIndex('dose_events_med_slot_uq').on(t.medicationId, t.scheduledFor),
    index('dose_events_patient_time_idx').on(t.patientId, t.scheduledFor),
  ],
);

/* ------------------------------------------------------------------ */
/* Daily plan                                                          */
/* ------------------------------------------------------------------ */

export const careTasks = pgTable(
  'care_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    time: text('time').notNull(), // "HH:MM" local
    category: taskCategory('category').notNull().default('routine'),
    daysOfWeek: smallint('days_of_week').array().notNull().default(sql`'{0,1,2,3,4,5,6}'::smallint[]`),
    active: boolean('active').notNull().default(true),
    ...timestamps,
  },
  (t) => [index('care_tasks_patient_idx').on(t.patientId)],
);

export const taskCompletions = pgTable(
  'task_completions',
  {
    taskId: uuid('task_id')
      .notNull()
      .references(() => careTasks.id, { onDelete: 'cascade' }),
    /** Local calendar date in the patient's timezone. */
    onDate: date('on_date').notNull(),
    completedBy: uuid('completed_by').references(() => users.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.onDate] })],
);

/* ------------------------------------------------------------------ */
/* Wellbeing & cognition                                               */
/* ------------------------------------------------------------------ */

export const moodEntries = pgTable(
  'mood_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    score: smallint('score').notNull(),
    note: text('note'),
    recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('mood_patient_time_idx').on(t.patientId, t.recordedAt),
    check('mood_score_ck', sql`${t.score} BETWEEN 1 AND 5`),
  ],
);

export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    game: gameType('game').notNull(),
    difficulty: difficulty('difficulty').notNull(),
    score: integer('score').notNull(),
    maxScore: integer('max_score').notNull(),
    mistakes: integer('mistakes').notNull().default(0),
    durationMs: integer('duration_ms').notNull(),
    /** Normalised 0..1 performance computed by the difficulty engine, stored for trend queries. */
    performance: doublePrecision('performance').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('game_sessions_patient_game_idx').on(t.patientId, t.game, t.createdAt),
    check('game_score_ck', sql`${t.score} >= 0 AND ${t.score} <= ${t.maxScore}`),
  ],
);

/* ------------------------------------------------------------------ */
/* Clinical & communication                                            */
/* ------------------------------------------------------------------ */

export const clinicalNotes = pgTable(
  'clinical_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('clinical_notes_patient_idx').on(t.patientId, t.createdAt)],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_patient_time_idx').on(t.patientId, t.createdAt)],
);

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    type: alertType('type').notNull(),
    severity: alertSeverity('severity').notNull(),
    title: text('title').notNull(),
    detail: jsonb('detail').$type<Record<string, unknown>>().notNull().default({}),
    /** Rules emit a deterministic key; at most one *open* alert may exist per key. */
    dedupeKey: text('dedupe_key').notNull(),
    status: alertStatus('status').notNull().default('open'),
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('alerts_open_dedupe_uq').on(t.patientId, t.dedupeKey).where(sql`${t.status} = 'open'`),
    index('alerts_patient_status_idx').on(t.patientId, t.status, t.createdAt),
  ],
);

export const locationPings = pgTable(
  'location_pings',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    accuracyM: doublePrecision('accuracy_m').notNull().default(0),
    distanceFromHomeM: doublePrecision('distance_from_home_m'),
    insideGeofence: boolean('inside_geofence'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('location_patient_time_idx').on(t.patientId, t.recordedAt)],
);

/* ------------------------------------------------------------------ */
/* Reminiscence content                                                */
/* ------------------------------------------------------------------ */

export const familyMembers = pgTable(
  'family_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    relation: text('relation').notNull(),
    phone: text('phone'),
    photoUrl: text('photo_url'),
    message: text('message'),
    ...timestamps,
  },
  (t) => [index('family_patient_idx').on(t.patientId)],
);

export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    photoUrl: text('photo_url'),
    occurredOn: date('occurred_on'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('memories_patient_idx').on(t.patientId)],
);

export const playlistTracks = pgTable(
  'playlist_tracks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    artist: text('artist'),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('playlist_patient_idx').on(t.patientId, t.position)],
);

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

/** Append-only record of every mutation on patient data (who, what, when). */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    requestId: text('request_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_patient_time_idx').on(t.patientId, t.createdAt)],
);

export const jobRuns = pgTable('job_runs', {
  name: text('name').primaryKey(),
  lastStartedAt: timestamp('last_started_at', { withTimezone: true }),
  lastFinishedAt: timestamp('last_finished_at', { withTimezone: true }),
  lastStatus: text('last_status'),
  lastError: text('last_error'),
  runs: integer('runs').notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type DoseEvent = typeof doseEvents.$inferSelect;
export type CareTask = typeof careTasks.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type CareRole = (typeof careRole.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];
export type GameType = (typeof gameType.enumValues)[number];
export type Difficulty = (typeof difficulty.enumValues)[number];
