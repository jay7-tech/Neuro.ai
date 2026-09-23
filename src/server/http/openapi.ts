import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z, type ZodTypeAny } from 'zod';
import * as C from '@/lib/contracts';

extendZodWithOpenApi(z);

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
type Route = {
  method: Method;
  path: string;
  summary: string;
  tag: string;
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  auth?: boolean;
};

const P = '/api/v1/patients/{patientId}';

/** Route table for documentation. Handlers validate with the very same schemas. */
const ROUTES: Route[] = [
  {
    method: 'post',
    path: '/api/v1/auth/register',
    summary: 'Create an account and start a session',
    tag: 'Auth',
    body: C.RegisterInput,
    auth: false,
  },
  {
    method: 'post',
    path: '/api/v1/auth/login',
    summary: 'Start a session',
    tag: 'Auth',
    body: C.LoginInput,
    auth: false,
  },
  { method: 'post', path: '/api/v1/auth/logout', summary: 'End the current session', tag: 'Auth' },
  { method: 'get', path: '/api/v1/auth/me', summary: 'Current user and their patients', tag: 'Auth' },
  {
    method: 'get',
    path: '/api/v1/patients',
    summary: 'Patients on my care teams (with unread/alert badges)',
    tag: 'Patients',
  },
  {
    method: 'post',
    path: '/api/v1/patients',
    summary: 'Create a patient profile (caregivers)',
    tag: 'Patients',
    body: C.CreatePatientInput,
  },
  { method: 'get', path: P, summary: 'Patient profile', tag: 'Patients' },
  { method: 'patch', path: P, summary: 'Update patient profile', tag: 'Patients', body: C.UpdatePatientInput },
  {
    method: 'put',
    path: `${P}/geofence`,
    summary: 'Configure home location and safe-zone radius',
    tag: 'Location',
    body: C.GeofenceInput,
  },
  { method: 'get', path: `${P}/team`, summary: 'Care team members', tag: 'Care team' },
  {
    method: 'post',
    path: `${P}/team/invites`,
    summary: 'Create a single-use invite code (72 h)',
    tag: 'Care team',
    body: C.CreateInviteInput,
  },
  { method: 'delete', path: `${P}/team/{userId}`, summary: 'Remove a member (or leave)', tag: 'Care team' },
  {
    method: 'post',
    path: '/api/v1/invites/accept',
    summary: 'Join a care team with an invite code',
    tag: 'Care team',
    body: C.AcceptInviteInput,
  },
  { method: 'get', path: `${P}/medications`, summary: 'Medication list', tag: 'Medication' },
  {
    method: 'post',
    path: `${P}/medications`,
    summary: 'Add a medication schedule',
    tag: 'Medication',
    body: C.MedicationInput,
  },
  {
    method: 'put',
    path: `${P}/medications/{id}`,
    summary: 'Update a medication schedule',
    tag: 'Medication',
    body: C.MedicationInput,
  },
  {
    method: 'delete',
    path: `${P}/medications/{id}`,
    summary: 'Discontinue a medication (history kept)',
    tag: 'Medication',
  },
  {
    method: 'get',
    path: `${P}/doses/today`,
    summary: "Today's doses with live state (upcoming/due/taken/late/missed)",
    tag: 'Medication',
  },
  {
    method: 'post',
    path: `${P}/doses`,
    summary: 'Record a dose as taken/skipped (idempotent per slot)',
    tag: 'Medication',
    body: C.RecordDoseInput,
  },
  {
    method: 'get',
    path: `${P}/adherence`,
    summary: 'Adherence report: rate, on-time rate, streak, daily series',
    tag: 'Medication',
    query: C.AdherenceQuery,
  },
  { method: 'get', path: `${P}/plan`, summary: 'Daily plan for a date with completion state', tag: 'Daily plan' },
  { method: 'get', path: `${P}/tasks`, summary: 'Recurring tasks', tag: 'Daily plan' },
  { method: 'post', path: `${P}/tasks`, summary: 'Create a recurring task', tag: 'Daily plan', body: C.TaskInput },
  { method: 'put', path: `${P}/tasks/{id}`, summary: 'Update a task', tag: 'Daily plan', body: C.TaskInput },
  { method: 'delete', path: `${P}/tasks/{id}`, summary: 'Remove a task', tag: 'Daily plan' },
  {
    method: 'put',
    path: `${P}/tasks/{id}/completion`,
    summary: 'Mark a task done/undone for a date',
    tag: 'Daily plan',
    body: C.CompleteTaskInput,
  },
  {
    method: 'get',
    path: `${P}/mood`,
    summary: 'Mood analytics: daily averages, trend, decline detection',
    tag: 'Wellbeing',
    query: C.MoodQuery,
  },
  { method: 'post', path: `${P}/mood`, summary: 'Record a mood check-in', tag: 'Wellbeing', body: C.MoodInput },
  {
    method: 'get',
    path: `${P}/games`,
    summary: 'Game engagement and weekly performance',
    tag: 'Cognitive games',
    query: C.MoodQuery,
  },
  {
    method: 'post',
    path: `${P}/games`,
    summary: 'Record a game session; returns next-level recommendation',
    tag: 'Cognitive games',
    body: C.GameSessionInput,
  },
  {
    method: 'get',
    path: `${P}/games/{game}/next`,
    summary: 'Recommended difficulty for the next round',
    tag: 'Cognitive games',
  },
  { method: 'get', path: `${P}/notes`, summary: 'Clinical notes', tag: 'Clinical' },
  {
    method: 'post',
    path: `${P}/notes`,
    summary: 'Add a clinical note (clinicians)',
    tag: 'Clinical',
    body: C.NoteInput,
  },
  { method: 'patch', path: `${P}/notes/{id}`, summary: 'Edit own note', tag: 'Clinical', body: C.NoteInput },
  { method: 'delete', path: `${P}/notes/{id}`, summary: 'Soft-delete own note', tag: 'Clinical' },
  { method: 'get', path: `${P}/insights`, summary: 'Clinician summary with automatic risk flags', tag: 'Clinical' },
  {
    method: 'get',
    path: `${P}/messages`,
    summary: 'Care-team chat (keyset pagination)',
    tag: 'Messaging',
    query: C.CursorQuery,
  },
  { method: 'post', path: `${P}/messages`, summary: 'Send a message', tag: 'Messaging', body: C.MessageInput },
  { method: 'post', path: `${P}/messages/read`, summary: 'Mark conversation read', tag: 'Messaging' },
  { method: 'get', path: `${P}/events`, summary: 'Server-Sent Events stream of patient events', tag: 'Realtime' },
  { method: 'get', path: `${P}/alerts`, summary: 'Alerts', tag: 'Alerts', query: C.AlertQuery },
  {
    method: 'patch',
    path: `${P}/alerts/{id}`,
    summary: 'Acknowledge or resolve an alert',
    tag: 'Alerts',
    body: C.AlertUpdateInput,
  },
  { method: 'post', path: `${P}/sos`, summary: 'Patient help button', tag: 'Alerts', body: C.SosInput },
  { method: 'get', path: `${P}/location`, summary: 'Geofence, latest position and history', tag: 'Location' },
  {
    method: 'post',
    path: `${P}/location`,
    summary: 'Report a location ping (debounced geofence evaluation)',
    tag: 'Location',
    body: C.LocationPingInput,
  },
  ...(['family', 'memories', 'playlist'] as const).flatMap((r) => {
    const body = r === 'family' ? C.FamilyMemberInput : r === 'memories' ? C.MemoryInput : C.TrackInput;
    return [
      { method: 'get' as const, path: `${P}/${r}`, summary: `List ${r}`, tag: 'Reminiscence' },
      { method: 'post' as const, path: `${P}/${r}`, summary: `Add to ${r}`, tag: 'Reminiscence', body },
      { method: 'put' as const, path: `${P}/${r}/{id}`, summary: `Update ${r} item`, tag: 'Reminiscence', body },
      { method: 'delete' as const, path: `${P}/${r}/{id}`, summary: `Delete ${r} item`, tag: 'Reminiscence' },
    ];
  }),
  {
    method: 'post',
    path: `${P}/companion`,
    summary: 'Ask the grounded AI companion',
    tag: 'AI',
    body: C.CompanionInput,
  },
  {
    method: 'post',
    path: `${P}/medicine-check`,
    summary: 'Identify a pack from a photo and cross-check against prescriptions',
    tag: 'AI',
    body: C.MedicineIdInput,
  },
  {
    method: 'post',
    path: '/api/v1/ai/caregiver-tip',
    summary: 'A practical caregiving tip',
    tag: 'AI',
    body: C.CaregiverTipInput,
  },
  { method: 'get', path: `${P}/audit`, summary: 'Audit trail of changes to this patient', tag: 'Audit' },
];

const ErrorEnvelope = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional(), requestId: z.string() }),
});

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();
  registry.registerComponent('securitySchemes', 'session', { type: 'apiKey', in: 'cookie', name: 'neuro_session' });
  const errorRef = registry.register('Error', ErrorEnvelope);

  for (const r of ROUTES) {
    const pathParams = [...r.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    registry.registerPath({
      method: r.method,
      path: r.path,
      summary: r.summary,
      tags: [r.tag],
      security: r.auth === false ? [] : [{ session: [] }],
      request: {
        params: pathParams.length ? z.object(Object.fromEntries(pathParams.map((p) => [p, z.string()]))) : undefined,
        query: r.query as z.AnyZodObject | undefined,
        body: r.body ? { content: { 'application/json': { schema: r.body } } } : undefined,
      },
      responses: {
        200: { description: 'Success — `{ data: ... }`' },
        401: { description: 'Not signed in', content: { 'application/json': { schema: errorRef } } },
        403: { description: 'Role not permitted', content: { 'application/json': { schema: errorRef } } },
        404: {
          description: 'Not found or not on this care team',
          content: { 'application/json': { schema: errorRef } },
        },
        422: { description: 'Validation failed', content: { 'application/json': { schema: errorRef } } },
        429: { description: 'Rate limited', content: { 'application/json': { schema: errorRef } } },
      },
    });
  }

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Neuro-AI API',
      version: '1.0.0',
      description: 'Care-coordination API for patients living with dementia, their caregivers and clinicians.',
    },
    servers: [{ url: '/' }],
  });
}
