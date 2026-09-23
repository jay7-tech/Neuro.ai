'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type * as T from '@/lib/api-types';
import { qk } from './keys';

export { qk };

const p = (id: string) => `/patients/${id}`;

/** Standard mutation: call, then invalidate the given keys. */
function useInvalidatingMutation<TVars, TRes>(fn: (v: TVars) => Promise<TRes>, keys: (v: TVars) => QueryKey[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: (_d, _e, vars) => Promise.all(keys(vars).map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

/* --------------------------- identity --------------------------- */

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => api.get<T.Me>('/auth/me'), staleTime: 30_000 });

export const usePatient = (id: string) =>
  useQuery({ queryKey: qk.patient(id), queryFn: () => api.get<T.PatientDetail>(p(id)), enabled: !!id });

export function useCreatePatient() {
  return useInvalidatingMutation((body: Record<string, unknown>) => api.post<{ id: string }>('/patients', body), () => [qk.me]);
}

export function useUpdatePatient(id: string) {
  return useInvalidatingMutation((body: Record<string, unknown>) => api.patch(p(id), body), () => [qk.patient(id), qk.me]);
}

/* --------------------------- care team -------------------------- */

export const useTeam = (id: string) => useQuery({ queryKey: qk.team(id), queryFn: () => api.get<T.TeamMember[]>(`${p(id)}/team`) });

export const useCreateInvite = (id: string) =>
  useMutation({ mutationFn: (role: 'caregiver' | 'clinician') => api.post<T.Invite>(`${p(id)}/team/invites`, { role }) });

export function useAcceptInvite() {
  return useInvalidatingMutation((code: string) => api.post<{ patient: { id: string; displayName: string } }>('/invites/accept', { code }), () => [qk.me]);
}

export function useRemoveMember(id: string) {
  return useInvalidatingMutation((userId: string) => api.del(`${p(id)}/team/${userId}`), () => [qk.team(id), qk.me]);
}

/* -------------------------- medication -------------------------- */

export const useTodayDoses = (id: string) =>
  useQuery({ queryKey: qk.doses(id), queryFn: () => api.get<T.TodayDoses>(`${p(id)}/doses/today`), refetchInterval: 60_000 });

export const useAdherence = (id: string, days = 14) =>
  useQuery({ queryKey: qk.adherence(id, days), queryFn: () => api.get<T.Adherence>(`${p(id)}/adherence?days=${days}`) });

export const useMedications = (id: string) =>
  useQuery({ queryKey: qk.medications(id), queryFn: () => api.get<T.Medication[]>(`${p(id)}/medications`) });

export function useSaveMedication(id: string) {
  return useInvalidatingMutation(
    ({ medId, body }: { medId?: string; body: Record<string, unknown> }) =>
      medId ? api.put(`${p(id)}/medications/${medId}`, body) : api.post(`${p(id)}/medications`, body),
    () => [qk.medications(id), qk.doses(id)],
  );
}

export function useDiscontinueMedication(id: string) {
  return useInvalidatingMutation((medId: string) => api.del(`${p(id)}/medications/${medId}`), () => [qk.medications(id), qk.doses(id)]);
}

/** Optimistic: the button flips immediately; rolled back if the server rejects. */
export function useRecordDose(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { medicationId: string; scheduledFor: string; status: 'taken' | 'skipped' }) => api.post(`${p(id)}/doses`, v),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.doses(id) });
      const prev = qc.getQueryData<T.TodayDoses>(qk.doses(id));
      if (prev) {
        qc.setQueryData<T.TodayDoses>(qk.doses(id), {
          ...prev,
          doses: prev.doses.map((d) =>
            d.medicationId === v.medicationId && d.scheduledFor === v.scheduledFor
              ? { ...d, state: v.status, recordedAt: new Date().toISOString() }
              : d,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.doses(id), ctx.prev),
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: qk.doses(id) }), qc.invalidateQueries({ queryKey: ['patient', id, 'adherence'] })]),
  });
}

/* ---------------------------- tasks ----------------------------- */

export const usePlan = (id: string) => useQuery({ queryKey: qk.plan(id), queryFn: () => api.get<T.DayPlan>(`${p(id)}/plan`) });
export const useTasks = (id: string) => useQuery({ queryKey: qk.tasks(id), queryFn: () => api.get<T.Task[]>(`${p(id)}/tasks`) });

export function useSaveTask(id: string) {
  return useInvalidatingMutation(
    ({ taskId, body }: { taskId?: string; body: Record<string, unknown> }) =>
      taskId ? api.put(`${p(id)}/tasks/${taskId}`, body) : api.post(`${p(id)}/tasks`, body),
    () => [qk.tasks(id), qk.plan(id)],
  );
}

export function useDeleteTask(id: string) {
  return useInvalidatingMutation((taskId: string) => api.del(`${p(id)}/tasks/${taskId}`), () => [qk.tasks(id), qk.plan(id)]);
}

export function useCompleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { taskId: string; completed: boolean }) => api.put(`${p(id)}/tasks/${v.taskId}/completion`, { completed: v.completed }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.plan(id) });
      const prev = qc.getQueryData<T.DayPlan>(qk.plan(id));
      if (prev) qc.setQueryData<T.DayPlan>(qk.plan(id), { ...prev, items: prev.items.map((i) => (i.id === v.taskId ? { ...i, completed: v.completed } : i)) });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.plan(id), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.plan(id) }),
  });
}

/* ------------------------ wellbeing & games ---------------------- */

export const useMood = (id: string, days = 30) =>
  useQuery({ queryKey: qk.mood(id, days), queryFn: () => api.get<T.MoodAnalytics>(`${p(id)}/mood?days=${days}`) });

export function useRecordMood(id: string) {
  return useInvalidatingMutation((body: { score: number; note?: string | null }) => api.post(`${p(id)}/mood`, body), () => [['patient', id, 'mood']]);
}

export const useGameStats = (id: string) => useQuery({ queryKey: qk.games(id), queryFn: () => api.get<T.GameStats>(`${p(id)}/games?days=30`) });

export const useNextLevel = (id: string, game: string) =>
  useQuery({ queryKey: qk.nextLevel(id, game), queryFn: () => api.get<T.LevelRecommendation>(`${p(id)}/games/${game}/next`), enabled: !!id });

export function useRecordGame(id: string) {
  return useInvalidatingMutation((body: Record<string, unknown>) => api.post<T.GameResult>(`${p(id)}/games`, body), () => [qk.games(id)]);
}

/* ------------------------ clinical & chat ------------------------ */

export const useNotes = (id: string) => useQuery({ queryKey: qk.notes(id), queryFn: () => api.get<T.Note[]>(`${p(id)}/notes`) });

export function useSaveNote(id: string) {
  return useInvalidatingMutation(
    ({ noteId, body }: { noteId?: string; body: string }) => (noteId ? api.patch(`${p(id)}/notes/${noteId}`, { body }) : api.post(`${p(id)}/notes`, { body })),
    () => [qk.notes(id)],
  );
}

export function useDeleteNote(id: string) {
  return useInvalidatingMutation((noteId: string) => api.del(`${p(id)}/notes/${noteId}`), () => [qk.notes(id)]);
}

export const useMessages = (id: string) =>
  useQuery({ queryKey: qk.messages(id), queryFn: () => api.get<T.MessagePage>(`${p(id)}/messages?limit=100`) });

export function useSendMessage(id: string) {
  return useInvalidatingMutation((body: string) => api.post(`${p(id)}/messages`, { body }), () => [qk.messages(id), qk.me]);
}

export function useMarkRead(id: string) {
  return useInvalidatingMutation(() => api.post(`${p(id)}/messages/read`), () => [qk.me]);
}

export const useInsights = (id: string) => useQuery({ queryKey: qk.insights(id), queryFn: () => api.get<T.Summary>(`${p(id)}/insights`) });

/* ---------------------- alerts & location ----------------------- */

export const useAlerts = (id: string, status: 'open' | 'all' = 'open') =>
  useQuery({ queryKey: qk.alerts(id, status), queryFn: () => api.get<T.AlertItem[]>(`${p(id)}/alerts?status=${status}&limit=50`) });

export function useUpdateAlert(id: string) {
  return useInvalidatingMutation(
    ({ alertId, status }: { alertId: string; status: 'acknowledged' | 'resolved' }) => api.patch(`${p(id)}/alerts/${alertId}`, { status }),
    () => [['patient', id, 'alerts'], qk.me],
  );
}

export const useSos = (id: string) => useMutation({ mutationFn: (message?: string) => api.post<{ raised: boolean }>(`${p(id)}/sos`, { message: message ?? null }) });

export const useLocation = (id: string) => useQuery({ queryKey: qk.location(id), queryFn: () => api.get<T.LocationStatus>(`${p(id)}/location`) });

export function useReportLocation(id: string) {
  return useInvalidatingMutation((body: { lat: number; lng: number; accuracyM: number }) => api.post(`${p(id)}/location`, body), () => [qk.location(id)]);
}

export function useConfigureGeofence(id: string) {
  return useInvalidatingMutation((body: { homeLat: number; homeLng: number; radiusM: number }) => api.put(`${p(id)}/geofence`, body), () => [qk.location(id)]);
}

/* ------------------------- reminiscence ------------------------- */

type Res = 'family' | 'memories' | 'playlist';
type ResItem<R extends Res> = R extends 'family' ? T.FamilyMember : R extends 'memories' ? T.Memory : T.Track;

export const useResource = <R extends Res>(id: string, r: R) =>
  useQuery({ queryKey: qk.resource(id, r), queryFn: () => api.get<ResItem<R>[]>(`${p(id)}/${r}`) });

export function useSaveResource(id: string, r: Res) {
  return useInvalidatingMutation(
    ({ itemId, body }: { itemId?: string; body: Record<string, unknown> }) => (itemId ? api.put(`${p(id)}/${r}/${itemId}`, body) : api.post(`${p(id)}/${r}`, body)),
    () => [qk.resource(id, r)],
  );
}

export function useDeleteResource(id: string, r: Res) {
  return useInvalidatingMutation((itemId: string) => api.del(`${p(id)}/${r}/${itemId}`), () => [qk.resource(id, r)]);
}

/* ------------------------------ AI ------------------------------ */

export const useCompanion = (id: string) => useMutation({ mutationFn: (question: string) => api.post<T.CompanionReply>(`${p(id)}/companion`, { question }) });
export const useMedicineCheck = (id: string) => useMutation({ mutationFn: (photoDataUri: string) => api.post<T.MedicineCheck>(`${p(id)}/medicine-check`, { photoDataUri }) });
export const useCaregiverTip = () => useMutation({ mutationFn: (topic: string) => api.post<{ tip: string; source: string }>('/ai/caregiver-tip', { topic }) });

export const useAudit = (id: string) => useQuery({ queryKey: qk.audit(id), queryFn: () => api.get<T.AuditEntry[]>(`${p(id)}/audit?limit=100`) });
