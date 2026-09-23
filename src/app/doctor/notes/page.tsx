'use client';

import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { NotesPanel } from '@/components/features/notes/notes-panel';
import { useMe } from '@/hooks/api';

export default function NotesPage() {
  const { patient } = useActivePatient();
  const me = useMe();
  return (
    <>
      <PageHeader title="Clinical notes" description={`Shared with ${patient.displayName}'s caregivers.`} />
      <NotesPanel patientId={patient.id} canWrite meId={me.data?.user.id ?? ''} />
    </>
  );
}
