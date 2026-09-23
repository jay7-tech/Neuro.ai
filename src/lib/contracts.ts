/**
 * API contracts shared by the server (request validation, OpenAPI generation) and the
 * client (form validation, typed fetchers). One schema, three consumers — the client
 * and server cannot drift apart.
 */
import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use 24-hour HH:MM');
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const weekdays = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'Pick at least one day')
  .max(7)
  .transform((d) => [...new Set(d)].sort());
const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const url = z.string().trim().url().max(2048);

export const Uuid = z.string().uuid();
export const PatientParams = z.object({ patientId: Uuid });
export const PatientEntityParams = z.object({ patientId: Uuid, id: Uuid });

/* ----------------------------- auth ----------------------------- */

export const Password = z
  .string()
  .min(10, 'At least 10 characters')
  .max(128)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'Use letters and at least one number');

export const RegisterInput = z.object({
  name: trimmed(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: Password,
  role: z.enum(['patient', 'caregiver', 'clinician']),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginInput>;

/* --------------------------- patients --------------------------- */

export const CreatePatientInput = z.object({
  displayName: trimmed(80),
  dateOfBirth: ymd.optional().nullable(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
  address: optionalText(300),
  medicalSummary: optionalText(2000),
  photoUrl: url.optional().nullable(),
  timezone: z.string().max(64).default('Asia/Kolkata'),
});
export type CreatePatientInput = z.infer<typeof CreatePatientInput>;

export const UpdatePatientInput = CreatePatientInput.partial();

export const GeofenceInput = z.object({
  homeLat: z.number().min(-90).max(90),
  homeLng: z.number().min(-180).max(180),
  radiusM: z.number().int().min(50).max(20_000),
});

export const CreateInviteInput = z.object({ role: z.enum(['caregiver', 'clinician']) });
export const AcceptInviteInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .transform((c) => c.replace(/[^0-9A-Z]/g, ''))
    .pipe(z.string().length(8, 'Invite codes are 8 characters')),
});

/* -------------------------- medication -------------------------- */

export const MedicationInput = z
  .object({
    name: trimmed(120),
    dosage: trimmed(80),
    instructions: optionalText(500),
    times: z
      .array(hhmm)
      .min(1, 'Add at least one time')
      .max(8)
      .transform((t) => [...new Set(t)].sort()),
    daysOfWeek: weekdays.default([0, 1, 2, 3, 4, 5, 6]),
    startDate: ymd,
    endDate: ymd.optional().nullable(),
  })
  .refine((m) => !m.endDate || m.endDate >= m.startDate, {
    message: 'End date is before start date',
    path: ['endDate'],
  });
export type MedicationInput = z.infer<typeof MedicationInput>;

export const RecordDoseInput = z.object({
  medicationId: Uuid,
  scheduledFor: z.string().datetime({ offset: true }),
  status: z.enum(['taken', 'skipped']),
});

export const AdherenceQuery = z.object({ days: z.coerce.number().int().min(1).max(90).default(14) });

/* ----------------------------- tasks ---------------------------- */

export const TaskInput = z.object({
  title: trimmed(140),
  time: hhmm,
  category: z.enum(['routine', 'meal', 'activity', 'appointment', 'social']).default('routine'),
  daysOfWeek: weekdays.default([0, 1, 2, 3, 4, 5, 6]),
});
export const CompleteTaskInput = z.object({ date: ymd.optional(), completed: z.boolean() });

/* ----------------------------- mood ----------------------------- */

export const MoodInput = z.object({ score: z.number().int().min(1).max(5), note: optionalText(500) });
export const MoodQuery = z.object({ days: z.coerce.number().int().min(1).max(180).default(30) });

/* ----------------------------- games ---------------------------- */

export const GameType = z.enum(['memory_match', 'color_match', 'sequence_memory', 'word_scramble']);
export const Level = z.enum(['easy', 'medium', 'hard']);
export const GameSessionInput = z
  .object({
    game: GameType,
    difficulty: Level,
    score: z.number().int().min(0),
    maxScore: z.number().int().min(1).max(1000),
    mistakes: z.number().int().min(0).max(10_000).default(0),
    durationMs: z
      .number()
      .int()
      .min(1_000)
      .max(60 * 60_000),
  })
  .refine((g) => g.score <= g.maxScore, { message: 'Score exceeds max score', path: ['score'] });
export const GameParams = z.object({ patientId: Uuid, game: GameType });

/* ----------------------- notes & messages ----------------------- */

export const NoteInput = z.object({ body: trimmed(10_000) });
export const MessageInput = z.object({ body: trimmed(2_000) });
export const CursorQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime({ offset: true }).optional(),
});

/* ---------------------- alerts & location ----------------------- */

export const AlertQuery = z.object({
  status: z.enum(['open', 'acknowledged', 'resolved', 'all']).default('open'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const AlertUpdateInput = z.object({ status: z.enum(['acknowledged', 'resolved']) });
export const SosInput = z.object({ message: optionalText(280) });
export const LocationPingInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(10_000).default(0),
});

/* ------------------------- reminiscence ------------------------- */

export const FamilyMemberInput = z.object({
  name: trimmed(80),
  relation: trimmed(40),
  phone: optionalText(30),
  photoUrl: url.optional().nullable(),
  message: optionalText(500),
});
export const MemoryInput = z.object({
  title: trimmed(120),
  description: optionalText(2000),
  photoUrl: url.optional().nullable(),
  occurredOn: ymd.optional().nullable(),
});
export const TrackInput = z.object({ title: trimmed(120), artist: optionalText(120), url });

/* ------------------------------ AI ------------------------------ */

export const CompanionInput = z.object({ question: trimmed(500) });
export const CaregiverTipInput = z.object({
  topic: z.enum(['Communication', 'Daily Activities', 'Safety', 'Managing Frustration', 'Self-Care']),
});
export const MedicineIdInput = z.object({
  photoDataUri: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/, 'Expected a base64 PNG, JPEG or WebP data URI')
    .max(7_000_000, 'Image too large (max ~5 MB)'),
});
