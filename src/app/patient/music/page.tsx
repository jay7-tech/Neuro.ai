'use client';

import { BackLink, usePatientContext } from '@/components/app/patient-shell';
import { MusicPlayer } from '@/components/features/reminiscence/reminiscence';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <div>
      <BackLink />
      <h1 className="text-4xl font-bold">Music</h1>
      <p className="mb-8 mt-2 text-xl text-muted-foreground">Songs chosen for you.</p>
      <MusicPlayer patientId={patientId} />
    </div>
  );
}
