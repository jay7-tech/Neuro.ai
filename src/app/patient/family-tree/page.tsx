'use client';

import { BackLink, usePatientContext } from '@/components/app/patient-shell';
import { FamilyGallery } from '@/components/features/reminiscence/reminiscence';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <div>
      <BackLink />
      <h1 className="text-4xl font-bold">My family</h1>
      <p className="mb-8 mt-2 text-xl text-muted-foreground">The people who love you.</p>
      <FamilyGallery patientId={patientId} />
    </div>
  );
}
