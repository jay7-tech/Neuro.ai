'use client';

import { useEffect, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { PatientEvent, PatientEventType } from '@/server/realtime/events';
import { qk } from './api/keys';

/** Which cached queries each server event makes stale. */
const INVALIDATES: Record<PatientEventType, (id: string) => QueryKey[]> = {
  'message.created': (id) => [qk.messages(id), qk.me],
  'alert.created': (id) => [['patient', id, 'alerts'], qk.me, qk.insights(id)],
  'alert.updated': (id) => [['patient', id, 'alerts'], qk.me],
  'dose.recorded': (id) => [qk.doses(id), ['patient', id, 'adherence']],
  'medication.changed': (id) => [qk.medications(id), qk.doses(id)],
  'task.changed': (id) => [qk.plan(id), qk.tasks(id)],
  'mood.recorded': (id) => [['patient', id, 'mood']],
  'note.changed': (id) => [qk.notes(id)],
  'location.updated': (id) => [qk.location(id)],
  'reminiscence.changed': (id) => [qk.resource(id, 'family'), qk.resource(id, 'memories'), qk.resource(id, 'playlist')],
  'team.changed': (id) => [qk.team(id), qk.me],
  'patient.updated': (id) => [qk.patient(id), qk.me],
  'game.completed': (id) => [qk.games(id)],
};

export type ConnectionState = 'connecting' | 'live' | 'offline';

/**
 * Subscribes to the patient's SSE stream and invalidates exactly the affected queries,
 * so a caregiver sees a new message or a missed-dose alert without refreshing.
 * EventSource reconnects on its own; we only surface the state for a status dot.
 */
export function usePatientEvents(patientId: string | undefined, onEvent?: (e: PatientEvent) => void): ConnectionState {
  const qc = useQueryClient();
  const [state, setState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    if (!patientId) return;
    const es = new EventSource(`/api/v1/patients/${patientId}/events`);
    setState('connecting');
    es.onopen = () => setState('live');
    es.onerror = () => setState(es.readyState === EventSource.CLOSED ? 'offline' : 'connecting');

    const handle = (msg: MessageEvent<string>) => {
      const event = JSON.parse(msg.data) as PatientEvent;
      for (const queryKey of INVALIDATES[event.type]?.(patientId) ?? []) void qc.invalidateQueries({ queryKey });
      onEvent?.(event);
    };
    const types = Object.keys(INVALIDATES) as PatientEventType[];
    types.forEach((t) => es.addEventListener(t, handle as EventListener));
    return () => {
      types.forEach((t) => es.removeEventListener(t, handle as EventListener));
      es.close();
    };
    // onEvent intentionally excluded: callers pass inline callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, qc]);

  return state;
}
