'use client';

import { BackLink, usePatientContext } from '@/components/app/patient-shell';
import { MedicineChecker } from '@/components/features/ai/medicine-checker';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <div>
      <BackLink />
      <h1 className="text-4xl font-bold">Check a medicine</h1>
      <p className="mb-8 mt-2 text-xl text-muted-foreground">Not sure about a tablet? Take a photo.</p>
      <MedicineChecker patientId={patientId} />
    </div>
  );
}
