'use client';

import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { MedicationManager } from '@/components/features/medications/medication-manager';
import { AdherenceCard } from '@/components/features/doses/adherence-card';
import { MoodChart } from '@/components/features/mood/mood';
import { AlertsPanel } from '@/components/features/alerts/alerts-panel';
import { LocationCard } from '@/components/features/location/location';

export default function DoctorCarePage() {
  const { patient } = useActivePatient();
  return (
    <>
      <PageHeader title="Medication & vitals" description="Prescriptions, adherence, mood and safety." />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <MedicationManager patientId={patient.id} canEdit />
        <AdherenceCard patientId={patient.id} days={30} />
        <MoodChart patientId={patient.id} days={30} />
        <AlertsPanel patientId={patient.id} canAct />
        <LocationCard patientId={patient.id} canConfigure={false} />
      </div>
    </>
  );
}
