'use client';

import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { AlertsPanel } from '@/components/features/alerts/alerts-panel';
import { LocationCard } from '@/components/features/location/location';
import { AdherenceCard } from '@/components/features/doses/adherence-card';
import { MoodChart } from '@/components/features/mood/mood';

export default function MonitoringPage() {
  const { patient } = useActivePatient();
  return (
    <>
      <PageHeader title="Monitoring" description="Alerts, safe zone, medication adherence and mood." />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <AlertsPanel patientId={patient.id} canAct />
        <LocationCard patientId={patient.id} canConfigure />
        <AdherenceCard patientId={patient.id} days={14} />
        <MoodChart patientId={patient.id} days={30} />
      </div>
    </>
  );
}
