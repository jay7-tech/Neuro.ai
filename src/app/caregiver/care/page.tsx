'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { QueryState } from '@/components/common/query-state';
import { MedicationManager } from '@/components/features/medications/medication-manager';
import { TaskManager } from '@/components/features/plan/day-plan';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { ReminiscenceManager } from '@/components/features/reminiscence/reminiscence';
import { PatientForm } from '@/components/features/team/patient-form';
import { NotesPanel } from '@/components/features/notes/notes-panel';
import { useMe, usePatient } from '@/hooks/api';

export default function CarePlanPage() {
  const { patient } = useActivePatient();
  const me = useMe();
  const detail = usePatient(patient.id);
  const meId = me.data?.user.id ?? '';

  return (
    <>
      <PageHeader title="Care plan" description={`Everything that shapes ${patient.displayName}'s day.`} />
      <Tabs defaultValue="meds">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="meds">Medications</TabsTrigger>
          <TabsTrigger value="routine">Routine</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="notes">Doctor&apos;s notes</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="meds" className="mt-4"><MedicationManager patientId={patient.id} canEdit /></TabsContent>
        <TabsContent value="routine" className="mt-4"><TaskManager patientId={patient.id} /></TabsContent>
        <TabsContent value="chat" className="mt-4"><ChatPanel patientId={patient.id} meId={meId} /></TabsContent>
        <TabsContent value="notes" className="mt-4"><NotesPanel patientId={patient.id} canWrite={false} meId={meId} /></TabsContent>
        <TabsContent value="family" className="mt-4"><ReminiscenceManager patientId={patient.id} kind="family" /></TabsContent>
        <TabsContent value="memories" className="mt-4"><ReminiscenceManager patientId={patient.id} kind="memories" /></TabsContent>
        <TabsContent value="music" className="mt-4"><ReminiscenceManager patientId={patient.id} kind="playlist" /></TabsContent>
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Patient profile</CardTitle></CardHeader>
            <CardContent>
              <QueryState query={detail}>
                {(p) => (
                  <PatientForm
                    patientId={p.id}
                    initial={{ displayName: p.displayName, dateOfBirth: p.dateOfBirth, address: p.address, medicalSummary: p.medicalSummary, timezone: p.timezone, bloodGroup: p.bloodGroup as never }}
                  />
                )}
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
