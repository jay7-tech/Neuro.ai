/**
 * Domain events broadcast to a patient's care team. Payloads are deliberately small
 * (ids, not documents): Postgres NOTIFY caps payloads at 8 kB, and clients refetch
 * through the normal authorised API anyway, so events never leak data by themselves.
 */
export type PatientEventType =
  | 'message.created'
  | 'alert.created'
  | 'alert.updated'
  | 'dose.recorded'
  | 'medication.changed'
  | 'task.changed'
  | 'mood.recorded'
  | 'note.changed'
  | 'location.updated'
  | 'reminiscence.changed'
  | 'team.changed'
  | 'patient.updated'
  | 'game.completed';

export type PatientEvent = { patientId: string; type: PatientEventType; id?: string; at: string };

export const EVENTS_CHANNEL = 'neuro_patient_events';
