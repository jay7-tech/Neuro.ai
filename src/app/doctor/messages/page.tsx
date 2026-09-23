'use client';

import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { useMe } from '@/hooks/api';

export default function MessagesPage() {
  const { patient } = useActivePatient();
  const me = useMe();
  return (
    <>
      <PageHeader title="Messages" description={`${patient.displayName}'s care team.`} />
      <ChatPanel patientId={patient.id} meId={me.data?.user.id ?? ''} />
    </>
  );
}
